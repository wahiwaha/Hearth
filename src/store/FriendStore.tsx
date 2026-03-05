import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Friend, FriendTag } from '../types/friend';
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
  const [friends, setFriends] = useState<Friend[]>(dummyFriends);

  const getFriend = useCallback((id: string) => {
    return friends.find(f => f.id === id);
  }, [friends]);

  const addFriend = useCallback((friend: Omit<Friend, 'id'>): Friend => {
    const newFriend: Friend = { ...friend, id: `friend-${nextId++}` };
    setFriends(prev => [...prev, newFriend]);
    return newFriend;
  }, []);

  const updateFriend = useCallback((id: string, updates: Partial<Friend>) => {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const deleteFriend = useCallback((id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));
  }, []);

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
