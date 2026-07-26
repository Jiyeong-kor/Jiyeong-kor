(() => {
  'use strict';

  const course = Array.isArray(window.RN_COURSE) ? window.RN_COURSE : [];
  const meta = window.RN_COURSE_META || {};
  const STORAGE_KEY = 'rn-compose-course-v2';
  const THEME_KEY = 'rn-compose-course-theme-v2';

  const elements = {
    navToggle: document.querySelector('#navToggle'),
    sidebar: document.querySelector('#sidebar'),
    overlay: document.querySelector('#mobileOverlay'),
    curriculumNav: document.querySelector('#curriculumNav'),
    sidebarSearch: document.querySelector('#sidebarSearch'),
    sidebarProgressText: document.querySelector('#sidebarProgressText'),
    sidebarProgressPercent: document.querySelector('#sidebarProgressPercent'),
    sidebarProgressBar: document.querySelector('#sidebarProgressBar'),
    exportProgress: document.querySelector('#exportProgress'),
    importProgressButton: document.querySelector('#importProgressButton'),
    importProgressInput: document.querySelector('#importProgressInput'),
    resetProgress: document.querySelector('#resetProgress'),
    homeButton: document.querySelector('#homeButton'),
    brandHome: document.querySelector('#brandHome'),
    themeButton: document.querySelector('#themeButton'),
    readProgress: document.querySelector('#readProgress'),
    homeScreen: document.querySelector('#homeScreen'),
    lessonScreen: document.querySelector('#lessonScreen'),
    homeStart: document.querySelector('#homeStart'),
    homeResume: document.querySelector('#homeResume'),
    homeResumeLabel: document.querySelector('#homeResumeLabel'),
    homeCompleted: document.querySelector('#homeCompleted'),
    homeTotal: document.querySelector('#homeTotal'),
    homeHours: document.querySelector('#homeHours'),
    courseGrid: document.querySelector('#courseGrid'),
    lessonEyebrow: document.querySelector('#lessonEyebrow'),
    lessonTitle: document.querySelector('#lessonTitle'),
    lessonSummary: document.querySelector('#lessonSummary'),
    lessonMeta: document.querySelector('#lessonMeta'),
    lessonOutcomes: document.querySelector('#lessonOutcomes'),
    lessonBody: document.querySelector('#lessonBody'),
    quizList: document.querySelector('#quizList'),
    quizScore: document.querySelector('#quizScore'),
    sourceList: document.querySelector('#sourceList'),
    previousLesson: document.querySelector('#previousLesson'),
    nextLesson: document.querySelector('#nextLesson'),
    completeLesson: document.querySelector('#completeLesson'),
    toast: document.querySelector('#toast'),
    loadError: document.querySelector('#loadError')
  };

  const state = loadState();
  let currentLessonId = null;
  let toastTimer = null;

  function loadState() {
    const fallback = {
      completed: [],
      quizAnswers: {},
      lastLesson: null
    };

    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      return {
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        quizAnswers: parsed.quizAnswers && typeof parsed.quizAnswers === 'object' ? parsed.quizAnswers : {},
        lastLesson: typeof parsed.lastLesson === 'string' ? parsed.lastLesson : null
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function isCompleted(id) {
    return state.completed.includes(id);
  }

  function setCompleted(id, completed) {
    const set = new Set(state.completed);
    if (completed) set.add(id);
    else set.delete(id);
    state.completed = [...set];
    saveState();
    updateProgressViews();
    renderNavigation(elements.sidebarSearch.value);
    renderCourseGrid();
  }

  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 1700);
  }

  function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.overlay.classList.remove('show');
    elements.navToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleSidebar() {
    const open = !elements.sidebar.classList.contains('open');
    elements.sidebar.classList.toggle('open', open);
    elements.overlay.classList.toggle('show', open);
    elements.navToggle.setAttribute('aria-expanded', String(open));
  }

  function groupedCourse(items) {
    const groups = [];
    items.forEach((lesson) => {
      let group = groups.find((entry) => entry.phase === lesson.phase);
      if (!group) {
        group = { phase: lesson.phase, lessons: [] };
        groups.push(group);
      }
      group.lessons.push(lesson);
    });
    return groups;
  }

  function searchableText(lesson) {
    return [
      lesson.title,
      lesson.phase,
      lesson.summary,
      ...(lesson.tags || []),
      ...(lesson.outcomes || [])
    ].join(' ').toLocaleLowerCase('ko-KR');
  }

  function renderNavigation(query = '') {
    const normalized = query.trim().toLocaleLowerCase('ko-KR');
    const filtered = normalized
      ? course.filter((lesson) => searchableText(lesson).includes(normalized))
      : course;

    if (!filtered.length) {
      elements.curriculumNav.innerHTML = '<p class="empty-state">검색 결과가 없습니다.</p>';
      return;
    }

    elements.curriculumNav.innerHTML = groupedCourse(filtered).map((group) => {
      const lessonButtons = group.lessons.map((lesson) => {
        const active = lesson.id === currentLessonId;
        const done = isCompleted(lesson.id);
        return `
          <button class="nav-lesson ${active ? 'active' : ''} ${done ? 'done' : ''}"
                  type="button"
                  data-lesson-id="${lesson.id}"
                  aria-current="${active ? 'page' : 'false'}">
            <span class="nav-number">${done ? '✓' : String(lesson.no).padStart(2, '0')}</span>
            <span class="nav-title">${lesson.title}</span>
            <span class="nav-time">${lesson.duration}</span>
          </button>`;
      }).join('');
      return `<div class="phase-title">${group.phase}</div>${lessonButtons}`;
    }).join('');

    elements.curriculumNav.querySelectorAll('[data-lesson-id]').forEach((button) => {
      button.addEventListener('click', () => openLesson(button.dataset.lessonId));
    });
  }

  function totalMinutes() {
    return course.reduce((sum, lesson) => sum + (Number(lesson.minutes) || 0), 0);
  }

  function updateProgressViews() {
    const completed = state.completed.filter((id) => course.some((lesson) => lesson.id === id)).length;
    const total = course.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    elements.sidebarProgressText.textContent = `${completed} / ${total}개 완료`;
    elements.sidebarProgressPercent.textContent = `${percent}%`;
    elements.sidebarProgressBar.style.width = `${percent}%`;
    elements.homeCompleted.textContent = String(completed);
    elements.homeTotal.textContent = String(total);
    elements.homeHours.textContent = `${Math.round(totalMinutes() / 60)}시간`;
  }

  function renderCourseGrid() {
    elements.courseGrid.innerHTML = course.map((lesson) => {
      const done = isCompleted(lesson.id);
      return `
        <article class="course-card ${done ? 'done' : ''}" data-course-id="${lesson.id}" tabindex="0" role="button" aria-label="${lesson.title} 학습 열기">
          <span class="course-number">${done ? '✓' : String(lesson.no).padStart(2, '0')}</span>
          <div>
            <h3>${lesson.title}</h3>
            <p>${lesson.summary}</p>
            <div class="course-meta"><span>${lesson.phase}</span><span>${lesson.duration}</span><span>${lesson.level || '필수'}</span></div>
          </div>
        </article>`;
    }).join('');

    elements.courseGrid.querySelectorAll('[data-course-id]').forEach((card) => {
      const open = () => openLesson(card.dataset.courseId);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });
  }

  function renderHome() {
    currentLessonId = null;
    elements.homeScreen.hidden = false;
    elements.lessonScreen.hidden = true;
    renderNavigation(elements.sidebarSearch.value);
    renderCourseGrid();
    updateProgressViews();

    const resumeLesson = course.find((lesson) => lesson.id === state.lastLesson) || course.find((lesson) => !isCompleted(lesson.id)) || course[0];
    if (resumeLesson) {
      elements.homeResume.hidden = false;
      elements.homeResume.dataset.lessonId = resumeLesson.id;
      elements.homeResumeLabel.textContent = `${resumeLesson.no}강 이어서 학습`;
    } else {
      elements.homeResume.hidden = true;
    }

    if (location.hash !== '#home') {
      history.replaceState(null, '', '#home');
    }
    document.title = `${meta.title || 'Compose 개발자의 React Native 실전 교과서'}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeSidebar();
  }

  function renderLessonHeader(lesson) {
    elements.lessonEyebrow.textContent = `${String(lesson.no).padStart(2, '0')}강 · ${lesson.phase}`;
    elements.lessonTitle.textContent = lesson.title;
    elements.lessonSummary.textContent = lesson.summary;
    elements.lessonMeta.innerHTML = [lesson.duration, lesson.level || '필수', ...(lesson.tags || []).slice(0, 3)]
      .map((value) => `<span class="chip">${value}</span>`)
      .join('');
    elements.lessonOutcomes.innerHTML = (lesson.outcomes || []).map((outcome) => `<li>${outcome}</li>`).join('');
  }

  function renderQuiz(lesson) {
    const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : [];
    const answers = Array.isArray(state.quizAnswers[lesson.id]) ? state.quizAnswers[lesson.id] : [];

    if (!quiz.length) {
      elements.quizList.innerHTML = '<p class="empty-state">이 단원에는 확인 문제가 없습니다.</p>';
      elements.quizScore.textContent = '';
      return;
    }

    elements.quizList.innerHTML = quiz.map((item, questionIndex) => {
      const selected = Number.isInteger(answers[questionIndex]) ? answers[questionIndex] : null;
      const feedbackState = selected === null ? '' : selected === item.answer ? 'correct' : 'incorrect';
      const options = item.options.map((option, optionIndex) => {
        let className = 'quiz-option';
        if (selected === optionIndex) className += optionIndex === item.answer ? ' correct' : ' incorrect';
        if (selected !== null && optionIndex === item.answer) className += ' correct';
        return `
          <button class="${className}" type="button" data-question="${questionIndex}" data-option="${optionIndex}">
            <span class="option-index">${optionIndex + 1}</span>
            <span>${option}</span>
          </button>`;
      }).join('');

      const feedback = selected === null
        ? '답을 선택하면 설명이 표시됩니다.'
        : `${selected === item.answer ? '정답입니다.' : '정답이 아닙니다.'} ${item.explanation}`;

      return `
        <section class="quiz-item" aria-labelledby="quiz-${lesson.id}-${questionIndex}">
          <p class="quiz-question" id="quiz-${lesson.id}-${questionIndex}">${questionIndex + 1}. ${item.question}</p>
          <div class="quiz-options">${options}</div>
          <p class="quiz-feedback" data-state="${feedbackState}" aria-live="polite">${feedback}</p>
        </section>`;
    }).join('');

    const score = quiz.reduce((sum, item, index) => sum + (answers[index] === item.answer ? 1 : 0), 0);
    const answered = quiz.reduce((sum, item, index) => sum + (Number.isInteger(answers[index]) ? 1 : 0), 0);
    elements.quizScore.innerHTML = `<span>현재 점수</span><span>${score} / ${quiz.length}점 · ${answered}문항 응답</span>`;

    elements.quizList.querySelectorAll('[data-question]').forEach((button) => {
      button.addEventListener('click', () => {
        const questionIndex = Number(button.dataset.question);
        const optionIndex = Number(button.dataset.option);
        const nextAnswers = Array.isArray(state.quizAnswers[lesson.id]) ? [...state.quizAnswers[lesson.id]] : [];
        nextAnswers[questionIndex] = optionIndex;
        state.quizAnswers[lesson.id] = nextAnswers;
        saveState();
        renderQuiz(lesson);
      });
    });
  }

  function renderSources(lesson) {
    elements.sourceList.innerHTML = (lesson.sources || []).map((source) => `
      <li><a href="${source.url}" target="_blank" rel="noreferrer">${source.label} <span aria-hidden="true">↗</span></a></li>`).join('');
  }

  function attachCodeCopyButtons() {
    elements.lessonBody.querySelectorAll('.copy-code').forEach((button) => {
      button.addEventListener('click', async () => {
        const code = button.closest('.code-wrap')?.querySelector('code')?.textContent || '';
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          showToast('코드를 복사했습니다.');
        } catch (error) {
          const textarea = document.createElement('textarea');
          textarea.value = code;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
          showToast('코드를 복사했습니다.');
        }
      });
    });
  }

  function renderLessonActions(lesson) {
    const index = course.findIndex((item) => item.id === lesson.id);
    const previous = course[index - 1];
    const next = course[index + 1];

    elements.previousLesson.hidden = !previous;
    elements.nextLesson.hidden = !next;
    if (previous) {
      elements.previousLesson.textContent = `← ${previous.no}강`;
      elements.previousLesson.dataset.lessonId = previous.id;
      elements.previousLesson.setAttribute('aria-label', `이전 단원: ${previous.title}`);
    }
    if (next) {
      elements.nextLesson.textContent = `${next.no}강 →`;
      elements.nextLesson.dataset.lessonId = next.id;
      elements.nextLesson.setAttribute('aria-label', `다음 단원: ${next.title}`);
    }

    const completed = isCompleted(lesson.id);
    elements.completeLesson.classList.toggle('completed', completed);
    elements.completeLesson.textContent = completed ? '✓ 학습 완료' : '학습 완료로 표시';
    elements.completeLesson.setAttribute('aria-pressed', String(completed));
  }

  function openLesson(id, options = {}) {
    const lesson = course.find((item) => item.id === id);
    if (!lesson) {
      renderHome();
      showToast('해당 단원을 찾지 못했습니다.');
      return;
    }

    currentLessonId = lesson.id;
    state.lastLesson = lesson.id;
    saveState();
    elements.homeScreen.hidden = true;
    elements.lessonScreen.hidden = false;
    renderLessonHeader(lesson);
    elements.lessonBody.innerHTML = lesson.body;
    renderQuiz(lesson);
    renderSources(lesson);
    renderLessonActions(lesson);
    renderNavigation(elements.sidebarSearch.value);
    attachCodeCopyButtons();

    if (options.updateHash !== false) {
      const nextHash = `#lesson/${lesson.id}`;
      if (location.hash !== nextHash) history.pushState(null, '', nextHash);
    }

    document.title = `${lesson.no}강 ${lesson.title} · ${meta.shortTitle || 'React Native 교과서'}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeSidebar();
    requestAnimationFrame(() => elements.lessonTitle.focus({ preventScroll: true }));
  }

  function exportProgress() {
    const payload = {
      format: 'rn-compose-course-progress',
      version: 2,
      exportedAt: new Date().toISOString(),
      completed: state.completed,
      quizAnswers: state.quizAnswers,
      lastLesson: state.lastLesson
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `React_Native_학습진도_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('학습 진도 파일을 만들었습니다.');
  }

  async function importProgress(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.format !== 'rn-compose-course-progress') throw new Error('format');
      state.completed = Array.isArray(parsed.completed) ? parsed.completed.filter((id) => course.some((lesson) => lesson.id === id)) : [];
      state.quizAnswers = parsed.quizAnswers && typeof parsed.quizAnswers === 'object' ? parsed.quizAnswers : {};
      state.lastLesson = typeof parsed.lastLesson === 'string' ? parsed.lastLesson : null;
      saveState();
      updateProgressViews();
      renderNavigation(elements.sidebarSearch.value);
      renderCourseGrid();
      if (currentLessonId) openLesson(currentLessonId, { updateHash: false });
      showToast('학습 진도를 불러왔습니다.');
    } catch (error) {
      showToast('올바른 학습 진도 파일이 아닙니다.');
    } finally {
      elements.importProgressInput.value = '';
    }
  }

  function resetProgress() {
    const confirmed = window.confirm('완료 표시와 문제 풀이 기록을 모두 초기화하시겠습니까?');
    if (!confirmed) return;
    state.completed = [];
    state.quizAnswers = {};
    state.lastLesson = null;
    saveState();
    updateProgressViews();
    renderNavigation(elements.sidebarSearch.value);
    renderCourseGrid();
    if (currentLessonId) openLesson(currentLessonId, { updateHash: false });
    showToast('학습 진도를 초기화했습니다.');
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    elements.themeButton.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경');
  }

  function initializeTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved === 'dark' || saved === 'light' ? saved : (systemDark ? 'dark' : 'light'));
  }

  function routeFromHash() {
    const match = location.hash.match(/^#lesson\/(.+)$/);
    if (match) openLesson(decodeURIComponent(match[1]), { updateHash: false });
    else renderHome();
  }

  function updateReadingProgress() {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maximum > 0 ? Math.min(100, Math.max(0, (window.scrollY / maximum) * 100)) : 0;
    elements.readProgress.style.width = `${percent}%`;
  }

  function initializeEvents() {
    elements.navToggle.addEventListener('click', toggleSidebar);
    elements.overlay.addEventListener('click', closeSidebar);
    elements.sidebarSearch.addEventListener('input', (event) => renderNavigation(event.target.value));
    elements.homeButton.addEventListener('click', renderHome);
    elements.brandHome.addEventListener('click', (event) => {
      event.preventDefault();
      renderHome();
    });
    elements.homeStart.addEventListener('click', () => {
      const firstIncomplete = course.find((lesson) => !isCompleted(lesson.id)) || course[0];
      if (firstIncomplete) openLesson(firstIncomplete.id);
    });
    elements.homeResume.addEventListener('click', () => openLesson(elements.homeResume.dataset.lessonId));
    elements.previousLesson.addEventListener('click', () => openLesson(elements.previousLesson.dataset.lessonId));
    elements.nextLesson.addEventListener('click', () => openLesson(elements.nextLesson.dataset.lessonId));
    elements.completeLesson.addEventListener('click', () => {
      if (!currentLessonId) return;
      const nextValue = !isCompleted(currentLessonId);
      setCompleted(currentLessonId, nextValue);
      renderLessonActions(course.find((lesson) => lesson.id === currentLessonId));
      showToast(nextValue ? '학습 완료로 표시했습니다.' : '완료 표시를 해제했습니다.');
    });
    elements.themeButton.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(next === 'dark' ? '다크 모드를 적용했습니다.' : '라이트 모드를 적용했습니다.');
    });
    elements.exportProgress.addEventListener('click', exportProgress);
    elements.importProgressButton.addEventListener('click', () => elements.importProgressInput.click());
    elements.importProgressInput.addEventListener('change', () => importProgress(elements.importProgressInput.files?.[0]));
    elements.resetProgress.addEventListener('click', resetProgress);
    window.addEventListener('hashchange', routeFromHash);
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('resize', updateReadingProgress, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSidebar();
    });
  }

  function initialize() {
    initializeTheme();
    initializeEvents();

    if (!course.length) {
      elements.loadError.hidden = false;
      elements.homeScreen.hidden = true;
      elements.lessonScreen.hidden = true;
      return;
    }

    elements.loadError.hidden = true;
    updateProgressViews();
    renderCourseGrid();
    renderNavigation('');
    routeFromHash();
    updateReadingProgress();
  }

  initialize();
})();
