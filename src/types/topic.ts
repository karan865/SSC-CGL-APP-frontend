export interface Topic {
  _id: string;
  subjectId: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
