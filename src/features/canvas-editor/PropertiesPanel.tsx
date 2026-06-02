"use client";

/**
 * 속성(인스펙터) 패널 — Adobe Illustrator 스타일
 *
 * 선택한 객체의 색·오퍼시티·크기·위치·회전·뒤집기·정렬·획 등을 보여주고
 * 수정한다. 실제 반영은 상위(CanvasEditor)가 Excalidraw로 수행.
 */

import { useEffect, useRef, useState } from "react";
import { FlipHorizontal, FlipVertical, X } from "lucide-react";
import {
  asHex,
  radToDeg,
  degToRad,
  type PropEl,
  type AlignMode,
} from "@/lib/element-props";

interface PropertiesPanelProps {
  elements: PropEl[]; // 선택된 요소들
  onPatch: (patch: Record<string, unknown>) => void;
  onFlip: (axis: "horizontal" | "vertical") => void;
  onAlign: (mode: AlignMode) => void;
  onClose: () => void;
}

const num = (v: unknown, d = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : d;

export function PropertiesPanel({
  elements,
  onPatch,
  onFlip,
  onAlign,
  onClose,
}: PropertiesPanelProps) {
  const first = elements[0];
  if (!first) return null;
  const single = elements.length === 1;
  const multi = elements.length >= 2;

  const bg = first.backgroundColor;
  const isTransparent = bg === "transparent" || bg == null;

  return (
    <div className="absolute left-3 top-3 z-20 flex max-h-[calc(100%-1.5rem)] w-64 flex-col rounded-lg border bg-background/95 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold">
          속성 {multi ? `· ${elements.length}개 선택` : ""}
        </span>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted"
          aria-label="속성 패널 닫기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        {/* 색상 */}
        <Section label="색상">
          <Row label="채움">
            <input
              type="color"
              value={asHex(bg, "#ffffff")}
              onChange={(e) => onPatch({ backgroundColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0"
              aria-label="채움 색"
            />
            <button
              onClick={() =>
                onPatch({
                  backgroundColor: isTransparent ? "#e2e8f0" : "transparent",
                })
              }
              className={
                "rounded border px-2 py-1 text-[11px] " +
                (isTransparent ? "border-primary text-primary" : "")
              }
            >
              투명
            </button>
          </Row>
          <Row label="획">
            <input
              type="color"
              value={asHex(first.strokeColor, "#1f2937")}
              onChange={(e) => onPatch({ strokeColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0"
              aria-label="획 색"
            />
          </Row>
        </Section>

        {/* 오퍼시티 */}
        <Section label="오퍼시티">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={num(first.opacity, 100)}
              onChange={(e) => onPatch({ opacity: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="w-8 text-right tabular-nums text-muted-foreground">
              {num(first.opacity, 100)}
            </span>
          </div>
        </Section>

        {/* 획 */}
        <Section label="획">
          <Row label="두께">
            <NumberField
              value={num(first.strokeWidth, 1)}
              min={0.5}
              step={0.5}
              onCommit={(v) => onPatch({ strokeWidth: v })}
            />
          </Row>
          <Row label="스타일">
            <Select
              value={String(first.strokeStyle ?? "solid")}
              onChange={(v) => onPatch({ strokeStyle: v })}
              options={[
                ["solid", "실선"],
                ["dashed", "파선"],
                ["dotted", "점선"],
              ]}
            />
          </Row>
        </Section>

        {/* 채움 스타일 */}
        <Section label="채움 스타일">
          <Select
            value={String(first.fillStyle ?? "solid")}
            onChange={(v) => onPatch({ fillStyle: v })}
            options={[
              ["solid", "솔리드"],
              ["hachure", "빗금"],
              ["cross-hatch", "교차 빗금"],
              ["zigzag", "지그재그"],
            ]}
          />
        </Section>

        {/* 위치 & 크기 (단일 선택) */}
        {single && (
          <Section label="위치 & 크기">
            <div className="grid grid-cols-2 gap-2">
              <Labeled label="X">
                <NumberField
                  value={Math.round(num(first.x))}
                  onCommit={(v) => onPatch({ x: v })}
                />
              </Labeled>
              <Labeled label="Y">
                <NumberField
                  value={Math.round(num(first.y))}
                  onCommit={(v) => onPatch({ y: v })}
                />
              </Labeled>
              <Labeled label="너비">
                <NumberField
                  value={Math.round(num(first.width))}
                  min={1}
                  onCommit={(v) => onPatch({ width: v })}
                />
              </Labeled>
              <Labeled label="높이">
                <NumberField
                  value={Math.round(num(first.height))}
                  min={1}
                  onCommit={(v) => onPatch({ height: v })}
                />
              </Labeled>
            </div>
          </Section>
        )}

        {/* 회전 & 뒤집기 */}
        <Section label="회전 & 뒤집기">
          <Row label="회전°">
            <NumberField
              value={radToDeg(num(first.angle))}
              onCommit={(v) => onPatch({ angle: degToRad(v) })}
            />
          </Row>
          <div className="flex gap-2">
            <IconButton onClick={() => onFlip("horizontal")} label="가로 뒤집기">
              <FlipHorizontal className="h-4 w-4" />
            </IconButton>
            <IconButton onClick={() => onFlip("vertical")} label="세로 뒤집기">
              <FlipVertical className="h-4 w-4" />
            </IconButton>
          </div>
        </Section>

        {/* 정렬 (다중 선택) */}
        {multi && (
          <Section label="정렬">
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ["left", "좌"],
                  ["center", "가운데"],
                  ["right", "우"],
                  ["top", "위"],
                  ["middle", "중간"],
                  ["bottom", "아래"],
                ] as [AlignMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => onAlign(mode)}
                  className="rounded border py-1 text-[11px] transition-colors hover:border-primary/50"
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ── 보조 컴포넌트 ───────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  value,
  onCommit,
  min,
  step = 1,
}: {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  step?: number;
}) {
  // 로컬 버퍼: 입력 중에는 외부 값으로 덮어쓰지 않고, blur/Enter에서 커밋
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const commit = () => {
    const v = parseFloat(text);
    if (Number.isFinite(v)) onCommit(v);
    else setText(String(value));
  };

  return (
    <input
      type="number"
      value={text}
      min={min}
      step={step}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="w-16 rounded border bg-transparent px-1.5 py-1 text-right tabular-nums outline-none focus:border-primary"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border bg-transparent px-1.5 py-1 outline-none focus:border-primary"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex flex-1 items-center justify-center rounded border py-1.5 transition-colors hover:border-primary/50"
    >
      {children}
    </button>
  );
}
