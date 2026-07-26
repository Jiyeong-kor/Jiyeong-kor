import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootCandidates = [
  path.resolve(scriptDir, '..', 'docs', 'history'),
  path.resolve(scriptDir, 'docs', 'history'),
  scriptDir
];
const root = rootCandidates.find(candidate => fs.existsSync(path.join(candidate, 'index.html'))) || scriptDir;
const errors = [];
const fail = message => errors.push(message);
const requiredFiles = ['index.html', 'manifest.webmanifest', 'sw.js', 'icon.svg'];

for (const file of requiredFiles) {
  const target = path.join(root, file);
  if (!fs.existsSync(target) || fs.statSync(target).size === 0) fail(`필수 파일이 없거나 비어 있습니다: ${file}`);
}

if (!errors.length) {
  const loaderHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  let fullHtml = loaderHtml;

  const payloadDir = path.join(root, 'payload');
  if (fs.existsSync(payloadDir)) {
    const partFiles = fs.readdirSync(payloadDir).filter(name => /^part-\d+\.gz\.b64$/.test(name)).sort();
    if (partFiles.length === 0) {
      fail('압축 학습 자료가 없습니다.');
    } else {
      try {
        const encoded = partFiles.map(name => fs.readFileSync(path.join(payloadDir, name), 'utf8')).join('').replace(/\s/g, '');
        fullHtml = zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
        for (const part of partFiles) {
          if (!loaderHtml.includes(part)) fail(`로더가 압축 학습 자료를 참조하지 않습니다: ${part}`);
          if (!serviceWorker.includes(part)) fail(`오프라인 캐시가 압축 학습 자료를 참조하지 않습니다: ${part}`);
        }
      } catch (error) {
        fail(`압축 학습 자료를 복원하지 못했습니다: ${error.message}`);
      }
    }
  }

  const styleMatch = fullHtml.match(/<style>\s*([\s\S]*?)\s*<\/style>/i);
  const dataMatch = fullHtml.match(/<script>\s*(const HISTORY_SOURCES[\s\S]*?const HISTORY_FACTS\s*=\s*\[[\s\S]*?\];)\s*<\/script>/i);
  const appMatch = fullHtml.match(/<script>\s*(\(\(\)\s*=>\s*\{[\s\S]*?\}\)\(\);)\s*<\/script>/i);
  if (!styleMatch) fail('학습 화면 스타일을 찾지 못했습니다.');
  if (!dataMatch) fail('핵심 개념 데이터를 찾지 못했습니다.');
  if (!appMatch) fail('학습 애플리케이션 코드를 찾지 못했습니다.');

  if (styleMatch && dataMatch && appMatch) {
    const styles = styleMatch[1];
    const dataSource = dataMatch[1];
    const appSource = appMatch[1];

    if (!fullHtml.includes('<html lang="ko">')) fail('문서 언어가 한국어로 지정되지 않았습니다.');
    for (const asset of ['manifest.webmanifest', 'icon.svg']) {
      if (!fullHtml.includes(asset) && !loaderHtml.includes(asset)) fail(`문서에서 자산을 참조하지 않습니다: ${asset}`);
    }
    if (!/@media \(max-width: (?:8[0-9]{2}|7[0-9]{2}|6[0-9]{2})px\)/.test(styles)) fail('모바일 반응형 구간이 없습니다.');
    if (!styles.includes(':root[data-theme="dark"]')) fail('다크 모드 토큰이 없습니다.');
    if (!serviceWorker.includes("'./icon.svg'")) fail('오프라인 캐시에 앱 아이콘이 포함되지 않았습니다.');
    if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) fail('웹 앱 매니페스트에 아이콘이 없습니다.');
    if (manifest.start_url !== './' || manifest.scope !== './') fail('배포 하위 경로 기준 start_url 또는 scope가 올바르지 않습니다.');

    const publicText = `${fullHtml}\n${appSource}`;
    for (const forbidden of ['생성 프롬프트', '내부 가중치', '브랜치 삭제', '배포 스크립트', '검수 메모']) {
      if (publicText.includes(forbidden)) fail(`학습자 화면에 제작자용 표현이 노출됩니다: ${forbidden}`);
    }
    if (/\bTODO\b|\bFIXME\b/.test(publicText)) fail('공개 자산에 TODO 또는 FIXME가 남아 있습니다.');

    const marker = '  function formatNumber(value) {';
    const markerIndex = appSource.indexOf(marker);
    if (markerIndex < 0) {
      fail('문제은행 검증 지점을 찾지 못했습니다.');
    } else {
      const generatorSource = `${dataSource}\n${appSource.slice(0, markerIndex)}\n  globalThis.__HISTORY_TEST__ = { QUESTIONS, HISTORY_FACTS, HISTORY_SOURCES, OFFICIAL_TYPES, FACT_MAP };\n})();`;
      const sandbox = {
        console,
        document: { getElementById: () => ({}) },
        localStorage: { getItem: () => null, setItem: () => {} }
      };
      vm.createContext(sandbox);
      try {
        vm.runInContext(generatorSource, sandbox, { filename: 'history-question-generator.js' });
        const test = sandbox.__HISTORY_TEST__;
        const questions = test.QUESTIONS;
        const facts = test.HISTORY_FACTS;
        const officialTypes = test.OFFICIAL_TYPES;
        const factMap = test.FACT_MAP;

        if (facts.length !== 110) fail(`핵심 개념 수가 110개가 아닙니다: ${facts.length}`);
        if (questions.length !== 2200) fail(`문제 수가 2,200개가 아닙니다: ${questions.length}`);
        if (new Set(facts.map(fact => fact.id)).size !== facts.length) fail('핵심 개념 ID가 중복됩니다.');
        if (new Set(questions.map(question => question.id)).size !== questions.length) fail('문항 ID가 중복됩니다.');

        for (const fact of facts) {
          if (!fact.id || !fact.title || !fact.summary || !fact.era || !fact.category) fail(`필수 개념 값이 빠졌습니다: ${fact.id || 'ID 없음'}`);
          if (!Array.isArray(fact.clues) || fact.clues.length !== 4 || new Set(fact.clues).size !== 4) fail(`핵심 단서가 네 개의 고유 문장이 아닙니다: ${fact.id}`);
          if (!test.HISTORY_SOURCES[fact.sourceKey]) fail(`공식 출처 키가 올바르지 않습니다: ${fact.id}`);
        }

        for (const question of questions) {
          if (!Array.isArray(question.options) || question.options.length !== 5) fail(`선택지가 5개가 아닙니다: ${question.id}`);
          if (new Set(question.options).size !== 5) fail(`선택지가 중복됩니다: ${question.id}`);
          if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 4) fail(`정답 인덱스가 올바르지 않습니다: ${question.id}`);
          if (!Array.isArray(question.explanations) || question.explanations.length !== 5 || question.explanations.some(value => !value)) fail(`선택지별 해설이 완전하지 않습니다: ${question.id}`);
          if (!officialTypes.includes(question.officialType)) fail(`공식 평가 유형이 올바르지 않습니다: ${question.id}`);
          if (!['쉬움', '보통', '어려움'].includes(question.difficulty)) fail(`난도가 올바르지 않습니다: ${question.id}`);
          if (!factMap.has(question.canonicalId)) fail(`원본 개념을 찾을 수 없습니다: ${question.id}`);
          const stimulusLines = String(question.stimulus || '').split('\n').map(line => line.trim()).filter(Boolean);
          if (question.type === '자료 추론' && new Set(stimulusLines).size !== stimulusLines.length) fail(`자료 단서가 중복됩니다: ${question.id}`);
          if (question.type === '순서 배열' && /\((각|갂|갃)\)/.test(question.stimulus)) fail(`순서 배열 기호가 잘못되었습니다: ${question.id}`);
        }

        const difficultyCounts = Object.fromEntries(['쉬움', '보통', '어려움'].map(level => [level, questions.filter(question => question.difficulty === level).length]));
        const typeCounts = Object.fromEntries(officialTypes.map(type => [type, questions.filter(question => question.officialType === type).length]));
        if (difficultyCounts['쉬움'] < 10 || difficultyCounts['보통'] < 30 || difficultyCounts['어려움'] < 10) fail(`실전 모의고사에 필요한 난도별 문항이 부족합니다: ${JSON.stringify(difficultyCounts)}`);
        if (Object.values(typeCounts).some(count => count === 0)) fail(`공식 평가 유형 중 문항이 없는 유형이 있습니다: ${JSON.stringify(typeCounts)}`);

        const mock = [
          ...questions.filter(question => question.difficulty === '쉬움').slice(0, 10),
          ...questions.filter(question => question.difficulty === '보통').slice(0, 30),
          ...questions.filter(question => question.difficulty === '어려움').slice(0, 10)
        ];
        const mockScore = mock.reduce((sum, question) => sum + question.points, 0);
        if (mock.length !== 50 || mockScore !== 100) fail(`실전 모의고사 구성이 50문항 100점이 아닙니다: ${mock.length}문항 ${mockScore}점`);

        if (!errors.length) {
          console.log(JSON.stringify({
            status: 'ok',
            facts: facts.length,
            questions: questions.length,
            difficultyCounts,
            typeCounts,
            mockQuestions: mock.length,
            mockScore
          }, null, 2));
        }
      } catch (error) {
        fail(`문제은행 코드를 실행하지 못했습니다: ${error.stack || error.message}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`한능검 사이트 검증 실패: ${errors.length}건`);
  errors.slice(0, 100).forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
