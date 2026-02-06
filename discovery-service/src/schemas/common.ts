import { z } from 'zod';

/**
 * Express req.query values can be string | string[] | undefined.
 * This helper normalizes arrays to their first element.
 */
export const queryString = z.preprocess((v) => {
  if (Array.isArray(v)) return v[0];
  return v;
}, z.string());

export const queryStringOptional = queryString.optional();

export const queryNumber = z.preprocess((v) => {
  if (Array.isArray(v)) v = v[0];
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return v;
}, z.number());

export const queryNumberOptional = queryNumber.optional();

export const paginationQuerySchema = z.object({
  limit: queryNumberOptional,
  offset: queryNumberOptional,
});
