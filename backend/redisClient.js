const { createClient } = require('redis');

const url = process.env.REDIS_URL || 'redis://redis:6379';

const client = createClient({ url });

client.on('error', err => {
  process.stderr.write(`Redis client error: ${err.message}\n`);
});

async function initRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

module.exports = { client, initRedis };

