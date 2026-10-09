import React, { useState, useRef, useEffect } from 'react';
import Icon from '@mdi/react';
import {
  mdiPlus,
  mdiDelete,
  mdiClockOutline,
  mdiWeatherPartlyCloudy,
  mdiLightbulbGroup,
  mdiThermometer,
  mdiPlayCircle,
  mdiRouterNetwork,
  mdiCctv,
  mdiCurtains,
  mdiWaterPump,
  mdiLightningBolt,
  mdiWhiteBalanceSunny,
  mdiServerNetwork,
  mdiScriptText,
  mdiCheck,
  // mdiEye,
  // mdiEyeOff,
  mdiSnowflake,
  mdiExport,
  mdiImport,
  mdiMotionSensor,
  mdiHomeFloorG,
  mdiFileFind,
  // mdiClose,
  mdiPencil,
  mdiArrowLeft,
  mdiCog,
  mdiPowerSocket,
  mdiAccountGroup,
  mdiServer,
  mdiFormatQuoteClose,
  // mdiWashingMachine,
  mdiHelpCircle,
  mdiViewDashboard,
  mdiMapMarkerRadius,
  mdiUpload,
  mdiCardsOutline,
  mdiFolderImage,
  mdiDesktopTowerMonitor,
  mdiChip,
  mdiExpansionCard,
  mdiMemory,
  mdiHarddisk,
  mdiBatteryOutline,
  mdiWeb,
} from '@mdi/js';
import * as mdiIcons from '@mdi/js';
import { getPluginCardCatalog, getCardNameOverrides, getCardDisabled } from '../../plugin/loader';
import { resolveCardDisplayName } from '../../utils/cardTranslation';
import AddCardModal from '../../components/AddCardModal';
import EditCardModal from '../../components/EditCardModal';
// import Modal from '../../components/Modal';
import { message, Button, Space, Dropdown, Switch, Spin, Popconfirm, Select } from 'antd';
import { useLanguage } from '../../i18n/LanguageContext';
import { configApi } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import GlobalConfig from '../../components/GlobalConfig';
import './style.css';
import VersionListModal from '../../components/VersionList';
import GroupManager from '../../components/GroupManager';
import UploadPluginModal from '../../components/UploadPluginModal';
import CardManagerModal from '../../components/CardManagerModal';
import AttachmentManagerModal from '../../components/AttachmentManagerModal';

// 添加默认图标常量
const DEFAULT_CARD_ICON = mdiHelpCircle;

