import React from 'react';
import Icon from '@mdi/react';
import './style.css';
function BaseCard({ 
  title, 
  titleVisible,
  icon, 
  children, 
  className = '', 
  headerRight = null,
  style = {}
}) {
  // 隐藏标题栏时多一个类名：CSS 据此把卡片裁成四圆角（见 BaseCard/style.css）
  const noHeader = titleVisible === false;
  return (
    <div className={`base-card ${className}${noHeader ? ' base-card--no-header' : ''}`} style={style}>
      {titleVisible !== false && (
        <div className="card-header">
          <h3>
          {icon && (
            React.isValidElement(icon) ? 
              React.cloneElement(icon, { 
                style: { 
                  marginRight: '8px',
                  verticalAlign: 'bottom',
                }
              }) :
              <Icon 
                path={icon} 
                size={14} 
                style={{ marginRight: '8px', verticalAlign: 'bottom' }} 
              />
          )}
          {title}
        </h3>
        {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

export default BaseCard; 