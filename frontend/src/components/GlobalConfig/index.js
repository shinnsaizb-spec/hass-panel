import { useLanguage } from '../../i18n/LanguageContext';
import { configApi,systemApi,applyBackgroundToBody,notifyApi } from '../../utils/api';
import { Switch, message, Slider, Select, Spin } from 'antd';
import { useRef, useEffect, useState } from 'react';
import Icon from '@mdi/react';
import { mdiChevronDown, mdiChevronUp } from '@mdi/js';
import './style.css';

// 可折叠的设置模块：点标题展开/收起。
// ⚠️ 定义在组件外：若定义在 GlobalConfig 内部，每次渲染都会重建组件类型，
//    导致模块内的输入框在输入时被卸载重挂而失焦。
function Section({ title, collapsed, onToggle, children }) {
    return (
        <div className="global-config-section">
            <button type="button" className="global-config-section-title" onClick={onToggle}>
                <span>{title}</span>
                <Icon path={collapsed ? mdiChevronDown : mdiChevronUp} size={16} />
            </button>
            {!collapsed && <div className="global-config-section-body">{children}</div>}
        </div>
    );
}

function GlobalConfig({ setShowGlobalConfig }) {
    // 加载全局配置
    useEffect(() => {
        const loadGlobalConfig = async () => {
            try {
                const response = await configApi.getConfig();
                const config = response.data;
                if (config.globalConfig) {
                    setGlobalConfig(config.globalConfig);
                    // 背景（图片或视频）统一走公共实现
                    applyBackgroundToBody(config.globalConfig);
                }
            } catch (error) {
                console.error('加载全局配置失败:', error);
            }
        };
        loadGlobalConfig();
    }, []);

    const [globalConfig, setGlobalConfig] = useState({
        backgroundColor: '',
        backgroundImage: '',
        darkModeBackgroundImage: '',
        // 下拉面板：尺寸 / 毛玻璃 / 透明度
        drawerWidth: '',
        drawerHeight: '',
        drawerTriggerWidth: '',
        drawerTriggerColor: '',
        drawerTriggerOpacity: '',
        drawerOpacity: '',
        drawerBlur: '',
        // 卡片背景统一透明度
        cardOpacity: '',
        // 卡片标题：高度 / 字号（收缩放大卡片不影响标题）
        cardTitleHeight: '',
        cardTitleFontSize: '',
        // 通知弹窗位置（旧的四角枚举；设了 notifyX/notifyY 后以坐标为准）
        notifyPosition: 'top-right',
        // 通知：时长 / 大小 / 坐标（拖动生成）/ 保留条数 / 图片
        notifyDuration: '',
        notifyWidth: '',
        notifyHeight: '',
        notifyX: '',
        notifyY: '',
        notifyRecentLimit: '',
        notifyHistoryLimit: '',
        notifyImageMaxSize: '',
        notifyImageTimeout: '',
        notifySaveImages: false,
        // 高德地图 Key（Web端 JS API）；留空则地图卡片提示未配置
        amapKey: ''
    });

    // webhook 信息（地址 + 令牌），登录后拉取，用于复制 / 发送测试通知
    const [webhookInfo, setWebhookInfo] = useState(null);
    const [sendingTest, setSendingTest] = useState(false);
    const [webhookError, setWebhookError] = useState('');
    const [loadingWebhook, setLoadingWebhook] = useState(true);
    // 保存中：按钮转圈并禁用，避免连点
    const [saving, setSaving] = useState(false);
    // 各设置模块默认折叠
    const [collapsed, setCollapsed] = useState({
        background: true,
        drawer: true,
        cardOpacity: true,
        cardTitle: true,
        notify: true,
        map: true,
    });
    const toggleSection = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

    useEffect(() => {
        const loadWebhookInfo = async () => {
            setLoadingWebhook(true);
            setWebhookError('');
            try {
                const resp = await notifyApi.getInfo();
                if (resp.code === 200) {
                    setWebhookInfo(resp.data);
                } else {
                    setWebhookError(resp.error || resp.message || '获取 webhook 信息失败');
                }
            } catch (e) {
                // 最常见原因：后端没有重启，/api/notify 路由尚未加载，导致 404。
                console.error('加载 webhook 信息失败:', e);
                const detail = e?.response?.data?.error || e?.response?.data?.message || e?.message || '';
                setWebhookError(
                    '获取 webhook 地址失败' +
                    (detail ? `（${detail}）` : '') +
                    '，请确认后端已重启（notify 路由需要重新加载）'
                );
            } finally {
                setLoadingWebhook(false);
            }
        };
        loadWebhookInfo();
    }, []);

    // 保存全局配置
    const handleSaveGlobalConfig = async () => {
        try {
            setSaving(true);
            await configApi.setGlobalConfig(globalConfig);
            setShowGlobalConfig(false);
        } catch (error) {
            console.error('保存全局配置失败:', error);
            message.error(t('config.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const { t } = useLanguage();
    const fileInputRef = useRef(null);
    const darkModeFileInputRef = useRef(null);

    return (
        <>
            <div className="global-config-modal-overlay" onClick={() => setShowGlobalConfig(false)} />
            <div className="global-config-modal">
                {/* 标题固定在顶部，不随设置内容滚动 */}
                <div className="global-config-modal-header">
                    <h3>{t('config.globalConfig')}</h3>
                </div>
                {/* 只有中间这一段会滚动 */}
                <div className="global-config-modal-body">
                    <div className="global-config-form">

                    <Section title={t('config.sectionBackground')} collapsed={collapsed.background} onToggle={() => toggleSection('background')}>

                    <div className="global-config-form-item">
                        <label>{t('config.backgroundImage')}</label>
                        <div className="image-input-group">
                            <input
                                type="text"
                                value={globalConfig.backgroundImage}
                                onChange={(e) => setGlobalConfig({
                                    ...globalConfig,
                                    backgroundImage: e.target.value
                                })}
                                placeholder={t('config.backgroundImagePlaceholder')}
                            />
                            <input
                                type="file"
                                accept="image/*,video/mp4,video/webm,video/quicktime"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const filePath = await configApi.uploadBackground(file);
                                        setGlobalConfig({
                                            ...globalConfig,
                                            backgroundImage: filePath
                                        });
                                    }
                                }}
                                ref={fileInputRef}
                            />
                            <button
                                className="upload-button"
                                onClick={() => fileInputRef.current.click()}
                            >
                                {t('fields.upload')}
                            </button>
                            <button
                                className="reset-button"
                                onClick={() => setGlobalConfig({
                                    ...globalConfig,
                                    backgroundImage: ''
                                })}
                            >
                                {t('config.reset')}
                            </button>
                        </div>
                    </div>
                    
                    <div className="global-config-form-item">
                        <label>{t('config.darkModeBackgroundImage')}</label>
                        <div className="image-input-group">
                            <input
                                type="text"
                                value={globalConfig.darkModeBackgroundImage}
                                onChange={(e) => setGlobalConfig({
                                    ...globalConfig,
                                    darkModeBackgroundImage: e.target.value
                                })}
                                placeholder={t('config.darkModeBackgroundImagePlaceholder')}
                            />
                            <input
                                type="file"
                                accept="image/*,video/mp4,video/webm,video/quicktime"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const filePath = await configApi.uploadImage(file);
                                        setGlobalConfig({
                                            ...globalConfig,
                                            darkModeBackgroundImage: filePath.file_path
                                        });
                                    }
                                }}
                                ref={(el) => (darkModeFileInputRef.current = el)}
                            />
                            <button
                                className="upload-button"
                                onClick={() => darkModeFileInputRef.current.click()}
                            >
                                {t('fields.upload')}
                            </button>
                            <button
                                className="reset-button"
                                onClick={() => setGlobalConfig({
                                    ...globalConfig,
                                    darkModeBackgroundImage: ''
                                })}
                            >
                                {t('config.reset')}
                            </button>
                        </div>
                    </div>
                    
                  
                    

                    </Section>

                    {/* 下拉面板 */}
                    <Section title={t('config.drawerSettings')} collapsed={collapsed.drawer} onToggle={() => toggleSection('drawer')}>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerWidth')}</label>
                        <input
                            type="number"
                            min="10"
                            max="100"
                            value={globalConfig.drawerWidth}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, drawerWidth: e.target.value })}
                            placeholder="100"
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerHeight')}</label>
                        <input
                            type="number"
                            min="10"
                            max="100"
                            value={globalConfig.drawerHeight}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, drawerHeight: e.target.value })}
                            placeholder="85"
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerLeft')}</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={globalConfig.drawerLeft}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, drawerLeft: e.target.value })}
                            placeholder="0（自动居中）"
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerTriggerWidth')}</label>
                        <input
                            type="number"
                            min="40"
                            max="600"
                            value={globalConfig.drawerTriggerWidth}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, drawerTriggerWidth: e.target.value })}
                            placeholder="160"
                        />
                        <div className="hint">{t('config.drawerTriggerWidthHint')}</div>
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerTriggerColor')}</label>
                        <input
                            type="color"
                            value={globalConfig.drawerTriggerColor || '#546E7A'}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, drawerTriggerColor: e.target.value })}
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerTriggerOpacity')}：{globalConfig.drawerTriggerOpacity === '' || globalConfig.drawerTriggerOpacity == null ? '0.3' : Number(globalConfig.drawerTriggerOpacity).toFixed(2)}</label>
                        <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={globalConfig.drawerTriggerOpacity === '' || globalConfig.drawerTriggerOpacity == null ? 0.3 : Number(globalConfig.drawerTriggerOpacity)}
                            onChange={(v) => setGlobalConfig({ ...globalConfig, drawerTriggerOpacity: v })}
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerBlur')}</label>
                        <input
                            type="number"
                            min="0"
                            max="40"
                            value={globalConfig.drawerBlur}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, drawerBlur: e.target.value })}
                            placeholder="12"
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.drawerOpacity')}：{globalConfig.drawerOpacity === '' || globalConfig.drawerOpacity == null ? '0.6' : globalConfig.drawerOpacity}</label>
                        <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={globalConfig.drawerOpacity === '' || globalConfig.drawerOpacity == null ? 0.6 : Number(globalConfig.drawerOpacity)}
                            onChange={(v) => setGlobalConfig({ ...globalConfig, drawerOpacity: v })}
                        />
                    </div>

                    </Section>

                    {/* 卡片背景透明度 */}
                    <Section title={t('config.cardOpacityTitle')} collapsed={collapsed.cardOpacity} onToggle={() => toggleSection('cardOpacity')}>

                    <div className="global-config-form-item">
                        <label>{t('config.cardOpacity')}：{globalConfig.cardOpacity === '' || globalConfig.cardOpacity == null ? '1' : globalConfig.cardOpacity}</label>
                        <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={globalConfig.cardOpacity === '' || globalConfig.cardOpacity == null ? 1 : Number(globalConfig.cardOpacity)}
                            onChange={(v) => setGlobalConfig({ ...globalConfig, cardOpacity: v })}
                        />
                        <div className="hint">{t('config.cardOpacityHint')}</div>
                    </div>

                    </Section>

                    {/* 卡片标题 */}
                    <Section title={t('config.cardTitleTitle')} collapsed={collapsed.cardTitle} onToggle={() => toggleSection('cardTitle')}>

                    <div className="global-config-form-item">
                        <label>{t('config.cardTitleHeight')}</label>
                        <input
                            type="number"
                            min="0"
                            max="200"
                            value={globalConfig.cardTitleHeight}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, cardTitleHeight: e.target.value })}
                            placeholder="54"
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.cardTitleFontSize')}</label>
                        <input
                            type="number"
                            min="8"
                            max="48"
                            value={globalConfig.cardTitleFontSize}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, cardTitleFontSize: e.target.value })}
                            placeholder="18"
                        />
                    </div>
                    <div className="hint">{t('config.cardTitleHint')}</div>

                    </Section>

                    {/* 消息通知 */}
                    <Section title={t('config.notifySettings')} collapsed={collapsed.notify} onToggle={() => toggleSection('notify')}>

                    <div className="global-config-form-item">
                        <label>{t('config.notifyPosition')}</label>
                        <Select
                            value={globalConfig.notifyPosition || 'top-right'}
                            onChange={(v) => setGlobalConfig({ ...globalConfig, notifyPosition: v })}
                            style={{ width: '100%' }}
                            options={[
                                { value: 'top-right', label: t('config.positionTopRight') },
                                { value: 'top-left', label: t('config.positionTopLeft') },
                                { value: 'bottom-right', label: t('config.positionBottomRight') },
                                { value: 'bottom-left', label: t('config.positionBottomLeft') },
                            ]}
                        />
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.notifyDuration')}</label>
                        <input
                            type="number"
                            min="0"
                            max="600"
                            value={globalConfig.notifyDuration}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, notifyDuration: e.target.value })}
                            placeholder="8"
                        />
                        <div className="hint">{t('config.notifyDurationHint')}</div>
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.notifySize')}</label>
                        <div className="image-input-group">
                            <input
                                type="number"
                                min="5"
                                max="100"
                                value={globalConfig.notifyWidth}
                                onChange={(e) => setGlobalConfig({ ...globalConfig, notifyWidth: e.target.value })}
                                placeholder={t('config.notifyWidthPh')}
                            />
                            <input
                                type="number"
                                min="5"
                                max="100"
                                value={globalConfig.notifyHeight}
                                onChange={(e) => setGlobalConfig({ ...globalConfig, notifyHeight: e.target.value })}
                                placeholder={t('config.notifyHeightPh')}
                            />
                        </div>
                        <div className="hint">{t('config.notifyDragHint')}</div>
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.notifyLimits')}</label>
                        <div className="image-input-group">
                            <input
                                type="number"
                                min="1"
                                max="5000"
                                value={globalConfig.notifyRecentLimit}
                                onChange={(e) => setGlobalConfig({ ...globalConfig, notifyRecentLimit: e.target.value })}
                                placeholder={t('config.notifyRecentLimitPh')}
                            />
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                value={globalConfig.notifyHistoryLimit}
                                onChange={(e) => setGlobalConfig({ ...globalConfig, notifyHistoryLimit: e.target.value })}
                                placeholder={t('config.notifyHistoryLimitPh')}
                            />
                        </div>
                        <div className="hint">{t('config.notifyLimitsHint')}</div>
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.notifyImageLimits')}</label>
                        <div className="image-input-group">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={globalConfig.notifyImageMaxSize}
                                onChange={(e) => setGlobalConfig({ ...globalConfig, notifyImageMaxSize: e.target.value })}
                                placeholder={t('config.notifyImageMaxSizePh')}
                            />
                            <input
                                type="number"
                                min="1"
                                max="120"
                                value={globalConfig.notifyImageTimeout}
                                onChange={(e) => setGlobalConfig({ ...globalConfig, notifyImageTimeout: e.target.value })}
                                placeholder={t('config.notifyImageTimeoutPh')}
                            />
                        </div>
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.notifySaveImages')}</label>
                        <div className="switch-group">
                            <Switch
                                checked={!!globalConfig.notifySaveImages}
                                onChange={(checked) => setGlobalConfig({ ...globalConfig, notifySaveImages: checked })}
                            />
                        </div>
                        <div className="hint">{t('config.notifySaveImagesHint')}</div>
                    </div>

                    <div className="global-config-form-item">
                        <label>{t('config.webhookUrl')}</label>
                        <div className="image-input-group">
                            <input
                                type="text"
                                readOnly
                                value={webhookInfo ? webhookInfo.full_url : ''}
                                placeholder={webhookError ? webhookError : (loadingWebhook ? t('config.loading') : '')}
                            />
                            <button
                                className="upload-button"
                                disabled={!webhookInfo}
                                onClick={() => {
                                    if (webhookInfo) {
                                        navigator.clipboard?.writeText(webhookInfo.full_url);
                                        message.success(t('config.copied'));
                                    }
                                }}
                            >
                                {t('config.copy')}
                            </button>
                        </div>
                        <div className={`hint${webhookError ? ' webhook-error' : ''}`}>{webhookError || t('config.webhookHint')}</div>
                    </div>

                    <div className="global-config-form-item">
                        <button
                            className="reset-button"
                            disabled={!webhookInfo || sendingTest}
                            onClick={async () => {
                                try {
                                    setSendingTest(true);
                                    const resp = await notifyApi.sendTest(
                                        webhookInfo.token,
                                        t('config.testTitle'),
                                        t('config.testMessage')
                                    );
                                    if (resp.code === 200) message.success(t('config.testSuccess'));
                                    else message.error(t('config.testFailed'));
                                } catch (e) {
                                    message.error(t('config.testFailed'));
                                } finally {
                                    setSendingTest(false);
                                }
                            }}
                        >
                            {sendingTest ? t('config.sending') : t('config.sendTest')}
                        </button>
                    </div>

                    </Section>

                    {/* 地图 */}
                    <Section title={t('config.sectionMap')} collapsed={collapsed.map} onToggle={() => toggleSection('map')}>

                    <div className="global-config-form-item">
                        <label>{t('config.amapKey')}</label>
                        <input
                            type="text"
                            value={globalConfig.amapKey}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, amapKey: e.target.value })}
                            placeholder="Web端(JS API) Key"
                        />
                        <div className="hint">{t('config.amapKeyHint')}</div>
                    </div>

                    </Section>
                    </div>
                    </div>

                    {/* 底部按钮固定在下面，不随设置内容滚动 */}
                    <div className="global-config-modal-footer">
                    <div className="global-config-actions">
                        <button
                            className="reset-all"
                            onClick={() => {
                                setGlobalConfig({
                                    backgroundColor: '',
                                    backgroundImage: '',
                                    darkModeBackgroundImage: '',
                                    drawerWidth: '',
                                    drawerHeight: '',
                                    drawerTriggerWidth: '',
                                    drawerTriggerColor: '',
                                    drawerTriggerOpacity: '',
                                    drawerOpacity: '',
                                    drawerBlur: '',
                                    cardOpacity: '',
                                    cardTitleHeight: '',
                                    cardTitleFontSize: '',
                                    notifyPosition: 'top-right',
                                    notifyDuration: '',
                                    notifyWidth: '',
                                    notifyHeight: '',
                                    notifyX: '',
                                    notifyY: '',
                                    notifyRecentLimit: '',
                                    notifyHistoryLimit: '',
                                    notifyImageMaxSize: '',
                                    notifyImageTimeout: '',
                                    notifySaveImages: false,
                                    amapKey: ''
                                });
                            }}
                        >
                            {t('config.resetAll')}
                        </button>
                        <button
                            className="reinitialize"
                            onClick={async () => {
                                const result = await systemApi.reinitialize();
                                if (result.code === 200) {
                                    message.success(t('config.reinitializeSuccess'));
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 1000);
                                } else {
                                    message.error(t('config.reinitializeFailed'));
                                }
                            }}
                        >
                            {t('config.reinitialize')}
                        </button>
                        <button className="cancel" onClick={() => setShowGlobalConfig(false)}>
                            {t('config.cancel')}
                        </button>
                        <button className="save" onClick={handleSaveGlobalConfig} disabled={saving}>
                            {saving ? (
                                <>
                                    <Spin size="small" />
                                    {t('config.saving')}
                                </>
                            ) : (
                                t('config.save')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default GlobalConfig;
