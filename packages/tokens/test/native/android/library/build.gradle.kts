// The Android library of every app and brand: the res/ tree of dist/android/<app>/<brand>
// as an AAR. `./gradlew :library:aars` writes them to library/build/aars/, named
// chassis-tokens-<app>-<brand>-<version>.aar, and the release workflow attaches them to the
// GitHub release. One product flavor per library.

import com.android.build.api.artifact.SingleArtifact
import groovy.json.JsonSlurper

plugins {
  alias(libs.plugins.android.library)
}

class Library(val flavor: String, val app: String, val brand: String, val tree: File)

fun folders(parent: File): List<File> =
  parent.listFiles { child -> child.isDirectory }.orEmpty().sortedBy { it.name }

fun camelCase(words: List<String>): String =
  words.flatMap { it.split('-', '_', '.') }
    .filter { it.isNotEmpty() }
    .joinToString("") { word -> word.replaceFirstChar { it.uppercase() } }
    .replaceFirstChar { it.lowercase() }

// packages/tokens
val packageDir: File = rootDir.resolve("../../..").canonicalFile
val tokensVersion = (JsonSlurper().parse(packageDir.resolve("package.json")) as Map<*, *>)["version"]

val libraries: List<Library> =
  folders(packageDir.resolve("dist/android")).flatMap { app ->
    folders(app)
      .filter { brand -> brand.resolve("res").isDirectory }
      .map { brand ->
        Library(camelCase(listOf(app.name, brand.name)), app.name, brand.name, brand.resolve("res"))
      }
  }

check(libraries.isNotEmpty()) { "No Android resource tree in $packageDir/dist" }

android {
  // The package of the R class, and of the Compose objects of the android-compose platform
  namespace = "chassis.tokens"
  compileSdk = 36

  defaultConfig {
    // Vector drawables
    minSdk = 21
  }

  flavorDimensions += "library"
  productFlavors {
    libraries.forEach { create(it.flavor) { dimension = "library" } }
  }
}

val aars =
  tasks.register<Copy>("aars") {
    group = "build"
    description = "Builds the Android library of every app and brand."
    into(layout.buildDirectory.dir("aars"))
  }

androidComponents {
  beforeVariants { it.enable = it.buildType == "release" }

  onVariants { variant ->
    val library = libraries.first { it.flavor == variant.flavorName }

    variant.sources.res?.addStaticSourceDirectory(library.tree.path)
    aars.configure {
      from(variant.artifacts.get(SingleArtifact.AAR)) {
        rename { "chassis-tokens-${library.app}-${library.brand}-$tokensVersion.aar" }
      }
    }
  }
}
