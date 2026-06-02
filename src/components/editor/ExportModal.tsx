"use client";

import { useEffect, useState } from "react";
import { Download, FileImage, FileText, Presentation, PenTool } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ExportFormat = "ai-svg" | "ai-pdf" | "eps" | "png" | "svg" | "pptx" | "pdf";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void | Promise<void>;
}

const FORMATS: {
  id: ExportFormat;
  label: string;
  icon: typeof PenTool;
  ext: string;
  desc: string;
  priority: boolean;
}[] = [
  {
    id: "ai-svg",
    label: "Illustrator SVG",
    icon: PenTool,
    ext: ".ai.svg",
    desc: "Adobe Illustrator에서 바로 열어서 편집 가능한 벡터 파일",
    priority: true,
  },
  {
    id: "ai-pdf",
    label: "Illustrator PDF",
    icon: PenTool,
    ext: ".ai.pdf",
    desc: "Illustrator에서 PDF 열기로 편집. 벡터 유지",
    priority: true,
  },
  {
    id: "eps",
    label: "EPS (Illustrator)",
    icon: PenTool,
    ext: ".eps",
    desc: "레거시 PostScript. 모든 버전의 Illustrator 호환",
    priority: true,
  },
  {
    id: "png",
    label: "PNG 이미지",
    icon: FileImage,
    ext: ".png",
    desc: "고해상도 비트맵. 어디에나 붙여넣기 가능",
    priority: false,
  },
  {
    id: "svg",
    label: "SVG 벡터 (웹용)",
    icon: Download,
    ext: ".svg",
    desc: "웹/피그마용 표준 SVG",
    priority: false,
  },
  {
    id: "pptx",
    label: "PowerPoint 슬라이드",
    icon: Presentation,
    ext: ".pptx",
    desc: "파워포인트에서 각 요소를 개별 편집 가능",
    priority: false,
  },
  {
    id: "pdf",
    label: "PDF 문서",
    icon: FileText,
    ext: ".pdf",
    desc: "공유/인쇄용 범용 문서",
    priority: false,
  },
];

export function ExportModal({ open, onClose, onExport }: ExportModalProps) {
  const [selected, setSelected] = useState<ExportFormat>("ai-svg");
  const [exporting, setExporting] = useState(false);

  // Esc로 닫기 (내보내는 중에는 막음)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exporting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, exporting, onClose]);

  if (!open) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(selected);
    } finally {
      setExporting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        // 바깥(backdrop) 클릭 시 닫기
        if (e.target === e.currentTarget && !exporting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold">내보내기</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Adobe Illustrator 호환 형식을 최우선 지원합니다
        </p>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {FORMATS.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => setSelected(format.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  format.priority && "border-amber-500/30 bg-amber-500/5",
                  selected === format.id
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border hover:border-primary/50",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    format.priority ? "text-amber-600" : "text-muted-foreground",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{format.label}</p>
                    {format.priority && (
                      <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{format.desc}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{format.ext}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            취소
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? "내보내는 중..." : `${selected.toUpperCase()} 내보내기`}
          </button>
        </div>
      </div>
    </div>
  );
}
