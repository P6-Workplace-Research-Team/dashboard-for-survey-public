# 대시보드 화면 정의서 (ui_spec_dashboard)

최종 갱신: 2026-05-13
대상 파일: `dashboard.html` (스타일: `dashboard-for-survey.css`의 `.dashboard-page` 스코프, 스크립트: `js/visualizations.js`)

> **차트 영역(`.data-area` / `#result-container` 내부 시각화)은 `data_visualization.md`를 참조한다.**
> 영역의 위치·컨테이너·진입점만 기록하고, 시각화 종류·동작·옵션은 별도 문서로 분리한다.

---

## 1. 화면 개요 / 목적

### 1.1 화면 정보
- 화면명: 설문조사 분석 대시보드
- 파일: `dashboard.html` (`<body class="dashboard-page">`)
- `<title>`: `설문조사 분석 대시보드 | purple6studio`
- 의존
  - 스타일: `dashboard-for-survey.css`
  - 스크립트 (로드 순서):
    1. `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` (Supabase CDN)
    2. `js/supabase-client.js` — Supabase 클라이언트·CRUD·스토리지 레이어
    3. `js/bootstrap-auth.js` — `requireAuth()` 즉시 실행 (세션 없으면 `login.html`로 이동)
    4. `js/saved-list-modal.js` — 저장된 대시보드 리스트 모달 (`#list-modal` 동적 생성)
    5. `assets/libs/dom-to-image-more.min.js` (이미지 추출)
    6. `assets/libs/html2canvas.min.js` (이미지 추출)
    7. `assets/libs/PptxGenJS-4.0.1/…/pptxgen.bundle.js` (PPTX 추출, **현재 비활성**)
    8. `js/visualizations.js` — 메인 분석·렌더링 로직
- 진입 경로: 홈에서 분석 시작 또는 저장된 대시보드 진입. sessionStorage에 `survey.currentId` / `survey.title`이 세팅된 상태로 진입한다.

### 1.2 목적

> 보고 싶은 문항을 선택하고, 필터 조건과 비교 그룹을 조정하여 설문 데이터를 다각도로 확인하기 위한 핵심 분석 화면이다.
1. 업로드된 코드북 기준으로 좌측 **문항 트리**를 보여주고 검색·확장한다.
2. 응답자 모집단을 좁히는 **필터 바**를 제공한다.
3. 좌측의 문항 카드를 두 드롭존(보고 싶은 문항 / 그룹별 비교)으로 드래그해 분석 구조를 정의한다.
4. 정의된 분석 구조에 따라 차트와 표를 렌더링한다 (`data_visualization.md` 참조).
5. 렌더링한 차트를 이미지로 저장한다.
6. 저장된 대시보드 목록을 확인하고 다시 진입할 수 있다.
7. 데이터 파일을 교체할 수 있다.
8. 새 대시보드를 만들기 위해 홈 화면으로 돌아갈 수 있다.

### 1.3 화면 레이아웃 특징
- `.dashboard-page .page`는 `height: 100vh` + `overflow: hidden` (앱 셸 스타일)
- 헤더와 푸터는 고정 영역, 본문(`.dash-body`)은 좌측 패널과 메인 영역의 2단 그리드
- `.main-shell`이 필터 바와 메인 영역을 하나의 세로 컬럼으로 감싼다

---

## 2. 레이아웃 구조 / 영역 구분

### 2.1 전체 구조
```
┌── .dash-header ────────────────────────────────────────────────┐ 16px 28px
│  [logo] [project-title] [edit] ·············· [actions row]   │
├── .dash-body (grid: panel-shell-width 1fr) ────────────────────┤
│  [left-panel-shell]   [main-shell]                             │
│   └─ .left-panel      ├─ .filter-bar (sticky top)             │
│   └─ .panel-toggle    └─ .main-area                           │
│                            ├─ .questions-selected-row          │
│                            │   (target card | criterion card)  │
│                            ├─ .data-area (#result-container)   │
│                            └─ .main-copyright                  │
├── .dash-footer (비어있음, PPT 버튼 주석 처리) ──────────────────┤
```

### 2.2 핵심 CSS 변수 (`:root`)
- `--panel-width: 320px` / `--panel-shell-width: 340px` / `--panel-handle-width: 20px`
- `--panel-pad-left: 28px` / `--panel-pad-right: 28px`
- `--main-area-pad: 28px`
- `--criterion-col-width: 340px`
- `--shadow: 4px 4px 16px 0 rgba(0,0,0,0.05)`

