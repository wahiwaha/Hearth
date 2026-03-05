import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PageSwipeNavigator } from './src/navigation/PageSwipeNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <PageSwipeNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
