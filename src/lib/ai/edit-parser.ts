/**
 * AI 편집 응답 파서
 *
 * AI가 자유 텍스트 대신 "제한된 편집 op"만 내도록 zod로 강제·검증한다.
 * 생성 파서(parser.ts)와 동일한 안전 패턴.
 */
import { z } from "zod";
import type { EditOp } from "@/lib/scene/edit";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color");
const alignMode = z.enum(["left", "center", "right", "top", "middle", "bottom"]);
const axis = z.enum(["horizontal", "vertical"]);

const opSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("recolor"), color: hex }),
  z.object({ op: z.literal("recolorStroke"), color: hex }),
  z.object({
    op: z.literal("resize"),
    width: z.number().positive().max(2000).optional(),
    height: z.number().positive().max(2000).optional(),
  }),
  z.object({ op: z.literal("opacity"), value: z.number().min(0).max(100) }),
  z.object({ op: z.literal("strokeWidth"), value: z.number().min(0).max(20) }),
  z.object({
    op: z.literal("fillStyle"),
    value: z.enum(["solid", "hachure", "cross-hatch", "zigzag"]),
  }),
  z.object({ op: z.literal("roundness"), rounded: z.boolean() }),
  z.object({ op: z.literal("emphasize") }),
  z.object({ op: z.literal("relabel"), text: z.string().min(1).max(120) }),
  z.object({ op: z.literal("align"), mode: alignMode }),
  z.object({ op: z.literal("distribute"), axis }),
  z.object({ op: z.literal("flip"), axis }),
  z.object({ op: z.literal("shadow") }),
]);

const responseSchema = z.object({
  ops: z.array(opSchema).min(1, "At least one op").max(10),
});

export function parseEditResponse(rawJson: unknown): EditOp[] {
  const result = responseSchema.safeParse(rawJson);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`AI edit validation failed:\n${issues}`);
  }
  return result.data.ops as EditOp[];
}
