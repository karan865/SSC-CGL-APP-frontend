# Backend Complete Implementation Summary — SSC CGL API Server

> **Document Type**: Single-file Master Backend Implementation Summary  
> **Target Audience**: Developers, DevOps Engineers, and AI Assistants (ChatGPT, Claude)  
> **Technology Stack**: Node.js (v25.x), Express.js (5.2.1), TypeScript (7.x), MongoDB Atlas, Mongoose (9.9.4), `tsx`

---

## 1. Overview & High-Level Architecture

The SSC CGL Practice Application backend is a lightweight, stateless RESTful API engine written in TypeScript using Express 5 and Mongoose 9 connected to MongoDB Atlas. It handles subject/topic hierarchies, test generation with customizable question quotas (5, 10, 25 questions), security projections, and stateless answer validation.

### Core Architectural Principles
1. **Stateless Test Execution**: The server maintains zero in-memory user sessions or temporary test states. A test is created dynamically via MongoDB aggregation, and answers are evaluated independently against their database records.
2. **Strict Security Projection**: Answers are never leaked. During test initialization (`POST /api/practice/start`), MongoDB's `$project` aggregation pipeline scrubs `correctAnswer` and `explanation` from the payload before Node.js serializes it.
3. **Randomized Distribution**: Questions are drawn randomly using `$sample`. In addition, options are shuffled using the Fisher-Yates algorithm so the correct choice is distributed across A, B, C, and D.
4. **Standardized Response Envelope**: Every endpoint returns an identical format:
   ```json
   {
     "success": true,
     "message": "Human readable status",
     "data": { ... }
   }
   ```

---

## 2. Directory Structure & File Map

```
backend/
├── content/                       # Content Management Vault (JSON & CSV)
│   ├── subjects.json              # Canonical exam subject definitions (4 subjects)
│   ├── topics.json                # Master syllabus topic hierarchy (40 canonical topics)
│   ├── templates/                 # Contribution templates (JSON + CSV)
│   └── questions/                 # Subject/Topic question files
│       ├── quant/                 # percentage.json, profit_loss.json, etc.
│       ├── reasoning/             # analogy.json, coding_decoding.json, etc.
│       ├── english/               # error_spotting.json, idioms_phrases.json, etc.
│       └── general_awareness/     # polity.json, history.json, etc.
├── src/
│   ├── config/
│   │   └── db.ts                  # MongoDB Atlas Mongoose connection & events
│   ├── controllers/
│   │   ├── subjectController.ts   # Handler for subjects & topics retrieval
│   │   └── practiceController.ts  # Handler for test generation & answer validation
│   ├── middlewares/
│   │   └── errorHandler.ts        # Centralized error handler & 404 router
│   ├── models/
│   │   ├── Subject.ts             # Subject schema, interface & indexes
│   │   ├── Topic.ts               # Topic schema with foreign key to Subject
│   │   └── Question.ts            # Question schema, options & compound indexes
│   ├── routes/
│   │   └── api.ts                 # Express router registering all 5 endpoints
│   ├── scripts/
│   │   └── importContent.ts       # Scalable CLI content importer engine
│   ├── services/
│   │   ├── practiceService.ts     # Aggregation pipeline & answer validation logic
│   │   ├── seed.ts                # Seeding engine & Fisher-Yates shuffle algorithm
│   │   └── questionsData.ts       # Authentic SSC CGL questions across 4 pillars
│   ├── utils/
│   │   └── apiResponse.ts         # Response formatting helper functions
│   └── server.ts                  # Express 5 bootstrap, middleware pipeline & port binding
├── dist/                          # Compiled JavaScript output (from tsc)
├── .env                           # Environment variables (PORT, MONGODB_URI, NODE_ENV)
├── tsconfig.json                  # TypeScript compiler settings
└── package.json                   # Dependencies and npm scripts
```

---

## 3. Database Architecture & Models

The database contains 3 core collections in MongoDB Atlas:

### 3.1. `Subject` Collection (`src/models/Subject.ts`)
Represents the 4 major pillars of the SSC CGL examination:
- `name` (String, required, unique): e.g. "Quantitative Aptitude"
- `code` (String, required, unique): e.g. "QUANT", "REASONING", "ENGLISH", "GA"
- `description` (String, required)
- `icon` (String): Visual identifier
- `isActive` (Boolean, default: true)
- `order` (Number, default: 0): Display priority
- **Indexes**: `{ isActive: 1, order: 1 }`

