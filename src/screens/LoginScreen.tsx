import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, ArrowLeft, EnvelopeSimple, Phone, AppleLogo } from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/AuthStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'main' | 'email' | 'phone';

export function LoginScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {
    signInWithApple, signInWithGoogle,
    signUpWithEmail, signInWithEmail, sendPhoneVerification, verifyPhoneCode,
    isLoading,
  } = useAuthStore();

  const [view, setView] = useState<ViewMode>('main');

  // Email state
  const [emailMode, setEmailMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const resetState = useCallback(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setPhoneNumber('');
    setVerificationId(null);
    setVerificationCode('');
  }, []);

  // ── Handlers ──

  const handleAppleLogin = useCallback(async () => {
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('로그인 실패', 'Apple 로그인 중 오류가 발생했습니다.');
      }
    }
  }, [signInWithApple]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('준비 중', 'Google 로그인은 곧 지원될 예정입니다.');
      }
    }
  }, [signInWithGoogle]);

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (emailMode === 'signUp' && !displayName.trim()) {
      Alert.alert('입력 오류', '이름을 입력해주세요.');
      return;
    }
    try {
      if (emailMode === 'signUp') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      const msg = getEmailErrorMessage(e?.code);
      Alert.alert('로그인 실패', msg);
    }
  }, [email, password, displayName, emailMode, signUpWithEmail, signInWithEmail]);

  const handleSendPhoneCode = useCallback(async () => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) {
      Alert.alert('입력 오류', '올바른 전화번호를 입력해주세요.');
      return;
    }
    const e164 = cleaned.startsWith('0')
      ? `+82${cleaned.substring(1)}`
      : `+82${cleaned}`;
    setPhoneSending(true);
    try {
      const vId = await sendPhoneVerification(e164);
      setVerificationId(vId);
      Alert.alert('인증번호 발송', '문자로 전송된 인증번호를 입력해주세요.');
    } catch (e: any) {
      const msg = e?.message?.includes('reCAPTCHA') || e?.message?.includes('recaptcha')
        ? '개발 모드에서는 Firebase Console에 등록된 테스트 전화번호만 사용 가능합니다.\n\nFirebase Console → Authentication → Phone → 테스트용 전화번호에서 등록해주세요.'
        : (e?.message || '전화번호 인증 중 오류가 발생했습니다.');
      Alert.alert('인증 실패', msg);
    } finally {
      setPhoneSending(false);
    }
  }, [phoneNumber, sendPhoneVerification]);

  const handleVerifyCode = useCallback(async () => {
    if (!verificationId || verificationCode.length < 6) {
      Alert.alert('입력 오류', '6자리 인증번호를 입력해주세요.');
      return;
    }
    try {
      await verifyPhoneCode(verificationId, verificationCode);
    } catch {
      Alert.alert('인증 실패', '인증번호가 올바르지 않습니다. 다시 시도해주세요.');
    }
  }, [verificationId, verificationCode, verifyPhoneCode]);

  // ── Render helpers ──

  const renderBackground = () => (
    <>
      <LinearGradient
        colors={['#F8F2EA', '#F5EDE4', '#EAE0D4']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255, 250, 242, 0.6)', 'rgba(255, 250, 242, 0)']}
        style={styles.ambientGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </>
  );

  const renderBackButton = () => (
    <Pressable
      style={[styles.backBtn, { top: insets.top + 12 }]}
      onPress={() => { setView('main'); resetState(); }}
      hitSlop={12}
    >
      <ArrowLeft size={24} color={colors.textPrimary} weight="bold" />
    </Pressable>
  );

  // ── Main View ──

  if (view === 'main') {
    return (
      <View style={styles.root}>
        {renderBackground()}
        <View style={[styles.content, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 }]}>
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.logoContainer}>
            <BookOpen size={56} color={colors.accent} weight="duotone" />
            <Text style={styles.logoTitle}>Hearth</Text>
            <Text style={styles.logoSubtitle}>디지털로 만드는 아날로그 앨범</Text>
          </Animated.View>

          <View style={styles.spacer} />

          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.loginButtons}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.accent} />
            ) : (
              <>
                {Platform.OS === 'ios' && (
                  <Pressable style={[styles.loginBtn, styles.appleBtn]} onPress={handleAppleLogin}>
                    <AppleLogo size={20} color="#FAF6F0" weight="fill" />
                    <Text style={styles.appleBtnText}>Apple로 계속하기</Text>
                  </Pressable>
                )}

                <Pressable style={[styles.loginBtn, styles.googleBtn]} onPress={handleGoogleLogin}>
                  <Text style={styles.googleBtnIcon}>G</Text>
                  <Text style={styles.googleBtnText}>Google로 계속하기</Text>
                </Pressable>

                <Pressable style={[styles.loginBtn, styles.emailBtn]} onPress={() => setView('email')}>
                  <EnvelopeSimple size={20} color={colors.textPrimary} weight="bold" />
                  <Text style={styles.emailBtnText}>이메일로 계속하기</Text>
                </Pressable>

                <Pressable style={[styles.loginBtn, styles.phoneBtn]} onPress={() => setView('phone')}>
                  <Phone size={20} color="#FAF6F0" weight="bold" />
                  <Text style={styles.phoneBtnText}>전화번호로 계속하기</Text>
                </Pressable>

              </>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <Text style={styles.terms}>
              계속하면 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Email View ──

  if (view === 'email') {
    return (
      <View style={styles.root}>
        {renderBackground()}
        {renderBackButton()}
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.formContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeIn.duration(400)} style={styles.formHeader}>
              <EnvelopeSimple size={40} color={colors.accent} weight="duotone" />
              <Text style={styles.formTitle}>
                {emailMode === 'signIn' ? '이메일 로그인' : '회원가입'}
              </Text>
            </Animated.View>

            {emailMode === 'signUp' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <TextInput
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="이름을 입력하세요"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이메일</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <TextInput
                ref={passwordRef}
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="6자 이상"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleEmailSubmit}
              />
            </View>

            <Pressable
              style={[styles.loginBtn, styles.submitBtn]}
              onPress={handleEmailSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FAF6F0" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {emailMode === 'signIn' ? '로그인' : '회원가입'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.toggleBtn}
              onPress={() => setEmailMode(m => m === 'signIn' ? 'signUp' : 'signIn')}
            >
              <Text style={styles.toggleText}>
                {emailMode === 'signIn'
                  ? '계정이 없으신가요? 회원가입'
                  : '이미 계정이 있으신가요? 로그인'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Phone View ──

  return (
    <View style={styles.root}>
      {renderBackground()}
      {renderBackButton()}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.formContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(400)} style={styles.formHeader}>
            <Phone size={40} color={colors.accent} weight="duotone" />
            <Text style={styles.formTitle}>전화번호 인증</Text>
          </Animated.View>

          {!verificationId ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>전화번호</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+82</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.phoneInput]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="010-1234-5678"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.loginBtn, styles.submitBtn]}
                onPress={handleSendPhoneCode}
                disabled={phoneSending}
              >
                {phoneSending ? (
                  <ActivityIndicator color="#FAF6F0" />
                ) : (
                  <Text style={styles.submitBtnText}>인증번호 받기</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>인증번호</Text>
                <TextInput
                  style={styles.textInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="6자리 인증번호"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyCode}
                />
              </View>

              <Pressable
                style={[styles.loginBtn, styles.submitBtn]}
                onPress={handleVerifyCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FAF6F0" />
                ) : (
                  <Text style={styles.submitBtnText}>확인</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.toggleBtn}
                onPress={() => {
                  setVerificationId(null);
                  setVerificationCode('');
                }}
              >
                <Text style={styles.toggleText}>인증번호 다시 받기</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Firebase Auth 에러 코드 -> 한국어 메시지 */
function getEmailErrorMessage(code?: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/invalid-email':
      return '올바른 이메일 형식이 아닙니다.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 합니다.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/too-many-requests':
      return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '로그인 중 오류가 발생했습니다.';
  }
}

const createStyles = (c: ReturnType<typeof useColors>) => ({
  root: { flex: 1 } as const,
  ambientGlow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '40%' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center' as const,
  },
  logoContainer: {
    alignItems: 'center' as const,
  },
  logoTitle: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: c.accent,
    letterSpacing: -1.5,
    marginTop: 16,
  },
  logoSubtitle: {
    ...typography.body,
    color: c.textSecondary,
    marginTop: 8,
  },
  spacer: { flex: 1 } as const,
  loginButtons: {
    width: '100%' as const,
    gap: 10,
    marginBottom: 24,
  },
  loginBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 15,
    borderRadius: 14,
    gap: 10,
  },
  appleBtn: {
    backgroundColor: '#3C2E20',
  },
  appleBtnText: {
    ...typography.body,
    color: '#FAF6F0',
    fontWeight: '600' as const,
  },
  googleBtn: {
    backgroundColor: 'rgba(255, 250, 242, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180, 160, 130, 0.18)',
  },
  googleBtnIcon: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#4285F4',
  },
  googleBtnText: {
    ...typography.body,
    color: c.textPrimary,
    fontWeight: '600' as const,
  },
  emailBtn: {
    backgroundColor: 'rgba(255, 250, 242, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180, 160, 130, 0.18)',
  },
  emailBtnText: {
    ...typography.body,
    color: c.textPrimary,
    fontWeight: '600' as const,
  },
  phoneBtn: {
    backgroundColor: '#5D8CAA',
  },
  phoneBtnText: {
    ...typography.body,
    color: '#FAF6F0',
    fontWeight: '600' as const,
  },
  terms: {
    ...typography.caption,
    color: c.textMuted,
    textAlign: 'center' as const,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  // ── Back button ──
  backBtn: {
    position: 'absolute' as const,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 250, 242, 0.85)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  // ── Form styles ──
  formContent: {
    paddingHorizontal: 32,
    flexGrow: 1,
  },
  formHeader: {
    alignItems: 'center' as const,
    marginBottom: 36,
    gap: 12,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: c.textPrimary,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...typography.caption,
    color: c.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 250, 242, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180, 160, 130, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: c.textPrimary,
  },
  phoneInputRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  phonePrefix: {
    backgroundColor: 'rgba(255, 250, 242, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180, 160, 130, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center' as const,
  },
  phonePrefixText: {
    fontSize: 16,
    color: c.textSecondary,
    fontWeight: '600' as const,
  },
  phoneInput: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: c.accent,
    marginTop: 8,
  },
  submitBtnText: {
    ...typography.body,
    color: '#FAF6F0',
    fontWeight: '700' as const,
    fontSize: 17,
  },
  toggleBtn: {
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  toggleText: {
    ...typography.body,
    color: c.accent,
    fontWeight: '600' as const,
  },
});
