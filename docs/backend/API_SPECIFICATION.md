# Backend API Specifications

This document defines all HTTP REST endpoints exposed by the backend service.

**Base URL**: `http://localhost:5000/api` (or `http://<HOST_IP>:5000/api`)

---

## 1. Health Check

### `GET /api/health`
Verifies backend process status and database connectivity.

- **Request**: No headers or parameters required.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "SSC CGL API is running",
    "data": {}
  }
  ```

---

## 2. Subjects

### `GET /api/subjects`
Fetches all active subjects ordered by syllabus hierarchy (`order` ascending).

- **Request**: No parameters required.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Subjects fetched successfully",
    "data": [
      {
        "_id": "6a948157a153bbfaa28534bd",
        "name": "Quantitative Aptitude",
        "slug": "quantitative-aptitude",
        "order": 1,
        "isActive": true,
        "createdAt": "2026-09-05T10:00:00.000Z",
        "updatedAt": "2026-09-05T10:00:00.000Z"
      }
    ]
  }
  ```

---

## 3. Topics

### `GET /api/subjects/:subjectId/topics`
Fetches active topics belonging to a specified subject.

- **URL Parameters**:
  - `subjectId` (string, required): Valid 24-character hex MongoDB ObjectId.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Topics fetched successfully",
    "data": [
      {
        "_id": "6a948159a153bbfaa28534c9",
        "subjectId": "6a948157a153bbfaa28534bd",
        "name": "Percentage",
        "slug": "percentage",
        "order": 1,
        "isActive": true
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "Invalid subject ID format" }`
  - `404 Not Found`: `{ "success": false, "message": "Subject not found or is inactive" }`

---

## 4. Practice Test Generation

### `POST /api/practice/start`
Generates a practice test session with randomized questions.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "subjectId": "6a948157a153bbfaa28534bd",
    "topicId": "6a948159a153bbfaa28534c9",
    "difficulty": "Easy",
    "count": 5
  }
  ```
  - `subjectId` (string, required): MongoDB ObjectId of the subject.
  - `topicId` (string, required): MongoDB ObjectId of the topic.
  - `difficulty` (string, required): Enum: `"Easy"` | `"Medium"` | `"Hard"`.
  - `count` (number, optional): Number of questions to sample (e.g. 5, 10, or 25). Defaults to 25.

- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Practice test started successfully",
    "data": {
      "totalQuestions": 5,
      "questions": [
        {
          "_id": "67cb1a4b1234567890abcdef",
          "subjectId": "6a948157a153bbfaa28534bd",
          "topicId": "6a948159a153bbfaa28534c9",
          "questionText": "What is 10% of 100?",
          "optionA": "20",
          "optionB": "10",
          "optionC": "30",
          "optionD": "5",
          "difficulty": "Easy"
        }
      ]
    }
  }
  ```
  *(Note: `correctAnswer` and `explanation` are strictly stripped from this payload).*

- **Error Responses**:
  - `400 Bad Request` (Not enough questions):
    ```json
    {
      "success": false,
      "message": "Not enough questions available for this test.",
      "errors": [
        { "available": 3, "required": 5 }
      ]
    }
    ```
  - `400 Bad Request` (Invalid input): Missing fields or invalid difficulty enum.
  - `404 Not Found`: Subject or topic not found.

---

## 5. Answer Evaluation

### `POST /api/practice/answer`
Statelessly evaluates a user's chosen answer for a specific question.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "questionId": "67cb1a4b1234567890abcdef",
    "selectedAnswer": "B"
  }
  ```
  - `questionId` (string, required): MongoDB ObjectId of the question.
  - `selectedAnswer` (string, required): Enum: `"A"` | `"B"` | `"C"` | `"D"`.

- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Answer evaluated successfully",
    "data": {
      "isCorrect": true,
      "selectedAnswer": "B",
      "correctAnswer": "B",
      "marks": 1,
      "explanation": "10% of 100 is calculated as (10/100) * 100 = 10"
    }
  }
  ```
  *(Note: If `selectedAnswer !== correctAnswer`, `isCorrect: false`, `marks: 0`, and the explanation is still provided).*

- **Error Responses**:
  - `400 Bad Request`: Missing questionId/selectedAnswer or invalid option choice.
  - `404 Not Found`: Question not found or inactive.

---

## 6. Question Marking / Bookmarking

### `POST /api/practice/mark`
Toggles bookmark status for any question during Subject-Wise Practice Mode and updates the unified Marked Questions Notebook.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "questionId": "67cb1a4b1234567890abcdef",
    "userSelectedAnswer": "B",
    "isMarked": true
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Question marked status updated",
    "data": {
      "questionId": "67cb1a4b1234567890abcdef",
      "isMarked": true,
      "userSelectedAnswer": "B"
    }
  }
  ```

