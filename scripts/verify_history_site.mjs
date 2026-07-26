import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const site = path.join(root, 'docs', 'history');
const errors = [];
const fail = message => errors.push(message);

const EXPECTED = {
  facts: 127,
  lessons: 40,
  questions: 2540,
  core: 1270,
  repeat: 1270,
  mocks: 5,
  mockQuestions: 50,
  mockScore: 100,
  difficultyCounts: { '쉬움': 381, '보통': 1397, '어려움': 762 }
};

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

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

function countBy(items, keySelector) {
  const result = {};
  for (const item of items) {
    const key = keySelector(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
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

  const versionMatches = [...html.matchAll(/20260727-\d+/g)].map(match => match[0]);
  if (!versionMatches.length || new Set(versionMatches).size !== 1) {
    fail(`index.html의 자산 버전이 일치하지 않습니다: ${JSON.stringify(versionMatches)}`);
  } else if (!serviceWorker.includes(versionMatches[0])) {
    fail(`서비스 워커 캐시 버전이 index.html과 일치하지 않습니다: ${versionMatches[0]}`);
  }

  if (!html.includes('<html lang="ko">')) fail('문서 언어가 한국어로 지정되지 않았습니다.');
  if (!html.includes('id="mainContent"')) fail('본문 바로가기 대상이 없습니다.');
  if (!html.includes('data-view="practice">문제 훈련')) fail('주요 메뉴의 문제 훈련 명칭이 올바르지 않습니다.');
  if (!styles.includes(':root[data-theme="dark"]')) fail('다크 모드 토큰이 없습니다.');
  if (!/@media \(max-width: 900px\)/.test(styles) || !/@media \(max-width: 640px\)/.test(styles)) {
    fail('태블릿 또는 모바일 반응형 구간이 없습니다.');
  }
  if (!styles.includes('--content: 1580px')) fail('넓은 데스크톱 화면을 활용하는 최대 너비가 없습니다.');
  for (const selector of ['.quality-grid', '.mock-set-grid', '.schedule-grid', '.source-note']) {
    if (!styles.includes(selector)) fail(`새 화면 구성에 필요한 스타일이 없습니다: ${selector}`);
  }
  if ((styles.match(/{/g) || []).length !== (styles.match(/}/g) || []).length) {
    fail('CSS 중괄호 수가 일치하지 않습니다.');
  }

  const expectedAppPath = '/Jiyeong-kor/history/';
  for (const key of ['id', 'start_url', 'scope']) {
    if (manifest[key] !== expectedAppPath) fail(`웹 앱 매니페스트 ${key}가 프로젝트 경로와 일치하지 않습니다: ${manifest[key]}`);
  }
  if (!html.includes('./manifest.webmanifest?v=20260727-2') || !serviceWorker.includes('./manifest.webmanifest?v=20260727-2')) {
    fail('매니페스트 캐시 버전이 HTML과 서비스 워커에 함께 반영되지 않았습니다.');
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    fail('웹 앱 매니페스트에 아이콘이 없습니다.');
  }

  const publicText = `${html}\n${appSource}`;
  for (const forbidden of ['생성 프롬프트', '브랜치 삭제', '배포 스크립트', '검수 메모', 'TODO', 'FIXME', '검수형 모의고사', '예상 문제']) {
    if (publicText.includes(forbidden)) fail(`학습자용 자산에 부적절한 표현이 노출됩니다: ${forbidden}`);
  }
  if (!appSource.includes("const STORAGE_KEY = 'korean-history-grade1-state-v3'")) {
    fail('학습 기록 스키마가 v3으로 갱신되지 않았습니다.');
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
    const coreQuestions = api?.CORE_QUESTIONS || [];
    const repeatQuestions = api?.REPEAT_QUESTIONS || [];
    const mockSets = api?.MOCK_SETS || [];

    if (!data) fail('HISTORY_DATA를 생성하지 못했습니다.');
    if (!api) fail('HISTORY_APP_API를 생성하지 못했습니다.');

    if (data?.facts?.length !== EXPECTED.facts) {
      fail(`핵심 개념 수는 ${EXPECTED.facts}개여야 하지만 ${data?.facts?.length ?? 0}개입니다.`);
    }
    if (data?.lessons?.length !== EXPECTED.lessons) {
      fail(`학습 단원 수는 ${EXPECTED.lessons}개여야 하지만 ${data?.lessons?.length ?? 0}개입니다.`);
    }
    if (questions.length !== EXPECTED.questions) {
      fail(`훈련 문항 수는 ${EXPECTED.questions.toLocaleString('ko-KR')}개여야 하지만 ${questions.length}개입니다.`);
    }
    if (coreQuestions.length !== EXPECTED.core || repeatQuestions.length !== EXPECTED.repeat) {
      fail(`핵심·반복 문항 수가 올바르지 않습니다: 핵심 ${coreQuestions.length}, 반복 ${repeatQuestions.length}`);
    }
    if (!Array.isArray(data?.officialTypes) || data.officialTypes.length !== 6 || new Set(data.officialTypes).size !== 6) {
      fail('공식 출제 유형은 서로 다른 여섯 항목이어야 합니다.');
    }
    for (const sourceKey of ['exam', 'contents', 'db', 'heritage', 'independence', 'archives', 'guideline', 'examGuideline']) {
      if (!data?.sources?.[sourceKey]?.url) fail(`필수 출처가 없습니다: ${sourceKey}`);
    }

    const factIds = new Set();
    const factsById = new Map();
    for (const fact of data?.facts || []) {
      if (!fact.id || !fact.title || !fact.summary || !fact.era || !fact.category || !fact.sourceNote) {
        fail(`필수 개념 값이 빠졌습니다: ${fact.id || 'ID 없음'}`);
      }
      if (factIds.has(fact.id)) fail(`핵심 개념 ID가 중복됩니다: ${fact.id}`);
      factIds.add(fact.id);
      factsById.set(fact.id, fact);
      if (!Number.isFinite(fact.year)) fail(`대표 연도가 숫자가 아닙니다: ${fact.id}`);
      if (!Number.isInteger(fact.lesson) || fact.lesson < 1 || fact.lesson > 40) {
        fail(`학습 단원 번호가 올바르지 않습니다: ${fact.id}`);
      }
      if (!Array.isArray(fact.clues) || fact.clues.length !== 4 || new Set(fact.clues).size !== 4 || fact.clues.some(clue => !clue.trim())) {
        fail(`핵심 단서는 네 개의 고유 문장이어야 합니다: ${fact.id}`);
      }
      if (fact.clues.filter(clue => !normalize(clue).includes(normalize(fact.title))).length < 2) {
        fail(`정답 명칭을 직접 노출하지 않는 단서가 두 개 미만입니다: ${fact.id}`);
      }
      if (!data.sources[fact.sourceKey]) fail(`공식 출처 키가 올바르지 않습니다: ${fact.id}`);
    }

    const lessonNumbers = data.lessons.map(lesson => lesson.number);
    if (lessonNumbers.join(',') !== Array.from({ length: 40 }, (_, index) => index + 1).join(',')) {
      fail('학습 단원 번호가 1부터 40까지 연속되지 않습니다.');
    }
    const lessonFactIds = data.lessons.flatMap(lesson => {
      if (!lesson.title || !Array.isArray(lesson.factIds) || lesson.factIds.length === 0) {
        fail(`비어 있거나 이름이 없는 학습 단원이 있습니다: ${lesson.number}`);
      }
      return lesson.factIds;
    });
    if (lessonFactIds.length !== factIds.size || new Set(lessonFactIds).size !== factIds.size) {
      fail('각 핵심 개념은 정확히 한 개의 학습 단원에 속해야 합니다.');
    }
    for (const factId of lessonFactIds) if (!factIds.has(factId)) fail(`학습 단원이 존재하지 않는 개념을 참조합니다: ${factId}`);

    const confusionCoverage = new Set();
    const confusionSignatures = new Set();
    for (const [index, set] of (data.confusionSets || []).entries()) {
      if (!Array.isArray(set) || set.length < 5 || new Set(set).size !== set.length) {
        fail(`혼동 개념 묶음 ${index + 1}의 구성이 올바르지 않습니다.`);
        continue;
      }
      const signature = [...set].sort().join('|');
      if (confusionSignatures.has(signature)) fail(`혼동 개념 묶음이 중복됩니다: ${index + 1}`);
      confusionSignatures.add(signature);
      for (const factId of set) {
        if (!factIds.has(factId)) fail(`혼동 개념 묶음이 존재하지 않는 개념을 참조합니다: ${factId}`);
        confusionCoverage.add(factId);
      }
    }
    for (const factId of factIds) if (!confusionCoverage.has(factId)) fail(`혼동 개념 묶음에 포함되지 않은 개념입니다: ${factId}`);

    for (const [index, sequence] of (data.chronologySets || []).entries()) {
      if (!Array.isArray(sequence) || sequence.length < 4 || new Set(sequence).size !== sequence.length) {
        fail(`연대기 묶음 ${index + 1}의 구성이 올바르지 않습니다.`);
        continue;
      }
      const years = [];
      for (const factId of sequence) {
        const fact = factsById.get(factId);
        if (!fact) fail(`연대기 묶음이 존재하지 않는 개념을 참조합니다: ${factId}`);
        else years.push(fact.year);
      }
      if (years.some((year, itemIndex) => itemIndex > 0 && year < years[itemIndex - 1])) {
        fail(`연대기 묶음 ${index + 1}의 대표 연도가 역순입니다: ${years.join(' → ')}`);
      }
    }

    const questionIds = new Set();
    const questionSignatures = new Set();
    const perFact = new Map();
    const perFactTier = new Map();
    const leakSensitiveTypes = new Set(['자료 추론', '시대 판단', '결론 도출', '시대 비교']);
    const sameEraRelatedTypes = new Set(['자료 추론', '지식 확인', '오답 선지 판별', '연결 판단', '탐구 설계', '결론 도출']);

    for (const question of questions) {
      if (questionIds.has(question.id)) fail(`문항 ID가 중복됩니다: ${question.id}`);
      questionIds.add(question.id);
      perFact.set(question.canonicalId, (perFact.get(question.canonicalId) || 0) + 1);
      const tierKey = `${question.canonicalId}:${question.reviewTier}`;
      perFactTier.set(tierKey, (perFactTier.get(tierKey) || 0) + 1);

      const fact = factsById.get(question.canonicalId);
      if (!fact) fail(`존재하지 않는 개념을 참조합니다: ${question.id}`);
      if (!question.prompt || !question.type || !question.officialType || !question.reviewTier) fail(`문항 필수 값이 빠졌습니다: ${question.id}`);
      if (!Array.isArray(question.options) || question.options.length !== 5) fail(`선택지가 5개가 아닙니다: ${question.id}`);
      if (new Set(question.options).size !== 5) fail(`선택지가 중복됩니다: ${question.id}`);
      if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 4) {
        fail(`정답 인덱스가 올바르지 않습니다: ${question.id}`);
      }
      if (!Array.isArray(question.explanations) || question.explanations.length !== 5 || question.explanations.some(value => !String(value).trim())) {
        fail(`선택지별 해설이 완전하지 않습니다: ${question.id}`);
      }
      if (!Array.isArray(question.optionFactIds) || question.optionFactIds.length !== 5) {
        fail(`선택지 출처 개념 정보가 완전하지 않습니다: ${question.id}`);
      }
      if (!data.officialTypes.includes(question.officialType)) fail(`공식 평가 유형이 올바르지 않습니다: ${question.id}`);
      if (!['쉬움', '보통', '어려움'].includes(question.difficulty)) fail(`난도가 올바르지 않습니다: ${question.id}`);
      const expectedPoints = { '쉬움': 1, '보통': 2, '어려움': 3 }[question.difficulty];
      if (question.points !== expectedPoints) fail(`난도와 배점이 일치하지 않습니다: ${question.id}`);
      if (![data.qualityPolicy.coreQuestionLabel, data.qualityPolicy.repeatQuestionLabel].includes(question.reviewTier)) {
        fail(`문항 구분이 올바르지 않습니다: ${question.id}`);
      }
      if (leakSensitiveTypes.has(question.type)) {
        const answerText = normalize(question.options[question.answerIndex]);
        if (answerText.length >= 3 && normalize(question.stimulus).includes(answerText)) {
          fail(`자료에 정답 문구가 직접 노출됩니다: ${question.id}`);
        }
      }
      if (sameEraRelatedTypes.has(question.type)) {
        for (const relatedId of question.relatedFactIds || []) {
          const related = factsById.get(relatedId);
          if (!related) fail(`문항이 존재하지 않는 혼동 개념을 참조합니다: ${question.id} → ${relatedId}`);
          else if (related.era !== question.era) fail(`핵심 오답이 다른 시대 개념을 사용합니다: ${question.id} → ${related.title}`);
        }
      }
      if (question.type === '연대기 배열') {
        if (!Array.isArray(question.chronologyFactIds) || question.chronologyFactIds.length !== 4) {
          fail(`연대기 문항의 사건 수가 네 개가 아닙니다: ${question.id}`);
        }
        if (!question.correctSequence) fail(`연대기 정답 순서가 없습니다: ${question.id}`);
      }
      const signature = [question.prompt, question.stimulus, ...[...question.options].sort()].map(normalize).join('|');
      if (questionSignatures.has(signature)) fail(`내용이 같은 문항이 중복 생성되었습니다: ${question.id}`);
      questionSignatures.add(signature);
    }

    for (const fact of data?.facts || []) {
      if (perFact.get(fact.id) !== 20) fail(`${fact.id}의 연결 문항 수가 20개가 아닙니다.`);
      if (perFactTier.get(`${fact.id}:${data.qualityPolicy.coreQuestionLabel}`) !== 10) fail(`${fact.id}의 핵심 문항 수가 10개가 아닙니다.`);
      if (perFactTier.get(`${fact.id}:${data.qualityPolicy.repeatQuestionLabel}`) !== 10) fail(`${fact.id}의 심화 반복 문항 수가 10개가 아닙니다.`);
    }

    const typeCounts = Object.fromEntries(
      data.officialTypes.map(type => [type, questions.filter(question => question.officialType === type).length])
    );
    if (Object.values(typeCounts).some(count => count === 0)) {
      fail(`공식 평가 유형 중 문항이 없는 유형이 있습니다: ${JSON.stringify(typeCounts)}`);
    }

    const difficultyCounts = countBy(questions, question => question.difficulty);
    if (JSON.stringify(difficultyCounts) !== JSON.stringify(EXPECTED.difficultyCounts)) {
      fail(`난도별 문항 수가 올바르지 않습니다: ${JSON.stringify(difficultyCounts)}`);
    }

    if (mockSets.length !== EXPECTED.mocks) fail(`고정 모의고사는 ${EXPECTED.mocks}회여야 하지만 ${mockSets.length}회입니다.`);
    const usedMockIds = new Set();
    for (const mockSet of mockSets) {
      if (!mockSet.title || mockSet.questionIds.length !== EXPECTED.mockQuestions || new Set(mockSet.questionIds).size !== EXPECTED.mockQuestions) {
        fail(`모의고사 문항 수 또는 고유성이 올바르지 않습니다: ${mockSet.id}`);
        continue;
      }
      const mockQuestions = mockSet.questionIds.map(id => api.QUESTION_MAP.get(id)).filter(Boolean);
      const mockScore = mockQuestions.reduce((sum, question) => sum + question.points, 0);
      if (mockQuestions.length !== EXPECTED.mockQuestions || mockScore !== EXPECTED.mockScore) {
        fail(`모의고사가 50문항 100점으로 구성되지 않습니다: ${mockSet.id} ${mockQuestions.length}문항 ${mockScore}점`);
      }
      const mockDifficultyCounts = countBy(mockQuestions, question => question.difficulty);
      if (mockDifficultyCounts['쉬움'] !== 10 || mockDifficultyCounts['보통'] !== 30 || mockDifficultyCounts['어려움'] !== 10) {
        fail(`모의고사 난도 배분이 올바르지 않습니다: ${mockSet.id} ${JSON.stringify(mockDifficultyCounts)}`);
      }
      const mockEraCounts = countBy(mockQuestions, question => question.era);
      for (const era of api.ERAS) if (mockEraCounts[era] !== 5) fail(`모의고사 시대 배분이 올바르지 않습니다: ${mockSet.id} ${era} ${mockEraCounts[era] || 0}문항`);
      const mockTypeCounts = countBy(mockQuestions, question => question.officialType);
      for (const officialType of data.officialTypes) {
        if ((mockTypeCounts[officialType] || 0) < 3) fail(`모의고사에 공식 유형이 충분하지 않습니다: ${mockSet.id} ${officialType}`);
      }
      const canonicalIds = mockQuestions.map(question => question.canonicalId);
      if (new Set(canonicalIds).size !== canonicalIds.length) fail(`한 모의고사에서 같은 개념이 반복됩니다: ${mockSet.id}`);
      for (const question of mockQuestions) {
        if (question.reviewTier !== data.qualityPolicy.coreQuestionLabel) fail(`모의고사가 심화 반복 문항을 사용합니다: ${mockSet.id} ${question.id}`);
        if (usedMockIds.has(question.id)) fail(`모의고사 회차 사이에 같은 문항이 반복됩니다: ${question.id}`);
        usedMockIds.add(question.id);
      }
    }
    if (usedMockIds.size !== EXPECTED.mocks * EXPECTED.mockQuestions) {
      fail(`모의고사 전체 고유 문항 수가 올바르지 않습니다: ${usedMockIds.size}`);
    }

    const exam79 = data.exams.find(exam => exam.round === 79);
    if (!exam79 || exam79.date !== '2026-08-09') {
      fail('제79회 공식 시험일이 2026-08-09로 반영되지 않았습니다.');
    }

    if (!errors.length) {
      console.log(JSON.stringify({
        status: 'ok',
        dataVersion: data.version,
        facts: data.facts.length,
        lessons: data.lessons.length,
        questions: questions.length,
        coreQuestions: coreQuestions.length,
        repeatQuestions: repeatQuestions.length,
        difficultyCounts,
        typeCounts,
        mockSets: mockSets.length,
        uniqueMockQuestions: usedMockIds.size
      }, null, 2));
    }
  } catch (error) {
    fail(`학습 애플리케이션 코드를 실행하지 못했습니다: ${error.stack || error.message}`);
  }
}

if (errors.length) {
  console.error(`한능검 사이트 검증 실패: ${errors.length}건`);
  errors.slice(0, 200).forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
