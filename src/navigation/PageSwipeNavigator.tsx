import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { HearthScreen } from '../screens/HearthScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { MyPageScreen } from '../screens/MyPageScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScreenItem {
  key: string;
  component: React.ComponentType;
}

const screens: ScreenItem[] = [
  { key: 'hearth', component: HearthScreen },
  { key: 'friends', component: FriendsScreen },
  { key: 'mypage', component: MyPageScreen },
];

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList<ScreenItem>,
);

export function PageSwipeNavigator() {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList<ScreenItem>>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderScreen = useCallback(
    ({ item }: ListRenderItemInfo<ScreenItem>) => {
      const ScreenComponent = item.component;
      return (
        <View style={styles.screenContainer}>
          <ScreenComponent />
        </View>
      );
    },
    [],
  );

  const keyExtractor = useCallback((item: ScreenItem) => item.key, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderScreen}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
