# Documentation Hub — SSC CGL Practice Application

Welcome to the documentation directory for the **SSC CGL Question Practice Application**.

---

## ⚡ Single-File Master Summaries (Quick Access)

If you are looking for a single comprehensive summary of how everything is implemented:

- 📱 **[Complete Frontend Implementation Summary (`FRONTEND_SUMMARY.md`)](./FRONTEND_SUMMARY.md)**  
  *Covers: React Native architecture, 13 screens (including Daily Smart Study Plan, Spaced Revision, Performance Cockpit, full Mock Test Suite & Marked Questions Notebook), component primitives, safe area notch handling, test suites, and how to add new UI features.*

- ⚙️ **[Complete Backend Implementation Summary (`BACKEND_SUMMARY.md`)](./BACKEND_SUMMARY.md)**  
  *Covers: Express 5 pipeline, MongoDB Atlas schemas, 25+ REST endpoints (Practice + Mock Test + Marked Questions + Performance + Spaced Revision + Daily Smart Study Plan), anti-repetition engine, answer validation, Fisher-Yates shuffling, and how to add new endpoints.*

- 📝 **[Existing Questions Catalog (`EXISTING_QUESTIONS_CATALOG.md`)](./EXISTING_QUESTIONS_CATALOG.md)**  
  *Complete itemized inventory of 793 live questions grouped by subject and topic, with difficulty tags, topic breakdown statistics, and full coverage across all 20 SSC CGL syllabus topics.*

---

## 📂 Detailed Directory Layout

```
docs/
├── 📝 EXISTING_QUESTIONS_CATALOG.md  # Complete 623-Question Inventory & Content Gaps
├── ⚡ FRONTEND_SUMMARY.md             # Complete Single-File Master Summary for Frontend
├── ⚡ BACKEND_SUMMARY.md              # Complete Single-File Master Summary for Backend
├── 📄 README.md                      # Documentation Hub & Navigation Guide
│
├── 📱 frontend/                      # Dedicated Mobile Client Documentation
│   ├── FRONTEND_SUMMARY.md           # Master Frontend Implementation Summary
│   ├── README.md                     # Frontend Docs Table of Contents & Quick Start
│   ├── ARCHITECTURE.md               # Navigation hierarchy, layers, typing & state
│   ├── SCREENS_AND_COMPONENTS.md     # Deep-dive on screens & reusable UI components
│   ├── SERVICES_AND_NETWORKING.md    # Multi-transport auto-discovery networking
│   ├── USER_FLOW.md                  # Screen progression, locking, & feedback flow
│   ├── FEATURE_LIST.md               # Frontend feature breakdown & roadmap
│   ├── PROJECT_SPEC.md               # Product purpose, business rules, & scoring
│   ├── ADDING_NEW_FEATURES_GUIDE.md  # Step-by-step tutorial to add new UI features
│   └── APP_COMPREHENSIVE_DOCUMENT.md # Full ChatGPT-ready master reference
│
└── ⚙️ backend/                       # Dedicated Backend Server Documentation
    ├── BACKEND_SUMMARY.md            # Master Backend Implementation Summary
    ├── README.md                     # Backend Docs Table of Contents & Quick Start
    ├── ARCHITECTURE.md               # Express 5 pipeline, middleware, & error handlers
    ├── API_SPECIFICATION.md          # Complete REST API reference (contracts & payloads)
    ├── DATABASE_MODELS.md            # MongoDB Mongoose schemas, types & indexes
    ├── SEED_AND_QUESTION_BANK.md     # Question generator & Fisher-Yates shuffle engine
    ├── SYSTEM_ARCHITECTURE.md        # Full system architecture & database rules
    ├── PROJECT_SPEC.md               # Business rules, question constraints & grading
    ├── ADDING_NEW_BACKEND_FEATURES_GUIDE.md # Tutorial for adding endpoints & services
    └── APP_COMPREHENSIVE_DOCUMENT.md # Full ChatGPT-ready master reference
```

---

## 📱 [Frontend Documentation Hub](./frontend/README.md)
Detailed guides for React Native mobile development:
- **[Frontend Master Summary](./frontend/FRONTEND_SUMMARY.md)**
- **[Architecture & Tech Stack](./frontend/ARCHITECTURE.md)**
- **[Screens & Components](./frontend/SCREENS_AND_COMPONENTS.md)**
- **[Services & Networking Layer](./frontend/SERVICES_AND_NETWORKING.md)**
- **[User Navigation Flow](./frontend/USER_FLOW.md)**
- **[Feature Breakdown](./frontend/FEATURE_LIST.md)**
- **[How to Add Features Guide](./frontend/ADDING_NEW_FEATURES_GUIDE.md)**

---

## ⚙️ [Backend Documentation Hub](./backend/README.md)
Detailed guides for Node.js / Express / MongoDB backend:
- **[Backend Master Summary](./backend/BACKEND_SUMMARY.md)**
- **[Backend Architecture](./backend/ARCHITECTURE.md)**
- **[REST API Specifications](./backend/API_SPECIFICATION.md)**
- **[Database Models & Schemas](./backend/DATABASE_MODELS.md)**
- **[Question Bank & Shuffling](./backend/SEED_AND_QUESTION_BANK.md)**
- **[System Architecture & Security](./backend/SYSTEM_ARCHITECTURE.md)**
- **[How to Add Endpoints Guide](./backend/ADDING_NEW_BACKEND_FEATURES_GUIDE.md)**
