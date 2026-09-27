// Compiles and links the Android resources of every output folder: dist/android/<app>/<brand>
// and the android folder of each preset baseline. One product flavor per check, in an
// application module, because only an application links its resources against android.jar:
//
// - <output>Tree: the res/ tree, as an app adds it to its resources
// - <output><File>: each flat values file alone, as the Android guide uses main.xml

plugins {
  alias(libs.plugins.android.application)
}

/** Copies one values file into the values folder of an empty resource folder. */
abstract class FlatResources : DefaultTask() {
  @get:InputFile
  @get:PathSensitive(PathSensitivity.NAME_ONLY)
  abstract val file: RegularFileProperty

  @get:OutputDirectory
  abstract val output: DirectoryProperty

  @TaskAction
  fun copy() {
    val values = output.get().asFile.resolve("values")
    values.deleteRecursively()
    values.mkdirs()
    file.get().asFile.copyTo(values.resolve(file.get().asFile.name))
  }
}

class Check(val flavor: String, val tree: File?, val file: File?)

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
  listOf("dist" to packageDir.resolve("dist/android")) +
    folders(packageDir.resolve("test/golden")).map { it.name to it.resolve("android") }

val checks: List<Check> =
  platforms.flatMap { (name, platform) ->
    folders(platform).flatMap { app ->
      folders(app).flatMap { brand ->
        val output = listOf(name, app.name, brand.name)
        val tree = brand.resolve("res").takeIf { it.isDirectory }
        val files =
          brand.listFiles { file -> file.isFile && file.extension == "xml" }
            .orEmpty()
            .sortedBy { it.name }
        listOfNotNull(tree?.let { Check(camelCase(output + "tree"), it, null) }) +
          files.map { Check(camelCase(output + it.nameWithoutExtension), null, it) }
      }
    }
  }

check(checks.isNotEmpty()) { "No Android output in $packageDir" }

android {
  namespace = "com.chassisui.tokens.resources"
  compileSdk = 36

  defaultConfig {
    minSdk = 24
    targetSdk = 36
  }

  flavorDimensions += "output"
  productFlavors {
    checks.forEach { create(it.flavor) { dimension = "output" } }
  }
}

val compileTokens =
  tasks.register("compileTokens") {
    group = "verification"
    description = "Compiles and links the resources of every Android output folder."
  }

androidComponents {
  beforeVariants { it.enable = it.buildType == "debug" }

  onVariants { variant ->
    val check = checks.first { it.flavor == variant.flavorName }
    val name = variant.name.replaceFirstChar { it.uppercase() }

    if (check.tree != null) {
      variant.sources.res?.addStaticSourceDirectory(check.tree.path)
    } else {
      val flat =
        tasks.register<FlatResources>("flat${name}Resources") {
          file.set(check.file)
          output.set(layout.buildDirectory.dir("flat/${variant.name}"))
        }
      variant.sources.res?.addGeneratedSourceDirectory(flat, FlatResources::output)
    }

    compileTokens.configure { dependsOn("process${name}Resources") }
  }
}
