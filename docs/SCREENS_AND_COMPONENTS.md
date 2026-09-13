# Screens & Reusable Components Documentation

This document describes each screen and reusable component within the mobile application.

---

## 1. Screens Breakdown

### 1.1 SplashScreen (`src/screens/SplashScreen.tsx`)
- **Route**: `Splash`
- **Params**: `undefined`
- **Role**: Initial launch presentation.
- **UI Elements**:
  - Dark slate theme (`#0f172a`).
  - Target emblem (`🎯`).
  - Application title & "Tier 1 & Tier 2 Practice Engine" subtitle.
  - ActivityIndicator spinner with "Preparing Question Bank..." message.
- **Behavior**: Auto-navigates to `Subjects` via `navigation.replace('Subjects')` after a 1.5-second delay.

---

### 1.2 SubjectsScreen (`src/screens/SubjectsScreen.tsx`) - Modern Landing Page
- **Route**: `Subjects`
- **Params**: `undefined`
- **Role**: The central landing dashboard and subject selector.
- **Key Sections**:
  1. **Hero Banner**: Dark navy gradient card with `TARGET 2026` badge, live server readiness indicator (`READY`), and a `"Start Rapid Practice ➔"` CTA.
  2. **Metrics Ribbon**: Highlighting `5-25 Qs Custom Sets`, `Instant Explanations`, and `4 Pillars Full Syllabus`.
  3. **Subject Module Cards**: Fetched dynamically from `GET /api/subjects`.
     - *Quantitative Aptitude* (`#2563eb`, 📐 Math icon)
     - *General Intelligence & Reasoning* (`#7c3aed`, 🧠 Brain icon)
     - *English Comprehension* (`#059669`, 📖 Book icon)
     - *General Awareness* (`#d97706`, 🌍 Globe icon)
  4. **Strategy Card**: Pacing advice reminding students of the 60-minute limit for 100 questions.
  5. **Pull-to-Refresh**: Native `RefreshControl` allows pulling down to re-fetch subjects from MongoDB.
- **Interactions**: Tapping a subject card navigates to `TopicsScreen` with `{ subjectId, subjectName }`.

---

### 1.3 TopicsScreen (`src/screens/TopicsScreen.tsx`)
- **Route**: `Topics`
- **Params**: `{ subjectId: string; subjectName: string }`
- **Role**: Curated topic selector for the chosen subject.
- **UI Elements**:
  - Top header banner displaying the active subject name.
  - Numbered topic cards (e.g. `01`, `02`) with rules badge (`Custom Sets (5-25 Qs)`).
  - Empty state fallback if no topics exist.
- **Interactions**: Tapping a topic navigates to `DifficultyScreen` with `{ subjectId, topicId, topicName }`.

---

### 1.4 DifficultyScreen (`src/screens/DifficultyScreen.tsx`)
- **Route**: `Difficulty`
- **Params**: `{ subjectId: string; topicId: string; topicName: string }`
- **Role**: Configures session parameters (question count + difficulty).
- **Features**:
  1. **Test Length Selector**:
     - `5 Qs` (Quick Sprint)
     - `10 Qs` (Standard Practice)
     - `25 Qs` (Full Exam Mock)
  2. **Difficulty Tier Cards**:
     - `Easy Level` 🟢 (Foundation & speed drills)
     - `Medium Level` 🟡 (Standard SSC CGL Tier-1 difficulty)
     - `Hard Level` 🔴 (Advanced Tier-2 challenge)
- **Interactions**: Tapping a tier button starts the test and navigates to `PracticeScreen` with `{ subjectId, topicId, topicName, difficulty, questionCount }`.

---

### 1.5 PracticeScreen (`src/screens/PracticeScreen.tsx`) - Interactive Test Player
- **Route**: `Practice`
- **Params**: `{ subjectId: string; topicId: string; topicName: string; difficulty: Difficulty; questionCount?: number }`
- **Role**: Live question presentation, answer submission, and feedback.
- **Key State Variables**:
  - `questions`: Array of questions from backend.
  - `currentIndex`: Active question index (0-indexed).
  - `selectedOption`: Student's chosen option ('A' | 'B' | 'C' | 'D').
  - `answerResult`: Evaluated result from `/api/practice/answer`.
  - `correctCount` / `wrongCount`: Session score tracking.
- **Key Interactions**:
  1. **Option Tap**: Invokes `practiceApi.answerQuestion()`.
  2. **Option Locking**: Immediate disabling prevents multiple answer attempts.
  3. **Visual Feedback**:
     - Correct choice highlights in **Emerald Green** with `✓ Correct (+1)`.
     - Incorrect choice highlights in **Crimson Red** with `✗ Incorrect`, and the correct option highlights in **Green**.
  4. **Detailed Solution**: Shows step-by-step mathematical/grammatical logic.
  5. **Next Question**: Moves to next question or navigates to `ResultScreen` on final question.

---

### 1.5 PracticeScreen (`src/screens/PracticeScreen.tsx`) - Interactive Test Runner
- **Route**: `Practice`
- **Params**: `{ subjectId: string; topicId: string; topicName: string; difficulty: Difficulty; questionCount?: number }`
- **Role**: Single-question interactive drill with instant feedback.
- **Features**:
  - Horizontal progress bar and question counter.
  - Question card with inline **`🔖 Mark` / `✓ Marked`** toggle syncing with backend `POST /api/practice/mark`.
  - Option selection with immediate Green/Red highlighting.
  - Step-by-step solution derivation card.
  - Next Question / View Results progression.

---

