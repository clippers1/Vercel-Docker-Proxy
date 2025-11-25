// Vercel Serverless Function (Node.js runtime)
// 这个版本使用 Node.js runtime 而不是 Edge runtime,以更好地处理 Content-Length

const https = require('https');
const http = require('http');

// Docker镜像仓库主机地址
let hub_host = 'registry-1.docker.io';
// Docker认证服务器地址
const auth_url = 'https://auth.docker.io';

let 屏蔽爬虫UA = ['netcraft'];

// 根据主机名选择对应的上游地址
function routeByHosts(host) {
    const routes = {
        "quay": "quay.io",
        "gcr": "gcr.io",
        "k8s-gcr": "k8s.gcr.io",
        "k8s": "registry.k8s.io",
        "ghcr": "ghcr.io",
        "cloudsmith": "docker.cloudsmith.io",
        "nvcr": "nvcr.io",
        "test": "registry-1.docker.io",
    };

    if (host in routes) return [routes[host], false];
    else return [hub_host, true];
}

async function ADD(envadd) {
    var addtext = envadd.replace(/[\t |"'\r\n]+/g, ',').replace(/,+/g, ',');
    if (addtext.charAt(0) == ',') addtext = addtext.slice(1);
    if (addtext.charAt(addtext.length - 1) == ',') addtext = addtext.slice(0, addtext.length - 1);
    const add = addtext.split(',');
    return add;
}

module.exports = async (req, res) => {
    try {
        const env = process.env;
        const url = new URL(req.url, `https://${req.headers.host}`);

        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        if (env.UA) 屏蔽爬虫UA = 屏蔽爬虫UA.concat(await ADD(env.UA));

        const ns = url.searchParams.get('ns');
        const hostname = url.searchParams.get('hubhost') || req.headers.host;
        const hostTop = hostname.split('.')[0];

        let checkHost;
        if (ns) {
            if (ns === 'docker.io') {
                hub_host = 'registry-1.docker.io';
            } else {
                hub_host = ns;
            }
        } else {
            checkHost = routeByHosts(hostTop);
            hub_host = checkHost[0];
        }

        const fakePage = checkHost ? checkHost[1] : false;

        // 简单的首页处理
        if (url.pathname === '/' && userAgent.includes('mozilla')) {
            if (env.URL302) {
                res.writeHead(302, { 'Location': env.URL302 });
                return res.end();
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end('<h1>Docker Proxy</h1>');
        }

        // 处理 token 请求
        if (url.pathname.includes('/token')) {
            const tokenUrl = `${auth_url}${url.pathname}${url.search}`;
            const tokenRes = await fetch(tokenUrl, {
                headers: {
                    'User-Agent': req.headers['user-agent'] || '',
                    'Accept': req.headers['accept'] || '*/*',
                }
            });
            const tokenData = await tokenRes.text();
            res.writeHead(tokenRes.status, {
                'Content-Type': tokenRes.headers.get('content-type') || 'application/json',
            });
            return res.end(tokenData);
        }

        // 构造上游请求 URL
        const upstreamUrl = `https://${hub_host}${url.pathname}${url.search}`;

        // 使用 Node.js 原生 https 模块来保证 Content-Length 正确传递
        const upstreamReq = https.request(upstreamUrl, {
            method: req.method,
            headers: {
                'Host': hub_host,
                'User-Agent': req.headers['user-agent'] || 'Docker-Client',
                'Accept': req.headers['accept'] || '*/*',
                'Accept-Encoding': 'identity', // 强制不压缩
                'Authorization': req.headers['authorization'] || '',
                'Connection': 'keep-alive',
            }
        }, (upstreamRes) => {
            // 复制响应头,确保 Content-Length 被保留
            const responseHeaders = {};
            Object.keys(upstreamRes.headers).forEach(key => {
                if (key.toLowerCase() !== 'transfer-encoding') { // 移除 transfer-encoding
                    responseHeaders[key] = upstreamRes.headers[key];
                }
            });

            // 确保 Content-Length 存在
            if (upstreamRes.headers['content-length']) {
                responseHeaders['Content-Length'] = upstreamRes.headers['content-length'];
            }

            // 添加 CORS 头
            responseHeaders['Access-Control-Allow-Origin'] = '*';
            responseHeaders['Access-Control-Expose-Headers'] = '*';

            res.writeHead(upstreamRes.statusCode, responseHeaders);

            // 直接管道传输,不做任何处理
            upstreamRes.pipe(res);
        });

        upstreamReq.on('error', (error) => {
            console.error('Upstream request error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Proxy error: ' + error.message);
        });

        // 如果有请求体,传递给上游
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            req.pipe(upstreamReq);
        } else {
            upstreamReq.end();
        }

    } catch (error) {
        console.error('Handler error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error: ' + error.message);
    }
};
