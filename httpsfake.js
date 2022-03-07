const url = require('url')
const tls = require('tls')
const net = require('net')
const http = require('http')
const https = require('https')
const certificate = require('./certificate')


let server = new http.Server();
// 启动端口
let port = 8878;
server.listen(port, () => {
  console.log(`HTTP中间人代理启动成功，端口：${port}`);
});
server.on('error', (e) => {
  if (e.code == 'EADDRINUSE') {
    console.error('HTTP中间人代理启动失败！！');
    console.error(`端口：${port}，已被占用。`);
  } else {
    console.error(e);
  }
});

// 创建伪造的服务
const createFakeHttpsServer = (domain, successFun) => {
  const fakeServer = https.createServer({
    SNICallback: (hostname, done) => {
      // 生成证书
      certificate.getHostCertificate(hostname)
        .then((certObj) => {
          try {
            const ctx = tls.createSecureContext({
              key: certObj.key,
              cert: certObj.cert
            })
            done(null, ctx)
          } catch (error) {
            return Promise.reject(error)
          }
        })
        .catch(e => {
          done(e)
        })
    }
  });
  // 监听随机端口，执行回调函数
  fakeServer.listen(0, () => {
    successFun(fakeServer.address().port, fakeServer);
  });
  // 监听发到伪造服务上的请求
  fakeServer.on('request', (req, res) => {
    // 解析客户端请求
    var urlObject = url.parse(req.url);
    let options =  {
        protocol: 'https:',
        hostname: req.headers.host.split(':')[0],
        method: req.method,
        port: req.headers.host.split(':')[1] || 80,
        path: urlObject.path,
        headers: req.headers
    };
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8'});
    res.write(`<html><body>我是伪造的: ${options.protocol}//${options.hostname} 站点</body></html>`)
    res.end();
  });
  // 监听错误
  fakeServer.on('error', (e) => {
    console.error(e);
  });
}

// https的请求通过http隧道方式转发
server.on('connect', (req, cltSocket, head) => {
  const srvUrl = url.parse(`http://${req.url}`);
  const { hostname } = srvUrl
  cltSocket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8');

  // 创建伪造的目标服务
  createFakeHttpsServer(hostname, (port) => {
    // 向目标服务器发起链接
    const srvSocket = net.connect(port, '127.0.0.1', () => {
      srvSocket.write(head);
      srvSocket.pipe(cltSocket);
      cltSocket.pipe(srvSocket);
    });
    srvSocket.on('error', (e) => {
      console.error(e);
      srvSocket.destroy()
    });
  })

  cltSocket.on('error', () => {
    cltSocket.destroy()
  })
});