### 1.6 ResultScreen (`src/screens/ResultScreen.tsx`) - Analytics & Summary
- **Route**: `Result`
- **Params**: `TestResultData`
  - `totalQuestions`, `correctCount`, `wrongCount`, `marks`, `accuracy`, `topicName`, `difficulty`
- **Role**: Displays comprehensive test analytics.
- **UI Elements**:
  - Trophy emblem (`🏆`) with topic and difficulty badges.
  - Score Card: Big score display (`X / Y`), accuracy badge (`Z% Accuracy`).
  - Dynamic Feedback Box: Tailored motivational text based on accuracy percentage (>=80%, >=50%, <50%).
  - 4 Metric Breakdown Tiles: Total, Correct, Incorrect, Marks.
  - Action Buttons: "Practice Another Subject" or "Back to Difficulty".

---

### 1.7 MockInstructionsScreen (`src/screens/MockInstructionsScreen.tsx`)
- **Route**: `MockInstructions`
- **Role**: Official SSC CGL Tier-1 guidelines presentation before starting.
- **UI Elements**:
  - Exam specifications (100 Questions, 60 Minutes, 200 Max Marks).
  - 4 Sectional timing breakdowns (15 mins each).
  - Official marking rules (+2.00 correct, -0.50 negative marking).
  - Prominent "I am ready to begin" CTA button.

---

### 1.8 MockTestScreen (`src/screens/MockTestScreen.tsx`)
- **Route**: `MockTest`
- **Role**: Stateful 100-question exam simulation.
- **Features**:
  - Top header with dynamic notch safety insets, section name, and live 15:00 countdown timer.
  - 5x5 Question Palette modal (1..25) displaying color-coded statuses (Answered, Marked, Unanswered).
  - "Clear Response" and "🔖 Mark" / "✓ Marked" actions.
  - Automatic section advancement and locking when 15-minute timer reaches 00:00.
  - Hardware back-button confirmation dialog preventing accidental test termination.

---

### 1.9 MockResultScreen (`src/screens/MockResultScreen.tsx`)
- **Route**: `MockResult`
- **Role**: Official Tier-1 examination scorecard.
- **Features**:
  - Official score out of 200 marks, accuracy percentage, and total attempted breakdown.
  - 4 Section performance progress bars (Reasoning, GA, Quant, English).
  - Launch button for Detailed Post-Exam Question Solutions (`MockReview`).

---

### 1.10 MockReviewScreen (`src/screens/MockReviewScreen.tsx`)
- **Route**: `MockReview`
- **Role**: Post-test comprehensive question solutions review.
- **Features**:
  - Filter tabs: `All`, `Correct`, `Wrong`, `Skipped`, `Marked`.
  - Horizontal section filter pills (`Reasoning`, `General Awareness`, `Quantitative Aptitude`, `English`).
  - Color-coded option comparison: Candidate answer vs Correct answer.
  - Complete step-by-step mathematical and conceptual derivations.

---

### 1.11 PerformanceScreen (`src/screens/PerformanceScreen.tsx`)
- **Route**: `Performance`
- **Role**: Personalized analytics cockpit and weak area diagnostic explorer.
- **Features**:
  - Overall accuracy %, total attempted, correct, wrong, and total marks.
  - Difficulty accuracy breakdown (Easy, Medium, Hard).
  - Subject-by-subject cards and filterable topic mastery explorer.
  - Revision progress counter widget (Due Today, Mastered, In Revision).
  - Compact **🎯 Daily Study Goal** widget with today's target and progress %.

---

### 1.12 RevisionScreen (`src/screens/RevisionScreen.tsx`)
- **Route**: `Revision`
- **Role**: Dedicated spaced repetition and mistake revision session runner.
- **Features**:
  - Due questions overview with critical mistake counts.
  - Interactive drill runner adapting spaced repetition levels (1-5 days to mastery).
  - Student-friendly review interval badges (`Next review in 3 days`, `Question Mastered!`).
  - Automatic mistake reset to Level 1.

---

### 1.13 DailyStudyPlanScreen (`src/screens/DailyStudyPlanScreen.tsx`)
- **Route**: `DailyStudyPlan`
- **Role**: Daily smart study roadmap and task execution cockpit.
- **Features**:
  - Daily goal selector chips (`20 Qs ~15m`, `35 Qs ~30m`, `50 Qs ~45m`).
  - Hero progress card with total questions, completion percent, and time estimate.
  - Interactive task checklist with category badges (`🔄 Due for revision`, `⚠️ Needs attention`, `💡 Recommended for you`, `📚 Balanced coverage`, `📝 Mini Mock`).
  - Individual mini progress bars and 1-tap direct drill launchers.
  - Sticky bottom action button automatically advancing through incomplete tasks.

---

## 2. Reusable Components

### 2.1 AppButton (`src/components/AppButton.tsx`)
A customizable button component supporting:
- `title: string`: Label text.
- `onPress: () => void`: Click callback.
- `disabled?: boolean`: Greyed out state.
- `loading?: boolean`: Displays white `ActivityIndicator` spinner.
- `style?: ViewStyle`, `textStyle?: TextStyle`: Custom override styles.

### 2.2 LoadingView (`src/components/LoadingView.tsx`)
A centered screen loader:
- `message?: string`: Optional customizable status message.

### 2.3 ErrorView (`src/components/ErrorView.tsx`)
Standardized error card:
- `message?: string`: Error details.
- `onRetry?: () => void`: Optional retry callback triggering an `AppButton`.
- `retryTitle?: string`: Label for retry button (default: "Try Again").
