import Link from "next/link";
import { Sparkles, ArrowRight, GitFork, Network, ArrowLeftRight, List, GitGraph } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          텍스트를 쓰면{" "}
          <span className="text-primary">AI가 다이어그램</span>을 그려줍니다
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          JJapkin AI에 텍스트를 붙여넣기만 하세요. AI가 플로우차트, 마인드맵, 프로세스 다이어그램을 즉시 생성합니다.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            무료로 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          DeepSeek AI 기반 · 설치 불필요 · 한국어 최적화
        </p>
      </header>

      {/* Diagram Types */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">5가지 다이어그램 유형</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: GitFork, label: "플로우차트", desc: "조건 분기, 의사결정" },
            { icon: Network, label: "마인드맵", desc: "계층 구조, 조직도" },
            { icon: GitGraph, label: "프로세스", desc: "단계별 순서" },
            { icon: ArrowLeftRight, label: "비교표", desc: "A vs B 분석" },
            { icon: List, label: "리스트", desc: "항목 나열" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-xl border p-6 text-center transition-colors hover:border-primary/50"
            >
              <Icon className="mb-3 h-8 w-8 text-primary" />
              <p className="font-semibold">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold">사용 방법</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "텍스트 입력", desc: "보고서, 회의록, 블로그 글을 붙여넣으세요" },
              { step: "2", title: "AI 생성", desc: "Ctrl+Enter 또는 버튼 클릭으로 즉시 생성" },
              { step: "3", title: "편집 & 내보내기", desc: "벡터 편집 후 PNG, SVG, PPT로 저장" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step}
                </div>
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        JJapkin AI · DeepSeek AI 기반 · 한국어 최적화 다이어그램 생성기
      </footer>
    </div>
  );
}
