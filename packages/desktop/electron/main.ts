import { app, BrowserWindow, shell, Menu, dialog, ipcMain, type IpcMainInvokeEvent } from "electron";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createStaticServer } from "./static-server";
import { DESKTOP_CHANNELS, type GitReportQuery, type SaveReportInput } from "./desktop-api";
import { generateGitData, inspectRepository } from "./git-report";

// 开发服务器的远程入口 URL（由 scripts/dev.mjs 设置）
const DEV_SERVER_URL = process.env.DEV_SERVER_URL;

// 当前是否运行在已打包的生产模式
const isPackaged = !DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;
let server: { port: number; close: () => void } | null = null;

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (
    !mainWindow ||
    event.sender !== mainWindow.webContents ||
    event.senderFrame !== mainWindow.webContents.mainFrame
  ) {
    throw new Error("拒绝未知页面调用本地能力");
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(DESKTOP_CHANNELS.pickRepository, async event => {
    assertTrustedSender(event);
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: "选择 Git 仓库",
      properties: ["openDirectory"]
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return inspectRepository(result.filePaths[0]);
  });

  ipcMain.handle(DESKTOP_CHANNELS.generateGitData, async (event, query: GitReportQuery) => {
    assertTrustedSender(event);
    return generateGitData(query);
  });

  ipcMain.handle(DESKTOP_CHANNELS.saveReport, async (event, input: SaveReportInput) => {
    assertTrustedSender(event);
    if (!input || typeof input.content !== "string" || typeof input.suggestedName !== "string") {
      throw new Error("报告内容无效");
    }
    const suggestedName = input.suggestedName.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) || "git-report.md";
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: "保存 Git 报告",
      defaultPath: suggestedName,
      filters: [{ name: "Markdown", extensions: ["md"] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await writeFile(result.filePath, input.content, "utf8");
    return { canceled: false, filePath: result.filePath };
  });
}

function createWindow(loadUrl: string): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      // 仅允许渲染进程使用 preload 暴露的 Node 类 API
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  // 将渲染进程控制台同步到终端，便于调试 MF 加载
  mainWindow.webContents.on("console-message", (_e, level, message) => {
    const tag = level >= 2 ? "renderer:error" : "renderer";
    console.log(`[${tag}]`, message);
  });
  mainWindow.webContents.on("did-fail-load", (_e, code, desc) =>
    console.log(`[desktop] did-fail-load ${code} ${desc}`)
  );
  mainWindow.webContents.on("did-finish-load", () => console.log("[desktop] did-finish-load"));

  // 使用系统浏览器打开外部链接，不在应用内打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.loadURL(loadUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function boot(): Promise<void> {
  // 在打包模式下，通过本地 HTTP 服务器提供已打包的渲染进程产物。
  // Module Federation 需要真实来源（而非 file://）才能可靠加载远程清单和 ES 模块。
  if (isPackaged) {
    // 已打包：<resourcesPath>/renderer；未打包预览：dist/renderer
    const packagedDir = join(process.resourcesPath, "renderer");
    const rendererDir = existsSync(packagedDir) ? packagedDir : join(__dirname, "renderer");
    server = await createStaticServer(rendererDir, process.env.DESKTOP_API_BASE_URL || "http://127.0.0.1:3000");
  }

  const targetUrl = DEV_SERVER_URL ? DEV_SERVER_URL : `http://localhost:${server!.port}/`;

  console.log(`[desktop] loading ${targetUrl}`);
  // 不显示应用菜单以保持桌面界面简洁，相关操作依赖键盘快捷键
  Menu.setApplicationMenu(null);
  createWindow(targetUrl);
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  await boot();
});

app.on("window-all-closed", () => {
  server?.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) boot();
});
