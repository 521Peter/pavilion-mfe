export interface TabInfo {
  id: string;
  title: string;
  path: string;
  fullPath: string;
  meta?: Record<string, unknown>;
  query?: Record<string, string>;
  params?: Record<string, string>;
  cached?: boolean;
}

export interface TabsState {
  tabs: TabInfo[];
  activeTabId: string | null;
}

type Listener = (state: TabsState) => void;

export class TabsStateManager {
  private state: TabsState = { tabs: [], activeTabId: null };
  private listeners: Set<Listener> = new Set();
  private shouldCacheNext = false;

  getState(): TabsState {
    return { tabs: [...this.state.tabs], activeTabId: this.state.activeTabId };
  }

  getActiveTab(): TabInfo | null {
    return this.state.tabs.find(t => t.id === this.state.activeTabId) ?? null;
  }

  addTab(tab: TabInfo): void {
    const idx = this.state.tabs.findIndex(t => t.id === tab.id);
    if (idx === -1) {
      const isCached = this.shouldCacheNext || (tab.cached ?? true);
      this.state.tabs = [...this.state.tabs, { ...tab, cached: isCached }];
    } else {
      // 更新已有 Tab 的属性（如 title），保留 cached 状态
      this.state.tabs[idx] = { ...this.state.tabs[idx], ...tab, cached: this.state.tabs[idx].cached };
    }
    this.state.activeTabId = tab.id;
    this.shouldCacheNext = false;
    this.notify();
  }

  removeTab(tabId: string): void {
    const idx = this.state.tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    this.state.tabs = this.state.tabs.filter(t => t.id !== tabId);

    if (this.state.activeTabId === tabId) {
      if (this.state.tabs.length > 0) {
        this.state.activeTabId = this.state.tabs[Math.min(idx, this.state.tabs.length - 1)].id;
      } else {
        this.state.activeTabId = null;
      }
    }
    this.notify();
  }

  setActiveTab(tabId: string): void {
    this.state.activeTabId = tabId;
    this.notify();
  }

  setShouldCacheNextPage(value: boolean): void {
    this.shouldCacheNext = value;
  }

  clearState(): void {
    this.state = { tabs: [], activeTabId: null };
    this.shouldCacheNext = false;
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach(fn => fn(snapshot));
  }
}
