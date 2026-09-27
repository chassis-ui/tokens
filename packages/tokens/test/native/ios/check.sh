#!/usr/bin/env bash
#
# Compiles the iOS output against the iOS simulator SDK of Xcode. The command line tools
# alone have no iOS SDK and no asset compiler, so this needs Xcode; CI runs it on a macOS
# runner.
#
#   test/native/ios/check.sh [swift] [assets] [package]
#
#   swift    Type-checks the Swift files of every output folder under dist/ and
#            test/golden/, each folder as one module, in the Swift 5 and the Swift 6
#            language mode.
#   assets   Compiles every asset catalog with actool and checks that the compiled catalog
#            holds every image set.
#   package  Reads the Package.swift at the root of the repository and builds the sample
#            in test/native/ios/sample/, which depends on its libraries and reads their
#            tokens, for the iOS simulator.
#
# Without arguments it runs all three. It writes to a temporary folder only.

set -euo pipefail

package_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
repository_root="$(cd "$package_root/../.." && pwd)"
sample="$package_root/test/native/ios/sample"

sdk_name=iphonesimulator
# The deployment target of Package.swift
deployment_target=13.0
target="arm64-apple-ios$deployment_target-simulator"
language_modes=(5 6)

fail() {
  echo "error: $*" >&2
  exit 1
}

if ! sdk_path="$(xcrun --sdk "$sdk_name" --show-sdk-path 2>/dev/null)"; then
  fail "no $sdk_name SDK: install Xcode and select it with xcode-select"
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cd "$package_root"

# Folders of dist/ and test/golden/ that hold files with the given name pattern
folders_with() {
  find dist test/golden -name "$1" -exec dirname {} \; | sort -u
}

check_swift() {
  local folders folder mode count
  folders="$(folders_with '*.swift')"
  [ -n "$folders" ] || fail 'no Swift files in dist/ or test/golden/'

  while IFS= read -r folder; do
    count="$(find "$folder" -maxdepth 1 -name '*.swift' | wc -l | tr -d ' ')"
    for mode in "${language_modes[@]}"; do
      echo "swift: $folder ($count files, Swift $mode)"
      xcrun --sdk "$sdk_name" swiftc -typecheck -parse-as-library \
        -module-name ChassisTokens -sdk "$sdk_path" -target "$target" \
        -swift-version "$mode" "$folder"/*.swift
    done
  done <<<"$folders"
}

check_assets() {
  local catalogs catalog output info image_set name index=0
  catalogs="$(find dist test/golden -type d -name '*.xcassets' | sort)"
  [ -n "$catalogs" ] || fail 'no asset catalog in dist/ or test/golden/'

  while IFS= read -r catalog; do
    index=$((index + 1))
    output="$work/assets-$index"
    mkdir -p "$output"
    echo "assets: $catalog"
    xcrun actool "$catalog" --compile "$output" --platform "$sdk_name" \
      --minimum-deployment-target "$deployment_target" \
      --output-format human-readable-text --errors --warnings

    [ -f "$output/Assets.car" ] || fail "$catalog: actool wrote no Assets.car"
    info="$(xcrun --sdk "$sdk_name" assetutil --info "$output/Assets.car")"
    for image_set in "$catalog"/*.imageset; do
      name="$(basename "$image_set" .imageset)"
      grep -Eq "\"Name\" *: *\"$name\"" <<<"$info" ||
        fail "$catalog: $name is not in the compiled catalog"
    done
  done <<<"$catalogs"
}

check_package() {
  local copy="$work/sample"

  echo "package: $repository_root/Package.swift"
  xcrun swift package --package-path "$repository_root" --scratch-path "$work/describe" \
    describe >/dev/null

  # A copy of the sample that names the repository by its full path, so that the build
  # writes nothing into the repository
  cp -R "$sample" "$copy"
  sed -i '' "s|path: \"[^\"]*\"|path: \"$repository_root\"|" "$copy/Package.swift"
  grep -q "path: \"$repository_root\"" "$copy/Package.swift" ||
    fail 'the sample does not depend on a package by path'

  echo "package: $sample"
  (
    cd "$copy"
    xcodebuild build -quiet -scheme Sample \
      -destination 'generic/platform=iOS Simulator' -derivedDataPath "$work/derived"
  )
}

[ $# -gt 0 ] || set -- swift assets package

xcodebuild -version
echo "SDK: $sdk_path"

for step in "$@"; do
  case "$step" in
    swift) check_swift ;;
    assets) check_assets ;;
    package) check_package ;;
    *) fail "unknown step: $step (swift, assets, package)" ;;
  esac
done

echo 'The iOS output compiles.'
