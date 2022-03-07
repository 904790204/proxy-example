const path = require('path')
const CertManager = require('node-easy-cert');

// https://www.npmjs.com/package/node-easy-cert
// node-easy-cert文档
const options = {
  rootDirPath: path.resolve(__dirname, './cert'),
  inMemory: false,
  defaultCertAttrs: [
    { name: 'countryName', value: 'CN' },
    { name: 'organizationName', value: 'KimProxy' },
    { shortName: 'ST', value: 'SH' },
    { shortName: 'OU', value: 'KimProxy SSL Proxy' }
  ]
}

const crtMgr = new CertManager(options);

const {
  getCertificate,
} = crtMgr

module.exports = {
  // 生成域名证书
  getHostCertificate: (hostname) => new Promise((reslove, reject) => {
    getCertificate(hostname, (error, keyContent, crtContent) => {
      // 证书未创建
      if (error === 'ROOT_CA_NOT_EXISTS') {
        reject(error)
      }
      reslove({
        key:keyContent, 
        cert: crtContent
      })
    })
  }),
}