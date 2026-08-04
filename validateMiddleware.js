// =====================================================================
// Input validation helpers
// ---------------------------------------------------------------------
// Lightweight, dependency-free validation used by controllers to reject
// bad or malformed payloads before they hit the database.
// =====================================================================

// A small validator builder. `rules` is an object mapping field names to
// validator functions that return an error string or null.
function validate(schema, data) {
  const errors = {};
  for (const [field, checks] of Object.entries(schema)) {
    for (const check of checks) {
      const message = check(data[field]);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return Object.keys(errors).length ? errors : null;
}

// ---- Reusable validator functions ----
const isRequired = (field = 'This field') => (v) =>
  v === undefined || v === null || String(v).trim() === ''
    ? `${field} is required`
    : null;

const isString = (field = 'This field', max = 10000) => (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') return `${field} must be a string`;
  if (v.length > max) return `${field} must be ${max} characters or fewer`;
  return null;
};

const isBoolean = (field = 'This field') => (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'boolean' && v !== 'true' && v !== 'false') {
    return `${field} must be a boolean`;
  }
  return null;
};

const isInteger = (field = 'This field', min = 0) => (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min) return `${field} must be an integer >= ${min}`;
  return null;
};

const isPositiveNumber = (field = 'This field', max = 100) => (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0 || n > max) return `${field} must be a number between 0 and ${max}`;
  return null;
};

// UUID-ish check (accepts a bare 8-36 char id string).
const isId = (field = 'Id') => (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string' || v.length < 8 || v.length > 64) {
    return `${field} must be a valid id`;
  }
  return null;
};

module.exports = {
  validate,
  isRequired,
  isString,
  isBoolean,
  isInteger,
  isPositiveNumber,
  isId,
};
