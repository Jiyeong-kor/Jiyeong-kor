window.RN_COURSE.push(
  {
    id: '13-navigation-deeplink',
    no: 13,
    phase: '4부 · 앱 구조',
    title: '내비게이션, 딥 링크, Android 뒤로가기',
    duration: '약 135분',
    minutes: 135,
    level: '필수',
    tags: ['Expo Router', 'React Navigation', 'Stack', 'Tabs', 'Deep Link', 'BackHandler'],
    summary: 'Compose Navigation의 그래프 개념을 React Native 라우팅에 연결하고 화면 수명주기, 타입이 있는 파라미터, 딥 링크와 Android 뒤로가기를 함께 설계합니다.',
    outcomes: [
      'Stack, Tabs, Modal이 서로 다른 탐색 책임을 가진다는 점을 설명할 수 있습니다.',
      'Expo Router와 React Navigation의 관계를 설명하고 프로젝트에 맞는 방식을 선택할 수 있습니다.',
      '라우트 파라미터에는 복원 가능한 최소 식별 정보만 전달할 수 있습니다.',
      'Android 시스템 뒤로가기와 딥 링크 입력을 안전하게 처리할 수 있습니다.'
    ],
    body: `
      <h2>내비게이션은 화면을 바꾸는 함수가 아니라 상태 모델입니다</h2>
      <p>모바일 내비게이션은 현재 화면 하나만 표현하지 않습니다. 사용자가 어떤 경로로 들어왔는지, 뒤로가기를 누르면 어디로 돌아갈지, 앱이 종료되었다가 복원될 때 어떤 화면을 다시 보여 줄지까지 포함합니다. React Native에서는 React Navigation이 기본적인 내비게이션 primitives를 제공하고, Expo Router는 React Navigation 위에 파일 기반 라우팅과 딥 링크 구성을 제공합니다.</p>

      <div class="compare-grid">
        <div class="compare-card"><h3>Compose Navigation</h3><p>NavHost에 route를 등록하고 NavController가 back stack을 관리합니다. route argument와 SavedStateHandle을 함께 사용합니다.</p></div>
        <div class="compare-card"><h3>React Native</h3><p>Stack, Tabs, Drawer 같은 navigator가 navigation state를 관리합니다. Expo Router에서는 파일 경로가 route가 되며 내부적으로 React Navigation을 사용합니다.</p></div>
      </div>

      <h2>Expo Router와 React Navigation을 어떻게 선택합니까?</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>선택</th><th>적합한 상황</th><th>고려할 점</th></tr></thead>
          <tbody>
            <tr><td><strong>Expo Router</strong></td><td>Expo 신규 앱, URL과 딥 링크를 기본 구조로 삼고 싶을 때, 파일 기반 화면 구성을 선호할 때</td><td>파일 구조가 route 계약이 됩니다. layout 파일과 route group 규칙을 팀이 함께 이해해야 합니다.</td></tr>
            <tr><td><strong>React Navigation 직접 구성</strong></td><td>기존 React Native 프로젝트, navigator를 코드로 명시하고 싶을 때, 기존 앱 구조와 점진적으로 통합할 때</td><td>linking 설정과 타입 정의를 직접 구성하는 범위가 더 큽니다.</td></tr>
            <tr><td><strong>기존 Android 앱 안의 단일 RN 화면</strong></td><td>ReactActivity 또는 ReactRootView 한두 개만 넣는 brownfield 통합</td><td>앱 전체 탐색은 기존 NavController가 소유하고 RN 내부 탐색 범위를 제한할 수 있습니다.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Stack, Tabs, Modal의 책임을 분리합니다</h2>
      <ul>
        <li><strong>Stack:</strong> 목록에서 상세로 이동하는 것처럼 앞뒤 순서가 있는 탐색을 표현합니다.</li>
        <li><strong>Tabs:</strong> 홈, 지도, 안내, 저장처럼 앱의 최상위 목적지를 전환합니다. 각 탭의 내부 stack을 유지할 수 있습니다.</li>
        <li><strong>Modal:</strong> 현재 맥락 위에 일시적인 작업을 올립니다. 단순히 디자인이 떠 보인다는 이유만으로 modal route를 남용하지 않습니다.</li>
        <li><strong>Drawer:</strong> 많은 최상위 목적지나 보조 메뉴를 제공할 때 검토합니다. 모바일 핵심 탐색에는 탭이 더 직접적일 수 있습니다.</li>
      </ul>

      <h2>Expo Router의 기본 파일 구조</h2>
      <div class="code-wrap">
        <div class="code-label"><span>파일 구조 · 탭 안의 상세 Stack</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>app/
├─ _layout.tsx
├─ (tabs)/
│  ├─ _layout.tsx
│  ├─ index.tsx
│  ├─ map.tsx
│  └─ saved.tsx
├─ item/
│  └─ [id].tsx
└─ settings.tsx</code></pre>
      </div>
      <p>괄호로 감싼 route group은 URL 경로에 나타나지 않으면서 파일을 구조화합니다. 대괄호 파일은 동적 segment입니다. <code>item/[id].tsx</code>는 품목 ID를 받아 상세 화면을 구성합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · Expo Router로 상세 이동</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import { router } from 'expo-router';

function openItem(id: number) {
  router.push({
    pathname: '/item/[id]',
    params: { id: String(id) }
  });
}</code></pre>
      </div>

      <h2>라우트 파라미터에는 최소 정보만 전달합니다</h2>
      <p>상세 화면에 품목 객체 전체를 전달하면 URL 직렬화, 프로세스 복원, 데이터 최신성, 타입 변경이 복잡해집니다. route에는 ID나 필터 문자열처럼 <strong>직렬화 가능하고 화면을 다시 구성할 수 있는 최소 정보</strong>를 전달합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 동적 route 파라미터 읽기</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import { useLocalSearchParams } from 'expo-router';

export default function ItemDetailScreen() {
  const params = useLocalSearchParams&lt;{ id?: string | string[] }&gt;();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const itemId = Number(rawId);

  if (!Number.isInteger(itemId) || itemId &lt;= 0) {
    return &lt;InvalidRouteView /&gt;;
  }

  return &lt;ItemDetail itemId={itemId} /&gt;;
}</code></pre>
      </div>
      <div class="callout warning">
        <span class="callout-title">route 파라미터도 외부 입력입니다</span>
        TypeScript generic은 실제 URL 값을 검증하지 않습니다. 딥 링크, 알림, 외부 앱이 잘못된 문자열을 전달할 수 있으므로 숫자 범위와 허용 문자열을 런타임에 검사합니다.
      </div>

      <h2>화면이 focus되었다고 새로 mount된 것은 아닙니다</h2>
      <p>Stack에서 다음 화면으로 이동해도 이전 화면 컴포넌트가 계속 mount된 채로 남을 수 있습니다. 탭 화면도 전환 후 보존될 수 있습니다. 따라서 컴포넌트 mount와 사용자가 현재 화면을 보고 있는 focus 상태를 구분해야 합니다.</p>
      <ul>
        <li>컴포넌트가 존재하는 동안 유지해야 하는 구독은 일반 Effect에서 관리합니다.</li>
        <li>화면이 focus될 때만 필요한 작업은 라우터 또는 React Navigation의 focus API를 검토합니다.</li>
        <li>화면에 돌아올 때마다 서버 데이터를 무조건 재요청하기보다 캐시 만료와 사용자 새로고침 정책을 둡니다.</li>
        <li>focus callback 안에서도 cleanup과 의존성을 정확히 관리합니다.</li>
      </ul>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · React Navigation의 focus 작업</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>useFocusEffect(
  useCallback(() =&gt; {
    analytics.screen('saved_items');

    const subscription = repository.observeSavedItems(setItems);
    return () =&gt; subscription.remove();
  }, [repository])
);</code></pre>
      </div>

      <h2>Android 시스템 뒤로가기의 기본 규칙을 존중합니다</h2>
      <p>React Navigation과 Expo Router는 일반적인 stack 뒤로가기를 처리합니다. 화면마다 BackHandler를 등록해 기본 동작을 가로채면 예측하기 어려운 탐색이 됩니다. 사용자에게 버릴 수 없는 편집 내용이 있거나 선택 모드를 먼저 종료해야 하는 경우처럼 명확한 상태가 있을 때만 처리합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 선택 모드에서만 뒤로가기 소비</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>useEffect(() =&gt; {
  const subscription = BackHandler.addEventListener(
    'hardwareBackPress',
    () =&gt; {
      if (!selectionMode) return false;
      setSelectionMode(false);
      return true;
    }
  );

  return () =&gt; subscription.remove();
}, [selectionMode]);</code></pre>
      </div>
      <p>handler가 <code>true</code>를 반환하면 이벤트를 소비하고 기본 뒤로가기를 막습니다. <code>false</code>를 반환하면 다음 handler 또는 시스템 기본 동작으로 전달합니다. Modal이 표시된 동안에는 BackHandler 이벤트 전달 방식이 다를 수 있으므로 Modal의 onRequestClose도 구현합니다.</p>

      <h2>딥 링크와 Android App Link</h2>
      <p>딥 링크는 URL로 특정 화면을 여는 기능입니다. 사용자 정의 scheme은 <code>myapp://item/10</code>처럼 앱 고유 주소를 사용합니다. Android App Link는 검증된 HTTPS 도메인을 앱과 연결하여 브라우저 선택창 없이 앱을 열 수 있게 합니다.</p>
      <ol>
        <li>앱의 scheme 또는 HTTPS host와 path를 정의합니다.</li>
        <li>Expo app config 또는 Android Manifest에 intent filter를 구성합니다.</li>
        <li>웹 도메인에는 <code>.well-known/assetlinks.json</code>을 게시합니다.</li>
        <li>라우터가 URL을 화면과 파라미터로 변환하도록 설정합니다.</li>
        <li>허용되지 않은 path와 파라미터를 거부합니다.</li>
        <li>로그인 전 딥 링크라면 인증 후 원래 목적지로 복귀하는 정책을 둡니다.</li>
      </ol>
      <div class="callout danger">
        <span class="callout-title">딥 링크를 권한으로 착각하지 않습니다</span>
        URL을 알고 있다고 해당 데이터에 접근할 권한이 생기는 것은 아닙니다. 목적지 화면에서 인증과 인가를 다시 확인하고, 결제·삭제 같은 민감한 동작을 URL 진입만으로 즉시 실행하지 않습니다.
      </div>

      <h2>내비게이션 상태 복원 기준</h2>
      <p>개발 중 Fast Refresh와 실제 프로세스 종료 후 복원은 다릅니다. 복원해야 하는 핵심 화면은 URL 또는 route로 표현하고, 서버에서 다시 읽을 수 있는 데이터는 ID로 재구성합니다. 매우 깊은 임시 stack 전체를 무조건 영속화하면 앱 버전 변경 후 오래된 route와 충돌할 수 있습니다.</p>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>탭 3개와 품목 상세 route를 만듭니다.</li><li>상세 route의 id를 런타임에 검증합니다.</li><li>선택 모드에서만 Android 뒤로가기를 소비합니다.</li><li>사용자 정의 scheme으로 상세 화면을 직접 엽니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>기존 Compose 앱의 NavHost를 Stack, Tabs, Modal로 다시 분류합니다.</li><li>각 route에 반드시 필요한 최소 파라미터를 정합니다.</li><li>로그인 전 딥 링크가 들어온 경우의 복귀 정책을 문서화합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '상세 화면 route 파라미터로 가장 적절한 값은 무엇입니까?',
        options: ['서버에서 받은 거대한 객체 전체', '화면을 다시 구성할 수 있는 안정적인 품목 ID', 'Repository 인스턴스', 'Pressable callback 함수'],
        answer: 1,
        explanation: '직렬화 가능하고 복원 가능한 최소 식별자를 전달한 뒤 목적지에서 최신 데이터를 읽는 방식이 안전합니다.'
      },
      {
        question: 'BackHandler callback이 false를 반환하면 일반적으로 어떤 의미입니까?',
        options: ['뒤로가기 이벤트를 소비합니다.', '앱을 즉시 종료합니다.', '이 handler가 처리하지 않고 다음 handler 또는 기본 동작에 넘깁니다.', '현재 화면을 새로 mount합니다.'],
        answer: 2,
        explanation: 'true는 이벤트 소비, false는 이벤트 전달을 의미합니다.'
      },
      {
        question: '화면이 다른 Stack 화면 뒤에 남아 있는 상황에서 올바른 설명은 무엇입니까?',
        options: ['화면은 반드시 unmount됩니다.', 'mount 상태와 focus 상태는 다를 수 있습니다.', '모든 state가 자동으로 영속 저장됩니다.', '딥 링크만으로 다시 돌아갈 수 있습니다.'],
        answer: 1,
        explanation: 'Navigator는 이전 화면을 mount한 채 보존할 수 있으므로 focus 전용 작업과 mount 수명주기를 구분해야 합니다.'
      }
    ],
    sources: [
      { label: 'Expo 공식 문서 · Expo Router 소개', url: 'https://docs.expo.dev/router/introduction/' },
      { label: 'Expo 공식 문서 · Router notation', url: 'https://docs.expo.dev/router/basics/notation/' },
      { label: 'React Navigation 공식 문서 · 시작하기', url: 'https://reactnavigation.org/docs/getting-started' },
      { label: 'React Navigation 공식 문서 · Type checking with TypeScript', url: 'https://reactnavigation.org/docs/typescript/' },
      { label: 'React Native 공식 문서 · Linking', url: 'https://reactnative.dev/docs/linking' },
      { label: 'React Native 공식 문서 · BackHandler', url: 'https://reactnative.dev/docs/backhandler' }
    ]
  },
  {
    id: '14-network-server-state',
    no: 14,
    phase: '4부 · 앱 구조',
    title: '네트워크 계층과 서버 상태 설계',
    duration: '약 145분',
    minutes: 145,
    level: '필수',
    tags: ['Fetch', 'AbortController', 'API Client', 'Server State', 'Cache', 'Pagination'],
    summary: '컴포넌트 안의 단순 fetch 예제를 넘어 요청 취소, 런타임 검증, 캐시, 오류 모델, 재시도와 페이지네이션을 앱 구조로 설계합니다.',
    outcomes: [
      'HTTP 오류와 네트워크 오류를 구분하는 API 함수를 작성할 수 있습니다.',
      '화면이 사라지거나 검색 조건이 바뀔 때 요청을 취소할 수 있습니다.',
      '서버 상태와 지역 UI 상태의 수명과 원본이 다르다는 점을 설명할 수 있습니다.',
      '로딩, 빈 결과, 오류, 재시도, 페이지네이션을 명시적인 상태로 모델링할 수 있습니다.'
    ],
    body: `
      <h2>React Native는 웹 표준 Fetch API를 제공합니다</h2>
      <p>React Native에서 <code>fetch</code>, Promise, async·await를 사용해 HTTP 요청을 보낼 수 있습니다. 모바일 앱은 브라우저의 일반적인 CORS 정책과 같은 실행 환경이 아니지만, 서버 인증서, Android 네트워크 보안 설정, iOS App Transport Security 같은 플랫폼 보안 규칙은 적용됩니다.</p>

      <h2>HTTP 오류와 전송 오류를 구분합니다</h2>
      <p>서버가 404 또는 500 응답을 보내면 네트워크 전송 자체는 성공했기 때문에 fetch Promise가 resolve될 수 있습니다. 반면 DNS 실패, 연결 단절, 요청 취소는 reject될 수 있습니다. 두 종류를 같은 “알 수 없는 오류”로 처리하면 재시도와 사용자 안내가 부정확해집니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 오류 종류를 보존하는 API client</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type ApiError =
  | { type: 'http'; status: number; message: string }
  | { type: 'network'; message: string }
  | { type: 'invalidResponse'; message: string }
  | { type: 'cancelled' };

type Result&lt;T&gt; =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

async function requestJson(
  url: string,
  signal?: AbortSignal
): Promise&lt;Result&lt;unknown&gt;&gt; {
  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return {
        ok: false,
        error: {
          type: 'http',
          status: response.status,
          message: '서버 요청에 실패했습니다.'
        }
      };
    }

    return { ok: true, data: await response.json() };
  } catch (error) {
    if (error instanceof Error &amp;&amp; error.name === 'AbortError') {
      return { ok: false, error: { type: 'cancelled' } };
    }

    return {
      ok: false,
      error: { type: 'network', message: '네트워크 연결을 확인해 주세요.' }
    };
  }
}</code></pre>
      </div>

      <h2>외부 JSON은 unknown에서 검증합니다</h2>
      <p>API 함수가 <code>response.json() as WasteItem[]</code>를 반환해도 실제 JSON이 안전해지는 것은 아닙니다. 경계 계층에서 타입 가드나 스키마 검증을 적용하고, 도메인 모델로 변환한 뒤 화면에 전달합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 응답 검증과 매핑</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type WasteItemDto = {
  id: number;
  displayName: string;
};

