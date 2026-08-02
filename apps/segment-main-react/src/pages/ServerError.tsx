import ErrorPage from './ErrorPage'
import serverErrorSvg from '../assets/500.svg'

export default function ServerError() {
  return <ErrorPage img={serverErrorSvg} title="服务器错误" desc="服务端出现问题，请稍后重试" />
}
