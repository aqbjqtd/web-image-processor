# 版本管理指南 (VERSION Management)

## 概述

本项目采用 **VERSION.txt 作为主版本源** 的版本管理方案，确保版本号的一致性和可追溯性。

## 核心原则

1. **单一真相源**：`VERSION.txt` 是项目的唯一版本号来源
2. **自动化同步**：通过 npm scripts 自动同步到 `package.json`
3. **语义化版本**：严格遵循 [Semantic Versioning 2.0.0](https://semver.org/) 规范
4. **Git 跟踪**：`VERSION.txt` 必须提交到 Git 仓库

## 版本号格式

### 标准 Semver 格式

```
MAJOR.MINOR.PATCH

示例：
- 1.0.0  → 初始版本
- 1.0.1  → Bug 修复
- 1.1.0  → 新功能（向后兼容）
- 2.0.0  → 重大变更（不兼容）
```

### 版本号规则

| 版本号类型 | 规则 | 示例 |
|-----------|------|------|
| **MAJOR** | 不兼容的 API 修改 | 1.0.0 → 2.0.0 |
| **MINOR** | 向后兼容的功能新增 | 1.0.0 → 1.1.0 |
| **PATCH** | 向后兼容的 Bug 修复 | 1.0.0 → 1.0.1 |

### 预发布版本（可选）

```
1.0.0-alpha.1   → Alpha 版本
1.0.0-beta.1    → Beta 版本
1.0.0-rc.1      → Release Candidate
```

## 使用方法

### 方法 1: 使用 npm scripts（推荐）

#### 同步版本号

当你手动修改了 `VERSION.txt` 后，需要同步到 `package.json`：

```bash
# 1. 编辑 VERSION.txt
echo "1.0.1" > VERSION.txt

# 2. 同步到 package.json
npm run version:sync
```

#### 自动升级版本

```bash
# 升级补丁版本（Bug 修复）
npm run version:patch    # 1.0.0 → 1.0.1

# 升级次版本（新功能）
npm run version:minor    # 1.0.0 → 1.1.0

# 升级主版本（重大变更）
npm run version:major    # 1.0.0 → 2.0.0
```

### 方法 2: 手动编辑（不推荐）

```bash
# 1. 编辑 VERSION.txt
vim VERSION.txt

# 2. 运行同步脚本
node scripts/sync-version.js
```

## 工作流程

### 发布新版本流程

```bash
# 1. 升级版本号（根据变更类型选择）
npm run version:patch    # 或 version:minor, version:major

# 2. 查看变更
git diff

# 3. 提交变更
git add VERSION.txt package.json
git commit -m "chore: bump version to x.x.x"

# 4. 创建 Git Tag（可选但推荐）
git tag -a v1.0.1 -m "Release version 1.0.1"

# 5. 推送到远程
git push origin main
git push origin v1.0.1

# 6. 发布到 npm（如果需要）
npm publish
```

### 开发流程

```bash
# 1. 开发新功能
git checkout -b feature/new-feature

# 2. 完成开发后合并到主分支
git checkout main
git merge feature/new-feature

# 3. 根据变更类型升级版本
npm run version:minor    # 或 version:patch

# 4. 提交并发布
git add VERSION.txt package.json
git commit -m "chore: bump version to x.x.x"
```

## 同步脚本详解

### 脚本功能

`scripts/sync-version.js` 提供以下功能：

1. **版本号验证**：检查版本号格式是否符合 Semver 规范
2. **自动同步**：将 `VERSION.txt` 的版本号同步到 `package.json`
3. **版本升级**：自动计算并升级版本号（patch/minor/major）
4. **友好输出**：彩色日志输出，清晰显示操作结果

### 脚本参数

```bash
# 同步版本号
node scripts/sync-version.js

# 升级版本号
node scripts/sync-version.js bump [patch|minor|major]
```

## 版本号决策树

```
是否包含破坏性变更？
├─ 是 → MAJOR (1.0.0 → 2.0.0)
└─ 否 → 是否添加新功能？
    ├─ 是 → MINOR (1.0.0 → 1.1.0)
    └─ 否 → PATCH (1.0.0 → 1.0.1)
```

## 常见问题

### Q1: 为什么要用 VERSION.txt 而不是直接修改 package.json？

**A**: VERSION.txt 的优势：
- 简洁明了，一目了然
- 便于脚本读取和处理
- 支持跨平台版本管理
- 可以独立于 npm 生态系统使用

### Q2: 如果忘记同步会怎样？

**A**:
- `package.json` 中的版本号会过期
- 建议在每次发布前运行 `npm run version:sync`
- 可以在 CI/CD 流程中自动检查版本同步

### Q3: 如何回退版本号？

**A**:
```bash
# 方法 1: 直接编辑 VERSION.txt
echo "1.0.0" > VERSION.txt
npm run version:sync

# 方法 2: 使用 Git
git checkout HEAD~1 -- VERSION.txt package.json
```

### Q4: 预发布版本如何管理？

**A**:
```bash
# 手动编辑 VERSION.txt
echo "1.0.0-beta.1" > VERSION.txt
npm run version:sync

# 脚本会自动验证格式并同步
```

## 最佳实践

### ✅ 推荐做法

1. **始终通过 VERSION.txt 修改版本号**
   ```bash
   echo "1.0.1" > VERSION.txt
   npm run version:sync
   ```

2. **使用 npm scripts 升级版本**
   ```bash
   npm run version:patch
   ```

3. **及时提交到 Git**
   ```bash
   git add VERSION.txt package.json
   git commit -m "chore: bump version"
   ```

4. **创建 Git Tag**
   ```bash
   git tag -a v1.0.1 -m "Release 1.0.1"
   ```

### ❌ 不推荐做法

1. **直接修改 package.json 的版本号**
   ```bash
   # ❌ 错误：破坏单一真相源原则
   vim package.json
   ```

2. **使用 npm version 命令**
   ```bash
   # ❌ 错误：绕过 VERSION.txt
   npm version patch
   ```

3. **忘记同步 VERSION.txt**
   ```bash
   # ❌ 错误：导致版本号不一致
   echo "1.0.1" > VERSION.txt
   # 忘记运行 npm run version:sync
   ```

## 集成到 CI/CD

### GitHub Actions 示例

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check version sync
        run: |
          VERSION=$(cat VERSION.txt)
          PACKAGE_VERSION=$(node -p "require('./package.json').version")
          if [ "$VERSION" != "$PACKAGE_VERSION" ]; then
            echo "Error: VERSION.txt and package.json version mismatch"
            exit 1
          fi

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.version.outputs.version }}
          release_name: Release ${{ steps.version.outputs.version }}
```

## 技术实现

### 版本号验证

脚本使用正则表达式验证版本号格式：

```javascript
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
```

支持的格式：
- ✅ `1.0.0`
- ✅ `1.0.0-beta.1`
- ✅ `1.0.0-alpha+001`
- ❌ `1.0`（缺少 PATCH）
- ❌ `v1.0.0`（包含前缀）

### 文件操作

```javascript
// 读取 VERSION.txt
const version = fs.readFileSync('VERSION.txt', 'utf-8').trim();

// 更新 package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
packageJson.version = version;
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
```

## 参考资源

- [Semantic Versioning 2.0.0](https://semver.org/)
- [npm version 文档](https://docs.npmjs.com/cli/v6/commands/npm-version)
- [Git 标签管理](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

## 更新日志

- **2025-01-07**: 初始版本管理方案实施
  - 创建 VERSION.txt (1.0.0)
  - 实现同步脚本 scripts/sync-version.js
  - 添加 npm scripts 命令
  - 完善文档
