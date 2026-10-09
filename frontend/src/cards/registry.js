// 卡片注册表：把「卡片类型 -> 组件」的映射集中管理。
// 这是插件化的基础——未来插件只需在加载时调用 registerCard(type, Component)，
// 即可把自己的卡片加入面板，无需改动 Home 或其他核心代码。

import TimeCard from '../components/TimeCard';
import WeatherCard from '../components/WeatherCard';
import SensorCard from '../components/SensorCard';
import MediaPlayerCard from '../components/MediaPlayerCard';
import LightOverviewCard from '../components/LightOverviewCard';
import LightStatusCard from '../components/LightStatusCard';
import CameraSection from '../components/CameraSection';
import CurtainCard from '../components/CurtainCard';
import ElectricityCard from '../components/ElectricityCard';
import ClimateCard from '../components/ClimateCard';
import RouterCard from '../components/RouterCard';
import NASCard from '../components/NASCard';
import ScriptPanel from '../components/ScriptPanel';
import WaterPurifierCard from '../components/WaterPurifierCard';
import IlluminanceCard from '../components/IlluminanceCard';
import MotionCard from '../components/MotionCard';
import SocketStatusCard from '../components/SocketStatusCard';
import MaxPlayerCard from '../components/MaxPlayerCard';
import UniversalCard from '../components/UniversalCard';
import FamilyCard from '../components/FamilyCard';
import ServerCard from '../components/ServerCard';
import PVECard from '../components/PVECard';
import DailyQuoteCard from '../components/DailyQuoteCard';
import WashingMachineCard from '../components/WashingMachineCard';
import MapCard from '../components/MapCard';
import PcMonitorCard from '../components/PcMonitorCard';
import CpuGpuCard from '../components/CpuGpuCard';
import DiskCard from '../components/DiskCard';
import BatteryCard from '../components/BatteryCard';
import MemoryCard from '../components/MemoryCard';
import IFrameCard from '../components/IFrameCard';
// 注意：内置的 NotifyHistoryCard（旧版消息通知）已移除，
// 消息通知请用插件版（plugin-dev/notify-pro，cardType = NotifyHistoryCardPro）。

// 类型名与组件名不一致的情况在这里显式指定（如 CameraCard 对应 CameraSection）
const builtinCards = {
  TimeCard,
  WeatherCard,
  SensorCard,
  MediaPlayerCard,
  LightStatusCard,
  LightOverviewCard,
  CurtainCard,
  ElectricityCard,
  ScriptPanel,
  WaterPurifierCard,
  IlluminanceCard,
  RouterCard,
  NASCard,
  ClimateCard,
  MotionCard,
  SocketStatusCard,
  MaxPlayerCard,
  UniversalCard,
  FamilyCard,
  ServerCard,
  PVECard,
  DailyQuoteCard,
  WashingMachineCard,
  MapCard,
  PcMonitorCard,
  CpuGpuCard,
  DiskCard,
  BatteryCard,
  MemoryCard,
  IFrameCard,
  CameraCard: CameraSection,
};

const registry = new Map();

// 注册/覆盖一个卡片类型。插件调用这个就能加入自己的卡片。
export function registerCard(type, Component) {
  if (!type || !Component) {
    console.warn('[cardRegistry] registerCard 需要 type 和 Component:', type);
    return;
  }
  registry.set(type, Component);
}

// 取某个类型的组件；找不到返回 null。
export function getCardComponent(type) {
  return registry.get(type) || null;
}

// 列出所有已注册的类型（调试/插件发现用）。
export function getAllCardTypes() {
  return Array.from(registry.keys());
}

// 注册全部内置卡片（模块加载时执行一次）。
Object.entries(builtinCards).forEach(([type, Component]) => {
  registerCard(type, Component);
});
