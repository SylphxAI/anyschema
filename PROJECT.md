# AnySchema

AnySchema is the foundation TypeScript package for universal schema utilities
across common schema libraries. It provides zero-runtime-dependency validation,
parsing, type guards, vendor detection, protocol types, adapter factories, and
JSON Schema conversion through public package exports.

## Lifecycle

- State: `production`
- Layer: `foundation`
- Machine manifest: [`.doctrine/project.json`](./.doctrine/project.json)

## Goals

- Normalize validation, detection, type inference, and JSON Schema conversion
  across supported schema libraries.
- Keep integrations adapter-based and structurally typed so consumers can bring
  their own schema library versions.
- Preserve stable package exports for core helpers, adapter factories, built-in
  adapters, detection utilities, and protocol types.

## Non-Goals

- Owning application-specific schemas, product validation rules, forms, HTTP
  contracts, persistence models, or runtime workflows.
- Reimplementing upstream schema libraries.
- Adding consumer-specific behavior to the package core.

## Boundary

AnySchema owns the package API and adapter system in this repository. Consumers
use it through npm package exports only. Product-specific behavior belongs in
the consuming product, an integration adapter, or consumer configuration.

## Public Surfaces

- `@sylphx/anyschema`
- `@sylphx/anyschema/adapter`
- `@sylphx/anyschema/adapter/*`
- [README.md](./README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

## Delivery

CI runs lint, typecheck, tests, build, and ADR-29 admission/recovery jobs.
Branch protection currently requires the raw `ci` context. Pushes to `main`
run the release workflow, which calls the shared Sylphx release workflow and
publishes the npm package. Production proof is a successful GitHub Release
workflow on `main` plus npm readback for `@sylphx/anyschema`.