### 3.2. `Topic` Collection (`src/models/Topic.ts`)
Sub-divisions of each subject:
- `subjectId` (ObjectId referencing `Subject`, required)
- `name` (String, required): e.g. "Percentage", "Analogy", "Error Spotting"
- `description` (String)
- `isActive` (Boolean, default: true)
- `order` (Number, default: 0)
- **Indexes**: `{ subjectId: 1, isActive: 1, order: 1 }`

### 3.3. `Question` Collection (`src/models/Question.ts`)
Exam question bank items:
- `subjectId` (ObjectId referencing `Subject`, required)
- `topicId` (ObjectId referencing `Topic`, required)
- `questionText` (String, required)
- `optionA`, `optionB`, `optionC`, `optionD` (String, required)
- `correctAnswer` (String enum: `'A' | 'B' | 'C' | 'D'`, required)
- `explanation` (String, required): Step-by-step derivation
- `difficulty` (String enum: `'Easy' | 'Medium' | 'Hard'`, required)
- `year` (Number): Optional previous year tag (e.g. 2024)
- `isActive` (Boolean, default: true)
- **Indexes**: Compound index on `{ subjectId: 1, topicId: 1, difficulty: 1, isActive: 1 }` for instant aggregation filtering.

### 3.4. `MockTestSession` Collection (`src/models/MockTestSession.ts`)
Stores ongoing and completed 100-question SSC CGL Tier-1 mock test sessions:
- `sessionId` (String, unique, index): UUID assigned to candidate session.
- `testType` (String): `'TIER_1'`.
- `status` (String): `'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'`.
- `currentSectionIndex` (Number): 0 (Reasoning), 1 (GA), 2 (Quant), 3 (English).
- `sections` (Array): 4 section definitions with 15-minute timers (`startedAt`, `expiresAt`, `isLocked`, `questionIds`).
- `answers` (Array): Records `{ questionId, selectedAnswer, isMarkedForReview, updatedAt }`.
- `scoreSummary` (Object): Total score, +2/-0.50 breakdown, accuracy, and per-section statistics.

### 3.5. `MarkedQuestion` Collection (`src/models/MarkedQuestion.ts`)
Stores standalone marked / bookmarked questions from Subject-wise Practice Mode:
- `questionId` (ObjectId referencing `Question`, required, index): The target question.
- `userSelectedAnswer` (String enum: `'A' | 'B' | 'C' | 'D' | null`): Candidate's practice choice.
- `source` (String enum: `'PRACTICE' | 'MOCK_TEST'`, default `'PRACTICE'`).
- `isMarked` (Boolean, default: true, index).
- `timestamps`: Automatic `createdAt` and `updatedAt`.
- **Indexes**: Compound index on `{ questionId: 1, isMarked: 1 }` and `{ updatedAt: -1 }`.

---

## 4. API Endpoints Specification

Base URL: `http://localhost:5000/api` (or `http://127.0.0.1:5000/api`)

### 4.1. `GET /api/health`
Checks server uptime and database connectivity.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "SSC CGL Practice API is healthy",
    "data": {
      "uptime": 3421.42,
      "timestamp": "2026-09-06T00:30:00.000Z",
      "database": "connected"
    }
  }
  ```

### 4.2. `GET /api/subjects`
Fetches all active subjects ordered by their display priority.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Subjects fetched successfully",
    "data": [
      {
        "_id": "67cb2a9f4e2f8c0012345678",
        "name": "Quantitative Aptitude",
        "code": "QUANT",
        "description": "Arithmetic, Algebra, Geometry, Trigonometry, and Data Interpretation",
        "icon": "calculator",
        "order": 1
      }
    ]
  }
  ```

