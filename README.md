<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="https://raw.githubusercontent.com/Jiyeong-kor/Jiyeong-kor/main/assets/profile/header-mobile-dark.png?v=2">
  <source media="(max-width: 600px)" srcset="https://raw.githubusercontent.com/Jiyeong-kor/Jiyeong-kor/main/assets/profile/header-mobile.png?v=2">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Jiyeong-kor/Jiyeong-kor/main/assets/profile/header-dark.png?v=2">
  <img src="https://raw.githubusercontent.com/Jiyeong-kor/Jiyeong-kor/main/assets/profile/header.png?v=2" alt="정지영 | 신입 안드로이드 앱 개발자" width="840">
</picture>

코틀린과 Jetpack Compose로 안드로이드 앱을 만듭니다. 팀원들과 분리배출 앱 ‘여기버려’를 만들어 Google Play에 출시했고, 지금도 검색과 즐겨찾기 기능을 개선하고 있습니다.

<p align="center">
  <a href="https://androidportfolio.jeongjiyeong486.workers.dev/"><strong>포트폴리오</strong></a>
  &nbsp; / &nbsp;
  <a href="mailto:jeongjiyeong486@gmail.com"><strong>이메일</strong></a>
</p>

## 프로젝트

### [여기버려](https://github.com/AndroidStudy-Sesac/Yeogi-Beoryeo)

**분리배출 안내 앱 / 팀 프로젝트**

버릴 물건의 이름으로 배출 방법을 찾고, 주변 수거 장소를 확인하는 앱입니다. 품목 검색과 상세 안내, 즐겨찾기의 데이터 처리와 상태 관리를 맡았습니다.

출시 후 설문에서 앱 사용자들이 입력하는 검색어를 확인했습니다. ‘쿠션 팩트’처럼 기존 품목명과 다른 표현으로도 배출 안내를 찾을 수 있도록 검색어를 추가했습니다. 기존 검색 결과를 확인하는 회귀 테스트도 보강했습니다.

품목명이 바뀌어도 즐겨찾기가 유지되도록 이름과 저장용 ID를 분리하고, 기존 Room 데이터를 이전했습니다. 검색 중 앱이 종료됐을 때 입력하던 검색어와 결과를 복원하는 기능도 구현했습니다.

[검색 개선 PR](https://github.com/AndroidStudy-Sesac/Yeogi-Beoryeo/pull/579) &nbsp; / &nbsp; [문제 해결 과정](https://androidportfolio.jeongjiyeong486.workers.dev/)

### [FitFlow](https://github.com/Jiyeong-kor/FitFlow)

**러닝 기록과 운동 자세 코칭 / 개인 프로젝트**

달린 경로를 기록하고 카메라로 운동 자세를 확인하는 앱입니다. 기획부터 앱 개발까지 맡았습니다.

CameraX와 ML Kit Pose Detection으로 관절 위치를 읽어 스쿼트와 런지 횟수를 세고, 자세에 따라 음성으로 안내하도록 만들었습니다. 러닝 경로와 운동 기록은 Room에 저장하며, 서버 전송에 실패하면 다시 전송하도록 구현했습니다.

같은 기록이 반복해서 들어오면 한 번만 저장하도록 처리하고, 동시에 들어오는 요청은 뮤텍스로 제어했습니다. 같은 기록의 재요청과 서로 다른 기록을 구분하는 단위 테스트도 작성했습니다.

[코드와 기능 시연](https://github.com/Jiyeong-kor/FitFlow)

## 사용 기술

**언어와 UI**  
Kotlin, Jetpack Compose, Coroutines, Flow, ViewModel, Navigation Compose

**구조와 데이터**  
MVVM, Clean Architecture, 멀티 모듈, Hilt, Room, DataStore, Retrofit, Firebase

**기기 기능과 테스트**  
CameraX, ML Kit Pose Detection, 위치 기반 서비스, 단위 테스트, Compose UI 테스트, GitHub Actions

## 학습 자료

[ADsP 학습](https://jiyeong-kor.github.io/Jiyeong-kor/) &nbsp; / &nbsp; [React Native 과정](https://jiyeong-kor.github.io/Jiyeong-kor/react-native/) &nbsp; / &nbsp; [한국사 학습](https://jiyeong-kor.github.io/Jiyeong-kor/history/)

[모션 그래픽 참고 자료 조사 스킬](https://github.com/Jiyeong-kor/Jiyeong-kor/tree/main/skills/motion-graphics-reference)

학습 페이지 운영 문서: [ADsP](https://github.com/Jiyeong-kor/Jiyeong-kor/blob/main/apps/adsp-study/README.md), [한국사](https://github.com/Jiyeong-kor/Jiyeong-kor/blob/main/apps/korean-history-study/README.md)
