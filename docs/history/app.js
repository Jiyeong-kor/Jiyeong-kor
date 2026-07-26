(() => {
  'use strict';

  const DATA = globalThis.HISTORY_DATA;
  if (!DATA) {
    throw new Error('한국사 학습 데이터를 불러오지 못했습니다.');
  }

  const STORAGE_KEY = 'korean-history-grade1-state-v2';
  const DIFFICULTY_PATTERN = [
    '보통', '어려움', '쉬움', '보통', '쉬움',
    '보통', '보통', '쉬움', '어려움', '어려움',
    '보통', '어려움', '쉬움', '보통', '쉬움',
    '보통', '어려움', '쉬움', '어려움', '보통'
  ];
  const POINTS = { '쉬움': 1, '보통': 2, '어려움': 3 };
  const FACT_MAP = new Map(DATA.facts.map(item => [item.id, item]));
  const ERAS = [...new Set(DATA.facts.map(item => item.era))];
  const CATEGORIES = [...new Set(DATA.facts.map(item => item.category))];

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function random() {
      let value = seed += 0x6D2B79F5;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(items, seedText) {
    const result = [...items];
    const random = mulberry32(hashString(seedText));
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function uniqueBy(items, keySelector) {
    const seen = new Set();
    return items.filter(item => {
      const key = keySelector(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function particle(value, pair) {
    const [withFinal, withoutFinal] = pair.split('/');
    const text = String(value ?? '');
    const last = [...text].reverse().find(character => /[가-힣A-Za-z0-9]/.test(character));
    if (!last) return withoutFinal;
    const code = last.charCodeAt(0);
    const hasFinal = code >= 0xAC00 && code <= 0xD7A3
      ? (code - 0xAC00) % 28 !== 0
      : false;
    return hasFinal ? withFinal : withoutFinal;
  }

  function topic(value) {
    return `${value}${particle(value, '은/는')}`;
  }

  function subject(value) {
    return `${value}${particle(value, '이/가')}`;
  }

  function object(value) {
    return `${value}${particle(value, '을/를')}`;
  }

  function yearLabel(year) {
    if (year < 0) return `기원전 ${Math.abs(year).toLocaleString('ko-KR')}년 무렵`;
    return `${year}년 무렵`;
  }

  function distractorFacts(fact, count, seedText, predicate = () => true) {
    const sameEra = DATA.facts.filter(item => item.id !== fact.id && item.era === fact.era && predicate(item));
    const adjacent = DATA.facts.filter(item => item.id !== fact.id && item.era !== fact.era && predicate(item));
    return uniqueBy(
      [...seededShuffle(sameEra, `${seedText}-same`), ...seededShuffle(adjacent, `${seedText}-all`)],
      item => item.id
    ).slice(0, count);
  }

  function finalizeQuestion(base, optionObjects, seedText) {
    const uniqueOptions = uniqueBy(optionObjects, option => option.text);
    if (uniqueOptions.length !== 5) {
      throw new Error(`선택지 수가 올바르지 않습니다: ${base.id}`);
    }
    const shuffled = seededShuffle(uniqueOptions, `${seedText}-options`);
    const answerIndex = shuffled.findIndex(option => option.correct);
    if (answerIndex < 0 || shuffled.filter(option => option.correct).length !== 1) {
      throw new Error(`정답 수가 올바르지 않습니다: ${base.id}`);
    }
    return {
      ...base,
      options: shuffled.map(option => option.text),
      explanations: shuffled.map(option => option.explanation),
      answerIndex
    };
  }

  function clueToTitle(fact, variant, cycle) {
    const clueIndexes = cycle === 0
      ? [variant % 4, (variant + 1) % 4]
      : [(variant + 2) % 4, (variant + 3) % 4, variant % 4];
    const selectedClues = uniqueBy(clueIndexes.map(index => fact.clues[index]), value => value);
    const distractors = distractorFacts(fact, 4, `clue-title-${fact.id}-${variant}`);
    const options = [
      {
        text: fact.title,
        correct: true,
        explanation: `${topic(fact.title)} 제시된 단서를 모두 충족합니다. ${fact.summary}`
      },
      ...distractors.map(item => ({
        text: item.title,
        correct: false,
        explanation: `${topic(item.title)} ${item.summary}`
      }))
    ];
    return {
      prompt: cycle === 0
        ? '다음 자료가 설명하는 역사적 사실로 가장 적절한 것은?'
        : '다음 단서를 모두 연결할 수 있는 주제로 가장 적절한 것은?',
      stimulus: selectedClues.map(clue => `• ${clue}`).join('\n'),
      type: '자료 추론',
      officialType: '역사 자료의 분석 및 해석',
      options
    };
  }

  function correctClue(fact, variant, cycle) {
    const correctClueText = fact.clues[(variant + cycle) % 4];
    const otherClues = uniqueBy(
      seededShuffle(
        DATA.facts
          .filter(item => item.id !== fact.id)
          .flatMap(item => item.clues.map(clue => ({ clue, fact: item }))),
        `correct-clue-${fact.id}-${variant}`
      ),
      item => item.clue
    ).filter(item => !fact.clues.includes(item.clue)).slice(0, 4);
    const options = [
      {
        text: correctClueText,
        correct: true,
        explanation: `이 설명은 ${fact.title}의 핵심 단서입니다.`
      },
      ...otherClues.map(item => ({
        text: item.clue,
        correct: false,
        explanation: `이 설명은 ${item.fact.title}에 해당합니다.`
      }))
    ];
    return {
      prompt: `${fact.title}에 관한 설명으로 옳은 것은?`,
      stimulus: cycle === 0 ? fact.summary : `시대: ${fact.era} · 주제: ${fact.category}`,
      type: '지식 확인',
      officialType: '역사 지식의 이해',
      options
    };
  }

  function wrongClue(fact, variant, cycle) {
    const outsider = seededShuffle(
      DATA.facts
        .filter(item => item.id !== fact.id)
        .flatMap(item => item.clues.map(clue => ({ clue, fact: item })))
        .filter(item => !fact.clues.includes(item.clue)),
      `wrong-clue-${fact.id}-${variant}`
    )[0];
    const options = [
      ...fact.clues.map(clue => ({
        text: clue,
        correct: false,
        explanation: `이 설명은 ${fact.title}의 핵심 단서이므로 옳습니다.`
      })),
      {
        text: outsider.clue,
        correct: true,
        explanation: `${topic(`“${outsider.clue}”`)} ${outsider.fact.title}의 내용입니다.`
      }
    ];
    return {
      prompt: `${fact.title}에 관한 설명으로 옳지 않은 것은?`,
      stimulus: cycle === 0 ? '네 개의 핵심 단서와 다른 시대·주제의 단서 하나를 구분하세요.' : fact.summary,
      type: '오답 선지 판별',
      officialType: '역사 지식의 이해',
      options
    };
  }

  function eraQuestion(fact, variant, cycle) {
    const distractors = seededShuffle(ERAS.filter(era => era !== fact.era), `era-${fact.id}-${variant}`).slice(0, 4);
    const options = [
      {
        text: fact.era,
        correct: true,
        explanation: `${topic(fact.title)} ${fact.era}에 해당합니다.`
      },
      ...distractors.map(era => ({
        text: era,
        correct: false,
        explanation: `${era}가 아니라 ${fact.era}에 해당합니다.`
      }))
    ];
    return {
      prompt: cycle === 0
        ? '다음 역사적 사실이 속하는 시대는?'
        : '다음 자료를 연대기상 어느 시대에 배치해야 하는가?',
      stimulus: `${fact.title}\n${fact.clues[(variant + 1) % 4]}`,
      type: '시대 판단',
      officialType: '연대기의 파악',
      options
    };
  }

  function chronologyQuestion(fact, variant, cycle) {
    const candidates = uniqueBy(
      [fact, ...seededShuffle(DATA.facts.filter(item => item.id !== fact.id), `chronology-${fact.id}-${variant}`)],
      item => item.year
    ).slice(0, 5);
    if (candidates.length < 5) {
      throw new Error(`연대기 후보가 부족합니다: ${fact.id}`);
    }
    const askLatest = cycle === 1;
    const correct = [...candidates].sort((a, b) => askLatest ? b.year - a.year : a.year - b.year)[0];
    const options = candidates.map(item => ({
      text: item.title,
      correct: item.id === correct.id,
      explanation: `${topic(item.title)} ${yearLabel(item.year)}에 해당합니다.`
    }));
    return {
      prompt: askLatest ? '다음 중 가장 나중에 나타난 역사적 사실은?' : '다음 중 가장 먼저 나타난 역사적 사실은?',
      stimulus: '각 항목의 대표 연도를 기준으로 선후 관계를 판단하세요.',
      type: '연대기 배열',
      officialType: '연대기의 파악',
      options
    };
  }

  function situationQuestion(fact, variant, cycle) {
    const distractors = distractorFacts(fact, 4, `situation-${fact.id}-${variant}`);
    const options = [
      {
        text: fact.title,
        correct: true,
        explanation: `${topic(fact.title)} 제시된 상황과 일치합니다.`
      },
      ...distractors.map(item => ({
        text: item.title,
        correct: false,
        explanation: `${topic(item.title)} ${item.summary}`
      }))
    ];
    return {
      prompt: cycle === 0
        ? '다음 상황과 직접 관련된 역사적 사실은?'
        : '다음 변화가 나타난 배경을 파악할 때 중심에 놓아야 할 주제는?',
      stimulus: fact.summary,
      type: '상황·쟁점 판단',
      officialType: '역사 상황 및 쟁점의 인식',
      options
    };
  }

  function inquiryQuestion(fact, variant, cycle) {
    const correctClues = [
      fact.clues[(variant + cycle) % 4],
      fact.clues[(variant + cycle + 2) % 4]
    ];
    const distractors = distractorFacts(fact, 4, `inquiry-${fact.id}-${variant}`);
    const options = [
      {
        text: `${correctClues[0]} 또한 ${correctClues[1]} 두 자료를 함께 검토한다.`,
        correct: true,
        explanation: `두 자료는 모두 ${fact.title}의 성격을 밝히는 데 직접 관련됩니다.`
      },
      ...distractors.map((item, index) => ({
        text: `${item.clues[index % 4]} 또한 ${item.clues[(index + 1) % 4]} 두 자료를 함께 검토한다.`,
        correct: false,
        explanation: `이 탐구 계획은 ${fact.title}보다 ${item.title}을 조사하는 데 적절합니다.`
      }))
    ];
    return {
      prompt: `${object(fact.title)} 탐구하기 위한 자료 수집 계획으로 가장 적절한 것은?`,
      stimulus: `탐구 주제: ${fact.title}\n탐구 목표: ${fact.summary}`,
      type: '탐구 설계',
      officialType: '역사 탐구의 설계 및 수행',
      options
    };
  }

  function conclusionQuestion(fact, variant, cycle) {
    const clueIndexes = cycle === 0 ? [0, 2] : [1, 3];
    const distractors = distractorFacts(fact, 4, `conclusion-${fact.id}-${variant}`);
    const options = [
      {
        text: fact.summary,
        correct: true,
        explanation: `제시된 단서에서 도출할 수 있는 결론은 ${fact.summary}`
      },
      ...distractors.map(item => ({
        text: item.summary,
        correct: false,
        explanation: `이 결론은 ${item.title}에 해당하므로 제시된 단서와 맞지 않습니다.`
      }))
    ];
    return {
      prompt: '다음 자료를 바탕으로 내릴 수 있는 결론으로 가장 적절한 것은?',
      stimulus: clueIndexes.map(index => `• ${fact.clues[index]}`).join('\n'),
      type: '결론 도출',
      officialType: '결론의 도출 및 평가',
      options
    };
  }

  function sourceQuestion(fact, variant, cycle) {
    const source = DATA.sources[fact.sourceKey];
    const sourceEntries = Object.entries(DATA.sources)
      .filter(([key]) => key !== fact.sourceKey)
      .map(([key, value]) => ({ key, ...value }));
    const distractors = seededShuffle(sourceEntries, `source-${fact.id}-${variant}`).slice(0, 4);
    const options = [
      {
        text: source.name,
        correct: true,
        explanation: `${topic(source.name)} 이 학습 항목의 우선 검증 출처로 연결되어 있습니다.`
      },
      ...distractors.map(item => ({
        text: item.name,
        correct: false,
        explanation: `${topic(item.name)} ${item.description}`
      }))
    ];
    return {
      prompt: cycle === 0
        ? '다음 주제를 공식 자료로 교차 검증할 때 이 학습 항목이 우선 연결하는 포털은?'
        : '다음 자료의 원문과 관련 정보를 추가 조사하기 위한 우선 공식 출처는?',
      stimulus: `${fact.title}\n${fact.summary}`,
      type: '자료 탐색',
      officialType: '역사 탐구의 설계 및 수행',
      options
    };
  }

  function makeQuestion(fact, variant) {
    const template = variant % 10;
    const cycle = Math.floor(variant / 10);
    const id = `${fact.id}-q${String(variant + 1).padStart(2, '0')}`;
    const difficulty = DIFFICULTY_PATTERN[variant];
    const base = {
      id,
      canonicalId: fact.id,
      era: fact.era,
      category: fact.category,
      title: fact.title,
      difficulty,
      points: POINTS[difficulty],
      sourceKey: fact.sourceKey
    };

    let generated;
    switch (template) {
      case 0:
      case 1:
        generated = clueToTitle(fact, variant, cycle);
        break;
      case 2:
        generated = correctClue(fact, variant, cycle);
        break;
      case 3:
        generated = wrongClue(fact, variant, cycle);
        break;
      case 4:
        generated = eraQuestion(fact, variant, cycle);
        break;
      case 5:
      case 6:
        generated = chronologyQuestion(fact, variant, cycle);
        break;
      case 7:
        generated = situationQuestion(fact, variant, cycle);
        break;
      case 8:
        generated = inquiryQuestion(fact, variant, cycle);
        break;
      case 9:
        generated = conclusionQuestion(fact, variant, cycle);
        break;
      default:
        generated = sourceQuestion(fact, variant, cycle);
    }

    return finalizeQuestion(
      { ...base, ...generated, id },
      generated.options,
      `${fact.id}-${variant}`
    );
  }

  function buildQuestionBank() {
    return DATA.facts.flatMap(fact => Array.from({ length: 20 }, (_, variant) => makeQuestion(fact, variant)));
  }

  const QUESTIONS = buildQuestionBank();
  const QUESTION_MAP = new Map(QUESTIONS.map(question => [question.id, question]));

  globalThis.HISTORY_APP_API = {
    buildQuestionBank,
    QUESTIONS,
    FACT_MAP,
    QUESTION_MAP,
    ERAS,
    CATEGORIES,
    yearLabel
  };

  if (typeof document === 'undefined') return;

  const DEFAULT_STATE = {
    version: 2,
    answers: {},
    bookmarks: [],
    theme: 'system',
    activeSession: null,
    lastView: 'home'
  };

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || parsed.version !== 2) return structuredClone(DEFAULT_STATE);
      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        answers: parsed.answers || {},
        bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : []
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  let state = loadState();
  let currentView = 'home';
  let practiceFilters = { era: '전체', category: '전체', difficulty: '전체', count: 10 };
  let learnFilters = { query: '', era: '전체', category: '전체' };
  let reviewMode = 'wrong';
  let timerId = null;

  const elements = {
    main: document.getElementById('mainContent'),
    nav: document.getElementById('primaryNav'),
    themeButton: document.getElementById('themeButton'),
    exportButton: document.getElementById('exportButton'),
    importButton: document.getElementById('importButton'),
    importInput: document.getElementById('importInput'),
    toast: document.getElementById('toast')
  };

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyTheme() {
    if (state.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', state.theme);
    }
    const label = state.theme === 'dark' ? '밝은 화면으로 변경' : state.theme === 'light' ? '시스템 테마 사용' : '어두운 화면으로 변경';
    elements.themeButton.setAttribute('aria-label', label);
  }

  function cycleTheme() {
    state.theme = state.theme === 'system' ? 'dark' : state.theme === 'dark' ? 'light' : 'system';
    saveState();
    applyTheme();
    showToast(state.theme === 'system' ? '시스템 테마를 사용합니다.' : state.theme === 'dark' ? '어두운 화면을 사용합니다.' : '밝은 화면을 사용합니다.');
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => elements.toast.classList.remove('show'), 2400);
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('ko-KR');
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      timeZone: 'Asia/Seoul'
    }).format(new Date(`${value}T00:00:00+09:00`));
  }

  function seoulToday() {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date()).filter(part => part.type !== 'literal').map(part => [part.type, part.value])
    );
    return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+09:00`);
  }

  function nextExamInfo() {
    const today = seoulToday();
    const next = DATA.exams.find(exam => new Date(`${exam.date}T00:00:00+09:00`) >= today) || DATA.exams[DATA.exams.length - 1];
    const target = new Date(`${next.date}T00:00:00+09:00`);
    const days = Math.round((target - today) / 86400000);
    return { ...next, days };
  }

  function answerStats() {
    const records = Object.values(state.answers);
    const answered = records.length;
    const correct = records.filter(record => record.correct).length;
    const wrongIds = Object.entries(state.answers).filter(([, record]) => !record.correct).map(([id]) => id);
    return {
      answered,
      correct,
      wrongIds,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0
    };
  }

  function eraStats() {
    return ERAS.map(era => {
      const ids = QUESTIONS.filter(question => question.era === era).map(question => question.id);
      const answeredRecords = ids.map(id => state.answers[id]).filter(Boolean);
      const correct = answeredRecords.filter(record => record.correct).length;
      return {
        era,
        total: ids.length,
        answered: answeredRecords.length,
        accuracy: answeredRecords.length ? Math.round((correct / answeredRecords.length) * 100) : 0
      };
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function navTo(view) {
    currentView = view;
    state.lastView = view;
    saveState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render();
  }

  function setActiveNav() {
    elements.nav.querySelectorAll('[data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === currentView);
      button.setAttribute('aria-current', button.dataset.view === currentView ? 'page' : 'false');
    });
  }

  function render() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
    setActiveNav();
    if (currentView === 'home') renderHome();
    else if (currentView === 'learn') renderLearn();
    else if (currentView === 'practice') renderPractice();
    else if (currentView === 'mock') renderMock();
    else if (currentView === 'review') renderReview();
    else renderSources();
    elements.main.focus({ preventScroll: true });
  }

  function renderHome() {
    const stats = answerStats();
    const exam = nextExamInfo();
    const eraRows = eraStats();
    const session = state.activeSession;
    elements.main.innerHTML = `
      <section class="hero surface">
        <div class="hero-copy">
          <p class="eyebrow">한국사능력검정시험 심화 · 1급 목표</p>
          <h1>흐름을 이해하고,<br>자료에서 정답을 찾습니다.</h1>
          <p class="hero-description">120개 핵심 개념을 사료·연대기·상황 판단 형태로 반복합니다. 실제로 답한 문항만 학습 기록에 반영합니다.</p>
          <div class="hero-actions">
            <button class="primary-button" data-action="quick-practice">예상 문제 10개 풀기</button>
            <button class="secondary-button" data-view-target="learn">개념부터 보기</button>
          </div>
        </div>
        <aside class="exam-card" aria-label="가장 가까운 시험 일정">
          <span>가장 가까운 시험</span>
          <strong>제${exam.round}회 · D-${Math.max(exam.days, 0)}</strong>
          <p>${formatDate(exam.date)} 10:00</p>
          <small>${exam.note}</small>
        </aside>
      </section>

      ${session && !session.submitted ? `
        <section class="continue-card surface">
          <div>
            <p class="eyebrow">진행 중인 학습</p>
            <h2>${session.kind === 'mock' ? '실전 모의고사' : '예상 문제 풀이'}를 이어서 진행합니다.</h2>
            <p>${session.index + 1} / ${session.ids.length}번 문항까지 이동했습니다.</p>
          </div>
          <button class="primary-button" data-action="continue-session">이어서 풀기</button>
        </section>
      ` : ''}

      <section class="stats-grid" aria-label="학습 통계">
        <article class="stat-card surface"><span>풀이한 고유 문항</span><strong>${formatNumber(stats.answered)}</strong><small>전체 ${formatNumber(QUESTIONS.length)}개</small></article>
        <article class="stat-card surface"><span>현재 정답률</span><strong>${stats.accuracy}%</strong><small>${formatNumber(stats.correct)}개 정답</small></article>
        <article class="stat-card surface"><span>오답 복습 대기</span><strong>${formatNumber(stats.wrongIds.length)}</strong><small>최근 답안 기준</small></article>
        <article class="stat-card surface"><span>저장한 문제</span><strong>${formatNumber(state.bookmarks.length)}</strong><small>북마크</small></article>
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div><p class="eyebrow">시대별 기록</p><h2>실제 풀이 범위를 확인합니다.</h2></div>
          <button class="text-button" data-view-target="review">오답과 저장 문제 보기</button>
        </div>
        <div class="era-progress surface">
          ${eraRows.map(row => `
            <div class="era-row">
              <div><strong>${row.era}</strong><span>${formatNumber(row.answered)}문항 풀이 · 정답률 ${row.accuracy}%</span></div>
              <div class="progress-track" aria-label="${row.era} 풀이 비율"><span style="width:${Math.min(100, (row.answered / row.total) * 100)}%"></span></div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="feature-grid">
        <article class="feature-card surface"><span class="feature-number">01</span><h3>개념과 단서를 먼저 확인합니다.</h3><p>새로운 용어를 문제에서 갑자기 제시하지 않습니다. 시대·인물·제도와 네 개의 핵심 단서를 먼저 볼 수 있습니다.</p></article>
        <article class="feature-card surface"><span class="feature-number">02</span><h3>오답 선지까지 분해합니다.</h3><p>정답 이유뿐 아니라 나머지 선택지가 어느 사건과 제도에 해당하는지 설명합니다.</p></article>
        <article class="feature-card surface"><span class="feature-number">03</span><h3>실전 배점을 그대로 계산합니다.</h3><p>50문항·80분·100점 모의고사에서 80점 이상을 1급으로 판정합니다.</p></article>
      </section>
    `;
  }

  function renderLearn() {
    const query = learnFilters.query.trim().toLowerCase();
    const filtered = DATA.facts.filter(fact => {
      const matchesQuery = !query || [fact.title, fact.summary, ...fact.clues].join(' ').toLowerCase().includes(query);
      const matchesEra = learnFilters.era === '전체' || fact.era === learnFilters.era;
      const matchesCategory = learnFilters.category === '전체' || fact.category === learnFilters.category;
      return matchesQuery && matchesEra && matchesCategory;
    });

    elements.main.innerHTML = `
      <section class="page-header">
        <p class="eyebrow">개념 학습</p>
        <h1>문제에 쓰이는 핵심 단서를 먼저 익힙니다.</h1>
        <p>개념을 읽은 것만으로는 진도가 올라가지 않습니다. 연결된 문제에 답하면 풀이 기록이 반영됩니다.</p>
      </section>
      <section class="filter-bar surface" aria-label="개념 필터">
        <label class="search-field"><span>검색</span><input id="learnQuery" type="search" value="${escapeHtml(learnFilters.query)}" placeholder="예: 대동법, 청해진, 광무개혁"></label>
        <label><span>시대</span><select id="learnEra">${['전체', ...ERAS].map(value => `<option ${value === learnFilters.era ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
        <label><span>주제</span><select id="learnCategory">${['전체', ...CATEGORIES].map(value => `<option ${value === learnFilters.category ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      </section>
      <div class="result-count">${formatNumber(filtered.length)}개 개념</div>
      <section class="concept-grid">
        ${filtered.map(fact => {
          const answered = QUESTIONS.filter(question => question.canonicalId === fact.id && state.answers[question.id]).length;
          return `
            <article class="concept-card surface">
              <div class="concept-meta"><span>${fact.era}</span><span>${fact.category}</span></div>
              <h2>${fact.title}</h2>
              <p>${fact.summary}</p>
              <details>
                <summary>핵심 단서 4개 보기</summary>
                <ul>${fact.clues.map(clue => `<li>${clue}</li>`).join('')}</ul>
              </details>
              <div class="concept-footer">
                <span>연결 문제 ${answered} / 20개 풀이</span>
                <button class="secondary-button small" data-action="practice-concept" data-fact-id="${fact.id}">이 개념 문제 풀기</button>
              </div>
            </article>
          `;
        }).join('')}
      </section>
    `;
  }

  function renderPractice() {
    if (state.activeSession?.kind === 'practice' && !state.activeSession.submitted) {
      renderPracticeSession();
      return;
    }
    const filteredCount = filterQuestions(practiceFilters).length;
    elements.main.innerHTML = `
      <section class="page-header">
        <p class="eyebrow">예상 문제</p>
        <h1>필요한 범위만 골라 반복합니다.</h1>
        <p>각 문항에 답하는 즉시 핵심 단서와 다섯 선택지의 해설을 확인합니다.</p>
      </section>
      <section class="practice-builder surface">
        <div class="builder-grid">
          <label><span>시대</span><select id="practiceEra">${['전체', ...ERAS].map(value => `<option ${value === practiceFilters.era ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>주제</span><select id="practiceCategory">${['전체', ...CATEGORIES].map(value => `<option ${value === practiceFilters.category ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>난도</span><select id="practiceDifficulty">${['전체', '쉬움', '보통', '어려움'].map(value => `<option ${value === practiceFilters.difficulty ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>문항 수</span><select id="practiceCount">${[5, 10, 20, 50].map(value => `<option value="${value}" ${value === Number(practiceFilters.count) ? 'selected' : ''}>${value}문항</option>`).join('')}</select></label>
        </div>
        <div class="builder-summary">
          <div><strong>${formatNumber(filteredCount)}</strong><span>개 문항에서 출제할 수 있습니다.</span></div>
          <button class="primary-button" data-action="start-practice" ${filteredCount ? '' : 'disabled'}>문제 시작</button>
        </div>
      </section>
      <section class="info-panel surface">
        <h2>문항 구성</h2>
        <div class="tag-list">
          ${DATA.officialTypes.map(type => `<span>${type}</span>`).join('')}
        </div>
        <p>120개 핵심 개념마다 20개의 결정적 문항 변형을 제공합니다. 같은 문항 ID는 항상 같은 선택지와 정답을 유지합니다.</p>
      </section>
    `;
  }

  function filterQuestions(filters) {
    return QUESTIONS.filter(question => {
      const eraMatch = filters.era === '전체' || question.era === filters.era;
      const categoryMatch = filters.category === '전체' || question.category === filters.category;
      const difficultyMatch = filters.difficulty === '전체' || question.difficulty === filters.difficulty;
      return eraMatch && categoryMatch && difficultyMatch;
    });
  }

  function startPractice(questionIds = null) {
    const pool = questionIds
      ? questionIds.map(id => QUESTION_MAP.get(id)).filter(Boolean)
      : filterQuestions(practiceFilters);
    const count = questionIds ? Math.min(questionIds.length, 20) : Math.min(Number(practiceFilters.count), pool.length);
    const ids = seededShuffle(pool, `practice-${Date.now()}`).slice(0, count).map(question => question.id);
    if (!ids.length) {
      showToast('선택한 조건에 맞는 문항이 없습니다.');
      return;
    }
    state.activeSession = {
      kind: 'practice',
      ids,
      index: 0,
      selected: {},
      submitted: false,
      startedAt: new Date().toISOString()
    };
    saveState();
    currentView = 'practice';
    render();
  }

  function recordAnswer(question, selectedIndex) {
    const correct = selectedIndex === question.answerIndex;
    const previous = state.answers[question.id];
    state.answers[question.id] = {
      selectedIndex,
      correct,
      attempts: (previous?.attempts || 0) + 1,
      answeredAt: new Date().toISOString()
    };
    saveState();
    return correct;
  }

  function renderPracticeSession() {
    const session = state.activeSession;
    const question = QUESTION_MAP.get(session.ids[session.index]);
    if (!question) {
      state.activeSession = null;
      saveState();
      renderPractice();
      return;
    }
    const selectedIndex = session.selected[question.id];
    const answered = Number.isInteger(selectedIndex);
    const isBookmarked = state.bookmarks.includes(question.id);
    elements.main.innerHTML = `
      <section class="session-header surface">
        <div><p class="eyebrow">예상 문제</p><h1>${session.index + 1} / ${session.ids.length}</h1></div>
        <div class="session-actions">
          <button class="icon-text-button ${isBookmarked ? 'active' : ''}" data-action="bookmark" data-question-id="${question.id}" aria-pressed="${isBookmarked}">☆ 저장</button>
          <button class="text-button danger" data-action="end-session">풀이 종료</button>
        </div>
        <div class="session-progress"><span style="width:${((session.index + 1) / session.ids.length) * 100}%"></span></div>
      </section>
      ${questionCard(question, selectedIndex, true)}
      <div class="session-footer">
        <button class="secondary-button" data-action="previous-question" ${session.index === 0 ? 'disabled' : ''}>이전</button>
        <button class="primary-button" data-action="next-question" ${answered ? '' : 'disabled'}>${session.index === session.ids.length - 1 ? '결과 보기' : '다음 문제'}</button>
      </div>
    `;
  }

  function questionCard(question, selectedIndex, immediateFeedback) {
    const answered = Number.isInteger(selectedIndex);
    const correct = answered && selectedIndex === question.answerIndex;
    return `
      <article class="question-card surface">
        <div class="question-meta">
          <span>${question.era}</span><span>${question.category}</span><span>${question.difficulty} · ${question.points}점</span><span>${question.officialType}</span>
        </div>
        <h2>${question.prompt}</h2>
        ${question.stimulus ? `<div class="stimulus">${escapeHtml(question.stimulus).replaceAll('\n', '<br>')}</div>` : ''}
        <div class="option-list" role="radiogroup" aria-label="선택지">
          ${question.options.map((option, index) => {
            const selected = selectedIndex === index;
            const classNames = ['option-button'];
            if (answered && immediateFeedback) {
              if (index === question.answerIndex) classNames.push('correct');
              else if (selected) classNames.push('wrong');
            } else if (selected) {
              classNames.push('selected');
            }
            return `<button class="${classNames.join(' ')}" data-action="select-option" data-index="${index}" ${answered && immediateFeedback ? 'disabled' : ''} aria-pressed="${selected}"><span>${index + 1}</span><strong>${option}</strong></button>`;
          }).join('')}
        </div>
        ${answered && immediateFeedback ? `
          <section class="feedback ${correct ? 'correct' : 'wrong'}">
            <h3>${correct ? '정답입니다.' : `정답은 ${question.answerIndex + 1}번입니다.`}</h3>
            <p>${question.explanations[question.answerIndex]}</p>
            <details>
              <summary>다섯 선택지 해설 보기</summary>
              <ol>${question.explanations.map((text, index) => `<li class="${index === question.answerIndex ? 'answer' : ''}"><strong>${index + 1}. ${question.options[index]}</strong><p>${text}</p></li>`).join('')}</ol>
            </details>
            <a class="source-link" href="${DATA.sources[question.sourceKey].url}" target="_blank" rel="noreferrer">공식 근거 포털: ${DATA.sources[question.sourceKey].name}</a>
          </section>
        ` : ''}
      </article>
    `;
  }

  function endPractice() {
    const session = state.activeSession;
    const answeredIds = session.ids.filter(id => Number.isInteger(session.selected[id]));
    const correct = answeredIds.filter(id => session.selected[id] === QUESTION_MAP.get(id).answerIndex).length;
    session.submitted = true;
    session.result = { answered: answeredIds.length, correct };
    saveState();
    elements.main.innerHTML = `
      <section class="result-hero surface">
        <p class="eyebrow">예상 문제 결과</p>
        <h1>${correct} / ${session.ids.length}개 정답</h1>
        <p>미응답 문항은 풀이 기록에 포함하지 않았습니다.</p>
        <div class="result-actions">
          <button class="primary-button" data-action="retry-wrong-session">이번 오답 다시 풀기</button>
          <button class="secondary-button" data-action="new-practice">새 문제 구성</button>
        </div>
      </section>
      <section class="result-list surface">
        ${session.ids.map((id, index) => {
          const question = QUESTION_MAP.get(id);
          const selected = session.selected[id];
          const status = !Number.isInteger(selected) ? '미응답' : selected === question.answerIndex ? '정답' : '오답';
          return `<button data-action="review-result-question" data-question-id="${id}"><span>${index + 1}</span><strong>${question.title}</strong><em class="${status}">${status}</em></button>`;
        }).join('')}
      </section>
    `;
  }

  function renderMock() {
    if (state.activeSession?.kind === 'mock') {
      if (state.activeSession.submitted) {
        renderMockResult();
      } else {
        renderMockSession();
      }
      return;
    }
    elements.main.innerHTML = `
      <section class="page-header">
        <p class="eyebrow">실전 모의고사</p>
        <h1>50문항을 80분 안에 풉니다.</h1>
        <p>쉬움 10문항·보통 30문항·어려움 10문항을 1점·2점·3점으로 계산합니다.</p>
      </section>
      <section class="mock-guide surface">
        <div class="mock-score-scale">
          <div><strong>80점 이상</strong><span>1급</span></div>
          <div><strong>70점 이상</strong><span>2급</span></div>
          <div><strong>60점 이상</strong><span>3급</span></div>
        </div>
        <ul>
          <li>시험 중에는 정답과 해설을 표시하지 않습니다.</li>
          <li>문제 번호를 눌러 자유롭게 이동할 수 있습니다.</li>
          <li>시간이 끝나면 현재 답안으로 자동 제출합니다.</li>
          <li>답하지 않은 문제는 0점이며 학습 진도에는 포함하지 않습니다.</li>
        </ul>
        <button class="primary-button large" data-action="start-mock">모의고사 시작</button>
      </section>
    `;
  }

  function startMock() {
    const seed = `mock-${Date.now()}`;
    const easy = seededShuffle(QUESTIONS.filter(question => question.difficulty === '쉬움'), `${seed}-easy`).slice(0, 10);
    const normal = seededShuffle(QUESTIONS.filter(question => question.difficulty === '보통'), `${seed}-normal`).slice(0, 30);
    const hard = seededShuffle(QUESTIONS.filter(question => question.difficulty === '어려움'), `${seed}-hard`).slice(0, 10);
    const selected = seededShuffle([...easy, ...normal, ...hard], `${seed}-all`);
    state.activeSession = {
      kind: 'mock',
      ids: selected.map(question => question.id),
      index: 0,
      selected: {},
      flagged: [],
      submitted: false,
      startedAt: new Date().toISOString(),
      expiresAt: Date.now() + 80 * 60 * 1000
    };
    saveState();
    render();
  }

  function remainingTime(session) {
    return Math.max(0, session.expiresAt - Date.now());
  }

  function timeText(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function renderMockSession() {
    const session = state.activeSession;
    if (remainingTime(session) <= 0) {
      submitMock();
      return;
    }
    const question = QUESTION_MAP.get(session.ids[session.index]);
    const selectedIndex = session.selected[question.id];
    const flagged = session.flagged.includes(question.id);
    elements.main.innerHTML = `
      <section class="mock-layout">
        <div class="mock-main">
          <section class="session-header surface">
            <div><p class="eyebrow">실전 모의고사</p><h1>${session.index + 1} / 50</h1></div>
            <div class="mock-clock"><span>남은 시간</span><strong id="mockTimer">${timeText(remainingTime(session))}</strong></div>
            <div class="session-progress"><span style="width:${((session.index + 1) / 50) * 100}%"></span></div>
          </section>
          ${questionCard(question, selectedIndex, false)}
          <div class="session-footer">
            <button class="secondary-button" data-action="mock-previous" ${session.index === 0 ? 'disabled' : ''}>이전</button>
            <button class="icon-text-button ${flagged ? 'active' : ''}" data-action="toggle-flag" data-question-id="${question.id}">⚑ 다시 보기</button>
            <button class="primary-button" data-action="mock-next">${session.index === 49 ? '답안 확인' : '다음'}</button>
          </div>
        </div>
        <aside class="question-navigator surface">
          <div><strong>문제 이동</strong><span>${Object.keys(session.selected).length} / 50 응답</span></div>
          <div class="number-grid">
            ${session.ids.map((id, index) => `<button class="${index === session.index ? 'current' : ''} ${Number.isInteger(session.selected[id]) ? 'answered' : ''} ${session.flagged.includes(id) ? 'flagged' : ''}" data-action="mock-go" data-index="${index}">${index + 1}</button>`).join('')}
          </div>
          <button class="danger-outline-button" data-action="submit-mock">모의고사 제출</button>
        </aside>
      </section>
    `;
    timerId = window.setInterval(() => {
      const timer = document.getElementById('mockTimer');
      if (!timer) return;
      const remaining = remainingTime(session);
      timer.textContent = timeText(remaining);
      if (remaining <= 0) {
        window.clearInterval(timerId);
        submitMock();
      }
    }, 1000);
  }

  function submitMock() {
    const session = state.activeSession;
    let score = 0;
    let correctCount = 0;
    let answeredCount = 0;
    session.ids.forEach(id => {
      const question = QUESTION_MAP.get(id);
      const selectedIndex = session.selected[id];
      if (!Number.isInteger(selectedIndex)) return;
      answeredCount += 1;
      const correct = recordAnswer(question, selectedIndex);
      if (correct) {
        correctCount += 1;
        score += question.points;
      }
    });
    const grade = score >= 80 ? '1급' : score >= 70 ? '2급' : score >= 60 ? '3급' : '불합격';
    session.submitted = true;
    session.result = { score, correctCount, answeredCount, grade, submittedAt: new Date().toISOString() };
    saveState();
    renderMockResult();
  }

  function renderMockResult() {
    const session = state.activeSession;
    const result = session.result;
    const byDifficulty = ['쉬움', '보통', '어려움'].map(difficulty => {
      const ids = session.ids.filter(id => QUESTION_MAP.get(id).difficulty === difficulty);
      const answered = ids.filter(id => Number.isInteger(session.selected[id]));
      const correct = answered.filter(id => session.selected[id] === QUESTION_MAP.get(id).answerIndex).length;
      return { difficulty, total: ids.length, answered: answered.length, correct };
    });
    elements.main.innerHTML = `
      <section class="result-hero surface ${result.grade === '1급' ? 'passed' : ''}">
        <p class="eyebrow">실전 모의고사 결과</p>
        <h1>${result.score}점 · ${result.grade}</h1>
        <p>${result.answeredCount}문항 응답 · ${result.correctCount}문항 정답</p>
        <div class="score-bar"><span style="width:${result.score}%"></span><i style="left:80%">1급 80점</i></div>
        <div class="result-actions">
          <button class="primary-button" data-action="mock-wrong-review">오답만 다시 풀기</button>
          <button class="secondary-button" data-action="new-mock">새 모의고사</button>
        </div>
      </section>
      <section class="difficulty-result-grid">
        ${byDifficulty.map(item => `<article class="surface"><span>${item.difficulty}</span><strong>${item.correct} / ${item.total}</strong><small>${POINTS[item.difficulty]}점 문항</small></article>`).join('')}
      </section>
      <section class="result-list surface">
        ${session.ids.map((id, index) => {
          const question = QUESTION_MAP.get(id);
          const selected = session.selected[id];
          const status = !Number.isInteger(selected) ? '미응답' : selected === question.answerIndex ? '정답' : '오답';
          return `<button data-action="review-result-question" data-question-id="${id}"><span>${index + 1}</span><strong>${question.title}</strong><em class="${status}">${status}</em></button>`;
        }).join('')}
      </section>
    `;
  }

  function renderReview() {
    const stats = answerStats();
    const ids = reviewMode === 'wrong'
      ? stats.wrongIds
      : state.bookmarks.filter(id => QUESTION_MAP.has(id));
    elements.main.innerHTML = `
      <section class="page-header">
        <p class="eyebrow">복습</p>
        <h1>틀린 문제와 저장한 문제를 다시 봅니다.</h1>
        <p>정답으로 바뀐 문제는 오답 목록에서 자동으로 빠집니다.</p>
      </section>
      <div class="segmented-control" role="tablist">
        <button class="${reviewMode === 'wrong' ? 'active' : ''}" data-action="review-tab" data-mode="wrong">오답 ${stats.wrongIds.length}</button>
        <button class="${reviewMode === 'bookmark' ? 'active' : ''}" data-action="review-tab" data-mode="bookmark">저장 ${state.bookmarks.length}</button>
      </div>
      ${ids.length ? `
        <section class="review-toolbar surface">
          <span>${formatNumber(ids.length)}개 문항</span>
          <button class="primary-button" data-action="start-review-set">최대 20개 다시 풀기</button>
        </section>
        <section class="review-list surface">
          ${ids.map(id => {
            const question = QUESTION_MAP.get(id);
            return `<article><div><span>${question.era} · ${question.difficulty}</span><strong>${question.title}</strong><p>${question.prompt}</p></div><div><button class="text-button" data-action="single-review" data-question-id="${id}">다시 풀기</button>${reviewMode === 'bookmark' ? `<button class="icon-button" data-action="bookmark" data-question-id="${id}" aria-label="저장 해제">×</button>` : ''}</div></article>`;
          }).join('')}
        </section>
      ` : `<section class="empty-state surface"><strong>${reviewMode === 'wrong' ? '현재 오답이 없습니다.' : '저장한 문제가 없습니다.'}</strong><p>문제를 실제로 푼 뒤 이 화면에서 다시 확인할 수 있습니다.</p><button class="primary-button" data-view-target="practice">예상 문제로 이동</button></section>`}
    `;
  }

  function renderSources() {
    const exam = nextExamInfo();
    elements.main.innerHTML = `
      <section class="page-header">
        <p class="eyebrow">시험 기준과 출처</p>
        <h1>공식 시험 정보와 공공기관 자료를 우선합니다.</h1>
        <p>시험 일정과 요강은 한국사능력검정시험 공식 홈페이지를 최종 기준으로 확인해야 합니다.</p>
      </section>
      <section class="exam-schedule surface">
        <div class="section-heading"><div><p class="eyebrow">2026년 일정</p><h2>가장 가까운 시험은 제${exam.round}회입니다.</h2></div><a class="primary-link" href="${DATA.sources.exam.url}" target="_blank" rel="noreferrer">공식 일정 확인</a></div>
        <div class="schedule-table" role="table">
          ${DATA.exams.map(item => `<div role="row"><strong role="cell">제${item.round}회</strong><span role="cell">${formatDate(item.date)}</span><span role="cell">${item.note}</span><span role="cell">발표 ${item.result}</span></div>`).join('')}
        </div>
      </section>
      <section class="section-block">
        <div class="section-heading"><div><p class="eyebrow">공식 평가 방향</p><h2>여섯 가지 능력을 교차해 묻습니다.</h2></div></div>
        <div class="type-grid">${DATA.officialTypes.map((type, index) => `<article class="surface"><span>${String(index + 1).padStart(2, '0')}</span><strong>${type}</strong></article>`).join('')}</div>
      </section>
      <section class="source-grid">
        ${Object.values(DATA.sources).map(source => `<a class="source-card surface" href="${source.url}" target="_blank" rel="noreferrer"><span>공식 자료</span><h2>${source.name}</h2><p>${source.description}</p><strong>새 창에서 확인 ↗</strong></a>`).join('')}
      </section>
      <section class="policy-card surface">
        <h2>자료 사용 원칙</h2>
        <p>최태성 선생님의 공개 강의와 공개된 교재 소개에서 큰 흐름 정리, 핵심 단서 반복, 능동 회상 구조를 참고했습니다. 강의·교재의 문장, 판서, 문제와 이미지는 복제하지 않았습니다.</p>
        <p>이 사이트는 국사편찬위원회, 최태성 선생님 또는 이투스와 제휴한 서비스가 아닙니다. 예상 문제는 공식 기출문제 그 자체가 아니며, 시험 일정과 규정은 공식 홈페이지에서 다시 확인해야 합니다.</p>
        <p>학습 기록은 이 브라우저에만 저장됩니다. 서버로 답안이나 개인정보를 전송하지 않습니다.</p>
      </section>
    `;
  }

  function exportProgress() {
    const payload = {
      schema: 'korean-history-grade1-progress',
      version: 2,
      exportedAt: new Date().toISOString(),
      dataVersion: DATA.version,
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `한능검_1급_학습기록_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importProgress(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.schema !== 'korean-history-grade1-progress' || parsed.version !== 2 || !parsed.state) {
        throw new Error('지원하지 않는 학습 기록 형식입니다.');
      }
      state = {
        ...structuredClone(DEFAULT_STATE),
        ...parsed.state,
        answers: parsed.state.answers || {},
        bookmarks: Array.isArray(parsed.state.bookmarks) ? parsed.state.bookmarks : []
      };
      saveState();
      applyTheme();
      render();
      showToast('학습 기록을 불러왔습니다.');
    } catch (error) {
      showToast(error.message || '학습 기록을 불러오지 못했습니다.');
    } finally {
      elements.importInput.value = '';
    }
  }

  function showQuestionReview(questionId) {
    const question = QUESTION_MAP.get(questionId);
    if (!question) return;
    const record = state.answers[questionId];
    const selectedIndex = Number.isInteger(record?.selectedIndex) ? record.selectedIndex : question.answerIndex;
    elements.main.innerHTML = `
      <div class="back-row"><button class="text-button" data-action="back-to-review">← 목록으로</button></div>
      ${questionCard(question, selectedIndex, true)}
      <div class="session-footer"><button class="primary-button" data-action="single-review" data-question-id="${questionId}">이 문제 다시 풀기</button></div>
    `;
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('button, [data-view-target]');
    if (!target) return;

    if (target.dataset.view) {
      navTo(target.dataset.view);
      return;
    }
    if (target.dataset.viewTarget) {
      navTo(target.dataset.viewTarget);
      return;
    }

    const action = target.dataset.action;
    if (!action) return;

    if (action === 'quick-practice') {
      practiceFilters = { era: '전체', category: '전체', difficulty: '전체', count: 10 };
      startPractice();
    } else if (action === 'continue-session') {
      currentView = state.activeSession.kind === 'mock' ? 'mock' : 'practice';
      render();
    } else if (action === 'practice-concept') {
      const ids = QUESTIONS.filter(question => question.canonicalId === target.dataset.factId).map(question => question.id);
      startPractice(ids);
    } else if (action === 'start-practice') {
      startPractice();
    } else if (action === 'select-option') {
      const session = state.activeSession;
      const question = QUESTION_MAP.get(session.ids[session.index]);
      const index = Number(target.dataset.index);
      session.selected[question.id] = index;
      if (session.kind === 'practice') recordAnswer(question, index);
      saveState();
      if (session.kind === 'practice') renderPracticeSession();
      else renderMockSession();
    } else if (action === 'bookmark') {
      const id = target.dataset.questionId;
      state.bookmarks = state.bookmarks.includes(id)
        ? state.bookmarks.filter(item => item !== id)
        : [...state.bookmarks, id];
      saveState();
      render();
    } else if (action === 'previous-question') {
      state.activeSession.index = Math.max(0, state.activeSession.index - 1);
      saveState();
      renderPracticeSession();
    } else if (action === 'next-question') {
      const session = state.activeSession;
      if (session.index === session.ids.length - 1) endPractice();
      else {
        session.index += 1;
        saveState();
        renderPracticeSession();
      }
    } else if (action === 'end-session') {
      endPractice();
    } else if (action === 'retry-wrong-session') {
      const session = state.activeSession;
      const ids = session.ids.filter(id => session.selected[id] !== QUESTION_MAP.get(id).answerIndex);
      state.activeSession = null;
      saveState();
      if (ids.length) startPractice(ids);
      else showToast('이번 풀이에는 오답이 없습니다.');
    } else if (action === 'new-practice') {
      state.activeSession = null;
      saveState();
      renderPractice();
    } else if (action === 'start-mock') {
      startMock();
    } else if (action === 'mock-previous') {
      state.activeSession.index = Math.max(0, state.activeSession.index - 1);
      saveState();
      renderMockSession();
    } else if (action === 'mock-next') {
      state.activeSession.index = Math.min(49, state.activeSession.index + 1);
      saveState();
      renderMockSession();
    } else if (action === 'mock-go') {
      state.activeSession.index = Number(target.dataset.index);
      saveState();
      renderMockSession();
    } else if (action === 'toggle-flag') {
      const id = target.dataset.questionId;
      state.activeSession.flagged = state.activeSession.flagged.includes(id)
        ? state.activeSession.flagged.filter(item => item !== id)
        : [...state.activeSession.flagged, id];
      saveState();
      renderMockSession();
    } else if (action === 'submit-mock') {
      const unanswered = 50 - Object.keys(state.activeSession.selected).length;
      if (!unanswered || window.confirm(`미응답 ${unanswered}문항이 있습니다. 현재 답안으로 제출하시겠습니까?`)) submitMock();
    } else if (action === 'mock-wrong-review') {
      const session = state.activeSession;
      const ids = session.ids.filter(id => session.selected[id] !== QUESTION_MAP.get(id).answerIndex);
      state.activeSession = null;
      saveState();
      startPractice(ids);
    } else if (action === 'new-mock') {
      state.activeSession = null;
      saveState();
      renderMock();
    } else if (action === 'review-tab') {
      reviewMode = target.dataset.mode;
      renderReview();
    } else if (action === 'start-review-set') {
      const ids = reviewMode === 'wrong' ? answerStats().wrongIds : state.bookmarks;
      startPractice(ids);
    } else if (action === 'single-review') {
      state.activeSession = null;
      saveState();
      startPractice([target.dataset.questionId]);
    } else if (action === 'review-result-question') {
      showQuestionReview(target.dataset.questionId);
    } else if (action === 'back-to-review') {
      renderReview();
    }
  });

  document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'learnEra') {
      learnFilters.era = target.value;
      renderLearn();
    } else if (target.id === 'learnCategory') {
      learnFilters.category = target.value;
      renderLearn();
    } else if (target.id === 'practiceEra') {
      practiceFilters.era = target.value;
      renderPractice();
    } else if (target.id === 'practiceCategory') {
      practiceFilters.category = target.value;
      renderPractice();
    } else if (target.id === 'practiceDifficulty') {
      practiceFilters.difficulty = target.value;
      renderPractice();
    } else if (target.id === 'practiceCount') {
      practiceFilters.count = Number(target.value);
      renderPractice();
    }
  });

  document.addEventListener('input', event => {
    if (event.target.id !== 'learnQuery') return;
    learnFilters.query = event.target.value;
    window.clearTimeout(renderLearn.searchTimeout);
    renderLearn.searchTimeout = window.setTimeout(renderLearn, 180);
  });

  elements.nav.addEventListener('click', event => {
    const button = event.target.closest('[data-view]');
    if (button) navTo(button.dataset.view);
  });
  elements.themeButton.addEventListener('click', cycleTheme);
  elements.exportButton.addEventListener('click', exportProgress);
  elements.importButton.addEventListener('click', () => elements.importInput.click());
  elements.importInput.addEventListener('change', event => {
    const [file] = event.target.files;
    if (file) importProgress(file);
  });

  applyTheme();
  if (state.activeSession && !state.activeSession.submitted) {
    currentView = state.activeSession.kind === 'mock' ? 'mock' : 'practice';
  }
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
