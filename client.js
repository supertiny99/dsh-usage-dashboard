/**
 * dsh-usage-dashboard · Client 侧
 *
 * 在设置页注册「用量面板」：会话/turns/token 概览卡、token 按模型分组表、
 * 工具调用 Top5 条形，支持 今日/近7天/近30天 切换。
 * 数据全部来自 Host 的 /usage-dashboard/data 端点（只读本地 ~/.dsh）。
 */
window.__ModuleLoader__.load({
	id: '@supertiny99/dsh-usage-dashboard',
	factory(require) {
		const React = require('react');
const h = React.createElement;

/* ---------- 小工具 ---------- */

const api = {
	async call(path) {
		const res = await fetch('/usage-dashboard/' + path, {
			credentials: 'same-origin',
			headers: { 'content-type': 'application/json' },
		});
		const body = await res.json().catch(() => ({}));
		if (!res.ok || body.ok === false) {
			throw new Error(body.error || 'HTTP ' + res.status);
		}
		return body;
	},
};

/** token 数：M/K 缩写；普通计数：千分位 */
function fmtTok(n) {
	n = Number(n ?? 0);
	if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
	if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
	if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
	return String(n);
}
function fmt(n) {
	return Number(n ?? 0).toLocaleString('zh-CN');
}
function timeAgo(iso) {
	if (!iso) return '';
	const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
	if (sec < 90) return '刚刚';
	if (sec < 3600) return Math.round(sec / 60) + ' 分钟前';
	return Math.round(sec / 3600) + ' 小时前';
}

/* ---------- 展示组件 ---------- */

const cardStyle = {
	flex: '1 1 120px',
	minWidth: '120px',
	padding: '10px 14px',
	border: '1px solid var(--dsh-border, #8884)',
	borderRadius: '8px',
};
const numStyle = { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2 };
const labelStyle = { fontSize: '0.8rem', opacity: 0.7 };
const tdK = { padding: '6px 8px 6px 0', opacity: 0.9 };
const tdV = {
	padding: '6px 0',
	textAlign: 'right',
	fontVariantNumeric: 'tabular-nums',
	whiteSpace: 'nowrap',
};

const RANGES = [
	['today', '今日'],
	['7d', '近 7 天'],
	['30d', '近 30 天'],
];

function OverviewCards({ d }) {
	return h(
		'div',
		{ style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' } },
		h('div', { style: cardStyle },
			h('div', { style: numStyle }, fmt(d.sessions)),
			h('div', { style: labelStyle }, '会话 · ' + fmt(d.turns) + ' turns')),
		h('div', { style: cardStyle },
			h('div', { style: numStyle }, fmtTok(d.tokens.total)),
			h('div', { style: labelStyle }, 'token 合计')),
		h('div', { style: cardStyle },
			h('div', { style: numStyle }, fmtTok(d.tokens.output)),
			h('div', { style: labelStyle },
				'输出 ' + fmtTok(d.tokens.output) + ' · 输入 ' + fmtTok(d.tokens.input))),
		h('div', { style: cardStyle },
			h('div', { style: numStyle }, fmtTok(d.tokens.cacheRead)),
			h('div', { style: labelStyle }, '缓存读 · 写 ' + fmtTok(d.tokens.cacheWrite))),
	);
}

function ModelTable({ byModel }) {
	if (!byModel.length) return h('div', { style: labelStyle }, '窗口内没有会话');
	return h(
		'section',
		{ style: { marginBottom: '20px' } },
		h('h3', { style: { fontSize: '0.95rem', margin: '0 0 6px' } }, 'token 按模型分组'),
		h(
			'table',
			{ style: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' } },
			h(
				'thead',
				null,
				h('tr', { style: { opacity: 0.7 } },
					h('th', { style: { textAlign: 'left', padding: '4px 8px 4px 0' } }, '模型'),
					h('th', { style: { textAlign: 'right', padding: '4px 0' } }, '会话'),
					h('th', { style: { textAlign: 'right', padding: '4px 0' } }, '输入'),
					h('th', { style: { textAlign: 'right', padding: '4px 0' } }, '输出'),
					h('th', { style: { textAlign: 'right', padding: '4px 0' } }, '缓存读'),
					h('th', { style: { textAlign: 'right', padding: '4px 0' } }, '合计')),
			),
			h(
				'tbody',
				null,
				byModel.map((m, i) =>
					h(
						'tr',
						{ key: i, style: { borderBottom: '1px solid var(--dsh-border, #8883)' } },
						h('td', { style: tdK, title: (m.provider ?? '') + ' · ' + (m.model ?? '') }, m.model || 'unknown'),
						h('td', { style: tdV }, fmt(m.sessions)),
						h('td', { style: tdV }, fmtTok(m.input)),
						h('td', { style: tdV }, fmtTok(m.output)),
						h('td', { style: tdV }, fmtTok(m.cacheRead)),
						h('td', { style: tdV }, fmtTok(m.total)),
					),
				),
			),
		),
	);
}

/** 工具 Top5：纯 div 条形，无图表依赖 */
function ToolBars({ tools }) {
	if (!tools.length) return h('div', { style: labelStyle }, '窗口内没有工具调用记录');
	const max = tools[0].count;
	return h(
		'section',
		{ style: { marginBottom: '20px' } },
		h('h3', { style: { fontSize: '0.95rem', margin: '0 0 6px' } }, '工具调用 Top 5'),
		h(
			'div',
			null,
			tools.map((t) =>
				h('div', {
					key: t.name,
					title: t.name + ' × ' + fmt(t.count),
					style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
				},
					h('code', { style: { fontSize: '0.82rem', minWidth: '11em' } }, t.name),
					h('div', {
						style: {
							height: '10px',
							width: Math.max(2, (t.count / max) * 220) + 'px',
							background: 'var(--dsh-accent, #4a7dbc)',
							borderRadius: '2px',
							opacity: 0.85,
						},
					}),
					h('span', { style: { fontSize: '0.8rem', opacity: 0.8 } }, '×' + fmt(t.count)),
				),
			),
		),
	);
}

/* ---------- 主面板 ---------- */

function Panel() {
	const [range, setRange] = React.useState('7d');
	const [data, setData] = React.useState(null);
	const [error, setError] = React.useState(null);
	const [busy, setBusy] = React.useState(false);

	const load = React.useCallback((r) => {
		setBusy(true);
		api.call('data?range=' + r).then(
			(d) => {
				setData(d);
				setError(null);
			},
			(e) => setError(String(e.message || e)),
		).finally(() => setBusy(false));
	}, []);

	React.useEffect(() => {
		load(range);
	}, [range, load]);

	return h(
		'div',
		null,
		h(
			'div',
			{ style: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' } },
			h('h2', { style: { fontSize: '1.1rem', margin: 0 } }, '用量面板'),
			h(
				'div',
				{ style: { display: 'flex', gap: '6px' } },
				RANGES.map(([value, text]) =>
					h('button', {
						key: value,
						onClick: () => setRange(value),
						disabled: busy,
						style: {
							fontSize: '0.8rem',
							padding: '2px 10px',
							borderRadius: '999px',
							border: '1px solid var(--dsh-border, #8884)',
							background: range === value ? 'var(--dsh-accent, #4a7dbc)' : 'transparent',
							color: range === value ? '#fff' : 'inherit',
							cursor: 'pointer',
						},
					}, text),
				),
			),
			data && h('span', { style: labelStyle }, '更新于 ' + timeAgo(data.generatedAt)),
		),
		error && h('div', { style: { color: '#c2452e', margin: '10px 0' } }, '加载失败：' + error),
		data && h('div', null,
			h(OverviewCards, { d: data }),
			h(ModelTable, { byModel: data.byModel }),
			h(ToolBars, { tools: data.tools }),
			h('div', { style: labelStyle },
				'预设分布：'
					+ (data.byPreset.map((p) => p.preset + ' × ' + p.sessions).join(' · ') || '无')
					+ '（统计覆盖 ' + fmt(data.coverage.projectedSessions) + ' 个会话投影，窗口内 '
					+ fmt(data.coverage.inRange) + ' 个）'),
		),
		!data && !error && h('div', { style: labelStyle }, '加载中…'),
	);
}

/* ---------- 注册 ---------- */

		return {
			inject: ['slots'],
			apply(ctx) {
				ctx.slots.inject('settings.section', () =>
					ctx.slots.register(
						{ name: 'settings.section', id: 'usage-dashboard', order: 32, label: '用量面板' },
						Panel,
					),
				);
			},
		};
	},
});
