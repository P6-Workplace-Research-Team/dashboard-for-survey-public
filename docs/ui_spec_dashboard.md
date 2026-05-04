# 대시보드 화면 정의서 (design_spec_dashboard)

최종 갱신: 2026-04-30
대상 파일: `dashboard.html` (스타일: `dashboard-for-survey.css`의 `.dashboard-page` 스코프, 스크립트: `visualizations.js`)

> **차트 영역(`.data-area` / `#result-container` 내부 시각화)은 본 문서에서 _확인 예정(TBD)_ 으로 둔다.**
> 영역의 위치·컨테이너·진입점만 기록하고, 시각화 종류·동작·옵션은 별도 문서로 분리한다.

---

## 1. 화면 개요 / 목적

### 1.1 화면 정보
- 화면명: 설문조사 분석 대시보드
- 파일: `dashboard.html` (`<body class="dashboard-page">`)
- `<title>`: `설문조사 분석 대시보드 | purple6studio`
- 의존
  - 스타일: `dashboard-for-survey.css`
  - 스크립트: `visualizations.js`
  - 라이브러리: `assets/libs/dom-to-image-more.min.js`, `assets/libs/html2canvas.min.js` (결과 영역 export 용도)
- 진입 경로: 홈에서 분석 시작 또는 저장된 대시보드 진입. sessionStorage에 `survey.currentId` / `survey.title`이 세팅된 상태로 진입한다.

### 1.2 목적
1. 업로드된 코드북 기준으로 좌측 **문항 트리**를 보여주고 검색·확장한다.
2. 응답자 모집단을 좁히는 **필터 바**를 제공한다.
3. 좌측의 문항 카드를 두 드롭존(보고 싶은 문항 / 그룹별 비교)으로 드래그해 분석 구조를 정의한다.
4. 정의된 분석 구조에 따라 차트와 표를 렌더링한다 (TBD).
5. 저장된 대시보드 목록을 확인하고 다시 진입할 수 있다.
6. 데이터 파일을 교체하거나 새 대시보드를 만들 수 있다.

### 1.3 페이지 동작 특성
- `.dashboard-page .page`는 `height: 100vh` + `overflow: hidden` (앱 셸 스타일)
- 헤더와 푸터는 고정 영역, 본문(`.dash-body`)은 좌측 패널과 메인 영역의 2단 그리드

---

## 2. 레이아웃 구조 / 영역 구분

### 2.1 전체 구조
```
┌── .dash-header ──────────────────────────────────────────┐ 16px 28px
│  [logo] [project-title] [edit] ········· [actions row]   │
├── .dash-body (grid: panel-shell-width 1fr) ──────────────┤
│  [left-panel-shell]  [main-area]                         │
│   ? .left-panel       ? .filter-bar (sticky top)         │
│   ? .panel-toggle     ? .zones-row (target | criterion)  │
│                       ? .data-area (TBD)                 │
├── .dash-footer ──────────────────────────────────────────┤ 64px
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
| `.main-area` | grid 두 번째 컬럼, `padding: 0 var(--main-area-pad) var(--main-area-pad)`, `flex column`, `gap: 20px`, 자체 세로 스크롤 |
| `.filter-bar` | `position: sticky; top: 0; z-index: 3`, 메인 영역 좌우 가장자리에 닿게 `margin: 0 calc(var(--main-area-pad) * -1)` |
| `.zones-row` | grid `minmax(0, 1fr) var(--criterion-col-width)`, gap 20px |
| `.data-area` | 흰 배경 카드, border-radius 12px, padding `24px 24px 32px` |
| `.dash-footer` | `min-height: 64px`, 흰 배경, 상단 1px `--neutral-300`, color `--neutral-400`, caption-1 |

### 2.4 반응형
- `max-width: ~` 구간에서 `.zones-row { grid-template-columns: 1fr; }`, `.data-area { width: 100%; }` 등으로 1열 fallback (자세한 break는 4900~5000 라인대)

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
  - `#project-title` (`.project-title`) ? 텍스트 노드, sessionStorage `survey.title` 표시. heading-3(20px) **bold**, `--neutral-900`, ellipsis 처리
  - `#project-title-input` (`.project-title-input`, hidden) ? 인라인 편집 input. `maxlength="50"`, heading-4(18px) semibold, padding 4px 8px, border 1px `--neutral-900`, border-radius 8px, `max-width: 420px`
  - `#title-edit-btn` (`.title-edit-btn`) ? 28×28 정사각, 아이콘 `assets/icons/edit_40dp_…svg` (20×20, opacity 0.5 → hover 1)
  - 동작: 편집 버튼 클릭 시 input 노출 → Enter 확정 / Escape 취소 / blur 자동 확정. 확정 시 `localStorage.p6s.surveys`의 해당 엔트리 `title` 동기화

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
  - 우측 아이콘 `.panel-search-icon` ? `assets/icons/search_40dp_…svg`, 16×16, opacity 0.5, `right: 16px`, `top: 50%`, `pointer-events: none`

