# SSC CGL Question Practice Application - Comprehensive Project Documentation

> **Document Purpose**: This comprehensive document provides an end-to-end technical overview of the SSC CGL Question Practice Application. It details all implemented functionality, system architecture, database design, backend API engineering, and React Native frontend development. Use this document as the single source of truth for technical discussions, AI code assistance (e.g., ChatGPT), or onboarding new developers.

---

## 1. Executive Summary & Product Purpose
The **SSC CGL Practice Application** is a specialized exam-preparation mobile platform engineered for aspirants preparing for the Staff Selection Commission Combined Graduate Level (SSC CGL) Tier-1 and Tier-2 examinations.

### Core Philosophy
- **Frictionless Practice**: No mandatory login, password, or account setup required for V1 MVP.
- **Strict Exam Alignment**: Questions adhere to the 4 official pillars: Quantitative Aptitude, General Intelligence & Reasoning, English Comprehension, and General Awareness.
- **Immediate Learning Loop**: Answers are evaluated instantly upon selection with detailed step-by-step explanations, eliminating the delay of post-exam review.
- **Security-First Architecture**: Correct answers and explanations are never sent to the client upfront; they are validated statelessly on the backend.

---

## 2. Complete Technical Stack

| Layer | Technologies Used |
|---|---|
| **Mobile Client** | React Native 0.87.1, React 19.2.3, TypeScript 6.x |
| **Mobile Navigation** | `@react-navigation/native` v7, `@react-navigation/native-stack` v7 |
| **Mobile Safe Area** | `react-native-safe-area-context` |
| **Backend API** | Node.js v25.x, Express.js 5.x, TypeScript 7.x, `tsx` |
| **Database** | MongoDB Atlas (Multi-node Replica Set), Mongoose 9.x |
| **Security & Middleware** | Helmet, CORS, Express Rate Limit, AbortController |
| **Testing** | Jest 29.x, `react-test-renderer` |

---

## 3. Implemented Features & Functionality

### 3.1 Backend Functionality
1. **Health Check API** (`GET /api/health`): Monitors backend and server readiness.
2. **Subject Hierarchy API** (`GET /api/subjects`): Fetches all active subjects ordered by syllabus hierarchy.
3. **Topic Retrieval API** (`GET /api/subjects/:subjectId/topics`): Returns active topics filtered by subject with validation.
4. **Secure Practice Test Generation** (`POST /api/practice/start`):
   - Accepts `subjectId`, `topicId`, `difficulty`, and optional `count` (5, 10, or 25 questions).
   - Validates question availability against MongoDB.
   - Utilizes MongoDB `$sample` aggregation to randomly select questions without memory bloat.
   - **Security Projection**: Employs `$project` to completely omit `correctAnswer` and `explanation` from the payload to prevent client-side answer sniffing.
5. **Stateless Answer Evaluation** (`POST /api/practice/answer`):
   - Receives `questionId` and `selectedAnswer` ('A' | 'B' | 'C' | 'D').
   - Compares the choice against `correctAnswer` in the database.
   - Returns `{ isCorrect, selectedAnswer, correctAnswer, marks (1 or 0), explanation }`.
6. **Randomized Option Permutation Engine (Fisher-Yates)**:
   - Eliminates the "Option A is always correct" defect by randomizing `optionA`, `optionB`, `optionC`, and `optionD` during database seeding.
   - Maintains an even 25% distribution across all 4 option slots.
7. **Authentic Question Bank**:
   - Seeded with hundreds of real SSC CGL previous year questions across all 4 subjects.

### 3.2 Frontend Mobile Functionality
1. **Modern Branding Splash Screen** (`SplashScreen.tsx`):
   - Dark slate theme (`#0f172a`), badge emblem, and smooth auto-navigation.
2. **Ed-Tech Landing Page** (`SubjectsScreen.tsx`):
   - Dark Navy Hero Card with TARGET 2026 badge and "Start Rapid Practice" quick CTA.
   - Metric Ribbon highlighting 5-25 Qs tests, instant explanations, and full syllabus coverage.
   - Interactive subject modules with distinct color accents, icons, and syllabus tags.
   - Exam pacing tip card.
   - Native pull-to-refresh (`RefreshControl`).
   - Bulletproof Android scrolling with `flexGrow: 1` and `nestedScrollEnabled`.
