## Focus

- Android app architecture
- Mobile user experience
- Local and remote data handling
- Sustainable project structure

## Tech Stack

### Main

`Kotlin` · `Android` · `Jetpack Compose` · `Coroutines / Flow`

### Architecture

`MVVM` · `Clean Architecture` · `Multi-module Architecture`

### Used In Projects

`Hilt` · `Room` · `Firebase` · `CameraX` · `ML Kit` · `Kakao Map SDK`

### Also Tried

`Flutter / Dart` · `React` · `Kotlin Multiplatform` · `SQLDelight`

---

## 이 저장소의 공개 도구

- [ADsP 맞춤 학습 페이지](https://jiyeong-kor.github.io/Jiyeong-kor/)
- [Compose Android 개발자를 위한 React Native 과정](https://jiyeong-kor.github.io/Jiyeong-kor/react-native/)
- [한능검 1급 훈련소](https://jiyeong-kor.github.io/Jiyeong-kor/history/)

## Codex Skills

### Motion Graphics Reference

`skills/motion-graphics-reference/`는 코드 기반 모션 그래픽을 만들 때 참고 자료를 조사하고 구현 방식을 선택하기 위한 개인 Codex 스킬입니다.

주요 용도:

- 앱 기능 소개 영상
- UI 및 웹사이트 모션
- 키네틱 타이포그래피
- 로고 애니메이션
- 차트 및 데이터 시각화 영상
- 포트폴리오용 제품 쇼릴

Prompt Motion의 사례를 탐색한 뒤 원본 제작자와 출처를 확인하고, 프로젝트에 맞는 HyperFrames, Remotion, GSAP, Canvas 등의 구현 방식을 선택하도록 구성했습니다.

Codex 사용자 범위에 설치:

```bash
npx skills add Jiyeong-kor/Jiyeong-kor --skill motion-graphics-reference --agent codex --global --yes
```

### HyperFrames

실제 모션 그래픽 제작에는 HyperFrames의 공식 `motion-graphics` 스킬을 함께 사용할 수 있습니다.

```bash
npx skills add heygen-com/hyperframes --skill motion-graphics --agent codex --global --yes
```

HyperFrames 스킬은 짧은 모션 그래픽, 키네틱 타이포그래피, 통계 및 차트 애니메이션, 로고 리빌, UI 애니메이션 등을 계획하고 제작하고 검증하는 작업 흐름을 제공합니다.

설치 후 새 Codex 세션에서 스킬을 사용합니다.

## 저장소 구조

```text
apps/adsp-study/                    # ADsP 학습 페이지 운영 문서
apps/korean-history-study/          # 한능검 1급 학습 페이지 운영 문서
docs/                               # GitHub Pages 배포 파일
skills/motion-graphics-reference/   # 모션 그래픽 Codex 스킬과 참고 자료
scripts/verify_adsp_site.py         # ADsP 배포·기능 검증
scripts/verify_history_site.mjs     # 한능검 문제은행·배포 검증
.github/workflows/                  # 사이트 검증과 병합 브랜치 자동 정리
```

개인 학습 결과 JSON은 저장소에 커밋하지 않습니다. 결과 파일은 브라우저와 사용자의 로컬 파일에만 보관합니다.
