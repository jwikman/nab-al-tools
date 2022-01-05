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

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case "update": {
        let suggestedTranslations = message.data;
        suggestedTranslations.forEach((x) => {
          if (document.getElementById(x.id) !== undefined) {
            if (x.targetText) {
              document.getElementById(`${x.id}`).innerHTML = x.targetText;
            }
            document.getElementById(`${x.id}-notes`).innerHTML = x.noteText;
          }
        });
        break;
      }
      default:
        break;
    }
  });

  let inputs = document.getElementsByTagName("textarea");
  for (let i = 0; i < inputs.length; i++) {
    const textArea = inputs[i];
    // Save changes to the new name
    textArea.addEventListener(
      "change",
      (e) => {
        vscode.postMessage({
          command: `update-${
            e.target.id.endsWith("-name") ? "name" : "caption"
          }`,
          text: `Updated PermissionSet, ${e.target.id}:${e.target.value}`,
          roleID: e.target.closest("tr").id,
          newValue: e.target.value,
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
    el = document.getElementById(id);
    if (isNullOrUndefined(el)) {
      return;
    }
    el.addEventListener(event, func);
  }

  function updateState(state = { position: undefined }) {
    vscode.setState(state);
  }
})();
