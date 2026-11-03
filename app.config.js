/* Adds build-time logger credentials from the local environment to Expo runtime config. */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    NEUP_LOGGER_PROJECT_ID: process.env.NEUP_LOGGER_PROJECT_ID,
    NEUP_LOGGER_INGEST_KEY: process.env.NEUP_LOGGER_INGEST_KEY,
  },
});
