/**
 * Expo App Configuration
 * Loads environment variables from .env and extends app.json.
 *
 * IMPORTANT: Only override app.json defaults when env vars are actually set.
 * In EAS builds, .env is not available (gitignored), so process.env values
 * are undefined. Setting `key: undefined` would overwrite the hardcoded
 * app.json defaults, causing "API key is required" errors in production.
 */

require('dotenv').config();

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      ...(process.env.GOOGLE_CLOUD_VISION_API_KEY
        ? { googleVisionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY }
        : {}),
      ...(process.env.LOCAL_API_IP
        ? { localApiIp: process.env.LOCAL_API_IP }
        : {}),
    },
  };
};
