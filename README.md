# 신입 안드로이드 앱 개발자 정지영

코틀린과 Jetpack Compose로 안드로이드 앱을 개발합니다. 팀원들과 분리배출 앱 ‘여기버려’를 만들어 Google Play에 출시했고, 지금도 검색과 즐겨찾기 기능을 개선하고 있습니다.

[포트폴리오](https://androidportfolio.jeongjiyeong486.workers.dev/) | [이메일](mailto:jeongjiyeong486@gmail.com)

## 개발한 앱

### 여기버려

버릴 물건의 이름으로 배출 방법을 찾고, 주변 수거 장소와 지역별 배출 안내를 확인하는 앱입니다. 2026년 4월부터 홈과 품목 검색, 상세 화면, 즐겨찾기를 맡고 있습니다.

출시 후 설문에서 앱 사용자들이 입력하는 검색어를 확인했습니다. ‘쿠션 팩트’처럼 기존 품목명과 다른 표현으로도 배출 안내를 찾을 수 있도록 검색어를 추가했습니다. 원래 잘 검색되던 품목도 계속 찾을 수 있는지 회귀 테스트로 확인했습니다. [검색 개선 PR](https://github.com/AndroidStudy-Sesac/Yeogi-Beoryeo/pull/579)

품목명이 바뀌어도 기존 즐겨찾기를 유지하도록 이름과 저장용 ID를 분리했습니다. Room 데이터 이전 코드를 작성하고, 이전 버전에서 저장한 품목이 업데이트 후에도 그대로 남는지 테스트했습니다. 검색 중 앱이 종료됐을 때 입력하던 검색어와 결과를 복원하는 기능도 구현했습니다.

[저장소](https://github.com/AndroidStudy-Sesac/Yeogi-Beoryeo) | [포트폴리오](https://androidportfolio.jeongjiyeong486.workers.dev/)

### FitFlow

러닝 경로를 기록하고 카메라로 운동 자세를 확인하는 개인 프로젝트입니다. 2025년 12월부터 2026년 2월까지 기획하고 개발했습니다.

CameraX와 ML Kit Pose Detection으로 관절 위치를 읽어 스쿼트와 런지 횟수를 세고, 자세에 따라 음성으로 안내하도록 만들었습니다. 러닝 경로와 운동 기록은 Room에 저장하며, 서버 전송에 실패하면 다시 전송하도록 구현했습니다.

같은 운동 기록의 저장 요청이 겹칠 때 중복 저장되지 않도록 처리했습니다. 동시에 들어오는 요청은 뮤텍스로 제어하고, 같은 기록의 재요청과 서로 다른 기록을 구분하는 단위 테스트를 작성했습니다.

[저장소와 기능 시연](https://github.com/Jiyeong-kor/FitFlow)

## 프로젝트에 사용한 기술

| 영역 | 기술 |
| --- | --- |
| 언어와 비동기 처리 | Kotlin, Coroutines, Flow |
| 화면과 상태 관리 | Jetpack Compose, ViewModel, Navigation Compose |
| 설계 | MVVM, Clean Architecture, 멀티 모듈, Hilt |
| 데이터와 네트워크 | Room, DataStore, Retrofit, Firebase |
| 기기 기능 | CameraX, ML Kit Pose Detection, 위치 기반 서비스 |
| 검증과 배포 | 단위 테스트, Compose UI 테스트, GitHub Actions, Google Play |

## 학습 자료와 도구

1. [ADsP 맞춤 학습 페이지](https://jiyeong-kor.github.io/Jiyeong-kor/)
2. [Compose 개발자를 위한 React Native 과정](https://jiyeong-kor.github.io/Jiyeong-kor/react-native/)
3. [한능검 1급 훈련소](https://jiyeong-kor.github.io/Jiyeong-kor/history/)
4. [모션 그래픽 참고 자료 조사용 Codex 스킬](https://github.com/Jiyeong-kor/Jiyeong-kor/tree/main/skills/motion-graphics-reference)

[ADsP 운영 문서](apps/adsp-study/README.md) | [한능검 운영 문서](apps/korean-history-study/README.md)
