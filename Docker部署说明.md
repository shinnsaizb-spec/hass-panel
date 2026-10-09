# Docker 部署说明

> 面向 **NAS / 服务器** 的部署方式。本地直接跑（不用 Docker）见 [`运行说明.md`](./运行说明.md)。
> 一个容器里同时跑 **nginx + FastAPI + go2rtc** 三个进程，对外只需要暴露一个入口端口。

---

## 一、部署前先了解三件事

**① 只有一个入口端口**

| 端口 | 谁 | 用途 |
|---|---|---|
| **5123** | nginx | **唯一入口** —— 面板页面 + 反代 `/api`、`/go2rtc` |
| 5124 | FastAPI | 后端接口（**不用对外暴露**，nginx 内部转发） |
| 5125 / 5126 / 5127 | go2rtc | API / RTSP / WebRTC（**不用对外暴露**，nginx 内部转发） |

所以你只需要记住 **5123**。

**② 数据全部在一个目录里**

容器内固定用 `/config/hass-panel`，挂载出来就是你 NAS 上的一个文件夹：

```
<你的数据目录>/           ← 挂载到容器 /config/hass-panel
├─ user_configs/         面板全部配置（config.json 卡片布局、floorplan.json 户型图…）
├─ upload/               上传的图片 / 视频（背景壁纸、图标、通知图片）
├─ plugins/              插件（每个插件一个子目录）
├─ logs/                 日志
├─ go2rtc.yaml           go2rtc 配置（后端保存摄像头时会自动改写）
└─ hass_panel.db         SQLite 数据库（用户、HA 连接、通知、实体）
```

**备份只需要备份这一个目录**，迁移也是整个目录搬走。

**③ 容器用的是 host 网络**

`network_mode: host` —— 容器直接共用宿主机的网络。这样 go2rtc 的 WebRTC 不用折腾端口映射，摄像头最容易通。

> ⚠️ host 网络在 **Linux / 群晖 / 飞牛 / unRAID** 上都没问题；**Windows / macOS 的 Docker Desktop 支持有限**，这种情况建议直接用 Windows 本地跑（见 `运行说明.md`）。

---

## 二、方式 A：用预构建镜像（推荐，最快）

镜像由 GitHub Actions 自动构建并推到 GHCR，公开可直接拉：

```
ghcr.io/shinnsaizb-spec/hass-panel:latest
```

也可以直接命令行验证一下：

```bash
docker pull ghcr.io/shinnsaizb-spec/hass-panel:latest
```

在 NAS 上建一个目录，放一个 `docker-compose.yml`：

```yaml
services:
  hass-panel:
    image: ghcr.io/shinnsaizb-spec/hass-panel:latest
    container_name: hass-panel
    network_mode: host
    volumes:
      - ./data/hass-panel:/config/hass-panel
    restart: unless-stopped
```

然后：

```bash
docker compose pull
docker compose up -d
docker compose logs -f          # 看启动日志，Ctrl+C 退出查看（不会停容器）
```

浏览器打开 **`http://<NAS的IP>:5123`** 就能看到初始化页面。

> 💡 群晖 / 飞牛的图形界面用户：也可以直接在「容器管理」里搜索/导入镜像，把
> `network_mode` 设为 host、把 `/config/hass-panel` 映射到你的数据目录，效果一样。

---

## 三、方式 B：从源码构建（包含最新改动）

想在镜像里带上本分支的最新代码，就自己构建。

**⚠️ 构建前必须先构建前端** —— Dockerfile 里是 `COPY frontend/build /app`，前端不构建就没有静态页。

```bash
# 1) 构建前端（需要 Node 18+）
cd frontend
npm install
npm run build          # 产物在 frontend/build

# 2) 回到仓库根目录构建镜像并启动
cd ..
docker compose up -d --build
```

本仓库根目录的 `docker-compose.yml` 就是这种方式：

```yaml
services:
  hass-panel:
    build:
      context: .
      dockerfile: docker/Dockerfile
    image: hass-panel:local
    container_name: hass-panel
    network_mode: host
    volumes:
      - ./data/hass-panel/:/config/hass-panel
    restart: unless-stopped
```

---

## 四、首次使用

