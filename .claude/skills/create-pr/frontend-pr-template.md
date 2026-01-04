# Frontend PR Template

## PR Title Format
```
{type}: Frontend - {description}
```

## Template

```markdown
## PR 타입

- [ ] 새로운 컴포넌트/페이지 추가
- [ ] 기존 UI 수정 (버그 수정 / 기능 개선)
- [ ] 스타일/테마 변경
- [ ] 상태관리/API 연동 변경
- [ ] 문서 수정
- [ ] 기타 (chore, 의존성 업데이트 등)

---

## 변경 사항

<!-- 변경된 내용을 명확하게 설명해주세요 -->

-

### 수정된 파일
-

---

## 스크린샷

<!-- UI 변경이 있는 경우 필수 -->

| Before | After |
|--------|-------|
| ![before](url) | ![after](url) |

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

### 새로운 컴포넌트/페이지 추가인 경우

- [ ] shadcn/ui + Radix 패턴 준수 [AUTO: 코드 패턴 확인]
- [ ] TypeScript 타입 정의 완료 [AUTO: tsc --noEmit]
- [ ] 다크모드 지원 확인 [MANUAL: 브라우저에서 확인 필요]
- [ ] 반응형 디자인 확인 (모바일/데스크톱) [MANUAL: 브라우저에서 확인 필요]
- [ ] 접근성 확인 (키보드 네비게이션, ARIA) [MANUAL: 수동 테스트 필요]

### 기존 UI 수정인 경우

- [ ] 기존 기능에 영향 없음 확인 [MANUAL: 기능 테스트 필요]
- [ ] 관련 컴포넌트 사이드이펙트 확인 [MANUAL: 검토 필요]
- [ ] 타입 정의 업데이트 [AUTO: tsc --noEmit]

### 스타일/테마 변경인 경우

- [ ] Tailwind CSS 클래스 사용 [AUTO: 코드 확인]
- [ ] CSS 변수 일관성 유지 (oklch 색상) [AUTO: 코드 확인]
- [ ] 다크모드 호환성 확인 [MANUAL: 브라우저에서 확인 필요]
- [ ] 반응형 브레이크포인트 확인 [MANUAL: 브라우저에서 확인 필요]

### 상태관리/API 연동 변경인 경우

- [ ] Context Provider 적절히 사용 [AUTO: 코드 패턴 확인]
- [ ] nuqs (URL state) 패턴 준수 [AUTO: 코드 확인]
- [ ] 에러 핸들링 (sonner toast 사용) [AUTO: 코드 확인]
- [ ] 로딩 상태 처리 [AUTO: 코드 확인]

### 공통

- [ ] ESLint 통과 (`pnpm lint`) [AUTO]
- [ ] Prettier 포맷팅 (`pnpm format:check`) [AUTO]
- [ ] TypeScript 타입 에러 없음 [AUTO: tsc --noEmit]
- [ ] 불필요한 코드/주석 제거 [AUTO: diff 확인]
- [ ] 커밋 메시지에 AI 도구 사용 흔적 없음 [AUTO: git log 확인]

---

## 테스트 결과

```bash
# 린트 확인
pnpm lint

# 포맷 확인
pnpm format:check

# 빌드 확인
pnpm build
```

<!-- 수동 테스트 결과 또는 스크린 녹화 -->

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
