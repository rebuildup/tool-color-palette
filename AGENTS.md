# AGENTS.md — `tool-color-palette`

このファイルは agent 横断の canonical project contract です。ほぼすべてのタスクに作用する不変条件だけを記載します。詳細な workflow は `docs/agents/` 配下の Skill、または root の `project-agent-init` Skill を参照してください。

## Project identity

- 目的: 親 monorepo (`my-web-2025`) に embed される standalone React 19 client tool。HSV / HSL / RGB / LAB color math と palette generator / exporter を提供する。
- 公開境界: `src/index.ts` (default export = `ColorPaletteApp`)。`src/lib/color.ts` 配下の pure 関数は外部から直接利用可。
- 想定 consumer: Next.js 16 app router の client component から `import ColorPaletteApp from "@rebuildup/tool-color-palette"` で利用される。
- embed 方法の詳細は親 monorepo の `my-web-2025` 仕様書を参照 (この repo 内では維持しない)。

## Source code policy

- language: 英語のみ (filename / identifier / comment / code docs / config identifier)。
- internal documentation: 日本語 (architecture / design / ADR / Skill / AGENTS.md)。
- Git / GitHub message: 英語 (`<prefix>: <title>` 形式)。

## Toolchain (canonical)

- package manager: Bun (`bun` / `bun run` / `bunx`)。
- runtime: Node.js / Bun runtime (browser で動作)。
- 主要 dependency: React 19.x, React DOM 19.x。
- peer dependency: Next.js 16.x。
- formatter + linter: Biome (`bunx @biomejs/biome`)。
- type-check: TypeScript (`bunx tsc --noEmit`)。
- unit test: Vitest + jsdom (`bun run test`)。
- coverage: `@vitest/coverage-v8`。

詳細と選択理由は `docs/adr/0001-tool-stack.md` を参照。

## Branch / worktree policy

- ユーザー明示指定がない限り local `main` のみで作業。
- feature branch / temporary branch / Git worktree を作成しない。
- 同一ファイルへの並行編集は禁止。所有権単位で分割するか phase を直列化する。
- subagent / team mechanism が worktree を必須とする場合は使用しない。worktree 不要の subagent mechanism を選択する。

## Validation entry point

実装タスクの完了前に以下を順に実行し、error / actionable warning を 0 にする:

```
bun run lint
bun run typecheck
bun run test
bun run build
```

`build` script が未定義の間は CI と同じ workflow 内の step を手動で実行する。CI workflow は `.github/workflows/ci.yml`。

## Design / approval gate

- 親 monorepo の embed 仕様に影響する変更 (公開 export shape、props shape、storage key 等) は、AGENTS.md と `docs/architecture.md` を更新した上で合意を得てから実装する。
- 公開 API 互換性を壊す変更は初期開発段階のため許容される (互換性 shim は残さない)。

## Mode / permission / trust

- 制限された mode / permission / authentication gate は正当な user gate として扱う。bypass を探さない。
- secret / credential は repository に保存しない。`.env.example` の schema のみ commit する。

## Skill discovery

- 詳細な workflow (debug / test / dep / UI verify / git workflow 等) は `docs/agents/*.md` を参照。
- root 側の Skill (`project-agent-init`) は再初期化専用。通常タスクでは参照しない。

## 参照順序

問題対応時は次の順で evidence を集める:

1. この `AGENTS.md`
2. `docs/architecture.md` / `docs/agents/*.md`
3. 親 monorepo (`my-web-2025`) の仕様 (embed 契約の確認)
4. installed dependency の型 / schema
5. official documentation (React 19 / Next.js 16 / Bun)
