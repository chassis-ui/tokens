// The changelog entries of @chassis-ui/tokens. The default of Changesets starts each entry
// with the hash of the commit that added the changeset, which says nothing to a reader of the
// release, as chassis-ui/assets has it.

export default {
  getReleaseLine(changeset) {
    const [firstLine, ...otherLines] = changeset.summary.split('\n').map((line) => line.trimEnd())

    return [`- ${firstLine}`, ...otherLines.map((line) => (line ? `  ${line}` : ''))].join('\n')
  },
  // The package has no dependency inside this repository.
  getDependencyReleaseLine() {
    return ''
  }
}
