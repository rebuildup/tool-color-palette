# ADR 0001: tool stack and toolchain

## Status

Accepted

## 調査日

2026-08-29

## Context

`@rebuildup/tool-color-palette` は親 monorepo (`my-web-2025`) から extract されたばかりの standalone React 19 client tool である。直近の commit (`5df9351 feat: extract color-palette source from my-web-2025`) で source が移管され、現状は:

- `package.json`: `main` / `types` / `exports` のみ。`scripts` 未定義。`devDependencies` なし。
- `tsconfig.json`: 未定義。
- linter / formatter: 未導入。
- test runner: 未導入。
- CI: 未定義。
- `.env.example`: 未存在。
- `.gitignore`: 最低限の rule のみ。

source 自体に `../../../../external/ui/src/RawDOMContainer` という monorepo 外参照が残っており、standalone build では解決できない (この ADR と並行して local `RawDOMContainer` に置換した)。

## 解決したい capability

1. TypeScript の型検査 (strict)。
2. formatter + linter の single tool 化。
3. pure color math (`src/lib/color.ts`) の unit test。
4. CI での quality gate。
5. project-local で完結する再現性。

## Decision

### Package manager: Bun (lockfile 既設)

- 選択理由: 既設の `bun.lock` との整合、lockfile 単一化、`bunx` 経由の CLI 統一、install 速度。
- 不採用: npm / pnpm / Yarn — 既存 lockfile との二重管理を避けるため導入しない。

### Formatter + linter: Biome 2.5.x

- 選択理由: formatter / linter の single binary / single config。ESLint + Prettier の二重設定より高速で rule 衝突がない。`recommended` プリセットが React / TS の standard 規則を包含する。
- 不採用: ESLint + Prettier — rule 衝突と config 二重化コストが高い。dprint — formatter のみで linter 機能不足。

### Type-check: TypeScript 7.0.x

- 選択理由: React 19 / Next.js 16 を含む toolchain の official language。`tsc --noEmit` のみで完結。
- strict + `noUncheckedIndexedAccess` を有効化し、未定義アクセスを build 時に検出する。

### Unit test: Vitest 4.x + jsdom 30.x

- 選択理由: ESM native、TypeScript 統合、`expect` API が Jest と互換、coverage が V8 provider で 1 コマンド完結。
- 環境: `jsdom` を選択。color math は DOM を必要としないが、`ColorPaletteApp` 側の React component test 拡張時に追加コストなく移行できる。
- 不採用: Jest — Bun runtime / ESM / TypeScript 統合に追加設定が必要。

### Coverage: `@vitest/coverage-v8` 4.x

- 選択理由: Vitest 同梱の V8 provider、external dependency 不要。
- threshold: lines / statements / functions / branches すべて 80% (project policy 準拠)。
- 適用 scope: `src/lib/**` および `src/components/color-palette-utils.ts` (pure な domain logic)。
- **deferred**: React component 群 (`src/components/*.tsx`、`src/ColorPaletteApp.tsx`) は Testing Library 未導入のため coverage 計測から除外。coverage 計測からの除外は「threshold を下げる / 難しい file を除外する」目的ではなく、test stack の制約 (Testing Library 未追加) を反映したもの。Testing Library を導入する follow-up で threshold を global に昇格する。

### Dependency / static analysis: Knip 6.x

- 選択理由: unused export / unused file / unused dependency / missing dependency を一括検出する single binary。policy の「適用可能なら Knip」要件に対応する。
- 不採用: depcheck — unused dependency のみで export / file 解析が浅い。ts-prune — export のみ。
- 設定上の判断: `react-dom` と `@types/react-dom` は runtime / types で間接的に必要だが直接 import されないため `ignoreDependencies` で除外。`ignoreExportsUsedInFile` で同一ファイル内 type 参照を unused 扱いしないようにする。

### CI: GitHub Actions

- 選択理由: 親 monorepo も GitHub 上にあり、Secrets / workflow 設定を共通化できる。
- 実行内容: `bun install` → `bun run format:check` → `bun run lint` → `bun run typecheck` → `bun run knip` → `bun run coverage`。
- coverage report は artifact として upload する (blocking はしない)。

### Container / IaC

- 該当なし。本 tool は library であり、container / IaC を必要としない。

## Alternatives considered

- **Biome 単体 + dprint lint**: Biome のみで lint を賄えるため不要。
- **Vitest + happy-dom**: jsdom より軽量だが、`localStorage` 系 API 互換が jsdom より弱い。本 tool の `localStorage` 利用 (`color-palettes-v2`) を見据えて jsdom を選択。
- **pnpm / npm**: lockfile 統一と Bun 採用方針と相反。
- **Jest + ts-jest**: 設定コストが高く、Vitest の Bun runtime 親和性を活かせない。

## Re-evaluation conditions

- React 20 への移行時: 19 系の deprecated API を確認し、tsconfig の `lib` と `jsx` を見直す。
- Next.js 17 への移行時: peer dependency と embed 契約を見直す。
- React component test を追加する段階: `@testing-library/react` + `user-event` を導入し、`vitest.config.ts` の `coverage.exclude` から component path を削除して threshold を global に昇格する。
- 依存が 10 を超えた場合: Knip の ignore 設定を見直し、bundler resolution 起因の誤検知を抑制する。

## 初期化時点で実施した追加 repair

- `src/components/ColorPaletteGenerator.tsx` の `../../../../external/ui/src/RawDOMContainer` import (親 monorepo 外参照で standalone build が壊れる) を同階層の `RawDOMContainer.tsx` に置換。新規 `RawDOMContainer.tsx` は standalone 用の shell fallback として実装 (parent embed 時は親が shadow する想定)。
- `src/lib/color.ts` の dead code (`_hslToRgb` / `_rgbToLab` / `_hexToRgb` / `_clampColor` / `_deltaE`、prefix `_` で unused のまま残存) を削除。
- `getLuminance` を `noUncheckedIndexedAccess` 互換に refactor (destructure から named variable へ)。
- `RawDOMContainer` の React key を `${crumb.label}-${index}` から `crumb.label` に修正 (Biome `useKeyWithClickHandlers` 系 rule を満たすため)。
