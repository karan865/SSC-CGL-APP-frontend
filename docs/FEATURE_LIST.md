# Feature List

## Included Features (V1 + Mock Test & Bookmarks)

1. **Splash Screen**
   - Application entry point with version verification and backend auto-discovery.

2. **Subject Selection**
   - 4 Core SSC CGL Pillars: Quantitative Aptitude, General Intelligence & Reasoning, English Comprehension, General Awareness.

3. **Topic Selection**
   - Syllabus-aligned topic browser with question counters and difficulty tags.

4. **Difficulty & Question Count Selection**
   - Custom test sizing: 5 questions (sprint), 10 questions (standard), 25 questions (full drill).
   - Difficulty tiers: Easy, Medium, Hard.

5. **Topic Practice Screen**
   - Single-question interactive test runner with +1 / 0 scoring.
   - Immediate feedback (Green / Red) and step-by-step explanations.
   - **Inline Question Marking (`🔖 Mark` / `✓ Marked`)** toggle on all questions.

6. **Practice Performance Analytics (Result Screen)**
   - Score badges, accuracy percentages, and performance tier breakdowns.

7. **Full SSC CGL Mock Test Mode (Tier-1 Simulation)**
   - 100 questions across 4 mandatory sections (25 Reasoning, 25 GA, 25 Quant, 25 English).
   - 15-minute countdown timers per section (60 minutes total) with automatic locking.
   - Official SSC CGL marking scheme: `+2.00` for correct, `-0.50` for wrong, `0.00` for unanswered (200 max marks).
   - Interactive 5x5 Question Palette modal (Answered, Marked, Unanswered).
   - Clear response & Mark for review capabilities.

8. **Mock Test Official Scorecard (MockResultScreen)**
   - Official score out of 200 marks, accuracy percentage, and 4-section performance breakdown progress bars.

9. **Post-Exam Detailed Solutions (MockReviewScreen)**
   - Full question analysis unlocked only after submission.
   - Filter tabs: `All`, `Correct`, `Wrong`, `Skipped`, `Marked`.
   - Section-by-section filters, option comparisons, and full derivations.

10. **Unified Marked Questions Notebook (Landing Screen)**
    - Persistent notebook displaying marked questions with `Q1`, `Q2` numbers, subject chips, correctness status, and full solution modal.
    - **Automatic Real-Time Sync**: Uses React Navigation's `useFocusEffect` to refresh counter badges and question lists upon screen return.
    - Inline `✕ Unmark` button for instant removal.

11. **Personalized Performance Dashboard & Analytics (`PerformanceScreen`)**
    - High-level metrics: Overall accuracy %, total attempted, correct, wrong, and total marks.
    - Difficulty accuracy breakdown (Easy %, Medium %, Hard %) to isolate conceptual vs speed weaknesses.
    - Subject-by-subject performance cards for all 4 SSC CGL subjects.
    - Topic-level mastery explorer filterable by subject, with weakness badges (`CRITICAL`, `NEEDS_PRACTICE`, `GOOD`, `STRONG`).

12. **Weak Topic Detection & 1-Tap Recommended Practice**
    - Deterministic ranking of weak areas prioritizing low accuracy with high attempt counts.
    - Home screen dynamic **🔥 FOCUS AREAS** and **🎯 RECOMMENDED FOR YOU** cards.
    - Direct 1-tap **"Practice Now"** launch bypassing all manual configuration.
    - Live question inventory validation to ensure sufficient questions exist in the database.
    - Practice Result historical trend comparison (`📈 YOUR PERFORMANCE`) with repeat practice CTA.
    - New-user onboarding state for students with fewer than 5 attempts.

13. **Smart Question Selection & Anti-Repetition Engine**
    - Automatic unseen question prioritization for all practice drills.
    - Graceful fallback to previously attempted questions for revision when unseen inventory is depleted.
    - Multi-attempt deduplication (question attempted N times treated as seen once).
    - Unobtrusive freshness badge indicator (`✨ Fresh`, `🔄 Revision`, `✨ X New • Y Rev`) in Practice Screen.
    - Fully compatible with recommended practice drills without additional student action.

14. **Smart Spaced Revision & Mistake Revision Engine**
    - Automatic mistake detection across Practice and Mock Test modes.
    - Spaced repetition scheduling across 5 progressive retention intervals (1d, 3d, 7d, 14d, 30d).
    - Mastery tracking (`MASTERED` state achieved after completing Level 5 correctly).
    - Home screen dynamic **🔥 TODAY'S REVISION** card with instant session launch.
    - Dedicated `RevisionScreen` with student-friendly plain-language review schedules.
    - Performance Screen **Revision Progress** counter widget (Due Today, In Revision, Mastered).
    - Practice Result Screen immediate mistake revision summary banner.

15. **Daily Smart Study Plan Engine**
    - Automatic daily roadmap assembled upon opening the app (Due Revision + Weak Topics + Personalized Recommendations + Balanced Practice + Mini Mock).
    - Customizable daily question target chips (20 Qs ~15m, 35 Qs ~30m, 50 Qs ~45m; default: 35 Qs).
    - Starter Plan for new users (< 5 attempts) across 4 subjects without assuming false weaknesses.
    - Plan stability: canonical single plan per user per day (`userId + dateKey`), preserving progress across sessions.
    - Live inventory validation & redistribution when topic inventory has shortages.
    - Dedicated `DailyStudyPlanScreen` with progress checklist, interactive task launch, and sequential plan execution.
    - Prominent `🎯 TODAY'S STUDY PLAN` hero card on home screen with real-time status (Ready to Start, In Progress, Completed).
16. **Simple Study Streak & Daily Goal Engine**
    - Habit-building single-target daily loop: Open App → Check Target → Complete Plan → Streak Increments.
    - Single source of truth: directly coupled to Daily Study Plan completion (`completedQuestions >= goalQuestions`), avoiding separate inconsistent counters.
    - Zero gamification bloat: No XP, coins, badges, levels, leaderboards, or social competition.
    - Local calendar day keys (`YYYY-MM-DD`): Robust UTC date arithmetic avoiding 24-hour interval timer drift.
    - First day completion (`0 -> 1`), consecutive day completion (`N -> N+1`), missed day reset (`N -> 1` with `longestStreak` preserved).
    - Idempotent completions: multiple launches or duplicate completion calls on the same day never multi-increment the streak.
    - Home screen dynamic streak badge & daily goal card (`🔥 {streak} DAY STREAK`, `Today's Goal: {completed}/{goal} Questions`).
    - Dedicated `DailyStudyPlanScreen` celebratory block upon daily goal completion.
    - `ResultScreen` goal completion pill (`🎉 Daily Goal Complete! • 🔥 {streak} Day Streak`).
    - Compact **🔥 Study Streak** section on `PerformanceScreen` (Current Streak, Best Streak, Total Completed Days).

## Excluded Features (Current Scope)
- Login / Signup / Authentication / OTP (intentionally frictionless guest experience)
- Paid Subscriptions / Paywalls (100% free educational platform)
- Push Notifications
- Social chat / Leaderboards
- Offline database syncing (uses live MongoDB Atlas backend)
