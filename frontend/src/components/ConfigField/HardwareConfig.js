import React from 'react';
import { AutoComplete, Input, Button, Select } from 'antd';
import Icon from '@mdi/react';
import { mdiUpload } from '@mdi/js';
import { useHass } from '@hakit/core';
import { useLanguage } from '../../i18n/LanguageContext';
import { DISK_ICON_OPTIONS, DEVICE_ICON_OPTIONS } from '../../utils/hardwareFormat';
import { configApi } from '../../utils/api';
import AttachmentManagerModal from '../AttachmentManagerModal';

// ==============================================================================
// 硬件类卡片的配置控件（硬盘列表 / 设备电量列表）
// ------------------------------------------------------------------------------
// 都是「一组一组分开写」：每一项自己带名称、图标、实体，不靠「按顺序对应」。
// 存进卡片 config 的是一个数组，例如：
//   disks:   [{ name, icon, used, free, temp }]
//   devices: [{ name, icon, level, charge }]
// ==============================================================================

/** 一个实体选择器（带标签） */
function EntityPicker({ label, value, onChange, filter }) {
  const { getAllEntities } = useHass();
  const { t } = useLanguage();
  const all = getAllEntities() || {};
  const options = Object.entries(all)
    .filter(([id]) => (filter ? id.match(filter) : true))
    .map(([id, e]) => ({
      value: id,
      label: (e.attributes && e.attributes.friendly_name ? e.attributes.friendly_name : id) + ' (' + id + ')',
    }));

  return (
    <div className="hw-field">
      <span className="hw-field-label">{label}</span>
      <AutoComplete
        allowClear
        value={value || undefined}
        onChange={(v) => onChange(v || '')}
        showSearch
        style={{ width: '100%' }}
        placeholder={t('configField.selectEntity')}
        optionFilterProp="label"
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={options}
      />
    </div>
  );
}

