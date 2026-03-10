import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { Album, AlbumPage, PageElement, VisibilityLevel, ImportedAlbumRef } from '../types/album';
import { FirestoreService, StorageService, AnalyticsService } from '../services/firebase';
import { useAuthStore } from './AuthStore';
import { dummyAlbums } from '../utils/dummyAlbums';

interface AlbumStoreContextType {
  albums: Album[];
  deletedAlbums: Album[];
  pinnedAlbumId: string | null;
  isLoading: boolean;
  getAlbum: (id: string) => Album | undefined;
  createAlbum: (title: string, coverColor: string, spineColor: string) => Album;
  updateAlbum: (id: string, updates: Partial<Album>) => void;
  deleteAlbum: (id: string) => void;
  restoreAlbum: (id: string) => void;
  permanentlyDeleteAlbum: (id: string) => void;
  pinAlbum: (id: string | null) => void;
  duplicateAlbum: (id: string) => Album | undefined;
  addPage: (albumId: string, afterPageId?: string) => AlbumPage | undefined;
  deletePage: (albumId: string, pageId: string) => void;
  reorderPages: (albumId: string, pageIds: string[]) => void;
  updatePage: (albumId: string, pageId: string, updates: Partial<AlbumPage>) => void;
  addElement: (albumId: string, pageId: string, element: Omit<PageElement, 'id'>) => PageElement | undefined;
  updateElement: (albumId: string, pageId: string, elementId: string, updates: Partial<PageElement>) => void;
  deleteElement: (albumId: string, pageId: string, elementId: string) => void;
  batchUpdateElements: (albumId: string, pageId: string, elements: PageElement[]) => void;
  setVisibility: (albumId: string, visibility: VisibilityLevel) => void;
  addCollaborator: (albumId: string, friendId: string, name: string, initial: string, avatarColor: string) => void;
  removeCollaborator: (albumId: string, collaboratorId: string) => void;
  importAlbum: (targetAlbumId: string, sourceAlbumId: string, position: 'start' | 'end' | number, mode: 'copy' | 'link') => void;
  removeImportedAlbum: (targetAlbumId: string, refId: string) => void;
  setLastViewedPage: (albumId: string, pageId: string) => void;
}

const AlbumStoreContext = createContext<AlbumStoreContextType | null>(null);

let nextId = 100;
const genId = (prefix: string) => `${prefix}-${nextId++}`;

