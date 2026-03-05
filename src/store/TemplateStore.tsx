import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DecoTemplate, PageElement } from '../types/album';

interface TemplateStoreContextType {
  templates: DecoTemplate[];
  saveTemplate: (template: Omit<DecoTemplate, 'id' | 'createdAt'>) => DecoTemplate;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => DecoTemplate | undefined;
}

const TemplateStoreContext = createContext<TemplateStoreContextType | null>(null);

let nextId = 1;

const builtInTemplates: DecoTemplate[] = [
  {
    id: 'tmpl-polaroid',
    name: '폴라로이드',
    backgroundColor: '#FDFAF5',
    elements: [
      { type: 'photo', x: 10, y: 5, width: 80, height: 60, rotation: -2, zIndex: 1 },
      { type: 'text', x: 15, y: 70, width: 70, height: 8, rotation: 0, zIndex: 2, textContent: '여기에 메모를 적어보세요', textColor: '#6B5E50', textFontSize: 14, textFontFamily: 'caveat' },
    ],
    createdAt: new Date(),
    createdBy: 'system',
    isPublic: true,
  },
  {
    id: 'tmpl-collage-2',
    name: '2장 콜라주',
    backgroundColor: '#F7F2EA',
    elements: [
      { type: 'photo', x: 3, y: 5, width: 45, height: 55, rotation: -3, zIndex: 1 },
      { type: 'photo', x: 52, y: 5, width: 45, height: 55, rotation: 2, zIndex: 2 },
    ],
    createdAt: new Date(),
    createdBy: 'system',
    isPublic: true,
  },
  {
    id: 'tmpl-collage-3',
    name: '3장 콜라주',
    backgroundColor: '#F0E8DB',
    elements: [
      { type: 'photo', x: 3, y: 3, width: 58, height: 45, rotation: -1, zIndex: 1 },
      { type: 'photo', x: 3, y: 52, width: 45, height: 45, rotation: 2, zIndex: 2 },
      { type: 'photo', x: 52, y: 52, width: 45, height: 45, rotation: -2, zIndex: 3 },
    ],
    createdAt: new Date(),
    createdBy: 'system',
    isPublic: true,
  },
  {
    id: 'tmpl-diary',
    name: '일기장',
    backgroundColor: '#FFF8F0',
    elements: [
      { type: 'photo', x: 15, y: 5, width: 70, height: 45, rotation: 1, zIndex: 1 },
      { type: 'text', x: 8, y: 55, width: 84, height: 35, rotation: 0, zIndex: 2, textContent: '오늘의 이야기를 써보세요...', textColor: '#6B5E50', textFontSize: 15, textFontFamily: 'pretendard' },
    ],
    createdAt: new Date(),
    createdBy: 'system',
    isPublic: true,
  },
  {
    id: 'tmpl-grid-4',
    name: '4컷 프레임',
    backgroundColor: '#FDFAF5',
    elements: [
      { type: 'photo', x: 3, y: 3, width: 45, height: 45, rotation: 0, zIndex: 1 },
      { type: 'photo', x: 52, y: 3, width: 45, height: 45, rotation: 0, zIndex: 2 },
      { type: 'photo', x: 3, y: 52, width: 45, height: 45, rotation: 0, zIndex: 3 },
      { type: 'photo', x: 52, y: 52, width: 45, height: 45, rotation: 0, zIndex: 4 },
    ],
    createdAt: new Date(),
    createdBy: 'system',
    isPublic: true,
  },
];

export function TemplateStoreProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<DecoTemplate[]>(builtInTemplates);

  const saveTemplate = useCallback((template: Omit<DecoTemplate, 'id' | 'createdAt'>): DecoTemplate => {
    const newTemplate: DecoTemplate = {
      ...template,
      id: `tmpl-user-${nextId++}`,
      createdAt: new Date(),
    };
    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTemplate = useCallback((id: string) => {
    return templates.find(t => t.id === id);
  }, [templates]);

  return (
    <TemplateStoreContext.Provider value={{ templates, saveTemplate, deleteTemplate, getTemplate }}>
      {children}
    </TemplateStoreContext.Provider>
  );
}

export function useTemplateStore() {
  const context = useContext(TemplateStoreContext);
  if (!context) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return context;
}
