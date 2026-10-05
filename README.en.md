# Hass-Panel

> A personal fork of [ha-china/hass-panel](https://github.com/ha-china/hass-panel): all original features are kept, plus the modules listed below.

---

## Added modules

### 🧩 Card Plugin System

- **Upload from the panel**: click "Upload Plugin" on the settings page and pick a `.zip` package
- **Plugin manager**: enable / disable, rename, uninstall
- **Takes effect instantly**: uploaded plugins are loaded at runtime, no container restart needed
- **Plugin dev kit** `plugin-dev`: built with esbuild, reusing the host's React / antd / HA connection; writing a plugin is nearly identical to writing a built-in card

### 🔔 Notification Module

- **Real-time push**: SSE long connection, notifications pop up on the home page
- **History card**: paginated browsing, unread highlight, mark read / mark all read / clear
- **Rich content**: Markdown and images (images can be proxied by the backend — auth, size limit, no broken links)
- **Webhook endpoint**: for Home Assistant automations / n8n and other external systems

### 📌 Top Drawer Panel

- Hover the top edge of the screen to reveal a panel for less-used cards
- Size, position, trigger bar width / color / opacity, blur and panel opacity are all configurable

### 🔍 Proportional Card Scaling (ScaledCard)

- Card content scales **proportionally** with the card: no empty space when enlarged, no stretched text
- The title counter-scales, so its size stays constant while the card grows

### 🗺️ Map Location Card

- Show real-time locations of family members / devices on an AMap (Gaode) map
- Coordinate correction (WGS-84 → GCJ-02), tap a device to focus, overlapping markers clustered
- ⚠️ Requires your own AMap "Web JS API" key, configured in **Settings → Global Config → Map**

### 🖼️ Wallpaper Mode (Wallpaper Engine)

- Use the home page as a Windows desktop wallpaper (Wallpaper Engine URL wallpaper) — your desktop becomes the smart home panel
- **Dynamic wallpaper supported**: use a video as the background (webm / VP9 recommended), looping with the wallpaper
- Fullscreen by default, toolbar auto-hides (revealed by moving the mouse to the top-right)
- Videos pause / resume with the wallpaper, so nothing is wasted in the background

### ⚙️ Other Improvements

- Global config is now **collapsible** per module for a cleaner UI
- Improved in-card scrolling / paging logic
- Docker wiring: nginx serves plugin bundles, go2rtc transcodes H.265 via ffmpeg

---

## About

- This project is a fork of [ha-china/hass-panel](https://github.com/ha-china/hass-panel). Thanks to the original author.
- License: [GPL-3.0](./LICENSE). Redistributions must **keep this license and the original copyright notice**, and state that changes were made.
