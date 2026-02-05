/**
 * Expo App Configuration
 * Loads environment variables from .env and extends app.json
 */

require('dotenv').config();

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      googleVisionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
      localApiIp: process.env.LOCAL_API_IP,
    },
  };
};
