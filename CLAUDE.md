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

## 갱신형/실손 보험료 탭 (v=20260422, 공개)

### 탭 현황
| 탭 | ID | 메뉴 ID | 상태 | 함수 |
|----|----|---------|------|------|
| 갱신형/비갱신형 비교 | tab-renewal | menu-renewal | **공개 (2026-04-22)** | calcRenewal(), buildRenewalData(), getRnRate() |
| 실손보험 갱신 시뮬레이션 | tab-silson | menu-silson | **공개 (2026-04-22)** | calcSilson(), buildSilsonData(), onSilsonGenChange() |

### 사이드바 위치 (v=20260422)
달러 설계 → **⚖️ 갱신형/비갱신형 비교** → **🩺 실손보험 갱신** → 전월세 전환 설계

### 0 입력 edge case 가드 (v=20260422, 필수)
- `buildSilsonData`: `mPremium > 0 && fiveXYear === 0 && curMonthly >= fiveXLimit` → 0원 입력 시 "1년차 5배 도달" 오표시 차단
- `calcRenewal` burdenAge: `if (mRenew > 0)` 가드로 loop 보호 → 0원 입력 시 `burdenLimit=0` 오탐 차단
- **이 가드는 절대 제거 금지** — 사용자가 필드를 비우거나 0 입력하는 경우 대비

### 계산 방식 (v=20260422, 복리 전환)
- **복리** 방식: `최초보험료 × (1 + 연간인상률)^경과년수`
  - 보험연구원 장기 추정치(40→70세 30년간 17배 = 1.10^30 = 17.45) 패턴과 일치
  - 단리 구조는 실제 시장 데이터와 괴리 → 복리로 전환 (2026-04-22)
- 갱신형 상세 모드: 연령대별 구간 복리 배율 ∏(1+r[i])
- 고객 이력 역산도 복리: `rate = (now/start)^(1/years) - 1`
- 갱신형: 보장 만기까지 납입 (납입기간 ≠ 보장기간)
- 비갱신형: 납입기간까지만 → 이후 0원
- 5배 한계선: 자동 계산 (입력 보험료 × 5), Chart.js afterDraw 플러그인
- 시나리오 토글(보수/중립/공격 ±5%p) **제거됨** — 세대 기본값 + 고객이력 입력 2-트랙 유지

### 판정 카드 4단계 규칙 (v=20260422)
- `totalDiff > 0` (갱신형이 총액 비쌈) → **4단계 항상 표시** (기존 `initDiff > 0` 게이트 제거)
- `initDiff > 0` / `initDiff ≤ 0` 분기는 리모델링 카드 **내부 문구**에서만 처리
- 초기부터 비갱신형이 같거나 저렴한 경우: "전환 즉시 부담 증가 없이 장기 안정성 확보" 문구

### 출처 라벨 분기 (v=20260422)
- `SILSON_DEFAULTS[gen]`의 rate/cycle과 현재 입력값이 다르면 `사용자 입력값`으로 전환
- 둘 다 일치하면 세대별 source 노출 (예: "금감원 4년 평균(2023-2026)")
- 판정: `Number(genDef.rate) !== Number(annualRate) || Number(genDef.cycle) !== Number(cycle)`

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