function isWasteItemDto(value: unknown): value is WasteItemDto {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record&lt;string, unknown&gt;;
  return typeof record.id === 'number'
    &amp;&amp; typeof record.displayName === 'string';
}

function parseWasteItems(value: unknown): Result&lt;WasteItem[]&gt; {
  if (!Array.isArray(value) || !value.every(isWasteItemDto)) {
    return {
      ok: false,
      error: { type: 'invalidResponse', message: '응답 형식이 올바르지 않습니다.' }
    };
  }

  return {
    ok: true,
    data: value.map((dto) =&gt; ({ id: dto.id, name: dto.displayName }))
  };
}</code></pre>
      </div>

      <h2>컴포넌트, Hook, API client의 책임을 나눕니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>계층</th><th>책임</th><th>두지 않을 책임</th></tr></thead>
          <tbody>
            <tr><td>화면 컴포넌트</td><td>현재 상태를 UI로 표현하고 사용자 이벤트 전달</td><td>HTTP header 구성, DTO 검증, 중복 요청 조정</td></tr>
            <tr><td>기능 Hook</td><td>화면 수명과 요청 연결, UI 상태 조합, 사용자 명령 제공</td><td>React와 무관한 JSON 파싱을 깊게 포함</td></tr>
            <tr><td>API client</td><td>URL, header, HTTP 상태, 취소 signal, JSON 경계</td><td>특정 화면의 modal 열림 여부</td></tr>
            <tr><td>도메인 또는 repository</td><td>DTO 매핑, 캐시와 데이터 원본 정책, 여러 API 조합</td><td>Text와 View 렌더링</td></tr>
          </tbody>
        </table>
      </div>

      <h2>요청 취소는 오래된 결과를 막습니다</h2>
      <p>검색어 A의 요청이 느리고 검색어 B의 요청이 빠르면 B 결과가 먼저 표시된 뒤 A 결과가 화면을 덮을 수 있습니다. AbortController를 사용해 이전 요청을 취소하거나 요청 식별자를 비교해 오래된 응답을 무시합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 검색 Hook에서 이전 요청 취소</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function useItemSearch(keyword: string) {
  const [state, setState] = useState&lt;SearchState&gt;({ status: 'idle' });

  useEffect(() =&gt; {
    const query = keyword.trim();
    if (!query) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    repository.search(query, controller.signal).then((result) =&gt; {
      if (result.ok) {
        setState(result.data.length
          ? { status: 'success', items: result.data }
          : { status: 'empty' });
      } else if (result.error.type !== 'cancelled') {
        setState({ status: 'error', error: result.error });
      }
    });

    return () =&gt; controller.abort();
  }, [keyword]);

  return state;
}</code></pre>
      </div>

      <h2>서버 상태는 단순 전역 state와 다릅니다</h2>
      <p>서버 데이터는 앱이 유일하게 소유하지 않습니다. 서버에서 언제든 바뀔 수 있고, 캐시가 오래될 수 있으며, 여러 화면이 같은 데이터를 요청하고, 실패와 재시도가 필요합니다. 따라서 다음 질문을 명시해야 합니다.</p>
      <ul>
        <li>데이터는 언제 stale로 간주합니까?</li>
        <li>같은 요청이 동시에 들어오면 하나로 합칩니까?</li>
        <li>화면에 재진입할 때 캐시를 먼저 보여 줍니까?</li>
        <li>백그라운드에서 돌아왔을 때 다시 검증합니까?</li>
        <li>mutation 성공 후 어떤 목록과 상세 캐시를 무효화합니까?</li>
        <li>오프라인에서 마지막 성공 데이터를 보여 줍니까?</li>
      </ul>
      <p>이 기능을 직접 구현할 수 있지만 규모가 커지면 TanStack Query 같은 서버 상태 라이브러리를 검토할 수 있습니다. 라이브러리를 도입하기 전에 stale time, query key, invalidation, retry의 의미를 팀이 이해해야 합니다.</p>

      <h2>화면 상태를 한 번에 모델링합니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 성공 데이터 보존을 포함한 상태</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type ListState =
  | { status: 'initialLoading' }
  | { status: 'empty' }
  | { status: 'success'; items: WasteItem[]; refreshing: boolean }
  | { status: 'error'; error: ApiError; previousItems?: WasteItem[] };</code></pre>
      </div>
      <p>초기 로딩과 새로고침은 UX가 다릅니다. 처음에는 전체 로딩 화면을 표시할 수 있지만 기존 데이터가 있는 새로고침에서는 목록을 유지하고 작은 진행 상태를 표시하는 편이 자연스럽습니다.</p>

      <h2>재시도 정책은 오류별로 다릅니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>오류</th><th>자동 재시도</th><th>사용자 안내</th></tr></thead>
          <tbody>
            <tr><td>일시적인 네트워크 단절</td><td>짧은 backoff와 횟수 제한을 검토</td><td>오프라인 상태와 수동 재시도 제공</td></tr>
            <tr><td>HTTP 429</td><td>Retry-After와 서버 정책을 존중</td><td>잠시 후 다시 시도하도록 안내</td></tr>
            <tr><td>HTTP 500</td><td>멱등 요청만 제한적으로 재시도</td><td>서버 오류와 재시도 제공</td></tr>
            <tr><td>HTTP 400</td><td>같은 요청 자동 재시도 금지</td><td>입력 또는 요청 형식 수정 안내</td></tr>
            <tr><td>HTTP 401</td><td>정의된 토큰 갱신 흐름 한 번</td><td>갱신 실패 시 로그인 요구</td></tr>
          </tbody>
        </table>
      </div>
      <p>POST 요청을 무조건 자동 재시도하면 동일 주문이나 저장 작업이 중복될 수 있습니다. 서버의 idempotency key 지원과 요청 의미를 확인합니다.</p>

      <h2>페이지네이션은 cursor를 원본으로 둡니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · cursor 기반 페이지 결과</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type Page&lt;T&gt; = {
  items: T[];
  nextCursor: string | null;
};