### 2.3 영역 메모
| 영역 | 위치 / 치수 |
| --- | --- |
| `.dash-header` | `padding: 16px 28px`, 흰 배경, 하단 1px `--neutral-300` |
| `.dash-body` | grid `var(--panel-shell-width) 1fr`, `overflow: hidden` |
| `.left-panel-shell` | width `var(--panel-shell-width)` (340px), `z-index: 2` |
| `.left-panel` | width `calc(100% - var(--panel-handle-width))`, 흰 배경, 자체 flex column |
| `.panel-toggle` | 패널 우측에 절대 위치 핸들, width `var(--panel-handle-width)` (20px) |
| 패널 확장 시 (`.panel-expanded`) | `.left-panel-shell`이 absolute로 떠올라 `width: calc(min(780px, 100vw - 56px) + var(--panel-handle-width))`, 그림자 `var(--shadow)`, `z-index: 6` (오버레이형) |
| `.main-shell` | grid 두 번째 컬럼, flex column, filter-bar + main-area 포함 |
| `.filter-bar` | `position: sticky; top: 0; z-index: 3`, `.main-shell` 상단에 고정 |
| `.main-area` | `padding: 0 var(--main-area-pad) var(--main-area-pad)`, flex column, gap 20px, 자체 세로 스크롤 |
| `.questions-selected-row` | grid `minmax(0, 1fr) var(--criterion-col-width)`, gap 20px |
| `.data-area` | 흰 배경 카드, border-radius 12px, padding `24px 24px 32px` |
| `.main-copyright` | `.main-area` 내 하단 저작권 텍스트. caption-1, `--neutral-400` |
| `.dash-footer` | 실질적으로 비어있음 (PPT 내보내기 버튼 주석 처리됨) |

### 2.4 반응형
- 좁은 뷰포트에서 `.questions-selected-row { grid-template-columns: 1fr; }`, `.data-area { width: 100%; }` 등으로 1열 fallback

---

## 3. UI 컴포넌트 상세 스펙

### 3.1 상단 헤더 `.dash-header`

#### 3.1.1 헤더 좌측 `.header-main`
- 가로 정렬, `gap: 40px`, `min-width: 0; flex: 1`
- 로고 `a.logo-link`
  - 마크업: `<a href="home.html" class="logo-link" aria-label="purple6studio 홈으로 이동">`
  - 이미지 `.logo-img`: 110×16, `assets/purple6studio_한줄_black.png`
  - 동작: 클릭 시 `home.html`로 이동(같은 탭, 표준 앵커 동작)
- 제목 영역 `.title-wrap`
  - `#project-title` (`.project-title`) — 텍스트 노드, sessionStorage `survey.title` 표시. heading-3(20px) **bold**, `--neutral-900`, ellipsis 처리
  - `#project-title-input` (`.project-title-input`, hidden) — 인라인 편집 input. `maxlength="50"`, heading-4(18px) semibold, padding 4px 8px, border 1px `--neutral-900`, border-radius 8px, `max-width: 420px`
  - `#title-edit-btn` (`.title-edit-btn`) — 28×28 정사각, 아이콘 `assets/icons/edit_40dp_…svg` (20×20, opacity 0.5 → hover 1)
  - 동작: 편집 버튼 클릭 시 input 노출 → Enter 확정 / Escape 취소 / blur 자동 확정. 확정 시 `saveSurveys()`를 통해 Supabase DB의 해당 설문 `title` 동기화

#### 3.1.2 헤더 우측 `.header-actions`
- 가로 정렬, `gap: 8px`, 전체 3개 버튼
- 버튼 공통 `.dashboard-header-btn`
  - `min-height: 36px`, padding `var(--button-1-padding)` (`7px 14px`)
  - border 1px `--neutral-300`, border-radius 8px, 흰 배경, `--neutral-900` 글자
  - 아이콘 `.dashboard-header-btn-icon` 16×16 (object-fit contain)
  - hover: 테두리/글자 `--neutral-900` + 폰트 semibold
  - focus-visible: `outline: 2px solid var(--Black)`
- primary 모디파이어 `.is-button-1-black`: 배경/테두리 `--neutral-900`, 흰 글자, semibold, 아이콘 invert(흰색)

