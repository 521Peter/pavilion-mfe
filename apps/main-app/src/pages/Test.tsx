import { navigateTo } from '@pavilion-mfe/router'
import { Button, Space, Table } from '../components/Ui'
import styles from './Page.module.css'

const tableData = [
  { label: '当前路径', value: window.location.pathname },
  { label: '框架', value: 'React 19 + TypeScript' },
  { label: '微前端', value: 'PavilionMfe (Module Federation)' },
  { label: '构建工具', value: 'Vite 8' },
]

export default function Test() {
  return (
    <div className={styles.pageWrapper}>
      <h2>测试页</h2>
      <p className={styles.pageDesc}>这是主应用自带的页面，不经过子应用加载。</p>

      <div className={styles.card}>
        <div className={styles.cardTitle}>环境信息</div>
        <Table
          columns={[
            { prop: 'label', label: '项目', width: 120 },
            { prop: 'value', label: '值' },
          ]}
          data={tableData}
        />
      </div>

      <div className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardTitle}>导航测试</div>
        <Space wrap>
          <Button type="primary" onClick={() => navigateTo('/demo/list')}>
            Vue 列表页
          </Button>
          <Button onClick={() => navigateTo('/demo/form')}>Vue 表单页</Button>
          <Button type="primary" onClick={() => navigateTo('/react/list')}>
            React 列表页
          </Button>
          <Button onClick={() => navigateTo('/react/dashboard')}>React 仪表盘</Button>
        </Space>
      </div>
    </div>
  )
}
