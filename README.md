# 轻量级图像处理工具 v3.0

一款基于现代Web技术构建的轻量级、注重隐私的客户端图像处理应用，专为低配置VPS环境优化。

## ✨ 功能特性

- **纯客户端处理**: 所有图像处理均在您的浏览器中完成，**100%保护您的隐私**，无需上传任何文件。
- **轻量级处理**: 基于HTML5 Canvas API的高效图像处理，内存友好，适合各种设备。
- **现代化界面**: 采用基于Vue.js 3和Quasar Framework的现代化、响应式UI设计，美观易用。
- **批量处理**: 支持一次性处理多张图片，串行处理模式确保稳定性。
- **文件大小控制**: 智能的文件大小限制功能，可设置输出图片的最大文件大小（KB），自动优化图片质量以满足要求。
- **多格式支持**: 支持JPEG, PNG, WebP, GIF, BMP等多种主流图像格式。
- **低配置友好**: 优化内存使用，适合512MB内存的低配置VPS环境。

## 🛠️ 技术栈

- **前端框架**: Vue.js 3 + Quasar Framework
- **构建工具**: Vite
- **测试框架**: Vitest
- **图像处理**: HTML5 Canvas API
- **文件处理**: FileReader API

## 🚀 快速开始

### 在线体验

您可以直接访问该项目的GitHub主页，以获取最新的代码和文档：
[https://github.com/aqbjqtd/web-image-processor](https://github.com/aqbjqtd/web-image-processor)

### 开发环境

```bash
# 1. 克隆项目
git clone https://github.com/aqbjqtd/web-image-processor.git
cd web-image-processor

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

开发服务器启动后，访问：http://localhost:9000

## 📦 主要命令

- `npm run dev`: 启动开发服务器（端口9000）
- `npm run build`: 构建生产版本
- `npm run serve`: 本地预览构建版本
- `npm run test`: 运行单元测试（Vitest）
- `npm run lint`: ESLint代码检查
- `npm run format`: Prettier代码格式化

## 🔒 隐私与安全

我们郑重承诺，您的所有数据和图片都**不会离开您的电脑**。所有处理过程都在您的浏览器本地完成，我们不收集任何用户信息。这是一个完全值得信赖的客户端工具。

### 技术实现保障

- **零网络通信**：代码中无任何上传API调用，无`fetch`/`XMLHttpRequest`等网络请求
- **本地文件处理**：使用浏览器原生`FileReader API`直接读取本地文件到内存
- **客户端计算**：所有图像处理通过HTML5 Canvas在浏览器内存中完成
- **安全下载**：处理结果通过`URL.createObjectURL()`生成本地下载链接，无任何服务器交互
- **轻量级架构**：简化的代码结构，易于审计和验证安全性

## 🤝 贡献指南

我们欢迎任何形式的贡献！如果您有好的想法或建议，请随时提交Pull Request或开启一个Issue。

1. Fork项目
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'feat: Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。
