import React from 'react';
import './style.css';

/**
 * 让「卡片里的元素」随卡片尺寸一起放大/缩小。
 *
 * 关键点：
 * 1) 等比缩放：宽、高两个方向用**同一个**缩放比 s，避免非等比把文字/图标拉歪。
 *    s = sqrt(sx * sy)（几何平均），宽高都变化时都能平滑响应。
 * 2) 舞台宽高都除以 s：缩放后正好铺满卡片，不留白、不溢出。
 * 3) s≈1（默认大小）时**直接返回原内容、不包裹任何 div**，完全保持原样，
 *    不会给卡片多加一层（主页 `.react-grid-item > div` 是全局玻璃底，多包一层就会变双层）。
 *
 * sx / sy = 当前尺寸 / 默认尺寸。
 */
function ScaledCard({ sx = 1, sy = 1, noScale = false, children, className, style }) {
  const safeSx = Number.isFinite(sx) && sx > 0.01 ? sx : 1;
  const safeSy = Number.isFinite(sy) && sy > 0.01 ? sy : 1;
  const s = Math.sqrt(safeSx * safeSy);

  // noScale：像地图 / 摄像头这种「按自己渲染尺寸自绘」的卡片不做缩放，
  // 让内容自己铺满卡片即可（否则地图会被 transform 影响、画到卡片外面）。
  // 默认大小：不加任何包裹，保持原有 DOM 结构（零副作用）
  if (noScale || Math.abs(s - 1) < 0.002) {
    if (React.Children.count(children) === 1 && React.isValidElement(children)) {
      return children;
    }
    return (
      <div className={className} style={{ width: '100%', height: '100%', ...style }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`hp-scaled-card ${className || ''}`}
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      <div
        className="hp-scaled-stage"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `calc(100% / ${s})`,
          height: `calc(100% / ${s})`,
          transform: `scale(${s})`,
          transformOrigin: 'top left',
          // 把缩放后的内容裁到卡片框内：像地图这种「按渲染尺寸自绘」的内容
          // 放大后容易超出卡片，裁剪一下就不会溢出卡片框了。
          overflow: 'hidden',
          // 把缩放比暴露给 CSS，卡片标题用它做「反向缩放」，让标题不跟着卡片一起缩放。
          '--hp-scale': s,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ScaledCard;
