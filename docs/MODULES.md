# insight-common モジュール一覧

Insight Series 全製品で使用可能な共通モジュールの一覧です。

---

## モジュール構成

```
insight-common/
├── license/          # ライセンス管理
├── i18n/             # 多言語対応
├── utils/            # ユーティリティ
├── errors/           # エラー定義
├── brand/            # ブランド・デザイン
├── ui/               # UI構造定義
├── config/           # 製品設定
├── hooks/            # 共通フック（音声入力等）
├── contexts/         # 共通コンテキスト
├── components/       # 共通コンポーネント
├── legal/            # 法務文書
└── company/          # 会社情報
```

---

## 1. license/ - ライセンス管理

### パス
| 言語 | ファイル | エイリアス |
|------|---------|-----------|
| TypeScript | `license/typescript/index.ts` | `@insight/license` |
| Python | `license/python/__init__.py` | `insight_common.license` |
| Kotlin | `license/kotlin/` (要生成) | - |
| Swift | `license/swift/` (要生成) | - |

### エクスポート

```typescript
// TypeScript
export { LicenseValidator }      // ライセンス検証クラス
export { generateLicenseKey }    // キー生成（開発用）
export { generateLicenseWithExpiry } // 有効期限付きキー生成
export { getFeatureLimits }      // ティア別機能制限取得
export { TIER_LIMITS }           // 機能制限定義
export { PRODUCT_CODES }         // 製品コード定義
export type { LicenseTier, ProductCode, LicenseValidationResult, FeatureLimits }
```

```python
# Python
LicenseValidator      # ライセンス検証クラス
generate_license_key  # キー生成（開発用）
generate_license_with_expiry  # 有効期限付きキー生成
get_feature_limits    # ティア別機能制限取得
TIER_LIMITS          # 機能制限定義
PRODUCT_CODES        # 製品コード定義
```

### 使用例

```typescript
import { LicenseValidator, getFeatureLimits } from '@insight/license';

const validator = new LicenseValidator();
const result = validator.validate(licenseKey, 'SALES');

if (result.isValid) {
  const limits = getFeatureLimits(result.tier);
  console.log(`最大ファイル数: ${limits.maxFiles}`);
}
```

---

## 2. i18n/ - 多言語対応

### パス
| 言語 | ファイル | エイリアス |
|------|---------|-----------|
| TypeScript | `i18n/index.ts` | `@insight/i18n` |
| Python | `i18n/__init__.py` | `insight_common.i18n` |
| JSON | `i18n/ja.json`, `i18n/en.json` | - |

### エクスポート

```typescript
// TypeScript
export { t }           // 翻訳取得関数
export { setLocale }   // ロケール設定
export { getLocale }   // 現在のロケール取得
export { detectLocale } // システムロケール検出
export { translations } // 翻訳データ
export type { Locale, TranslationKey }
```

### 使用例

```typescript
import { t, setLocale } from '@insight/i18n';

setLocale('ja');
console.log(t('common.save'));        // "保存"
console.log(t('license.expires', { days: 30 })); // "残り30日"
```

### 翻訳キー構造

```
common.*        - 共通UI（保存、キャンセル、削除等）
license.*       - ライセンス関連
feature.*       - 機能名
auth.*          - 認証関連
settings.*      - 設定画面
file.*          - ファイル操作
date.*          - 日付表現
validation.*    - バリデーション
errors.*        - エラーメッセージ
products.*      - 製品名
company.*       - 会社情報
```

---

## 3. utils/ - ユーティリティ

### パス
| 言語 | ファイル | エイリアス |
|------|---------|-----------|
| TypeScript | `utils/typescript/index.ts` | `@insight/utils` |
| Python | `utils/python/__init__.py` | `insight_common.utils` |

### エクスポート

```typescript
// 日付
export { formatDate }        // 日付フォーマット
export { formatRelativeDate } // 相対日付（1時間前等）
export { daysUntil }         // 指定日までの日数

// 数値
export { formatNumber }      // 数値フォーマット（桁区切り）
export { formatCurrency }    // 通貨フォーマット
export { formatPercent }     // パーセント表示
export { formatFileSize }    // ファイルサイズ表示

// 文字列
export { truncate }          // 文字列切り詰め
export { toSnakeCase }       // snake_case 変換
export { toCamelCase }       // camelCase 変換
export { toPascalCase }      // PascalCase 変換

// バリデーション
export { isValidEmail }      // メール形式チェック
export { isValidUrl }        // URL形式チェック
export { isValidPhoneJP }    // 日本電話番号チェック

// コレクション
export { groupBy }           // グループ化
export { unique }            // 重複除去
export { sortByLocale }      // ロケール順ソート

// その他
export { sleep }             // 待機
export { debounce }          // デバウンス
export { throttle }          // スロットル
export { generateId }        // ID生成
export { deepClone }         // ディープコピー
export { isEmpty }           // 空判定
```

