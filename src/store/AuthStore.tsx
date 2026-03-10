import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthService, FirestoreService, AnalyticsService, CrashlyticsService, FCMService } from '../services/firebase';
import { GoogleAuthProvider, type User as FBUser } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '125887430824-lnk7qb2tv7jto25ruue3lai04lrgp1c9.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '185762543551-uenaf3ai3anrl90eu0a0c7n2fm9juq5d.apps.googleusercontent.com';

export interface User {
  uid: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  coverURL?: string;
  initial: string;
  avatarColor: string;
  provider: 'apple' | 'google' | 'email' | 'phone' | 'anonymous';
  createdAt: Date;
  onboardingComplete: boolean;
}

interface AuthStoreContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPhoneVerification: (phoneNumber: string) => Promise<string>;
  verifyPhoneCode: (verificationId: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
}

const AuthStoreContext = createContext<AuthStoreContextType | null>(null);

const getInitial = (name?: string | null) => name ? name[0] : '?';

const AVATAR_COLORS = ['#859C78', '#8B7560', '#C4919A', '#7B8FA3', '#B8818A', '#A898B8', '#5D8CAA', '#C4A07A'];
const randomAvatarColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

/** Firestore에 undefined 값 제거 (Firestore는 undefined를 허용하지 않음) */
const stripUndefined = (obj: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};

