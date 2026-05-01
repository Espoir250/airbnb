import { Request } from "express";

export const getFirstValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return getFirstValue(value[0]);
  return undefined;
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(getFirstValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getPagination = (req: Request) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = toPositiveInt(req.query.limit, 10);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const getTotalPages = (total: number, limit: number): number =>
  Math.ceil(total / limit);
