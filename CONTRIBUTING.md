# Contributing to Masonic

To contribute to this project, first:

- Fork this repo to your account
- `git clone https://github.com/[your-username]/masonic.git`
- `cd masonic`
- `yarn install`

## Before you contribute

Before you submit PRs to this repo I ask that you consider the following:
- Is this useful? That is, does it fix something that is broken? Does it add a feature that is a *real* need?
- Is this better implemented in user space or in its own package?
- Will this bloat the bundle size?

Before your PR will be considered I will look for:
- **Documentation** Please submit updates to the docs when public-facing APIs are changed.
- **Tests** Your PR will not be accepted if it doesn't have well-designed tests. Additionally, make sure
  that you run `yarn validate` before you submit your PR and make sure your PR passes the linting rules,
  type checking, and tests that already exist.
- **Types** Your types should be as strict as possible.
- **Comments** If your PR implements non-obvious logic, I fully expect you to explain the rationale in
  the form of code comments. I also expect you to update existing comments if the PR changes the behavior
  of existing code that could make those comments stale.



## Development

Here's what you need to know to start devleoping Masonic.

### Package scripts

#### `build`

Builds types, commonjs, and module distributions

#### `build-main`

Builds the commonjs distribution

#### `build-module`

Builds the module distribution

#### `build-types`

Builds the TypeScript type definitions

#### `check-types`

Runs a type check on the project using the local `tsconfig.json`

#### `format`

Formats all of the applicable source files with prettier as defined by `.prettierrc`

#### `lint`

Runs `eslint` on the package source

#### `prepublishOnly`

Runs before the package is published. This calls `lint`, `build`, `test`, and `format` scripts

#### `test`

Tests the package with `jest` as defined by options in `jest.config.js`

#### `validate`

Runs `check-types`, `lint`, `test`, and `format` scripts

--- 

### Husky hooks

#### `pre-commit`

Runs `lint-staged` and the `build-types` script

---

### Lint staged

Used for calling commands on git staged files that match a glob pattern

#### `**/*.{ts,tsx,js,jsx}`

Calls `eslint` and `prettier --write` to lint and format the staged files

#### `**/*.{md,yml,json,eslintrc,prettierrc}`

Calls `prettier --write` to format the staged files
