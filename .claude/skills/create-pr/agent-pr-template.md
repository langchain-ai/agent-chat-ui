# Agent PR Template

## PR Title Format
```
{type}: {PR Title} - {description}
```

예시:
- `feat: Learning Agent - 초기 구현`
- `fix: Web Search Agent - 빈 결과 처리`
- `feat: Tavily Search Tool - 초기 구현`
- `feat: HumanInTheLoop Middleware - 초기 구현`

## Template

```markdown
<!--
PR 제목 형식: {type}: {Agent 이름 또는 대상} - {간단한 설명}
예시: feat: Code Review Agent - 초기 구현
예시: fix: Web Search Agent - 빈 결과 처리
예시: docs: PR Guidelines - 문서 추가

※ PR 제목과 본문은 한글로 작성합니다 (커밋 타입과 기술 용어는 영문 사용)
-->

## PR 타입

<!-- 해당하는 항목에 x 표시하세요 -->

- [ ] 새로운 Agent 추가
- [ ] 기존 Agent 수정 (버그 수정 / 기능 개선 / 리팩토링)
- [ ] 공유 폴더 수정 (middleware, tools, base 등)
- [ ] 문서 수정
- [ ] 기타 (chore, 의존성 업데이트 등)

---

## 변경 사항

<!-- 변경된 내용을 명확하게 설명해주세요 -->

-

### 수정된 파일
-

---

## 관련 이슈

<!-- 관련된 이슈가 있다면 링크해주세요. 없으면 섹션 삭제 -->
```


---

## 체크리스트

### 새로운 Agent 추가인 경우

- [ ] 필수 파일 생성 완료 (agent.py, state.py, prompt.py, tool.py, __init__.py)
- [ ] `langgraph.json`에 Agent 등록
- [ ] `agent/__init__.py`에 Agent export
- [ ] `BaseAgent` 상속 확인
- [ ] 타입 힌팅 및 Docstring 작성

### 기존 Agent 수정인 경우

- [ ] 기존 기능에 영향 없음 확인
- [ ] 타입 힌팅 및 Docstring 업데이트
- [ ] 테스트 통과

### 공유 폴더 수정인 경우

- [ ] 관련 Agent 영향 범위 확인
- [ ] 하위 호환성 유지 (Breaking change 시 문서화)
- [ ] 관련 Agent 테스트 통과

### 공통

- [ ] 커밋 메시지에 AI 도구 사용 흔적 없음
- [ ] 브랜치 네이밍 규칙 준수 (`{type}/{agent-name}/{description}`)
- [ ] 불필요한 코드/주석 제거

---

## 테스트 결과

<!-- 테스트 방법과 결과를 간략히 설명해주세요 -->

```bash
# 실행한 테스트 명령어
```

---

## Breaking Changes

<!-- Breaking change가 있는 경우에만 작성. 없으면 섹션 삭제 -->

- 변경 내용:
- 마이그레이션 방법:

---

## 추가 설명

<!-- 리뷰어가 알아야 할 추가 정보가 있다면 작성. 없으면 섹션 삭제 -->

- Closes #

---

## 체크리스트

<!--
검증 방식 안내:
- [AUTO] 자동 검증 가능 (명령어 실행, 파일 확인)
- [MANUAL] 수동 확인 필요 (사용자에게 확인 요청)
-->

### 새로운 Agent 추가인 경우

- [ ] 필수 파일 생성 완료 [AUTO: 파일 존재 확인]
  - [ ] `agent.py` [AUTO]
  - [ ] `state.py` [AUTO]
  - [ ] `prompt.py` [AUTO]
  - [ ] `tool.py` [AUTO]
  - [ ] `__init__.py` [AUTO]
- [ ] `langgraph.json`에 Agent 등록 [AUTO: 파일 확인]
- [ ] `agent/__init__.py`에 Agent export [AUTO: 파일 확인]
- [ ] `BaseAgent` 상속 확인 [AUTO: 코드 확인]
- [ ] 타입 힌팅 및 Docstring 작성 [AUTO: 코드 확인]

### 기존 Agent 수정인 경우

- [ ] 기존 기능에 영향 없음 확인 [MANUAL: 기능 테스트 필요]
- [ ] 타입 힌팅 및 Docstring 업데이트 [AUTO: 코드 확인]
- [ ] 테스트 통과 [AUTO: pytest 실행]

### 공유 폴더 수정인 경우

- [ ] 관련 Agent 영향 범위 확인 [MANUAL: 영향 범위 검토 필요]
- [ ] 하위 호환성 유지 (Breaking change 시 문서화) [MANUAL: 검토 필요]
- [ ] 관련 Agent 테스트 통과 [AUTO: pytest 실행]

### 공통

- [ ] 커밋 메시지에 AI 도구 사용 흔적 없음 [AUTO: git log 확인]
- [ ] 브랜치 네이밍 규칙 준수 (`{type}/{agent-name}/{description}`) [AUTO: git branch 확인]
- [ ] 불필요한 코드/주석 제거 [AUTO: diff 확인]

---

## 테스트 결과

<!-- 테스트 방법과 결과를 간략히 설명해주세요 -->

**테스트 노트북**: `notebook/xxx.ipynb`

```bash
# 실행한 테스트 명령어 (있는 경우)
```

---

## Breaking Changes

<!-- Breaking change가 있는 경우에만 작성. 없으면 섹션 삭제 -->

- 변경 내용:
- 마이그레이션 방법:

---

## 추가 설명

<!-- Agent 주요 기능 설명 -->

**{Agent Name} 주요 기능:**

-
-
-
```
