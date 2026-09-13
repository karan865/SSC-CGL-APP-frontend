# Architecture

## 1. Technology Stack
- **Mobile Client**: React Native + TypeScript
- **Backend API**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose

## 2. Database Architecture
V1 strictly utilizes the following collections to maintain simplicity:
- `subjects`
- `topics`
- `questions`

### Question Structure
Each question document contains:
- `subjectId` (ObjectId)
- `topicId` (ObjectId)
- `questionText` (String)
- `optionA` (String)
- `optionB` (String)
- `optionC` (String)
- `optionD` (String)
- `correctAnswer` (Enum: A, B, C, D)
- `explanation` (String)
- `difficulty` (Enum: Easy, Medium, Hard)
- `isActive` (Boolean)
- `createdAt` (Date)
- `updatedAt` (Date)

## 3. Mobile Architecture
The mobile application will consist of the following primary screens:
1. Splash Screen
2. Subjects Screen
3. Topics Screen
4. Difficulty Screen
5. Practice (Test) Screen
6. Result Screen

## 4. API Architecture
The following endpoints will be built:
- `GET /api/subjects` - List active subjects
- `GET /api/subjects/:subjectId/topics` - List topics for a specific subject
- `POST /api/practice/start` - Initialize a test and fetch 25 random questions (without correct answers/explanations)
- `POST /api/practice/answer` - Submit an answer to get correct/wrong status, correct answer, and explanation
- `POST /api/practice/finish` - Finish the test (optional for V1 to clean up test session if maintained on the backend, or completely handled on the frontend)

## 5. Security & Question Selection
- **Question Selection Rule**: The backend must ensure that the questions match the selected subject, topic, and difficulty. It randomly selects exactly 25 active questions. If fewer than 25 exist, it returns an error to the client.
- **Security**: The correct answer and explanation MUST NOT be sent to the mobile client in the `/api/practice/start` payload. The mobile client must call `/api/practice/answer` to validate their selection and fetch the explanation.

## 6. Future Extensibility
While keeping V1 simple, the structure accommodates future additions:
- Adding `Hindi`/`English` fields for questionText and explanation.
- Storing Image URLs for questions and options.
- Introducing `users` and `practice_history` collections without restructuring the core testing logic.

## 7. Day 3 Practice API Details
### Question Selection Logic & 25-Question Rule
When calling `POST /api/practice/start`, the system filters questions by `subjectId`, `topicId`, `difficulty`, and `isActive`. If the database count is `< 25`, the API strictly rejects the request and specifies how many questions were available versus required.

### Random Selection
MongoDB's `$sample` aggregation pipeline stage is used to efficiently shuffle and select exactly 25 questions directly at the database level, preventing memory bloat in Node.js.

### Security Rule
An explicit `$project` aggregation stage is utilized to completely strip `correctAnswer` and `explanation` from the MongoDB response before it is processed by Node.js, ensuring zero accidental leakage of answers via JSON serialization.

## 8. Day 4 Answer API Details
### POST /api/practice/answer
This endpoint evaluates the user's submitted answer for a specific question.
- **Stateless Validation**: The backend does NOT use sessions or practice history logic yet. It simply receives a `questionId` and `selectedAnswer`, locates the question, and mathematically validates it.
- **Mark Calculation**: If `selectedAnswer === correctAnswer`, `isCorrect` is true and `marks: 1`. Otherwise, `isCorrect` is false and `marks: 0`. There is no negative marking.
- **Security Behavior**: Unlike the `/start` endpoint (which strictly hides answers), this endpoint intentionally reveals the `correctAnswer` and `explanation` since it is triggered *after* the student locks in their answer.

## 9. Day 5 Mobile Foundation Architecture
### Mobile Architecture Layering
The React Native mobile client is decoupled into 4 clean layers:
1. **Screen Layer (`mobile/src/screens/`)**:
   - Presentation logic only (renders loading, error, empty, or data states).
   - Never contains direct `fetch` or HTTP calls.
2. **Service Layer (`mobile/src/services/api/`)**:
   - `apiClient.ts`: Handles base URL configuration, headers, timeout abort signals, response parsing, and error normalization.
   - `subjectApi.ts`: Domain service for `GET /api/subjects` and `GET /api/subjects/:subjectId/topics`.
   - `practiceApi.ts`: Domain service for `POST /api/practice/start` and `POST /api/practice/answer`.
3. **Navigation Foundation (`mobile/src/navigation/`)**:
   - Strongly typed route parameters via `RootStackParamList` with `@react-navigation/native-stack`.
   - Navigation Flow: `Splash` -> `Subjects` -> `Topics` -> `Difficulty` -> `Practice` -> `Result`.
   - No `any` types used for navigation props.
4. **Shared Types (`mobile/src/types/`)**:
   - `Subject`, `Topic`, `Question`, `PracticeStartResponse`, `AnswerResponse`, `ApiResponse`.
   - Security enforced at type level: `Question` strictly omits `correctAnswer` and `explanation`.

