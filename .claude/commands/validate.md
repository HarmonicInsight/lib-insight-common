# 標準検証コマンド

対象プロジェクトに対して HARMONIC insight の開発標準検証を実行します。

## 実行手順

1. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする
2. `scripts/validate-standards.sh` を実行する
3. エラーがあれば一覧を表示し、修正案を提示する
4. 警告があれば一覧を表示する

```bash
bash ./scripts/validate-standards.sh ${ARGUMENTS:-.}
```

検証に失敗した場合は、CLAUDE.md のデザインシステム（セクション「デザインシステム: Ivory & Gold Theme」）を参照して修正案を提示してください。

主な検証項目:
- Gold (#B8942F) がプライマリカラーとして使用されているか
- Ivory (#FAF8F5) が背景色として使用されているか
- Blue (#2563EB) がプライマリとして使用されていないか
- InsightLicenseManager が実装されているか
- ライセンスキー形式が正しいか
