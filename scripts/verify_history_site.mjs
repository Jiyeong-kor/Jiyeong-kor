import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const site = path.join(root, 'docs', 'history');
const errors = [];
const fail = message => errors.push(message);

const requiredFiles = [
  'index.html',
  'styles.css',
  'data.js',
  'app.js',
  'manifest.webmanifest',
  'sw.js',
  'icon.svg'
];

for (const file of requiredFiles) {
  const target = path.join(site, file);
  if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
    fail(`필수 파일이 없거나 비어 있습니다: docs/history/${file}`);
  }
}

const payloadDir = path.join(site, 'payload');
if (fs.existsSync(payloadDir)) {
  const payloadFiles = fs.readdirSync(payloadDir).filter(name => name.endsWith('.gz.b64'));
  if (payloadFiles.length) {
    fail(`손상되기 쉬운 압축 조각이 남아 있습니다: ${payloadFiles.join(', ')}`);
  }
}

if (!errors.length) {
  const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  const styles = fs.readFileSync(path.join(site, 'styles.css'), 'utf8');
  const dataSource = fs.readFileSync(path.join(site, 'data.js'), 'utf8');
  const appSource = fs.readFileSync(path.join(site, 'app.js'), 'utf8');
  const serviceWorker = fs.readFileSync(path.join(site, 'sw.js'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(site, 'manifest.webmanifest'), 'utf8'));

  for (const asset of ['./styles.css', './data.js', './app.js', './manifest.webmanifest', './icon.svg']) {
    if (!html.includes(asset)) fail(`index.html이 자산을 참조하지 않습니다: ${asset}`);
  }

  for (const asset of ['./index.html', './styles.css', './data.js', './app.js', './manifest.webmanifest', './icon.svg']) {
    if (!serviceWorker.includes(asset)) fail(`서비스 워커가 자산을 캐시하지 않습니다: ${asset}`);
  }

  if (!html.includes('<html lang="ko">')) fail('문서 언어가 한국어로 지정되지 않았습니다.');
  if (!html.includes('id="mainContent"')) fail('본문 바로가기 대상이 없습니다.');
  if (!styles.includes(':root[data-theme="dark"]')) fail('다크 모드 토큰이 없습니다.');
  if (!/@media \(max-width: 900px\)/.test(styles) || !/@media \(max-width: 640px\)/.test(styles)) {
    fail('태블릿 또는 모바일 반응형 구간이 없습니다.');
  }
  if (!styles.includes('--content: 1580px')) fail('넓은 데스크톱 화면을 활용하는 최대 너비가 없습니다.');

  if (manifest.start_url !== './' || manifest.scope !== './') {
    fail('하위 경로 배포용 start_url 또는 scope가 올바르지 않습니다.');
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    fail('웹 앱 매니페스트에 아이콘이 없습니다.');
  }

  const publicText = `${html}\n${appSource}`;
  for (const forbidden of ['생성 프롬프트', '브랜치 삭제', '배포 스크립트', '검수 메모', 'TODO', 'FIXME']) {
    if (publicText.includes(forbidden)) fail(`학습자용 자산에 제작자 표현이 노출됩니다: ${forbidden}`);
  }

  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  try {
    vm.runInContext(dataSource, sandbox, { filename: 'data.js' });
    vm.runInContext(appSource, sandbox, { filename: 'app.js' });

    const data = sandbox.HISTORY_DATA;
    const api = sandbox.HISTORY_APP_API;
    const questions = api?.QUESTIONS || [];

    if (!data) fail('HISTORY_DATA를 생성하지 못했습니다.');
    if (!api) fail('HISTORY_APP_API를 생성하지 못했습니다.');

    if (data?.facts?.length !== 120) {
      fail(`핵심 개념 수는 120개여야 하지만 ${data?.facts?.length ?? 0}개입니다.`);
    }
    if (questions.length !== 2400) {
      fail(`예상 문항 수는 2,400개여야 하지만 ${questions.length}개입니다.`);
    }

    const factIds = new Set();
    for (const fact of data?.facts || []) {
      if (!fact.id || !fact.title || !fact.summary || !fact.era || !fact.category) {
        fail(`필수 개념 값이 빠졌습니다: ${fact.id || 'ID 없음'}`);
      }
      if (factIds.has(fact.id)) fail(`핵심 개념 ID가 중복됩니다: ${fact.id}`);
      factIds.add(fact.id);
      if (!Number.isFinite(fact.year)) fail(`대표 연도가 숫자가 아닙니다: ${fact.id}`);
      if (!Array.isArray(fact.clues) || fact.clues.length !== 4 || new Set(fact.clues).size !== 4) {
        fail(`핵심 단서는 네 개의 고유 문장이어야 합니다: ${fact.id}`);
      }
      if (!data.sources[fact.sourceKey]) fail(`공식 출처 키가 올바르지 않습니다: ${fact.id}`);
    }

    const questionIds = new Set();
    const perFact = new Map();
    for (const question of questions) {
      if (questionIds.has(question.id)) fail(`문항 ID가 중복됩니다: ${question.id}`);
      questionIds.add(question.id);
      perFact.set(question.canonicalId, (perFact.get(question.canonicalId) || 0) + 1);

      if (!factIds.has(question.canonicalId)) fail(`존재하지 않는 개념을 참조합니다: ${question.id}`);
      if (!question.prompt || !question.type || !question.officialType) fail(`문항 필수 값이 빠졌습니다: ${question.id}`);
      if (!Array.isArray(question.options) || question.options.length !== 5) fail(`선택지가 5개가 아닙니다: ${question.id}`);
      if (new Set(question.options).size !== 5) fail(`선택지가 중복됩니다: ${question.id}`);
      if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 4) {
        fail(`정답 인덱스가 올바르지 않습니다: ${question.id}`);
      }
      if (!Array.isArray(question.explanations) || question.explanations.length !== 5 || question.explanations.some(value => !value)) {
        fail(`선택지별 해설이 완전하지 않습니다: ${question.id}`);
      }
      if (!data.officialTypes.includes(question.officialType)) fail(`공식 평가 유형이 올바르지 않습니다: ${question.id}`);
      if (!['쉬움', '보통', '어려움'].includes(question.difficulty)) fail(`난도가 올바르지 않습니다: ${question.id}`);
      const expectedPoints = { '쉬움': 1, '보통': 2, '어려움': 3 }[question.difficulty];
      if (question.points !== expectedPoints) fail(`난도와 배점이 일치하지 않습니다: ${question.id}`);
    }

    for (const fact of data?.facts || []) {
      if (perFact.get(fact.id) !== 20) fail(`${fact.id}의 연결 문항 수가 20개가 아닙니다.`);
    }

    const typeCounts = Object.fromEntries(
      data.officialTypes.map(type => [type, questions.filter(question => question.officialType === type).length])
    );
    if (Object.values(typeCounts).some(count => count === 0)) {
      fail(`공식 평가 유형 중 문항이 없는 유형이 있습니다: ${JSON.stringify(typeCounts)}`);
    }

    const difficultyCounts = Object.fromEntries(
      ['쉬움', '보통', '어려움'].map(level => [level, questions.filter(question => question.difficulty === level).length])
    );
    const mock = [
      ...questions.filter(question => question.difficulty === '쉬움').slice(0, 10),
      ...questions.filter(question => question.difficulty === '보통').slice(0, 30),
      ...questions.filter(question => question.difficulty === '어려움').slice(0, 10)
    ];
    const mockScore = mock.reduce((sum, question) => sum + question.points, 0);
    if (mock.length !== 50 || mockScore !== 100) {
      fail(`실전 모의고사가 50문항 100점으로 구성되지 않습니다: ${mock.length}문항 ${mockScore}점`);
    }

    const exam79 = data.exams.find(exam => exam.round === 79);
    if (!exam79 || exam79.date !== '2026-08-09') {
      fail('제79회 공식 시험일이 2026-08-09로 반영되지 않았습니다.');
    }

    if (!errors.length) {
      console.log(JSON.stringify({
        status: 'ok',
        facts: data.facts.length,
        questions: questions.length,
        difficultyCounts,
        typeCounts,
        mockQuestions: mock.length,
        mockScore
      }, null, 2));
    }
  } catch (error) {
    fail(`학습 애플리케이션 코드를 실행하지 못했습니다: ${error.stack || error.message}`);
  }
}

if (errors.length) {
  console.error(`한능검 사이트 검증 실패: ${errors.length}건`);
  errors.slice(0, 100).forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
