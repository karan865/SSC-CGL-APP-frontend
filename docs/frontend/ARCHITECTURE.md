# Frontend Architecture Documentation

## 1. Overview & Technologies
The mobile application is built using modern **React Native 0.87+** and **TypeScript** targeting Android and iOS devices.

### Key Libraries
- **React**: 19.2.3
- **React Native**: 0.87.1
- **React Navigation**: `@react-navigation/native` v7 and `@react-navigation/native-stack` v7
- **Safe Area Management**: `react-native-safe-area-context`
- **Testing**: `jest` with `@react-native/jest-preset` and `react-test-renderer`

---

## 2. Directory Structure

```
mobile/
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── AppButton.tsx           # Primary button with loading/disabled states
│   │   ├── LoadingView.tsx         # Centered indicator with text
│   │   └── ErrorView.tsx           # Standardized error display with retry
│   │
│   ├── constants/                  # Configuration & environmental constants
│   │   └── config.ts               # API URLs, candidates, timeouts
│   │
│   ├── navigation/                 # Navigation setup & routing definitions
│   │   ├── AppNavigator.tsx        # NativeStack navigator component
│   │   └── types.ts                # RootStackParamList & ScreenProps types
│   │
│   ├── screens/                    # View layer screens
│   │   ├── SplashScreen.tsx        # Initial entry branding screen
│   │   ├── SubjectsScreen.tsx      # Main landing & subject module browser
│   │   ├── TopicsScreen.tsx        # Topic selector screen
│   │   ├── DifficultyScreen.tsx    # Test size (5, 10, 25 Qs) & tier selector
│   │   ├── PracticeScreen.tsx      # Live interactive test player
│   │   └── ResultScreen.tsx        # Score summary & performance analytics
│   │
│   ├── services/                   # Business logic and external communication
│   │   └── api/
│   │       ├── apiClient.ts        # Centralized HTTP fetch wrapper + auto-discovery
│   │       ├── subjectApi.ts       # Subjects and topics endpoints
│   │       └── practiceApi.ts      # Test start and answer submission endpoints
│   │
│   ├── types/                      # Shared domain TypeScript interfaces
│   │   ├── api.ts                  # ApiResponse<T> interface
│   │   ├── subject.ts              # Subject interface
│   │   ├── topic.ts                # Topic interface
│   │   └── question.ts             # Question, Answer, TestResult types
│   │
│   └── utils/                      # Helper calculation & formatting utilities
│       └── index.ts
│
├── __tests__/                      # Jest test suites
│   ├── App.test.tsx                # App root mounting test
│   ├── apiServices.test.ts         # Service layer tests
│   └── components.test.tsx         # Reusable component tests
│
├── App.tsx                         # Root app entry (StatusBar + NavigationContainer)
├── package.json
└── tsconfig.json
```

---

## 3. Architectural Design Principles

### 3.1 Strict Layer Decoupling
```
View Layer (Screens & Components)
       ↓  Calls service functions (never raw fetch)
Service Layer (subjectApi, practiceApi)
       ↓  Calls request() with typed contracts
Network Layer (apiClient with Auto-Discovery)
       ↓  HTTP JSON over USB tunnel, LAN, or Emulator bridge
Backend API (Express / MongoDB)
```
- **Rule**: Screens must never invoke `fetch()` or `axios()` directly. All external communication routes through `src/services/api/`.

### 3.2 Strongly Typed Navigation
All screen routes and their respective incoming parameters are defined in [`src/navigation/types.ts`](../../mobile/src/navigation/types.ts):
```typescript
export type RootStackParamList = {
  Splash: undefined;
  Subjects: undefined;
  Topics: { subjectId: string; subjectName: string };
  Difficulty: { subjectId: string; topicId: string; topicName: string };
  Practice: {
    subjectId: string;
    topicId: string;
    topicName: string;
    difficulty: Difficulty;
    questionCount?: number;
  };
  Result: TestResultData;
};
```
No `any` types are permitted in screen props or route parameters.

### 3.3 State Management Philosophy
For Version 1 MVP, global state libraries (such as Redux or MobX) are intentionally omitted to avoid unnecessary boilerplate and overhead. State is maintained through:
1. **React State (`useState`, `useCallback`, `useEffect`)**: For local component state (current question index, selected option, loading flags).
2. **Navigation Route Parameters**: For passing context across screens (e.g. `subjectId`, `topicName`, `difficulty`, `questionCount`).
3. **Stateless API Services**: For on-demand data retrieval.

### 3.4 Android Scroll Compatibility
- `SafeAreaView` from `react-native` has known layout bugs on Android when used as a root wrapper for `ScrollView`.
- **Standard**: All screen roots use `<View style={styles.screenRoot}>` with `flex: 1`, while `ScrollView` has:
  ```typescript
  contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
  nestedScrollEnabled={true}
  keyboardShouldPersistTaps="handled"
  overScrollMode="always"
  ```
  This guarantees flawless scrolling across all Android and iOS devices.
