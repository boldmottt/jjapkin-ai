/**
 * API 응답 안전 파싱
 *
 * 서버가 (예: 라우트 모듈 로드 실패, 프록시 502 등) JSON 대신 HTML을 반환하면
 * `res.json()`이 "Unexpected token '<', "<!DOCTYPE"..."로 깨진다. 이를 막기 위해
 * content-type을 확인하고, JSON이 아니면 사람이 읽을 수 있는 에러로 변환한다.
 */
export async function readJsonResponse<T = unknown>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    // 본문 일부를 로깅용으로만 확인(사용자에겐 일반 메시지)
    const snippet = (await res.text().catch(() => "")).slice(0, 120);
    console.error(
      `[api] 비정상 응답 status=${res.status} content-type="${contentType}" body="${snippet}"`,
    );
    throw new Error(
      res.status >= 500
        ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        : `요청을 처리하지 못했습니다 (HTTP ${res.status}).`,
    );
  }
  return res.json() as Promise<T>;
}
