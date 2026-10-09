import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import { PullToRefresh } from 'antd-mobile';
import Icon from '@mdi/react';
import {
  mdiWeatherNight,
  mdiWhiteBalanceSunny,
  mdiCheck,
  mdiPencil,
  mdiRefresh,
  mdiViewDashboard,
  mdiGoogleTranslate,
  mdiFullscreen,
  mdiFullscreenExit,
  mdiCog,
  mdiMonitor,
  mdiAutoFix,
  mdiCancel,
  mdiLock,
  mdiLockOpenVariant,
} from '@mdi/js';
import { useTheme } from '../../theme/ThemeContext';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { message, Spin, Modal, Slider } from 'antd';
import { getCardComponent } from '../../cards/registry';
import { getPluginCardHeights, getCardDisabled } from '../../plugin/loader';
import ScaledCard from '../../components/ScaledCard';
import TopDrawer from '../../components/TopDrawer';
import GroupTabs from '../../components/GroupTabs';
import CardRippleEffect from '../../components/CardRippleEffect';
import LiquidGlassRefraction from '../../components/LiquidGlassRefraction';
import NotificationPopup from '../../components/NotificationPopup';
import './style.css';
import { useLanguage } from '../../i18n/LanguageContext';
import { configApi, applyBackgroundToBody } from '../../utils/api';
import { useNavigate } from 'react-router-dom';


// 这些卡片内部是「自己按渲染尺寸绘制」的（地图 / 摄像头），
// 参与内容缩放会画错、溢出卡片框，所以不缩放，直接铺满卡片即可。
const NO_SCALE_CARD_TYPES = new Set(['MapCard', 'CameraCard', 'IFrameCard']);

/** 主页只显示「可见 且 没被放进下拉屏」的卡片；inDrawer 的卡片由 TopDrawer 负责渲染 */
const isHomeVisible = (c) => !!c && c.visible !== false && c.inDrawer !== true;

