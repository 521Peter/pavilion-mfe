import { useSyncExternalStore } from "react";
import { icons } from "lucide-react";

type IconName = keyof typeof icons;

/** 后端菜单接口返回的数据结构 */
export interface MenuItem {
  menuCode: string;
  menuName: string;
  menuEnglishName?: string;
  menuTp: string;
  parentCode: string;
  orderNo: number;
  status: string;
  menuUrl: string;
  menuIcon: IconName;
  childrenMenuInfoList?: MenuItem[];
}

// ─── 极简响应式 store（React 版，替代 Vue 的 ref） ───

let menusData: MenuItem[] = [];
const listeners = new Set<() => void>();

function getMenus(): MenuItem[] {
  return menusData;
}

function subscribeMenus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitChange(): void {
  listeners.forEach(listener => listener());
}

/** React Hook：订阅菜单数据（配合 useSyncExternalStore，菜单加载完成后自动重渲染） */
export function useMenus(): MenuItem[] {
  return useSyncExternalStore(subscribeMenus, getMenus);
}

/** 缓存的 Promise，避免重复请求 */
let fetchPromise: Promise<MenuItem[]> | null = null;

/**
 * 从后端接口获取菜单数据（模拟）
 * 首次调用发起请求，后续调用返回同一 Promise
 */
export function fetchMenus(): Promise<MenuItem[]> {
  if (!fetchPromise) {
    fetchPromise = doFetchMenus();
  }
  return fetchPromise;
}

async function doFetchMenus(): Promise<MenuItem[]> {
  const ST_PX = "color:#42b883;font-weight:bold";
  const ST_DIM = "color:#999";
  console.log("%c[PavilionMfe]%c 正在从后端获取菜单数据...", ST_PX, ST_DIM);

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  const data: MenuItem[] = [
    // ─── 主应用菜单 ───
    {
      menuCode: "home",
      menuName: "首页",
      menuTp: "0",
      parentCode: "",
      orderNo: 0,
      status: "1",
      menuUrl: "/",
      menuIcon: "House"
    },
    {
      menuCode: "ai-center",
      menuName: "AI 能力中心",
      menuTp: "0",
      parentCode: "",
      orderNo: 1,
      status: "1",
      menuUrl: "",
      menuIcon: "Settings",
      childrenMenuInfoList: [
        {
          menuCode: "ai-center/llm-providers",
          menuName: "Provider 管理",
          menuTp: "1",
          parentCode: "ai-center",
          orderNo: 1,
          status: "1",
          menuUrl: "/llm-providers",
          menuIcon: "Link"
        },
        {
          menuCode: "ai-center/mcp-servers",
          menuName: "MCP 管理",
          menuTp: "1",
          parentCode: "ai-center",
          orderNo: 2,
          status: "1",
          menuUrl: "/mcp-servers",
          menuIcon: "Link2"
        },
        {
          menuCode: "ai-center/skills",
          menuName: "Skill 管理",
          menuTp: "1",
          parentCode: "ai-center",
          orderNo: 3,
          status: "1",
          menuUrl: "/skills",
          menuIcon: "LibraryBig"
        }
      ]
    },
    // ─── 错误页面 ───
    {
      menuCode: "error-pages",
      menuName: "错误页面",
      menuTp: "0",
      parentCode: "",
      orderNo: 100,
      status: "1",
      menuUrl: "",
      menuIcon: "CircleSlash",
      childrenMenuInfoList: [
        {
          menuCode: "error-pages/403",
          menuName: "403 权限不足",
          menuTp: "1",
          parentCode: "error-pages",
          orderNo: 1,
          status: "1",
          menuUrl: "/403",
          menuIcon: "ShieldAlert"
        },
        {
          menuCode: "error-pages/404",
          menuName: "404 页面不存在",
          menuTp: "1",
          parentCode: "error-pages",
          orderNo: 2,
          status: "1",
          menuUrl: "/404",
          menuIcon: "Signpost"
        },
        {
          menuCode: "error-pages/500",
          menuName: "500 服务器错误",
          menuTp: "1",
          parentCode: "error-pages",
          orderNo: 3,
          status: "1",
          menuUrl: "/500",
          menuIcon: "Bug"
        }
      ]
    },
    {
      menuCode: "git-report-generator",
      menuName: "git 报告",
      menuEnglishName: "",
      menuTp: "0",
      parentCode: "",
      orderNo: 5,
      status: "1",
      menuUrl: "/git",
      menuIcon: "BookOpenText",
      childrenMenuInfoList: []
    },
    {
      menuCode: "ai-chat",
      menuName: "AI 对话",
      menuEnglishName: "",
      menuTp: "0",
      parentCode: "",
      orderNo: 6,
      status: "1",
      menuUrl: "/chat",
      menuIcon: "MessageSquareDot",
      childrenMenuInfoList: []
    },
    {
      menuCode: "ai-customer",
      menuName: "AI 客服",
      menuEnglishName: "",
      menuTp: "0",
      parentCode: "",
      orderNo: 7,
      status: "1",
      menuUrl: "/customer-service",
      menuIcon: "Bot",
      childrenMenuInfoList: []
    }
  ];

  menusData = data;
  emitChange();
  console.log("%c[PavilionMfe]%c 菜单数据获取成功，共 %d 个一级菜单", ST_PX, ST_DIM, data.length);
  return data;
}
