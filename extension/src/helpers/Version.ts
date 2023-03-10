import * as semver from "semver";

export function eq(v1: string, v2: string): boolean {
  v1 = versionToSemver(v1);
  v2 = versionToSemver(v2);
  return semver.eq(v1, v2);
}
export function gt(v1: string, v2: string): boolean {
  v1 = versionToSemver(v1);
  v2 = versionToSemver(v2);
  return semver.gt(v1, v2);
}

export function lt(v1: string, v2: string): boolean {
  v1 = versionToSemver(v1);
  v2 = versionToSemver(v2);
  return semver.lt(v1, v2);
}

function versionToSemver(v: string): string {
  const parts = v.split(".");
  if (parts.length < 4) {
    return v;
  }
  if (parts.length > 4) {
    throw new Error("Only versions with four digits is allowed.");
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
}
