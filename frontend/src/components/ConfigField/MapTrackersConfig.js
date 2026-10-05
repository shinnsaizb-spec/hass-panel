import { AutoComplete, Input, Button, ColorPicker } from 'antd';
import { Icon } from '@iconify/react';
import { mdiMapMarker } from '@mdi/js';
import Icon2 from '@mdi/react';
import { useLanguage } from '../../i18n/LanguageContext';

// 新增设备时按顺序取的默认颜色，保证同一张地图上的点颜色容易区分
const DEFAULT_COLORS = [
  '#1677ff',
  '#52c41a',
  '#fa8c16',
  '#eb2f96',
  '#722ed1',
  '#13c2c2',
  '#f5222d',
  '#a0d911',
];

const isImageUrl = (str) => /^https?:\/\//i.test((str || '').trim());

function MapTrackersConfig({ field, value, onChange, getFilteredEntities }) {
  const { t } = useLanguage();
  const trackerEntities = getFilteredEntities('device_tracker.*');
  const trackers = Array.isArray(value) ? value : [];

  const updateAt = (index, patch) => {
    const next = [...trackers];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeAt = (index) => {
    const next = [...trackers];
    next.splice(index, 1);
    onChange(next);
  };

  const addOne = () => {
    onChange([
      ...trackers,
      {
        id: 'TRACKER_' + Date.now(),
        entity_id: '',
        name: '',
        icon: '',
        color: DEFAULT_COLORS[trackers.length % DEFAULT_COLORS.length],
      },
    ]);
  };

  // 图标预览：图片网址走 img，Iconify 名称走 Icon，都没填就给个默认图钉
  const renderIconPreview = (icon, color) => {
    if (isImageUrl(icon)) {
      return <img src={icon} alt="" className="map-tracker-icon-preview" />;
    }
    if (icon && icon.includes(':')) {
      return (
        <Icon
          icon={icon}
          className="map-tracker-icon-preview"
          style={{ color: color || DEFAULT_COLORS[0] }}
        />
      );
    }
    return (
      <Icon2
        path={mdiMapMarker}
        size={0.9}
        className="map-tracker-icon-preview"
        style={{ color: color || DEFAULT_COLORS[0] }}
      />
    );
  };

  return (
    <div className="config-field">
      <label>{field.label}</label>

      <div className="map-trackers-config">
        {trackers.map((tracker, index) => (
          <div className="map-tracker-item" key={tracker.id || index}>
            <div className="map-tracker-row">
              <span className="map-tracker-icon-slot">
                {renderIconPreview(tracker.icon, tracker.color)}
              </span>

              <Input
                value={tracker.name || ''}
                onChange={(e) => updateAt(index, { name: e.target.value })}
                placeholder={t('map.trackerName')}
                style={{ flex: 1 }}
              />

              <ColorPicker
                value={tracker.color || DEFAULT_COLORS[0]}
                defaultValue={DEFAULT_COLORS[0]}
                presets={[{ label: '', colors: DEFAULT_COLORS }]}
                onChange={(c) => updateAt(index, { color: c.toHexString() })}
              />

              <Button type="primary" danger onClick={() => removeAt(index)}>
                {t('configField.delete')}
              </Button>
            </div>

            <AutoComplete
              allowClear
              value={tracker.entity_id || null}
              onChange={(val) => updateAt(index, { entity_id: val })}
              showSearch
              placeholder={t('map.trackerEntity')}
              optionFilterProp="children"
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={trackerEntities.map((entity) => ({
                value: entity.id,
                label: entity.name + ' (' + entity.id + ')',
              }))}
            />

            <Input
              value={tracker.icon || ''}
              onChange={(e) => updateAt(index, { icon: e.target.value })}
              placeholder={t('map.trackerIcon')}
            />
          </div>
        ))}

        {trackers.length === 0 && (
          <div className="map-trackers-empty">{t('map.noTrackers')}</div>
        )}

        <Button type="primary" onClick={addOne} style={{ marginTop: 8 }}>
          {t('map.addTracker')}
        </Button>

        <div className="map-trackers-hint">{t('map.iconHint')}</div>
      </div>
    </div>
  );
}

export default MapTrackersConfig;