1. 打开 `http://<NAS的IP>:5123`
2. 初始化页填 **Home Assistant 地址** 和 **访问令牌**
   - 地址形如 `http://192.168.1.10:8123`（容器用 host 网络，直接写 HA 的局域网地址即可）
   - 令牌建议用 **长期访问令牌**（HA：点右下角用户名 → 安全 → 长期访问令牌 → 创建）
     > ⚠️ **强烈建议用长期令牌**。如果只填短期令牌，后端有些直连 HA 的接口（摄像头定格画面、用电统计等）会在一段时间后失效。
3. 保存后即可进入面板，开始添加卡片

---

## 五、常用运维操作

```bash
# 查看状态 / 日志
docker compose ps
docker compose logs -f hass-panel

# 重启
docker compose restart

# 更新到最新镜像（方式 A）
docker compose pull && docker compose up -d

# 更新到最新代码（方式 B）
git pull
cd frontend && npm install && npm run build && cd ..
docker compose up -d --build

# 停止（保留数据）
docker compose down

# 完全卸载（⚠️ 数据目录不会自动删，需要你自己删）
docker compose down
rm -rf ./data/hass-panel
```

进容器里排查：

```bash
docker exec -it hass-panel sh
ls /config/hass-panel                      # 数据目录
supervisorctl status                       # 三个进程状态
supervisorctl restart fastapi              # 只重启后端（改了后端代码后用）
```

---

## 六、常见问题

**Q：打不开 5123**

```bash
docker compose logs hass-panel | tail -40     # 先看日志
netstat -tlnp | grep 5123                     # 看端口有没有被占
```
- 端口被占：改 `docker/config/nginx.conf` 里的 `listen 5123;`（要重新构建镜像）
- 防火墙 / 路由器：确认 NAS 的 5123 没有被拦

**Q：能打开页面，但连不上 Home Assistant**

- HA 地址要写**容器能访问到的地址**。容器是 host 网络，所以直接写 HA 的局域网 IP 即可；**不要写 `localhost`**（那指向容器自己）
- 令牌要有效：在 HA 里「用户资料 → 安全」能看到长期令牌列表，重新建一个再填

**Q：摄像头画面黑屏 / 一直转圈**

1. 先确认容器里有 ffmpeg（镜像已内置）
2. 看 go2rtc 的状态：浏览器打开 `http://<NAS的IP>:5123/go2rtc/`
3. 看日志：`docker compose logs hass-panel | grep -i go2rtc`
4. 摄像头卡片的「定格画面」走 HA 的 `camera_proxy`，**和 go2rtc 无关**；如果定格画面也取不到，通常是 HA 令牌失效，重新授权即可

**Q：改了后端代码，重启容器也不生效**

后端是 uvicorn，热重载对**新增路由**不可靠。要：

```bash
docker exec -it hass-panel supervisorctl restart fastapi
# 或者
docker compose restart
```

**Q：数据想搬到别的机器**

把整个数据目录（默认 `./data/hass-panel`）拷过去，`docker-compose.yml` 里的挂载路径指过去即可。

**Q：镜像多大 / 构建很慢**

基础镜像用的是 `ghcr.io/hassio-addons/base`，加上 ffmpeg、Python 依赖和 go2rtc 二进制，最终镜像不小。
`.dockerignore` 已经排除了 `node_modules` / `.venv` / `data` / `.git`，**不要删它** —— 否则构建上下文会膨胀到 GB 级、构建极慢。

---

## 七、目录结构速查

```
仓库根目录
├─ docker-compose.yml            ← 部署入口（方式 B 用）
├─ docker/
│  ├─ Dockerfile                 镜像定义
│  ├─ config/
│  │  ├─ nginx.conf              5123 入口 + 反代规则
│  │  ├─ supervisord.conf        一个容器托管三个进程
│  │  └─ go2rtc.yaml             默认 go2rtc 配置（首次启动会复制到数据目录）
│  ├─ scripts/entrypoint.sh      启动脚本：建目录、初始化配置、拉起 supervisord
│  └─ software/                  go2rtc 二进制（按架构自动选）
└─ data/hass-panel/              ← 挂载出来的数据目录（不要提交到 git）
```
