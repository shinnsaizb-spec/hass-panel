module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        {
          module: /node_modules\/@antv/,
        },
      ],
      
    },
  },
  devServer: {
    proxy: {
      '/go2rtc/api/onvif': {
        target: 'http://127.0.0.1:5123',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:5124',
        changeOrigin: true
      },
    }
    // ...
  }
}; 