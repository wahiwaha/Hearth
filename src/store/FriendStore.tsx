import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Friend, FriendTag } from '../types/friend';
import { FirestoreService, AnalyticsService } from '../services/firebase';
import { useAuthStore } from './AuthStore';
import { dummyFriends } from '../utils/dummyFriends';

interface FriendStoreContextType {
  friends: Friend[];
  getFriend: (id: string) => Friend | undefined;
  addFriend: (friend: Omit<Friend, 'id'>) => Friend;
  updateFriend: (id: string, updates: Partial<Friend>) => void;
  deleteFriend: (id: string) => void;
  getFriendsByTag: (tag: FriendTag) => Friend[];
  searchFriends: (query: string) => Friend[];
}

const FriendStoreContext = createContext<FriendStoreContextType | null>(null);

let nextId = 100;

export function FriendStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<Friend[]>(dummyFriends);

  // Firestore 실시간 구독
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = FirestoreService.subscribeToFriends(user.uid, (serverFriends) => {
      if (serverFriends.length > 0) {
        setFriends(serverFriends as Friend[]);
      }
    });
    return unsub;
  }, [user?.uid]);

  const friendMap = useMemo(() => new Map(friends.map(f => [f.id, f])), [friends]);

  const getFriend = useCallback((id: string) => {
    return friendMap.get(id);
  }, [friendMap]);

  const addFriend = useCallback((friend: Omit<Friend, 'id'>): Friend => {
    const newFriend: Friend = { ...friend, id: `friend-${nextId++}` };
    setFriends(prev => [...prev, newFriend]);
    if (user?.uid) {
      FirestoreService.addFriend(user.uid, friend).catch(() => {});
      AnalyticsService.logEvent(AnalyticsService.Events.FRIEND_ADDED, { tag: friend.tag });
    }
    return newFriend;
  }, [user?.uid]);

  const updateFriend = useCallback((id: string, updates: Partial<Friend>) => {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    if (user?.uid) {
      FirestoreService.updateFriend(user.uid, id, updates).catch(() => {});
    }
  }, [user?.uid]);

  const deleteFriend = useCallback((id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));
    if (user?.uid) {
      FirestoreService.deleteFriend(user.uid, id).catch(() => {});
    }
  }, [user?.uid]);

  const getFriendsByTag = useCallback((tag: FriendTag) => {
    return friends.filter(f => f.tag === tag);
  }, [friends]);

  const searchFriends = useCallback((query: string) => {
    const q = query.toLowerCase();
    return friends.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.memo?.toLowerCase().includes(q) ||
      f.relation?.toLowerCase().includes(q)
    );
  }, [friends]);

  return (
    <FriendStoreContext.Provider value={{
      friends,
      getFriend,
      addFriend,
      updateFriend,
      deleteFriend,
      getFriendsByTag,
      searchFriends,
    }}>
      {children}
    </FriendStoreContext.Provider>
  );
}

export function useFriendStore() {
  const context = useContext(FriendStoreContext);
  if (!context) throw new Error('useFriendStore must be used within FriendStoreProvider');
  return context;
}