| id | 클래스 | 텍스트 | 아이콘 | 역할 |
| --- | --- | --- | --- | --- |
| `dashboard-data-update-btn` | `.dashboard-header-btn` | `데이터 교체하기` | `autorenew_*` | 데이터 교체하기 모달 열기 |
| `dashboard-list-btn` | `.dashboard-header-btn` | `저장된 대시보드 리스트` + 카운트 뱃지 | `menu_…` | 리스트 모달 열기 |
| `new-analysis-btn` | `.dashboard-header-btn.is-button-1-black` | `새 대시보드 만들기` | `new_window_*` | `home.html` 이동 |

- 카운트 뱃지 `#saved-count` (`.dashboard-number-tag`)
  - 18×18 pill, 검정 배경, 흰 숫자, label-2(13px) semibold
  - 자릿수 모디파이어: `.digits-2` → 28×18, `.digits-3` → 36×18
  - 값: `loadSurveys().length`로 동기화

### 3.2 좌측 문항 패널 `.left-panel`

#### 3.2.1 상단 툴바 `.panel-toolbar`
- 흰 배경, padding `24px var(--panel-pad-right) 24px var(--panel-pad-left)` (24/28/24/28), `flex: 0 0 auto`
- `.panel-title`: `문항 리스트` (heading-5 bold, `letter-spacing: -0.01em`, `margin-bottom: 24px`)
- 검색 래퍼 `.panel-search-wrap`
  - input `#panel-search` (`.panel-search`)
    - placeholder `문항 검색`
    - padding `10px 16px`, border 1px `--neutral-300`, border-radius 8px, body-3
    - focus border `--neutral-900`
  - 우측 아이콘 `.panel-search-icon` — `assets/icons/search_40dp_…svg`, 16×16, opacity 0.5, `right: 16px`, `top: 50%`, `pointer-events: none`

#### 3.2.2 문항 트리 `#question-tree` (자체 세로 스크롤)
- `flex: 1 1 auto`, `overflow-y: auto`, padding `0 var(--panel-pad-right) 24px var(--panel-pad-left)`
- 빈 상태(데이터 미로드 시): `새 대시보드를 만들거나<br>저장된 대시보드를 열어주세요` (caption-1, `--neutral-600`, 가운데)
- 로딩 중 상태: `코드북을 불러오는 중입니다...` (`.question-list-empty` 패턴)

#### 3.2.3 1차 / 2차 아코디언
- `.accordion-category` 1차 / `.accordion-subcategory` 2차
- 헤더 `.accordion-header`, `.sub-accordion-header`
  - `padding: 10px 0 10px 4px`, heading-6(14px) semibold, `--neutral-800`
  - hover: color `--neutral-900`
- chevron `.accordion-chev`, `.sub-accordion-chev` — 24×24, opacity 0.6, 닫힘 0deg → 열림 90deg
- 1차 카테고리 사이에 1px `--neutral-200` 구분선(`::after`)
- 2차에는 `linear-gradient` 위쪽 구분선(첫 항목 제외, `::before`)
- 열림 클래스: `.accordion-category.open`, `.accordion-subcategory.open`

#### 3.2.4 문항 카드 `.question-item`
- padding `10px 16px`, border 1px `--neutral-200`, border-radius 8px, body-3, `--neutral-700`, 배경 `--neutral-50`
- `cursor: grab` / active `grabbing`
- hover: 배경 `--White`, 테두리 `--neutral-600`, color `--neutral-900`
- `.selected`: 흰 배경, 테두리 `--neutral-900`, color `--neutral-900`, `box-shadow: inset 0 0 0 1px --neutral-600`
- 라벨 `.question-item-label` 항상 표시
- `.question-item-full` 기본 `display: none`
- 패널 확장 시(`.panel-expanded`) `.question-item.has-full`은 `grid-template-columns: minmax(212px, 28%) minmax(0, 1fr)` 2열로 라벨 + 풀 텍스트 동시 노출
- 드래그 페이로드: `question_label` 사용 (식별은 `question_no`)

#### 3.2.5 선택 상태 바 `#selection-status` (`.selection-status`)
- 패널 하단 sticky, `flex: 0 0 auto`
- 검정 배경, 흰 글자, label-1 semibold, padding `12px var(--panel-pad-right)`
- 좌: `<strong id="selection-count">N</strong>개 선택됨`
- 우: `전체 해제` 버튼 `#selection-clear-btn` (`.selection-clear`)
- 표시 클래스 `.show` (display flex)

