/**
 * This script will be run within the webview itself
 * It cannot access the main VS Code APIs directly.
 */
(function () {
  const vscode = acquireVsCodeApi();

  function isNullOrUndefined(value) {
    return value === null || value === undefined;
  }

  window.onload = function () {
    const oldState = vscode.getState();
    if (oldState !== undefined) {
      let pos = document.getElementById(oldState.position);
      if (pos !== undefined) {
        pos.scrollIntoView({ inline: "center" });
        window.scrollBy(0, -40);
        pos.focus();
      }
    }
  };

  let inputs = document.getElementsByTagName("textarea");
  for (let i = 0; i < inputs.length; i++) {
    const textArea = inputs[i];
    // Save changes to the new name
    textArea.addEventListener(
      "change",
      (e) => {
        let cleanedValue = e.target.value.replace(/[\t\r\n]/g, ""); // Remove illegal characters
        e.currentTarget.value = cleanedValue;

        vscode.postMessage({
          command: "update",
          text: `Updated template setting, ${e.target.id}:${cleanedValue}`,
          rowId: e.target.closest("tr").id,
          newValue: cleanedValue,
        });
      },
      false
    );
    textArea.addEventListener(
      "focus",
      (e) => {
        updateState({ position: e.target.id });
      },
      false
    );
  }

  // Buttons
  addButtonEventListener("btn-cancel", "click", () => {
    vscode.postMessage({
      command: "cancel",
      text: "Cancel",
    });
  });
  addButtonEventListener("btn-ok", "click", () => {
    vscode.postMessage({
      command: "ok",
      text: "OK",
    });
  });

  function addButtonEventListener(id, event, func) {
    let el = document.getElementById(id);
    if (isNullOrUndefined(el)) {
      return;
    }
    el.addEventListener(event, func);
  }

  function updateState(state = { position: undefined }) {
    vscode.setState(state);
  }
})();
