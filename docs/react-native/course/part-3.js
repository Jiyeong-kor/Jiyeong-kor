window.RN_COURSE.push(
  {
    id: '09-core-components',
    no: 9,
    phase: '3부 · React Native',
    title: 'Core Components로 네이티브 화면 구성하기',
    duration: '약 105분',
    minutes: 105,
    level: '필수',
    tags: ['View', 'Text', 'Image', 'Pressable', 'TextInput', 'ScrollView', 'FlatList'],
    summary: 'React Native의 기본 컴포넌트가 Android와 iOS의 네이티브 뷰로 연결되는 방식과 각 컴포넌트의 책임을 익힙니다.',
    outcomes: [
      'View와 Text가 HTML div와 span의 단순 별칭이 아니라는 점을 설명할 수 있습니다.',
      'Pressable과 TextInput으로 사용자 입력을 구성할 수 있습니다.',
      'ScrollView와 FlatList를 데이터 규모에 따라 선택할 수 있습니다.',
      'Compose UI 요소를 React Native Core Component로 옮길 수 있습니다.'
    ],
    body: `
      <h2>React Native는 플랫폼 뷰를 React 컴포넌트로 사용합니다</h2>
      <p>React Native의 Core Components는 Android와 iOS의 플랫폼 뷰에 연결됩니다. <code>View</code>는 컨테이너, <code>Text</code>는 텍스트, <code>Image</code>는 이미지, <code>TextInput</code>은 키보드 입력을 담당합니다. React Native는 HTML을 WebView에 그리는 방식이 아닙니다.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>React Native</th><th>Android에서 가까운 요소</th><th>Compose에서 가까운 개념</th><th>주요 책임</th></tr></thead>
          <tbody>
            <tr><td><code>View</code></td><td>ViewGroup 계열</td><td>Box, Row, Column의 기반 컨테이너</td><td>Flexbox 레이아웃, 배경, 테두리, 접근성, 터치 응답</td></tr>
            <tr><td><code>Text</code></td><td>TextView</td><td>Text</td><td>문자열 표시, 중첩 텍스트 스타일, 텍스트 이벤트</td></tr>
            <tr><td><code>Image</code></td><td>ImageView</td><td>Image, AsyncImage 계열</td><td>로컬 및 원격 이미지 표시</td></tr>
            <tr><td><code>Pressable</code></td><td>클릭 가능한 View</td><td>Modifier.clickable 또는 Button 기반</td><td>누름 시작, 누름 종료, 길게 누르기, pressed 상태</td></tr>
            <tr><td><code>TextInput</code></td><td>EditText</td><td>TextField</td><td>키보드 입력, focus, submit, 선택과 조합 입력</td></tr>
            <tr><td><code>ScrollView</code></td><td>ScrollView</td><td>Column + verticalScroll</td><td>모든 자식을 한 번에 렌더링하는 스크롤 컨테이너</td></tr>
            <tr><td><code>FlatList</code></td><td>RecyclerView</td><td>LazyColumn</td><td>긴 목록을 가상화하여 필요한 항목을 렌더링</td></tr>
          </tbody>
        </table>
      </div>

      <h2>View는 일반 컨테이너입니다</h2>
      <p><code>View</code>는 flexbox 레이아웃, style, 일부 터치 처리와 접근성 속성을 지원합니다. 화면 전체, 카드, 행, 구분 영역을 View로 구성합니다. 그러나 문자열을 View 안에 직접 넣지 않고 Text로 감싸야 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 카드 구성</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function WasteCard({ item }: { item: WasteItem }) {
  return (
    &lt;View style={styles.card}&gt;
      &lt;Text style={styles.title}&gt;{item.name}&lt;/Text&gt;
      &lt;Text style={styles.description}&gt;{item.description}&lt;/Text&gt;
    &lt;/View&gt;
  );
}</code></pre>
      </div>

      <h2>Text 안에서는 텍스트 레이아웃이 적용됩니다</h2>
      <p>Text는 다른 View와 달리 내부에서 텍스트 레이아웃을 사용합니다. 중첩 Text는 상위 Text의 글꼴 속성을 상속할 수 있습니다. 여러 스타일의 문장을 한 텍스트 흐름으로 표시할 때 유용합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 중첩 Text</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>&lt;Text style={styles.baseText}&gt;
  배출 유형: &lt;Text style={styles.emphasis}&gt;재활용&lt;/Text&gt;
&lt;/Text&gt;</code></pre>
      </div>
      <p>View 안의 Text 두 개는 Flexbox 자식입니다. Text 안의 Text는 하나의 텍스트 문단으로 배치됩니다. 이 차이를 모르고 Text를 임의의 레이아웃 컨테이너처럼 사용하면 정렬이 달라집니다.</p>

      <h2>Pressable은 상호작용 상태를 제공합니다</h2>
      <p>기본 Button은 빠른 예제에는 편리하지만 디자인 제어가 제한적입니다. 실무 UI에서는 Pressable을 사용해 pressed, hovered, focused 상태에 따라 style과 자식을 바꿀 수 있습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · pressed 상태가 있는 버튼</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function RetryButton({ onPress }: { onPress: () =&gt; void }) {
  return (
    &lt;Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) =&gt; [
        styles.retryButton,
        pressed &amp;&amp; styles.retryButtonPressed
      ]}
    &gt;
      &lt;Text style={styles.retryLabel}&gt;다시 시도&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
}</code></pre>
      </div>

      <h2>TextInput은 값과 이벤트를 연결합니다</h2>
      <p>제어 입력에서는 <code>value</code>와 <code>onChangeText</code>를 연결합니다. 입력 값의 원본은 React state입니다. 키보드 종류, 자동 완성, 대문자 변환, submit 행동을 플랫폼에 맞게 지정합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 검색 입력</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const [keyword, setKeyword] = useState('');

&lt;TextInput
  value={keyword}
  onChangeText={setKeyword}
  placeholder="품목 이름을 입력하세요"
  returnKeyType="search"
  onSubmitEditing={submitSearch}
  autoCapitalize="none"
  accessibilityLabel="품목 검색어"
/&gt;</code></pre>
      </div>

      <h2>ScrollView와 FlatList를 구분합니다</h2>
      <div class="compare-grid">
        <div class="compare-card"><h3>ScrollView</h3><p>자식 전체를 한 번에 렌더링합니다. 설정 화면, 짧은 상세 내용, 항목 수가 작고 고정된 화면에 적합합니다.</p></div>
        <div class="compare-card"><h3>FlatList</h3><p>현재 화면 주변의 항목을 가상화합니다. 검색 결과, 저장 목록, 무한 스크롤처럼 항목 수가 크거나 변하는 목록에 적합합니다.</p></div>
      </div>
      <p>FlatList를 ScrollView 안에 같은 방향으로 중첩하면 가상화와 높이 측정이 깨질 수 있습니다. 목록의 header와 footer는 <code>ListHeaderComponent</code>, <code>ListFooterComponent</code>로 넣습니다.</p>

      <h2>한 화면을 Core Components로 작성하기</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 검색 목록 화면</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export function ItemSearchScreen() {
  const [keyword, setKeyword] = useState('');
  const visibleItems = items.filter((item) =&gt;
    item.name.includes(keyword.trim())
  );

  return (
    &lt;View style={styles.screen}&gt;
      &lt;TextInput
        value={keyword}
        onChangeText={setKeyword}
        placeholder="품목 검색"
        style={styles.input}
      /&gt;

      &lt;FlatList
        data={visibleItems}
        keyExtractor={(item) =&gt; String(item.id)}
        renderItem={({ item }) =&gt; (
          &lt;Pressable style={styles.row}&gt;
            &lt;Text style={styles.rowTitle}&gt;{item.name}&lt;/Text&gt;
          &lt;/Pressable&gt;
        )}
        ListEmptyComponent={
          &lt;Text style={styles.empty}&gt;검색 결과가 없습니다.&lt;/Text&gt;
        }
      /&gt;
    &lt;/View&gt;
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 12 },
  row: { minHeight: 56, justifyContent: 'center' },
  rowTitle: { fontSize: 16 },
  empty: { padding: 24, textAlign: 'center' }
});</code></pre>
      </div>

      <div class="callout warning">
        <span class="callout-title">웹 태그를 그대로 사용하지 않습니다</span>
        기본 React Native Android와 iOS 화면에서 <code>div</code>, <code>button</code>, <code>input</code>을 사용하지 않습니다. React Native Web을 별도로 사용하는 경우에는 웹 렌더링 계층이 관여하지만, 모바일 Core Components 학습에서는 View, Pressable, TextInput을 기준으로 합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>기존 Compose 목록 화면을 View, TextInput, FlatList로 다시 만듭니다.</li><li>빈 결과와 오류 화면을 별도 컴포넌트로 만듭니다.</li><li>Pressable의 pressed 상태에 시각 피드백을 추가합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>현재 앱의 각 Composable을 Core Component로 대응시킵니다.</li><li>ScrollView를 쓰면 안 되는 목록 사례를 찾습니다.</li><li>Text 중첩과 View 안의 여러 Text가 다른 이유를 설명합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '항목 수가 수천 개까지 늘어날 수 있는 검색 결과 목록에 가장 적절한 기본 컴포넌트는 무엇입니까?',
        options: ['View', 'ScrollView 안에 모든 항목', 'FlatList', 'Text'],
        answer: 2,
        explanation: 'FlatList는 현재 화면 주변 항목을 가상화하므로 긴 동적 목록에 적합합니다.'
      },
      {
        question: 'React Native 화면에서 문자열을 표시하는 올바른 기본 방식은 무엇입니까?',
        options: ['View 안에 문자열을 직접 넣습니다.', 'Text 컴포넌트 안에 문자열을 넣습니다.', 'HTML span을 사용합니다.', '문자열은 Image로 변환합니다.'],
        answer: 1,
        explanation: 'React Native의 문자열은 Text 컴포넌트 안에서 렌더링해야 합니다.'
      },
      {
        question: 'Pressable을 사용하는 주요 이유는 무엇입니까?',
        options: ['데이터베이스를 자동으로 연결합니다.', '누름 단계와 pressed 상태를 이용해 상호작용을 제어합니다.', 'JavaScript 번들을 생성합니다.', '네이티브 모듈을 등록합니다.'],
        answer: 1,
        explanation: 'Pressable은 press 시작과 종료, 길게 누르기, pressed 상태에 따른 UI를 구성할 수 있습니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Core Components and APIs', url: 'https://reactnative.dev/docs/components-and-apis' },
      { label: 'React Native 공식 문서 · View', url: 'https://reactnative.dev/docs/view' },
      { label: 'React Native 공식 문서 · Text', url: 'https://reactnative.dev/docs/text' },
      { label: 'React Native 공식 문서 · Pressable', url: 'https://reactnative.dev/docs/pressable' },
      { label: 'React Native 공식 문서 · TextInput', url: 'https://reactnative.dev/docs/textinput' },
      { label: 'React Native 공식 문서 · FlatList', url: 'https://reactnative.dev/docs/flatlist' }
    ]
  },
  {
    id: '10-style-layout',
    no: 10,
    phase: '3부 · React Native',
    title: 'StyleSheet, Flexbox, 반응형 화면과 Safe Area',
    duration: '약 125분',
    minutes: 125,
    level: '필수',
    tags: ['StyleSheet', 'Flexbox', 'useWindowDimensions', 'Safe Area', 'edge-to-edge', 'fontScale'],
    summary: '웹 CSS와 다른 React Native 스타일 규칙을 익히고 작은 화면, 큰 글자, Android edge-to-edge를 함께 처리합니다.',
    outcomes: [
      'React Native Flexbox의 기본값이 웹 CSS와 다른 부분을 설명할 수 있습니다.',
      'StyleSheet와 style 배열을 사용해 조건부 스타일을 구성할 수 있습니다.',
      'useWindowDimensions로 화면 크기와 fontScale 변화에 대응할 수 있습니다.',
      'Safe Area와 Android edge-to-edge를 레이아웃 설계에 반영할 수 있습니다.'
    ],
    body: `
      <h2>style은 JavaScript 객체입니다</h2>
      <p>React Native Core Component는 <code>style</code> prop을 받습니다. 속성 이름은 CSS와 비슷하지만 <code>background-color</code>가 아니라 <code>backgroundColor</code>처럼 camelCase를 사용합니다. 모든 웹 CSS 속성이 지원되는 것은 아닙니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · StyleSheet와 조건부 배열</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 20,
    justifyContent: 'center'
  },
  chipSelected: {
    backgroundColor: '#5B4DF5',
    borderColor: '#5B4DF5'
  },
  chipLabelSelected: {
    color: '#FFFFFF'
  }
});

