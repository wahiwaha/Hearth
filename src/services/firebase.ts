/**
 * Firebase 서비스 레이어
 *
 * Firebase 모듈이 Expo 빌드 환경에서만 동작하므로,
 * 개발 중에는 mock으로 대체하고 실제 빌드 시 Firebase 연결.
 *
 * TODO: EAS Build 환경에서 아래 주석을 해제하여 실제 Firebase 연결
 */

// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import storage from '@react-native-firebase/storage';
// import messaging from '@react-native-firebase/messaging';
// import analytics from '@react-native-firebase/analytics';

/* ─────────────── Auth Service ─────────────── */

export const AuthService = {
  /** Apple 소셜 로그인 */
  signInWithApple: async (): Promise<{ uid: string; displayName: string; email?: string }> => {
    // TODO: auth().signInWithCredential(appleCredential)
    return { uid: 'mock-apple-uid', displayName: '사용자', email: 'user@apple.com' };
  },

  /** Google 소셜 로그인 */
  signInWithGoogle: async (): Promise<{ uid: string; displayName: string; email?: string }> => {
    // TODO: auth().signInWithCredential(googleCredential)
    return { uid: 'mock-google-uid', displayName: '사용자', email: 'user@gmail.com' };
  },

  /** 익명 로그인 */
  signInAnonymously: async (): Promise<{ uid: string }> => {
    // TODO: auth().signInAnonymously()
    return { uid: 'mock-anon-uid' };
  },

  /** 로그아웃 */
  signOut: async (): Promise<void> => {
    // TODO: auth().signOut()
  },

  /** 현재 사용자 */
  getCurrentUser: () => {
    // TODO: auth().currentUser
    return null;
  },

  /** 인증 상태 변경 리스너 */
  onAuthStateChanged: (callback: (user: any) => void) => {
    // TODO: auth().onAuthStateChanged(callback)
    return () => {}; // unsubscribe
  },
};

/* ─────────────── Firestore Service ─────────────── */

export const FirestoreService = {
  /** 앨범 생성 */
  createAlbum: async (albumData: any): Promise<string> => {
    // TODO: firestore().collection('albums').add(albumData)
    return `album-${Date.now()}`;
  },

  /** 앨범 업데이트 */
  updateAlbum: async (albumId: string, updates: any): Promise<void> => {
    // TODO: firestore().collection('albums').doc(albumId).update(updates)
  },

  /** 앨범 삭제 */
  deleteAlbum: async (albumId: string): Promise<void> => {
    // TODO: firestore().collection('albums').doc(albumId).delete()
  },

  /** 앨범 실시간 구독 */
  subscribeToAlbum: (albumId: string, callback: (data: any) => void) => {
    // TODO: firestore().collection('albums').doc(albumId).onSnapshot(callback)
    return () => {}; // unsubscribe
  },

  /** 사용자의 모든 앨범 구독 */
  subscribeToUserAlbums: (userId: string, callback: (albums: any[]) => void) => {
    // TODO: firestore().collection('albums').where('memberIds', 'array-contains', userId).onSnapshot(...)
    return () => {};
  },

  /** 페이지 요소 업데이트 (공동 편집) */
  updatePageElements: async (albumId: string, pageId: string, elements: any[]): Promise<void> => {
    // TODO: firestore().collection('albums').doc(albumId).collection('pages').doc(pageId).update({ elements })
  },

  /** 페이지 실시간 구독 (공동 편집용) */
  subscribeToPage: (albumId: string, pageId: string, callback: (data: any) => void) => {
    // TODO: firestore().collection('albums').doc(albumId).collection('pages').doc(pageId).onSnapshot(callback)
    return () => {};
  },

  /** 공동 편집자 추가 */
  addCollaborator: async (albumId: string, userId: string): Promise<void> => {
    // TODO: firestore().collection('albums').doc(albumId).update({ memberIds: firestore.FieldValue.arrayUnion(userId) })
  },

  /** 친구 목록 구독 */
  subscribeToFriends: (userId: string, callback: (friends: any[]) => void) => {
    // TODO: firestore().collection('users').doc(userId).collection('friends').onSnapshot(...)
    return () => {};
  },

  /** 알림 목록 구독 */
  subscribeToNotifications: (userId: string, callback: (notifications: any[]) => void) => {
    // TODO: firestore().collection('users').doc(userId).collection('notifications').orderBy('time', 'desc').limit(50).onSnapshot(...)
    return () => {};
  },

  /** 알림 읽음 처리 */
  markNotificationRead: async (userId: string, notifId: string): Promise<void> => {
    // TODO: firestore().collection('users').doc(userId).collection('notifications').doc(notifId).update({ read: true })
  },
};

