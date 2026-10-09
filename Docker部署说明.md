# Docker 部署说明

> 面向 **NAS / 服务器** 的部署方式。本地直接跑（不用 Docker）见仓库里的 `start-all.bat`（一键起后端 + 前端 + go2rtc）。
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

> ⚠️ host 网络在 **Linux / 群晖 / 飞牛 / unRAID** 上都没问题；**Windows / macOS 的 Docker Desktop 支持有限**，这种情况建议直接在 Windows 本地跑（仓库里有 `start-all.bat`）。

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

**每次构建都会打三个标签**，回滚时很有用：

| 标签 | 说明 |
|---|---|
| `:latest` | 永远指向最新一次构建（`docker compose pull` 拉的就是它） |
| `:v<VERSION>` | 版本号，取自仓库根目录的 **`VERSION` 文件**（如 `v1.8.0`） |
| `:v<VERSION>-<短sha>` | **唯一标签**，同一个版本号重复构建也不会互相覆盖，精确回滚用这个 |

**想回滚到某个历史版本**：把 `docker-compose.yml` 里的 `image` 改成对应标签（例如
`ghcr.io/shinnsaizb-spec/hass-panel:v1.8.0-3ad8e07`），再 `docker compose up -d` 即可。

**想发新版本**：改仓库根目录的 `VERSION` 文件（如 `1.8.0` → `1.8.1`）推 main，构建会自动带上新版本号。
也可以在 Actions 页面手动跑一次工作流，在 `version` 输入框里临时指定（会覆盖 `VERSION` 文件）。

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

## 五、自动更新与「有新版本」提醒

**为什么飞牛 OS 里看不到这个镜像的更新提示？**
飞牛（以及其他 NAS 的容器管理界面）的更新检测一般只盯 **Docker Hub**，而本项目镜像是
**GHCR（ghcr.io）** 的，它识别不到，所以不会给你「有新版本」的角标。要自动更新 / 收到提醒，
用下面任意一种方式。

### 方案 A：Watchtower —— 自动拉取并重建（推荐）

`containrrr/watchtower` 会定期检查镜像有没有更新，有就自动拉取、重建容器（**数据卷不受影响**）。

新建一个目录放 `docker-compose.yml`：

```yaml
services:
  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - TZ=Asia/Shanghai
      - WATCHTOWER_CLEANUP=true          # 更新后删掉旧镜像，省空间
      - WATCHTOWER_POLL_INTERVAL=86400   # 每 24 小时检查一次（单位秒）
      # 只更新「打了开启标签」的容器，避免误更新数据库之类的关键服务
      - WATCHTOWER_LABEL_ENABLE=true
```

然后给要自动更新的容器打一个标签。以本项目为例，在 `hass-panel` 的服务里加：

```yaml
services:
  hass-panel:
    image: ghcr.io/shinnsaizb-spec/hass-panel:latest
    labels:
      - com.centurylinklabs.watchtower.enable=true
    # ...其余不变
```

> ⚠️ **只更新 `:latest` 才会生效**。如果你把镜像锁到了 `v1.8.0-3ad8e07` 这种固定标签，
> Watchtower 不会动它（那个标签永远不变）—— 想「锁版本 + 手动升级」就故意这么写。

**手动立刻检查一次**（不想等 24 小时）：

```bash
docker exec watchtower watchtower --run-once
```

### 方案 B：只提醒、不自动更新

把 Watchtower 跑在 **monitor-only** 模式，它只检查并通知，不会动你的容器：

```yaml
    environment:
      - WATCHTOWER_MONITOR_ONLY=true     # 只监控不更新
      - WATCHTOWER_POLL_INTERVAL=86400
      - WATCHTOWER_LABEL_ENABLE=true
```

### 收到提醒的方式（推微信 / Telegram / 邮件）

Watchtower 用 [shoutrrr](https://containrrr.dev/shoutrrr/) 的 URL 配置通知，`WATCHTOWER_NOTIFICATION_URL` 一个变量搞定：

```yaml
    environment:
      - WATCHTOWER_NOTIFICATIONS=shoutrrr
      # 推到微信（用 pushplus，扫码拿 token）：https://www.pushplus.plus/
      - WATCHTOWER_NOTIFICATION_URL=generic+https://www.pushplus.plus/send?token=你的token&title=NAS更新&content=有容器更新了，去看日志
      # Telegram：telegram://botToken@telegram?channels=你的chatid
      # Discord： discord://token@webhookid
      # ntfy：    ntfy://topic@ntfy.sh
```

> URL 里有 `&` 的话**一定要加引号**，否则会被 shell 截断。
> 想一次推多个渠道，多个 URL 用空格隔开。

### 方案 C：飞牛的「计划任务」定时拉取

不想装额外容器的话，用飞牛自带的计划任务，定时执行：

```bash
cd /vol1/1000/docker/hass-panel && docker compose pull && docker compose up -d
```

（路径换成你放 `docker-compose.yml` 的实际目录；频率建议每天一次、凌晨执行。）

### 三个方案怎么选

| 你想要的 | 用哪个 |
|---|---|
| 有新版本**自动更新**，省心 | 方案 A |
| 只想知道**有新版本了**，更新自己手动控制 | 方案 B（或飞牛计划任务里只跑 `pull` 不 `up`） |
| 不装额外容器 | 方案 C |

---

## 六、常用运维操作

```bash
# 查看状态 / 日志
docker compose ps
docker compose logs -f hass-panel

# 重启
docker compose restart

# 更新到最新镜像（方式 A）
docker compose pull && docker compose up -d

# 想锁定到某个版本（可回滚），先把 compose 里的 image 改成具体标签，例如：
#   image: ghcr.io/shinnsaizb-spec/hass-panel:v1.8.0-3ad8e07
# 再 docker compose pull && docker compose up -d

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

## 七、常见问题

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

## 八、目录结构速查

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
