---
'@chassis-ui/tokens': patch
---

Add the `--clean` option to the build. The build writes files but deletes none, so a file it no longer writes, such as the number file of a removed screen or the image set of a removed icon, stayed in `dist/`. `pnpm tokens --clean` deletes `dist/<platform>/<app>/<brand>/` of each selected brand, app and platform before building, and `--dry-run` lists those directories. It fails with `--theme` or `--screen`, which rebuild only some files of a directory. The files of the package do not change.