function Home({ sidebarVisible, setSidebarVisible }) {
  const { theme, setSpecificTheme } = useTheme();
  const { t, toggleLanguage } = useLanguage();

  // 被「卡片管理」禁用的卡片类型：禁用后不再渲染真实组件，显示占位。
  // 卡片管理里改完会广播 hasspanel:plugins-loaded，这里跟着重渲染。
  const [cardSettingsTick, setCardSettingsTick] = useState(0);
  useEffect(() => {
    const onCardSettings = () => setCardSettingsTick((v) => v + 1);
    window.addEventListener('hasspanel:plugins-loaded', onCardSettings);
    return () => window.removeEventListener('hasspanel:plugins-loaded', onCardSettings);
  }, []);

  // 「全局配置」弹窗保存后广播 hasspanel:global-config-changed → 立即刷新本地 globalConfig。
  // ⚠️ 否则卡片背景透明度 / 标题高度 / 下拉屏参数等要等「切换分组」（loadConfig 依赖 activeGroup）
  //    或重新挂载才生效，用户会看到「改了没反应」。
  useEffect(() => {
    const onGlobalConfigChanged = (e) => {
      const next = e && e.detail;
      if (next && typeof next === 'object') setGlobalConfig(next);
    };
    window.addEventListener('hasspanel:global-config-changed', onGlobalConfigChanged);
    return () =>
      window.removeEventListener('hasspanel:global-config-changed', onGlobalConfigChanged);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const disabledCardTypes = useMemo(() => getCardDisabled(), [cardSettingsTick]);
  const navigate = useNavigate();


  // 状态定义
  const [width, setWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cards, setCards] = useState([]);
  // 全局配置（用于把抽屉尺寸/毛玻璃、卡片透明度、通知位置等下发给组件）
  const [globalConfig, setGlobalConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // 默认全屏（桌面端）—— 当壁纸用时不需要顶部工具栏占位置。
  // 移动端不默认全屏，否则顶部工具栏藏起来后找不到切回来的按钮。
  const [isFullscreen, setIsFullscreen] = useState(() => window.innerWidth >= 768);
  // 全屏时工具栏默认隐藏，鼠标移到右上角才浮出来
  const [toolbarPeek, setToolbarPeek] = useState(false);
  // 右上角工具栏的 DOM 引用：用于判断「鼠标是否还在工具栏范围内」
  const headerRef = useRef(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [columnCount, setColumnCount] = useState({ lg: 40, md: 40, sm: 1 });

  // 使用Modal.useModal创建模态对话框实例，确保使用全局主题
  const [modal, contextHolder] = Modal.useModal();

  // 添加主题菜单状态
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);

  // 分组相关状态
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(() => {
    return localStorage.getItem('active-group') || '_all';
  });
  // 切换分组时给网格播一次淡入动画（0/1 两个类名交替，保证每次都能重新触发 CSS 动画）
  const [groupSwapTick, setGroupSwapTick] = useState(0);

  // 获取主题图标
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return mdiWhiteBalanceSunny;
      case 'dark':
        return mdiWeatherNight;
      case 'system':
        return mdiMonitor;
      default:
        return mdiWhiteBalanceSunny;
    }
  };

  // 添加一个函数，验证布局是否包含所有可见卡片
  const isLayoutValid = useCallback((layouts, cards) => {
    const visibleCardIds = cards
      .filter(isHomeVisible)
      .map(card => card.id.toString());

    // 检查每个断点的布局
    for (const breakpoint of Object.keys(layouts)) {
      // 确保布局存在且不为空
      if (!layouts[breakpoint] || layouts[breakpoint].length === 0) {
        return false;
      }

      // 获取布局中的所有卡片ID
      const layoutItemIds = layouts[breakpoint].map(item => item.i);

      // 检查所有可见卡片是否都在布局中
      for (const cardId of visibleCardIds) {
        if (!layoutItemIds.includes(cardId)) {
          return false;
        }
      }

      // 检查布局中是否包含不存在的卡片
      for (const itemId of layoutItemIds) {
        if (!visibleCardIds.includes(itemId)) {
          return false;
        }
      }

      // 尺寸也要合理：主页 rowHeight=1、margin=0，所以 h 就是像素（正常卡片 200~700px），
      // h 只有个位数就是「塌成一条线」的退化数据 —— 这种已经存进 localStorage 的脏布局
      // 光看「卡片 id 齐不齐」是查不出来的，必须连尺寸一起校验，否则会一直被沿用。
      for (const item of layouts[breakpoint]) {
        if (!Number.isFinite(item.h) || item.h < 20) return false;
        if (!Number.isFinite(item.w) || item.w < 1) return false;
      }
    }

    return true;
  }, []);
  // 添加一个函数，计算默认布局
  const calculateDefaultLayouts = useCallback((cards, columnCount = 5) => {
    // 基础布局参数 - 根据传入的列数自动计算列宽
    const totalCols = 40; // 总列数保持不变
    
    // 使用精确的除法计算每个卡片的宽度
    // 这样可以确保所有卡片刚好填满一行
    const cardWidth = Math.floor(totalCols / columnCount); // 向下取整，确保不会超出总宽度
    // 计算最后一列的宽度，确保总宽度仍为40
    const lastColumnWidth = totalCols - (cardWidth * (columnCount - 1));
    
    const baseParams = {
      lg: { cols: totalCols, cardWidth: cardWidth, lastColumnWidth: lastColumnWidth }, 
      md: { cols: totalCols, cardWidth: cardWidth, lastColumnWidth: lastColumnWidth },
      sm: { cols: 1, cardWidth: 1, lastColumnWidth: 1 }
    };
    // 添加卡片高度配置
    const cardHeights = {
      TimeCard: 220,
      WeatherCard: 380,
      LightStatusCard: 500,
      LightOverviewCard: 440,
      SensorCard: 500,
      RouterCard: 500,
      NASCard: 600,
      MediaPlayerCard: 500,
      MaxPlayerCard: 600,
      CurtainCard: 500,
      ElectricityCard: 500,
      ScriptPanel: 500,
      WaterPurifierCard: 460,
      IlluminanceCard: 500,
      CameraCard: 430,
      ClimateCard: 700,
      MotionCard: 400,
      SocketStatusCard: 500,
      PVECard: 500,
      UniversalCard: 300,
      FamilyCard: 500,
      ServerCard: 500,
      MapCard: 480,
      PcMonitorCard: 460,
      CpuGpuCard: 320,
      DiskCard: 300,
      BatteryCard: 330,
      MemoryCard: 300,
      IFrameCard: 430,
    };

    // 合并插件卡片的默认高度（运行时加载，按 manifest.defaultHeight）
    Object.assign(cardHeights, getPluginCardHeights());

    // 创建布局对象
    const layouts = {
      lg: [],
      md: [],
      sm: []
    };
    const header_height = 57;
    // 计算每个卡片的位置
    cards.filter(isHomeVisible).forEach((card, index) => {
      const cardId = card.id.toString();
      const card_config = card.config;
      let card_height = cardHeights[card.type] || 300;
      try {
        switch (card.type) {
          case 'MediaPlayerCard':
            card_height = card_config.mediaPlayers.length * 180 + header_height;
            break;
          case 'ClimateCard':
            card_height = Object.keys(card_config.features).length > 1 ? 700 : 610;
            break;
          case 'CameraCard':
            card_height = card_config.cameras.length * 170 + 30 + header_height;
            break;
          case 'CurtainCard':
            card_height = card_config.curtains.length * 200 + header_height;
            break;
          case 'IlluminanceCard':
            card_height = card_config.sensors.length * 75 + header_height;
            break;
          case 'LightStatusCard':
            const light_count = Object.keys(card_config.lights).length;
            // 每行最多三个 算出需要多少行
            const row_count = Math.ceil(light_count / 3);
            // 小等于于两个的时候 直接给300
            card_height = row_count <= 1 ? 210 : row_count * 140 + header_height;
            break;
          case 'SocketStatusCard':
            const socket_count = Object.keys(card_config.sockets).length;
            // 每行最多三个 算出需要多少行
            const socket_row_count = Math.ceil(socket_count / 3);
            // 小等于于两个的时候 直接给300
            card_height = socket_row_count <= 1 ? 210 : socket_row_count * 140 + header_height;
            break;
          case 'FamilyCard':
            // 每行最多三个
            const person_count = Object.keys(card_config.persons).length;
            const person_row_count = Math.ceil(person_count / 3);
            card_height = person_row_count * 160 + header_height;
            break;
          case 'ScriptPanel':
            const script_count = card_config.scripts.length;
            const script_row_count = Math.ceil(script_count / 2);
            card_height = script_row_count === 1 ? 160 : script_row_count * 75 + header_height;
            break;
          default:
            card_height = cardHeights[card.type] || 300;
        }
      } catch (error) {
        console.error('计算卡片高度失败:', error);
      }
      // 为每个断点计算布局
      Object.keys(layouts).forEach(breakpoint => {
        const { cardWidth, lastColumnWidth } = baseParams[breakpoint];

        // 计算卡片位置
        let col, row;

        if (breakpoint === 'sm') {
          // 移动端保持单列布局
          col = 0;
          row = index;
        } else {
          // 非移动端使用多列布局
          // 根据列数动态计算位置
          const columnPosition = index % columnCount;
          
          // 计算列位置
          if (columnPosition < columnCount - 1) {
            // 非最后一列使用标准宽度
            col = columnPosition * cardWidth;
          } else {
            // 最后一列需要特殊处理，使用剩余宽度
            col = (columnCount - 1) * cardWidth;
          }
          
          row = Math.floor(index / columnCount);
        }

        // 确定卡片宽度 - 最后一列可能有特殊宽度
        const isLastColumn = (index % columnCount) === columnCount - 1;
        const width = isLastColumn ? lastColumnWidth : cardWidth;

        layouts[breakpoint].push({
          card_type: card.type,
          i: cardId,
          x: col,
          y: row * 10, // 简单的行间距
          w: width,
          h: card_height
        });
      });
    });

    return layouts;
  }, []);

  // 卡片内容缩放用的「默认尺寸」参考：来自 calculateDefaultLayouts（即卡片的设计尺寸）。
  // 卡片处于默认大小时不缩放，被拖动放大/缩小时内容跟着一起缩放。
  const defaultSizeMap = useMemo(() => {
    const visible = cards.filter(isHomeVisible);
    if (!visible.length) return {};
    const map = {};
    try {
      const def = calculateDefaultLayouts(visible);
      (def.lg || []).forEach((it) => {
        map[String(it.i)] = { w: it.w, h: it.h };
      });
    } catch (e) {
      // 拿不到参考尺寸就不缩放
    }
    return map;
  }, [cards, calculateDefaultLayouts]);

  // ===== 分组按钮按需显示 =====
  // 只显示「该处确实有卡片」的分组；一个都没有时 GroupTabs 自己会整体隐藏。
  // 这样主页卡片全在默认分组时，右上角就不会出现无意义的分组切换。

  /** 主页有卡片的分组（右上角工具栏用） */
  const homeGroups = useMemo(() => {
    const ids = new Set();
    cards.forEach((c) => {
      if (isHomeVisible(c)) ids.add(c.group || 'default');
    });
    return (groups || []).filter((g) => ids.has(g.id));
  }, [cards, groups]);

  /** 有下拉屏卡片的分组（下拉屏导航栏用） */
  const drawerGroups = useMemo(() => {
    const ids = new Set();
    cards.forEach((c) => {
      if (c.inDrawer === true && c.visible !== false) ids.add(c.group || 'default');
    });
    return (groups || []).filter((g) => ids.has(g.id));
  }, [cards, groups]);

  // ===== 主页「实际生效的分组」=====
  // 当前分组在主页没有任何卡片时（例如在下拉屏切到了只有下拉屏卡片的分组），
  // 一律按「全部」处理：主页不会变空白，布局也不会和显示的卡片对不上。
  const homeGroupOf = useCallback(
    (g) => {
      if (!g || g === '_all') return '_all';
      return cards.some((c) => isHomeVisible(c) && (c.group || 'default') === g) ? g : '_all';
    },
    [cards]
  );
  const effectiveHomeGroup = homeGroupOf(activeGroup);

  // 主页除下拉屏外的卡片保持常驻：分组切换只切 visibility，不卸载/重挂卡片组件。
  // 这样天气/图表/摄像头等组件状态和 backdrop-filter 合成层都不会在切分组时重建。
  const homeGridCards = useMemo(() => cards.filter(isHomeVisible), [cards]);
  const activeHomeCards = useMemo(
    () => homeGridCards.filter((c) => effectiveHomeGroup === '_all' || (c.group || 'default') === effectiveHomeGroup),
    [homeGridCards, effectiveHomeGroup]
  );

  // 修改布局状态
  // ⚠️ 必须声明在 renderLayouts 之前：renderLayouts 的依赖数组里要用到 currentLayouts，
  //    而依赖数组是在渲染期立即求值的，声明放在后面会触发 TDZ（Cannot access
  //    'currentLayouts' before initialization）导致整个 Home 组件崩溃。
  const [currentLayouts, setCurrentLayouts] = useState(() => {
    try {
      // 判断是否为移动设备
      const isMobileDevice = window.innerWidth < 768;
      const layoutKey = isMobileDevice ? 'mobile-dashboard-layouts' : 'desktop-dashboard-layouts';
      const defaultLayoutKey = isMobileDevice ? 'mobile-default-dashboard-layouts' : 'desktop-default-dashboard-layouts';

      const savedLayouts = localStorage.getItem(layoutKey);
      const defaultLayouts = localStorage.getItem(defaultLayoutKey);

      // 至少某个断点里有卡片才算「有布局」；{lg:[],md:[],sm:[]} 这种空壳不算，
      // 否则首屏会先按空布局渲染一下（卡片塌成一条线），要等 loadConfig 跑完才恢复。
      const hasItems = (l) =>
        !!l && ['lg', 'md', 'sm'].some((bp) => Array.isArray(l[bp]) && l[bp].length > 0);

      // 处理已保存的布局
      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts);
        if (hasItems(parsedLayouts)) {
          return parsedLayouts;
        }
      }

      // 处理默认布局
      if (defaultLayouts) {
        const parsedDefaultLayouts = JSON.parse(defaultLayouts);
        if (hasItems(parsedDefaultLayouts)) {
          return parsedDefaultLayouts;
        }
      }

      // 如果没有任何布局配置，返回空布局
      return {
        lg: [],
        md: [],
        sm: []
      };
    } catch (error) {
      console.error('解析布局配置失败:', error);
      return {
        lg: [],
        md: [],
        sm: []
      };
    }
  });

  // RGL 的 layout 必须含所有 children id；当前分组的真实布局照旧，非当前分组的卡片
  // 放在不显眼的 1x1 占位格里，再由 .home-group-hidden 隐藏。所有卡片 DOM key 保持稳定。
  const renderLayouts = useMemo(() => {
    const merged = {};
    ['lg', 'md', 'sm'].forEach((bp) => {
      const base = (currentLayouts[bp] || []).map((it) => ({ ...it, i: String(it.i) }));
      const present = new Set(base.map((it) => String(it.i)));
      const hidden = [];
      homeGridCards.forEach((card) => {
        const id = String(card.id);
        if (present.has(id)) return;
        // 隐藏组的卡片保持在 RGL children 里（组件不卸载），但其占位格与活动组重叠；
        // allowOverlap=true + compactType=null 保证这些占位不会挤动活动组的真实布局。
        hidden.push({ i: id, x: 0, y: 0, w: 1, h: 1, minW: 1, minH: 1 });
      });
      merged[bp] = [...base, ...hidden];
    });
    return merged;
  }, [currentLayouts, homeGridCards]);

  // 分组切换处理
  const handleGroupChange = (groupId) => {
    console.log('切换到分组:', groupId);
    setActiveGroup(groupId);
    localStorage.setItem('active-group', groupId);
    // 让网格播一次淡入（见下方 className 的 group-swap-*），把「瞬间切换」变丝滑
    setGroupSwapTick((n) => n + 1);

    // 加载对应分组的布局。
    // ⚠️ 用「主页实际生效的分组」：切到的分组在主页没有卡片时，主页会按「全部」显示，
    // 布局也必须用「全部」那份，否则读到的是一份空布局 → 卡片没有格子会塌成一条线。
    const g = homeGroupOf(groupId);
    const layoutKey = isMobile ? `mobile-${g}-layouts` : `desktop-${g}-layouts`;
    const savedLayouts = localStorage.getItem(layoutKey);

    const filteredCards = g === '_all'
      ? cards.filter(isHomeVisible)
      : cards.filter(card => isHomeVisible(card) && (card.group === g || (!card.group && g === 'default')));

    console.log('切换分组时的所有卡片:', cards.map(c => ({ id: c.id, type: c.type, group: c.group, visible: c.visible })));
    console.log('切换分组后筛选的卡片:', filteredCards.map(c => ({ id: c.id, type: c.type, group: c.group })));

    // ⚠️ 不能只判断「有没有存过布局」——{lg,md,sm} 这个外层永远有键，所以一份空布局
    // 也会被当成有效布局用。必须验证它确实覆盖了当前分组的卡片。
    // 否则会出现：某分组以前没有卡片 → 存下一份空布局 → 后来给这个分组加了卡片 →
    // 切过来时读到那份空布局，卡片没有格子，被 react-grid-layout 丢到默认 w:1/h:1 → 塌成一条线。
    let useLayout = null;
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        if (isLayoutValid(parsedLayouts, filteredCards)) useLayout = parsedLayouts;
      } catch (error) {
        console.error('加载布局失败:', error);
      }
    }
    if (!useLayout) {
      // 没存过 / 存的那份缺卡片 → 按该分组现有的卡片重新生成一份并落盘
      useLayout = calculateDefaultLayouts(filteredCards);
      localStorage.setItem(layoutKey, JSON.stringify(useLayout));
    }
    setCurrentLayouts(useLayout);
  };

  // 监听窗口大小变化
  useEffect(() => {
    function handleResize() {
      const newWidth = window.innerWidth;
      const newIsMobile = newWidth < 768;
      setWidth(newWidth);
      setIsMobile(newIsMobile);

      // 如果设备类型发生变化（从移动端到桌面端或反之），重新加载对应的布局
      if (newIsMobile !== isMobile) {
        const layoutKey = newIsMobile ? `mobile-${effectiveHomeGroup}-layouts` : `desktop-${effectiveHomeGroup}-layouts`;
        const savedLayouts = localStorage.getItem(layoutKey);

        // 该分组在主页实际显示的卡片（校验布局要用，规则和 handleGroupChange 一致）
        const groupCards = effectiveHomeGroup === '_all'
          ? cards.filter(isHomeVisible)
          : cards.filter(c => isHomeVisible(c) && (c.group || 'default') === effectiveHomeGroup);

        // 同 handleGroupChange：必须验证存下来的布局确实覆盖了这些卡片，不能只看「存过没有」
        let useLayout = null;
        if (savedLayouts) {
          try {
            const parsedLayouts = JSON.parse(savedLayouts);
            if (isLayoutValid(parsedLayouts, groupCards)) useLayout = parsedLayouts;
          } catch (error) {
            console.error('加载布局失败:', error);
          }
        }
        if (!useLayout) {
          useLayout = calculateDefaultLayouts(groupCards);
          localStorage.setItem(layoutKey, JSON.stringify(useLayout));
        }
        setCurrentLayouts(useLayout);

        // 设置列数
        if (newIsMobile) {
          setColumnCount({ lg: 1, md: 1, sm: 1 });
        } else {
          setColumnCount({ lg: 40, md: 40, sm: 1 });
        }
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cards, isMobile, calculateDefaultLayouts, effectiveHomeGroup]);
  // 添加一个函数，合并现有布局和新计算的布局
  const mergeLayouts = useCallback((defaultLayouts, currentLayouts, cardIds) => {
    const result = {};

    // 为每个断点处理布局
    for (const breakpoint of Object.keys(defaultLayouts)) {
      result[breakpoint] = [];

      // 保留现有卡片的布局
      cardIds.forEach(cardId => {
        // 查找现有布局中的项
        const existingItem = currentLayouts[breakpoint]?.find(item => item.i === cardId);
        if (existingItem) {
          // 如果存在，使用现有布局
          result[breakpoint].push(existingItem);
        } else {
          // 否则使用默认布局中的对应项
          const defaultItem = defaultLayouts[breakpoint].find(item => item.i === cardId);
          if (defaultItem) {
            result[breakpoint].push(defaultItem);
          }
        }
      });

      // 确保所有卡片都在结果中
      for (const defaultItem of defaultLayouts[breakpoint]) {
        if (!result[breakpoint].some(item => item.i === defaultItem.i)) {
          result[breakpoint].push(defaultItem);
        }
      }

      // 移除不存在的卡片
      result[breakpoint] = result[breakpoint].filter(item => cardIds.includes(item.i));
    }

    return result;
  }, []);
  // 只在「首次加载」显示整页 loading。
  // ⚠️ 若每次 effect 重跑（分组切换 / 断点变化）都 setLoading(true)，整块网格会被
  //    卸载成 Spin 再挂回来 → 整屏闪一下（已用真实浏览器实测确认：切换瞬间 .layout 会消失）。
  const initialLoadDoneRef = useRef(false);

  // 修改加载配置数据的 useEffect
  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (!initialLoadDoneRef.current) setLoading(true);

        // 尝试从后端获取卡片配置
        let response = await configApi.getConfig();
        if (response.code !== 200) {
          return
        }
        let config = response.data;

        // 设置分组配置
        if (config.globalConfig && config.globalConfig.groups) {
          setGroups(config.globalConfig.groups);
        }

        // 设置卡片配置
        if (config.cards) {
          const updatedCards = config.cards.map(card => ({
            ...card,
            visible: card.visible !== false,
            titleVisible: card.titleVisible !== false,
            inDrawer: card.inDrawer === true,
            group: card.config.group || 'default' // 如果没有分组，默认为 default
          }));
          setCards(updatedCards);

          // 设置布局配置（从本地存储加载）。
          // 这里用「主页实际生效的分组」：刚加载到的卡片里，若当前分组没有主页卡片就退回「全部」，
          // 和 handleGroupChange / 渲染过滤保持同一套规则（否则会读到空布局 → 卡片塌成一条线）。
          const loadHomeGroup = !activeGroup || activeGroup === '_all'
            ? '_all'
            : (updatedCards.some(c => isHomeVisible(c) && (c.group || 'default') === activeGroup) ? activeGroup : '_all');
          const layoutKey = isMobile ? `mobile-${loadHomeGroup}-layouts` : `desktop-${loadHomeGroup}-layouts`;
          const savedLayouts = localStorage.getItem(layoutKey);

          // 根据当前活动分组筛选卡片
          const filteredCards = loadHomeGroup === '_all'
            ? updatedCards.filter(isHomeVisible)
            : updatedCards.filter(card => isHomeVisible(card) && (card.group === loadHomeGroup || (!card.group && loadHomeGroup === 'default')));

          // 调试信息
          console.log('当前活动分组:', activeGroup);
          console.log('所有卡片:', updatedCards.map(c => ({ id: c.id, type: c.type, group: c.group })));
          console.log('筛选后的卡片:', filteredCards.map(c => ({ id: c.id, type: c.type, group: c.group })));

          let loadedLayouts;
          if (savedLayouts) {
            try {
              loadedLayouts = JSON.parse(savedLayouts);
              // 验证布局是否完整（使用当前分组的卡片进行验证）
              if (!isLayoutValid(loadedLayouts, filteredCards)) {
                // 布局不完整，需要合并默认布局
                const defaultLayouts = calculateDefaultLayouts(filteredCards);
                loadedLayouts = mergeLayouts(
                  defaultLayouts,
                  loadedLayouts,
                  filteredCards.map(card => card.id.toString())
                );
                // 保存更新后的布局
                localStorage.setItem(layoutKey, JSON.stringify(loadedLayouts));
              }
            } catch (error) {
              console.error('解析本地布局失败:', error);
              loadedLayouts = calculateDefaultLayouts(filteredCards);
              localStorage.setItem(layoutKey, JSON.stringify(loadedLayouts));
            }
          } else {
            // 没有本地布局，计算默认布局
            loadedLayouts = calculateDefaultLayouts(filteredCards);
            localStorage.setItem(layoutKey, JSON.stringify(loadedLayouts));
          }

          setCurrentLayouts(loadedLayouts);
        }

        if (config.globalConfig) {
          applyBackgroundToBody(config.globalConfig);
          setGlobalConfig(config.globalConfig || {});
        }


      } catch (error) {
        console.error('加载配置失败:', error);
        message.error('加载配置失败: ' + error.message);
      } finally {
        initialLoadDoneRef.current = true;
        setLoading(false);
      }
    };

    loadConfig();
    // ⚠️ 依赖里**不要**放 activeGroup：切分组由 handleGroupChange 负责读该分组的布局，
    //    这里再跑一遍只会整页重载（闪一下）。isMobile 要留（移动/桌面布局不同）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, calculateDefaultLayouts, mergeLayouts, isLayoutValid]);


  // const handleRefresh = () => {
  //   console.log('Refresh triggered');
  //   window.location.reload();
  // };

  // 添加未保存更改状态
  // const [ setHasUnsavedChanges] = useState(false);

  // isEditing 的 ref 镜像：handleLayoutChange 是渲染期被 react-grid-layout 回调的，
  // 闭包里的 isEditing 可能还是旧值，用 ref 取最新（下拉屏里踩过同样的坑）。
  const isEditingRef = useRef(isEditing);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // 处理布局变化
  const handleLayoutChange = (layout, layouts) => {
    // ⚠️ 只在编辑态接受并落盘。
    // RGL 在挂载 / 断点切换的瞬间会回传一份「自动生成」的布局，缺格子的卡片会被写成
    // w:1/h:1（一条线）；如果盲目保存，这种退化布局就被永久写进 localStorage 了。
    if (!isEditingRef.current) return;

    // renderLayouts 里附带了其它分组的隐藏占位卡片；布局持久化只保存当前分组的真实卡片。
    const activeIds = new Set(activeHomeCards.map((card) => String(card.id)));
    const layoutsForGroup = Object.fromEntries(
      Object.entries(layouts).map(([bp, items]) => [
        bp,
        (items || []).filter((item) => activeIds.has(String(item.i))),
      ])
    );
    setCurrentLayouts(layoutsForGroup);

    // 保存布局到本地存储（按分组存储）。
    // 用生效分组：显示的是哪一份，就存回哪一份，否则会存到别的分组名下。
    const layoutKey = isMobile ? `mobile-${effectiveHomeGroup}-layouts` : `desktop-${effectiveHomeGroup}-layouts`;
    localStorage.setItem(layoutKey, JSON.stringify(layoutsForGroup));
  };

  // 修改保存布局函数
  const handleSaveLayout = () => {
    try {
      // 保存布局到本地存储（按分组存储）。同 handleLayoutChange，用生效分组。
      const layoutKey = isMobile ? `mobile-${effectiveHomeGroup}-layouts` : `desktop-${effectiveHomeGroup}-layouts`;
      localStorage.setItem(layoutKey, JSON.stringify(currentLayouts));

      // 不再保存列数到本地存储

      setIsEditing(false);
      message.success(t('layout.saveSuccess'));
    } catch (error) {
      console.error('保存布局失败:', error);
      message.error(t('layout.saveFailed'));
    }
  };

  // 添加一个组件，用于显示列数选择器
  const ColumnSelector = ({ onColumnChange }) => {
    const [columns, setColumns] = useState(5);
    
    useEffect(() => {
      onColumnChange(columns);
    }, [columns, onColumnChange]);
    
    return (
      <div>
        <p>{t('config.resetLayoutWarning')}</p>
        <p style={{ marginTop: 10 }}>{t('config.selectColumnCount')}: {columns}</p>
        <Slider
          min={2}
          max={40}
          value={columns}
          marks={{
            2: '2',
            5: '5',
            8: '8',
            10: '10',
            20: '20',
            30: '30',
            40: '40'
          }}
          onChange={setColumns}
        />
      </div>
    );
  };

  // ===== 一键排列（和下拉屏导航栏里那个「自动排列」同一套思路）=====
  // 按当前视觉顺序（先 y 后 x）逐行收纳：本行从左往右放，放不下就换下一行，
  // 下一行的 y 加上本行最高的卡片高度。保留每张卡自己的宽高，不改变大小。
  // 主页的 rowHeight=1、margin=0，所以 h / y 都是像素，行高直接累加即可。
  const arrangeHomeLayouts = useCallback(
    (layouts) => {
      const colsByBp = { lg: columnCount.lg || 40, md: columnCount.md || 40, sm: 1 };
      const next = {};
      Object.keys(colsByBp).forEach((bp) => {
        const cols = colsByBp[bp];
        const source = Array.isArray(layouts[bp]) ? layouts[bp] : [];
        const ordered = source
          .map((item, idx) => ({ ...item, __order: idx }))
          .sort((a, b) => a.y - b.y || a.x - b.x || a.__order - b.__order);

        let x = 0;
        let y = 0;
        let rowH = 0;
        next[bp] = ordered.map((item) => {
          const w = Math.max(1, Math.min(Number.isFinite(item.w) ? item.w : cols, cols));
          const h = Math.max(20, Number.isFinite(item.h) ? item.h : 300);
          if (x > 0 && x + w > cols) {
            y += rowH;
            x = 0;
            rowH = 0;
          }
          const out = { ...item, x, y, w, h };
          delete out.__order;
          x += w;
          rowH = Math.max(rowH, h);
          return out;
        });
      });
      return next;
    },
    [columnCount]
  );

  // 点「一键排列」：重排并立即落盘（和编辑态拖动保存用的是同一个 key）
  const handleAutoArrange = () => {
    try {
      const arranged = arrangeHomeLayouts(currentLayouts);
      setCurrentLayouts(arranged);
      const layoutKey = isMobile
        ? `mobile-${effectiveHomeGroup}-layouts`
        : `desktop-${effectiveHomeGroup}-layouts`;
      localStorage.setItem(layoutKey, JSON.stringify(arranged));
      message.success(t('config.arrangeDone'));
    } catch (error) {
      console.error('一键排列失败:', error);
      message.error(t('layout.saveFailed'));
    }
  };

  // 修改重置布局功能
  const handleResetLayout = () => {
    try {
      // 手机端也需要确认，但不需要选择列数
      if (isMobile) {
        // 使用modal实例而非Modal.confirm
        modal.confirm({
          title: t('config.resetLayoutConfirm'),
          content: <p>{t('config.resetLayoutWarning')}</p>,
          onOk: () => {
            // 手机端使用固定的列数为1进行重置
            const newLayouts = calculateDefaultLayouts(cards, 1);

            setCurrentLayouts(newLayouts);

            // 保存到本地存储（按分组存储）
            localStorage.setItem(`mobile-${effectiveHomeGroup}-layouts`, JSON.stringify(newLayouts));

            setIsEditing(false);
            message.success(t('config.resetSuccess'));
          }
        });
      } else {
        // 非手机端显示列数选择对话框
        let selectedColumns = 5;
        
        // 使用modal实例而非Modal.confirm
        modal.confirm({
          title: t('config.resetLayoutConfirm'),
          content: <ColumnSelector onColumnChange={(value) => { selectedColumns = value; }} />,
          onOk: () => {
            // 使用最新的列数值
            const newLayouts = calculateDefaultLayouts(cards, selectedColumns);

            // 更新列数状态
            setColumnCount({ 
              lg: 40, // 总列数保持不变
              md: 40, 
              sm: 1 
            });

            setCurrentLayouts(newLayouts);

            // 保存到本地存储（按分组存储）
            localStorage.setItem(`desktop-${effectiveHomeGroup}-layouts`, JSON.stringify(newLayouts));

            setIsEditing(false);
            message.success(t('config.resetSuccess'));
          }
        });
      }
    } catch (error) {
      console.error('重置布局失败:', error);
      message.error('重置布局失败');
    }
  };

  // 处理触摸事件
  useEffect(() => {
    if (isMobile) {
      const preventScroll = (e) => {
        if (isDragging) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchmove', preventScroll, { passive: false });
      return () => document.removeEventListener('touchmove', preventScroll);
    }
  }, [isMobile, isDragging]);

  // 添加全屏相关的事件处理
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setSidebarVisible(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen, setSidebarVisible]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setSidebarVisible(false);

    // 保持背景图设置
    const applyBackground = async () => {
      try {
        const config = await configApi.getConfig();
        if (config.globalConfig) {
          if (config.globalConfig.backgroundColor) {
            document.body.style.backgroundColor = config.globalConfig.backgroundColor;
          }
          if (config.globalConfig.backgroundImage) {
            document.body.style.backgroundImage = `url(${config.globalConfig.backgroundImage})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
          }
        }
      } catch (error) {
        console.error('应用背景设置失败:', error);
      }
    };

    // 延迟一下应用背景，确保在全屏切换后应用
    setTimeout(applyBackground, 100);
  };

  // 添加触摸事件处理
  const handleTouchStart = (e) => {
    if (isFullscreen) {
      setTouchStartY(e.touches[0].clientY);
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (!isFullscreen || isDragging) return;

    const deltaY = e.touches[0].clientY - touchStartY;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);

    // 如果垂直滑动距离大于50px且水平滑动小于垂直滑动（确保是垂直下滑），则退出全屏
    if (deltaY > 50 && deltaX < deltaY) {
      setIsFullscreen(false);
      setSidebarVisible(false);
    }
  };

  // 关闭主题菜单的处理函数
  const handleClickOutside = useCallback((event) => {
    if (themeMenuVisible && !event.target.closest('.theme-menu-container')) {
      setThemeMenuVisible(false);
    }
  }, [themeMenuVisible]);

  // 添加点击外部关闭菜单的事件监听
  useEffect(() => {
    if (themeMenuVisible) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [themeMenuVisible, handleClickOutside]);

  // 全屏模式下工具栏默认隐藏，鼠标移到右上角才浮出来。
  // Wallpaper Engine 的网页壁纸里鼠标事件是正常工作的，所以壁纸模式下同样有效。
  useEffect(() => {
    if (!isFullscreen) {
      setToolbarPeek(false);
      return;
    }
    const onMove = (e) => {
      // 触发区：右上角一块，鼠标移进来就浮出工具栏
      const nearTopRight = e.clientX > window.innerWidth - 240 && e.clientY < 160;

      // ⚠️ 工具栏浮出后，只要鼠标还在「工具栏自身范围内」就继续保持显示。
      // 否则工具栏变宽后（比如里面放了分组标签），鼠标从右侧按钮往左移到分组上时
      // 会先离开右上角触发区 → 工具栏缩回去 → 分组根本点不到。
      let overHeader = false;
      const el = headerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const pad = 10;
          overHeader =
            e.clientX >= r.left - pad &&
            e.clientX <= r.right + pad &&
            e.clientY >= r.top - pad &&
            e.clientY <= r.bottom + pad;
        }
      }

      setToolbarPeek(nearTopRight || overHeader);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isFullscreen]);

  // 内容缩放：当前断点下，每个卡片的格子尺寸 / 默认尺寸
  const activeBp = width > 1200 ? 'lg' : width > 768 ? 'md' : 'sm';
  const homeItemById = {};
  (renderLayouts[activeBp] || []).forEach((it) => {
    homeItemById[String(it.i)] = it;
  });

  const renderCard = (card) => {
    // 组件从卡片注册表获取（见 src/cards/registry.js），插件化后无需改这里
    const Component = getCardComponent(card.type);
    if (!Component) return null;

    // 在「卡片管理」里被禁用的卡片：不渲染真实组件（顺带省性能），显示占位提示
    if (disabledCardTypes.has(card.type)) {
      return (
        <div className="card-disabled-placeholder" key={card.id}>
          <Icon path={mdiCancel} size={22} />
          <span className="cdp-title">{(card.config && card.config.title) || card.type}</span>
          <span className="cdp-hint">{t('config.cardDisabled')}</span>
        </div>
      );
    }

    return <Component
      key={card.id}
      config={{ ...card.config, titleVisible: card.titleVisible }}
    />;
  };



  // 「锁定大小」：卡片右下角锁按钮。
  // 语义 = 锁定**当时那一刻**的缩放比：先把卡片拉到想要的文字大小，按锁 → 之后再怎么拉伸都不变。
  // 再按一次解锁，回到默认的自适应缩放。currentScale 是当前算出来的缩放比。
  const toggleCardScaleLock = useCallback(async (card, currentScale) => {
    const lockedNow = typeof card.scaleLock === 'number';
    const nextLock = lockedNow ? null : Math.round(currentScale * 1000) / 1000;
    // 先本地生效，界面不用等网络
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, scaleLock: nextLock } : c)));
    try {
      const resp = await configApi.getConfig();
      const full = resp.data;
      const nextCards = (full.cards || []).map((c) =>
        c.id === card.id ? { ...c, scaleLock: nextLock } : c
      );
      await configApi.saveConfig({ ...full, cards: nextCards });
    } catch (e) {
      console.error('保存「锁定大小」失败:', e);
      // 失败就回滚，避免界面和落盘不一致
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, scaleLock: card.scaleLock } : c)));
    }
  }, []);

  // 添加一个计算默认布局的函数


  // 添加一个函数，用于确保布局中包含所有卡片
  const updateLayoutsForCards = useCallback(() => {
    // 当前布局只属于「主页实际生效的分组」，不要拿其它组卡片来验证/合并。
    const visibleCards = activeHomeCards;
    const cardIds = visibleCards.map(card => String(card.id));

    // 检查当前布局是否包含所有卡片
    const allBreakpoints = ['lg', 'md', 'sm'];
    let needsUpdate = false;

    // 为每个断点检查布局
    for (const breakpoint of allBreakpoints) {
      if (!currentLayouts[breakpoint]) {
        needsUpdate = true;
        break;
      }

      // 确认所有可见卡片都在布局中
      const layoutItemIds = currentLayouts[breakpoint].map(item => item.i);
      for (const cardId of cardIds) {
        if (!layoutItemIds.includes(cardId)) {
          needsUpdate = true;
          break;
        }
      }

      // 移除布局中不存在的卡片
      const hasExtraItems = currentLayouts[breakpoint].some(item => !cardIds.includes(item.i));
      if (hasExtraItems) {
        needsUpdate = true;
      }

      if (needsUpdate) break;
    }

    // 如果需要更新布局，重新计算并保存
    if (needsUpdate) {
      const newLayouts = mergeLayouts(calculateDefaultLayouts(visibleCards), currentLayouts, cardIds);
      setCurrentLayouts(newLayouts);

      // 保存新布局到本地
      const layoutKey = isMobile
        ? `mobile-${effectiveHomeGroup}-layouts`
        : `desktop-${effectiveHomeGroup}-layouts`;
      localStorage.setItem(layoutKey, JSON.stringify(newLayouts));
    }
  }, [currentLayouts, activeHomeCards, isMobile, effectiveHomeGroup, calculateDefaultLayouts, mergeLayouts]);

  // 添加一个函数，验证布局是否包含所有可见卡片


  // 添加对cards变化的监听
  useEffect(() => {
    // 当卡片列表发生变化时，检查并更新布局
    if (cards.length > 0 && !loading) {
      updateLayoutsForCards();
    }
  }, [cards, loading, updateLayoutsForCards]);

  // 卡片悬停水波特效：全局配置里可关。
  // 关掉后：不挂鼠标监听（CardRippleEffect 不渲染），body 上也没有 ripple-on 类，
  // CSS 里的 ::after 涟漪完全不生效 —— 省掉持续 mousemove + 背景动画的开销。
  const rippleOn = globalConfig.cardRipple !== false;
  useEffect(() => {
    document.body.classList.toggle('ripple-on', rippleOn);
    return () => document.body.classList.remove('ripple-on');
  }, [rippleOn]);

  // 卡片相关的外观变量（标题高度 / 标题字号），挂在 .content 上供所有卡片继承。
  // 透明度 / 毛玻璃已移除，改由 theme/liquid-glass.css 的固定「液态玻璃」样式统一控制。
  const contentStyle = {};
  if (globalConfig.cardTitleHeight != null && String(globalConfig.cardTitleHeight).trim() !== '') {
    contentStyle['--card-title-h'] = `${String(globalConfig.cardTitleHeight).replace('px', '').trim()}px`;
  }
  if (globalConfig.cardTitleFontSize != null && String(globalConfig.cardTitleFontSize).trim() !== '') {
    contentStyle['--card-title-font'] = `${String(globalConfig.cardTitleFontSize).replace('px', '').trim()}px`;
  }

  return (
    <div
      className={`page-container ${!sidebarVisible ? 'sidebar-hidden' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* 添加contextHolder以确保模态对话框使用全局主题 */}
      {contextHolder}

      {/* 卡片悬停水波特效（较耗性能，可在「全局配置」里关闭） */}
      {rippleOn && <CardRippleEffect />}

      {/* 液态玻璃折射：给卡片边缘加上真实的折射（只在不支持时自动跳过） */}
      <LiquidGlassRefraction />

      {/* 顶部中上缘悬停下拉面板：放 inDrawer 卡片 */}
      <TopDrawer
        cards={cards.filter(c => {
          if (c.inDrawer !== true || c.visible === false) return false;
          // 和主页用同一套分组规则：两边一起过滤
          if (activeGroup === '_all') return true;
          return (c.group || 'default') === activeGroup;
        })}
        renderCard={renderCard}
        // 是否「还存在任何下拉屏卡片」——用来决定面板整体要不要渲染（见 TopDrawer 里的说明）
        hasDrawerCards={cards.some(c => c.inDrawer === true && c.visible !== false)}
        groups={drawerGroups}
        activeGroup={activeGroup}
        onGroupChange={handleGroupChange}
        settings={{
          drawerWidth: globalConfig.drawerWidth,
          drawerHeight: globalConfig.drawerHeight,
          drawerLeft: globalConfig.drawerLeft,
          drawerTriggerWidth: globalConfig.drawerTriggerWidth,
          drawerTriggerColor: globalConfig.drawerTriggerColor,
          drawerTriggerOpacity: globalConfig.drawerTriggerOpacity,
          drawerLayouts: globalConfig.drawerLayouts,
          // 面板毛玻璃 / 背景透明度（全局配置 → 下拉面板；只在面板上生效）
          drawerOpacity: globalConfig.drawerOpacity,
          drawerBlur: globalConfig.drawerBlur,
          // 卡片标题设置：主页 / 下拉屏统一使用同一份全局配置
          cardTitleHeight: globalConfig.cardTitleHeight,
          cardTitleFontSize: globalConfig.cardTitleFontSize,
        }}
      />

      {/* 主页通知弹窗：接收 webhook 推送，位置/大小/时长可在全局配置里调，编辑模式可拖动摆放 */}
      <NotificationPopup
        settings={{
          notifyEnabled: globalConfig.notifyEnabled,
          notifyPosition: globalConfig.notifyPosition,
          notifyDuration: globalConfig.notifyDuration,
          notifyWidth: globalConfig.notifyWidth,
          notifyHeight: globalConfig.notifyHeight,
          notifyX: globalConfig.notifyX,
          notifyY: globalConfig.notifyY,
        }}
        editable={isEditing}
        onSavePosition={(x, y) => {
          configApi
            .setGlobalConfig({ notifyX: x, notifyY: y })
            .catch((e) => console.error('[notify] 保存弹窗位置失败:', e));
        }}
      />
      
      {/* <PullToRefresh
        onRefresh={handleRefresh}
        pullingText="下拉刷新"
        canReleaseText="释放立即刷新"
        refreshingText="刷新中..."
        completeText="刷新完成"
      > */}
      <div
        className="content"
        style={Object.keys(contentStyle).length ? contentStyle : undefined}
      >
        {loading ? (
          <div className="loading-state">
            <Spin size="large" />
            <p>{t('loading')}</p>
          </div>
        ) : (
          <>
            <div ref={headerRef} className={`header ${isFullscreen ? (toolbarPeek ? 'peek' : 'hidden') : ''}`}>
              {/* 分组标签栏（右上角工具栏里）。下拉屏导航栏里也有一份，
                  两边共用同一个 activeGroup，切换任意一边，主页和下拉屏的卡片会一起过滤。 */}
              <GroupTabs
                groups={homeGroups}
                activeGroup={activeGroup}
                onGroupChange={handleGroupChange}
                isEditing={false}
              />
              
              <div className="theme-menu-container">
                 
                <button
                  className="theme-toggle"
                  onClick={() => setThemeMenuVisible(!themeMenuVisible)}
                  title={t('theme.' + theme)}
                >
                  <Icon
                    path={getThemeIcon()}
                    size={14}
                    color="var(--color-text-primary)"
                  />
                </button>

                {themeMenuVisible && (
                  <div className="theme-menu">
                    <button
                      className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => {
                        setSpecificTheme('light');
                        setThemeMenuVisible(false);
                      }}
                    >
                      <Icon path={mdiWhiteBalanceSunny} size={12} />
                      <span>{t('theme.light')}</span>
                    </button>
                    <button
                      className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => {
                        setSpecificTheme('dark');
                        setThemeMenuVisible(false);
                      }}
                    >
                      <Icon path={mdiWeatherNight} size={12} />
                      <span>{t('theme.dark')}</span>
                    </button>
                    <button
                      className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                      onClick={() => {
                        setSpecificTheme('system');
                        setThemeMenuVisible(false);
                      }}
                    >
                      <Icon path={mdiMonitor} size={12} />
                      <span>{t('theme.system')}</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                className="language-toggle"
                onClick={toggleLanguage}
                title={t('language.toggle')}
              >
                <Icon
                  path={mdiGoogleTranslate}
                  size={14}
                  color="var(--color-text-primary)"
                />
              </button>

              <button
                className="config-toggle"
                onClick={() => navigate('/config')}
                title={t('nav.config')}
              >
                <Icon
                  path={mdiCog}
                  size={14}
                  color="var(--color-text-primary)"
                />
              </button>

              {!isEditing && (
                <button
                  className="edit-toggle"
                  onClick={() => setIsEditing(true)}
                  title={t('edit')}
                >
                  <Icon
                    path={mdiPencil}
                    size={14}
                    color="var(--color-text-primary)"
                  />
                </button>
              )}
              {isEditing && (
                <button
                  className="reset-layout"
                  onClick={handleResetLayout}
                  title={t('reset')}
                >
                  <Icon
                    path={mdiRefresh}
                    size={14}
                    color="var(--color-text-primary)"
                  />
                </button>
              )}
              {isEditing && !isMobile && (
                <button
                  className={`pc-edit-toggle ${isEditing ? 'active' : ''}`}
                  onClick={() => {
                    handleSaveLayout()
                  }}
                  title={t('done')}
                >
                  <Icon
                    path={mdiCheck}
                    size={14}
                    color="var(--color-text-primary)"
                  />
                </button>
              )}

              <button
                className="fullscreen-toggle"
                onClick={toggleFullscreen}
                title={t(`fullscreen.${isFullscreen ? 'exit' : 'enter'}`)}
              >
                <Icon
                  path={isFullscreen ? mdiFullscreenExit : mdiFullscreen}
                  size={14}
                  color="var(--color-text-primary)"
                />
              </button>
            </div>

           

            <Responsive
              className={`layout ${isEditing ? 'editing' : ''} ${groupSwapTick > 0 ? `group-swap-${groupSwapTick % 2}` : ''}`}
              layouts={renderLayouts}
              breakpoints={{ lg: 1200, md: 768, sm: 480 }}
              cols={columnCount}
              rowHeight={1}
              width={width}
              margin={[0, 0]}
              containerPadding={isMobile ? [16, 16] : [20, 20]}
              isDraggable={isEditing}
              isResizable={isEditing}
              draggableHandle={isMobile ? ".card-header" : undefined}
              onDragStart={() => setIsDragging(true)}
              onDragStop={() => setIsDragging(false)}
              resizeHandles={['se']}
              useCSSTransforms={true}
              // 保持跨分组的卡片组件常驻；隐藏组的 1x1 占位会与活动组重叠，不能压紧/挤动真实布局。
              compactType={null}
              allowOverlap={true}
              preventCollision={false}
              onLayoutChange={handleLayoutChange}
              resizeHandleWrapperClass="resize-handle-wrapper"
            >
              {homeGridCards.map((card) => {
                const cardGroup = card.group || 'default';
                const isVisibleInGroup = effectiveHomeGroup === '_all' || cardGroup === effectiveHomeGroup;
                const it = homeItemById[String(card.id)];
                const def = defaultSizeMap[String(card.id)];
                const sx = it && def && def.w ? it.w / def.w : 1;
                const sy = it && def && def.h ? it.h / def.h : 1;
                return (
                  <div
                    key={card.id}
                    className={isVisibleInGroup ? 'home-group-card' : 'home-group-card home-group-hidden'}
                    aria-hidden={!isVisibleInGroup}
                  >
                    <ScaledCard
                      sx={sx}
                      sy={sy}
                      noScale={NO_SCALE_CARD_TYPES.has(card.type)}
                      scaleLock={card.scaleLock}
                    >
                      {renderCard(card)}
                    </ScaledCard>
                    {/* 编辑模式下：缩放键右边的「锁定大小」。
                        按下去 = 锁定当前这个缩放比，之后再拉伸卡片大小都不变；
                        再按一次解锁，回到默认的自适应缩放。 */}
                    {isEditing && (
                      <button
                        type="button"
                        className={'card-lock-btn' + (typeof card.scaleLock === 'number' ? ' active' : '')}
                        title={t('config.fixedTextSizeHint')}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardScaleLock(card, Math.sqrt((sx || 1) * (sy || 1)));
                        }}
                      >
                        <Icon
                          path={typeof card.scaleLock === 'number' ? mdiLock : mdiLockOpenVariant}
                          size={12}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </Responsive>

            {/* 添加保存按钮 */}
            {isEditing && (
              <button
                className="save-button has-changes"
                onClick={handleSaveLayout}
                title={t('config.save')}
              >
                <Icon path={mdiCheck} size={28} />
              </button>
            )}

            {/* 一键排列：和「保存」同款圆钮，摆在它正上方 */}
            {isEditing && (
              <button
                className="arrange-button"
                onClick={handleAutoArrange}
                title={t('config.drawerAutoArrange')}
              >
                <Icon path={mdiAutoFix} size={26} />
              </button>
            )}

            {cards.filter(isHomeVisible).length === 0 && (
              <div className="empty-state" onClick={() => navigate('/config')}>
                <Icon path={mdiViewDashboard} size={42} color="var(--color-text-secondary)" />
                <h2>{t('empty.title')}</h2>
                <p>{t('empty.desc')}</p>
              </div>
            )}

            {isEditing && isMobile && (
              <button
                className="edit-toggle active"
                onClick={() => {
                  handleSaveLayout();
                }}
                title="完成编辑"
              >
                <Icon
                  path={mdiCheck}
                  size={17}
                />
              </button>
            )}
          </>
        )}
      </div>
      {/* </PullToRefresh> */}
    </div>
  );
}

export default Home;