const CopyPlugin = require('copy-webpack-plugin')

process.env.VUE_APP_VERSION = require('./package.json').version
process.env.VUE_APP_BUILD_DATE = new Date().toUTCString()

module.exports = {
  runtimeCompiler: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/webview/'
    : '/',
  configureWebpack: {
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: 'src/configuration.json',
            to: 'configuration.json',
            transform (content, absoluteFrom) {
              const config = JSON.parse(content.toString())
              config.backend = process.env.VUE_APP_METRICQ_BACKEND
              if (process.env.VUE_APP_METRICQ_BACKEND_AUTH !== undefined) {
                const [user, password] = process.env.VUE_APP_METRICQ_BACKEND_AUTH.split(':')
                config.user = user
                config.password = password
              }
              return JSON.stringify(config)
            }
          }
        ]
      })
    ]
  }
}
