# ADsP 맞춤 학습 페이지

이 디렉터리는 ADsP 학습 웹페이지의 운영 원칙과 배포 구조를 설명합니다.

## 공개 주소

- GitHub Pages: `https://jiyeong-kor.github.io/Jiyeong-kor/`
- 공개 주소는 유지하고 `docs/index.html`과 `docs/adsp/` 아래의 배포 자산만 교체합니다.

## 현재 학습판

- 앱 버전: `2026.07.27-v5-foundation-first`
- 구성: 선행 개념 1개 모듈, 취약 영역 8개 모듈, 혼합 확인 1개 모듈
- 문항: 100개
- 정답 위치: 1번부터 4번까지 각각 25개
- 화면: 모바일 한 열, 태블릿 두 열, PC 세 열
- 학습 순서: 용어·선행 개념 → 영문 풀네임과 한자 뜻 → 공식과 기호 → 계산 예시 → 새 문제

## 디렉터리 역할

```text
apps/adsp-study/
├─ README.md                     # 운영·배포 구조
└─ LEARNING_CONTENT_RULES.md     # 이론·문항·해설 작성 규칙

docs/
├─ index.html                    # 고정 주소에서 payload를 여는 로더
├─ sw.js                         # 오프라인 캐시와 버전 갱신
└─ adsp/
   ├─ manifest.webmanifest       # 웹 앱 정보
   └─ payload/
      └─ part-*.gz.b64           # 압축된 단일 HTML의 순서형 분할 자산

scripts/
└─ verify_adsp_site.py           # 구조·콘텐츠·정답 분포 자동 검증
```

`docs/index.html`의 `PARTS` 배열이 payload 결합 순서를 결정합니다. payload를 임의의 파일명 정렬에 의존하여 결합하지 않습니다.

## 개인정보 처리 원칙

- 사용자의 답안, 메모, 학습 시각과 결과 파일명은 저장소에 커밋하지 않습니다.
- 학습 기록은 브라우저 저장 공간과 사용자가 직접 내보낸 JSON 파일에만 저장합니다.
- 공개 페이지에는 학습 순서, 이론, 문제와 해설만 포함합니다.

## 변경 절차

1. `LEARNING_CONTENT_RULES.md`를 확인합니다.
2. 새 단일 HTML을 생성하고 Gzip·Base64 payload로 분할합니다.
3. `docs/index.html`과 `docs/sw.js`의 자산 목록과 버전을 갱신합니다.
4. `python scripts/verify_adsp_site.py`를 실행합니다.
5. PR을 병합하면 같은 GitHub Pages 주소에 반영됩니다.
6. PR을 닫으면 허용된 작업 브랜치는 자동 정리됩니다. 열린 PR과 보호 브랜치는 유지합니다.
