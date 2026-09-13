# Project Specifications

## 1. Product Purpose
The primary purpose of this product is to provide a simple, frictionless question practice environment for students preparing for the SSC CGL examination.

## 2. V1 Scope
Version 1 focuses purely on the core practice experience:
- Selecting Subject, Topic, and Difficulty
- Completing a 25-question test
- Reviewing correct/wrong answers with explanations immediately after answering each question
- Viewing a final result screen with the total score and accuracy.

## 3. V1 Exclusions
To keep the MVP simple, the following features are strictly excluded from V1:
- Login, Signup, Authentication, OTP
- User profile, accounts, history, bookmarks
- Leaderboard, XP, Badges, Streaks
- Payments, Subscriptions, Premium features
- Offline mode, Push notifications, Social features, Chat

## 4. Business Rules
The application strictly adheres to the following business rules:
- **RULE 1**: Every test contains exactly 25 questions.
- **RULE 2**: Difficulty values are Easy, Medium and Hard.
- **RULE 3**: Only active questions can be selected.
- **RULE 4**: Questions must match selected subject.
- **RULE 5**: Questions must match selected topic.
- **RULE 6**: Questions must match selected difficulty.
- **RULE 7**: If fewer than 25 valid questions exist, test cannot start.
- **RULE 8**: A question can be answered only once.
- **RULE 9**: After selecting an answer, the answer becomes locked.
- **RULE 10**: Correct/wrong feedback appears immediately after answering.
- **RULE 11**: Correct answer and explanation are displayed after answering.
- **RULE 12**: Student moves to the next question.
- **RULE 13**: Correct answer = 1 mark.
- **RULE 14**: Wrong answer = 0 marks.
- **RULE 15**: No negative marking in V1.
- **RULE 16**: Maximum score = 25.
- **RULE 17**: Accuracy = correct / 25 × 100.
- **RULE 18**: No authentication is required in V1.
- **RULE 19**: No user history is required in V1.
