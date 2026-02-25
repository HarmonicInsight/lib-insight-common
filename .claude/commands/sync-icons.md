# 繧｢繧､繧ｳ繝ｳ蜷梧悄繧ｳ繝槭Φ繝・

insight-common 縺ｮ `brand/icons/generated/` 繧偵た繝ｼ繧ｹ繧ｪ繝悶ヨ繧･繝ｫ繝ｼ繧ｹ縺ｨ縺励※縲√い繝励Μ繝ｪ繝昴ず繝医Μ縺ｮ繧｢繧､繧ｳ繝ｳ繧貞酔譛溘＠縺ｾ縺吶・

`$ARGUMENTS` 縺ｫ陬ｽ蜩√さ繝ｼ繝会ｼ井ｾ・ `VOICE_CLOCK`縲～CAMERA`縲～IOSH`・峨ｒ謖・ｮ壹＠縺ｦ縺上□縺輔＞縲・

## 陬ｽ蜩√さ繝ｼ繝峨→繝ｪ繝昴ず繝医Μ縺ｮ蟇ｾ蠢・

| 陬ｽ蜩√さ繝ｼ繝・| 逕滓・繝・ぅ繝ｬ繧ｯ繝医Μ蜷・| 繝ｪ繝昴ず繝医Μ | 繝励Λ繝・ヨ繝輔か繝ｼ繝 |
|-----------|-------------------|-----------|----------------|
| VOICE_CLOCK | InsightVoiceClock | android-app-insight-voice-clock | Android Native |
| CAMERA | InsightCamera | android-app-insight-camera | Android Native |
| INSS | InsightOfficeSlide | app-insight-slides | WPF |
| IOSH | InsightOfficeSheet | app-insight-sheet | WPF |
| IOSD | InsightOfficeDoc | app-insight-doc | WPF |
| ISOF | InsightSeniorOffice | app-insight-senior-office | WPF |
| INPY | InsightPy | app-insight-py | WPF |
| INBT | InsightBot | app-insight-bot | WPF |
| INCA | InsightNoCodeAnalyzer | app-insight-nca | Tauri |
| IVIN | InterviewInsight | app-interview-insight | Tauri |
| PINBOARD | InsightPinBoard | expo-app-insight-pinboard | Expo |
| VOICE_MEMO | InsightVoiceMemo | expo-app-insight-voice-memo | Expo |
| QR | InsightQR | web-app-insight-qr | Web |
| INMV | InsightCast | app-insight-cast | Python |
| INIG | InsightImageGen | app-insight-image-gen | Python |
| LAUNCHER | InsightLauncher | android-app-insight-launcher | Android Native |

## 螳溯｡梧焔鬆・

### Step 1: 繧ｽ繝ｼ繧ｹ縺ｮ遒ｺ隱・

insight-common 縺ｮ `brand/icons/generated/<逕滓・繝・ぅ繝ｬ繧ｯ繝医Μ蜷・/` 縺ｫ繝槭せ繧ｿ繝ｼ繧｢繧､繧ｳ繝ｳ縺悟ｭ伜惠縺吶ｋ縺狗｢ｺ隱阪☆繧九・

```bash
ls -R brand/icons/generated/<逕滓・繝・ぅ繝ｬ繧ｯ繝医Μ蜷・/
```