&lt;Pressable style={[styles.chip, selected &amp;&amp; styles.chipSelected]}&gt;
  &lt;Text style={selected &amp;&amp; styles.chipLabelSelected}&gt;플라스틱&lt;/Text&gt;
&lt;/Pressable&gt;</code></pre>
      </div>
      <p>style 배열에서는 뒤에 있는 값이 앞의 속성을 덮어씁니다. false, null, undefined는 무시되므로 조건부 style을 자연스럽게 넣을 수 있습니다.</p>

      <h2>숫자 크기는 밀도 독립 단위로 해석됩니다</h2>
      <p>React Native의 숫자형 width, height, margin은 단위가 없는 값이며 플랫폼의 밀도 독립 단위로 처리됩니다. Android의 dp와 목적이 가깝습니다. 그러나 실제 물리 크기가 모든 기기에서 완전히 같다는 뜻은 아닙니다.</p>
      <div class="callout note">
        <span class="callout-title">PixelRatio를 습관적으로 곱하지 않습니다</span>
        일반 레이아웃 값에는 기기 밀도를 직접 곱하지 않습니다. React Native가 플랫폼 밀도에 맞춰 처리합니다. 이미지 자산과 물리 픽셀 계산이 필요한 특별한 경우에 PixelRatio를 사용합니다.
      </div>

      <h2>React Native Flexbox의 기본값</h2>
      <p>Flexbox 개념은 웹과 비슷하지만 기본값이 다릅니다. 가장 중요한 차이는 <code>flexDirection</code> 기본값이 <code>column</code>이라는 점입니다. 따라서 View 자식은 기본적으로 세로로 배치됩니다.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>속성</th><th>React Native 기본값 또는 의미</th><th>Compose 연결</th></tr></thead>
          <tbody>
            <tr><td><code>flexDirection</code></td><td><code>column</code></td><td>Column이 기본 컨테이너인 것처럼 동작</td></tr>
            <tr><td><code>justifyContent</code></td><td>주축 배치</td><td>Arrangement 계열</td></tr>
            <tr><td><code>alignItems</code></td><td>교차축에서 자식 배치</td><td>Alignment 계열</td></tr>
            <tr><td><code>flex: 1</code></td><td>부모의 남은 공간을 비율로 차지</td><td>Modifier.weight와 fillMaxSize의 조합을 상황에 맞게 해석</td></tr>
            <tr><td><code>gap</code></td><td>자식 사이 간격</td><td>Arrangement.spacedBy</td></tr>
            <tr><td><code>flexWrap</code></td><td>주축 공간이 부족할 때 줄바꿈</td><td>FlowRow 또는 FlowColumn에 가까운 목적</td></tr>
          </tbody>
        </table>
      </div>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · Row와 Column 만들기</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
    gap: 12
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  }
});</code></pre>
      </div>

      <h2>flex 자식이 보이지 않을 때 부모 크기를 확인합니다</h2>
      <p><code>flex: 1</code>은 부모에게 사용할 수 있는 크기가 있을 때만 의미가 있습니다. 부모의 높이가 0으로 결정되면 자식이 flex를 가져도 보이지 않습니다. 화면 루트와 내비게이션 컨테이너가 적절한 크기를 제공하는지 확인합니다.</p>

      <h2>화면 너비보다 사용 가능한 공간을 기준으로 설계합니다</h2>
      <p><code>useWindowDimensions</code>는 width, height뿐 아니라 scale과 fontScale을 제공하며 창 크기와 글꼴 크기가 바뀌면 새 값을 반환합니다. 회전, 폴더블, 멀티윈도우, 큰 글자에서 고정된 기기 모델을 가정하지 않습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 사용 가능한 너비에 따라 열 수 조정</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function CategoryGrid() {
  const { width, fontScale } = useWindowDimensions();
  const compact = width &lt; 420 || fontScale &gt;= 1.3;
  const columns = compact ? 2 : 3;

  return (
    &lt;FlatList
      key={columns}
      numColumns={columns}
      data={categories}
      renderItem={renderCategory}
    /&gt;
  );
}</code></pre>
      </div>
      <p>FlatList의 <code>numColumns</code>가 바뀔 때 key를 바꾸는 이유는 목록 레이아웃을 새 인스턴스로 다시 구성하기 위해서입니다. 실제 화면에서는 큰 글자에서 카드 내부 텍스트가 잘리지 않는지도 함께 검증합니다.</p>

      <h2>Safe Area는 화면 가장자리의 사용 불가능 영역입니다</h2>
      <p>노치, Dynamic Island, 둥근 모서리, 상태 표시줄, 홈 인디케이터가 콘텐츠를 가릴 수 있습니다. React Native Core의 SafeAreaView는 현재 deprecated 상태이므로 <code>react-native-safe-area-context</code> 사용을 기준으로 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · SafeAreaProvider와 inset</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import {
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context';

function AppContent() {
  const insets = useSafeAreaInsets();

  return (
    &lt;View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }}
    &gt;
      &lt;MainScreen /&gt;
    &lt;/View&gt;
  );
}

