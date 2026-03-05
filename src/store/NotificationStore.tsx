import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'album_invite' | 'photo_added' | 'friend_request' | 'album_update' | 'reminder';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  avatarInitial: string;
  avatarColor: string;
  read: boolean;
  // Deep link data
  albumId?: string;
  friendId?: string;
  pageId?: string;
}

interface NotificationStoreContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationStoreContext = createContext<NotificationStoreContextType | null>(null);

let nextId = 1;

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'album_invite',
    title: '앨범 초대',
    message: '박서연님이 "우리의 1주년" 앨범에 초대했어요',
    time: new Date(Date.now() - 60 * 1000),
    avatarInitial: '서',
    avatarColor: '#B8818A',
    read: false,
    albumId: 'album-1',
  },
  {
    id: 'notif-2',
    type: 'photo_added',
    title: '사진 추가',
    message: '최민준님이 "졸업 앨범"에 사진 3장을 추가했어요',
    time: new Date(Date.now() - 3600 * 1000),
    avatarInitial: '민',
    avatarColor: '#7B8FA3',
    read: false,
    albumId: 'album-2',
  },
  {
    id: 'notif-3',
    type: 'friend_request',
    title: '친구 요청',
    message: '한소희님이 친구 요청을 보냈어요',
    time: new Date(Date.now() - 3600 * 3000),
    avatarInitial: '소',
    avatarColor: '#A898B8',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'album_update',
    title: '앨범 업데이트',
    message: '이미영님이 "가족 나들이" 앨범을 꾸몄어요',
    time: new Date(Date.now() - 86400 * 1000),
    avatarInitial: '미',
    avatarColor: '#C4919A',
    read: true,
    albumId: 'album-3',
  },
  {
    id: 'notif-5',
    type: 'reminder',
    title: '추억 알림',
    message: '1년 전 오늘, "제주 여행" 앨범을 만들었어요',
    time: new Date(Date.now() - 86400 * 2000),
    avatarInitial: '🎉',
    avatarColor: '#D4A855',
    read: true,
    albumId: 'album-4',
  },
];

export function NotificationStoreProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notif: Omit<AppNotification, 'id'>) => {
    const newNotif: AppNotification = { ...notif, id: `notif-${nextId++}` };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationStoreContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    }}>
      {children}
    </NotificationStoreContext.Provider>
  );
}

export function useNotificationStore() {
  const context = useContext(NotificationStoreContext);
  if (!context) throw new Error('useNotificationStore must be used within NotificationStoreProvider');
  return context;
}
