# PRO 통합금융계산기 (Vercel 배포)

## 프로젝트 개요
통합금융계산기의 Vercel 배포용 프론트엔드. 단일 `index.html` + API.
700명 보험설계사 사용 중인 프로덕션 시스템.

## 파일 구조
| 파일 | 역할 |
|------|------|
| `index.html` | 메인 UI (9개 탭: 부동산, 상속증여, 예적금, 은퇴, 목적자금, 달러, 전월세, 대출, 종합소득세) |
| `api/` | Vercel Serverless Functions |
| `vercel.json` | Vercel 배포 설정 |

## 배포 환경
- **GitHub**: `proenterpriseai/Procalculator` (main)
- **Vercel**: `pro-financecalculator.vercel.app` (정적 CDN, 자동 재배포)
- **커밋 시**: Co-Authored-By 태그 필수

## ⚠️ 배포 순서 (반드시 준수)
1. **`.vercel.app` (pro-financecalculator.vercel.app) 먼저**: 모든 코드 수정 → git push → Vercel 배포 완료 확인
2. **Streamlit 후속**: `.vercel.app` 배포가 완료된 후 바로 진행
- 수정 작업 시 `.vercel.app` 배포를 건너뛰고 Streamlit만 배포하지 않는다
- 코드 수정 후 반드시 push/배포까지 완료한 뒤 사용자에게 테스트 안내한다

## ⚠️ Streamlit 프로젝트 동기화
- Streamlit 코드: 바탕화면 `계산기/` 폴더 (GitHub: `proenterpriseai/PRO_calculator`)
- **제목/문구 변경 시 양쪽 동기화 필수** (Vercel index.html ↔ Streamlit tabs/*.py)
- Vercel: `<h1 class="page-title">` + `<p class="page-desc">`
- Streamlit: `render_title_with_reset()` + `st.markdown()`

## ⚠️ 환율 API 안전 규칙 (v=20260325)
- `fetchExchangeRate()`: `AbortController` 15초 타임아웃 적용 (무한 대기 방지)
- `_fetchRateBusy` 플래그 + 버튼 disabled로 연타 방지
- 3단계 fallback: 네이버 → 두나무/하나은행 → ExchangeRate-API
- **fetch 타임아웃/debounce 제거 금지** — 사용자 경험과 서버 보호에 필수

## 코드 수정 안전 규칙
- **index.html 단일 파일**: 전체 UI가 하나의 HTML에 포함
- **탭 구조**: `tab-content` 클래스 div로 분리 (tab-realestate, tab-dollar 등)
- **page-title**: 각 탭의 `<h1 class="page-title">` 제목
- **page-desc**: 각 탭의 `<p class="page-desc">` 설명문 (부동산 포함 모든 탭에 존재해야 함)

## 갱신형/실손 보험료 탭 (v=20260414, Feature Flag)

### 탭 현황
| 탭 | ID | 메뉴 ID | 상태 | 함수 |
|----|----|---------|------|------|
| 갱신형 vs 비갱신형 비교 | tab-renewal | menu-renewal | **display:none (미공개)** | calcRenewal(), buildRenewalData(), getRnRate() |
| 실손보험 갱신 시뮬레이션 | tab-silson | menu-silson | **display:none (미공개)** | calcSilson(), buildSilsonData(), onSilsonGenChange() |

### ⚠️ 공개 규칙
- **사용자(대표님)의 최종 검증 완료 및 승인 전까지 절대 공개하지 않는다**
- 공개 방법: 해당 `<li>` 태그의 `style="display:none"` 제거 → 커밋/푸시
- Console에서 `switchTab('tab-renewal')` 또는 `switchTab('tab-silson')`으로 개발 중 접근 가능

### 계산 방식
- **단리** 방식: `최초보험료 × (1 + 연간인상률 × 경과년수)` — 복리 아님
- 갱신형: 보장 만기까지 납입 (납입기간 ≠ 보장기간)
- 비갱신형: 납입기간까지만 → 이후 0원
- 5배 한계선: 자동 계산 (입력 보험료 × 5), Chart.js afterDraw 플러그인

### 실손 세대별 기본값 (SILSON_DEFAULTS)
| 세대 | 인상률 | 갱신주기 | 출처 |
|------|--------|---------|------|
| 1세대 | 10% | 3년 | 금감원 5년 평균 기반 |
| 2세대 | 12% | 1년 | 금감원 5년 평균 기반 |
| 3세대 | 14% | 1년 | 2023-2026 4년 평균 |
| 4세대 | 16% | 1년 | 2025-2026 2년 평균 |

### 갱신형 비교 연령대별 기본값
| 연령대 | 20대 | 30대 | 40대 | 50대 | 60대 | 70대~ |
|--------|------|------|------|------|------|-------|
| 기본값 | 5% | 10% | 15% | 20% | 30% | 30% |

### 판정 카드 톤
- **고객 관점 4단계**: 사실 → 경제적 부담/해지 위험 → 대안(비갱신형/리모델링) → 세부 안내
- "업계 기준" 같은 공급자 관점 문구 금지
- 갱신형 비교 탭: "리모델링을 권장합니다" 톤
- 실손 탭: "대비 방안" 톤

## STEP 산출 과정 스타일 규칙 (v=20260407)
- **`.step-formula` 클래스**: 회색 배경/모노스페이스 제거됨 → `display:block; font-weight:600; margin-top:6px;`
- 수식은 주변 `.step-content` 텍스트와 동일한 Pretendard 폰트, 세미볼드(600)로만 구분
- **새 수식 추가 시**: `<div class="step-formula">` 사용 가능하나, 절대 `background`, `font-family: monospace` 등 코드블록 스타일 인라인 추가 금지
- **은퇴 STEP 1**: step-formula wrapper 제거 완료 — step-content 안에 직접 텍스트 배치
