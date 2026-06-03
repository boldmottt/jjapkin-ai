"use client";

import { Component, type ReactNode } from "react";

/**
 * Excalidraw/tunnel-rat infinite update 방지용 에러 바운더리
 *
 * tunnel-rat의 zustand store가 React unmount 단계에서 setState를 호출해
 * Maximum update depth exceeded가 발생하는 알려진 버그를 포착합니다.
 */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ExcalidrawErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (error.message?.includes("Maximum update depth exceeded")) {
      // tunnel-rat 버그는 무시하고 다시 렌더링 시도
      this.setState({ hasError: false });
      return;
    }
    throw error;
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full items-center justify-center bg-muted/30">
            <p className="text-sm text-muted-foreground">편집기를 불러오는 중...</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
