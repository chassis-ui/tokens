// Compiles the Compose objects of every output folder against Jetpack Compose, with the
// Compose compiler, as an app does: dist/android-compose/<app>/<brand>, when an app of the
// build configuration selects the platform, and the android-compose folder of each preset
// baseline. One product flavor per folder, because every folder declares the same objects.

plugins {
  alias(libs.plugins.android.library)
  alias(libs.plugins.compose.compiler)
}

class Check(val flavor: String, val folder: File)

fun folders(parent: File): List<File> =
  parent.listFiles { child -> child.isDirectory }.orEmpty().sortedBy { it.name }

fun camelCase(words: List<String>): String =
  words.flatMap { it.split('-', '_', '.') }
    .filter { it.isNotEmpty() }
    .joinToString("") { word -> word.replaceFirstChar { it.uppercase() } }
    .replaceFirstChar { it.lowercase() }

// packages/tokens
val packageDir: File = rootDir.resolve("../../..").canonicalFile

// The platform folders, each with the first word of its flavor names
val platforms: List<Pair<String, File>> =
  listOf("dist" to packageDir.resolve("dist/android-compose")) +
    folders(packageDir.resolve("test/golden")).map {
      it.name to it.resolve("android-compose")
    }

val checks: List<Check> =
  platforms.flatMap { (name, platform) ->
    folders(platform).flatMap { app ->
      folders(app).map { brand -> Check(camelCase(listOf(name, app.name, brand.name)), brand) }
    }
  }

check(checks.isNotEmpty()) { "No Compose output in $packageDir" }

android {
  namespace = "com.chassisui.tokens.compose"
  compileSdk = 36

  defaultConfig {
    minSdk = 24
  }

  buildFeatures {
    compose = true
  }

  flavorDimensions += "output"
  productFlavors {
    checks.forEach { create(it.flavor) { dimension = "output" } }
  }
}

dependencies {
  implementation(platform(libs.compose.bom))
  implementation(libs.compose.ui)
}

val compileTokens =
  tasks.register("compileTokens") {
    group = "verification"
    description = "Compiles the Compose objects of every output folder."
  }

androidComponents {
  beforeVariants { it.enable = it.buildType == "debug" }

  onVariants { variant ->
    val check = checks.first { it.flavor == variant.flavorName }
    val name = variant.name.replaceFirstChar { it.uppercase() }

    variant.sources.kotlin?.addStaticSourceDirectory(check.folder.path)
    compileTokens.configure { dependsOn("compile${name}Kotlin") }
  }
}
