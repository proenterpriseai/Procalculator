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

## ⚠️ 배포 순서 (반드시 준수, v=20260422 현실화)
- **Vercel 단일 운영**: 설계사 700명 전원이 `pro-financecalculator.vercel.app`로 접속
- 코드 수정 → git push → Vercel 자동 재배포(30초) 확인 → 사용자 테스트 안내
- 커밋 시 Co-Authored-By 태그 필수

## 📦 Streamlit 프로젝트 (레거시, v=20260422 다운그레이드)
- 위치: 바탕화면 `계산기/` 폴더 (GitHub: `proenterpriseai/PRO_calculator`)
- **실사용 없음** — 2026-04-22 기준 설계사는 Vercel만 사용
- 신규 기능 Streamlit 포팅 의무 **없음**
- 기존 9개 탭은 유지 (부동산/상속증여/예적금/은퇴/목적자금/달러/전월세/대출/종합소득세)
- 갱신형/실손 2개 탭은 Vercel 전용 (Streamlit 미포팅 확정)
- **향후 Streamlit 사용자 요청 발생 시에만** 포팅 검토

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

## 🧾 리포트 출력 (v=20260907a, `FEATURE_CALC_REPORT=true` **700명 공개** — 전체 11탭)

### 개요
- 카테고리별 상담 결과를 A4 리포트로 출력. **A안 = 브라우저 인쇄 뷰**(새 창 미리보기 → 인쇄/PDF 저장). 서버 PDF 없음.
- 독립 블록 위치: `INITIAL CALCULATIONS` 직전 (`var FEATURE_CALC_REPORT`부터 `document.addEventListener('DOMContentLoaded', _crInit)`까지). 접두사 `_cr`.
- **기존 calc 함수·DOMContentLoaded 초기화 수정 없음** (예외 1건: calcSilson 상세표 루프 `ratio`→`rowRatio` 개명 — ESLint no-redeclare 해소, 전략실장 승인 2026-09-06, 동작 동일). 리포트는 화면 DOM에 이미 계산된 결과를 읽어 재배치만 한다(새 계산 0). 기존 마크업 변경은 속성뿐(동작 무영향): `data-calc-report="appendix"` 6곳(실손 4·갱신형 2) + `data-cr="cr-*"` 9곳(id 없는 결과 카드 컨테이너 표식 — 대출·종소세 2·부동산 5·상속 종신전략).
- **2026-09-07 v=20260907a `true` 공개** (main `5497b2b`, 전략실장 승인. 트리플 A 4회 GO=Phase1·차트 델타·Phase2·true 전환 / 실측 피드백 5건 반영 완결). 문제 신고 시 개인 롤백: `localStorage._flag_calc_report='false'` 후 새로고침(버튼·스타일·모달 전부 미생성, 화면 바이트 동일). 전체 롤백=상수 false 재배포.
- CI 가드: `.github/workflows/quality-check.yml`에 리포트 잔존 grep 5패턴(`var FEATURE_CALC_REPORT = true`·`_crInit`·`_crBuildReportHtml`·`_CR_SPECS`·`cr-tablewrap`) — 삭제·회귀 시 push 차단. **flag 라인 수정 시 CI 패턴도 동반 수정 의무.**

### `_CR_SPECS` — 전체 11탭 (Phase 1 3탭 + Phase 2 8탭 v=20260907)
- **서브탭 탭은 명세가 함수** — 호출 시점의 활성 서브탭(`_crSubActive`, `.hidden` 판정) 명세를 반환. **활성 서브탭 1개 = 리포트 1부**(확정 결정 ②).
- 섹션 kind: `cards`(result-cards 재래핑 — 원본 inline grid-template은 소실, auto-fit으로 렌더=의도) / `raw`(innerHTML, `outer:true`=outerHTML, `avoid:true`=.cr-keep 분할방지) / `chart`(canvas→PNG) / `table`(요약, `step`·`unit` 옵션). `sel`=querySelector(data-cr 표식), `when()`=토글 게이트.
- ⚠️ `_crVisible`은 **자기 자신의** computed display만 본다(조상 숨김은 오판). 새 명세의 raw 대상은 반드시 자기 자신이 display 토글되는 요소만 쓸 것 — 조상 토글 구조면 `when()`으로 게이트.

