import React from 'react';
import { Button, InputNumber, Modal } from 'antd';
import { useLanguage } from '../../i18n/LanguageContext';
import { mmPerPixel, backgroundWidthMeters } from '../../floorplan/ai';

// ==============================================================================
// 比例标定：在底图上量一段已知长度的线，算出整张图应该有多宽
// ------------------------------------------------------------------------------
// 为什么单开一个弹窗、而不是塞进编辑器右侧的底图面板：
//   ① 那个面板在 vendored 的编辑器里（禁手改）；
//   ② 在全分辨率的原图上量，比在缩放过的画布上量准得多。
//
// 量完之后把结果写回 `floor.background.width`（米），编辑器渲染底图时就是按它缩放的，
// 于是「描图」时画布上的 1 米 = 真实 1 米。
// ==============================================================================

const MAX_W = 720;

export default function CalibrateModal({ open, onCancel, image, currentWidth, onApply }) {
  const { t } = useLanguage();
  const [nat, setNat] = React.useState(null);
  const [line, setLine] = React.useState(null);
  const [realMm, setRealMm] = React.useState(null);
  const boxRef = React.useRef(null);
  const dragRef = React.useRef(false);

  // 每次打开都重置，别把上一次的线留着
  React.useEffect(() => {
    if (open) {
      setNat(null);
      setLine(null);
      setRealMm(null);
    }
  }, [open]);

  const dispW = nat ? Math.min(MAX_W, nat.w) : MAX_W;
  const dispScale = nat ? dispW / nat.w : 1;
  const dispH = nat ? Math.round(nat.h * dispScale) : 320;

  const pixelLen = line ? Math.hypot(line.x2 - line.x1, line.y2 - line.y1) / dispScale : 0;
  const mpp = mmPerPixel(realMm, pixelLen);
  const widthM = nat && mpp ? backgroundWidthMeters(nat.w, mpp) : null;

  const local = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(dispW, e.clientX - r.left)),
      y: Math.max(0, Math.min(dispH, e.clientY - r.top)),
    };
  };

  const onDown = (e) => {
    if (!nat) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* 合成的 pointer 事件没有活动指针，忽略 */
    }
    dragRef.current = true;
    const p = local(e);
    setLine({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  const onMove = (e) => {
    if (!dragRef.current) return;
    const p = local(e);
    setLine((l) => (l ? { ...l, x2: p.x, y2: p.y } : l));
  };

  const onUp = (e) => {
    dragRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {
      /* 同上 */
    }
  };

  return (
    <Modal
      title={t('floorplan.calibrate')}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      {!image ? (
        <div className="fp-inspector-empty">{t('floorplan.calibrateNoBg')}</div>
      ) : (
        <>
          <p className="fp-calib-hint">{t('floorplan.calibrateHint')}</p>
          <div
            className="fp-calib-stage"
            ref={boxRef}
            style={{ width: dispW, height: dispH }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <img
              src={image}
              alt=""
              draggable={false}
              style={{ width: dispW, height: dispH, display: 'block' }}
              onLoad={(e) =>
                setNat({ w: e.target.naturalWidth || 1, h: e.target.naturalHeight || 1 })
              }
            />
            <svg className="fp-calib-svg" width={dispW} height={dispH}>
              {line ? (
                <>
                  <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
                  <circle cx={line.x1} cy={line.y1} r="5" />
                  <circle cx={line.x2} cy={line.y2} r="5" />
                </>
              ) : null}
            </svg>
          </div>

          <div className="fp-calib-form">
            <div className="fp-calib-row">
              <span className="fp-calib-label">{t('floorplan.calibratePixels')}</span>
              <span className="fp-calib-value">
                {pixelLen ? `${pixelLen.toFixed(1)} px` : t('floorplan.calibrateNoLine')}
              </span>
            </div>
            <div className="fp-calib-row">
              <span className="fp-calib-label">{t('floorplan.calibrateReal')}</span>
              <InputNumber
                value={realMm}
                onChange={setRealMm}
                min={1}
                step={100}
                addonAfter="mm"
                placeholder="14237"
                style={{ width: 180 }}
              />
            </div>
            <div className="fp-calib-row">
              <span className="fp-calib-label">{t('floorplan.calibrateResult')}</span>
              <span className="fp-calib-value fp-calib-strong">
                {widthM ? t('floorplan.calibrateWidth', { w: widthM.toFixed(3) }) : '—'}
              </span>
            </div>
          </div>

          {currentWidth ? (
            <p className="fp-calib-hint">
              {t('floorplan.calibrateCurrent', { w: Number(currentWidth).toFixed(3) })}
            </p>
          ) : null}

          <div className="fp-calib-actions">
            <Button onClick={() => setLine(null)} disabled={!line}>
              {t('floorplan.calibrateRedraw')}
            </Button>
            <Button type="primary" disabled={!widthM} onClick={() => onApply(widthM)}>
              {t('floorplan.calibrateApply')}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