#### 3.2.6 패널 확장 핸들 `#panel-toggle` (`.panel-toggle`)
- 좌측 패널 우측 가장자리에 absolute, width `var(--panel-handle-width)` (20px)
- 흰 배경, 좌우에 1px `--neutral-300` 보더
- 아이콘 `.panel-toggle-icon` — 20×20, opacity 0.6
- 확장 시(`.panel-expanded`) 아이콘 `transform: rotate(180deg)`
- 확장 동작: 메인을 밀지 않고 위로 덮는 오버레이형(절대 위치 + 그림자)

### 3.3 메인 분석 영역

#### 3.3.1 필터 바 `.filter-bar` (sticky)
- `.main-shell` 상단에 sticky (`position: sticky; top: 0; z-index: 3`)
- 흰 배경, 하단/우측 1px `--neutral-300`
- padding `16px 28px`, `min-height: 67px`
- `margin: 0 calc(var(--main-area-pad) * -1)` (메인 가로 패딩을 상쇄해 가장자리에 붙음)

구성 (좌→우):
| 요소 | 설명 |
| --- | --- |
| `.filter-label` | `필터` (heading-5 semibold, `--neutral-900`, `margin-right: 32px`) |
| `#filter-list` (`.filter-list`) | 필터 칩 가로 나열 (`gap: 8px`, `flex: 1 1 auto`) |
| `#filter-add` (`.filter-add`) | `+ 필터 추가` 버튼 + 드롭다운 메뉴 |
| `.n-count` | `N = <strong id="n-count">0</strong>` (좌측 1px `--neutral-300` 분리선, `padding-left: 24px`) |

- 필터 칩 `.filter-control` — 드래그 가능(`.draggable`), `.dragging`/`.drop-before`/`.drop-after`로 재정렬 인디케이터
- 칩 내부: 라벨, `.filter-control-summary`, 카운트 뱃지(`.filter-control-count`, 18px pill + digits-2/3 모디파이어), `.filter-remove-mark` (×)
- 필터 메뉴 `.filter-menu`/`.filter-add-menu`: `position: absolute; top: calc(100% + 8px)`, max-width 280px, max-height 240px, 스크롤 영역 `.filter-menu-scroll` 224px
- 옵션 체크박스 `.filter-option input`: 14×14, border 1px `--neutral-700`, 체크 시 검정 배경 + 흰 체크 아이콘
- 빈 메뉴: `.filter-add-empty`
- `body.filter-dragging` 클래스가 붙으면 hover 강조가 약화됨 (드래그 중 시각 피로도 완화)

#### 3.3.2 Zone 1 — 보고 싶은 문항
- 컨테이너 `.questions-selected-card`: 흰 배경, border 1px `--neutral-300`, border-radius 16px, padding 16px
- 헤더 `.questions-selected-header`
  - 좌: `.questions-selected-title` `보고 싶은 문항` (heading-5 semibold)
  - 우 `.questions-selected-actions`
    - `#target-scale-compare-btn` `.questions-selected-action-btn` — `여러 문항 한 번에 비교하기` (기본 `disabled`. 같은 척도 길이 문항이 2개 이상 모이면 활성)
    - `#target-clear-btn` `.questions-selected-action-btn.is-delete` — `모두 삭제` (`--neutral-100` 배경, hover `--neutral-200`)
- 드롭존 `#drop-target` (`.question-drop-area`)
  - `data-zone="target"`, **`data-limit="20"`**
  - 기본: border 1.5px dashed `--neutral-300`, border-radius 8px, padding 12px, `min-height: 54px`, 배경 `--neutral-50`
  - 드래그 호버 (`.drag-over`): 테두리 `--neutral-600`, 배경 `--neutral-100`
  - 빈 상태 `.empty-hint` (`absolute inset:0`)
    - `.empty-hint-main`: `좌측 문항을 여기로 드래그해 주세요.`
  - 칩이 있으면 `.has-chip` 클래스 부여, `.empty-hint`는 숨김

#### 3.3.3 Zone 2 — 그룹별 비교
- 동일 카드/헤더 구조
- 타이틀: `그룹별 비교`
- 액션
  - `#criterion-year-btn` `.questions-selected-action-btn` — `연도별 비교하기` (기본 `hidden`. 연도 관련 필터 활성 시 노출)
  - `#criterion-clear-btn` `.questions-selected-action-btn.is-delete` — `삭제`
