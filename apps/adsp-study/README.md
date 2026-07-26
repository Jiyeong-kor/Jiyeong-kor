# ADsP 맞춤 학습 페이지

이 디렉터리는 ADsP 학습 웹페이지의 목적, 배포 구조, 개인정보 처리 원칙을 설명합니다.

## 공개 주소

- GitHub Pages: `https://jiyeong-kor.github.io/Jiyeong-kor/`
- 주소는 유지하고 `docs/index.html`과 `docs/adsp/` 아래의 배포 자산만 교체합니다.

## 디렉터리 역할

```text
docs/
├─ index.html                    # 고정 주소에서 실행되는 로더
├─ sw.js                         # 오프라인 캐시와 갱신
└─ adsp/
   ├─ manifest.webmanifest       # 웹 앱 정보
   └─ payload/
      └─ part-*.gz.b64           # 압축된 단일 HTML의 분할 자산
```

`docs/adsp/payload/`의 파일은 순서대로 결합한 뒤 Base64 디코딩과 Gzip 해제를 거치면 실제 학습 HTML이 됩니다.

## 개인정보 처리 원칙

- 사용자의 답안, 메모, 학습 시각, 결과 파일명은 저장소에 커밋하지 않습니다.
- 학습 기록은 브라우저 저장 공간과 사용자가 직접 내보낸 JSON 파일에만 저장합니다.
- 공개 페이지에는 학습 순서와 문제·해설만 포함합니다.
- 결과 JSON은 `.gitignore`와 검증 스크립트에서 커밋 금지 대상으로 다룹니다.

## 변경 절차

1. 학습 HTML을 수정합니다.
2. HTML을 Gzip으로 압축하고 Base64로 변환한 뒤 `docs/adsp/payload/`에 분할합니다.
3. `docs/index.html`의 자산 목록과 `docs/sw.js`의 캐시 버전을 갱신합니다.
4. `python scripts/verify_adsp_site.py`를 실행합니다.
5. PR을 병합하면 같은 GitHub Pages 주소에 반영됩니다.
6. PR을 닫으면 허용된 작업 브랜치는 자동 정리 워크플로가 삭제합니다. 열린 PR이 있거나 보호된 브랜치는 유지합니다.
