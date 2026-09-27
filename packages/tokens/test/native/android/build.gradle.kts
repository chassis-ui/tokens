// The Android Gradle plugin compiles Kotlin itself; this sets the Kotlin version it uses,
// which the Compose compiler plugin must equal
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath(libs.kotlin.gradle.plugin)
  }
}

plugins {
  alias(libs.plugins.android.application) apply false
  alias(libs.plugins.android.library) apply false
  alias(libs.plugins.compose.compiler) apply false
}

// Every check of both modules
tasks.register("compileTokens") {
  group = "verification"
  description = "Compiles and links the Android resources and compiles the Compose objects."
  dependsOn(":resources:compileTokens", ":compose:compileTokens")
}