- 드롭존 `#drop-criterion` — `data-zone="criterion"`, **`data-limit="1"`**
- 빈 상태: `좌측 문항을 여기로 드래그해 주세요.`

#### 3.3.4 칩 `.question-chip`
- 검정 배경, 흰 글자 pill (`border-radius: var(--radius-pill)`)
- `min-height: 30px`, padding `4px 8px 4px 12px`, label-1 regular
- 좌측 라벨 `.question-chip-label`, 우측 `× remove-btn` (12×12, hover 시 옅은 배경)
- 텍스트는 `question_label`만 사용

#### 3.3.5 결과 영역 `.data-area` / `#result-container`
- 컨테이너 `.data-area`: 흰 배경, 1px `--neutral-300` 테두리, border-radius 12px, padding `24px 24px 32px`, flex column gap 18px
- 내부 `#result-container` (`.result-container`): flex column gap 28px
- 빈 상태 `.result-empty`: `보고 싶은 문항을 드래그하면 차트가 생성됩니다` (가운데, body-3, `--neutral-600`, padding `60px 0`)
- 결과 섹션별 내부 구조 및 차트 종류 → `data_visualization.md` 참조

#### 3.3.6 저작권 `.main-copyright`
- `.main-area` 하단에 위치 (`.dash-footer` 내부가 아님)
- 텍스트: `(주)퍼시스 Copyright 2026 fursys Inc.`
- caption-1, `--neutral-400`

### 3.4 모달 5종

| 모달 ID | 트리거 | 헤더 타이틀 | 핵심 내용 |
| --- | --- | --- | --- |
| `#list-modal` | `#dashboard-list-btn` | `저장된 대시보드 리스트` | `saved-list-modal.js`가 동적 생성. 홈과 동일한 리스트 (이름 바꾸기 / 삭제 / 클릭 진입) |
| `#data-update-modal` | `#dashboard-data-update-btn` | `데이터 교체하기` | 3종 파일 교체 + `대시보드 업데이트`로 최종 검증 후 반영 |
| `#other-response-modal` | 결과 영역에서 기타 응답 클릭 | `기타 응답` | 자유응답 목록을 작은 팝오버로 노출 (`max-width: 360px`, 백드롭 없음) |
| `#scale-compare-modal` | `#target-scale-compare-btn` | `다른 문항과 묶어서 보기` | 같은 척도 길이 후보 다중 선택 후 적용 |
| `#group-config-modal` | 결과 영역 범례의 `그룹 편집` 버튼 | `범례 그룹 편집` | 그룹별 비교 시 범례 항목을 사용자 정의 그룹으로 묶기·이름 붙이기 |

#### 3.4.1 모달 공통 스타일
- 백드롭 `.modal-backdrop`: `position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(3px); z-index: 50`
- 모달 본체 `.modal`: `max-width: 560px`, `max-height: 80vh`, border-radius 16px, `box-shadow: 4px 4px 20px 0 rgba(0,0,0,0.05)`
- 헤더 `.modal-header`: padding 24px, 하단 1px `--neutral-300`
- 타이틀 `.modal-title`: heading-5 semibold
- 닫기 버튼 `.modal-close`: 28×28 원, hover 배경 `--neutral-50`. 아이콘 `.modal-close-icon` 16×16 (`close_wght600fill1_40px.svg`)
- 바디 `.modal-body`: padding 8px (모달별로 재정의 가능), 자체 세로 스크롤
- 푸터 `.modal-footer`: padding `14px 16px 16px`, 우측 정렬, 상단 1px `--neutral-300`
- 액션 버튼 `.modal-action-btn` / `.modal-action-btn.primary`
  - 기본: 흰 배경, `--neutral-700` 글자, button-2(13px), regular, padding `6px 12px`, border-radius 8px
  - hover: 테두리/글자 `--neutral-900`, semibold
  - primary: `--Black` 배경, 흰 글자, semibold. hover `#2a2a2a`
- 닫기 트리거 공통: × 버튼 / 백드롭 클릭 / Esc 키

