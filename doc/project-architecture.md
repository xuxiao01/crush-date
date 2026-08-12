# Crush Date 项目技术架构说明

> 本文用于说明当前项目使用了什么技术、代码如何组织、H5 与微信小程序如何编译运行，以及跨端编码时需要注意什么。原生小程序迁移是项目背景，但本文不展开迁移计划。

## 1. 项目定位

`crush-date` 是一个使用 **UniApp CLI + Vue 3 + TypeScript** 开发的跨端前端项目，当前主要目标平台是：

- H5：运行在浏览器中。
- 微信小程序：编译后运行在微信小程序环境中。

项目不是传统 Vue 单页应用，也不是在小程序中嵌入 H5。开发时编写一套 Vue 单文件组件，UniApp 编译器根据目标平台生成不同产物：

```text
src 中的 Vue / TypeScript / SCSS
                  │
         UniApp CLI 编译器
          ┌───────┴────────┐
          │                │
      H5 构建           微信小程序构建
          │                │
  HTML/CSS/JavaScript   WXML/WXSS/JavaScript
          │                │
       浏览器          微信小程序运行时
```

因此，“一套代码多端运行”主要依靠编译器和 UniApp 运行时完成，并不代表 H5 与小程序拥有完全相同的运行环境。

## 2. UniApp CLI 是什么

本项目是 **UniApp CLI 工程**，通过 pnpm 安装依赖并从命令行编译，不依赖 HBuilderX 内置的项目编译器。

核心依赖是：

```json
{
  "@dcloudio/uni-app": "3.0.0-4080420251103001",
  "@dcloudio/vite-plugin-uni": "3.0.0-4080420251103001",
  "vite": "5.2.8"
}
```

三者的关系：

- `@dcloudio/uni-app`：提供 UniApp 运行时、生命周期和跨端 API。
- `@dcloudio/vite-plugin-uni`：接入 Vite，识别 `pages.json`、条件编译、UniApp 组件和各平台构建规则。
- `vite`：负责开发服务器、模块处理和生产构建。

`vite.config.ts` 中通过以下代码启用 UniApp 编译能力：

```ts
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
})
```

CLI 工程的编译器版本跟随项目 `package.json` 和 `pnpm-lock.yaml`，不会因为开发者升级 HBuilderX 就自动改变。这有利于团队和 CI 使用同一套编译版本。

微信开发者工具在这个架构中只负责预览、调试和上传编译后的微信小程序产物，不负责直接编译 `src` 中的 Vue 源码。

## 3. 当前技术栈与版本

版本来自当前 `package.json`。带 `^` 的依赖实际安装版本以 `pnpm-lock.yaml` 为准。

| 技术           | 声明版本                 | 作用                                         |
| -------------- | ------------------------ | -------------------------------------------- |
| UniApp         | `3.0.0-4080420251103001` | 跨端框架和运行时                             |
| Vue            | `^3.4.21`                | 组件系统、响应式数据、组合式 API             |
| TypeScript     | `^5.4.5`                 | 类型检查和业务模型约束                       |
| Vite           | `5.2.8`                  | 开发服务器和构建工具                         |
| Pinia          | `^2.1.7`                 | 全局业务状态管理                             |
| Wot Design Uni | `^1.14.0`                | 跨端 UI 组件库                               |
| SCSS / Sass    | `^1.101.0`               | 样式预处理、变量和 Mixin                     |
| Vitest         | `^1.6.1`                 | 单元测试                                     |
| vue-tsc        | `^2.0.29`                | Vue SFC TypeScript 类型检查                  |
| ESLint         | `^10.7.0`                | 代码规范检查                                 |
| Prettier       | `^3.9.5`                 | 代码格式化                                   |
| pnpm           | 9+                       | 包管理器，项目使用 `pnpm-lock.yaml` 锁定依赖 |
| Node.js        | 20+                      | CLI、Vite 和开发脚本运行环境                 |

