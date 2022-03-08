const http = require('http');
const url = require('url');

console.log(chalk);
let server = new http.Server();
let port = 8879;

server.listen(port, () => {
    console.log(`HTTP中间人代理启动成功，端口：${port}`);
});

server.on('request', (req) => {
  console.log('request', req.url);
})

server.on('connect', (req) => {
  console.log('connect', req.url);
})

// server.on('connection', (req) => {
//   console.log('connection', req.url);
// })

// server.on('upgrade', (req) => {
//   console.log('upgrade', req.url);
// })