export function AlbumStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [albums, setAlbums] = useState<Album[]>(dummyAlbums);
  const [deletedAlbums, setDeletedAlbums] = useState<Album[]>([]);
  const [pinnedAlbumId, setPinnedAlbumId] = useState<string | null>(dummyAlbums[0]?.id || null);
  const [isLoading, setIsLoading] = useState(false);

  // Map 기반 O(1) 앨범 조회
  const albumMap = useMemo(() => new Map(albums.map(a => [a.id, a])), [albums]);

  // Firestore 실시간 구독 — 로그인 시 서버 데이터 사용, 삭제 앨범은 지연 구독
  const deletedSubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setIsLoading(true);

    const unsubAlbums = FirestoreService.subscribeToUserAlbums(user.uid, (serverAlbums) => {
      if (serverAlbums.length > 0) {
        setAlbums(serverAlbums as Album[]);
      }
      setIsLoading(false);

      // 삭제 앨범 구독은 메인 앨범 로딩 후 지연 시작
      if (!deletedSubRef.current) {
        deletedSubRef.current = FirestoreService.subscribeToDeletedAlbums(user.uid, (deleted) => {
          setDeletedAlbums(deleted as Album[]);
        });
      }
    });

    return () => {
      unsubAlbums();
      deletedSubRef.current?.();
      deletedSubRef.current = null;
    };
  }, [user?.uid]);

  const getAlbum = useCallback((id: string) => {
    return albumMap.get(id);
  }, [albumMap]);

  const createAlbum = useCallback((title: string, coverColor: string, spineColor: string): Album => {
    const id = genId('album');
    const now = new Date();
    const pages: AlbumPage[] = [
      { id: genId('page'), pageNumber: 0, backgroundColor: '#FDFAF5', elements: [], createdAt: now, updatedAt: now },
      { id: genId('page'), pageNumber: 1, backgroundColor: '#FDFAF5', elements: [], createdAt: now, updatedAt: now },
      { id: genId('page'), pageNumber: 2, backgroundColor: '#F7F2EA', elements: [], createdAt: now, updatedAt: now },
    ];
    const newAlbum: Album = {
      id, title, coverColor, spineColor,
      pageCount: 3, createdAt: now, updatedAt: now,
      isShared: false, visibility: 'private', pages,
    };
    setAlbums(prev => [newAlbum, ...prev]);

    // Firestore에 저장
    if (user?.uid) {
      FirestoreService.createAlbum({
        ...newAlbum,
        memberIds: [user.uid],
        ownerId: user.uid,
        deletedAt: null,
      }).catch(() => {});
      AnalyticsService.logEvent(AnalyticsService.Events.ALBUM_CREATED, { title });
    }

    return newAlbum;
  }, [user?.uid]);

  const updateAlbum = useCallback((id: string, updates: Partial<Album>) => {
    setAlbums(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a));
    FirestoreService.updateAlbum(id, updates).catch(() => {});
  }, []);

  const deleteAlbum = useCallback((id: string) => {
    setAlbums(prev => {
      const album = prev.find(a => a.id === id);
      if (album) setDeletedAlbums(d => [album, ...d]);
      return prev.filter(a => a.id !== id);
    });
    setPinnedAlbumId(prev => prev === id ? null : prev);
    FirestoreService.deleteAlbum(id).catch(() => {});
  }, []);

  const restoreAlbum = useCallback((id: string) => {
    setDeletedAlbums(prev => {
      const album = prev.find(a => a.id === id);
      if (album) setAlbums(a => [album, ...a]);
      return prev.filter(a => a.id !== id);
    });
    FirestoreService.updateAlbum(id, { deletedAt: null }).catch(() => {});
  }, []);

  const permanentlyDeleteAlbum = useCallback((id: string) => {
    setDeletedAlbums(prev => prev.filter(a => a.id !== id));
    FirestoreService.permanentlyDeleteAlbum(id).catch(() => {});
  }, []);

  const pinAlbum = useCallback((id: string | null) => {
    setPinnedAlbumId(id);
    if (user?.uid) {
      FirestoreService.setUserProfile(user.uid, { pinnedAlbumId: id }).catch(() => {});
    }
  }, [user?.uid]);

  const duplicateAlbum = useCallback((id: string): Album | undefined => {
    const source = albums.find(a => a.id === id);
    if (!source) return undefined;
    const now = new Date();
    const newPages = (source.pages || []).map(p => ({
      ...p,
      id: genId('page'),
      elements: p.elements.map(el => ({ ...el, id: genId('el') })),
      createdAt: now,
      updatedAt: now,
    }));
    const newAlbum: Album = {
      ...source,
      id: genId('album'),
      title: `${source.title} (복사본)`,
      pages: newPages,
      pageCount: newPages.length,
      createdAt: now,
      updatedAt: now,
      isShared: false,
      collaborators: undefined,
      memberCount: undefined,
    };
    setAlbums(prev => [newAlbum, ...prev]);
    if (user?.uid) {
      FirestoreService.createAlbum({
        ...newAlbum,
        memberIds: [user.uid],
        ownerId: user.uid,
        deletedAt: null,
      }).catch(() => {});
    }
    return newAlbum;
  }, [albums, user?.uid]);

  const addPage = useCallback((albumId: string, afterPageId?: string): AlbumPage | undefined => {
    const now = new Date();
    const newPage: AlbumPage = {
      id: genId('page'), pageNumber: 0,
      backgroundColor: '#FDFAF5', elements: [],
      createdAt: now, updatedAt: now,
    };
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pages = [...(album.pages || [])];
      if (afterPageId) {
        const idx = pages.findIndex(p => p.id === afterPageId);
        pages.splice(idx + 1, 0, newPage);
      } else {
        pages.push(newPage);
      }
      pages.forEach((p, i) => { p.pageNumber = i; });
      return { ...album, pages, pageCount: pages.length, updatedAt: now };
    }));
    AnalyticsService.logEvent(AnalyticsService.Events.PAGE_ADDED, { albumId });
    return newPage;
  }, []);

  const deletePage = useCallback((albumId: string, pageId: string) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pages = (album.pages || []).filter(p => p.id !== pageId);
      pages.forEach((p, i) => { p.pageNumber = i; });
      return { ...album, pages, pageCount: pages.length, updatedAt: new Date() };
    }));
  }, []);

  const reorderPages = useCallback((albumId: string, pageIds: string[]) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pageMap = new Map((album.pages || []).map(p => [p.id, p]));
      const reordered = pageIds.map((id, i) => {
        const page = pageMap.get(id)!;
        return { ...page, pageNumber: i };
      });
      return { ...album, pages: reordered, updatedAt: new Date() };
    }));
  }, []);

  const updatePage = useCallback((albumId: string, pageId: string, updates: Partial<AlbumPage>) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pages = (album.pages || []).map(p =>
        p.id === pageId ? { ...p, ...updates, updatedAt: new Date() } : p
      );
      return { ...album, pages, updatedAt: new Date() };
    }));
  }, []);

  const addElement = useCallback((albumId: string, pageId: string, element: Omit<PageElement, 'id'>): PageElement | undefined => {
    const newElement: PageElement = { ...element, id: genId('el') };
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pages = (album.pages || []).map(p => {
        if (p.id !== pageId) return p;
        return { ...p, elements: [...p.elements, newElement], updatedAt: new Date() };
      });
      return { ...album, pages, updatedAt: new Date() };
    }));
    if (element.type === 'photo') AnalyticsService.logEvent(AnalyticsService.Events.PHOTO_ADDED, { albumId });
    else if (element.type === 'sticker') AnalyticsService.logEvent(AnalyticsService.Events.STICKER_PLACED, { albumId });
    else if (element.type === 'text') AnalyticsService.logEvent(AnalyticsService.Events.TEXT_ADDED, { albumId });
    return newElement;
  }, []);

  const updateElement = useCallback((albumId: string, pageId: string, elementId: string, updates: Partial<PageElement>) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pages = (album.pages || []).map(p => {
        if (p.id !== pageId) return p;
        const elements = p.elements.map(el => el.id === elementId ? { ...el, ...updates } : el);
        return { ...p, elements, updatedAt: new Date() };
      });
      return { ...album, pages, updatedAt: new Date() };
    }));
  }, []);

  const deleteElement = useCallback((albumId: string, pageId: string, elementId: string) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pages = (album.pages || []).map(p => {
        if (p.id !== pageId) return p;
        return { ...p, elements: p.elements.filter(el => el.id !== elementId), updatedAt: new Date() };
      });
      return { ...album, pages, updatedAt: new Date() };
    }));
  }, []);

  const batchUpdateElements = useCallback((albumId: string, pageId: string, elements: PageElement[]) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const pages = (album.pages || []).map(p => {
        if (p.id !== pageId) return p;
        return { ...p, elements, updatedAt: new Date() };
      });
      return { ...album, pages, updatedAt: new Date() };
    }));
    // 공동 편집 실시간 동기화
    FirestoreService.updatePageElements(albumId, pageId, elements).catch(() => {});
  }, []);

  const setVisibility = useCallback((albumId: string, visibility: VisibilityLevel) => {
    updateAlbum(albumId, { visibility });
  }, [updateAlbum]);

  const addCollaborator = useCallback((albumId: string, friendId: string, name: string, initial: string, avatarColor: string) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const collaborators = [...(album.collaborators || [])];
      if (collaborators.find(c => c.id === friendId)) return album;
      collaborators.push({ id: friendId, name, initial, avatarColor, role: 'editor', joinedAt: new Date() });
      return { ...album, collaborators, isShared: true, memberCount: collaborators.length, updatedAt: new Date() };
    }));
    FirestoreService.addCollaborator(albumId, friendId).catch(() => {});
    AnalyticsService.logEvent(AnalyticsService.Events.COLLABORATOR_INVITED, { albumId, friendId });
  }, []);

  const removeCollaborator = useCallback((albumId: string, collaboratorId: string) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const collaborators = (album.collaborators || []).filter(c => c.id !== collaboratorId);
      return { ...album, collaborators, isShared: collaborators.length > 1, memberCount: collaborators.length, updatedAt: new Date() };
    }));
    FirestoreService.removeCollaborator(albumId, collaboratorId).catch(() => {});
  }, []);

  const importAlbum = useCallback((targetAlbumId: string, sourceAlbumId: string, position: 'start' | 'end' | number, mode: 'copy' | 'link') => {
    const source = albums.find(a => a.id === sourceAlbumId);
    if (!source) return;

    const now = new Date();
    const importedPages = (source.pages || []).map(p => ({
      ...p,
      id: genId('page'),
      elements: p.elements.map(el => ({ ...el, id: genId('el') })),
      createdAt: now,
      updatedAt: now,
    }));

    setAlbums(prev => prev.map(album => {
      if (album.id !== targetAlbumId) return album;
      const pages = [...(album.pages || [])];
      let insertIdx: number;
      if (position === 'start') insertIdx = 0;
      else if (position === 'end') insertIdx = pages.length;
      else insertIdx = Math.min(position, pages.length);

      pages.splice(insertIdx, 0, ...importedPages);
      pages.forEach((p, i) => { p.pageNumber = i; });

      const ref: ImportedAlbumRef = {
        id: genId('import-ref'),
        sourceAlbumId,
        sourceAlbumTitle: source.title,
        insertPosition: insertIdx,
        mode,
        importedAt: now,
      };
      const refs = [...(album.importedAlbumRefs || []), ref];

      return { ...album, pages, pageCount: pages.length, importedAlbumRefs: refs, updatedAt: now };
    }));
  }, [albums]);

  const removeImportedAlbum = useCallback((targetAlbumId: string, refId: string) => {
    setAlbums(prev => prev.map(album => {
      if (album.id !== targetAlbumId) return album;
      const refs = (album.importedAlbumRefs || []).filter(r => r.id !== refId);
      return { ...album, importedAlbumRefs: refs, updatedAt: new Date() };
    }));
  }, []);

  const setLastViewedPage = useCallback((albumId: string, pageId: string) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, lastViewedPageId: pageId } : a));
  }, []);

  const contextValue = useMemo(() => ({
    albums, deletedAlbums, pinnedAlbumId, isLoading, getAlbum, createAlbum, updateAlbum,
    deleteAlbum, restoreAlbum, permanentlyDeleteAlbum, pinAlbum, duplicateAlbum,
    addPage, deletePage, reorderPages, updatePage,
    addElement, updateElement, deleteElement, batchUpdateElements,
    setVisibility, addCollaborator, removeCollaborator,
    importAlbum, removeImportedAlbum, setLastViewedPage,
  }), [albums, deletedAlbums, pinnedAlbumId, isLoading, getAlbum, createAlbum, updateAlbum,
    deleteAlbum, restoreAlbum, permanentlyDeleteAlbum, pinAlbum, duplicateAlbum,
    addPage, deletePage, reorderPages, updatePage,
    addElement, updateElement, deleteElement, batchUpdateElements,
    setVisibility, addCollaborator, removeCollaborator,
    importAlbum, removeImportedAlbum, setLastViewedPage]);

  return (
    <AlbumStoreContext.Provider value={contextValue}>
      {children}
    </AlbumStoreContext.Provider>
  );
}

export function useAlbumStore() {
  const context = useContext(AlbumStoreContext);
  if (!context) throw new Error('useAlbumStore must be used within AlbumStoreProvider');
  return context;
}