/** Firebase User -> App User */
const firebaseUserToAppUser = (fbUser: FBUser, extra?: Partial<User>): User => {
  const providerData = fbUser.providerData[0];
  const providerId = providerData?.providerId;
  let provider: User['provider'] = 'anonymous';
  if (providerId === 'apple.com') provider = 'apple';
  else if (providerId === 'google.com') provider = 'google';
  else if (providerId === 'password') provider = 'email';
  else if (providerId === 'phone') provider = 'phone';

  return {
    uid: fbUser.uid,
    displayName: fbUser.displayName || '사용자',
    email: fbUser.email || undefined,
    phoneNumber: fbUser.phoneNumber || undefined,
    photoURL: fbUser.photoURL || undefined,
    initial: getInitial(fbUser.displayName),
    avatarColor: randomAvatarColor(),
    provider,
    createdAt: new Date(fbUser.metadata.creationTime || Date.now()),
    onboardingComplete: false,
    ...extra,
  };
};

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // 로컬 프로필 업데이트 후 백그라운드 fetch가 덮어쓰지 않도록 보호
  const localUpdateTimestamp = React.useRef(0);

  // Google Auth Session
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  // Google 로그인 응답 처리
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        setIsLoading(true);
        AuthService.signInWithCredential(credential).catch((e) => {
          setIsLoading(false);
          console.error('Google sign-in error:', e);
        });
      }
    }
  }, [googleResponse]);

  // Firebase Auth 상태 변경 리스너 — 즉시 user 설정 후 Firestore 비동기 보강
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        // 1단계: Firebase Auth 데이터만으로 즉시 user 설정 → UI 즉시 전환
        const quickUser = firebaseUserToAppUser(fbUser);
        setUser(quickUser);
        setIsLoading(false);

        // 2단계: Firestore 프로필을 백그라운드에서 보강
        const fetchStart = Date.now();
        FirestoreService.getUserProfile(fbUser.uid).then((profile) => {
          // 로컬 업데이트가 이 fetch 이후에 발생했으면 덮어쓰지 않음
          if (localUpdateTimestamp.current > fetchStart) return;
          if (profile) {
            setUser({
              uid: fbUser.uid,
              displayName: profile.displayName || fbUser.displayName || '사용자',
              email: profile.email || fbUser.email || undefined,
              phoneNumber: profile.phoneNumber || fbUser.phoneNumber || undefined,
              photoURL: profile.photoURL || fbUser.photoURL || undefined,
              coverURL: profile.coverURL || undefined,
              initial: profile.initial || getInitial(fbUser.displayName),
              avatarColor: profile.avatarColor || randomAvatarColor(),
              provider: profile.provider || 'anonymous',
              createdAt: profile.createdAt?.toDate ? profile.createdAt.toDate() : new Date(),
              onboardingComplete: profile.onboardingComplete ?? false,
            });
          } else {
            // 새 유저 — 프로필 생성 (비동기, UI 안 막음)
            FirestoreService.setUserProfile(fbUser.uid, stripUndefined({
              displayName: quickUser.displayName,
              email: quickUser.email,
              phoneNumber: quickUser.phoneNumber,
              photoURL: quickUser.photoURL,
              initial: quickUser.initial,
              avatarColor: quickUser.avatarColor,
              provider: quickUser.provider,
              createdAt: new Date(),
              onboardingComplete: false,
            })).catch(() => {});
          }
        }).catch(() => {});

        // 3단계: 부가 서비스 비동기 처리
        AnalyticsService.setUserId(fbUser.uid);
        CrashlyticsService.setUserId(fbUser.uid);
        FCMService.saveTokenToFirestore(fbUser.uid).catch(() => {});
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Apple Sign-In
  const signInWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
      );
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!appleCredential.identityToken) throw new Error('Apple 로그인 실패');
      const credential = AuthService.createAppleCredential(
        appleCredential.identityToken,
        nonce,
      );
      await AuthService.signInWithCredential(credential);
    } catch (e: any) {
      setIsLoading(false);
      if (e.code !== 'ERR_REQUEST_CANCELED') throw e;
    }
  }, []);

  // Google Sign-In
  const signInWithGoogle = useCallback(async () => {
    if (!promptGoogleAsync) throw new Error('Google 로그인을 초기화할 수 없습니다.');
    await promptGoogleAsync();
  }, [promptGoogleAsync]);

  // Email Sign-Up
  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      await AuthService.signUpWithEmail(email, password);
      await AuthService.updateProfile({ displayName });
      await AuthService.sendEmailVerification();
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  }, []);

  // Email Sign-In
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await AuthService.signInWithEmail(email, password);
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  }, []);

  // Phone verification - send code
  const sendPhoneVerification = useCallback(async (phoneNumber: string): Promise<string> => {
    return AuthService.sendPhoneVerification(phoneNumber);
  }, []);

  // Phone Sign-In - verify code
  const verifyPhoneCode = useCallback(async (verificationId: string, code: string) => {
    setIsLoading(true);
    try {
      const credential = AuthService.createPhoneCredential(verificationId, code);
      await AuthService.signInWithCredential(credential);
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    localUpdateTimestamp.current = Date.now();
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      // 사이드 이펙트는 setState 밖에서 처리
      return updated;
    });
    // Firestore + Auth 업데이트 (비동기, UI 안 막음)
    const uid = user?.uid;
    if (uid) {
      FirestoreService.setUserProfile(uid, stripUndefined(updates)).catch(() => {});
      if (updates.displayName || updates.photoURL) {
        AuthService.updateProfile(stripUndefined({
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        })).catch(() => {});
      }
    }
  }, [user?.uid]);

  const completeOnboarding = useCallback(() => {
    setUser(prev => {
      if (!prev) return null;
      FirestoreService.setUserProfile(prev.uid, { onboardingComplete: true }).catch(() => {});
      AnalyticsService.logEvent('onboarding_completed');
      return { ...prev, onboardingComplete: true };
    });
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    signInWithApple,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPhoneVerification,
    verifyPhoneCode,
    signOut,
    updateProfile,
    completeOnboarding,
  }), [user, isLoading, signInWithApple, signInWithGoogle, signUpWithEmail, signInWithEmail, sendPhoneVerification, verifyPhoneCode, signOut, updateProfile, completeOnboarding]);

  return (
    <AuthStoreContext.Provider value={contextValue}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthStore() {
  const context = useContext(AuthStoreContext);
  if (!context) throw new Error('useAuthStore must be used within AuthStoreProvider');
  return context;
}
