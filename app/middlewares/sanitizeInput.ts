import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

type Primitive = string | number | boolean | null | undefined;
type Sanitizable = Primitive | Sanitizable[] | Record<string, any>;

const sanitizeValue = (value: Sanitizable): Sanitizable => {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (typeof value === 'object' && value !== null) return sanitizeObject(value);
  return value;
};

const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  for (const key in obj) {
    sanitized[key] = sanitizeValue(obj[key]);
  }
  return sanitized;
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  req.body = sanitizeObject(req.body || {});
  req.query = sanitizeObject(req.query || {});
  req.params = sanitizeObject(req.params || {});
  next();
};
