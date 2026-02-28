# 開発マシン一覧

> 開発者が保有する物理マシンのスペック情報を管理するドキュメントです。

---

## マシン 1: ゲーミングノート（GPU 重視）

| 項目 | スペック |
|------|---------|
| **OS** | Windows 11 Home 64bit |
| **CPU** | Intel Core i7-11800H（2.30〜4.60GHz / 8コア16スレッド） |
| **GPU** | NVIDIA GeForce RTX 3060 6GB + Intel UHD Graphics |
| **メモリ** | 16GB DDR4 SO-DIMM（PC4-25600 / 8GB x 2 / 2チャネル） |
| **SSD** | 500GB NVMe SSD |
| **ディスプレイ** | 15.6インチ ナローベゼル 非光沢 Full HD（1920x1080）240Hz |
| **LAN** | 2.5Gb Ethernet x1 |
| **Bluetooth** | 5.1 |
| **カードリーダー** | SD（SDXC / SDHC） |
| **バッテリー** | リチウムイオン（約9.6時間） |
| **ACアダプタ** | 230W |
| **Office** | なし |
| **備考** | GPU 性能は高いが SSD 500GB が開発用途にはやや不足 |

---

## マシン 2: 汎用ノート（Office 付き）

| 項目 | スペック |
|------|---------|
| **OS** | Windows 11 Home 64bit |
| **CPU** | Intel Core i7-12700H（2.30〜4.70GHz / 14コア20スレッド） |
| **GPU** | NVIDIA GeForce RTX 3050 4GB GDDR6 + Intel Iris Xe Graphics |
| **メモリ** | 16GB DDR4 SO-DIMM（PC4-25600 / 8GB x 2 / 2チャネル） |
| **SSD** | 1TB Gen4 NVMe SSD（M.2 PCIe Gen4 x4） |
| **ディスプレイ** | 15.6インチ 非光沢 Full HD（1920x1080）60Hz |
| **LAN** | 2.5Gb Ethernet x1 |
| **無線LAN** | Intel Wi-Fi 6 AX201NGW（IEEE802.11 ax/ac/a/b/g/n / 2x2 / 最大2.4Gbps） |
| **Bluetooth** | 5.2 |
| **Webカメラ** | HD画質 / IR カメラ（Windows Hello 対応） |
| **カードリーダー** | SD（SD / SDHC / SDXC / UHS-I） |
| **サウンド** | 内蔵ステレオスピーカー / HD Sound / Sound Blaster Cinema 6+ |
| **バッテリー** | リチウムイオン（約5.4時間 JEITA 2.0） |
| **ACアダプタ** | 120W |
| **Office** | Microsoft Office Personal 2021（Word / Excel / Outlook） |
| **備考** | CPU は高性能だが RTX 3050 の VRAM 4GB は Stable Diffusion に不足 |

---

## 共通の課題

| 課題 | 詳細 |
|------|------|
| **携帯性** | 両機とも 15.6インチで重く、客先持ち運びに不向き |
| **メモリ** | 両機とも 16GB — 開発 + Stable Diffusion には不足気味 |
| **GPU (マシン1)** | RTX 3060 6GB — SD 1.5 は動くが SDXL は厳しい |
| **GPU (マシン2)** | RTX 3050 4GB — Stable Diffusion にはVRAM不足 |
| **SSD (マシン1)** | 500GB — 開発環境 + モデルファイルには容量不足 |
