import { useEffect, useMemo, useRef, useState } from "react";
import { generateAiReport, listModels } from "../api";
import { createReportPrompt } from "../report-prompt";
import type { AvailableModel, GitReportData, GitReportQuery, GitRepositoryInfo } from "../types";

type WorkState = "idle" | "reading" | "generating" | "saving";

function localDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function initialDates(): Pick<GitReportQuery, "since" | "until"> {
  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - 6);
  return { since: localDate(since), until: localDate(until) };
}

function Git() {
  const desktopAvailable = Boolean(window.desktop?.git);
  const dates = useMemo(() => initialDates(), []);
  const abortRef = useRef<AbortController | null>(null);
  const [repository, setRepository] = useState<GitRepositoryInfo | null>(null);
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [modelId, setModelId] = useState("");
  const [branch, setBranch] = useState("");
  const [since, setSince] = useState(dates.since);
  const [until, setUntil] = useState(dates.until);
  const [author, setAuthor] = useState("");
  const [includeMerges, setIncludeMerges] = useState(false);
  const [gitData, setGitData] = useState<GitReportData | null>(null);
  const [report, setReport] = useState("");
  const [state, setState] = useState<WorkState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedModel = models.find(model => model.id === modelId);
  const busy = state !== "idle";

  useEffect(() => {
    if (!desktopAvailable) return;
    let active = true;
    listModels()
      .then(items => {
        if (!active) return undefined;
        setModels(items);
        setModelId(items[0]?.id ?? "");
        return undefined;
      })
      .catch(reason => active && setError(reason instanceof Error ? reason.message : "获取模型列表失败"));
    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, [desktopAvailable]);

  async function pickRepository() {
    if (!window.desktop) return;
    setError("");
    setNotice("");
    try {
      const selected = await window.desktop.git.pickRepository();
      if (!selected) return;
      setRepository(selected);
      setBranch(selected.currentBranch);
      setGitData(null);
      setReport("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "无法打开 Git 仓库");
    }
  }

  async function generate() {
    if (!repository || !selectedModel || !window.desktop) return;
    setError("");
    setNotice("");
    setReport("");
    const query: GitReportQuery = {
      repositoryPath: repository.path,
      branch,
      since,
      until,
      author: author.trim() || undefined,
      includeMerges
    };
    try {
      setState("reading");
      const data = await window.desktop.git.generateData(query);
      setGitData(data);
      if (!data.commits.length) throw new Error("所选范围内没有可用于生成报告的提交");
      setState("generating");
      const abort = new AbortController();
      abortRef.current = abort;
      let generated = "";
      for await (const chunk of generateAiReport(
        {
          model: selectedModel.id,
          temperature: 0.2,
          maxTokens: 3000,
          messages: [
            {
              role: "system",
              content: "你是一名严谨的软件研发负责人，擅长根据 Git 事实生成结构清晰、可追溯的工作报告。"
            },
            { role: "user", content: createReportPrompt(data, query) }
          ]
        },
        abort.signal
      )) {
        generated += chunk;
        setReport(generated);
      }
      if (!generated.trim()) throw new Error("AI 未返回报告内容");
      const notices: string[] = [];
      if (data.truncated) notices.push("提交数量超过 1000 条，本次报告仅统计最近的 1000 条提交。");
      if (data.diffSummary.truncated) {
        notices.push("部分敏感、二进制、生成文件或超出限额的代码差异未发送给 AI。");
      }
      setNotice(notices.join(" "));
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) {
        setError(reason instanceof Error ? reason.message : "报告生成失败");
      }
    } finally {
      abortRef.current = null;
      setState("idle");
    }
  }

  async function saveReport() {
    if (!report || !repository || !window.desktop) return;
    setError("");
    setNotice("");
    setState("saving");
    try {
      const result = await window.desktop.report.save({
        suggestedName: `${repository.name}-${since}-${until}-git-report.md`,
        content: report
      });
      if (!result.canceled) setNotice(`报告已保存到 ${result.filePath ?? "所选位置"}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存报告失败");
    } finally {
      setState("idle");
    }
  }

  if (!desktopAvailable) {
    return (
      <main className="report-page report-page--centered">
        <section className="desktop-required" aria-labelledby="desktop-required-title">
          <div className="desktop-required__mark" aria-hidden="true">
            Git
          </div>
          <h1 id="desktop-required-title">请在 PavilionMfe Desktop 中使用</h1>
          <p>生成本地 Git 报告需要桌面端授权访问仓库。浏览器页面不会获得本地文件权限。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="report-page">
      <header className="report-header">
        <div>
          <p className="eyebrow">Developer Intelligence</p>
          <h1>Git 工作报告</h1>
          <p className="report-header__description">读取本地提交记录，通过已配置的 AI 模型生成可追溯的研发总结。</p>
        </div>
        <span className="desktop-badge">Desktop · {window.desktop?.platform}</span>
      </header>

      {error ? (
        <div className="feedback feedback--error" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="feedback feedback--success" aria-live="polite">
          {notice}
        </div>
      ) : null}

      <section className="config-card" aria-labelledby="report-config-title">
        <div className="section-heading">
          <div>
            <p className="section-index">01</p>
            <h2 id="report-config-title">报告范围</h2>
          </div>
          <button className="button button--secondary" type="button" onClick={pickRepository} disabled={busy}>
            {repository ? "更换仓库" : "选择本地仓库"}
          </button>
        </div>

        {repository ? (
          <div className="repository-summary">
            <div className="repository-avatar" aria-hidden="true">
              {repository.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{repository.name}</strong>
              <span title={repository.path}>{repository.path}</span>
            </div>
            <div className="repository-remote">{repository.remoteUrl || "未配置 origin"}</div>
          </div>
        ) : (
          <button className="repository-empty" type="button" onClick={pickRepository}>
            <strong>选择一个 Git 工作仓库</strong>
            <span>仅在你确认后读取提交记录，不会修改仓库内容。</span>
          </button>
        )}

        <div className="form-grid">
          <label className="field">
            <span>分支</span>
            <select value={branch} onChange={event => setBranch(event.target.value)} disabled={!repository || busy}>
              {repository?.branches.length ? (
                repository.branches.map(item => <option key={item}>{item}</option>)
              ) : (
                <option value="HEAD">HEAD</option>
              )}
            </select>
          </label>
          <label className="field">
            <span>开始日期</span>
            <input type="date" value={since} onChange={event => setSince(event.target.value)} disabled={busy} />
          </label>
          <label className="field">
            <span>结束日期</span>
            <input type="date" value={until} onChange={event => setUntil(event.target.value)} disabled={busy} />
          </label>
          <label className="field">
            <span>作者筛选（可选）</span>
            <input
              value={author}
              onChange={event => setAuthor(event.target.value)}
              placeholder="姓名或邮箱"
              disabled={busy}
            />
          </label>
          <label className="field field--wide">
            <span>AI 模型</span>
            <select
              value={modelId}
              onChange={event => setModelId(event.target.value)}
              disabled={busy || !models.length}
            >
              {!models.length ? <option value="">暂无可用模型</option> : null}
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.displayName} · {model.id}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={includeMerges}
              onChange={event => setIncludeMerges(event.target.checked)}
              disabled={busy}
            />
            <span>包含合并提交</span>
          </label>
        </div>

        <div className="config-actions">
          <p>
            {selectedModel
              ? `将把经过过滤、脱敏和限额的 Git 代码差异发送给 ${selectedModel.displayName}`
              : "请先在 Provider 管理中配置可用模型"}
          </p>
          <button
            className="button button--primary"
            type="button"
            onClick={generate}
            disabled={!repository || !selectedModel || busy}
          >
            {state === "reading" ? "正在读取 Git…" : state === "generating" ? "AI 正在生成…" : "生成工作报告"}
          </button>
        </div>
      </section>

      {gitData ? (
        <section className="stats-grid" aria-label="Git 统计摘要">
          <article>
            <span>Commits</span>
            <strong>{gitData.totals.commits}</strong>
          </article>
          <article>
            <span>Additions</span>
            <strong className="number--positive">+{gitData.totals.additions.toLocaleString()}</strong>
          </article>
          <article>
            <span>Deletions</span>
            <strong className="number--negative">−{gitData.totals.deletions.toLocaleString()}</strong>
          </article>
          <article>
            <span>Files changed</span>
            <strong>{gitData.totals.changedFiles.toLocaleString()}</strong>
          </article>
        </section>
      ) : null}

      <section className="report-card" aria-labelledby="generated-report-title">
        <div className="section-heading">
          <div>
            <p className="section-index">02</p>
            <h2 id="generated-report-title">AI 报告</h2>
          </div>
          <button className="button button--secondary" type="button" onClick={saveReport} disabled={!report || busy}>
            {state === "saving" ? "保存中…" : "导出 Markdown"}
          </button>
        </div>
        {report ? (
          <pre className="report-content">{report}</pre>
        ) : (
          <div className="report-empty">
            <span>等待生成</span>
            <p>选择仓库和统计范围后，报告会流式显示在这里。</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Git;
