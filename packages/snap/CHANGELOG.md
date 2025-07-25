# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0]

### Uncategorized

- chore: use typed sign v4 where appropriate ([#66](https://github.com/MetaMask/snap-institutional-wallet/pull/66))

## [1.3.2]

### Added

- chore: enable fireblocks sandboxes in prod mode, but hide ([#64](https://github.com/MetaMask/snap-institutional-wallet/pull/64))

## [1.3.1]

### Fixed

- Fix bugs with dev mode ([#62](https://github.com/MetaMask/snap-institutional-wallet/pull/62))

## [1.3.0]

### Added

- Add dev mode toggle to the homepage ([#59](https://github.com/MetaMask/snap-institutional-wallet/pull/59))- feat(dev-mode-toggle): allow users to toggle developer mode ([#59](https://github.com/MetaMask/snap-institutional-wallet/pull/59))

### Changed

- chore: show errors in the add token form ([#60](https://github.com/MetaMask/snap-institutional-wallet/pull/60))

## [1.2.1]

### Changed

- Add `authentication.getIsSupported` RPC method ([#57](https://github.com/MetaMask/snap-institutional-wallet/pull/57))

### Fixed

- Remove log in permissions.ts ([#56](https://github.com/MetaMask/snap-institutional-wallet/pull/56))

## [1.2.0]

### Changed

- Remove old hacky cronjob implementation ([#54](https://github.com/MetaMask/snap-institutional-wallet/pull/54))
- Implement "deep sleep" mechanism until the snap is used for the first time ([#54](https://github.com/MetaMask/snap-institutional-wallet/pull/54))
- Set `displayAccountNameSuggestion` to `false` ([#54](https://github.com/MetaMask/snap-institutional-wallet/pull/54))

## [1.1.1]

### Changed

- Move all dependencies to devdependencies and alphabetise ([#52](https://github.com/MetaMask/snap-institutional-wallet/pull/52))

## [1.1.0]

### Changed

- Enforce custodian API URL in production mode ([#49](https://github.com/MetaMask/snap-institutional-wallet/pull/49))
- Pin dependencies ([#48](https://github.com/MetaMask/snap-institutional-wallet/pull/48))

### Fixed

- Fix get signed message with cactus ([#50](https://github.com/MetaMask/snap-institutional-wallet/pull/50))

## [1.0.0]

### Changed

- Show account creation errors to the user ([#46](https://github.com/MetaMask/snap-institutional-wallet/pull/46))
- Explicitly check if a method is suppported for an account ([#45](https://github.com/MetaMask/snap-institutional-wallet/pull/45))
- Fix potential redos finding ([#44](https://github.com/MetaMask/snap-institutional-wallet/pull/44))
- Don't poll requests if the client is locked ([#43](https://github.com/MetaMask/snap-institutional-wallet/pull/43))
- Add waterballoons dev environments ([#39](https://github.com/MetaMask/snap-institutional-wallet/pull/39))
- Add tests for ECA-3 Custodian type ([#38](https://github.com/MetaMask/snap-institutional-wallet/pull/38))
- Audit remediation ([#37](https://github.com/MetaMask/snap-institutional-wallet/pull/37))
- Add tests for keyring.ts ([#36](https://github.com/MetaMask/snap-institutional-wallet/pull/36))

## [0.3.1]

### Changed

- Fix custodian permissions ([#34](https://github.com/MetaMask/snap-institutional-wallet/pull/34))

## [0.3.0]

### Changed

- chore: Adjust permissions and refactor checks to support bitgo ([#32](https://github.com/MetaMask/snap-institutional-wallet/pull/32))
- chore: Audit remediation ([#31](https://github.com/MetaMask/snap-institutional-wallet/pull/31))

## [0.2.10]

### Removed

- chore: remove saturn and neptune dev ([#29](https://github.com/MetaMask/snap-institutional-wallet/pull/29))

## [0.2.9]

### Changed

- chore: add zodia UI URLs to allowlist ([#27](https://github.com/MetaMask/snap-institutional-wallet/pull/27))

## [0.2.8]

### Changed

- Initial release

[Unreleased]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/MetaMask/snap-institutional-wallet/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/MetaMask/snap-institutional-wallet/compare/v0.3.1...v1.0.0
[0.3.1]: https://github.com/MetaMask/snap-institutional-wallet/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/MetaMask/snap-institutional-wallet/compare/v0.2.10...v0.3.0
[0.2.10]: https://github.com/MetaMask/snap-institutional-wallet/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/MetaMask/snap-institutional-wallet/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/MetaMask/snap-institutional-wallet/releases/tag/v0.2.8
