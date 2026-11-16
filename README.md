# dsh-usage-dashboard

DSH 本地用量分析工作台，按实际结算日期查看 token 去向，并追查项目、模型与会话。

## 入口与功能

**DSH 桌面版 → 侧栏「用量」**，原有 **设置 → 用量面板** 也可打开。

- 今日、近 7 天、近 30 天概览，展示已报告 token、输出、缓存命中率和活跃会话。
- 每日四桶堆叠趋势，项目用量排行，按供应商与模型区分的用量排行。
- 点击日期、项目或模型筛选会话，支持标题/路径/编号搜索、用量/活动排序和分页。
- 展开会话查看所选范围的四桶明细与模型构成，筛选标签可单独移除或清空。
- 手动刷新、失败重试、窗口激活刷新、宿主主题适配和数据覆盖诊断。

顶部指标与排行展示整个时间窗口，会话明细跟随交叉筛选更新。

## 安装

在 DSH 桌面版「插件 → 添加插件」中输入 npm 包名安装 **0.2.0**。

```text
@supertiny99/dsh-usage-dashboard@0.2.0
```

离线安装可选择对应的 tgz 文件。

```text
file:/absolute/path/supertiny99-dsh-usage-dashboard-0.2.0.tgz
```

后续版本可通过 DSH 插件页检查更新，安装版本以 npm 注册表为准。

宿主兼容范围为 DSH `>=0.2.1-rc.5`。运行依赖 fzstd 为纯 JavaScript 解压库。

## 统计口径

- 时间窗口采用宿主本地日历日期，近 7 天包含今天与前 6 天，近 30 天包含今天与前 29 天。上界为本次查询时刻。
- token 按 `assistant/message` 与 `assistant/attempt` 的结算事件时间归属。四桶分别为未缓存输入、输出、缓存读、缓存写。总量为已报告四桶之和。
- 同一 turn/step 的重复结算采用宿主替换语义，`llm/retry-started` 后的尝试另计。模型来源取对应回答或当时请求路由。
- 分叉会话的继承前缀从统计中排除，避免父子会话重复计费。继承边界缺失时显示覆盖诊断。
- 活跃会话包含窗口内有用量、工具调用、轮次开始或用户消息的会话。轮次数按窗口内 `turn/start` 统计。
- 缓存命中率为缓存已知请求的缓存读总量除以输入侧三桶总量，采用 token 加权。缺失的缓存字段在覆盖诊断中列出。
- 原始日志缺失、损坏或数据无法归属时，界面展示具体数量。统计范围受本机保留日志覆盖程度影响。

## 数据与性能

默认读取 `${DSH_HOME}/sessions` 和 `${DSH_HOME}/storages/session_projcache/sessions`。环境变量缺省时根目录为 `~/.dsh`。

Host 工作线程只读扫描日志与投影，缓存紧凑统计结果，按文件签名失效。解压与折叠在工作线程执行。源数据读写权限保持为只读，统计过程在本机完成。缓存上限为 128 个会话、100,000 条统计记录，查询结果缓存 5 秒。刷新按钮会重新检查文件签名。

## 默认时间窗口

profile 的 `cordis.patch.yml` 支持以下配置。按项目约定通过宿主配置管理方式设置。

```yaml
- id: usage-dashboard
  name: '@supertiny99/dsh-usage-dashboard'
  config:
    timeRange: 30d  # today | 7d | 30d
```

页面首次打开采用 Host 默认值，时间按钮用于本次查看。

## 开发与验证

构建使用 Node.js 与 pnpm，回归测试使用 Node.js 24 的 Zstandard 压缩能力。

```sh
pnpm install
pnpm run build
pnpm test
pnpm run watch
pnpm run preflight
pnpm pack
```

- `build` 生成 `dist/client.js`，随后核验 ModuleLoader、三处 slot 和共享 React。
- `test` 覆盖统计边界、继承历史、重试、缓存失效、并发卸载、Host HTTP 入口与交叉筛选。
- `preflight` 执行构建、回归与打包白名单检查。
- Client 通用控件复用宿主共享模块，个性化图表与布局使用 `--dsw-*` token。

Dev 试装使用安装版自带 CLI，以下命令在插件源码目录执行。

```sh
DSH_HOME="$HOME/.dsh-dev" "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add "link:$PWD"
DSH_HOME="$HOME/.dsh-dev" "/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness" \
  --user-data-dir="$HOME/.dsh-dev/electron-user-data"
```

并行运行桌面版时，独立的 Electron `user-data-dir` 用于区分窗口实例，`DSH_HOME` 用于区分 Host 数据与 profile。

调试端点为 `GET /usage-dashboard/data?range=today|7d|30d&refresh=1`，Host 端口由当前实例动态分配。响应保留 sessions、turns、tokens、byModel、byPreset、tools、coverage，新增 daily、projects、sessionDetails、index、defaultRange。

## 自动发布

发布由主开发仓库管理，与 changelog-viewer、plugin-guardian 共用统一发布流程。CI 使用 Node.js 24，在插件目录安装依赖，执行 preflight 后生成 tgz，通过包体核验与精确版本检查，再同步公开仓、上传同一份 tgz 并补齐 GitHub Release。

本地预检也可使用 `npm run preflight`。主开发仓库 main 上的插件提交和手工触发由 GitHub Actions 入口处理。

## License

[MIT](LICENSE)
