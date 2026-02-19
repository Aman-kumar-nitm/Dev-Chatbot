const normalizeEmail = (email) =>
  (email || "").toLowerCase().trim();

module.exports = normalizeEmail;
