(() => {
  'use strict';

  const lessons = Array.isArray(window.RN_COURSE) ? window.RN_COURSE : [];

  const environmentLesson = lessons.find((lesson) => lesson.id === '01-environment');
  if (environmentLesson) {
    environmentLesson.body = environmentLesson.body
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
