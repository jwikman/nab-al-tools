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
    if (this.numberOfReviewsAdded > 0) {
      msg += `${this.numberOfReviewsAdded} targets marked as in need of review, `;
    }
    if (msg !== "") {
      msg = msg.slice(0, msg.length - 2); // Remove trailing ,
    } else {
      msg = "Nothing changed";
    }
    if (this.numberOfCheckedFiles) {
      msg += ` in ${this.numberOfCheckedFiles} XLF files`;
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
}
