/**
 * Firebase 서비스 레이어 (JS SDK — Expo Go 호환)
 *
 * Firebase JS SDK를 사용하여 Expo Go에서도 동작합니다.
 * FCM(푸시 알림)과 Crashlytics만 프로덕션 빌드에서 동작합니다.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  signInWithCredential,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile as fbUpdateProfile,
  createUserWithEmailAndPassword as fbCreateUserWithEmail,
  signInWithEmailAndPassword as fbSignInWithEmail,
  sendEmailVerification as fbSendEmailVerification,
  signInWithPhoneNumber as fbSignInWithPhoneNumber,
  PhoneAuthProvider,
  OAuthProvider,
  GoogleAuthProvider,
  type ApplicationVerifier,
  type User as FBUser,
  type UserCredential,
} from 'firebase/auth';
// @ts-ignore — RN persistence (not in public exports yet)
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL as fbGetDownloadURL,
  deleteObject,
} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ─────────────── Firebase 초기화 ─────────────── */

const firebaseConfig = {
  apiKey: 'AIzaSyCl4Y1qkOa1M6ZaDv1QCmTsrxJqWy2MysA',
  authDomain: 'hearth-341617.firebaseapp.com',
  projectId: 'hearth-341617',
  storageBucket: 'hearth-341617.firebasestorage.app',
  messagingSenderId: '125887430824',
  appId: '1:125887430824:ios:5a5f60b241ca90f288429d',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth — AsyncStorage로 세션 영속화 (hot reload 대응)
let auth: ReturnType<typeof initializeAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app) as any;
}

// 개발 모드: reCAPTCHA 검증 비활성화 (테스트 전화번호 사용 가능)
if (__DEV__) {
  auth.settings.appVerificationDisabledForTesting = true;
}

const db = getFirestore(app);
const storageInstance = getStorage(app);

/* ─────────────── Auth Service ─────────────── */

export const AuthService = {
  /** credential 로그인 (Apple/Google) */
  signInWithCredential: async (credential: any): Promise<UserCredential> => {
    return signInWithCredential(auth, credential);
  },

  /** Apple credential 생성 */
  createAppleCredential: (identityToken: string, nonce: string) => {
    const provider = new OAuthProvider('apple.com');
    return provider.credential({ idToken: identityToken, rawNonce: nonce });
  },

  /** Google credential 생성 */
  createGoogleCredential: (idToken: string) => {
    return GoogleAuthProvider.credential(idToken);
  },

  /** 로그아웃 */
  signOut: async (): Promise<void> => {
    await fbSignOut(auth);
  },

  /** 현재 사용자 */
  getCurrentUser: (): FBUser | null => {
    return auth.currentUser;
  },

  /** 인증 상태 변경 리스너 */
  onAuthStateChanged: (callback: (user: FBUser | null) => void): (() => void) => {
    return fbOnAuthStateChanged(auth, callback);
  },

  /** 프로필 업데이트 */
  updateProfile: async (updates: { displayName?: string; photoURL?: string }): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      await fbUpdateProfile(user, {
        displayName: updates.displayName ?? user.displayName,
        photoURL: updates.photoURL ?? user.photoURL,
      });
    }
  },

  /** 이메일 회원가입 */
  signUpWithEmail: async (email: string, password: string): Promise<UserCredential> => {
    return fbCreateUserWithEmail(auth, email, password);
  },

  /** 이메일 로그인 */
  signInWithEmail: async (email: string, password: string): Promise<UserCredential> => {
    return fbSignInWithEmail(auth, email, password);
  },

  /** 이메일 인증 메일 발송 */
  sendEmailVerification: async (): Promise<void> => {
    if (auth.currentUser) await fbSendEmailVerification(auth.currentUser);
  },

  /** 전화번호 인증번호 발송 (개발: fake verifier, 프로덕션: native SDK) */
  sendPhoneVerification: async (phoneNumber: string): Promise<string> => {
    // appVerificationDisabledForTesting이 true이면 fake verifier 허용됨
    const fakeVerifier = {
      type: 'recaptcha' as const,
      verify: () => Promise.resolve('fake-recaptcha-token'),
      _reset: () => {},
    } as ApplicationVerifier;
    const confirmationResult = await fbSignInWithPhoneNumber(auth, phoneNumber, fakeVerifier);
    return confirmationResult.verificationId;
  },

  /** 전화번호 인증 credential 생성 */
  createPhoneCredential: (verificationId: string, code: string) => {
    return PhoneAuthProvider.credential(verificationId, code);
  },

  /** 계정 삭제 */
  deleteAccount: async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) await user.delete();
  },
};

