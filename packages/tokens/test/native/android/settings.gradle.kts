// Compiles the Android output of @chassis-ui/tokens against the Android SDK and Compose.
// See packages/tokens/test/README.md, "Native compile checks".

pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
}

dependencyResolutionManagement {
  repositoriesMode = RepositoriesMode.FAIL_ON_PROJECT_REPOS
  repositories {
    google()
    mavenCentral()
  }
}

rootProject.name = "chassis-tokens-native"

include(":library")

// -PtokensRoot=<dir> names the repository of tokens to read. The release of a repository of
// tokens builds its Android libraries from the Gradle project of the installed package, where
// the checks are not
listOf("resources", "compose", "sample")
  .filter { settingsDir.resolve(it).isDirectory }
  .forEach { include(":$it") }
