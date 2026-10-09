import React, { useState } from 'react';
import { useHass } from '@hakit/core';
import { AutoComplete, Input, InputNumber, Button, Switch, Select } from 'antd';
import './style.css';
import { useLanguage } from '../../i18n/LanguageContext';
import AttachmentManagerModal from '../AttachmentManagerModal';
import LightOverviewEditor from '../LightOverviewEditor';
import LightScenesConfig from './LightScenesConfig';
import LightsConfig from './LightsConfig';
import SocketConfig from './SocketConfig';
import NasConfig from './NasConfig';
import ScriptsConfig from './ScriptsConfig';
import CameraConfig from './CameraConfig';
import UniversalConfig from './UniversalConfig';
import PVEConfig from './PVEConfig';
import ServerConfig from './ServerConfig';
import SensorGroup from './SensorGroup';
import ClimateFeaturesConfig from './ClimateFeaturesConfig';
import { configApi } from '../../utils/api';
import DailyQuoteConfig from './DailyQuoteConfig';
import WashingMachineConfig from './WashingMachineConfig';
import MapTrackersConfig from './MapTrackersConfig';
import { DiskListConfig, BatteryListConfig } from './HardwareConfig';
import Icon from '@mdi/react';
import { mdiChevronDown, mdiChevronUp } from '@mdi/js';


