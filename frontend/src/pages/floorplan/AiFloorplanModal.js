import React from 'react';
import { Button, Checkbox, Input, Modal, message } from 'antd';
import { useLanguage } from '../../i18n/LanguageContext';
import { aiApi, aiResultToBuildingParts } from '../../floorplan/ai';

// ==============================================================================
// 自动生成户型：把底图交给多模态模型，让它识别出房间多边形
// ------------------------------------------------------------------------------
// 面板自己**不带模型**，用用户自己填的（任何兼容 OpenAI 接口规范的多模态服务都行）。
// 所以这里有两段：上面填配置、下面按按钮生成。没配 Key 时生成按钮直接拦住并提示。
//
// ⚠️ api_key 只在**填了新值**时提交；输入框留空 = 不改动（后端拿不到原 Key，
//    所以「留空」不能解释成「清空」）。要清空请用下面的「清除 Key」。
//
// ⚠️ 模型回的是**归一化坐标**，换算成米制由 `aiResultToBuildingParts` 做，
//    它依赖底图当前的 `x/z/width/rotation` —— 所以**先标定比例再生成**，否则尺寸会不对。
// ==============================================================================

export default function AiFloorplanModal({ open, onCancel, image, bg, aspect, onApply }) {
  const { t } = useLanguage();
  const [cfg, setCfg] = React.useState({ base_url: '', model: '', has_key: false });
  const [keyInput, setKeyInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [replace, setReplace] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setErr('');
    setKeyInput('');
    aiApi
      .getConfig()
      .then(setCfg)
      .catch((e) => setErr(e.message));
  }, [open]);

  const patch = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const save = async (extra = {}) => {
    setSaving(true);
    setErr('');
    try {
      const payload = { base_url: cfg.base_url, model: cfg.model, ...extra };
      if (keyInput.trim()) payload.api_key = keyInput.trim();
      const next = await aiApi.putConfig(payload);
      setCfg(next);
      setKeyInput('');
      message.success(t('floorplan.aiSaved'));
      return next;
    } catch (e) {
      setErr(e.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ⚠️ 判定要和后端保持一致：`base_url = mock` 是**不需要 Key** 的演示模式，
  //    只判 has_key 会让演示模式永远点不动（踩过）。
  const isMock = (cfg.base_url || '').trim().replace(/\/+$/, '') === 'mock';
  const configured = !!cfg.base_url && !!cfg.model && (cfg.has_key || isMock);

  const run = async () => {
    if (!image) {
      setErr(t('floorplan.aiNoBg'));
      return;
    }
    if (!configured) {
      setErr(t('floorplan.aiNeedConfig'));
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const { result } = await aiApi.analyze(image);
      const parts = aiResultToBuildingParts(result, bg, aspect);
      if (!parts.rooms.length) {
        setErr(t('floorplan.aiNoRooms'));
        return;
      }
      onApply(parts, { replace });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('floorplan.autoGenerate')}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={620}
      destroyOnClose
    >
      <p className="fp-ai-hint">{t('floorplan.aiIntro')}</p>

      <div className="fp-ai-form">
        <label className="fp-ai-field">
          <span>{t('floorplan.aiBaseUrl')}</span>
          <Input
            value={cfg.base_url}
            onChange={(e) => patch('base_url', e.target.value)}
            placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
          />
        </label>
        <label className="fp-ai-field">
          <span>{t('floorplan.aiModel')}</span>
          <Input
            value={cfg.model}
            onChange={(e) => patch('model', e.target.value)}
            placeholder="qwen-vl-max"
          />
        </label>
        <label className="fp-ai-field">
          <span>
            {t('floorplan.aiKey')}
            {cfg.has_key ? <em className="fp-ai-badge">{t('floorplan.aiKeySaved')}</em> : null}
          </span>
          <Input.Password
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={cfg.has_key ? t('floorplan.aiKeyKeep') : 'sk-...'}
          />
        </label>
        <div className="fp-ai-actions">
          <Button onClick={() => save()} loading={saving}>
            {t('floorplan.aiSave')}
          </Button>
          {cfg.has_key ? (
            <Button onClick={() => save({ clear_key: true })} danger type="text">
              {t('floorplan.aiClearKey')}
            </Button>
          ) : null}
        </div>
      </div>

      <p className="fp-ai-hint fp-ai-muted">{t('floorplan.aiMockHint')}</p>

      <div className="fp-ai-run">
        <Checkbox checked={replace} onChange={(e) => setReplace(e.target.checked)}>
          {t('floorplan.aiReplace')}
        </Checkbox>
        <Button type="primary" onClick={run} loading={busy} disabled={!image}>
          {busy ? t('floorplan.aiRunning') : t('floorplan.aiRun')}
        </Button>
      </div>

      {err ? <div className="fp-ai-error">{err}</div> : null}
    </Modal>
  );
}
