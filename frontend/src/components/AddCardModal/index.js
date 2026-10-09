import React, { useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { useLanguage } from '../../i18n/LanguageContext';
import { getCardTranslationKey } from '../../utils/cardTranslation';
import { Input, Empty } from 'antd';
import './style.css';

function AddCardModal({ onClose, onSelect, cardTypes }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  // 显示名优先用卡片目录里的 name（内置卡片 = i18n；插件卡片 = manifest.name，
  // 且已被「插件管理 → 卡片显示名」的覆盖名替换过）。万一 name 缺失，再退回 cardTitles。
  const getDisplayName = (type, config) => {
    const fromName = config && config.name;
    if (fromName) return fromName;
    return t(`cardTitles.${getCardTranslationKey(type)}`);
  };

  // 过滤卡片类型：已禁用的不显示
  const filteredCardTypes = Object.entries(cardTypes).filter(([type, config]) => {
    if (config && config.disabled) return false;
    return getDisplayName(type, config).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('config.addCard')}</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            title={t('config.cancel')}
          >
            <Icon path={mdiClose} size={14} />
          </button>
        </div>
        
        <div className="search-container">
          <Input.Search
            placeholder={t('config.searchCards')}
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            allowClear
          />
        </div>
        
        <div className="card-types">
          {filteredCardTypes.length > 0 ? (
            filteredCardTypes.map(([type, config]) => {
              const displayName = getDisplayName(type, config);
              return (
                <button
                  key={type}
                  className="card-type-button"
                  onClick={() => onSelect(type)}
                  title={displayName}
                >
                  <Icon path={config.icon} size={14} />
                  <span>{displayName}</span>
                </button>
              );
            })
          ) : (
            <Empty 
              description={t('config.noCardsFound')} 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AddCardModal; 