const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

// Matches the Groovy Android template used by this project's Expo SDK.
module.exports = function withAndroidReleaseOptimization(config) {
  config = withGradleProperties(config, (config) => {
    for (const key of [
      'android.enableMinifyInReleaseBuilds',
      'android.enableShrinkResourcesInReleaseBuilds',
    ]) {
      config.modResults = config.modResults.filter(
        (entry) => entry.type !== 'property' || entry.key !== key
      );
      config.modResults.push({ type: 'property', key, value: 'true' });
    }
    return config;
  });

  return withAppBuildGradle(config, (config) => {
    const defaultRules = /getDefaultProguardFile\((["'])proguard-android(?:-optimize)?\.txt\1\)/g;
    if (config.modResults.language !== 'groovy' || !defaultRules.test(config.modResults.contents)) {
      throw new Error('Android release optimization: unsupported Gradle template.');
    }
    config.modResults.contents = config.modResults.contents.replace(
      defaultRules,
      'getDefaultProguardFile("proguard-android-optimize.txt")'
    );
    return config;
  });
};
