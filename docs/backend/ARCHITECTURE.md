# Backend Architecture Documentation

## 1. Overview & Technology Stack
The backend is built with **Node.js** and **Express.js 5**, written in **TypeScript**, and uses **MongoDB Atlas** with **Mongoose 9** as the Object Data Modeling (ODM) layer.

### Technology Stack
- **Runtime**: Node.js v25.x
- **Framework**: Express.js 5.2.1
- **Language**: TypeScript 7.x
- **Database**: MongoDB Atlas (Multi-node Replica Set)
- **ODM**: Mongoose 9.9.4
- **Runtime Compiler**: `tsx` (TypeScript Execute & Watch)
- **Security Middleware**:
  - `helmet`: HTTP headers security
  - `cors`: Cross-Origin Resource Sharing
  - `express-rate-limit`: Brute-force & DoS prevention

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── config/                     # Configuration modules
│   │   └── db.ts                   # Mongoose connection & replica set handling
│   │
│   ├── controllers/                # Request handling & HTTP response mapping
│   │   ├── subjectController.ts    # Subject list controller
│   │   ├── topicController.ts      # Topic retrieval controller
│   │   └── practiceController.ts   # Test generation & answer evaluation controllers
│   │
│   ├── models/                     # Mongoose models & database schemas
│   │   ├── Subject.ts              # Subject schema
│   │   ├── Topic.ts                # Topic schema
│   │   └── Question.ts             # Question schema with indexes
│   │
│   ├── routes/                     # Express route declarations
│   │   ├── index.ts                # Aggregated route mount (/api)
│   │   ├── subjectRoutes.ts        # /api/subjects
│   │   └── practiceRoutes.ts       # /api/practice
│   │
│   ├── services/                   # Business logic and database operations
│   │   ├── practiceService.ts      # Question aggregation & answer validation logic
│   │   ├── questionsData.ts        # Question bank definition
│   │   └── seed.ts                 # Database seeding & Fisher-Yates shuffle engine
│   │
│   ├── utils/                      # Helper functions
│   │   └── apiResponse.ts          # Standardized success/error JSON formats
│   │
│   ├── app.ts                      # Express app setup & middleware pipeline
│   └── server.ts                   # Server bootstrap & port listener
│
├── .env                            # Environment variables (PORT, MONGODB_URI, NODE_ENV)
├── package.json
└── tsconfig.json
```

---

## 3. Request Lifecycle & Middleware Pipeline

```
Incoming Request
      ↓
[1. Helmet] -> Injects HTTP security headers
      ↓
[2. CORS] -> Validates allowed origins
      ↓
[3. Rate Limiter] -> Enforces 100 requests per 15-minute window
      ↓
[4. express.json()] -> Parses incoming JSON body
      ↓
[5. Express Routers] -> Maps /api/subjects, /api/practice
      ↓
[6. Controller] -> Validates input format (ObjectIds, difficulty enums)
      ↓
[7. Service] -> Executes Mongoose queries / MongoDB Aggregation Pipelines
      ↓
[8. Standard API Response] -> Formats payload with { success, message, data }
      ↓
[9. Global Error Handler] -> Intercepts uncaught errors (no stack trace leak)
```

---

## 4. Key Architectural Decisions

### 4.1 Stateless Practice Validation
- The backend does **not** rely on server-side sessions, cookies, or Redis caches for the MVP.
- Test generation (`POST /api/practice/start`) and answer evaluation (`POST /api/practice/answer`) are completely stateless.
- Every question stores its own self-contained metadata (`correctAnswer`, `explanation`, `difficulty`, `isActive`).

### 4.2 Leak-Proof Question Sampling
- When `POST /api/practice/start` is called, the database uses a dual-stage aggregation pipeline:
  1. `$sample`: Randomizes selection directly on the database cluster.
  2. `$project`: Strips `correctAnswer` and `explanation` before the document enters Node.js memory.
  This ensures that even if a student inspects the mobile network traffic, the answers cannot be retrieved in advance.

### 4.3 Standardized Response Format
Every endpoint returns a consistent JSON envelope defined in `src/utils/apiResponse.ts`:
```json
{
  "success": true,
  "message": "Human readable description",
  "data": { ... }
}
```
Or for errors:
```json
{
  "success": false,
  "message": "Human readable error description",
  "errors": [ ... ]
}
```
