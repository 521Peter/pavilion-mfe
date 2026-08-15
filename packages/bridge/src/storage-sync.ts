/**
 * LocalStorage observer with subscription support.
 * Extracted from chagee's event.js LocalStorageObserver.
 *
 * Allows the main app and sub-apps to share state via localStorage
 * with reactive subscriptions.
 */

import { bridgeLog } from "./logger.js";

interface SubscriptionValue<T> {
  value: T | null;
  unsubscribe: () => void;
}

type ObserverCallback<T> = (subscription: SubscriptionValue<T>) => void;

export class StorageSync {
  private observers: Record<string, ObserverCallback<unknown>[]> = {};
  private static instance: StorageSync;

  static getInstance(): StorageSync {
    if (!StorageSync.instance) {
      StorageSync.instance = new StorageSync();
      StorageSync.instance.start();
    }
    return StorageSync.instance;
  }

  get<T = unknown>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T = unknown>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.publish(key, value);
    } catch (e) {
      console.error("[PavilionMfe StorageSync] set failed:", e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
    this.publish(key, null);
  }

  subscribe<T = unknown>(key: string, callback: ObserverCallback<T>): () => void {
    const currentValue = this.get<T>(key);
    const unsubscribe = () => this.unsubscribe(key, callback as ObserverCallback<unknown>);

    const subscription: SubscriptionValue<T> = {
      value: currentValue,
      unsubscribe
    };

    if (!this.observers[key]) {
      this.observers[key] = [];
    }
    if (!this.observers[key].includes(callback as ObserverCallback<unknown>)) {
      this.observers[key].push(callback as ObserverCallback<unknown>);
    }

    bridgeLog("storage-subscribe", { key });
    callback(subscription);
    return unsubscribe;
  }

  private unsubscribe(key: string, callback: ObserverCallback<unknown>): void {
    const list = this.observers[key];
    if (list) {
      this.observers[key] = list.filter(cb => cb !== callback);
    }
  }

  private publish(key: string, value: unknown): void {
    const list = this.observers[key];
    if (list) {
      bridgeLog("storage-publish", { key, subscribers: list.length });
      list.forEach(cb => {
        const subscription: SubscriptionValue<unknown> = {
          value,
          unsubscribe: () => this.unsubscribe(key, cb)
        };
        cb(subscription);
      });
    }
  }

  private start(): void {
    window.addEventListener("storage", event => {
      if (event.key) {
        // event.newValue is a raw JSON string — parse to match set() semantics
        let value: unknown = null;
        if (event.newValue) {
          try {
            value = JSON.parse(event.newValue);
          } catch {
            value = event.newValue;
          }
        }
        this.publish(event.key, value);
      }
    });
  }
}