项目的 `@dcloudio/uni-h5`、`@dcloudio/uni-mp-weixin` 等包与 `@dcloudio/uni-app` 使用完全相同的固定版本。升级 UniApp 时应整组升级，不能只升级其中一个平台包。

## 4. H5 如何启动和编译

### 4.1 开发启动

```bash
pnpm dev:h5
```

该命令实际执行：

```bash
uni
```

没有传入 `-p` 时，本项目默认目标是 H5。执行过程是：

1. `pnpm` 从本项目 `node_modules` 中找到 `uni` CLI。
2. UniApp 的 Vite 插件读取 `src/pages.json`、`src/manifest.json` 和 Vue 源码。
3. Vite 启动 H5 开发服务器。
4. 浏览器加载编译后的 H5 应用。
5. 保存源码后由 Vite 进行热更新。

H5 开发服务器地址以终端实际输出为准，通常是 `http://localhost:5173`。

### 4.2 生产构建

```bash
pnpm build:h5
```

生产文件输出到：

```text
dist/build/h5
```

`vite.config.ts` 当前配置：

```ts
base: '/eidolonh5/'
```

这表示生产 H5 资源默认按 `/eidolonh5/` 子路径部署。如果将产物直接部署到域名根目录，资源地址可能不正确；修改部署路径时需要同步修改 `base`。

H5 运行在浏览器中，因此会受到以下浏览器规则影响：

- CORS 跨域限制。
- 浏览器 Cookie 和缓存策略。
- 地址栏和移动端视口高度变化。
- 直接刷新和外链访问时的服务器路由配置。
- 浏览器历史记录与 UniApp 页面栈之间的差异。

## 5. 微信小程序如何启动和编译

### 5.1 开发编译

```bash
pnpm dev:mp-weixin
```

该命令实际执行：

```bash
uni -p mp-weixin
```

执行过程是：

1. `-p mp-weixin` 指定微信小程序为目标平台。
2. UniApp 编译器处理 Vue、TypeScript、SCSS、条件编译和页面配置。
3. `.vue` 文件被转换为微信小程序可识别的 WXML、WXSS、JS 和 JSON。
4. 开发产物持续写入 `dist/dev/mp-weixin`。
5. 源码保存后 CLI 增量重新编译。

然后在微信开发者工具中导入：

```text
dist/dev/mp-weixin
```

应保持 `pnpm dev:mp-weixin` 进程运行。微信开发者工具读取的是 `dist` 中不断更新的产物，而不是直接读取 `src`。

### 5.2 生产构建

```bash
pnpm build:mp-weixin
```

生产文件输出到：

```text
dist/build/mp-weixin
```

发布时应在微信开发者工具中打开生产产物，检查包体积、代码质量、合法域名和真机表现，再执行上传。

### 5.3 当前微信配置

微信平台配置位于 `src/manifest.json`：

```json
{
  "mp-weixin": {
    "appid": "",
    "setting": {
      "urlCheck": false
    },
    "usingComponents": true
  }
}
```

当前状态：

- 仓库中没有填写真实 AppID。
- 开发配置关闭了请求域名校验，便于本地联调。
- 正式体验版和上线版本仍需在微信公众平台配置 HTTPS 合法域名。
- `urlCheck: false` 不能替代正式域名配置，也不能证明真机网络请求一定可用。

## 6. 应用启动与页面运行机制

### 6.1 应用入口

入口文件是 `src/main.ts`：

```ts
export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)

  return { app }
}
```

这里的 `createSSRApp` 是 UniApp Vue 3 工程要求的创建方式，不表示当前项目已经实现服务端渲染。入口主要完成两件事：

- 创建 Vue 应用。
- 注册 Pinia。

### 6.2 App.vue

`src/App.vue` 是应用根组件，目前负责：

- 监听 UniApp 应用级 `onLaunch` 生命周期。
- 初始化应用 Store。
- 引入全局样式 `styles/global.scss`。
- 定义 Wot Design Uni 的主题色 CSS 变量。

