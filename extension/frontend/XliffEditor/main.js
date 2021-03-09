/**
 * This script will be run within the webview itself
 * It cannot access the main VS Code APIs directly.
 */
(function () {
    const vscode = acquireVsCodeApi();



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
        (e) => {
            vscode.postMessage({
                command: "filter",
                text: "all"
            });
        });
    document.getElementById("btn-filter-review").addEventListener(
        "click",
        (e) => {
            vscode.postMessage({
                command: "filter",
                text: "review"
            });
        });
    document.getElementById("btn-filter-differently-translated").addEventListener(
        "click",
        (e) => {
            vscode.postMessage({
                command: "filter",
                text: "differently-translated"
            });
        });
    document.getElementById("btn-reload").addEventListener(
        "click",
        (e) => {
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

    /**
     * Copy Source //TODO: Maybe add back in at a later date
     */
    // let buttons = document.getElementsByClassName("btn-cpy-src");
    // for (let i = 0; i < buttons.length; i++) {
    //     const checkbox = buttons[i];
    //     // Complete translation
    //     checkbox.addEventListener(
    //         "click",
    //         (e) => {
    //             let id = e.target.id.replace('-copy-source', '');
    //             let sourceText = document.getElementById(`${id}-source`).innerText;
    //             document.getElementById(id).value = sourceText;
    //             vscode.postMessage({
    //                 command: 'update',
    //                 text: `Updated transunit: ${id}`,
    //                 transunitId: id,
    //                 targetText: sourceText
    //             })
    //         },
    //         false
    //     );
    // }
    function updateState(state = { position: undefined }) {
        vscode.setState(state);
    }
}());
