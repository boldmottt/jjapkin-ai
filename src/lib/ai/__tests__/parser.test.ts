/**
 * AI 파서 유닛 테스트
 *
 * parseAIResponse — OpenAI 응답 JSON → GenerationCandidate[]
 * inferDiagramType — 휴리스틱 다이어그램 유형 추론
 */

import { describe, it, expect } from "vitest";
import {
  parseAIResponse,
  buildGenerationResponse,
  inferDiagramType,
} from "@/lib/ai/parser";

// ── parseAIResponse ────────────────────────────────

describe("parseAIResponse", () => {
  const validResponse = {
    candidates: [
      {
        id: "c1",
        diagramType: "flowchart",
        title: "Order Flow",
        description: "Processes orders",
        nodes: [
          { id: "n1", label: "Start", type: "start", color: "#10B981" },
          { id: "n2", label: "Process", type: "process", color: "#3B82F6" },
          { id: "n3", label: "End", type: "end", color: "#EF4444" },
        ],
        edges: [
          { from: "n1", to: "n2" },
          { from: "n2", to: "n3", label: "done" },
        ],
      },
    ],
  };

  it("정상적인 AI 응답을 파싱", () => {
    const candidates = parseAIResponse(validResponse);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].ir.title).toBe("Order Flow");
    expect(candidates[0].ir.nodes).toHaveLength(3);
    expect(candidates[0].ir.edges).toHaveLength(2);
  });

  it("nodes가 없으면 에러", () => {
    expect(() =>
      parseAIResponse({ candidates: [{ ...validResponse.candidates[0], nodes: [] }] }),
    ).toThrow("At least one node required");
  });

  it("label이 없는 node는 에러", () => {
    expect(() =>
      parseAIResponse({
        candidates: [{ ...validResponse.candidates[0], nodes: [{ id: "n1" }] }],
      }),
    ).toThrow("Required");
  });

  it("빈 객체는 에러", () => {
    expect(() => parseAIResponse({})).toThrow();
  });

  it("null은 에러", () => {
    expect(() => parseAIResponse(null)).toThrow();
  });

  it("id 없는 candidate는 에러", () => {
    expect(() =>
      parseAIResponse({
        candidates: [{ ...validResponse.candidates[0], id: "" }],
      }),
    ).toThrow();
  });

  it("잘못된 hex 컬러는 거부", () => {
    expect(() =>
      parseAIResponse({
        candidates: [
          {
            ...validResponse.candidates[0],
            nodes: [{ id: "n1", label: "Test", color: "not-a-color" }],
          },
        ],
      }),
    ).toThrow("Invalid hex color");
  });

  it("type 누락 시 기본값 'process' 적용", () => {
    const result = parseAIResponse({
      candidates: [
        {
          ...validResponse.candidates[0],
          nodes: [{ id: "n1", label: "Test" }],
        },
      ],
    });
    expect(result[0].ir.nodes[0].type).toBe("process");
  });

  it("edge에 label이 없으면 undefined로 변환", () => {
    const result = parseAIResponse({
      candidates: [
        {
          ...validResponse.candidates[0],
          edges: [{ from: "n1", to: "n2" }],
        },
      ],
    });
    expect(result[0].ir.edges[0].label).toBeUndefined();
  });

  it("최대 3개까지 후보 허용", () => {
    const three = parseAIResponse({
      candidates: [
        { ...validResponse.candidates[0], id: "c1" },
        { ...validResponse.candidates[0], id: "c2" },
        { ...validResponse.candidates[0], id: "c3" },
      ],
    });
    expect(three).toHaveLength(3);
  });
});

// ── buildGenerationResponse ────────────────────────

describe("buildGenerationResponse", () => {
  const mockCandidates = [
    {
      id: "c1",
      ir: {
        diagramType: "flowchart" as const,
        title: "Test",
        nodes: [{ id: "n1", label: "A" }],
        edges: [],
      },
    },
  ];

  it("fromCache=false", () => {
    const resp = buildGenerationResponse(mockCandidates, { tokensUsed: 100, fromCache: false });
    expect(resp.fromCache).toBe(false);
    expect(resp.tokensUsed).toBe(100);
    expect(resp.recommendedType).toBe("flowchart");
  });

  it("fromCache=true", () => {
    const resp = buildGenerationResponse(mockCandidates, { tokensUsed: 0, fromCache: true });
    expect(resp.fromCache).toBe(true);
  });

  it("빈 후보는 에러", () => {
    expect(() =>
      buildGenerationResponse([], { tokensUsed: 0, fromCache: false }),
    ).toThrow("No candidates");
  });
});

// ── inferDiagramType ───────────────────────────────

describe("inferDiagramType", () => {
  it("if/만약 키워드 → flowchart", () => {
    expect(inferDiagramType("만약 재고가 없으면 알림을 보냅니다")).toBe("flowchart");
    expect(inferDiagramType("if the value is null then return default")).toBe("flowchart");
  });

  it("step/단계 키워드 → process", () => {
    expect(inferDiagramType("1단계: 기획, 2단계: 개발")).toBe("process");
    expect(inferDiagramType("phase 1 is planning, phase 2 is build")).toBe("process");
    expect(inferDiagramType("순서대로 진행합니다")).toBe("process");
  });

  it("비교/vs 키워드 → comparison", () => {
    expect(inferDiagramType("A팀 vs B팀의 차이")).toBe("comparison");
    expect(inferDiagramType("compare the two options")).toBe("comparison");
  });

  it("조직/계층 키워드 → mindmap", () => {
    expect(inferDiagramType("회사 조직 구조는 다음과 같습니다")).toBe("mindmap");
    expect(inferDiagramType("the hierarchy consists of")).toBe("mindmap");
  });

  it("그 외 → flowchart (기본값)", () => {
    expect(inferDiagramType("안녕하세요")).toBe("flowchart");
    expect(inferDiagramType("")).toBe("flowchart");
  });
});