应用级生命周期放在 `App.vue`，普通页面生命周期放在对应页面组件中。

### 6.3 页面注册

页面由 `src/pages.json` 注册，而不是通过 Vue Router 配置。

当前一级页面包括：

- 首页：`pages/home/index`
- 计划：`pages/plan/*`
- 想吃：`pages/eat/*`
- 想去：`pages/go/*`
- 内容创建：`pages/content/create`
- 回忆相册：`pages/memories/album`
- 调试页：`pages/debug/index`

`pages.json` 中的第一个页面是默认启动页。当前首页和计划页属于原生 TabBar 页面。

### 6.4 页面生命周期

项目页面使用从 `@dcloudio/uni-app` 导入的生命周期：

```ts
import { onLoad, onShow } from '@dcloudio/uni-app'
```

常用生命周期职责：

| 生命周期          | 适合处理的内容                         |
| ----------------- | -------------------------------------- |
| `onLoad`          | 读取页面 URL 参数、页面首次初始化      |
| `onShow`          | 页面每次重新可见时刷新数据             |
| `onReady`         | 页面首次渲染完成后的节点操作           |
| `onHide`          | 页面进入后台或被其他页面覆盖           |
| `onUnload`        | 页面出栈时清理资源                     |
| Vue `onMounted`   | 普通组件挂载逻辑，不等同于页面每次显示 |
| Vue `onUnmounted` | 组件计时器、监听器和副作用清理         |

TabBar 页面显示过一次后通常会保留在页面栈中，再次切换回来主要触发 `onShow`，不会重新执行全部组件初始化。

## 7. 项目代码架构

```text
src/
├── api/                    # HTTP 请求、上传和接口 DTO
├── assets/                 # 通过 import 引入、参与构建的图片
├── components/             # 通用组件和计划业务组件
│   └── plan/               # 计划模块组件
├── data/                   # 当前本地静态数据
├── pages/                  # 路由页面
├── static/                 # 固定路径静态资源、TabBar 图标
├── stores/                 # Pinia Store
├── styles/                 # 全局 SCSS 变量、Mixin 和基础样式
├── types/                  # TypeScript 领域类型
├── utils/                  # 日期、存储、平台、图片等工具
├── App.vue                 # 应用根组件和全局样式入口
├── main.ts                 # Vue 与 Pinia 创建入口
├── manifest.json           # 应用和平台配置
├── pages.json              # 页面、窗口和 TabBar 配置
└── uni.scss                # UniApp 全局 SCSS 变量入口
```

### 7.1 页面层 `pages/`

页面负责：

- 读取路由参数。
- 组合业务组件。
- 调用 Store action。
- 管理仅属于当前页面的表单、弹层和按钮状态。
- 调用导航、Toast、Modal 等界面 API。

页面不应该重复实现请求协议或跨页面业务状态流转。

### 7.2 组件层 `components/`

项目同时存在两类组件：

- 通用布局组件，如 `BasePage`、`CustomNavbar`。
- 业务组件，如 `components/plan/` 下的计划卡片、日期选择和编辑器。

Vue 组件主要使用：

- `<script setup lang="ts">`
- `defineProps`
- `defineEmits`
- `ref` / `computed`
- scoped SCSS

`CustomNavbar` 已集中处理微信状态栏和胶囊按钮尺寸，页面不应再次各自计算导航高度。

### 7.3 状态层 `stores/`

Pinia 在 `main.ts` 中全局安装。目前主要 Store：

- `app.ts`：应用初始化等全局状态。
- `foods.ts`：想吃列表、访问状态和列表派生数据。
- `places.ts`：想去列表、访问状态和列表派生数据。
- `plans.ts`：计划列表、状态流转、计划项目编辑。

典型数据流：

```text
页面 onLoad / onShow / 用户操作
              ↓
        Pinia Store action
              ↓
          api 请求函数
              ↓
             后端
              ↓
      Store 更新响应式状态
              ↓
       页面和组件自动更新
```

