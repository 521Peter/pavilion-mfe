import type { App, Ref, ComputedRef, InjectionKey } from "vue";
import { ref, computed, inject } from "vue";
import { TabsStateManager, type TabInfo } from "./state-manager.js";

// ─── Public API ───

/** openTab 入参：path + title 必填，其余可选 */
export type OpenTabInput = Pick<TabInfo, "path" | "title"> & Partial<Omit<TabInfo, "id">> & { id?: string };

export interface TabsAPI {
  tabs: Ref<TabInfo[]>;
  activeTabId: Ref<string | null>;
  activeTab: ComputedRef<TabInfo | null>;
  /** 打开 Tab（已存在则切换）；id / fullPath 默认取 path */
  openTab(tab: OpenTabInput): void;
  closeTab(tabId: string): void;
  closeOthers(tabId: string): void;
  closeAll(): void;
}

// ─── Injection key ───

const TABS_KEY: InjectionKey<TabsAPI> = Symbol("pavilion-mfe-tabs");

// ─── sessionStorage 持久化 ───

const STORAGE_KEY = "pavilion-mfe:tabs-state";

function saveState(state: { tabs: TabInfo[]; activeTabId: string | null }) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
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

// ─── Plugin ───

export const tabsPlugin = {
  install(app: App) {
    const manager = new TabsStateManager();

    const tabs = ref<TabInfo[]>([]);
    const activeTabId = ref<string | null>(null);

    const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value) ?? null);

    function sync() {
      const state = manager.getState();
      tabs.value = state.tabs;
      activeTabId.value = state.activeTabId;
      saveState(state);
    }

    function openTab(tab: OpenTabInput) {
      const id = tab.id ?? tab.path;
      const fullPath = tab.fullPath ?? tab.path;
      manager.addTab({ fullPath, ...tab, id } as TabInfo);
      sync();
    }

    function closeTab(tabId: string) {
      manager.removeTab(tabId);
      sync();
    }

    function closeOthers(tabId: string) {
      const state = manager.getState();
      for (const t of state.tabs) {
        if (t.id !== tabId) manager.removeTab(t.id);
      }
      sync();
    }

    function closeAll() {
      manager.clearState();
      sync();
    }

    const api: TabsAPI = {
      tabs,
      activeTabId,
      activeTab,
      openTab,
      closeTab,
      closeOthers,
      closeAll
    };

    // 从 sessionStorage 恢复上次的 Tab 状态
    const saved = loadState();
    if (saved?.tabs.length) {
      for (const tab of saved.tabs) {
        manager.addTab(tab);
      }
    }

    // 初始化同步
    sync();

    app.provide(TABS_KEY, api);
  }
};

// ─── Composable ───

export function useTabs(): TabsAPI {
  const api = inject(TABS_KEY);
  if (!api) {
    throw new Error("[pavilion-mfe/tabs] useTabs() must be called after app.use(tabsPlugin)");
  }
  return api;
}
