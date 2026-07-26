# ADsP 맞춤 학습 페이지

이 디렉터리는 ADsP 학습 웹페이지의 콘텐츠 규칙, 배포 구조, 개인정보 처리 원칙을 설명합니다.

## 공개 주소

- GitHub Pages: `https://jiyeong-kor.github.io/Jiyeong-kor/`
- 공개 주소는 유지하고 `docs/index.html`과 `docs/adsp/` 아래의 배포 자산만 교체합니다.

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
      └─ part-01.gz.b64 … part-07.gz.b64
                                 # 압축된 단일 HTML의 분할 자산

scripts/
└─ verify_adsp_site.py           # 구조·콘텐츠·정답 분포 검증
```

`docs/adsp/payload/`의 파일을 이름 순서대로 결합한 뒤 Base64 디코딩과 Gzip 해제를 거치면 실제 단일 HTML이 됩니다. 공개 저장소에는 개인 결과 파일을 두지 않으며, 배포에 필요한 HTML만 압축 자산으로 보관합니다.

## 개인정보 처리 원칙

- 사용자의 답안, 메모, 학습 시각, 결과 파일명은 저장소에 커밋하지 않습니다.
- 학습 기록은 브라우저 저장 공간과 사용자가 직접 내보낸 JSON 파일에만 저장합니다.
- 공개 페이지에는 학습 순서, 이론, 문제와 해설만 포함합니다.
- 결과 JSON은 `.gitignore`와 검증 스크립트에서 커밋 금지 대상으로 다룹니다.

## 변경 절차

1. `apps/adsp-study/LEARNING_CONTENT_RULES.md`를 확인합니다.
2. 수정한 단일 HTML을 Gzip으로 압축하고 Base64로 변환합니다.
3. 10,000자 단위로 `docs/adsp/payload/part-*.gz.b64`에 분할합니다.
4. `docs/index.html`의 payload 목록과 `docs/sw.js`의 캐시 버전을 갱신합니다.
5. `python scripts/verify_adsp_site.py`를 실행합니다.
6. PR을 병합하면 같은 GitHub Pages 주소에 반영됩니다.
7. PR을 닫으면 허용된 작업 브랜치는 자동 정리됩니다. 열린 PR과 보호 브랜치는 유지합니다.
