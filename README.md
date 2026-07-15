# Crush Date Plan

基于 uni-app 的 AI 约会计划前端项目。当前阶段为脚手架与开发链路验证，后续将支持创建约会计划、候选项分享、双方选择与路线生成等能力。

## 技术栈

- uni-app
- Vue 3
- TypeScript
- Vite
- Pinia
- pnpm
- SCSS

## 环境要求

- Node.js 20+（推荐 22）
- pnpm 9+（推荐 10）
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

## 安装依赖

```bash
pnpm install
```

## H5 开发

```bash
pnpm dev:h5
```

启动后在浏览器访问终端输出的本地地址（通常为 `http://localhost:5173`）。

## 微信小程序开发

```bash
pnpm dev:mp-weixin
```

然后在微信开发者工具中导入编译产物目录：

```text
dist/dev/mp-weixin
```

### 微信开发者工具首次配置

1. 先运行 `pnpm dev:mp-weixin`，等待编译完成。
2. 打开微信开发者工具 → 导入项目。
3. 项目目录选择：`dist/dev/mp-weixin`。
4. AppID 需手动填写：
   - 可使用测试号
   - 或选择游客模式
   - 不要将真实 AppID 写入仓库配置
5. 确认热更新：
   - 保持 `pnpm dev:mp-weixin` 运行
   - 修改 `src/pages/home/index.vue` 并保存
   - 微信开发者工具应自动重新编译并刷新页面

## 构建

```bash
pnpm build:h5
pnpm build:mp-weixin
```

构建产物目录：

- H5：`dist/build/h5`
- 微信小程序：`dist/build/mp-weixin`

## 类型检查

```bash
pnpm type-check
```

## 环境变量

复制 `.env.example` 为 `.env.development` 或 `.env.production`，按需配置：

```bash
VITE_API_BASE_URL=http://localhost:3000
```

`.env.development` 与 `.env.production` 不会提交到 Git 仓库。

## 开发流程建议

1. 普通页面、布局和样式优先在 H5 环境调试，效率更高。
2. 每完成一个页面或交互，都在微信开发者工具中同步验证。
3. 微信登录、分享、地图、授权等能力应直接在微信小程序环境中开发。
4. 不要等整个 H5 完成后再开始适配微信小程序。

## 当前页面

- `pages/home/index`：首页，展示项目状态与基础能力验证入口
- `pages/debug/index`：调试页，验证跳转、Pinia、本地存储、Toast、系统信息与条件编译

## 项目结构

```text
src/
├── api/              # 请求层占位
├── components/       # 通用组件
├── pages/            # 页面
├── stores/           # Pinia 状态
├── styles/           # 全局样式与设计变量
├── types/            # 类型定义
├── utils/            # 工具函数
├── App.vue
├── main.ts
├── manifest.json
├── pages.json
└── uni.scss
```

## 暂未实现

- 微信正式登录与用户注册
- AI 推荐接口
- 地图与位置能力
- 分享邀请流程
- 后端接口与数据库
- 完整约会创建流程
- UI 组件库大规模接入
- 复杂动画、支付、消息通知