#### 3.4.2 데이터 교체하기 모달 `#data-update-modal`
- 안내 `.update-note`: `업로드된 CSV 파일을 파일별로 교체할 수 있어요. 파일을 모두 고른 뒤 아래의 대시보드 업데이트 버튼을 누르면 세 파일을 함께 검증한 다음 반영합니다.`
- 본문 `#data-update-list`: 코드북 / 숫자형 / 텍스트형 3행 (각 행에 현재 파일명 + 교체 트리거)
- 푸터: `#apply-data-update-btn` `.modal-action-btn.primary` → `대시보드 업데이트`
- 숨김 input: `#data-update-file-input` (`accept=".csv"`)
- 검증 로직: `validateFileForKey` + `validateBundleConsistency` 통과 후 Supabase Storage에 업로드하고 화면 재렌더링

#### 3.4.3 기타 응답 모달 `#other-response-modal`
- 작은 팝오버형 (`background: transparent; backdrop-filter: none; padding: 0`)
- 모달 본체: `width: min(360px, calc(100vw - 24px))`, `max-height: min(340px, calc(100vh - 24px))`, border-radius 14px, `z-index: 70`
- 헤더 padding 작게 (`14px 16px 10px`), 타이틀 heading-4
- 본문: `.other-modal-subtitle` (어떤 문항의 기타 응답인지) + `ul.other-modal-list` (응답자별 자유응답)

#### 3.4.4 척도 비교 모달 `#scale-compare-modal`
- 본문: `#scale-compare-modal-note` (어떤 척도 길이 기준인지 안내) + `#scale-compare-modal-list` (같은 척도 길이 후보 다중 선택)
- 푸터: `취소` / `적용` (`#apply-scale-compare-btn` primary)

#### 3.4.5 범례 그룹 편집 모달 `#group-config-modal`
- 트리거: 결과 영역 범례의 `그룹 편집` 버튼 (`.legend-action-btn[data-open-group-config]`). 그룹별 비교 기준 문항이 있을 때만 노출됨
- 본문 `#group-config-list` (`.legend.group-config-list`)
  - 미배정 범례 항목(체크박스 선택 후 그룹에 배정)과 사용자 정의 그룹(아코디언) 혼합 렌더링
  - 그룹 생성 `#group-config-add-btn` → 새 그룹 추가
  - 그룹명 인라인 편집, 색상 자동 배정
  - 그룹 내 항목 드래그 재배치
- 푸터 `.group-config-footer`
  - 좌: `그룹 만들기` 버튼 `#group-config-add-btn`
  - 우: `전체 해제` (`#group-config-reset-btn`) / `편집 완료` (`#group-config-apply-btn` primary)
- 적용 시 `resultState.groupConfigModalState`에 그룹 정의가 저장되고 해당 차트만 재렌더링됨

### 3.5 푸터 `.dash-footer`
- 현재 비어있음. 추후 이미지 일괄 내보내기 또는 PPT 내보내기 버튼을 추가할 자리로 의도적으로 남겨둔 영역이다.
- PPT 내보내기 버튼 마크업은 HTML 내에 주석으로 보존되어 있음 (`#export-all-pptx-btn`)
- 저작권 문구는 `.main-area` 내 `.main-copyright`로 이동됨

---

## 4. 데이터 / API 연동

이 화면은 **Supabase (DB + Storage)**를 메인 스토리지로 사용한다. 로컬 브라우저 저장소는 세션 정보(`sessionStorage`) 및 로그인 시각(`localStorage._loginTime`)에만 사용한다.

### 4.1 인증 흐름
- `bootstrap-auth.js`가 페이지 로드 즉시 `requireAuth()`를 호출한다.
- Supabase 세션이 없거나 `localStorage._loginTime` 기준 24시간이 경과하면 `login.html`로 리다이렉트한다.

### 4.2 진입 시 읽는 데이터
| 항목 | 출처 | 사용처 |
| --- | --- | --- |
| `survey.currentId` | sessionStorage | Supabase `surveys` 테이블에서 해당 설문 메타 조회 |
| `survey.title` | sessionStorage | `#project-title`에 표시 (이후 DB와 동기화) |
| 코드북 CSV | Supabase Storage (`shared/{id}/codebook.csv`) | 좌측 문항 트리 렌더링 |
| 숫자형 / 텍스트형 응답 CSV | Supabase Storage (`shared/{id}/value.csv`, `label.csv`) | 필터 옵션·결과 영역 렌더링 |

- 파일은 `getStoredFilePayload(fileRec)` 함수로 Storage에서 다운로드 후 인메모리에서 처리한다.
- `_surveysCache` (인메모리 배열)가 `loadSurveys()` / `saveSurveys()` 인터페이스를 통해 DB 상태와 동기화된다.