3. **Curated Topic Explorer** (`TopicsScreen.tsx`):
   - Displays topics for the chosen subject with module index numbers.
4. **Interactive Difficulty & Test Size Selector** (`DifficultyScreen.tsx`):
   - Choose between **5 Questions (Quick Sprint)**, **10 Questions (Standard Test)**, or **25 Questions (Full Mock)**.
   - Select difficulty tier: **Easy 🟢**, **Medium 🟡**, or **Hard 🔴**.
5. **Live Interactive Test Runner** (`PracticeScreen.tsx`):
   - Real-time progress bar and `Question X of Y` counter.
   - Options A, B, C, D with instant tap interaction.
   - Single-answer locking preventing duplicate submissions.
   - Immediate color feedback:
     - **Selected Correct**: Turns **Emerald Green** with `✓ Correct (+1)`.
     - **Selected Wrong**: Turns **Crimson Red** with `✗ Incorrect`, while the actual correct option is highlighted in **Green** so the student learns immediately.
   - Instant expandable solution card with step-by-step mathematical/grammatical logic.
   - Smooth navigation to the next question.
6. **Detailed Score & Analytics Screen** (`ResultScreen.tsx`):
   - Large score indicator (`X / Y Marks`) and accuracy badge (`Z% Accuracy`).
   - Dynamic motivational feedback based on score percentage.
   - 4-tile performance grid: Total Questions, Correct Answers, Incorrect Answers, Final Marks.
   - Action buttons to retake or choose a new topic.
7. **Resilient Multi-Transport Networking** (`apiClient.ts` + `config.ts`):
   - Auto-discovers backend across USB Reverse Tunnel (`127.0.0.1:5000`), Wi-Fi LAN (`10.39.170.191:5000`), and Android Emulator (`10.0.2.2:5000`).
   - Automatically probes and switches to the active host if network conditions change.

---

## 4. How We Achieved It: Architecture & Technical Details

### 4.1 System Architecture Diagram
```
                     +----------------------------------+
                     |   React Native Mobile Client     |
                     +----------------------------------+
                                      |
                         [Typed Stack Navigation]
      Splash -> Subjects (Landing) -> Topics -> Difficulty -> Practice -> Result
                                      |
                            [API Service Layer]
              apiClient.ts (Auto-Discovery + Abort Controller)
                    |                          |
              subjectApi.ts              practiceApi.ts
                     \                        /
             HTTP JSON (USB Reverse / LAN Wi-Fi / Emulator)
                                      |
                     +----------------------------------+
                     |    Node.js / Express Backend     |
                     |         Port 5000 / API          |
                     +----------------------------------+
                               /      |      \
                  subjectRoutes  topicRoutes  practiceRoutes
                               \      |      /
                              practiceService.ts
                                      |
                            [Mongoose / MongoDB]
                         Subjects, Topics, Questions
```

### 4.2 Database Schema Architecture

#### Subject Model (`backend/src/models/Subject.ts`)
```typescript
interface ISubject {
  name: string;        // e.g. "Quantitative Aptitude"
  slug: string;        // e.g. "quantitative-aptitude"
  order: number;       // Display sorting
  isActive: boolean;   // Soft deletion / availability toggle
}
```

#### Topic Model (`backend/src/models/Topic.ts`)
```typescript
interface ITopic {
  subjectId: ObjectId; // Ref: Subject
  name: string;        // e.g. "Profit & Loss"
  slug: string;        // e.g. "profit-and-loss"
  order: number;
  isActive: boolean;
}
```

#### Question Model (`backend/src/models/Question.ts`)
```typescript
interface IQuestion {
  subjectId: ObjectId;
  topicId: ObjectId;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isActive: boolean;
}
```

### 4.3 Backend Security Logic (Aggregation Pipeline)
In `backend/src/services/practiceService.ts`, when a client initiates a test via `/api/practice/start`, questions are queried using:
```typescript
const questions = await Question.aggregate([
  { $match: { subjectId, topicId, difficulty, isActive: true } },
  { $sample: { size: targetCount } },
  { $project: {
      correctAnswer: 0,
      explanation: 0,
      __v: 0,
      isActive: 0,
      createdAt: 0,
      updatedAt: 0
  }}
]);
```
- `$sample`: Shuffles and picks random documents efficiently on the database cluster.
- `$project`: Strips `correctAnswer` and `explanation` before Node.js serializes JSON, eliminating accidental cheating.