繝輔ぃ繧､繝ｫ縺悟ｭ伜惠縺励↑縺・ｴ蜷医・縲～scripts/generate-app-icon.py` 縺ｧ逕滓・縺悟ｿ・ｦ・
```bash
python scripts/generate-app-icon.py --product <陬ｽ蜩√さ繝ｼ繝・
```

### Step 2: 繧｢繝励Μ繝ｪ繝昴ず繝医Μ縺ｮ蜿門ｾ・

蟇ｾ雎｡縺ｮ繧｢繝励Μ繝ｪ繝昴ず繝医Μ縺後Ο繝ｼ繧ｫ繝ｫ縺ｫ縺ゅｋ縺狗｢ｺ隱阪☆繧九・
縺ｪ縺代ｌ縺ｰ GitHub 縺九ｉ繧ｯ繝ｭ繝ｼ繝ｳ縺吶ｋ・・rganization: `HarmonicInsight`・峨・

### Step 3: 蟾ｮ蛻・｢ｺ隱・

繧ｽ繝ｼ繧ｹ・・nsight-common・峨→繧ｿ繝ｼ繧ｲ繝・ヨ・医い繝励Μ繝ｪ繝昴ず繝医Μ・峨・蜷・ヵ繧｡繧､繝ｫ繧呈ｯ碑ｼ・☆繧九・

**Android Native 縺ｮ蝣ｴ蜷・**
- 繧ｽ繝ｼ繧ｹ: `brand/icons/generated/<Dir>/mipmap-*/` 竊・繧ｿ繝ｼ繧ｲ繝・ヨ: `app/src/main/res/mipmap-*/`
- **豕ｨ諢・*: 繧ｿ繝ｼ繧ｲ繝・ヨ縺ｫ `drawable/ic_launcher_foreground.xml` 繧・`mipmap-anydpi-v26/` 縺梧ｮ九▲縺ｦ縺・ｋ蝣ｴ蜷医・蜑企勁縺吶ｋ縺薙→・・ipmap PNG 繧剃ｸ頑嶌縺阪＠縺ｦ縺励∪縺・◆繧・ｼ・

**WPF 縺ｮ蝣ｴ蜷・**
- 繧ｽ繝ｼ繧ｹ: `brand/icons/generated/<Dir>/` 竊・繧ｿ繝ｼ繧ｲ繝・ヨ: `Resources/`

**Expo 縺ｮ蝣ｴ蜷・**
- 繧ｽ繝ｼ繧ｹ: `brand/icons/generated/<Dir>/` 竊・繧ｿ繝ｼ繧ｲ繝・ヨ: `assets/`

**Tauri 縺ｮ蝣ｴ蜷・**
- 繧ｽ繝ｼ繧ｹ: `brand/icons/generated/<Dir>/` 竊・繧ｿ繝ｼ繧ｲ繝・ヨ: `src-tauri/icons/`

蟾ｮ蛻・′縺ｪ縺・ｴ蜷医・縲悟酔譛滓ｸ医∩縲∝ｷｮ蛻・↑縺励阪→蝣ｱ蜻翫＠縺ｦ邨ゆｺ・・

### Step 4: 繝輔ぃ繧､繝ｫ繧ｳ繝斐・

蟾ｮ蛻・・縺ゅｋ繝輔ぃ繧､繝ｫ縺ｮ縺ｿ縲（nsight-common 縺ｮ繧ｽ繝ｼ繧ｹ繧偵い繝励Μ繝ｪ繝昴ず繝医Μ縺ｫ荳頑嶌縺阪さ繝斐・縺吶ｋ縲・
**insight-common 蛛ｴ縺悟ｸｸ縺ｫ繧ｽ繝ｼ繧ｹ繧ｪ繝悶ヨ繧･繝ｫ繝ｼ繧ｹ**縲・

### Step 5: 繧ｳ繝溘ャ繝・& 繝励ャ繧ｷ繝･

繧｢繝励Μ繝ｪ繝昴ず繝医Μ蛛ｴ縺ｧ:
1. `claude/` 繝励Ξ繝輔ぅ繝・け繧ｹ莉倥″繝悶Λ繝ｳ繝√ｒ菴懈・・育樟蝨ｨ縺ｮ繧ｻ繝・す繝ｧ繝ｳ繝悶Λ繝ｳ繝√→蜷悟錐縺梧悍縺ｾ縺励＞・・
2. 螟画峩繧偵さ繝溘ャ繝・ `fix: sync <繧｢繧､繧ｳ繝ｳ遞ｮ蛻･> icon from insight-common`
3. 繝励ャ繧ｷ繝･

### Step 6: 蝣ｱ蜻・

莉･荳九ｒ蝣ｱ蜻翫☆繧・
- 蜷梧悄縺励◆繝輔ぃ繧､繝ｫ荳隕ｧ
- 蟾ｮ蛻・・讎りｦ・
- 繝励ャ繧ｷ繝･蜈医・繝悶Λ繝ｳ繝√→PR菴懈・URL

## 譌｢蟄倥せ繧ｯ繝ｪ繝励ヨ縺ｮ豢ｻ逕ｨ

繝輔ぃ繧､繝ｫ謨ｰ縺悟､壹＞蝣ｴ蜷医・ `sync-app-icons.sh` 繧呈ｴｻ逕ｨ縺ｧ縺阪ｋ:

```bash
# Android・・ipmap PNGs・・
./scripts/sync-app-icons.sh --product VOICE_CLOCK /path/to/app/src/main/res/

# WPF
./scripts/sync-app-icons.sh --product IOSH /path/to/app/Resources/

# Expo
./scripts/sync-app-icons.sh --product CAMERA /path/to/app/assets/
```

## 豕ｨ諢丈ｺ矩・

- **繧ｽ繝ｼ繧ｹ繧ｪ繝悶ヨ繧･繝ｫ繝ｼ繧ｹ**: 蟶ｸ縺ｫ `brand/icons/generated/` 縺梧ｭ｣縲ゅい繝励Μ蛛ｴ縺ｧ迢ｬ閾ｪ縺ｫ繧｢繧､繧ｳ繝ｳ繧堤ｷｨ髮・＠縺ｦ縺ｯ縺・￠縺ｪ縺・
- **繧｢繧､繧ｳ繝ｳ螟画峩譎・*: 縺ｾ縺・insight-common 蛛ｴ縺ｧ `brand/icons/generated/` 繧呈峩譁ｰ縺励※縺九ｉ縺薙・繧ｳ繝槭Φ繝峨ｒ螳溯｡後☆繧・
- **繝悶Λ繝ｳ繝峨き繝ｩ繝ｼ**: Gold (#B8942F) 縺後・繝ｩ繧､繝槭Μ縲！vory (#FAF8F5) 縺瑚レ譎ｯ縺ｧ縺ゅｋ縺薙→
- **繝励ャ繧ｷ繝･隱崎ｨｼ**: 繧｢繝励Μ繝ｪ繝昴ず繝医Μ縺ｸ縺ｮ繝励ャ繧ｷ繝･縺ｫ縺ｯ GitHub PAT 縺悟ｿ・ｦ√↑蝣ｴ蜷医′縺ゅｋ