### 使用例

```typescript
import { formatDate, formatCurrency, isValidEmail, debounce } from '@insight/utils';

formatDate(new Date(), 'long', 'ja');  // "2025年1月15日"
formatCurrency(1500);                   // "¥1,500"
isValidEmail('test@example.com');       // true

const debouncedSearch = debounce(search, 300);
```

---

## 4. errors/ - エラー定義

### パス
| 言語 | ファイル | エイリアス |
|------|---------|-----------|
| TypeScript | `errors/index.ts` | `@insight/errors` |
| Python | `errors/__init__.py` | `insight_common.errors` |

### エクスポート

```typescript
// エラーコード
export { ErrorCode }         // エラーコード enum

// エラークラス
export { InsightError }      // 基底エラー
export { LicenseError }      // ライセンスエラー
export { ValidationError }   // バリデーションエラー
export { NetworkError }      // ネットワークエラー
export { FileError }         // ファイルエラー

// ユーティリティ
export { toInsightError }    // 任意のエラーを変換
export { isRetryable }       // リトライ可能判定
export { getErrorMessageKey } // i18nキー取得
```

### エラーコード一覧

```typescript
ErrorCode.UNKNOWN           // 不明なエラー
ErrorCode.VALIDATION        // バリデーションエラー
ErrorCode.LICENSE_REQUIRED  // ライセンス必要
ErrorCode.LICENSE_EXPIRED   // ライセンス期限切れ
ErrorCode.LICENSE_INVALID   // 無効なライセンス
ErrorCode.FEATURE_LOCKED    // 機能制限
ErrorCode.NETWORK_ERROR     // ネットワークエラー
ErrorCode.NETWORK_TIMEOUT   // タイムアウト
ErrorCode.FILE_NOT_FOUND    // ファイル未検出
ErrorCode.FILE_READ_ERROR   // 読み込みエラー
ErrorCode.FILE_WRITE_ERROR  // 書き込みエラー
ErrorCode.PERMISSION_DENIED // 権限なし
ErrorCode.QUOTA_EXCEEDED    // 容量超過
ErrorCode.RATE_LIMITED      // レート制限
ErrorCode.SERVER_ERROR      // サーバーエラー
ErrorCode.MAINTENANCE       // メンテナンス中
```

### 使用例

```typescript
import { LicenseError, isRetryable, toInsightError } from '@insight/errors';

// エラー生成
throw LicenseError.expired();

// エラーハンドリング
try {
  await fetchData();
} catch (e) {
  const error = toInsightError(e);
  if (isRetryable(error)) {
    // リトライ処理
  }
}
```

---

## 5. brand/ - ブランド・デザイン

### パス
| ファイル | 内容 | エイリアス |
|---------|------|-----------|
| `brand/colors.json` | カラーパレット | `@insight/brand/colors.json` |
| `brand/design-system.json` | デザインシステム | `@insight/brand/design-system.json` |
| `brand/voice-guidelines.md` | トーン＆マナー | - |

### colors.json 構造

```typescript
import colors from '@insight/brand/colors.json';

colors.brand.primary      // { main, light, dark, contrastText }
colors.brand.secondary
colors.brand.accent
colors.semantic.success   // 成功
colors.semantic.warning   // 警告
colors.semantic.error     // エラー
colors.semantic.info      // 情報
colors.neutral            // グレースケール
colors.products.salesInsight    // 製品別カラー
colors.products.insightSlide
colors.products.insightPy
colors.products.interviewInsight
colors.darkMode           // ダークモード用
colors.lightMode          // ライトモード用
```

### design-system.json 構造

```typescript
import ds from '@insight/brand/design-system.json';

ds.typography.fontFamily  // フォント定義
ds.typography.scale       // フォントサイズ
ds.spacing.scale          // スペーシング
ds.borderRadius           // 角丸
ds.shadows                // シャドウ
ds.animation              // アニメーション
ds.breakpoints            // ブレークポイント
ds.zIndex                 // z-index
ds.iconography            // アイコン設定
```

---

## 6. ui/ - UI構造定義

### パス
| ファイル | 内容 | エイリアス |
|---------|------|-----------|
| `ui/menu-structure.json` | メニュー構造 | `@insight/ui/menu-structure.json` |
| `ui/components.md` | コンポーネント仕様 | - |

