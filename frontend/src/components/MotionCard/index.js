import React from 'react';
import { mdiMotionSensor } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import BaseCard from '../BaseCard';
import { useHistory, useLogs } from '@hakit/core';
import './style.css';

function MotionCard({ config }) {
  const titleVisible = config.titleVisible;
  const { t } = useLanguage();

  const motionId = (config.motion_entity_id || '').trim();
  const luxId = (config.lux_entity_id || '').trim();

  // ⚠️ hakit 的 useHistory 在实体 ID 为空时 loading 会永远停在 true
  // （它初始就是 true，只有订阅回调成功后才置 false），
  // 所以判断 loading 时必须把「没配置实体」的情况排除掉，
  // 否则卡片会一直卡在「加载中」。
  // 另外 useLogs 返回的是纯数组、并没有 loading 字段。
  const motionLogs = useLogs(motionId);
  const luxHistory = useHistory(luxId);

  const loading = luxId ? luxHistory.loading : false;

  // 格式化时间戳
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000); // 转换为毫秒
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const records = loading
    ? []
    : (motionLogs || [])
        .map((record) => {
          // 没配照度传感器：只显示「有人移动」的时间点
          if (!luxId) {
            return { time: formatTime(record.when), lux: null };
          }
          // 配了就找 1 秒内的照度值，找不到就跳过这条
          const luxRecord = luxHistory.entityHistory?.find(
            (lux) => Math.abs(lux.lu - record.when) < 1
          );
          if (!luxRecord) return null;
          return { time: formatTime(record.when), lux: luxRecord.s };
        })
        .filter(Boolean)
        .slice(0, 5); // 只取前5条记录

  return (
    <BaseCard
      title={config.title || t('cardTitles.motion')}
      icon={mdiMotionSensor}
      titleVisible={titleVisible}
    >
      <div className="motion-history">
        <div className="today-section">
          <h3>{t('motion.today')}</h3>
          <div className="history-list">
            {loading ? (
              <div className="loading">{t('motion.loading')}</div>
            ) : records.length === 0 ? (
              <div className="loading">{t('motion.noRecords')}</div>
            ) : (
              records.map((record, index) => (
                <div key={index} className="history-item">
                  <div className="time">{record.time}</div>
                  <div className="record-content">
                    <span>
                      {record.lux === null
                        ? t('motion.presence')
                        : t('motion.record').replace('%1', record.lux)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

export default MotionCard;
