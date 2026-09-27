---
name: Bug report
about: A wrong value, a file that does not compile, or a build that fails
title: ''
labels: bug
assignees: ''
---

## What happened

<!-- The wrong value or the error. Include the exact error message or build output if there was one. -->

## What you expected

## Where

|                              |                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `@chassis-ui/tokens` version | <!-- e.g. 0.6.0 -->                                                                           |
| Platform                     | <!-- web, web-scss, web-px, web-vw, ios, ios-swiftui, android, android-compose -->            |
| App and brand                | <!-- e.g. docs / chassis -->                                                                  |
| File and token               | <!-- e.g. dist/android/demo/chassis/res/values/number.xml, font_context_jumbo_line_height --> |
| Toolchain                    | <!-- e.g. your Sass, Xcode or Android Gradle Plugin version -->                               |

## Reproduction

<!--
For a build problem, the command you ran (and your `chassis.build` configuration if you changed
it). For an output problem, the smallest snippet that uses the token and shows the problem.
-->

```sh
pnpm tokens --brand chassis --platform ios
```

## Anything else
