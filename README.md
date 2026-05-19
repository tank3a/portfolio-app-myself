# 자산 관리 v2

개인 자산을 관리하는 웹 애플리케이션입니다. 가계부와 투자 내역을 월별로 기록하고 현금 흐름 및 순 자산을 추적합니다.

## 주요 기능

- **가계부**: 정기/비정기 수입, 카테고리별 지출 관리
- **투자**: 주식, 예금/채권, 부동산 등 자산 유형별 투자 현황 관리
- **자산 요약**: 총 자산, 총 부채, 순 자산 실시간 계산
- **차트**: 월별 수입/지출/현금 추이 그래프 및 투자 비중 파이차트
- **로컬 저장**: 데이터는 사용자 기기의 JSON 파일에 직접 저장
- **증권 API 연동**: 한국투자증권(KIS)/삼성증권 API로 주식잔고·매매손익·배당·입출금 자동 수집
  - 매일 01시 자동 배치 (EC2 서버)
  - 수동 "지금 가져오기" 버튼
  - 투자 상세 페이지에 일별 데이터 테이블 표시
  - 투자 메인 페이지에 손익 추이 차트 (일별/월별 토글)

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프레임워크 | React 18 + Vite |
| 라우팅 | React Router DOM v6 |
| 차트 | Recharts |
| 데이터 저장 | File System Access API + IndexedDB |
| 스타일 | CSS (CSS Variables) |
| 백엔드 API | EC2 Node.js + Express (`https://ai.tank3a.store/asset-api`) |
| 데이터베이스 | PostgreSQL (`assistant_db`) |

## 데이터 저장 방식

서버나 클라우드 없이 브라우저의 **File System Access API**를 통해 로컬 JSON 파일에 저장합니다. 파일 핸들은 IndexedDB에 유지되어 새로고침 후에도 재선택 없이 동일 파일을 사용합니다.

> File System Access API는 **Chrome / Edge** 기반 브라우저에서만 지원됩니다.

## 환경변수

백엔드 API URL은 환경변수로 관리합니다. 기본값은 `https://ai.tank3a.store`이며, 로컬 개발 시 `.env.local` 파일로 오버라이드 가능합니다.

```
VITE_API_BASE_URL=https://ai.tank3a.store
```

GitHub Actions 배포 시 repository secret `VITE_API_BASE_URL`을 설정해야 합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드하여 GitHub Pages에 배포합니다.

배포 URL: https://tank3a.github.io/portfolio-app-v2/
