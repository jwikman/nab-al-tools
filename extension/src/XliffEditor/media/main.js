/**
 * This script will be run within the webview itself
 * It cannot access the main VS Code APIs directly.
 */

(function () {
    const vscode = acquireVsCodeApi();

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        /*
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'refactor':
                currentCount = Math.ceil(currentCount * 0.5);
                counter.textContent = currentCount;
                break;
        }
        */
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
                    text: `changed transunit: ${e.target.id}`,
                    transunitId: e.target.id,
                    targetText: e.target.value
                })
            },
            false
        );

        // Show Notes
        textArea.addEventListener(
            'focus',
            (e) => {
                document.getElementById(e.target.id + '-notes').style.display = 'block';
            },
            false
        );
        // Hide notes
        textArea.addEventListener(
            'blur',
            (e) => {
                let notes = document.getElementsByClassName('transunit-notes');
                for (const note in notes) {
                    if (notes.hasOwnProperty(note)) {
                        const element = notes[note];
                        element.style.display = 'none';
                    }
                }
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

}());