import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Switch, Button, Popconfirm, Input, message, Empty, Tag, Tooltip } from 'antd';
import Icon from '@mdi/react';
import {
  mdiCardsOutline,
  mdiChevronDown,
  mdiChevronUp,
  mdiPencil,
  mdiDelete,
  mdiRestore,
  mdiMagnify,
} from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import { pluginApi } from '../../utils/api';
import { loadPlugins, loadCardSettings } from '../../plugin/loader';
import './style.css';

// ==============================================================================
// 卡片管理
// ------------------------------------------------------------------------------
// 布局参考「全局配置」：分区（Section）+ 可折叠。
//   ▸ 基础卡片   —— 内置卡片：重命名 / 启用禁用 / 恢复默认名
//   ▸ 插件卡片   —— 插件卡片：重命名 / 启用禁用（整包）/ 卸载
// 两个分区默认都是收起的。
// ==============================================================================

function Section({ title, count, collapsed, onToggle, children }) {
  return (
    <div className="cm-section">
      <button type="button" className="cm-section-title" onClick={onToggle}>
        <span className="cm-section-label">
          {title}
          {typeof count === 'number' ? <span className="cm-count">{count}</span> : null}
        </span>
        <Icon path={collapsed ? mdiChevronDown : mdiChevronUp} size={16} />
      </button>
      {!collapsed && <div className="cm-section-body">{children}</div>}
    </div>
  );
}

