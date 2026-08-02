import { useMemo, type CSSProperties } from 'react'
import { navigateTo } from '@pavilion-mfe/router'
import { useMenus } from '../api/menu'
import { Icon } from '../components/Icon'
import styles from './Home.module.css'
import logoSvg from '../assets/pavilion-mfe-logo.svg'

/** 卡片 accent 色板（按索引循环） */
const accents = ['#42B883', '#38BDF8', '#61DAFB', '#F59E0B', '#64748B', '#EF4444']

export default function Home() {
  const menuList = useMenus()

  /** 过滤出有子页面的应用模块（排除首页等无子菜单的项） */
  const appCards = useMemo(
    () => menuList.filter((m) => m.childrenMenuInfoList?.length),
    [menuList],
  )

  /** 所有子页面总数 */
  const totalPages = useMemo(
    () => appCards.reduce((sum, m) => sum + (m.childrenMenuInfoList?.length ?? 0), 0),
    [appCards],
  )

  return (
    <div className={styles.welcome}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <img className={styles.heroLogo} src={logoSvg} alt="PavilionMfe" />
          <div className={styles.heroBody}>
            <h1 className={styles.heroTitle}>PavilionMfe</h1>
            <p className={styles.heroSubtitle}>
              基于 Module Federation 的微前端开源框架，支持 Vue / React 混合渲染
            </p>
            <div className={styles.heroBadges}>
              <a
                className={`${styles.badge} ${styles.badgeGh}`}
                href="https://github.com/mrtanweijie/pavilion-mfe"
                target="_blank"
                rel="noopener"
              >
                <Icon name="Link" size={14} />
                <span>GitHub</span>
              </a>
              <span className={`${styles.badge} ${styles.badgeStat}`}>
                <span className={styles.badgeNum}>{appCards.length}</span>
                <span>个子应用</span>
              </span>
              <span className={`${styles.badge} ${styles.badgeStat}`}>
                <span className={styles.badgeNum}>{totalPages}</span>
                <span>个页面</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* App Cards */}
      <section className={styles.appsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>应用模块</h2>
          <span className={styles.sectionCount}>{appCards.length} 个模块</span>
        </div>

        <div className={styles.appCards}>
          {appCards.map((app, index) => (
            <article
              key={app.menuCode}
              className={styles.appCard}
              style={
                {
                  '--accent': accents[index % accents.length],
                  animationDelay: `${index * 80}ms`,
                } as CSSProperties
              }
            >
              <div className={styles.cardAccent} />
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIconCircle}>
                    {app.menuIcon ? <Icon name={app.menuIcon} size={18} /> : null}
                  </div>
                  <div className={styles.cardTitleGroup}>
                    <h3 className={styles.cardTitle}>{app.menuName}</h3>
                    <span className={styles.cardPageCount}>
                      {app.childrenMenuInfoList?.length ?? 0} 个页面
                    </span>
                  </div>
                </div>
                <div className={styles.cardTags}>
                  {app.childrenMenuInfoList?.map((child) => (
                    <button
                      key={child.menuUrl}
                      className={styles.cardTag}
                      onClick={() => navigateTo(child.menuUrl)}
                    >
                      {child.menuIcon ? (
                        <Icon name={child.menuIcon} size={12} className={styles.tagIcon} />
                      ) : null}
                      {child.menuName}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <p className={styles.footerNote}>
        更多文档请访问{' '}
        <a
          href="https://github.com/mrtanweijie/pavilion-mfe"
          target="_blank"
          rel="noopener"
        >
          GitHub 仓库
        </a>
      </p>
    </div>
  )
}