| 탭 | 단위 | 핵심 섹션 | 특이사항 |
|----|------|-----------|---------|
| tab-silson / tab-renewal / tab-retirement | 탭 | (Phase 1 그대로) | 부록 첨부 옵션은 이 2탭만 |
| tab-realestate | 취득/보유/양도 서브탭 | cards(data-cr)+차트+상세보고서 | 생애최초 감면 메시지·공제 내역은 표시 중일 때만(`_crVisible`) |
| tab-inheritance | 증여/상속 서브탭 | cards+차트+산출과정+납부안내/종신보험전략(outer·avoid) | 입력 요약은 0원 항목 생략, 특례·할증 체크만 표기 |
| tab-savings | 예금/적금 서브탭 | cards+차트+상세표 | 적금 월별표 `step:12, unit:'개월'` 요약 |
| tab-goalfund | 탭 | cards+차트+전략 리포트+자산 증식 비교 | 3종 비교 3섹션은 `when: 토글 ON`만 |
| tab-dollar | 탭 | cards×3+차트×3(히스토리 포함)+BEP 근거 | 환율 시나리오 3값 한 행 |
| tab-jeonwolse | 탭 | cards+차트×2+판정(outer) | 법정 상한 초과 시 입력 행에 경고 병기 |
| tab-loan | 탭 | cards(data-cr)+차트×2+상세 리포트 | guard=원금>0 |
| tab-incometax | 탭 | cards+종합vs분리 그리드(outer·avoid)+판정+파이 | guard=6개 소득 합>0 |

### 규칙 (영구)
- **리포트 6블록 고정**: 표지 헤더(고객명·상담일·설계사·연락처) → 입력 조건 → 핵심 결과 → 차트 → 산출 과정·판정·상세표 → 면책·출처. 새 탭 추가 시 `_CR_SPECS`에 명세만 추가, 빌더 수정 금지.
- **보이는 것만 출력**: raw 섹션은 innerHTML 빈 문자열이면 skip(꺼진 토글 영역 자동 제외). 비활성 서브탭 영역은 spec에 넣지 않는다.
- **0원 가드**: `spec.guard()` 메시지 반환 시 alert 후 중단. 제거 금지.
- **긴 표 요약**: `_crKeepRowIndex` — total ≤ 10행 전체 / 첫·마지막·5년 단위·강조 행(`font-weight:700` 또는 '납입 완료')만. "전체 상세표" 옵션 시 전 행. 유닛테스트 `tests/unit-tests.js` §4.
- **차트**: `Chart.getChart(id)` → `stop()` → `resize()` → `update('none')` → `toBase64Image`. resize=숨김 탭에서 생성된 0×0 캔버스 대비, update('none')=애니메이션 중 빈 캔버스 방지. 순서 변경 금지. 빈 이미지(길이 ≤100)는 섹션 생략.
- **cards 섹션**: innerHTML 복제라 `.result-cards` 래퍼가 소실되므로 빌더가 `<div class="result-cards">`로 다시 감쌈(트리플 A 지적). `.result-card`에 `break-inside:avoid`.
- **역산 라벨**: `_crHistApplied(id, currentRate)` — 역산 결과 문구의 "연 평균 X%"와 현재 입력값이 일치할 때만 "고객 증권 기반 역산" 표기(역산 후 수동 변경 시 오표기 방지).
- **인쇄 CSS**: 리포트 창은 메인 `<style>` 전체 복사 + `_crReportCss()` 오버라이드(`body{display:block}` 필수, 메인은 flex). 카드 그리드·step-box·표 행 `break-inside:avoid`, 부록은 `break-before:page`. 러닝 바닥글·페이지 번호는 A안 한계로 미지원(B안 서버 PDF 검토 항목).
- **페이지 채움 규칙 (v=20260907, 전략실장 실측 피드백)**: 차트 이미지 `width:72%` 가운데 정렬 + `max-height:95mm`(정사각 도넛 차트 세로 과대 방지) — 잔여 공간에 들어가 페이지 하단 여백 최소화(실손 p1에 차트 동반). 판정 카드 `.verdict-card{break-inside:avoid}`·avoid 섹션 `.cr-keep` — 잔여 공간에 안 들어가면 통째로 다음 페이지 처음부터(어중간 분할 금지). `@media print` STEP 박스 압축(패딩 12/16·표 행 3px !important·섹션 16px) — 양도세 FINAL 박스 앞 페이지 동반용, 인쇄 전용이라 화면 미리보기 불변. `.cr-tablewrap`(표 래퍼) 인쇄 avoid — 한 페이지에 들어가는 표는 통째 이동, 초과 표는 avoid 무시로 행 분할+thead 반복. 어중간 분할 신고 시 처방=해당 블록 avoid(모놀리식). 100% 복원·avoid 제거·압축 해제 금지.
- 설계사명·연락처 = `localStorage.pro_calc_report_agent`(JSON). 사용량 로그 action `calc_report_print`.
- 문서 제목 = `고객명_리포트명_상담일` → 크롬 "PDF로 저장" 기본 파일명.

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
| 2세대 | 12% | 1년 | 금감원 5년 평균 기반 (2013.4 이후 가입 기준) |
| 3세대 | 14% | 1년 | 2023-2026 4년 평균 |
| 4세대 | 16% | 1년 | 2025-2026 2년 평균 |

