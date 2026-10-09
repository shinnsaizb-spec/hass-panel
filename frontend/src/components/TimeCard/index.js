import React, { useState, useEffect } from 'react';
import { mdiClockOutline } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import BaseCard from '../BaseCard';
import dayjs from 'dayjs';
import './style.css';

function TimeCard({config}) {
  const { timeFormat, dateFormat, title, titleVisible } = config;
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [weekday, setWeekday] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = dayjs();
      setCurrentTime(now);
      const weekday = now.format('dddd');

      setWeekday(t(`weekday.${weekday}`));
      // 农历已去掉：它每秒都要跑一遍 Lunar.fromDate（开销不小），而农历一天才变一次，
      // 且多数人并不看。去掉后每秒只剩一次时间刷新。
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [t]); // 添加 t 到依赖数组



  return (
    <BaseCard
      title={title || t('cardTitles.time')}
      titleVisible={titleVisible}
      icon={mdiClockOutline}
    >
      <div className="time-content">
        <div className="time">
          {currentTime.format(timeFormat)}
        </div>
        <div className="date">
          {currentTime.format(dateFormat)}
          <span className="weekday">
            {weekday}
          </span>
        </div>
      </div>
    </BaseCard>
  );
}

export default TimeCard; 