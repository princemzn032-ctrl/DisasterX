import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Please check the submitted information',
      errors: Object.fromEntries(errors.array().map(({ path, msg }) => [path, msg]))
    });
  }
  next();
};