#### 3.2.2 문항 트리 `#question-tree` (자체 세로 스크롤)
- `flex: 1 1 auto`, `overflow-y: auto`, padding `0 var(--panel-pad-right) 24px var(--panel-pad-left)`
- 빈 상태: `.question-list-empty` ? `코드북을 불러오는 중입니다...` (caption-1, `--neutral-600`, 가운데)

#### 3.2.3 1차 / 2차 아코디언
- `.accordion-category` 1차 / `.accordion-subcategory` 2차
- 헤더 `.accordion-header`, `.sub-accordion-header`
  - `padding: 10px 0 10px 4px`, heading-6(14px) semibold, `--neutral-800`
  - hover: color `--neutral-900`
- chevron `.accordion-chev`, `.sub-accordion-chev` ? 24×24, opacity 0.6, 닫힘 0deg → 열림 90deg
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
- 아이콘 `.panel-toggle-icon` ? 20×20, opacity 0.6
- 확장 시(`.panel-expanded`) 아이콘 `transform: rotate(180deg)`
- 확장 동작: 메인을 밀지 않고 위로 덮는 오버레이형(절대 위치 + 그림자)

### 3.3 메인 분석 영역 `.main-area`

#### 3.3.1 필터 바 `.filter-bar` (sticky)
- 흰 배경, 하단/우측 1px `--neutral-300`
- padding `16px 28px`, `min-height: 67px`
- `position: sticky; top: 0; z-index: 3`
- `margin: 0 calc(var(--main-area-pad) * -1)` (메인 가로 패딩을 상쇄해 가장자리에 붙음)

구성 (좌→우):
| 요소 | 설명 |
| --- | --- |
| `.filter-label` | `필터` (heading-5 semibold, `--neutral-900`, `margin-right: 32px`) |
| `#filter-list` (`.filter-list`) | 필터 칩 가로 나열 (`gap: 8px`, `flex: 1 1 auto`) |
| `#filter-add` (`.filter-add`) | `+ 필터 추가` 버튼 + 드롭다운 메뉴 |
| `.n-count` | `N = <strong id="n-count">0</strong>` (좌측 1px `--neutral-300` 분리선, `padding-left: 24px`) |

- 필터 칩 `.filter-control` ? 드래그 가능(`.draggable`), `.dragging`/`.drop-before`/`.drop-after`로 재정렬 인디케이터
- 칩 내부: 라벨, `.filter-control-summary`, 카운트 뱃지(`.filter-control-count`, 18px pill + digits-2/3 모디파이어), `.filter-remove-mark` (?)
- 필터 메뉴 `.filter-menu`/`.filter-add-menu`: `position: absolute; top: calc(100% + 8px)`, max-width 280px, max-height 240px, 스크롤 영역 `.filter-menu-scroll` 224px
- 옵션 체크박스 `.filter-option input`: 14×14, border 1px `--neutral-700`, 체크 시 검정 배경 + 흰 체크 아이콘
- 빈 메뉴: `.filter-add-empty`
- 본문에 `body.filter-dragging` 클래스가 붙으면 hover 강조가 약화됨 (드래그 중 시각 피로도 완화)
- 초기 `n-count` 값: `0` (실데이터/필터 적용 결과로 갱신)