---

## 7. Mock Test Mode Endpoints (`/api/mock-tests`)

Stateful simulation engine for full SSC CGL Tier-1 exams (100 Qs • 60 mins).

### `POST /api/mock-tests/start`
Initializes a new 100-question session (25 per section across Reasoning, General Awareness, Quant, English) with 15-minute section timers. Answer keys and explanations are scrubbed.

- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Mock test initialized successfully",
    "data": {
      "sessionId": "b8f04123-5e92-4f96-857e-e5d321041cb1",
      "testType": "TIER_1",
      "totalQuestions": 100,
      "totalDurationMinutes": 60,
      "currentSectionIndex": 0,
      "sections": [ ... ],
      "questions": [ ... ]
    }
  }
  ```

### `POST /api/mock-tests/:sessionId/answer`
Saves/updates selected answer (`'A' | 'B' | 'C' | 'D' | null`) and `isMarkedForReview`. Validates session state, current section, and rejects changes to locked sections. Zero answers or explanations are returned.

### `POST /api/mock-tests/:sessionId/section-lock`
Locks the expired/completed section and unlocks the next section.

### `POST /api/mock-tests/:sessionId/submit`
Finalizes session, locks all sections, and calculates official Tier-1 scoring:
- Correct: `+2.00` marks
- Wrong: `-0.50` marks
- Unanswered: `0.00` marks
- Maximum Score: `200.00` marks

### `GET /api/mock-tests/:sessionId/review`
Strictly forbidden before submission (HTTP 403). Once submitted, returns all 100 questions with user selection vs correct answer, correctness status, marks awarded, and step-by-step solutions.

### `GET /api/mock-tests/marked-questions`
- **Optional Query**: `?sessionId=...`
- **Unified Marked Questions Notebook**: Combines questions marked in practice mode with mock test marked questions, deduplicated by `questionId` and sorted by latest update timestamp. Fully accessible for revision on the mobile landing page.

---

## 8. Performance & Recommendations Endpoints (`/api/performance`)

Tracks user attempts, generates performance summaries, detects weak topics, and returns recommendations.

### `GET /api/performance/summary`
Returns overall accuracy, total attempts, breakdown by difficulty, subject summaries, and ranked topic mastery badges.

### `GET /api/performance/weak-topics`
Returns list of weak topics filtered and sorted by priority (`CRITICAL`, `NEEDS_PRACTICE`).

### `GET /api/performance/recommendations`
Returns top 1-tap personalized practice recommendation validated against live question inventory.

### `GET /api/performance/topic/:topicId`
Returns granular metric for a single topic (accuracy, attempts, correctness, status).

---

## 9. Spaced Revision Endpoints (`/api/revision`)

Powers the spaced repetition and mistake revision learning loop.

### `GET /api/revision`
Returns compact revision summary for home screen cards (`dueCount`, `criticalCount`, `topicCount`, `hasRevision`).

### `GET /api/revision/due`
Returns due revision questions (`nextRevisionAt <= now`) with strict security projections.

### `POST /api/revision/start`
Starts a revision drill session with custom limit (`limit`).

### `POST /api/revision/answer`
Evaluates submission, updates spaced interval (Levels 1-5 or MASTERED), and returns full step-by-step solution.

### `GET /api/revision/stats`
Returns aggregate metrics (`dueToday`, `mastered`, `inRevision`, `totalMistakes`).

---

## 10. Daily Smart Study Plan Endpoints (`/api/study-plan`)

Generates and tracks daily study roadmaps combining revision, weak topics, recommendations, balanced practice, and mini-mocks.

### `GET /api/study-plan/today`
Returns today's active study plan, progress stats, and task checklist. Auto-generates starter or personalized plan if first visit.

### `POST /api/study-plan/generate`
Generates or rescales study plan.
- **Body**: `{ "goalQuestions": 20 | 35 | 50, "forceRegenerate": boolean }`

### `POST /api/study-plan/start`
Marks plan as `IN_PROGRESS` and returns the `nextItem` to practice.

### `POST /api/study-plan/item/:itemId/complete`
Records completed questions towards an item. Automatically marks item completed when target reached and updates overall plan status.
- **Body**: `{ "answeredCount": number }`

### `GET /api/study-plan/progress`
Lightweight summary of today's plan progress (`completedQuestions`, `remainingQuestions`, `progressPercent`, `status`).

### `PATCH /api/study-plan/goal`
Updates the daily questions goal target (`20`, `35`, `50`).
- **Body**: `{ "goalQuestions": 20 | 35 | 50 }`


