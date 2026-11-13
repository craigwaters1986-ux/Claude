// swift-tools-version:5.9
// GymCore — platform-independent domain logic shared by the iPhone app,
// the Apple Watch app and (via identical algorithms) the web prototype.
// Foundation-only so it builds and tests on Linux CI as well as Xcode.
import PackageDescription

let package = Package(
    name: "GymCore",
    platforms: [.iOS(.v17), .watchOS(.v10), .macOS(.v14)],
    products: [.library(name: "GymCore", targets: ["GymCore"])],
    targets: [
        .target(name: "GymCore"),
        .testTarget(name: "GymCoreTests", dependencies: ["GymCore"]),
    ]
)
