window.__ModuleLoader__.load({id:"@supertiny99/dsh-usage-dashboard",factory:(require)=>{const module={exports:{}};const exports=module.exports;
var R=Object.create;var $=Object.defineProperty;var ee=Object.getOwnPropertyDescriptor;var te=Object.getOwnPropertyNames;var ae=Object.getPrototypeOf,ne=Object.prototype.hasOwnProperty;var ie=(t,n)=>{for(var a in n)$(t,a,{get:n[a],enumerable:!0})},H=(t,n,a,d)=>{if(n&&typeof n=="object"||typeof n=="function")for(let i of te(n))!ne.call(t,i)&&i!==a&&$(t,i,{get:()=>n[i],enumerable:!(d=ee(n,i))||d.enumerable});return t};var K=(t,n,a)=>(a=t!=null?R(ae(t)):{},H(n||!t||!t.__esModule?$(a,"default",{value:t,enumerable:!0}):a,t)),oe=t=>H($({},"__esModule",{value:!0}),t);var xe={};ie(xe,{apply:()=>he,inject:()=>ge});module.exports=oe(xe);var e=K(require("react"),1),L=K(require("@deepseek-ai/dsh-client-ui-primitives"),1);var D=`.ud-root {
	--ud-ink: var(--dsw-alias-label-primary);
	--ud-muted: var(--dsw-alias-label-secondary);
	--ud-caption: var(--dsw-alias-label-tertiary);
	--ud-base: var(--dsw-alias-bg-base);
	--ud-card: var(--dsw-alias-bg-layer-2);
	--ud-line: var(--dsw-alias-border-l2);
	--ud-hover: var(--dsw-alias-interactive-bg-hover);
	--ud-accent: var(--dsw-alias-link);
	--ud-input: var(--dsw-alias-label-tertiary);
	--ud-output: var(--dsw-alias-label-primary);
	--ud-cacheRead: color-mix(in srgb, var(--ud-ink) 20%, var(--ud-card));
	--ud-cacheWrite: var(--dsw-alias-link);
	box-sizing: border-box;
	color: var(--ud-ink);
	background: var(--ud-base);
	font-family: var(--dsw-font-family);
	font-size: 14px;
	line-height: 1.6;
	padding: 40px clamp(20px, 4vw, 64px) 28px;
	width: 100%;
	height: 100%;
	overflow: auto;
	container-type: inline-size;
}
.ud-root *,
.ud-root *::before,
.ud-root *::after {
	box-sizing: border-box;
}
.ud-root h1,
.ud-root h2,
.ud-root p {
	margin: 0;
}
.ud-root h1 {
	font-size: 30px;
	font-weight: 600;
	letter-spacing: -0.04em;
	line-height: 1.3;
}
.ud-root h2 {
	font-size: 15px;
	font-weight: 600;
}
.ud-root small {
	display: block;
	font-size: 12px;
	color: var(--ud-caption);
}
.ud-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	margin-bottom: 32px;
}
.ud-header p {
	color: var(--ud-caption);
	font-size: 12px;
	margin-top: 6px;
}
.ud-actions,
.ud-ranges {
	display: flex;
	align-items: center;
	gap: 5px;
}
.ud-actions {
	gap: 16px;
	flex-wrap: wrap;
}
.ud-ranges {
	border-radius: 12px;
	padding: 4px;
	background: var(--ud-card);
}
.ud-metrics {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 20px;
	margin-bottom: 28px;
}
.ud-metric {
	padding: 4px 0 8px;
	min-width: 0;
}
.ud-metric > span {
	font-size: 12px;
	color: var(--ud-muted);
}
.ud-metric > strong {
	display: block;
	font-size: clamp(25px, 3.6vw, 40px);
	font-weight: 500;
	letter-spacing: -0.045em;
	line-height: 1.4;
	font-variant-numeric: tabular-nums;
	margin: 6px 0;
}
.ud-metric small {
	white-space: normal;
}
.ud-card {
	background: var(--ud-card);
	border: 1px solid var(--ud-line);
	border-radius: var(--dsw-radius-xl, 20px);
	padding: 22px 24px;
}
.ud-section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 18px;
	flex-wrap: wrap;
}
.ud-section-head > span,
.ud-section-head > h2 > span {
	font-size: 12px;
	color: var(--ud-caption);
	font-weight: 400;
}
.ud-trend {
	margin-bottom: 20px;
}
.ud-legend {
	display: flex;
	gap: 20px;
	flex-wrap: wrap;
	font-size: 11px;
	color: var(--ud-muted);
}
.ud-legend > span {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
.ud-swatch {
	display: inline-block;
	height: 8px;
	width: 8px;
	border-radius: 2px;
}
.ud-input {
	background: var(--ud-input);
}
.ud-output {
	background: var(--ud-output);
}
.ud-cacheRead {
	background: var(--ud-cacheRead);
}
.ud-cacheWrite {
	background: var(--ud-cacheWrite);
}
.ud-chart {
	display: flex;
	height: 188px;
	align-items: stretch;
	gap: clamp(3px, 0.9vw, 12px);
	margin-top: 18px;
	border-bottom: 1px solid var(--ud-line);
}
.ud-day {
	border: 0;
	background: transparent;
	padding: 0;
	color: var(--ud-caption);
	font: inherit;
	min-width: 0;
	flex: 1;
	cursor: pointer;
	border-radius: 6px 6px 0 0;
}
.ud-day:hover,
.ud-day.is-selected {
	background: var(--ud-hover);
}
.ud-day.is-selected {
	box-shadow: inset 0 0 0 1px var(--ud-accent);
}
.ud-bar-track {
	display: flex;
	justify-content: center;
	align-items: flex-end;
	height: 156px;
	padding: 0 12%;
}
.ud-stack {
	display: flex;
	flex-direction: column-reverse;
	width: 100%;
	max-width: 72px;
	border-radius: 4px 4px 0 0;
	overflow: hidden;
	min-height: 1px;
	background: var(--ud-line);
}
.ud-stack > i {
	display: block;
	flex-basis: 0;
	min-height: 0;
}
.ud-day-label {
	display: block;
	font-size: 10px;
	margin-top: 10px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.ud-chart-foot {
	display: flex;
	justify-content: space-between;
	color: var(--ud-caption);
	font-size: 11px;
	padding-top: 12px;
}
.ud-ranking-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px;
	margin-bottom: 20px;
}
.ud-ranking-list {
	max-height: 280px;
	overflow: auto;
	scrollbar-gutter: stable;
}
.ud-rank {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 6px 16px;
	padding: 12px 10px;
	width: 100%;
	border: 0;
	border-radius: 10px;
	background: transparent;
	text-align: left;
	color: inherit;
	cursor: pointer;
	font: inherit;
}
.ud-rank:hover,
.ud-rank.is-selected {
	background: var(--ud-hover);
}
.ud-rank.is-selected {
	box-shadow: inset 0 0 0 1px var(--ud-line);
}
.ud-rank-info {
	min-width: 0;
}
.ud-rank-info strong {
	font-size: 13px;
	font-weight: 500;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.ud-rank-info small {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 10px;
}
.ud-rank-number {
	text-align: right;
	font-variant-numeric: tabular-nums;
	font-size: 13px;
}
.ud-rank-number small {
	font-size: 10px;
}
.ud-rank-track {
	grid-column: 1 / -1;
	display: block;
	height: 3px;
	background: var(--ud-hover);
	border-radius: 4px;
	overflow: hidden;
}
.ud-rank-track > i {
	display: block;
	height: 100%;
	background: var(--ud-ink);
	opacity: 0.5;
	border-radius: inherit;
}
.ud-count {
	margin-left: 6px;
}
.ud-session-tools {
	display: flex;
	gap: 8px;
	align-items: center;
}
.ud-session-tools > span {
	width: 190px;
}
.ud-session-tools input {
	width: 100%;
}
.ud-root select {
	padding: 7px 10px;
	border: 1px solid var(--ud-line);
	border-radius: 9px;
	background: var(--ud-card);
	color: var(--ud-muted);
	font: inherit;
	font-size: 12px;
}
.ud-filters {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-wrap: wrap;
	padding-bottom: 14px;
}
.ud-filters > span {
	margin-left: auto;
	color: var(--ud-caption);
	font-size: 12px;
}
.ud-table-scroll {
	overflow-x: auto;
}
.ud-table {
	width: 100%;
	border-collapse: collapse;
	text-align: left;
	font-size: 12px;
}
.ud-table th {
	font-weight: 400;
	color: var(--ud-caption);
	padding: 8px 10px 12px;
	border-bottom: 1px solid var(--ud-line);
	white-space: nowrap;
}
.ud-table th:nth-child(3),
.ud-table th:nth-child(4) {
	text-align: right;
}
.ud-table td {
	padding: 14px 10px;
	border-bottom: 1px solid var(--ud-line);
	vertical-align: middle;
}
.ud-table td:first-child {
	width: 42%;
	padding-left: 0;
}
.ud-table td:nth-child(2) {
	max-width: 180px;
}
.ud-table td small {
	font-size: 10px;
}
.ud-session-toggle {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	border: 0;
	background: transparent;
	color: inherit;
	text-align: left;
	padding: 0;
	cursor: pointer;
	font: inherit;
}
.ud-session-toggle > span:last-child {
	min-width: 0;
}
.ud-session-toggle strong {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	font-size: 13px;
	font-weight: 500;
	line-height: 1.5;
}
.ud-chevron {
	flex: 0 0 18px;
	color: var(--ud-caption);
	font-size: 16px;
}
.ud-model-name {
	display: block;
	max-width: 180px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.ud-numeric,
.ud-time {
	text-align: right;
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
}
.ud-time {
	color: var(--ud-caption);
}
.ud-detail td {
	background: var(--ud-hover);
	padding: 18px !important;
}
.ud-detail-buckets {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;
}
.ud-detail-buckets span {
	font-size: 11px;
	color: var(--ud-caption);
	display: block;
}
.ud-detail-buckets strong {
	font-size: 14px;
	font-weight: 500;
	font-variant-numeric: tabular-nums;
}
.ud-detail-models {
	margin: 14px 0;
	display: grid;
	gap: 6px;
	color: var(--ud-muted);
}
.ud-detail-models > span {
	display: flex;
	justify-content: space-between;
	gap: 14px;
	overflow-wrap: anywhere;
}
.ud-detail-models strong {
	font-weight: 500;
	white-space: nowrap;
}
.ud-session-id {
	overflow-wrap: anywhere;
}
.ud-pagination {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 8px;
	margin-top: 16px;
	color: var(--ud-caption);
	font-size: 12px;
}
.ud-pagination > span {
	margin-right: auto;
}
.ud-tools {
	display: flex;
	align-items: baseline;
	gap: 20px;
	padding: 24px 4px;
	flex-wrap: wrap;
}
.ud-tools h2 {
	font-size: 12px;
	font-weight: 400;
	color: var(--ud-caption);
}
.ud-tools > div {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 22px;
}
.ud-tools span {
	display: flex;
	gap: 8px;
	align-items: baseline;
	font-size: 11px;
	color: var(--ud-muted);
}
.ud-tools code {
	font-family: inherit;
}
.ud-tools strong {
	font-weight: 500;
	color: var(--ud-caption);
}
.ud-footer {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 16px;
	color: var(--ud-caption);
	font-size: 11px;
	padding: 10px 4px;
	flex-wrap: wrap;
}
.ud-footer > span {
	white-space: nowrap;
}
.ud-coverage {
	max-width: 720px;
}
.ud-coverage summary {
	cursor: pointer;
}
.ud-coverage p {
	margin: 10px 0;
}
.ud-coverage ul {
	padding-left: 16px;
	columns: 2;
}
.ud-coverage li strong {
	margin-left: 12px;
	font-weight: 500;
}
.ud-error {
	display: flex;
	gap: 12px;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	margin-bottom: 20px;
	border: 1px solid var(--ud-line);
	border-radius: 12px;
}
.ud-loading,
.ud-empty {
	color: var(--ud-caption);
	padding: 36px 12px;
	text-align: center;
}
.ud-root button:focus-visible,
.ud-root select:focus-visible,
.ud-root summary:focus-visible {
	outline: 2px solid var(--ud-accent);
	outline-offset: 3px;
}
@container (max-width: 700px) {
	.ud-header {
		align-items: flex-start;
		flex-direction: column;
		gap: 16px;
	}
	.ud-metrics {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
	}
	.ud-ranking-grid {
		grid-template-columns: 1fr;
	}
	.ud-section-head {
		align-items: flex-start;
	}
	.ud-card {
		padding: 18px 16px;
	}
	.ud-session-tools {
		flex-wrap: wrap;
		width: 100%;
	}
	.ud-session-tools > span {
		flex: 1;
		min-width: 120px;
		width: 100%;
	}
	.ud-detail-buckets {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.ud-legend {
		gap: 12px;
	}
	.ud-table {
		min-width: 540px;
	}
	.ud-chart-foot {
		gap: 12px;
	}
}
@media (prefers-reduced-motion: reduce) {
	.ud-root *,
	.ud-root *::before,
	.ud-root *::after {
		scroll-behavior: auto !important;
		animation: none !important;
		transition: none !important;
	}
}
`;function O(t,{day:n,project:a,model:d,search:i,sort:l}){let o=i.trim().toLocaleLowerCase(),m=[];for(let s of t){if(a&&s.project!==a||n&&!s.activityDates.includes(n)||o&&!`${s.title} ${s.cwd} ${s.id}`.toLocaleLowerCase().includes(o))continue;let p=s.breakdown.filter(u=>(!n||u.date===n)&&(!d||u.key===d));if(d&&!p.length)continue;let c={input:0,output:0,cacheRead:0,cacheWrite:0,total:0},f=new Map;for(let u of p){for(let v of Object.keys(c))c[v]+=u[v];let b=f.get(u.key)??{key:u.key,provider:u.provider,model:u.model,total:0};b.total+=u.total,f.set(u.key,b)}m.push({...s,...c,matchingModels:[...f.values()]})}return m.sort((s,p)=>l==="recent"?p.lastActivityAt-s.lastActivityAt:p.total-s.total),m}var I="usage-dashboard",re=[["today","\u4ECA\u65E5"],["7d","\u8FD1 7 \u5929"],["30d","\u8FD1 30 \u5929"]],C=[["input","\u672A\u7F13\u5B58\u8F93\u5165"],["output","\u8F93\u51FA"],["cacheRead","\u7F13\u5B58\u8BFB"],["cacheWrite","\u7F13\u5B58\u5199"]],h=t=>Number(t??0).toLocaleString("zh-CN"),j=t=>new Intl.NumberFormat("zh-CN",{notation:"compact",maximumFractionDigits:1}).format(t??0),Q=t=>t==null?"\u2014":`${(t*100).toFixed(1)}%`,M=t=>new Date(t).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}),g=L.Button??(t=>e.default.createElement("button",{type:"button",...t})),de=L.Input??(t=>e.default.createElement("input",{...t}));function k({value:t}){return e.default.createElement("span",{title:`${h(t)} token`},j(t))}function le({size:t=20}){return e.default.createElement("span",{"aria-hidden":"true",style:{width:t,height:t,display:"inline-flex",alignItems:"flex-end",justifyContent:"center",gap:2,padding:3}},[55,100,75].map((n,a)=>e.default.createElement("i",{key:a,style:{width:3,height:`${n}%`,borderRadius:1,background:"currentColor"}})))}function S({label:t,value:n,detail:a}){return e.default.createElement("div",{className:"ud-metric"},e.default.createElement("span",null,t),e.default.createElement("strong",null,n),e.default.createElement("small",null,a))}function ue({days:t,selected:n,onSelect:a}){let d=Math.max(1,...t.map(i=>i.total));return e.default.createElement("section",{className:"ud-card ud-trend"},e.default.createElement("div",{className:"ud-section-head"},e.default.createElement("h2",null,"\u6BCF\u65E5\u7528\u91CF"),e.default.createElement("span",null,"\u70B9\u51FB\u65E5\u671F\u67E5\u770B\u4F1A\u8BDD")),e.default.createElement("div",{className:"ud-legend"},C.map(([i,l])=>e.default.createElement("span",{key:i},e.default.createElement("i",{className:`ud-swatch ud-${i}`}),l))),e.default.createElement("div",{className:"ud-chart",role:"group","aria-label":"\u6BCF\u65E5 token \u7528\u91CF"},t.map((i,l)=>e.default.createElement("button",{type:"button",key:i.date,className:`ud-day ${n===i.date?"is-selected":""}`,"aria-pressed":n===i.date,onClick:()=>a(n===i.date?"":i.date),"aria-label":`${i.date}\uFF0C${h(i.total)} token\uFF0C${i.sessions} \u4E2A\u4F1A\u8BDD`,title:`${i.date}
${C.map(([o,m])=>`${m} ${h(i[o])}`).join(`
`)}
${i.sessions} \u4E2A\u4F1A\u8BDD`},e.default.createElement("span",{className:"ud-bar-track"},e.default.createElement("span",{className:"ud-stack",style:{height:`${i.total/d*100}%`}},C.map(([o])=>e.default.createElement("i",{key:o,className:`ud-${o}`,style:{flexGrow:i[o]}})))),e.default.createElement("span",{className:"ud-day-label"},t.length<=7||l%5===0||l===t.length-1?i.date.slice(5).replace("-","/"):"\xA0")))),e.default.createElement("div",{className:"ud-chart-foot"},e.default.createElement("span",null,"\u6BCF\u65E5\u6700\u9AD8 ",e.default.createElement(k,{value:d===1&&t.every(i=>!i.total)?0:d})),e.default.createElement("span",null,"\u6309\u672C\u5730\u65E5\u671F \xB7 \u5DF2\u62A5\u544A token")))}function _({title:t,groups:n,selected:a,onSelect:d,model:i=!1}){let l=n.reduce((o,m)=>o+m.total,0);return e.default.createElement("section",{className:"ud-card ud-ranking"},e.default.createElement("div",{className:"ud-section-head"},e.default.createElement("h2",null,t),e.default.createElement("span",null,n.length," ",i?"\u4E2A\u6A21\u578B\u8DEF\u7531":"\u4E2A\u9879\u76EE")),n.length===0?e.default.createElement("p",{className:"ud-empty"},"\u5F53\u524D\u7A97\u53E3\u6682\u65E0\u7528\u91CF"):e.default.createElement("div",{className:"ud-ranking-list"},n.map(o=>e.default.createElement("button",{type:"button",key:o.key,className:`ud-rank ${a===o.key?"is-selected":""}`,onClick:()=>d(a===o.key?"":o.key),"aria-pressed":a===o.key,title:i?`${o.provider} / ${o.model}`:o.cwd||"\u672A\u5F52\u5C5E\u9879\u76EE"},e.default.createElement("span",{className:"ud-rank-info"},e.default.createElement("strong",null,i?o.model:o.name),e.default.createElement("small",null,i?o.provider:o.cwd||"\u672A\u5F52\u5C5E\u9879\u76EE")),e.default.createElement("span",{className:"ud-rank-number"},e.default.createElement(k,{value:o.total}),e.default.createElement("small",null,Q(l>0?o.total/l:0))),e.default.createElement("span",{className:"ud-rank-track"},e.default.createElement("i",{style:{width:`${l>0?o.total/l*100:0}%`}}))))))}function pe({sessions:t}){let n=e.default.useId(),[a,d]=e.default.useState(""),[i,l]=e.default.useState(0);e.default.useEffect(()=>{l(0),d("")},[t]);let o=Math.min(i,Math.max(0,Math.ceil(t.length/20)-1)),m=t.slice(o*20,(o+1)*20);return e.default.createElement(e.default.Fragment,null,e.default.createElement("div",{className:"ud-table-scroll"},e.default.createElement("table",{className:"ud-table"},e.default.createElement("thead",null,e.default.createElement("tr",null,e.default.createElement("th",null,"\u4F1A\u8BDD / \u9879\u76EE"),e.default.createElement("th",null,"\u6A21\u578B"),e.default.createElement("th",null,"\u6240\u9009\u8303\u56F4 token"),e.default.createElement("th",null,"\u6700\u8FD1\u6D3B\u52A8"))),e.default.createElement("tbody",null,m.map(s=>e.default.createElement(e.default.Fragment,{key:s.id},e.default.createElement("tr",null,e.default.createElement("td",null,e.default.createElement("button",{type:"button",className:"ud-session-toggle","aria-expanded":a===s.id,"aria-controls":`${n}-${s.id}`,onClick:()=>d(a===s.id?"":s.id)},e.default.createElement("span",{className:"ud-chevron","aria-hidden":"true"},a===s.id?"\u2212":"+"),e.default.createElement("span",null,e.default.createElement("strong",null,s.title),e.default.createElement("small",{title:s.cwd},s.projectName)))),e.default.createElement("td",null,e.default.createElement("span",{className:"ud-model-name"},s.matchingModels[0]?.model??"\u2014"),e.default.createElement("small",null,s.matchingModels.length>1?`\u5171 ${s.matchingModels.length} \u4E2A\u6A21\u578B\u8DEF\u7531`:s.matchingModels[0]?.provider)),e.default.createElement("td",{className:"ud-numeric"},e.default.createElement(k,{value:s.total})),e.default.createElement("td",{className:"ud-time"},M(s.lastActivityAt))),a===s.id&&e.default.createElement("tr",{id:`${n}-${s.id}`,className:"ud-detail"},e.default.createElement("td",{colSpan:"4"},e.default.createElement("div",{className:"ud-detail-buckets"},C.map(([p,c])=>e.default.createElement("div",{key:p},e.default.createElement("span",null,c),e.default.createElement("strong",null,h(s[p]))))),e.default.createElement("div",{className:"ud-detail-models"},s.matchingModels.map(p=>e.default.createElement("span",{key:p.key},p.provider," / ",p.model,e.default.createElement("strong",null,h(p.total))))),e.default.createElement("small",{className:"ud-session-id"},s.cwd||"\u672A\u5F52\u5C5E\u9879\u76EE"," \xB7 ",s.id)))))))),t.length===0&&e.default.createElement("p",{className:"ud-empty"},"\u6CA1\u6709\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u4F1A\u8BDD"),t.length>20&&e.default.createElement("div",{className:"ud-pagination"},e.default.createElement("span",null,o*20+1,"\u2013",Math.min((o+1)*20,t.length)," / ",t.length),e.default.createElement(g,{size:"sm",disabled:o===0,onClick:()=>l(o-1)},"\u4E0A\u4E00\u9875"),e.default.createElement(g,{size:"sm",disabled:(o+1)*20>=t.length,onClick:()=>l(o+1)},"\u4E0B\u4E00\u9875")))}function ce({data:t}){let n=t.coverage,a=[["missingLogs","\u7F3A\u5931\u65E5\u5FD7"],["unreadableLogs","\u4E0D\u53EF\u8BFB\u65E5\u5FD7"],["invalidProjections","\u5F02\u5E38\u6295\u5F71"],["malformedLines","\u635F\u574F\u4E8B\u4EF6\u884C"],["missingTime","\u7F3A\u5931\u65F6\u95F4"],["invalidUsage","\u65E0\u6548\u7528\u91CF"],["missingUsage","\u7ED3\u7B97\u672A\u62A5\u544A\u7528\u91CF"],["ambiguousSeed","\u7EE7\u627F\u8FB9\u754C\u672A\u77E5"],["directoryErrors","\u4E0D\u53EF\u8BFB\u76EE\u5F55"],["incompleteRecords","\u7F13\u5B58\u6876\u672A\u5B8C\u6574\u62A5\u544A"],["unknownModelRecords","\u6A21\u578B\u5F52\u5C5E\u4E0D\u5B8C\u6574"]].filter(([d])=>n[d]>0);return e.default.createElement("details",{className:"ud-coverage"},e.default.createElement("summary",null,"\u6570\u636E\u8986\u76D6 ",n.indexedSessions," / ",n.discoveredSessions," \u4E2A\u4F1A\u8BDD",a.length>0?` \xB7 ${a.length} \u7C7B\u5F85\u6838\u9A8C\u9879`:" \xB7 \u5DF2\u5B8C\u6210\u8BFB\u53D6"),e.default.createElement("p",null,"\u7EDF\u8BA1\u6765\u81EA\u672C\u673A\u4FDD\u7559\u7684\u4E8B\u4EF6\u65E5\u5FD7\uFF0C\u6309\u7ED3\u7B97\u65F6\u95F4\u5F52\u5C5E\u3002\u5206\u53C9\u7EE7\u627F\u7684\u5386\u53F2\u5DF2\u6392\u9664\u3002\u7F3A\u5931\u6216\u65E0\u6CD5\u5F52\u5C5E\u7684\u8BB0\u5F55\u8BA1\u5165\u4E0B\u65B9\u8BCA\u65AD\u3002"),a.length>0&&e.default.createElement("ul",null,a.map(([d,i])=>e.default.createElement("li",{key:d},i,e.default.createElement("strong",null,h(n[d]))))),e.default.createElement("p",null,"\u7F13\u5B58\u547D\u4E2D\u7387\u53EA\u4F7F\u7528\u7F13\u5B58\u6876\u5DF2\u77E5\u7684\u8BF7\u6C42\uFF0C\u6309 token \u52A0\u6743\u3002\u5F53\u524D\u7A97\u53E3\u6709 ",n.incompleteRecords," ","\u6761\u7ED3\u7B97\u7684\u7F13\u5B58\u4FE1\u606F\u4E0D\u5B8C\u6574\u3002"),e.default.createElement("p",null,"\u7D22\u5F15 ",t.index.durationMs," ms \xB7 \u590D\u7528 ",t.index.reusedFiles," \u4E2A\u6587\u4EF6 \xB7 \u672C\u6B21\u89E3\u6790"," ",t.index.parsedFiles," \u4E2A\u6587\u4EF6"))}function me(){let[t,n]=e.default.useState(null),[a,d]=e.default.useState(null),[i,l]=e.default.useState(!1),[o,m]=e.default.useState(""),[s,p]=e.default.useState(""),[c,f]=e.default.useState(""),[u,b]=e.default.useState(""),[v,W]=e.default.useState(""),[B,V]=e.default.useState("total"),E=e.default.useRef(null),N=e.default.useRef(0),T=e.default.useRef(0),U=t??a?.range??"7d",y=e.default.useCallback(async(r=!1)=>{E.current?.abort();let x=new AbortController;E.current=x;let P=++N.current;T.current=Date.now(),l(!0);try{let w=new URLSearchParams;t&&w.set("range",t),r&&w.set("refresh","1");let G=await fetch(`/usage-dashboard/data?${w}`,{credentials:"same-origin",signal:x.signal}),z=await G.json();if(!G.ok||!z.ok||!z.tokens)throw new Error(z.error||"\u8BFB\u53D6\u7528\u91CF\u5931\u8D25");if(P!==N.current||x.signal.aborted)return;d(z),m("")}catch(w){w.name!=="AbortError"&&P===N.current&&m(w.message||"\u8BFB\u53D6\u7528\u91CF\u5931\u8D25")}finally{P===N.current&&!x.signal.aborted&&l(!1)}},[t]);e.default.useEffect(()=>{y();let r=()=>{!document.hidden&&Date.now()-T.current>5e3&&y()};return window.addEventListener("focus",r),document.addEventListener("visibilitychange",r),()=>{E.current?.abort(),window.removeEventListener("focus",r),document.removeEventListener("visibilitychange",r)}},[y]);let A=e.default.useMemo(()=>O(a?.sessionDetails??[],{day:s,project:c,model:u,search:v,sort:B}),[a,s,c,u,v,B]),q=()=>{p(""),f(""),b(""),W("")},X=!!(s||c||u||v),Y=a?.projects.find(r=>r.key===c)?.name,Z=a?.byModel.find(r=>r.key===u)?.model;return e.default.createElement("div",{className:"ud-root","aria-busy":i},e.default.createElement("style",null,D),e.default.createElement("header",{className:"ud-header"},e.default.createElement("div",null,e.default.createElement("h1",null,"\u7528\u91CF"),e.default.createElement("p",null,a?`${M(a.sinceMs).split(" ")[0]} \u2014 ${M(a.untilMs).split(" ")[0]} \xB7 \u672C\u673A\u6D3B\u52A8`:"\u672C\u673A\u4F1A\u8BDD\u7528\u91CF\u5206\u6790")),e.default.createElement("div",{className:"ud-actions"},e.default.createElement("div",{className:"ud-ranges",role:"group","aria-label":"\u65F6\u95F4\u8303\u56F4"},re.map(([r,x])=>e.default.createElement(g,{key:r,size:"sm",variant:U===r?"primary":"ghost","aria-pressed":U===r,onClick:()=>{q(),n(r)}},x))),e.default.createElement(g,{variant:"outline",size:"sm",disabled:i,onClick:()=>y(!0)},i?"\u8BFB\u53D6\u4E2D\u2026":"\u5237\u65B0"))),o&&e.default.createElement("div",{className:"ud-error",role:"alert"},e.default.createElement("span",null,o),e.default.createElement(g,{size:"sm",onClick:()=>y(!0)},"\u91CD\u8BD5")),!a&&!o&&e.default.createElement("div",{className:"ud-loading",role:"status"},"\u6B63\u5728\u8BFB\u53D6\u672C\u673A\u4F1A\u8BDD\u8BB0\u5F55\u2026"),a&&e.default.createElement(e.default.Fragment,null,e.default.createElement("div",{className:"ud-metrics"},e.default.createElement(S,{label:"\u5DF2\u62A5\u544A token",value:e.default.createElement(k,{value:a.tokens.total}),detail:"\u5305\u542B\u8F93\u5165\u3001\u8F93\u51FA\u4E0E\u7F13\u5B58\u8BFB\u5199"}),e.default.createElement(S,{label:"\u8F93\u51FA token",value:e.default.createElement(k,{value:a.tokens.output}),detail:`\u672A\u7F13\u5B58\u8F93\u5165 ${j(a.tokens.input)}`}),e.default.createElement(S,{label:"\u7F13\u5B58\u547D\u4E2D\u7387",value:Q(a.cacheHitRate),detail:`\u7F13\u5B58\u8BFB ${j(a.tokens.cacheRead)} \xB7 \u5199 ${j(a.tokens.cacheWrite)}`}),e.default.createElement(S,{label:"\u6D3B\u8DC3\u4F1A\u8BDD",value:h(a.sessions),detail:`${h(a.turns)} \u4E2A\u65B0\u8F6E\u6B21 \xB7 ${a.projects.length} \u4E2A\u9879\u76EE`})),e.default.createElement(ue,{days:a.daily,selected:s,onSelect:p}),e.default.createElement("div",{className:"ud-ranking-grid"},e.default.createElement(_,{title:"\u9879\u76EE\u7528\u91CF",groups:a.projects,selected:c,onSelect:f}),e.default.createElement(_,{title:"\u6A21\u578B\u7528\u91CF",groups:a.byModel,selected:u,onSelect:b,model:!0})),e.default.createElement("section",{className:"ud-card ud-sessions"},e.default.createElement("div",{className:"ud-section-head"},e.default.createElement("div",null,e.default.createElement("h2",null,"\u4F1A\u8BDD\u660E\u7EC6 ",e.default.createElement("span",{className:"ud-count"},A.length))),e.default.createElement("div",{className:"ud-session-tools"},e.default.createElement(de,{"aria-label":"\u641C\u7D22\u4F1A\u8BDD",placeholder:"\u641C\u7D22\u4F1A\u8BDD\u6216\u9879\u76EE\u2026",value:v,onChange:r=>W(r.target.value)}),e.default.createElement("select",{"aria-label":"\u4F1A\u8BDD\u6392\u5E8F",value:B,onChange:r=>V(r.target.value)},e.default.createElement("option",{value:"total"},"\u7528\u91CF\u6700\u591A"),e.default.createElement("option",{value:"recent"},"\u6700\u8FD1\u6D3B\u52A8")))),X&&e.default.createElement("div",{className:"ud-filters"},s&&e.default.createElement(g,{size:"sm",onClick:()=>p("")},s," \xD7"),c&&e.default.createElement(g,{size:"sm",onClick:()=>f("")},Y||c," \xD7"),u&&e.default.createElement(g,{size:"sm",onClick:()=>b("")},Z||u," \xD7"),e.default.createElement(g,{size:"sm",onClick:q},"\u6E05\u9664\u7B5B\u9009"),e.default.createElement("span",null,"\u7B5B\u9009\u5408\u8BA1"," ",e.default.createElement(k,{value:A.reduce((r,x)=>r+x.total,0)}))),e.default.createElement(pe,{sessions:A})),a.tools.length>0&&e.default.createElement("section",{className:"ud-tools"},e.default.createElement("h2",null,"\u5DE5\u5177\u8C03\u7528"),e.default.createElement("div",null,a.tools.map(r=>e.default.createElement("span",{key:r.name},e.default.createElement("code",null,r.name),e.default.createElement("strong",null,h(r.count)))))),e.default.createElement("footer",{className:"ud-footer"},e.default.createElement(ce,{data:a}),e.default.createElement("span",null,"\u66F4\u65B0\u4E8E ",M(a.generatedAt)))))}var F=class extends e.default.Component{constructor(n){super(n),this.state={error:null}}static getDerivedStateFromError(n){return{error:n}}render(){return this.state.error?e.default.createElement("div",{role:"alert",className:"ud-root"},e.default.createElement("style",null,D),e.default.createElement("p",null,"\u7528\u91CF\u9762\u677F\u52A0\u8F7D\u5931\u8D25\uFF0C",this.state.error.message),e.default.createElement(g,{onClick:()=>this.setState({error:null})},"\u91CD\u8BD5")):this.props.children}};function J(){return e.default.createElement(F,null,e.default.createElement(me,null))}var ge=["slots"];function he(t){t.slots.inject("main",()=>t.slots.register({name:"main",key:I},J)),t.slots.inject("sidebar.panellist",()=>t.slots.register({name:"sidebar.panellist",id:I,order:45,label:"\u7528\u91CF"},le)),t.slots.inject("settings.section",()=>t.slots.register({name:"settings.section",id:I,order:32,label:"\u7528\u91CF\u9762\u677F"},J))}
return module.exports}})
