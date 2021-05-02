/**
 * This script will be run within the webview itself
 * It cannot access the main VS Code APIs directly.
 */
(function () {
    const vscode = acquireVsCodeApi();
    const ValidKeys = {
        ArrowDown: "ArrowDown",
        ArrowUp: "ArrowUp",
        F8: "F8"
    }


    function isNullOrUndefined(value) {
        return (value === null || value === undefined);
    }

    window.onload = function () {
        const oldState = vscode.getState();
        if (oldState !== undefined) {
            let pos = document.getElementById(oldState.position)
            if (pos !== undefined) {
                pos.scrollIntoView({ inline: 'center' });
                window.scrollBy(0, -40);
                pos.focus();
            }
        }
    }

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'update':
                let suggestedTranslations = message.data;
                suggestedTranslations.forEach(x => {
                    if (document.getElementById(x.id) !== undefined) {
                        if (x.targetText) {
                            document.getElementById(`${x.id}`).innerHTML = x.targetText;
                        }
                        document.getElementById(`${x.id}-notes`).innerHTML = x.noteText;
                    }
                });
                break;
            default:
                break;
        }
    });

    let inputs = document.getElementsByTagName('textarea');
    for (let i = 0; i < inputs.length; i++) {
        const textArea = inputs[i];
        // Save changes to xlf
        textArea.addEventListener(
            'change',
            (e) => {
                vscode.postMessage({
                    command: 'update',
                    text: `Updated transunit: ${e.target.id}`,
                    transunitId: e.target.id,
                    targetText: e.target.value
                });
                document.getElementById(`${e.target.id}-complete`).checked = false;
            },
            false
        );
        textArea.addEventListener(
            'focus',
            (e) => {
                updateState({ position: e.target.id });
            },
            false
        );
    }

    // Filter buttons
    document.getElementById("btn-filter-clear").addEventListener(
        "click",
        () => {
            vscode.postMessage({
                command: "filter",
                text: "all"
            });
        });
    document.getElementById("btn-filter-review").addEventListener(
        "click",
        () => {
            vscode.postMessage({
                command: "filter",
                text: "review"
            });
        });
    document.getElementById("btn-filter-differently-translated").addEventListener(
        "click",
        () => {
            vscode.postMessage({
                command: "filter",
                text: "differently-translated"
            });
        });
    document.getElementById("btn-filter-translated-state").addEventListener(
        "click",
        () => {
            vscode.postMessage({
                command: "filter",
                text: "translated-state"
            });
        });
    document.getElementById("btn-filter-signed-off-state").addEventListener(
        "click",
        () => {
            vscode.postMessage({
                command: "filter",
                text: "signed-off-state"
            });
        });
    document.getElementById("btn-filter-exact-match").addEventListener(
        "click",
        () => {
            vscode.postMessage({
                command: "filter",
                text: "exact-match"
            });
        });
    document.getElementById("btn-reload").addEventListener(
        "click",
        () => {
            vscode.postMessage({
                command: "reload",
            });
        });

    // Complete Checkboxes
    let checkboxes = document.getElementsByTagName("input");
    for (let i = 0; i < checkboxes.length; i++) {
        const checkbox = checkboxes[i];
        // Complete translation
        checkbox.addEventListener(
            'change',
            (e) => {
                let id = e.target.id.replace('-complete', '');
                vscode.postMessage({
                    command: 'complete',
                    text: `${e.target.checked ? "Completed" : "Uncompleted"} transunit: ${id}`,
                    transunitId: id,
                    checked: e.target.checked
                })
            },
            false
        );
        checkbox.addEventListener(
            'focus',
            (e) => {
                updateState({ position: e.target.id });
            },
            false
        );
    }

    document.addEventListener("keydown", (e) => {
        if (Object.keys(ValidKeys).indexOf(e.key) === -1) {
            return;
        }
        if (isNullOrUndefined(e.target.closest("tr"))) {
            return;
        }
        let currentRow = document.getElementById(e.target.closest("tr").id);
        let previousRow = currentRow.previousElementSibling;
        let nextRow = currentRow.nextElementSibling;
        switch (e.key) {
            case ValidKeys.ArrowDown:
                if (isNullOrUndefined(nextRow)) {
                    return;
                }
                setFocus(nextRow.getElementsByClassName("target-cell")[0].getElementsByTagName("textarea")[0]);
                break;
            case ValidKeys.ArrowUp:
                if (isNullOrUndefined(previousRow)) {
                    return;
                }
                setFocus(previousRow.getElementsByClassName("target-cell")[0].getElementsByTagName("textarea")[0]);
                break;
            case ValidKeys.F8:
                if (isNullOrUndefined(previousRow)) {
                    return;
                }
                let copyValue = previousRow.getElementsByClassName("target-cell")[0].getElementsByTagName("textarea")[0].value;
                e.target.value = copyValue;
                e.target.dispatchEvent(new Event("change"));
                break;
            default:
                throw new Error(`Invalid key: ${e.key}`)
        }
    });

    function setFocus(textArea) {
        if (isNullOrUndefined(textArea)) {
            return;
        }
        textArea.focus();
    }

    function updateState(state = { position: undefined }) {
        vscode.setState(state);
    }
}());
