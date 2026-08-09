import { useMenus } from '../api/menu'
import { Descriptions, Table, Tag } from '../components/Ui'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export default function Env() {
  const menus = useMenus()

  const currentPath = window.location.pathname
  const ua = navigator.userAgent
  const language = navigator.language
  const online = navigator.onLine

  const pavilionMfeEnv = (import.meta.env.VITE_PAVILION_MFE_ENV || 'dev') as string
  const apiBase = (import.meta.env.VITE_BASE_API_URL || '') as string
  const cdn = (import.meta.env.VITE_PAVILION_MFE_CDN || '') as string

  const envTagType: TagType =
    pavilionMfeEnv === 'production' ? 'danger' : pavilionMfeEnv === 'uat' ? 'warning' : 'success'

  const infoCards: { label: string; value: string; tagType: TagType }[] = [
    { label: '框架', value: 'React 19', tagType: 'success' },
    { label: '构建工具', value: 'Vite 8', tagType: 'warning' },
    { label: '微前端', value: 'PavilionMfe', tagType: 'primary' },
  ]

  return (
    <div>
      <h2 className="m-0 text-[22px] text-text-primary font-bold">环境信息</h2>

      <div className="grid grid-cols-3 gap-4 mt-6 max-[900px]:grid-cols-1">
        {infoCards.map((item) => (
          <div key={item.label} className="flex items-center justify-between bg-card-bg border border-border rounded-lg p-5 mb-4">
            <div className="text-[13px] font-semibold text-text-muted">{item.label}</div>
            <Tag type={item.tagType}>{item.value}</Tag>
          </div>
        ))}
      </div>

      <div className="bg-card-bg border border-border rounded-lg p-5 mt-4">
        <div className="text-sm font-bold text-text-primary mb-4">已注册菜单</div>
        <Table
          columns={[
            { prop: 'menuCode', label: '菜单编码' },
            { prop: 'menuName', label: '菜单名称' },
            { prop: 'menuUrl', label: '路由地址' },
            {
              prop: 'menuTp',
              label: '类型',
              width: 80,
              render: (row) => (
                <Tag type={row.menuTp === '0' ? 'primary' : 'info'} size="small">
                  {row.menuTp === '0' ? '目录' : '菜单'}
                </Tag>
              ),
            },
            {
              prop: 'status',
              label: '状态',
              width: 80,
              render: (row) => (
                <Tag type={row.status === '1' ? 'success' : 'danger'} size="small">
                  {row.status === '1' ? '启用' : '禁用'}
                </Tag>
              ),
            },
          ]}
          data={menus}
        />
      </div>

      <div className="bg-card-bg border border-border rounded-lg p-5 mt-4">
        <div className="text-sm font-bold text-text-primary mb-4">环境配置</div>
        <Descriptions
          items={[
            { label: '当前环境', value: <Tag type={envTagType}>{pavilionMfeEnv}</Tag> },
            { label: 'API Base', value: apiBase || '-' },
            { label: 'CDN', value: cdn || '-' },
          ]}
        />
      </div>

      <div className="bg-card-bg border border-border rounded-lg p-5 mt-4">
        <div className="text-sm font-bold text-text-primary mb-4">运行时信息</div>
        <Descriptions
          items={[
            { label: '当前路径', value: currentPath },
            { label: 'User Agent', value: ua },
            { label: '语言', value: language },
            { label: '在线状态', value: online ? '在线' : '离线' },
          ]}
        />
      </div>
    </div>
  )
}