#### 3.3.2 Zone 1 ? 보고 싶은 문항
- 컨테이너 `.zone-card`: 흰 배경, border 1px `--neutral-300`, border-radius 16px, padding 16px
- 헤더 `.zone-header`
  - 좌: `.zone-title` `보고 싶은 문항` (heading-5 semibold)
  - 우 `.zone-actions`
    - `#target-scale-compare-btn` `.zone-action-btn` ? `여러 문항 한 번에 비교하기` (기본 `disabled`. 같은 척도 길이 문항이 2개 이상 모이면 활성)
    - `#target-clear-btn` `.zone-action-btn.is-delete` ? `모두 삭제` (`--neutral-100` 배경, hover `--neutral-200`)
- 드롭존 `#drop-target` (`.drop-area`)
  - `data-zone="target"`, **`data-limit="20"`**
  - 기본: border 1.5px dashed `--neutral-300`, border-radius 8px, padding 12px, `min-height: 54px`, 배경 `--neutral-50`
  - 드래그 호버 (`.drag-over`): 테두리 `--neutral-600`, 배경 `--neutral-100`
  - 빈 상태 `.empty-hint` (`absolute inset:0`)
    - `.empty-hint-main`: `좌측 문항을 여기로 드래그해 주세요.`
  - 칩이 있으면 `.has-chip` 클래스 부여, `.empty-hint`는 숨김

#### 3.3.3 Zone 2 ? 그룹별 비교
- 동일 카드/헤더 구조
- 타이틀: `그룹별 비교`
- 액션
  - `#criterion-year-btn` `.zone-action-btn` ? `연도별 비교하기` (기본 `hidden`. 연도 관련 필터 활성 시 노출)
  - `#criterion-clear-btn` `.zone-action-btn.is-delete` ? `삭제`
- 드롭존 `#drop-criterion` ? `data-zone="criterion"`, **`data-limit="1"`**
- 빈 상태: `좌측 문항을 여기로 드래그해 주세요.`

#### 3.3.4 칩 `.chip`
- 검정 배경, 흰 글자 pill (`border-radius: var(--radius-pill)`)
- `min-height: 30px`, padding `4px 8px 4px 12px`, label-1 regular
- 좌측 라벨 `.chip-label`, 우측 `× remove-btn` (12×12, hover 시 옅은 배경)
- 텍스트는 `question_label`만 사용

#### 3.3.5 결과 영역 `.data-area` / `#result-container` ? **차트 영역 (TBD, 확인 예정)**
- 컨테이너 `.data-area`: 흰 배경, 1px `--neutral-300` 테두리, border-radius 12px, padding `24px 24px 32px`, flex column gap 18px
- 내부 `#result-container` (`.result-container`): flex column gap 28px
- 빈 상태 `.result-empty`: `보고 싶은 문항을 드래그하면 차트가 생성됩니다` (가운데, body-3, `--neutral-600`, padding `60px 0`)
- 본 문서에서 다루는 사항: 컨테이너 위치·치수·빈 상태 메시지까지
- 본 문서에서 다루지 않는 사항(=TBD)
  - `.result-section` / `.result-header` / `.result-title` / `.result-sub` / `.result-unsupported` 등 결과 섹션 내부 구조
  - 차트 종류 (가로 막대 / 척도 분포 / 평균 비교 / 척도 그룹 / 파생 척도 violin 등)
  - 정렬·뷰 토글·범례·평균 라벨 / 연도 비교 / 척도 묶기 / 기타 응답 등 결과 영역 컨트롤
  - 시각화 → CSV/이미지 export 동작 (`html2canvas`, `dom-to-image-more` 사용)
  - 결과 영역 데이터 바인딩 규칙