export default function App() {
  return (
    &lt;SafeAreaProvider&gt;
      &lt;AppContent /&gt;
    &lt;/SafeAreaProvider&gt;
  );
}</code></pre>
      </div>
      <p>내비게이션 라이브러리가 이미 safe area를 처리하는 영역에 padding을 다시 넣으면 공간이 중복될 수 있습니다. 각 화면이 누구에게 inset 책임이 있는지 확인합니다.</p>

      <h2>Android 15 이상 edge-to-edge</h2>
      <p>최신 Android는 앱 콘텐츠가 시스템 바 아래까지 그려지는 edge-to-edge를 기본 방향으로 삼습니다. React Native 0.86은 Android 15 이상에서 좌표, KeyboardAvoidingView, Dimensions, Modal의 상태 표시줄 처리를 개선했습니다. 그러나 디자인 단계에서 시스템 바 아래 콘텐츠와 대비를 고려해야 합니다.</p>
      <ul>
        <li>상단 앱 바와 첫 콘텐츠가 상태 표시줄에 가려지지 않는지 확인합니다.</li>
        <li>하단 버튼과 목록 마지막 항목이 내비게이션 바 또는 제스처 영역에 가려지지 않는지 확인합니다.</li>
        <li>Modal이 열렸을 때 상태 표시줄 아이콘 색상과 배경 대비를 확인합니다.</li>
        <li>키보드와 edge-to-edge가 함께 적용될 때 입력과 버튼이 보이는지 확인합니다.</li>
      </ul>

      <h2>큰 글자는 별도 화면 크기 조건입니다</h2>
      <p>너비가 넓어도 fontScale이 크면 한 줄에 들어가는 정보가 줄어듭니다. 텍스트를 임의로 축소하거나 <code>allowFontScaling={false}</code>로 막는 대신 레이아웃이 늘어나고 줄바꿈되도록 설계합니다.</p>
      <div class="callout warning">
        <span class="callout-title">고정 높이 카드의 위험</span>
        텍스트가 포함된 카드에 작은 고정 height를 주면 번역 길이, 큰 글자, 접근성 bold text에서 잘릴 수 있습니다. 최소 높이와 padding을 사용하고 콘텐츠가 늘어날 수 있게 합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>320dp, 390dp, 600dp 너비에서 같은 화면을 확인합니다.</li><li>fontScale 1.3 이상에서 그리드 열 수와 카드 높이를 조정합니다.</li><li>상단과 하단 safe area를 포함한 전체 화면 레이아웃을 만듭니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>Compose WindowInsets와 safe-area-context의 책임을 비교합니다.</li><li>현재 앱에서 고정 높이 때문에 큰 글자에서 깨질 요소를 찾습니다.</li><li>edge-to-edge에서 배경은 시스템 바까지 그리되 콘텐츠만 inset을 적용할 영역을 정합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'React Native Flexbox의 flexDirection 기본값은 무엇입니까?',
        options: ['row', 'column', 'row-reverse', 'absolute'],
        answer: 1,
        explanation: 'React Native에서는 자식이 기본적으로 세로 방향으로 배치됩니다.'
      },
      {
        question: '현재 React Native에서 safe area 처리를 위해 권장되는 선택은 무엇입니까?',
        options: ['Core SafeAreaView만 사용합니다.', 'react-native-safe-area-context를 사용하고 내비게이션 책임과 중복되지 않게 합니다.', '모든 화면에 고정 paddingTop 44를 넣습니다.', 'Safe Area는 iOS에서만 있으므로 Android에서는 무시합니다.'],
        answer: 1,
        explanation: 'Core SafeAreaView는 deprecated이며 safe-area-context가 플랫폼과 내비게이션 연동에서 일반적인 기준입니다.'
      },
      {
        question: '큰 글자 대응을 위해 가장 적절한 방식은 무엇입니까?',
        options: ['모든 Text에서 글자 크기 확대를 금지합니다.', '고정 높이를 유지하고 텍스트를 잘라 냅니다.', 'fontScale과 실제 레이아웃을 확인하고 줄바꿈과 높이 확장을 허용합니다.', '화면 너비만 확인하면 충분합니다.'],
        answer: 2,
        explanation: '큰 글자는 같은 화면 너비에서도 필요한 공간을 바꾸므로 레이아웃 자체가 적응해야 합니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Style', url: 'https://reactnative.dev/docs/style' },
      { label: 'React Native 공식 문서 · Flexbox', url: 'https://reactnative.dev/docs/flexbox' },
      { label: 'React Native 공식 문서 · Height and Width', url: 'https://reactnative.dev/docs/height-and-width' },
      { label: 'React Native 공식 문서 · useWindowDimensions', url: 'https://reactnative.dev/docs/usewindowdimensions' },
      { label: 'React Native 공식 문서 · SafeAreaView deprecation', url: 'https://reactnative.dev/docs/safeareaview' },
      { label: 'Expo 공식 문서 · react-native-safe-area-context', url: 'https://docs.expo.dev/versions/latest/sdk/safe-area-context/' },
      { label: 'React Native 0.86 · Android edge-to-edge 개선', url: 'https://reactnative.dev/blog/2026/06/11/react-native-0.86' }
    ]
  },
  {
    id: '11-input-accessibility',
    no: 11,
    phase: '3부 · React Native',
    title: '터치, 입력 폼, 키보드, 접근성',
    duration: '약 130분',
    minutes: 130,
    level: '필수',
    tags: ['Pressable', 'TextInput', 'Keyboard', 'Accessibility', 'TalkBack', 'VoiceOver'],
    summary: '시각적인 버튼과 입력창을 만드는 데서 끝내지 않고 키보드, 오류 안내, 터치 영역, 스크린 리더까지 포함한 상호작용을 설계합니다.',
    outcomes: [
      'Pressable의 press 단계와 hitSlop을 사용할 수 있습니다.',
      '제어 TextInput과 focus 이동, submit, 키보드 표시를 처리할 수 있습니다.',
      '접근성 이름, 역할, 상태를 올바르게 제공할 수 있습니다.',
      'TalkBack과 VoiceOver에서 읽기 순서와 오류 안내를 검증할 수 있습니다.'
    ],
    body: `
      <h2>터치 피드백은 장식이 아니라 상태 전달입니다</h2>
      <p>사용자는 손가락이 화면을 가린 상태에서 조작합니다. Pressable은 <code>onPressIn</code>, <code>onPressOut</code>, <code>onLongPress</code>, <code>onPress</code>와 pressed 상태를 제공합니다. 눌렀다는 시각 피드백, disabled 상태, 로딩 중 중복 입력 방지를 함께 설계합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 접근 가능한 선택 버튼</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>type SelectButtonProps = {
  selected: boolean;
  disabled?: boolean;
  onPress: () =&gt; void;
};

function SelectButton({
  selected,
  disabled = false,
  onPress
}: SelectButtonProps) {
  return (
    &lt;Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={selected ? '선택 해제' : '선택'}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) =&gt; [
        styles.selectButton,
        selected &amp;&amp; styles.selectButtonSelected,
        pressed &amp;&amp; !disabled &amp;&amp; styles.selectButtonPressed,
        disabled &amp;&amp; styles.selectButtonDisabled
      ]}
    &gt;
      &lt;Text&gt;{selected ? '선택됨' : '선택'}&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
}</code></pre>
      </div>
      <p><code>hitSlop</code>은 시각적 크기를 바꾸지 않고 터치 가능 영역을 늘립니다. 그러나 터치 영역은 부모 View 경계를 넘어 확장되지 않을 수 있으며, 겹치는 요소가 있으면 z-order가 우선합니다.</p>

      <h2>TextInput을 제어 입력으로 사용합니다</h2>
      <p>값과 UI를 일치시키려면 state를 TextInput의 value로 전달하고 onChangeText에서 갱신합니다. 입력 형식 변환을 매 글자마다 과도하게 수행하면 조합 중인 한글 입력과 커서 위치가 깨질 수 있으므로 검증 시점을 설계합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 검색 폼</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>function SearchForm({ onSubmit }: { onSubmit: (keyword: string) =&gt; void }) {
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState&lt;string | null&gt;(null);

  function submit() {
    const normalized = keyword.trim();
    if (!normalized) {
      setError('검색어를 입력해 주세요.');
      return;
    }

    setError(null);
    onSubmit(normalized);
  }

  return (
    &lt;View&gt;
      &lt;TextInput
        value={keyword}
        onChangeText={setKeyword}
        onSubmitEditing={submit}
        returnKeyType="search"
        placeholder="품목 이름"
        accessibilityLabel="품목 검색어"
        accessibilityHint="입력한 뒤 검색 키를 누르세요"
      /&gt;
      {error &amp;&amp; (
        &lt;Text accessibilityLiveRegion="polite"&gt;{error}&lt;/Text&gt;
      )}
      &lt;Pressable accessibilityRole="button" onPress={submit}&gt;
        &lt;Text&gt;검색&lt;/Text&gt;
      &lt;/Pressable&gt;
    &lt;/View&gt;
  );
}</code></pre>
      </div>

      <h2>키보드는 화면의 사용 가능한 높이를 바꿉니다</h2>
      <p>키보드가 나타나면 입력창, 오류 문구, 제출 버튼이 가려질 수 있습니다. 화면 구조에 따라 KeyboardAvoidingView, ScrollView의 keyboard 관련 props, 내비게이션 라이브러리의 키보드 처리, 직접 측정을 조합합니다.</p>
      <ul>
        <li><code>keyboardShouldPersistTaps</code>는 목록 안 입력 중 다른 버튼을 누를 때 키보드와 탭 처리에 영향을 줍니다.</li>
        <li><code>keyboardDismissMode</code>는 스크롤 시 키보드를 내리는 동작을 설정합니다.</li>
        <li>Android의 windowSoftInputMode와 edge-to-edge 설정이 실제 레이아웃에 영향을 줄 수 있습니다.</li>
        <li>키보드 종류와 예측 입력 표시줄 높이가 바뀌는 경우도 확인합니다.</li>
      </ul>
      <div class="callout warning">
        <span class="callout-title">고정된 keyboardVerticalOffset을 복사하지 않습니다</span>
        상단 내비게이션 높이, safe area, 화면 구조가 다르면 같은 값이 맞지 않습니다. 실제 레이아웃에서 가려지는 영역을 측정하고 플랫폼별로 검증합니다.
      </div>

      <h2>focus는 ref로 명령할 수 있습니다</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 다음 입력으로 focus 이동</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const passwordRef = useRef&lt;TextInput&gt;(null);

&lt;TextInput
  returnKeyType="next"
  onSubmitEditing={() =&gt; passwordRef.current?.focus()}
/&gt;

&lt;TextInput
  ref={passwordRef}
  secureTextEntry
  returnKeyType="done"
  onSubmitEditing={submit}
/&gt;</code></pre>
      </div>
      <p>focus 이동 순서는 시각적 순서와 스크린 리더 탐색 순서에 어긋나지 않아야 합니다. 오류가 발생했을 때 사용자가 문제 위치를 찾을 수 있도록 오류 문구, 접근성 알림, 필요하면 focus 이동을 함께 설계합니다.</p>

      <h2>접근성 이름, 역할, 상태를 분리합니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>속성</th><th>의미</th><th>예시</th></tr></thead>
          <tbody>
            <tr><td><code>accessibilityLabel</code></td><td>사용자가 요소가 무엇인지 알 수 있는 이름</td><td>아이콘 버튼에 “필터 열기”</td></tr>
            <tr><td><code>accessibilityRole</code></td><td>버튼, 링크, 헤더, 체크박스 등의 의미</td><td><code>button</code>, <code>header</code></td></tr>
            <tr><td><code>accessibilityState</code></td><td>disabled, selected, checked, busy, expanded 상태</td><td>선택 칩의 selected</td></tr>
            <tr><td><code>accessibilityHint</code></td><td>동작 결과가 이름만으로 불분명할 때 추가 설명</td><td>“두 번 탭하면 지도를 엽니다”</td></tr>
            <tr><td><code>accessibilityLiveRegion</code></td><td>동적으로 바뀐 문구를 Android 접근성 서비스에 알림</td><td>검증 오류, 결과 개수</td></tr>
          </tbody>
        </table>
      </div>
      <p>화면에 Text가 보인다고 모든 아이콘과 상태가 자동으로 설명되는 것은 아닙니다. 반대로 시각적 Text와 접근성 label이 중복되면 스크린 리더가 같은 내용을 두 번 읽을 수 있습니다.</p>

      <h2>읽기 순서와 그룹화</h2>
      <p>복잡한 카드에서 부모 View를 하나의 접근성 요소로 묶으면 자식의 개별 탐색이 사라질 수 있습니다. 사용자가 카드 전체를 한 번에 이해해야 하는지, 내부 버튼을 따로 조작해야 하는지에 따라 그룹화를 결정합니다.</p>
      <ul>
        <li>카드 전체가 하나의 버튼이면 이름에 핵심 정보를 합쳐 제공합니다.</li>
        <li>카드 안에 저장 버튼과 상세 버튼이 따로 있으면 각각 탐색 가능해야 합니다.</li>
        <li>장식용 아이콘과 이미지는 접근성 탐색에서 제외합니다.</li>
        <li>모달이 열리면 스크린 리더 focus가 모달 내부로 이동하고 배경으로 빠져나가지 않는지 확인합니다.</li>
      </ul>

      <h2>최소 검증 행렬</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>조건</th><th>검증 내용</th></tr></thead>
          <tbody>
            <tr><td>TalkBack</td><td>역할, 이름, 상태, 탐색 순서, 뒤로가기</td></tr>
            <tr><td>VoiceOver</td><td>Rotor 탐색, 모달 focus, 제스처, 힌트</td></tr>
            <tr><td>큰 글자</td><td>텍스트 잘림, 버튼 높이, 목록 행 확장</td></tr>
            <tr><td>키보드</td><td>입력과 오류, 제출 버튼 가림, focus 이동</td></tr>
            <tr><td>동작 감소</td><td>필수 정보가 애니메이션에만 의존하지 않는지</td></tr>
            <tr><td>색각과 고대비</td><td>색만으로 선택과 오류를 구분하지 않는지</td></tr>
          </tbody>
        </table>
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>아이콘만 있는 버튼에 label과 role을 추가합니다.</li><li>선택 칩에 selected와 disabled 상태를 제공합니다.</li><li>검색 오류를 live region으로 알리고 키보드가 열린 상태에서 확인합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>카드 전체를 묶을지 내부 요소를 분리할지 실제 화면으로 결정합니다.</li><li>색만으로 표현한 상태를 찾아 텍스트나 아이콘을 추가합니다.</li><li>Compose semantics 테스트와 React Native 접근성 props를 비교합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '아이콘만 있는 필터 버튼에 가장 먼저 필요한 접근성 정보는 무엇입니까?',
        options: ['배경색 이름', 'accessibilityLabel과 button 역할', 'JavaScript 파일 경로', '현재 화면 너비'],
        answer: 1,
        explanation: '시각적 아이콘을 볼 수 없는 사용자가 요소의 이름과 조작 방식을 알 수 있어야 합니다.'
      },
      {
        question: 'hitSlop의 역할은 무엇입니까?',
        options: ['버튼의 시각적 크기를 반드시 확대합니다.', '시각적 크기를 유지하면서 터치 인식 영역을 늘릴 수 있습니다.', '텍스트 글꼴 크기를 확대합니다.', '키보드를 자동으로 닫습니다.'],
        answer: 1,
        explanation: '작은 아이콘 버튼의 터치 가능 영역을 넓힐 때 사용할 수 있습니다.'
      },
      {
        question: '한글 입력 중 매 글자마다 입력 문자열을 강제로 변환하는 코드를 주의해야 하는 이유는 무엇입니까?',
        options: ['TextInput은 한글을 지원하지 않기 때문입니다.', '조합 중인 입력과 커서 위치가 깨질 수 있기 때문입니다.', 'TypeScript가 문자열을 허용하지 않기 때문입니다.', 'Pressable과 함께 사용할 수 없기 때문입니다.'],
        answer: 1,
        explanation: 'IME 조합 상태를 고려하지 않은 즉시 변환은 입력 경험을 손상할 수 있으므로 검증과 정규화 시점을 설계해야 합니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Pressable', url: 'https://reactnative.dev/docs/pressable' },
      { label: 'React Native 공식 문서 · TextInput', url: 'https://reactnative.dev/docs/textinput' },
      { label: 'React Native 공식 문서 · KeyboardAvoidingView', url: 'https://reactnative.dev/docs/keyboardavoidingview' },
      { label: 'React Native 공식 문서 · Accessibility', url: 'https://reactnative.dev/docs/accessibility' },
      { label: 'React Native 공식 문서 · AccessibilityInfo', url: 'https://reactnative.dev/docs/accessibilityinfo' }
    ]
  },
  {
    id: '12-lists-performance',
    no: 12,
    phase: '3부 · React Native',
    title: 'FlatList, 이미지, 애니메이션과 성능 측정',
    duration: '약 145분',
    minutes: 145,
    level: '필수',
    tags: ['FlatList', 'virtualization', 'Image', 'Animated', 'memo', 'DevTools'],
    summary: '긴 목록과 이미지가 있는 실제 앱에서 렌더링 비용을 측정하고 FlatList 설정과 컴포넌트 구조를 근거 있게 최적화합니다.',
    outcomes: [
      'FlatList 가상화와 ScrollView 전체 렌더링의 차이를 설명할 수 있습니다.',
      'keyExtractor, extraData, renderItem, getItemLayout의 역할을 설명할 수 있습니다.',
      '이미지 크기와 resizeMode를 명시적으로 설계할 수 있습니다.',
      'memo와 useCallback을 측정 없이 남용하지 않고 DevTools로 병목을 찾을 수 있습니다.'
    ],
    body: `
      <h2>FlatList는 목록 데이터와 항목 렌더링 함수를 분리합니다</h2>
      <p>FlatList는 <code>data</code>와 <code>renderItem</code>을 받아 보이는 영역 주변의 항목을 렌더링합니다. RecyclerView와 LazyColumn처럼 목록 항목을 가상화합니다. 화면 밖 항목의 내부 상태가 항상 보존된다고 가정하지 않아야 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 기본 FlatList</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const renderItem = ({ item }: ListRenderItemInfo&lt;WasteItem&gt;) =&gt; (
  &lt;ItemRow item={item} /&gt;
);

&lt;FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) =&gt; String(item.id)}
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={EmptyResult}
/&gt;</code></pre>
      </div>

      <h2>목록 밖에 상태 원본을 둡니다</h2>
      <p>가상화로 항목이 화면에서 멀어지면 해당 항목 컴포넌트가 제거될 수 있습니다. 반드시 유지해야 하는 선택, 입력, 펼침 상태를 행 내부에만 두면 스크롤 후 사라질 수 있습니다. 목록 소유 state나 데이터 모델에 상태를 둡니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 선택 상태를 목록 밖에서 관리</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const [selectedIds, setSelectedIds] = useState&lt;Set&lt;number&gt;&gt;(
  () =&gt; new Set()
);

