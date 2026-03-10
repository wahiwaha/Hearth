export type FriendTag = '가족' | '연인' | '친구' | '직장' | '기타' | (string & {});

export interface Friend {
  id: string;
  name: string;
  tag: FriendTag;
  memo?: string;
  relation?: string; // e.g. 엄마, 아빠 for 가족
  avatarColor: string;
  initial: string;
  avatarUrl?: string; // profile photo URL
  // Extended properties
  phone?: string;
  isAppUser: boolean;
  sharedAlbumCount?: number;
  photoCount?: number;
  lastInteraction?: Date;
  albumCoverColor?: string; // color of the shared album cover shown behind avatar
  albumCoverUrl?: string; // album cover image URL shown behind avatar
  profileBgColor?: string; // profile background banner color (like KakaoTalk)
  profileBgUrl?: string; // profile background banner image URL
}