### 3.4 모달 4종

| 모달 ID | 트리거 | 헤더 타이틀 | 핵심 내용 |
| --- | --- | --- | --- |
| `#list-modal` | `#dashboard-list-btn` | `저장된 대시보드 리스트` | 홈과 동일한 리스트 (이름 바꾸기 / 삭제 / 클릭 진입) |
| `#data-update-modal` | `#dashboard-data-update-btn` | `데이터 교체하기` | 3종 파일 교체 + `분석하기`로 최종 검증 후 반영 |
| `#other-response-modal` | 결과 영역에서 기타 응답 클릭 | `기타 응답` | 자유응답 목록을 작은 팝오버로 노출 (`max-width: 360px`, 백드롭 없음) |
| `#scale-compare-modal` | `#target-scale-compare-btn` | `다른 문항과 묶어서 보기` | 같은 척도 길이 후보 다중 선택 후 적용 |

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
- 닫기 트리거 공통: ? / 백드롭 클릭 / Esc 키

#### 3.4.2 데이터 교체하기 모달 `#data-update-modal`
- 안내 `.update-note`: `업로드된 CSV 파일을 파일별로 교체할 수 있어요. 파일을 모두 고른 뒤 아래의 분석하기 버튼을 누르면 세 파일을 함께 검증한 다음 반영합니다.`
- 본문 `#data-update-list`: 코드북 / 숫자형 / 텍스트형 3행 (각 행에 현재 파일명 + 교체 트리거)
- 푸터: `#apply-data-update-btn` `.modal-action-btn.primary` → `분석하기`
- 숨김 input: `#data-update-file-input` (`accept=".csv"`)
- 검증 로직: 대시보드용 `validateFileForKey` + `validateBundleConsistency`를 거쳐 반영

#### 3.4.3 기타 응답 모달 `#other-response-modal`
- 작은 팝오버형 (`background: transparent; backdrop-filter: none; padding: 0`)
- 모달 본체: `width: min(360px, calc(100vw - 24px))`, `max-height: min(340px, calc(100vh - 24px))`, border-radius 14px, `z-index: 70`
- 헤더 padding 작게 (`14px 16px 10px`), 타이틀 heading-4
- 본문: `.other-modal-subtitle` (어떤 문항의 기타 응답인지) + `ul.other-modal-list` (응답자별 자유응답)

#### 3.4.4 척도 비교 모달 `#scale-compare-modal`
- 본문: `#scale-compare-modal-note` (어떤 척도 길이 기준인지 안내) + `#scale-compare-modal-list` (같은 척도 길이 후보 다중 선택)
- 푸터: `취소` / `적용` (`#apply-scale-compare-btn` primary)

### 3.5 푸터 `.dash-footer`
- 텍스트: `(주)퍼시스 Copyright 2026 fursys Inc.`
- `min-height: 64px`, 흰 배경, 상단 1px `--neutral-300`, color `--neutral-400`, caption-1

---

## 4. 데이터 / API 연동

이 화면도 외부 API 없이 **로컬 브라우저 저장소만** 사용한다.

### 4.1 진입 시 읽는 데이터
| 항목 | 출처 | 사용처 |
| --- | --- | --- |
| `survey.currentId` | sessionStorage | `localStorage.p6s.surveys`에서 해당 설문 메타 조회 |
| `survey.title` | sessionStorage | `#project-title`에 표시 (이후 메타와 동기화) |
| 코드북 CSV | IndexedDB(`p6s.surveyFiles`, `files.codebook.idbKey`) | 좌측 문항 트리 렌더링 |
| 숫자형 / 텍스트형 응답 | IndexedDB | 필터 옵션·결과 영역 (TBD) |