### 4.3. `GET /api/subjects/:subjectId/topics`
Fetches all active topics under a given subject ID.
- **Parameters**: `subjectId` (MongoDB ObjectId in path)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Topics fetched successfully",
    "data": [
      {
        "_id": "67cb2a9f4e2f8c0012345679",
        "subjectId": "67cb2a9f4e2f8c0012345678",
        "name": "Percentage",
        "description": "Calculations, base change, successive percentage",
        "order": 1
      }
    ]
  }
  ```

### 4.4. `POST /api/practice/start`
Generates a random practice test matching the chosen criteria.
- **Request Body**:
  ```json
  {
    "subjectId": "67cb2a9f4e2f8c0012345678",
    "topicId": "67cb2a9f4e2f8c0012345679",
    "difficulty": "Easy",
    "limit": 10
  }
  ```
  *(Note: `limit` is optional, defaults to 25. Supports 5, 10, 25).*
- **Security Guarantee**: MongoDB's `$project` stage strips `correctAnswer` and `explanation`.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Practice test generated successfully",
    "data": {
      "totalQuestions": 10,
      "questions": [
        {
          "_id": "67cb2b1e4e2f8c0012345680",
          "subjectId": "67cb2a9f4e2f8c0012345678",
          "topicId": "67cb2a9f4e2f8c0012345679",
          "questionText": "What is 20% of 250?",
          "optionA": "40",
          "optionB": "50",
          "optionC": "60",
          "optionD": "45",
          "difficulty": "Easy"
        }
      ]
    }
  }
  ```

### 4.5. `POST /api/practice/answer`
Statelessly evaluates the user's submitted answer and returns the explanation.
- **Request Body**:
  ```json
  {
    "questionId": "67cb2b1e4e2f8c0012345680",
    "selectedAnswer": "B"
  }
  ```
- **Evaluation Logic**:
  - Validates `selectedAnswer` is one of `['A', 'B', 'C', 'D']`.
  - Compares against stored `correctAnswer`.
  - If match: `isCorrect: true`, `marks: 1`.
  - If mismatch: `isCorrect: false`, `marks: 0`.
- **Response `200 OK` (Correct Answer)**:
  ```json
  {
    "success": true,
    "message": "Answer evaluated successfully",
    "data": {
      "isCorrect": true,
      "selectedAnswer": "B",
      "correctAnswer": "B",
      "marks": 1,
      "explanation": "20% of 250 = (20 / 100) * 250 = 50."
    }
  }
  ```
- **Response `200 OK` (Incorrect Answer)**:
  ```json
  {
    "success": true,
    "message": "Answer evaluated successfully",
    "data": {
      "isCorrect": false,
      "selectedAnswer": "A",
      "correctAnswer": "B",
      "marks": 0,
      "explanation": "20% of 250 = (20 / 100) * 250 = 50."
    }
  }
  ```

### 4.6. `POST /api/practice/mark`
Toggles marked status for any question during Subject-wise Practice Mode:
- **Request Body**:
  ```json
  {
    "questionId": "67cb2b1e4e2f8c0012345680",
    "userSelectedAnswer": "B",
    "isMarked": true
  }
  ```
