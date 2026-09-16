# Database Models & Schemas Documentation

This document describes the MongoDB collections, Mongoose schema definitions, field validation rules, and indexes.

---

## 1. Collections Overview

The database uses three core collections:
1. `subjects`: High-level exam subjects (Quantitative Aptitude, Reasoning, English, General Awareness).
2. `topics`: Specific sub-categories belonging to a subject (e.g. Profit & Loss, Analogy).
3. `questions`: Individual MCQs linked to a subject, topic, and difficulty level.

---

## 2. Subject Model (`src/models/Subject.ts`)

Represents an exam subject pillar.

### Schema Definition
```typescript
const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
```

### Indexes
- `slug`: Unique index for fast lookups.
- `order`: Ascending index for natural sorting.
- `isActive`: Filter index.

---

## 3. Topic Model (`src/models/Topic.ts`)

Represents a specific chapter or concept area under a subject.

### Schema Definition
```typescript
const topicSchema = new Schema<ITopic>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
```

### Indexes
- `{ subjectId: 1, slug: 1 }`: Compound unique index ensuring no duplicate topics per subject.
- `subjectId`: Foreign key index for fast filtering.

---

## 4. Question Model (`src/models/Question.ts`)

Represents an individual multiple-choice question.

### Schema Definition
```typescript
const questionSchema = new Schema<IQuestion>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    questionText: { type: String, required: true },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    explanation: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    questionType: {
      type: String,
      enum: ['PYQ', 'PYQ_INSPIRED', 'SAMPLE_PAPER', 'RELATED_PRACTICE'],
      default: 'PYQ_INSPIRED',
    },
    sourceType: {
      type: String,
      enum: ['OFFICIAL_PYQ', 'INTERNAL', 'REFERENCE_BOOK', 'EXAM_MEMORY'],
      default: 'INTERNAL',
    },
    qaStatus: {
      type: String,
      enum: ['DRAFT', 'REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'VERIFIED',
    },
    year: { type: Number },
    exam: { type: String },
    tier: { type: Number },
    shift: { type: String },
    source: { type: String },
    sourceUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
```

### Compound & Single Indexes
- `{ subjectId: 1, topicId: 1, difficulty: 1, isActive: 1 }`: Optimized compound index covering the aggregation `$match` query executed on practice test generation.
- `{ subjectId: 1, topicId: 1, qaStatus: 1, isActive: 1 }`: Fast retrieval of production-verified question pools.
- `subjectId: 1`
- `topicId: 1`
- `difficulty: 1`
- `isActive: 1`
- `qaStatus: 1`

---

## 5. MockTestSession Model (`src/models/MockTestSession.ts`)

Represents a stateful candidate session for full 100-question SSC CGL Tier-1 tests.

### Schema Fields
- `sessionId` (String, unique, index): Unique UUID assigned to session.
- `testType` (String): `'TIER_1'`.
- `status` (String): `'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'`.
- `currentSectionIndex` (Number): 0 (Reasoning), 1 (GA), 2 (Quant), 3 (English).
- `sections` (Array): 4 section definitions with 15-minute timers (`startedAt`, `expiresAt`, `isLocked`, `questionIds`).
- `answers` (Array): Candidate records `{ questionId, selectedAnswer, isMarkedForReview, updatedAt }`.
- `scoreSummary` (Object): Total score, +2/-0.50 breakdown, accuracy, and per-section statistics.

---

## 6. MarkedQuestion Model (`src/models/MarkedQuestion.ts`)

Stores standalone marked/bookmarked questions from Subject-Wise Practice Mode.

### Schema Fields
- `questionId` (ObjectId referencing `Question`, required, index).
- `userSelectedAnswer` (String enum: `'A' | 'B' | 'C' | 'D' | null`).
- `source` (String enum: `'PRACTICE' | 'MOCK_TEST'`, default `'PRACTICE'`).
- `isMarked` (Boolean, default: true, index).
- `timestamps`: `createdAt`, `updatedAt`.
- **Indexes**: `{ questionId: 1, isMarked: 1 }` and `{ updatedAt: -1 }`.

