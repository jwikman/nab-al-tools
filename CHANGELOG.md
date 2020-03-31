# Change Log

All notable changes to the "nab-al-tools" extension will be documented in this file.

<!-- 
Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

-->

## [Unreleased]

- New setting NAB.SearchOnlyXlfFiles
  - If enabled, the "NAB:Find Untranslated texts" function only searches *.xlf files. Be aware of that the *.xlf file filter remains in "Find in Files" after this command has been run. This should be enabled in large projects (as Base Application) for performance reasons.

## [0.3.25] Public Beta - 2019-12-10

- Fixed anchor links in README. (changed to lowercase, since that seems to be necessary on the Marketplace site)

## [0.3.24] Public Beta - 2019-12-10

- New feature [Use state property in xlf-files](https://github.com/jwikman/nab-al-tools/issues/17)
  - Use setting `NAB.UseExternalTranslationTool` if you're using an external tool for translation
  - Implemented by [theschitz](https://github.com/theschitz) in [PR 18](https://github.com/jwikman/nab-al-tools/pull/18), thanks!
- New snippet "Declare Enum value" ("tenumvalue (NAB)") through [PR 7](https://github.com/jwikman/nab-al-tools/pull/7) by [theschitz](https://github.com/theschitz)
- Fixes [issue 16 - 'MlToken RegExp failed' thrown if wrong casing used for properties](https://github.com/jwikman/nab-al-tools/issues/16).
- Fixes [issue 23 - Improving FindNextUntranslatedByToken](https://github.com/jwikman/nab-al-tools/issues/23).
  - Implemented by [theschitz](https://github.com/theschitz) in [PR 24](https://github.com/jwikman/nab-al-tools/pull/24), thanks!

## [0.3.23] Public Beta - 2019-10-23

- Fixes [issue 14 - NAB: Refresh XLF files from g.xlf - fails if invalid chars in app name](https://github.com/jwikman/nab-al-tools/issues/14).

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
