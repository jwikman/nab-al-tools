export class RefreshResult {
  numberOfAddedTransUnitElements = 0;
  numberOfUpdatedNotes = 0;
  numberOfUpdatedMaxWidths = 0;
  numberOfUpdatedSources = 0;
  numberOfRemovedTransUnits = 0;
  numberOfRemovedNotes = 0;
  numberOfCheckedFiles = 0;
  numberOfSuggestionsAdded = 0;
  numberOfReviewsAdded = 0;
  totalNumberOfNeedsTranslation = 0;
  totalNumberOfNeedsReview = 0;
  fileName?: string;

  getReportLines(): string[] {
    const lines: string[] = [];
    if (this.numberOfAddedTransUnitElements > 0) {
      lines.push(
        `${this.numberOfAddedTransUnitElements} inserted translations`
      );
    }
    if (this.numberOfUpdatedMaxWidths > 0) {
      lines.push(`${this.numberOfUpdatedMaxWidths} updated maxwidth`);
    }
    if (this.numberOfUpdatedNotes > 0) {
      lines.push(`${this.numberOfUpdatedNotes} updated notes`);
    }
    if (this.numberOfRemovedNotes > 0) {
      lines.push(`${this.numberOfRemovedNotes} removed notes`);
    }
    if (this.numberOfUpdatedSources > 0) {
      lines.push(`${this.numberOfUpdatedSources} updated sources`);
    }
    if (this.numberOfRemovedTransUnits > 0) {
      lines.push(`${this.numberOfRemovedTransUnits} removed translations`);
    }
    if (this.numberOfSuggestionsAdded > 0) {
      lines.push(`${this.numberOfSuggestionsAdded} added suggestions`);
    }
    if (this.totalNumberOfNeedsTranslation > 0) {
      lines.push(
        `${this.totalNumberOfNeedsTranslation} targets in need of translation`
      );
    }
    if (this.totalNumberOfNeedsReview > 0) {
      lines.push(`${this.totalNumberOfNeedsReview} targets in need of review`);
    }
    return lines;
  }

  getReport(): string {
    var lines = this.getReportLines();
    if (lines.length === 0) {
      lines.push("No more translations to process");
    }
    let msg = lines.join(", ");

    if (this.numberOfCheckedFiles) {
      msg += ` in ${this.numberOfCheckedFiles} ${pluralize(
        this.numberOfCheckedFiles,
        "XLF file",
        "XLF files"
      )}`;
    } else if (this.fileName) {
      msg += ` in ${this.fileName}`;
    }

    return msg;
  }

  public get isChanged(): boolean {
    return (
      Object.entries(this)
        .filter((e) => !["numberOfCheckedFiles"].includes(e[0]))
        .filter((e) => e[1] > 0).length > 0
    );
  }
  public getDelta(comparedResult: RefreshResult): RefreshResult {
    const delta = new RefreshResult();
    delta.numberOfAddedTransUnitElements =
      this.numberOfAddedTransUnitElements -
      comparedResult.numberOfAddedTransUnitElements;
    delta.numberOfUpdatedNotes =
      this.numberOfUpdatedNotes - comparedResult.numberOfUpdatedNotes;
    delta.numberOfUpdatedMaxWidths =
      this.numberOfUpdatedMaxWidths - comparedResult.numberOfUpdatedMaxWidths;
    delta.numberOfUpdatedSources =
      this.numberOfUpdatedSources - comparedResult.numberOfUpdatedSources;
    delta.numberOfRemovedTransUnits =
      this.numberOfRemovedTransUnits - comparedResult.numberOfRemovedTransUnits;
    delta.numberOfRemovedNotes =
      this.numberOfRemovedNotes - comparedResult.numberOfRemovedNotes;
    delta.numberOfSuggestionsAdded =
      this.numberOfSuggestionsAdded - comparedResult.numberOfSuggestionsAdded;
    delta.numberOfReviewsAdded =
      this.numberOfReviewsAdded - comparedResult.numberOfReviewsAdded;
    return delta;
  }

  public subtract(comparedResult: RefreshResult | undefined): void {
    if (!comparedResult) {
      return;
    }
    this.numberOfAddedTransUnitElements -=
      comparedResult.numberOfAddedTransUnitElements;
    this.numberOfUpdatedNotes -= comparedResult.numberOfUpdatedNotes;
    this.numberOfUpdatedMaxWidths -= comparedResult.numberOfUpdatedMaxWidths;
    this.numberOfUpdatedSources -= comparedResult.numberOfUpdatedSources;
    this.numberOfRemovedTransUnits -= comparedResult.numberOfRemovedTransUnits;
    this.numberOfRemovedNotes -= comparedResult.numberOfRemovedNotes;
    this.numberOfSuggestionsAdded -= comparedResult.numberOfSuggestionsAdded;
    this.numberOfReviewsAdded -= comparedResult.numberOfReviewsAdded;
    this.numberOfCheckedFiles -= comparedResult.numberOfCheckedFiles;
  }
  public clone(): RefreshResult {
    const clone = new RefreshResult();
    clone.numberOfAddedTransUnitElements = this.numberOfAddedTransUnitElements;
    clone.numberOfUpdatedNotes = this.numberOfUpdatedNotes;
    clone.numberOfUpdatedMaxWidths = this.numberOfUpdatedMaxWidths;
    clone.numberOfUpdatedSources = this.numberOfUpdatedSources;
    clone.numberOfRemovedTransUnits = this.numberOfRemovedTransUnits;
    clone.numberOfRemovedNotes = this.numberOfRemovedNotes;
    clone.numberOfCheckedFiles = this.numberOfCheckedFiles;
    clone.numberOfSuggestionsAdded = this.numberOfSuggestionsAdded;
    clone.numberOfReviewsAdded = this.numberOfReviewsAdded;
    clone.fileName = this.fileName;
    return clone;
  }
}
function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
