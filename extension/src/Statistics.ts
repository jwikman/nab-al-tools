import { ALObject } from "./ALObject/ALElementTypes";
import { ALProcedure } from "./ALObject/ALProcedure";
import {
  ALAccessModifier,
  ALControlType,
  ALEventType,
  ALObjectType,
} from "./ALObject/Enums";
import { logger } from "./Logging/LogHelper";

export class ALStatistics implements IStatistics {
  objects: IObjectStatistics;
  code: ICodeLineStatistics;
  procedures: IProceduresStatistics;
  events: IEventStatistics;
  private includeZeros = false;

  constructor() {
    this.objects = {
      total: 0,
      perAccessLevel: new Map<ALAccessModifier, number>(),
      perType: new Map<ALObjectType, number>(),
    };
    this.code = {
      total: 0,
      pureCodeLines: 0,
    };
    this.procedures = {
      total: 0,
      perAccessLevel: new Map<ALAccessModifier, number>(),
    };
    this.events = {
      total: 0,
      perAccessLevel: new Map<ALAccessModifier, number>(),
      perType: new Map<ALEventType, number>(),
    };
  }
  outputToLog(includeZeros = false): void {
    this.includeZeros = includeZeros;
    logger.log();
    logger.log("-= STATISTICS =-");
    logger.log("-= Objects =-");
    this.write("Total number of objects", this.objects.total);
    this.objects.perAccessLevel.forEach((value, key) => {
      this.write(`${key} objects`, value);
    });
    this.objects.perType.forEach((value, key) => {
      this.write(`${key}`, value);
    });

    logger.log("-= Procedures =-");
    this.write("Total number of procedures", this.procedures.total);
    this.procedures.perAccessLevel.forEach((value, key) => {
      this.write(`${key} procedure`, value);
    });

    logger.log("-= Events =-");
    this.write("Total number of events", this.events.total);
    this.events.perAccessLevel.forEach((value, key) => {
      this.write(`${key} events`, value);
    });
    this.events.perType.forEach((value, key) => {
      this.write(`${key}`, value);
    });

    logger.log("-= Code =-");
    this.write("Total number lines of code", this.code.total);
    this.write("Code lines", this.code.pureCodeLines);
  }

  private write(text: string, value: number, isPercent = false): void {
    if (!this.includeZeros && value === 0) {
      return;
    }
    logger.log(`${text}: ${value}${isPercent ? "%" : ""}`);
  }

  static getStatistics(objects: ALObject[] | ALObject): ALStatistics {
    const stat = new ALStatistics();
    let statObjects = [];
    if (objects instanceof ALObject) {
      statObjects.push(objects);
    } else {
      statObjects = objects;
    }

    /* Objects */
    stat.objects.total = statObjects.length;

    for (const objectType in ALObjectType) {
      const count = statObjects.filter(
        (obj) =>
          obj.objectType.toLowerCase() ===
          (objectType as ALObjectType).toLowerCase()
      ).length;
      if (count > 0) {
        stat.objects.perType.set(objectType as ALObjectType, count);
      }
    }

    for (const accessLevel in ALAccessModifier) {
      const count = statObjects.filter(
        (obj) =>
          obj.access.toLowerCase() ===
          (accessLevel as ALAccessModifier).toLowerCase()
      ).length;
      if (count > 0) {
        stat.procedures.perAccessLevel.set(
          accessLevel as ALAccessModifier,
          count
        );
      }
    }

    /* Procedures */
    const allProcedures = statObjects
      .map((obj) => obj.getAllControls(ALControlType.procedure))
      .flat() as ALProcedure[];

    const procedures = allProcedures.filter((proc) => !proc.event);
    stat.procedures.total = procedures.length;
    for (const accessLevel in ALAccessModifier) {
      const count = procedures.filter(
        (proc) =>
          proc.access.toLowerCase() ===
          (accessLevel as ALAccessModifier).toLowerCase()
      ).length;
      if (count > 0) {
        stat.procedures.perAccessLevel.set(
          accessLevel as ALAccessModifier,
          count
        );
      }
    }

    /* Events */
    const events = allProcedures.filter((proc) => proc.event);
    stat.events.total = events.length;
    for (const accessLevel in ALAccessModifier) {
      const count = events.filter(
        (event) =>
          event.access.toLowerCase() ===
          (accessLevel as ALAccessModifier).toLowerCase()
      ).length;
      if (count > 0) {
        stat.events.perAccessLevel.set(accessLevel as ALAccessModifier, count);
      }
    }
    for (const eventType in ALEventType) {
      const count = events.filter((event) =>
        event.isEventType(eventType as ALEventType)
      ).length;
      if (count > 0) {
        stat.events.perType.set(eventType as ALEventType, count);
      }
    }

    /* Code */
    const allCodeLines = statObjects.map((obj) => obj.alCodeLines).flat();
    stat.code.total = allCodeLines.length;
    let codeCount = 0;
    allProcedures.map(
      (proc) => (codeCount += proc.endLineIndex - proc.startLineIndex)
    );
    stat.code.pureCodeLines = codeCount;

    return stat;
  }
}

export interface IStatistics {
  objects: IObjectStatistics;
  code: ICodeLineStatistics;
  procedures: IProceduresStatistics;
  events: IEventStatistics;
}
interface IObjectStatistics {
  total: number;
  perType: Map<ALObjectType, number>;
  perAccessLevel: Map<ALAccessModifier, number>;
}
interface ICodeLineStatistics {
  total: number;
  pureCodeLines: number;
}
interface IProceduresStatistics {
  total: number;
  perAccessLevel: Map<ALAccessModifier, number>;
}
interface IEventStatistics {
  total: number;
  perType: Map<ALEventType, number>;
  perAccessLevel: Map<ALAccessModifier, number>;
}
