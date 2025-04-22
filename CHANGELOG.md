# [4.1.0](https://github.com/jaredLunde/masonic/compare/v4.0.1...v4.1.0) (2025-04-22)

### Features

- **use-positioner:** add maxColumnWidth property ([#178](https://github.com/jaredLunde/masonic/issues/178)) ([850e21a](https://github.com/jaredLunde/masonic/commit/850e21a857646241fed5e9c5fa7fcca0d11d75bc))

## [4.0.1](https://github.com/jaredLunde/masonic/compare/v4.0.0...v4.0.1) (2024-07-30)

### Bug Fixes

- update readme ([#166](https://github.com/jaredLunde/masonic/issues/166)) ([32d7c26](https://github.com/jaredLunde/masonic/commit/32d7c263ac327d293786d40d02d82b319ed0bc6d))

# [4.0.0](https://github.com/jaredLunde/masonic/compare/v3.7.0...v4.0.0) (2024-04-26)

### Bug Fixes

- ts/js is a joke of an ecosystem ([#160](https://github.com/jaredLunde/masonic/issues/160)) ([900bb10](https://github.com/jaredLunde/masonic/commit/900bb10fa0ebc8e4be0e02393a3949c70511016f))

### Features

- remove resize observer ponyfill ([#159](https://github.com/jaredLunde/masonic/issues/159)) ([494a10f](https://github.com/jaredLunde/masonic/commit/494a10f002a11ba81104c3877ee179f659f47c2b))

### BREAKING CHANGES

- removes the resize observer ponyfill.

Moving forward people will have to include their own global polyfill if they need one.

# [3.7.0](https://github.com/jaredLunde/masonic/compare/v3.6.5...v3.7.0) (2022-09-16)

### Features

- **use-positioner:** add maxColumnCount property ([#132](https://github.com/jaredLunde/masonic/issues/132)) ([dbec4ff](https://github.com/jaredLunde/masonic/commit/dbec4ff86e869b303d7648bebb3e28faa7adc7b3))

## [3.6.5](https://github.com/jaredLunde/masonic/compare/v3.6.4...v3.6.5) (2022-04-28)

### Bug Fixes

- **use-masonry:** should update when positioner changes ([#113](https://github.com/jaredLunde/masonic/issues/113)) ([55cc606](https://github.com/jaredLunde/masonic/commit/55cc6068c31386afdb82e679c9b8a9de7eb8d95c))

## [3.6.4](https://github.com/jaredLunde/masonic/compare/v3.6.3...v3.6.4) (2022-02-26)

### Bug Fixes

- **use-positioner:** column count calculation ([#108](https://github.com/jaredLunde/masonic/issues/108)) ([8d5343b](https://github.com/jaredLunde/masonic/commit/8d5343bf5b3fffc9f607102ecc42d3b735770c1e))

## [3.6.3](https://github.com/jaredLunde/masonic/compare/v3.6.2...v3.6.3) (2022-02-26)

### Bug Fixes

- **use-resize-observer:** resolve type conflict ([#100](https://github.com/jaredLunde/masonic/issues/100)) ([38b80bc](https://github.com/jaredLunde/masonic/commit/38b80bc9b9fc5017ee863bdb51578a456acbb416))

## [3.6.2](https://github.com/jaredLunde/masonic/compare/v3.6.1...v3.6.2) (2022-02-17)

### Bug Fixes

- should update elements' position's height after resized in a short duration ([#106](https://github.com/jaredLunde/masonic/issues/106)) ([4384dfb](https://github.com/jaredLunde/masonic/commit/4384dfb1739da79db351941c068e61d62cf2f84c))

## [3.6.1](https://github.com/jaredLunde/masonic/compare/v3.6.0...v3.6.1) (2021-10-23)

### Bug Fixes

- **use-scroller:** unsubscribe from updates when hook has unmounted ([#97](https://github.com/jaredLunde/masonic/issues/97)) ([2117625](https://github.com/jaredLunde/masonic/commit/2117625fb14b27b5f33a3a8121cbb83a62de5b5c))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.6.0](https://github.com/jaredLunde/masonic/compare/v3.5.0...v3.6.0) (2021-10-23)

### Features

- add rowGutter param ([0fbdd88](https://github.com/jaredLunde/masonic/commit/0fbdd889f99991aa212945ce35eb980942269e10))

## [3.5.0](https://github.com/jaredLunde/masonic/compare/v3.4.1...v3.5.0) (2021-10-14)

### Features

- positioner exposes `all` API ([7529eea](https://github.com/jaredLunde/masonic/commit/7529eea9db23aacbf3ae070dc089236f2e1caf48)), closes [#88](https://github.com/jaredLunde/masonic/issues/88)

### [3.4.1](https://github.com/jaredLunde/masonic/compare/v3.4.0...v3.4.1) (2021-02-26)

### Bug Fixes

- **use-masonry:** rename griditem to gridcell ([45a1e6b](https://github.com/jaredLunde/masonic/commit/45a1e6bd9883144b3e6b74a75f5c0ce2cc9633ad))

## [3.4.0](https://github.com/jaredLunde/masonic/compare/v3.3.10...v3.4.0) (2020-12-29)

### Features

- expose `createIntervalTree` ([e0c0a20](https://github.com/jaredLunde/masonic/commit/e0c0a208ae5054eb42cc813ccf96979693c9ae50))

### [3.3.10](https://github.com/jaredLunde/masonic/compare/v3.3.9...v3.3.10) (2020-09-11)

### Bug Fixes

- **use-masonry:** fix onRender type ([1f0af01](https://github.com/jaredLunde/masonic/commit/1f0af0141c055ab9dc86d37e1c8f25e993d17f99)), closes [#43](https://github.com/jaredLunde/masonic/issues/43)

### [3.3.9](https://github.com/jaredLunde/masonic/compare/v3.3.8...v3.3.9) (2020-09-11)

### Bug Fixes

- **use-positioner:** re-initialization in StrictMode ([ebe6b9c](https://github.com/jaredLunde/masonic/commit/ebe6b9cf164ef881fa4dc808df1142d679fe3ecc))

### [3.3.8](https://github.com/jaredLunde/masonic/compare/v3.3.7...v3.3.8) (2020-09-09)

### Bug Fixes

- **use-resize-observer:** fix ResizeObserver loop limit exceeded ([140883d](https://github.com/jaredLunde/masonic/commit/140883d7360a3f24b9aba251eb29575fdd2e8377)), closes [#39](https://github.com/jaredLunde/masonic/issues/39)

### [3.3.7](https://github.com/jaredLunde/masonic/compare/v3.3.6...v3.3.7) (2020-09-09)

### Bug Fixes

- **use-positioner:** re-initialize positioner instance before render ([fbaff55](https://github.com/jaredLunde/masonic/commit/fbaff55b29a1cddad5437d7f76f69a5213a5a452)), closes [#12](https://github.com/jaredLunde/masonic/issues/12)

### [3.3.6](https://github.com/jaredLunde/masonic/compare/v3.3.3...v3.3.6) (2020-09-09)

### [3.3.3](https://github.com/jaredLunde/masonic/compare/v3.3.2...v3.3.3) (2020-07-21)

### Bug Fixes

- **use-masonry:** fix "Cannot assign to readonly property" error ([49aad2f](https://github.com/jaredLunde/masonic/commit/49aad2f210b434dd3aec91fd320a007b21267df8)), closes [#31](https://github.com/jaredLunde/masonic/issues/31)

### [3.3.2](https://github.com/jaredLunde/masonic/compare/v3.3.1...v3.3.2) (2020-07-17)

### Bug Fixes

- **use-resize-observer:** fix height measurement in Chrome 84 ([ae40ece](https://github.com/jaredLunde/masonic/commit/ae40ecec906340b9fb17821acab471f5820091c1)), closes [#28](https://github.com/jaredLunde/masonic/issues/28)

### [3.3.1](https://github.com/jaredLunde/masonic/compare/v3.3.0...v3.3.1) (2020-07-04)

### Bug Fixes

- **masonry:** fix loop in scrollToIndex effect ([dae9984](https://github.com/jaredLunde/masonic/commit/dae99847fe29d7c9b50141f8035968143680b292))

## [3.3.0](https://github.com/jaredLunde/masonic/compare/v3.2.0...v3.3.0) (2020-07-04)

### Features

- **masonry:** add scrollToIndex ([8847c07](https://github.com/jaredLunde/masonic/commit/8847c074dd171fd2a53cc9fec2aae76e814e0aa2)), closes [#19](https://github.com/jaredLunde/masonic/issues/19)
- add generic typing to masonry components/hooks ([45e0380](https://github.com/jaredLunde/masonic/commit/45e0380f0b366c1729436fe6d7370ae3fd36fdf2))

### Bug Fixes

- **use-masonry:** add a descriptive error message when data is undefined ([b69f52f](https://github.com/jaredLunde/masonic/commit/b69f52f6821ac9cd95bfa6bf97a81a9efba008c2))
- **use-positioner:** fix positioner not clearing before DOM updates ([d599e62](https://github.com/jaredLunde/masonic/commit/d599e62b29f31153343c9a83c87134c5144ecb8d))

## 3.2.0 (2020-06-17)