Pinia Store 保存跨页面共享的业务数据。页面内部的输入框内容、弹层开关和提交中状态仍保留在页面组件中。

### 7.4 API 层 `api/`

`src/api/index.ts` 提供统一的泛型请求函数：

```ts
request<T>({
  url,
  method,
  data,
})
```

当前请求层负责：

- 拼接 `VITE_API_BASE_URL`。
- 使用 `uni.request`，同时兼容 H5 和小程序。
- 按 HTTP 状态码判断成功与失败。
- 将错误转换为 `ApiError`。
- 默认使用 Toast 展示请求失败。

`content.ts` 和 `plans.ts` 还使用 `uni.uploadFile` 处理 multipart 文件上传。上传 API 与普通 `uni.request` 不同，响应正文需要手动 `JSON.parse`。

当前请求层尚未包含完整登录 Token 注入、401 处理、请求取消和统一上传封装，这属于后续接入正式用户体系时需要扩展的位置。

### 7.5 类型层 `types/`

业务类型按领域拆分：

- `common.ts`
- `food.ts`
- `place.ts`
- `plan.ts`
- `memory.ts`

接口输入输出类型主要定义在对应 `api` 文件中，页面展示使用的领域类型放在 `types/`。这种拆分可以避免页面直接依赖后端的所有原始字段。

### 7.6 工具层 `utils/`

目前包含：

- `platform.ts`：编译期与运行时平台识别。
- `storage.ts`：对 `uni.setStorageSync/getStorageSync` 的安全封装。
- `planDate.ts`：计划日期解析、格式化和倒计时。
- `planPhotos.ts`、`planRecordGallery.ts`：计划图片相关纯逻辑。

日期、排序、图片转换等纯逻辑适合留在 `utils/`，便于使用 Vitest 直接测试，不依赖小程序运行时。

## 8. 配置文件分别控制什么

| 文件                | 作用                                | 修改后通常需要做什么             |
| ------------------- | ----------------------------------- | -------------------------------- |
| `package.json`      | 依赖和开发/构建命令                 | 重新安装依赖，必要时重启开发进程 |
| `pnpm-lock.yaml`    | 锁定实际依赖版本                    | 与 `package.json` 一起提交       |
| `vite.config.ts`    | Vite 插件、H5 base、别名、SCSS 注入 | 重启开发进程                     |
| `src/manifest.json` | AppID、平台能力、应用版本和平台设置 | 重新编译目标平台                 |
| `src/pages.json`    | 页面注册、窗口样式、TabBar、分包    | 重新编译并检查导航               |
| `src/main.ts`       | 创建 Vue 应用和安装插件             | 重新运行应用                     |
| `src/App.vue`       | 应用生命周期和全局样式              | 检查所有页面                     |
| `.env.*`            | API 地址等环境配置                  | 重启 Vite/UniApp CLI             |
| `tsconfig.json`     | TypeScript 类型和 `@/` 路径         | 重新运行类型检查                 |
| `vitest.config.ts`  | 单元测试环境和别名                  | 重新运行测试                     |

### 环境变量

当前声明：

```env
VITE_API_BASE_URL=http://localhost:3000
```

代码通过以下方式读取：

```ts
import.meta.env.VITE_API_BASE_URL
```

注意：

- 修改 `.env.development` 或 `.env.production` 后需要重启开发进程。
- `VITE_*` 会编译进前端产物，只能保存公开配置，不能保存数据库密码、私钥或其他秘密。
- H5 使用 `localhost` 可以访问本机服务；手机上的小程序使用 `localhost` 时指向手机自身。

## 9. UI 与样式体系

### 9.1 Wot Design Uni

