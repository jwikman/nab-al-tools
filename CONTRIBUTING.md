# Introduction

This is intended to be a quick guide to get developers up and running. If you notice any problems or outdated information following this guide, please open an issue or submit a pull request.

## Pre-requisites

* [nodejs](https://www.nodejs.org)

## Installation - with npm

```bash
git clone https://github.com/jwikman/nab-al-tools.git
cd nab-al-tools
npm install # npm install should resolve all dependencies.
```

If you get "tsc" errors install typescript

```bash
npm install -g typescript
```

If you get errors concerning the test install mocha

```bash
npm install mocha
# OR
npm install -g mocha # To install it globally
```

## Running the extension

* Open the folder in Visual Studio Code.
* Open the Debug menu (`Ctrl+Shift+D`) and set the debug configuration to `Extension`.
* Press `F5`.

In the Development Extension Host window open the command palette and search for NAB.

If you get an error like
> command 'nab.SomeCommand' not found.

This would most likely be due to the extension not being activated. You can find the requirements in `package.json` under `activationEvents`. For test purposes you can add `"*"` to the list which would make the extension always activated. Be sure to remove it if it's not present in the master repo.
