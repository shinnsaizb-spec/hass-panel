// 代理到本地服务时，上游可能随时重置连接（尤其 go2rtc 在 WebRTC 握手期间）。
// 如果不显式接住 socket 的 error 事件，它会冒泡成未捕获异常，把整个 dev server 打崩。
const onError = (name) => (err, req, res) => {
  console.warn(`[proxy ${name}]`, err && err.message);
  try {
    if (res && !res.headersSent && typeof res.writeHead === 'function') {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('upstream unavailable');
    } else if (res && typeof res.end === 'function') {
      res.end();
    }
  } catch (e) {
    /* 已经断开，忽略 */
  }
};

const swallow = (tag) => (proxy) => {
  proxy.on('error', (err) => console.warn(`[${tag}]`, err && err.message));
};

// 这两个值都可以用环境变量覆盖，改了 go2rtc 端口时不用改代码：
//   GO2RTC_TARGET=http://127.0.0.1:5125  代理转发到哪
//   GO2RTC_ORIGIN=http://127.0.0.1:5125  转发时把 Origin 改写成什么
const GO2RTC_TARGET = process.env.GO2RTC_TARGET || 'http://127.0.0.1:5125';

// go2rtc 会校验 Origin 头：必须是它自己的地址，否则 WebSocket 握手直接 403。
// 浏览器经过 dev server（3000）访问时，Origin 是 http://127.0.0.1:3000，
// 不改写的话 WebRTC 信令就建不起来，播放页会一直卡在 loading。
// （Docker 部署不走这里，是 nginx 在做同样的事，见 docker/config/nginx.conf。）
const GO2RTC_ORIGIN = process.env.GO2RTC_ORIGIN || GO2RTC_TARGET;

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
      // go2rtc：本地运行时监听 5125，它的 base_path 本身就是 /go2rtc。
      // 摄像头的 RTSP 流靠它转成浏览器能播的格式，整段前缀都要转发
      // （既包含 /go2rtc/stream.html 播放页，也包含 /go2rtc/api/* 接口）。
      '/go2rtc': {
        target: GO2RTC_TARGET,
        changeOrigin: true,
        ws: true,
        onError: onError('/go2rtc'),
        onProxyReq: (proxyReq) => {
          proxyReq.setHeader('Origin', GO2RTC_ORIGIN);
          proxyReq.on('error', (err) => console.warn('[proxyReq /go2rtc]', err && err.message));
        },
        // WebSocket（WebRTC 信令）走独立的回调，同样要改写 Origin
        onProxyReqWs: (proxyReq) => {
          proxyReq.setHeader('Origin', GO2RTC_ORIGIN);
          proxyReq.on('error', (err) => console.warn('[proxyReqWs /go2rtc]', err && err.message));
        },
        onProxyRes: swallow('proxyRes /go2rtc'),
      },
      '/api': {
        target: 'http://127.0.0.1:5124',
        changeOrigin: true,
        onError: onError('/api'),
        onProxyReq: swallow('proxyReq /api'),
        onProxyRes: swallow('proxyRes /api'),
      },
      // 插件 bundle 静态文件（开发态由后端 StaticFiles 提供，生产由 nginx alias 提供）
      '/plugins': {
        target: 'http://127.0.0.1:5124',
        changeOrigin: true,
        onError: onError('/plugins'),
        onProxyReq: swallow('proxyReq /plugins'),
        onProxyRes: swallow('proxyRes /plugins'),
      },
    },
  },
};
