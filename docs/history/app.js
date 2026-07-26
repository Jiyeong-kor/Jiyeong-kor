(() => {
  'use strict';

  const DATA = globalThis.HISTORY_DATA;
  if (!DATA) {
    throw new Error('한국사 학습 데이터를 불러오지 못했습니다.');
  }

  const STORAGE_KEY = 'korean-history-grade1-state-v3';
  const POINTS = { '쉬움': 1, '보통': 2, '어려움': 3 };
  const DIFFICULTY_PATTERN = [
    '쉬움', '보통', '쉬움', '보통', '쉬움',
    '보통', '어려움', '어려움', '어려움', '보통',
    '보통', '보통', '보통', '어려움', '보통',
    '보통', '어려움', '보통', '어려움', '보통'
  ];
  const CORE_LABEL = DATA.qualityPolicy?.coreQuestionLabel || '핵심 문항';
  const REPEAT_LABEL = DATA.qualityPolicy?.repeatQuestionLabel || '심화 반복';
  const FACT_MAP = new Map(DATA.facts.map(item => [item.id, item]));
  const ERAS = [...new Set(DATA.facts.map(item => item.era))];
  const CATEGORIES = [...new Set(DATA.facts.map(item => item.category))];
  const QUESTION_TYPES = ['자료 추론', '지식 확인', '오답 선지 판별', '시대 판단', '연결 판단', '탐구 설계', '결론 도출', '연대기 배열', '시대 비교'];
  const LESSON_MAP = new Map(DATA.lessons.map(lesson => [lesson.number, lesson]));
  const CONFUSION_SETS = DATA.confusionSets.map(ids => ids.map(id => FACT_MAP.get(id)).filter(Boolean));
  const CHRONOLOGY_SETS = DATA.chronologySets.map(ids => ids.map(id => FACT_MAP.get(id)).filter(Boolean));
  const FACT_INDEX = new Map(DATA.facts.map((item, index) => [item.id, index]));

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

  function coordinate(value) {
    return `${value}${particle(value, '과/와')}`;
  }

  function yearLabel(year) {
    if (year < 0) return `기원전 ${Math.abs(year).toLocaleString('ko-KR')}년 무렵`;
    return `${year}년 무렵`;
  }

  function lessonFor(fact) {
    return LESSON_MAP.get(fact.lesson) || { number: fact.lesson, title: '통합 학습' };
  }

  function relatedFacts(fact, count, seedText) {
    const inSets = CONFUSION_SETS
      .filter(set => set.some(item => item.id === fact.id))
      .flat()
      .filter(item => item.id !== fact.id && item.era === fact.era);
    const sameLesson = DATA.facts.filter(item => item.id !== fact.id && item.lesson === fact.lesson && item.era === fact.era);
    const sameEraCategory = DATA.facts.filter(item => item.id !== fact.id && item.era === fact.era && item.category === fact.category);
    const sameEra = DATA.facts.filter(item => item.id !== fact.id && item.era === fact.era);
    const pool = uniqueBy([
      ...inSets,
      ...sameLesson,
      ...sameEraCategory,
      ...sameEra
    ], item => item.id);
    const ranked = pool
      .map(item => ({
        item,
        score:
          (item.lesson === fact.lesson ? 0 : 500) +
          (item.category === fact.category ? 0 : 120) +
          Math.abs((item.lesson || 0) - (fact.lesson || 0)) * 15 +
          Math.abs((FACT_INDEX.get(item.id) || 0) - (FACT_INDEX.get(fact.id) || 0))
      }))
      .sort((a, b) => a.score - b.score || a.item.title.localeCompare(b.item.title, 'ko'));
    const shortlist = ranked.slice(0, Math.max(count * 2, count)).map(entry => entry.item);
    const selected = seededShuffle(shortlist, seedText).slice(0, count);
    if (selected.length !== count) {
      throw new Error(`${fact.id}의 같은 시대 혼동 개념이 부족합니다.`);
    }
    return selected;
  }

  function usableClues(fact) {
    const clean = fact.clues.filter(clue => !clue.includes(fact.title));
    return clean.length >= 2 ? clean : fact.clues;
  }

  const TOKEN_STOPWORDS = new Set([
    '해당합니다', '했습니다', '되었습니다', '있었습니다', '추진했습니다', '실시했습니다',
    '설치했습니다', '운영했습니다', '정비했습니다', '강화했습니다', '확대되었습니다',
    '중심으로', '통해', '위해', '대한', '관련', '제도', '정책', '국가', '사회', '지역',
    '관리', '왕권', '활동', '운동', '과정', '시대', '사용했습니다'
  ]);

  function textTokens(value) {
    return new Set(
      (String(value).match(/[가-힣A-Za-z0-9·]+/g) || [])
        .map(token => token.replace(/(했습니다|되었습니다|입니다|였습니다|하였다|했다|되었다|하였다)$/u, ''))
        .filter(token => token.length >= 2 && !TOKEN_STOPWORDS.has(token))
    );
  }

  function tokenOverlap(left, right) {
    const leftTokens = textTokens(left);
    const rightTokens = textTokens(right);
    if (!leftTokens.size || !rightTokens.size) return 0;
    let common = 0;
    for (const token of leftTokens) if (rightTokens.has(token)) common += 1;
    return common / Math.min(leftTokens.size, rightTokens.size);
  }

  function factText(fact) {
    return [fact.title, fact.summary, ...fact.clues].join(' ');
  }

  function distinctiveClue(sourceFact, againstFact, seedText) {
    const ranked = usableClues(sourceFact)
      .map((clue, index) => ({ clue, index, overlap: tokenOverlap(clue, factText(againstFact)) }))
      .sort((a, b) => a.overlap - b.overlap || a.index - b.index);
    const bestScore = ranked[0]?.overlap ?? 0;
    const shortlist = ranked.filter(item => item.overlap <= Math.min(0.34, bestScore + 0.08));
    return seededShuffle(shortlist.length ? shortlist : ranked, seedText)[0].clue;
  }

  function chooseClues(fact, indexes) {
    const clues = usableClues(fact);
    return uniqueBy(indexes.map(index => clues[index % clues.length]), value => value);
  }

  function eraSafeClues(fact, indexes) {
    const eraToken = fact.era.replace(' 전기', '').replace(' 후기', '').replace('·가야', '').trim();
    const candidates = usableClues(fact).filter(clue => !eraToken || !clue.includes(eraToken));
    const source = candidates.length >= 2 ? candidates : usableClues(fact).map(clue => clue.replaceAll(eraToken, '이 시기'));
    return uniqueBy(indexes.map(index => source[index % source.length]), value => value);
  }

  function eraDistractors(fact, seedText) {
    const index = ERAS.indexOf(fact.era);
    const ranked = ERAS
      .filter(era => era !== fact.era)
      .map(era => ({ era, distance: Math.abs(ERAS.indexOf(era) - index) }))
      .sort((a, b) => a.distance - b.distance || a.era.localeCompare(b.era, 'ko'));
    const near = ranked.slice(0, 6).map(item => item.era);
    return seededShuffle(near, seedText).slice(0, 4);
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
      optionFactIds: shuffled.map(option => option.factId || null),
      answerIndex
    };
  }

  function clueToTitle(fact, variant, cycle) {
    const indexes = cycle === 0
      ? (variant % 2 === 0 ? [0, 3] : [1, 2])
      : (variant % 2 === 0 ? [1, 2, 3] : [0, 2, 3]);
    const selectedClues = chooseClues(fact, indexes);
    const distractors = relatedFacts(fact, 4, `identify-${fact.id}-${variant}`);
    const options = [
      {
        text: fact.title,
        correct: true,
        factId: fact.id,
        explanation: fact.summary
      },
      ...distractors.map(item => ({
        text: item.title,
        correct: false,
        factId: item.id,
        explanation: item.summary
      }))
    ];
    return {
      prompt: cycle === 0
        ? '다음 자료가 설명하는 역사적 사실로 가장 적절한 것은?'
        : '다음 단서를 모두 연결할 수 있는 주제로 가장 적절한 것은?',
      stimulus: selectedClues.map(clue => `• ${clue}`).join('\n'),
      type: '자료 추론',
      officialType: '역사 자료의 분석 및 해석',
      relatedFactIds: distractors.map(item => item.id),
      options
    };
  }

  function correctClue(fact, variant, cycle) {
    const clues = usableClues(fact);
    const correctClueText = clues[(cycle * 2 + variant) % clues.length];
    const distractors = relatedFacts(fact, 4, `correct-clue-${fact.id}-${variant}`);
    const options = [
      {
        text: correctClueText,
        correct: true,
        factId: fact.id,
        explanation: `이 설명은 ${fact.title}의 핵심 단서입니다.`
      },
      ...distractors.map((item, index) => ({
        text: distinctiveClue(item, fact, `correct-clue-text-${fact.id}-${item.id}-${variant}-${index}`),
        correct: false,
        factId: item.id,
        explanation: `이 설명은 ${item.title}에 해당합니다.`
      }))
    ];
    return {
      prompt: `${fact.title}에 관한 설명으로 옳은 것은?`,
      stimulus: `제${lessonFor(fact).number}강 ${lessonFor(fact).title} 범위에서 판단하세요.`,
      type: '지식 확인',
      officialType: '역사 지식의 이해',
      relatedFactIds: distractors.map(item => item.id),
      options
    };
  }

  function wrongClue(fact, variant, cycle) {
    const related = relatedFacts(fact, 4, `wrong-clue-${fact.id}-${variant}`);
    const outsider = related[(variant + cycle) % related.length];
    const outsiderClue = distinctiveClue(outsider, fact, `wrong-clue-text-${fact.id}-${outsider.id}-${variant}`);
    const options = [
      ...fact.clues.map(clue => ({
        text: clue,
        correct: false,
        factId: fact.id,
        explanation: `이 설명은 ${fact.title}의 핵심 단서이므로 옳습니다.`
      })),
      {
        text: outsiderClue,
        correct: true,
        factId: outsider.id,
        explanation: `${topic(`“${outsiderClue}”`)} ${outsider.title}의 내용입니다.`
      }
    ];
    return {
      prompt: cycle === 0
        ? `${fact.title}에 관한 설명으로 옳지 않은 것은?`
        : `${fact.title}과 관련된 설명을 검토한 결과, 적절하지 않은 것은?`,
      stimulus: cycle === 0
        ? '같은 시대의 혼동 개념이 한 선택지에 포함되어 있습니다.'
        : '핵심 단서 네 개와 인접 개념의 단서 하나를 구분하세요.',
      type: '오답 선지 판별',
      officialType: '역사 지식의 이해',
      relatedFactIds: [outsider.id],
      options
    };
  }

  function eraQuestion(fact, variant, cycle) {
    const selectedClues = eraSafeClues(fact, cycle === 0 ? [0, 2] : [1, 3]);
    const distractors = eraDistractors(fact, `era-${fact.id}-${variant}`);
    const options = [
      {
        text: fact.era,
        correct: true,
        explanation: `${topic(fact.title)} ${fact.era}에 해당합니다.`
      },
      ...distractors.map(era => ({
        text: era,
        correct: false,
        explanation: `제시된 단서는 ${subject(era)} 아니라 ${fact.era}에 해당합니다.`
      }))
    ];
    return {
      prompt: cycle === 0
        ? '다음 자료가 나타내는 시대는?'
        : '다음 자료를 한국사의 흐름에서 어느 시기에 배치해야 하는가?',
      stimulus: selectedClues.map(clue => `• ${clue}`).join('\n'),
      type: '시대 판단',
      officialType: '연대기의 파악',
      relatedFactIds: [],
      options
    };
  }

  function pairCorrectQuestion(fact, variant, cycle) {
    const related = relatedFacts(fact, 4, `pair-correct-${fact.id}-${variant}`);
    const wrongPairs = related.map((titleFact, index) => {
      const clueFact = related[(index + 1) % related.length];
      const clue = distinctiveClue(clueFact, titleFact, `pair-correct-text-${fact.id}-${variant}-${index}`);
      return {
        text: `${titleFact.title} — ${clue}`,
        correct: false,
        factId: titleFact.id,
        explanation: `이 단서는 ${subject(titleFact.title)} 아니라 ${clueFact.title}에 해당합니다.`
      };
    });
    const correctClueText = usableClues(fact)[(variant + cycle) % usableClues(fact).length];
    return {
      prompt: '역사적 사실과 설명을 바르게 연결한 것은?',
      stimulus: `제${lessonFor(fact).number}강 ${lessonFor(fact).title}의 혼동 개념을 구분하세요.`,
      type: '연결 판단',
      officialType: '역사 지식의 이해',
      relatedFactIds: related.map(item => item.id),
      options: [
        {
          text: `${fact.title} — ${correctClueText}`,
          correct: true,
          factId: fact.id,
          explanation: `${topic(fact.title)} 해당 설명과 바르게 연결됩니다.`
        },
        ...wrongPairs
      ]
    };
  }

  function pairIncorrectQuestion(fact, variant, cycle) {
    const related = relatedFacts(fact, 4, `pair-wrong-${fact.id}-${variant}`);
    const facts = [fact, ...related];
    const mismatchIndex = (variant + cycle) % facts.length;
    const options = facts.map((titleFact, index) => {
      const isMismatch = index === mismatchIndex;
      const clueFact = isMismatch ? facts[(index + 1) % facts.length] : titleFact;
      const clue = isMismatch
        ? distinctiveClue(clueFact, titleFact, `pair-wrong-text-${fact.id}-${variant}-${index}`)
        : usableClues(titleFact)[(variant + index + cycle) % usableClues(titleFact).length];
      return {
        text: `${titleFact.title} — ${clue}`,
        correct: isMismatch,
        factId: titleFact.id,
        explanation: isMismatch
          ? `이 단서는 ${subject(titleFact.title)} 아니라 ${clueFact.title}에 해당하므로 연결이 옳지 않습니다.`
          : `${topic(titleFact.title)} 해당 설명과 바르게 연결됩니다.`
      };
    });
    return {
      prompt: '역사적 사실과 설명의 연결이 옳지 않은 것은?',
      stimulus: '같은 시대·주제에서 자주 혼동하는 연결을 확인하세요.',
      type: '연결 판단',
      officialType: '역사 상황 및 쟁점의 인식',
      relatedFactIds: related.map(item => item.id),
      options
    };
  }

  function inquiryQuestion(fact, variant, cycle) {
    const correctClues = chooseClues(fact, cycle === 0 ? [0, 2] : [1, 3]);
    const related = relatedFacts(fact, 4, `inquiry-${fact.id}-${variant}`);
    const options = [
      {
        text: `“${correctClues[0]}”와 “${correctClues[1]}”를 함께 검토한다.`,
        correct: true,
        factId: fact.id,
        explanation: `두 자료는 모두 ${fact.title}의 성격을 밝히는 데 직접 관련됩니다.`
      },
      ...related.map((item, index) => {
        const first = distinctiveClue(item, fact, `inquiry-first-${fact.id}-${item.id}-${variant}`);
        const remaining = usableClues(item).filter(clue => clue !== first);
        const second = seededShuffle(remaining, `inquiry-second-${fact.id}-${item.id}-${variant}`)[0] || first;
        return {
          text: `“${first}”와 “${second}”를 함께 검토한다.`,
          correct: false,
          factId: item.id,
          explanation: `이 탐구 계획은 ${object(fact.title)} 조사하기보다 ${object(item.title)} 조사하는 데 적절합니다.`
        };
      })
    ];
    return {
      prompt: `${object(fact.title)} 탐구하기 위한 자료 수집 계획으로 가장 적절한 것은?`,
      stimulus: `탐구 목표: ${fact.summary}`,
      type: '탐구 설계',
      officialType: '역사 탐구의 설계 및 수행',
      relatedFactIds: related.map(item => item.id),
      options
    };
  }

  function conclusionQuestion(fact, variant, cycle) {
    const selectedClues = chooseClues(fact, cycle === 0 ? [0, 3] : [1, 2, 3]);
    const related = relatedFacts(fact, 4, `conclusion-${fact.id}-${variant}`);
    const options = [
      {
        text: fact.summary,
        correct: true,
        factId: fact.id,
        explanation: `제시된 자료에서 도출할 수 있는 결론입니다.`
      },
      ...related.map(item => ({
        text: item.summary,
        correct: false,
        factId: item.id,
        explanation: `이 결론은 ${item.title}에 해당하므로 제시된 자료와 맞지 않습니다.`
      }))
    ];
    return {
      prompt: '다음 자료를 바탕으로 내릴 수 있는 결론으로 가장 적절한 것은?',
      stimulus: selectedClues.map(clue => `• ${clue}`).join('\n'),
      type: '결론 도출',
      officialType: '결론의 도출 및 평가',
      relatedFactIds: related.map(item => item.id),
      options
    };
  }

  function sequencePermutations(correctLabels, seedText) {
    const candidates = [correctLabels];
    const patterns = [
      [1, 0, 2, 3],
      [0, 2, 1, 3],
      [3, 2, 1, 0],
      [1, 2, 3, 0],
      [2, 0, 3, 1],
      [0, 3, 2, 1]
    ];
    for (const pattern of seededShuffle(patterns, seedText)) {
      const candidate = pattern.map(index => correctLabels[index]);
      if (!candidates.some(existing => existing.join('|') === candidate.join('|'))) candidates.push(candidate);
      if (candidates.length === 5) break;
    }
    return candidates;
  }

  function chronologyQuestion(fact, variant, cycle) {
    const sequence = CHRONOLOGY_SETS.find(set => set.some(item => item.id === fact.id));
    if (!sequence || sequence.length < 4) return sameEraQuestion(fact, variant, cycle);
    const factIndex = sequence.findIndex(item => item.id === fact.id);
    const start = Math.max(0, Math.min(sequence.length - 4, factIndex - (cycle ? 2 : 1)));
    const chronological = sequence.slice(start, start + 4);
    const displayed = seededShuffle(chronological, `chronology-display-${fact.id}-${variant}`);
    const labels = ['(가)', '(나)', '(다)', '(라)'];
    const displayRows = displayed.map((item, index) => ({ label: labels[index], fact: item }));
    const correctLabels = chronological.map(item => displayRows.find(row => row.fact.id === item.id).label);
    const permutations = sequencePermutations(correctLabels, `chronology-options-${fact.id}-${variant}`);
    const correctText = correctLabels.join(' → ');
    const explanation = chronological.map(item => item.title).join(' → ');
    const options = permutations.map(order => ({
      text: order.join(' → '),
      correct: order.join('|') === correctLabels.join('|'),
      explanation: order.join('|') === correctLabels.join('|')
        ? `올바른 순서는 ${explanation}입니다.`
        : `올바른 순서는 ${explanation}입니다.`
    }));
    return {
      prompt: cycle === 0
        ? `${subject(fact.title)} 포함된 다음 사건을 일어난 순서대로 바르게 나열한 것은?`
        : `${subject(fact.title)} 포함된 다음 사건의 선후 관계로 옳은 것은?`,
      stimulus: displayRows.map(row => `${row.label} ${row.fact.title}`).join('\n'),
      type: '연대기 배열',
      officialType: '연대기의 파악',
      relatedFactIds: chronological.map(item => item.id),
      chronologyFactIds: chronological.map(item => item.id),
      correctSequence: correctText,
      options
    };
  }

  function sameEraQuestion(fact, variant, cycle) {
    const sameEra = relatedFacts(fact, 4, `same-era-${fact.id}-${variant}`);
    const correct = sameEra[0] || DATA.facts.find(item => item.id !== fact.id && item.era === fact.era);
    const otherEras = seededShuffle(ERAS.filter(era => era !== fact.era), `same-era-other-${fact.id}-${variant}`).slice(0, 4);
    const distractors = otherEras.map(era => seededShuffle(DATA.facts.filter(item => item.era === era), `${fact.id}-${variant}-${era}`)[0]);
    const options = [
      {
        text: correct.title,
        correct: true,
        factId: correct.id,
        explanation: `${topic(correct.title)} ${coordinate(fact.title)} 같은 ${fact.era}에 해당합니다.`
      },
      ...distractors.map(item => ({
        text: item.title,
        correct: false,
        factId: item.id,
        explanation: `${topic(item.title)} ${item.era}에 해당합니다.`
      }))
    ];
    return {
      prompt: `${coordinate(fact.title)} 같은 시대에 해당하는 역사적 사실은?`,
      stimulus: cycle === 0 ? fact.clues[0] : fact.clues[3],
      type: '시대 비교',
      officialType: '연대기의 파악',
      relatedFactIds: [correct.id, ...distractors.map(item => item.id)],
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
      lesson: fact.lesson,
      title: fact.title,
      difficulty,
      points: POINTS[difficulty],
      sourceKey: fact.sourceKey,
      reviewTier: cycle === 0 ? CORE_LABEL : REPEAT_LABEL,
      template,
      cycle
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
        generated = pairCorrectQuestion(fact, variant, cycle);
        break;
      case 6:
        generated = pairIncorrectQuestion(fact, variant, cycle);
        break;
      case 7:
        generated = inquiryQuestion(fact, variant, cycle);
        break;
      case 8:
        generated = conclusionQuestion(fact, variant, cycle);
        break;
      case 9:
        generated = chronologyQuestion(fact, variant, cycle);
        break;
      default:
        throw new Error(`지원하지 않는 문항 형식입니다: ${template}`);
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

  function buildMockSets(coreQuestions) {
    const questionByFactAndTemplate = new Map(
      coreQuestions.map(question => [`${question.canonicalId}:${question.template}`, question])
    );
    const easyTemplates = [0, 2, 4];
    const hardTemplates = [6, 7, 8];
    const normalTemplates = [1, 3, 9];

    return Array.from({ length: 5 }, (_, setIndex) => {
      const questions = [];
      ERAS.forEach((era, eraIndex) => {
        const facts = seededShuffle(
          DATA.facts.filter(fact => fact.era === era),
          `mock-${era}-facts`
        );
        if (facts.length < 5) throw new Error(`${era} 모의고사 구성을 위한 개념이 부족합니다.`);
        const templates = [
          easyTemplates[(setIndex + eraIndex) % easyTemplates.length],
          ...normalTemplates,
          hardTemplates[(setIndex + eraIndex) % hardTemplates.length]
        ];
        templates.forEach((template, slotIndex) => {
          const fact = facts[(setIndex + slotIndex) % facts.length];
          const question = questionByFactAndTemplate.get(`${fact.id}:${template}`);
          if (!question) throw new Error(`${fact.id}의 모의고사 문항 형식 ${template}을 찾지 못했습니다.`);
          questions.push(question);
        });
      });
      return {
        id: `mock-${setIndex + 1}`,
        title: `전 범위 모의고사 ${setIndex + 1}회`,
        questionIds: seededShuffle(questions, `mock-${setIndex + 1}-order`).map(question => question.id),
        difficultyCounts: { '쉬움': 10, '보통': 30, '어려움': 10 }
      };
    });
  }


  const QUESTIONS = buildQuestionBank();
  const QUESTION_MAP = new Map(QUESTIONS.map(question => [question.id, question]));
  const CORE_QUESTIONS = QUESTIONS.filter(question => question.reviewTier === CORE_LABEL);
  const REPEAT_QUESTIONS = QUESTIONS.filter(question => question.reviewTier === REPEAT_LABEL);
  const MOCK_SETS = buildMockSets(CORE_QUESTIONS);

  globalThis.HISTORY_APP_API = {
    buildQuestionBank,
    QUESTIONS,
    CORE_QUESTIONS,
    REPEAT_QUESTIONS,
    MOCK_SETS,
    FACT_MAP,
    QUESTION_MAP,
    ERAS,
    CATEGORIES,
    QUESTION_TYPES,
    yearLabel,
    relatedFacts
  };

  if (typeof document === 'undefined') return;

  const DEFAULT_STATE = {
    version: 3,
    answers: {},
    bookmarks: [],
    theme: 'system',
    activeSession: null,
    lastView: 'home'
  };

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || parsed.version !== 3) return structuredClone(DEFAULT_STATE);
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
  let practiceFilters = { tier: CORE_LABEL, era: '전체', category: '전체', type: '전체', difficulty: '전체', count: 10 };
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
          <h1>정답이 보이는 문제를 버리고,<br>혼동 개념까지 구분합니다.</h1>
          <p class="hero-description">${formatNumber(DATA.facts.length)}개 핵심 개념을 최태성 선생님의 공개 40강 구성에 맞춰 정리했습니다. 기본 학습은 ${formatNumber(CORE_QUESTIONS.length)}개 핵심 문항을 사용하고, 별도의 ${formatNumber(REPEAT_QUESTIONS.length)}개 심화 반복 문항으로 같은 개념을 다른 단서에서 다시 확인합니다.</p>
          <div class="hero-actions">
            <button class="primary-button" data-action="quick-practice">핵심 문항 10개 풀기</button>
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
            <h2>${session.kind === 'mock' ? session.mockTitle || '실전 모의고사' : '문제 훈련'}를 이어서 진행합니다.</h2>
            <p>${session.index + 1} / ${session.ids.length}번 문항까지 이동했습니다.</p>
          </div>
          <button class="primary-button" data-action="continue-session">이어서 풀기</button>
        </section>
      ` : ''}

      <section class="stats-grid" aria-label="학습 통계">
        <article class="stat-card surface"><span>풀이한 고유 문항</span><strong>${formatNumber(stats.answered)}</strong><small>핵심 ${formatNumber(CORE_QUESTIONS.length)}개 · 반복 포함 ${formatNumber(QUESTIONS.length)}개</small></article>
        <article class="stat-card surface"><span>현재 정답률</span><strong>${stats.accuracy}%</strong><small>${formatNumber(stats.correct)}개 정답</small></article>
        <article class="stat-card surface"><span>오답 복습 대기</span><strong>${formatNumber(stats.wrongIds.length)}</strong><small>최근 답안 기준</small></article>
        <article class="stat-card surface"><span>고정 모의고사</span><strong>${MOCK_SETS.length}회</strong><small>회차 간 문항 중복 없음</small></article>
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div><p class="eyebrow">시대별 기록</p><h2>실제로 답한 범위만 진도로 계산합니다.</h2></div>
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
        <article class="feature-card surface"><span class="feature-number">01</span><h3>정답 단서를 문제에 노출하지 않습니다.</h3><p>인물명이나 사건명을 지문에 그대로 넣고 같은 이름을 고르게 하는 문항을 검증 단계에서 차단합니다.</p></article>
        <article class="feature-card surface"><span class="feature-number">02</span><h3>오답은 인접 개념에서 가져옵니다.</h3><p>같은 강의·시대·주제의 왕, 제도, 사건을 우선 사용하고 의미가 겹치는 선지는 제외합니다.</p></article>
        <article class="feature-card surface"><span class="feature-number">03</span><h3>모의고사는 고정 세트로 비교합니다.</h3><p>각 회차는 50문항·80분·100점이며, 다섯 회차가 서로 같은 문항을 사용하지 않습니다.</p></article>
      </section>
    `;
  }

  function renderLearn() {
    const query = learnFilters.query.trim().toLowerCase();
    const filtered = DATA.facts.filter(fact => {
      const lesson = lessonFor(fact);
      const matchesQuery = !query || [fact.title, fact.summary, lesson.title, ...fact.clues].join(' ').toLowerCase().includes(query);
      const matchesEra = learnFilters.era === '전체' || fact.era === learnFilters.era;
      const matchesCategory = learnFilters.category === '전체' || fact.category === learnFilters.category;
      return matchesQuery && matchesEra && matchesCategory;
    });

    elements.main.innerHTML = `
      <section class="page-header">
        <p class="eyebrow">개념 학습</p>
        <h1>40강 흐름에서 핵심 단서를 먼저 익힙니다.</h1>
        <p>공개된 별별한국사 40강의 큰 단원 구성을 참고하되, 설명과 문제는 공식 자료를 바탕으로 새로 작성했습니다.</p>
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
          const lesson = lessonFor(fact);
          return `
            <article class="concept-card surface">
              <div class="concept-meta"><span>제${lesson.number}강</span><span>${fact.era}</span><span>${fact.category}</span></div>
              <h2>${fact.title}</h2>
              <p>${fact.summary}</p>
              <details>
                <summary>핵심 단서 4개 보기</summary>
                <ul>${fact.clues.map(clue => `<li>${clue}</li>`).join('')}</ul>
              </details>
              <div class="concept-footer">
                <span>연결 문제 ${answered} / 20개 · 핵심 10개</span>
                <button class="secondary-button small" data-action="practice-concept" data-fact-id="${fact.id}">핵심 문제 10개 풀기</button>
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
        <p class="eyebrow">문제 훈련</p>
        <h1>핵심 문항과 심화 반복을 구분해서 풉니다.</h1>
        <p>처음에는 핵심 문항을 풀고, 같은 개념을 다른 단서에서 다시 확인할 때 심화 반복을 사용합니다.</p>
      </section>
      <section class="practice-builder surface">
        <div class="builder-grid extended">
          <label><span>문항 구분</span><select id="practiceTier">${['전체', CORE_LABEL, REPEAT_LABEL].map(value => `<option ${value === practiceFilters.tier ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>시대</span><select id="practiceEra">${['전체', ...ERAS].map(value => `<option ${value === practiceFilters.era ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>주제</span><select id="practiceCategory">${['전체', ...CATEGORIES].map(value => `<option ${value === practiceFilters.category ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>문제 유형</span><select id="practiceType">${['전체', ...QUESTION_TYPES].map(value => `<option ${value === practiceFilters.type ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>난도</span><select id="practiceDifficulty">${['전체', '쉬움', '보통', '어려움'].map(value => `<option ${value === practiceFilters.difficulty ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label><span>문항 수</span><select id="practiceCount">${[5, 10, 20, 50].map(value => `<option value="${value}" ${value === Number(practiceFilters.count) ? 'selected' : ''}>${value}문항</option>`).join('')}</select></label>
        </div>
        <div class="builder-summary">
          <div><strong>${formatNumber(filteredCount)}</strong><span>개 문항에서 출제할 수 있습니다.</span></div>
          <button class="primary-button" data-action="start-practice" ${filteredCount ? '' : 'disabled'}>문제 시작</button>
        </div>
      </section>
      <section class="quality-grid">
        <article class="info-panel surface"><span class="quality-badge core">${CORE_LABEL}</span><h2>${formatNumber(CORE_QUESTIONS.length)}개</h2><p>첫 번째 단서 조합을 사용합니다. 고정 모의고사는 이 문항만 사용합니다.</p></article>
        <article class="info-panel surface"><span class="quality-badge repeat">${REPEAT_LABEL}</span><h2>${formatNumber(REPEAT_QUESTIONS.length)}개</h2><p>같은 개념을 다른 단서·선지 배열로 반복합니다. 모의고사 점수에는 사용하지 않습니다.</p></article>
      </section>
      <section class="info-panel surface">
        <h2>출제 유형</h2>
        <div class="tag-list">${DATA.officialTypes.map(type => `<span>${type}</span>`).join('')}</div>
        <p>모든 문항은 정답 하나, 고유한 선택지 다섯 개, 선택지별 해설과 공식 근거 포털을 포함합니다.</p>
      </section>
    `;
  }

  function filterQuestions(filters) {
    return QUESTIONS.filter(question => {
      const tierMatch = filters.tier === '전체' || question.reviewTier === filters.tier;
      const eraMatch = filters.era === '전체' || question.era === filters.era;
      const categoryMatch = filters.category === '전체' || question.category === filters.category;
      const typeMatch = filters.type === '전체' || question.type === filters.type;
      const difficultyMatch = filters.difficulty === '전체' || question.difficulty === filters.difficulty;
      return tierMatch && eraMatch && categoryMatch && typeMatch && difficultyMatch;
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
        <div><p class="eyebrow">문제 훈련</p><h1>${session.index + 1} / ${session.ids.length}</h1></div>
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
          <span class="quality-badge ${question.reviewTier === CORE_LABEL ? 'core' : 'repeat'}">${question.reviewTier}</span>
          <span>제${lessonFor(FACT_MAP.get(question.canonicalId)).number}강</span><span>${question.era}</span><span>${question.category}</span><span>${question.difficulty} · ${question.points}점</span><span>${question.officialType}</span>
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
            <div class="source-note">
              <p>${FACT_MAP.get(question.canonicalId).sourceNote}</p>
              <a class="source-link" href="${DATA.sources[question.sourceKey].url}" target="_blank" rel="noreferrer">공식 근거 포털: ${DATA.sources[question.sourceKey].name}</a>
            </div>
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
        <p class="eyebrow">문제 훈련 결과</p>
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
        <h1>고정된 다섯 회차로 점수 변화를 비교합니다.</h1>
        <p>각 회차는 핵심 문항 50개로 구성되며, 다른 회차와 문항을 공유하지 않습니다.</p>
      </section>
      <section class="mock-guide surface">
        <div class="mock-score-scale">
          <div><strong>80점 이상</strong><span>1급</span></div>
          <div><strong>70점 이상</strong><span>2급</span></div>
          <div><strong>60점 이상</strong><span>3급</span></div>
        </div>
        <ul>
          <li>쉬움 10문항·보통 30문항·어려움 10문항을 1점·2점·3점으로 계산합니다.</li>
          <li>각 회차에는 모든 시대가 5문항씩 포함됩니다.</li>
          <li>시험 중에는 정답과 해설을 표시하지 않으며 80분이 지나면 자동 제출합니다.</li>
          <li>답하지 않은 문제는 0점이며 학습 진도에는 포함하지 않습니다.</li>
        </ul>
      </section>
      <section class="mock-set-grid">
        ${MOCK_SETS.map((set, index) => `
          <article class="mock-set-card surface">
            <span>고정 세트 ${index + 1}</span>
            <h2>${set.title}</h2>
            <p>50문항 · 80분 · 100점</p>
            <div class="tag-list"><span>쉬움 10</span><span>보통 30</span><span>어려움 10</span></div>
            <button class="primary-button" data-action="start-mock" data-set-index="${index}">${set.title} 시작</button>
          </article>
        `).join('')}
      </section>
    `;
  }

  function startMock(setIndex = 0) {
    const mockSet = MOCK_SETS[Number(setIndex)] || MOCK_SETS[0];
    state.activeSession = {
      kind: 'mock',
      mockSetId: mockSet.id,
      mockTitle: mockSet.title,
      ids: [...mockSet.questionIds],
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
        <p class="eyebrow">${session.mockTitle || '실전 모의고사'} 결과</p>
        <h1>${result.score}점 · ${result.grade}</h1>
        <p>${result.answeredCount}문항 응답 · ${result.correctCount}문항 정답</p>
        <div class="score-bar"><span style="width:${result.score}%"></span><i style="left:80%">1급 80점</i></div>
        <div class="result-actions">
          <button class="primary-button" data-action="mock-wrong-review">오답만 다시 풀기</button>
          <button class="secondary-button" data-action="new-mock">다른 회차 선택</button>
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
      ` : `<section class="empty-state surface"><strong>${reviewMode === 'wrong' ? '현재 오답이 없습니다.' : '저장한 문제가 없습니다.'}</strong><p>문제를 실제로 푼 뒤 이 화면에서 다시 확인할 수 있습니다.</p><button class="primary-button" data-view-target="practice">문제 훈련으로 이동</button></section>`}
    `;
  }

  function renderSources() {
    const exam = nextExamInfo();
    elements.main.innerHTML = `
      <section class="page-header">
        <p class="eyebrow">시험 기준과 출처</p>
        <h1>문항 수보다 검증 범위를 먼저 공개합니다.</h1>
        <p>공식 출제 유형, 40강 학습 구조, 핵심 문항과 반복 문항의 역할을 분리합니다.</p>
      </section>
      <section class="schedule-card surface">
        <div class="section-heading"><div><p class="eyebrow">2026년 일정</p><h2>가장 가까운 시험은 제${exam.round}회입니다.</h2></div><a class="primary-link" href="${DATA.sources.exam.url}" target="_blank" rel="noreferrer">공식 일정 확인</a></div>
        <div class="schedule-grid">
          ${DATA.exams.map(item => `<article><span>제${item.round}회</span><strong>${formatDate(item.date)}</strong><p>${item.note}</p><small>정기 접수 ${item.registration}</small></article>`).join('')}
        </div>
      </section>
      <section class="quality-grid">
        <article class="info-panel surface"><span class="quality-badge core">핵심 개념</span><h2>${formatNumber(DATA.facts.length)}개</h2><p>복합 주제를 분리하고 조선 후기·일제 강점기·현대사의 넓은 항목을 더 작은 개념으로 다시 나눴습니다.</p></article>
        <article class="info-panel surface"><span class="quality-badge core">핵심 문항</span><h2>${formatNumber(CORE_QUESTIONS.length)}개</h2><p>정답 노출, 무관한 시대의 무작위 오답, 대표 연도만 비교하는 문제를 배제했습니다.</p></article>
        <article class="info-panel surface"><span class="quality-badge repeat">심화 반복</span><h2>${formatNumber(REPEAT_QUESTIONS.length)}개</h2><p>같은 개념을 다른 단서로 복습하는 문항이며, 모의고사 점수 산정에는 사용하지 않습니다.</p></article>
      </section>
      <section class="source-grid">
        ${Object.values(DATA.sources).map(source => `<a class="source-card surface" href="${source.url}" target="_blank" rel="noreferrer"><span>공식 자료</span><h2>${source.name}</h2><p>${source.description}</p><strong>새 창에서 확인 ↗</strong></a>`).join('')}
      </section>
      <section class="policy-card surface">
        <h2>문항 작성 원칙</h2>
        <p>국사편찬위원회의 여섯 가지 출제 유형을 기준으로 자료 추론, 연대기, 상황 판단, 탐구 설계와 결론 도출 문항을 구분합니다. 심화 시험은 50문항·5지 택1형이며 80점 이상이 1급입니다.</p>
        <p>최태성 선생님의 공개 강의와 공개된 2026 별별한국사 40강 목차에서 전체 흐름과 학습 순서를 참고했습니다. 강의·교재의 문장, 판서, 문제와 이미지는 복제하지 않았습니다.</p>
        <p>${DATA.qualityPolicy.description} ${DATA.qualityPolicy.mockDescription} ${DATA.qualityPolicy.difficultyDescription}</p>
        <p>이 사이트는 국사편찬위원회, 최태성 선생님 또는 이투스와 제휴한 서비스가 아닙니다. 실제 기출문제를 복제하지 않으며, 시험 일정과 규정은 공식 홈페이지를 최종 기준으로 확인해야 합니다.</p>
      </section>
    `;
  }

  function exportProgress() {
    const payload = {
      schema: 'korean-history-grade1-progress',
      version: 3,
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
      if (parsed.schema !== 'korean-history-grade1-progress' || parsed.version !== 3 || !parsed.state) {
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
      practiceFilters = { tier: CORE_LABEL, era: '전체', category: '전체', type: '전체', difficulty: '전체', count: 10 };
      startPractice();
    } else if (action === 'continue-session') {
      currentView = state.activeSession.kind === 'mock' ? 'mock' : 'practice';
      render();
    } else if (action === 'practice-concept') {
      const ids = CORE_QUESTIONS.filter(question => question.canonicalId === target.dataset.factId).map(question => question.id);
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
      startMock(target.dataset.setIndex);
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
    } else if (target.id === 'practiceTier') {
      practiceFilters.tier = target.value;
      renderPractice();
    } else if (target.id === 'practiceEra') {
      practiceFilters.era = target.value;
      renderPractice();
    } else if (target.id === 'practiceCategory') {
      practiceFilters.category = target.value;
      renderPractice();
    } else if (target.id === 'practiceType') {
      practiceFilters.type = target.value;
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
