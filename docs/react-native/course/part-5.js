window.RN_COURSE.push(
  {
    id: '17-turbo-module-kotlin',
    no: 17,
    phase: '5부 · 네이티브와 출시',
    title: 'Kotlin Turbo Native Module과 Codegen 구현',
    duration: '약 180분',
    minutes: 180,
    level: '심화 필수',
    tags: ['Kotlin', 'TurboModule', 'Codegen', 'Promise', 'Events', 'Coroutines'],
    summary: 'TypeScript 명세에서 Kotlin 구현까지 이어지는 New Architecture 네이티브 모듈을 만들고 동기 호출, 비동기 호출, 이벤트와 수명주기 경계를 설계합니다.',
    outcomes: [
      '기존 Kotlin 기능을 Turbo Native Module로 노출해야 하는 상황을 판단할 수 있습니다.',
      'TypeScript spec과 package.json Codegen 설정을 작성할 수 있습니다.',
      'Codegen이 생성한 추상 spec을 Kotlin 클래스에서 구현하고 package로 등록할 수 있습니다.',
      'Coroutine, Promise, 이벤트, Android 메인 스레드의 경계를 안전하게 처리할 수 있습니다.'
    ],
    body: `
      <h2>네이티브 모듈이 필요한 경우부터 판단합니다</h2>
      <p>React Native 또는 Expo 생태계에 이미 유지보수되는 모듈이 있다면 먼저 해당 라이브러리를 검토합니다. 직접 모듈을 작성하면 Android와 iOS 구현, 빌드, 버전 호환성, 테스트를 팀이 책임져야 합니다.</p>
      <p>다음 경우에는 직접 네이티브 경계를 만드는 것이 타당합니다.</p>
      <ul>
        <li>기존 Android 앱의 Kotlin Repository나 SDK를 재사용해야 합니다.</li>
        <li>React Native가 제공하지 않는 플랫폼 API를 사용해야 합니다.</li>
        <li>제조사 SDK, 결제 SDK, 지도 SDK처럼 네이티브 초기화와 수명주기가 필요합니다.</li>
        <li>큰 바이너리 데이터나 높은 빈도의 작업을 JavaScript로 옮기기보다 네이티브에서 처리해야 합니다.</li>
        <li>기존 Compose 앱과 React Native 화면이 동일한 Kotlin 도메인 계층을 공유해야 합니다.</li>
      </ul>
      <div class="callout note">
        <span class="callout-title">Expo 프로젝트의 별도 선택</span>
        Expo 앱에서만 사용할 사용자 정의 모듈은 Expo Modules API로 만드는 방법도 있습니다. 이 단원은 React Native New Architecture 자체를 이해하고 기존 Android 앱과 직접 연결할 수 있도록 Turbo Native Module과 Codegen을 기준으로 설명합니다.
      </div>

      <h2>전체 생성 흐름</h2>
      <ol>
        <li>TypeScript로 JavaScript에 공개할 계약을 작성합니다.</li>
        <li><code>package.json</code>에 Codegen 입력 폴더와 Android package를 설정합니다.</li>
        <li>Gradle 빌드가 Codegen을 실행해 공통 C++와 Android 추상 spec을 생성합니다.</li>
        <li>Kotlin 클래스가 생성된 추상 spec을 상속하고 메서드를 구현합니다.</li>
        <li>ReactPackage가 모듈을 React Native 런타임에 제공합니다.</li>
        <li>TypeScript wrapper가 raw native API를 앱 도메인 모델로 감쌉니다.</li>
      </ol>

      <h2>1단계: TypeScript spec 작성</h2>
      <p>spec 파일 이름은 Codegen이 찾을 수 있도록 <code>Native</code> 접두사를 사용하는 관례를 따릅니다. 예시에서는 기존 Kotlin 품목 Repository의 단일 조회 기능을 노출합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>specs/NativeWasteRepository.ts</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type NativeWasteItem = {
  id: number;
  name: string;
  category: string;
};

export interface Spec extends TurboModule {
  getItem(id: number): Promise&lt;NativeWasteItem | null&gt;;
  search(keyword: string, limit: number): Promise&lt;NativeWasteItem[]&gt;;
  clearCache(): void;
}

export default TurboModuleRegistry.getEnforcing&lt;Spec&gt;(
  'NativeWasteRepository'
);</code></pre>
      </div>
      <p><code>getEnforcing</code>은 해당 모듈이 등록되지 않았을 때 즉시 오류를 발생시킵니다. 플랫폼에 따라 선택적으로 존재하는 모듈이라면 get을 사용해 null을 처리할 수 있습니다. spec에서 사용할 수 있는 타입은 Codegen이 지원하는 타입 집합을 따라야 합니다.</p>

      <h2>2단계: Codegen 설정</h2>
      <div class="code-wrap">
        <div class="code-label"><span>package.json · codegenConfig</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>{
  "codegenConfig": {
    "name": "WasteRepositorySpec",
    "type": "modules",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.example.wasterepository"
    }
  }
}</code></pre>
      </div>
      <p><code>name</code>은 생성 결과의 library 이름입니다. <code>jsSrcsDir</code>은 spec을 찾을 폴더이며, Android package는 생성되는 Java 또는 Kotlin 접근 타입의 namespace입니다. 앱 프로젝트인지 별도 라이브러리인지에 따라 Codegen 실행 방식과 생성 위치가 달라질 수 있으므로 Gradle task 결과를 직접 확인합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>터미널 · Android Codegen 산출물 생성</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>cd android
./gradlew generateCodegenArtifactsFromSchema</code></pre>
      </div>

      <h2>3단계: Kotlin 모듈 구현</h2>
      <p>Codegen이 생성한 <code>NativeWasteRepositorySpec</code> 추상 클래스를 상속합니다. 실제 생성 클래스의 package와 메서드 signature는 spec과 현재 React Native 버전의 산출물을 기준으로 확인합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>Kotlin · 생성된 spec 구현</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>package com.example.wasterepository

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class WasteRepositoryModule(
    reactContext: ReactApplicationContext,
    private val repository: WasteRepository,
) : NativeWasteRepositorySpec(reactContext) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun getName(): String = NAME

    override fun getItem(id: Double, promise: Promise) {
        scope.launch {
            runCatching { repository.getItem(id.toLong()) }
                .onSuccess { item -&gt;
                    promise.resolve(item?.toWritableMap())
                }
                .onFailure { error -&gt;
                    promise.reject("ITEM_LOAD_FAILED", error.message, error)
                }
        }
    }

    override fun search(keyword: String, limit: Double, promise: Promise) {
        scope.launch {
            runCatching {
                repository.search(
                    keyword = keyword.trim(),
                    limit = limit.toInt().coerceIn(1, 100),
                )
            }.onSuccess { items -&gt;
                promise.resolve(items.toWritableArray())
            }.onFailure { error -&gt;
                promise.reject("SEARCH_FAILED", error.message, error)
            }
        }
    }

    override fun clearCache() {
        repository.clearMemoryCache()
    }

    override fun invalidate() {
        scope.cancel()
        super.invalidate()
    }

    companion object {
        const val NAME = "NativeWasteRepository"
    }
}

private fun WasteItem.toWritableMap(): WritableMap =
    Arguments.createMap().apply {
        putDouble("id", id.toDouble())
        putString("name", name)
        putString("category", category.code)
    }

private fun List&lt;WasteItem&gt;.toWritableArray(): WritableArray =
    Arguments.createArray().apply {
        forEach { pushMap(it.toWritableMap()) }
    }</code></pre>
      </div>
      <p>JavaScript의 number는 일반적으로 배정밀도 부동소수점이므로 Codegen Android signature에서 Double로 전달될 수 있습니다. 64비트 정수 ID가 JavaScript의 안전한 정수 범위를 넘을 수 있다면 문자열 ID를 사용합니다.</p>

      <h2>동기 메서드와 비동기 메서드를 구분합니다</h2>
      <p>spec에서 반환 타입을 Promise로 선언하면 Kotlin 구현은 Promise를 받습니다. 디스크, 네트워크, DB, SDK 대기 작업은 비동기로 처리합니다. 동기 메서드는 JavaScript 실행을 기다리게 할 수 있으므로 매우 짧고 즉시 끝나는 메모리 작업에 제한합니다.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>작업</th><th>권장 경계</th><th>이유</th></tr></thead>
          <tbody>
            <tr><td>상수 앱 버전 읽기</td><td>짧은 동기 또는 비동기</td><td>즉시 반환 가능하지만 API 일관성도 고려</td></tr>
            <tr><td>Room 또는 SQLite 조회</td><td>Promise와 Coroutine</td><td>디스크 I/O가 JavaScript 실행을 막지 않아야 함</td></tr>
            <tr><td>네트워크 SDK 호출</td><td>Promise와 SDK callback 또는 Coroutine</td><td>성공, 실패, 취소 수명 관리 필요</td></tr>
            <tr><td>센서 연속 값</td><td>EventEmitter</td><td>요청마다 polling하는 대신 구독 모델이 적합</td></tr>
            <tr><td>대형 이미지 bytes</td><td>파일 URI나 native 처리 결과</td><td>큰 배열을 JS 경계로 반복 복사하지 않음</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Promise는 정확히 한 번 끝냅니다</h2>
      <ul>
        <li>성공하면 resolve를 한 번 호출합니다.</li>
        <li>실패하면 안정적인 error code와 원인을 reject에 전달합니다.</li>
        <li>resolve 후 reject하거나 두 callback 경로가 동시에 끝나지 않게 합니다.</li>
        <li>CoroutineExceptionHandler에만 의존하지 않고 각 호출 결과를 처리합니다.</li>
        <li>모듈 invalidate 이후 늦은 callback을 전달할지 취소할지 정책을 둡니다.</li>
      </ul>

      <h2>모듈 package 등록</h2>
      <p>ReactPackage가 이름에 맞는 모듈 인스턴스와 ReactModuleInfo를 제공합니다. 아래 코드는 구조를 보여 주며 생성자 signature는 현재 버전의 API와 생성 결과에 맞춰 확인합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>Kotlin · BaseReactPackage 등록 구조</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>class WasteRepositoryPackage(
    private val repository: WasteRepository,
) : BaseReactPackage() {

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext,
    ): NativeModule? = when (name) {
        WasteRepositoryModule.NAME -&gt;
            WasteRepositoryModule(reactContext, repository)
        else -&gt; null
    }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            WasteRepositoryModule.NAME to ReactModuleInfo(
                name = WasteRepositoryModule.NAME,
                className = WasteRepositoryModule.NAME,
                canOverrideExistingModule = false,
                needsEagerInit = false,
                isCxxModule = false,
                isTurboModule = true,
            )
        )
    }
}</code></pre>
      </div>
      <p>앱 내부 모듈은 Application의 package 목록에 추가합니다. 별도 npm 패키지는 autolinking이 package metadata를 통해 package를 찾도록 구성합니다. package를 추가하거나 spec을 바꾼 뒤에는 네이티브 앱을 다시 빌드해야 합니다.</p>

      <h2>TypeScript wrapper에서 도메인 경계를 만듭니다</h2>
      <p>화면이 raw TurboModule을 직접 호출하게 두지 않습니다. 입력 검증, native error code 매핑, 도메인 타입 변환을 TypeScript adapter에 모읍니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>TypeScript · Native 모듈 wrapper</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import NativeWasteRepository from '../specs/NativeWasteRepository';

export const nativeWasteRepository = {
  async getItem(id: number): Promise&lt;WasteItem | null&gt; {
    if (!Number.isInteger(id) || id &lt;= 0) {
      throw new Error('올바른 품목 ID가 아닙니다.');
    }

    const item = await NativeWasteRepository.getItem(id);
    return item === null
      ? null
      : {
          id: item.id,
          name: item.name,
          category: parseCategory(item.category)
        };
  }
};</code></pre>
      </div>

      <h2>이벤트는 구독 수를 관리합니다</h2>
      <p>센서, 다운로드 진행률, SDK callback처럼 네이티브에서 여러 번 발생하는 값은 Codegen EventEmitter 계약을 사용할 수 있습니다. 첫 listener가 추가될 때 네이티브 관찰을 시작하고 마지막 listener가 제거될 때 중단하면 불필요한 자원 사용을 줄일 수 있습니다.</p>
      <ul>
        <li>이벤트 payload도 Codegen이 지원하는 타입으로 명세합니다.</li>
        <li>컴포넌트 Effect cleanup에서 subscription을 제거합니다.</li>
        <li>화면마다 중복 listener가 등록되지 않는지 확인합니다.</li>
        <li>이벤트 순서와 유실 허용 여부를 API 계약에 적습니다.</li>
        <li>높은 빈도의 원시 sensor 값을 그대로 보내기보다 throttle 또는 native 집계를 검토합니다.</li>
      </ul>

      <h2>스레드와 메인 스레드 규칙</h2>
      <p>Room, 파일, 네트워크는 Dispatchers.IO에서 실행합니다. Android View와 UI SDK는 메인 스레드에서 호출해야 합니다. SDK가 자체 callback thread를 사용하는 경우 문서를 확인하고 필요한 dispatcher로 전환합니다. “Native Module 메서드는 항상 특정 스레드에서 호출된다”는 가정에 의존하지 않습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>Kotlin · Android 메인 스레드 전환</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>scope.launch {
    val result = repository.load()

    withContext(Dispatchers.Main.immediate) {
        nativeSdk.showResult(result)
    }
}</code></pre>
      </div>

      <h2>테스트 전략</h2>
      <ol>
        <li>Kotlin Repository는 기존 Android 단위 테스트로 검증합니다.</li>
        <li>Kotlin Module은 fake Repository를 주입하고 resolve와 reject 결과를 검증합니다.</li>
        <li>TypeScript wrapper는 native spec mock으로 입력 검증과 오류 매핑을 테스트합니다.</li>
        <li>개발 빌드에서 모듈 등록과 Codegen 연결 smoke test를 실행합니다.</li>
        <li>release 빌드에서 R8 후에도 모듈 호출이 동작하는지 확인합니다.</li>
      </ol>

      <div class="callout danger">
        <span class="callout-title">ReactApplicationContext를 Activity로 취급하지 않습니다</span>
        Context만 필요한 작업과 현재 Activity가 필요한 작업을 구분합니다. Activity가 null일 수 있고 configuration change로 바뀔 수 있습니다. Activity reference를 장기간 보관하면 메모리 누수가 발생할 수 있습니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>문자열 정규화 또는 기존 Repository 조회 TurboModule을 만듭니다.</li><li>잘못된 ID와 DB 오류를 서로 다른 code로 reject합니다.</li><li>모듈 invalidate에서 CoroutineScope를 취소합니다.</li><li>TypeScript wrapper와 Kotlin 단위 테스트를 각각 작성합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>기존 Kotlin 코드 중 JS로 옮길 것과 네이티브에 남길 것을 분류합니다.</li><li>동기 메서드가 허용되는 최대 작업 범위를 합의합니다.</li><li>모듈 공개 API가 Android 구현 세부사항을 노출하지 않는지 검토합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'Room 데이터베이스 조회를 TurboModule에 노출할 때 가장 적절한 방식은 무엇입니까?',
        options: ['동기 메서드로 JavaScript 실행을 조회가 끝날 때까지 막습니다.', 'Promise 계약과 Coroutine I/O 실행을 사용합니다.', '데이터베이스 파일 전체를 byte 배열로 전달합니다.', '컴포넌트 렌더링 중 Kotlin 메서드를 반복 호출합니다.'],
        answer: 1,
        explanation: '디스크 I/O는 비동기 계약으로 제공하고 모듈 수명과 Coroutine을 함께 관리해야 합니다.'
      },
      {
        question: 'Codegen TypeScript spec의 역할은 무엇입니까?',
        options: ['화면 CSS를 생성합니다.', 'JavaScript와 네이티브 구현 사이의 타입 계약과 접착 코드 생성을 정의합니다.', '서명 키를 저장합니다.', 'Room migration을 자동 생성합니다.'],
        answer: 1,
        explanation: 'spec은 공개 메서드와 타입을 정의하고 Codegen은 이를 기반으로 공통 및 플랫폼 코드를 생성합니다.'
      },
      {
        question: 'JavaScript의 number로 매우 큰 Long ID를 전달할 때 주의할 점은 무엇입니까?',
        options: ['JavaScript number는 모든 64비트 정수를 정확히 표현합니다.', '안전한 정수 범위를 넘으면 정밀도가 손실될 수 있으므로 문자열 ID를 검토합니다.', 'Kotlin Long은 React Native에서 항상 boolean으로 바뀝니다.', 'ID는 배열로만 전달할 수 있습니다.'],
        answer: 1,
        explanation: 'JavaScript number는 IEEE 754 배정밀도 값이므로 모든 64비트 정수를 정확히 표현하지 못합니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Native Modules 소개', url: 'https://reactnative.dev/docs/turbo-native-modules-introduction' },
      { label: 'React Native 공식 문서 · Codegen 사용', url: 'https://reactnative.dev/docs/the-new-architecture/using-codegen' },
      { label: 'React Native 공식 문서 · Codegen이란 무엇인가', url: 'https://reactnative.dev/docs/the-new-architecture/what-is-codegen' },
      { label: 'React Native 공식 문서 · Native Modules Custom Events', url: 'https://reactnative.dev/docs/the-new-architecture/native-modules-custom-events' },
      { label: 'Expo 공식 문서 · Expo Modules API', url: 'https://docs.expo.dev/modules/overview/' }
    ]
  },
  {
    id: '18-fabric-brownfield',
    no: 18,
    phase: '5부 · 네이티브와 출시',
    title: 'Fabric Native Component와 기존 Android 앱 통합',
    duration: '약 175분',
    minutes: 175,
    level: '심화 필수',
    tags: ['Fabric', 'Native Component', 'ComposeView', 'Brownfield', 'ReactActivity', 'Gradle'],
    summary: '네이티브 UI SDK를 Fabric Component로 노출하고 기존 Kotlin·Compose 앱에 React Native 화면을 점진적으로 넣는 경계를 설계합니다.',
    outcomes: [
      'TurboModule과 Fabric Native Component의 사용 목적을 구분할 수 있습니다.',
      'Codegen native component spec의 props와 event를 설계할 수 있습니다.',
      '기존 Android 앱에 React Native Gradle Plugin과 ReactHost를 연결하는 흐름을 설명할 수 있습니다.',
      'Compose와 React Native의 내비게이션, 상태, 수명주기 소유권을 분리할 수 있습니다.'
    ],
    body: `
      <h2>Native Module과 Native Component를 구분합니다</h2>
      <div class="compare-grid">
        <div class="compare-card"><h3>Turbo Native Module</h3><p>데이터, 계산, 파일, SDK 명령처럼 화면이 아닌 기능 API를 JavaScript에 노출합니다.</p></div>
        <div class="compare-card"><h3>Fabric Native Component</h3><p>지도, 카메라 미리보기, 동영상 플레이어, 기존 Android View처럼 실제 네이티브 UI를 React 트리에 넣습니다.</p></div>
      </div>
      <p>네이티브 View의 상태를 읽기 위해 매 프레임 TurboModule을 호출하기보다 props로 상태를 전달하고 event로 사용자 상호작용을 돌려받는 Native Component가 자연스럽습니다.</p>

      <h2>Fabric Component의 전체 흐름</h2>
      <ol>
        <li>TypeScript spec에서 ViewProps, 사용자 props, event를 선언합니다.</li>
        <li><code>codegenNativeComponent</code>로 component 이름을 등록합니다.</li>
        <li>Codegen이 component descriptor와 Android manager delegate를 생성합니다.</li>
        <li>Kotlin ViewManager가 Android View를 생성하고 props를 적용합니다.</li>
        <li>Android View의 callback을 generated event emitter로 JavaScript에 전달합니다.</li>
      </ol>

      <h2>TypeScript Native Component spec</h2>
      <div class="code-wrap">
        <div class="code-label"><span>specs/NativeWasteMapViewNativeComponent.ts</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import type {
  CodegenTypes,
  HostComponent,
  ViewProps
} from 'react-native';
import { codegenNativeComponent } from 'react-native';

export type MarkerPressEvent = Readonly&lt;{
  markerId: string;
}&gt;;

export interface NativeProps extends ViewProps {
  latitude: CodegenTypes.Double;
  longitude: CodegenTypes.Double;
  zoom?: CodegenTypes.WithDefault&lt;CodegenTypes.Float, 14&gt;;
  selectedMarkerId?: string;
  onMarkerPress?: CodegenTypes.DirectEventHandler&lt;MarkerPressEvent&gt;;
}

export default codegenNativeComponent&lt;NativeProps&gt;(
  'NativeWasteMapView'
) as HostComponent&lt;NativeProps&gt;;</code></pre>
      </div>
      <p>props는 JavaScript가 네이티브 View에 전달하는 선언적 상태입니다. event는 네이티브 View에서 발생한 사용자 상호작용을 JavaScript에 알립니다. View를 명령형 getter와 setter 모음으로 만들기보다 현재 화면 상태를 props로 표현합니다.</p>

      <h2>Kotlin View와 ViewManager의 책임</h2>
      <p>실제 generated interface와 delegate 이름은 Codegen 산출물을 확인해야 합니다. 아래 구조처럼 ViewManager는 View 생성, props 적용, event 내보내기를 연결합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>Kotlin · Native View 기본 구조</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>class WasteMapView(
    context: Context,
) : FrameLayout(context) {

    private val mapView = VendorMapView(context)
    var onMarkerPress: ((String) -&gt; Unit)? = null

    init {
        addView(
            mapView,
            LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT,
            ),
        )

        mapView.setMarkerClickListener { markerId -&gt;
            onMarkerPress?.invoke(markerId)
        }
    }

    fun setCamera(latitude: Double, longitude: Double, zoom: Float) {
        mapView.moveCamera(latitude, longitude, zoom)
    }

    fun dispose() {
        mapView.release()
    }
}</code></pre>
      </div>
      <p>지도 SDK가 Activity lifecycle 또는 saved state를 요구하면 ViewManager만으로 끝나지 않습니다. ReactContext lifecycle listener, Activity event listener 또는 SDK가 권장하는 lifecycle adapter를 연결하고 View가 제거될 때 자원을 해제합니다.</p>

      <h2>ComposeView를 Native Component로 감쌀 수 있습니까?</h2>
      <p>Android View 계층 안에 <code>ComposeView</code>를 넣을 수 있으므로 기존 Composable을 React Native Fabric View의 내부 구현으로 사용하는 방식은 가능합니다. 그러나 Composition 수명, ViewTreeLifecycleOwner, saved state owner, dispose strategy를 정확히 제공해야 합니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>Kotlin · ComposeView를 포함하는 View 개념 예시</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>class NativeCategoryChipView(
    context: Context,
) : FrameLayout(context) {

    private val composeView = ComposeView(context).apply {
        setViewCompositionStrategy(
            ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
        )
    }

    private var label by mutableStateOf("")
    private var selected by mutableStateOf(false)
    var onPress: (() -&gt; Unit)? = null

    init {
        addView(composeView, LayoutParams(-1, -1))
        composeView.setContent {
            CategoryChip(
                label = label,
                selected = selected,
                onClick = { onPress?.invoke() },
            )
        }
    }

    fun updateLabel(value: String) {
        label = value
    }

    fun updateSelected(value: Boolean) {
        selected = value
    }
}</code></pre>
      </div>
      <div class="callout warning">
        <span class="callout-title">Compose를 감쌌다고 상태를 두 군데에 두지 않습니다</span>
        React props가 원본인지 Kotlin ViewModel이 원본인지 먼저 결정합니다. 같은 selected 값을 React state와 Kotlin StateFlow가 독립적으로 소유하고 맞추면 루프와 경쟁 상태가 생깁니다.
      </div>

      <h2>기존 Android 앱에 React Native를 넣는 기본 단계</h2>
      <p>React Native 공식 brownfield 문서는 기존 앱에 단일 view 또는 사용자 흐름을 추가할 수 있다고 설명합니다. Android에서는 다음 단계를 거칩니다.</p>
      <ol>
        <li>기존 Android 저장소 루트 또는 적절한 상위 폴더에 <code>package.json</code>과 JavaScript 소스를 둡니다.</li>
        <li>React, React Native, Metro 의존성을 설치합니다.</li>
        <li>settings.gradle과 app build.gradle에 React Native Gradle Plugin과 autolinking을 연결합니다.</li>
        <li>Application이 ReactApplication과 ReactHost를 제공하도록 구성합니다.</li>
        <li>AppRegistry에 React component를 등록합니다.</li>
        <li>ReactActivity 또는 ReactRootView를 기존 화면 흐름에 연결합니다.</li>
        <li>개발에서는 Metro를 실행하고 release에서는 Gradle plugin이 JS bundle을 패키징하게 합니다.</li>
      </ol>

      <h2>TypeScript entry point 등록</h2>
      <div class="code-wrap">
        <div class="code-label"><span>index.js · 기존 앱용 RN root 등록</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>import { AppRegistry } from 'react-native';
import { RegionalGuideFlow } from './src/RegionalGuideFlow';

AppRegistry.registerComponent(
  'RegionalGuideFlow',
  () =&gt; RegionalGuideFlow
);</code></pre>
      </div>
      <p>등록 이름은 Android ReactActivity가 반환하는 main component name과 정확히 일치해야 합니다.</p>

      <h2>Kotlin ReactActivity 연결</h2>
      <div class="code-wrap">
        <div class="code-label"><span>Kotlin · React Native 화면 Activity 개념 예시</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>class RegionalGuideReactActivity : ReactActivity() {

    override fun getMainComponentName(): String = "RegionalGuideFlow"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(
            this,
            mainComponentName,
            fabricEnabled,
        )
}</code></pre>
      </div>
      <p>정확한 기본 delegate 생성 방식은 현재 Community Template 0.86을 참조합니다. React Native 버전 업그레이드 시 기존 블로그 코드보다 해당 버전 template diff를 기준으로 갱신합니다.</p>

      <h2>Application과 ReactHost</h2>
      <p>현재 New Architecture에서는 Application이 ReactHost를 제공하고 package 목록과 런타임 초기화를 관리합니다. 기존 Hilt Application과 결합할 때 Application 상속을 바꿀 수 없다면 interface 구현과 delegate를 추가합니다. Repository 같은 singleton은 Hilt EntryPoint 또는 명시적 adapter를 통해 Native Package에 전달할 수 있습니다.</p>

      <h2>탐색 소유권을 한쪽에 둡니다</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>통합 범위</th><th>권장 탐색 소유자</th><th>뒤로가기 정책</th></tr></thead>
          <tbody>
            <tr><td>RN 단일 화면</td><td>기존 Android NavController</td><td>RN 내부 임시 상태가 없으면 Activity 종료</td></tr>
            <tr><td>RN 한 기능 flow</td><td>RN 내부 Stack, 진입과 종료는 Android</td><td>내부 Stack이 비면 Android flow로 반환</td></tr>
            <tr><td>앱 대부분을 RN으로 전환</td><td>React Navigation 또는 Expo Router</td><td>네이티브 진입점과 딥 링크를 RN route로 통합</td></tr>
            <tr><td>여러 독립 RN root</td><td>각 root의 범위와 공통 Host를 명시</td><td>root 사이 상태 공유와 메모리 비용 검토</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Native와 React 사이 초기 props</h2>
      <p>Android가 선택한 ID, 사용자 세션 식별자, feature flag를 React root의 초기 props로 전달할 수 있습니다. 초기 props도 직렬화 가능한 최소 값으로 제한하고 민감한 token 전체를 전달하지 않습니다.</p>
      <p>React 화면에서 결과를 Android에 돌려줘야 한다면 Activity result, 공유 Repository, TurboModule callback 또는 event 등 한 가지 명확한 경계를 선택합니다.</p>

      <h2>개발과 release bundle</h2>
      <ul>
        <li>개발 빌드는 Metro 개발 서버에서 bundle을 읽고 Fast Refresh를 사용합니다.</li>
        <li>실제 기기에서 개발 PC Metro에 접근하려면 네트워크 또는 adb reverse 설정이 필요합니다.</li>
        <li>release 빌드는 React Native Gradle Plugin이 JS bundle과 assets를 APK 또는 AAB에 포함합니다.</li>
        <li>Android Studio의 일반 release build 흐름과 서명 설정을 계속 사용할 수 있습니다.</li>
        <li>JS source map을 오류 수집 서비스에 업로드해야 minified stack을 복원할 수 있습니다.</li>
      </ul>

      <h2>점진적 전환 전략</h2>
      <ol>
        <li>공통 데이터 계약과 디자인 token부터 분리합니다.</li>
        <li>독립성이 높은 화면 또는 기능 flow 하나를 RN으로 만듭니다.</li>
        <li>기존 Kotlin Repository를 TurboModule로 재사용합니다.</li>
        <li>딥 링크, 인증, analytics 이름을 기존 앱과 맞춥니다.</li>
        <li>성능, 접근성, crash를 Compose 화면과 비교합니다.</li>
        <li>전환 비용이 이득보다 큰 화면은 네이티브로 유지합니다.</li>
      </ol>

      <div class="callout danger">
        <span class="callout-title">두 런타임의 메모리 비용을 고려합니다</span>
        기존 네이티브 앱에 React Native를 넣으면 Hermes, React runtime, JS bundle과 네이티브 라이브러리가 추가됩니다. 단일 작은 화면을 위해 도입할 때도 앱 크기, 초기화 시간, 메모리를 실제 release 빌드에서 측정합니다.
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>간단한 Android View 또는 ComposeView를 Fabric Component로 노출합니다.</li><li>selected prop과 onPress event를 연결합니다.</li><li>기존 Android 샘플 앱에서 ReactActivity 하나를 엽니다.</li><li>release APK에서 Metro 없이 화면이 열리는지 확인합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>현재 앱에서 RN으로 독립 전환하기 좋은 flow를 고릅니다.</li><li>Android NavController와 RN Stack의 책임 경계를 그림으로 정합니다.</li><li>공유 ViewModel을 만들지 않고 Repository를 공유할 방법을 설계합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '네이티브 지도 View를 React 트리에 직접 표시하고 marker 클릭 event를 받아야 합니다. 가장 적절한 경계는 무엇입니까?',
        options: ['동기 TurboModule getter를 매 프레임 호출합니다.', 'Fabric Native Component를 props와 event로 설계합니다.', 'AsyncStorage에 지도 bitmap을 저장합니다.', '딥 링크로 지도 상태를 전달합니다.'],
        answer: 1,
        explanation: '실제 네이티브 UI를 React 트리에 포함할 때는 Fabric Native Component가 맞습니다.'
      },
      {
        question: '기존 Android 앱 안에 RN 한 기능 flow만 넣을 때 자연스러운 탐색 구조는 무엇입니까?',
        options: ['Android와 RN이 같은 back stack을 각각 독립적으로 복제합니다.', 'Android가 진입과 종료를 소유하고 RN이 기능 내부 Stack을 소유합니다.', '뒤로가기를 모두 비활성화합니다.', '모든 기존 화면을 즉시 RN으로 다시 작성합니다.'],
        answer: 1,
        explanation: '기능 경계별로 탐색 소유권을 나누고 내부 Stack이 끝나면 기존 Android flow로 돌아가는 구조가 명확합니다.'
      },
      {
        question: 'release Android 앱에서 React Native 화면이 Metro 없이 실행될 수 있는 이유는 무엇입니까?',
        options: ['release에서는 JavaScript를 사용하지 않습니다.', 'Gradle Plugin이 JS bundle과 assets를 앱 패키지에 포함하기 때문입니다.', 'Android가 GitHub Pages에서 코드를 매번 읽기 때문입니다.', 'ReactActivity가 Kotlin으로 JSX를 변환하기 때문입니다.'],
        answer: 1,
        explanation: 'release 빌드 과정에서 bundle이 APK 또는 AAB에 패키징됩니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Native Components 소개', url: 'https://reactnative.dev/docs/fabric-native-components-introduction' },
      { label: 'React Native 공식 문서 · Native Components Custom Events', url: 'https://reactnative.dev/docs/the-new-architecture/native-components-custom-events' },
      { label: 'React Native 공식 문서 · 기존 앱 통합', url: 'https://reactnative.dev/docs/integration-with-existing-apps' },
      { label: 'React Native 공식 문서 · React Native Gradle Plugin', url: 'https://reactnative.dev/docs/react-native-gradle-plugin' },
      { label: 'Android 공식 문서 · ComposeView in Views', url: 'https://developer.android.com/develop/ui/compose/migrate/interoperability-apis/compose-in-views' }
    ]
  },
  {
    id: '19-security-release',
    no: 19,
    phase: '5부 · 네이티브와 출시',
    title: '보안, Android Release, 오류 추적과 OTA 업데이트',
    duration: '약 165분',
    minutes: 165,
    level: '필수',
    tags: ['Security', 'AAB', 'Signing', 'R8', 'Source Map', 'EAS Build', 'EAS Update'],
    summary: 'JavaScript bundle의 보안 경계를 이해하고 서명된 AAB, release 환경, source map, crash 수집, 네이티브 호환성을 지키는 OTA 업데이트를 운영합니다.',
    outcomes: [
      '환경 변수와 앱 bundle에 비밀키를 넣으면 안 되는 이유를 설명할 수 있습니다.',
      'Android release AAB와 서명 설정을 구성할 수 있습니다.',
      'minified JavaScript stack을 source map으로 복원하는 흐름을 설명할 수 있습니다.',
      'OTA로 바꿀 수 있는 코드와 새 앱 바이너리가 필요한 변경을 구분할 수 있습니다.'
    ],
    body: `
      <h2>모바일 앱에 포함한 값은 비밀이 아닙니다</h2>
      <p>JavaScript bundle, Android resources, BuildConfig, native library에 넣은 문자열은 사용자가 설치한 앱에서 추출될 수 있습니다. 난독화와 Hermes bytecode는 분석 비용을 높일 수 있지만 비밀 저장소가 아닙니다.</p>
      <div class="callout danger">
        <span class="callout-title">앱에 넣지 않을 값</span>
        서버 관리자 키, 결제 secret key, Firebase Admin credential, 장기 서명 secret, 다른 사용자 데이터에 접근할 수 있는 API key를 앱에 포함하지 않습니다. 서버 또는 제한된 프록시가 비밀을 보관하고 사용자 인증과 인가를 검사합니다.
      </div>

      <h2>환경 변수는 구성 분리 수단입니다</h2>
      <p>Expo의 <code>EXPO_PUBLIC_</code> 접두사 변수와 React Native build-time 변수는 앱 코드에 인라인될 수 있습니다. 개발, staging, production endpoint를 분리하는 데는 유용하지만 비밀 보관에는 사용할 수 없습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>.env · 공개 가능한 구성만 사용</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_MAP_STYLE_ID=public-style-id</code></pre>
      </div>
      <p>release build가 올바른 환경을 사용했는지 CI에서 검증하고 앱 내부의 환경 표시 또는 build metadata로 추적할 수 있게 합니다. 민감한 CI secret은 build service에 저장하되, 최종 앱에 주입되는 순간 공개될 수 있다는 기준은 같습니다.</p>

      <h2>인증과 저장 보안</h2>
      <ul>
        <li>짧은 access token과 갱신 가능한 refresh token 정책을 서버와 함께 설계합니다.</li>
        <li>refresh token은 SecureStore 계열에 저장하고 logout 때 삭제합니다.</li>
        <li>로그, analytics, crash report에 token과 개인정보를 넣지 않습니다.</li>
        <li>서버는 모든 요청에서 인증과 객체별 인가를 다시 검사합니다.</li>
        <li>딥 링크와 알림 payload는 신뢰하지 않고 목적지에서 권한을 확인합니다.</li>
        <li>root 또는 변조 탐지는 보조 신호이며 서버 인가를 대체하지 않습니다.</li>
      </ul>

      <h2>네트워크 보안</h2>
      <p>production에서는 HTTPS를 사용하고 Android cleartext traffic과 iOS transport 정책을 확인합니다. 인증서 pinning은 중간자 공격 범위를 줄일 수 있지만 인증서 교체, 백업 pin, 앱 업데이트 지연 때문에 운영 실패를 일으킬 수 있습니다. 위협 모델과 갱신 절차가 있을 때만 적용합니다.</p>
      <p>사용자가 입력한 URL을 WebView에 열거나 임의 scheme을 실행하는 기능은 허용 목록과 URL parsing을 적용합니다. WebView의 JavaScript bridge와 파일 접근 권한은 최소화합니다.</p>

      <h2>의존성과 공급망을 관리합니다</h2>
      <ul>
        <li>npm lockfile을 커밋하고 CI에서 고정 설치 명령을 사용합니다.</li>
        <li>새 native package의 유지보수 상태, New Architecture 지원, 권한, 라이선스를 검토합니다.</li>
        <li>postinstall script가 실행하는 작업을 확인합니다.</li>
        <li>GitHub Dependabot, npm audit 등의 신호를 검토하되 자동 수정이 동작을 깨뜨리지 않는지 테스트합니다.</li>
        <li>불필요한 SDK와 추적 라이브러리를 제거해 공격 표면과 개인정보 수집을 줄입니다.</li>
      </ul>

      <h2>Android 서명과 App Signing</h2>
      <p>Android release는 upload key로 AAB에 서명하고 Google Play App Signing을 사용하면 Google이 최종 배포용 app signing key를 관리합니다. upload key와 keystore 비밀번호는 저장소에 커밋하지 않습니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>터미널 · upload keystore 생성 예시</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore upload-key.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000</code></pre>
      </div>
      <p>로컬 <code>gradle.properties</code>나 CI secret에서 경로와 비밀번호를 읽고 signingConfig에 연결합니다. 공유 PC와 백업 저장소의 접근 권한도 관리합니다.</p>

      <h2>React Native Android release 빌드</h2>
      <div class="code-wrap">
        <div class="code-label"><span>터미널 · 서명된 AAB 생성</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>cd android
./gradlew clean
./gradlew :app:bundleRelease</code></pre>
      </div>
      <p>React Native Gradle Plugin이 release variant에 맞춰 Metro를 실행하고 JavaScript bundle과 assets를 앱에 포함합니다. 출력 AAB를 bundletool 또는 Play Console 사전 검사로 확인합니다.</p>

      <h2>R8과 native library</h2>
      <p>R8은 사용하지 않는 JVM 코드를 제거하고 난독화합니다. React Native 기본 설정과 라이브러리 consumer rules가 대부분의 필수 규칙을 제공합니다. reflection을 사용하는 네이티브 SDK, serialization, callback class가 release에서만 실패하면 SDK 공식 keep rule을 확인합니다.</p>
      <div class="callout warning">
        <span class="callout-title">무조건 전체 keep을 추가하지 않습니다</span>
        <code>-keep class ** { *; }</code>처럼 광범위한 규칙은 축소 효과를 없애고 문제 원인을 숨깁니다. release stack과 missing class 경고를 바탕으로 필요한 범위만 추가합니다.
      </div>

      <h2>JavaScript source map과 native mapping file</h2>
      <p>release JavaScript는 Metro가 변환하고 축소합니다. crash stack의 파일명과 줄 번호를 원래 TypeScript로 복원하려면 해당 build의 source map이 필요합니다. Android Kotlin과 Java stack 복원에는 R8 mapping file이 필요합니다.</p>
      <ul>
        <li>versionName, versionCode, git SHA, JS update ID를 오류 이벤트에 기록합니다.</li>
        <li>각 release의 source map과 mapping.txt를 오류 수집 서비스에 업로드합니다.</li>
        <li>source map 자체에는 소스 코드가 포함될 수 있으므로 접근을 제한합니다.</li>
        <li>OTA update마다 새 JavaScript source map을 업로드합니다.</li>
        <li>crash에서 native stack과 JS stack을 함께 볼 수 있는지 확인합니다.</li>
      </ul>

      <h2>EAS Build를 사용하는 경우</h2>
      <p>EAS Build는 Expo와 React Native 프로젝트의 cloud build를 실행합니다. build profile로 development, preview, production 구성을 나누고 credentials를 관리할 수 있습니다. 그러나 build service가 코드 품질과 서명 정책을 대신 설계해 주는 것은 아닙니다.</p>
      <div class="code-wrap">
        <div class="code-label"><span>eas.json · 개념적인 profile 구조</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}</code></pre>
      </div>

      <h2>OTA 업데이트의 경계</h2>
      <p>EAS Update 같은 OTA 시스템은 설치된 네이티브 바이너리와 호환되는 JavaScript와 assets를 전달합니다. 다음 변경은 일반적으로 새 앱 바이너리가 필요합니다.</p>
      <ul>
        <li>새 native package를 추가하거나 native package 버전을 바꿉니다.</li>
        <li>Android Manifest 권한, intent filter, service, receiver를 변경합니다.</li>
        <li>Kotlin TurboModule 또는 Fabric Component 구현을 변경합니다.</li>
        <li>Gradle Plugin, compile SDK, target SDK, native dependency를 변경합니다.</li>
        <li>앱 아이콘, splash의 native 리소스와 플랫폼 설정을 바꿉니다.</li>
      </ul>
      <p>TypeScript 화면, 비즈니스 규칙, 문자열, JavaScript asset 변경은 네이티브 runtime과 호환된다면 OTA 후보가 될 수 있습니다. runtimeVersion으로 호환 집합을 구분하고 native 변경마다 runtime version을 갱신합니다.</p>
      <div class="callout danger">
        <span class="callout-title">OTA를 앱 심사 우회 수단으로 사용하지 않습니다</span>
        앱 스토어 정책과 사용자 기대를 따릅니다. 보안 수정도 충분한 검증과 점진 배포, rollback 계획이 필요합니다. 서버 API와 native module 계약이 바뀌면 구버전 update도 동작하도록 호환 기간을 둡니다.
      </div>

      <h2>업데이트 실패와 rollback</h2>
      <ol>
        <li>업데이트를 staging channel에서 실제 기기로 검증합니다.</li>
        <li>일부 사용자에게 점진 배포합니다.</li>
        <li>startup crash, blank screen, API 오류율을 update ID별로 관찰합니다.</li>
        <li>문제가 생기면 이전 안정 update를 다시 게시하거나 rollout을 중단합니다.</li>
        <li>앱이 새 bundle을 실행하지 못할 때 embedded bundle로 복구되는 동작을 실제로 검증합니다.</li>
      </ol>

      <h2>출시 전 체크리스트</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>영역</th><th>확인 항목</th></tr></thead>
          <tbody>
            <tr><td>빌드</td><td>production endpoint, version, 서명, AAB, 64-bit native library</td></tr>
            <tr><td>보안</td><td>secret 제거, token 로그 제거, HTTPS, 딥 링크 검증</td></tr>
            <tr><td>기능</td><td>로그인, 검색, 저장, 오프라인, 권한, 딥 링크, 뒤로가기</td></tr>
            <tr><td>UI</td><td>320dp, 태블릿, 큰 글자, dark mode, edge-to-edge, 키보드</td></tr>
            <tr><td>접근성</td><td>TalkBack, role, label, focus, 색상 외 상태 표현</td></tr>
            <tr><td>성능</td><td>cold start, 긴 목록, 이미지 메모리, JS와 UI thread</td></tr>
            <tr><td>관찰성</td><td>source map, mapping file, release metadata, 개인정보 필터</td></tr>
            <tr><td>업데이트</td><td>runtimeVersion, channel, rollout, rollback, embedded bundle</td></tr>
          </tbody>
        </table>
      </div>

      <div class="study-task">
        <div><h3>개인 실습</h3><ul><li>release AAB를 만들고 서명 정보를 확인합니다.</li><li>R8가 켜진 release에서 Native Module을 호출합니다.</li><li>의도적인 JS 오류를 발생시켜 source map 복원을 확인합니다.</li><li>native 변경과 JS-only 변경을 분리해 update 계획을 작성합니다.</li></ul></div>
        <div><h3>팀 토론</h3><ul><li>앱에 들어간 모든 key를 공개 가능, 제한 필요, 절대 포함 금지로 분류합니다.</li><li>OTA 중단과 rollback 권한을 누가 갖는지 정합니다.</li><li>Play 출시 후보의 검증 증거를 PR과 release 문서에 남기는 방식을 합의합니다.</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: 'EXPO_PUBLIC_API_KEY 환경 변수에 서버 관리자 키를 넣으면 안전합니까?',
        options: ['예. 환경 변수이므로 앱에 포함되지 않습니다.', '아니요. 공개 접두사 값은 앱 코드에 포함될 수 있으므로 비밀을 넣으면 안 됩니다.', 'Android에서만 안전합니다.', 'Hermes가 자동으로 암호화합니다.'],
        answer: 1,
        explanation: '앱에 주입된 공개 환경 변수는 최종 bundle에서 추출될 수 있습니다.'
      },
      {
        question: 'Kotlin TurboModule 코드를 변경한 경우 배포 방식은 무엇입니까?',
        options: ['JS OTA 업데이트만 게시합니다.', '새 native binary를 빌드해 앱 스토어 또는 테스트 채널로 배포합니다.', 'AsyncStorage 값을 바꿉니다.', 'source map만 업로드합니다.'],
        answer: 1,
        explanation: '설치된 바이너리의 네이티브 구현이 바뀌므로 새 APK 또는 AAB가 필요합니다.'
      },
      {
        question: 'release crash의 축소된 TypeScript stack을 복원하는 데 필요한 것은 무엇입니까?',
        options: ['Android keystore', '해당 JavaScript build 또는 OTA update의 source map', 'AsyncStorage 백업', '딥 링크 scheme'],
        answer: 1,
        explanation: 'Metro source map이 축소된 bundle 위치를 원래 TypeScript 소스 위치로 매핑합니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Security', url: 'https://reactnative.dev/docs/security' },
      { label: 'React Native 공식 문서 · Publishing to Google Play Store', url: 'https://reactnative.dev/docs/signed-apk-android' },
      { label: 'React Native 공식 문서 · React Native Gradle Plugin', url: 'https://reactnative.dev/docs/react-native-gradle-plugin' },
      { label: 'Expo 공식 문서 · Environment variables', url: 'https://docs.expo.dev/guides/environment-variables/' },
      { label: 'Expo 공식 문서 · EAS Build', url: 'https://docs.expo.dev/build/introduction/' },
      { label: 'Expo 공식 문서 · EAS Update', url: 'https://docs.expo.dev/eas-update/introduction/' },
      { label: 'Expo 공식 문서 · Runtime versions', url: 'https://docs.expo.dev/eas-update/runtime-versions/' }
    ]
  },
  {
    id: '20-capstone-team',
    no: 20,
    phase: '5부 · 네이티브와 출시',
    title: '팀 실전 프로젝트와 8주 완주 기준',
    duration: '약 120분 + 프로젝트',
    minutes: 120,
    level: '종합',
    tags: ['Capstone', 'Architecture', 'Code Review', 'CI', 'Definition of Done', 'Portfolio'],
    summary: '지금까지 배운 내용을 기존 Compose 앱의 실제 기능에 적용하고 팀이 같은 품질 기준으로 React Native 기능을 설계, 리뷰, 테스트, 출시합니다.',
    outcomes: [
      '8주 동안 이론, 실습, 코드 리뷰, 최종 프로젝트를 운영할 수 있습니다.',
      'Compose 앱의 기능 하나를 React Native로 포팅하면서 상태와 플랫폼 경계를 비교할 수 있습니다.',
      'Kotlin Native Module을 포함한 실제 Android release를 완성할 수 있습니다.',
      '팀 Definition of Done과 코드 리뷰 기준을 적용해 결과물을 포트폴리오로 정리할 수 있습니다.'
    ],
    body: `
      <h2>최종 프로젝트의 목표</h2>
      <p>최종 결과물은 단순한 할 일 목록이 아닙니다. 기존 Kotlin·Compose 개발 경험을 활용해 실제 모바일 앱의 상태, 데이터, 접근성, 네이티브 경계, 테스트와 release를 모두 경험해야 합니다.</p>
      <div class="callout success">
        <span class="callout-title">권장 프로젝트: 분리배출 가이드 React Native Lab</span>
        기존 앱의 품목 검색 → 검색 결과 → 상세 → 저장 흐름을 React Native로 다시 구현합니다. 기존 Kotlin Repository 또는 텍스트 정규화 기능 하나를 TurboModule로 연결하고, Android release AAB까지 생성합니다.
      </div>

      <h2>필수 사용자 흐름</h2>
      <ol>
        <li>사용자는 품목 이름을 입력하고 검색합니다.</li>
        <li>앱은 로딩, 검색 결과, 빈 결과, 네트워크 오류를 구분해 표시합니다.</li>
        <li>사용자는 긴 결과 목록을 스크롤하고 품목 상세로 이동합니다.</li>
        <li>상세 route는 품목 ID만 전달하고 데이터를 다시 읽습니다.</li>
        <li>사용자는 품목을 저장하거나 저장 해제합니다.</li>
        <li>저장 상태는 로컬 DB에 유지되고 앱 재실행 후 복원됩니다.</li>
        <li>사용자 정의 딥 링크로 특정 품목 상세를 엽니다.</li>
        <li>오프라인에서는 마지막 데이터와 동기화 상태를 표시합니다.</li>
      </ol>

      <h2>Kotlin Native 기능 선택</h2>
      <p>다음 중 팀 앱과 가까운 기능 하나를 고릅니다.</p>
      <ul>
        <li><strong>기존 Repository 공유:</strong> Kotlin Room 또는 공공데이터 adapter를 TurboModule로 노출합니다.</li>
        <li><strong>한국어 검색 정규화:</strong> 기존 Kotlin 정규화와 초성 검색 로직을 Promise API로 제공합니다.</li>
        <li><strong>네이티브 설정 이동:</strong> 권한이 영구 거부되었을 때 Android 앱 설정을 여는 모듈을 만듭니다.</li>
        <li><strong>기존 지도 View:</strong> Android 지도 SDK View를 Fabric Component로 감쌉니다.</li>
        <li><strong>공유 Compose UI:</strong> 기존 Composable 한 개를 ComposeView 기반 Fabric Component로 실험하고 비용을 기록합니다.</li>
      </ul>
      <p>모듈을 만들기 위한 모듈을 만들지 않습니다. JavaScript만으로 충분한 기능을 억지로 Kotlin으로 옮기지 않고 네이티브 경계의 필요성을 설계 문서에 적습니다.</p>

      <h2>권장 프로젝트 구조</h2>
      <div class="code-wrap">
        <div class="code-label"><span>디렉터리 구조 · 기능 중심 예시</span><button class="copy-code" type="button">코드 복사</button></div>
        <pre><code>src/
├─ app/
│  ├─ navigation/
│  ├─ providers/
│  └─ theme/
├─ features/
│  ├─ search/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ model/
│  │  └─ screens/
│  ├─ detail/
│  └─ saved/
├─ data/
│  ├─ api/
│  ├─ database/
│  ├─ native/
│  └─ repositories/
├─ shared/
│  ├─ components/
│  ├─ accessibility/
│  └─ errors/
└─ specs/
   └─ NativeWasteRepository.ts

android/app/src/main/java/.../
├─ nativebridge/
├─ data/
└─ di/</code></pre>
      </div>
      <p>폴더 이름보다 의존 방향이 중요합니다. 화면은 API DTO와 Native spec의 raw 타입을 직접 알지 않고 repository interface와 도메인 모델을 사용합니다. Native adapter는 specs와 Kotlin error code를 앱의 Result 모델로 변환합니다.</p>

      <h2>8주 팀 학습 일정</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>주차</th><th>이론 단원</th><th>개인 구현</th><th>팀 산출물</th></tr></thead>
          <tbody>
            <tr><td>1주</td><td>1~3강</td><td>환경 구성, JS 불변 갱신, TypeScript 상태 모델</td><td>Node·SDK 기준, lint·format·브랜치 규칙</td></tr>
            <tr><td>2주</td><td>4~7강</td><td>컴포넌트, 상태, Effect, reducer</td><td>Compose와 React 상태 모델 비교 문서</td></tr>
            <tr><td>3주</td><td>8~10강</td><td>Core Components, 목록, 반응형 UI</td><td>검색 화면 UI PR과 큰 글자 검증</td></tr>
            <tr><td>4주</td><td>11~14강</td><td>접근성, 성능, 내비게이션, API</td><td>목록→상세 flow와 오류 상태 테스트</td></tr>
            <tr><td>5주</td><td>15~16강</td><td>저장, 권한, component test, E2E</td><td>오프라인 저장과 테스트 기준</td></tr>
            <tr><td>6주</td><td>17강</td><td>Kotlin TurboModule과 Codegen</td><td>Native API 계약 리뷰와 smoke test</td></tr>
            <tr><td>7주</td><td>18~19강</td><td>기존 앱 통합 또는 Fabric, release AAB</td><td>성능 비교, 보안·출시 체크리스트</td></tr>
            <tr><td>8주</td><td>20강</td><td>통합 수정, 접근성, 문서화</td><td>최종 demo, 회고, 포트폴리오 문서</td></tr>
          </tbody>
        </table>
      </div>

      <h2>매주 학습 회의 구조</h2>
      <ol>
        <li><strong>공통 학습:</strong> 이 사이트의 해당 단원을 읽고 확인 문제를 풉니다.</li>
        <li><strong>개인 구현:</strong> 같은 요구사항을 각자 작은 branch에서 구현합니다.</li>
        <li><strong>비교 회의:</strong> state 배치, Effect, 타입, 접근성을 서로 설명합니다.</li>
        <li><strong>대표안 선택:</strong> 장점을 합쳐 팀 repository의 작은 PR로 만듭니다.</li>
        <li><strong>리뷰:</strong> 구현 결과뿐 아니라 왜 이 구조를 선택했는지 검토합니다.</li>
        <li><strong>회고:</strong> 공식 문서와 실제 동작이 달랐던 부분을 학습 노트에 남깁니다.</li>
      </ol>

      <h2>PR 크기와 커밋 기준</h2>
      <ul>
        <li>한 PR은 하나의 사용 흐름 또는 하나의 기술 목적을 다룹니다.</li>
        <li>UI, 상태 리팩터링, 네이티브 설정, 대규모 파일 이동을 가능한 한 분리합니다.</li>
        <li>자동 생성된 Codegen 산출물을 커밋할지 프로젝트 정책을 명시합니다.</li>
        <li>PR 본문에는 변경 이유, 상태 흐름, 플랫폼 차이, 검증 기기와 테스트를 적습니다.</li>
        <li>커밋 메시지는 Conventional Commits를 사용합니다. 예: <code>feat: 품목 검색 결과 화면 추가</code></li>
      </ul>

      <h2>React Native 코드 리뷰 체크리스트</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>영역</th><th>질문</th></tr></thead>
          <tbody>
            <tr><td>상태</td><td>원본 state만 저장했습니까? 불가능한 상태 조합이 있습니까? 소유자가 적절합니까?</td></tr>
            <tr><td>Effect</td><td>어떤 외부 시스템과 동기화합니까? 이벤트로 옮길 작업은 없습니까? cleanup과 의존성이 정확합니까?</td></tr>
            <tr><td>타입</td><td>any를 피했습니까? route와 API 외부 입력을 런타임 검증합니까?</td></tr>
            <tr><td>목록</td><td>안정적인 key, 빈 상태, 페이지 실패, 선택 상태 보존, 큰 글자를 검증했습니까?</td></tr>
            <tr><td>접근성</td><td>role, label, state, focus, 터치 영역, 색상 외 표현이 있습니까?</td></tr>
            <tr><td>네이티브</td><td>동기 호출이 짧습니까? Activity와 Context를 구분합니까? Coroutine과 listener를 정리합니까?</td></tr>
            <tr><td>보안</td><td>비밀값과 개인정보가 bundle, 로그, analytics에 들어가지 않았습니까?</td></tr>
            <tr><td>테스트</td><td>규칙은 단위 테스트, 행동은 컴포넌트 테스트, 핵심 흐름은 E2E로 보호했습니까?</td></tr>
            <tr><td>성능</td><td>최적화 근거가 측정 결과입니까? 이미지와 목록의 실제 비용을 확인했습니까?</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Definition of Done</h2>
      <p>기능은 화면이 한 번 보인다고 완료되지 않습니다. 다음 조건을 모두 만족해야 합니다.</p>
      <ol>
        <li>Android 실제 기기와 에뮬레이터에서 요구 흐름이 동작합니다.</li>
        <li>로딩, 빈 결과, 오류, 재시도와 오프라인 상태가 구현되었습니다.</li>
        <li>320dp 너비, 회전 또는 넓은 화면, fontScale 1.3 이상에서 핵심 UI가 잘리지 않습니다.</li>
        <li>TalkBack으로 이름, 역할, 상태, 탐색 순서를 확인했습니다.</li>
        <li>뒤로가기, 키보드, 딥 링크, 프로세스 재실행 후 상태를 확인했습니다.</li>
        <li>순수 로직과 주요 컴포넌트 테스트가 통과합니다.</li>
        <li>핵심 E2E flow가 release 후보에서 통과합니다.</li>
        <li>release AAB가 생성되고 Native Module과 source map이 검증되었습니다.</li>
        <li>공식 문서 근거와 설계 결정을 PR 또는 ADR에 남겼습니다.</li>
      </ol>

      <h2>Compose와 React Native를 비교할 성능 지표</h2>
      <ul>
        <li>cold start와 첫 화면 표시 시간</li>
        <li>검색 결과 1,000개 스크롤의 프레임 안정성</li>
        <li>메모리 사용량과 대형 이미지 표시 후 회수</li>
        <li>화면 전환과 뒤로가기 상태 복원</li>
        <li>앱 AAB 크기와 설치 크기 증가</li>
        <li>동일 기능 구현에 필요한 플랫폼별 코드량</li>
        <li>접근성 수정과 테스트 작성 난이도</li>
      </ul>
      <p>React Native가 항상 더 빠르거나 느리다는 결론을 미리 정하지 않습니다. 같은 기기, 같은 데이터, release 빌드, 같은 사용자 흐름에서 측정합니다.</p>

      <h2>포트폴리오에 남길 내용</h2>
      <ul>
        <li>Compose와 React Native 상태 모델의 비교와 선택 근거</li>
        <li>New Architecture에서 TurboModule을 설계한 계약과 thread 처리</li>
        <li>FlatList 병목을 측정하고 개선한 수치</li>
        <li>TalkBack과 큰 글자에서 발견하고 수정한 문제</li>
        <li>기존 Android 앱과 React Native를 점진 통합한 경계</li>
        <li>release AAB, source map, OTA runtime version 운영 전략</li>
        <li>팀 코드 리뷰를 통해 바뀐 설계와 이유</li>
      </ul>

      <div class="callout note">
        <span class="callout-title">완주의 기준</span>
        20개 단원의 완료 표시만으로 끝내지 않습니다. 공식 문서의 문장을 암기하는 것이 아니라 실제 앱에서 상태, 접근성, 네이티브 경계, 테스트와 release를 설명하고 구현할 수 있어야 합니다.
      </div>

      <div class="study-task">
        <div><h3>최종 개인 증거</h3><ul><li>본인이 구현한 기능 PR 2개 이상</li><li>컴포넌트 테스트와 E2E flow</li><li>Kotlin Native Module 코드와 테스트</li><li>성능 측정 전후 기록</li><li>release AAB 검증 기록</li></ul></div>
        <div><h3>최종 팀 증거</h3><ul><li>아키텍처 다이어그램과 ADR</li><li>접근성 및 기기 검증표</li><li>보안과 출시 체크리스트</li><li>Compose 대비 기술 회고</li><li>5분 demo와 README</li></ul></div>
      </div>
    `,
    quiz: [
      {
        question: '최종 프로젝트의 Native Module 기능을 고르는 올바른 기준은 무엇입니까?',
        options: ['Kotlin 코드를 반드시 많이 쓰기 위해 임의의 기능을 네이티브로 옮깁니다.', '기존 네이티브 자산 재사용이나 플랫폼 API처럼 실제 경계 필요성이 있는 기능을 선택합니다.', '모든 화면을 Fabric Component로 만듭니다.', 'JavaScript에서 구현 가능한 기능은 사용할 수 없습니다.'],
        answer: 1,
        explanation: '네이티브 모듈은 유지보수 비용이 있으므로 실제 플랫폼 경계나 재사용 가치가 있을 때 선택해야 합니다.'
      },
      {
        question: 'React Native 기능의 완료 기준으로 충분하지 않은 것은 무엇입니까?',
        options: ['로딩, 오류, 접근성, 테스트와 release 검증을 포함합니다.', '개발자의 한 기기에서 화면이 한 번 보였습니다.', '큰 글자와 시스템 뒤로가기를 확인합니다.', '공식 문서 근거와 설계 결정을 남깁니다.'],
        answer: 1,
        explanation: '실제 모바일 기능은 다양한 상태, 기기 조건, 접근성, 테스트와 출시 환경에서 검증해야 합니다.'
      },
      {
        question: 'Compose와 React Native 성능을 공정하게 비교하는 방법은 무엇입니까?',
        options: ['개발 모드의 체감만 비교합니다.', '서로 다른 기기와 데이터로 측정합니다.', '같은 기기, 데이터, release 빌드와 사용자 흐름에서 지표를 기록합니다.', '프레임 측정 없이 코드 줄 수만 비교합니다.'],
        answer: 2,
        explanation: '비교 조건을 통제하고 실제 release 지표를 사용해야 프레임워크보다 구현 차이의 영향을 줄일 수 있습니다.'
      }
    ],
    sources: [
      { label: 'React Native 공식 문서 · Getting Started', url: 'https://reactnative.dev/docs/getting-started' },
      { label: 'React 공식 학습 문서', url: 'https://ko.react.dev/learn' },
      { label: 'TypeScript 공식 Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
      { label: 'Expo 공식 문서', url: 'https://docs.expo.dev/' },
      { label: 'React Native 공식 문서 · Performance', url: 'https://reactnative.dev/docs/performance' },
      { label: 'React Native 공식 문서 · Accessibility', url: 'https://reactnative.dev/docs/accessibility' },
      { label: 'React Native 공식 문서 · Testing Overview', url: 'https://reactnative.dev/docs/testing-overview' }
    ]
  }
);
