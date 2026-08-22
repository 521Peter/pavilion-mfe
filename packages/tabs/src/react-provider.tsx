import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { TabsStateManager, type TabInfo } from "./state-manager.js";

// ─── 公共 API ───

/** openTab 入参：path + title 必填，其余可选 */
export type OpenTabInput = Pick<TabInfo, "path" | "title"> & Partial<Omit<TabInfo, "id">> & { id?: string };

export interface TabsAPI {
  tabs: TabInfo[];
  activeTabId: string | null;
  activeTab: TabInfo | null;
  /** 打开 Tab（已存在则切换）；id / fullPath 默认取 path */
  openTab(tab: OpenTabInput): void;
  closeTab(tabId: string): void;
  closeOthers(tabId: string): void;
  closeAll(): void;
}

// ─── sessionStorage 持久化 ───

const STORAGE_KEY = "pavilion-mfe:tabs-state";

function saveState(state: { tabs: TabInfo[]; activeTabId: string | null }) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 忽略配额错误 */
  }
}

function loadState(): { tabs: TabInfo[]; activeTabId: string | null } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── 上下文 ───

const TabsContext = createContext<TabsAPI | null>(null);

// ─── 提供器 ───

export function TabsProvider({ children }: { children: ReactNode }) {
  const { current: manager } = React.useRef(new TabsStateManager());

  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const activeTab = useMemo(() => tabs.find((t: TabInfo) => t.id === activeTabId) ?? null, [tabs, activeTabId]);

  // 从 sessionStorage 恢复
  useEffect(() => {
    const saved = loadState();
    if (saved?.tabs.length) {
      for (const tab of saved.tabs) {
        manager.addTab(tab);
      }
      const state = manager.getState();
      setTabs(state.tabs);
      setActiveTabId(state.activeTabId);
    }
  }, [manager]);

  const sync = useCallback(() => {
    const state = manager.getState();
    setTabs(state.tabs);
    setActiveTabId(state.activeTabId);
    saveState(state);
  }, [manager]);

  const openTab = useCallback(
    (tab: OpenTabInput) => {
      const id = tab.id ?? tab.path;
      const fullPath = tab.fullPath ?? tab.path;
      manager.addTab({ fullPath, ...tab, id } as TabInfo);
      sync();
    },
    [manager, sync]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      manager.removeTab(tabId);
      sync();
    },
    [manager, sync]
  );

  const closeOthers = useCallback(
    (tabId: string) => {
      const state = manager.getState();
      for (const t of state.tabs) {
        if (t.id !== tabId) manager.removeTab(t.id);
      }
      sync();
    },
    [manager, sync]
  );

  const closeAll = useCallback(() => {
    manager.clearState();
    sync();
  }, [manager, sync]);

  const api = useMemo<TabsAPI>(
    () => ({ tabs, activeTabId, activeTab, openTab, closeTab, closeOthers, closeAll }),
    [tabs, activeTabId, activeTab, openTab, closeTab, closeOthers, closeAll]
  );

  return <TabsContext.Provider value={api}>{children}</TabsContext.Provider>;
}

// ─── 钩子 ───

export function useTabs(): TabsAPI {
  const api = useContext(TabsContext);
  if (!api) {
    throw new Error("[pavilion-mfe/tabs] useTabs() must be called within <TabsProvider>");
  }
  return api;
}
