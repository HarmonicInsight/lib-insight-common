# ============================================================
# Insight iOS プロジェクト Makefile
#
# Xcode GUI に頼らず、ターミナルから全操作を実行可能にする。
# XcodeGen + xcconfig + このファイルで Xcode 地獄を回避。
#
# 使い方:
#   make setup       — 初回セットアップ (XcodeGen インストール + 生成)
#   make generate    — .xcodeproj を再生成
#   make build       — シミュレータでリリースビルド
#   make clean       — DerivedData + ビルドキャッシュを完全削除
#   make bump-patch  — パッチバージョン +1 (1.0.0 → 1.0.1)
#   make bump-minor  — マイナーバージョン +1 (1.0.0 → 1.1.0)
#   make bump-major  — メジャーバージョン +1 (1.0.0 → 2.0.0)
#   make bump-build  — ビルド番号 +1
#
# __AppName__ を実際のスキーム名に置換してください。
# ============================================================

SCHEME = __AppName__
PROJECT = __AppName__.xcodeproj
DESTINATION = platform=iOS Simulator,name=iPhone 16 Pro,OS=18.0
CONFIG_DIR = Configuration

.PHONY: setup generate build build-release clean nuke bump-patch bump-minor bump-major bump-build open help

# --- セットアップ ---
setup:
	@which xcodegen > /dev/null || (echo "Installing XcodeGen..." && brew install xcodegen)
	@xcodegen generate
	@echo "✅ プロジェクト生成完了: $(PROJECT)"

# --- プロジェクト生成 ---
generate:
	@xcodegen generate
	@echo "✅ $(PROJECT) を再生成しました"

# --- ビルド ---
build: generate
	xcodebuild build \
		-project $(PROJECT) \
		-scheme $(SCHEME) \
		-destination "$(DESTINATION)" \
		-configuration Debug \
		CODE_SIGNING_ALLOWED=NO \
		| xcpretty

build-release: generate
	xcodebuild build \
		-project $(PROJECT) \
		-scheme $(SCHEME) \
		-destination "$(DESTINATION)" \
		-configuration Release \
		CODE_SIGNING_ALLOWED=NO \
		| xcpretty

# --- クリーン ---
clean:
	@echo "🧹 ビルドキャッシュを削除..."
	@rm -rf build/
	@xcodebuild clean -project $(PROJECT) -scheme $(SCHEME) 2>/dev/null || true
	@echo "✅ クリーン完了"

# DerivedData 含む完全クリーン（Xcode キャッシュ腐敗時に使用）
nuke:
	@echo "💣 DerivedData を完全削除..."
	@rm -rf ~/Library/Developer/Xcode/DerivedData/*$(SCHEME)*
	@rm -rf build/
	@rm -rf $(PROJECT)
	@echo "✅ 完全クリーン完了。make generate で再生成してください"

# --- Xcode で開く ---
open: generate
	@open $(PROJECT)

# --- バージョン管理 ---
# Base.xcconfig と project.yml の両方を同期更新

bump-patch:
	@$(call _bump_version,patch)

bump-minor:
	@$(call _bump_version,minor)

bump-major:
	@$(call _bump_version,major)

bump-build:
	@CURRENT=$$(grep 'CURRENT_PROJECT_VERSION' $(CONFIG_DIR)/Base.xcconfig | sed 's/.*= *//'); \
	NEW=$$((CURRENT + 1)); \
	sed -i '' "s/CURRENT_PROJECT_VERSION = .*/CURRENT_PROJECT_VERSION = $$NEW/" $(CONFIG_DIR)/Base.xcconfig; \
	sed -i '' "s/CURRENT_PROJECT_VERSION: .*/CURRENT_PROJECT_VERSION: $$NEW/" project.yml; \
	echo "✅ Build: $$CURRENT → $$NEW"

define _bump_version
	@CURRENT=$$(grep 'MARKETING_VERSION' $(CONFIG_DIR)/Base.xcconfig | sed 's/.*= *//'); \
	MAJOR=$$(echo $$CURRENT | cut -d. -f1); \
	MINOR=$$(echo $$CURRENT | cut -d. -f2); \
	PATCH=$$(echo $$CURRENT | cut -d. -f3); \
	case "$(1)" in \
		major) MAJOR=$$((MAJOR + 1)); MINOR=0; PATCH=0 ;; \
		minor) MINOR=$$((MINOR + 1)); PATCH=0 ;; \
		patch) PATCH=$$((PATCH + 1)) ;; \
	esac; \
	NEW="$$MAJOR.$$MINOR.$$PATCH"; \
	sed -i '' "s/MARKETING_VERSION = .*/MARKETING_VERSION = $$NEW/" $(CONFIG_DIR)/Base.xcconfig; \
	sed -i '' "s/MARKETING_VERSION: .*/MARKETING_VERSION: $$NEW/" project.yml; \
	BUILD=$$(grep 'CURRENT_PROJECT_VERSION' $(CONFIG_DIR)/Base.xcconfig | sed 's/.*= *//'); \
	NEW_BUILD=$$((BUILD + 1)); \
	sed -i '' "s/CURRENT_PROJECT_VERSION = .*/CURRENT_PROJECT_VERSION = $$NEW_BUILD/" $(CONFIG_DIR)/Base.xcconfig; \
	sed -i '' "s/CURRENT_PROJECT_VERSION: .*/CURRENT_PROJECT_VERSION: $$NEW_BUILD/" project.yml; \
	echo "✅ Version: $$CURRENT → $$NEW (Build: $$BUILD → $$NEW_BUILD)"
endef

# --- ヘルプ ---
help:
	@echo "利用可能なコマンド:"
	@echo "  make setup        — 初回セットアップ"
	@echo "  make generate     — .xcodeproj を再生成"
	@echo "  make build        — デバッグビルド（シミュレータ）"
	@echo "  make build-release — リリースビルド（シミュレータ）"
	@echo "  make clean        — ビルドキャッシュ削除"
	@echo "  make nuke         — DerivedData 完全削除（キャッシュ腐敗時）"
	@echo "  make open         — Xcode で開く"
	@echo "  make bump-patch   — パッチバージョン +1"
	@echo "  make bump-minor   — マイナーバージョン +1"
	@echo "  make bump-major   — メジャーバージョン +1"
	@echo "  make bump-build   — ビルド番号 +1"
