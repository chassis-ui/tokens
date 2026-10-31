# @chassis-ui/tokens

The builder of design tokens of the [Chassis Design System](https://chassis-ui.com): the `chassis-tokens` command builds a repository of [Tokens Studio](https://tokens.studio) tokens with Style Dictionary into SCSS for the web, Swift and SwiftUI for iOS, and resources and Jetpack Compose for Android. The package holds no tokens.

## Your own tokens

Write a repository of tokens, with this package as a development dependency:

```sh
npx --package @chassis-ui/tokens chassis-tokens init acme-tokens --brand acme --app site:web mobile:ios,android
cd acme-tokens
npm install
npm run build
```

That writes a `package.json` with the build configuration, a few Tokens Studio files, a README and the workflows of CI and of a release. `chassis-tokens --help` lists the commands: `build`, `verify`, `diff`, `lint-source`, `swift-package` and `init`. See the [documentation](https://chassis-ui.com/tokens/docs/getting-started/introduction/).

## The tokens of the Chassis sites

These are a repository of tokens of their own, [chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens): the package [`@chassis-ui/website-tokens`](https://www.npmjs.com/package/@chassis-ui/website-tokens), the Swift package https://github.com/chassis-ui/website-tokens.git, and the Android libraries on [its releases](https://github.com/chassis-ui/website-tokens/releases). The `dist/` of this package before 0.13 moved there, with the same paths.

## Changes

[CHANGELOG.md](https://github.com/chassis-ui/tokens/blob/main/packages/tokens/CHANGELOG.md) lists every release and what each breaking change asks of an app.

## License

MIT
