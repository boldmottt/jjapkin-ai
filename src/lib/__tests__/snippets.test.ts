import { describe, it, expect, beforeEach } from "vitest";
import {
  addItem,
  removeItem,
  saveSnippet,
  loadSnippets,
  deleteSnippet,
  saveTemplate,
  loadTemplates,
} from "@/lib/snippets";
import { filterCommands } from "@/stores/commands";
import type { Command } from "@/stores/commands";
import type { DiagramIR } from "@/types";

describe("리스트 연산", () => {
  it("addItem은 맨 앞에 추가하고 동일 id 중복 제거", () => {
    const a = addItem([{ id: "x", v: 1 }], { id: "y", v: 2 });
    expect(a.map((i) => i.id)).toEqual(["y", "x"]);
    const b = addItem(a, { id: "x", v: 9 });
    expect(b.map((i) => i.id)).toEqual(["x", "y"]);
  });
  it("removeItem은 id 제거", () => {
    expect(removeItem([{ id: "x" }, { id: "y" }], "x")).toEqual([{ id: "y" }]);
  });
});

describe("스니펫/템플릿 영속", () => {
  beforeEach(() => localStorage.clear());

  it("스니펫 저장/로드/삭제", () => {
    saveSnippet("인사", "안녕하세요");
    let list = loadSnippets();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("인사");
    expect(list[0].text).toBe("안녕하세요");
    deleteSnippet(list[0].id);
    list = loadSnippets();
    expect(list).toHaveLength(0);
  });

  it("템플릿 저장/로드", () => {
    const ir: DiagramIR = {
      diagramType: "flowchart",
      title: "T",
      nodes: [{ id: "n1", label: "A" }],
      edges: [],
    };
    saveTemplate("내 템플릿", ir);
    const list = loadTemplates();
    expect(list).toHaveLength(1);
    expect(list[0].ir.nodes).toHaveLength(1);
  });
});

describe("filterCommands", () => {
  const cmds: Command[] = [
    { id: "1", label: "내보내기", group: "파일", keywords: "export", run: () => {} },
    { id: "2", label: "테마: 다크", group: "테마", run: () => {} },
  ];
  it("빈 검색은 전체", () => {
    expect(filterCommands(cmds, "")).toHaveLength(2);
  });
  it("라벨/키워드/그룹 부분일치", () => {
    expect(filterCommands(cmds, "export")[0].id).toBe("1");
    expect(filterCommands(cmds, "테마")[0].id).toBe("2");
    expect(filterCommands(cmds, "없음")).toHaveLength(0);
  });
});
