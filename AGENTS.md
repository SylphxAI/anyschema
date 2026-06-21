# Agent Instructions - AnySchema

Start with the upstream doctrine:

- Doctrine repo: <https://github.com/SylphxAI/doctrine>
- Local project identity: [PROJECT.md](./PROJECT.md)
- Machine manifest: [`.doctrine/project.json`](./.doctrine/project.json)

This repository owns the `@sylphx/anyschema` package and its adapter-based
schema validation, detection, type inference, and JSON Schema conversion
surfaces. Keep product-specific validation rules and consuming-project behavior
out of this package.

Use the repo scripts for validation:

```bash
bun install
bun run lint
bun run typecheck
bun test
bun run build
```
