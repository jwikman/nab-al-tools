export enum TranslationMode {
  nabTags,
  dts,
  external,
}

export enum TransUnitElementType {
  transUnit,
  source,
  target,
  developerNote,
  descriptionNote,
  transUnitEnd,
  customNote,
}

export enum RefreshXlfHint {
  newCopiedSource = "New translation. Target copied from source.",
  modifiedSource = "Source has been modified.",
  emptySource = "Source contains only white-space, consider using 'Locked = true' to avoid translation of unnecessary texts",
  new = "New translation.",
  suggestion = "Suggested translation inserted.",
}
