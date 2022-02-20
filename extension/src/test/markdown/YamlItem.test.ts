import * as assert from "assert";
import { YamlItem } from "../../markdown/YamlItem";

suite("YamlItem Tests", function () {
  const items = [
    new YamlItem({
      name: "test1",
      topicHref: "testTopicHref1",
      href: "testHref1",
    }),
    new YamlItem({
      name: "test2",
      topicHref: "testTopicHref1",
      href: "testHref3",
    }),
  ];
  const parent = new YamlItem({
    name: "parent",
    topicHref: "parentTopicHef",
    href: "parentHref",
    items: items,
  });

  test("YamlItem.toString()", function () {
    const actual = parent.toString();
    assert.strictEqual(
      actual,
      expectedToStringValue(),
      "Unexpected string returned"
    );
  });

  test("YamlItem.toString() - level", function () {
    const actual = parent.toString(1);
    assert.strictEqual(
      actual,
      expectedToStringLevelValue(),
      "Unexpected string returned"
    );
  });

  test("YamlItem.arrayToString()", function () {
    const actual = YamlItem.arrayToString(items);
    assert.strictEqual(
      actual,
      expectedArrayToStringValue(),
      "Unexpected string returned"
    );
  });

  test("toMarkdown()", function () {
    assert.strictEqual(parent.toMarkdown(1, 1), "", "Expected empty string");
    assert.strictEqual(
      parent.toMarkdown(0, 1),
      "## [parent](parentTopicHef)\n",
      "Unexpected string returned"
    );
  });

  test("arrayToMarkdown()", function () {
    assert.strictEqual(
      YamlItem.arrayToMarkdown(items, 2),
      "## [test1](testTopicHref1)\n## [test2](testTopicHref1)\n",
      "Unexpected markdown"
    );
  });
});

function expectedToStringValue(): string {
  return `- name: parent
  href: parentHref
  topicHref: parentTopicHef
  items:
  - name: test1
    href: testHref1
    topicHref: testTopicHref1
  - name: test2
    href: testHref3
    topicHref: testTopicHref1
`;
}

function expectedToStringLevelValue(): string {
  return `  - name: parent
    href: parentHref
    topicHref: parentTopicHef
    items:
    - name: test1
      href: testHref1
      topicHref: testTopicHref1
    - name: test2
      href: testHref3
      topicHref: testTopicHref1
`;
}

function expectedArrayToStringValue(): string {
  return `- name: test1
  href: testHref1
  topicHref: testTopicHref1
- name: test2
  href: testHref3
  topicHref: testTopicHref1
`;
}
