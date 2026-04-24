import { MarketDataEvent } from '../types';

type EventCallback = (event: MarketDataEvent) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private globalListeners: Set<EventCallback> = new Set();

  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => this.unsubscribe(eventType, callback);
  }

  subscribeAll(callback: EventCallback): () => void {
    this.globalListeners.add(callback);
    return () => this.globalListeners.delete(callback);
  }

  unsubscribe(eventType: string, callback: EventCallback): void {
    this.listeners.get(eventType)?.delete(callback);
  }

  publish(event: MarketDataEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error('Event listener error:', e);
        }
      }
    }
    for (const listener of this.globalListeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Global listener error:', e);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

export const eventBus = new EventBus();