const getCardTypes = (t, groups = []) => ({
  TimeCard: {
    name: t('cards.time'),
    icon: mdiClockOutline,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.time')
      },
      {
        key: 'timeFormat',
        label: t('fields.timeFormat'),
        type: 'text',
        default: 'HH:mm:ss'
      },
      {
        key: 'dateFormat',
        label: t('fields.dateFormat'),
        type: 'text',
        default: 'YYYY-MM-DD'
      }
    ]
  },
  WeatherCard: {
    name: t('cards.weather'),
    icon: mdiWeatherPartlyCloudy,
    fields: [
      {
        key: 'style',
        label: t('fields.weatherStyle'),
        type: 'select',
        default: 'default',
        options: [
          { value: 'default', label: t('fields.weatherStyleDefault') },
          { value: 'clock', label: t('fields.weatherStyleClock') },
          { value: 'forecast', label: t('fields.weatherStyleForecast') }
        ]
      },
      { key: 'location', label: t('fields.weatherLocation'), type: 'text', default: '' },

      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.weather')
      },
      {
        key: 'entity_id',
        label: t('fields.weatherEntity'),
        type: 'entity',
        filter: 'weather.*',
        default: ''
      }
    ]
  },
  LightStatusCard: {
    name: t('cards.light'),
    icon: mdiLightbulbGroup,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.lightStatus')
      },
      {
        key: 'lights',
        label: t('fields.lightsConfig'),
        type: 'lights-config',
        default: {}
      }
    ]
  },
  SensorCard: {
    name: t('cards.sensor'),
    icon: mdiThermometer,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.sensor')
      },
      {
        key: 'sensors',
        label: t('fields.sensorsConfig'),
        type: 'sensor-group',
        default: []
      }
    ]
  },
  MediaPlayerCard: {
    name: t('cards.media'),
    icon: mdiPlayCircle,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.mediaplayer')
      },
      {
        key: 'mediaPlayers',
        label: t('fields.mediaPlayersConfig'),
        type: 'media-players',
        default: []
      }
    ]
  },
  MaxPlayerCard: {  
    name: t('cards.maxPlayer'),
    icon: mdiPlayCircle,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.maxPlayer')
      },
      {
        key: 'entity_id',
        label: t('configField.selectEntity'),
        type: 'entity',
        filter: 'media_player.*',
        default: ''
      }
    ]
  },
  RouterCard: {
    name: t('cards.router'),
    icon: mdiRouterNetwork,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.router')
      },
      {
        key: 'router',
        label: t('fields.routerConfig'),
        type: 'router-config',
        default: {}
      }
    ]
  },
  NASCard: {
    name: t('cards.nas'),
    icon: mdiServerNetwork,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.nas')
      },
      {
        key: 'syno_nas',
        label: t('fields.nasConfig'),
        type: 'nas-config',
        default: {}
      }
    ]
  },
  PVECard: {
    
    name: t('cards.pve'),
    icon: mdiServer,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.pve')
      },
      {
        key: 'pve_server',
        label: t('fields.pveConfig'),
        type: 'pve-config',
        default: {}
      }
    ]
  },
  ServerCard: {
    name: t('cards.server'),
    icon: mdiServer,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.server')
      },
      {
        key: 'server',
        label: t('fields.serverConfig'),
        type: 'server-config',
        default: {}
      }
    ]
  },
  CameraCard: {
    name: t('cards.camera'),
    icon: mdiCctv,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.camera')
      },
      {
        key: 'cameras',
        label: t('fields.camerasConfig'),
        type: 'cameras-config',
        default: []
      }
    ]
  },
  IFrameCard: {
    name: t('cards.iframe'),
    icon: mdiWeb,
    fields: [
      {
        key: 'url',
        label: t('fields.iframeUrl'),
        type: 'text',
        placeholder: 'https://example.com',
        default: ''
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.iframe')
      },
      {
        key: 'scroll',
        label: t('fields.iframeScroll'),
        type: 'switch',
        default: true,
        hint: t('fields.iframeScrollHint')
      },
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      }
    ]
  },
  CurtainCard: {
    name: t('cards.curtain'),
    icon: mdiCurtains,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.curtain')
      },
      {
        key: 'curtains',
        label: t('fields.curtainsConfig'),
        type: 'curtains-config',
        default: []
      }
    ]
  },
  ElectricityCard: {
    name: t('cards.electricity'),
    icon: mdiLightningBolt,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.electricity')
      },
      {
        key: 'electricity',
        label: t('fields.electricityConfig'),
        type: 'electricity-config',
        default: {}
      }
    ]
  },
  ScriptPanel: {
    name: t('cards.script'),
    icon: mdiScriptText,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.script')
      },
      {
        key: 'scripts',
        label: t('fields.scriptsConfig'),
        type: 'scripts-config',
        default: []
      }
    ]
  },
  WaterPurifierCard: {
    name: t('cards.water'),
    icon: mdiWaterPump,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.water')
      },
      {
        key: 'waterpuri',
        label: t('fields.waterConfig'),
        type: 'waterpuri-config',
        default: {}
      }
    ]
  },
  IlluminanceCard: {
    name: t('cards.illuminance'),
    icon: mdiWhiteBalanceSunny,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.illuminance')
      },
      {
        key: 'sensors',
        label: t('fields.illuminanceConfig'),
        type: 'illuminance-config',
        default: []
      }
    ]
  },
  ClimateCard: {
    name: t('cards.climate'),
    icon: mdiSnowflake,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.climate')
      },

      {
        key: 'name',
        label: t('fields.name'),
        type: 'text'
      },
      {
        key: 'entity_id',
        label: t('fields.climateEntity'),
        type: 'entity',
        filter: 'climate.*'
      },
      {
        key: 'temperature_entity_id',
        label: t('configField.climateTemperatureEntity'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'humidity_entity_id',
        label: t('configField.climateHumidityEntity'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'features',
        label: t('fields.featuresConfig'),
        type: 'climate-features',
        default: {}
      }
    ]
  },
  MotionCard: {
    name: t('cards.motion'),
    icon: mdiMotionSensor,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.motion')
      },
      {
        key: 'motion_entity_id',
        label: t('fields.motionEntity'),
        type: 'entity',
        filter: 'event.*'
      },
      {
        key: 'lux_entity_id',
        label: t('fields.luxEntity'),
        type: 'entity',
        filter: 'sensor.*'
      }
    ]
  },
  LightOverviewCard: {
    name: t('cards.lightOverview'),
    icon: mdiHomeFloorG,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.lightOverview')
      },
      {
        key: 'layout',
        label: t('fields.lightLayout'),
        type: 'light-overview-editor'
      },
      {
        key: 'scenes',
        label: t('fields.lightScenes'),
        type: 'light-scenes-config',
        default: []
      }
    ]
  },
  SocketStatusCard: {
    name: t('cards.socket'),
    icon: mdiPowerSocket,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.socketStatus')
      },
      {
        key: 'sockets',
        label: t('fields.socketsConfig'),
        type: 'socket-config',
        default: {}
      }
    ]
  },
  UniversalCard: {
    name: t('cards.universal'),
    icon: mdiThermometer,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.universal')
      },
      {
        key: 'entities',
        label: t('fields.entitiesConfig'),
        type: 'universal-entities',
        default: []
      }
    ]
  },
  FamilyCard: {
    name: t('cards.family'),
    icon: mdiAccountGroup,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.family')
      },
      {
        key: 'persons',
        label: t('fields.personsConfig'),
        type: 'persons-config',
        default: []
      }
    ]
  },
  // WashingMachineCard: {
  //   name: t('cards.washingMachine'),
  //   icon: mdiWashingMachine,
  //   fields: [
  //     {
  //       key: 'title',
  //       label: t('fields.title'),
  //       type: 'text',
  //       default: t('cardTitles.washingMachine')
  //     },
  //     {
  //       key: 'config',
  //       label: t('fields.washingMachineConfig'),
  //       type: 'washing-machine-config',
  //       default: {}
  //     }
  //   ]
  // },
  DailyQuoteCard: {
    name: t('cards.dailyQuote'),
    icon: mdiFormatQuoteClose,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.dailyQuote')
      },
      {
        key: 'quotes',
        label: t('fields.quotesConfig'),
        type: 'quotes-config',
        default: []
      }
    ]
  },
  MapCard: {
    name: t('cards.map'),
    icon: mdiMapMarkerRadius,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.map')
      },
      {
        key: 'trackers',
        label: t('fields.mapTrackers'),
        type: 'map-trackers-config',
        default: []
      },
      {
        key: 'zoom',
        label: t('fields.mapZoom'),
        type: 'number',
        min: 3,
        max: 18,
        step: 1,
        default: '15'
      },
      {
        key: 'convertCoord',
        label: t('fields.mapConvertCoord'),
        type: 'switch',
        default: true,
        hint: t('fields.mapConvertCoordHint')
      }
    ]
  },
  // 内置的 NotifyHistoryCard（旧版消息通知）已移除，消息通知用插件版（NotifyHistoryCardPro）
  PcMonitorCard: {
    name: t('cards.pcMonitor'),
    icon: mdiDesktopTowerMonitor,
    fields: [
      {
        key: 'group',
        label: t('groups.selectGroup'),
        type: 'group-select',
        groups: groups,
        default: 'default'
      },
      {
        key: 'title',
        label: t('fields.title'),
        type: 'text',
        default: t('cardTitles.pcMonitor')
      },
      {
        key: 'deviceName',
        label: t('fields.pcDeviceName'),
        type: 'text',
        default: ''
      },
      {
        key: 'cpuUsage',
        label: t('fields.pcCpuUsage'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'cpuTemp',
        label: t('fields.pcCpuTemp'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'cpuPower',
        label: t('fields.pcCpuPower'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'gpuUsage',
        label: t('fields.pcGpuUsage'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'gpuTemp',
        label: t('fields.pcGpuTemp'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'gpuPower',
        label: t('fields.pcGpuPower'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'memUsed',
        label: t('fields.pcMemUsed'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'memFree',
        label: t('fields.pcMemFree'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'memTotal',
        label: t('fields.pcMemTotal'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'vramUsed',
        label: t('fields.pcVramUsed'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'vramFree',
        label: t('fields.pcVramFree'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'vramTotal',
        label: t('fields.pcVramTotal'),
        type: 'entity',
        filter: 'sensor.*'
      },
      {
        key: 'diskUsedEntities',
        label: t('fields.pcDiskUsed'),
        type: 'entity-multiple',
        filter: 'sensor.*'
      },
      {
        key: 'diskFreeEntities',
        label: t('fields.pcDiskFree'),
        type: 'entity-multiple',
        filter: 'sensor.*'
      },
      {
        key: 'sizeUnit',
        label: t('fields.pcSizeUnit'),
        type: 'text',
        default: 'GB'
      }
    ]
  },
  // ===== CPU / GPU：一张卡里同时显示 CPU 和 GPU，设置分两个下拉 =====
  CpuGpuCard: {
    name: t('cards.cpuGpuCard'),
    icon: mdiChip,
    fields: [
      { key: 'group', label: t('groups.selectGroup'), type: 'group-select', groups: groups, default: 'default' },
      { key: 'title', label: t('fields.title'), type: 'text', default: t('cardTitles.cpuGpuCard') },
      {
        key: 'metricsLayout',
        label: t('fields.metricsLayout'),
        type: 'select',
        default: 'right',
        options: [
          { value: 'right', label: t('fields.metricsRight') },
          { value: 'bottom', label: t('fields.metricsBottom') }
        ]
      },
      {
        key: 'cpuGroup',
        label: t('hwConfig.cpuGroup'),
        type: 'field-group',
        fields: [
          { key: 'cpuName', label: t('fields.hwDeviceName'), type: 'text', default: '' },
          { key: 'cpuUsage', label: t('fields.hwUsage'), type: 'entity', filter: 'sensor.*' },
          { key: 'cpuTemp', label: t('fields.hwTemp'), type: 'entity', filter: 'sensor.*' },
          { key: 'cpuFreq', label: t('fields.hwFreq'), type: 'entity', filter: 'sensor.*' },
          { key: 'cpuVoltage', label: t('fields.hwVoltage'), type: 'entity', filter: 'sensor.*' },
          { key: 'cpuPower', label: t('fields.hwPower'), type: 'entity', filter: 'sensor.*' }
        ]
      },
      {
        key: 'gpuGroup',
        label: t('hwConfig.gpuGroup'),
        type: 'field-group',
        fields: [
          { key: 'gpuName', label: t('fields.hwDeviceName'), type: 'text', default: '' },
          { key: 'gpuUsage', label: t('fields.hwUsage'), type: 'entity', filter: 'sensor.*' },
          { key: 'gpuTemp', label: t('fields.hwTemp'), type: 'entity', filter: 'sensor.*' },
          { key: 'gpuFreq', label: t('fields.hwFreq'), type: 'entity', filter: 'sensor.*' },
          { key: 'gpuVoltage', label: t('fields.hwVoltage'), type: 'entity', filter: 'sensor.*' },
          { key: 'gpuPower', label: t('fields.hwPower'), type: 'entity', filter: 'sensor.*' }
        ]
      }
    ]
  },
  // ===== 硬盘：一块盘一组（名称 / 图标 / 已用 / 可用 / 温度）=====
  DiskCard: {
    name: t('cards.diskCard'),
    icon: mdiHarddisk,
    fields: [
      { key: 'group', label: t('groups.selectGroup'), type: 'group-select', groups: groups, default: 'default' },
      { key: 'title', label: t('fields.title'), type: 'text', default: t('cardTitles.diskCard') },
      { key: 'disks', label: t('hwConfig.disks'), type: 'disk-list' },
      { key: 'sizeUnit', label: t('fields.pcSizeUnit'), type: 'text', default: 'GB' }
    ]
  },
  // ===== 内存 / 显存：合并成一张卡，两组设置各自折叠 =====
  MemoryCard: {
    name: t('cards.memoryCard'),
    icon: mdiMemory,
    fields: [
      { key: 'group', label: t('groups.selectGroup'), type: 'group-select', groups: groups, default: 'default' },
      { key: 'title', label: t('fields.title'), type: 'text', default: t('cardTitles.memoryCard') },
      {
        key: 'memGroup',
        label: t('hwConfig.memGroup'),
        type: 'field-group',
        fields: [
          { key: 'memName', label: t('fields.nameLabel'), type: 'text', default: '' },
          { key: 'memUsed', label: t('fields.memUsedGeneric'), type: 'entity', filter: 'sensor.*' },
          { key: 'memFree', label: t('fields.memFreeGeneric'), type: 'entity', filter: 'sensor.*' },
          { key: 'memTemp', label: t('fields.memTemp'), type: 'entity', filter: 'sensor.*' }
        ]
      },
      {
        key: 'vramGroup',
        label: t('hwConfig.vramGroup'),
        type: 'field-group',
        fields: [
          { key: 'vramName', label: t('fields.nameLabel'), type: 'text', default: '' },
          { key: 'vramUsed', label: t('fields.memUsedGeneric'), type: 'entity', filter: 'sensor.*' },
          { key: 'vramFree', label: t('fields.memFreeGeneric'), type: 'entity', filter: 'sensor.*' },
          { key: 'vramTemp', label: t('fields.memTemp'), type: 'entity', filter: 'sensor.*' }
        ]
      },
      { key: 'sizeUnit', label: t('fields.pcSizeUnit'), type: 'text', default: 'GB' }
    ]
  },
  // ===== 设备电量：一台设备一组（名称 / 图标 / 电量 / 充电状态）=====
  BatteryCard: {
    name: t('cards.batteryCard'),
    icon: mdiBatteryOutline,
    fields: [
      { key: 'group', label: t('groups.selectGroup'), type: 'group-select', groups: groups, default: 'default' },
      { key: 'title', label: t('fields.title'), type: 'text', default: t('cardTitles.batteryCard') },
      { key: 'devices', label: t('hwConfig.devices'), type: 'battery-list' },
      {
        key: 'computeCharge',
        label: t('fields.battCompute'),
        type: 'switch',
        default: true,
        hint: t('fields.battComputeHint')
      }
    ]
  }
});

// 把「插件卡片」合并进卡片目录，供「添加卡片」列表与编辑页使用。
// 插件图标是 @mdi/js 的图标名字符串（如 "mdiBellRing"），这里解析成真实路径。
function getMergedCardTypes(t, groups = []) {
  const types = getCardTypes(t, groups);
  // 用户在「卡片管理 → 卡片显示名」里设的覆盖名（内置 / 插件卡片通用）
  const overrides = getCardNameOverrides();
  // 被禁用的卡片类型（禁用后不出现在「添加卡片」列表；已放置的实例显示为占位）
  const disabled = getCardDisabled();

  // 内置卡片：显示名沿用 cardTitles（与旧版一致），有覆盖名时用覆盖名
  Object.entries(types).forEach(([type, def]) => {
    // defaultName = 没被覆盖时的名字（给「恢复默认」当占位提示用）
    def.defaultName = resolveCardDisplayName(type, t, def.name, {});
    def.name = resolveCardDisplayName(type, t, def.name, overrides);
    def.disabled = disabled.has(type);
  });

  getPluginCardCatalog().forEach((c) => {
    const rawFields =
      c.configFields && c.configFields.length
        ? c.configFields
        : [
            {
              key: 'group',
              label: t('groups.selectGroup'),
              type: 'group-select',
              default: 'default',
            },
          ];
    // 插件 manifest 是静态 JSON，拿不到运行时的分组列表；
    // 这里给所有 group-select 字段补上当前分组，保证插件卡片也能正确选分组。
    const fields = rawFields.map((f) =>
      f.type === 'group-select' && !f.groups ? { ...f, groups } : f
    );
    types[c.cardType] = {
      // 插件卡片显示名来自 manifest（可被「插件管理」重命名），有覆盖名时用覆盖名
      name: resolveCardDisplayName(c.cardType, t, c.name, overrides),
      defaultName: resolveCardDisplayName(c.cardType, t, c.name, {}),
      icon: mdiIcons[c.icon] || DEFAULT_CARD_ICON,
      fields,
      plugin: true,
      disabled: disabled.has(c.cardType),
    };
  });
  return types;
}


function ConfigPage({ sidebarVisible, setSidebarVisible }) {
  const fileInputRef = useRef(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showUploadPlugin, setShowUploadPlugin] = useState(false);
  const [showCardManager, setShowCardManager] = useState(false);
  const [showAttachmentManager, setShowAttachmentManager] = useState(false);
  const [loading, setLoading] = useState(true);
  // 插件是运行时加载的，加载完成后广播事件；这里监听以触发重渲染，让插件卡片出现在列表里
  const [, setPluginTick] = useState(0);
  useEffect(() => {
    const onPluginsLoaded = () => setPluginTick((v) => v + 1);
    window.addEventListener('hasspanel:plugins-loaded', onPluginsLoaded);
    return () => window.removeEventListener('hasspanel:plugins-loaded', onPluginsLoaded);
  }, []);
  const { t } = useLanguage();
  const isMobile = window.innerWidth < 768;
  const navigate = useNavigate();
  
  // 修改卡片状态的初始化
  const [cards, setCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGlobalConfig, setShowGlobalConfig] = useState(false);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groups, setGroups] = useState([]);
  const [filterGroup, setFilterGroup] = useState('all'); // 添加分组筛选状态

  // 修改加载配置数据的 useEffect
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await configApi.getConfig();
        const config = response.data;
        if (config.cards) {
          setCards(config.cards.map(card => ({
            ...card,
            visible: card.visible !== false,
            titleVisible: card.titleVisible !== false,
            inDrawer: card.inDrawer === true,
            group: card.group || 'default'
          })));
          setGlobalConfig(config.globalConfig);

          // 加载分组配置
          if (config.globalConfig && config.globalConfig.groups) {
            setGroups(config.globalConfig.groups);
          }
        }
      } catch (error) {
        console.error('加载配置失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []); // 移除 t 依赖，因为它不需要在这里触发重新加载

  // 「全局配置」弹窗保存 / 实时预览时广播 → 同步刷新本页的 globalConfig，
  // 免得本页后面保存卡片时把它覆盖回旧值（详见 handleSave 里的说明）。
  useEffect(() => {
    const onGlobalConfigChanged = (e) => {
      const next = e && e.detail;
      if (next && typeof next === 'object') setGlobalConfig(next);
    };
    window.addEventListener('hasspanel:global-config-changed', onGlobalConfigChanged);
    return () => window.removeEventListener('hasspanel:global-config-changed', onGlobalConfigChanged);
  }, []);



  // 修改保存函数
  const handleSave = async () => {
    try {
      message.loading(t('config.saving'));
      // ⚠️ 用「服务端最新的 globalConfig」做底，只覆盖 groups。
      //    不能用本组件 state 里的 globalConfig：它是页面加载时读的，用户在「全局配置」弹窗里
      //    改的卡片透明度 / 毛玻璃 / 标题等它并不知道；直接整份写回会把那些设置**覆盖回旧值**
      //    （症状：设好的透明度，回主页刷新后又变回去）。
      let latestGlobal = globalConfig || {};
      try {
        const resp = await configApi.getConfig();
        if (resp && resp.data && resp.data.globalConfig) latestGlobal = resp.data.globalConfig;
      } catch (e) {
        /* 取不到就退回本地值，至少不崩 */
      }
      await configApi.saveConfig({
        globalConfig: {
          ...latestGlobal,
          groups: groups
        },
        cards,
        // 不再包含布局信息
      });
      message.destroy();
      setHasUnsavedChanges(false);
      message.success(t('config.saveSuccess'));
    } catch (error) {
      console.error('保存配置失败:', error);
      // 带上具体原因，否则用户只看到「保存失败」不知道哪出了问题
      message.error(`${t('config.saveFailed')}${error?.message ? '：' + error.message : ''}`);
    }
  };

  // 修改导入函数
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const content = await file.text();
        const importedConfig = JSON.parse(content);
        
        // 验证导入的配置
        if (!Array.isArray(importedConfig.cards)) {
          throw new Error('无效的配置文件格式');
        }

        // 保存到后端，但只保存卡片配置，不保存布局
        await configApi.saveConfig({
          cards: importedConfig.cards,
          // 不再包含布局信息
        });
        
        // 更新本地状态
        setCards(importedConfig.cards.map(card => ({
          ...card,
          visible: card.visible !== false,
          titleVisible: card.titleVisible !== false,
          inDrawer: card.inDrawer === true
        })));
        
        
        setHasUnsavedChanges(false);
        message.success(t('config.importSuccess'));
      } catch (error) {
        console.error('导入配置失败:', error);
        message.error(t('config.importFailed'));
      }
      // 清除文件输入
      event.target.value = '';
    }
  };

  // 添加导入布局的处理函数
  const handleImportLayout = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const content = await file.text();
        const importedLayout = JSON.parse(content);
        
        // 验证导入的布局
        if (!importedLayout.layouts) {
          throw new Error('无效的布局文件格式');
        }

        // 分别保存移动端和桌面端布局
        localStorage.setItem('mobile-dashboard-layouts', JSON.stringify(importedLayout.layouts));
        localStorage.setItem('desktop-dashboard-layouts', JSON.stringify(importedLayout.layouts));
        
        message.success(t('config.layoutImportSuccess'));
      } catch (error) {
        console.error('导入布局失败:', error);
        message.error(t('config.layoutImportFailed'));
      }
      // 清除文件输入
      event.target.value = '';
    }
  };

  // 添加导出布局的处理函数
  const handleExportLayout = () => {
    try {
      // 获取桌面端和移动端布局
      const desktopLayouts = localStorage.getItem('desktop-dashboard-layouts');
      const mobileLayouts = localStorage.getItem('mobile-dashboard-layouts');
      
      if (!desktopLayouts && !mobileLayouts) {
        throw new Error('没有找到布局配置');
      }

      // 优先使用桌面端布局，如果没有则使用移动端布局
      const layouts = desktopLayouts ? JSON.parse(desktopLayouts) : JSON.parse(mobileLayouts);
      
      // 创建导出对象
      const exportData = {
        layouts: layouts
      };
      
      // 创建下载
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hass-panel-layout-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success(t('config.layoutExportSuccess'));
    } catch (error) {
      console.error('导出布局失败:', error);
      message.error(t('config.layoutExportFailed'));
    }
  };

  // 修改导出函数
  const handleExport = async () => {
    try {
      // 从后端获取最新配置
      const response = await configApi.getConfig();
      const config = response.data;
      
      // 导出时只包含卡片配置，不包含布局配置
      const exportConfig = {
        cards: config.cards,
        globalConfig: config.globalConfig
      };
      
      // 创建下载
      const blob = new Blob([JSON.stringify(exportConfig, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hass-panel-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出配置失败:', error);
      message.error(t('config.exportFailed'));
    }
  };

  // 修改添加卡片函数
  const handleAddCard = (type) => {
    const newCard = {
      id: Date.now(),
      type,
      config: {},
      visible: true,
      titleVisible: true,
      inDrawer: false,
      group: 'default'
    };

    // 添加默认配置
    const cardType = getMergedCardTypes(t, groups)[type];
    if (cardType && cardType.fields) {
      cardType.fields.forEach(field => {
        if (field.default !== undefined) {
          newCard.config[field.key] = field.default;
        }
      });
    }

    setCards(prevCards => [...prevCards, newCard]);
    setShowAddModal(false);
    setShowEditModal(true);
    setEditingCard(newCard);
    setHasUnsavedChanges(true);
  };

  // 添加编辑卡片的处理函数
  const handleEditCard = (card) => {
    setEditingCard(card);
    setShowEditModal(true);
  };

  // 添加保存编辑的处理函数
  const handleSaveEdit = (updatedCard) => {
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === updatedCard.id ? updatedCard : card
      )
    );
    setHasUnsavedChanges(true);
  };

  // 处理卡片显示状态变化
  const handleVisibilityChange = (cardId) => {
    setCards(prevCards => {
      const newCards = prevCards.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            visible: card.visible === false ? true : false
          };
        }
        return card;
      });
      setHasUnsavedChanges(true);
      return newCards;
    });
  };

  // 处理卡片标题显示状态变化
  const handleTitleVisibilityChange = (cardId) => {
    setCards(prevCards => {
      const newCards = prevCards.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            titleVisible: card.titleVisible === false ? true : false
          };
        }
        return card;
      });
      setHasUnsavedChanges(true);
      return newCards;
    });
  };

  // 处理卡片是否放入顶部下拉面板
  const handleDrawerChange = (cardId) => {
    setCards(prevCards => {
      const newCards = prevCards.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            inDrawer: card.inDrawer !== true
          };
        }
        return card;
      });
      setHasUnsavedChanges(true);
      return newCards;
    });
  };

  const handleDeleteCard = (cardId) => {
    setCards(cards.filter(card => card.id !== cardId));
    setHasUnsavedChanges(true);
  };

  // 处理卡片分组切换
  const handleGroupChange = (cardId, newGroupId) => {
    setCards(prevCards => {
      const newCards = prevCards.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            group: newGroupId,
            config: {
              ...card.config,
              group: newGroupId
            }
          };
        }
        return card;
      });
      setHasUnsavedChanges(true);
      return newCards;
    });
  };

  // const handleConfigChange = (cardId, key, value) => {
  //   setCards(cards.map(card => {
  //     if (card.id === cardId) {
  //       const newConfig = { ...card.config, [key]: value };
  //       // 如果是 LightOverviewCard，更新预览配置
  //       if (card.type === 'LightOverviewCard') {
  //         setPreviewConfig(newConfig);
  //       }
  //       return { ...card, config: newConfig };
  //     }
  //     return card;
  //   }));
  //   setHasUnsavedChanges(true);
  // };

  // 保存分组配置
  const handleSaveGroups = (newGroups) => {
    setGroups(newGroups);
    setHasUnsavedChanges(true);
  };

  // 修改版本列表相关函数
  const handleVersionList = async () => {
    try {
      setShowVersionModal(true);
    } catch (error) {
      message.error('获取版本列表失败: ' + error.message);
    }
  };

  // 修改配置菜单项
  const configMenuItems = [
    {
      key: 'import',
      label: t('config.import'),
      icon: <Icon path={mdiImport} size={12} />,
      onClick: () => fileInputRef.current.click()
    },
    {
      key: 'export',
      label: t('config.export'),
      icon: <Icon path={mdiExport} size={12} />,
      onClick: handleExport
    },
    {
      key: 'importLayout',
      label: t('config.importLayout'),
      icon: <Icon path={mdiImport} size={12} />,
      onClick: () => document.getElementById('layoutFileInput').click()
    },
    {
      key: 'exportLayout',
      label: t('config.exportLayout'),
      icon: <Icon path={mdiExport} size={12} />,
      onClick: handleExportLayout
    },
    {
      key: 'versions',
      label: t('config.versionList'),
      icon: <Icon path={mdiFileFind} size={12} />,
      onClick: handleVersionList
    }
  ];

 
  return (
    <div className={`config-page ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
      <div className="config-container">
        <div className="config-header">
          <Space className="header-buttons">
           {!isMobile && <Button 
                className="back-button"
                onClick={() => navigate('/')}
                icon={<Icon path={mdiArrowLeft} size={12} />}
              >
                {t('nav.home')}
              </Button>
          }

            <Button
              className="upload-plugin-button"
              onClick={() => setShowUploadPlugin(true)}
              icon={<Icon path={mdiUpload} size={12} />}
            >
              {t('config.uploadPlugin')}
            </Button>

            <Button
              className="card-manager-button"
              onClick={() => setShowCardManager(true)}
              icon={<Icon path={mdiCardsOutline} size={12} />}
            >
              {t('config.cardManager')}
            </Button>

            <Button
              className="attachment-manager-button"
              onClick={() => setShowAttachmentManager(true)}
              icon={<Icon path={mdiFolderImage} size={12} />}
            >
              {t('config.attachmentManager')}
            </Button>

            <Button
              className="global-config-button"
              onClick={() => setShowGlobalConfig(true)}
              icon={<Icon path={mdiCog} size={12} />}
            >
              {t('config.globalConfig')}
            </Button>

            <Button
              className="group-manager-button"
              onClick={() => setShowGroupManager(true)}
              icon={<Icon path={mdiViewDashboard} size={12} />}
            >
              {t('groups.manage')}
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              style={{ display: 'none' }}
            />
            <input
              type="file"
              id="layoutFileInput"
              onChange={handleImportLayout}
              accept=".json"
              style={{ display: 'none' }}
            />

            <Dropdown menu={{ items: configMenuItems }} placement="bottomLeft">
              <Button className="config-menu-button">
                {t('config.title')}
                <Icon path={mdiImport} size={12} style={{ marginLeft: 8 }} />
              </Button>
            </Dropdown>
          </Space>
        </div>

        {/* 添加分组筛选器 */}
        <div className="group-filter-container">
          <span className="filter-label">{t('groups.selectGroup')}:</span>
          <Select
            value={filterGroup}
            onChange={setFilterGroup}
            style={{ width: 180 }}
            options={[
              { value: 'all', label: t('groups.all') || '全部' },
              { value: 'default', label: t('groups.default') },
              ...groups.map(g => ({ value: g.id, label: g.name }))
            ]}
          />
          {filterGroup !== 'all' && (
            <Button
              type="text"
              size="small"
              onClick={() => setFilterGroup('all')}
              style={{ marginLeft: 8 }}
            >
              {t('config.clearFilter') || '清除筛选'}
            </Button>
          )}
        </div>

        <div className="config-list">
          {cards
            .filter(card => {
              // 根据筛选条件过滤卡片
              if (filterGroup === 'all') return true;
              const cardGroup = card.config.group || card.group || 'default';
              return cardGroup === filterGroup;
            })
            .map(card => {
            // 准备分组选项
            const groupOptions = [
              { value: 'default', label: t('groups.default') },
              ...groups.map(g => ({ value: g.id, label: g.name }))
            ];

            return (
              <div key={card.id} className="config-card">
                <div className="card-header">
                  <div className="card-icon">
                    <Icon path={getMergedCardTypes(t, groups)[card.type]?.icon || DEFAULT_CARD_ICON} size={14} />
                  </div>
                  <h3 className="card-title">{card.config.title}</h3>
                </div>
                <div className="card-switches">
                  <div className="switch-item">
                    <span>{t('groups.selectGroup')}</span>
                    <Select
                      size="small"
                      value={card.config.group || 'default'}
                      onChange={(value) => handleGroupChange(card.id, value)}
                      options={groupOptions}
                      style={{ width: 120 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="switch-item">
                    <span>{t('config.showTitle')}</span>
                    <Switch
                      size="small"
                      checked={card.titleVisible}
                      onChange={() => handleTitleVisibilityChange(card.id)}
                    />
                  </div>
                  <div className="switch-item">
                    <span>{t('config.showCard')}</span>
                    <Switch
                      size="small"
                      checked={card.visible}
                      onChange={() => handleVisibilityChange(card.id)}
                    />
                  </div>
                  <div className="switch-item">
                    <span>{t('config.showInDrawer')}</span>
                    <Switch
                      size="small"
                      checked={card.inDrawer === true}
                      onChange={() => handleDrawerChange(card.id)}
                    />
                  </div>
                </div>
                <div className="card-actions">
                  <Button
                    size="small"
                    icon={<Icon path={mdiPencil} size={12} />}
                    onClick={() => handleEditCard(card)}
                  >
                    {t('config.edit')}
                  </Button>
                  <Popconfirm
                    title={t('config.deleteConfirm')}
                    okText={t('config.confirm')}
                    cancelText={t('config.cancel')}
                    onConfirm={() => handleDeleteCard(card.id)}
                  >
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<Icon path={mdiDelete} size={12} />}
                    >
                      {t('config.delete')}
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {showAddModal && (
        <AddCardModal
          onClose={() => setShowAddModal(false)}
          onSelect={handleAddCard}
          cardTypes={getMergedCardTypes(t, groups)}
        />
      )}

      <EditCardModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCard(null);
        }}
        card={editingCard}
        cardTypes={getMergedCardTypes(t, groups)}
        onSave={handleSaveEdit}
      />

      <VersionListModal
        visible={showVersionModal}
        onCancel={() => setShowVersionModal(false)}
        setCards={setCards}
        setHasUnsavedChanges={setHasUnsavedChanges}
        setShowVersionModal={setShowVersionModal}
      />

      {/* 保存按钮 */}
      <button
        className={`save-button ${hasUnsavedChanges ? 'has-changes' : ''}`}
        onClick={handleSave}
      >
        <Icon path={mdiCheck} size={28} />
      </button>

      {/* 添加卡片按钮 */}
      <button
        className="add-card-button"
        onClick={() => setShowAddModal(true)}
      >
        <Icon path={mdiPlus} size={42} />
      </button>

      {loading && (
        <div className="loading-state">
          <Spin size="large" />
          <p>{t('loading')}</p>
        </div>
      )}

      {showGlobalConfig && (
        <>
          <GlobalConfig
            showGlobalConfig={showGlobalConfig}
            setShowGlobalConfig={setShowGlobalConfig}
          />
        </>
      )}

      {/* 分组管理弹窗 */}
      <GroupManager
        visible={showGroupManager}
        onCancel={() => setShowGroupManager(false)}
        groups={groups}
        onSave={handleSaveGroups}
      />

      {/* 上传插件弹窗 */}
      <UploadPluginModal
        open={showUploadPlugin}
        onClose={() => setShowUploadPlugin(false)}
      />

      {/* 卡片管理弹窗（基础卡片 + 插件卡片） */}
      <CardManagerModal
        open={showCardManager}
        onClose={() => setShowCardManager(false)}
        cardTypes={getMergedCardTypes(t, groups)}
      />

      {/* 附件管理弹窗（图标 / 图片 / 动图） */}
      <AttachmentManagerModal
        open={showAttachmentManager}
        onClose={() => setShowAttachmentManager(false)}
      />
    </div>
  );
}

export default ConfigPage;