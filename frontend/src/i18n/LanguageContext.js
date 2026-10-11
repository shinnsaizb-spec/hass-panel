import React, { createContext, useState, useContext } from 'react';
import { zh } from './zh';
import { en } from './en';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'zh';
  });

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  /**
   * 取文案。可选插值：`t('a.b', { n: 3 })` 会把文案里的 `{n}` 替换掉。
   *
   * ⚠️ **不传 params 时原样返回**，所以老的调用点行为完全不变
   *    （全仓库扫过：`useLanguage().t` 没有任何调用点传第二个参数；
   *      `neonplan3d/` 里的 `this.t(k, params)` 是上游编辑器自己的实现，不走这里）。
   */
  const t = (key, params) => {
    const keys = key.split('.');
    let value = language === 'zh' ? zh : en;
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value !== 'string') return value || key;
    if (!params || typeof params !== 'object') return value;
    return value.replace(/\{(\w+)\}/g, (whole, name) =>
      params[name] === undefined || params[name] === null ? whole : String(params[name])
    );
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}