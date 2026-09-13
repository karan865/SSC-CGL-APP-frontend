# Services & Networking Layer Documentation

This document explains the mobile API client, multi-transport host auto-discovery, domain services, and error handling.

---

## 1. Network Configuration (`src/constants/config.ts`)

Mobile applications run in various environments with different network loopback semantics:
- **Android Emulator**: `10.0.2.2` maps to the PC's localhost.
- **Physical Device (USB)**: `127.0.0.1` maps to the PC via an ADB reverse tunnel.
- **Physical Device (Wi-Fi)**: Requires the PC's actual LAN IPv4 address (e.g., `10.39.170.191`).
- **iOS Simulator**: `localhost` or `127.0.0.1` directly bridges to the host machine.

### Candidate Hosts List
```typescript
export const API_CANDIDATE_URLS: string[] = [
  'http://127.0.0.1:5000/api',          // USB reverse tunnel via ADB
  'http://localhost:5000/api',          // Local simulator
  'http://10.39.170.191:5000/api',      // Machine Wi-Fi LAN IP
  'http://10.0.2.2:5000/api',           // Android Emulator virtual bridge
];
```

---

## 2. Centralized API Client (`src/services/api/apiClient.ts`)

All network communication flows through `apiClient.ts`.

### Features
1. **Auto-Discovery & Failover (`discoverWorkingBaseUrl`)**:
   - If the active URL fails to respond or times out, the client iterates through `API_CANDIDATE_URLS` probing `/health` with a 2-second timeout.
   - The first host that returns `200 OK` is cached as `verifiedWorkingUrl`, and the pending request is automatically retried.
   - Developers and testers do not need to manually change IP addresses when switching between USB, Wi-Fi, or emulators.
2. **Timeout Handling via AbortController**:
   - Every request is guarded by an `AbortController` with a configurable timeout (default: 6000ms).
3. **Normalized Error Handling (`ApiError`)**:
   - Technical stack traces and raw network exceptions are intercepted and converted into user-friendly messages.

```typescript
export const apiClient = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body, headers }),
};
```

---

## 3. Domain Services

### 3.1 Subject API (`src/services/api/subjectApi.ts`)
```typescript
export const subjectApi = {
  // Calls GET /api/subjects
  getSubjects: async (): Promise<Subject[]> => { ... },

  // Calls GET /api/subjects/:subjectId/topics
  getTopics: async (subjectId: string): Promise<Topic[]> => { ... },
};
```

### 3.2 Practice API (`src/services/api/practiceApi.ts`)
```typescript
export const practiceApi = {
  // Calls POST /api/practice/start
  // Body: { subjectId, topicId, difficulty, count }
  startPractice: async (params: StartPracticeParams): Promise<PracticeStartResponse> => { ... },

  // Calls POST /api/practice/answer
  // Body: { questionId, selectedAnswer }
  answerQuestion: async (params: SubmitAnswerParams): Promise<AnswerResponse> => { ... },
};
```

---

## 4. USB Reverse Tunnel Setup (Android)

When developing on a physical Android device connected via USB cable:
```bash
# Forward device port 5000 to computer backend port 5000
adb reverse tcp:5000 tcp:5000

# Forward device port 8081 to Metro packager port 8081
adb reverse tcp:8081 tcp:8081

# Verify active reverse tunnels
adb reverse --list
```
This enables the phone to access the backend at `http://127.0.0.1:5000` with near-zero latency.
