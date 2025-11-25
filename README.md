# 🐳 Vercel-Docker-Proxy：Docker 仓库镜像代理工具

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/goukey/Vercel-Docker-Proxy)

这个项目基于 [CF-Workers-docker.io](https://github.com/cmliu/CF-Workers-docker.io) 改造,利用 **Vercel Serverless Functions** 实现 Docker 官方镜像仓库的代理,解决国内访问 Docker Hub 受限和速度慢的问题。

## ✨ 特性

- 🚀 **全球加速** - 利用 Vercel 全球 CDN 网络实现毫秒级响应
- 🎨 **美观界面** - 现代化的搜索界面,支持在线搜索 Docker 镜像
- 🔍 **搜索代理** - 代理 Docker Hub 搜索页面,无需跳转到官网
- 🛡️ **稳定可靠** - 使用 Node.js Serverless Functions,完美处理流式传输
- 🆓 **完全免费** - 基于 Vercel 免费套餐,无需服务器

> [!WARNING]
> 请勿滥用 Vercel 资源。本项目仅供学习和个人使用。

## 🚀 快速部署

### 方式一：一键部署到 Vercel

点击下方按钮一键部署:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/goukey/Vercel-Docker-Proxy)

### 方式二：手动部署

1. **Fork 本仓库** 到您的 GitHub 账号
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 **New Project** → **Import Git Repository**
4. 选择您 Fork 的仓库
5. 点击 **Deploy** (无需修改任何配置)

部署完成后,您会获得一个类似 `your-project.vercel.app` 的域名。

## 🌐 自定义域名 (可选)

使用自定义域名可以让您的代理地址更短、更专业。

### 1. 在 Vercel 中添加域名

1. 进入项目 → **Settings** → **Domains**
2. 输入您的域名 (例如 `docker.yourdomain.com`)
3. 点击 **Add**

### 2. 配置 DNS 记录

在您的域名服务商 (如 Cloudflare、阿里云、腾讯云) 添加以下记录:

**推荐方式 - CNAME 记录:**
```
类型: CNAME
名称: docker (或您想要的子域名)
目标: cname.vercel-dns.com
TTL: 自动
```

**备选方式 - A 记录:**
```
类型: A
名称: docker
值: 76.76.21.21
TTL: 自动
```

### 3. 等待生效

- DNS 生效通常需要几分钟到几小时
- Vercel 会自动为您的域名配置免费 SSL 证书
- 配置完成后即可使用自定义域名访问

## ⚙️ 使用方法

假设您的域名为：`docker.yourdomain.com` (或 `your-project.vercel.app`)

### 方式一：直接拉取镜像

在镜像名称前添加您的域名:

```bash
# 拉取官方镜像
docker pull docker.yourdomain.com/library/nginx:latest
docker pull docker.yourdomain.com/library/mysql:8.0
docker pull docker.yourdomain.com/library/redis:alpine

# 拉取第三方镜像
docker pull docker.yourdomain.com/stilleshan/frpc:latest
```

### 方式二：配置镜像加速 (推荐)

一次配置,永久生效:

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://docker.yourdomain.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

配置后,直接使用原始命令即可:

```bash
docker pull nginx:latest
docker pull mysql:8.0
```

### 方式三：在线搜索镜像

访问 `https://docker.yourdomain.com`,在搜索框中输入镜像名称,即可在线搜索和浏览 Docker Hub 镜像。

## 🔧 环境变量 (可选)

在 Vercel 项目的 **Settings** → **Environment Variables** 中配置:

| 变量名 | 示例 | 必填 | 说明 |
|--------|------|------|------|
| `URL302` | `https://github.com/yourusername` | ❌ | 主页 302 重定向地址 |
| `URL` | `nginx` 或 `https://example.com` | ❌ | 主页伪装 (设为 `nginx` 则显示 nginx 默认页面) |
| `UA` | `netcraft` | ❌ | 屏蔽特定 User-Agent,多个值用空格或换行分隔 |

> **注意**: 
> - 如果设置了 `URL302`,访问首页会直接跳转,不会显示搜索界面
> - 如果设置了 `URL`,访问首页会显示伪装页面
> - 如果都不设置,则显示默认的搜索界面

## � 支持的镜像仓库

本代理支持以下 Docker 镜像仓库:

- ✅ Docker Hub (`docker.io`)
- ✅ Google Container Registry (`gcr.io`)
- ✅ Kubernetes Registry (`registry.k8s.io`)
- ✅ GitHub Container Registry (`ghcr.io`)
- ✅ Quay (`quay.io`)
- ✅ Cloudsmith (`docker.cloudsmith.io`)
- ✅ NVIDIA GPU Cloud (`nvcr.io`)

## 🔍 搜索功能

访问您的代理域名首页,可以:
- 🔎 搜索 Docker Hub 上的镜像
- 📄 查看镜像详情和标签
- 📋 获取拉取命令

所有搜索结果都通过您的代理显示,无需访问 Docker Hub 官网。

## 🛠️ 技术架构

- **运行时**: Vercel Serverless Functions (Node.js)
- **代理方式**: 使用 Node.js 原生 `https` 模块进行流式代理
- **特殊处理**: 强制 `Accept-Encoding: identity` 确保 `Content-Length` 正确传递

## ❓ 常见问题

### 为什么选择 Vercel 而不是 Cloudflare Workers?

Cloudflare Workers 的 IP 可能被 Docker Hub 封禁,导致无法使用。Vercel Serverless Functions 使用不同的 IP 池,更加稳定可靠。

### 拉取镜像时提示 "missing Content-Length" 怎么办?

确保您使用的是最新版本的代码。本项目已通过使用 Node.js Serverless Functions 和强制 `identity` 编码解决了这个问题。

### 可以用于生产环境吗?

本项目基于 Vercel 免费套餐,适合个人和小团队使用。大规模生产环境建议自建镜像仓库或使用商业服务。

### Vercel 免费套餐有限制吗?

Vercel 免费套餐包含:
- 100 GB 带宽/月
- 无限请求次数
- 全球 CDN

对于个人使用完全足够。

## �🙏 鸣谢

- 原项目: [cmliu/CF-Workers-docker.io](https://github.com/cmliu/CF-Workers-docker.io)
- 部署平台: [Vercel](https://vercel.com)

## 📄 许可证

MIT License

---

**⭐ 如果这个项目对您有帮助,请给个 Star!**
