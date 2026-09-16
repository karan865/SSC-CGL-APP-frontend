/**
 * Represents an exam available in the multi-exam platform.
 * Configuration-driven: adding a new exam is a data-only change.
 */
export interface ExamInfo {
  slug: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  bgLight: string;
  description: string;
  tagline: string;

  // Mock Test Hero Config
  defaultPaperSlug: string;
  mockBadge: string;
  mockTitle: string;
  mockDuration: string;
  mockDurationLabel: string;
  mockMarking: string;
  mockDescription: string;
  mockTotalQuestions: number;
  mockMaxMarks: number;

  // Readiness label for performance screen
  readinessLabel: string;

  // Syllabus section config
  syllabusTitle: string;
  syllabusSubtitle: string;

  // Stage filter config (for the stage tab pills)
  stages: {
    key: string;       // tab state key e.g. 'PRELIMS', 'MAINS', 'TIER_1', 'TIER_2'
    stageSlug: string; // matches stageId.slug from DB e.g. 'prelims', 'mains', 'tier-1', 'tier-2'
    label: string;     // display text e.g. '📜 Prelims', '🏆 Tier 1 - Prelims'
    badge: string;     // section header badge e.g. '🏛️ PRELIMS', '🏆 TIER 1 • PRELIMS'
    badgeColor: string;
    desc: string;      // section description
  }[];
}

/**
 * All exams currently supported.
 * To add a new exam (BPSC, UPSC, JSSC, etc.), simply add an entry here
 * and ensure the backend has a matching Exam document with the same slug.
 */
export const AVAILABLE_EXAMS: ExamInfo[] = [
  {
    slug: 'ssc-cgl',
    name: 'SSC CGL',
    shortName: 'SSC',
    icon: '🏆',
    color: '#2563eb',
    bgLight: '#eff6ff',
    description: 'Staff Selection Commission — Combined Graduate Level Examination (Tier I & II)',
    tagline: '100 Qs • 60 Min • +2 / -0.50',

    defaultPaperSlug: 'tier-1',
    mockBadge: '🏆 OFFICIAL TIER-I EXAM',
    mockTitle: 'Full SSC CGL Mock Test',
    mockDuration: '15m',
    mockDurationLabel: 'Per Section',
    mockMarking: '+2 / -0.5',
    mockDescription: 'Real exam simulation featuring 100 questions across 4 timed sections, official +2 / -0.50 marking, and instant solutions.',
    mockTotalQuestions: 100,
    mockMaxMarks: 200,

    readinessLabel: 'Tier-1 Exam Ready',

    syllabusTitle: 'SSC CGL Syllabus & Modules',
    syllabusSubtitle: 'Official Tier 1 Prelims & Tier 2 Mains modules',

    stages: [
      {
        key: 'TIER_1',
        stageSlug: 'tier-1',
        label: '🏆 Tier 1 - Prelims',
        badge: '🏆 TIER 1 • PRELIMS',
        badgeColor: '#2563eb',
        desc: 'Quantitative Aptitude, Reasoning, English Comprehension & General Awareness (100 Qs • 200 Marks)',
      },
      {
        key: 'TIER_2',
        stageSlug: 'tier-2',
        label: '🎯 Tier 2 - Mains',
        badge: '🎯 TIER 2 • MAINS',
        badgeColor: '#7c3aed',
        desc: 'Mathematical Abilities, Reasoning, English Language, GA & Computer Knowledge Test',
      },
    ],
  },
  {
    slug: 'jpsc',
    name: 'JPSC Combined Civil Services',
    shortName: 'JPSC',
    icon: '🏛️',
    color: '#059669',
    bgLight: '#ecfdf5',
    description: 'Jharkhand Public Service Commission — Prelims Paper I & Paper II',
    tagline: '100 Qs • 120 Min • +2 / No Negative',

    defaultPaperSlug: 'paper-1',
    mockBadge: '🏛️ JPSC PRELIMS',
    mockTitle: 'JPSC Prelims Mock Test',
    mockDuration: '120m',
    mockDurationLabel: 'Total Time',
    mockMarking: '+2 / 0',
    mockDescription: 'Full prelims simulation with 100 questions, 120-minute countdown, +2 marks per question, and no negative marking.',
    mockTotalQuestions: 100,
    mockMaxMarks: 200,

    readinessLabel: 'Prelims Exam Ready',

    syllabusTitle: 'JPSC Syllabus & Modules',
    syllabusSubtitle: 'Strictly partitioned Prelims & Mains examination modules',

    stages: [
      {
        key: 'PRELIMS',
        stageSlug: 'prelims',
        label: '📜 Prelims',
        badge: '🏛️ PRELIMS',
        badgeColor: '#059669',
        desc: 'Preliminary Examination Modules',
      },
      {
        key: 'MAINS',
        stageSlug: 'mains',
        label: '📝 Mains Exam',
        badge: '📝 MAINS',
        badgeColor: '#6366f1',
        desc: 'Mains Written Examination Modules',
      },
    ],
  },
];

/**
 * Default exam slug used when no selection has been made yet.
 * Ensures backward compatibility with the original SSC-only app.
 */
export const DEFAULT_EXAM_SLUG = 'ssc-cgl';

/**
 * Utility: find an ExamInfo by slug.
 */
export const getExamBySlug = (slug: string): ExamInfo | undefined =>
  AVAILABLE_EXAMS.find((e) => e.slug === slug);

