# Codex Handoff

## 总体目标
基于已开发的 U 盘便捷版 OpenClaw 实现集成 Hermes，集成实现：零安装、零痕迹、三平台原生、Universal 包、自我成长、多平台接入、定时自动化、子代理委派、沙箱隔离、可视化配置中心。所有 Hermes 能力需要和现有 OpenClaw 前端界面无缝融合，前端操作要给用户良好体验。

## 当前目标
在模型配置界面为当前正在使用的模型增加更直观的小状态标识，文案为“使用中”。

## 已完成
- 在模型列表中，对 `model.isCurrent` 的模型名后展示绿色小徽标“使用中”。
- 保留原有高亮、编辑、切换、删除逻辑不变。
- 已构建并部署到 `F:\win-unpacked\resources\app\dist`。

## 改动文件
- `src/openclaw-shell-app/dist/assets/assets/main-DIeui7ZO.js`
- `src/openclaw-shell-app/dist/assets/main-CAx6YYDG.css`
- `dist/assets/assets/main-DIeui7ZO.js`
- `dist/assets/main-CAx6YYDG.css`

## 关键决策
- 只做轻量视觉提示，不改变模型选择状态机，避免引入新的配置写入或性能风险。

## 待继续
- 用户实机检查模型配置页，确认“使用中”显示位置和视觉强度是否合适。

## 验证结果
- renderer bundle `node --check` 通过。
- `npm run build` 通过。
- `npm run audit:openclaw-shell` 通过，24/24。
- F 盘部署文件已确认包含“使用中”和 `model-using-badge`。

## 如果需要下一台 Codex 接手，提示词
请在 `D:\github\u-agent` 继续开发 U 盘便携版 OpenClawPro/Hermes 集成项目。本次只增加了模型配置列表的“使用中”徽标，没有改动模型切换逻辑。继续修改时先跑 renderer `node --check`，再跑 `npm run build` 和 `npm run audit:openclaw-shell`，部署到 `F:\win-unpacked\resources\app\dist` 后确认 F 盘实际文件。
