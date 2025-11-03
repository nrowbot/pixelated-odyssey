import { z } from "zod";

const durationFilterEnum = z.enum(["short", "medium", "long"]).optional();
const sortEnum = z.enum(["relevance", "uploadDate", "viewCount", "duration"]).optional();

const coerceNumber = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return parsed;
  }
  return value;
};

const optionalPositiveIntParam = z.preprocess(coerceNumber, z.number().int().min(1).optional());
const optionalNonNegativeIntParam = z.preprocess(coerceNumber, z.number().int().min(0).optional());

const optionalDateStringParam = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}, z.string().refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date").optional());

export const createVideoSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    duration: z.number().int().nonnegative(),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).optional(),
    uploadDate: optionalDateStringParam,
    uploaderName: z.string().min(1),
    fileSize: z.number().int().nonnegative(),
    resolution: z.string().min(1)
  })
});

export const updateVideoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/)
  }),
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      url: z.string().url().optional(),
      thumbnailUrl: z.string().url().optional(),
      duration: z.number().int().nonnegative().optional(),
      category: z.string().min(1).optional(),
      tags: z.array(z.string().min(1)).optional(),
      uploadDate: optionalDateStringParam,
      uploaderName: z.string().min(1).optional(),
      fileSize: z.number().int().nonnegative().optional(),
      resolution: z.string().min(1).optional()
    })
    .strict()
});

export const videoIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/)
  })
});

export const listVideosSchema = z.object({
  query: z.object({
    page: optionalPositiveIntParam,
    pageSize: optionalPositiveIntParam
  })
});

export const searchVideosSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    duration: durationFilterEnum,
    minDuration: optionalNonNegativeIntParam,
    maxDuration: optionalNonNegativeIntParam,
    uploadDateFrom: optionalDateStringParam,
    uploadDateTo: optionalDateStringParam,
    resolution: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    sort: sortEnum,
    page: optionalPositiveIntParam,
    pageSize: optionalPositiveIntParam,
    within: z.string().optional(),
    savedSearchId: optionalPositiveIntParam
  })
});

export const createSavedSearchSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    query: z.string().max(200).optional(),
    filters: z.record(z.unknown()).optional()
  })
});