/* ─────────────── Storage Service ─────────────── */

export const StorageService = {
  /** 이미지 업로드 */
  uploadImage: async (
    path: string,
    localUri: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    // TODO:
    // const ref = storage().ref(path);
    // const task = ref.putFile(localUri);
    // task.on('state_changed', snapshot => {
    //   onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes);
    // });
    // await task;
    // return ref.getDownloadURL();

    // Mock: return local URI as-is
    return localUri;
  },

  /** 이미지 삭제 */
  deleteImage: async (path: string): Promise<void> => {
    // TODO: storage().ref(path).delete()
  },

  /** 이미지 URL 가져오기 */
  getDownloadURL: async (path: string): Promise<string> => {
    // TODO: storage().ref(path).getDownloadURL()
    return '';
  },

  /** 썸네일 자동 생성 (Cloud Function 트리거) */
  generateThumbnail: async (imagePath: string): Promise<string> => {
    // Firebase Cloud Function이 자동으로 처리
    // 원본 경로에서 /thumbnails/ 경로로 리사이즈
    return imagePath.replace('/photos/', '/thumbnails/');
  },
};

/* ─────────────── FCM Service ─────────────── */

export const FCMService = {
  /** FCM 토큰 가져오기 */
  getToken: async (): Promise<string> => {
    // TODO: messaging().getToken()
    return 'mock-fcm-token';
  },

  /** 알림 권한 요청 */
  requestPermission: async (): Promise<boolean> => {
    // TODO: messaging().requestPermission()
    return true;
  },

  /** 포그라운드 알림 리스너 */
  onMessage: (callback: (message: any) => void) => {
    // TODO: messaging().onMessage(callback)
    return () => {};
  },

  /** 백그라운드 알림 핸들러 */
  setBackgroundMessageHandler: (handler: (message: any) => Promise<void>) => {
    // TODO: messaging().setBackgroundMessageHandler(handler)
  },

  /** 알림 탭 리스너 */
  onNotificationOpenedApp: (callback: (message: any) => void) => {
    // TODO: messaging().onNotificationOpenedApp(callback)
    return () => {};
  },

  /** 토픽 구독 (앨범 업데이트 등) */
  subscribeToTopic: async (topic: string): Promise<void> => {
    // TODO: messaging().subscribeToTopic(topic)
  },

  /** 토픽 구독 해제 */
  unsubscribeFromTopic: async (topic: string): Promise<void> => {
    // TODO: messaging().unsubscribeFromTopic(topic)
  },
};

/* ─────────────── Analytics Service ─────────────── */

export const AnalyticsService = {
  /** 화면 조회 */
  logScreenView: async (screenName: string): Promise<void> => {
    // TODO: analytics().logScreenView({ screen_name: screenName })
  },

  /** 커스텀 이벤트 */
  logEvent: async (name: string, params?: Record<string, any>): Promise<void> => {
    // TODO: analytics().logEvent(name, params)
  },

  /** 사용자 속성 설정 */
  setUserProperty: async (name: string, value: string): Promise<void> => {
    // TODO: analytics().setUserProperty(name, value)
  },

  /** 사용자 ID 설정 */
  setUserId: async (userId: string): Promise<void> => {
    // TODO: analytics().setUserId(userId)
  },

  // 핵심 이벤트 (docs: 15+ core events)
  Events: {
    ALBUM_CREATED: 'album_created',
    ALBUM_SHARED: 'album_shared',
    PHOTO_ADDED: 'photo_added',
    STICKER_PLACED: 'sticker_placed',
    TEXT_ADDED: 'text_added',
    DRAWING_CREATED: 'drawing_created',
    PAGE_ADDED: 'page_added',
    COLLABORATOR_INVITED: 'collaborator_invited',
    FRIEND_ADDED: 'friend_added',
    TEMPLATE_USED: 'template_used',
    TEMPLATE_SAVED: 'template_saved',
    ALBUM_EXPORTED: 'album_exported',
    NOTIFICATION_OPENED: 'notification_opened',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    THEME_CHANGED: 'theme_changed',
  },
};
