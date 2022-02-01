# metricq-webview

Graphing interface for MetricQ

## Development

### Installation

Update your global yarn installation (we need support for project-based yarn)

````shell
npm install -g yarn
````

We have some dependencies in the GitHub registry, so you need a personal access token with at least `read:packages` permission. Add this with the following config to your `~/.yarnrc.yml`:

```yaml
npmRegistries:
  //npm.pkg.github.com:
    npmAuthToken: <your_token>
```

Then the build system and the dependencies can be installed

```shell
yarn install
```

### dev server

Use the automatically reloading dev server during development

```shell
yarn serve
```

#### override backend URL and authentication while developing

You can create a `.env.development.local` file in the repository root to override the MetricQ backend url and authentication. This file is ignored by git and should never be committed.

```shell
VUE_APP_METRICQ_BACKEND=https://metricq-grafana/
VUE_APP_METRICQ_BACKEND_AUTH=user:pass
```

### code style

We use [standardJS](https://standardjs.com), but since we need some global variables, the linter should be called like this:

```shell
yarn lint [--fix]
```

### build for production

You can build the production version yourself download it as GitHub Actions artifacts

```shell
yarn build
```

Move the dist folder content respectively the artifact content to your web server and make it available at `/webview`.