- **Upsert / Unmark Logic**:
  - If `isMarked: true`, upserts into `MarkedQuestion` collection.
  - If `isMarked: false`, soft-unmarks or removes from `MarkedQuestion`.
  - Automatically merges into the unified Marked Questions Notebook.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Question marked status updated",
    "data": {
      "questionId": "67cb2b1e4e2f8c0012345680",
      "isMarked": true,
      "userSelectedAnswer": "B"
    }
  }
  ```

### 4.7. Mock Test Mode Endpoints (`/api/mock-tests`)
Stateful endpoints powering the full SSC CGL Tier-1 simulation:
- **`POST /api/mock-tests/start`**:
  Initializes a 100-question session (25 per section across Reasoning, GA, Quant, English). Generates sequential 15m sectional timers (60m total). Omit answer keys and explanations.
- **`POST /api/mock-tests/:sessionId/answer`**:
  Saves/updates selected answer (`'A' | 'B' | 'C' | 'D' | null`) and `isMarkedForReview`. Validates session state, current section, and rejects changes to locked sections. Does not reveal answers or explanations.
- **`POST /api/mock-tests/:sessionId/section-lock`**:
  Locks the expired/completed section and unlocks the next section.
- **`POST /api/mock-tests/:sessionId/submit`**:
  Finalizes session, locks all sections, and calculates official Tier-1 scoring:
  - Correct: `+2.00` marks
  - Wrong: `-0.50` marks
  - Unanswered: `0.00` marks
  - Maximum Score: `200.00` marks
  - Returns total score, accuracy, and 4-section scorecard metrics.
- **`GET /api/mock-tests/:sessionId/review`**:
  Strictly forbidden before submission (HTTP 403). Once completed, returns all 100 questions with user answers, correct answers, correctness status, and full derivations.
- **`GET /api/mock-tests/marked-questions`** (Optional query: `?sessionId=...`):
  Unified Marked Questions Notebook: returns questions marked either during Subject-wise Practice Mode (`MarkedQuestion`) or Mock Test sessions (`MockTestSession.answers.isMarkedForReview`), deduplicated by `questionId` and sorted by latest update timestamp. Allows candidates to revisit any marked questions with full derivations and options.

---

## 5. Test Generation, Shuffling & Scoring Engine

Located in `src/services/practiceService.ts`, `src/services/mockTestService.ts`, and `src/scripts/importContent.ts`:

### 5.1. Dynamic Test Generation with `$sample`
When generating a test:
```typescript
const questions = await Question.aggregate([
  { $match: matchQuery },
  { $sample: { size: limit } },
  {
    $project: {
      _id: 1,
      subjectId: 1,
      topicId: 1,
      questionText: 1,
      optionA: 1,
      optionB: 1,
      optionC: 1,
      optionD: 1,
      difficulty: 1,
      year: 1
    }
  }
]);
```
- `$sample` selects random items directly on MongoDB's server without transferring the entire collection into Node.js RAM.
- `$project` explicitly excludes `correctAnswer` and `explanation`.

### 5.2. Fisher-Yates Option Randomization & Live Bank
In standard question banks, the correct answer is frequently hardcoded to Option A. To ensure authentic exam conditions:
- During database import (`npm run import`), each question's 4 options are shuffled using the Fisher-Yates algorithm.
- The corresponding `correctAnswer` letter (`A`, `B`, `C`, or `D`) is dynamically remapped to match the option's new index.
- **Current Live Inventory in MongoDB Atlas**: **793 questions** across 45 topics:
  - Quantitative Aptitude: **412** questions
  - General Intelligence & Reasoning: **153** questions
  - General Awareness: **137** questions
  - English Comprehension: **91** questions
- **Catalog Reference**: Complete itemized inventory in [`docs/EXISTING_QUESTIONS_CATALOG.md`](./EXISTING_QUESTIONS_CATALOG.md).

### 5.3. Content Validation & Ingestion Pipeline
- `npm run validate-content`: Validates question structure, ensures exactly 4 options, validates `correctAnswerIndex`, checks subject/topic relationships and aliases, and detects duplicates.
- `npm run import`: Synchronizes canonical subjects and topics, performs safe upserts (`{ topicId, questionText, explanation }`), and tags provenance metadata (`questionType`, `sourceType`, `qaStatus`).
- `npm run content-report`: Generates topic-by-topic readiness and coverage statistics.

### 5.4. Product Separation: Scoring Invariants
1. **Practice Mode**:
   - `+1` mark per correct answer, `0` for wrong answer.
   - Strictly NO negative marking.
   - Instant answer verification and explanations returned immediately per question.
2. **Mock Test Mode**:
   - `+2.00` marks per correct answer, `-0.50` marks per wrong answer, `0` for unanswered.
   - Maximum Score: `200` marks.
   - Sectional 15-minute countdowns with auto-locking.
   - Zero answer reveals during exam. Full review unlocked post-submission.

---

## 6. How to Add New Backend Features

### Adding a New API Endpoint (e.g. Bookmark Question):
1. **Create/Update Model (if needed)**:
   Add schema definition in `src/models/Bookmark.ts`.
2. **Add Service Function in `src/services/bookmarkService.ts`**:
   ```typescript
   export const saveBookmark = async (userId: string, questionId: string) => {
     return await Bookmark.create({ userId, questionId });
   };
   ```
3. **Add Controller in `src/controllers/bookmarkController.ts`**:
   ```typescript
   export const addBookmark = async (req: Request, res: Response, next: NextFunction) => {
     try {
       const { questionId } = req.body;
       const result = await saveBookmark('guest', questionId);
       return successResponse(res, 'Question bookmarked', result, 201);
     } catch (error) {
       next(error);
     }
   };
   ```
4. **Register Route in `src/routes/api.ts`**:
   ```typescript
   router.post('/bookmarks', addBookmark);
   ```
5. **Verify**:
   Run `npm run build` to confirm zero TypeScript compilation errors.

---

## 9. Personalized Performance & Recommendation Engine

### Overview
A closed-loop learning engine:
**Practice → Record Attempt → Aggregate Performance → Detect Weak Topics → Recommend Practice → Improve → Re-track**

### Architecture & Data Models
1. **`QuestionAttempt` (`src/models/QuestionAttempt.ts`)**:
   - `userId`: Guest or authenticated user identifier (supported via `x-guest-id` header).
   - `questionId`, `subjectId`, `topicId`: References to the question taxonomy.
   - `selectedAnswer`, `correctAnswer`, `isCorrect`, `marks`: Individual question evaluation outcome.
   - `difficulty`: `Easy` | `Medium` | `Hard`.
   - `source`: `PRACTICE` | `MOCK_TEST`.
   - `sessionId`: Optional identifier for mock test session aggregation.
   - `attemptedAt`: Timestamp for recency weighting and rapid deduplication.
   - **Compound Indexes**:
     - `{ userId: 1, subjectId: 1, topicId: 1, attemptedAt: -1 }`
     - `{ userId: 1, attemptedAt: -1 }`
     - `{ userId: 1, difficulty: 1 }`
     - `{ userId: 1, sessionId: 1, questionId: 1 }`

### Core Algorithms
- **Weakness Status Classifier**:
  - `< 5 attempts`: `INSUFFICIENT_DATA` (prevents early noise from skewing student profile)
  - `< 50% accuracy`: `CRITICAL`
  - `50% - 69.99% accuracy`: `NEEDS_PRACTICE`
  - `70% - 84.99% accuracy`: `GOOD`
  - `85%+ accuracy`: `STRONG`
- **Weakness Priority Ranking Score**:
  - Formula: `(100 - accuracy) * log10(attempts + 1)`
  - Higher attempts with low accuracy are weighted significantly higher than low attempts with low accuracy.
- **Difficulty Selection Logic**:
  - `CRITICAL`: Recommends `Easy` or `Medium` depending on whether student struggles even on Easy.
  - `NEEDS_PRACTICE`: Recommends `Medium`.
  - `GOOD`: Recommends `Medium` or `Hard`.
  - `STRONG`: Recommends `Hard`.
- **Question Inventory Availability Validation**:
  - Always runs a MongoDB `countDocuments` query to ensure there are at least 5 questions in the database before making a recommendation. If the primary target difficulty has insufficient inventory, it gracefully falls back to available levels.

### API Endpoints
- `GET /api/performance`: Returns overall accuracy, subject breakdown, topic breakdown, difficulty breakdown, and weak topics list.
- `GET /api/performance/recommendations`: Returns prioritized recommended practice sessions with explanation and target question count.
- `GET /api/performance/topics/:topicId`: Returns granular metrics and difficulty breakdown for a single topic.

---

## 10. Smart Question Selection & Anti-Repetition Engine

### Overview & Philosophy
The Smart Question Selection & Anti-Repetition Engine transforms practice test generation from naive random sampling into an intelligent, student-aware selection engine.
- **Core Principle**: *"When the student asks for practice, give them fresh (unseen) questions whenever enough fresh questions are available, while gracefully falling back to previously attempted questions for revision when needed."*
- **No Permanent Exclusions**: Questions are **never** discarded permanently after an attempt. When all questions have been attempted or inventory is low, previously attempted questions are recycled for revision.
- **Multi-Attempt Idempotence**: If a student attempts Q1 multiple times, Q1 is uniquely marked as `seen` without any counting distortion.

### Architecture & Service Map
- **`src/services/questionSelectionService.ts`**:
  - `selectPracticeQuestions(params)`: Core engine validating criteria, querying attempt history, executing two-stage MongoDB sampling, shuffling results, and applying strict security stripping.
- **`src/models/QuestionAttempt.ts`**:
  - Covered compound index: `{ userId: 1, topicId: 1, questionId: 1 }` enables ultra-fast `distinct('questionId')` lookups strictly in RAM.
- **`src/services/practiceService.ts`**:
  - `generatePracticeTest(subjectId, topicId, difficulty, count, userId)` delegates to `selectPracticeQuestions`.
- **`src/controllers/practiceController.ts`**:
  - Extracts `userId` from `req.headers['x-guest-id']`, `req.body.guestId`, or `req.body.userId`, passing it to the practice generator.
  - Returns `selectionInfo` (`unseenCount`, `reviewCount`, `totalEligible`) inside response envelope.

### Selection Algorithm
```text
Student requests practice (e.g. 10 questions)
        ↓
