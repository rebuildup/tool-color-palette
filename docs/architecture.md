# Architecture

このドキュメントは `@rebuildup/tool-color-palette` の現状 architecture を記述します。決定の履歴と理由は ADR (`docs/adr/`) を参照してください。

## 目的

親 monorepo (`my-web-2025`) に embed される standalone React 19 client tool。HSV / HSL / RGB / LAB color math と palette generator / exporter を提供する。

## レイヤ構成

```
src/
├── index.ts                       # public entry (re-export ColorPaletteApp)
├── ColorPaletteApp.tsx            # top-level client component
├── components/
│   ├── RawDOMContainer.tsx        # standalone shell (title + breadcrumbs)
│   ├── ColorPaletteGenerator.tsx  # generator (state owner)
│   ├── ColorPaletteControls.tsx   # settings panel
│   ├── GeneratedPalette.tsx       # output grid
│   ├── PaletteActions.tsx         # generate / save buttons
│   ├── PaletteExport.tsx          # export panel
│   ├── SavedPalettes.tsx          # saved list panel
│   ├── color-palette-types.ts     # shared types
│   ├── color-palette-constants.ts # presets, default settings
│   └── color-palette-utils.ts     # generation / export utilities
└── lib/
    └── color.ts                   # pure color math (testable, no React)
```

## 責務分離

- `lib/color.ts`: pure functions のみ。React 非依存。unit test で完全に検証可能。
- `components/*`: presentational / container component の混在。本 tool は小さく、React Context や外部 state library を導入しない。
- `ColorPaletteGenerator.tsx`: state owner。`localStorage` への save / load もここに集約 (storage key: `color-palettes-v2`)。

## データフロー

```
ColorPaletteGenerator (state owner)
 ├── settings ─────► ColorPaletteControls (controlled inputs)
 │                  PaletteExport (controlled format select)
 ├── generated ───► GeneratedPalette
 ├── saved ───────► SavedPalettes
 ├── notification ► GeneratedPalette (inline toast)
 └── onCopy ──────► GeneratedPalette / PaletteExport
```

すべての状態は `ColorPaletteGenerator` に閉じる。lifting は行わない。複雑化した段階で Context 化を再評価する。

## 外部依存

- React 19.x (required dependency)
- React DOM 19.x (required dependency)
- Next.js 16.x (peer dependency; embed 時に親が供給)

`next` を直接 import しない。`"use client"` directive のみで Next.js 統合を表現する。

## embed 契約

- default export = `ColorPaletteApp` (client component)。
- 親 monorepo は `RawDOMContainer` を shadow または独自の shell に置換可能 (本 tool 内の `RawDOMContainer` は standalone fallback)。
- storage key `color-palettes-v2` は本 tool の専有として扱う。衝突時は prefix を変更する。

## テスト方針

- `lib/color.ts` は pure function のため unit test で完全に検証する。
- React component は初期段階では snapshot / render test を追加しない。挙動の変更が必要な段階で testing-library 化を再評価する。
- coverage threshold は lines / statements / functions / branches すべて 80%。

## 関連ドキュメント

- `docs/adr/0001-tool-stack.md` — toolchain 採否の根拠
- `AGENTS.md` — agent 横断 canonical contract