type PagingState&lt;T&gt; = {
  items: T[];
  nextCursor: string | null;
  loadingMore: boolean;
  loadMoreError: ApiError | null;
};</code></pre>
      </div>
      <p>초기 로딩 오류와 다음 페이지 로딩 오류를 구분합니다. 다음 페이지 실패 때문에 이미 표시 중인 목록 전체를 오류 화면으로 바꾸지 않습니다. 목록 아래에 재시도 행을 제공할 수 있습니다.</p>

      <h2>인증 header와 토큰 갱신은 중앙화합니다</h2>
      <p>각 컴포넌트가 SecureStore에서 토큰을 읽고 header를 붙이면 중복과 경쟁 상태가 생깁니다. API client가 현재 세션을 읽고 401 갱신을 조정하며, 동시 401이 하나의 갱신 요청을 공유하도록 설계합니다. 토큰 갱신 실패 시 세션을 명확히 종료합니다.</p>

      <div class="callout warning">
        <span class="callout-title">개발 서버 주소의 localhost</span>
        Android 에뮬레이터에서 <code>localhost</code>는 개발 PC가 아니라 에뮬레이터 자신을 가리킵니다. Android Emulator에서는 일반적으로 <code>10.0.2.2</code>로 호스트 PC에 접근합니다. 실제 기기는 같은 네트워크의 개발 PC 주소와 방화벽 설정이 필요합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>HTTP, network, invalid response, cancelled 오류를 구분합니다.</li><li>검색 조건 변경 시 이전 요청을 취소합니다.</li><li>초기 로딩과 새로고침 UI를 다르게 구현합니다.</li><li>다음 페이지 실패 시 기존 목록을 유지합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>기존 Repository의 캐시 정책을 stale, invalidation 언어로 다시 설명합니다.</li><li>자동 재시도 가능한 API와 불가능한 API를 분류합니다.</li><li>API DTO 검증 책임을 어느 계층에 둘지 합의합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'fetch가 HTTP 500 응답을 받았을 때 올바른 처리 방식은 무엇입니까?',
        options: ['Promise가 항상 reject되므로 catch만 작성합니다.', 'response.ok 또는 status를 검사해 HTTP 오류로 변환합니다.', 'JSON을 읽으면 성공으로 바뀝니다.', '요청을 무한 반복합니다.'],
        answer: 1,
        explanation: 'HTTP 오류 응답도 fetch가 정상 응답 객체로 제공할 수 있으므로 상태를 명시적으로 검사합니다.'
      },
      {
        question: '검색어가 빠르게 바뀌는 화면에서 AbortController를 사용하는 주된 이유는 무엇입니까?',
        options: ['텍스트 입력을 암호화하기 위해서입니다.', '이전 요청이 늦게 완료되어 최신 결과를 덮는 경쟁 상태를 막기 위해서입니다.', 'FlatList의 높이를 계산하기 위해서입니다.', 'Android 권한을 요청하기 위해서입니다.'],
        answer: 1,
        explanation: '이전 조건의 요청을 취소하면 불필요한 작업과 오래된 결과 반영을 막을 수 있습니다.'
      },
      {
        question: '다음 페이지 요청만 실패한 경우 가장 자연스러운 UI는 무엇입니까?',
        options: ['이미 표시 중인 목록 전체를 제거합니다.', '앱을 종료합니다.', '기존 목록을 유지하고 목록 하단에 재시도 상태를 표시합니다.', '오류를 무시하고 nextCursor를 임의로 만듭니다.'],
        answer: 2,
        explanation: '부분 실패는 이미 성공한 데이터와 구분해 표현해야 사용자가 현재 내용을 계속 볼 수 있습니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Networking', url: 'https://reactnative.dev/docs/network' },
      { label: 'MDN · Fetch API', url: 'https://developer.mozilla.org/ko/docs/Web/API/Fetch_API' },
      { label: 'MDN · AbortController', url: 'https://developer.mozilla.org/ko/docs/Web/API/AbortController' },
      { label: 'React 공식 문서 · Effect에서 데이터 가져오기', url: 'https://ko.react.dev/reference/react/useEffect#fetching-data-with-effects' },
      { label: 'TanStack Query 공식 문서 · React Native', url: 'https://tanstack.com/query/latest/docs/framework/react/react-native' }
    ]
  },
  {
    id: '15-storage-offline-permissions',
    no: 15,
    phase: '4부 · 앱 구조',
    title: '저장소, 오프라인 동기화, 권한과 플랫폼 API',
    duration: '약 150분',
    minutes: 150,
    level: '필수',
    tags: ['AsyncStorage', 'SecureStore', 'SQLite', 'Offline-first', 'PermissionsAndroid', 'AppState', 'Platform'],
    summary: 'DataStore, Room, Keystore 경험을 React Native 저장 수단에 연결하고 오프라인 원본, 동기화 큐, 권한 수명주기와 플랫폼 분기를 설계합니다.',
    outcomes: [
      '일반 설정, 민감 정보, 구조화 데이터에 서로 다른 저장소를 선택할 수 있습니다.',
      '오프라인 우선 구조에서 로컬 데이터베이스와 서버의 책임을 설명할 수 있습니다.',
      'Android 런타임 권한의 granted, denied, never ask again 상태를 처리할 수 있습니다.',
      'AppState와 Platform API를 사용하되 플랫폼 분기를 격리할 수 있습니다.'
    ],
    body: `
      <h2>하나의 저장소로 모든 데이터를 처리하지 않습니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>데이터</th><th>React Native 또는 Expo 선택</th><th>Android에서 가까운 개념</th><th>보안과 구조</th></tr></thead>
          <tbody>
            <tr><td>테마, 온보딩 완료, 간단한 설정</td><td>AsyncStorage</td><td>DataStore Preferences</td><td>비암호화 문자열 key-value</td></tr>
            <tr><td>refresh token, 작은 비밀값</td><td>Expo SecureStore 또는 네이티브 보안 저장소</td><td>Android Keystore를 활용한 저장 계층</td><td>플랫폼 보안 저장소, 크기와 백업 정책 확인</td></tr>
            <tr><td>검색 캐시, 저장 목록, 관계가 있는 데이터</td><td>SQLite</td><td>Room</td><td>구조화 쿼리와 transaction</td></tr>
            <tr><td>사진, PDF, 다운로드 파일</td><td>FileSystem 계열</td><td>앱 전용 파일 저장소</td><td>파일 수명과 사용자 데이터 삭제 정책 필요</td></tr>
            <tr><td>서버 데이터 캐시</td><td>서버 상태 캐시와 SQLite 조합</td><td>Repository + Room</td><td>stale와 동기화 정책 필요</td></tr>
          </tbody>
        </table>
      </div>

      <h2>AsyncStorage는 문자열 기반 비암호화 저장소입니다</h2>
      <p>AsyncStorage는 React Native Core에서 분리된 커뮤니티 패키지입니다. 문자열 key-value를 비동기로 저장합니다. 객체는 JSON 문자열로 변환해야 합니다. 민감한 token이나 개인정보를 암호화 없이 저장하지 않습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 설정 저장과 안전한 파싱</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'settings:v1';

type Settings = {
  darkMode: boolean;
  onboardingCompleted: boolean;
};

async function saveSettings(settings: Settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function loadSettings(): Promise&lt;Settings | null&gt; {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isSettings(parsed) ? parsed : null;
  } catch {
    return null;
  }
}</code></pre>
      </div>
      <p>저장 데이터 스키마가 바뀔 때 migration이 필요합니다. key에 버전을 포함하거나 저장 객체에 schemaVersion을 두고 이전 버전을 명시적으로 변환합니다.</p>

      <h2>SecureStore는 데이터베이스가 아닙니다</h2>
      <p>Expo SecureStore는 Android Keystore와 iOS Keychain을 활용해 작은 key-value를 안전하게 저장합니다. 생체 인증 옵션을 사용할 수 있지만 사용자 인증 설정이 바뀌면 값에 접근하지 못할 수 있습니다. 앱의 유일한 복구 불가능 원본으로 사용하지 않습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · refresh token 저장</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'auth.refreshToken';

async function storeRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

async function readRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

async function clearRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}</code></pre>
      </div>
      <div class="callout warning">
        <span class="callout-title">access token을 React state와 로그에 오래 남기지 않습니다</span>
        토큰을 console에 출력하거나 오류 보고 도구의 breadcrumb에 넣지 않습니다. 세션 관리자 한곳에서 저장, 메모리 캐시, 갱신, 삭제를 조정합니다.
      </div>

      <h2>SQLite는 구조화 데이터와 transaction에 사용합니다</h2>
      <p>Expo SQLite는 SQLite 데이터베이스를 열고 SQL을 실행하며 transaction을 사용할 수 있습니다. 저장 목록, 오프라인 캐시, 동기화 큐처럼 검색과 갱신이 필요한 데이터에 적합합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 테이블 생성과 parameter binding</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('waste.db');

await db.execAsync(
  'CREATE TABLE IF NOT EXISTS saved_item (' +
  'id INTEGER PRIMARY KEY NOT NULL, ' +
  'name TEXT NOT NULL, ' +
  'updated_at INTEGER NOT NULL' +
  ')'
);

await db.runAsync(
  'INSERT OR REPLACE INTO saved_item (id, name, updated_at) VALUES (?, ?, ?)',
  item.id,
  item.name,
  Date.now()
);</code></pre>
      </div>
      <p>사용자 입력을 문자열 연결로 SQL에 넣지 않고 parameter binding을 사용합니다. 여러 변경이 하나의 논리 작업이라면 transaction으로 묶습니다. 스키마 버전과 migration 테스트를 작성합니다.</p>

      <h2>오프라인 우선에서는 로컬 DB를 UI의 원본으로 둡니다</h2>
      <p>오프라인 우선 구조의 일반적인 흐름은 UI가 SQLite를 관찰하고, 동기화 작업이 서버와 로컬 DB를 맞추는 방식입니다. UI가 서버 응답과 로컬 응답을 번갈아 직접 소유하면 상태가 복잡해집니다.</p>
      <ol>
        <li>앱은 로컬 DB의 현재 값을 즉시 화면에 표시합니다.</li>
        <li>네트워크가 가능하면 서버 변경을 가져와 transaction으로 로컬 DB에 반영합니다.</li>
        <li>사용자 변경은 로컬 DB에 먼저 기록하고 outbox에 전송 작업을 추가합니다.</li>
        <li>동기화 worker가 outbox를 순서대로 전송합니다.</li>
        <li>성공하면 outbox를 제거하고 서버 식별자와 버전을 반영합니다.</li>
        <li>충돌하면 last-write-wins, server-wins, field merge, 사용자 선택 중 도메인 정책을 적용합니다.</li>
      </ol>
      <div class="callout note">
        <span class="callout-title">오프라인 저장과 백그라운드 실행은 별개입니다</span>
        JavaScript가 앱 종료 후 항상 실행된다고 가정하지 않습니다. 백그라운드 작업의 시간과 주기는 Android와 iOS가 제한합니다. 반드시 전송되어야 하는 작업은 네이티브 background API와 서버 idempotency까지 고려합니다.
      </div>

      <h2>권한은 요청 전에 맥락을 설명합니다</h2>
      <p>Android 위험 권한은 런타임에 요청해야 합니다. 사용자가 기능을 선택한 시점에 왜 필요한지 설명하고 요청합니다. 앱 시작과 동시에 모든 권한을 묻지 않습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · Android 카메라 권한</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>async function requestCameraPermission(): Promise&lt;boolean&gt; {
  if (Platform.OS !== 'android') return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: '카메라 권한',
      message: '품목 사진을 촬영하려면 카메라 권한이 필요합니다.',
      buttonPositive: '계속',
      buttonNegative: '취소'
    }
  );

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return false;
  }

  return result === PermissionsAndroid.RESULTS.GRANTED;
}</code></pre>
      </div>
      <p><code>NEVER_ASK_AGAIN</code> 상태에서는 같은 요청을 반복하지 않고 설정 화면으로 이동하는 방법과 권한 없이 사용할 수 있는 대안을 안내합니다. Android 버전에 따라 권한 이름과 범위가 바뀌므로 target SDK에 맞춰 공식 Android 문서도 확인합니다.</p>

      <h2>iOS 권한 설명은 빌드 설정에도 필요합니다</h2>
      <p>iOS 카메라와 위치 권한은 Info.plist usage description이 필요합니다. Expo 프로젝트에서는 app config와 Config Plugin이 해당 네이티브 설정을 생성할 수 있습니다. JavaScript에서 권한 요청 코드만 작성해도 충분하지 않습니다.</p>

      <h2>AppState로 foreground 복귀를 감지합니다</h2>
      <p>AppState는 앱이 active, background, iOS의 inactive 같은 상태로 바뀌는 것을 알려 줍니다. 설정 화면에서 권한을 바꾸고 돌아온 경우 재확인하거나, 오래된 캐시를 갱신할 때 사용할 수 있습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · active 복귀 시 권한 재확인</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>useEffect(() =&gt; {
  let previousState = AppState.currentState;

  const subscription = AppState.addEventListener('change', (nextState) =&gt; {
    const returnedToForeground =
      previousState !== 'active' &amp;&amp; nextState === 'active';

    previousState = nextState;
    if (returnedToForeground) {
      refreshPermissionState();
    }
  });

  return () =&gt; subscription.remove();
}, []);</code></pre>
      </div>

      <h2>플랫폼 분기는 경계에 모읍니다</h2>
      <p><code>Platform.OS</code>, <code>Platform.select</code>, <code>.android.ts</code>와 <code>.ios.ts</code> 파일을 사용할 수 있습니다. 화면 전체에 if 문을 흩뿌리기보다 platform adapter를 만들고 공통 UI는 동일한 interface를 사용합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 파일 단위 플랫폼 구현</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>shareItem.android.ts
shareItem.ios.ts

// 공통 호출부
import { shareItem } from './shareItem';

await shareItem(item);</code></pre>
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>테마 설정은 AsyncStorage에 저장합니다.</li><li>refresh token은 SecureStore에 저장하고 로그에서 제거합니다.</li><li>SQLite에 저장 품목과 outbox 테이블을 만듭니다.</li><li>카메라 권한의 거부와 다시 묻지 않음 상태를 분리합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>기존 DataStore, Room, Keystore 데이터를 React Native 저장 수단에 대응시킵니다.</li><li>오프라인 변경 충돌 정책을 기능별로 정합니다.</li><li>플랫폼 분기를 화면 밖 adapter에 모을 항목을 찾습니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'refresh token을 저장하기에 가장 적절한 기본 선택은 무엇입니까?',
        options: ['일반 AsyncStorage', '화면 컴포넌트의 useState만 사용', '플랫폼 보안 저장소를 사용하는 SecureStore 계열', 'console.log'],
        answer: 2,
        explanation: '민감한 작은 비밀값은 플랫폼 보안 저장소를 사용하는 계층에 두어야 합니다.'
      },
      {
        question: '구조화된 저장 목록과 검색, transaction이 필요한 경우 가장 적절한 저장소는 무엇입니까?',
        options: ['AsyncStorage에 거대한 JSON 하나', 'SQLite', '컴포넌트 props', '딥 링크 파라미터'],
        answer: 1,
        explanation: 'SQLite는 구조화 쿼리, 인덱스, transaction과 migration을 제공하므로 관계가 있는 데이터에 적합합니다.'
      },
      {
        question: 'Android 권한 결과가 NEVER_ASK_AGAIN인 경우 올바른 UX는 무엇입니까?',
        options: ['같은 권한 팝업을 무한 반복합니다.', '앱을 강제 종료합니다.', '설정으로 이동하는 방법과 권한 없는 대안을 안내합니다.', '권한이 허용된 것으로 간주합니다.'],
        answer: 2,
        explanation: '시스템 팝업을 다시 표시할 수 없으므로 사용자가 설정에서 직접 바꿀 수 있도록 명확히 안내해야 합니다.'
      }
    ],
    sources: [
      { label: 'AsyncStorage 공식 문서 · Usage', url: 'https://react-native-async-storage.github.io/async-storage/docs/usage/' },
      { label: 'Expo 공식 문서 · SecureStore', url: 'https://docs.expo.dev/versions/latest/sdk/securestore/' },
      { label: 'Expo 공식 문서 · SQLite', url: 'https://docs.expo.dev/versions/latest/sdk/sqlite/' },
      { label: 'React Native 공식 문서 · PermissionsAndroid', url: 'https://reactnative.dev/docs/permissionsandroid' },
      { label: 'React Native 공식 문서 · AppState', url: 'https://reactnative.dev/docs/appstate' },
      { label: 'React Native 공식 문서 · Platform', url: 'https://reactnative.dev/docs/platform' },
      { label: 'Expo 공식 문서 · Permissions', url: 'https://docs.expo.dev/guides/permissions/' }
    ]
  },
  {
    id: '16-testing-debugging',
    no: 16,
    phase: '4부 · 앱 구조',
    title: '단위 테스트, 컴포넌트 테스트, E2E와 디버깅',
    duration: '약 155분',
    minutes: 155,
    level: '필수',
    tags: ['Jest', 'React Native Testing Library', 'E2E', 'Maestro', 'DevTools', 'Mock'],
    summary: '구현 세부사항이 아니라 사용자 행동과 상태 전이를 검증하고, TypeScript부터 Kotlin 네이티브 모듈과 실제 앱 흐름까지 테스트 계층을 구성합니다.',
    outcomes: [
      '순수 로직, 컴포넌트, 네이티브 모듈, E2E 테스트의 책임을 구분할 수 있습니다.',
      'React Native Testing Library에서 역할과 접근성 이름으로 UI를 찾을 수 있습니다.',
      '비동기 UI를 findBy와 waitFor로 안정적으로 검증할 수 있습니다.',
      'React Native DevTools와 네이티브 로그를 사용해 JavaScript와 Android 문제를 분리할 수 있습니다.'
    ],
    body: `
      <h2>테스트 피라미드는 실행 비용과 신뢰 범위의 균형입니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>계층</th><th>검증 대상</th><th>속도</th><th>대표 도구</th></tr></thead>
          <tbody>
            <tr><td>순수 단위 테스트</td><td>reducer, parser, validator, formatter, repository 규칙</td><td>매우 빠름</td><td>Jest</td></tr>
            <tr><td>컴포넌트 테스트</td><td>사용자 입력, 렌더링 결과, 접근성, callback</td><td>빠름</td><td>React Native Testing Library</td></tr>
            <tr><td>네이티브 단위 및 통합 테스트</td><td>Kotlin 모듈, DB, SDK adapter</td><td>중간</td><td>JUnit, Robolectric, Android instrumented test</td></tr>
            <tr><td>E2E 테스트</td><td>실제 빌드에서 화면 이동, 권한, 네트워크 대역, 핵심 사용자 흐름</td><td>느림</td><td>Maestro 또는 Detox</td></tr>
          </tbody>
        </table>
      </div>
      <p>모든 경우를 E2E로 검증하면 느리고 불안정해집니다. 반대로 snapshot만 통과한다고 사용자가 앱을 사용할 수 있는 것은 아닙니다. 가장 작은 계층에서 규칙을 검증하고, 중요한 통합 경계와 핵심 흐름만 상위 테스트로 보호합니다.</p>

      <h2>순수 로직은 React 없이 테스트합니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · reducer 테스트</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>describe('searchReducer', () =&gt; {
  it('최대 선택 개수에 도달하면 기존 선택을 유지한다', () =&gt; {
    const state = {
      ...initialState,
      selectedIds: [1, 2, 3]
    };

    const next = searchReducer(state, {
      type: 'itemToggled',
      id: 4,
      maxSelection: 3
    });

    expect(next.selectedIds).toEqual([1, 2, 3]);
    expect(next.message).toBe('최대 3개까지만 선택할 수 있어요.');
  });
});</code></pre>
      </div>
      <p>reducer가 현재 시간을 직접 읽거나 네트워크를 호출하면 순수 테스트가 어려워집니다. 시간, 난수, API는 입력이나 interface로 주입합니다.</p>

      <h2>컴포넌트 테스트는 사용자가 찾는 방식으로 요소를 찾습니다</h2>
      <p>React Native Testing Library는 구현된 컴포넌트 타입이나 내부 state보다 화면에 드러나는 역할, 이름, 텍스트, label을 사용하도록 권장합니다. 접근성 좋은 UI는 테스트하기도 쉽습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 검색 성공 흐름 테스트</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import { render, screen, userEvent } from '@testing-library/react-native';

it('검색어를 입력하고 결과를 표시한다', async () =&gt; {
  const user = userEvent.setup();
  const repository = createFakeRepository({
    '페트병': [{ id: 1, name: '투명 페트병' }]
  });

  render(&lt;SearchScreen repository={repository} /&gt;);

  await user.type(
    screen.getByRole('searchbox', { name: '품목 검색어' }),
    '페트병'
  );
  await user.press(screen.getByRole('button', { name: '검색' }));

  expect(await screen.findByText('투명 페트병')).toBeOnTheScreen();
});</code></pre>
      </div>
      <p>플랫폼과 Testing Library 버전에 따라 지원 role이 다르면 접근성 label 또는 placeholder를 사용하되, 사용자가 식별할 수 있는 public surface를 우선합니다.</p>

      <h2>비동기 UI는 기다릴 조건을 명시합니다</h2>
      <ul>
        <li><code>findBy</code> query는 요소가 나타날 때까지 기다립니다.</li>
        <li><code>waitFor</code>는 callback 안의 assertion이 통과할 때까지 재시도합니다.</li>
        <li>고정된 sleep과 임의의 긴 timeout을 기본 해결책으로 사용하지 않습니다.</li>
        <li>가짜 타이머를 사용할 때 Promise microtask와 사용자 이벤트 처리 순서를 이해합니다.</li>
      </ul>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 오류 후 재시도 테스트</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>it('오류 화면에서 다시 시도한다', async () =&gt; {
  const user = userEvent.setup();
  const repository = createSequentialRepository([
    { ok: false, error: networkError },
    { ok: true, data: [{ id: 1, name: '종이팩' }] }
  ]);

  render(&lt;ItemListScreen repository={repository} /&gt;);

  expect(await screen.findByText('네트워크 연결을 확인해 주세요.'))
    .toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: '다시 시도' }));

  expect(await screen.findByText('종이팩')).toBeOnTheScreen();
});</code></pre>
      </div>

      <h2>Mock은 경계를 대체하고 구현을 복제하지 않습니다</h2>
      <p>API repository, 시간, 위치, 네이티브 모듈처럼 테스트 환경 밖의 경계를 fake 또는 mock으로 대체합니다. 하위 컴포넌트를 모두 mock해 버리면 실제 사용자 흐름을 검증하지 못합니다. 네트워크 응답을 테스트마다 낮은 수준 fetch mock으로 반복하기보다 repository fake를 만들면 화면 테스트의 의도가 분명해집니다.</p>

      <h2>네이티브 모듈은 양쪽에서 검증합니다</h2>
      <ul>
        <li>TypeScript wrapper는 성공, 오류, 취소 결과를 단위 테스트합니다.</li>
        <li>Kotlin 구현은 JUnit이나 Android test로 SDK 호출과 thread 전환을 검증합니다.</li>
        <li>Codegen spec과 실제 구현 메서드가 연결되는 smoke test를 실행합니다.</li>
        <li>React Native 컴포넌트 테스트에서는 모듈 boundary를 fake로 대체합니다.</li>
        <li>핵심 흐름 한두 개는 실제 네이티브 모듈을 포함한 E2E로 검증합니다.</li>
      </ul>

      <h2>E2E는 사용자의 핵심 경로를 보호합니다</h2>
      <p>Maestro는 YAML flow로 앱 실행, 탭, 입력, assertion을 작성할 수 있습니다. 접근성 label과 안정적인 testID를 적절히 사용합니다. testID는 사용자가 보는 이름으로 찾기 어려운 경우에 제한적으로 추가합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>YAML · Maestro 핵심 검색 흐름</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>appId: com.example.waste
