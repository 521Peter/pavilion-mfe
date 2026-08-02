import styles from './Logo.module.css'
import logoSvg from '../assets/pavilion-mfe-logo.svg'

export default function Logo() {
  return <img src={logoSvg} className={styles.logoIcon} alt="logo" />
}
