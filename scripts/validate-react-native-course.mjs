import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import process from 'node:process';

const root = process.cwd();
const siteDir = path.join(root, 'docs', 'react-native');
const courseDir = path.join(siteDir, 'course');
const partFiles = [1, 2, 3, 4, 5].map((number) => path.join(courseDir, `part-${number}.js`));
const audienceCopyPath = path.join(courseDir, 'audience-copy.js');
const indexPath = path.join(siteDir, 'index.html');
const appPath = path.join(siteDir, 'app.js');
const stylePath = path.join(siteDir, 'styles.css');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const filePath of [indexPath, appPath, stylePath, audienceCopyPath, ...partFiles]) {
  assert(fs.existsSync(filePath), `필수 파일이 없습니다: ${path.relative(root, filePath)}`);
}

const index = fs.readFileSync(indexPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const styles = fs.readFileSync(stylePath, 'utf8');
const audienceCopy = fs.readFileSync(audienceCopyPath, 'utf8');

new vm.Script(app, { filename: 'docs/react-native/app.js' });
new vm.Script(audienceCopy, { filename: 'docs/react-native/course/audience-copy.js' });

const context = vm.createContext({
  window: {
    RN_COURSE: []
  }
});

for (const filePath of partFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  const relative = path.relative(root, filePath);
  new vm.Script(source, { filename: relative }).runInContext(context);
}

new vm.Script(audienceCopy, {
  filename: 'docs/react-native/course/audience-copy.js'
}).runInContext(context);

const course = context.window.RN_COURSE;
const meta = context.window.RN_COURSE_META;

assert(meta && typeof meta === 'object', 'RN_COURSE_META가 없습니다.');
assert(meta.title === 'Compose Android 개발자를 위한 React Native 과정', '공개 과정 제목이 대상 독자와 일치하지 않습니다.');
assert(Array.isArray(course), 'RN_COURSE가 배열이 아닙니다.');
assert(course.length === 20, `단원 수가 20개가 아닙니다: ${course.length}개`);

const ids = new Set();
const numbers = new Set();
const requiredFields = [
  'id',
  'no',
  'phase',
  'title',
  'duration',
  'minutes',
  'summary',
  'outcomes',
  'body',
  'quiz',
  'sources'
];

for (const lesson of course) {
  for (const field of requiredFields) {
    assert(lesson[field] !== undefined && lesson[field] !== null, `${lesson.id ?? '알 수 없는 단원'}에 ${field}가 없습니다.`);
  }

  assert(!ids.has(lesson.id), `중복 단원 ID입니다: ${lesson.id}`);
  ids.add(lesson.id);
  assert(!numbers.has(lesson.no), `중복 단원 번호입니다: ${lesson.no}`);
  numbers.add(lesson.no);

  assert(typeof lesson.title === 'string' && lesson.title.length >= 5, `${lesson.id} 제목이 너무 짧습니다.`);
  assert(typeof lesson.summary === 'string' && lesson.summary.length >= 30, `${lesson.id} 요약이 너무 짧습니다.`);
  assert(typeof lesson.body === 'string' && lesson.body.length >= 2500, `${lesson.id} 본문이 교과서 분량에 미달합니다.`);
  assert(Number.isFinite(lesson.minutes) && lesson.minutes >= 60, `${lesson.id} 예상 학습 시간이 올바르지 않습니다.`);
  assert(Array.isArray(lesson.outcomes) && lesson.outcomes.length >= 3, `${lesson.id} 학습 목표가 부족합니다.`);
  assert(Array.isArray(lesson.quiz) && lesson.quiz.length >= 3, `${lesson.id} 확인 문제가 부족합니다.`);
  assert(Array.isArray(lesson.sources) && lesson.sources.length >= 2, `${lesson.id} 공식 근거가 부족합니다.`);

  lesson.quiz.forEach((item, index) => {
    assert(typeof item.question === 'string' && item.question.length >= 10, `${lesson.id} ${index + 1}번 문제의 질문이 올바르지 않습니다.`);
    assert(Array.isArray(item.options) && item.options.length >= 2, `${lesson.id} ${index + 1}번 문제의 선택지가 부족합니다.`);
    assert(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length, `${lesson.id} ${index + 1}번 문제의 정답 인덱스가 올바르지 않습니다.`);
    assert(typeof item.explanation === 'string' && item.explanation.length >= 10, `${lesson.id} ${index + 1}번 문제의 해설이 부족합니다.`);
  });

  lesson.sources.forEach((source, index) => {
    assert(typeof source.label === 'string' && source.label.length >= 3, `${lesson.id} ${index + 1}번 출처 이름이 올바르지 않습니다.`);
    assert(typeof source.url === 'string' && source.url.startsWith('https://'), `${lesson.id} ${index + 1}번 출처 URL이 HTTPS가 아닙니다.`);
  });
}

for (let number = 1; number <= 20; number += 1) {
  assert(numbers.has(number), `${number}강이 없습니다.`);
}

const requiredIds = [
  'navToggle', 'sidebar', 'mobileOverlay', 'curriculumNav', 'sidebarSearch',
  'sidebarProgressText', 'sidebarProgressPercent', 'sidebarProgressBar',
  'exportProgress', 'importProgressButton', 'importProgressInput', 'resetProgress',
  'homeButton', 'brandHome', 'themeButton', 'readProgress', 'homeScreen',
  'lessonScreen', 'homeStart', 'homeResume', 'homeResumeLabel', 'homeCompleted',
  'homeTotal', 'homeHours', 'courseGrid', 'lessonEyebrow', 'lessonTitle',
  'lessonSummary', 'lessonMeta', 'lessonOutcomes', 'lessonBody', 'quizList',
  'quizScore', 'sourceList', 'previousLesson', 'nextLesson', 'completeLesson',
  'toast', 'loadError'
];

for (const id of requiredIds) {
  assert(index.includes(`id="${id}"`), `index.html에 #${id} 요소가 없습니다.`);
}

for (const source of [
  './styles.css',
  './course/part-1.js',
  './course/part-2.js',
  './course/part-3.js',
  './course/part-4.js',
  './course/part-5.js',
  './course/audience-copy.js',
  './app.js'
]) {
  assert(index.includes(source), `index.html이 ${source}를 불러오지 않습니다.`);
}

assert(index.includes('Kotlin·Jetpack Compose Android 개발자를 위한 과정'), '홈 화면에 대상 독자가 명시되지 않았습니다.');
assert(index.includes('프로그래밍 입문이나 웹 React 일반 과정은 다루지 않습니다.'), '과정 범위의 제외 대상이 명시되지 않았습니다.');
assert(!index.includes('링크 목록이 아니라'), '이전 제작 과정에 관한 메타 문구가 공개 화면에 남아 있습니다.');
assert(!index.includes('떠넘기지'), '제작자 관점의 방어적 문구가 공개 화면에 남아 있습니다.');
assert(!index.includes('GitHub Pages 배포 파일'), '구현 세부사항이 사용자 오류 문구에 남아 있습니다.');
assert(!course.find((lesson) => lesson.id === '01-environment').body.includes('이 팀에 권장하는 방식'), '특정 팀을 전제로 한 내부 문구가 본문에 남아 있습니다.');
assert(!course.find((lesson) => lesson.id === '12-lists-performance').body.includes('위 예시의 마지막'), '제작 과정에 관한 메타 문구가 본문에 남아 있습니다.');
assert(index.includes('window.RN_COURSE = []'), 'index.html에서 RN_COURSE를 초기화하지 않습니다.');
assert(!index.includes('app.gz.b64'), '이전 gzip Base64 로더가 index.html에 남아 있습니다.');
assert(styles.length >= 10000, '모바일 스타일 파일이 예상보다 짧습니다.');
assert(styles.includes('env(safe-area-inset-top)'), 'iPhone Safe Area 스타일이 없습니다.');
assert(styles.includes('@media (max-width: 640px)'), '모바일 반응형 스타일이 없습니다.');
assert(app.includes('localStorage'), '학습 진도 저장 기능이 없습니다.');
assert(app.includes('renderQuiz'), '확인 문제 기능이 없습니다.');
assert(app.includes('exportProgress'), '진도 내보내기 기능이 없습니다.');

const totalMinutes = course.reduce((sum, lesson) => sum + lesson.minutes, 0);
const sourceCount = course.reduce((sum, lesson) => sum + lesson.sources.length, 0);
const quizCount = course.reduce((sum, lesson) => sum + lesson.quiz.length, 0);

console.log('React Native 과정 정적 검증 완료');
console.log(`- 단원: ${course.length}개`);
console.log(`- 본문: ${course.reduce((sum, lesson) => sum + lesson.body.length, 0).toLocaleString()}자`);
console.log(`- 확인 문제: ${quizCount}개`);
console.log(`- 공식 출처: ${sourceCount}개`);
console.log(`- 예상 이론 학습: ${Math.round(totalMinutes / 60)}시간`);
