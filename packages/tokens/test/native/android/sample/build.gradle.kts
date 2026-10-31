// An app that depends on the Android library of each app and brand, the AAR that
// `:library:aars` builds, and reads its resources in a layout and in Kotlin. One product
// flavor per library.

import groovy.json.JsonSlurper

plugins {
  alias(libs.plugins.android.application)
}

class Library(val flavor: String, val file: String)

fun folders(parent: File): List<File> =
  parent.listFiles { child -> child.isDirectory }.orEmpty().sortedBy { it.name }

fun camelCase(words: List<String>): String =
  words.flatMap { it.split('-', '_', '.') }
    .filter { it.isNotEmpty() }
    .joinToString("") { word -> word.replaceFirstChar { it.uppercase() } }
    .replaceFirstChar { it.lowercase() }

// The repository of tokens that -PtokensRoot=<dir> names
val tokensRoot: File =
  providers.gradleProperty("tokensRoot").map(::File).orNull?.canonicalFile
    ?: error("Name the repository of tokens with -PtokensRoot=<absolute path>")
val tokensVersion = (JsonSlurper().parse(tokensRoot.resolve("package.json")) as Map<*, *>)["version"]

val libraries: List<Library> =
  folders(tokensRoot.resolve("dist/android")).flatMap { app ->
    folders(app)
      .filter { brand -> brand.resolve("res").isDirectory }
      .map { brand ->
        Library(
          camelCase(listOf(app.name, brand.name)),
          "chassis-tokens-${app.name}-${brand.name}-$tokensVersion.aar"
        )
      }
  }

android {
  namespace = "chassis.tokens.sample"
  compileSdk = 36

  defaultConfig {
    minSdk = 24
    targetSdk = 36
  }

  flavorDimensions += "library"
  productFlavors {
    libraries.forEach { create(it.flavor) { dimension = "library" } }
  }
}

// Where `:library:aars` writes
val aars: File = rootDir.resolve("library/build/aars")

dependencies {
  libraries.forEach {
    add("${it.flavor}Implementation", files(aars.resolve(it.file)).builtBy(":library:aars"))
  }
}

// A task that reads the runtime classpath when it runs does not always get the dependency above
tasks.matching { it.name.endsWith("NavigationResources") }.configureEach {
  dependsOn(":library:aars")
}

val compileTokens =
  tasks.register("compileTokens") {
    group = "verification"
    description = "Compiles an app that reads the resources of each Android library."
  }

androidComponents {
  beforeVariants { it.enable = it.buildType == "debug" }

  onVariants { variant ->
    val name = variant.name.replaceFirstChar { it.uppercase() }
    compileTokens.configure { dependsOn("process${name}Resources", "compile${name}Kotlin") }
  }
}
