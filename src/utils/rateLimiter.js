const redis = require("../config/redis");

const MAX_ATTEMPTS = 2;
const BLOCK_TIME = 15 * 60; // 15 minutes in seconds

const getKey = (prefix, email) =>
  `${prefix}:${email.toLowerCase().trim()}`;

const checkLimit = async (prefix, email) => {
  const key = getKey(prefix, email);
  const attempts = await redis.get(key);

  if (attempts && attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Try again later.");
  }
};

const increment = async (prefix, email) => {
  const key = getKey(prefix, email);

  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, BLOCK_TIME);
  }
};

const clear = async (prefix, email) => {
  const key = getKey(prefix, email);
  await redis.del(key);
};

module.exports = { checkLimit, increment, clear };