### 4.3 코드북 → 문항 트리 매핑
- `category_1` → 1차 아코디언 노드
- `category_2` → 2차 아코디언 노드 (동일 1차 아래로 그룹)
- `question_no` → 키 (드래그 식별용)
- `question_label` → 카드 라벨 / 드래그 페이로드
- `question_full` → 패널 확장 시 보조 설명 (없으면 라벨만)
- `response_type` → 결과 영역 차트 종류 결정 (`data_visualization.md` 참조)
- `data_column_role` → 필터 후보 컬럼 등 분류 기준

### 4.4 검색 동작
- 검색 대상: `category_1`, `category_2`, `question_label`, `question_full`, `question_no`
- 매칭되는 아코디언 자동 확장
- 결과 없을 때: `검색 결과가 없습니다.` 노출
- 검색 비우면 모든 아코디언 다시 닫힘

### 4.5 zone 동작 규약
- 분석 대상(target): 최대 20개 (`data-limit="20"`). 같은 척도 길이 문항이 2개 이상이면 `여러 문항 한 번에 비교하기` 활성
- 분석 기준(criterion): 최대 1개 (`data-limit="1"`). 한도 초과 시 기존 칩 교체
- 칩 텍스트는 `question_label`만, 식별은 `question_no`

### 4.6 데이터 교체하기 (`#apply-data-update-btn`)
1. 사용자가 코드북 / 숫자형 / 텍스트형 파일 중 교체할 CSV를 각 행에서 선택한다.
2. `validateFileForKey`로 선택한 파일이 해당 역할 형식에 맞는지 먼저 확인한다.
3. `validateBundleConsistency`로 세 파일의 헤더/행 구조 정합성을 다시 확인한다.
4. 검증을 통과하면 `persistStoredFile()`로 Supabase Storage를 갱신하고, 문항 트리·필터·결과 영역을 다시 렌더링한다.

### 4.7 제목 인라인 수정
1. `#title-edit-btn` 클릭 시 `#project-title-input` 노출
2. Enter 확정 / Escape 취소 / blur 자동 확정
3. 확정 시 `saveSurveys(surveys)` 호출로 Supabase DB `surveys.title` 업데이트

---

## 5. 상태·동작 규칙

### 5.1 페이지 클래스 상태
| 클래스 | 적용 위치 | 의미 |
| --- | --- | --- |
| `.panel-expanded` | `.dashboard-page .page` | 좌측 패널 오버레이 확장 |
| `.modal-backdrop.show` | 각 모달 | 표시 |
| `.drag-over` | `.question-drop-area` / `.filter-control` 등 | 드래그 호버 강조 |
| `.has-chip` | `.question-drop-area` | 칩이 1개 이상 들어있는 상태 |
| `.selected` | `.question-item` | 이미 zone에 배치된 문항 |
| `.dragging` / `.drop-before` / `.drop-after` | `.filter-control` | 필터 칩 재정렬 인디케이터 |
| `body.filter-dragging` | body | 필터 드래그 중 hover 강조 약화 |
| `.accordion-category.open` / `.accordion-subcategory.open` | 아코디언 | 펼침 상태 |
| `.dashboard-number-tag.digits-2/.digits-3` | 카운트 뱃지 | 자릿수에 따른 너비 |
| `.is-collapsed` | `.group-config-group` | 그룹 편집 모달에서 그룹 아코디언 접힘 상태 |

### 5.2 키보드 / 단축키
- 모달: Escape로 닫기
- 제목 인라인 편집: Enter 확정 / Escape 취소

---

## 6. 본 문서에서 다루지 않는 범위 (별도 문서로 분리)
- **결과 영역(`.data-area` / `#result-container`) 내부의 차트·표 시각화 (`data_visualization.md` 참조)**
  - 차트 종류 분기 (`response_type` 별 매트릭스)
  - 척도 비교·연도 비교 / 척도 그룹 / 파생 척도 등 묶음 시각화
  - 범례·정렬·평균 라벨 등 결과 영역 컨트롤
  - 결과 영역 이미지/PPTX export 동작 (`image-export-spec.md` 참조)
  - 결과 영역 데이터 바인딩 규칙
- xlsx 등 비-CSV 포맷 지원
- PPTX 일괄 내보내기 (코드 작성됨, 현재 비활성)
- 다국어 처리
