export class YamlItem {
  name: string;
  href: string;
  topicHref?: string;
  items?: YamlItem[];
  constructor({
    name,
    href,
    topicHref,
    items,
  }: {
    name: string;
    href: string;
    topicHref?: string;
    items?: YamlItem[];
  }) {
    this.name = name;
    this.href = href;
    this.topicHref = topicHref;
    this.items = items;
  }

  public toString(level = 0): string {
    const indentation = "".padEnd(level * 2);
    let result = "";
    result += `${indentation}- name: ${this.name}\n`;
    result += `${indentation}  href: ${this.href}\n`;
    if (this.topicHref !== undefined) {
      result += `${indentation}  topicHref: ${this.topicHref}\n`;
    }
    if (this.items) {
      result += `${indentation}  items:\n`;
      this.items.forEach((item) => {
        result += item.toString(level + 1);
      });
    }
    return result;
  }
  public static arrayToString(items: YamlItem[]): string {
    let result = "";
    items.forEach((item) => {
      result += item.toString();
    });
    return result;
  }

  public static arrayToMarkdown(items: YamlItem[], maxDepth: number): string {
    let result = "";
    items.forEach((item) => {
      result += item.toMarkdown(0, maxDepth);
    });
    return result;
  }
  public toMarkdown(level: number, maxDepth: number): string {
    if (maxDepth === level) {
      return "";
    }
    const indentation = "".padEnd(level + 2, "#");
    let result = "";

    result += `${indentation} [${this.name}](${
      this.href.endsWith(".md") ? this.href : this.topicHref
    })\n`;
    if (this.items) {
      this.items.forEach((item) => {
        result += item.toMarkdown(level + 1, maxDepth);
      });
    }
    return result;
  }
}
