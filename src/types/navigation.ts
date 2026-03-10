/** 메인 스택 네비게이션 파라미터 */
export type RootStackParamList = {
  // Onboarding
  Onboarding: undefined;
  // Auth
  Login: undefined;
  // Main tabs
  Main: undefined;
  // Album flows
  CreateAlbum: undefined;
  AlbumViewer: { albumId: string };
  AlbumEditor: { albumId: string; pageId: string };
  AlbumSettings: { albumId: string };
  AlbumImport: { albumId: string };
  // Photo
  PhotoDetail: { photoUri: string; albumId?: string; pageId?: string; elementId?: string };
  PhotoCrop: { photoUri: string; albumId: string; pageId: string; elementId: string };
  // Friend
  FriendProfile: { friendId: string };
  AddFriend: { tag?: string };
  // Collaboration
  InviteCollaborator: { albumId: string };
  // Page management
  PageManager: { albumId: string };
  // Templates
  TemplateGallery: undefined;
  TemplateSave: { albumId: string; pageId: string };
  // Notifications
  Notifications: undefined;
  // Settings
  ThemeSettings: undefined;
  LanguageSettings: undefined;
  BackupRestore: undefined;
  StorageInfo: undefined;
  PrivacySettings: undefined;
  HelpScreen: undefined;
};
