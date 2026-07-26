window.RN_COURSE_META = {
  title: 'Compose 개발자의 React Native 실전 교과서',
  shortTitle: 'React Native 교과서',
  verifiedAt: '2026-07-26',
  baseline: 'React Native 0.86 · React 19.2.3 · Expo SDK 57 문서 기준'
};

window.RN_COURSE.push(
  {
    id: '01-environment',
    no: 1,
    phase: '1부 · 준비',
    title: '학습 환경과 프로젝트 방식부터 결정하기',
    duration: '약 70분',
    minutes: 70,
    level: '필수',
    tags: ['Expo', 'Development Build', 'Community CLI', 'Metro', 'Android Studio'],
    summary: 'Expo Go, Expo Development Build, React Native Community CLI의 차이를 이해하고 팀 학습에 맞는 실행 환경을 구성합니다.',
    outcomes: [
      'Expo Go와 Development Build가 같은 도구가 아니라는 점을 설명할 수 있습니다.',
      '새 프로젝트와 기존 Android 앱 통합에서 서로 다른 시작 방식을 선택할 수 있습니다.',
      'Metro, 네이티브 빌드, JavaScript 번들의 관계를 설명할 수 있습니다.',
      '팀원 모두가 같은 Node.js와 Expo SDK 기준으로 첫 화면을 실행할 수 있습니다.'
    ],
    body: `
      <h2>이 과정의 기준 버전</h2>
      <p>이 교과서는 2026년 7월 26일을 기준으로 <strong>React Native 0.86, React 19.2.3, Expo SDK 57 문서</strong>를 중심으로 구성했습니다. React Native는 짧은 주기로 새 부 버전을 배포합니다. 따라서 명령어를 그대로 외우기보다 프로젝트가 어떤 계층으로 구성되는지 이해해야 합니다.</p>
      <div class="callout note">
        <span class="callout-title">버전이 중요한 이유</span>
        React Native 0.82부터 실행 환경은 New Architecture만 사용합니다. React Native 0.84부터 Hermes V1이 기본 JavaScript 엔진입니다. 오래된 강의에서 설명하는 Legacy Bridge 전환 옵션은 현재 신규 프로젝트의 기본 모델이 아닙니다.
      </div>

      <h2>세 가지 시작 방식의 차이</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>방식</th><th>정체</th><th>적합한 상황</th><th>제약</th></tr></thead>
          <tbody>
            <tr><td><strong>Expo Go</strong></td><td>Expo가 미리 만들어 둔 공용 실행 앱</td><td>문법을 빠르게 확인하거나 짧은 예제를 실습할 때</td><td>Expo Go 안에 포함되지 않은 네이티브 모듈과 설정을 바로 추가할 수 없습니다.</td></tr>
            <tr><td><strong>Expo Development Build</strong></td><td>현재 프로젝트 전용으로 만든 개발용 네이티브 앱</td><td>실제 앱 개발, 네이티브 라이브러리, 권한, Kotlin 코드가 필요한 경우</td><td>네이티브 설정이 바뀌면 개발 빌드를 다시 만들어야 합니다.</td></tr>
            <tr><td><strong>Community CLI</strong></td><td>Android와 iOS 프로젝트를 직접 소유하는 React Native 프로젝트</td><td>기존 Android 앱 통합, Gradle 세부 제어, 프레임워크 없이 직접 운영할 때</td><td>초기 설정과 플랫폼별 유지보수 책임이 더 큽니다.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="callout success">
        <span class="callout-title">이 팀에 권장하는 방식</span>
        팀 학습과 신규 실습 앱은 <strong>Expo 프로젝트와 Development Build</strong>로 시작하는 편이 적절합니다. Expo는 라우팅, 네이티브 모듈 설치, 빌드 도구를 정리해 줍니다. 17강부터는 Android Studio를 열어 Kotlin Turbo Native Module을 구현합니다. 18강에서는 기존 Android 앱에 React Native 화면을 넣는 Community CLI 기반 통합도 다룹니다.
      </div>

      <h2>프로젝트 생성과 첫 실행</h2>
      <p>Expo SDK 57 전환기의 공식 문서는 다음 명령을 안내합니다. 팀원들은 Node.js 버전과 패키지 관리자를 통일해야 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>터미널 · Expo SDK 57 프로젝트 생성</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>npx create-expo-app@latest rn-compose-study --template default@sdk-57
cd rn-compose-study
npm install
npx expo start</code></pre>
      </div>
      <p>Expo Go로 문법만 확인할 수 있지만, 실제 프로젝트 학습은 개발 빌드를 사용합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>터미널 · Android 개발 빌드</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>npx expo install expo-dev-client
npx expo run:android</code></pre>
      </div>
      <p><code>expo run:android</code>는 Android 네이티브 프로젝트를 준비하고 Gradle로 앱을 빌드합니다. 그 뒤 Metro가 TypeScript와 JavaScript 코드를 번들로 제공하며, 개발 빌드는 해당 번들을 실행합니다.</p>

      <h2>Compose 프로젝트와 비교한 디렉터리 구조</h2>
      <div class="compare-grid">
        <div class="compare-card"><h3>Android 네이티브</h3><p><code>app/src/main</code>, Gradle, Manifest, Kotlin 소스가 애플리케이션의 중심입니다. Compose 코드는 네이티브 바이너리에 컴파일됩니다.</p></div>
        <div class="compare-card"><h3>React Native</h3><p><code>app</code> 또는 <code>src</code>의 TSX가 화면을 정의합니다. <code>android</code>와 <code>ios</code>는 네이티브 호스트이며, Metro가 JavaScript 번들을 만듭니다.</p></div>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>파일 또는 폴더</th><th>역할</th><th>Android 개발자가 연결해서 볼 개념</th></tr></thead>
          <tbody>
            <tr><td><code>package.json</code></td><td>의존성, 스크립트, Codegen 설정</td><td>Gradle Version Catalog와 모듈 빌드 설정의 일부 역할</td></tr>
            <tr><td><code>app/</code> 또는 <code>src/</code></td><td>화면, 상태, 도메인 로직</td><td>Kotlin 소스와 Composable 함수</td></tr>
            <tr><td><code>android/</code></td><td>Gradle, Manifest, Kotlin 네이티브 코드</td><td>기존 Android 프로젝트와 동일한 영역</td></tr>
            <tr><td><code>app.json</code> 또는 <code>app.config.ts</code></td><td>Expo 앱 설정과 Config Plugin 입력</td><td>Manifest, 리소스, 빌드 설정을 생성하는 상위 설정</td></tr>
            <tr><td><code>metro.config.js</code></td><td>번들러 설정</td><td>Kotlin 컴파일러가 아니라 JavaScript 모듈 그래프를 처리하는 도구</td></tr>
          </tbody>
        </table>
      </div>

      <h2>개발 중에 실제로 일어나는 일</h2>
      <ol>
        <li>개발자가 TSX 파일을 저장합니다.</li>
        <li>Metro가 변경된 모듈을 변환하고 번들을 갱신합니다.</li>
        <li>개발 빌드 안의 Hermes가 JavaScript를 실행합니다.</li>
        <li>React가 새 UI 트리를 계산합니다.</li>
        <li>React Native Renderer가 Android 또는 iOS의 네이티브 뷰 변경을 적용합니다.</li>
      </ol>
      <p>네이티브 의존성, 권한, Gradle 플러그인, AndroidManifest가 바뀌면 JavaScript만 새로 고쳐서는 충분하지 않습니다. 이 경우에는 네이티브 앱을 다시 빌드해야 합니다.</p>

      <div class="callout warning">
        <span class="callout-title">자주 생기는 오해</span>
        Expo는 React Native와 경쟁하는 별도 UI 프레임워크가 아닙니다. Expo는 React Native 앱을 만들고 운영하기 위한 프레임워크와 도구 모음입니다. Expo 프로젝트도 React Native의 View, Text, FlatList와 네이티브 런타임을 사용합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>SDK 57 프로젝트를 생성합니다.</li><li>Android 에뮬레이터 또는 기기에서 첫 화면을 실행합니다.</li><li><code>app</code>, <code>android</code>, <code>package.json</code>의 역할을 한 문장씩 적습니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>팀 프로젝트에서 Expo Go가 부족해지는 첫 시점은 언제인지 정합니다.</li><li>Node.js와 패키지 관리자를 통일하지 않았을 때 발생할 문제를 정리합니다.</li><li>기존 Compose 앱에 일부 화면만 넣는 경우 신규 Expo 앱과 어떤 점이 다른지 말합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '카메라 SDK처럼 Expo Go에 포함되지 않은 네이티브 라이브러리를 사용하면서 Expo 도구도 계속 활용하려고 합니다. 가장 적절한 실행 방식은 무엇입니까?',
        options: ['Expo Go만 사용합니다.', 'Expo Development Build를 만듭니다.', '웹 브라우저에서만 실행합니다.', 'Metro를 제거합니다.'],
        answer: 1,
        explanation: 'Development Build는 현재 프로젝트의 네이티브 라이브러리와 설정을 포함한 전용 개발 앱입니다.'
      },
      {
        question: 'TSX 파일만 수정한 경우와 AndroidManifest 권한을 수정한 경우의 차이를 올바르게 설명한 것은 무엇입니까?',
        options: ['두 경우 모두 항상 Gradle 전체 빌드가 필요합니다.', '두 경우 모두 Metro 새로고침만 필요합니다.', 'TSX 변경은 보통 Metro가 반영하지만 Manifest 변경은 네이티브 재빌드가 필요합니다.', 'Manifest는 JavaScript 파일이므로 Metro가 처리합니다.'],
        answer: 2,
        explanation: 'Manifest와 네이티브 의존성은 Android 바이너리에 포함되기 때문에 앱을 다시 빌드해야 합니다.'
      },
      {
        question: 'Expo와 React Native의 관계를 가장 정확하게 설명한 것은 무엇입니까?',
        options: ['Expo는 React Native를 대체하는 별도 렌더러입니다.', 'Expo는 React Native 앱 개발과 빌드, 배포를 지원하는 프레임워크와 도구 모음입니다.', 'React Native는 Expo 안에서만 실행됩니다.', 'Expo 프로젝트에서는 네이티브 코드를 사용할 수 없습니다.'],
        answer: 1,
        explanation: 'Expo는 React Native 위에서 프로젝트 구성, 라우팅, 네이티브 모듈, 빌드와 배포 도구를 제공합니다.'
      }
    ],
    sources: [
      { label: 'Expo 공식 문서 · 프로젝트 만들기', url: 'https://docs.expo.dev/get-started/create-a-project/' },
      { label: 'Expo 공식 문서 · Development Build 소개', url: 'https://docs.expo.dev/develop/development-builds/introduction/' },
      { label: 'React Native 공식 문서 · 환경 설정', url: 'https://reactnative.dev/docs/environment-setup' },
      { label: 'React Native 0.86 공식 릴리스', url: 'https://reactnative.dev/blog/2026/06/11/react-native-0.86' }
    ]
  },
  {
    id: '02-javascript',
    no: 2,
    phase: '1부 · 준비',
    title: 'Kotlin 개발자를 위한 JavaScript 핵심',
    duration: '약 110분',
    minutes: 110,
    level: '필수',
    tags: ['JavaScript', 'const', '배열', '객체', 'Promise', 'async await'],
    summary: 'Kotlin 문법을 단순히 JavaScript 문법으로 치환하지 않고 값, 참조, 비동기 처리의 차이를 이해합니다.',
    outcomes: [
      'const와 let의 의미를 Kotlin의 val과 var와 비교할 수 있습니다.',
      '객체와 배열을 직접 수정하지 않고 새 값으로 갱신할 수 있습니다.',
      'null과 undefined의 차이를 설명할 수 있습니다.',
      'Promise와 async·await를 Coroutine과 비교하면서 오류 처리를 작성할 수 있습니다.'
    ],
    body: `
      <h2>문법보다 먼저 값의 모델을 이해해야 합니다</h2>
      <p>Kotlin 개발자는 JavaScript의 문법을 빠르게 읽을 수 있습니다. 그러나 두 언어의 타입 시스템과 런타임은 다릅니다. 특히 <strong>참조 동일성, null과 undefined, 객체 변경, 비동기 오류</strong>를 Kotlin 방식으로 추측하면 React 상태 처리에서 오류가 생깁니다.</p>

      <h2>const와 let은 객체의 불변성을 보장하지 않습니다</h2>
      <div class="compare-grid">
        <div class="compare-card"><h3>Kotlin</h3><p><code>val</code>은 참조 재할당을 막습니다. 불변 컬렉션 인터페이스를 사용하면 변경 연산도 제한할 수 있습니다.</p></div>
        <div class="compare-card"><h3>JavaScript</h3><p><code>const</code>는 변수 재할당만 막습니다. const가 가리키는 객체의 속성과 배열 원소는 여전히 바꿀 수 있습니다.</p></div>
      </div>
      <div class="code-wrap">
        <div class="code-label"><span>JavaScript · const의 실제 의미</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const user = { name: '지영', level: 1 };

// 허용됩니다. 객체 내부를 변경합니다.
user.level = 2;

// 오류가 발생합니다. 변수 자체를 다시 할당합니다.
// user = { name: '지영', level: 3 };</code></pre>
      </div>
      <p>React에서는 객체 내부를 직접 바꾸는 것보다 새 객체를 만드는 방식이 중요합니다. React는 이전 값과 다음 값의 참조가 달라졌는지를 이용해 변경을 판단하는 경우가 많기 때문입니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>JavaScript · 새 객체와 새 배열 만들기</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const updatedUser = { ...user, level: 2 };

const items = [
  { id: 1, selected: false },
  { id: 2, selected: true }
];

const updatedItems = items.map((item) =>
  item.id === 1 ? { ...item, selected: true } : item
);</code></pre>
      </div>

      <h2>원시 값과 객체의 비교 방식</h2>
      <p>문자열, 숫자, boolean 같은 원시 값은 값으로 비교합니다. 객체와 배열은 내용이 같아 보여도 서로 다른 참조이면 같지 않습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>JavaScript · === 비교</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>'RN' === 'RN'           // true
3 === 3                 // true

{ id: 1 } === { id: 1 } // false
[1, 2] === [1, 2]       // false

const a = { id: 1 };
const b = a;
a === b                 // true</code></pre>
      </div>
      <p>JavaScript에서는 특별한 이유가 없다면 느슨한 동등 연산자 <code>==</code>보다 엄격한 동등 연산자 <code>===</code>를 사용합니다. <code>==</code>는 비교 전에 타입 변환을 수행하기 때문에 예측하기 어려운 결과를 만들 수 있습니다.</p>

      <h2>구조 분해와 전개 구문</h2>
      <p>React 코드에서는 props와 상태를 자주 분해합니다. 구조 분해는 객체나 배열에서 필요한 값을 꺼내는 문법입니다. 전개 구문은 기존 객체나 배열을 복사하면서 일부 값을 덮어쓸 때 사용합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>JavaScript · 구조 분해</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const item = {
  id: 10,
  name: '투명 페트병',
  category: '플라스틱'
};

const { id, name, category } = item;
const label = name + ' · ' + category;

const colors = ['red', 'green', 'blue'];
const [firstColor, secondColor] = colors;</code></pre>
      </div>

      <h2>배열 메서드는 컬렉션 파이프라인처럼 읽습니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>JavaScript</th><th>Kotlin에서 가까운 개념</th><th>결과</th></tr></thead>
          <tbody>
            <tr><td><code>map</code></td><td><code>map</code></td><td>각 원소를 변환한 새 배열</td></tr>
            <tr><td><code>filter</code></td><td><code>filter</code></td><td>조건을 만족하는 새 배열</td></tr>
            <tr><td><code>find</code></td><td><code>firstOrNull</code></td><td>첫 원소 또는 undefined</td></tr>
            <tr><td><code>some</code></td><td><code>any</code></td><td>하나라도 만족하는지 여부</td></tr>
            <tr><td><code>every</code></td><td><code>all</code></td><td>모두 만족하는지 여부</td></tr>
            <tr><td><code>reduce</code></td><td><code>fold</code></td><td>누적 결과</td></tr>
          </tbody>
        </table>
      </div>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 목록 변환 예시</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type WasteItem = {
  id: number;
  name: string;
  recyclable: boolean;
};

const visibleNames = items
  .filter((item) => item.recyclable)
  .map((item) => item.name)
  .sort((a, b) => a.localeCompare(b, 'ko'));</code></pre>
      </div>

      <h2>null과 undefined를 구분합니다</h2>
      <p><code>null</code>은 개발자가 의도적으로 “값이 없음”을 넣은 경우에 주로 사용합니다. <code>undefined</code>는 값이 아직 할당되지 않았거나 객체 속성이 존재하지 않거나 함수가 값을 반환하지 않은 경우에 나타납니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>JavaScript · 선택적 연결과 기본값</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const districtName = response.region?.district?.name;

// null 또는 undefined일 때만 기본값을 사용합니다.
const displayName = districtName ?? '지역 미선택';

// 빈 문자열과 0도 기본값으로 바꾸므로 의미가 다릅니다.
const unsafeDisplayName = districtName || '지역 미선택';</code></pre>
      </div>
      <div class="callout warning">
        <span class="callout-title">Kotlin의 !!와 같은 습관을 옮기지 않습니다</span>
        TypeScript의 비-null 단언 연산자도 <code>!</code>입니다. 그러나 이 연산자는 런타임 검사를 추가하지 않습니다. 컴파일러에게만 값이 있다고 주장합니다. 외부 데이터에는 조건 검사와 런타임 검증이 필요합니다.
      </div>

      <h2>Promise와 async·await</h2>
      <p>Promise는 미래에 성공 값이나 실패 이유를 제공하는 객체입니다. <code>async</code> 함수는 항상 Promise를 반환합니다. <code>await</code>는 해당 Promise가 끝날 때까지 현재 async 함수의 다음 실행을 미룹니다. Android의 메인 스레드를 그대로 차단하는 동기 대기가 아닙니다.</p>
      <div class="compare-grid">
        <div class="compare-card"><h3>Kotlin Coroutine</h3><p><code>suspend</code> 함수, CoroutineScope, Job, structured concurrency가 취소와 수명주기를 구조화합니다.</p></div>
        <div class="compare-card"><h3>JavaScript Promise</h3><p>Promise 자체에는 Kotlin Job과 같은 상위 작업 구조가 없습니다. 네트워크 취소는 AbortController처럼 API가 제공하는 취소 수단을 별도로 연결합니다.</p></div>
      </div>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 비동기 요청과 오류 처리</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type ItemResponse = {
  id: number;
  name: string;
};

async function loadItem(id: number): Promise&lt;ItemResponse&gt; {
  const response = await fetch('https://example.com/items/' + id);

  if (!response.ok) {
    throw new Error('요청 실패: ' + response.status);
  }

  return response.json() as Promise&lt;ItemResponse&gt;;
}

try {
  const item = await loadItem(10);
  console.log(item.name);
} catch (error) {
  console.error(error);
}</code></pre>
      </div>
      <p><code>fetch</code>는 HTTP 404나 500을 자동으로 예외로 만들지 않습니다. 네트워크 계층에서 응답을 받았다면 Promise가 성공할 수 있으므로 <code>response.ok</code>를 확인해야 합니다.</p>

      <div class="callout danger">
        <span class="callout-title">React 상태에서 특히 피해야 할 코드</span>
        <code>array.push</code>, <code>array[index] = value</code>, <code>object.property = value</code>로 현재 상태를 직접 바꾸지 않습니다. 새 배열과 새 객체를 만든 뒤 상태 갱신 함수에 전달합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>선택 상태가 있는 품목 배열을 직접 수정하지 않고 갱신합니다.</li><li><code>find</code>가 반환하는 undefined를 안전하게 처리합니다.</li><li>HTTP 오류와 네트워크 오류를 구분하는 fetch 함수를 작성합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>Kotlin의 immutable collection과 JavaScript의 const가 왜 같지 않은지 설명합니다.</li><li>Promise 취소가 Coroutine Job 취소와 다른 이유를 말합니다.</li><li><code>??</code>와 <code>||</code>가 다른 실제 입력 사례를 찾습니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'const로 선언한 객체에 대한 설명으로 옳은 것은 무엇입니까?',
        options: ['객체의 모든 속성이 자동으로 불변이 됩니다.', '변수 재할당은 막지만 객체 내부 속성 변경은 막지 않습니다.', 'Kotlin의 data class copy와 같은 기능을 수행합니다.', '객체는 항상 값으로 비교됩니다.'],
        answer: 1,
        explanation: 'const는 변수 바인딩의 재할당만 막습니다. 객체의 깊은 불변성을 제공하지 않습니다.'
      },
      {
        question: 'React 상태 배열의 한 원소를 변경할 때 권장되는 방법은 무엇입니까?',
        options: ['현재 배열에서 push를 호출합니다.', '현재 원소의 속성에 직접 대입합니다.', 'map과 전개 구문으로 새 배열과 새 객체를 만듭니다.', 'const를 let으로 바꿉니다.'],
        answer: 2,
        explanation: '새 참조를 만들면 React가 상태 변경을 일관되게 판단할 수 있고 이전 상태도 보존됩니다.'
      },
      {
        question: 'fetch가 HTTP 500 응답을 받은 경우 일반적으로 필요한 처리는 무엇입니까?',
        options: ['fetch가 반드시 자동으로 예외를 던지므로 아무 처리도 필요하지 않습니다.', 'response.ok 또는 status를 확인하고 애플리케이션 오류로 변환합니다.', 'JSON 파싱을 생략하면 성공으로 바뀝니다.', 'await 대신 setTimeout을 사용합니다.'],
        answer: 1,
        explanation: 'fetch는 서버의 HTTP 오류 응답을 정상 응답으로 받을 수 있으므로 상태 코드를 명시적으로 검사해야 합니다.'
      }
    ],
    sources: [
      { label: 'MDN · JavaScript 안내서', url: 'https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide' },
      { label: 'MDN · 비동기 함수', url: 'https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function' },
      { label: 'MDN · Fetch API', url: 'https://developer.mozilla.org/ko/docs/Web/API/Fetch_API' },
      { label: 'React 공식 문서 · 배열 상태 갱신', url: 'https://react.dev/learn/updating-arrays-in-state' }
    ]
  },
  {
    id: '03-typescript',
    no: 3,
    phase: '1부 · 준비',
    title: 'TypeScript를 Kotlin 타입 시스템과 구분하기',
    duration: '약 120분',
    minutes: 120,
    level: '필수',
    tags: ['TypeScript', 'interface', 'union', 'narrowing', 'generics', 'unknown'],
    summary: 'TypeScript의 구조적 타입, union type, narrowing을 사용해 React Native 화면 상태와 API 계약을 안전하게 모델링합니다.',
    outcomes: [
      'TypeScript 타입이 런타임에는 사라진다는 점을 설명할 수 있습니다.',
      'interface와 type alias를 적절히 사용할 수 있습니다.',
      'discriminated union으로 sealed interface와 비슷한 상태 모델을 만들 수 있습니다.',
      'any 대신 unknown을 사용하고 조건 검사로 타입을 좁힐 수 있습니다.'
    ],
    body: `
      <h2>TypeScript는 JavaScript에 정적 검사를 추가합니다</h2>
      <p>TypeScript 코드는 빌드 과정에서 JavaScript로 변환됩니다. 인터페이스와 타입 별칭은 실행 파일에 클래스 정보로 남지 않습니다. 따라서 TypeScript가 서버 응답의 실제 모양을 검증해 주지는 않습니다.</p>
      <div class="compare-grid">
        <div class="compare-card"><h3>Kotlin</h3><p>클래스와 인터페이스는 JVM 또는 네이티브 런타임의 타입 정보와 연결됩니다. 명목적 타입 관계가 중심입니다.</p></div>
        <div class="compare-card"><h3>TypeScript</h3><p>대부분 구조적 타입을 사용합니다. 이름이 달라도 필요한 속성 구조를 만족하면 호환될 수 있습니다.</p></div>
      </div>

      <h2>구조적 타입을 이해합니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 구조가 맞으면 할당 가능</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>interface Region {
  id: number;
  name: string;
}

const apiValue = {
  id: 1,
  name: '서울특별시',
  extra: '서버 전용 값'
};

const region: Region = apiValue;</code></pre>
      </div>
      <p><code>apiValue</code>는 Region이라는 클래스를 구현하지 않았습니다. 그러나 Region이 요구하는 id와 name을 갖고 있으므로 할당할 수 있습니다. 이 유연성은 편리하지만 외부 객체를 잘못 신뢰하는 원인이 될 수도 있습니다.</p>

      <h2>interface와 type alias</h2>
      <p>객체의 공개 계약은 interface로 표현하면 확장과 선언 병합이 가능합니다. union, tuple, 조건부 조합처럼 다양한 타입 연산은 type alias가 필요합니다. 실무에서는 한 가지만 고집하기보다 의도를 기준으로 선택합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 객체 계약과 union</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>interface WasteItem {
  id: number;
  name: string;
  category: Category;
  note?: string;
}

type Category = 'paper' | 'plastic' | 'glass';
type ItemId = number;</code></pre>
      </div>
      <p><code>note?: string</code>은 속성이 없을 수 있다는 뜻입니다. 속성이 존재하지만 값이 null일 수 있다는 뜻과는 다릅니다. 서버 계약에 맞춰 <code>note?: string</code>, <code>note: string | null</code>, <code>note?: string | null</code>을 구분해야 합니다.</p>

      <h2>sealed interface에 가까운 discriminated union</h2>
      <p>React 화면의 로딩, 성공, 빈 결과, 오류 상태를 boolean 여러 개로 관리하면 서로 모순되는 조합이 생깁니다. Kotlin의 sealed interface처럼 판별 속성을 가진 union으로 표현하면 불가능한 상태를 줄일 수 있습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>Kotlin · sealed interface</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>sealed interface SearchUiState {
    data object Loading : SearchUiState
    data class Success(val items: List&lt;WasteItem&gt;) : SearchUiState
    data object Empty : SearchUiState
    data class Error(val message: String) : SearchUiState
}</code></pre>
      </div>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · discriminated union</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type SearchState =
  | { status: 'loading' }
  | { status: 'success'; items: WasteItem[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

function getSummary(state: SearchState): string {
  switch (state.status) {
    case 'loading':
      return '불러오는 중';
    case 'success':
      return state.items.length + '개';
    case 'empty':
      return '검색 결과 없음';
    case 'error':
      return state.message;
  }
}</code></pre>
      </div>
      <p><code>status</code>가 판별 속성입니다. switch 분기 안에서는 TypeScript가 해당 상태에만 존재하는 속성을 알 수 있습니다. 이 과정을 <strong>narrowing</strong>, 즉 타입 좁히기라고 합니다.</p>

      <h2>unknown을 사용해 검사를 강제합니다</h2>
      <p><code>any</code>는 타입 검사를 사실상 끕니다. 외부 입력처럼 아직 형태를 확신할 수 없는 값에는 <code>unknown</code>을 사용합니다. unknown 값의 속성에 접근하려면 먼저 조건 검사가 필요합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · unknown과 타입 가드</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function isRegion(value: unknown): value is Region {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record&lt;string, unknown&gt;;
  return typeof candidate.id === 'number'
    &amp;&amp; typeof candidate.name === 'string';
}

const payload: unknown = await response.json();

if (!isRegion(payload)) {
  throw new Error('지역 응답 형식이 올바르지 않습니다.');
}

console.log(payload.name);</code></pre>
      </div>
      <div class="callout note">
        <span class="callout-title">타입 가드와 스키마 검증의 차이</span>
        간단한 값은 직접 타입 가드를 작성할 수 있습니다. 중첩된 API 응답이 크다면 Zod 같은 런타임 스키마 라이브러리를 검토할 수 있습니다. TypeScript 타입 선언만으로는 네트워크 응답을 검증할 수 없습니다.
      </div>

      <h2>제네릭은 타입 사이의 관계를 보존합니다</h2>
      <p>제네릭은 단순히 여러 타입을 허용하는 기능이 아닙니다. 입력 타입과 출력 타입의 관계를 유지할 때 가치가 있습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 제네릭 API 결과</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type ApiResult&lt;T&gt; =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function requestJson&lt;T&gt;(url: string): Promise&lt;ApiResult&lt;T&gt;&gt; {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, message: 'HTTP ' + response.status };
    }
    return { ok: true, data: await response.json() as T };
  } catch {
    return { ok: false, message: '네트워크 연결을 확인해 주세요.' };
  }
}</code></pre>
      </div>
      <p>위 함수의 <code>as T</code>도 런타임 검증은 아닙니다. 이 예시는 제네릭 관계를 보여 주기 위한 코드입니다. 실제 경계에서는 응답 검증을 추가해야 합니다.</p>

      <h2>React 컴포넌트의 props 타입</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 함수 컴포넌트 props</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type ItemRowProps = {
  item: WasteItem;
  selected: boolean;
  onPress: (id: number) =&gt; void;
};

function ItemRow({ item, selected, onPress }: ItemRowProps) {
  return (
    &lt;Pressable onPress={() =&gt; onPress(item.id)}&gt;
      &lt;Text&gt;{item.name}&lt;/Text&gt;
      {selected &amp;&amp; &lt;Text&gt;선택됨&lt;/Text&gt;}
    &lt;/Pressable&gt;
  );
}</code></pre>
      </div>
      <p>이벤트 callback은 어떤 값을 전달하고 무엇을 반환하는지 명시합니다. callback 타입을 <code>Function</code>으로 넓게 쓰면 호출 규칙을 검사할 수 없습니다.</p>

      <div class="callout warning">
        <span class="callout-title">enum을 무조건 Kotlin enum처럼 사용하지 않습니다</span>
        React Native 애플리케이션의 간단한 고정 문자열 상태에는 string literal union이 더 가볍고 JSON과 직접 호환됩니다. 실제 런타임 객체와 역방향 매핑이 필요한 경우에만 TypeScript enum의 특성을 검토합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>기존 Compose 화면의 UiState를 discriminated union으로 옮깁니다.</li><li>API 응답을 unknown으로 받고 최소한의 타입 가드를 작성합니다.</li><li>callback props에 구체적인 함수 타입을 지정합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>구조적 타입이 편리한 사례와 위험한 사례를 하나씩 찾습니다.</li><li>optional 속성과 null 속성이 서버 API에서 어떻게 다른지 설명합니다.</li><li>컴파일 타임 타입과 런타임 검증의 책임 경계를 정합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'TypeScript interface에 대한 설명으로 옳은 것은 무엇입니까?',
        options: ['항상 JavaScript 런타임 클래스가 생성됩니다.', '서버 응답이 interface를 자동으로 만족하는지 런타임에 검사합니다.', '주로 컴파일 단계의 구조 검사에 사용되며 런타임에는 사라집니다.', 'Kotlin의 Parcelable 구현을 자동으로 생성합니다.'],
        answer: 2,
        explanation: 'TypeScript 타입 정보는 JavaScript 변환 과정에서 대부분 제거되므로 외부 입력은 별도로 검증해야 합니다.'
      },
      {
        question: '로딩, 성공, 빈 결과, 오류 상태를 서로 모순되지 않게 표현하는 데 가장 적합한 방식은 무엇입니까?',
        options: ['isLoading, isSuccess, isEmpty, isError boolean 네 개를 독립적으로 둡니다.', 'status 판별 속성을 가진 union type을 사용합니다.', '모든 값을 any로 선언합니다.', '오류 상태를 문자열 빈 값으로 나타냅니다.'],
        answer: 1,
        explanation: 'discriminated union은 각 상태가 가질 수 있는 속성을 분리하고 switch에서 안전하게 좁힐 수 있습니다.'
      },
      {
        question: '외부 JSON 값의 형태를 아직 알 수 없을 때 any보다 unknown이 유리한 이유는 무엇입니까?',
        options: ['unknown은 모든 속성 접근을 자동 허용합니다.', 'unknown은 사용 전에 조건 검사와 타입 좁히기를 요구합니다.', 'unknown은 JSON을 자동으로 암호화합니다.', 'unknown은 런타임 클래스를 생성합니다.'],
        answer: 1,
        explanation: 'unknown은 불확실성을 타입에 남겨 두고 검증 없이 속성을 사용하는 실수를 막습니다.'
      }
    ],
    sources: [
      { label: 'TypeScript 공식 문서 · Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
      { label: 'TypeScript 공식 문서 · Everyday Types', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html' },
      { label: 'TypeScript 공식 문서 · Narrowing', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html' },
      { label: 'TypeScript 공식 문서 · Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' }
    ]
  },
  {
    id: '04-components-jsx',
    no: 4,
    phase: '2부 · React',
    title: '함수 컴포넌트, JSX, props의 렌더링 모델',
    duration: '약 100분',
    minutes: 100,
    level: '필수',
    tags: ['React', 'JSX', 'props', 'key', 'purity'],
    summary: 'Composable 함수와 비슷해 보이는 함수 컴포넌트가 실제로 어떤 규칙으로 UI를 기술하는지 배웁니다.',
    outcomes: [
      '함수 컴포넌트가 일반 함수와 다른 호출 규칙을 설명할 수 있습니다.',
      'JSX 안에서 조건과 목록을 안전하게 표현할 수 있습니다.',
      'props를 읽기 전용 입력으로 다룰 수 있습니다.',
      '목록 key가 배열 인덱스보다 안정적인 식별자를 사용해야 하는 이유를 설명할 수 있습니다.'
    ],
    body: `
      <h2>컴포넌트 함수는 UI 설명을 반환합니다</h2>
      <p>React 컴포넌트는 props를 입력으로 받고 JSX를 반환하는 함수입니다. React는 필요한 시점에 컴포넌트 함수를 호출하여 화면의 다음 모습을 계산합니다. 개발자가 컴포넌트 함수를 임의의 일반 함수처럼 호출하지 않고 JSX로 사용해야 React가 상태와 Hook 호출 순서를 관리할 수 있습니다.</p>
      <div class="compare-grid">
        <div class="compare-card"><h3>Jetpack Compose</h3><p><code>@Composable</code> 함수가 UI 트리를 기술합니다. Compose Runtime이 호출 위치와 상태를 추적합니다.</p></div>
        <div class="compare-card"><h3>React</h3><p>이름이 대문자로 시작하는 함수 컴포넌트가 JSX를 반환합니다. React가 렌더링 중에 컴포넌트와 Hook을 추적합니다.</p></div>
      </div>

      <h2>JSX는 HTML 문자열이 아닙니다</h2>
      <p>JSX는 JavaScript 표현식으로 변환되는 문법입니다. React Native에서는 HTML 요소 대신 <code>View</code>, <code>Text</code>, <code>Image</code> 같은 React Native 컴포넌트를 사용합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 첫 함수 컴포넌트</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import { Pressable, Text, View } from 'react-native';

type CounterCardProps = {
  title: string;
  count: number;
  onIncrease: () =&gt; void;
};

export function CounterCard({
  title,
  count,
  onIncrease
}: CounterCardProps) {
  return (
    &lt;View&gt;
      &lt;Text&gt;{title}&lt;/Text&gt;
      &lt;Text&gt;{count}&lt;/Text&gt;
      &lt;Pressable onPress={onIncrease}&gt;
        &lt;Text&gt;증가&lt;/Text&gt;
      &lt;/Pressable&gt;
    &lt;/View&gt;
  );
}</code></pre>
      </div>
      <p>중괄호 안에는 JavaScript 표현식을 넣습니다. 문자열, 숫자, 변수, 함수 호출 결과, 조건식, 배열로 만든 컴포넌트 목록을 넣을 수 있습니다. <code>if</code> 문 자체는 표현식이 아니므로 JSX 밖에서 계산하거나 삼항 연산자와 논리 연산자를 사용합니다.</p>

      <h2>props는 읽기 전용 입력입니다</h2>
      <p>컴포넌트는 전달받은 props를 수정하지 않습니다. 부모가 새 props를 전달하면 React가 자식 컴포넌트를 다시 계산합니다. 자식이 부모 상태를 변경해야 할 때는 callback props를 호출합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 상태 소유권을 부모에 두기</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function ItemScreen() {
  const [selectedId, setSelectedId] = useState&lt;number | null&gt;(null);

  return items.map((item) =&gt; (
    &lt;ItemRow
      key={item.id}
      item={item}
      selected={item.id === selectedId}
      onPress={setSelectedId}
    /&gt;
  ));
}</code></pre>
      </div>
      <p><code>ItemRow</code>는 selected를 직접 바꾸지 않습니다. 사용자가 누르면 onPress를 호출하고, 부모가 selectedId를 바꾼 뒤 새 selected 값을 내려 줍니다. 이것이 단방향 데이터 흐름입니다.</p>

      <h2>컴포넌트는 순수하게 렌더링해야 합니다</h2>
      <p>같은 props와 같은 state가 주어지면 컴포넌트는 같은 JSX 결과를 계산해야 합니다. 렌더링 중에는 네트워크 요청, 파일 쓰기, 전역 변수 변경, 상태 갱신처럼 외부에 영향을 주는 작업을 실행하지 않습니다.</p>
      <div class="callout danger">
        <span class="callout-title">잘못된 렌더링 코드</span>
        컴포넌트 본문에서 <code>fetch()</code>를 호출하거나 <code>setState()</code>를 실행하면 렌더링할 때마다 작업이 반복될 수 있습니다. 사용자 동작은 이벤트 핸들러에서 처리하고, 외부 시스템 동기화는 Effect에서 처리합니다.
      </div>

      <h2>조건부 렌더링</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 상태별 UI</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function SearchContent({ state }: { state: SearchState }) {
  if (state.status === 'loading') {
    return &lt;ActivityIndicator /&gt;;
  }

  if (state.status === 'error') {
    return &lt;ErrorView message={state.message} /&gt;;
  }

  if (state.status === 'empty') {
    return &lt;EmptyView /&gt;;
  }

  return &lt;ItemList items={state.items} /&gt;;
}</code></pre>
      </div>
      <p>복잡한 조건을 JSX 안에 중첩된 삼항 연산자로 모두 넣기보다, 조기 반환이나 작은 컴포넌트로 분리하면 상태 분기가 분명해집니다.</p>

      <h2>목록과 key</h2>
      <p>React는 목록의 각 항목을 이전 렌더링과 연결하기 위해 key를 사용합니다. key는 형제 목록 안에서 안정적이고 고유해야 합니다. 데이터의 식별자를 사용해야 삽입, 삭제, 재정렬 후에도 각 컴포넌트의 상태가 올바른 항목에 연결됩니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 안정적인 key</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>{items.map((item) =&gt; (
  &lt;ItemRow key={item.id} item={item} /&gt;
))}</code></pre>
      </div>
      <div class="callout warning">
        <span class="callout-title">배열 인덱스를 key로 쓰면 안 되는 경우</span>
        목록의 항목이 추가, 삭제, 정렬되면 인덱스가 다른 데이터에 재사용됩니다. 입력값, 애니메이션 상태, 내부 state가 잘못된 행에 붙을 수 있습니다. 목록이 완전히 고정되어 순서가 절대 바뀌지 않는 경우를 제외하면 데이터 식별자를 사용합니다.
      </div>

      <h2>컴포넌트를 나누는 기준</h2>
      <ul>
        <li>여러 화면에서 반복되는 UI와 행동을 하나의 컴포넌트로 만듭니다.</li>
        <li>서로 다른 상태 소유권이나 수명주기를 가진 부분을 분리합니다.</li>
        <li>조건 분기가 커져서 화면의 목적을 읽기 어려울 때 하위 컴포넌트로 추출합니다.</li>
        <li>단순히 파일 줄 수를 줄이기 위해 의미 없는 래퍼 컴포넌트를 만들지는 않습니다.</li>
      </ul>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>Compose의 품목 행 Composable을 ItemRow 함수 컴포넌트로 옮깁니다.</li><li>선택 상태는 부모가 소유하고 callback props로 변경합니다.</li><li>로딩, 오류, 빈 결과, 성공 UI를 조기 반환으로 나눕니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>Composable 함수와 React 컴포넌트가 비슷한 점과 다른 점을 각각 세 가지 말합니다.</li><li>목록 key가 화면에 표시되지 않는데도 중요한 이유를 설명합니다.</li><li>컴포넌트 분리 기준을 현재 팀 앱의 실제 화면에 적용합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'React 함수 컴포넌트의 렌더링 중에 수행하기에 가장 부적절한 작업은 무엇입니까?',
        options: ['props에서 표시 문자열을 계산합니다.', '배열을 map으로 JSX 목록으로 변환합니다.', '전역 캐시에 값을 쓰고 네트워크 요청을 시작합니다.', '상태에 따라 다른 컴포넌트를 반환합니다.'],
        answer: 2,
        explanation: '렌더링은 순수해야 합니다. 외부 시스템 변경과 네트워크 요청은 이벤트 또는 Effect로 분리합니다.'
      },
      {
        question: '재정렬 가능한 목록의 key로 가장 적절한 값은 무엇입니까?',
        options: ['현재 배열 인덱스', '매 렌더링마다 생성한 난수', '항목 데이터의 안정적인 고유 ID', '화면에 보이는 순번 문자열'],
        answer: 2,
        explanation: '안정적인 데이터 ID가 이전 렌더링의 항목과 다음 렌더링의 항목을 올바르게 연결합니다.'
      },
      {
        question: '자식 컴포넌트가 부모가 소유한 선택 상태를 변경하는 일반적인 방식은 무엇입니까?',
        options: ['props 객체를 직접 수정합니다.', '부모가 전달한 callback을 호출합니다.', '전역 변수를 변경합니다.', '컴포넌트 함수를 일반 함수로 직접 호출합니다.'],
        answer: 1,
        explanation: '부모는 상태와 갱신 함수를 소유하고 자식은 callback을 통해 사용자 의도를 전달합니다.'
      }
    ],
    sources: [
      { label: 'React 공식 문서 · UI 표현하기', url: 'https://ko.react.dev/learn/describing-the-ui' },
      { label: 'React 공식 문서 · 컴포넌트에 props 전달하기', url: 'https://ko.react.dev/learn/passing-props-to-a-component' },
      { label: 'React 공식 문서 · 조건부 렌더링', url: 'https://ko.react.dev/learn/conditional-rendering' },
      { label: 'React 공식 문서 · 리스트 렌더링', url: 'https://ko.react.dev/learn/rendering-lists' },
      { label: 'React 공식 문서 · 컴포넌트를 순수하게 유지하기', url: 'https://ko.react.dev/learn/keeping-components-pure' }
    ]
  }
);
