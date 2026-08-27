import { Prisma } from "../../generated/prisma/client";

export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  const converted = toNestedPrismaJson(value);
  if (converted === null) throw new TypeError("Prisma JSON fields require Prisma.JsonNull for top-level null");
  return converted;
}

function toNestedPrismaJson(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Prisma JSON numbers must be finite");
    return value;
  }
  if (Array.isArray(value)) return value.map(item => toNestedPrismaJson(item));
  if (typeof value === "object") {
    const result: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) result[key] = toNestedPrismaJson(item);
    }
    return result;
  }
  throw new TypeError(`Unsupported Prisma JSON value: ${typeof value}`);
}

export function jsonObjectOrEmpty(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value));
}
