import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

interface IYamlItem {
  name?: string;
  href?: string;
  topicHref?: string;
  items?: IYamlItem[];
}

export class YamlItem implements IYamlItem {
  name?: string;
  href?: string;
  topicHref?: string;
  items?: YamlItem[];
  constructor({
    name,
    href,
    topicHref,
    items,
  }: {
    name?: string;
    href?: string;
    topicHref?: string;
    items?: IYamlItem[];
  }) {
    this.name = name;
    this.href = href?.replace(/\\/g, "/");
    this.topicHref = topicHref;
    if (items) {
      this.items = [];
      for (const item of items) {
        this.items.push(
          new YamlItem({
            name: item.name,
            href: item.href,
            topicHref: item.topicHref,
            items: item.items,
          })
        );
      }
    }
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
  public static yamlItemArrayFromFile(
    filePath: string,
    followLinks = false
  ): YamlItem[] {
    const items = <IYamlItem[]>yaml.load(fs.readFileSync(filePath, "utf8"));
    if (followLinks) {
      for (const subItem of items) {
        YamlItem.checkForLinks(subItem, filePath);
      }
    }
    const returnArray = [];
    for (const item of items) {
      returnArray.push(
        new YamlItem({
          name: item.name,
          href: item.href,
          topicHref: item.topicHref,
          items: item.items,
        })
      );
    }
    return returnArray;
  }

  private static yamlItemsFromFile(
    filePath: string,
    relativePath: string
  ): IYamlItem[] {
    const item = <IYamlItem>yaml.load(fs.readFileSync(filePath, "utf8"));
    if (item.items) {
      for (const subItem of item.items) {
        if (subItem.href) {
          subItem.href = path.join(relativePath, subItem.href);
        }
        YamlItem.checkForLinks(subItem, filePath, relativePath);
      }
    }
    return item.items ?? [];
  }
  private static checkForLinks(
    item: IYamlItem,
    filePath: string,
    relativePath = ""
  ): void {
    if (item.items) {
      for (const subItem of item.items) {
        YamlItem.checkForLinks(subItem, filePath);
      }
    }
    if (item.href?.toLowerCase().endsWith(".yml")) {
      const ymlPath = path.join(path.dirname(filePath), item.href);
      item.items = YamlItem.yamlItemsFromFile(
        ymlPath,
        path.join(relativePath, path.dirname(item.href))
      );
      if (item.topicHref) {
        item.href = path.join(relativePath, item.topicHref);
        item.topicHref = undefined;
      }
    }
  }

  public static arrayToString(items: YamlItem[]): string {
    let result = "";
    items.forEach((item) => {
      result += item.toString();
    });
    return result;
  }

  public static arrayToMarkdown(
    items: YamlItem[],
    maxDepth: number,
    relativePath = ""
  ): string {
    let result = "";
    for (const item of items) {
      result += (item as YamlItem).toMarkdown(0, maxDepth, relativePath);
    }
    return result;
  }
  public toMarkdown(
    level: number,
    maxDepth: number,
    relativePath = ""
  ): string {
    if (maxDepth === level) {
      return "";
    }
    const indentation = "".padEnd(level + 2, "#");
    let result = "";

    let link = (this.href?.endsWith(".md")
      ? this.href
      : this.topicHref) as string;
    if (relativePath !== "") {
      link = path.join(relativePath, link).replace(/\\/g, "/");
    }
    result += `${indentation} [${this.name}](${link})\n`;
    if (this.items) {
      this.items.forEach((item) => {
        result += item.toMarkdown(level + 1, maxDepth, relativePath);
      });
    }
    return result;
  }
}
