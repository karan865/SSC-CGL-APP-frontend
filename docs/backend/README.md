# Backend Documentation Directory

Welcome to the Node.js / Express / MongoDB backend documentation for the **SSC CGL Question Practice Application**.

This directory provides comprehensive documentation on the backend API architecture, database models, security, question generation algorithms, business rules, and developer guides for extending the backend.

---

## Documentation Index

0. **[Backend Master Summary (`BACKEND_SUMMARY.md`)](./BACKEND_SUMMARY.md)**
   - Complete single-file reference covering the entire backend: architecture, 25+ endpoints with payloads, Mongoose schemas, test generation ($sample), security projections, anti-repetition, spaced revision, and daily smart study planning.

0.1. **[Live Questions Catalog (`../EXISTING_QUESTIONS_CATALOG.md`)](../EXISTING_QUESTIONS_CATALOG.md)**
   - Itemized inventory of all 793 live questions in MongoDB Atlas, grouped by subject and topic, with difficulty tags and coverage status.

1. **[Backend Architecture (`ARCHITECTURE.md`)](./ARCHITECTURE.md)**
   - Technology stack, Express 5 server structure, middleware pipelines, error handling, and security practices.

2. **[API Specifications (`API_SPECIFICATION.md`)](./API_SPECIFICATION.md)**
   - Complete endpoint reference (`/health`, `/subjects`, `/topics`, `/practice/start`, `/practice/answer`), request/response JSON contracts, and error formats.

3. **[Database Models & Schemas (`DATABASE_MODELS.md`)](./DATABASE_MODELS.md)**
   - Detailed Mongoose schemas (`Subject`, `Topic`, `Question`), field types, indexes, and relationship structure.

4. **[Question Bank & Seeding Engine (`SEED_AND_QUESTION_BANK.md`)](./SEED_AND_QUESTION_BANK.md)**
   - How the seed system operates, question generation algorithms, and the Fisher-Yates option randomization engine.

5. **[System Architecture & Security Projections (`SYSTEM_ARCHITECTURE.md`)](./SYSTEM_ARCHITECTURE.md)**
   - Complete system architecture, MongoDB aggregation pipelines, and answer security projections.

6. **[Project Specifications & Business Rules (`PROJECT_SPEC.md`)](./PROJECT_SPEC.md)**
   - 19 core business rules governing test eligibility, question filtering, answer evaluation, and grading constraints.

7. **[Developer Guide: Adding Backend Features (`ADDING_NEW_BACKEND_FEATURES_GUIDE.md`)](./ADDING_NEW_BACKEND_FEATURES_GUIDE.md)**
   - Step-by-step tutorial on adding new routes, controllers, services, database models, or seeding new exam categories.

8. **[Master ChatGPT Documentation (`APP_COMPREHENSIVE_DOCUMENT.md`)](./APP_COMPREHENSIVE_DOCUMENT.md)**
   - Complete project technical specification ready to copy-paste into ChatGPT or any AI coding assistant.