/** 图标选择器：预设图标 + 自定义图片（可以上传，也可以从「附件管理」里挑） */
function IconPicker({ value, onChange, options }) {
  const { t } = useLanguage();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [showCustom, setShowCustom] = React.useState(false);
  const fileRef = React.useRef(null);

  const isPreset = !!value && options.some((o) => o.value === value);
  const isCustom = !!value && !isPreset;
  const customVisible = isCustom || showCustom;

  const upload = async (file) => {
    if (!file) return;
    try {
      const result = await configApi.uploadImage(file);
      onChange(result.file_path);
    } catch (e) {
      console.error('上传图标失败:', e);
    }
  };

  return (
    <div className="hw-icon-picker">
      <Select
        value={isCustom ? '__custom' : value || options[0].value}
        onChange={(v) => {
          if (v === '__custom') {
            // 选了「自定义图片」直接弹文件框；取消也没关系，下面那排按钮还在
            setShowCustom(true);
            if (fileRef.current) fileRef.current.click();
            return;
          }
          setShowCustom(false);
          onChange(v);
        }}
        style={{ width: '100%' }}
        options={options
          .map((o) => ({
            value: o.value,
            label: (
              <span className="hw-icon-option">
                <Icon path={o.path} size={14} />
                {o.label}
              </span>
            ),
          }))
          .concat([
            {
              value: '__custom',
              label: (
                <span className="hw-icon-option">
                  <Icon path={mdiUpload} size={14} />
                  {t('hwConfig.customIcon')}
                </span>
              ),
            },
          ])}
      />

      {customVisible ? (
        <div className="hw-icon-custom">
          {isCustom ? <img className="hw-icon-preview" src={value} alt="" /> : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              upload(e.target.files && e.target.files[0]);
              e.target.value = '';
            }}
          />
          <Button size="small" onClick={() => fileRef.current && fileRef.current.click()}>
            {t('fields.uploadImage')}
          </Button>
          <Button size="small" onClick={() => setPickerOpen(true)}>
            {t('fields.pickAttachment')}
          </Button>
          {isCustom ? (
            <Button
              size="small"
              danger
              onClick={() => {
                setShowCustom(false);
                onChange('');
              }}
            >
              {t('fields.clearImage')}
            </Button>
          ) : null}
        </div>
      ) : null}

      <AttachmentManagerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(it) => {
          onChange(it.url);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

/** 通用外壳：标题 + 一组一组 + 新增按钮 */
function ListShell({ label, items, onAdd, onRemove, renderItem, addLabel }) {
  return (
    <div className="config-field">
      <label>{label}</label>
      <div className="hw-list">
        {items.map((it, index) => (
          <div className="hw-item" key={index}>
            <div className="hw-item-head">
              <span className="hw-item-index">#{index + 1}</span>
              <Button type="primary" danger size="small" onClick={() => onRemove(index)}>
                ✕
              </Button>
            </div>
            {renderItem(it, index)}
          </div>
        ))}
      </div>
      <Button type="primary" onClick={onAdd} block>
        {addLabel}
      </Button>
    </div>
  );
}

/** 硬盘列表：每块盘单独写名称 / 图标 / 已用 / 可用 / 温度 */
export function DiskListConfig({ field, value, onChange }) {
  const { t } = useLanguage();
  const items = Array.isArray(value) ? value : [];

  const patch = (index, patchObj) => {
    const next = items.slice();
    next[index] = Object.assign({}, next[index], patchObj);
    onChange(next);
  };

  return (
    <ListShell
      label={field.label}
      items={items}
      addLabel={t('hwConfig.addDisk')}
      onAdd={() =>
        onChange(items.concat([{ name: '', icon: 'hdd', used: '', free: '', temp: '' }]))
      }
      onRemove={(index) => {
        const next = items.slice();
        next.splice(index, 1);
        onChange(next);
      }}
      renderItem={(it, index) => (
        <>
          <div className="hw-field">
            <span className="hw-field-label">{t('hwConfig.diskName')}</span>
            <Input
              value={it.name || ''}
              placeholder={t('hwConfig.diskNamePlaceholder')}
              onChange={(e) => patch(index, { name: e.target.value })}
            />
          </div>
          <div className="hw-field">
            <span className="hw-field-label">{t('hwConfig.diskIcon')}</span>
            <IconPicker
              value={it.icon}
              options={DISK_ICON_OPTIONS}
              onChange={(v) => patch(index, { icon: v })}
            />
          </div>
          <EntityPicker
            label={t('hwConfig.diskUsed')}
            value={it.used}
            filter="sensor.*"
            onChange={(v) => patch(index, { used: v })}
          />
          <EntityPicker
            label={t('hwConfig.diskFree')}
            value={it.free}
            filter="sensor.*"
            onChange={(v) => patch(index, { free: v })}
          />
          <EntityPicker
            label={t('hwConfig.diskTemp')}
            value={it.temp}
            filter="sensor.*"
            onChange={(v) => patch(index, { temp: v })}
          />
        </>
      )}
    />
  );
}

/** 设备电量列表：每台设备单独写名称 / 图标 / 电量 / 充电状态 */
export function BatteryListConfig({ field, value, onChange }) {
  const { t } = useLanguage();
  const items = Array.isArray(value) ? value : [];

  const patch = (index, patchObj) => {
    const next = items.slice();
    next[index] = Object.assign({}, next[index], patchObj);
    onChange(next);
  };

  return (
    <ListShell
      label={field.label}
      items={items}
      addLabel={t('hwConfig.addDevice')}
      onAdd={() => onChange(items.concat([{ name: '', icon: 'other', level: '', charge: '' }]))}
      onRemove={(index) => {
        const next = items.slice();
        next.splice(index, 1);
        onChange(next);
      }}
      renderItem={(it, index) => (
        <>
          <div className="hw-field">
            <span className="hw-field-label">{t('hwConfig.deviceName')}</span>
            <Input
              value={it.name || ''}
              placeholder={t('hwConfig.deviceNamePlaceholder')}
              onChange={(e) => patch(index, { name: e.target.value })}
            />
          </div>
          <div className="hw-field">
            <span className="hw-field-label">{t('hwConfig.deviceIcon')}</span>
            <IconPicker
              value={it.icon}
              options={DEVICE_ICON_OPTIONS}
              onChange={(v) => patch(index, { icon: v })}
            />
          </div>
          <EntityPicker
            label={t('hwConfig.deviceLevel')}
            value={it.level}
            filter="sensor.*"
            onChange={(v) => patch(index, { level: v })}
          />
          <EntityPicker
            label={t('hwConfig.deviceCharge')}
            value={it.charge}
            filter="sensor.*|binary_sensor.*"
            onChange={(v) => patch(index, { charge: v })}
          />
        </>
      )}
    />
  );
}
