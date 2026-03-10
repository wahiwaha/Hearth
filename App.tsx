import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlbumStoreProvider } from './src/store/AlbumStore';
import { FriendStoreProvider } from './src/store/FriendStore';
import { ThemeStoreProvider, useIsDark } from './src/store/ThemeStore';
import { AuthStoreProvider } from './src/store/AuthStore';
import { NotificationStoreProvider } from './src/store/NotificationStore';
import { TemplateStoreProvider } from './src/store/TemplateStore';
import { LanguageStoreProvider } from './src/store/LanguageStore';
import { RootNavigator } from './src/navigation/RootNavigator';

const styles = StyleSheet.create({
  root: { flex: 1 },
});

function AppContent() {
  const isDark = useIsDark();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LanguageStoreProvider>
        <ThemeStoreProvider>
          <AuthStoreProvider>
            <AlbumStoreProvider>
              <FriendStoreProvider>
                <NotificationStoreProvider>
                  <TemplateStoreProvider>
                    <AppContent />
                  </TemplateStoreProvider>
                </NotificationStoreProvider>
              </FriendStoreProvider>
            </AlbumStoreProvider>
          </AuthStoreProvider>
        </ThemeStoreProvider>
        </LanguageStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
