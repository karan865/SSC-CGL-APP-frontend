# Developer Guide: Adding Backend Features

This step-by-step tutorial explains how to add new endpoints, models, services, and question sets to the backend.

---

## 1. How to Add a New Database Model

### Step 1: Create the Model File
In `backend/src/models/`, create a new file (e.g. `Bookmark.ts`):

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmark extends Document {
  questionId: mongoose.Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    note: { type: String },
  },
  { timestamps: true }
);

export const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
```

---

## 2. How to Add a New Service & Controller

### Step 1: Create the Service Function
In `backend/src/services/` (e.g. `bookmarkService.ts`):

```typescript
import { Bookmark } from '../models/Bookmark';

export const saveBookmark = async (questionId: string, note?: string) => {
  return Bookmark.create({ questionId, note });
};

export const getBookmarks = async () => {
  return Bookmark.find({}).populate('questionId').sort({ createdAt: -1 });
};
```

### Step 2: Create the Controller Function
In `backend/src/controllers/` (e.g. `bookmarkController.ts`):

```typescript
import { Request, Response, NextFunction } from 'express';
import { saveBookmark, getBookmarks } from '../services/bookmarkService';
import { successResponse, errorResponse } from '../utils/apiResponse';

export const handleSaveBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { questionId, note } = req.body;
    if (!questionId) {
      res.status(400).json(errorResponse('questionId is required'));
      return;
    }
    const bookmark = await saveBookmark(questionId, note);
    res.status(201).json(successResponse('Bookmark saved successfully', bookmark));
  } catch (error) {
    next(error);
  }
};
```

---

## 3. How to Register the Route in Express

### Step 1: Create the Route File
In `backend/src/routes/` (e.g. `bookmarkRoutes.ts`):

```typescript
import { Router } from 'express';
import { handleSaveBookmark } from '../controllers/bookmarkController';

const router = Router();
router.post('/', handleSaveBookmark);

export default router;
```

### Step 2: Mount in `backend/src/routes/index.ts` or `app.ts`
```typescript
import bookmarkRoutes from './routes/bookmarkRoutes';

app.use('/api/bookmarks', bookmarkRoutes);
```

---

## 4. How to Seed New Questions

To add more questions to any topic:
1. Open [`backend/src/services/questionsData.ts`](../../backend/src/services/questionsData.ts).
2. Append new questions adhering to the `QuestionData` interface:
   ```typescript
   {
     questionText: 'Your question text here?',
     optionA: 'Option A',
     optionB: 'Option B',
     optionC: 'Option C',
     optionD: 'Option D',
     correctAnswer: 'A', // The seeder will automatically shuffle options!
     explanation: 'Detailed explanation here.',
     difficulty: 'Easy' // or 'Medium' or 'Hard'
   }
   ```
3. Run the seed script:
   ```bash
   cd backend && npm run seed
   ```
   The Fisher-Yates shuffler will automatically randomize the options across A, B, C, D and insert them.