### ⚠️ 2세대 갱신 주기 가입 시점 분기 (v=20260531, 영구 룰)
- **2009.10 ~ 2013.3 가입자**: **3년 갱신** (표준화 초기)
- **2013.4 ~ 2017.3 가입자**: **1년 갱신** (현재 SILSON_DEFAULTS['2'] 기본값)
- `SILSON_DEFAULTS['2'].cycle = 1`은 후자 기준 — 전자 케이스는 사용자가 갱신 주기 드롭다운에서 **수동 3년 선택** 필요
- verdict 텍스트(`gen === '2'` 분기)에 이 사실 명시 — "1년 갱신으로 매년 조정"으로 단정 금지
- 갱신 주기 선택기 아래 `<details>` 접이식으로 세대별 표 노출 (평소 숨김, 펼침 시 확인)

### 5세대 실손 (2026.05 출시, v=20260531)
- **출시일**: 2026.5.6 (라임써니 블로그·금융위 공시 기반)
- **드롭다운 미포함 이유**: 누적 인상률 데이터 0년 → 시뮬레이션 불가. 추측 출력 금지 (영구 룰).
- **정보 박스만 노출**: 4세대 vs 5세대 8행 비교표 + 중증/비중증 정의 + 전환 혜택 박스
- **5세대 핵심 변경**:
  - 비급여 자기부담률 30% → **50%** (비중증)
  - 비급여 연간 한도 5,000만 → **1,000만** (비중증)
  - 비급여 입원 한도 연간통합 → **회당 300만**
  - **중증 자기부담 상한 연 500만원 신설** (산정특례 대상: 암/심장/뇌혈관/희귀난치성/중증화상)
  - 임신·출산·발달장애 급여 **신규 보장**
  - 입원 급여 자기부담률 20% 유지
  - 재가입 주기 5년 (4세대와 동일)
- **전환 혜택**: 1~2세대 → 5세대 전환 시 **3년간 보험료 50% 할인** (2026.11~). 4세대 대비 약 10% 저렴.

### 대비 방안 5세대 전환 권유 조건부 로직 (v=20260531, 영구 룰)
- **1·2세대**: 적극 검토 안내 (3년 50% 할인 + 중증 500만 상한). 단 "병원 이용 적고 도수치료·비급여 주사 거의 안 받는 경우" 조건 명시.
- **3세대**: 선택 옵션으로 약하게 안내 (4세대 대비 10% 저렴, 보장 축소 트레이드오프).
- **4세대**: **안내 생략** — 이미 유사 구조에 보장만 더 축소되어 전환 실익 희박.
- 무조건 5세대 권유 금지 — 사용자 의료 이용 패턴 기반 판단이 원칙.

### 결과 카드 레이아웃 (v=20260531)
- "총 납입 예상액 (100세)" 카드 **제거** — 연 14% 복리 100세 누적이 128억대로 비현실
- 남은 2카드(5배 도달 시점 / 70세 시점 월보험료) `grid-template-columns: 1fr 1fr` **한 줄 배치**
- 모바일은 미디어쿼리로 단일 컬럼 자동 전환

## 🎯 기본 랜딩 카테고리 (v=20260531, 영구 룰)
- **최초 진입 = 부동산 통합 (tab-realestate)** — 사이드바 첫 항목, 가장 보편적 카테고리
- 사이드바 `.active` 클래스 + 본문 `.hidden` 토글로 제어:
  - `tab-realestate` 메뉴: `class="active"` / 본문: `class="tab-content"`
  - `tab-savings` 메뉴: 일반 / 본문: `class="tab-content hidden"`
- **localStorage `pro_calc_active_tab` 복원 로직 제거** (v=20260531) — 매 진입마다 부동산으로 일관. 잔존 저장값도 `removeItem()`으로 클리어
- 복원 기능 재도입 금지 — 사용자 혼란 + 발표/시연 일관성 깨짐

## 🧾 5세대 박스 출처 라인 (v=20260531)
- 공식 출처만 명시: "금융위원회·보건복지부 발표 / 보험업계 공시  2026.5.5"
- 외부 블로그(라임써니 등) 참조 금지 — 신뢰성 + 공식성 유지

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
