# ライセンス発行ツール

Insight Series のライセンスキーを発行するCLIチE�Eル

## キー形弁E

```
PPPP-PLAN-YYMM-HASH-SIG1-SIG2

侁E INSS-PRO-2701-A3F8-K9X2-M4PQ
    ━E   ━E   ━E   ━E   └─ 署名！E斁E��！E
    ━E   ━E   ━E   └────── メールハッシュ�E�E斁E��！E
    ━E   ━E   └─────────── 有効期限�E�E027年1月！E
    ━E   └──────────────── プラン�E�Ero�E�E
    └───────────────────── 製品E��EnsightOfficeSlide�E�E
```

## セチE��アチE�E

```bash
git clone https://github.com/HarmonicInsight/cross-lib-insight-common.git
cd insight-common/license/tools
```

※ Python 3.7以上が忁E��E��追加パッケージ不要E��E

---

## 使ぁE��

```bash
python generate-license.py -p INSS --plan PRO -e user@example.com --expires 2027-01-31
```

## 使用侁E

### 1. トライアルライセンス�E�E4日間！E

```bash
python generate-license.py -p INSS --trial -e user@example.com
python generate-license.py -p INPY --trial -e user@example.com
python generate-license.py -p IVIN --trial -e user@example.com
```

### 2. 年間ライセンス�E�E2ヶ月！E

```bash
# InsightOfficeSlide Standard
python generate-license.py -p INSS --plan STD -e user@example.com -m 12

# InsightOfficeSheet Standard
python generate-license.py -p IOSH --plan STD -e user@example.com -m 12

# InsightPy
python generate-license.py -p INPY --plan STD -e user@example.com -m 12

# InterviewInsight
python generate-license.py -p IVIN --plan STD -e user@example.com -m 12
```

### 3. 持E��日までのライセンス

```bash
python generate-license.py -p INSS --plan PRO -e user@example.com --expires 2027-12-31
```

---

## オプション

| オプション | 短縮形 | 説昁E| 忁E��E|
|-----------|--------|------|:----:|
| `--product` | `-p` | 製品コーチE| ✁E|
| `--email` | `-e` | メールアドレス | ✁E|
| `--plan` | - | プラン (STD/PRO) | △ |
| `--trial` | - | トライアル発衁E| △ |
| `--expires` | - | 有効期限 (YYYY-MM-DD) | - |
| `--months` | `-m` | 有効期間�E�月数�E�E| - |
| `--json` | - | JSON形式�Eみ出劁E| - |
| `--csv` | - | CSV形式�Eみ出劁E| - |

※ `--plan` また�E `--trial` のどちらかが忁E��E

---

## 製品コーチE

| コーチE| 製品名 |
|--------|--------|
| `INSS` | InsightOfficeSlide |
| `IOSH` | InsightOfficeSheet |
| `IOSD` | InsightOfficeDoc |
| `INPY` | InsightPy |
| `INMV` | InsightCast |
| `INBT` | InsightBot |
| `INCA` | InsightNoCodeAnalyzer |
| `INIG` | InsightImageGen |
| `IVIN` | InterviewInsight |

## プラン

| コーチE| 名称 | 期間 |
|--------|------|------|
| `TRIAL` | トライアル | 14日 |
| `STD` | Standard | 年閁E|
| `PRO` | Pro | 年閁E|

---

## 出力侁E

```
========================================
  Insight Series ライセンス発衁E
========================================

製品E       InsightOfficeSlide (INSS)
プラン:     Pro (PRO)
メール:     user@example.com
有効期限:   2027-01-31

----------------------------------------
ライセンスキー: INSS-PRO-2701-A3F8-K9X2-M4PQ
----------------------------------------
```

---

## 注意事頁E

1. **メールアドレス紐付け**: ライセンスキーはメールアドレスと紐付けられます。認証時に同じメールアドレスが忁E��です、E

2. **オフライン検証**: ライセンス検証はオフラインで実行可能。サーバ�E通信は不要です、E

3. **署名検証**: HMAC-SHA256による署名検証で改ざんを検�Eします、E
