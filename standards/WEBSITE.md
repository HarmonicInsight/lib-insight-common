# 公開Webサイト デザイン標準

> 製品ホームページ・会社ホームページ・ランディングページに適用する色・デザインの統一ルール

## 適用範囲

| 対象 | URL | 説明 |
|------|-----|------|
| コーポレートサイト | https://h-insight.jp | ハーモニックインサイト合同会社 |
| 製品サイト | https://www.insight-office.com | Insight Office 製品ポータル |
| 小説プラットフォーム | https://www.insight-novels.com | AI活用メディアプラットフォーム |
| 個人事業主サイト | https://erikhiroyuki.com | 瀬田博之 コンサルタント紹介 |

> **注意:** このドキュメントは公開Webサイト（マーケティングサイト）向けです。
> デスクトップアプリ・モバイルアプリのUI標準は `REACT.md` / `CSHARP_WPF.md` / `IOS.md` を参照してください。
> アプリ内UIには引き続き Ivory & Gold テーマ (`brand/colors.json`) を適用します。

---

## 1. カラーシステム

### 1.1 ベースカラー（全ページ共通）

公開Webサイトは **Tailwind CSS の `slate` パレット** を基底色とします。
`gray` 系は使用禁止です（`slate` は青みがかった知的な印象を与え、ブランドの「Professional Intelligence」に合致）。

```
■ ライトモード
  背景 Primary:    bg-white              (#FFFFFF)
  背景 Secondary:  bg-slate-50           (#F8FAFC)
  カード:          bg-white              (#FFFFFF)
  テキスト Primary: text-slate-900       (#0F172A)
  テキスト Secondary: text-slate-600     (#475569)
  テキスト Muted:  text-slate-400        (#94A3B8)
  ボーダー:        border-slate-200      (#E2E8F0)

■ ダークモード
  背景 Primary:    dark:bg-slate-950     (#020617)
  背景 Secondary:  dark:bg-slate-900     (#0F172A)
  カード:          dark:bg-slate-800     (#1E293B)
  テキスト Primary: dark:text-white      (#FFFFFF)
  テキスト Secondary: dark:text-slate-400 (#94A3B8)
  テキスト Muted:  dark:text-slate-500   (#64748B)
  ボーダー:        dark:border-slate-700 (#334155)
```

**禁止事項:**

- ❌ `bg-gray-*` / `dark:bg-gray-*` の使用（`slate` に統一）
- ❌ ページごとにダークモード基底色を変えること
- ❌ ライトモードでダークテーマ固定のページを作ること（InsightOfficeページ等）

### 1.2 ブランドアクセント