/* ─────────────── Firestore Service ─────────────── */

/** Firestore timestamp → JS Date 변환 헬퍼 */
const toDate = (ts: any): Date => {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
};

export const FirestoreService = {
  /* ── User Profile ── */

  setUserProfile: async (uid: string, data: Record<string, any>): Promise<void> => {
    // Firestore는 undefined 값을 허용하지 않으므로 제거
    const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await setDoc(doc(db, 'users', uid), cleaned, { merge: true });
  },

  getUserProfile: async (uid: string): Promise<Record<string, any> | null> => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() ?? null) : null;
  },

  subscribeToUserProfile: (uid: string, callback: (data: Record<string, any> | null) => void) => {
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      callback(snap.exists() ? (snap.data() ?? null) : null);
    });
  },

  /* ── Albums ── */

  createAlbum: async (albumData: Record<string, any>): Promise<string> => {
    const ref = await addDoc(collection(db, 'albums'), {
      ...albumData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  updateAlbum: async (albumId: string, updates: Record<string, any>): Promise<void> => {
    await updateDoc(doc(db, 'albums', albumId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  deleteAlbum: async (albumId: string): Promise<void> => {
    await updateDoc(doc(db, 'albums', albumId), {
      deletedAt: serverTimestamp(),
    });
  },

  permanentlyDeleteAlbum: async (albumId: string): Promise<void> => {
    await deleteDoc(doc(db, 'albums', albumId));
  },

  subscribeToAlbum: (albumId: string, callback: (data: any) => void) => {
    return onSnapshot(doc(db, 'albums', albumId), (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
  },

  subscribeToUserAlbums: (userId: string, callback: (albums: any[]) => void) => {
    const q = query(
      collection(db, 'albums'),
      where('memberIds', 'array-contains', userId),
      where('deletedAt', '==', null),
      orderBy('updatedAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  subscribeToDeletedAlbums: (userId: string, callback: (albums: any[]) => void) => {
    const q = query(
      collection(db, 'albums'),
      where('memberIds', 'array-contains', userId),
      where('deletedAt', '!=', null),
      orderBy('deletedAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  /* ── Pages (subcollection) ── */

  updatePageElements: async (albumId: string, pageId: string, elements: any[]): Promise<void> => {
    await updateDoc(doc(db, 'albums', albumId, 'pages', pageId), {
      elements,
      updatedAt: serverTimestamp(),
    });
  },

  subscribeToPage: (albumId: string, pageId: string, callback: (data: any) => void) => {
    return onSnapshot(doc(db, 'albums', albumId, 'pages', pageId), (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
  },

  /* ── Collaborators ── */

  addCollaborator: async (albumId: string, userId: string): Promise<void> => {
    await updateDoc(doc(db, 'albums', albumId), {
      memberIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  },

  removeCollaborator: async (albumId: string, userId: string): Promise<void> => {
    await updateDoc(doc(db, 'albums', albumId), {
      memberIds: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  },

  /* ── Friends ── */

  addFriend: async (userId: string, friendData: Record<string, any>): Promise<string> => {
    const ref = await addDoc(collection(db, 'users', userId, 'friends'), {
      ...friendData,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  updateFriend: async (userId: string, friendId: string, updates: Record<string, any>): Promise<void> => {
    await updateDoc(doc(db, 'users', userId, 'friends', friendId), updates);
  },

  deleteFriend: async (userId: string, friendId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'friends', friendId));
  },

  subscribeToFriends: (userId: string, callback: (friends: any[]) => void) => {
    const q = query(collection(db, 'users', userId, 'friends'), orderBy('name'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  /* ── Notifications ── */

  subscribeToNotifications: (userId: string, callback: (notifications: any[]) => void) => {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('time', 'desc'),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        time: toDate(d.data().time),
      })));
    });
  },

  markNotificationRead: async (userId: string, notifId: string): Promise<void> => {
    await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { read: true });
  },

  markAllNotificationsRead: async (userId: string): Promise<void> => {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('read', '==', false),
    );
    const batch = writeBatch(db);
    const unreadSnap = await getDocs(q);
    unreadSnap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  },

  deleteNotification: async (userId: string, notifId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'notifications', notifId));
  },

  serverTimestamp,
  toDate,
};

/* ─────────────── Storage Service ─────────────── */

export const StorageService = {
  /** 이미지 업로드 (blob 방식 — Expo Go 호환) */
  uploadImage: async (
    path: string,
    localUri: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storageInstance, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes);
        },
        reject,
        async () => {
          const url = await fbGetDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  },

  deleteImage: async (path: string): Promise<void> => {
    await deleteObject(ref(storageInstance, path));
  },

  getDownloadURL: async (path: string): Promise<string> => {
    return fbGetDownloadURL(ref(storageInstance, path));
  },

  uploadProfilePhoto: async (uid: string, localUri: string, onProgress?: (progress: number) => void): Promise<string> => {
    return StorageService.uploadImage(`users/${uid}/profile.jpg`, localUri, onProgress);
  },

  uploadCoverPhoto: async (uid: string, localUri: string, onProgress?: (progress: number) => void): Promise<string> => {
    return StorageService.uploadImage(`users/${uid}/cover.jpg`, localUri, onProgress);
  },

  uploadAlbumPhoto: async (albumId: string, fileName: string, localUri: string, onProgress?: (progress: number) => void): Promise<string> => {
    return StorageService.uploadImage(`albums/${albumId}/photos/${fileName}`, localUri, onProgress);
  },
};

/* ─────────────── FCM Service (프로덕션 빌드 전용) ─────────────── */

// FCM은 네이티브 모듈이므로 Expo Go에서는 no-op
// 프로덕션 빌드 시 @react-native-firebase/messaging 사용

export const FCMService = {
  getToken: async (): Promise<string> => 'expo-go-no-fcm',
  requestPermission: async (): Promise<boolean> => true,
  onMessage: (_callback: (message: any) => void): (() => void) => () => {},
  setBackgroundMessageHandler: (_handler: (message: any) => Promise<void>) => {},
  onNotificationOpenedApp: (_callback: (message: any) => void): (() => void) => () => {},
  getInitialNotification: async () => null,
  subscribeToTopic: async (_topic: string): Promise<void> => {},
  unsubscribeFromTopic: async (_topic: string): Promise<void> => {},
  saveTokenToFirestore: async (_uid: string): Promise<void> => {},
};

/* ─────────────── Analytics Service ─────────────── */

// JS SDK analytics (getAnalytics) — Expo Go에서는 console.log로 대체
export const AnalyticsService = {
  logScreenView: async (screenName: string): Promise<void> => {
    if (__DEV__) console.log('[Analytics] screen:', screenName);
  },
  logEvent: async (name: string, params?: Record<string, any>): Promise<void> => {
    if (__DEV__) console.log('[Analytics] event:', name, params);
  },
  setUserProperty: async (_name: string, _value: string): Promise<void> => {},
  setUserId: async (_userId: string): Promise<void> => {},

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

/* ─────────────── Crashlytics Service (프로덕션 빌드 전용) ─────────────── */

export const CrashlyticsService = {
  setUserId: async (_uid: string): Promise<void> => {},
  log: (_message: string): void => {},
  recordError: (_error: Error, _context?: string): void => {
    if (__DEV__) console.error('[Crashlytics]', _error);
  },
  setAttribute: async (_key: string, _value: string): Promise<void> => {},
};

/* ─────────────── Exports ─────────────── */

export { firebaseConfig };
