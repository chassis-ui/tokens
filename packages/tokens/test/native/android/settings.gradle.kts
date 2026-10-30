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

// With -PtokensRoot=<dir>, the release of a repository of tokens, which builds its Android
// libraries from the Gradle project of the installed package: the checks are not there
if (!providers.gradleProperty("tokensRoot").isPresent) {
  include(":resources", ":compose", ":sample")
}
