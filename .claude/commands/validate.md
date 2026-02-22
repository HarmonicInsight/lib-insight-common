# 標準検証コマンド

対象プロジェクトに対して HARMONIC insight の開発標準検証を実行します。

## 実行手順

1. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする
2. `scripts/validate-standards.sh` を実行する
3. `scripts/validate-menu-icons.sh` を実行する（メニューアイコン標準検証）
4. 業務系アプリ（INBT/INCA/IVIN）の場合は `scripts/validate-cool-color.sh` も実行する
5. エラーがあれば一覧を表示し、修正案を提示する
6. 警告があれば一覧を表示する

```bash
# デザイン標準検証
bash ./scripts/validate-standards.sh ${ARGUMENTS:-.}

# メニューアイコン標準検証
bash ./scripts/validate-menu-icons.sh ${ARGUMENTS:-.}
```

検証に失敗した場合は、以下を参照して修正案を提示してください:
- **デザイン標準**: CLAUDE.md のデザインシステム（Ivory & Gold / Cool Blue & Slate）
- **メニューアイコン**: `standards/MENU_ICONS.md` と `brand/menu-icons.json`

## 主な検証項目

### デザイン標準
- Gold (#B8942F) がプライマリカラーとして使用されているか
- Ivory (#FAF8F5) が背景色として使用されているか
- Blue (#2563EB) がプライマリとして使用されていないか
- InsightLicenseManager が実装されているか
- ライセンスキー形式が正しいか

### メニューアイコン標準
- Lucide Icons ライブラリが使用されているか
- 非標準アイコンライブラリ（Material Design / Font Awesome 等）が混入していないか
- `brand/menu-icons.json` に定義されたアイコン名が使用されているか
- アイコンのスタイル（strokeWidth: 1.5、サイズ: 16/20/24/32px）が統一されているか