function toggle(id: number) {
  setSelectedIds((previous) =&gt; {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

&lt;FlatList
  data={items}
  extraData={selectedIds}
  renderItem={({ item }) =&gt; (
    &lt;ItemRow
      item={item}
      selected={selectedIds.has(item.id)}
      onPress={() =&gt; toggle(item.id)}
    /&gt;
  )}
/>&gt;</code></pre>
      </div>
      <p>FlatList는 PureComponent 성격을 가지므로 data 밖의 값이 renderItem 결과에 영향을 준다면 <code>extraData</code>로 변경을 알려야 합니다. 위 예시의 마지막 닫는 태그에 보이는 추가 문자처럼 작은 TSX 오타도 실제 빌드에서 잡히므로 코드를 복사한 뒤 TypeScript 오류를 직접 확인하는 습관이 필요합니다.</p>
      <div class="callout note">
        <span class="callout-title">Set도 새 인스턴스로 교체합니다</span>
        기존 Set에 add와 delete를 직접 호출한 뒤 같은 참조를 반환하지 않습니다. 새 Set을 만들고 갱신해야 React와 FlatList가 변경을 판단할 수 있습니다.
      </div>

      <h2>renderItem의 참조보다 먼저 렌더링 비용을 봅니다</h2>
      <p>renderItem을 useCallback으로 감싸는 것만으로 항목 렌더링이 자동으로 줄어들지는 않습니다. ItemRow의 props가 매번 달라지는지, 무거운 계산이나 이미지가 있는지, 부모 state가 너무 넓게 변하는지 확인합니다.</p>
      <ul>
        <li>행 컴포넌트를 작게 분리하고 필요한 값만 props로 전달합니다.</li>
        <li>React DevTools에서 어떤 props 때문에 다시 렌더링되었는지 확인합니다.</li>
        <li><code>memo</code> 비교 비용보다 실제 렌더링 비용이 큰지 측정합니다.</li>
        <li>inline callback이 실제 병목인지 확인한 뒤 useCallback을 적용합니다.</li>
      </ul>

      <h2>getItemLayout은 높이가 예측 가능할 때 사용합니다</h2>
      <p>모든 행의 높이가 고정되어 있다면 getItemLayout으로 측정을 건너뛰고 특정 위치 이동을 빠르게 할 수 있습니다. 큰 글자, 줄바꿈, 동적 내용으로 높이가 바뀌는 목록에 잘못된 고정 값을 넣으면 스크롤 위치가 어긋납니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 고정 높이 목록</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const ROW_HEIGHT = 64;

&lt;FlatList
  data={items}
  getItemLayout={(_, index) =&gt; ({
    length: ROW_HEIGHT,
    offset: ROW_HEIGHT * index,
    index
  })}
/>&gt;</code></pre>
      </div>

      <h2>FlatList 주요 설정을 목적별로 봅니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>속성</th><th>목적</th><th>주의</th></tr></thead>
          <tbody>
            <tr><td><code>initialNumToRender</code></td><td>첫 화면에 렌더링할 항목 수</td><td>너무 작으면 빈 공간, 너무 크면 초기 비용 증가</td></tr>
            <tr><td><code>windowSize</code></td><td>화면 주변 렌더링 범위</td><td>메모리와 빈 화면 위험 사이의 균형</td></tr>
            <tr><td><code>maxToRenderPerBatch</code></td><td>한 번에 렌더링할 항목 수</td><td>응답성과 채우기 속도 사이의 균형</td></tr>
            <tr><td><code>updateCellsBatchingPeriod</code></td><td>배치 사이 시간</td><td>다른 설정과 함께 측정</td></tr>
            <tr><td><code>removeClippedSubviews</code></td><td>화면 밖 뷰 분리</td><td>복잡한 transform과 일부 플랫폼에서 누락 문제 검증</td></tr>
            <tr><td><code>onEndReached</code></td><td>페이지네이션 트리거</td><td>중복 호출과 로딩 상태를 방어</td></tr>
          </tbody>
        </table>
      </div>
      <p>공식 문서의 값을 그대로 복사하지 않고 기기, 행 복잡도, 이미지, 데이터 수에 따라 실제 스크롤을 측정합니다.</p>

      <h2>새로고침과 페이지네이션 상태</h2>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 중복 페이지 요청 방지</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>async function loadNextPage() {
  if (loadingMore || !hasNextPage) return;

  setLoadingMore(true);
  try {
    const next = await repository.loadPage(nextCursor);
    setItems((previous) =&gt; [...previous, ...next.items]);
    setNextCursor(next.nextCursor);
  } finally {
    setLoadingMore(false);
  }
}</code></pre>
      </div>
      <p>onEndReached는 사용자가 끝에 한 번 도달했을 때 정확히 한 번만 호출된다고 가정하지 않습니다. 로딩 중 여부와 다음 페이지 존재 여부를 함수 내부에서 다시 확인합니다.</p>

      <h2>원격 이미지는 레이아웃 크기를 설계합니다</h2>
      <p>원격 이미지에는 보통 width와 height 또는 aspectRatio가 필요합니다. 이미지가 로드되기 전에도 레이아웃이 결정되어야 화면이 갑자기 움직이지 않습니다. <code>resizeMode</code>로 contain, cover 등의 표시 방식을 선택합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · 비율이 있는 원격 이미지</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>&lt;Image
  source={{ uri: item.thumbnailUrl }}
  style={{ width: 72, aspectRatio: 1 }}
  resizeMode="cover"
  accessibilityIgnoresInvertColors
/&gt;</code></pre>
      </div>
      <p>목록 썸네일에는 서버에서 적절한 크기의 이미지를 제공하는 것이 중요합니다. 원본 대형 이미지를 작은 View에 표시하면 다운로드, 디코딩, 메모리 비용이 커집니다.</p>

      <h2>애니메이션은 어느 스레드에서 계산되는지 확인합니다</h2>
      <p>React Native의 Animated API는 값과 애니메이션 그래프를 구성합니다. 지원되는 속성에서는 <code>useNativeDriver: true</code>를 사용해 애니메이션을 네이티브 측에서 실행할 수 있습니다. 레이아웃 속성처럼 native driver가 지원하지 않는 값도 있습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · opacity 애니메이션</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>const opacity = useRef(new Animated.Value(0)).current;

useEffect(() =&gt; {
  Animated.timing(opacity, {
    toValue: 1,
    duration: 220,
    useNativeDriver: true
  }).start();
}, [opacity]);

return (
  &lt;Animated.View style={{ opacity }}&gt;
    &lt;Text&gt;표시됨&lt;/Text&gt;
  &lt;/Animated.View&gt;
);</code></pre>
      </div>
      <p>복잡한 제스처와 UI 스레드 애니메이션에는 Reanimated 같은 생태계 도구를 검토할 수 있습니다. 그러나 먼저 기본 애니메이션과 성능 측정 원리를 이해해야 합니다.</p>

      <h2>성능 점검 순서</h2>
      <ol>
        <li>개발 모드가 아니라 release 또는 성능 측정에 적합한 빌드에서도 재현합니다.</li>
        <li>React Native DevTools Performance 패널로 긴 작업과 렌더링을 확인합니다.</li>
        <li>JavaScript 계산, 네이티브 메인 스레드, 이미지, 목록 설정을 분리합니다.</li>
        <li>한 번에 한 변경만 적용하고 전후 수치를 기록합니다.</li>
        <li>개선이 없는 memo, useCallback, 설정 변경을 제거합니다.</li>
      </ol>
      <div class="callout warning">
        <span class="callout-title">개발 로그도 비용이 될 수 있습니다</span>
        release 번들에 많은 console 호출과 로깅 라이브러리가 남으면 JavaScript thread의 병목이 될 수 있습니다. 민감한 정보 노출 문제도 있으므로 release 로그 정책을 정합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>1,000개 행 목록에서 ScrollView와 FlatList의 차이를 비교합니다.</li><li>선택 상태를 extraData로 전달하고 스크롤 후 상태가 유지되는지 확인합니다.</li><li>DevTools로 최적화 전후의 렌더링 시간을 기록합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>getItemLayout을 적용할 수 있는 행과 적용하면 안 되는 행을 나눕니다.</li><li>현재 앱의 이미지 원본 크기와 실제 표시 크기를 비교합니다.</li><li>memo를 적용할 컴포넌트의 측정 근거를 합의합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'FlatList의 행 내부 state만으로 반드시 유지해야 하는 선택 상태를 관리하면 위험한 이유는 무엇입니까?',
        options: ['FlatList는 state를 지원하지 않습니다.', '가상화로 화면 밖 행이 제거되면 내부 state가 사라질 수 있습니다.', '선택 상태는 네이티브 모듈에서만 관리할 수 있습니다.', 'FlatList는 항목을 정렬할 수 없습니다.'],
        answer: 1,
        explanation: '영속해야 하는 항목 상태는 목록 소유 state나 데이터 모델에 두어야 합니다.'
      },
      {
        question: 'getItemLayout을 적용하기에 가장 적절한 목록은 무엇입니까?',
        options: ['큰 글자에 따라 행 높이가 계속 달라지는 목록', '내용에 따라 줄 수가 달라지는 목록', '모든 행 높이가 고정되고 예측 가능한 목록', '이미지 원본 크기를 알 수 없는 목록'],
        answer: 2,
        explanation: '고정 높이를 알 때 측정을 건너뛰고 정확한 offset을 계산할 수 있습니다.'
      },
      {
        question: '성능 최적화의 올바른 순서는 무엇입니까?',
        options: ['모든 컴포넌트에 memo를 먼저 붙인 뒤 이유를 찾습니다.', '병목을 재현하고 측정한 뒤 한 변경씩 적용해 전후를 비교합니다.', '개발 모드에서 느낌만으로 판단합니다.', 'FlatList 설정을 가능한 최대값으로 올립니다.'],
        answer: 1,
        explanation: '측정 없는 메모이제이션과 설정 변경은 복잡도만 늘리고 실제 병목을 가릴 수 있습니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · FlatList', url: 'https://reactnative.dev/docs/flatlist' },
      { label: 'React Native 공식 문서 · FlatList 설정 최적화', url: 'https://reactnative.dev/docs/optimizing-flatlist-configuration' },
      { label: 'React Native 공식 문서 · Performance Overview', url: 'https://reactnative.dev/docs/performance' },
      { label: 'React Native 공식 문서 · Image', url: 'https://reactnative.dev/docs/image' },
      { label: 'React Native 공식 문서 · Animated', url: 'https://reactnative.dev/docs/animated' },
      { label: 'React Native 공식 문서 · React Native DevTools', url: 'https://reactnative.dev/docs/react-native-devtools' }
    ]
  }
);
