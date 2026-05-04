export type EventMap = {
  DRAG_START: { id: string };
  DRAG_END: { id: string; x: number; y: number };
  CARD_FOCUSED: { id: string };
  CARD_VANISHED: { id: string };
  CARD_LANDED: { id: string };
  THEME_CHANGED: { theme: string };
  LAYOUT_UPDATED: undefined;
  APP_ERROR: { message: string; error?: Error };
};

export type EventKey = keyof EventMap;
export type EventHandler<T> = (payload: T) => void;

class EventBus {
  private listeners: { [K in EventKey]?: EventHandler<EventMap[K]>[] } = {};

  on<K extends EventKey>(event: K, handler: EventHandler<EventMap[K]>) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);
  }

  off<K extends EventKey>(event: K, handler: EventHandler<EventMap[K]>) {
    if (!this.listeners[event]) return;
    this.listeners[event] = (this.listeners[event] as any).filter((h: any) => h !== handler);
  }

  emit<K extends EventKey>(event: K, payload: EventMap[K]) {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach((handler) => handler(payload));
  }
  
  clear() {
    this.listeners = {};
  }
}

export const eventBus = new EventBus();
