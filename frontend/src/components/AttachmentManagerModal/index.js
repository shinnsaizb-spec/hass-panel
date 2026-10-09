import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Tabs, Input, Button, Popconfirm, Empty, message, Tooltip, Progress } from 'antd';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { attachmentApi } from '../../utils/api';
import './style.css';

// ==============================================================================
// 附件管理
// ------------------------------------------------------------------------------
// 管理上传目录里的文件，按类型分 4 组：
//   icon     .svg / .ico
//   image    .png/.jpg/.jpeg/.bmp/.tiff/.avif …
//   animated .gif/.webp/.mp4/.webm/.apng …
//   other    其它
// 支持预览、重命名、删除，以及按文件名搜索过滤。
// 传 onPick 进入「选择模式」，用于从已有附件里挑一个文件。
// ==============================================================================

const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v'];

function fmtSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function isVideo(name) {
  const ext = String(name).split('.').pop().toLowerCase();
  return VIDEO_EXT.includes(ext);
}

export default function AttachmentManagerModal({ open, onClose, onPick }) {
  const { t } = useLanguage();
  // 传了 onPick 就是「选择模式」：点整行直接选中并回传，不显示重命名/删除
  const pickMode = typeof onPick === 'function';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('image');
  const [editingName, setEditingName] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [busy, setBusy] = useState(null);
  const [keyword, setKeyword] = useState('');
  // 转 webm 进度：converting 记录「文件名 -> taskId」，progress 记录「文件名 -> 百分比」
  const [converting, setConverting] = useState({});
  const [progress, setProgress] = useState({});
  const pollTimers = useRef({});

  // 组件卸载时清掉所有轮询定时器，避免后台空转
  useEffect(() => {
    return () => {
      Object.values(pollTimers.current).forEach((t) => clearInterval(t));
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attachmentApi.list();
      setItems((res && res.data && res.data.items) || []);
    } catch (e) {
      message.error(t('config.attachmentLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) load();
    // ⚠️ 依赖里不能放 load：load 依赖 t，而 LanguageContext 的 t 每次渲染都是新函数，
    //    放进去会导致「effect → setState → 重渲染 → load 变 → effect」无限循环。
    //    这里只在弹窗打开时加载一次即可。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 按文件名（不区分大小写）过滤，再按分类分组
  const grouped = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const g = { icon: [], image: [], animated: [], other: [] };
    items.forEach((it) => {
      if (kw && !String(it.name || '').toLowerCase().includes(kw)) return;
      (g[it.category] || g.other).push(it);
    });
    return g;
  }, [items, keyword]);

  // 搜索时若当前分类没有命中，自动跳到第一个有结果的分类，省得用户自己点页签
  useEffect(() => {
    if (!keyword.trim()) return;
    if ((grouped[activeTab] || []).length) return;
    const hit = ['image', 'icon', 'animated', 'other'].find(
      (k) => (grouped[k] || []).length > 0
    );
    if (hit) setActiveTab(hit);
  }, [keyword, grouped, activeTab]);

  const startEdit = (it) => {
    setEditingName(it.name);
    setEditValue(it.name);
  };

  const cancelEdit = () => {
    setEditingName(null);
    setEditValue('');
  };

  const saveEdit = async (it) => {
    const next = editValue.trim();
    if (!next || next === it.name) {
      cancelEdit();
      return;
    }
    setBusy(it.name);
    try {
      await attachmentApi.rename(it.name, next);
      message.success(t('config.pluginRenameSuccess'));
      cancelEdit();
      await load();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  const removeItem = async (it) => {
    setBusy(it.name);
    try {
      await attachmentApi.remove(it.name);
      message.success(t('config.attachmentDeleted'));
      await load();
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    } finally {
      setBusy(null);
    }
  };

  const stopPolling = (name) => {
    const timer = pollTimers.current[name];
    if (timer) {
      clearInterval(timer);
      delete pollTimers.current[name];
    }
  };

  const convertToWebm = async (it) => {
    try {
      const resp = await attachmentApi.transcode(it.name);
      const taskId = resp && resp.data && resp.data.task_id;
      if (!taskId) throw new Error('no task id');
      setConverting((c) => ({ ...c, [it.name]: taskId }));
      setProgress((p) => ({ ...p, [it.name]: 0 }));
      const timer = setInterval(async () => {
        try {
          const r = await attachmentApi.transcodeProgress(taskId);
          const d = r && r.data;
          if (!d || d.status === 'running') {
            if (d) setProgress((p) => ({ ...p, [it.name]: d.progress || 0 }));
            return;
          }
          stopPolling(it.name);
          if (d.status === 'done') {
            setConverting((c) => {
              const n = { ...c };
              delete n[it.name];
              return n;
            });
            setProgress((p) => {
              const n = { ...p };
              delete n[it.name];
              return n;
            });
            message.success(t('config.attachmentConverted'));
            await load();
          } else if (d.status === 'cancelled') {
            setConverting((c) => {
              const n = { ...c };
              delete n[it.name];
              return n;
            });
            setProgress((p) => {
              const n = { ...p };
              delete n[it.name];
              return n;
            });
            message.info(t('config.attachmentConvertCancelled'));
          } else {
            // error
            setConverting((c) => {
              const n = { ...c };
              delete n[it.name];
              return n;
            });
            setProgress((p) => {
              const n = { ...p };
              delete n[it.name];
              return n;
            });
            message.error(d.error || t('config.pluginOpFailed'));
          }
        } catch (e) {
          stopPolling(it.name);
          setConverting((c) => {
            const n = { ...c };
            delete n[it.name];
            return n;
          });
          setProgress((p) => {
            const n = { ...p };
            delete n[it.name];
            return n;
          });
          message.error(t('config.pluginOpFailed'));
        }
      }, 1000);
      pollTimers.current[it.name] = timer;
    } catch (e) {
      message.error(t('config.pluginOpFailed'));
    }
  };

  const cancelConvert = async (it) => {
    const taskId = converting[it.name];
    if (taskId) {
      try {
        await attachmentApi.transcodeCancel(taskId);
      } catch (e) {
        // 忽略：前端直接清状态即可，后台会自行终止 ffmpeg
      }
    }
    stopPolling(it.name);
    setConverting((c) => {
      const n = { ...c };
      delete n[it.name];
      return n;
    });
    setProgress((p) => {
      const n = { ...p };
      delete n[it.name];
      return n;
    });
    message.info(t('config.attachmentConvertCancelled'));
  };

  const renderList = (list, emptyText) => {
    if (!list.length) {
      return (
        <Empty
          description={keyword.trim() ? t('config.attachmentNoResult') : emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    return (
      <div className="am-list">
        {list.map((it) => (
          <div
            className={`am-item ${pickMode ? 'is-pickable' : ''}`}
            key={it.name}
            onClick={pickMode ? () => onPick(it) : undefined}
            title={pickMode ? t('config.attachmentPickHint') : it.name}
          >
            <div className="am-thumb">
              {isVideo(it.name) ? (
                <Icon icon="mdi:video-outline" width={22} />
              ) : (
                <img src={it.url} alt="" loading="lazy" />
              )}
            </div>

            <div className="am-main">
              {!pickMode && editingName === it.name ? (
                <Input
                  size="small"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onPressEnter={() => saveEdit(it)}
                  autoFocus
                />
              ) : (
                <div className="am-name" title={it.name}>{it.name}</div>
              )}
              <div className="am-meta">
                <span>{fmtSize(it.size)}</span>
              </div>
              {progress[it.name] != null && (
                <div className="am-progress">
                  <Progress
                    percent={progress[it.name]}
                    size="small"
                    status={progress[it.name] >= 100 ? 'success' : 'active'}
                  />
                </div>
              )}
            </div>

            {!pickMode ? (
              converting[it.name] ? (
                <div className="am-actions">
                  <Button
                    size="small"
                    type="text"
                    onClick={() => cancelConvert(it)}
                  >
                    {t('config.attachmentConvertCancel')}
                  </Button>
                </div>
              ) : (
              <div className="am-actions">
                {editingName === it.name ? (
                  <>
                    <Button size="small" type="link" loading={busy === it.name} onClick={() => saveEdit(it)}>
                      {t('config.pluginSave')}
                    </Button>
                    <Button size="small" type="link" onClick={cancelEdit}>
                      {t('config.pluginCancel')}
                    </Button>
                  </>
                ) : (
                  <>
                    {!String(it.name).toLowerCase().endsWith('.webm') && isVideo(it.name) && (
                      <Tooltip title={t('config.attachmentConvertWebm')}>
                        <Button
                          size="small"
                          type="text"
                          loading={busy === it.name}
                          onClick={() => convertToWebm(it)}
                        >
                          {t('config.attachmentConvertWebmShort')}
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip title={t('config.pluginRename')}>
                      <Button
                        size="small"
                        type="text"
                        icon={<Icon icon="mdi:pencil" width={14} />}
                        onClick={() => startEdit(it)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title={t('config.attachmentDelete')}
                      description={t('config.attachmentDeleteConfirm')}
                      okText={t('config.attachmentDelete')}
                      cancelText={t('config.pluginCancel')}
                      okButtonProps={{ danger: true }}
                      onConfirm={() => removeItem(it)}
                    >
                      <Tooltip title={t('config.attachmentDelete')}>
                        <Button
                          size="small"
                          type="text"
                          danger
                          loading={busy === it.name}
                          icon={<Icon icon="mdi:delete-outline" width={14} />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </>
                )}
              </div>
            ) ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon icon="mdi:folder-image" width={18} />
          {pickMode ? t('config.attachmentPick') : t('config.attachmentManager')}
        </span>
      }
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      width={680}
      // GlobalConfig 是自定义浮层（z-index:1001），AntD 默认 modal z-index 可能落在它下面。
      // 提高附件选择弹窗层级，避免全局背景面板盖住附件列表。
      zIndex={1100}
      destroyOnClose
    >
      <p className="am-hint">
        {pickMode ? t('config.attachmentPickHint') : t('config.attachmentManagerHint')}
      </p>

      {/* 搜索：按文件名过滤当前分类下的附件 */}
      <Input
        className="am-search"
        allowClear
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={t('config.attachmentSearchPlaceholder')}
        prefix={<Icon icon="mdi:magnify" width={15} />}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'image', label: `${t('config.attachmentImage')} (${grouped.image.length})` },
          { key: 'icon', label: `${t('config.attachmentIcon')} (${grouped.icon.length})` },
          { key: 'animated', label: `${t('config.attachmentAnimated')} (${grouped.animated.length})` },
          { key: 'other', label: `${t('config.attachmentOther')} (${grouped.other.length})` },
        ]}
      />

      <div className="am-body">
        {loading
          ? null
          : renderList(
              grouped[activeTab] || [],
              t(`config.attachmentEmpty_${activeTab}`)
            )}
      </div>
    </Modal>
  );
}
