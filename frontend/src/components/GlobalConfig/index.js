import { useLanguage } from '../../i18n/LanguageContext';
import { configApi,systemApi,applyBackgroundToBody,notifyApi } from '../../utils/api';
import AttachmentManagerModal from '../AttachmentManagerModal';
import { Switch, message, Slider, Select, Spin } from 'antd';
import { useRef, useEffect, useState } from 'react';
import Icon from '@mdi/react';
import { mdiChevronDown, mdiChevronUp, mdiCheck } from '@mdi/js';
import {
    attachLiquidGlass,
    applyCardStyle,
    readParams,
    supportsRefraction,
    LG_DEFAULTS,
} from '../../theme/liquid-glass-refraction';
import './style.css';

/** 卡片风格可选项（值写到 globalConfig.cardStyle，引擎据此设 body[data-card-style]）。 */
const CARD_STYLE_OPTIONS = [
    { id: 'liquid', labelKey: 'config.cardStyleLiquid', descKey: 'config.cardStyleLiquidDesc' },
    { id: 'frosted', labelKey: 'config.cardStyleFrosted', descKey: 'config.cardStyleFrostedDesc' },
    { id: 'clear', labelKey: 'config.cardStyleClear', descKey: 'config.cardStyleClearDesc' },
    { id: 'solid', labelKey: 'config.cardStyleSolid', descKey: 'config.cardStyleSolidDesc' },
];

/** 液态玻璃的每个可调参数：范围 / 步长 / 默认值 / 单位。 */
const LG_FIELDS = [
    { key: 'lgBlur', min: 0, max: 40, step: 1, def: LG_DEFAULTS.blur, unit: 'px' },
    { key: 'lgScaleRatio', min: 0, max: 3, step: 0.05, def: LG_DEFAULTS.scaleRatio, unit: '×' },
    { key: 'lgGlassThickness', min: 0, max: 400, step: 5, def: LG_DEFAULTS.glassThickness, unit: 'px' },
    { key: 'lgBezelWidth', min: 1, max: 80, step: 1, def: LG_DEFAULTS.bezelWidth, unit: 'px' },
    { key: 'lgRefractiveIndex', min: 1.01, max: 2.5, step: 0.01, def: LG_DEFAULTS.refractiveIndex, unit: '' },
    { key: 'lgSpecularOpacity', min: 0, max: 1, step: 0.05, def: LG_DEFAULTS.specularOpacity, unit: '' },
    { key: 'lgSpecularSaturation', min: 1, max: 12, step: 0.5, def: LG_DEFAULTS.specularSaturation, unit: '' },
    // 背景不透明度：所有风格都有（毛玻璃 / 通透 / 实色 的参数区也用它）
    { key: 'lgOpacity', min: 0, max: 1, step: 0.05, def: LG_DEFAULTS.opacity, unit: '' },
];

/** 按 key 取字段定义，方便在「非液态玻璃」的参数区复用同两个滑块。 */
const fieldByKey = (key) => LG_FIELDS.find((f) => f.key === key);

/** 下拉面板自己的两个参数（面板毛玻璃 / 背景透明度）。 */
const DRAWER_FIELDS = [
    { key: 'drawerOpacity', min: 0, max: 1, step: 0.05, def: 0.6, unit: '' },
    { key: 'drawerBlur', min: 0, max: 60, step: 1, def: 12, unit: 'px' },
];

