# Release Process

## Versioning
- Use semantic versioning: `MAJOR.MINOR.PATCH`.
- Bump `MAJOR` for breaking changes.
- Bump `MINOR` for new features.
- Bump `PATCH` for fixes.

## Release Steps
1. Ensure `npm run test` and `npm run lint` pass.
2. Update `docs/changelog.md`.
3. Tag the release in git.
4. Produce build artifacts via `npm run build`.

## Rollback
- Revert the release tag.
- Roll back the last release commit.
- Rebuild and repackage.
