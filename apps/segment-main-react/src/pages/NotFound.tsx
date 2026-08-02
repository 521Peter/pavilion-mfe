import ErrorPage from './ErrorPage'
import notFoundSvg from '../assets/404.svg'

export default function NotFound() {
  return <ErrorPage img={notFoundSvg} title="页面不存在" desc="请检查 URL 是否正确，或返回首页" />
}
