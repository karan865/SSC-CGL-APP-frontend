export interface Subject {
  _id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
