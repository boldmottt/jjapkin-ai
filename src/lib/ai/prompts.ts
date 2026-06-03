/**
 * AI 프롬프트 템플릿
 *
 * PRD 8.2절 기반 시스템 프롬프트 + Few-shot 예시
 * 다이어그램 유형별로 전문화된 프롬프트 제공
 */

import type { DiagramType } from "@/types";

// ── 시스템 프롬프트 ────────────────────────────────

export const SYSTEM_PROMPT = `You are a diagram generation expert. Your job is to convert text into structured visual diagrams.

Given text, you must:
1. Identify the main topic and key concepts
2. Determine the relationship between concepts:
   - sequential / step-by-step → "flowchart"
   - hierarchical / parent-child → "mindmap"
   - step-by-step with stages → "process"
   - comparing A vs B / multiple items → "comparison"
   - simple enumeration → "list"
   - chronological events / history / milestones → "timeline"
3. Output a valid JSON structure that describes nodes and edges.

Rules:
- Max 10 nodes per diagram (for readability)
- Each node label must be under 15 words
- Choose the single best diagram type (not multiple)
- Always provide a descriptive title
- Always respond in the same language as the input text
- For Korean inputs, use natural Korean labels

Output format (strict JSON):
{
  "diagramType": "flowchart",
  "title": "다이어그램 제목",
  "description": "이 다이어그램에 대한 간략한 설명",
  "nodes": [
    {"id": "n1", "label": "노드 레이블", "type": "process", "color": "#3B82F6"},
    ...
  ],
  "edges": [
    {"from": "n1", "to": "n2", "label": "조건/설명 (optional)"},
    ...
  ]
}

Node types:
- "start": 시작점 (flowchart), 보통 청록색(#10B981)
- "process": 일반 처리 단계, 보통 파란색(#3B82F6)
- "decision": 분기/판단 지점, 보통 주황색(#F59E0B)
- "end": 종료점, 보통 빨간색(#EF4444)
- 기본값: 없으면 "process"

Color suggestions per diagram type:
- flowchart: blue process nodes, green start, red end, orange decisions
- mindmap: root node darker, children lighter tones
- process: gradient from blue(start) to green(end)
- comparison: left column one color, right column another
- list: alternating light background colors

IMPORTANT: Provide 3 different visual interpretations of the same text.
Each interpretation uses a slightly different layout or emphasis.
Return all 3 in a single JSON response with the structure:
{
  "candidates": [
    {"id":"c1", "diagramType":"flowchart", ...nodes/edges...},
    {"id":"c2", "diagramType":"process", ...nodes/edges...},
    {"id":"c3", "diagramType":"flowchart", ...nodes/edges...}
  ]
}`;

// ── Few-shot 예시 ──────────────────────────────────

interface FewShotExample {
  input: string;
  output: object; // 실제 JSON 응답 예시
}

