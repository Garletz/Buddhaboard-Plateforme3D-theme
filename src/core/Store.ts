import { eventBus } from './EventBus';

export interface CardState {
  id: string;
  slug: string;
  x: number;
  y: number;
  z: number;
  width?: number;
  height?: number;
  type?: string;
}

export interface AppState {
  cards: Record<string, CardState>;
  focusedCardId: string | null;
}

class Store {
  private state: AppState = {
    cards: {},
    focusedCardId: null,
  };

  constructor() {
    eventBus.on('LAYOUT_UPDATED', () => this.saveToLocalStorage());
  }

  getState() {
    return this.state;
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('buddhachannel_layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Basic validation
        if (parsed && typeof parsed === 'object' && parsed.cards) {
          this.state.cards = parsed.cards;
          this.notifyLayoutUpdated();
        }
      }
    } catch (e) {
      console.error('Failed to load layout from local storage', e);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('buddhachannel_layout', JSON.stringify({
        cards: this.state.cards
      }));
    } catch (e) {
      console.error('Failed to save layout to local storage', e);
    }
  }

  getCard(id: string): CardState | null {
    return this.state.cards[id] || null;
  }

  addCard(card: CardState) {
    this.state.cards[card.id] = card;
    this.notifyLayoutUpdated();
  }

  updateCardPosition(id: string, x: number, y: number, z: number = 0) {
    if (this.state.cards[id]) {
      this.state.cards[id].x = x;
      this.state.cards[id].y = y;
      this.state.cards[id].z = z;
      this.notifyLayoutUpdated();
    }
  }

  removeCard(id: string) {
    if (this.state.cards[id]) {
      delete this.state.cards[id];
      this.notifyLayoutUpdated();
    }
  }

  setFocusedCard(id: string | null) {
    this.state.focusedCardId = id;
    if (id) {
        eventBus.emit('CARD_FOCUSED', { id });
    }
  }

  reset() {
      this.state = {
          cards: {},
          focusedCardId: null
      };
      localStorage.removeItem('buddhachannel_layout');
      if (typeof window !== 'undefined') {
          window.location.reload();
      }
  }

  private notifyLayoutUpdated() {
    eventBus.emit('LAYOUT_UPDATED', undefined);
  }
}

export const store = new Store();
