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
import { CapsulePageIndicator } from '../components/CapsulePageIndicator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScreenItem {
  key: string;
  component: React.ComponentType;
}

// Order: Friends(Hearth) ← Archive(center) → MyPage
const screens: ScreenItem[] = [
  { key: 'friends', component: FriendsScreen },
  { key: 'archive', component: HearthScreen },
  { key: 'mypage', component: MyPageScreen },
];

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList<ScreenItem>,
);

export function PageSwipeNavigator() {
  const scrollX = useSharedValue(0);
  const isScrolling = useSharedValue(false);
  const flatListRef = useRef<FlatList<ScreenItem>>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onBeginDrag: () => {
      isScrolling.value = true;
    },
    onEndDrag: () => {
      isScrolling.value = false;
    },
    onMomentumEnd: () => {
      isScrolling.value = false;
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
        initialScrollIndex={1}
      />
      <CapsulePageIndicator scrollX={scrollX} isScrolling={isScrolling} />
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
