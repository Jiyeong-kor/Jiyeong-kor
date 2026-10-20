# 신입 안드로이드 앱 개발자 정지영

코틀린과 Jetpack Compose로 안드로이드 앱을 개발합니다. 팀 프로젝트 ‘여기버려’에서 품목 검색과 상세 안내, 즐겨찾기를 담당했으며, Google Play 출시와 후속 업데이트에 참여했습니다. 기능 구현에 필요한 데이터 처리부터 상태 복원, 테스트와 출시 검증까지 함께 다룹니다.

[포트폴리오](https://androidportfolio.jeongjiyeong486.workers.dev/) | [이메일](mailto:jeongjiyeong486@gmail.com)

## 대표 프로젝트

### 여기버려

분리배출 품목 정보와 주변 수거 장소, 지역별 배출 안내를 제공하는 팀 프로젝트입니다. 2026년 4월부터 홈, 품목 검색과 상세 안내, 즐겨찾기의 데이터 처리와 상태 관리를 담당하고 있습니다.

1. **검색 품질 개선**: 이용자 설문에서 확인한 표현을 전용 검색어로 연결했습니다. 정확히 일치하는 품목의 우선순위와 관련 품목 검색을 유지하도록 회귀 테스트를 보강했습니다. [검색 개선 PR](https://github.com/AndroidStudy-Sesac/Yeogi-Beoryeo/pull/579)
2. **즐겨찾기 보존**: 품목 표시명과 저장 식별자를 분리하고, Room 데이터 이전으로 업데이트 후에도 기존 즐겨찾기를 복원하도록 구현했습니다.
3. **상태와 출시 검증**: 재실행 뒤 검색 상태를 복원하도록 구성하고, 단위 테스트와 화면 테스트, GitHub Actions 검증을 보강했습니다. 변경 사항은 팀원 리뷰와 자동 검증을 거쳐 반영했습니다.

[저장소](https://github.com/AndroidStudy-Sesac/Yeogi-Beoryeo) | [담당 역할과 문제 해결 사례](https://androidportfolio.jeongjiyeong486.workers.dev/)

### FitFlow

러닝 기록과 운동 자세 코칭을 결합한 개인 안드로이드 프로젝트입니다. 2025년 12월부터 2026년 2월까지 기획과 개발을 맡았습니다.

1. **운동 자세 코칭**: CameraX와 ML Kit Pose Detection으로 관절 위치를 받아 스쿼트와 런지의 횟수 집계, 자세 평가와 음성 안내에 연결했습니다. 좌표의 신뢰도와 흔들림을 고려해 운동 판정 조건을 구성했습니다.
2. **운동 기록 저장**: 위치 기반 러닝 기록과 Room 저장을 구현하고, 서버 전송에 실패한 기록은 재시도하도록 구성했습니다.
3. **중복 요청 처리**: 여러 시점에 발생하는 저장 요청을 모아 연속된 중복 기록을 걸러내고, 뮤텍스로 동시 요청을 제어했습니다. 중복 요청과 서로 다른 운동 기록을 구분하는 단위 테스트를 작성했습니다.

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

학습 페이지 운영 문서는 [ADsP](apps/adsp-study/README.md)와 [한능검](apps/korean-history-study/README.md)에서 확인할 수 있습니다. 개인 학습 결과는 저장소에 올리지 않고 브라우저와 로컬 파일에 보관합니다.
