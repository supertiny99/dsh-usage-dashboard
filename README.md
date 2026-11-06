# dsh-usage-dashboard

本地用量面板（DSH / DeepSeek Harness 插件）：只读聚合 `~/.dsh` 的会话数据，回答「我的 token 花在哪了」。

- **Token 按模型分组**：四桶口径（uncached input / output / cache read / cache write），按模型（含网关供应商前缀）分组统计
- **会话概览**：时间窗口内会话数、turns/steps
- **工具使用 Top5**：最常用工具排行
- 时间窗口切换：今日 / 近 7 天 / 近 30 天
- **零配置、零外部依赖、断网可用**——只读本机 `~/.dsh`，不调任何 API，不上报任何数据

> 定位说明：与「查询 API 余额/账单」类插件不同，本插件不做任何网络请求——它统计的是本机会话日志里的真实 token 消耗（跨会话聚合），两者互补。

## 安装

在 DSH 桌面版「插件页 → 添加插件」，任选一种 spec：

**npm**（推荐，可 pin 版本）：

```
@supertiny99/dsh-usage-dashboard
```

**GitHub**（源码安装，tag 定版本）：

```
github:supertiny99/dsh-usage-dashboard#v0.1.0
```

**tarball**（离线递送）：

```
file:/绝对路径/supertiny99-dsh-usage-dashboard-0.1.0.tgz
```

要求：DSH `>= 0.2.1-rc.5`（`engines.dsh` 准入自动校验）。

## 配置（可选）

默认时间窗口为近 7 天。改默认值：在 `~/.dsh/profiles/<你的 profile>/cordis.patch.yml` 追加：

```yaml
- id: usage-dashboard
  name: "@supertiny99/dsh-usage-dashboard"
  config:
    timeRange: 30d   # today | 7d | 30d
```

保存即热生效（无需重启）。面板上的时间胶囊切换不受此配置影响。

## 升级 / 卸载

DSH 插件更新 = 先移除再安装新版本（插件页 remove → add 新版本号）；升级不会丢数据（本插件不写任何状态）。

## 常见问题

- **npm 源同步延迟**：刚发布的版本在镜像源（如 npmmirror）可能有同步延迟，可切官方源安装或稍后重试
- **数据口径**：统计范围 = 本机 `~/.dsh` 当前留存的会话投影；旧版本会话缺模型信息时归入 `unknown` 分组
- **Host API**（调试用）：`GET http://127.0.0.1:<Host端口>/usage-dashboard/data?range=today|7d|30d`（端口动态分配）

## License

[MIT](LICENSE)
