import React from 'react';
import { Modal, Input, Button, message } from 'antd';
import Icon from '@mdi/react';
import { mdiCheck, mdiLanConnect } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import { systemApi } from '../../utils/api';
import './style.css';

// ==============================================================================
// HA 连接设置
// ------------------------------------------------------------------------------
// 之前改 HA 地址 / 令牌只能调后端接口（界面上只有「首次初始化」页，而已初始化后
// 打开它会被自动跳走），这里补一个入口。
//
// 后端 PUT /user_config/hass_config 会**先校验令牌是否有效**再保存，
// 所以「保存」本身就等于「测试连接」——无效令牌会直接返回错误，不会写库。
// ==============================================================================

function HaConfigModal({ visible, onClose }) {
  const { t } = useLanguage();
  const [url, setUrl] = React.useState('');
  const [token, setToken] = React.useState('');
  const [showToken, setShowToken] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // 每次打开都重新读一遍当前配置
  React.useEffect(() => {
    if (!visible) return;
    setShowToken(false);
    setLoading(true);
    systemApi
      .getHassConfig()
      .then((res) => {
        if (res && res.code === 200 && res.data) {
          setUrl(res.data.url || '');
          setToken(res.data.token || '');
        } else {
          message.warning((res && (res.error || res.message)) || t('haConfig.loadFailed'));
        }
      })
      .catch(() => message.error(t('haConfig.loadFailed')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSave = async () => {
    const u = url.trim();
    const k = token.trim();
    if (!u || !k) {
      message.warning(t('haConfig.required'));
      return;
    }
    setSaving(true);
    try {
      const res = await systemApi.updateHassConfig({ hass_url: u, hass_token: k });
      if (res && res.code === 200) {
        message.success(t('haConfig.saved'));
        // 存一份到 localStorage，和初始化流程保持一致
        try {
          localStorage.setItem('hass_url', u);
        } catch (e) {
          /* 忽略 */
        }
        onClose();
        // 让关心的人（如页面上的提示）知道配置变了
        window.dispatchEvent(new CustomEvent('hasspanel:hass-config-changed'));
      } else {
        message.error((res && (res.error || res.message)) || t('haConfig.saveFailed'));
      }
    } catch (e) {
      message.error(t('haConfig.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="ha-config-footer">
      <Button onClick={onClose}>{t('config.cancel')}</Button>
      <Button
        type="primary"
        loading={saving}
        icon={<Icon path={mdiCheck} size={12} />}
        onClick={handleSave}
      >
        {saving ? t('config.saving') : t('config.save')}
      </Button>
    </div>
  );

  return (
    <Modal
      title={t('haConfig.title')}
      open={visible}
      onCancel={onClose}
      footer={footer}
      width={560}
      destroyOnClose
    >
      <div className="ha-config-body">
        <div className="ha-config-field">
          <label>{t('haConfig.url')}</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('haConfig.urlPlaceholder')}
            prefix={<Icon path={mdiLanConnect} size={14} />}
            disabled={loading}
          />
          <div className="ha-config-hint">{t('haConfig.urlHint')}</div>
        </div>

        <div className="ha-config-field">
          <label>{t('haConfig.token')}</label>
          <Input.Password
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t('haConfig.tokenPlaceholder')}
            disabled={loading}
            visibilityToggle={{
              visible: showToken,
              onVisibleChange: setShowToken,
            }}
          />
          <div className="ha-config-hint">{t('haConfig.tokenHint')}</div>
        </div>

        <div className="ha-config-tip">{t('haConfig.validateTip')}</div>
      </div>
    </Modal>
  );
}

export default HaConfigModal;
