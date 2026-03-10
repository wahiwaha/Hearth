import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useColors } from '../store/ThemeStore';
import { PageSwipeNavigator } from './PageSwipeNavigator';
import { CreateAlbumScreen } from '../screens/CreateAlbumScreen';
import { AlbumViewerScreen } from '../screens/AlbumViewerScreen';
import { AlbumEditorScreen } from '../screens/AlbumEditorScreen';
import { AlbumSettingsScreen } from '../screens/AlbumSettingsScreen';
import { AlbumImportScreen } from '../screens/AlbumImportScreen';
import { PhotoDetailScreen } from '../screens/PhotoDetailScreen';
import { PhotoCropScreen } from '../screens/PhotoCropScreen';
import { FriendProfileScreen } from '../screens/FriendProfileScreen';
import { AddFriendScreen } from '../screens/AddFriendScreen';
import { InviteCollaboratorScreen } from '../screens/InviteCollaboratorScreen';
import { PageManagerScreen } from '../screens/PageManagerScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { TemplateGalleryScreen } from '../screens/TemplateGalleryScreen';
import { ThemeSettingsScreen } from '../screens/ThemeSettingsScreen';
import { LanguageSettingsScreen } from '../screens/LanguageSettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const colors = useColors();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Main tabs */}
        <Stack.Screen name="Main" component={PageSwipeNavigator} />

        {/* Auth */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animation: 'fade' }}
        />

        {/* Album flows */}
        <Stack.Screen
          name="CreateAlbum"
          component={CreateAlbumScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="AlbumViewer" component={AlbumViewerScreen} />
        <Stack.Screen
          name="AlbumEditor"
          component={AlbumEditorScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="AlbumSettings"
          component={AlbumSettingsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="AlbumImport"
          component={AlbumImportScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* Photo */}
        <Stack.Screen
          name="PhotoDetail"
          component={PhotoDetailScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="PhotoCrop"
          component={PhotoCropScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* Friend */}
        <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
        <Stack.Screen
          name="AddFriend"
          component={AddFriendScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* Collaboration */}
        <Stack.Screen
          name="InviteCollaborator"
          component={InviteCollaboratorScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* Page management */}
        <Stack.Screen name="PageManager" component={PageManagerScreen} />

        {/* Templates */}
        <Stack.Screen
          name="TemplateGallery"
          component={TemplateGalleryScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* Notifications */}
        <Stack.Screen name="Notifications" component={NotificationsScreen} />

        {/* Settings */}
        <Stack.Screen
          name="ThemeSettings"
          component={ThemeSettingsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="LanguageSettings"
          component={LanguageSettingsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
