import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-white p-8 dark:bg-[#16171d]">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              页面出错了
            </h1>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {this.state.error?.message ?? "发生未知错误"}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white transition hover:bg-indigo-600"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
