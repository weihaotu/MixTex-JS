# MixTex-JS

MixTex-JS 是一个基于 Electron 和 React 开发的跨平台 LaTeX 公式识别工具。原 [MixTeX-Latex-OCR](https://github.com/RQLuo/MixTeX-Latex-OCR)使用 tkinter 构建 UI，并通过 PyInstaller 打包，界面较为简易。MixTex-JS 的开发主要出于优化其界面设计考虑，推理性能方面未与原版进行系统比较（但可以确定的是，目前 Windows 端的 Transformers 库不支持 GPU 加速）。

## ✨ 特性

- 🚀 基于 Electron 构建，提供原生应用体验
<!-- - 🎯 支持快捷键触发截图识别 -->
- 📝 内置 LaTeX 公式预览
- 💾 本地保存识别历史
<!-- - 🔍 支持历史记录搜索 -->
- 🎨 现代化界面设计
<!-- - 🌈 支持自定义主题
- 📊 支持调试视图
- 🔄 支持快速重试识别 -->
- 📋 一键复制 LaTeX 代码

## 🛠️ 技术栈

- Electron
- React
- TypeScript
- ONNX Runtime
- Hugging Face Transformers
- Material-UI
- Styled Components
- Framer Motion

## 📦 安装

<!-- ### 从发布版本安装

1. 访问 [Releases](https://github.com/yourusername/mixtex-js/releases) 页面
2. 下载适用于您操作系统的安装包
3. 运行安装程序 -->

### 从源码构建

确保您的系统已安装 Node.js (>= 16.0.0) 和 Yarn。

```bash
# 克隆仓库
git clone https://github.com/weihaotu/mixtex-js.git
cd mixtex-js

# 安装依赖
yarn install

# 启动开发服务器
yarn dev

# 构建应用
yarn build
```

<!-- ## 🚀 使用方法

1. 启动应用后，它会在系统托盘中运行
2. 使用快捷键（默认为 `Ctrl+Shift+X`）或点击托盘图标来启动截图
3. 选择包含数学公式的区域
4. 等待识别完成，结果会自动显示在主窗口中
5. 点击复制按钮即可获取 LaTeX 代码 -->

## 🔄 与 Python 版本的区别

相比原版 MixTex，JS 版本有以下改进：

- 更现代化的用户界面
- 更好的系统集成体验
- 更强大的历史记录管理
- 更方便的快捷操作

## 📄 许可证

[MIT License](LICENSE)
