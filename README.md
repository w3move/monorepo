# @w3move/monorepo

Yet another modern monorepo template.

This repository uses [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) to manage multiple packages within a single repository.

## Project Structure

The monorepo is organized into the following main directories:

-   `apps/`: Contains standalone applications.
-   `libs/`: Contains shared libraries used across different applications or other libraries.
-   `tools/`: Contains internal tooling used for development and maintenance.
-   `funcs/`: (Optional) Contains serverless functions or similar small units.
-   `servs/`: (Optional) Contains backend services.

## Prerequisites

Ensure you have the following installed:

-   Node.js: `v22.14.0`
-   npm: `v10.9.2`

You can use a Node version manager like [nvm](https://github.com/nvm-sh/nvm) to manage Node versions. If you have nvm installed, you can run `nvm use` in the project root to switch to the correct version (if an `.nvmrc` file is present or configured).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd monorepo
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Available Scripts

The following scripts are available at the root level:

-   `npm run build`: Builds all packages in the monorepo (uses `w3m build`).
-   `npm run lint`: Lints the codebase using ESLint and Prettier (uses `w3m lint`).
-   `npm run test`: Runs tests using Jest (uses `w3m test`).
-   `npm run typecheck`: Performs static type checking using TypeScript (uses `w3m typecheck`).
-   `npm run changeset:add`: Creates a new changeset file to document changes.
-   `npm run changeset:version`: Updates package versions and changelogs based on changesets.
-   `npm run changeset:publish`: Publishes packages to the registry based on changesets.

*Note: The `w3m` command seems to be a custom script or tool used internally.*

## Commit Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. Commit messages are linted using `commitlint` before each commit (via Husky hooks).

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on our branching strategy, code style, and pull request process.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