### 4.4 Option Shuffling Engine (Fisher-Yates)
To ensure option 'A' is not always the correct answer, `backend/src/services/seed.ts` implements:
```typescript
function shuffleQuestionOptions(q) {
  const correctText = q[q.correctAnswer];
  const allTexts = [q.optionA, q.optionB, q.optionC, q.optionD];
  for (let i = allTexts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTexts[i], allTexts[j]] = [allTexts[j], allTexts[i]];
  }
  const keys = ['A', 'B', 'C', 'D'];
  const newIndex = allTexts.indexOf(correctText);
  return {
    ...q,
    optionA: allTexts[0],
    optionB: allTexts[1],
    optionC: allTexts[2],
    optionD: allTexts[3],
    correctAnswer: keys[newIndex],
  };
}
```

### 4.5 Mobile Networking Auto-Discovery
To ensure physical Android phones, emulators, and local machines work without changing URLs:
```typescript
export const API_CANDIDATE_URLS = [
  'http://127.0.0.1:5000/api',          // USB reverse tunnel via adb reverse
  'http://localhost:5000/api',          // iOS simulator / local host
  'http://10.39.170.191:5000/api',      // Wi-Fi LAN IP for untethered physical phone
  'http://10.0.2.2:5000/api',           // Android Emulator virtual bridge
];
```
`apiClient.ts` probes `/health` across candidates with a fast 2-second timeout and locks onto the first working host.

---

## 5. API Endpoint Specifications

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  { "success": true, "message": "SSC CGL API is running", "data": {} }
  ```

### 2. Get Subjects
- **Endpoint**: `GET /api/subjects`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Subjects fetched successfully",
    "data": [
      { "_id": "...", "name": "Quantitative Aptitude", "slug": "quantitative-aptitude", "order": 1 }
    ]
  }
  ```

### 3. Get Topics by Subject
- **Endpoint**: `GET /api/subjects/:subjectId/topics`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Topics fetched successfully",
    "data": [
      { "_id": "...", "subjectId": "...", "name": "Profit & Loss", "slug": "profit-and-loss" }
    ]
  }
  ```

### 4. Start Practice Test
- **Endpoint**: `POST /api/practice/start`
- **Request Body**:
  ```json
  {
    "subjectId": "6a948157a153bbfaa28534bd",
    "topicId": "6a948158a153bbfaa28534be",
    "difficulty": "Easy",
    "count": 5
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Practice test started successfully",
    "data": {
      "totalQuestions": 5,
      "questions": [
        {
          "_id": "67cb1a...",
          "subjectId": "...",
          "topicId": "...",
          "questionText": "If the selling price is double the cost price, the profit percentage is:",
          "optionA": "200%",
          "optionB": "100%",
          "optionC": "50%",
          "optionD": "150%",
          "difficulty": "Easy"
        }
      ]
    }
  }
  ```

### 5. Submit Answer
- **Endpoint**: `POST /api/practice/answer`
- **Request Body**:
  ```json
  {
    "questionId": "67cb1a...",
    "selectedAnswer": "B"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Answer evaluated successfully",
    "data": {
      "isCorrect": true,
      "selectedAnswer": "B",
      "correctAnswer": "B",
      "marks": 1,
      "explanation": "Let CP = 100, then SP = 200. Profit = 100. Profit % = (100/100)*100 = 100%."
    }
  }
  ```

---

## 6. How to Run & Verify

### Running Backend:
```bash
cd backend
npm install
npm run seed       # Seeds subjects, topics, and randomized questions
npm run dev        # Starts server on http://localhost:5000
```

### Running Mobile on Android (Physical Device or Emulator):
```bash
# 1. Reverse port 5000 (if testing over USB on physical device)
adb reverse tcp:5000 tcp:5000
adb reverse tcp:8081 tcp:8081

# 2. Start Metro bundler
cd mobile
npm start

# 3. In another terminal, run app
cd mobile
npm run android
```

### Running Verification Test Suite:
```bash
# Run backend TypeScript build verification:
cd backend && npm run build

# Run mobile TypeScript check and Jest test suite:
cd mobile && npx tsc --noEmit && npm test
```
Result: **12 passing Jest tests, 0 TypeScript errors.**
