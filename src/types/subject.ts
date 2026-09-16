export interface SubjectExamMeta {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  shortName?: string;
}

export interface SubjectStageMeta {
  _id: string;
  name: string;
  slug: string;
  order?: number;
}

export interface SubjectPaperMeta {
  _id: string;
  name: string;
  slug: string;
  order?: number;
}

export interface Subject {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  examId?: SubjectExamMeta | string;
  stageId?: SubjectStageMeta | string;
  paperId?: SubjectPaperMeta | string;
  totalQuestions?: number;
  questionCount?: number;
  marks?: number;
  marksPerQuestion?: number;
  totalMarks?: number;
  marksSpecifiedByPDF?: boolean;
  questionCountSpecifiedByPDF?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
