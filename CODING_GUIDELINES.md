# TypeScript Coding Guidelines for nab-al-tools

This document provides guidelines for writing TypeScript as a contribution to nab-al-tools. These are considered recommendations and are not strictly enforced unless it's explicitly stated. The purpose of this document is to resolve uncertanties of coding style when developing and reviewing pull requests.

The maintainers of nab-al-tools recognize that contributors might have varying experience in TypeScript and that there are different schools, opinions and habits when writing code. Hopefully this document will be able to bridge the gaps. The maintainers also recognize that at the time of writing the current code base may not be fully compliant with these guidelines - and rest assured no one is loosing any sleep over that matter, so neither should you.

As with all things suggestions are always welcome.

## Names

* Use PascalCase for type names.
* Use PascalCase for Namespace names.
* Do not use "I" as a prefix for interface names, use PascalCase.
* Use PascalCase for enum values.
* Use camelCase for function names.
* Use camelCase for property names and local variables.
* Use whole words in names when possible.

```TypeScript
    // Bad:
    export function dSA() {
        // not clear
    }

    // Good:
    export function doSomethingAwesome() {
        // long but self-explanatory
    }
```

* Don't use "get" for property accessors (a property that returns some data item or a value for state). Simply use a name for the value accessed like temperature. Don't add get to the names such as in getTemperature or get_Temperature.

```TypeScript
    // not "get temperature"!
    export function temperature() {
        ....
    }
```

## Types

* Do not export types/functions unless you need to share it across multiple components.
* Within a file, type definitions should come first.

## `null` and `undefined`

Use undefined. Do not use null.

## Comments

Use JSDoc style comments for functions, interfaces, enums, and classes. [Create JSDoc Comments for JavaScript IntelliSense](https://docs.microsoft.com/visualstudio/ide/create-jsdoc-comments-for-javascript-intellisense).

## Strings

* Use single quotes for strings.
* When you can't use single quotes, try using back ticks (`).

## Diagnostic Messages

* Use a period at the end of a sentence.
* When stating a rule, the subject should be in the singular (e.g. "An external module cannot..." instead of "External modules cannot...").
* Use present tense.

## General Constructs

* Do not use `for..in` statements; instead, use `ts.forEach`, `ts.forEachKey` and `ts.forEachValue`. Be aware of their slightly different semantics.
* Try to use `ts.forEach`, `ts.map`, and `ts.filter` instead of loops when it is not strongly inconvenient.

## Style

* Always surround loop and conditional bodies with curly braces. Statements on the same line are allowed to omit braces.
* Open curly braces always go on the same line as whatever necessitates them.
* Parenthesized constructs should have no surrounding whitespace.
* A single space follows commas, colons, and semicolons in those constructs. For example:

```TypeScript
    for (var i = 0, n = str.length; i < 10; i++) { }
    if (x < 10) { }
    function f(x: number, y: string): void { }
```

* Use a single declaration per variable statement.

```TypeScript
    // Bad:
    var x = 1, y = 2;

    // Good:
    var x = 1; var y = 2;

```

* `else` goes on a separate line from the closing curly brace.
* Use 4 spaces per indentation.

## References & Inspiration

In order of priority:

* [TypeScript Deep Dive - An unofficial TypeScript Style Guide](https://basarat.gitbook.io/typescript/styleguide)
* [MakeCode](https://makecode.com/extensions/naming-conventions)
* [TypeScript](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
