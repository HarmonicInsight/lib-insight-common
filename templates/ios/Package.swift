// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "__AppName__",
    platforms: [
        .iOS(.v17),
    ],
    dependencies: [
        // .package(url: "https://github.com/firebase/firebase-ios-sdk.git", .upToNextMajor(from: "11.0.0")),
        // .package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", .upToNextMajor(from: "4.2.2")),
    ],
    targets: [
        .executableTarget(
            name: "__AppName__",
            dependencies: [
                // .product(name: "FirebaseAnalytics", package: "firebase-ios-sdk"),
                // .product(name: "FirebaseCrashlytics", package: "firebase-ios-sdk"),
                // "KeychainAccess",
            ],
            path: "__APPNAME__",
            resources: [
                .process("Resources"),
            ]
        ),
    ]
)
