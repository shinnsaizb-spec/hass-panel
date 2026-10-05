import React, { useState } from 'react';
import { Modal, Upload, message } from 'antd';
import Icon from '@mdi/react';
import { mdiUpload } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import { pluginApi } from '../../utils/api';
import { loadPlugins } from '../../plugin/loader';

// 上传插件压缩包（.zip）的弹窗。
// 上传成功后自动：①后端重扫；②前端运行时重新加载卡片；③通知配置页刷新卡片下拉。
export default function UploadPluginModal({ open, onClose }) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);

  const beforeUpload = (file) => {
    const isZip = (file.name || '').toLowerCase().endsWith('.zip');
    if (!isZip) {
      message.error(t('config.uploadOnlyZip'));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const res = await pluginApi.upload(file);
      // 后端出错时也返回 HTTP 200，错误码写在 body.code 里
      if (res && typeof res.code !== 'undefined' && res.code !== 200) {
        throw new Error(res.error || res.message || 'upload failed');
      }
      // 后端已重扫；再让前端运行时重新加载卡片
      try {
        await pluginApi.rescan();
      } catch (e) {
        // 重扫失败不影响已写入的插件文件，忽略
      }
      try {
        await loadPlugins();
      } catch (e) {
        // 加载失败也提示成功（插件文件已落盘，刷新页面即可生效）
      }
      message.success(t('config.uploadPluginSuccess'));
      onSuccess(res);
      if (onClose) onClose(true);
    } catch (e) {
      const resp = e && e.response;
      const body = resp && resp.data;
      let detail = '';
      if (body) {
        // 后端出错通常是 JSON {detail/message}；若拿到 HTML（如 nginx 404 页）则截断，别整段塞进提示
        if (typeof body === 'string') detail = body.replace(/<[^>]+>/g, ' ').slice(0, 200);
        else detail = body.detail || body.error || body.message || '';
      }
      if (!detail && resp && resp.status) detail = `HTTP ${resp.status}`;
      if (!detail) detail = (e && e.message) || t('config.uploadPluginFailed');
      message.error(detail);
      onError(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title={t('config.uploadPlugin')}
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      destroyOnClose
    >
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        {t('config.uploadPluginHint')}
      </p>
      <Upload.Dragger
        key={open ? 'open' : 'closed'}
        accept=".zip"
        maxCount={1}
        disabled={uploading}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
      >
        <p className="ant-upload-drag-icon">
          <Icon path={mdiUpload} size={42} color="var(--color-primary, #1677ff)" />
        </p>
        <p className="ant-upload-text">{t('config.uploadPluginDrag')}</p>
        <p className="ant-upload-hint">{t('config.uploadPluginHint2')}</p>
      </Upload.Dragger>
    </Modal>
  );
}
