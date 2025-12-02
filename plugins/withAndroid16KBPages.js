const {
  withGradleProperties,
  withAndroidStyles,
} = require('expo/config-plugins')

function withAndroidTargetSdk35(config) {
  // Set target SDK to 35
  config = withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'android.targetSdkVersion',
      value: '35',
    })
    return config
  })

  // Set status bar to opaque with color
  config = withAndroidStyles(config, (config) => {
    const styles = config.modResults

    // Find the AppTheme style
    const appTheme = styles.resources.style.find(
      (style) => style.$.name === 'AppTheme'
    )

    if (appTheme) {
      // Remove existing statusBarColor and windowTranslucentStatus if present
      appTheme.item = appTheme.item.filter(
        (item) =>
          item.$.name !== 'android:statusBarColor' &&
          item.$.name !== 'android:windowTranslucentStatus' &&
          item.$.name !== 'android:windowLightStatusBar'
      )

      // Add opaque status bar with #4f9eaf color
      appTheme.item.push({
        $: { name: 'android:statusBarColor' },
        _: '#4f9eaf',
      })
      appTheme.item.push({
        $: { name: 'android:windowTranslucentStatus' },
        _: 'false',
      })
      appTheme.item.push({
        $: { name: 'android:windowLightStatusBar' },
        _: 'false',
      })
    }

    return config
  })

  return config
}

module.exports = withAndroidTargetSdk35