### 4.2 코드북 → 문항 트리 매핑
- `category_1` → 1차 아코디언 노드
- `category_2` → 2차 아코디언 노드 (동일 1차 아래로 그룹)
- `question_no` → 키 (드래그 식별용)
- `question_label` → 카드 라벨 / 드래그 페이로드
- `question_full` → 패널 확장 시 보조 설명 (없으면 라벨만)
- `response_type` → 결과 영역 차트 종류 결정 (TBD)
- `data_column_role` → 필터 후보 컬럼 등 분류 기준

### 4.3 검색 동작
- 검색 대상: `category_1`, `category_2`, `question_label`, `question_full`, `question_no`
- 매칭되는 아코디언 자동 확장
- 결과 없을 때: `검색 결과가 없습니다.` 노출 (`.question-list-empty` 패턴 재사용)
- 검색 비우면 모든 아코디언 다시 닫힘

### 4.4 zone 동작 규약
- 분석 대상(target): 최대 20개 (`data-limit="20"`). 같은 척도 길이 문항이 2개 이상이면 `여러 문항 한 번에 비교하기` 활성
- 분석 기준(criterion): 최대 1개 (`data-limit="1"`). 한도 초과 시 alert 또는 기존 칩 교체 (visualizations.js에서 처리, 본 문서 범위 외)
- 칩 텍스트는 `question_label`만, 식별은 `question_no`

### 4.5 데이터 교체하기 (`#apply-data-update-btn`)
1. 사용자가 코드북 / 숫자형 / 텍스트형 파일 중 교체할 CSV를 각 행에서 선택한다.
2. `validateFileForKey`로 선택한 파일이 해당 카드 형식에 맞는지 먼저 확인한다.
3. `validateBundleConsistency`로 세 파일의 헤더/행 구조 정합성을 다시 확인한다.
4. 검증을 통과하면 IndexedDB의 해당 `idbKey`를 갱신하고, 메타·좌측 트리·필터를 다시 렌더링한다.

---


## 5. 상태·동작 규칙

### 5.1 페이지 클래스 상태
| 클래스 | 적용 위치 | 의미 |
| --- | --- | --- |
| `.panel-expanded` | `.dashboard-page .page` | 좌측 패널 오버레이 확장 |
| `.modal-backdrop.show` | 각 모달 | 표시 |
| `.drag-over` | `.drop-area` / `.filter-control` 등 | 드래그 호버 강조 |
| `.has-chip` | `.drop-area` | 칩이 1개 이상 들어있는 상태 |
| `.selected` | `.question-item` | 이미 zone에 배치된 문항 |
| `.dragging` / `.drop-before` / `.drop-after` | `.filter-control` | 필터 칩 재정렬 인디케이터 |
| `body.filter-dragging` | body | 필터 드래그 중 hover 강조 약화 |
| `.accordion-category.open` / `.accordion-subcategory.open` | 아코디언 | 펼침 상태 |
| `.dashboard-number-tag.digits-2/.digits-3` | 카운트 뱃지 | 자릿수에 따른 너비 |

### 5.2 키보드 / 단축키
- 모달: Escape로 닫기
- 제목 인라인 편집: Enter 확정 / Escape 취소

---

## 6. 본 문서에서 다루지 않는 범위 (별도 문서로 분리)
- **결과 영역(`.data-area` / `#result-container`) 내부의 차트·표 시각화 (TBD)**
  - 차트 종류 분기 (`response_type` 별 매트릭스)
  - 척도 비교·연도 비교 / 척도 그룹 / 파생 척도 violin 등 묶음 시각화
  - 범례·정렬·평균 라벨 등 결과 영역 컨트롤
  - 결과 영역 export·복사 동작
- 설문별 동적 필터 추천 규칙 / N 실데이터 연결
- 다국어 처리
- xlsx 등 비-CSV 포맷 지원