项目在 `pages.json` 中配置了 Easycom：

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
    }
  }
}
```

因此模板中可以直接使用：

```vue
<wd-action-sheet />
<wd-img-cropper />
```

不需要在每个页面手动 import 这些 `wd-*` 组件。主题色在 `App.vue` 中通过 `--wot-color-theme` 设置。

### 9.2 SCSS

`vite.config.ts` 会向每个 SCSS 文件自动注入：

```scss
@import '@/styles/variables.scss';
```

因此组件可直接使用 `$color-primary` 等变量。公共卡片样式等可通过 `styles/mixins.scss` 手动导入。

样式层次：

- `App.vue`：全应用样式入口。
- `styles/global.scss`：`page`、`view`、`button` 等基础重置。
- `styles/variables.scss`：颜色、间距等设计变量。
- `styles/mixins.scss`：可复用 SCSS 片段。
- 组件 scoped style：组件私有样式。

### 9.3 `assets` 与 `static`

- `src/assets`：通过 TypeScript/Vue `import` 引入，交给 Vite 处理和生成资源 URL。
- `src/static`：通过 `/static/...` 固定路径访问，适合 TabBar 图标等必须保持明确路径的资源。

当前 `src/assets` 约 3.9 MB。微信小程序有包体积限制，后续增加大量业务图片时应优先使用对象存储/CDN，不能把所有内容图片都放进源码包。

## 10. 路由与导航

项目没有使用 Vue Router，统一使用 UniApp 页面路由。

| API                | 用途                           | 重要限制                          |
| ------------------ | ------------------------------ | --------------------------------- |
| `uni.navigateTo`   | 打开普通页面，当前页保留在栈中 | 不能打开 TabBar 页面              |
| `uni.redirectTo`   | 用新页面替换当前页             | 不能打开 TabBar 页面              |
| `uni.navigateBack` | 返回页面栈中的上一页           | H5 刷新或分享直达时可能没有上一页 |
| `uni.switchTab`    | 切换到 TabBar 页面             | URL 不能携带参数                  |
| `uni.reLaunch`     | 清空页面栈并打开目标页         | 可用于异常栈或入口兜底            |

`CustomNavbar` 的返回逻辑会先检查 `getCurrentPages()`：有上一页时返回，没有时切换到首页。这种兜底对 H5 刷新和小程序分享直达页面很重要。

## 11. 平台差异如何处理

### 11.1 优先使用 `uni.*`

公共代码使用：

- `uni.request`
- `uni.uploadFile`
- `uni.navigateTo`
- `uni.setStorageSync`
- `uni.chooseImage`
- `uni.showToast`

不要在公共业务代码中直接大量使用 `wx.*`，否则 H5 无法运行。只有微信独有且 UniApp 没有封装的能力才使用微信 API。

### 11.2 条件编译

当前项目已经使用：

```ts
// #ifdef H5
// 仅 H5 进入编译结果
// #endif