---
- launchApp:
    clearState: true
- tapOn: "품목 검색어"
- inputText: "페트병"
- tapOn: "검색"
- assertVisible: "투명 페트병"
- tapOn: "투명 페트병"
- assertVisible: "분리배출 방법"</code></pre>
      </div>
      <p>권한 팝업, 시스템 설정, 실제 서버 상태는 E2E 불안정성을 높일 수 있습니다. 테스트 전용 서버나 fixture, 명시적인 앱 초기 상태, 플랫폼별 flow를 설계합니다.</p>

      <h2>React Native DevTools로 JavaScript 문제를 찾습니다</h2>
      <ul>
        <li>Components 패널에서 props와 state를 확인합니다.</li>
        <li>Profiler 또는 Performance 패널에서 긴 렌더링과 JavaScript 작업을 기록합니다.</li>
        <li>Network 패널에서 요청과 응답을 확인합니다.</li>
        <li>Console에서 source map이 연결된 TypeScript stack trace를 확인합니다.</li>
        <li>개발 모드에서만 재현되는 Strict Mode와 Fast Refresh 영향을 구분합니다.</li>
      </ul>

      <h2>JavaScript와 Android 네이티브 문제를 분리합니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>증상</th><th>먼저 볼 도구</th><th>가능한 영역</th></tr></thead>
          <tbody>
            <tr><td>빨간 오류 화면, JS stack</td><td>React Native DevTools, Metro terminal</td><td>TypeScript, React 렌더링, module import</td></tr>
            <tr><td>앱 즉시 종료, native stack</td><td>Logcat, Android Studio debugger</td><td>Kotlin, JNI, Manifest, SDK 초기화</td></tr>
            <tr><td>release에서만 빈 화면</td><td>release Logcat, source map, bundle 설정</td><td>R8, 환경 변수, JS bundle, native library</td></tr>
            <tr><td>스크롤 끊김</td><td>RN DevTools Performance, Android profiler</td><td>JS 계산, React render, 이미지, 메인 스레드</td></tr>
            <tr><td>네이티브 모듈을 찾지 못함</td><td>Gradle build, autolinking 결과, Codegen output</td><td>재빌드 누락, package 등록, spec 이름 불일치</td></tr>
          </tbody>
        </table>
      </div>

      <h2>스냅샷 테스트를 보조 수단으로 사용합니다</h2>
      <p>큰 컴포넌트 전체 snapshot은 사소한 구조 변경에도 대규모 diff가 생기며 사용자가 실제로 무엇을 할 수 있는지 설명하지 못합니다. 안정적인 작은 구조나 직렬화 결과에 제한적으로 사용하고, 핵심 행동은 명시적인 assertion으로 작성합니다.</p>

      <div class="callout warning">
        <span class="callout-title">테스트가 통과해도 release 앱을 직접 확인합니다</span>
        Jest와 컴포넌트 테스트는 실제 Android View, R8, 서명, 네이티브 SDK 초기화, 기기 권한을 모두 재현하지 않습니다. release 후보 AAB 또는 APK로 핵심 흐름 smoke test를 실행합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>reducer의 선택 제한 규칙을 단위 테스트합니다.</li><li>검색 성공, 빈 결과, 오류와 재시도를 컴포넌트 테스트합니다.</li><li>핵심 목록→상세 흐름을 Maestro로 작성합니다.</li><li>DevTools와 Logcat에서 같은 오류의 양쪽 로그를 비교합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>기능별로 어느 테스트 계층이 가장 싼지 결정합니다.</li><li>testID를 추가할 기준과 접근성 query를 우선할 기준을 합의합니다.</li><li>release smoke test 체크리스트를 만듭니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'React Native Testing Library에서 버튼을 찾는 우선적인 방식은 무엇입니까?',
        options: ['내부 컴포넌트 클래스 이름', 'state 변수 이름', '사용자가 인식하는 역할과 접근성 이름', '소스 파일의 줄 번호'],
        answer: 2,
        explanation: '사용자 관점의 query는 구현 변경에 강하고 접근성 품질도 함께 검증합니다.'
      },
      {
        question: '비동기 결과가 나타날 때까지 기다리는 테스트에 가장 적절한 방식은 무엇입니까?',
        options: ['임의로 10초 sleep합니다.', 'findBy query 또는 waitFor로 관찰 가능한 조건을 기다립니다.', '테스트를 세 번 반복 실행합니다.', '모든 Promise를 mock하지 않고 무시합니다.'],
        answer: 1,
        explanation: '실제 기대 조건을 기다리면 실행 환경 속도에 덜 민감하고 실패 원인이 분명합니다.'
      },
      {
        question: 'Kotlin TurboModule을 충분히 검증하는 구성은 무엇입니까?',
        options: ['JavaScript snapshot 하나만 작성합니다.', 'Kotlin 단위 테스트, TypeScript 경계 테스트, 실제 연결 smoke 또는 E2E를 조합합니다.', 'Logcat을 눈으로 한 번 확인합니다.', '컴포넌트를 전부 mock합니다.'],
        answer: 1,
        explanation: '네이티브 구현과 JS 계약, 실제 런타임 연결은 서로 다른 실패를 검증하므로 계층을 조합해야 합니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Testing Overview', url: 'https://reactnative.dev/docs/testing-overview' },
      { label: 'React Native Testing Library 공식 문서', url: 'https://callstack.github.io/react-native-testing-library/' },
      { label: 'Jest 공식 문서 · Getting Started', url: 'https://jestjs.io/docs/getting-started' },
      { label: 'React Native 공식 문서 · React Native DevTools', url: 'https://reactnative.dev/docs/react-native-devtools' },
      { label: 'Maestro 공식 문서', url: 'https://docs.maestro.dev/' }
    ]
  }
);
