# Contributing to @w3move/monorepo

Thank you for considering contributing to this project! We welcome contributions from the community. Please take a moment to review this document to understand our contribution process.

## Branching Strategy (Gitflow)

This project uses a Gitflow-based branching model.

-   **`main`**: Represents the latest stable release. **Direct pushes to `main` are prohibited.**
-   **`develop`**: Represents the latest development changes for the next release. This is the primary integration branch. **Direct pushes to `develop` are prohibited.**

### Branch Types

-   **`feature/*`**: For developing new features. Branched off `develop`. Merged back into `develop` via Pull Request.
    -   Example: `feature/add-user-authentication`
-   **`bugfix/*`**: For fixing non-critical bugs in `develop`. Branched off `develop`. Merged back into `develop` via Pull Request.
    -   Example: `bugfix/fix-login-validation`
-   **`release/*`**: For preparing a new production release. Branched off `develop`. Merged into `main` (tagged) and back into `develop`.
    -   Example: `release/v1.2.0`
-   **`hotfix/*`**: For fixing critical bugs in `main`. Branched off `main`. Merged into `main` (tagged) and back into `develop`.
    -   Example: `hotfix/security-vulnerability-patch`

**Important:** All changes must be submitted via Pull Requests (PRs) targeting the `develop` branch (or `main` for hotfixes). Direct pushes to `main` and `develop` are disabled.

## Commit Messages

All commit messages must adhere to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This is enforced by `commitlint` via Git hooks.

A typical commit message looks like:

```
feat(auth): add password reset functionality

Implement the complete password reset flow, including email sending and token verification.
```

## Code Style

This project uses ESLint and Prettier to enforce consistent code style. Please ensure your code adheres to the established style by running:

```bash
npm run lint
```

Ideally, configure your editor to format code on save using the project's Prettier configuration.

## Testing

All contributions should include relevant tests. Ensure all tests pass before submitting a Pull Request:

```bash
npm run test
```

## Changesets

For any changes that affect package consumers (e.g., new features, bug fixes, performance improvements in libraries or applications), you must include a changeset. Add a changeset by running:

```bash
npm run changeset:add
```

Follow the prompts to document your changes. Commit the generated changeset file along with your code changes.

## Pull Request Process

1.  Fork the repository and create your branch from `develop` (e.g., `git checkout -b feature/my-new-feature develop`).
2.  Make your changes, adhering to the commit message and code style guidelines.
3.  Include tests for your changes.
4.  Ensure all tests pass (`npm run test`) and the code is linted (`npm run lint`).
5.  If your changes require it, add a changeset (`npm run changeset:add`).
6.  Push your branch to your fork (`git push origin feature/my-new-feature`).
7.  Open a Pull Request targeting the `develop` branch of the main repository.
8.  Ensure all automated checks (CI/CD, linting, testing) pass on your PR.
9.  Collaborate with reviewers to address any feedback.
10. Once approved and checks pass, your PR will be merged.

Thank you for your contribution!