---

## 7. QuestionAttempt Model (`src/models/QuestionAttempt.ts`)

Records every question attempt across practice drills, mock tests, and revisions for anti-repetition lookups and performance analytics.

### Schema Fields
- `userId` (String, required, default: `'guest_default'`, index).
- `questionId` (ObjectId referencing `Question`, required, index).
- `subjectId` (ObjectId referencing `Subject`, required, index).
- `topicId` (ObjectId referencing `Topic`, required, index).
- `selectedAnswer` (String enum: `'A' | 'B' | 'C' | 'D'`, required).
- `correctAnswer` (String enum: `'A' | 'B' | 'C' | 'D'`, required).
- `isCorrect` (Boolean, required, index).
- `marks` (Number, required).
- `difficulty` (String enum: `'Easy' | 'Medium' | 'Hard'`, required, index).
- `source` (String enum: `'PRACTICE' | 'MOCK_TEST'`, required, index).
- `sessionId` (String, optional, index).
- `attemptedAt` (Date, default: Date.now, index).
- **Compound Indexes**:
  - `{ userId: 1, subjectId: 1, topicId: 1, attemptedAt: -1 }`
  - `{ userId: 1, topicId: 1, questionId: 1 }`
  - `{ userId: 1, attemptedAt: -1 }`
  - `{ userId: 1, difficulty: 1 }`
  - `{ userId: 1, sessionId: 1, questionId: 1 }`

---

## 8. QuestionRevision Model (`src/models/QuestionRevision.ts`)

Tracks spaced repetition intervals and mastery state for student mistakes.

### Schema Fields
- `userId` (String, required, index).
- `questionId` (ObjectId referencing `Question`, required, index).
- `subjectId` (ObjectId referencing `Subject`, required, index).
- `topicId` (ObjectId referencing `Topic`, required, index).
- `status` (String enum: `'DUE' | 'SCHEDULED' | 'MASTERED'`, default: `'SCHEDULED'`, index).
- `revisionLevel` (Number, 1-5, default: 1).
- `nextRevisionAt` (Date, required, index).
- `lastAttemptAt` (Date, default: Date.now).
- `totalRevisionAttempts` (Number, default: 0).
- `correctRevisionAttempts` (Number, default: 0).
- `wrongRevisionAttempts` (Number, default: 0).
- `lastRevisionCorrect` (Boolean).
- **Compound Indexes**:
  - `{ userId: 1, questionId: 1 }` (unique compound index).
  - `{ userId: 1, status: 1, nextRevisionAt: 1 }`
  - `{ userId: 1, nextRevisionAt: 1 }`
  - `{ userId: 1, topicId: 1, nextRevisionAt: 1 }`

---

## 9. DailyStudyPlan Model (`src/models/DailyStudyPlan.ts`)

Stores the canonical single daily study plan per user per day.

### Schema Fields
- `userId` (String, required, index).
- `dateKey` (String format `YYYY-MM-DD`, required, index).
- `goalQuestions` (Number, required, default: 35).
- `completedQuestions` (Number, default: 0).
- `status` (String enum: `'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'`, default: `'NOT_STARTED'`, index).
- `estimatedMinutes` (Number, default: 30).
- `items` (Subdocument Array):
  - `type` (String enum: `'REVISION' | 'WEAK_TOPIC' | 'RECOMMENDED' | 'BALANCED_PRACTICE' | 'MINI_MOCK'`).
  - `title` (String, required).
  - `subjectId`, `subjectName`, `topicId`, `topicName`, `difficulty`.
  - `questionCount` (Number, required).
  - `completedCount` (Number, default: 0).
  - `priority` (Number, default: 50).
  - `completed` (Boolean, default: false).
- **Compound Unique Index**:
  - `{ userId: 1, dateKey: 1 }` (unique constraint guarantees 1 canonical plan per day).
- **Secondary Indexes**:
  - `{ userId: 1, status: 1 }`
  - `{ dateKey: 1 }`

