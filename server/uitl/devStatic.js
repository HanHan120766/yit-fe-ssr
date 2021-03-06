const axios = require('axios')
const MemoryFs = require('memory-fs')
const webpack = require('webpack')
const reactDomServer = require('react-dom/server')
const path = require('path')
const mfs = new MemoryFs

const serverConfig = require('../../build/webpack.config.server')
const devServerConfig = require('../../build/decServerConfig')

const webpackCompiler = webpack(serverConfig)
let serverBundle

const getTemplate = () => {
  const fetchUrl = `${devServerConfig.publicPath}index.html`
  return new Promise((resolve, reject) => {
    axios.get(fetchUrl)
      .then(res => {
        resolve(res.data)
      })
      .catch(reject)
  })
}
webpackCompiler.outputFileSystem = mfs
webpackCompiler.watch({}, (err, stats) => {
  if (err) throw err
  stats = stats.toJson()
  stats.errors.forEach(err => console.error(err))
  stats.warnings.forEach(warn => console.warn(warn))
  const bundlePath = path.join(serverConfig.output.path, serverConfig.output.filename)
  const bundle = mfs.readFileSync(bundlePath, 'utf-8')
  serverBundle = eval(bundle).default // eslint-disable-line
})

module.exports = (app) => {
  app.use(async (ctx, next) => {
    const template = await getTemplate()
    const content = reactDomServer.renderToString(serverBundle)
    ctx.body = template.replace('<!-- app -->', content)
    next()
  })
}
