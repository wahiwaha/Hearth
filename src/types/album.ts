/** 앨범 페이지 내 배치된 요소 */
export interface PageElement {
  id: string;
  type: 'photo' | 'sticker' | 'text' | 'drawing';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  zIndex: number;
  opacity?: number;
  isLocked?: boolean;
  isBlurred?: boolean; // 공유 앨범 프라이버시
  // Photo-specific
  photoUri?: string;
  photoFilter?: string;
  photoCrop?: { x: number; y: number; width: number; height: number }; // crop region (0-1 normalized)
  // Sticker-specific
  stickerId?: string;
  stickerEmoji?: string;
  // Text-specific
  textContent?: string;
  textColor?: string;
  textFontSize?: number;
  textFontWeight?: string;
  textFontFamily?: 'pretendard' | 'serif' | 'caveat';
  textAlign?: 'left' | 'center' | 'right';
  // Drawing-specific
  drawingPaths?: DrawingPath[];
  drawingColor?: string;
  drawingWidth?: number;
}

/** 드로잉 경로 데이터 */
export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

/** 앨범 한 페이지 */
export interface AlbumPage {
  id: string;
  pageNumber: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundTemplate?: string;
  backgroundPattern?: string;
  elements: PageElement[];
  createdAt: Date;
  updatedAt: Date;
}

/** 사진 메모/태그 */
export interface PhotoMemo {
  id: string;
  photoUri: string;
  text?: string;
  isGlobal: boolean;
  personTags: string[];
  locationTag?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt: Date;
}

/** 앨범 커버 타입 */
export type CoverType = 'color' | 'template' | 'image';

/** 앨범 커버 정보 */
export interface AlbumCover {
  type: CoverType;
  color: string;
  spineColor: string;
  templateId?: string;
  imageUri?: string;
}

/** 앨범 공유 설정 */
export type VisibilityLevel = 'private' | 'friends' | 'public';

/** 앨범 공동 편집자 */
export interface Collaborator {
  id: string;
  name: string;
  initial: string;
  avatarColor: string;
  avatarUrl?: string;
  role: 'owner' | 'editor';
  joinedAt: Date;
}

/** 에디터 히스토리 아이템 (Undo/Redo) */
export interface EditorHistoryEntry {
  elements: PageElement[];
  backgroundColor: string;
  backgroundImage?: string;
  timestamp: number;
}

/** 프레임 레이아웃 (사진 배치용 그리드) */
export interface FrameLayout {
  id: string;
  name: string;
  thumbnailEmoji?: string;
  slots: {
    x: number; // percentage 0-100
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }[];
}

/** 스티커 카테고리 */
export type StickerCategory = 'hearts' | 'nature' | 'food' | 'travel' | 'celebration' | 'faces' | 'animals' | 'weather';

/** 스티커 아이템 */
export interface StickerItem {
  id: string;
  emoji?: string;
  imageUri?: string;
  category: StickerCategory;
  isPremium: boolean;
}

/** 배경 템플릿 */
export interface BackgroundTemplate {
  id: string;
  name: string;
  color?: string;
  colors?: string[]; // gradient
  imageUri?: string;
  pattern?: string;
  category: 'solid' | 'gradient' | 'pattern' | 'texture';
  isPremium: boolean;
}

/** 데코레이션 템플릿 (저장/적용) */
export interface DecoTemplate {
  id: string;
  name: string;
  thumbnailUri?: string;
  elements: Omit<PageElement, 'id'>[];
  backgroundColor: string;
  backgroundPattern?: string;
  createdAt: Date;
  createdBy: string;
  isPublic: boolean;
}

/** 앨범 */
export interface Album {
  id: string;
  title: string;
  coverColor: string;
  spineColor: string;
  pageCount: number;
  createdAt: Date;
  updatedAt?: Date;
  coverImage?: string;
  isShared: boolean;
  memberCount?: number;
  // Extended properties
  cover?: AlbumCover;
  pages?: AlbumPage[];
  collaborators?: Collaborator[];
  visibility: VisibilityLevel;
  description?: string;
  // Nested album support
  parentAlbumId?: string;
  childAlbumIds?: string[];
  // 가져온 앨범 참조
  importedAlbumRefs?: ImportedAlbumRef[];
  // Last viewed page
  lastViewedPageId?: string;
}

/** 앨범 가져오기 참조 */
export interface ImportedAlbumRef {
  id: string;
  sourceAlbumId: string;
  sourceAlbumTitle: string;
  insertPosition: number; // page index where it's inserted
  mode: 'copy' | 'link'; // copy = 독립, link = 원본과 연결
  importedAt: Date;
}
