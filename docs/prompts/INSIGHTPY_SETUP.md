# InsightPy: insight-common 統合プロンプト

以下のプロンプトを InsightPy リポジトリの Claude Code セッションで実行してください。

---

## プロンプト

```
# InsightPy に insight-common を統合

## 概要
Insight Series の共通リソースリポジトリ (insight-common) を InsightPy に統合してください。

## 手順

### 1. Submodule として追加
```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init --recursive
```

### 2. ライセンス管理の実装

`src/license_manager.py` を作成し、以下の機能を実装：

- insight-common/license/python からインポート
- 製品コード: `ProductCode.PY`
- ライセンスファイル: `~/.insightpy/license.json`
- 機能:
  - load_license(): ライセンス読み込み・検証
  - register_license(key, expires_at): ライセンス登録
  - get_feature_limits(): 機能制限取得

参照実装:
```python
from insight_common.license import (
    LicenseValidator,
    LicenseInfo,
    ProductCode,
    LicenseTier,
    get_feature_limits,
)

CURRENT_PRODUCT = ProductCode.PY
```

### 3. 機能制限ゲートの実装

`src/feature_check.py` を作成：

```python
def require_feature(feature: str):
    """機能が利用可能かチェックするデコレータ"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            limits = license_manager.get_feature_limits()
            if not getattr(limits, feature, False):
                raise PermissionError("この機能はご利用のプランでは使用できません")
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

### 4. 既存の LicenseManager との統合

既存の InsightPy にライセンス管理がある場合:
- 新しい INS-PY-XXX 形式に移行
- レガシーキー (既存形式) もサポート
- 設定ファイルのパスは維持

### 5. ブランドカラーの適用

insight-common/brand/colors.json から InsightPy のカラーを取得:
- プライマリ: `#059669` (Green)

### 6. コミット

```bash
git add -A
git commit -m "feat: Integrate insight-common for unified license management"
git push
```

## 確認事項

- [ ] submodule が正しく追加された
- [ ] ライセンス検証が動作する
- [ ] 機能制限が適用される
- [ ] 既存のライセンスキーとの互換性（必要な場合）
```

---

## 補足情報

### InsightPy の製品コード
- `PY` (ライセンスキー: `INS-PY-XXX-XXXX-XXXX-XX`)
- `ALL` も使用可能（全製品バンドル）

### ティア別機能制限

| ティア | ファイル数 | レコード数 | バッチ処理 | エクスポート | クラウド同期 |
|--------|-----------|-----------|-----------|-------------|-------------|
| FREE | 10 | 500 | ✅ | ✅ | ❌ |
| TRIAL | ∞ | ∞ | ✅ | ✅ | ✅ |
| BIZ | ∞ | 50,000 | ✅ | ✅ | ✅ |
| ENT | ∞ | ∞ | ✅ | ✅ | ✅ |

### 参照ドキュメント
- [クイックスタート](../QUICKSTART.md)
- [統合ガイド](../INTEGRATION_GUIDE.md)
- [ライセンス仕様](../../license/README.md)
