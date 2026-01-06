# 轻量级图像处理工具 v1.0

一款基于现代Web技术构建的轻量级、注重隐私的客户端图像处理应用，专为低配置VPS环境优化。

## ✨ 功能特性

- **纯客户端处理**: 所有图像处理均在您的浏览器中完成，**100%保护您的隐私**，无需上传任何文件。
- **轻量级处理**: 基于HTML5 Canvas API的高效图像处理，内存友好，适合各种设备。
- **现代化界面**: 采用基于Vue.js 3和Quasar Framework的现代化、响应式UI设计，美观易用。
- **批量处理**: 支持一次性处理多张图片，串行处理模式确保稳定性。
- **文件大小控制**: 智能的文件大小限制功能，可设置输出图片的最大文件大小（KB），自动优化图片质量以满足要求。
- **多格式支持**: 支持JPEG, PNG, WebP, GIF, BMP等多种主流图像格式。
- **低配置友好**: 优化内存使用，适合512MB内存的低配置VPS环境。
- **智能压缩**: 基于图像复杂度的智能质量优化算法。
- **TypeScript支持**: 完整的类型安全和开发体验。

## 🛠️ 技术栈

### 核心框架

- **Vue.js 3.5.18**: 组合式API，响应式前端框架
- **Quasar Framework 2.18.2**: Material Design UI组件库
- **TypeScript 5.9.2**: 类型安全开发
- **Pinia 2.3.1**: 现代状态管理

### 构建和工具

- **Vite 2.9.18**: 快速构建工具
- **Vitest 1.6.1**: 现代测试框架
- **ESLint 8.57.1**: 代码检查
- **Prettier 3.6.2**: 代码格式化

### 图像处理

- **HTML5 Canvas API**: 轻量级图像处理和渲染
- **FileReader API**: 本地文件读取
- **文件保存**: file-saver库支持

## 🚀 快速开始

### 在线体验

