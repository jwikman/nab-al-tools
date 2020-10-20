# Contributing to NAB AL Tools

The following is a set of guidelines for contributing to the VS Code extension NAB AL Tools, which is hosted here in the [nab-al-tools](https://github.com/jwikman/nab-al-tools) repository on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Table of Contents

[Code of Conduct](#code-of-conduct)

[How Can I Contribute?](#how-can-i-contribute)

* [Reporting Bugs](#reporting-bugs)
* [Suggesting Enhancements](#suggesting-enhancements)
* [Pull Requests](#pull-requests)

[Getting Started](#getting-started)

[Hacking Away](#hacking-away)

## Code Of Conduct

Read the [Code Of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How Can I Contribute

We'd love for you to contribute! Just take a quick look at the guidelines below before you go.

### Reporting Bugs

Great! You found a bug! We love bugs! Maybe not creating them but finding and squashing them. Go ahead and create an issue using the [Bug Report Template](.github\ISSUE_TEMPLATE\bug_report.md). You select this template when creating a new issue in the Issues tab. By providing a good description, screenshots and how to reproduce the problem you're making it a whole lot easier for us to find and fix the problem. If you are able to provide a suggested solution you are most welcome to do so!

### Suggesting Enhancements

First search the issues both open and closed to see if your idea or something similar has been up for dicussion earlier. After reading up and if you're still positive that your suggestion would be a good enhancement then go ahead an create a new issue using the [Feature Request Template](.github\ISSUE_TEMPLATE\feature_request.md). You select this template when creating a new issue in the Issues tab. If you find an issue that's been accepted but no work has begun feel free to pick it up.

### Pull Requests

All pull requests should reference an issue. Exceptions can be made for documentation updates, please be as descriptive as possible in the PR description. Any code changes not referring to a known bug or accepted enhancement will be strongly questioned. This to maintain code quality and to ensure that time is spent on fixing problems that are important to users.

* All tests should pass locally. If tests are failing unrelated to changes you've made; create an issue.
* Create pull request as draft
* Write a good description if the referenced issue is lacking information regarding the indented solution.
* Once all build checks/test have passed set the PR to Ready for review.


## Getting Started

This is intended to be a quick guide to get developers up and running. If you notice any problems or outdated information following this guide, please open an issue or submit a pull request. If you're new to extension development you might want to take a look att the hello world guide [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension) or any of the [VS Code Extension Samples](https://github.com/Microsoft/vscode-extension-samples) provided by Microsoft.

### Pre-requisites

* [Visual Studio Code](https://code.visualstudio.com)
* [nodejs](https://www.nodejs.org)

### Installation - with npm

```bash
git clone https://github.com/jwikman/nab-al-tools.git
cd nab-al-tools/extension
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

### Running the extension

* Open the `nab-al-tools.code-workspace` in Visual Studio Code.
* Open the Debug menu (`Ctrl+Shift+D`) and set the debug configuration to `Extension`.
* Press `F5`.

In the Development Extension Host window open the command palette and search for NAB.

If you get an error like
> command 'nab.SomeCommand' not found.

This would most likely be due to the extension not being activated. You can find the requirements in `package.json` under `activationEvents`. For test purposes you can add `"*"` to the list which would make the extension always activated. Be sure to remove it if it's not present in the master repo.

## Hacking away

Before submitting a pull request, take a look at our [Coding Guidelines](./CODING_GUIDELINES.md). These are not strictly enforced but code compliant with the guidelines will speed up the PR process.