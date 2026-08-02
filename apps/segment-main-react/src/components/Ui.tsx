import type { CSSProperties, ReactNode } from 'react'
import { Icon } from './Icon'

/* ─── Button（复刻 el-button） ─── */

export function Button({
  type = 'default',
  icon,
  onClick,
  style,
  children,
}: {
  type?: 'default' | 'primary'
  icon?: string
  onClick?: () => void
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      className={`ui-btn${type === 'primary' ? ' ui-btn--primary' : ''}`}
      style={style}
      onClick={onClick}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  )
}

/* ─── Tag（复刻 el-tag） ─── */

export function Tag({
  type = 'primary',
  size,
  children,
}: {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'small'
  children?: ReactNode
}) {
  return (
    <span className={`ui-tag ui-tag--${type}${size === 'small' ? ' ui-tag--small' : ''}`}>
      {children}
    </span>
  )
}

/* ─── Space（复刻 el-space） ─── */

export function Space({
  wrap,
  size,
  style,
  children,
}: {
  wrap?: boolean
  size?: 'small' | 'large'
  style?: CSSProperties
  children?: ReactNode
}) {
  const cls = ['ui-space']
  if (size) cls.push(`ui-space--${size}`)
  if (wrap) cls.push('ui-space--wrap')
  return <div className={cls.join(' ')} style={style}>{children}</div>
}

/* ─── Table（复刻 el-table stripe） ─── */

export interface TableColumn<T> {
  prop: string
  label: string
  width?: number | string
  render?: (row: T) => ReactNode
}

export function Table<T>({
  columns,
  data,
}: {
  columns: TableColumn<T>[]
  data: T[]
}) {
  return (
    <table className="ui-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.prop} style={col.width != null ? { width: col.width } : undefined}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {columns.map((col) => (
              <td key={col.prop}>
                {col.render
                  ? col.render(row)
                  : String((row as Record<string, unknown>)[col.prop] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ─── Descriptions（复刻 el-descriptions border） ─── */

export interface DescriptionsItem {
  label: string
  value: ReactNode
}

export function Descriptions({
  items,
  column = 2,
}: {
  items: DescriptionsItem[]
  column?: number
}) {
  const rows: DescriptionsItem[][] = []
  for (let i = 0; i < items.length; i += column) {
    rows.push(items.slice(i, i + column))
  }
  return (
    <table className="ui-descriptions">
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((item) => (
              <>
                <th>{item.label}</th>
                <td>{item.value}</td>
              </>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ─── Skeleton（复刻 el-skeleton rows） ─── */

export function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ui-skeleton-item" />
      ))}
    </div>
  )
}
