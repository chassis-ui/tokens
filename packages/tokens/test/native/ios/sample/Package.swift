// swift-tools-version:5.9

// An app's view of the Swift package: it depends on the package at the root of the
// repository, as an app depends on it by URL, and reads tokens of its libraries.

import PackageDescription

let package = Package(
    name: "Sample",
    platforms: [.iOS(.v13)],
    products: [.library(name: "Sample", targets: ["Sample"])],
    dependencies: [.package(name: "ChassisTokens", path: "../../../../../..")],
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
