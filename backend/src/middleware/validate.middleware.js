const ApiError = require('../utils/ApiError');

/**
 * validate({ body: zodSchema, params: zodSchema, query: zodSchema })
 * Parses and replaces req.body/params/query with the validated (and
 * type-coerced) data so downstream code never has to re-validate.
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      next(ApiError.badRequest('Validation failed', err.errors || err.message));
    }
  };
}

module.exports = { validate };
