import axios from 'axios';

// 创建不需要认证的axios实例
const publicAxiosInstance = axios.create({
  baseURL: './api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建需要认证的axios实例
const axiosInstance = axios.create({
  baseURL: './api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器
axiosInstance.interceptors.request.use((config) => {
  const localToken = localStorage.getItem('hass_panel_token');
  const token = JSON.parse(localToken);
  const accessToken = token?.access_token;
  
  if (!accessToken) {
    window.location.href = './#/login';
    throw new Error('未找到认证token');
  }
  
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// 添加响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地token
      localStorage.removeItem('hass_panel_token');
      // 跳转到登录页面
      window.location.href = './#/login';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }
    return Promise.reject(error);
  }
);


// 判断一个背景地址是不是视频（支持 mp4 / webm / ogv / mov / m4v）
const VIDEO_BG_RE = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i;
const BG_VIDEO_ID = 'hass-panel-bg-video';

/** 背景地址是否为视频 */
export const isVideoBackground = (url) => VIDEO_BG_RE.test((url || '').trim());

/**
 * Wallpaper Engine 网页壁纸集成。
 * 壁纸引擎在「切到其他窗口 / 回到桌面」时会回调 setPaused，
 * 响应它可以让视频跟着暂停/继续，避免在后台白耗资源。
 *
 * ⚠️ Wallpaper Engine 的内置浏览器（CEF）**只支持 webm 封装的视频，不支持 mp4(H.264)**，
 * 所以想当动态壁纸用，背景视频必须转成 webm（推荐 VP9 编码）。
 * 普通浏览器里 mp4 是正常的，这就是「浏览器正常、壁纸里黑屏」的原因。
 */
function bindWallpaperEngineListener() {
  if (typeof window === 'undefined' || window.__hpWallpaperListenerBound) return;
  window.__hpWallpaperListenerBound = true;

  const existing = window.wallpaperPropertyListener || {};
  window.wallpaperPropertyListener = {
    ...existing,
    setPaused: (isPaused) => {
      if (typeof existing.setPaused === 'function') existing.setPaused(isPaused);
      const video = document.getElementById(BG_VIDEO_ID);
      if (!video) return;
      if (isPaused) {
        video.pause();
      } else {
        const playing = video.play();
        if (playing && typeof playing.catch === 'function') playing.catch(() => {});
      }
    },
  };
}

/**
 * 确保页面上存在背景视频元素，并切换到指定地址。
 * 用 position:fixed + z-index:-1 垫在最底层：html 没有背景，body 的背景会
 * 传递到画布(canvas)最底层，而负 z-index 的元素绘制在画布之上、正常内容之下，
 * 所以视频能显示出来又不会挡住任何交互。
 */
function ensureBackgroundVideo(url) {
  let video = document.getElementById(BG_VIDEO_ID);
  if (!video) {
    video = document.createElement('video');
    video.id = BG_VIDEO_ID;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('aria-hidden', 'true');
    Object.assign(video.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: '-1',
      pointerEvents: 'none',
    });
    document.body.insertBefore(video, document.body.firstChild);
    bindWallpaperEngineListener();
  }

  if (video.dataset.src !== url) {
    video.dataset.src = url;
    video.src = url;
  }
  // 只有暂停时才请求播放；重复调用 play() 可能让某些浏览器重新调度视频合成层，
  // 卡片的 backdrop-filter 会随之短暂变样。
  if (video.paused) {
    const playing = video.play();
    if (playing && typeof playing.catch === 'function') playing.catch(() => {});
  }
  return video;
}

function removeBackgroundVideo() {
  const video = document.getElementById(BG_VIDEO_ID);
  if (video) video.remove();
}

// 图片背景改用一个独立的「固定定位图层」，而不是 body 的 background-attachment: fixed。
// ⚠️ 原因：background-attachment: fixed 在页面内容大幅变化（如切换分组）时会被**重新栅格化**，
//    表现为整屏（含背景）闪一下。独立 position:fixed 图层有自己的合成层，不跟着重画。
const BG_IMAGE_ID = 'hass-panel-bg-image';

function ensureBackgroundImage(url) {
  let el = document.getElementById(BG_IMAGE_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = BG_IMAGE_ID;
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '-1',
      pointerEvents: 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      // 强制独立合成层：页面内容变化时不重栅格 → 不闪
      transform: 'translateZ(0)',
      willChange: 'transform',
    });
    document.body.insertBefore(el, document.body.firstChild);
  }
  const next = url ? `url(${url})` : 'none';
  if (el.style.backgroundImage !== next) el.style.backgroundImage = next;
  return el;
}

