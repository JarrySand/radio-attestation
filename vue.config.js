const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "buffer": require.resolve("buffer/")
      }
    }
  },
  chainWebpack: config => {
    config.plugin('provide').use(require('webpack').ProvidePlugin, [{
      Buffer: ['buffer', 'Buffer']
    }])
  }
});
