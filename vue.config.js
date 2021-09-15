process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  runtimeCompiler: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/webview/'
    : '/'
}
