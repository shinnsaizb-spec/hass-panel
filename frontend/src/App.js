import '@ant-design/v5-patch-for-react-19';
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { HassConnect } from '@hakit/core';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Bottom from './components/Bottom';
// import Sidebar from './components/Sidebar';
import Home from './pages/home';
import AppRoutes from './routes';
import './App.css';
import { ConfigProvider, theme as antdTheme, message } from 'antd';
import Login from './pages/login';
import InitializePage from './pages/initialize';
import { systemApi } from './utils/api';
import Loading from './components/Loading';
// 插件系统：①先设置 window.HassPanelBridge（必须在加载插件前）；②启动后加载插件
import './plugin/bridge';
import { loadPlugins } from './plugin/loader';

// 将需要使用 useNavigate 的逻辑移到单独的组件中
function MainContent() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [hassConfig, setHassConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery({ minWidth: 768 });

  const checkAuth = useCallback(async () => {
    if (!localStorage.getItem('hass_panel_token')) {
      setIsLoading(false);
      navigate('/login');
      return;
    }

    try {
      const data = await systemApi.getHassConfig();
      
      if (data.code === 200) {
        setHassConfig({
          hassUrl: data.data.url,
          hassToken: data.data.token
        });
        localStorage.setItem('hass_url', data.data.url);
        setIsAuthenticated(true);
      } else if (data.code === 401) {
        localStorage.removeItem('hass_panel_token');
        navigate('/login');
      }
    } catch (error) {
      console.error('获取 HASS 配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setHassConfig, setIsAuthenticated, setIsLoading]);

  const updateHassConfig = async () => {
    try {
      // ⚠️ 只有在后端「还没有」HA 令牌时才回写，绝不能每次都覆盖。
      //
      // 原因：这里拿到的是 hakit 的 OAuth 令牌（localStorage 的 hassTokens），
      // 它是**短期令牌（约 30 分钟过期）**。而用户在后端填的通常是**长期访问令牌**。
      // 原来每次面板连上 HA 都拿短期令牌把数据库里的长期令牌覆盖掉，后果是：
      //   ① 半小时后，所有「后端直连 HA」的接口（摄像头定格画面、用电统计…）全部 401；
      //   ② 面板重启时数据库里那个令牌已经失效 → hakit 连不上 HA → 卡片全空、
      //      摄像头一直转圈，只能重新授权，非常难受。
      // 所以：数据库里已经有令牌就原样保留，只在首次（空库）时用它兜底。
      const current = await systemApi.getHassConfig();
      if (current && current.data && current.data.token) return;

      const raw = localStorage.getItem('hassTokens');
      if (!raw) return;
      const hassToken = JSON.parse(raw);
      if (!hassToken || !hassToken.access_token) return;

      await systemApi.updateHassConfig({
        hass_url: hassToken.hassUrl,
        hass_token: hassToken.access_token
      });
    } catch (error) {
      console.error('更新 HASS 配置失败:', error);
    }
  }

  const checkInitStatus = useCallback(async () => {
    try {
      const data = await systemApi.checkInitStatus();
      
      if (data.code === 200) {
        if (!data.data.is_initialized) {
          setIsLoading(false);
          navigate('/initialize');
          return;
        }
        // 如果已初始化，检查认证状态
        checkAuth();
      } else {
        message.error('检查系统状态失败');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('检查系统状态失败:', error);
      setIsLoading(false);
      navigate('/initialize');
    }
  }, [navigate, checkAuth]);

  useEffect(() => {
    checkInitStatus();
  }, [checkInitStatus]);

  // 插件是运行时加载的（独立于登录态），应用启动即触发一次即可
  useEffect(() => {
    loadPlugins();
  }, []);

  return (
        <LanguageProvider>
          <Routes>
            <Route path="/initialize" element={<InitializePage />} />
            <Route path="/login" element={<Login />} />
            {isAuthenticated && (
              <Route path="/*" element={
                <HassConnect 
                  hassUrl={hassConfig.hassUrl} 
                  hassToken={hassConfig.hassToken}
                  onReady={async () => {
                    await updateHassConfig();
                  }}
                >
                  <div className="App">
                    <Routes>
                      <Route path="/" element={<Home sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />} />
                      {AppRoutes({sidebarVisible, setSidebarVisible})}
                    </Routes>
                    {!isDesktop && <Bottom />}
                  </div>
                </HassConnect>
              } />
            )}
          </Routes>
          {isLoading && <Loading />}
        </LanguageProvider>
   
  );
}

// 创建一个新的包装组件来处理主题配置
function ThemedApp({ children }) {
  const { theme } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#FFB74D',
          borderRadius: 8,
        },
        components: {
          Slider: {
            railSize: 10
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

// 主应用组件
function App() {
  return (
 
      <Router>
        <ThemeProvider>
          <ThemedApp>
          <MainContent />
        </ThemedApp>
      </ThemeProvider>
      </Router>
    
  );
}

export default App;
