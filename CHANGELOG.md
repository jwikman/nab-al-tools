# Change Log

All notable changes to the "nab-al-tools" extension will be documented in this file.

<!-- 
Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
-->

## [0.3.22] Public Beta - 2019-09-15

- Fixes [issue 5 - Empty elements are replaced with self-closing tags](https://github.com/jwikman/nab-al-tools/issues/5). Self-closing tags is now replaced by regular ending tags.
  - `<note ... />` is now converted to `<note ... ></note>`
  - if the developer note is missing from target file, it is now readded from the source file

## [0.3.20] Public Beta - 2019-06-26

- New function: "NAB: Copy \<source\> to \<target\>"
  - Use this when positioned on a target line in a xlf file to copy the content of the \<source\> element to the \<target\> that are selected

## [0.3.19] Public Beta - 2019-06-12

- New logo
- New function: "NAB: Sort XLF files as g.xlf"
  - Updates all language xlf files with the same sorting as the g.xlf file
- Updated dependency versions

## [0.3.17] Public Beta - 2019-05-26

- Updated readme
- New snippets through [PR 2](https://github.com/jwikman/nab-al-tools/pull/2) from my colleague [theschitz](https://github.com/theschitz)!

## [0.3.13] Public Beta - 2019-05-14

- Fix issue [Error in NAB: Refresh XLF Files from g.xml](https://github.com/jwikman/nab-al-tools/issues/1)

## [0.3.12] Public Beta - 2019-05-13

- Initial public release
