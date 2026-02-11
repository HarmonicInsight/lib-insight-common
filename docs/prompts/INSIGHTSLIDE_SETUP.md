# InsightSlide: insight-common 統合プロンプト

以下のプロンプトを InsightSlide リポジトリの Claude Code セッションで実行してください。

---

## プロンプト

```
# InsightSlide に insight-common を統合

## 概要
Insight Series の共通リソースリポジトリ (insight-common) を InsightSlide に統合してください。
既存の LicenseManager.py のロジックを新しい統一形式に移行します。

## 手順

### 1. Submodule として追加
```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init --recursive
```

### 2. 既存ライセンス形式との互換性

InsightSlide には既存のライセンス形式があります：
- `PRO-XXXX-XXXX-XXXX` (永続)
- `STD-XXXX-XXXX-2025` (年間)
- `TRIAL-XXXXXX-YYYYMMDD` (トライアル)

新しい形式 `INS-SLIDE-XXX-XXXX-XXXX-XX` に移行しつつ、レガシーサポートを維持してください。

### 3. ライセンス管理の実装

`licensing/unified_license.py` を作成：

```python
from insight_common.license import (
    LicenseValidator,
    LicenseInfo,
    ProductCode,
    LicenseTier,
    get_feature_limits,
)

CURRENT_PRODUCT = ProductCode.SLIDE

class UnifiedLicenseManager:
    def __init__(self):
        self.validator = LicenseValidator()

    def validate(self, license_key: str, expires_at=None) -> LicenseInfo:
        # 新形式 (INS-SLIDE-...)
        if license_key.startswith("INS-"):
            return self.validator.validate(license_key, expires_at)

        # レガシー形式 (PRO-/STD-/TRIAL-)
        return self._validate_legacy(license_key)

    def _validate_legacy(self, key: str) -> LicenseInfo:
        # 既存の検証ロジックをここに移植
        # PRO-/STD-/TRIAL- 形式をサポート
        pass
```

### 4. 既存コードとの統合

`app/insightslides_app.py` の LicenseManager クラスを更新：
- `UnifiedLicenseManager` を使用
- 新旧両形式をサポート
- 機能制限は `get_feature_limits()` を使用

### 5. 管理ツールの更新

`admin_tool/license_manager_gui.py` を更新：
- 新しい INS-SLIDE-XXX 形式でキーを生成
- 既存のキー検索・エクスポートは維持

### 6. ブランドカラーの適用

insight-common/brand/colors.json から InsightSlide のカラーを取得:
- プライマリ: `#7C3AED` (Purple)

### 7. コミット

```bash
git add -A
git commit -m "feat: Integrate insight-common with legacy license support"
git push
```

## 確認事項

- [ ] submodule が正しく追加された
- [ ] 新形式 (INS-SLIDE-...) が動作する
- [ ] レガシー形式 (PRO-/STD-/TRIAL-) も動作する
- [ ] 機能制限が適用される
- [ ] 管理ツールで新形式キーが生成される
```

---

## 補足情報

### InsightSlide の製品コード
- `SLIDE` (ライセンスキー: `INS-SLIDE-XXX-XXXX-XXXX-XX`)
- `ALL` も使用可能（全製品バンドル）

### レガシー形式のマッピング

| レガシー | 新形式 |
|---------|--------|
| `PRO-XXXX-XXXX-XXXX` | `INS-SLIDE-PRO-XXXX-XXXX-XX` |
| `STD-XXXX-XXXX-2025` | `INS-SLIDE-STD-XXXX-XXXX-XX` |
| `TRIAL-XXXXXX-YYYYMMDD` | `INS-SLIDE-TRIAL-XXXX-XXXX-XX` |

### 参照ドキュメント
- [クイックスタート](../QUICKSTART.md)
- [統合ガイド](../INTEGRATION_GUIDE.md)
- [ライセンス仕様](../../license/README.md)