您可以直接访问该项目的GitHub主页，以获取最新的代码和文档：
[https://github.com/aqbjqtd/web-image-processor](https://github.com/aqbjqtd/web-image-processor)

### 开发环境

```bash
# 1. 克隆项目
git clone https://github.com/aqbjqtd/web-image-processor.git
cd web-image-processor

# 2. 安装依赖（需要Node.js >= 18）
npm install

# 3. 启动开发服务器
npm run dev
```

开发服务器启动后，访问：<http://localhost:9000>

### Docker部署

```bash
# 使用Docker Compose快速部署
docker-compose up -d

# 或者手动构建和运行
docker build -t web-image-processor .
docker run -d -p 9000:80 --name image-processor web-image-processor
```

部署后访问：<http://localhost:9000>

## 📦 主要命令

### 开发命令

- `npm run dev`: 启动开发服务器（端口9000）

- `npm run build`: 构建生产版本
- `npm run serve`: 本地预览构建版本

### 代码质量

- `npm run test`: 运行单元测试（Vitest）
- `npm run lint`: ESLint代码检查

- `npm run format`: Prettier代码格式化
- `npm audit`: 安全漏洞检查
- `npm outdated`: 依赖更新检查

### 版本管理

项目采用 **VERSION.txt 作为主版本源** 的版本管理方案，所有版本号变更通过 VERSION.txt 统一管理：

- `npm run version:sync`: 同步 VERSION.txt 到 package.json
- `npm run version:patch`: 升级补丁版本（例如：1.0.0 → 1.0.1）
- `npm run version:minor`: 升级次版本（例如：1.0.0 → 1.1.0）
- `npm run version:major`: 升级主版本（例如：1.0.0 → 2.0.0）

**版本管理最佳实践**：

1. **修改版本号**：直接编辑 `VERSION.txt` 文件
2. **同步到 package.json**：运行 `npm run version:sync`
3. **自动升级版本**：使用 `npm run version:patch/minor/major`
4. **提交到 Git**：确保 `VERSION.txt` 和 `package.json` 同时提交

**版本号格式**：遵循 [Semantic Versioning 2.0.0](https://semver.org/) 规范
- 格式：`MAJOR.MINOR.PATCH`（例如：1.0.0）
- MAJOR：不兼容的 API 修改
- MINOR：向下兼容的功能新增
- PATCH：向下兼容的 Bug 修复

### Docker命令

- `docker-compose up -d`: 启动容器服务
- `docker-compose down`: 停止并删除容器
- `docker-compose logs`: 查看容器日志

## 🏗️ 项目结构

```tree
src/
├── utils/
│   ├── ImageProcessor.ts    # 核心图像处理类（TypeScript）
│   └── WorkerManager.ts     # Web Worker管理器
├── pages/
│   ├── IndexPage.vue       # 主页面UI
│   ├── SimpleIndex.vue     # 简化版界面
│   └── MediumIndex.vue     # 中等复杂度界面
├── layouts/
│   └── MainLayout.vue      # 应用布局
├── types/
│   └── vue-shim.d.ts       # TypeScript声明文件
└── workers/

    └── imageWorker.ts      # 图像处理Web Worker
```

## 🔧 核心功能

### 图像处理引擎

- **智能压缩算法**: 基于图像复杂度分析的质量优化
- **多种调整模式**: 拉伸、保持比例填充、保持比例裁剪
- **内存管理**: 串行处理模式，避免内存溢出
- **格式优化**: 自动选择最佳图像格式

### 用户界面

- **响应式设计**: 适配桌面端和移动端
- **Material Design**: 现代化的UI设计风格
- **实时预览**: 处理进度和结果实时显示
- **批量操作**: 支持多文件同时处理

## 🔒 隐私与安全

我们郑重承诺，您的所有数据和图片都**不会离开您的电脑**。所有处理过程都在您的浏览器本地完成，我们不收集任何用户信息。这是一个完全值得信赖的客户端工具。

### 技术实现保障

- **零网络通信**：代码中无任何上传API调用，无`fetch`/`XMLHttpRequest`等网络请求
- **本地文件处理**：使用浏览器原生`FileReader API`直接读取本地文件到内存
- **客户端计算**：所有图像处理通过HTML5 Canvas在浏览器内存中完成
- **安全下载**：处理结果通过`URL.createObjectURL()`生成本地下载链接，无任何服务器交互
- **轻量级架构**：简化的代码结构，易于审计和验证安全性
- **TypeScript保障**：类型安全防止常见安全漏洞

## 🧪 测试覆盖

项目包含完整的测试套件：

- **单元测试**: ImageProcessor核心功能测试

- **类型检查**: TypeScript严格模式验证
- **代码检查**: ESLint规则验证
- **构建测试**: 生产环境构建验证

测试命令：`npm run test`

## 🚀 部署方案

### 1Panel平台部署

项目已适配1Panel平台，支持一键部署到VPS服务器。

### 传统VPS部署

适合512MB内存的低配置服务器，使用Nginx作为Web服务器。

### 容器化部署

Docker和Docker Compose支持，适合现代容器化部署环境。

## 📊 性能特性

- **构建大小**: ~290KB (gzip压缩后 ~110KB)
- **内存使用**: < 50MB（大文件批量处理）
- **处理速度**: 优化算法，快速处理
- **兼容性**: 支持现代浏览器ES2021+

## 🤝 贡献指南

我们欢迎任何形式的贡献！如果您有好的想法或建议，请随时提交Pull Request或开启一个Issue。

1. Fork项目
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'feat: Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交Pull Request

### 开发规范

- 使用TypeScript编写新功能
- 遵循ESLint和Prettier代码规范
- 为新功能添加单元测试
- 更新相关文档

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🔗 相关链接

- [部署文档](DEPLOY.md)
- [项目状态](CLAUDE_STATUS.md)
- [性能指标](CLAUDE_PERFORMANCE.md)
- [错误日志](CLAUDE_ERROR_LOG.md)
- [技术决策](CLAUDE_DECISIONS.md)
- [开发指导](CLAUDE.md)
- [GitHub仓库](https://github.com/aqbjqtd/web-image-processor)
- [问题反馈](https://github.com/aqbjqtd/web-image-processor/issues)
