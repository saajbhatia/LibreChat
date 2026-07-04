import { useSyncExternalStore } from 'react';

/** conversationId → canvasCourseId, persisted locally until course chats live on the backend */
export type CourseChatMap = Record<string, number>;

const MAP_KEY = 'learnlink:courseChats';
const MAP_EVENT = 'learnlink:course-chats-changed';

let cachedMap: CourseChatMap | null = null;

function readMap(): CourseChatMap {
  if (cachedMap != null) {
    return cachedMap;
  }
  try {
    const raw = localStorage.getItem(MAP_KEY);
    const parsed: unknown = raw != null ? JSON.parse(raw) : {};
    cachedMap = typeof parsed === 'object' && parsed != null ? (parsed as CourseChatMap) : {};
  } catch {
    cachedMap = {};
  }
  return cachedMap;
}

export function recordCourseChat(conversationId: string, canvasCourseId: number): void {
  const next = { ...readMap(), [conversationId]: canvasCourseId };
  cachedMap = next;
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to persist LearnLink course chats', error);
  }
  window.dispatchEvent(new Event(MAP_EVENT));
}

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === MAP_KEY || event.key == null) {
      cachedMap = null;
      onStoreChange();
    }
  };
  window.addEventListener(MAP_EVENT, onStoreChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(MAP_EVENT, onStoreChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useCourseChatMap(): CourseChatMap {
  return useSyncExternalStore(subscribe, readMap);
}