/** 带数值显示的滑块。定义在组件外，避免每次渲染重建组件类型导致失焦。 */
function LgSlider({ label, hint, field, value, onChange }) {
    const raw = value === '' || value === null || value === undefined ? field.def : Number(value);
    const v = Number.isFinite(raw) ? raw : field.def;
    return (
        <div className="global-config-form-item">
            <label>
                {label}
                <span className="lg-param-value">
                    {Math.round(v * 100) / 100}
                    {field.unit}
                </span>
            </label>
            <Slider
                min={field.min}
                max={field.max}
                step={field.step}
                value={v}
                onChange={(n) => onChange(n)}
                tooltip={{ open: false }}
            />
            {hint && <div className="hint">{hint}</div>}
        </div>
    );
}

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
    // 已保存配置的快照：关闭/取消时用来还原「实时预览」的改动
    const savedConfigRef = useRef(null);

    // 加载全局配置
    useEffect(() => {
        const loadGlobalConfig = async () => {
            try {
                const response = await configApi.getConfig();
                const config = response.data;
                if (config.globalConfig) {
                    setGlobalConfig(config.globalConfig);
                    savedConfigRef.current = config.globalConfig;
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
        // 卡片悬停水波特效（较耗性能，可关）
        cardRipple: true,
        // 卡片标题：高度 / 字号（收缩放大卡片不影响标题）
        cardTitleHeight: '',
        cardTitleFontSize: '',
        // 通知总开关：关闭后前端不建立 SSE 连接、后端也不接收 webhook
        notifyEnabled: true,
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
        amapKey: '',
        // 液态玻璃（卡片边缘真实折射）：见 theme/liquid-glass-refraction.js
        cardStyle: 'liquid',
        lgEnabled: true,
        lgOpacity: '',
        lgBlur: '',
        lgScaleRatio: '',
        lgGlassThickness: '',
        lgBezelWidth: '',
        lgRefractiveIndex: '',
        lgSpecularOpacity: '',
        lgSpecularSaturation: ''
    });

    // 哪个背景字段正在「从附件选择」（null = 没开）
    const [pickerFor, setPickerFor] = useState(null);

    // 预览小窗：点「卡片风格」里的某个风格才弹出来（默认不显示）
    const [showPreview, setShowPreview] = useState(false);

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
        cardStyle: false,
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

    // 实时预览：弹窗里改动任何外观字段（卡片透明度 / 毛玻璃 / 标题…）立刻广播给
    // 主页与下拉屏，不用等点「保存」——否则用户拖完滑块看不到变化，会以为「改了没反应」。
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent('hasspanel:global-config-changed', { detail: globalConfig })
        );
    }, [globalConfig]);

    // 液态玻璃：弹窗里的小预览。拖滑块立刻重建滤镜，不用关掉弹窗去主页看。
    // 预览卡片的圆角和引擎里的 CARD_RADIUS 一致（20px）。
    const lgPreviewRef = useRef(null);
    const lgPreviewHandleRef = useRef(null);
    useEffect(() => {
        const target = lgPreviewRef.current;
        if (!target) {
            // 折叠起来了：预览元素不在 DOM 里，把旧滤镜清掉
            if (lgPreviewHandleRef.current) {
                lgPreviewHandleRef.current.destroy();
                lgPreviewHandleRef.current = null;
            }
            return;
        }
        const params = readParams(globalConfig);
        // ⚠️ 必须自己把卡片风格写到 <body data-card-style>：
        //    「全局配置」也常常是在**配置页**打开的，那时 Home 没挂载、折射引擎没跑，
        //    没有别人会去写这个属性 → 预览会一直停在旧风格、拉参数也没反应。
        applyCardStyle(params.style, params.blur, params.opacity);
        if (lgPreviewHandleRef.current) {
            lgPreviewHandleRef.current.update(params);
        } else {
            lgPreviewHandleRef.current = attachLiquidGlass(target, params);
        }
    }, [globalConfig, showPreview]);

    // 弹窗卸载时清理预览滤镜，避免留下孤立的 <svg><filter>
    useEffect(
        () => () => {
            if (lgPreviewHandleRef.current) {
                lgPreviewHandleRef.current.destroy();
                lgPreviewHandleRef.current = null;
            }
        },
        []
    );

    // 关闭（取消）时把「未保存的实时预览」还原成已保存的配置
    const closeModal = () => {
        if (savedConfigRef.current) {
            window.dispatchEvent(
                new CustomEvent('hasspanel:global-config-changed', { detail: savedConfigRef.current })
            );
            // 配置页没有引擎在听这个广播，这里补一次，避免「实时预览」的风格残留下来
            const p = readParams(savedConfigRef.current);
            applyCardStyle(p.style, p.blur, p.opacity);
        }
        setShowPreview(false);
        setShowGlobalConfig(false);
    };

    // 保存全局配置
    const handleSaveGlobalConfig = async () => {
        try {
            setSaving(true);
            await configApi.setGlobalConfig(globalConfig);
            savedConfigRef.current = globalConfig; // 保存成功 → 更新快照，关闭时不再还原
            setShowPreview(false);
            setShowGlobalConfig(false);
        } catch (error) {
            console.error('保存全局配置失败:', error);
            message.error(t('config.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const { t } = useLanguage();
    // 当前卡片风格（决定显示哪一组参数）
    const currentStyle = globalConfig.cardStyle || 'liquid';
    const currentStyleLabel = t(
        (CARD_STYLE_OPTIONS.find((o) => o.id === currentStyle) || CARD_STYLE_OPTIONS[0]).labelKey
    );
    const fileInputRef = useRef(null);
    const darkModeFileInputRef = useRef(null);

    return (
        <>
            <div className="global-config-modal-overlay" onClick={closeModal} />
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
                                className="upload-button"
                                onClick={() => setPickerFor('backgroundImage')}
                            >
                                {t('fields.pickAttachment')}
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

                    <p className="global-config-webm-hint">{t('config.backgroundWebmHint')}</p>

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
                                className="upload-button"
                                onClick={() => setPickerFor('darkModeBackgroundImage')}
                            >
                                {t('fields.pickAttachment')}
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

                    {/* 从「附件管理」里挑一个已上传的文件当背景 */}
                    <AttachmentManagerModal
                        open={pickerFor !== null}
                        onClose={() => setPickerFor(null)}
                        onPick={(it) => {
                            if (pickerFor) {
                                setGlobalConfig((c) => ({ ...c, [pickerFor]: it.url }));
                            }
                            setPickerFor(null);
                        }}
                    />

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

                    {/* 面板本身的毛玻璃 / 背景透明度（只作用于下拉面板，
                        里面卡片的外观走「卡片风格」那一套） */}
                    <LgSlider
                        label={t('config.drawerOpacity')}
                        hint={t('config.drawerOpacityHint')}
                        field={DRAWER_FIELDS[0]}
                        value={globalConfig.drawerOpacity}
                        onChange={(v) => setGlobalConfig({ ...globalConfig, drawerOpacity: v })}
                    />

                    <LgSlider
                        label={t('config.drawerBlur')}
                        hint={t('config.drawerBlurHint')}
                        field={DRAWER_FIELDS[1]}
                        value={globalConfig.drawerBlur}
                        onChange={(v) => setGlobalConfig({ ...globalConfig, drawerBlur: v })}
                    />

                    </Section>

                    {/* 卡片风格：点击切换 */}
                    <Section title={t('config.cardStyleTitle')} collapsed={collapsed.cardStyle} onToggle={() => toggleSection('cardStyle')}>

                    <div className="lg-style-options">
                        {CARD_STYLE_OPTIONS.map((o) => {
                            const active = (globalConfig.cardStyle || 'liquid') === o.id;
                            return (
                                <button
                                    key={o.id}
                                    type="button"
                                    className={`lg-style-option ${active ? 'active' : ''}`}
                                    onClick={() => {
                                        setGlobalConfig({ ...globalConfig, cardStyle: o.id });
                                        setShowPreview(true);
                                    }}
                                >
                                    <span className="lg-style-name">
                                        {active && <Icon path={mdiCheck} size={14} />}
                                        {t(o.labelKey)}
                                    </span>
                                    <span className="lg-style-desc">{t(o.descKey)}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="hint">{t('config.cardStyleHint')}</div>

                    {/* 下面直接就是「当前这个风格」的参数，不再单独开一个下拉分区 */}
                    <div className="lg-style-divider" />

                    {currentStyle === 'liquid' ? (
                        <>
                            <div className="hint">
                                {supportsRefraction() ? t('config.liquidGlassOnlyHint') : t('config.lgUnsupported')}
                            </div>
                            {LG_FIELDS.map((f) => (
                                <LgSlider
                                    key={f.key}
                                    label={t(`config.${f.key}`)}
                                    hint={t(`config.${f.key}Hint`)}
                                    field={f}
                                    value={globalConfig[f.key]}
                                    onChange={(n) => setGlobalConfig({ ...globalConfig, [f.key]: n })}
                                />
                            ))}
                        </>
                    ) : (
                        <>
                            {/* 实色不需要模糊，所以不给它模糊滑块 */}
                            {currentStyle !== 'solid' && (
                                <LgSlider
                                    label={t('config.lgBlur')}
                                    hint={t('config.styleBlurHint')}
                                    field={fieldByKey('lgBlur')}
                                    value={globalConfig.lgBlur}
                                    onChange={(n) => setGlobalConfig({ ...globalConfig, lgBlur: n })}
                                />
                            )}
                            <LgSlider
                                label={t('config.lgOpacity')}
                                hint={t('config.lgOpacityHint')}
                                field={fieldByKey('lgOpacity')}
                                value={globalConfig.lgOpacity}
                                onChange={(n) => setGlobalConfig({ ...globalConfig, lgOpacity: n })}
                            />
                        </>
                    )}

                    </Section>

                    {/* 卡片特效（「卡片背景透明度」滑块已移除 —— 统一走液态玻璃风格） */}
                    <Section title={t('config.cardEffectsTitle')} collapsed={collapsed.cardOpacity} onToggle={() => toggleSection('cardOpacity')}>

                    <div className="global-config-form-item">
                        <label>{t('config.cardRipple')}</label>
                        <div className="switch-group">
                            <Switch
                                checked={globalConfig.cardRipple !== false}
                                onChange={(checked) => setGlobalConfig({ ...globalConfig, cardRipple: checked })}
                            />
                        </div>
                        <div className="hint">{t('config.cardRippleHint')}</div>
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
                        <label>{t('config.notifyEnabled')}</label>
                        <div className="switch-group">
                            <Switch
                                checked={globalConfig.notifyEnabled !== false}
                                onChange={(checked) => setGlobalConfig({ ...globalConfig, notifyEnabled: checked })}
                            />
                        </div>
                        <div className="hint">{t('config.notifyEnabledHint')}</div>
                    </div>

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
                                    cardRipple: true,
                                    cardTitleHeight: '',
                                    cardTitleFontSize: '',
                                    notifyEnabled: true,
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
                                    amapKey: '',
                                    cardStyle: 'liquid',
                                    lgEnabled: true,
                                    lgOpacity: '',
                                    lgBlur: '',
                                    lgScaleRatio: '',
                                    lgGlassThickness: '',
                                    lgBezelWidth: '',
                                    lgRefractiveIndex: '',
                                    lgSpecularOpacity: '',
                                    lgSpecularSaturation: ''
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
                        <button className="cancel" onClick={closeModal}>
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

            {/* 预览小窗：点了「卡片风格」里的某个风格才弹出来，贴在弹窗右边。
                预览卡走的是和真实卡片同一套 CSS（`.react-grid-item > div, .lg-preview-card`），
                所以风格 / 模糊 / 透明度 / 折射改了都能立刻看出来。 */}
            {showPreview && (
                <aside className="lg-preview-window">
                    <div className="lg-preview-window-header">
                        <span>{t('config.lgPreviewHint')} · {currentStyleLabel}</span>
                        <button
                            type="button"
                            className="lg-preview-close"
                            title={t('config.cancel')}
                            onClick={() => setShowPreview(false)}
                        >
                            ×
                        </button>
                    </div>
                    <div className="lg-preview">
                        <div className="lg-preview-bg" />
                        <div className="lg-preview-card" ref={lgPreviewRef}>
                            {t('config.lgPreview')}
                        </div>
                    </div>
                </aside>
            )}
        </>
    );
}

export default GlobalConfig;
