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
