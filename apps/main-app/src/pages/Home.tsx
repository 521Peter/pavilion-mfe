import { useMemo, type CSSProperties } from "react";
import { navigateTo } from "@pavilion-mfe/router";
import { useMenus } from "../api/menu";
import { Icon } from "../components/Icon";
import { Card, Chip } from "@heroui/react";
import logoSvg from "../assets/pavilion-mfe-logo.svg";

/** 卡片 accent 色板（按索引循环） */
const accents = ["#42B883", "#38BDF8", "#61DAFB", "#F59E0B", "#64748B", "#EF4444"];

export default function Home() {
  const menuList = useMenus();

  const appCards = useMemo(() => menuList.filter(m => m.childrenMenuInfoList?.length), [menuList]);

  const totalPages = useMemo(
    () => appCards.reduce((sum, m) => sum + (m.childrenMenuInfoList?.length ?? 0), 0),
    [appCards]
  );

  return (
    <div>
      {/* Hero */}
      <section className="mb-10">
        <div className="flex items-center gap-6 max-md:flex-col max-md:items-start max-md:gap-4">
          <img className="w-[72px] h-[72px] shrink-0 max-md:w-14 max-md:h-14" src={logoSvg} alt="PavilionMfe" />
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold text-text-primary m-0 mb-1 tracking-[-0.5px] leading-[1.2] max-md:text-[24px]">
              PavilionMfe
            </h1>
            <p className="text-sm text-text-regular m-0 mb-3.5 leading-[1.5] max-w-[480px]">
              基于 Module Federation 的微前端开源框架，支持 Vue / React 混合渲染
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="secondary" className="bg-card-bg border border-border text-text-regular py-1 px-3">
                <span className="font-bold text-primary text-sm">{appCards.length}</span>
                <span className="ml-1">个子应用</span>
              </Chip>
              <Chip variant="secondary" className="bg-card-bg border border-border text-text-regular py-1 px-3">
                <span className="font-bold text-primary text-sm">{totalPages}</span>
                <span className="ml-1">个页面</span>
              </Chip>
            </div>
          </div>
        </div>
      </section>

      {/* App Cards */}
      <section>
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="text-base font-bold text-text-primary m-0">应用模块</h2>
          <span className="text-xs text-text-muted font-medium">{appCards.length} 个模块</span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-[18px] max-md:grid-cols-1">
          {appCards.map((app, index) => {
            const accent = accents[index % accents.length];
            return (
              <Card
                key={app.menuCode}
                variant="default"
                className="relative flex flex-row overflow-hidden min-h-[96px] opacity-0 translate-y-4 animate-card-entrance transition-transform hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]"
                style={
                  {
                    "--accent": accent,
                    animationDelay: `${index * 80}ms`
                  } as CSSProperties
                }
              >
                <div className="w-1 shrink-0" style={{ background: accent }} />
                <div className="flex-1 p-4 px-5 flex flex-col gap-3 min-w-0">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                        color: accent
                      }}
                    >
                      {app.menuIcon ? <Icon name={app.menuIcon} size={18} /> : null}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-text-primary m-0 leading-[1.3]">{app.menuName}</h3>
                      <span className="text-xs text-text-muted">{app.childrenMenuInfoList?.length ?? 0} 个页面</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {app.childrenMenuInfoList?.map(child => (
                      <button
                        key={child.menuUrl}
                        className="inline-flex items-center gap-1 py-1.5 px-3 text-xs font-medium text-text-regular bg-background border border-border rounded-md cursor-pointer transition-colors hover:text-white hover:border-[var(--accent)]"
                        style={{ ["--accent" as string]: accent }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = accent;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "";
                        }}
                        onClick={() => navigateTo(child.menuUrl)}
                      >
                        {child.menuIcon ? <Icon name={child.menuIcon} size={12} className="shrink-0" /> : null}
                        {child.menuName}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
