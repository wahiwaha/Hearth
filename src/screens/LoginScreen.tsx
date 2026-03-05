import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen } from 'phosphor-react-native';
import { colors, typography, spacing } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/AuthStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { signInWithApple, signInWithGoogle, signInAnonymously, isLoading } = useAuthStore();

  const handleAppleLogin = useCallback(async () => {
    await signInWithApple();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [signInWithApple, navigation]);

  const handleGoogleLogin = useCallback(async () => {
    await signInWithGoogle();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [signInWithGoogle, navigation]);

  const handleGuest = useCallback(async () => {
    await signInAnonymously();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [signInAnonymously, navigation]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FDFAF5', '#F7F2EA', '#F0E8DB', '#E8DFCF']}
        style={StyleSheet.absoluteFill}
      />

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
              {/* Apple Login */}
              <Pressable style={[styles.loginBtn, styles.appleBtn]} onPress={handleAppleLogin}>
                <Text style={styles.appleBtnIcon}>🍎</Text>
                <Text style={styles.appleBtnText}>Apple로 계속하기</Text>
              </Pressable>

              {/* Google Login */}
              <Pressable style={[styles.loginBtn, styles.googleBtn]} onPress={handleGoogleLogin}>
                <Text style={styles.googleBtnIcon}>G</Text>
                <Text style={styles.googleBtnText}>Google로 계속하기</Text>
              </Pressable>

              {/* Guest */}
              <Pressable style={styles.guestBtn} onPress={handleGuest}>
                <Text style={styles.guestBtnText}>둘러보기</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginTop: 16,
  },
  logoSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 8,
  },
  spacer: { flex: 1 },
  loginButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  appleBtn: {
    backgroundColor: '#1C1208',
  },
  appleBtnIcon: { fontSize: 20 },
  appleBtnText: {
    ...typography.body,
    color: '#FAF6F0',
    fontWeight: '600',
  },
  googleBtn: {
    backgroundColor: colors.warmWhite,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  googleBtnIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestBtnText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '500',
  },
  terms: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
