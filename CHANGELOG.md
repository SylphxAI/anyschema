# Changelog

## 0.2.0 (2025-12-01)

### ✨ Features

- **adapter:** split adapters into validator and transformer for tree-shaking ([8c76b14](https://github.com/SylphxAI/anyschema/commit/8c76b14ff7bde2e24644808605092d5626c7da20))
- **adapter:** add type-safe plugin architecture with factory functions ([e1bf4f4](https://github.com/SylphxAI/anyschema/commit/e1bf4f45e47f3db21a5856674bf6803825113eb4))
- **adapter:** add plugin-based adapter system for schema libraries ([4483182](https://github.com/SylphxAI/anyschema/commit/4483182f160a1b7195cea652b2350ce4bff1c788))

### 🐛 Bug Fixes

- prevent bundling of schema libraries + simplify validators ([2da20df](https://github.com/SylphxAI/anyschema/commit/2da20df0d9a15d18c42b59b9742b1d4a1cee93cc))
- **zod:** properly support Zod v4 JSON Schema conversion ([7611c79](https://github.com/SylphxAI/anyschema/commit/7611c79109f5605439d5efd51857a5dc3116c442))
- **zod:** support getMetadata for Zod v4 schemas ([c6e3fa9](https://github.com/SylphxAI/anyschema/commit/c6e3fa9f3c0d36cb84ecb8e3fe0511b54a16a260))

### ♻️ Refactoring

- remove deprecated full adapters and simplify codebase ([fd32b50](https://github.com/SylphxAI/anyschema/commit/fd32b5023fcb3016679c5e704c24cab49be77afc))
- 💥 **adapter:** remove auto-registration for tree-shaking ([cf72085](https://github.com/SylphxAI/anyschema/commit/cf72085dd1505bc7b95d7d477a382e9e0c72d99f))
- **adapter:** split factory into separate files for tree-shaking ([b9912e6](https://github.com/SylphxAI/anyschema/commit/b9912e647e642ce4a597e91756c22b179a34e7e2))
- remove unused arkTypeToJsonSchema (ArkType has native method) ([f5e4b42](https://github.com/SylphxAI/anyschema/commit/f5e4b4252bc7433097ae9ad287d4164632841214))
- unify validation under adapter-only architecture ([5d79501](https://github.com/SylphxAI/anyschema/commit/5d795016f97f2aef3ba4ff9ff220a9d4908b27f0))
- remove all external imports, use pure duck typing ([fe8998c](https://github.com/SylphxAI/anyschema/commit/fe8998c3fb745fa78579de65a968ab036a84e923))
- blind-call first pattern for maximum efficiency ([d7f9b98](https://github.com/SylphxAI/anyschema/commit/d7f9b98acd0783bd29fdb6aa3a43769148098151))

### ✅ Tests

- add comprehensive integration tests for all schema libraries ([a52c8f0](https://github.com/SylphxAI/anyschema/commit/a52c8f0b67334190183044d1f6b3b14cfb7f2ea8))

### 📦 Build

- remove CJS, ESM only ([95b02a2](https://github.com/SylphxAI/anyschema/commit/95b02a2410b6f4cda83181f105efd72209b8f392))

### 🔧 Chores

- remove temp meta.json file ([5158f9b](https://github.com/SylphxAI/anyschema/commit/5158f9b2fa03ca7d977487404b9eceadd6963424))

### 💥 Breaking Changes

- **adapter:** remove auto-registration for tree-shaking ([cf72085](https://github.com/SylphxAI/anyschema/commit/cf72085dd1505bc7b95d7d477a382e9e0c72d99f))
  Adapters are no longer auto-registered.

## 0.1.4 (2025-11-30)

### 🐛 Bug Fixes

- **zod:** use static z.toJSONSchema() from zod/v4 instead of instance method ([39327a2](https://github.com/SylphxAI/anyschema/commit/39327a214871a5b4f208deed65d8aac87d1bf048))

## 0.1.3 (2025-11-30)

### 🐛 Bug Fixes

- use Zod 4 native toJSONSchema() with fallback to zod-to-json-schema for Zod 3 ([4c2c293](https://github.com/SylphxAI/anyschema/commit/4c2c2939b51fe085b471e16a600ed23a0bc05b05))

## 0.1.2 (2025-11-30)

### 🐛 Bug Fixes

- ensure dist files are included in publish ([55463ec](https://github.com/SylphxAI/anyschema/commit/55463ec6661558e5a67d537043d5adc415e16de8))

### 🔧 Chores

- bump @sylphx/bump to 1.4.11 ([fc8225b](https://github.com/SylphxAI/anyschema/commit/fc8225b48189ec4031c20732f98adf6b61933d80))

## 0.1.1 (2025-11-30)

### 🐛 Bug Fixes

- add packageManager field for correct bun detection ([6bd804e](https://github.com/SylphxAI/anyschema/commit/6bd804e0af9fcfea4d734b9b16213c901890cd58))

## 0.1.0 (2025-11-30)

### 🐛 Bug Fixes

- rename to @sylphx/anyschema, reset to 0.1.0 ([0a329fa](https://github.com/SylphxAI/anyschema/commit/0a329fab5b000eaa4d12444dd4507357c4154bb5))
- **ci:** restore shared workflow, add prepack for build ([0efa746](https://github.com/SylphxAI/anyschema/commit/0efa7462f012a90c1ef25db1cb5d1832d6b6c22c))

### 🔧 Chores

- retry with bump@1.4.9 ([36ed4c6](https://github.com/SylphxAI/anyschema/commit/36ed4c69a3368d36d4efb616bb9e3002d26093fa))
- re-trigger with bump@1.4.8 ([e24677a](https://github.com/SylphxAI/anyschema/commit/e24677a63dffdc8f9140be9cb4b16caa62291da0))
- bump @sylphx/bump to 1.4.6 ([6bebae4](https://github.com/SylphxAI/anyschema/commit/6bebae4d836a15e47170a010b2e5ba1b55a5f947))
- regenerate bun.lock ([f80e9bf](https://github.com/SylphxAI/anyschema/commit/f80e9bf7ddb11110fefefa61de86a1431da2433f))

## 0.1.0 (2025-11-30)

### 🐛 Bug Fixes

- rename to @sylphx/anyschema, reset to 0.1.0 ([0a329fa](https://github.com/SylphxAI/anyschema/commit/0a329fab5b000eaa4d12444dd4507357c4154bb5))
- **ci:** restore shared workflow, add prepack for build ([0efa746](https://github.com/SylphxAI/anyschema/commit/0efa7462f012a90c1ef25db1cb5d1832d6b6c22c))

### 🔧 Chores

- re-trigger with bump@1.4.8 ([e24677a](https://github.com/SylphxAI/anyschema/commit/e24677a63dffdc8f9140be9cb4b16caa62291da0))
- bump @sylphx/bump to 1.4.6 ([6bebae4](https://github.com/SylphxAI/anyschema/commit/6bebae4d836a15e47170a010b2e5ba1b55a5f947))
- regenerate bun.lock ([f80e9bf](https://github.com/SylphxAI/anyschema/commit/f80e9bf7ddb11110fefefa61de86a1431da2433f))

## 0.1.0 (2025-11-30)

### 🐛 Bug Fixes

- rename to @sylphx/anyschema, reset to 0.1.0 ([0a329fa](https://github.com/SylphxAI/anyschema/commit/0a329fab5b000eaa4d12444dd4507357c4154bb5))
- **ci:** restore shared workflow, add prepack for build ([0efa746](https://github.com/SylphxAI/anyschema/commit/0efa7462f012a90c1ef25db1cb5d1832d6b6c22c))

### 🔧 Chores

- bump @sylphx/bump to 1.4.6 ([6bebae4](https://github.com/SylphxAI/anyschema/commit/6bebae4d836a15e47170a010b2e5ba1b55a5f947))
- regenerate bun.lock ([f80e9bf](https://github.com/SylphxAI/anyschema/commit/f80e9bf7ddb11110fefefa61de86a1431da2433f))

## 0.1.0 (2025-11-30)

### 🐛 Bug Fixes

- rename to @sylphx/anyschema, reset to 0.1.0 ([0a329fa](https://github.com/SylphxAI/anyschema/commit/0a329fab5b000eaa4d12444dd4507357c4154bb5))
- **ci:** restore shared workflow, add prepack for build ([0efa746](https://github.com/SylphxAI/anyschema/commit/0efa7462f012a90c1ef25db1cb5d1832d6b6c22c))

### 🔧 Chores

- regenerate bun.lock ([f80e9bf](https://github.com/SylphxAI/anyschema/commit/f80e9bf7ddb11110fefefa61de86a1431da2433f))

## 0.1.0 (2025-11-30)

### 🐛 Bug Fixes

- rename to @sylphx/anyschema, reset to 0.1.0 ([0a329fa](https://github.com/SylphxAI/anyschema/commit/0a329fab5b000eaa4d12444dd4507357c4154bb5))
- **ci:** restore shared workflow, add prepack for build ([0efa746](https://github.com/SylphxAI/anyschema/commit/0efa7462f012a90c1ef25db1cb5d1832d6b6c22c))

## 0.4.0 (2025-11-30)

### ✨ Features

- 💥 zero dependencies with pure structural typing ([57cc765](https://github.com/SylphxAI/anyschema/commit/57cc765aef6af83e5337908a50969ba0804b39c8))
- 💥 rebrand to AnySchema with universal schema utilities ([146cefa](https://github.com/SylphxAI/anyschema/commit/146cefa12e726064b69f4af317282b956d9f573a))
- initial implementation of standard-schema-to-json ([b4d8e90](https://github.com/SylphxAI/anyschema/commit/b4d8e90b5c7067c168f4e5ce5409a5af35c6ae81))

### 🐛 Bug Fixes

- **ci:** add git identity for bump commit step ([887a0e8](https://github.com/SylphxAI/anyschema/commit/887a0e8bddf97a68ff940ef775e1d7344c7ff439))
- **ci:** use local release workflow with proper bun setup ([5f1ed65](https://github.com/SylphxAI/anyschema/commit/5f1ed6592883650d4a33f2161cc4cd7ecd9aceca))

### ♻️ Refactoring

- complete rewrite with duck typing and zero dependencies ([28576c6](https://github.com/SylphxAI/anyschema/commit/28576c6f971404014e0ce0c7469be77b79710853))
- improve tree-shaking for async API ([d9a701b](https://github.com/SylphxAI/anyschema/commit/d9a701b6728c34395f0d82afa64409cce4e4da87))

### ✅ Tests

- add comprehensive test suite for all libraries ([9df900c](https://github.com/SylphxAI/anyschema/commit/9df900c2f66b914267ded8014442be95f84b7460))

### 🔧 Chores

- setup @sylphx/doctor tooling and standards ([e890561](https://github.com/SylphxAI/anyschema/commit/e890561489bbae722aedbd3fe9dd1f564b314db0))

### 💥 Breaking Changes

- zero dependencies with pure structural typing ([57cc765](https://github.com/SylphxAI/anyschema/commit/57cc765aef6af83e5337908a50969ba0804b39c8))
  Complete architecture rewrite
- rebrand to AnySchema with universal schema utilities ([146cefa](https://github.com/SylphxAI/anyschema/commit/146cefa12e726064b69f4af317282b956d9f573a))
  Package renamed from standard-schema-to-json to anyschema

## 0.3.0 (2025-11-30)

### ✨ Features

- 💥 zero dependencies with pure structural typing ([57cc765](https://github.com/SylphxAI/anyschema/commit/57cc765aef6af83e5337908a50969ba0804b39c8))
- 💥 rebrand to AnySchema with universal schema utilities ([146cefa](https://github.com/SylphxAI/anyschema/commit/146cefa12e726064b69f4af317282b956d9f573a))
- initial implementation of standard-schema-to-json ([b4d8e90](https://github.com/SylphxAI/anyschema/commit/b4d8e90b5c7067c168f4e5ce5409a5af35c6ae81))

### ♻️ Refactoring

- complete rewrite with duck typing and zero dependencies ([28576c6](https://github.com/SylphxAI/anyschema/commit/28576c6f971404014e0ce0c7469be77b79710853))
- improve tree-shaking for async API ([d9a701b](https://github.com/SylphxAI/anyschema/commit/d9a701b6728c34395f0d82afa64409cce4e4da87))

### ✅ Tests

- add comprehensive test suite for all libraries ([9df900c](https://github.com/SylphxAI/anyschema/commit/9df900c2f66b914267ded8014442be95f84b7460))

### 🔧 Chores

- setup @sylphx/doctor tooling and standards ([e890561](https://github.com/SylphxAI/anyschema/commit/e890561489bbae722aedbd3fe9dd1f564b314db0))

### 💥 Breaking Changes

- zero dependencies with pure structural typing ([57cc765](https://github.com/SylphxAI/anyschema/commit/57cc765aef6af83e5337908a50969ba0804b39c8))
  Complete architecture rewrite
- rebrand to AnySchema with universal schema utilities ([146cefa](https://github.com/SylphxAI/anyschema/commit/146cefa12e726064b69f4af317282b956d9f573a))
  Package renamed from standard-schema-to-json to anyschema