### menu-structure.json 構造

```typescript
import menu from '@insight/ui/menu-structure.json';

menu.sidebar              // サイドバー構造
menu.header               // ヘッダー構造
menu.contextMenu          // コンテキストメニュー
menu.settings             // 設定画面構造
menu.productSpecific      // 製品固有メニュー
menu.shortcuts            // キーボードショートカット
```

---

## 7. config/ - 製品設定

### パス
| ファイル | 内容 |
|---------|------|
| `config/products.json` | 製品定義・ティア設定 |

### 構造

```typescript
import config from '@insight/config/products.json';

config.products.desktop   // デスクトップ製品一覧
config.products.mobile    // モバイル製品一覧
config.tiers              // ライセンスティア定義
config.featureFlags       // 機能フラグ
```

---

## 8. hooks/ - 共通フック

### パス
| ファイル | 内容 | プラットフォーム |
|---------|------|-----------------|
| `hooks/useVoiceInput.ts` | 音声入力フック | Web |
| `hooks/useVoiceInput.native.ts` | 音声入力フック | React Native |

### useVoiceInput - 統一音声入力

クロスプラットフォーム対応の音声入力フック。**1.5秒自動コミット**機能でプラットフォーム間の挙動を統一。

**特徴:**
- Web (Chrome/Edge): Web Speech APIの自動文末検出 + 1.5秒バックアップタイマー
- Web (Safari iOS): Whisper APIへフォールバック
- React Native (iOS/Android): expo-speech-recognition + 1.5秒自動コミット

**挙動の統一:**
| プラットフォーム | ネイティブの挙動 | 統一後の挙動 |
|----------------|-----------------|-------------|
| Chrome/Edge | `isFinal`自動検出 | そのまま（自然） |
| Safari iOS | リアルタイム非対応 | Whisper使用 |
| React Native | `isFinal`不安定 | **1.5秒タイマーで補完** |

### エクスポート

```typescript
// Web
import { useVoiceInput } from '@insight/hooks/useVoiceInput';

export interface VoiceInputConfig {
  onFinalText: (text: string) => void;  // 確定テキスト
  onInterimText?: (text: string) => void; // 途中テキスト
  autoCommitDelay?: number;  // デフォルト: 1500ms
  language?: string;         // デフォルト: 'ja-JP'
  forceAutoCommitDelay?: boolean; // isFinalでも遅延適用
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

// 戻り値
interface UseVoiceInputReturn {
  isListening: boolean;
  interimText: string;
  method: 'webspeech' | 'whisper' | 'native' | 'none';
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  clearInterim: () => void;
  commitInterim: () => void;
}
```

### 使用例

```tsx
// Web (React/Next.js)
import { useVoiceInput } from '@/insight-common/hooks/useVoiceInput';

function TextInput() {
  const [text, setText] = useState('');

  const {
    isListening,
    interimText,
    startListening,
    stopListening,
  } = useVoiceInput({
    onFinalText: (t) => setText((prev) => prev + t + ' '),
    autoCommitDelay: 1500,
  });

  return (
    <div>
      <textarea value={text + interimText} readOnly />
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? '停止' : '🎤 音声入力'}
      </button>
    </div>
  );
}
```

```tsx
// React Native
import { useVoiceInputRN } from '@/insight-common/hooks/useVoiceInput.native';

function VoiceInput() {
  const [text, setText] = useState('');

  const {
    isListening,
    interimText,
    startListening,
    stopListening,
  } = useVoiceInputRN({
    onFinalText: (t) => setText((prev) => prev + t + ' '),
    autoCommitDelay: 1500,
  });

  return (
    <View>
      <Text>{text}{interimText}</Text>
      <Button
        title={isListening ? '停止' : '🎤 音声入力'}
        onPress={isListening ? stopListening : startListening}
      />
    </View>
  );
}
```

### 依存関係

| プラットフォーム | 依存パッケージ |
|----------------|---------------|
| Web | なし（ブラウザAPIを使用） |
| React Native | `expo-speech-recognition` |

---

## 9. contexts/ - 共通コンテキスト

### パス
| ファイル | 内容 |
|---------|------|
| `contexts/createDataContext.tsx` | データコンテキストファクトリー |

### createDataContext - 汎用データ管理

アプリ間で共通のデータ管理パターンを提供するファクトリー関数。

**特徴:**
- ローカルストレージ自動永続化
- CRUD操作（create, update, remove）
- ローディング/エラー状態管理
- Web (localStorage) / React Native (AsyncStorage) 両対応

