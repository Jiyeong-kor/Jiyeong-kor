window.RN_COURSE.push(
  {
    id: '05-state-rendering',
    no: 5,
    phase: '2부 · React',
    title: '상태, 렌더링, 불변성의 실제 동작',
    duration: '약 120분',
    minutes: 120,
    level: '필수',
    tags: ['useState', 'state snapshot', 'batching', 'immutability', 'derived state'],
    summary: 'useState를 remember처럼 외우지 않고 상태 스냅샷, 갱신 큐, 불변성 규칙을 통해 React 렌더링을 이해합니다.',
    outcomes: [
      '상태 변수가 현재 렌더링의 스냅샷이라는 뜻을 설명할 수 있습니다.',
      '이전 상태에 의존하는 갱신에 함수형 updater를 사용할 수 있습니다.',
      '객체와 배열 상태를 직접 수정하지 않고 갱신할 수 있습니다.',
      '렌더링 중 계산할 수 있는 파생 값을 별도 state로 저장하지 않을 수 있습니다.'
    ],
    body: `
      <h2>state는 일반 지역 변수와 다릅니다</h2>
      <p>함수 컴포넌트가 호출될 때마다 지역 변수는 새로 만들어집니다. React state는 컴포넌트 함수 밖에서 React가 보관합니다. <code>useState</code>는 현재 렌더링에 해당하는 상태 값과 다음 렌더링을 요청하는 setter를 반환합니다.</p>
      <div class="compare-grid">
        <div class="compare-card"><h3>Compose</h3><p><code>remember { mutableStateOf(...) }</code>는 Composition 위치에 상태를 보관하고 값이 바뀌면 해당 상태를 읽은 범위를 다시 구성합니다.</p></div>
        <div class="compare-card"><h3>React</h3><p><code>useState</code>는 컴포넌트의 Hook 호출 순서에 상태를 연결합니다. setter는 현재 변수를 즉시 바꾸기보다 다음 렌더링을 예약합니다.</p></div>
      </div>

      <h2>현재 렌더링의 값은 스냅샷입니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 같은 값으로 세 번 갱신하는 실수</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function Counter() {
  const [count, setCount] = useState(0);

  function increaseThreeTimes() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  return &lt;Button title={String(count)} onPress={increaseThreeTimes} /&gt;;
}</code></pre>
      </div>
      <p>이 이벤트 핸들러가 만들어진 렌더링에서 count는 0입니다. 세 호출은 모두 1을 요청합니다. 이전 요청 결과에 이어서 계산하려면 setter에 updater 함수를 전달합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 함수형 updater</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function increaseThreeTimes() {
  setCount((previous) =&gt; previous + 1);
  setCount((previous) =&gt; previous + 1);
  setCount((previous) =&gt; previous + 1);
}</code></pre>
      </div>
      <p>React는 이벤트 처리 중 발생한 여러 상태 갱신을 모아 처리할 수 있습니다. 이를 batching이라고 합니다. updater 함수는 큐에 들어온 이전 결과를 순서대로 받기 때문에 연속 갱신이 안전합니다.</p>

      <h2>setter 직후의 변수는 새 값이 아닙니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 상태 스냅샷 확인</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function handlePress() {
  setCount(count + 1);
  console.log(count); // 현재 렌더링의 count가 출력됩니다.
}</code></pre>
      </div>
      <p>새 값이 필요한 로직은 다음 렌더링에서 계산하거나, 현재 이벤트 안에서 명시적인 지역 변수로 계산해야 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 다음 값을 지역 변수로 계산</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function handlePress() {
  const nextCount = count + 1;
  setCount(nextCount);
  analytics.track('count_changed', { count: nextCount });
}</code></pre>
      </div>

      <h2>객체 상태는 새 객체로 교체합니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 폼 상태 갱신</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type FormState = {
  keyword: string;
  regionId: number | null;
};

const [form, setForm] = useState&lt;FormState&gt;({
  keyword: '',
  regionId: null
});

function updateKeyword(keyword: string) {
  setForm((previous) =&gt; ({
    ...previous,
    keyword
  }));
}</code></pre>
      </div>
      <p>중첩 객체가 있다면 변경되는 경로의 각 객체를 새로 만들어야 합니다. 전개 구문은 얕은 복사이므로 깊은 객체 전체를 자동으로 복사하지 않습니다.</p>

      <h2>배열 상태 갱신 패턴</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>목적</th><th>권장 패턴</th><th>피할 변경 연산</th></tr></thead>
          <tbody>
            <tr><td>추가</td><td><code>[...items, newItem]</code></td><td><code>push</code></td></tr>
            <tr><td>삭제</td><td><code>items.filter(...)</code></td><td><code>splice</code></td></tr>
            <tr><td>한 원소 수정</td><td><code>items.map(...)</code></td><td><code>items[index] = ...</code></td></tr>
            <tr><td>정렬</td><td><code>[...items].sort(...)</code></td><td>현재 state 배열에 직접 <code>sort</code></td></tr>
          </tbody>
        </table>
      </div>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 선택 ID 갱신</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const [selectedIds, setSelectedIds] = useState&lt;number[]&gt;([]);

function toggleItem(id: number) {
  setSelectedIds((previous) =&gt;
    previous.includes(id)
      ? previous.filter((selectedId) =&gt; selectedId !== id)
      : [...previous, id]
  );
}</code></pre>
      </div>

      <h2>파생 값은 렌더링 중에 계산합니다</h2>
      <p>전체 품목과 검색어가 state라면 필터링된 목록은 두 state에서 계산할 수 있습니다. 필터 결과까지 별도 state로 저장하면 동기화 지점이 늘어납니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 중복 state를 만들지 않기</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const [items, setItems] = useState&lt;WasteItem[]&gt;([]);
const [keyword, setKeyword] = useState('');

const visibleItems = items.filter((item) =&gt;
  item.name.includes(keyword.trim())
);</code></pre>
      </div>
      <p>계산 비용이 실제로 크고 입력이 자주 바뀌지 않는다는 측정 근거가 있을 때 <code>useMemo</code>를 검토합니다. 단순한 필터와 문자열 조합까지 습관적으로 메모이제이션하지 않습니다.</p>

      <h2>상태를 최소화하는 질문</h2>
      <ol>
        <li>이 값은 props나 다른 state로 계산할 수 있습니까?</li>
        <li>이 값이 바뀌면 화면이 달라져야 합니까?</li>
        <li>두 컴포넌트가 같은 값을 공유해야 합니까?</li>
        <li>상태를 더 가까운 자식에 둘 수 있습니까?</li>
        <li>컴포넌트가 제거될 때 상태도 함께 사라져야 합니까?</li>
      </ol>

      <div class="callout warning">
        <span class="callout-title">Compose의 rememberSaveable을 useState와 동일하게 보면 안 됩니다</span>
        useState는 기본적으로 컴포넌트가 unmount되면 사라집니다. 프로세스 재생성과 화면 복원까지 자동으로 보장하지 않습니다. 복원해야 하는 값은 라우터 상태, URL, 영속 저장소, 플랫폼 상태 복원 전략으로 별도 설계합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>최대 5개 선택 제한이 있는 목록 상태를 작성합니다.</li><li>전체 항목, 검색어, 정렬 기준만 state로 두고 표시 목록은 계산합니다.</li><li>연속 증가 버튼에서 updater 함수의 차이를 확인합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>현재 Compose 앱에서 파생 상태와 원본 상태를 구분합니다.</li><li>state를 직접 변경했을 때 화면이 우연히 갱신되는 사례가 왜 위험한지 설명합니다.</li><li>프로세스 재생성 후 복원해야 할 값과 사라져도 되는 값을 나눕니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '현재 count가 0일 때 같은 이벤트에서 setCount(count + 1)를 세 번 호출했습니다. 일반적으로 요청되는 다음 값은 무엇입니까?',
        options: ['1', '2', '3', '호출할 때마다 무작위입니다.'],
        answer: 0,
        explanation: '현재 렌더링의 count는 세 호출 모두 0이므로 각 호출은 1을 요청합니다. 연속 누적에는 updater 함수를 사용합니다.'
      },
      {
        question: 'items와 keyword에서 계산할 수 있는 visibleItems를 별도 state로 저장하지 않는 주된 이유는 무엇입니까?',
        options: ['TypeScript가 배열 state를 허용하지 않기 때문입니다.', '원본과 파생 state가 서로 어긋날 수 있고 갱신 지점이 늘어나기 때문입니다.', 'filter가 네이티브 코드에서만 동작하기 때문입니다.', 'useState는 문자열에만 사용할 수 있기 때문입니다.'],
        answer: 1,
        explanation: '렌더링 중 계산 가능한 값은 계산하면 원본 상태와 자동으로 일치합니다.'
      },
      {
        question: '현재 state 배열을 정렬해야 할 때 올바른 방법은 무엇입니까?',
        options: ['현재 배열에 sort를 직접 호출합니다.', '배열을 복사한 뒤 복사본에 sort를 호출합니다.', '배열을 const에서 let으로 변경합니다.', 'JSON 문자열로 바꾼 뒤 정렬합니다.'],
        answer: 1,
        explanation: 'sort는 배열을 직접 변경하므로 먼저 새 배열을 만들어야 합니다.'
      }
    ],
    sources: [
      { label: 'React 공식 문서 · State: 컴포넌트의 기억 저장소', url: 'https://ko.react.dev/learn/state-a-components-memory' },
      { label: 'React 공식 문서 · State를 스냅샷처럼 다루기', url: 'https://ko.react.dev/learn/state-as-a-snapshot' },
      { label: 'React 공식 문서 · State 업데이트 큐', url: 'https://ko.react.dev/learn/queueing-a-series-of-state-updates' },
      { label: 'React 공식 문서 · 객체 State 업데이트', url: 'https://ko.react.dev/learn/updating-objects-in-state' },
      { label: 'React 공식 문서 · 배열 State 업데이트', url: 'https://ko.react.dev/learn/updating-arrays-in-state' }
    ]
  },
  {
    id: '06-hooks-effects',
    no: 6,
    phase: '2부 · React',
    title: 'Hook 규칙과 Effect를 정확히 사용하기',
    duration: '약 130분',
    minutes: 130,
    level: '필수',
    tags: ['Hooks', 'useEffect', 'cleanup', 'dependency', 'useRef', 'Strict Mode'],
    summary: 'useEffect를 LaunchedEffect의 단순 대체품으로 쓰지 않고 외부 시스템 동기화와 이벤트 처리의 경계를 구분합니다.',
    outcomes: [
      'Hook을 조건문과 반복문 안에서 호출하면 안 되는 이유를 설명할 수 있습니다.',
      '이벤트 핸들러와 Effect의 책임을 구분할 수 있습니다.',
      'Effect 의존성과 cleanup을 올바르게 작성할 수 있습니다.',
      '개발 모드에서 Effect가 다시 실행되는 이유를 이해하고 안전한 코드를 작성할 수 있습니다.'
    ],
    body: `
      <h2>Hook은 React 기능을 연결하는 특별한 함수입니다</h2>
      <p><code>useState</code>, <code>useEffect</code>, <code>useReducer</code>, <code>useContext</code>, <code>useRef</code>처럼 이름이 use로 시작하는 함수는 Hook입니다. React는 컴포넌트가 Hook을 호출한 <strong>순서</strong>를 이용해 각 상태와 Effect를 연결합니다.</p>
      <div class="callout danger">
        <span class="callout-title">Hook의 핵심 규칙</span>
        Hook은 함수 컴포넌트 또는 Custom Hook의 최상위에서 호출합니다. 조건문, 반복문, 중첩 함수, 이벤트 핸들러 안에서 호출하지 않습니다.
      </div>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 잘못된 조건부 Hook</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function Profile({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    // 호출 순서가 렌더링마다 달라질 수 있습니다.
    const [name, setName] = useState('');
  }

  return null;
}</code></pre>
      </div>
      <p>조건이 필요한 경우 Hook은 항상 호출하고, Hook이 반환한 값이나 Effect 내부에서 조건을 처리하거나 하위 컴포넌트로 분리합니다.</p>

      <h2>Effect는 외부 시스템과 동기화할 때 사용합니다</h2>
      <p>React 공식 문서는 Effect를 컴포넌트를 외부 시스템과 동기화하는 수단으로 설명합니다. 외부 시스템에는 네트워크 연결, 구독, 타이머, 브라우저 또는 네이티브 API, 서드파티 위젯이 포함됩니다.</p>
      <p>화면에 표시할 문자열 계산, 배열 필터링, props 변경에 따른 state 재설정처럼 렌더링만으로 처리할 수 있는 작업은 Effect가 필요하지 않습니다.</p>

      <div class="compare-grid">
        <div class="compare-card"><h3>사용자 이벤트</h3><p>버튼을 눌러 저장, 삭제, 결제, 공유를 시작하는 작업은 이벤트 핸들러에 둡니다. 작업이 발생한 원인이 사용자 동작이기 때문입니다.</p></div>
        <div class="compare-card"><h3>외부 동기화</h3><p>화면이 표시되어 있는 동안 위치 구독을 유지하거나 채팅 연결을 관리하는 작업은 Effect에 둡니다. 컴포넌트의 존재와 동기화해야 하기 때문입니다.</p></div>
      </div>

      <h2>의존성 배열은 선택적인 최적화 목록이 아닙니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 구독과 cleanup</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function ConnectionStatus({ roomId }: { roomId: string }) {
  const [connected, setConnected] = useState(false);

  useEffect(() =&gt; {
    const connection = createConnection(roomId);

    connection.onConnected(() =&gt; setConnected(true));
    connection.connect();

    return () =&gt; {
      connection.disconnect();
    };
  }, [roomId]);

  return &lt;Text&gt;{connected ? '연결됨' : '연결 중'}&lt;/Text&gt;;
}</code></pre>
      </div>
      <p>Effect 내부에서 읽은 reactive value인 roomId가 의존성에 포함됩니다. roomId가 바뀌면 React는 이전 cleanup을 실행하고 새 roomId로 Effect를 다시 실행합니다. 의존성을 임의로 생략하면 Effect가 오래된 값과 동기화될 수 있습니다.</p>

      <h2>cleanup은 unmount 때만 실행되는 것이 아닙니다</h2>
      <p>cleanup은 컴포넌트가 제거될 때 실행됩니다. 또한 의존성이 바뀌어 Effect를 다시 실행하기 직전에도 이전 Effect의 cleanup이 실행됩니다. 따라서 cleanup은 해당 Effect가 만든 구독, 타이머, 연결을 정확히 되돌려야 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 타이머 정리</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>useEffect(() =&gt; {
  const timerId = setInterval(() =&gt; {
    refreshStatus();
  }, 10_000);

  return () =&gt; clearInterval(timerId);
}, []);</code></pre>
      </div>

      <h2>데이터 요청의 경쟁 상태를 막습니다</h2>
      <p>검색어가 빠르게 바뀌면 이전 요청이 나중 요청보다 늦게 완료될 수 있습니다. 이전 요청을 취소하거나 무시하지 않으면 오래된 결과가 화면을 덮어쓸 수 있습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · AbortController를 사용하는 Effect</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>useEffect(() =&gt; {
  if (!keyword.trim()) return;

  const controller = new AbortController();

  async function load() {
    try {
      const response = await fetch(
        'https://example.com/search?q=' + encodeURIComponent(keyword),
        { signal: controller.signal }
      );
      const data = await response.json();
      setItems(data);
    } catch (error) {
      if (error instanceof Error &amp;&amp; error.name !== 'AbortError') {
        setError(error.message);
      }
    }
  }

  load();
  return () =&gt; controller.abort();
}, [keyword]);</code></pre>
      </div>
      <p>실무에서는 검색 버튼 이벤트에서 요청하거나 서버 상태 라이브러리를 사용하는 선택도 가능합니다. 중요한 점은 Effect를 사용했다면 요청과 컴포넌트 수명 사이의 경계를 명확히 관리하는 것입니다.</p>

      <h2>개발 모드의 Strict Mode 재실행</h2>
      <p>React 개발 모드에서는 cleanup 누락을 찾기 위해 컴포넌트와 Effect를 추가로 실행할 수 있습니다. “한 번만 실행되어야 한다”는 가정으로 cleanup 없이 연결을 만들면 개발 중 중복 구독이 드러납니다. 이 동작을 막기보다 Effect를 다시 실행해도 안전하도록 고칩니다.</p>

      <h2>useRef는 렌더링에 필요하지 않은 값을 보관합니다</h2>
      <p>ref 값이 바뀌어도 렌더링은 예약되지 않습니다. TextInput 포커스, 타이머 ID, 이전 측정값처럼 화면 출력에 직접 반영할 필요가 없는 값을 보관할 때 사용합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · TextInput 포커스</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const inputRef = useRef&lt;TextInput&gt;(null);

function focusSearch() {
  inputRef.current?.focus();
}

return &lt;TextInput ref={inputRef} /&gt;;</code></pre>
      </div>

      <h2>Compose Effect API와 일대일 대응하지 않습니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Compose</th><th>React에서 가까운 개념</th><th>중요한 차이</th></tr></thead>
          <tbody>
            <tr><td><code>LaunchedEffect(key)</code></td><td><code>useEffect</code> 또는 이벤트 핸들러</td><td>React Effect는 Coroutine scope가 아닙니다. 사용자 이벤트 작업은 Effect보다 이벤트에 둡니다.</td></tr>
            <tr><td><code>DisposableEffect</code></td><td><code>useEffect</code> cleanup</td><td>의존성 변경 전에도 cleanup이 실행됩니다.</td></tr>
            <tr><td><code>remember</code></td><td><code>useMemo</code>, <code>useRef</code>, <code>useState</code></td><td>세 API의 목적이 다르므로 값의 성격에 따라 고릅니다.</td></tr>
            <tr><td><code>rememberUpdatedState</code></td><td>ref 또는 Effect Event 등</td><td>Effect를 다시 연결하지 않고 최신 값을 읽는 목적을 먼저 판단해야 합니다.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="callout warning">
        <span class="callout-title">Effect로 state를 복사하지 않습니다</span>
        props의 item을 localItem state로 복사하고 item이 바뀔 때마다 Effect에서 다시 넣는 패턴은 두 상태의 소유권을 복잡하게 만듭니다. 편집 초깃값이 필요하다면 컴포넌트 key로 새 편집 세션을 만들거나 명확한 초기화 이벤트를 설계합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>AppState 구독을 Effect로 연결하고 cleanup합니다.</li><li>검색 요청에 AbortController를 연결합니다.</li><li>필터 결과를 Effect로 state에 저장한 코드를 렌더링 계산으로 바꿉니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>현재 코드의 각 Effect가 어떤 외부 시스템과 동기화하는지 말합니다.</li><li>사용자 클릭 처리와 화면 진입 동기화를 구분합니다.</li><li>Strict Mode에서 중복 실행될 때 깨지는 코드를 한 가지 찾습니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'Effect를 사용하기에 가장 적절한 작업은 무엇입니까?',
        options: ['firstName과 lastName을 합쳐 fullName을 계산합니다.', 'items와 keyword로 필터 목록을 계산합니다.', '화면이 존재하는 동안 네트워크 상태 구독을 연결하고 해제합니다.', '버튼을 누른 직후 주문 요청을 전송합니다.'],
        answer: 2,
        explanation: '컴포넌트의 존재와 외부 구독을 동기화하는 작업은 Effect의 대표적인 용도입니다.'
      },
      {
        question: 'Effect cleanup은 언제 실행됩니까?',
        options: ['앱 프로세스가 종료될 때만 실행됩니다.', '컴포넌트 unmount와 Effect 재실행 전 모두 실행될 수 있습니다.', '사용자가 버튼을 눌렀을 때만 실행됩니다.', '의존성 배열이 비어 있으면 절대 실행되지 않습니다.'],
        answer: 1,
        explanation: 'React는 의존성 변경으로 새 Effect를 실행하기 전에 이전 Effect를 정리하고, unmount 때도 정리합니다.'
      },
      {
        question: 'Hook을 조건문 안에서 호출하면 안 되는 이유는 무엇입니까?',
        options: ['TypeScript가 if 문을 지원하지 않기 때문입니다.', 'React가 렌더링 사이의 Hook 호출 순서로 상태를 연결하기 때문입니다.', 'Hook은 네이티브 코드에서만 호출할 수 있기 때문입니다.', '조건문은 성능이 느리기 때문입니다.'],
        answer: 1,
        explanation: '조건에 따라 호출 순서가 달라지면 React가 어느 state와 Effect가 어느 Hook인지 일관되게 연결할 수 없습니다.'
      }
    ],
    sources: [
      { label: 'React 공식 문서 · Hook 규칙', url: 'https://ko.react.dev/reference/rules/rules-of-hooks' },
      { label: 'React 공식 문서 · Effect로 동기화하기', url: 'https://ko.react.dev/learn/synchronizing-with-effects' },
      { label: 'React 공식 문서 · Effect가 필요하지 않은 경우', url: 'https://ko.react.dev/learn/you-might-not-need-an-effect' },
      { label: 'React 공식 문서 · Effect의 수명주기', url: 'https://ko.react.dev/learn/lifecycle-of-reactive-effects' },
      { label: 'React 공식 문서 · useRef', url: 'https://ko.react.dev/reference/react/useRef' }
    ]
  },
  {
    id: '07-state-architecture',
    no: 7,
    phase: '2부 · React',
    title: '상태 소유권, reducer, Context, Custom Hook',
    duration: '약 125분',
    minutes: 125,
    level: '필수',
    tags: ['state ownership', 'useReducer', 'Context', 'Custom Hook', 'MVVM'],
    summary: 'Compose의 ViewModel 구조를 그대로 복제하지 않고 React의 상태 배치 원칙으로 화면과 기능 경계를 설계합니다.',
    outcomes: [
      '각 상태를 어느 컴포넌트가 소유해야 하는지 결정할 수 있습니다.',
      '여러 상태 갱신이 하나의 사건으로 묶일 때 useReducer를 사용할 수 있습니다.',
      'Context를 props 전달 생략 수단으로 사용하되 무분별한 전역 상태를 피할 수 있습니다.',
      '상태 로직과 외부 연동을 Custom Hook으로 재사용할 수 있습니다.'
    ],
    body: `
      <h2>먼저 상태의 단일 소유자를 정합니다</h2>
      <p>같은 상태를 두 컴포넌트가 독립적으로 가지고 서로 맞추려고 하면 동기화 문제가 생깁니다. 두 컴포넌트가 같은 값을 필요로 한다면 가장 가까운 공통 부모가 상태를 소유하고 값과 callback을 자식에게 전달합니다. React에서는 이를 state 끌어올리기라고 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 공통 부모가 선택 상태 소유</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function SearchScreen() {
  const [selectedId, setSelectedId] = useState&lt;number | null&gt;(null);

  return (
    &lt;View&gt;
      &lt;ItemList
        selectedId={selectedId}
        onSelect={setSelectedId}
      /&gt;
      &lt;SelectionSummary selectedId={selectedId} /&gt;
    &lt;/View&gt;
  );
}</code></pre>
      </div>

      <h2>상태를 어디에 둘지 결정하는 순서</h2>
      <ol>
        <li>상태를 읽는 모든 컴포넌트를 찾습니다.</li>
        <li>그 컴포넌트들의 가장 가까운 공통 부모를 찾습니다.</li>
        <li>그 부모나 부모 위의 별도 상태 컴포넌트에 state를 둡니다.</li>
        <li>필요한 값과 이벤트만 props로 전달합니다.</li>
        <li>전달 단계가 지나치게 깊고 여러 하위 트리가 같은 값을 읽을 때 Context를 검토합니다.</li>
      </ol>

      <h2>useReducer는 상태 변경 규칙을 한곳에 모읍니다</h2>
      <p>여러 state가 한 사용자 사건에 함께 바뀌거나 상태 전이가 복잡하면 reducer가 유리합니다. reducer는 현재 state와 action을 받아 다음 state를 반환하는 순수 함수입니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 검색 화면 reducer</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type SearchState = {
  keyword: string;
  selectedIds: number[];
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string | null;
};

type SearchAction =
  | { type: 'keywordChanged'; keyword: string }
  | { type: 'itemToggled'; id: number }
  | { type: 'requestStarted' }
  | { type: 'requestFailed'; message: string };

function searchReducer(
  state: SearchState,
  action: SearchAction
): SearchState {
  switch (action.type) {
    case 'keywordChanged':
      return { ...state, keyword: action.keyword };
    case 'itemToggled':
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.id)
          ? state.selectedIds.filter((id) =&gt; id !== action.id)
          : [...state.selectedIds, action.id]
      };
    case 'requestStarted':
      return { ...state, status: 'loading', message: null };
    case 'requestFailed':
      return { ...state, status: 'error', message: action.message };
  }
}</code></pre>
      </div>
      <p>action 이름은 setter 이름보다 도메인 사건을 표현합니다. <code>setLoading(true)</code>, <code>setError(null)</code>처럼 여러 setter를 호출하는 대신 <code>dispatch({ type: 'requestStarted' })</code>가 하나의 전이를 설명합니다.</p>

      <h2>Context는 상태 저장소 자체가 아닙니다</h2>
      <p>Context는 상위 컴포넌트가 제공한 값을 깊은 하위 컴포넌트가 props를 단계마다 전달하지 않고 읽게 합니다. 상태는 여전히 useState, useReducer 또는 외부 저장소가 소유합니다. Context는 전달 통로입니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · reducer와 Context 조합</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const SearchStateContext = createContext&lt;SearchState | null&gt;(null);
const SearchDispatchContext = createContext&lt;Dispatch&lt;SearchAction&gt; | null&gt;(null);

function SearchProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  return (
    &lt;SearchStateContext.Provider value={state}&gt;
      &lt;SearchDispatchContext.Provider value={dispatch}&gt;
        {children}
      &lt;/SearchDispatchContext.Provider&gt;
    &lt;/SearchStateContext.Provider&gt;
  );
}</code></pre>
      </div>
      <p>값과 dispatch Context를 나누면 dispatch만 읽는 컴포넌트가 state 변경에 불필요하게 다시 렌더링되는 범위를 줄이는 데 도움이 될 수 있습니다. 그러나 최적화는 프로파일링 결과를 보고 적용합니다.</p>

      <h2>Custom Hook은 상태 로직을 재사용합니다</h2>
      <p>Custom Hook은 UI를 반환하지 않고 React state, Effect, Context를 조합하여 기능을 캡슐화합니다. 이름은 use로 시작해야 합니다. Custom Hook을 호출하는 컴포넌트마다 state는 독립적으로 생성됩니다. Hook이 자동으로 전역 singleton이 되는 것은 아닙니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 네트워크 상태 Custom Hook</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() =&gt; {
    const subscription = subscribeNetwork((nextOnline) =&gt; {
      setOnline(nextOnline);
    });

    return () =&gt; subscription.remove();
  }, []);

  return online;
}</code></pre>
      </div>

      <h2>Compose MVVM을 React에 옮길 때의 기준</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Android에서 익숙한 개념</th><th>React Native에서 고려할 구조</th><th>그대로 복제하면 생기는 문제</th></tr></thead>
          <tbody>
            <tr><td>화면 ViewModel</td><td>화면 컴포넌트, reducer, Custom Hook, 서버 상태 계층의 조합</td><td>작은 입력 상태까지 거대한 전역 객체에 모일 수 있습니다.</td></tr>
            <tr><td>StateFlow UiState</td><td>local state, Context, 외부 store 또는 서버 캐시 구독</td><td>모든 상태를 하나의 union으로 묶으면 입력마다 전체 화면이 갱신될 수 있습니다.</td></tr>
            <tr><td>Repository</td><td>순수 TypeScript 서비스, API client, 네이티브 모듈</td><td>React 컴포넌트 안에 fetch와 매핑 로직이 섞이면 테스트와 재사용이 어려워집니다.</td></tr>
            <tr><td>SavedStateHandle</td><td>route params, URL, 영속 저장소, 라우터 복원</td><td>useState만으로 프로세스 재생성을 복원할 수 있다고 오해할 수 있습니다.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>서버 상태와 클라이언트 상태를 구분합니다</h2>
      <p>서버에서 받은 목록은 다른 화면에서도 다시 필요하고 시간이 지나면 오래되며 재요청과 캐시 무효화가 필요합니다. 반면 현재 탭, 입력 중인 문자열, 모달 열림 여부는 클라이언트 UI 상태입니다. 두 종류를 같은 전역 store에 무조건 복사하면 데이터의 원본과 갱신 책임이 불명확해집니다.</p>
      <ul>
        <li><strong>서버 상태:</strong> 원본이 서버에 있고 로딩, 오류, 재시도, stale, 캐시 문제가 있습니다.</li>
        <li><strong>URL 또는 라우트 상태:</strong> 공유와 복원이 필요한 화면 식별 정보입니다.</li>
        <li><strong>전역 클라이언트 상태:</strong> 인증 세션, 전역 테마처럼 앱 여러 영역이 읽습니다.</li>
        <li><strong>지역 UI 상태:</strong> 폼 입력, 펼침 여부, 임시 선택처럼 가까운 컴포넌트가 소유합니다.</li>
      </ul>

      <div class="callout warning">
        <span class="callout-title">Context를 기본 전역 상태 관리자로 사용하지 않습니다</span>
        Context 값이 바뀌면 해당 값을 읽는 하위 컴포넌트가 다시 렌더링됩니다. 변경 빈도가 높고 선택적 구독이 필요한 큰 상태에는 전용 저장소나 상태 분할을 검토합니다. 먼저 지역 state와 props로 해결 가능한지 확인합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>검색 화면의 상태와 action을 reducer로 모델링합니다.</li><li>Theme Context와 useTheme Hook을 만듭니다.</li><li>API 서비스와 React Hook의 책임을 파일로 분리합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>기존 ViewModel의 각 상태를 서버, 라우트, 전역, 지역 상태로 분류합니다.</li><li>Context가 필요한 값과 props로 충분한 값을 구분합니다.</li><li>하나의 거대한 UiState와 여러 작은 state의 장단점을 비교합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '두 형제 컴포넌트가 같은 선택 ID를 읽고 변경해야 합니다. 가장 먼저 고려할 구조는 무엇입니까?',
        options: ['각 형제가 독립 state를 갖고 Effect로 맞춥니다.', '가장 가까운 공통 부모가 state를 소유하고 props와 callback을 전달합니다.', '무조건 전역 저장소를 설치합니다.', '선택 ID를 전역 변수로 둡니다.'],
        answer: 1,
        explanation: '공유 상태는 가장 가까운 공통 부모로 끌어올리는 것이 기본입니다.'
      },
      {
        question: 'Context의 역할을 가장 정확하게 설명한 것은 무엇입니까?',
        options: ['Context는 자동 영속 데이터베이스입니다.', 'Context는 상태를 하위 트리에 전달하는 통로이며 상태 소유 방식과는 별개입니다.', 'Context를 사용하면 모든 렌더링이 사라집니다.', 'Context는 네이티브 모듈을 생성합니다.'],
        answer: 1,
        explanation: '상태는 useState, useReducer 또는 외부 저장소가 소유하고 Context는 값을 전달합니다.'
      },
      {
        question: 'useReducer가 특히 적합한 상황은 무엇입니까?',
        options: ['고정 문자열 하나만 표시합니다.', '여러 상태 변경이 도메인 사건 하나로 묶이고 전이 규칙이 복잡합니다.', '이미지를 한 장 표시합니다.', '모든 비동기 요청을 자동 캐시하려고 합니다.'],
        answer: 1,
        explanation: 'reducer는 action과 다음 상태 규칙을 한곳에 모아 복잡한 전이를 명확하게 만듭니다.'
      }
    ],
    sources: [
      { label: 'React 공식 문서 · State로 입력에 반응하기', url: 'https://ko.react.dev/learn/reacting-to-input-with-state' },
      { label: 'React 공식 문서 · 컴포넌트 간 State 공유', url: 'https://ko.react.dev/learn/sharing-state-between-components' },
      { label: 'React 공식 문서 · State 보존과 초기화', url: 'https://ko.react.dev/learn/preserving-and-resetting-state' },
      { label: 'React 공식 문서 · reducer로 State 로직 추출', url: 'https://ko.react.dev/learn/extracting-state-logic-into-a-reducer' },
      { label: 'React 공식 문서 · Context로 데이터 깊이 전달', url: 'https://ko.react.dev/learn/passing-data-deeply-with-context' },
      { label: 'React 공식 문서 · Custom Hook으로 로직 재사용', url: 'https://ko.react.dev/learn/reusing-logic-with-custom-hooks' }
    ]
  },
  {
    id: '08-runtime-architecture',
    no: 8,
    phase: '3부 · React Native',
    title: 'Metro, Hermes, Fabric, TurboModules의 역할',
    duration: '약 115분',
    minutes: 115,
    level: '필수',
    tags: ['New Architecture', 'Metro', 'Hermes V1', 'Fabric', 'TurboModules', 'JSI', 'Codegen'],
    summary: '오래된 Bridge 중심 설명을 버리고 현재 React Native 0.86의 실행 구조와 네이티브 경계를 이해합니다.',
    outcomes: [
      'Metro와 Hermes가 각각 빌드 도구와 실행 엔진이라는 점을 구분할 수 있습니다.',
      'Fabric, TurboModules, JSI, Codegen의 책임을 설명할 수 있습니다.',
      'React의 render, commit과 React Native의 native mount 단계를 구분할 수 있습니다.',
      'JavaScript와 Android 메인 스레드 사이의 비용을 고려해 기능 경계를 설계할 수 있습니다.'
    ],
    body: `
      <h2>현재 기준에서는 New Architecture가 선택 사항이 아닙니다</h2>
      <p>React Native 0.82는 New Architecture만 실행하는 첫 버전입니다. React Native 0.86 신규 프로젝트를 학습하면서 Legacy Architecture와 Bridge를 기본 구조처럼 설명하면 현재 동작을 잘못 이해하게 됩니다.</p>
      <div class="callout note">
        <span class="callout-title">역사와 현재를 구분합니다</span>
        과거 React Native는 직렬화된 비동기 Bridge를 중심으로 JavaScript와 Native를 연결했습니다. 현재는 JSI 기반 인터페이스, Fabric Renderer, Turbo Native Modules, Codegen이 중심입니다. 호환 계층 때문에 오래된 라이브러리가 동작할 수 있지만 신규 설계는 현재 구조를 기준으로 합니다.
      </div>

      <h2>각 구성 요소의 책임</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>구성 요소</th><th>역할</th><th>Android 개발자가 연결해서 볼 개념</th></tr></thead>
          <tbody>
            <tr><td><strong>Metro</strong></td><td>TypeScript와 JavaScript 모듈 그래프를 해석하고 번들을 만듭니다.</td><td>Gradle과 역할이 겹치는 부분이 있지만 네이티브 바이너리가 아니라 JS 번들을 담당합니다.</td></tr>
            <tr><td><strong>Hermes V1</strong></td><td>React Native 앱 안에서 JavaScript를 실행하는 엔진입니다.</td><td>ART가 Kotlin 바이트코드를 실행하는 관계와 비슷하지만 언어와 런타임이 다릅니다.</td></tr>
            <tr><td><strong>React Reconciler</strong></td><td>컴포넌트를 호출하고 다음 UI 트리를 계산하며 변경을 조정합니다.</td><td>Compose Runtime의 recomposition과 유사한 목적이 있지만 내부 모델은 다릅니다.</td></tr>
            <tr><td><strong>Fabric</strong></td><td>React Native의 현재 렌더러로 Shadow Tree를 계산하고 플랫폼 뷰 변경을 적용합니다.</td><td>Android View 계층을 생성하고 갱신하는 렌더링 계층</td></tr>
            <tr><td><strong>Yoga</strong></td><td>Flexbox 기반 레이아웃을 계산합니다.</td><td>Compose MeasurePolicy와 같은 레이아웃 계산 책임</td></tr>
            <tr><td><strong>JSI</strong></td><td>JavaScript 엔진과 C++ 또는 네이티브 기능 사이의 저수준 인터페이스를 제공합니다.</td><td>JNI와 목적이 일부 비슷하지만 React Native 런타임 내부의 JS 인터페이스입니다.</td></tr>
            <tr><td><strong>TurboModules</strong></td><td>JavaScript에서 네이티브 기능을 타입 안전하게 호출하는 모듈 시스템입니다.</td><td>Kotlin SDK를 React Native에 노출하는 경계</td></tr>
            <tr><td><strong>Codegen</strong></td><td>TypeScript 또는 Flow 명세에서 C++와 플랫폼별 접착 코드를 생성합니다.</td><td>KSP나 Room 코드 생성처럼 반복적인 경계 코드를 빌드 시 생성합니다.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>렌더링은 세 단계로 생각합니다</h2>
      <ol>
        <li><strong>Render:</strong> React가 컴포넌트 함수를 호출해 다음 React Element Tree를 계산합니다.</li>
        <li><strong>Commit:</strong> 변경할 내용을 확정하고 React Native Renderer의 Shadow Tree 갱신을 준비합니다.</li>
        <li><strong>Mount:</strong> 계산된 변경이 Android 또는 iOS의 실제 네이티브 뷰 계층에 적용됩니다.</li>
      </ol>
      <p>Render는 중단되거나 다시 시작될 수 있으므로 순수해야 합니다. 외부 시스템을 변경하는 코드를 render에 두면 React가 렌더링을 재시도할 때 중복 실행될 수 있습니다.</p>

      <h2>Shadow Tree와 Yoga</h2>
      <p>React Native는 JavaScript에서 JSX를 실행할 때 Android View를 곧바로 하나씩 조작하는 방식으로만 이해하면 안 됩니다. Fabric은 네이티브 측 Shadow Tree를 사용해 UI 구조와 props를 표현하고 Yoga가 레이아웃을 계산합니다. 이후 필요한 뷰 변경을 플랫폼에 적용합니다.</p>
      <div class="callout success">
        <span class="callout-title">Compose 개발자에게 중요한 결론</span>
        상태가 바뀔 때 전체 화면을 무조건 새 Android View로 다시 만든다고 생각하지 않습니다. React와 Fabric은 트리 차이를 계산하고 필요한 변경을 적용합니다. 다만 컴포넌트 함수는 다시 호출될 수 있으므로 계산 비용과 참조 안정성은 여전히 중요합니다.
      </div>

      <h2>스레드 모델을 지나치게 단순화하지 않습니다</h2>
      <p>실무 설명에서는 JavaScript Thread, UI Thread, Native Module Thread라는 세 줄 그림을 자주 봅니다. 이 그림은 입문에는 도움이 되지만 모든 모듈과 플랫폼의 실제 실행 규칙을 보장하지 않습니다.</p>
      <ul>
        <li>JavaScript는 Hermes 런타임이 실행하는 스레드에서 동작합니다.</li>
        <li>Android View 변경은 Android 메인 스레드의 규칙을 따라야 합니다.</li>
        <li>네이티브 모듈은 구현과 API에 따라 메인 스레드 또는 백그라운드 실행이 필요합니다.</li>
        <li>비동기 네트워크와 파일 I/O는 플랫폼 라이브러리가 별도 스레드와 큐를 사용할 수 있습니다.</li>
        <li>JavaScript와 Native 경계를 매우 자주 왕복하거나 큰 데이터를 반복 변환하면 비용이 생깁니다.</li>
      </ul>

      <h2>Hermes V1의 의미</h2>
      <p>Hermes는 React Native에 최적화된 JavaScript 엔진입니다. React Native 0.84부터 Hermes V1이 기본입니다. JavaScript 소스를 실행하는 엔진이므로 Kotlin 코드가 Hermes에서 실행되는 것은 아닙니다. Kotlin 네이티브 모듈은 Android 런타임에서 실행되고 JSI와 생성된 경계를 통해 JavaScript에 노출됩니다.</p>

      <h2>Metro가 처리하는 것과 Gradle이 처리하는 것</h2>
      <div class="compare-grid">
        <div class="compare-card"><h3>Metro</h3><p>import 그래프, TypeScript 변환, JavaScript 번들, Fast Refresh, 개발 서버를 담당합니다.</p></div>
        <div class="compare-card"><h3>Gradle</h3><p>Android 리소스, Manifest, Kotlin과 Java, 네이티브 라이브러리, 서명, APK와 AAB를 담당합니다.</p></div>
      </div>
      <p>Release Android 빌드에서는 React Native Gradle Plugin이 Metro를 호출해 JavaScript 번들과 이미지 자산을 앱 패키지에 포함합니다. 따라서 release 앱은 개발 Metro 서버가 없어도 실행됩니다.</p>

      <h2>Native 경계는 타입 명세부터 설계합니다</h2>
      <p>Turbo Native Module과 Fabric Native Component는 TypeScript spec을 통해 JavaScript 측 계약을 선언합니다. Codegen은 이 명세에서 공통 C++ 접착 코드와 플랫폼별 기반 코드를 생성합니다. Kotlin 구현은 생성된 추상 spec을 구현합니다. 17강과 18강에서 실제 예제를 작성합니다.</p>

      <div class="callout warning">
        <span class="callout-title">성능 문제를 모두 Bridge 탓으로 돌리지 않습니다</span>
        현재 앱의 끊김은 과도한 JavaScript 계산, 큰 목록의 잘못된 렌더링, 이미지 처리, 메인 스레드 네이티브 작업, 불필요한 상태 갱신 등 여러 원인에서 발생할 수 있습니다. DevTools와 프로파일러로 실제 병목을 확인해야 합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>프로젝트의 Metro 시작 로그와 Android Gradle 빌드 로그를 구분합니다.</li><li>React Native DevTools에서 컴포넌트 트리와 성능 기록을 확인합니다.</li><li>Fabric, TurboModules, JSI, Codegen의 관계를 직접 그림으로 정리합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>과거 Bridge 설명과 현재 New Architecture 설명의 차이를 말합니다.</li><li>기존 Kotlin SDK를 어느 단위로 TurboModule에 노출할지 논의합니다.</li><li>JavaScript와 Native 사이에 큰 객체를 매 프레임 전달하면 왜 위험한지 설명합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'Metro와 Hermes의 역할을 올바르게 연결한 것은 무엇입니까?',
        options: ['Metro는 JavaScript 엔진이고 Hermes는 Android 빌드 도구입니다.', 'Metro는 JS 번들러이고 Hermes는 JS 실행 엔진입니다.', '둘 다 Android View 렌더러입니다.', '둘 다 Kotlin 코드 생성기입니다.'],
        answer: 1,
        explanation: 'Metro는 모듈을 변환하고 번들로 만들며 Hermes는 앱 안에서 JavaScript를 실행합니다.'
      },
      {
        question: 'Codegen의 주된 역할은 무엇입니까?',
        options: ['React 컴포넌트의 CSS를 자동 디자인합니다.', '타입 명세에서 네이티브 모듈과 컴포넌트 경계의 반복 코드를 생성합니다.', 'Play Store 서명 키를 생성합니다.', '서버 API 응답을 자동 캐시합니다.'],
        answer: 1,
        explanation: 'Codegen은 TypeScript 또는 Flow spec에서 C++와 플랫폼별 접착 코드를 생성합니다.'
      },
      {
        question: '현재 React Native 0.86 학습에서 가장 적절한 아키텍처 관점은 무엇입니까?',
        options: ['Legacy Bridge가 기본이고 New Architecture는 선택 기능입니다.', 'New Architecture가 현재 기본이며 신규 설계는 Fabric과 TurboModules를 기준으로 합니다.', 'React Native는 HTML을 WebView에 그립니다.', '모든 JavaScript가 Android 메인 스레드에서만 실행됩니다.'],
        answer: 1,
        explanation: 'React Native 0.82부터 New Architecture만 실행하며 0.86 신규 프로젝트도 이를 기준으로 합니다.'
      }
    ],
    sources: [
      { label: 'React Native 0.82 · New Architecture Only', url: 'https://reactnative.dev/blog/2025/10/08/react-native-0.82' },
      { label: 'React Native 0.84 · Hermes V1 기본화', url: 'https://reactnative.dev/blog/2026/02/11/react-native-0.84' },
      { label: 'React Native 공식 아키텍처 개요', url: 'https://reactnative.dev/architecture/landing-page' },
      { label: 'React Native 공식 문서 · Codegen이란 무엇인가', url: 'https://reactnative.dev/docs/the-new-architecture/what-is-codegen' },
      { label: 'React Native 공식 문서 · Renderer 렌더 파이프라인', url: 'https://reactnative.dev/architecture/render-pipeline' },
      { label: 'Metro 공식 문서', url: 'https://metrobundler.dev/docs/' }
    ]
  }
);
