# Backend PR Template

## PR Title Format
```
{type}: Backend - {description}
```

## Template

```markdown
## PR 타입

- [ ] 새로운 API 엔드포인트 추가
- [ ] 기존 API 수정 (버그 수정 / 기능 개선)
- [ ] DB/Vector Store 관련 변경
- [ ] 인프라/설정 변경 (Docker, 환경변수 등)
- [ ] 문서 수정
- [ ] 기타 (chore, 의존성 업데이트 등)

---

## 변경 사항

<!-- 변경된 내용을 명확하게 설명해주세요 -->

-

### 수정된 파일
-

---

## API 변경 상세 (해당 시)

### 엔드포인트
- **Method**: GET / POST / PUT / DELETE
- **Path**: `/api/v1/...`

### Request 예시
```json
{
  "example": "payload"
}
```

### Response 예시
```json
{
  "example": "response"
}
```

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

### 새로운 API 엔드포인트 추가인 경우

- [ ] Pydantic Request/Response 스키마 정의 [AUTO: 파일 존재 확인]
- [ ] 엔드포인트 라우터에 등록 (`interface/api/routers/`) [AUTO: 파일 확인]
- [ ] OpenAPI 문서 자동 생성 확인 (`/docs`) [MANUAL: 서버 실행 후 확인]
- [ ] 에러 핸들링 구현 (400, 404, 500 등) [AUTO: 코드 확인]
- [ ] 타입 힌팅 및 Docstring 작성 [AUTO: 코드 확인]

### 기존 API 수정인 경우

- [ ] 기존 클라이언트 호환성 확인 [MANUAL: 영향 범위 검토 필요]
- [ ] Breaking change 시 버전 관리 고려 [MANUAL: 검토 필요]
- [ ] 관련 스키마 업데이트 [AUTO: 파일 확인]
- [ ] 테스트 통과 [AUTO: pytest 실행]

### DB/Vector Store 변경인 경우

- [ ] SQL 쿼리 검증 (PostgreSQL+pgvector) [MANUAL: 쿼리 검토 필요]
- [ ] 인덱스 영향도 확인 [MANUAL: 검토 필요]
- [ ] 벡터 차원 호환성 확인 (Qwen: 4096, OpenAI: 3072) [AUTO: 코드 확인]
- [ ] Connection pool 설정 확인 [AUTO: 설정 파일 확인]

### 인프라/설정 변경인 경우

- [ ] `.env.example` 업데이트 [AUTO: 파일 비교]
- [ ] Docker 빌드 테스트 [AUTO: docker build 실행]
- [ ] `config/settings.py` 반영 [AUTO: 파일 확인]
- [ ] Health check 영향 확인 [MANUAL: 엔드포인트 테스트 필요]

### 공통

- [ ] Ruff 린트 통과 (`uv run ruff check .`) [AUTO]
- [ ] 타입 힌팅 작성 [AUTO: 코드 확인]
- [ ] Docstring 작성 [AUTO: 코드 확인]
- [ ] 불필요한 코드/주석 제거 [AUTO: diff 확인]
- [ ] 커밋 메시지에 AI 도구 사용 흔적 없음 [AUTO: git log 확인]

---

## 테스트 결과

```bash
# 실행한 테스트 명령어
uv run pytest

# 린트 확인
uv run ruff check .
```

---

## Breaking Changes

<!-- Breaking change가 있는 경우에만 작성. 없으면 섹션 삭제 -->

- 변경 내용:
- 마이그레이션 방법:

---

## 추가 설명

<!-- 리뷰어가 알아야 할 추가 정보. 없으면 섹션 삭제 -->

-
```
