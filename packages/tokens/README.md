# @chassis-ui/tokens

The builder of design tokens of the [Chassis Design System](https://chassis-ui.com): the `chassis-tokens` command builds a repository of [Tokens Studio](https://tokens.studio) tokens with Style Dictionary into SCSS for the web, Swift and SwiftUI for iOS, and resources and Jetpack Compose for Android. The package holds the Chassis token system, which `chassis-tokens init` writes into a new repository of tokens.

## Your own tokens

Write a repository of tokens, with this package as a development dependency:

```sh
npx @chassis-ui/tokens init acme-tokens --brand acme --app site:web mobile:ios,android
cd acme-tokens
git init
npm install
npm run build
```

That writes a `package.json` with the build configuration, the token sets of the Chassis token system, a README and the workflows of CI and of a release. The token sets are the repository's from then on: no later version of this package writes over them. `chassis-tokens --help` lists the commands: `build`, `verify`, `diff`, `lint-source`, `swift-package`, `archive`, `release-notes` and `init`. See the [documentation](https://chassis-ui.com/tokens/docs/getting-started/introduction/).

## Changes

[CHANGELOG.md](https://github.com/chassis-ui/tokens/blob/main/packages/tokens/CHANGELOG.md) lists every release and what each breaking change asks of an app.

## License

MIT
