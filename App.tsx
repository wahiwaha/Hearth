import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlbumStoreProvider } from './src/store/AlbumStore';
import { FriendStoreProvider } from './src/store/FriendStore';
import { ThemeStoreProvider } from './src/store/ThemeStore';
import { AuthStoreProvider } from './src/store/AuthStore';
import { NotificationStoreProvider } from './src/store/NotificationStore';
import { TemplateStoreProvider } from './src/store/TemplateStore';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeStoreProvider>
          <AuthStoreProvider>
            <AlbumStoreProvider>
              <FriendStoreProvider>
                <NotificationStoreProvider>
                  <TemplateStoreProvider>
                    <StatusBar style="dark" />
                    <RootNavigator />
                  </TemplateStoreProvider>
                </NotificationStoreProvider>
              </FriendStoreProvider>
            </AlbumStoreProvider>
          </AuthStoreProvider>
        </ThemeStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