// #ifdef MP-WEIXIN
// 仅微信小程序进入编译结果
// #endif
```

模板中使用 HTML 注释：

```vue
<!-- #ifdef MP-WEIXIN -->
<view>仅微信小程序显示</view>
<!-- #endif -->
```

条件编译发生在构建阶段。适合处理无法统一的平台能力，不适合把普通业务逻辑复制成两套。

### 11.3 平台工具

`utils/platform.ts` 先通过条件编译确定目标平台，再通过 `uni.getSystemInfoSync()` 做运行时兜底，返回：

```ts
;'h5' | 'mp-weixin' | 'app' | 'unknown'
```

编译阶段已经能决定的功能优先使用条件编译；只有同一份构建产物需要根据运行设备变化时，才使用运行时判断。

## 12. H5 与小程序编码中的常见问题

### 12.1 不要假设存在 DOM

H5 有 `window`、`document` 和 DOM，小程序逻辑层没有。节点查询使用 `uni.createSelectorQuery()`，跨端组件不能依赖只支持浏览器的库。

当前 `tsconfig.json` 包含 `dom` 类型，ESLint 也允许 browser globals，因此 TypeScript 不一定能替你发现误用的 `window` 或 `document`。

### 12.2 页面生命周期和 Vue 生命周期不同

- 路由参数放 `onLoad`。
- 页面每次重新显示需要执行的逻辑放 `onShow`。
- 普通组件初始化使用 `onMounted`。
- 计时器和监听器在 `onUnmounted`/`onUnload` 清理。

不要把所有接口请求无条件放在 `onShow`。当前首页每次 `onShow` 会拉取想吃和想去列表，Store 已使用 `loading` 防止同一时刻重复请求，但后续还应根据业务决定是否需要缓存有效期。

### 12.3 网络环境不同

- H5 请求需要后端正确配置 CORS。
- 微信小程序正式请求需要 HTTPS 合法域名。
- H5 的 Cookie 行为不能直接假设与小程序相同。
- 真机不能通过 `localhost` 访问开发电脑服务，应使用局域网地址或可访问的测试域名。

### 12.4 上传响应需要单独处理

`uni.uploadFile` 的响应数据通常是字符串，即使服务端返回 JSON，也需要手动解析。还要同时判断：

- HTTP 状态码。
- JSON 是否可以解析。
- 响应是否包含预期字段。
- 临时文件是否仍然有效。

项目目前在 `api/content.ts` 和 `api/plans.ts` 中分别实现上传，继续增加上传场景前适合抽成统一封装。

### 12.5 自定义导航栏与安全区

所有页面在 `pages.json` 中使用 `navigationStyle: custom`，因此导航栏由项目自己绘制。

`CustomNavbar` 在微信端通过 `uni.getMenuButtonBoundingClientRect()` 读取胶囊位置，在 H5 使用默认 44px 导航高度。底部布局使用 `env(safe-area-inset-bottom)` 兼容全面屏安全区。

不要在新页面中重复写状态栏算法，也不要只靠固定 padding 猜测胶囊高度。

### 12.6 `100vh`、固定定位和 TabBar

- 移动 H5 的 `100vh` 会受到浏览器地址栏影响。
- `position: fixed` 的弹层要检查键盘、滚动穿透和安全区。
- 原生 TabBar 的层级不一定能靠提高弹层 `z-index` 覆盖。
- 调用 `uni.hideTabBar()` 后必须在关闭和组件卸载时恢复 `uni.showTabBar()`。

项目的邀请弹层和部分计划弹层已经处理 TabBar 隐藏，新弹层应复用同一原则。

### 12.7 日期解析

不要依赖 `new Date('YYYY-MM-DD')` 在所有运行环境中的隐式解析。项目的 `utils/planDate.ts` 会拆分年、月、日后构造本地日期，应继续统一使用该方式。

### 12.8 小程序包体积

当前页面全部在主包中，`pages.json` 尚未配置 `subPackages`。业务和本地图片继续增加后，需要关注：

- TabBar 页面必须留在主包。
- 低频详情和编辑页面可考虑分包。
- 内容图片使用 CDN 和缩略图。
- 每次生产构建检查微信开发者工具的包体积报告。

## 13. 测试与代码质量

项目已经配置 Vitest，测试文件位于 `src/**/*.spec.ts`，运行环境是 Node：

```bash
pnpm test
```

Node 测试环境适合测试纯函数、Store 和 API 数据转换，但不能直接验证微信小程序 UI 和平台 API。

完整检查命令：

```bash
pnpm type-check
pnpm test
pnpm exec eslint .
pnpm exec prettier --check .
pnpm build:h5
pnpm build:mp-weixin
```

各检查的作用：

| 命令                           | 检查内容                    |
| ------------------------------ | --------------------------- |
| `pnpm type-check`              | Vue 和 TypeScript 类型      |
| `pnpm test`                    | 纯业务逻辑和 Store/API 测试 |
| `pnpm exec eslint .`           | 代码问题和 Vue 规范         |
| `pnpm exec prettier --check .` | 格式一致性                  |
| `pnpm build:h5`                | H5 是否可以生产编译         |
| `pnpm build:mp-weixin`         | 微信小程序是否可以生产编译  |

H5 构建通过不代表微信小程序构建通过；微信开发者工具通过也不代表真机所有权限、网络和布局都正常。

## 14. 当前架构中需要特别知道的限制

这些是当前项目现状，不是迁移计划：

1. 微信 AppID 为空，仓库只能通过测试号、游客模式或开发者工具手动配置运行。
2. 微信请求域名检查在开发配置中被关闭，正式环境仍需配置合法域名。
3. H5 固定使用 `/eidolonh5/` 作为生产基础路径。
4. API 地址完全依赖 `VITE_API_BASE_URL`。
5. API 层已有通用请求和错误类型，但尚未建立完整登录鉴权体系。
6. 内容图片和计划图片存在两套上传实现。
7. 所有页面仍在主包，没有配置小程序分包。
8. `src/assets` 已有约 3.9 MB 图片，继续增加会影响小程序包体积。
9. 页面统一使用自定义导航栏，新增页面必须使用现有布局组件或遵循相同安全区规则。
10. 项目同时支持很多 UniApp 目标平台的构建脚本，但当前代码真正持续验证的重点是 H5 和微信小程序；“存在构建命令”不等于功能已经适配该平台。

## 15. 原生小程序开发者阅读本项目时的最小对照

这里只用于帮助理解当前架构，不展开迁移流程。

| 原生微信小程序          | 当前项目                                      |
| ----------------------- | --------------------------------------------- |
| `app.js`                | `App.vue` + `main.ts`                         |
| `app.json`              | `pages.json` + `manifest.json`                |
| `app.wxss`              | `App.vue` + `styles/global.scss` + `uni.scss` |
| WXML                    | Vue 文件的 `<template>`                       |
| WXSS                    | Vue 文件的 `<style lang="scss">`              |
| `Page.data` / `setData` | `ref`、`reactive`、`computed`                 |
| `Page` 生命周期         | `@dcloudio/uni-app` 的 `onLoad/onShow/...`    |
| `Component.properties`  | `defineProps`                                 |
| `triggerEvent`          | `defineEmits`                                 |
| `getApp().globalData`   | Pinia Store                                   |
| `wx.request`            | `api/` 中基于 `uni.request` 的封装            |
| `wx.setStorageSync`     | `utils/storage.ts`                            |
| 微信页面路径            | `pages.json` 注册的 UniApp 页面路径           |

## 16. 常用命令速查

```bash
# 安装依赖
pnpm install

