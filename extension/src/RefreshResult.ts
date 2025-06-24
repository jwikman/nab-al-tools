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

  getReport(): string {
    let msg = "";
    if (this.numberOfAddedTransUnitElements > 0) {
      msg += `${this.numberOfAddedTransUnitElements} inserted translations, `;
    }
    if (this.numberOfUpdatedMaxWidths > 0) {
      msg += `${this.numberOfUpdatedMaxWidths} updated maxwidth, `;
    }
    if (this.numberOfUpdatedNotes > 0) {
      msg += `${this.numberOfUpdatedNotes} updated notes, `;
    }
    if (this.numberOfRemovedNotes > 0) {
      msg += `${this.numberOfRemovedNotes} removed notes, `;
    }
    if (this.numberOfUpdatedSources > 0) {
      msg += `${this.numberOfUpdatedSources} updated sources, `;
    }
    if (this.numberOfRemovedTransUnits > 0) {
      msg += `${this.numberOfRemovedTransUnits} removed translations, `;
    }
    if (this.numberOfSuggestionsAdded > 0) {
      msg += `${this.numberOfSuggestionsAdded} added suggestions, `;
    }
    if (this.totalNumberOfNeedsTranslation > 0) {
      msg += `${this.totalNumberOfNeedsTranslation} targets in need of translation, `;
    }
    if (this.totalNumberOfNeedsReview > 0) {
      msg += `${this.totalNumberOfNeedsReview} targets in need of review, `;
    }
    if (msg !== "") {
      msg = msg.slice(0, msg.length - 2); // Remove trailing ,
    } else {
      msg = "No more translations to process,";
    }
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
