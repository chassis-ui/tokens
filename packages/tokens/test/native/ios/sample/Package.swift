// swift-tools-version:5.9

// An app's view of the Swift package: it depends on the package of a repository of tokens, as
// an app depends on it by URL, and reads tokens of its libraries. check.sh names the repository
// it checks in a copy of this file.

import PackageDescription

let package = Package(
    name: "Sample",
    platforms: [.iOS(.v13)],
    products: [.library(name: "Sample", targets: ["Sample"])],
    dependencies: [.package(name: "ChassisTokens", path: "../../../../../../vendor/tokens")],
    targets: [
        .target(
            name: "Sample",
            dependencies: [
                .product(name: "ChassisTokensDemoChassis", package: "ChassisTokens"),
                .product(name: "ChassisTokensDemoSinefil", package: "ChassisTokens")
            ]
        )
    ]
)