Query distinct attempted question IDs for { userId, topicId }
        ↓
Stage 1: Sample unseen questions ($match: _id ∉ attemptedQIds, $sample: 10)
        ↓
Are unseen questions < 10?
   ├── NO  → All 10 are fresh unseen questions.
   └── YES → Calculate deficit: needed = 10 - unseen.length
             Stage 2: Sample fallback questions ($match: _id ∈ attemptedQIds, $sample: needed)
             Combine unseen + review questions
        ↓
Fisher-Yates Shuffle on the combined array
        ↓
Strict Security Projection (strip correctAnswer & explanation)
        ↓
Return questions + selectionInfo metadata
```

### Security & Integrity
- Answers (`correctAnswer`) and explanations (`explanation`) are strictly stripped before returning data to the client.
- Fisher-Yates option randomization during bank import remains preserved.
- Full 100-question Tier-1 Mock Tests are completely isolated and unaffected.

---

## 11. Smart Spaced Revision & Mistake Revision Engine

### Overview & Philosophy
The Smart Revision Engine transforms student mistakes into structured, long-term mastery using scientifically proven spaced repetition.
- **Mistake-Driven Triggers**: When a student answers incorrectly during normal practice drills or mock tests, the question is automatically enrolled as a revision candidate. Correct answers never clutter the revision queue.
- **Spaced Intervals (Levels 1 to 5)**:
  - Level 1: 1 day (24 hours)
  - Level 2: 3 days
  - Level 3: 7 days
  - Level 4: 14 days
  - Level 5: 30 days
- **Dynamic Mastery**: Answering correctly advances the level. Reaching Level 5 with a correct response transitions the status to `MASTERED`, gracefully removing the question from daily due queues while keeping it available for normal practice.
- **Mistake Penalty / Reset**: Answering a revision question incorrectly resets its interval to Level 1 (next review in 1 day), ensuring stubborn traps receive repeated reinforcement.

### Data Model & Covered Indexes (`src/models/QuestionRevision.ts`)
- Schema Fields: `userId`, `questionId`, `subjectId`, `topicId`, `status ('DUE' | 'SCHEDULED' | 'MASTERED')`, `revisionLevel (1-5)`, `nextRevisionAt`, `lastAttemptAt`, `totalRevisionAttempts`, `correctRevisionAttempts`, `wrongRevisionAttempts`, `lastRevisionCorrect`.
- Unique Index: `{ userId: 1, questionId: 1 }` (guarantees idempotent single-row tracking per user/question).
- Query Indexes:
  - `{ userId: 1, status: 1, nextRevisionAt: 1 }`
  - `{ userId: 1, nextRevisionAt: 1 }`
  - `{ userId: 1, topicId: 1, nextRevisionAt: 1 }`

### Revision API Endpoints
- `GET /api/revision`: Compact summary for home screen cards (`dueCount`, `criticalCount`, `topicCount`, `hasRevision`).
- `GET /api/revision/due`: Returns due revision questions (`nextRevisionAt <= now`) with strict security projections.
- `POST /api/revision/start`: Starts a revision drill session with custom question limits.
- `POST /api/revision/answer`: Evaluates student submission, records `QuestionAttempt`, updates spaced repetition level, and returns the full step-by-step solution.
- `GET /api/revision/stats`: Returns aggregate metrics (`dueToday`, `mastered`, `inRevision`, `totalMistakes`).

---

## 12. Daily Smart Study Plan Engine

### Overview & Philosophy
The Daily Smart Study Plan engine removes guesswork from exam preparation:
> "When a student opens the app, the app tells them exactly what to practice today and guides them sequentially through their tasks."

The system deterministically synthesizes:
```text
Due Spaced Revision (Priority 100)
+
Critical Weak Topics (Priority 90)
+
Needs-Practice Topics (Priority 75)
+
Personalized Recommendations (Priority 65)
+
Balanced Subject Coverage (Priority 50)
+
Tier-1 Mini Mock Sprint (Priority 40)
=
Today's Study Plan
```

### Data Model (`src/models/DailyStudyPlan.ts`)
- **Fields**:
  - `userId`: String (Guest ID index)
  - `dateKey`: String (`YYYY-MM-DD` index)
  - `goalQuestions`: Number (20, 35, or 50; default: 35)
  - `completedQuestions`: Number
  - `status`: `'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'`
  - `estimatedMinutes`: Number (~1.2 min per question)
  - `items`: Subdocument array:
    - `type`: `'REVISION' | 'WEAK_TOPIC' | 'RECOMMENDED' | 'BALANCED_PRACTICE' | 'MINI_MOCK'`
    - `title`: String
    - `subjectId`, `subjectName`, `topicId`, `topicName`, `difficulty`
    - `questionCount`: Number
    - `completedCount`: Number
    - `priority`: Number (deterministic score)
    - `completed`: Boolean
- **Unique Compound Index**: `{ userId: 1, dateKey: 1 }` (guarantees plan stability: 1 canonical plan per user per day).

### Dynamic Adaptive Planning Principles
1. **New User Handling (`attempts < 5`)**: Automatically serves a balanced 4-subject Starter Drill without assuming premature weaknesses.
2. **Inventory-Aware Redistribution**: Queries live MongoDB inventory before scheduling. If only 4 questions exist when 10 were requested, 4 are scheduled and the remaining 6 are redistributed to subsequent priority categories.
3. **Spaced Revision Integration**: Always prioritizes overdue and scheduled revisions first.
4. **Anti-Repetition Integration**: Normal practice items delegate to the Smart Question Selection Engine (`questionSelectionService.ts`), prioritizing unseen questions before review questions.
5. **Partial Progress & Persistence**: Completed counts increment as the user finishes drills. If the user exits the app and returns later on the same day, their progress is preserved.

### Study Plan API Endpoints
- `GET /api/study-plan/today`: Returns today's active study plan and task checklist.
- `POST /api/study-plan/generate`: Generates or rescales study plan (`goalQuestions`, `forceRegenerate`).
- `POST /api/study-plan/start`: Starts today's plan, transitioning status to `IN_PROGRESS` and returning `nextItem`.
- `POST /api/study-plan/item/:itemId/complete`: Records completion count towards a task, auto-completing the item and updating overall plan status.
- `GET /api/study-plan/progress`: Returns progress summary, remaining counts, and percentage.
- `PATCH /api/study-plan/goal`: Rescales the daily question goal (20, 35, 50).

---

## 13. Simple Study Streak & Daily Goal Engine

### Overview & Habit-Building Philosophy
The Simple Study Streak engine provides an ultra-lightweight, habit-building mechanism:
> "Student opens app → sees today's target → completes today's plan → streak increases."

### Core Principles
1. **Zero Gamification Bloat**: No XP, coins, leaderboards, levels, badges, social competition, or complex achievement trees.
2. **Single Source of Truth**: The streak system does NOT maintain an independent question counter. Daily completion is determined exclusively by the Daily Study Plan reaching `COMPLETED` status (`completedQuestions >= goalQuestions`).
3. **Study Day Definition**: A study day strictly means completing the chosen daily question quota (20, 35, or 50 questions). Merely launching the app, starting a practice session, or completing a partial goal does not count.
4. **Idempotency**: Multiple app launches or duplicate completion calls on the same day never multi-increment the streak.
5. **Local Calendar Day Keys**: Calculations use deterministic `YYYY-MM-DD` date keys rather than continuous 24-hour interval timers.

### Data Model (`src/models/StudyStreak.ts`)
- **Fields**:
  - `userId`: String (Guest ID / User identifier)
  - `currentStreak`: Number (Consecutive completed study days)
  - `longestStreak`: Number (All-time best streak record)
  - `lastCompletedDate`: String (`YYYY-MM-DD` format, null initially)
  - `totalCompletedDays`: Number (Lifetime completed study days)
  - `createdAt`: Date
  - `updatedAt`: Date
- **Indexes**:
  - `{ userId: 1 }` (Unique)

### Streak Progression Rules
- **First Completed Day**:
  - `currentStreak: 1`, `longestStreak: 1`, `totalCompletedDays: 1`, `lastCompletedDate: today`.
- **Consecutive Day Completion** (`lastCompletedDate === yesterday`):
  - `currentStreak = currentStreak + 1`
  - `longestStreak = max(longestStreak, currentStreak)`
  - `totalCompletedDays += 1`
- **Missed Day Reset** (`lastCompletedDate < yesterday`):
  - `currentStreak = 1`
  - `longestStreak` preserved
  - `totalCompletedDays += 1`
- **Same-Day Duplicate Completion** (`lastCompletedDate === today`):
  - No change to metrics; returns `todayCompleted: true`.

### Streak API Endpoints
- `GET /api/streak`: Returns current streak, longest streak, total completed days, and today's completion status.
- `POST /api/streak/complete`: Records completion of today's study goal. Automatically triggered when the Daily Study Plan completes.




