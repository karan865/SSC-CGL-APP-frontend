# SSC CGL Exam Practice Mobile App 📱🎯

A production-grade, offline-resilient React Native mobile application engineered for SSC CGL exam preparation. Built with high-performance TypeScript, featuring dynamic mock tests, personalized daily study plans, revision queues, study streaks, and detailed performance analytics.

Connected directly to the live cloud backend:
**Live API**: `https://ssc-cgl-app-backend.onrender.com/api`

---

## 🚀 Key Features

* **Complete Subject & Topic Coverage**: Quantitative Aptitude, General Intelligence & Reasoning, English Comprehension, and General Awareness.
* **Smart Practice Mode**: Filter practice questions by subject, topic, and difficulty (Easy, Medium, Hard).
* **Full-Length Mock Tests**: Multi-section timed test simulator mimicking official SSC CGL examination patterns.
* **Instant Results & Explanations**: Comprehensive score breakdown, accuracy metrics, and step-by-step explanations.
* **Spaced Repetition & Revision**: Bookmark tricky questions and review incorrect attempts in a dedicated Revision screen.
* **Daily Study Plan**: AI/heuristic-driven study tasks customized to focus on low-accuracy topics.
* **Streak & Habit Tracking**: Daily streak counter, streak freeze mechanisms, and practice habit incentives.
* **Hardware-Resilient Networking**: Zero-config auto-switching between Live Cloud, USB ADB reverse, local Wi-Fi, and Android emulator.

---

## 🛠 Tech Stack

* **Core**: React Native 0.87 (React 19)
* **Language**: TypeScript with strict typing
* **Navigation**: React Navigation 7 (Native Stack)
* **Styling**: Vanilla React Native StyleSheet with cohesive design system tokens
* **Testing**: Jest + `@testing-library/react-native` (43+ automated tests)

---

## 📂 Project Structure

```
mobile/
├── android/              # Android native project & Gradle build scripts
├── ios/                  # iOS native project & CocoaPods configuration
├── docs/                 # Detailed architecture & feature documentation
├── src/
│   ├── components/       # Reusable UI components (AppButton, LoadingView, ErrorView)
│   ├── constants/        # App configuration, theme tokens, and API URLs
│   ├── navigation/       # React Navigation stack setup & route param types
│   ├── screens/          # Application screens (Subjects, Practice, Mock, Performance, etc.)
│   ├── services/         # Centralized API client & endpoint service modules
│   ├── types/            # TypeScript interfaces for API models & app state
│   └── utils/            # Helper utilities and formatters
├── __tests__/            # Comprehensive Jest unit & integration test suites
├── App.tsx               # Application root
└── package.json          # Dependencies and scripts
```

---

## ⚙️ Getting Started

### Prerequisites
* Node.js >= 22.11.0
* Java Development Kit (JDK 17)
* Android Studio & Android SDK (API 34/35)

### Installation
```bash
# Install dependencies
npm install
```

### Running in Development
```bash
# 1. Start Metro Bundler
npm start

# 2. In a separate terminal, run Android
npm run android
```

---

## 📦 Building for Production & Google Play Store

### 1. Generate Release APK (for Testing on Physical Phones)
```bash
cd android
./gradlew assembleRelease
```
The generated APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

### 2. Generate Android App Bundle (.aab) (for Google Play Console)
Google Play Store requires an Android App Bundle (`.aab`):
```bash
cd android
./gradlew bundleRelease
```
The generated bundle will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

> **Note**: Before publishing to Google Play Store, generate your production upload keystore and configure signing in `android/app/build.gradle`.

---

## 🧪 Testing & Quality Assurance

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Run all test suites
npm test

# Run linter
npm run lint
```

---

## 📚 In-Depth Documentation

For detailed architectural and design specifications, refer to the [`docs/`](./docs/) directory:
* [Architecture Overview](./docs/ARCHITECTURE.md)
* [Frontend Summary](./docs/FRONTEND_SUMMARY.md)
* [Screens & Components](./docs/SCREENS_AND_COMPONENTS.md)
* [Services & Networking](./docs/SERVICES_AND_NETWORKING.md)
* [Feature List](./docs/FEATURE_LIST.md)
* [Adding New Features Guide](./docs/ADDING_NEW_FEATURES_GUIDE.md)
