const { createRequestHandler } = require('expo-server/adapter/vercel')
const path = require('path')

module.exports = createRequestHandler({
  // 指向 expo export 生成的服务端构建目录
  build: path.join(__dirname, '../dist/server'),
})
