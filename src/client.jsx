import React from 'react';
import * as P from '@deepseek-ai/dsh-client-ui-primitives';
import css from './style.css';
import { filterSessions } from './client-model.js';

const PANEL_ID = 'usage-dashboard';
const RANGES = [
	['today', '今日'],
	['7d', '近 7 天'],
	['30d', '近 30 天'],
];
const BUCKETS = [
	['input', '未缓存输入'],
	['output', '输出'],
	['cacheRead', '缓存读'],
	['cacheWrite', '缓存写'],
];
const full = (value) => Number(value ?? 0).toLocaleString('zh-CN');
const compact = (value) =>
	new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(
		value ?? 0
	);
const percent = (value) => (value == null ? '—' : `${(value * 100).toFixed(1)}%`);
const dateTime = (value) =>
	new Date(value).toLocaleString('zh-CN', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
const Button = P.Button ?? ((props) => <button type="button" {...props} />);
const Input = P.Input ?? ((props) => <input {...props} />);

function Amount({ value }) {
	return <span title={`${full(value)} token`}>{compact(value)}</span>;
}

function PanelIcon({ size = 20 }) {
	return (
		<span
			aria-hidden="true"
			style={{
				width: size,
				height: size,
				display: 'inline-flex',
				alignItems: 'flex-end',
				justifyContent: 'center',
				gap: 2,
				padding: 3,
			}}
		>
			{[55, 100, 75].map((height, index) => (
				<i
					key={index}
					style={{ width: 3, height: `${height}%`, borderRadius: 1, background: 'currentColor' }}
				/>
			))}
		</span>
	);
}

function Metric({ label, value, detail }) {
	return (
		<div className="ud-metric">
			<span>{label}</span>
			<strong>{value}</strong>
			<small>{detail}</small>
		</div>
	);
}

function Trend({ days, selected, onSelect }) {
	const maximum = Math.max(1, ...days.map((day) => day.total));
	return (
		<section className="ud-card ud-trend">
			<div className="ud-section-head">
				<h2>每日用量</h2>
				<span>点击日期查看会话</span>
			</div>
			<div className="ud-legend">
				{BUCKETS.map(([key, label]) => (
					<span key={key}>
						<i className={`ud-swatch ud-${key}`} />
						{label}
					</span>
				))}
			</div>
			<div className="ud-chart" role="group" aria-label="每日 token 用量">
				{days.map((day, index) => (
					<button
						type="button"
						key={day.date}
						className={`ud-day ${selected === day.date ? 'is-selected' : ''}`}
						aria-pressed={selected === day.date}
						onClick={() => onSelect(selected === day.date ? '' : day.date)}
						aria-label={`${day.date}，${full(day.total)} token，${day.sessions} 个会话`}
						title={`${day.date}\n${BUCKETS.map(([key, label]) => `${label} ${full(day[key])}`).join('\n')}\n${day.sessions} 个会话`}
					>
						<span className="ud-bar-track">
							<span className="ud-stack" style={{ height: `${(day.total / maximum) * 100}%` }}>
								{BUCKETS.map(([key]) => (
									<i key={key} className={`ud-${key}`} style={{ flexGrow: day[key] }} />
								))}
							</span>
						</span>
						<span className="ud-day-label">
							{days.length <= 7 || index % 5 === 0 || index === days.length - 1
								? day.date.slice(5).replace('-', '/')
								: '\u00a0'}
						</span>
					</button>
				))}
			</div>
			<div className="ud-chart-foot">
				<span>
					每日最高 <Amount value={maximum === 1 && days.every((day) => !day.total) ? 0 : maximum} />
				</span>
				<span>按本地日期 · 已报告 token</span>
			</div>
		</section>
	);
}

function Rankings({ title, groups, selected, onSelect, model = false }) {
	const total = groups.reduce((sum, group) => sum + group.total, 0);
	return (
		<section className="ud-card ud-ranking">
			<div className="ud-section-head">
				<h2>{title}</h2>
				<span>
					{groups.length} {model ? '个模型路由' : '个项目'}
				</span>
			</div>
			{groups.length === 0 ? (
				<p className="ud-empty">当前窗口暂无用量</p>
			) : (
				<div className="ud-ranking-list">
					{groups.map((group) => (
						<button
							type="button"
							key={group.key}
							className={`ud-rank ${selected === group.key ? 'is-selected' : ''}`}
							onClick={() => onSelect(selected === group.key ? '' : group.key)}
							aria-pressed={selected === group.key}
							title={model ? `${group.provider} / ${group.model}` : group.cwd || '未归属项目'}
						>
							<span className="ud-rank-info">
								<strong>{model ? group.model : group.name}</strong>
								<small>{model ? group.provider : group.cwd || '未归属项目'}</small>
							</span>
							<span className="ud-rank-number">
								<Amount value={group.total} />
								<small>{percent(total > 0 ? group.total / total : 0)}</small>
							</span>
							<span className="ud-rank-track">
								<i style={{ width: `${total > 0 ? (group.total / total) * 100 : 0}%` }} />
							</span>
						</button>
					))}
				</div>
			)}
		</section>
	);
}

function SessionTable({ sessions }) {
	const detailId = React.useId();
	const [expanded, setExpanded] = React.useState('');
	const [page, setPage] = React.useState(0);
	React.useEffect(() => {
		setPage(0);
		setExpanded('');
	}, [sessions]);
	const safePage = Math.min(page, Math.max(0, Math.ceil(sessions.length / 20) - 1));
	const visible = sessions.slice(safePage * 20, (safePage + 1) * 20);
	return (
		<>
			<div className="ud-table-scroll">
				<table className="ud-table">
					<thead>
						<tr>
							<th>会话 / 项目</th>
							<th>模型</th>
							<th>所选范围 token</th>
							<th>最近活动</th>
						</tr>
					</thead>
					<tbody>
						{visible.map((session) => (
							<React.Fragment key={session.id}>
								<tr>
									<td>
										<button
											type="button"
											className="ud-session-toggle"
											aria-expanded={expanded === session.id}
											aria-controls={`${detailId}-${session.id}`}
											onClick={() => setExpanded(expanded === session.id ? '' : session.id)}
										>
											<span className="ud-chevron" aria-hidden="true">
												{expanded === session.id ? '−' : '+'}
											</span>
											<span>
												<strong>{session.title}</strong>
												<small title={session.cwd}>{session.projectName}</small>
											</span>
										</button>
									</td>
									<td>
										<span className="ud-model-name">{session.matchingModels[0]?.model ?? '—'}</span>
										<small>
											{session.matchingModels.length > 1
												? `共 ${session.matchingModels.length} 个模型路由`
												: session.matchingModels[0]?.provider}
										</small>
									</td>
									<td className="ud-numeric">
										<Amount value={session.total} />
									</td>
									<td className="ud-time">{dateTime(session.lastActivityAt)}</td>
								</tr>
								{expanded === session.id && (
									<tr id={`${detailId}-${session.id}`} className="ud-detail">
										<td colSpan="4">
											<div className="ud-detail-buckets">
												{BUCKETS.map(([key, label]) => (
													<div key={key}>
														<span>{label}</span>
														<strong>{full(session[key])}</strong>
													</div>
												))}
											</div>
											<div className="ud-detail-models">
												{session.matchingModels.map((model) => (
													<span key={model.key}>
														{model.provider} / {model.model}
														<strong>{full(model.total)}</strong>
													</span>
												))}
											</div>
											<small className="ud-session-id">
												{session.cwd || '未归属项目'} · {session.id}
											</small>
										</td>
									</tr>
								)}
							</React.Fragment>
						))}
					</tbody>
				</table>
			</div>
			{sessions.length === 0 && <p className="ud-empty">没有符合筛选条件的会话</p>}
			{sessions.length > 20 && (
				<div className="ud-pagination">
					<span>
						{safePage * 20 + 1}–{Math.min((safePage + 1) * 20, sessions.length)} / {sessions.length}
					</span>
					<Button size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
						上一页
					</Button>
					<Button
						size="sm"
						disabled={(safePage + 1) * 20 >= sessions.length}
						onClick={() => setPage(safePage + 1)}
					>
						下一页
					</Button>
				</div>
			)}
		</>
	);
}

function Coverage({ data }) {
	const coverage = data.coverage;
	const issues = [
		['missingLogs', '缺失日志'],
		['unreadableLogs', '不可读日志'],
		['invalidProjections', '异常投影'],
		['malformedLines', '损坏事件行'],
		['missingTime', '缺失时间'],
		['invalidUsage', '无效用量'],
		['missingUsage', '结算未报告用量'],
		['ambiguousSeed', '继承边界未知'],
		['directoryErrors', '不可读目录'],
		['incompleteRecords', '缓存桶未完整报告'],
		['unknownModelRecords', '模型归属不完整'],
	].filter(([key]) => coverage[key] > 0);
	return (
		<details className="ud-coverage">
			<summary>
				数据覆盖 {coverage.indexedSessions} / {coverage.discoveredSessions} 个会话
				{issues.length > 0 ? ` · ${issues.length} 类待核验项` : ' · 已完成读取'}
			</summary>
			<p>
				统计来自本机保留的事件日志，按结算时间归属。分叉继承的历史已排除。缺失或无法归属的记录计入下方诊断。
			</p>
			{issues.length > 0 && (
				<ul>
					{issues.map(([key, label]) => (
						<li key={key}>
							{label}
							<strong>{full(coverage[key])}</strong>
						</li>
					))}
				</ul>
			)}
			<p>
				缓存命中率只使用缓存桶已知的请求，按 token 加权。当前窗口有 {coverage.incompleteRecords}{' '}
				条结算的缓存信息不完整。
			</p>
			<p>
				索引 {data.index.durationMs} ms · 复用 {data.index.reusedFiles} 个文件 · 本次解析{' '}
				{data.index.parsedFiles} 个文件
			</p>
		</details>
	);
}

function Workbench() {
	const [selection, setSelection] = React.useState(null);
	const [data, setData] = React.useState(null);
	const [busy, setBusy] = React.useState(false);
	const [error, setError] = React.useState('');
	const [day, setDay] = React.useState('');
	const [project, setProject] = React.useState('');
	const [model, setModel] = React.useState('');
	const [search, setSearch] = React.useState('');
	const [sort, setSort] = React.useState('total');
	const controller = React.useRef(null);
	const requestId = React.useRef(0);
	const lastLoad = React.useRef(0);
	const range = selection ?? data?.range ?? '7d';

	const load = React.useCallback(
		async (force = false) => {
			controller.current?.abort();
			const abort = new AbortController();
			controller.current = abort;
			const id = ++requestId.current;
			lastLoad.current = Date.now();
			setBusy(true);
			try {
				const query = new URLSearchParams();
				if (selection) query.set('range', selection);
				if (force) query.set('refresh', '1');
				const response = await fetch(`/usage-dashboard/data?${query}`, {
					credentials: 'same-origin',
					signal: abort.signal,
				});
				const body = await response.json();
				if (!response.ok || !body.ok || !body.tokens) throw new Error(body.error || '读取用量失败');
				if (id !== requestId.current || abort.signal.aborted) return;
				setData(body);
				setError('');
			} catch (failure) {
				if (failure.name !== 'AbortError' && id === requestId.current)
					setError(failure.message || '读取用量失败');
			} finally {
				if (id === requestId.current && !abort.signal.aborted) setBusy(false);
			}
		},
		[selection]
	);

	React.useEffect(() => {
		void load();
		const refresh = () => {
			if (!document.hidden && Date.now() - lastLoad.current > 5000) void load();
		};
		window.addEventListener('focus', refresh);
		document.addEventListener('visibilitychange', refresh);
		return () => {
			controller.current?.abort();
			window.removeEventListener('focus', refresh);
			document.removeEventListener('visibilitychange', refresh);
		};
	}, [load]);

	const sessions = React.useMemo(
		() => filterSessions(data?.sessionDetails ?? [], { day, project, model, search, sort }),
		[data, day, project, model, search, sort]
	);
	const reset = () => {
		setDay('');
		setProject('');
		setModel('');
		setSearch('');
	};
	const filtered = Boolean(day || project || model || search);
	const projectLabel = data?.projects.find((item) => item.key === project)?.name;
	const modelLabel = data?.byModel.find((item) => item.key === model)?.model;

	return (
		<div className="ud-root" aria-busy={busy}>
			<style>{css}</style>
			<header className="ud-header">
				<div>
					<h1>用量</h1>
					<p>
						{data
							? `${dateTime(data.sinceMs).split(' ')[0]} — ${dateTime(data.untilMs).split(' ')[0]} · 本机活动`
							: '本机会话用量分析'}
					</p>
				</div>
				<div className="ud-actions">
					<div className="ud-ranges" role="group" aria-label="时间范围">
						{RANGES.map(([value, label]) => (
							<Button
								key={value}
								size="sm"
								variant={range === value ? 'primary' : 'ghost'}
								aria-pressed={range === value}
								onClick={() => {
									reset();
									setSelection(value);
								}}
							>
								{label}
							</Button>
						))}
					</div>
					<Button variant="outline" size="sm" disabled={busy} onClick={() => load(true)}>
						{busy ? '读取中…' : '刷新'}
					</Button>
				</div>
			</header>
			{error && (
				<div className="ud-error" role="alert">
					<span>{error}</span>
					<Button size="sm" onClick={() => load(true)}>
						重试
					</Button>
				</div>
			)}
			{!data && !error && (
				<div className="ud-loading" role="status">
					正在读取本机会话记录…
				</div>
			)}
			{data && (
				<>
					<div className="ud-metrics">
						<Metric
							label="已报告 token"
							value={<Amount value={data.tokens.total} />}
							detail="包含输入、输出与缓存读写"
						/>
						<Metric
							label="输出 token"
							value={<Amount value={data.tokens.output} />}
							detail={`未缓存输入 ${compact(data.tokens.input)}`}
						/>
						<Metric
							label="缓存命中率"
							value={percent(data.cacheHitRate)}
							detail={`缓存读 ${compact(data.tokens.cacheRead)} · 写 ${compact(data.tokens.cacheWrite)}`}
						/>
						<Metric
							label="活跃会话"
							value={full(data.sessions)}
							detail={`${full(data.turns)} 个新轮次 · ${data.projects.length} 个项目`}
						/>
					</div>
					<Trend days={data.daily} selected={day} onSelect={setDay} />
					<div className="ud-ranking-grid">
						<Rankings
							title="项目用量"
							groups={data.projects}
							selected={project}
							onSelect={setProject}
						/>
						<Rankings
							title="模型用量"
							groups={data.byModel}
							selected={model}
							onSelect={setModel}
							model
						/>
					</div>
					<section className="ud-card ud-sessions">
						<div className="ud-section-head">
							<div>
								<h2>
									会话明细 <span className="ud-count">{sessions.length}</span>
								</h2>
							</div>
							<div className="ud-session-tools">
								<Input
									aria-label="搜索会话"
									placeholder="搜索会话或项目…"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
								/>
								<select
									aria-label="会话排序"
									value={sort}
									onChange={(event) => setSort(event.target.value)}
								>
									<option value="total">用量最多</option>
									<option value="recent">最近活动</option>
								</select>
							</div>
						</div>
						{filtered && (
							<div className="ud-filters">
								{day && (
									<Button size="sm" onClick={() => setDay('')}>
										{day} ×
									</Button>
								)}
								{project && (
									<Button size="sm" onClick={() => setProject('')}>
										{projectLabel || project} ×
									</Button>
								)}
								{model && (
									<Button size="sm" onClick={() => setModel('')}>
										{modelLabel || model} ×
									</Button>
								)}
								<Button size="sm" onClick={reset}>
									清除筛选
								</Button>
								<span>
									筛选合计{' '}
									<Amount value={sessions.reduce((sum, session) => sum + session.total, 0)} />
								</span>
							</div>
						)}
						<SessionTable sessions={sessions} />
					</section>
					{data.tools.length > 0 && (
						<section className="ud-tools">
							<h2>工具调用</h2>
							<div>
								{data.tools.map((tool) => (
									<span key={tool.name}>
										<code>{tool.name}</code>
										<strong>{full(tool.count)}</strong>
									</span>
								))}
							</div>
						</section>
					)}
					<footer className="ud-footer">
						<Coverage data={data} />
						<span>更新于 {dateTime(data.generatedAt)}</span>
					</footer>
				</>
			)}
		</div>
	);
}

class PanelBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	render() {
		if (this.state.error)
			return (
				<div role="alert" className="ud-root">
					<style>{css}</style>
					<p>用量面板加载失败，{this.state.error.message}</p>
					<Button onClick={() => this.setState({ error: null })}>重试</Button>
				</div>
			);
		return this.props.children;
	}
}
function Panel() {
	return (
		<PanelBoundary>
			<Workbench />
		</PanelBoundary>
	);
}

export const inject = ['slots'];
export function apply(ctx) {
	ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Panel));
	ctx.slots.inject('sidebar.panellist', () =>
		ctx.slots.register(
			{ name: 'sidebar.panellist', id: PANEL_ID, order: 45, label: '用量' },
			PanelIcon
		)
	);
	ctx.slots.inject('settings.section', () =>
		ctx.slots.register(
			{ name: 'settings.section', id: PANEL_ID, order: 32, label: '用量面板' },
			Panel
		)
	);
}
