"use client";

import { useEffect } from "react";
import { useCommandStore, type Command } from "@/stores/commands";

/**
 * 커맨드 묶음을 레지스트리에 등록(언마운트 시 해제).
 * 호출부는 commands 배열을 useMemo로 메모이즈해야 한다.
 */
export function useRegisterCommands(commands: Command[]): void {
  const register = useCommandStore((s) => s.register);
  const unregister = useCommandStore((s) => s.unregister);

  useEffect(() => {
    commands.forEach(register);
    return () => commands.forEach((c) => unregister(c.id));
  }, [commands, register, unregister]);
}
