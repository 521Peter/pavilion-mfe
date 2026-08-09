import type { CSSProperties, ReactNode } from 'react'
import { Icon } from './Icon'
import { Button as ShadcnButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ─── Button（复刻 el-button，底层使用 shadcn Button） ─── */

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
    <ShadcnButton
      variant={type === 'primary' ? 'primary' : 'default'}
      style={style}
      onClick={onClick}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </ShadcnButton>
  )
}

/* ─── Tag（复刻 el-tag） ─── */

const tagVariants: Record<string, string> = {
  primary: 'text-primary bg-primary-light border-[rgba(99,91,255,0.2)]',
  success: 'text-[#67c23a] bg-[rgba(103,194,58,0.1)] border-[rgba(103,194,58,0.2)]',
  warning: 'text-[#e6a23c] bg-[rgba(230,162,60,0.1)] border-[rgba(230,162,60,0.2)]',
  danger: 'text-[#f56c6c] bg-[rgba(245,108,108,0.1)] border-[rgba(245,108,108,0.2)]',
  info: 'text-[#909399] bg-[rgba(144,147,153,0.1)] border-[rgba(144,147,153,0.2)]',
}

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
    <span
      className={cn(
        'inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium leading-none rounded border whitespace-nowrap',
        tagVariants[type],
        size === 'small' && 'h-6 px-2',
      )}
    >
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
  return (
    <div
      className={cn(
        'flex gap-2',
        size === 'small' && 'gap-1',
        size === 'large' && 'gap-4',
        wrap && 'flex-wrap',
      )}
      style={style}
    >
      {children}
    </div>
  )
}

/* ─── Table（复刻 el-table stripe） ─── */

export interface TableColumn<T> {
  prop: string
  label: string
  width?: number | string
  render?: (row: T) => ReactNode
}

const tableClass =
  'w-full border-collapse text-sm text-text-primary ' +
  '[&_th]:text-left [&_th]:py-3 [&_th]:border-b [&_th]:border-[#ebeef5] [&_th]:bg-[#f5f7fa] [&_th]:text-[#909399] [&_th]:font-medium ' +
  '[&_td]:text-left [&_td]:py-3 [&_td]:border-b [&_td]:border-[#ebeef5] ' +
  '[&_th:first-child]:pl-0 [&_td:first-child]:pl-0 ' +
  '[&_tbody_tr:nth-child(even)]:bg-[#fafafa] [&_tbody_tr:hover]:bg-[#f5f7fa]'

export function Table<T>({
  columns,
  data,
}: {
  columns: TableColumn<T>[]
  data: T[]
}) {
  return (
    <table className={tableClass}>
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

const descThClass =
  'p-3 px-4 border border-[#ebeef5] text-left bg-[#f5f7fa] text-[#909399] font-medium whitespace-nowrap w-px'
const descTdClass = 'p-3 px-4 border border-[#ebeef5] text-left'

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
    <table className="w-full border-collapse text-sm text-text-primary">
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((item, itemIdx) => (
              <>
                <th key={`${rowIdx}-${itemIdx}-th`} className={descThClass}>{item.label}</th>
                <td key={`${rowIdx}-${itemIdx}-td`} className={descTdClass}>{item.value}</td>
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
        <div
          key={i}
          className="h-4 my-4 rounded animate-skeleton"
          style={{
            background:
              'linear-gradient(90deg, #f2f3f5 25%, #e6e8eb 37%, #f2f3f5 63%)',
            backgroundSize: '400% 100%',
          }}
        />
      ))}
    </div>
  )
}
