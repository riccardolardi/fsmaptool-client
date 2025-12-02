const { withGradleProperties } = require('expo/config-plugins')

function withAndroidTargetSdk35(config) {
  return withGradleProperties(config, (config) => {
    // Target API level 35 (Android 15)
    config.modResults.push({
      type: 'property',
      key: 'android.targetSdkVersion',
      value: '35',
    })
    return config
  })
}

module.exports = withAndroidTargetSdk35
