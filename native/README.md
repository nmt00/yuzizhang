# 玉子账 · Capacitor 原生壳

用 [Capacitor](https://capacitorjs.com/) 把现有 `qingzhang/` 前端复用成 Android / iOS 原生 App。没有另写一套界面，WebView 里仍然是同一份玉子账。

> 没有选 Tauri：当前主要目标是手机，Capacitor 可以直接复用现有 WebView 前端；Tauri 更适合需要 Rust 的桌面应用，且这台构建机没有 Rust/Android SDK。需要 Windows 桌面版时可以在 `tauri/` 里另做一套壳。

## 目录

```text
native/
├── capacitor.config.json   # appId / appName / webDir
├── package.json            # Capacitor 依赖和构建脚本
├── scripts/sync-web.js     # 把上一级前端复制到 native/www
├── resources/
│   ├── icon.png            # 1024 启动图标源图
│   └── splash.png          # 2732 启动图
├── www/                    # 生成目录，不提交
└── android/ ios/           # cap add 生成，不提交
```

主前端目录仍然是 `qingzhang/`，`native/` 是它里面的原生壳。修改前端后运行 `npm run prepare:web` 或 `npm run sync` 即可同步。

## 本地构建 Android

前置：

- Node.js 20+
- JDK 21
- Android Studio + Android SDK（安装 SDK Platform、Build-Tools、Platform-Tools）

```powershell
cd native
npm install
npm run prepare:web
npx cap add android
npx cap sync android
npm run open:android
```

在 Android Studio 里选择设备运行，或命令行构建 debug APK：

```powershell
cd native
npm run build:android
```

APK 路径：

```text
native/android/app/build/outputs/apk/debug/app-debug.apk
```

这个 APK 用 debug 签名，可以 sideload 安装；正式发布需要配置自己的 keystore 并构建 `assembleRelease`。

## 用 GitHub Actions 构建 APK

仓库里已经包含 `.github/workflows/android.yml`。把 `native/` 和 `.github/workflows/android.yml` 提交到 GitHub 后：

1. 打开仓库的 **Actions**。
2. 选择 **Build Android APK**。
3. 点击 **Run workflow**。
4. 构建完成后在该次运行底部下载 **yuzizhang-android-debug** artifact。

工作流使用 GitHub 托管的 Ubuntu、JDK 21 和 Android SDK，不需要本机安装 Android Studio。

## iOS

需要 macOS + Xcode：

```bash
cd native
npm install
npm run add:ios
npm run sync:ios
npm run open:ios
```

在 Xcode 里设置 Team / Bundle Identifier 后签名运行。iOS 不能像 Android 一样直接 sideload 未签名 IPA；需要 Apple Developer 签名或 TestFlight。

## 原生环境差异

- **数据迁移**：原生 WebView 的 localStorage 与浏览器/域名隔离。第一次使用时，从浏览器版「我的 → 导出完整备份」导出 JSON，再在原生 App「我的 → 导入备份」中导入。
- **云同步**：原生 WebView 的 origin 是 `https://localhost`（Android）或 `capacitor://localhost`（iOS）。`yuzi-cloud` 默认 CORS 已包含这些 origin；如果自定义后端，请设置：
  ```text
  ALLOWED_ORIGINS=https://nmt00.github.io,https://localhost,http://localhost,capacitor://localhost
  ```
  原生 WebView 的页面是安全上下文，调试时用 `http://127.0.0.1:8787` 会被 mixed content / ATS 阻止；请用 HTTPS 后端，或只在 Android 调试时临时设置 `"allowMixedContent": true`。
- **离线**：Web 资源已经打进 APK，不依赖 Service Worker；原生环境会跳过 Service Worker 注册。
- **文件导出**：原生环境优先使用 `@capacitor/filesystem` + `@capacitor/share` 调系统分享/保存面板；普通浏览器仍然走 Blob 下载。
- **更新**：网页版更新后，原生 App 需要重新构建 APK 才能拿到新前端；不能像 PWA 一样自动更新。
- **应用 ID**：`com.nmt00.yuzizhang`，可在 `capacitor.config.json` 修改；修改后 Android/iOS 工程需要重新生成。
- **图标/启动图**：`resources/` 已放猫咪图标和浅绿色启动图。可运行：
  ```bash
  npx capacitor-assets generate --android
  npx capacitor-assets generate --ios
  ```

## 签名与发布

Debug APK 只适合自己安装。发布版：

1. 生成 keystore（不要提交到仓库）：
   ```bash
   keytool -genkey -v -keystore yuzizhang-release.jks -alias yuzizhang -keyalg RSA -keysize 2048 -validity 10000
   ```
2. 按 Android Studio 的 **Generate Signed Bundle / APK** 配置签名。
3. 或把 keystore 放进 CI Secrets，在 Gradle 中注入 `RELEASE_STORE_FILE`、`RELEASE_STORE_PASSWORD`、`RELEASE_KEY_ALIAS`、`RELEASE_KEY_PASSWORD`。

## 当前限制

- 这台构建机没有 JDK/Android SDK/Rust，所以本地不能直接生成 APK；APK 由上面的 GitHub Actions 构建。
- 原生壳不会改变云同步后端的需求；没有公网 HTTPS 后端时，云同步仍然不可用。
- 原生 App 的备份导出依赖系统分享面板；如果目标设备没有可用的分享目标，仍可从网页版导出。
