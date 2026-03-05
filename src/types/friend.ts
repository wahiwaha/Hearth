export type FriendTag = '가족' | '연인' | '친구' | '직장' | '기타';

export interface Friend {
  id: string;
  name: string;
  tag: FriendTag;
  memo?: string;
  relation?: string; // e.g. 엄마, 아빠 for 가족
  avatarColor: string;
  initial: string;
  // Extended properties
  phone?: string;
  isAppUser: boolean;
  sharedAlbumCount?: number;
  photoCount?: number;
  lastInteraction?: Date;
}
