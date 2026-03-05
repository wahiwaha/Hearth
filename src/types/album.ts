export interface Album {
  id: string;
  title: string;
  coverColor: string;
  spineColor: string;
  pageCount: number;
  createdAt: Date;
  coverImage?: string;
  isShared: boolean;
  memberCount?: number;
}