# H5 开发
pnpm dev:h5

# 微信小程序监听编译
pnpm dev:mp-weixin

# H5 生产构建
pnpm build:h5

# 微信小程序生产构建
pnpm build:mp-weixin

# 类型、测试、规范
pnpm type-check
pnpm test
pnpm exec eslint .
pnpm exec prettier --check .
```

构建产物：

```text
dist/dev/mp-weixin    # 微信小程序开发产物
dist/build/mp-weixin  # 微信小程序生产产物
dist/build/h5         # H5 生产产物
```

`dist/` 是生成目录，不应手动修改，也不应提交到 Git。

## 17. 参考资料

- [UniApp 组成和跨端原理](https://uniapp.dcloud.net.cn/tutorial/index.html)
- [UniApp 编译器](https://uniapp.dcloud.net.cn/tutorial/compiler)
- [条件编译](https://uniapp.dcloud.net.cn/tutorial/platform.html)
- [页面与生命周期](https://uniapp.dcloud.net.cn/tutorial/page)
- [`pages.json`、TabBar 与分包](https://uniapp.dcloud.net.cn/collocation/pages.html)
- [路由 API](https://uniapp.dcloud.net.cn/api/router.html)
- [`uni.request`](https://uniapp.dcloud.net.cn/api/request/request.html)
- [页面样式与布局](https://uniapp.dcloud.net.cn/tutorial/syntax-css.html)