### エクスポート

```typescript
import { createDataContext, createAsyncStorageAdapter } from '@insight/contexts/createDataContext';

interface DataContextConfig<T> {
  storageKey: string;              // ストレージキー
  generateId?: () => string;       // ID生成関数
  storageAdapter?: StorageAdapter; // ストレージアダプター
  initialData?: T[];               // 初期データ
  normalize?: (data: T[]) => T[];  // データ正規化
  debug?: boolean;                 // デバッグモード
}

interface DataContextValue<T> {
  items: T[];
  setItems: React.Dispatch<...>;
  isLoaded: boolean;
  error: string | null;
  create: (item: Omit<T, 'id'>) => T;
  update: (id: string, updates: Partial<T>) => void;
  remove: (id: string) => void;
  findById: (id: string) => T | undefined;
  clear: () => void;
}
```

### 使用例

```tsx
// contexts/TodoContext.tsx
import { createDataContext } from '@/insight-common/contexts/createDataContext';

interface Todo {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  scheduledDate: string;
  createdAt?: string;
}

const {
  Provider: TodoProvider,
  useContext: useTodos,
} = createDataContext<Todo>({
  storageKey: 'app_todos',
  normalize: (todos) => todos.map(t => ({
    ...t,
    status: t.status || 'todo',
  })),
});

export { TodoProvider, useTodos };
```

```tsx
// App.tsx
import { TodoProvider } from './contexts/TodoContext';

export default function App() {
  return (
    <TodoProvider>
      <HomeScreen />
    </TodoProvider>
  );
}
```

```tsx
// screens/HomeScreen.tsx
import { useTodos } from '../contexts/TodoContext';

function HomeScreen() {
  const { items, create, update, remove, isLoaded } = useTodos();

  if (!isLoaded) return <Loading />;

  const handleAdd = () => {
    create({
      title: '新しいタスク',
      status: 'todo',
      scheduledDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <View>
      {items.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() => update(todo.id, {
            status: todo.status === 'done' ? 'todo' : 'done'
          })}
          onDelete={() => remove(todo.id)}
        />
      ))}
      <Button title="追加" onPress={handleAdd} />
    </View>
  );
}
```

### React Native (AsyncStorage)

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDataContext, createAsyncStorageAdapter } from '@/insight-common/contexts/createDataContext';

const asyncStorageAdapter = createAsyncStorageAdapter(AsyncStorage);

const { Provider, useContext } = createDataContext<Todo>({
  storageKey: 'app_todos',
  storageAdapter: asyncStorageAdapter,
});
```

---

## 10. components/ - 共通コンポーネント

### パス
| ファイル | 内容 | プラットフォーム |
|---------|------|-----------------|
| `components/VoiceInputUnified.tsx` | 統合音声入力UI | Web |

### VoiceInputUnified - 音声入力ボタン

Web向けの音声入力UIコンポーネント。Chrome/EdgeではWeb Speech API、iOS SafariではWhisper APIを自動選択。

```tsx
import { VoiceInputUnified } from '@/insight-common/components/VoiceInputUnified';

<VoiceInputUnified
  onTranscript={(text) => appendText(text)}
  onInterimTranscript={(text) => setPreview(text)}
  whisperEndpoint="/api/transcribe"
  disabled={false}
  maxDuration={60}
/>
```

---

## 11. legal/ - 法務文書

### パス
| ファイル | 内容 |
|---------|------|
| `legal/terms-of-service.md` | 利用規約 |
| `legal/privacy-policy.md` | プライバシーポリシー |

---

## 12. company/ - 会社情報

### パス
| ファイル | 内容 |
|---------|------|
| `company/about.md` | 会社概要 |
| `company/contact.json` | 連絡先情報 |

### contact.json 構造

```typescript
import contact from '@insight/company/contact.json';

contact.contact.general.email   // info@h-insight.jp
contact.contact.support.email   // support@h-insight.jp
contact.contact.developer.email // developer@h-insight.jp
```

---

## エイリアス対応表

| エイリアス | 実パス |
|-----------|--------|
| `@insight/license` | `insight-common/license/typescript` |
| `@insight/i18n` | `insight-common/i18n` |
| `@insight/utils` | `insight-common/utils/typescript` |
| `@insight/errors` | `insight-common/errors` |
| `@insight/brand/*` | `insight-common/brand/*` |
| `@insight/ui/*` | `insight-common/ui/*` |
| `@insight/config/*` | `insight-common/config/*` |
| `@insight/company/*` | `insight-common/company/*` |
