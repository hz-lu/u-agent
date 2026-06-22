# Codex Handoff

## 总体目标

基于已开发的U盘便捷版openclaw实现集成Hermes，集成实现零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心，并且要和现有程序前端界面无缝融合，提供良好的用户体验。

## 当前目标

处理主进程里启动期同步 I/O、运行期解压导致的 Windows 慢 U 盘卡顿风险，优先避免窗口创建前解压 `openclaw.zip` 或清理大目录。

## 已完成

- 修改 `src/openclaw-shell-app/dist/main/index.js` 中的 `extractRuntime()`。
- 默认禁止启动期自动解压 `runtime/openclaw.zip`。
- 如果需要旧式手动修复，可显式设置 `OPENCLAW_ALLOW_RUNTIME_EXTRACTION=1`，或在 runtime 目录放置 `ALLOW_RUNTIME_EXTRACTION` marker。
- 启动时发现旧版本残缺 runtime，不再同步 `rmSync(RUNTIME_DIR, { recursive: true })` 清理大目录，避免慢 U 盘上卡死。
- 构建后同步到 `dist/main/index.js` 和 `dist/main/index.cjs`。
- 同步更新 `scripts/restore-openclaw-shell.mjs`，避免以后重新 restore 时把旧逻辑带回来。

## 改动文件

- `src/openclaw-shell-app/dist/main/index.js`
- `dist/main/index.js`
- `dist/main/index.cjs`
- `scripts/restore-openclaw-shell.mjs`
- `docs/codex-handoff/2026-06-22-disable-startup-runtime-extraction.md`

## 关键决策

- 正式 release 应预置完整展开后的 runtime，不依赖用户首次启动时现场解压大包。
- 缺 runtime 时不阻塞窗口创建前流程；应通过环境检查和 release preflight 给出明确修复路径。
- 启动期不做大目录删除，防止 Windows 慢盘、杀毒扫描、U 盘 IO 抖动导致 Electron 长时间无响应。
- 旧式解压保留显式开关，便于开发/修复场景使用，但默认关闭。

## 待继续

1. 把主进程中 `stopGateway()`、端口清理、`taskkill`、`netstat` 等 `execSync` 路径改成异步或后台任务。
2. 将聊天历史、日志读取等 IPC 中的同步文件 I/O 改为异步，尤其是大文件读取路径。
3. Windows release 包补齐完整展开后的 `runtime/node_modules/openclaw/dist`，验证不再触发启动期解压。
4. 在 Windows U 盘实机上测试：缺 runtime、完整 runtime、残缺 runtime 三种启动状态。

## 验证结果

- `node --check scripts/restore-openclaw-shell.mjs`：通过。
- `node --check src/openclaw-shell-app/dist/main/index.js`：通过。
- `node --check dist/main/index.js`：通过。
- `node --check dist/main/index.cjs`：通过。
- `npm run audit:openclaw-shell`：通过，24/24。
- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run audit:portable`：通过执行，仍按当前真实状态报告 runtime 资产缺失。

## 如果需要下一台 Codex 接手，提示词

请在 `/Users/ly/data/codex/u-agent` 接手。当前已经默认禁用启动期 `openclaw.zip` 解压和启动期大目录清理。下一步继续处理主进程同步命令：重点搜索 `execSync`、`spawnSync`、`readFileSync`、`writeFileSync`，优先改 `stopGateway()`、端口清理、日志/聊天历史读取等用户操作路径。不要恢复启动期自动解压；正式包必须预置完整 runtime。
