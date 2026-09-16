# User Flow

## 1. Student User Flow
The primary progression path for a student is linear and simple:
1. **App Launch**: The student sees the Splash screen.
2. **Select Subject**: Student selects a subject (e.g., Quantitative Aptitude).
3. **Select Topic**: Student selects a topic under the chosen subject.
4. **Select Difficulty**: Student selects Easy, Medium, or Hard.
5. **Start Test**: System checks for the 25-question rule. If valid, the test starts.
6. **Take Test**: Student loops through 25 questions.
7. **Complete Test**: Student views the Final Result screen.

## 2. 25-Question Test Rule
When a test is requested, the system attempts to fetch exactly 25 questions matching the active criteria. If 24 or fewer questions exist, the student is shown a friendly message that the test cannot be started.

## 3. Answer & Explanation Flow
1. **View Question**: Student is presented with the question and 4 options.
2. **Make Selection**: Student taps an option.
3. **Lock Answer**: The UI prevents further option selections.
4. **Validation**: The app verifies the answer (fetching securely from the backend).
5. **Feedback**: 
   - Highlight the chosen option (green if correct, red if wrong).
   - Show the correct option (if chosen wrong).
   - Display the detailed explanation below the options.
6. **Next Question**: A "Next Question" button appears.

## 4. Result Calculation
After completing question 25, the application computes:
- Total Questions = 25
- Correct Answers = (Count of correctly answered questions)
- Wrong Answers = (Count of incorrectly answered questions)
- Total Marks = Correct Answers * 1 (No negative marking)
- Accuracy = (Correct Answers / 25) * 100

These metrics are displayed on the Final Result screen before the student can navigate back to the home screen.
