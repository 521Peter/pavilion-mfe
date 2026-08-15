import ErrorPage from "./ErrorPage";
import forbiddenSvg from "../assets/403.svg";

export default function Forbidden() {
  return <ErrorPage img={forbiddenSvg} title="权限不足" desc="您没有权限访问此页面" />;
}
