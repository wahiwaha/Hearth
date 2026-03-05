import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, MagnifyingGlass } from 'phosphor-react-native';
import { colors, typography, spacing } from '../theme';
import { Friend, FriendTag } from '../types/friend';
import { RootStackParamList } from '../types/navigation';
import { useFriendStore } from '../store/FriendStore';
import { IconButton, Avatar } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TAG_ORDER: FriendTag[] = ['가족', '연인', '친구', '직장', '기타'];

export function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { friends } = useFriendStore();

  const groupedFriends = useMemo(() => {
    const groups: Record<string, Friend[]> = {};
    for (const friend of friends) {
      if (!groups[friend.tag]) groups[friend.tag] = [];
      groups[friend.tag].push(friend);
    }
    return TAG_ORDER
      .filter((tag) => groups[tag] && groups[tag].length > 0)
      .map((tag) => ({ tag, friends: groups[tag] }));
  }, [friends]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FDFAF5', '#F7F2EA', '#F0E8DB', '#E8DFCF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hearth</Text>
          <Text style={styles.headerSubtitle}>
            {friends.length}명의 친구
          </Text>
        </View>
        <IconButton
          size={36}
          backgroundColor={colors.dustyRose}
          onPress={() => navigation.navigate('AddFriend')}
          style={styles.addButton}
        >
          <Plus size={18} color={colors.warmWhite} weight="bold" />
        </IconButton>
      </Animated.View>

      {/* Friend list grouped by tag */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {groupedFriends.map((group, groupIndex) => (
          <Animated.View
            key={group.tag}
            entering={FadeInDown.delay(200 + groupIndex * 100).duration(500)}
          >
            {/* Tag section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTag}>{group.tag}</Text>
              <View style={styles.sectionLine} />
            </View>

            {/* Friends in this tag */}
            {group.friends.map((friend) => (
              <Pressable
                key={friend.id}
                style={styles.friendRow}
                onPress={() => navigation.navigate('FriendProfile', { friendId: friend.id })}
              >
                <Avatar initial={friend.initial} color={friend.avatarColor} size={44} />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendSub}>
                    {friend.relation || friend.memo || ''}
                  </Text>
                </View>
                {!friend.isAppUser && (
                  <View style={styles.notOnAppBadge}>
                    <Text style={styles.notOnAppText}>미가입</Text>
                  </View>
                )}
                {friend.sharedAlbumCount && friend.sharedAlbumCount > 0 && (
                  <Text style={styles.sharedCount}>
                    {friend.sharedAlbumCount}앨범
                  </Text>
                )}
              </Pressable>
            ))}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: { width: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.title, color: colors.textPrimary, fontSize: 24 },
  headerSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addButton: {
    shadowColor: colors.dustyRose,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTag: { ...typography.label, color: colors.textSecondary, marginRight: 12 },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.textMuted, opacity: 0.25 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(155, 139, 123, 0.15)',
  },
  friendInfo: { flex: 1, marginLeft: 14 },
  friendName: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  friendSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  notOnAppBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(160, 149, 133, 0.1)',
    marginRight: 8,
  },
  notOnAppText: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  sharedCount: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
});