ヘッダー・フッターのロゴには `violet-600` (#7C3AED) を使用します。

```
ロゴ背景:     bg-violet-600    (#7C3AED)
ロゴテキスト:  text-white
```

### 1.3 カテゴリアクセントカラー

各ソリューションカテゴリには固有のアクセントカラーを割り当てます。
色相環で十分に離れた色を選定し、隣接色の混同を防ぎます。

| カテゴリ | アクセントカラー | Tailwind | 用途 |
|----------|-----------------|----------|------|
| Windowsアプリ | Blue | `blue-500` (#3B82F6) | InsightOffice 等 |
| 業務改善ツール | Violet | `violet-500` (#8B5CF6) | SalesInsight 等 |
| Insight Series | Amber | `amber-500` (#F59E0B) | InsightSlide, Movie 等 |
| 1on1 教育 | Emerald | `emerald-500` (#10B981) | 教育プラットフォーム |
| ハードウェア | Rose | `rose-500` (#F43F5E) | IoT デバイス |

**ルール:**

- アクセントカラーは各カテゴリページの eyebrow テキスト・アイコン背景・CTA等に使用
- ベース（白・slate系）を80%以上に保ち、アクセントは20%以下に抑える
- 文字色としてアクセントを使う場合は `-500` 以上（コントラスト比 4.5:1 以上を確保）

### 1.4 セマンティックカラー

ステータス表示にはブランド共通のセマンティックカラーを使用します。
（`brand/colors.json` の `semantic` セクションと同一）

```
Success:  text-green-600   (#16A34A)  / bg-green-50
Warning:  text-yellow-600  (#CA8A04)  / bg-yellow-50
Error:    text-red-600     (#DC2626)  / bg-red-50
Info:     text-blue-600    (#2563EB)  / bg-blue-50
```

---

## 2. タイポグラフィ

### 2.1 フォントファミリ

```
日本語:   Noto Sans JP (300, 400, 500, 700)
英語:     DM Sans (300, 400, 500, 600)
見出し装飾: Playfair Display (400, 500, 600, 700) ※ 限定的に使用
```

layout.tsx で CSS 変数として定義：

```
--font-japanese: 'Noto Sans JP'
--font-body: 'DM Sans'
--font-display: 'Playfair Display'
```

### 2.2 見出し階層

| 要素 | サイズ | ウェイト | 用途 |
|------|--------|---------|------|
| Hero H1 | `text-4xl sm:text-5xl lg:text-6xl` | `font-semibold` | ページ最上部の大見出し |
| Section H2 | `text-2xl sm:text-3xl` | `font-semibold` | セクション見出し |
| Subsection H3 | `text-lg` | `font-medium` | サブセクション・カードタイトル |
| Body | `text-base` | `font-normal` | 本文 |
| Caption | `text-sm` | `font-normal` | 補足説明・タグ |
| Eyebrow | `text-xs tracking-widest uppercase` | `font-medium` | セクションラベル（英語） |

**禁止事項:**

- ❌ `font-bold` を見出しに使用（`font-semibold` まで。`font-light` は Hero H1 のサブ要素のみ可）
- ❌ 本文に `text-lg` 以上を使用
- ❌ Eyebrow を日本語で記述（英語のみ）

---

## 3. レイアウトパターン

### 3.1 ページ構成

全ページは以下の構成に従います：

```
<Header />                     ← 共通（固定、高さ 64px）
<main className="pt-16">
  <HeroSection />              ← ページごとに1つ
  <ContentSection />           ← 複数可
  <CTASection />               ← ページ最下部に1つ
</main>
<Footer />                     ← 共通
```

### 3.2 Hero セクション（2パターンのみ）

#### パターン A: センター配置（TOP・概要ページ向け）

```jsx
<section className="relative overflow-hidden bg-white dark:bg-slate-950">
  <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:pt-40 lg:px-8 lg:pt-44">
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-medium tracking-widest text-slate-500 uppercase mb-6">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="mt-8 text-lg text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  </div>
</section>
```

#### パターン B: 左寄せ（各製品・カテゴリページ向け）

```jsx
<section className="relative overflow-hidden bg-white dark:bg-slate-950">
  <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:pt-40 lg:px-8 lg:pt-44">
    <div className="max-w-3xl">
      <p className="text-xs font-medium tracking-widest text-{accent}-500 uppercase mb-4">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-light text-slate-900 dark:text-white sm:text-5xl mb-6 tracking-tight">
        {title}
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
</section>
```

**禁止事項:**

- ❌ gradient 背景のHero（Contact等）
- ❌ ダーク固定背景のHero（必ず light/dark 両対応）
- ❌ 上記2パターン以外のHeroレイアウト

### 3.3 コンテンツセクション

```jsx
<section className="py-24 bg-white dark:bg-slate-950">       {/* 白背景 */}
<section className="py-24 bg-slate-50 dark:bg-slate-900">    {/* グレー背景 */}
```

- 白背景とグレー背景を **交互に** 配置する
- セクション間にボーダーは不要（背景色の切り替えで区切る）
- セクション padding は `py-24` 固定
- コンテンツ幅は `max-w-7xl` 固定（`px-6 lg:px-8`）

### 3.4 CTA セクション（1パターン）

全ページ共通。最下部に配置。

```jsx
<section className="py-24 bg-slate-900 dark:bg-white">
  <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
    <h2 className="text-2xl sm:text-3xl font-semibold text-white dark:text-slate-900 mb-4">
      {ctaTitle}
    </h2>
    <p className="text-slate-400 dark:text-slate-600 max-w-xl mx-auto mb-8">
      {ctaDescription}
    </p>
    <a href="/contact" className="inline-flex items-center px-6 py-3 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      お問い合わせ →
    </a>
  </div>
</section>
```

**禁止事項:**

- ❌ gradient 背景の CTA
- ❌ CTA にアクセントカラーを使用（CTAはブランド共通の slate-900/white 反転パターン）
- ❌ CTA セクション内にカードやグリッドを配置

---

## 4. コンポーネントパターン

### 4.1 カード

```jsx
<div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-lg">
  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{title}</h3>
  <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
</div>
```

- 角丸: `rounded-xl` (12px) 固定
- パディング: `p-6` (24px) 固定
- ボーダー: 必須（`border-slate-200 dark:border-slate-700`）
- ホバー: `hover:shadow-lg` + `hover:border-slate-300`

### 4.2 タグ / バッジ

```jsx
<span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">
  {tagName}
</span>
```

### 4.3 ボタン

```
■ Primary（CTAセクション以外）
  bg-slate-900 dark:bg-white text-white dark:text-slate-900
  hover:bg-slate-800 dark:hover:bg-slate-100
  rounded-lg px-6 py-3 text-sm font-medium

■ Secondary
  border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white
  hover:bg-slate-50 dark:hover:bg-slate-800
  rounded-lg px-6 py-3 text-sm font-medium
```

### 4.4 Eyebrow（セクションラベル）

```jsx
<p className="text-sm font-medium tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-4">
  {sectionLabel}  {/* 英語のみ */}
</p>
```

カテゴリページでは `text-slate-500` の代わりにカテゴリアクセントカラーを使用可：

```jsx
<p className="text-xs font-medium tracking-widest text-blue-500 uppercase mb-4">
  Windows Applications
</p>
```

---

## 5. 連絡先情報

全ページで使用する連絡先は `company/contact.json` を正とします。

| 項目 | 値 |
|------|-----|
| 一般問い合わせ | info@h-insight.jp |
| サポート | support@h-insight.jp |
| 受付時間 | 平日 9:00-18:00 (JST) |
| コーポレートサイト | https://h-insight.jp |
| 製品サイト | https://www.insight-office.com |
| 小説プラットフォーム | https://www.insight-novels.com |
| コンサルタント紹介 | https://erikhiroyuki.com |
| GitHub | https://github.com/HarmonicInsight |
| プライバシーポリシー | https://h-insight.jp/privacy |
| 利用規約 | https://www.insight-office.com/ja/terms |

**禁止事項:**

- ❌ 個人のメールアドレス（staff欄）をサイト上に公開すること
- ❌ `contact.json` と異なる連絡先をハードコードすること

---

## 6. レスポンシブ対応

### ブレークポイント

Tailwind デフォルトに準拠：

```
sm:  640px   → 2カラム開始
md:  768px   → サイドバイサイドレイアウト
lg:  1024px  → フルレイアウト
xl:  1280px  → 最大幅コンテンツ
```

### グリッド

```
カード 2列: grid-cols-1 md:grid-cols-2
カード 3列: grid-cols-1 md:grid-cols-3
カード 4列: grid-cols-1 md:grid-cols-2 xl:grid-cols-4
カード 5列: grid-cols-1 md:grid-cols-2 xl:grid-cols-5
```

---

## 7. ダークモード

- CSS メディアクエリ `prefers-color-scheme` に従う（手動切替は将来対応）
- **全ページ・全セクション** で light/dark 両方のスタイルを定義すること
- ダーク固定ページは禁止

---

## 8. アクセシビリティ

- テキストのコントラスト比: WCAG 2.1 AA (4.5:1) 以上
- インタラクティブ要素: `focus-visible` リングを設定
- 画像: `alt` テキスト必須
- リンク: 下線または色+ホバーで視覚的に区別

---

## 9. チェックリスト

新規ページ作成時・既存ページ修正時に確認：

### カラー

- [ ] ベース背景に `gray-*` を使用していないこと（`slate-*` に統一）
- [ ] ダークモード基底色が `dark:bg-slate-950` / `dark:bg-slate-900` であること
- [ ] ダーク固定ページがないこと（light/dark 両対応）
- [ ] アクセントカラーがカテゴリ定義表に準拠していること
- [ ] gradient 背景を使用していないこと（Hero・CTA含む）

### レイアウト

- [ ] Hero が パターン A or B のいずれかに準拠していること
- [ ] CTA セクションが共通パターンに準拠していること
- [ ] セクション padding が `py-24` であること
- [ ] コンテンツ幅が `max-w-7xl` であること

### タイポグラフィ

- [ ] Eyebrow が英語であること
- [ ] `font-bold` が見出しに使われていないこと（`font-semibold` まで）
- [ ] フォントファミリが layout.tsx の定義に従っていること

### コンポーネント

- [ ] カードが `rounded-xl` + `border` + `p-6` であること
- [ ] ボタンスタイルが統一されていること

### 連絡先

- [ ] 連絡先が `company/contact.json` と一致していること
- [ ] 個人メールアドレスが公開されていないこと

---

## 10. 現状の乖離と移行方針

2025年1月時点で、以下のページが本標準に違反しています。順次修正してください。

| ページ | 違反内容 | 優先度 |
|--------|---------|--------|
| InsightOffice (`/insight-office`) | ダーク固定テーマ、emerald独自色 | **高** |
| Contact (`/contact`) | gradient背景、font-bold使用 | **高** |
| RPA (`/rpa`) | 完全独自テーマ（Ivory & Gold流用） | **中** |
| TOP (`/`) | `dark:bg-gray-950` → `dark:bg-slate-950` に変更必要 | **中** |
| Education (`/education`) | `dark:bg-gray-950` → `dark:bg-slate-950` に変更必要 | **低** |

---

## 関連ドキュメント

- [ブランドカラー定義](../brand/colors.json) — アプリUI向け Ivory & Gold テーマ
- [デザインシステム](../brand/design-system.json) — タイポグラフィ・スペーシング・アニメーション
- [トンマナガイド](../brand/voice-guidelines.md) — UIテキスト・ボイス&トーン
- [連絡先情報](../company/contact.json) — 公開連絡先の正
- [React開発標準](./REACT.md) — アプリUI向け開発チェックリスト
- [Web UI コンポーネント](../ui/web/README.md) — 共通ナビゲーション・フッター
