/**
 * Event bus for main-app ↔ sub-app and sub-app ↔ sub-app communication.
 * Extracted from chagee's event.js EventEmitter.
 */

import type { EventCallback } from "./types.js";
import { bridgeLog } from "./logger.js";

interface ListenerEntry {
  callback: EventCallback;
  appCode?: string;
}

export class EventBus {
  private events: Record<string, ListenerEntry[]> = {};

  on(eventName: string, callback: EventCallback, options?: { appCode?: string }): this {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push({
      callback,
      appCode: options?.appCode
    });
    bridgeLog("event-subscribe", { name: eventName, appCode: options?.appCode ?? "*" });
    return this;
  }

  off(eventName: string, callback: EventCallback): this {
    const listeners = this.events[eventName];
    if (listeners) {
      this.events[eventName] = listeners.filter(entry => entry.callback !== callback);
    }
    return this;
  }

  emit(eventName: string, detail?: unknown): this {
    const listeners = this.events[eventName];
    if (!listeners) return this;

    bridgeLog("event-emit", { name: eventName, listeners: listeners.length });

    listeners.forEach(entry => {
      entry.callback(detail);
    });
    return this;
  }

  /** Like emit, but only notifies listeners matching the given appCode */
  emitToApp(eventName: string, appCode: string, detail?: unknown): this {
    const listeners = this.events[eventName];
    if (!listeners) return this;

    bridgeLog("event-emit", { name: eventName, appCode, listeners: listeners.length });

    listeners.forEach(entry => {
      if (entry.appCode === undefined || entry.appCode === appCode) {
        entry.callback(detail);
      }
    });
    return this;
  }
}