function removeBackgroundImage() {
  const el = document.getElementById(BG_IMAGE_ID);
  if (el) el.remove();
}

// 保存最近一次的全局配置，供主题切换回调使用（避免闭包捕获到旧值）
let latestGlobalConfig = null;

// 上一次实际应用过的「配置 + 主题」签名。用来做幂等：
// ⚠️ configApi.getConfig() 每次被调用都会走这里；切换分组等场景也会触发 getConfig，
//    如果不加判断，就会把背景视频重新插入/重新播放 —— 背景跳一下，
//    叠在上面的半透明玻璃卡片看起来也「变了样」。
let _lastBgSig = null;

// 应用背景设置到body
export const applyBackgroundToBody = (globalConfig) => {
  if (!globalConfig) return;
  latestGlobalConfig = globalConfig;

  // 检测当前主题模式 - 只检查应用内部的主题标记，不考虑系统偏好
  const isDarkMode = document.documentElement.classList.contains('dark') || 
                     document.documentElement.getAttribute('data-theme') === 'dark';

  // 配置和主题都没变 → 不重复设置背景（幂等）
  const _sig = JSON.stringify(globalConfig) + '|' + isDarkMode;
  if (_sig === _lastBgSig) return;
  _lastBgSig = _sig;

  // 设置背景颜色
  if (globalConfig.backgroundColor) {
    document.body.style.backgroundColor = globalConfig.backgroundColor;
  } else {
    document.body.style.backgroundColor = '';
  }

  // 根据主题模式选择背景图/背景视频
  let backgroundImage = '';
  if (isDarkMode && globalConfig.darkModeBackgroundImage) {
    backgroundImage = globalConfig.darkModeBackgroundImage;
  } else if (globalConfig.backgroundImage) {
    backgroundImage = globalConfig.backgroundImage;
  }

  if (backgroundImage && isVideoBackground(backgroundImage)) {
    // 视频背景：交给 <video> 元素播放，body 本身不要再用 background-image
    removeBackgroundImage();
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundAttachment = '';
    ensureBackgroundVideo(backgroundImage);
  } else {
    // 图片背景（或没有背景）：移除视频元素
    removeBackgroundVideo();
    // body 自身不再用 background-image（避免 background-attachment: fixed 的整屏重栅格闪烁）
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundAttachment = '';
    if (backgroundImage) {
      ensureBackgroundImage(backgroundImage);
    } else {
      removeBackgroundImage();
    }
  }
  
  // 添加主题变化监听器
  if (!window.themeChangeListenerAdded) {
    window.themeChangeListenerAdded = true;

    // 统一用 latestGlobalConfig，保证主题切换时拿到的是最新配置
    const reapply = () => {
      if (latestGlobalConfig) applyBackgroundToBody(latestGlobalConfig);
    };

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', reapply);

    // 监听HTML类变化以检测主题切换
    const observer = new MutationObserver(reapply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    // 监听自定义主题变化事件
    document.addEventListener('themeChange', reapply);
  }
};

// 配置相关API
export const configApi = {
  // 获取最新配置
  getConfig: async () => {
    try {
      const response = await axiosInstance.get('/user_config/config');
      const config = response.data;
      
      // 保存全局配置到window对象，以便在主题切换时使用
      if (config.data.globalConfig) {
        window.globalConfigCache = config.data.globalConfig;
        applyBackgroundToBody(config.data.globalConfig);
        // ⚠️ 必须广播一次：否则那些「运行时读 window.globalConfigCache」的模块
        //    （如液态玻璃折射引擎）在首屏加载时读到的是空对象 → 用默认值渲染，
        //    表现为「保存过的参数刷新后不生效，要打开一次全局配置才生效」。
        window.dispatchEvent(
          new CustomEvent('hasspanel:global-config-changed', {
            detail: config.data.globalConfig,
          })
        );
      }
      
      return config;
    } catch (error) {
      throw error;
    }
  },

  // 保存配置
  saveConfig: async (config) => {
    try {
      const response = await axiosInstance.post('/user_config/config', config);
      const data = response.data;

      // ⚠️ 后端出错时也会返回 HTTP 200，错误码只写在 body 的 code 里。
      // 不判断的话前端会把失败当成功提示（用户看到「保存成功」但卡片其实没存）。
      if (data && typeof data.code !== 'undefined' && data.code !== 200) {
        throw new Error(data.error || data.message || '保存失败');
      }

      // 保存配置时自动应用背景设置（只在真正成功后才应用）
      if (config.globalConfig) {
        applyBackgroundToBody(config.globalConfig);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // 获取版本列表
  getVersions: async () => {
    try {
      const response = await axiosInstance.get('/user_config/versions');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 获取指定版本
  getVersion: async (filename) => {
    try {
      const response = await axiosInstance.get(`/user_config/versions/${filename}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 删除指定版本
  deleteVersion: async (filename) => {
    try {
      const response = await axiosInstance.delete(`/user_config/versions/${filename}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 上传图片
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosInstance.post('/common/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.code === 200) {
        return {
          url: response.data.data.file_path,
          file_path: response.data.data.file_path
        };
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error) {
      throw error;
    }
  },

  // 上传背景图
  uploadBackground: async (file) => {
    try {
      // 先上传图片
      const uploadResult = await configApi.uploadImage(file);
 
      // 获取当前配置
      const response = await configApi.getConfig();
      if (response.code !== 200) {
        throw new Error('获取配置失败');
      }
      const config = response.data;

      
      // 更新全局配置中的背景图
      const updatedConfig = {
        ...config,
        globalConfig: {
          ...(config.globalConfig || {}),
          backgroundImage: uploadResult.file_path
        }
      };
      
      // 保存更新后的配置
      await configApi.saveConfig(updatedConfig);
      
      // 应用背景设置到body
      applyBackgroundToBody(updatedConfig.globalConfig);
      
      return uploadResult.file_path;
    } catch (error) {
      throw error;
    }
  },

  // 设置背景配置
  setGlobalConfig: async (globalConfig) => {
    try {
      // 获取当前配置
      const response = await configApi.getConfig();
      const config = response.data;
      
      // 更新全局配置
      const updatedConfig = {
        ...config,
        globalConfig: {
          ...(config.globalConfig || {}),
          ...globalConfig
        }
      };
      
      // 保存更新后的配置
      await configApi.saveConfig(updatedConfig);

      // 同步刷新运行时缓存，让地图卡片等能立刻读到新值（如高德 Key）
      window.globalConfigCache = updatedConfig.globalConfig;

      // 应用背景设置到body
      applyBackgroundToBody(updatedConfig.globalConfig);

      // 广播给页面（主页 / 配置页）刷新各自的 globalConfig 状态。
      // ⚠️ 否则「卡片背景透明度 / 标题高度 / 下拉屏参数」等只在重新挂载或切换分组
      //    （主页 loadConfig 的依赖里有 activeGroup）时才生效 —— 用户会看到「改了没反应」。
      window.dispatchEvent(
        new CustomEvent('hasspanel:global-config-changed', { detail: updatedConfig.globalConfig })
      );

      return updatedConfig.globalConfig;
    } catch (error) {
      throw error;
    }
  },

  // 重置背景设置
  resetBackground: async () => {
    try {
      // 获取当前配置
      const response = await configApi.getConfig();
      const config = response.data;
      
      // 移除背景相关的配置
      const updatedConfig = {
        ...config,
        globalConfig: {
          ...(config.globalConfig || {}),
          backgroundImage: '',  // 清除背景图
          darkModeBackgroundImage: '', // 清除暗色模式背景图
          backgroundColor: ''   // 清除背景色
        }
      };
      
      // 保存更新后的配置
      await configApi.saveConfig(updatedConfig);
      
      // 重置body样式
      _lastBgSig = null; // 让下次 applyBackgroundToBody 能重新应用
      removeBackgroundImage();
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      
      return updatedConfig.globalConfig;
    } catch (error) {
      throw error;
    }
  }
};

// 摄像头相关API
export const cameraApi = {
  // 获取ONVIF摄像头源
  getOnvifSources: async () => {
    try {
      const response = await axios.get('./go2rtc/api/onvif');
      
      // 过滤只保留IPv4地址的源
      const filteredSources = response.data.sources.map(source => ({
        ...source,
        url: source.url.split('%20')[0]  // 只保留第一个URL（IPv4）
      }));
      
      return filteredSources;
    } catch (error) {
      throw error;
    }
  },
  
  // 获取预设位置
  getPresets: async (entityId, stream_url) => {
    try {
      const params = new URLSearchParams();
      if (stream_url) {
        params.append('stream_url', stream_url);
      }
      
      const url = `/onvif/presets/${entityId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get presets:', error);
      throw error;
    }
  },
  
  // PTZ控制
  ptzControl: async (ptzData) => {
    try {
      const response = await axiosInstance.post('/onvif/ptz', ptzData);
      return response.data;
    } catch (error) {
      console.error('Failed to control PTZ:', error);
      throw error;
    }
  },
  
  // 移动到预设位置
  gotoPreset: async (entityId, presetToken, speed = 0.5, stream_url) => {
    try {
      const params = new URLSearchParams();
      params.append('speed', speed);
      if (stream_url) {
        params.append('stream_url', stream_url);
      }
      
      const url = `/onvif/preset/${entityId}/${presetToken}?${params.toString()}`;
      const response = await axiosInstance.post(url);
      return response.data;
    } catch (error) {
      console.error('Failed to goto preset:', error);
      throw error;
    }
  },
  
  // 设置预设位置
  setPreset: async (entityId, presetName, stream_url) => {
    try {
      const params = new URLSearchParams();
      if (stream_url) {
        params.append('stream_url', stream_url);
      }
      
      const url = `/onvif/preset/set/${entityId}/${presetName}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axiosInstance.post(url);
      return response.data;
    } catch (error) {
      console.error('Failed to set preset:', error);
      throw error;
    }
  },
  
  // 删除预设位置
  removePreset: async (entityId, presetToken, stream_url) => {
    try {
      const params = new URLSearchParams();
      if (stream_url) {
        params.append('stream_url', stream_url);
      }
      
      const url = `/onvif/preset/${entityId}/${presetToken}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      console.error('Failed to remove preset:', error);
      throw error;
    }
  },
  
  // 获取摄像头信息
  getCameraInfo: async (entityId, stream_url) => {
    try {
      const params = new URLSearchParams();
      if (stream_url) {
        params.append('stream_url', stream_url);
      }
      
      const url = `/onvif/info/${entityId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get camera info:', error);
      throw error;
    }
  },
  
  // 重启摄像头
  rebootCamera: async (entityId, stream_url) => {
    try {
      const params = new URLSearchParams();
      if (stream_url) {
        params.append('stream_url', stream_url);
      }
      
      const url = `/onvif/reboot/${entityId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axiosInstance.post(url);
      return response.data;
    } catch (error) {
      console.error('Failed to reboot camera:', error);
      throw error;
    }
  }
};

// 更新相关API
export const updateApi = {
  // 检查更新
  checkUpdate: async () => {
    try {
      const response = await axiosInstance.get('/version');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 确认更新
  confirmUpdate: async () => {
    try {
      const response = await axiosInstance.get('/update');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 上传更新包
  uploadPackage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('package', file);
      
      const response = await axiosInstance.post('/upload-update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.code === 200) {
        return response.data;
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error) {
      throw error;
    }
  },

  // 应用手动更新
  applyManualUpdate: async (packageInfo) => {
    try {
      const response = await axiosInstance.post('/manual-update', packageInfo);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 获取当前版本信息
  getCurrentVersion: async () => {
    try {
      const response = await axios.get('./version.json');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// 系统相关API
export const systemApi = {
  // 检查系统初始化状态
  checkInitStatus: async () => {
    try {
      const response = await publicAxiosInstance.get('/common/init_info');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 获取HASS配置
  getHassConfig: async () => {
    try {
      const response = await axiosInstance.get('/user_config/hass_config');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 更新HASS配置
  updateHassConfig: async (config) => {
    try {
      const response = await axiosInstance.put('/user_config/hass_config', config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 重新初始化
  reinitialize: async () => {
    try {
      const response = await axiosInstance.post('/common/reinitialize');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 下载日志
  downloadLog: async (config = {}) => {
    try {
      const response = await axiosInstance.get('/common/download_log', {
        ...config,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 

// 通知 / webhook 相关 API
export const notifyApi = {
  // 获取 webhook 地址与令牌（需登录）
  getInfo: async () => {
    try {
      const response = await axiosInstance.get('/notify/info');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 发送测试通知：走 webhook（用 token 校验，不需要登录态）
  sendTest: async (token, title, message, level = 'info') => {
    try {
      const response = await publicAxiosInstance.post(
        `/notify/webhook?token=${encodeURIComponent(token)}`,
        { title, message, level }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 历史消息列表（需登录）。type: all | persisted | recent
  getHistory: async (type = 'all', limit = 50, offset = 0) => {
    try {
      const response = await axiosInstance.get('/notify/history', {
        params: { type, limit, offset },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 标记已读：传 id 或 all=true
  markRead: async ({ id = '', all = false } = {}) => {
    try {
      const response = await axiosInstance.post('/notify/read', { id, all });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 删除单条
  removeMessage: async (id) => {
    try {
      const response = await axiosInstance.delete(`/notify/message/${encodeURIComponent(id)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 清空：all | persisted | recent
  clear: async (type = 'all') => {
    try {
      const response = await axiosInstance.delete('/notify/clear', { params: { type } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const hassApi = {
  // 获取用电量统计数据
  getEnergyStatistics: async (entityId) => {
    try { 
      const response = await axiosInstance.get(`/hass/energy/statistics/${entityId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 获取今日用电量数据
  getTodayConsumption: async (entityId) => {
    try {
      const response = await axiosInstance.get(`/hass/energy/today/${entityId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 获取每日用电量数据
  getDailyConsumption: async (entityId, days) => {
    try {
      const response = await axiosInstance.get(`/hass/energy/daily/${entityId}?days=${days}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  } 
};

// 卡片插件相关 API（上传插件包 → 重启/重扫即生效）
// ⚠️ axiosInstance 的 baseURL 已是 './api'，这里路径不要再带 /api 前缀，否则会变成 /api/api/...
export const pluginApi = {
  // 获取已安装插件列表
  list: async () => {
    try {
      const response = await axiosInstance.get('/plugins');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 重新扫描插件目录（上传新插件后无需重启容器）
  rescan: async () => {
    try {
      const response = await axiosInstance.post('/plugins/rescan');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 上传插件压缩包（.zip），自动安装并重扫
  upload: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosInstance.post('/plugins/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 获取全部插件（含已禁用），供「插件管理」页
  listAll: async () => {
    try {
      const response = await axiosInstance.get('/plugins/all');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 重命名插件（只改显示名；name 传空字符串则恢复原名）
  rename: async (id, name) => {
    try {
      const response = await axiosInstance.post(
        `/plugins/${encodeURIComponent(id)}/rename`,
        { name }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 启用 / 禁用插件
  setEnabled: async (id, enabled) => {
    try {
      const response = await axiosInstance.post(
        `/plugins/${encodeURIComponent(id)}/${enabled ? 'enable' : 'disable'}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 卸载插件（删除插件目录）
  uninstall: async (id) => {
    try {
      const response = await axiosInstance.delete(`/plugins/${encodeURIComponent(id)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 卡片显示名覆盖表：{ "<cardType>": "自定义名" }
  cardNames: async () => {
    try {
      const response = await axiosInstance.get('/plugins/card-names');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 重命名任意卡片（内置 / 插件都行）；name 传空字符串则恢复默认
  renameCard: async (cardType, name) => {
    try {
      const response = await axiosInstance.post(
        `/plugins/card-names/${encodeURIComponent(cardType)}`,
        { name }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 被禁用的卡片类型列表
  cardDisabled: async () => {
    try {
      const response = await axiosInstance.get('/plugins/card-disabled');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 启用 / 禁用一张卡片
  setCardDisabled: async (cardType, disabled) => {
    try {
      const response = await axiosInstance.post(
        `/plugins/card-disabled/${encodeURIComponent(cardType)}`,
        { disabled }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// 附件管理：上传目录里的图标 / 图片 / 动图
export const attachmentApi = {
  // 列出所有附件（含分类：icon / image / animated / other）
  list: async () => {
    try {
      const response = await axiosInstance.get('/common/attachments');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 重命名（新名不写扩展名时后端会自动沿用原扩展名）
  rename: async (name, newName) => {
    try {
      const response = await axiosInstance.post(
        `/common/attachments/${encodeURIComponent(name)}/rename`,
        { new_name: newName }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 删除
  remove: async (name) => {
    try {
      const response = await axiosInstance.delete(
        `/common/attachments/${encodeURIComponent(name)}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 把视频附件（mp4/mov/m4v…）转成 webm（后端调 ffmpeg），立即返回 task_id
  transcode: async (name) => {
    try {
      const response = await axiosInstance.post(
        `/common/attachments/transcode`,
        { name }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 轮询转码进度：GET /common/attachments/transcode/{taskId}
  transcodeProgress: async (taskId) => {
    try {
      const response = await axiosInstance.get(
        `/common/attachments/transcode/${encodeURIComponent(taskId)}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // 取消转码：POST /common/attachments/transcode/{taskId}/cancel
  transcodeCancel: async (taskId) => {
    try {
      const response = await axiosInstance.post(
        `/common/attachments/transcode/${encodeURIComponent(taskId)}/cancel`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// 户型图（3D floorplan）等新模块直接复用这个带认证的实例
export { axiosInstance };
