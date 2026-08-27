/**
 * 支持订阅的 localStorage 观察器。
 * 提取自 chagee 的 event.js LocalStorageObserver。
 *
 * 允许主应用和子应用通过 localStorage 共享状态，并支持响应式订阅。
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

  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- JSON storage reads use the caller's declared value contract
  get<T = unknown>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- caller-owned storage keys define T; malformed JSON is caught and runtime schema validation belongs to the caller
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set(key: string, value: unknown): void {
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
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- callbacks are stored by key and invoked with the same subscription shape independent of the caller's T
    const unsubscribe = () => this.unsubscribe(key, callback as ObserverCallback<unknown>);

    const subscription: SubscriptionValue<T> = {
      value: currentValue,
      unsubscribe
    };

    if (!this.observers[key]) {
      this.observers[key] = [];
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- identity comparison erases T without invoking the callback
    if (!this.observers[key].includes(callback as ObserverCallback<unknown>)) {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- storage keeps the callback identity; publish supplies the key's corresponding value contract
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
        // event.newValue 是原始 JSON 字符串，需要解析以匹配 set() 的语义
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
