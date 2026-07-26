(() => {
  'use strict';

  const lessons = Array.isArray(window.RN_COURSE) ? window.RN_COURSE : [];

  if (window.RN_COURSE_META) {
    window.RN_COURSE_META.title = 'Compose Android 개발자를 위한 React Native 과정';
    window.RN_COURSE_META.shortTitle = 'React Native 과정';
  }

  const environmentLesson = lessons.find((lesson) => lesson.id === '01-environment');
  if (environmentLesson) {
    environmentLesson.body = environmentLesson.body
      .replace('이 과정의 기준 버전', '예제에서 사용하는 버전')
      .replace(
        '이 교과서는 2026년 7월 26일을 기준으로 <strong>React Native 0.86, React 19.2.3, Expo SDK 57 문서</strong>를 중심으로 구성했습니다.',
        '예제는 <strong>React Native 0.86, React 19.2.3, Expo SDK 57</strong>을 기준으로 작성했습니다.'
      )
      .replace('이 팀에 권장하는 방식', '권장 실습 환경')
      .replace(
        '팀 학습과 신규 실습 앱은 <strong>Expo 프로젝트와 Development Build</strong>로 시작하는 편이 적절합니다.',
        '신규 실습 앱은 <strong>Expo 프로젝트와 Development Build</strong>로 시작합니다.'
      )
      .replace(
        '팀원들은 Node.js 버전과 패키지 관리자를 통일해야 합니다.',
        '같은 프로젝트에서 작업하는 개발자는 Node.js 버전과 패키지 관리자를 통일해야 합니다.'
      );
  }

  const listLesson = lessons.find((lesson) => lesson.id === '12-lists-performance');
  if (listLesson) {
    listLesson.body = listLesson.body.replace(
      /<p>FlatList는 PureComponent 성격을 가지므로 data 밖의 값이 renderItem 결과에 영향을 준다면 <code>extraData<\/code>로 변경을 알려야 합니다\.[\s\S]*?<\/p>/,
      '<p>FlatList는 data와 extraData를 얕게 비교해 갱신 여부를 판단합니다. data 밖의 값이 renderItem 결과에 영향을 준다면 <code>extraData</code>에 새 참조를 전달해야 합니다.</p>'
    );
  }
})();
