export interface Topic {
  _id: string;
  subjectId: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  targetQuestions?: number;
  totalQuestions?: number;
  questionCount?: number;
  marks?: number;
  marksSpecifiedByPDF?: boolean;
  questionCountSpecifiedByPDF?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
