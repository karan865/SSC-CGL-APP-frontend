# Seed System & Question Bank Documentation

This document explains the question data bank, the seeding and ingestion pipeline, the Fisher-Yates randomization engine, and the production quality assurance workflow.

---

## 1. Question Bank Inventory Overview

- **Total Active Questions in MongoDB**: **793**
- **Catalog Document**: [`docs/EXISTING_QUESTIONS_CATALOG.md`](../EXISTING_QUESTIONS_CATALOG.md) (complete itemized inventory)
- **Zero-Question Topics**: **0** (all 45 topics across all 4 subjects have live questions)

### Subject Distribution

| Subject | Topics | Questions in DB | Difficulty (Easy / Med / Hard) | Production Status |
|---|---|---|---|---|
| **Quantitative Aptitude** | 16 | 412 | 200 / 144 / 68 | 🟢 Large Mock Ready |
| **General Intelligence & Reasoning** | 11 | 153 | 89 / 51 / 13 | 🟡 Practice Ready |
| **English Comprehension** | 11 | 91 | 56 / 29 / 6 | 🟡 Practice Ready |
| **General Awareness** | 7 | 137 | 89 / 41 / 7 | 🟡 Practice Ready |
| **Total** | **45** | **793** | **434 / 265 / 94** | **Production Ready** |

---

## 2. Ingestion & Content Pipeline

Content is managed in modular JSON files and ingested into MongoDB Atlas through two automated tools:

### 2.1. Automated Content Validation (`npm run validate-content`)
Before importing, all question files are scanned by `src/scripts/validateContent.ts`:
- Validates subject and topic relationships against `backend/content/subjects.json` and `backend/content/topics.json`.
- Resolves aliases (e.g. `Phy, Chem, Bio` ➔ `general_science`, `India & World` ➔ `geography`, `2D & 3D` ➔ `mensuration`).
- Validates structural requirements (exactly 4 options, non-empty text, valid `correctAnswerIndex` between 0-3, explanation >= 5 characters).
- Enforces uniqueness to prevent duplicates.

```bash
cd backend
npm run validate-content
```

### 2.2. Content Importer (`npm run import`)
The importer (`src/scripts/importContent.ts`) synchronizes canonical subjects and topics, then performs safe upserts:
- Checks questions against `{ topicId, questionText, explanation }` so valid questions are never lost or overwritten.
- Randomizes options via Fisher-Yates and calculates the new `correctAnswer` ('A' | 'B' | 'C' | 'D').
- Tags provenance metadata (`questionType`, `sourceType`, `qaStatus`).

```bash
cd backend
npm run import
```

---

## 3. Fisher-Yates Option Randomization Engine

To eliminate predictable patterns where option 'A' was frequently the correct choice, all imported questions pass through the Fisher-Yates shuffle engine before storage:

```typescript
function shuffleAndFormatOptions(options: string[], correctIdx: number) {
  const correctText = options[correctIdx];
  const allTexts = [...options];

  // Fisher-Yates shuffle
  for (let i = allTexts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = allTexts[i];
    allTexts[i] = allTexts[j];
    allTexts[j] = temp;
  }

  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const newIndex = allTexts.indexOf(correctText);
  const newCorrectAnswer = keys[newIndex] || 'A';

  return {
    optionA: allTexts[0],
    optionB: allTexts[1],
    optionC: allTexts[2],
    optionD: allTexts[3],
    correctAnswer: newCorrectAnswer,
  };
}
```

---

## 4. Question Provenance & Quality Metadata

Every question in the database includes standard provenance and QA tracking:

- **`questionType`**:
  - `PYQ`: Verifiable Previous Year Question with official exam shift details.
  - `PYQ_INSPIRED`: Modeled after authentic SSC CGL exam patterns and variations.
  - `SAMPLE_PAPER`: Model test and mock exam questions.
  - `RELATED_PRACTICE`: Conceptual drill and foundation questions.
- **`sourceType`**: `OFFICIAL_PYQ`, `INTERNAL`, `REFERENCE_BOOK`, `EXAM_MEMORY`.
- **`qaStatus`**: `DRAFT`, `REVIEW`, `VERIFIED`, `REJECTED`.
- **Exam Meta**: `year`, `exam`, `tier`, `shift`.
