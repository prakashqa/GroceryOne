/**
 * Application Configuration
 */

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'groceryone',
    ssl: process.env.DB_SSL === 'true',
    // Force TypeORM schema sync regardless of NODE_ENV. Used by the offline
    // desktop build so the embedded Postgres builds its schema on first run.
    // Unset in the cloud → falls back to the dev/test-only default.
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true',
    // Desktop/offline mode: skip Redis entirely (in-memory token blacklist,
    // no subscription cache). Avoids the 3s connect timeout + error spam when
    // there is no Redis server. Cloud leaves this unset → real Redis.
    disabled: process.env.REDIS_DISABLED === 'true',
  },

  // Subscription enforcement (the 402-on-expiry middleware). Cloud keeps it on.
  // The offline desktop disables it — licensing is enforced offline in Electron.
  subscriptionEnforced: process.env.SUBSCRIPTION_ENFORCED !== 'false',

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
});