function ConfigField({ field, value, onChange, config, onPatch }) {
  const { getAllEntities } = useHass();
  const allEntities = getAllEntities();
  const { t } = useLanguage();
  // 过滤并格式化实体列表
  const getFilteredEntities = (filter) => {
    return Object.entries(allEntities)
      .filter(([entityId]) => entityId.match(filter))
      .map(([entityId, entity]) => ({
        id: entityId,
        name: entity.attributes.friendly_name || entityId
      }));
  };

  // 哪个字段正在打开「附件选择」（存 field.key，null 表示没开）
  const [pickerKey, setPickerKey] = useState(null);
  // 「折叠分组」字段的展开状态（存 field.key）
  const [expandedGroups, setExpandedGroups] = useState({});

  switch (field.type) {
    case 'text':
      return (
        <div className="config-field">
          <div className="config-field-row">
            <label>{field.label}</label>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        </div>
      );

    case 'number':
      return (
        <div className="config-field">
          <div className="config-field-row">
            <label>{field.label}</label>
            <InputNumber
              value={value === '' || value === undefined || value === null ? null : Number(value)}
              onChange={(val) => onChange(val === null ? '' : String(val))}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      );

    case 'switch':
      return (
        <div className="config-field">
          <div className="config-field-row config-field-row-switch">
            <label>{field.label}</label>
            <Switch
              size="small"
              checked={value === undefined || value === null ? !!field.default : !!value}
              onChange={(checked) => onChange(checked)}
            />
          </div>
          {field.hint && <div className="config-field-hint">{field.hint}</div>}
        </div>
      );

    case 'image':
      return (
        <div className="config-field">
          <div className="config-field-row">
            <label>{field.label}</label>
            <div className="upload-field">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      const result = await configApi.uploadImage(file);
                      onChange(result.file_path);
                    } catch (error) {
                      console.error('上传失败:', error);
                    }
                  }
                }}
                style={{ display: 'none' }}
                id={`image-upload-${field.key}`}
              />
              <Input
                value={value || ''}
                placeholder={field.placeholder || t('fields.placeholderImage')}
                readOnly
                addonAfter={
                  <label htmlFor={`image-upload-${field.key}`} style={{ cursor: 'pointer' }}>
                    {t('fields.uploadImage')}
                  </label>
                }
              />
            </div>
          </div>

          {/* 也可以直接从「附件管理」里挑一个已经上传过的文件 */}
          <div className="config-field-row config-field-row-actions">
            <Button size="small" onClick={() => setPickerKey(field.key)}>
              {t('fields.pickAttachment')}
            </Button>
            {value ? (
              <Button size="small" danger onClick={() => onChange('')}>
                {t('fields.clearImage')}
              </Button>
            ) : null}
          </div>

          <AttachmentManagerModal
            open={pickerKey === field.key}
            onClose={() => setPickerKey(null)}
            onPick={(it) => {
              onChange(it.url);
              setPickerKey(null);
            }}
          />
        </div>
      );

    case 'entity':
      const entities = getFilteredEntities(field.filter);
      return (
        <div className="config-field">
          <div className="config-field-row">
            <label>{field.label}</label>
            <AutoComplete
              allowClear
              value={value}
              onChange={onChange}
              showSearch
              placeholder={t('configField.selectEntity')}
              optionFilterProp="children"
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={entities.map(entity => ({
                value: entity.id,
                label: entity.name + ' (' + entity.id + ')'
              }))}
            />
          </div>
        </div>
      );

    case 'light-overview-editor':
      // 灯光概览的布局编辑器：一个控件同时管 background / imageSize /
      // imageLeft / imageTop / rooms 多个字段，所以走 config + onPatch 而不是 value/onChange
      return <LightOverviewEditor config={config} onPatch={onPatch} />

    case 'light-scenes-config':
      return <LightScenesConfig
        field={field}
        value={value}
        onChange={onChange}
        getFilteredEntities={getFilteredEntities} />

    case 'entity-multiple':
      const availableEntities = getFilteredEntities(field.filter);
      const selectedEntities = value || [];

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="entity-list">
            {selectedEntities.map((entityId, index) => (
              <div key={entityId} className="entity-item">
                <span>{allEntities[entityId]?.attributes?.friendly_name || entityId}</span>
                <Button
                  type="primary"
                  danger
                  onClick={() => {
                    const newEntities = [...selectedEntities];
                    newEntities.splice(index, 1);
                    onChange(newEntities);
                  }}
                >
                  {t('configField.deleteButton')}
                </Button>
              </div>
            ))}
            <AutoComplete
              allowClear
              value=""
              onChange={(value) => {
                if (value) {
                  onChange([...selectedEntities, value]);
                }
              }}
              showSearch
              placeholder={t('configField.selectEntity')}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={availableEntities
                .filter(entity => !selectedEntities.includes(entity.id))
                .map(entity => ({
                  value: entity.id,
                  label: entity.name + ' (' + entity.id + ')'
                }))}
            />
          </div>
        </div>
      );

    case 'sensor-group':
      return <SensorGroup field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'lights-config':
      return <LightsConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'socket-config':
      return <SocketConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'cameras-config':
      return <CameraConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'washing-machine-config':
      return <WashingMachineConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'media-players':
      const mediaPlayerEntities = getFilteredEntities('media_player.*');

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="media-players-config">
            {(value || []).map((player, index) => (
              <div key={index} className="media-player-item">
                <Input
                  type="text"
                  value={player.name || null}
                  onChange={(e) => {
                    const newPlayers = [...value];
                    newPlayers[index] = {
                      ...player,
                      name: e.target.value
                    };
                    onChange(newPlayers);
                  }}
                  placeholder={t('configField.playerName')}
                />
                <AutoComplete
                  allowClear
                  value={player.entity_id || null}
                  onChange={(selectedValue) => {
                    const newPlayers = [...value];
                    newPlayers[index] = {
                      ...player,
                      entity_id: selectedValue
                    };
                    onChange(newPlayers);
                  }}
                  showSearch
                  placeholder={t('configField.selectEntity')}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={mediaPlayerEntities.map(entity => ({
                    value: entity.id,
                    label: entity.name + ' (' + entity.id + ')'
                  }))}
                />
                <Button
                  type="primary"
                  style={{ width: '100px' }}  
                  danger
                  onClick={() => {
                    const newPlayers = [...value];
                    newPlayers.splice(index, 1);
                    onChange(newPlayers);
                  }}
                >
                  {t('configField.deleteButton')}
                </Button>
              </div>
            ))}
            <Button
              style={{ width: '100px' }}
              type="primary"
              onClick={() => {
                onChange([
                  ...(value || []),
                  {
                    entity_id: '',
                    name: '',
                    room: ''
                  }
                ]);
              }}
            >
              {t('configField.addButton')}
            </Button>
          </div>
        </div>
      );

    case 'curtains-config':
      const curtainEntities = getFilteredEntities('cover.*');

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="curtains-config">
            {(value || []).map((curtain, index) => (
              <div key={index} className="curtain-item">
                <Input
                  type="text"
                  value={curtain.name || null}
                  onChange={(e) => {
                    const newCurtains = [...value];
                    newCurtains[index] = {
                      ...curtain,
                      name: e.target.value
                    };
                    onChange(newCurtains);
                  }}
                  placeholder={t('configField.curtainName')}
                />
                <AutoComplete
                  allowClear
                  value={curtain.entity_id || null}
                  onChange={(selectedValue) => {
                    const newCurtains = [...value];
                    newCurtains[index] = {
                      ...curtain,
                      entity_id: selectedValue
                    };
                    onChange(newCurtains);
                  }}
                  showSearch
                  placeholder={t('configField.selectEntity')}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={curtainEntities.map(entity => ({
                    value: entity.id,
                    label: entity.name + ' (' + entity.id + ')'
                  }))}
                />
                <Button 
                  type="primary"
                  style={{ width: '100px' }}
                  danger
                  onClick={() => {
                    const newCurtains = [...value];
                    newCurtains.splice(index, 1);
                    onChange(newCurtains);
                  }}
                >
                  {t('configField.deleteButton')}
                </Button>
              </div>
            ))}
            <Button
              style={{ width: '100px' }}
              type="primary"
              onClick={() => {
                onChange([
                  ...(value || []),
                  {
                    entity_id: '',
                    name: '',
                    room: ''
                  }
                ]);
              }}
            >
              {t('configField.addButton')}
            </Button>
          </div>
        </div>
      );

    case 'router-config':
      const routerEntities = getFilteredEntities('sensor.*');
      const routerFields = [
        { key: 'cpuTemp', name: t('configField.cpuTemp') },
        { key: 'uptime', name: t('configField.uptime') },
        { key: 'cpuUsage', name: t('configField.cpuUsage') },
        { key: 'memoryUsage', name: t('configField.memoryUsage') },
        { key: 'onlineUsers', name: t('configField.onlineUsers') },
        { key: 'networkConnections', name: t('configField.networkConnections') },
        { key: 'wanIp', name: t('configField.wanIp') },
        { key: 'wanDownloadSpeed', name: t('configField.downloadSpeed') },
        { key: 'wanUploadSpeed', name: t('configField.uploadSpeed') }
      ];

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="router-config">
            <div className="router-field">
              <span className="field-name">{t('configField.routerName')}</span>
              <Input
                value={value?.routerName || ''}
                onChange={(e) => {
                  onChange({
                    ...value,
                    routerName: e.target.value
                  });
                }}
                placeholder={t('configField.routerName')}
              />
            </div>
            {routerFields.map(routerField => {
              const currentValue = value?.[routerField.key] || {};

              return (
                <div key={routerField.key} className="router-field">
                  <span className="field-name">{routerField.name}</span>
                  <AutoComplete
                    allowClear
                    value={currentValue.entity_id || null}
                    onChange={(selectedValue) => {
                      onChange({
                        ...value,
                        [routerField.key]: {
                          entity_id: selectedValue,
                          name: routerField.name
                        }
                      });
                    }}
                    showSearch
                    placeholder={t('configField.selectEntity')}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={routerEntities.map(entity => ({
                      value: entity.id,
                      label: entity.name + ' (' + entity.id + ')'
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'nas-config':
      return <NasConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />
    case 'server-config':
      return <ServerConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />
    case 'pve-config':
      return <PVEConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'scripts-config':
      return <ScriptsConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'waterpuri-config':
      const waterPuriEntities = getFilteredEntities('sensor.*');
      const waterPuriFields = [
        { key: 'temperature', name: t('configField.temperature') },
        { key: 'tds_in', name: t('configField.tdsIn') },
        { key: 'tds_out', name: t('configField.tdsOut') },
        { key: 'pp_filter_life', name: t('configField.ppFilterLife') },
        { key: 'ro_filter_life', name: t('configField.roFilterLife') },
        { key: 'status', name: t('configField.status') }
      ];

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="waterpuri-config">
            {waterPuriFields.map(waterPuriField => {
              const currentValue = value?.[waterPuriField.key] || {};

              return (
                <div key={waterPuriField.key} className="waterpuri-field">
                  <span className="field-name">{waterPuriField.name}</span>
                  <AutoComplete
                    allowClear
                    value={currentValue.entity_id || null}
                    onChange={(selectedValue) => {
                      onChange({
                        ...value,
                        [waterPuriField.key]: {
                          entity_id: selectedValue,
                          name: waterPuriField.name
                        }
                      });
                    }}
                    showSearch
                    placeholder={t('configField.selectEntity')}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={waterPuriEntities.map(entity => ({
                      value: entity.id,
                      label: entity.name + ' (' + entity.id + ')'
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'electricity-config':
      const electricityEntities = getFilteredEntities('sensor.*');
      const electricityFields = [
        { key: 'currentPower', name: t('configField.currentPower') },
        { key: 'voltage', name: t('configField.voltage') },
        { key: 'electric_current', name: t('configField.electricCurrent') },
        { key: 'totalUsage', name: t('configField.totalUsage') },
        { key: 'todayUsage', name: t('configField.todayUsage') },
        { key: 'yesterdayUsage', name: t('configField.yesterdayUsage') },
        { key: 'monthlyUsage', name: t('configField.monthlyUsage') },
        { key: 'yearlyUsage', name: t('configField.yearlyUsage') },
      ];

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="electricity-config">
            {electricityFields.map(electricityField => {
              const currentValue = value?.[electricityField.key] || {};

              return (
                <div key={electricityField.key} className="electricity-field">
                  <span className="field-name">{electricityField.name}</span>
                  <AutoComplete
                    allowClear
                    value={currentValue.entity_id || null}
                    onChange={(selectedValue) => {
                      onChange({
                        ...value,
                        [electricityField.key]: {
                          entity_id: selectedValue,
                          name: electricityField.name
                        }
                      });
                    }}
                    showSearch
                    placeholder={t('configField.selectEntity')}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={electricityEntities.map(entity => ({
                      value: entity.id,
                      label: entity.name + ' (' + entity.id + ')'
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'climate-features':
      return <ClimateFeaturesConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'illuminance-config':
      const illuminanceEntities = getFilteredEntities('sensor.*');

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="illuminance-config">
            {(value || []).map((sensor, index) => (
              <div key={index} className="illuminance-item">
                <div className="config-field-row">
                  <span className="field-name">{t('configField.sensorName')}</span>
                  <Input
                    type="text"
                    value={sensor.name || null}
                    onChange={(e) => {
                      const newSensors = [...value];
                      newSensors[index] = {
                        ...sensor,
                        name: e.target.value
                      };
                      onChange(newSensors);
                    }}
                    placeholder={t('configField.sensorName')}
                  />
                </div>
                <div className="config-field-row">
                  <span className="field-name">{t('configField.sensorEntity')}</span>
                  <AutoComplete
                    allowClear
                    value={sensor.entity_id || null}
                    onChange={(selectedValue) => {
                      const newSensors = [...value];
                      newSensors[index] = {
                        ...sensor,
                        entity_id: selectedValue
                      };
                      onChange(newSensors);
                    }}
                    showSearch
                    placeholder={t('configField.selectEntity')}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={illuminanceEntities.map(entity => ({
                      value: entity.id,
                      label: entity.name + ' (' + entity.id + ')'
                    }))}
                  />
                </div>
                <Button
                  style={{ width: '100px' }}
                  type="primary"
                  danger
                  onClick={() => {
                    const newSensors = [...value];
                    newSensors.splice(index, 1);
                    onChange(newSensors);
                  }}
                >
                  {t('configField.deleteButton')}
                </Button>
              </div>
            ))}
          </div>
          <Button
            style={{ width: '100px' ,marginTop: '10px'}}
            type="primary"
            onClick={() => {
              onChange([
                ...(value || []),
                {
                  entity_id: '',
                  name: '',
                }
              ]);
            }}
          >
            {t('configField.addButton')}
          </Button>
        </div>
      );

    case 'universal-entities':
      return <UniversalConfig field={field} value={value} onChange={onChange} allEntities={allEntities} />

    case 'persons-config':
      const personEntities = getFilteredEntities('person.*');

      return (
        <div className="config-field">
          <label>{field.label}</label>
          <div className="persons-config">
            {(value || []).map((person, index) => (
              <div key={index} className="person-item">
                <div className="person-item-row">
                  <AutoComplete
                    allowClear
                    value={person.entity_id || null}
                    onChange={(selectedValue) => {
                      const newPersons = [...value];
                      newPersons[index] = {
                        ...person,
                        entity_id: selectedValue
                      };
                      onChange(newPersons);
                    }}
                    showSearch
                    placeholder={t('configField.selectEntity')}
                    optionFilterProp="children"
                    style={{ flex: 1 }}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={personEntities.map(entity => ({
                      value: entity.id,
                      label: entity.name + ' (' + entity.id + ')'
                    }))}
                  />
                  <Button
                    type="primary"
                    danger
                    style={{ marginTop: '0' }}
                    onClick={() => {
                      const newPersons = [...value];
                      newPersons.splice(index, 1);
                      onChange(newPersons);
                    }}
                  >
                    {t('configField.deleteButton')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="primary"
            onClick={() => {
              onChange([
                ...(value || []),
                {
                  entity_id: ''
                }
              ]);
            }}
          >
            {t('configField.addButton')}
          </Button>
        </div>
      );

    case 'quotes-config':
      return <DailyQuoteConfig field={field} value={value} onChange={onChange} />

    case 'map-trackers-config':
      return <MapTrackersConfig field={field} value={value} onChange={onChange} getFilteredEntities={getFilteredEntities} />

    case 'group-select':
      const { groups = [] } = field;
      const groupOptions = [
        { id: 'default', name: t('groups.default') },
        ...groups.sort((a, b) => a.order - b.order)
      ];

      return (
        <div className="config-field">
          <div className="config-field-row">
            <label>{field.label || t('groups.selectGroup')}</label>
            <AutoComplete
              allowClear
              value={value || 'default'}
              onChange={onChange}
              placeholder={t('groups.selectGroup')}
              options={groupOptions.map(group => ({
                value: group.id,
                label: group.name
              }))}
            />
          </div>
        </div>
      );

    // ===== 下拉选择（取值是固定枚举，如「指标放右侧 / 下方」）=====
    case 'select':
      return (
        <div className="config-field">
          <div className="config-field-row">
            <label>{field.label}</label>
            <Select
              value={value === undefined || value === null || value === '' ? field.default : value}
              onChange={onChange}
              style={{ width: '100%' }}
              options={(field.options || []).map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
          {field.hint && <div className="config-field-hint">{field.hint}</div>}
        </div>
      );

    // ===== 折叠分组：里面是一组子字段（CPU 设置 / GPU 设置 这种）=====
    // 子字段的 key 直接落在卡片 config 上（扁平），所以用 config + onPatch 读写，
    // 而不是用 value —— value 只有当前这一层字段自己的值。
    case 'field-group': {
      const groupOpen = !!expandedGroups[field.key];
      return (
        <div className="config-field hw-group">
          <button
            type="button"
            className="hw-group-title"
            onClick={() =>
              setExpandedGroups((m) => ({ ...m, [field.key]: !m[field.key] }))
            }
          >
            <span>{field.label}</span>
            <Icon path={groupOpen ? mdiChevronUp : mdiChevronDown} size={16} />
          </button>
          {groupOpen && (
            <div className="hw-group-body">
              {(field.fields || []).map((sub) => (
                <ConfigField
                  key={sub.key}
                  field={sub}
                  value={(config || {})[sub.key]}
                  onChange={(v) => onPatch && onPatch({ [sub.key]: v })}
                  config={config}
                  onPatch={onPatch}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // ===== 硬盘列表：一块盘一组（名称 / 图标 / 已用 / 可用 / 温度）=====
    case 'disk-list':
      return <DiskListConfig field={field} value={value} onChange={onChange} />;

    // ===== 设备电量列表：一台设备一组（名称 / 图标 / 电量 / 充电状态）=====
    case 'battery-list':
      return <BatteryListConfig field={field} value={value} onChange={onChange} />;

    default:
      return null;
  }
}

export default ConfigField; 