const FEWSHOT_EXAMPLES: FewShotExample[] = [
  {
    input:
      "First, the customer places an order. Then the system checks inventory. If in stock, payment is processed and order is confirmed. If out of stock, the customer is notified.",
    output: {
      candidates: [
        {
          id: "c1",
          diagramType: "flowchart",
          title: "Order Processing Flow",
          description:
            "Flowchart showing the order processing flow with inventory check",
          nodes: [
            { id: "n1", label: "Customer Places Order", type: "start", color: "#10B981" },
            { id: "n2", label: "Check Inventory", type: "decision", color: "#F59E0B" },
            { id: "n3", label: "Process Payment", type: "process", color: "#3B82F6" },
            { id: "n4", label: "Confirm Order", type: "end", color: "#EF4444" },
            { id: "n5", label: "Notify Customer", type: "end", color: "#EF4444" },
          ],
          edges: [
            { from: "n1", to: "n2" },
            { from: "n2", to: "n3", label: "In Stock" },
            { from: "n3", to: "n4" },
            { from: "n2", to: "n5", label: "Out of Stock" },
          ],
        },
      ],
    },
  },
  {
    input: "회사의 조직 구조: CEO 아래에 CTO, CFO, COO가 있고, CTO 아래에 개발팀과 인프라팀이 있습니다.",
    output: {
      candidates: [
        {
          id: "c1",
          diagramType: "mindmap",
          title: "회사 조직도",
          description: "CEO를 중심으로 한 회사 조직 구조",
          nodes: [
            { id: "n1", label: "CEO", type: "start", color: "#1E40AF" },
            { id: "n2", label: "CTO", type: "process", color: "#3B82F6" },
            { id: "n3", label: "CFO", type: "process", color: "#3B82F6" },
            { id: "n4", label: "COO", type: "process", color: "#3B82F6" },
            { id: "n5", label: "개발팀", type: "process", color: "#60A5FA" },
            { id: "n6", label: "인프라팀", type: "process", color: "#60A5FA" },
          ],
          edges: [
            { from: "n1", to: "n2" },
            { from: "n1", to: "n3" },
            { from: "n1", to: "n4" },
            { from: "n2", to: "n5" },
            { from: "n2", to: "n6" },
          ],
        },
      ],
    },
  },
  {
    input:
      "A팀과 B팀의 업무 방식을 비교해보면: A팀은 애자일 방식으로 2주 스프린트를 운영하고 매일 스크럼을 합니다. B팀은 워터폴 방식으로 월 단위 마일스톤을 사용하고 주간 회의만 합니다. A팀은 Jira를, B팀은 노션을 사용합니다.",
    output: {
      candidates: [
        {
          id: "c1",
          diagramType: "comparison",
          title: "A팀 vs B팀 업무 방식 비교",
          description: "두 팀의 업무 방식 차이 비교",
          nodes: [
            { id: "n1", label: "A팀 (애자일)", type: "process", color: "#3B82F6" },
            { id: "n2", label: "B팀 (워터폴)", type: "process", color: "#F59E0B" },
            { id: "n3", label: "2주 스프린트", type: "process", color: "#93C5FD" },
            { id: "n4", label: "월 단위 마일스톤", type: "process", color: "#FCD34D" },
            { id: "n5", label: "매일 스크럼", type: "process", color: "#93C5FD" },
            { id: "n6", label: "주간 회의", type: "process", color: "#FCD34D" },
            { id: "n7", label: "Jira 사용", type: "process", color: "#93C5FD" },
            { id: "n8", label: "노션 사용", type: "process", color: "#FCD34D" },
          ],
          edges: [
            { from: "n1", to: "n3" },
            { from: "n1", to: "n5" },
            { from: "n1", to: "n7" },
            { from: "n2", to: "n4" },
            { from: "n2", to: "n6" },
            { from: "n2", to: "n8" },
          ],
        },
      ],
    },
  },
];

// ── 유형별 지시사항 ────────────────────────────────

export const TYPE_INSTRUCTIONS: Record<DiagramType, string> = {
  flowchart:
    "Convert this into a flowchart with decision branches. Use diamond shapes for decision nodes (type:'decision'). Focus on if-then-else logic.",
  mindmap:
    "Convert this into a mind map or hierarchical tree. Root node at the center, children radiating outward. Use type:'process' for all nodes.",
  process:
    "Convert this into a linear process diagram. Steps go left-to-right or top-to-bottom. First step is type:'start', last step is type:'end', middle steps are type:'process'. No branches.",
  comparison:
    "Convert this into a comparison table layout. Group items by category. Use alternating colors for left/right columns. Use type:'process' for all nodes.",
  list:
    "Convert this into a simple bullet-list style diagram. Items in vertical order. Use type:'process' for all nodes with subtle alternating background colors.",
  timeline:
    "Convert this into a chronological timeline. Order nodes by time (earliest first). Each node is an event/milestone with a date or phase in its label. Connect consecutive events with edges (n1→n2→n3...). Use type:'process' for events.",
};

// ── 빌더 함수 ──────────────────────────────────────

/**
 * 최종 사용자 프롬프트 생성
 */
export function buildUserPrompt(
  text: string,
  diagramType?: DiagramType,
): string {
  let prompt = "";
  // Few-shot 예시 먼저
  prompt += "Here are examples of the expected output format:\n\n";

  for (const ex of FEWSHOT_EXAMPLES) {
    prompt += `Input: "${ex.input}"\n`;
    prompt += `Output: ${JSON.stringify(ex.output)}\n\n`;
  }

  // 유형 지정 추가
  if (diagramType) {
    prompt += `\n${TYPE_INSTRUCTIONS[diagramType]}\n\n`;
  }

  // 실제 텍스트
  prompt += `Now, convert this text: "${text}"`;

  return prompt;
}

/**
 * 시스템 프롬프트 + 사용자 메시지를 결합
 */
export function buildMessages(
  text: string,
  diagramType?: DiagramType,
): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(text, diagramType),
  };
}