export default function CardManagerModal({ open, onClose, cardTypes = {} }) {
  const { t } = useLanguage();

  const [plugins, setPlugins] = useState([]);
  const [cardNames, setCardNames] = useState({});
  const [cardDisabled, setCardDisabled] = useState([]);
  const [busy, setBusy] = useState(null);

  // 两个分区默认收起
  const [collapsedBase, setCollapsedBase] = useState(true);
  const [collapsedPlugin, setCollapsedPlugin] = useState(true);

  // 正在重命名的目标（卡片类型 或 插件 id）
  const [editKey, setEditKey] = useState(null);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await pluginApi.listAll();
      setPlugins((res && res.plugins) || []);
    } catch (e) {
      message.error(t('config.pluginLoadFailed'));
    }
    try {
      const [n, d] = await Promise.all([pluginApi.cardNames(), pluginApi.cardDisabled()]);
      setCardNames((n && n.names) || {});
      setCardDisabled((d && d.disabled) || []);
    } catch (e) {
      /* 拿不到不影响插件管理 */
    }
  }, [t]);

  useEffect(() => {
    if (open) load();
    // ⚠️ 依赖里不能放 load：load 依赖 t，而 LanguageContext 的 t 每次渲染都是新函数，
    //    放进去会导致「effect → setState → 重渲染 → load 变 → effect」无限循环。
    //    这里只在弹窗打开时加载一次即可。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 基础卡片列表（内置，按名字排序）
  const baseCards = useMemo(() => {
    const arr = Object.entries(cardTypes)
      .filter(([, c]) => !c.plugin)
      .map(([type, c]) => ({ type, ...c }));
    arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh'));
    const kw = search.trim().toLowerCase();
    if (!kw) return arr;
    return arr.filter(
      (c) =>
        String(c.name || '').toLowerCase().includes(kw) ||
        String(c.type || '').toLowerCase().includes(kw)
    );
  }, [cardTypes, search]);

  const startEdit = (key, name) => {
    setEditKey(key);
    setEditName(name || '');
  };

  const cancelEdit = () => {
    setEditKey(null);
    setEditName('');
  };

  /** 卡片设置类改动：刷新弹窗数据 + 通知配置页 / 首页重算 */
  const afterCardChange = async () => {
    await load();
    try {
      await loadCardSettings();
    } catch (e) {
      /* ignore */
    }
  };

  /** 插件类改动：还要让运行时重新加载插件 */
  const afterPluginChange = async () => {
    await load();
    try {
      await loadPlugins();
    } catch (e) {
      /* ignore */
    }
  };

  const saveCardName = async (type) => {
    setBusy(type);
    try {
      await pluginApi.renameCard(type, editName.trim());
      message.success(t('config.pluginRenameSuccess'));
      setEditKey(null);
      await afterCardChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  const resetCardName = async (type) => {
    setBusy(type);
    try {
      await pluginApi.renameCard(type, '');
      message.success(t('config.cardNameResetDone'));
      await afterCardChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  const toggleCardDisabled = async (type, disabled) => {
    setBusy(type);
    try {
      await pluginApi.setCardDisabled(type, disabled);
      message.success(disabled ? t('config.cardDisabledMsg') : t('config.cardEnabledMsg'));
      await afterCardChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  const savePluginName = async (p) => {
    setBusy(p.id);
    try {
      await pluginApi.rename(p.id, editName.trim());
      message.success(t('config.pluginRenameSuccess'));
      setEditKey(null);
      await afterPluginChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  const togglePlugin = async (p, enabled) => {
    setBusy(p.id);
    try {
      await pluginApi.setEnabled(p.id, enabled);
      message.success(enabled ? t('config.pluginEnabledMsg') : t('config.pluginDisabledMsg'));
      await afterPluginChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  const uninstallPlugin = async (p) => {
    setBusy(p.id);
    try {
      await pluginApi.uninstall(p.id);
      message.success(t('config.pluginUninstallSuccess'));
      await afterPluginChange();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon path={mdiCardsOutline} size={18} />
          {t('config.cardManager')}
        </span>
      }
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      width={680}
      destroyOnClose
    >
      <p className="cm-hint">{t('config.cardManagerHint')}</p>

      {/* ---------------- 基础卡片 ---------------- */}
      <Section
        title={t('config.baseCards')}
        count={baseCards.length}
        collapsed={collapsedBase}
        onToggle={() => setCollapsedBase((v) => !v)}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('config.searchCards')}
          allowClear
          prefix={<Icon path={mdiMagnify} size={14} />}
        />

        {baseCards.length === 0 ? (
          <Empty description={t('config.noCardsFound')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="cm-list">
            {baseCards.map((c) => {
              const isDisabled = cardDisabled.includes(c.type);
              return (
                <div className={`cm-item ${isDisabled ? 'is-disabled' : ''}`} key={c.type}>
                  <div className="cm-main">
                    {editKey === c.type ? (
                      <Input
                        size="small"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onPressEnter={() => saveCardName(c.type)}
                        placeholder={c.defaultName || c.type}
                        autoFocus
                        style={{ maxWidth: 260 }}
                      />
                    ) : (
                      <div className="cm-name">
                        <Icon
                          path={c.icon}
                          size={13}
                          style={{ marginRight: 6, verticalAlign: 'bottom' }}
                        />
                        {c.name}
                      </div>
                    )}
                    <div className="cm-meta">
                      <span className="cm-id">{c.type}</span>
                      {cardNames[c.type] ? <Tag color="blue">{t('config.cardNameCustom')}</Tag> : null}
                      {isDisabled ? <Tag color="orange">{t('config.cardDisabled')}</Tag> : null}
                    </div>
                  </div>

                  <div className="cm-actions">
                    {editKey === c.type ? (
                      <>
                        <Button
                          size="small"
                          type="link"
                          loading={busy === c.type}
                          onClick={() => saveCardName(c.type)}
                        >
                          {t('config.pluginSave')}
                        </Button>
                        <Button size="small" type="link" onClick={cancelEdit}>
                          {t('config.pluginCancel')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Tooltip title={t('config.pluginRename')}>
                          <Button
                            size="small"
                            type="text"
                            icon={<Icon path={mdiPencil} size={14} />}
                            onClick={() => startEdit(c.type, cardNames[c.type] || '')}
                          />
                        </Tooltip>
                        {cardNames[c.type] ? (
                          <Tooltip title={t('config.cardNameReset')}>
                            <Button
                              size="small"
                              type="text"
                              loading={busy === c.type}
                              icon={<Icon path={mdiRestore} size={14} />}
                              onClick={() => resetCardName(c.type)}
                            />
                          </Tooltip>
                        ) : null}
                        <Tooltip title={isDisabled ? t('config.cardEnable') : t('config.cardDisable')}>
                          <Switch
                            size="small"
                            checked={!isDisabled}
                            loading={busy === c.type}
                            onChange={(v) => toggleCardDisabled(c.type, !v)}
                          />
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ---------------- 插件卡片 ---------------- */}
      <Section
        title={t('config.pluginCards')}
        count={plugins.length}
        collapsed={collapsedPlugin}
        onToggle={() => setCollapsedPlugin((v) => !v)}
      >
        {plugins.length === 0 ? (
          <Empty description={t('config.pluginEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="cm-list">
            {plugins.map((p) => (
              <div className="cm-item" key={p.id}>
                <div className="cm-main">
                  {editKey === p.id ? (
                    <Input
                      size="small"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onPressEnter={() => savePluginName(p)}
                      placeholder={p.builtinName || p.id}
                      autoFocus
                      style={{ maxWidth: 260 }}
                    />
                  ) : (
                    <div className="cm-name">{p.name}</div>
                  )}
                  <div className="cm-meta">
                    <span className="cm-id">{p.id}</span>
                    <span>v{p.version}</span>
                    {p.author ? <span>{p.author}</span> : null}
                    {!p.enabled ? <Tag color="orange">{t('config.pluginDisabled')}</Tag> : null}
                  </div>
                </div>

                <div className="cm-actions">
                  {editKey === p.id ? (
                    <>
                      <Button
                        size="small"
                        type="link"
                        loading={busy === p.id}
                        onClick={() => savePluginName(p)}
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
                        onClick={() => startEdit(p.id, p.name || '')}
                      />
                    </Tooltip>
                  )}

                  <Tooltip title={p.enabled ? t('config.pluginDisable') : t('config.pluginEnable')}>
                    <Switch
                      size="small"
                      checked={!!p.enabled}
                      loading={busy === p.id}
                      onChange={(v) => togglePlugin(p, v)}
                    />
                  </Tooltip>

                  <Popconfirm
                    title={t('config.pluginUninstall')}
                    description={t('config.pluginUninstallConfirm')}
                    okText={t('config.pluginUninstall')}
                    cancelText={t('config.pluginCancel')}
                    okButtonProps={{ danger: true }}
                    onConfirm={() => uninstallPlugin(p)}
                  >
                    <Tooltip title={t('config.pluginUninstall')}>
                      <Button
                        size="small"
                        type="text"
                        danger
                        loading={busy === p.id}
                        icon={<Icon path={mdiDelete} size={14} />}
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Modal>
  );
}
