# MCP Server (LangGraph) PR Template

## PR Title Format
```
{type}: MCP Server - {description}
```

## Template

```markdown
## PR 타입

- [ ] 새로운 RAG Graph 추가
- [ ] 기존 Graph 수정 (노드/엣지 변경)
- [ ] Tool 추가/수정
- [ ] 프롬프트 변경
- [ ] 문서 수정
- [ ] 기타 (chore, 의존성 업데이트 등)

---

## 변경 사항

<!-- 변경된 내용을 명확하게 설명해주세요 -->

-

### 수정된 파일
-

---

## Graph 구조 변경 (해당 시)

### 노드 변경
- 추가된 노드:
- 수정된 노드:
- 삭제된 노드:

### 엣지 변경
- 추가된 엣지:
- 조건부 라우팅 변경:

---

## 관련 이슈

<!-- 관련된 이슈가 있다면 링크. 없으면 섹션 삭제 -->

- Closes #

---

## 체크리스트

<!--
검증 방식 안내:
- [AUTO] 자동 검증 가능 (명령어 실행, 파일 확인)
- [MANUAL] 수동 확인 필요 (사용자에게 확인 요청)
-->

### 새로운 RAG Graph 추가인 경우

- [ ] 필수 파일 생성 완료 [AUTO: 파일 존재 확인]
  - [ ] `graph.py` - Graph 정의 [AUTO]
  - [ ] `state.py` - State 스키마 (InputState, OutputState, State) [AUTO]
  - [ ] `configuration.py` - Configuration dataclass [AUTO]
  - [ ] `submodules.py` - 노드 구현 [AUTO]
  - [ ] `prompts.py` - 시스템 프롬프트 [AUTO]
  - [ ] `tools.py` - Tool 정의 [AUTO]
- [ ] `langgraph.json`에 Graph 등록 [AUTO: 파일 확인]
- [ ] 노드/엣지 연결 확인 [AUTO: 코드 분석]
- [ ] Configuration 기본값 설정 [AUTO: 코드 확인]

### 기존 Graph 수정인 경우

- [ ] State 변경 시 하위 호환성 확인 [MANUAL: 영향 범위 검토 필요]
- [ ] 조건부 엣지 라우팅 검증 [AUTO: 코드 분석]
- [ ] 기존 기능에 영향 없음 확인 [MANUAL: 기능 테스트 필요]
- [ ] 테스트 통과 [AUTO: pytest 실행]

### Tool 추가/수정인 경우

- [ ] `@tool` 데코레이터 사용 [AUTO: 코드 확인]
- [ ] RunnableConfig 파라미터 전달 [AUTO: 코드 확인]
- [ ] async/await 패턴 준수 (`asyncio.to_thread` 사용) [AUTO: 코드 확인]
- [ ] `get_tools()` 함수에 등록 [AUTO: 코드 확인]
- [ ] 에러 핸들링 및 fallback 구현 [AUTO: 코드 확인]
- [ ] Tool docstring 작성 (LLM이 읽음) [AUTO: 코드 확인]

### 프롬프트 변경인 경우

- [ ] 페르소나/톤 일관성 유지 [MANUAL: 검토 필요]
- [ ] Tool 사용 규칙 명시 [AUTO: 프롬프트 확인]
- [ ] 출력 포맷 가이드 포함 [AUTO: 프롬프트 확인]
- [ ] 예시 포함 (Good/Bad 또는 ✅/❌) [AUTO: 프롬프트 확인]

### 공통

- [ ] Ruff 린트 통과 (`uv run ruff check .`) [AUTO]
- [ ] 타입 힌팅 작성 [AUTO: 코드 확인]
- [ ] Docstring 작성 (한글) [AUTO: 코드 확인]
- [ ] `.env.example` 업데이트 (새 환경변수 시) [AUTO: 파일 비교]
- [ ] 불필요한 코드/주석 제거 [AUTO: diff 확인]
- [ ] 커밋 메시지에 AI 도구 사용 흔적 없음 [AUTO: git log 확인]

---

## 테스트 결과

```bash
# LangGraph 로컬 테스트
uv run langgraph dev

# pytest (있는 경우)
uv run pytest

# 린트 확인
uv run ruff check .
```

<!-- 노트북 테스트 결과가 있으면 경로 명시 -->
**테스트 노트북**: `notebook/xxx.ipynb`

---

## Breaking Changes

<!-- Breaking change가 있는 경우에만 작성. 없으면 섹션 삭제 -->

- 변경 내용:
- State 스키마 변경:
- 마이그레이션 방법:

---

## 추가 설명

<!-- 리뷰어가 알아야 할 추가 정보. 없으면 섹션 삭제 -->

-
```
