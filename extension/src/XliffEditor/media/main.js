// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState();

    const counter = document.getElementById('lines-of-code-counter');
    console.log(oldState);
    let currentCount = (oldState && oldState.count) || 0;
    counter.textContent = currentCount;

    setInterval(() => {
        counter.textContent = currentCount++;

        // Update state
        vscode.setState({ count: currentCount });

        // Alert the extension when the cat introduces a bug
        if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
            // Send a message back to the extension
            vscode.postMessage({
                command: 'alert',
                text: '🐛  on line ' + currentCount
            });
        }
    }, 1000);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'refactor':
                currentCount = Math.ceil(currentCount * 0.5);
                counter.textContent = currentCount;
                break;
        }
    });

    let inputs = document.getElementsByTagName('textarea');
    for (let i = 0; i < inputs.length; i++) {
        const element = inputs[i];
        // Save changes to xlf
        element.addEventListener(
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
        element.addEventListener(
            'focus', 
            (e) => {
                document.getElementById(e.target.id+'-notes').style.display = 'block';
            //    vscode.postMessage({ command: 'update', 
            //    text: `changed transunit: ${e.target.id}`, 
            //    transunitId: e.target.id, 
            //    targetText: e.target.value 
            // })
            },
            false
        );
        // Hide notes
        element.addEventListener(
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
    //Filter buttons
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
