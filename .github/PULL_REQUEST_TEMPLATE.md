## Pull Request Checklist

- [ ] All commits are signed off with `Signed-off-by: Name <email>`
  - Every commit must include this line. See [Developer Certificate of Origin](https://developercertificate.org/)
  - CI will reject commits without this sign-off
- [ ] `npm test` passes (83/83)
- [ ] `npm run build` succeeds
- [ ] For new features: include tests covering the new behavior
- [ ] For bug fixes: include a test that would fail without the fix
- [ ] For UI changes: verify light and dark mode look correct at 320px

## Commit Message Convention

Prefix commits with one of:

| Prefix | Meaning |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructure, no behavior change |
| `test:` | Adding or updating tests |
| `docs:` | Documentation only |
| `chore:` | Build, deps, config, CI |
| `perf:` | Performance improvement |
| `i18n:` | Internationalization |

Example: `feat: add ⌘K command palette`
