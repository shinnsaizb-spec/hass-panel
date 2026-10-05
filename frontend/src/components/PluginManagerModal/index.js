import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Switch, Button, Popconfirm, Input, message, Empty, Tag, Tooltip } from 'antd';
import Icon from '@mdi/react';
import { mdiPencil, mdiDelete, mdiPuzzleOutline } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import { pluginApi } from '../../utils/api';
import { loadPlugins } from '../../plugin/loader';
import './style.css';

// 插件管理：重命名 / 启用禁用 / 卸载
export default function PluginManagerModal({ open, onClose }) {
  const { t } = useLanguage();
  const [plugins, setPlugins] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await pluginApi.listAll();
      const list = (res && res.plugins) || [];
      setPlugins(list);
    } catch (e) {
      message.error(t('config.pluginLoadFailed'));
    }
  }, [t]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const afterChange = async () => {
    await load();
    // 让前端运行时重新加载插件（启用的会立即注册；禁用的刷新页面后完全消失）
    try {
      await loadPlugins();
    } catch (e) {
      /* ignore */
    }
  };

  const saveEdit = async (p) => {
    setBusyId(p.id);
    try {
      await pluginApi.rename(p.id, editName.trim());
      message.success(t('config.pluginRenameSuccess'));
      setEditingId(null);
      await afterChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const toggle = async (p, enabled) => {
    setBusyId(p.id);
    try {
      await pluginApi.setEnabled(p.id, enabled);
      message.success(enabled ? t('config.pluginEnabledMsg') : t('config.pluginDisabledMsg'));
      await afterChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const uninstall = async (p) => {
    setBusyId(p.id);
    try {
      await pluginApi.uninstall(p.id);
      message.success(t('config.pluginUninstallSuccess'));
      await afterChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon path={mdiPuzzleOutline} size={18} />
          {t('config.pluginManager')}
        </span>
      }
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      width={640}
      destroyOnClose
    >
      <p className="plugin-manager-hint">{t('config.pluginManagerHint')}</p>

      {plugins.length === 0 ? (
        <Empty description={t('config.pluginEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="plugin-manager-list">
          {plugins.map((p) => (
            <div className="plugin-manager-item" key={p.id}>
              <div className="pm-main">
                {editingId === p.id ? (
                  <Input
                    size="small"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onPressEnter={() => saveEdit(p)}
                    placeholder={p.builtinName || p.id}
                    autoFocus
                    style={{ maxWidth: 240 }}
                  />
                ) : (
                  <div className="pm-name">{p.name}</div>
                )}
                <div className="pm-meta">
                  <span className="pm-id">{p.id}</span>
                  <span>v{p.version}</span>
                  {p.author ? <span>{p.author}</span> : null}
                  {!p.enabled ? <Tag>{t('config.pluginDisabled')}</Tag> : null}
                </div>
              </div>

              <div className="pm-actions">
                {editingId === p.id ? (
                  <>
                    <Button
                      size="small"
                      type="link"
                      loading={busyId === p.id}
                      onClick={() => saveEdit(p)}
                    >
                      {t('config.pluginSave')}
                    </Button>
                    <Button size="small" type="link" onClick={cancelEdit}>
                      {t('config.pluginCancel')}
                    </Button>
                  </>
                ) : (
                  <Tooltip title={t('config.pluginRename')}>
                    <Button
                      size="small"
                      type="text"
                      icon={<Icon path={mdiPencil} size={14} />}
                      onClick={() => startEdit(p)}
                    />
                  </Tooltip>
                )}

                <Tooltip title={p.enabled ? t('config.pluginDisable') : t('config.pluginEnable')}>
                  <Switch
                    size="small"
                    checked={!!p.enabled}
                    loading={busyId === p.id}
                    onChange={(v) => toggle(p, v)}
                  />
                </Tooltip>

                <Popconfirm
                  title={t('config.pluginUninstall')}
                  description={t('config.pluginUninstallConfirm')}
                  okText={t('config.pluginUninstall')}
                  cancelText={t('config.pluginCancel')}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => uninstall(p)}
                >
                  <Tooltip title={t('config.pluginUninstall')}>
                    <Button
                      size="small"
                      type="text"
                      danger
                      loading={busyId === p.id}
                      icon={<Icon path={mdiDelete} size={14} />}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
