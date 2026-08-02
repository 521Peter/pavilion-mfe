import { useNavigate } from 'react-router-dom'
import { useTabs } from '@pavilion-mfe/tabs/react'
import { Button } from '../components/Ui'
import styles from './Error.module.css'

export default function ErrorPage({
  img,
  title,
  desc,
}: {
  img: string
  title: string
  desc: string
}) {
  const navigate = useNavigate()
  const { activeTabId, closeTab } = useTabs()

  function goHome() {
    if (activeTabId) closeTab(activeTabId)
    navigate('/')
  }

  return (
    <div className={styles.errorPage}>
      <img src={img} alt={title} className={styles.errorImg} />
      <h2 className={styles.errorTitle}>{title}</h2>
      <p className={styles.errorDesc}>{desc}</p>
      <Button type="primary" icon="Back" onClick={goHome}>
        返回首页
      </Button>
    </div>
  )
}
