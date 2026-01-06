# 版本管理快速开始指南

## 🚀 5分钟上手

### 1. 查看当前版本

```bash
cat VERSION.txt
# 输出: 1.0.0
```

### 2. 升级版本（3种方式）

#### 方式 A: 补丁版本（Bug 修复）
```bash
npm run version:patch
# 1.0.0 → 1.0.1
```

#### 方式 B: 次版本（新功能）
```bash
npm run version:minor
# 1.0.0 → 1.1.0
```

#### 方式 C: 主版本（重大变更）
```bash
npm run version:major
# 1.0.0 → 2.0.0
```

### 3. 同步版本（手动修改后）

```bash
# 步骤 1: 编辑 VERSION.txt
echo "1.0.1" > VERSION.txt

# 步骤 2: 同步到 package.json
npm run version:sync
```

### 4. 提交到 Git

```bash
git add VERSION.txt package.json
git commit -m "chore: bump version to 1.0.1"
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin main
git push origin v1.0.1
```

---

## 📋 常用命令速查

| 命令 | 功能 | 示例 |
|------|------|------|
| `npm run version:sync` | 同步版本号 | VERSION.txt → package.json |
| `npm run version:patch` | 升级补丁版本 | 1.0.0 → 1.0.1 |
| `npm run version:minor` | 升级次版本 | 1.0.0 → 1.1.0 |
| `npm run version:major` | 升级主版本 | 1.0.0 → 2.0.0 |
| `cat VERSION.txt` | 查看当前版本 | 显示当前版本号 |

---

## 🎯 版本号选择指南

```
┌─────────────────────────────────────────┐
│   什么类型的变更？                       │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
破坏性API变更    向后兼容？
    │                   │
    │              ┌────┴────┐
    │              │         │
    │          添加新功能  Bug修复
    │              │         │
    ▼              ▼         ▼
 MAJOR          MINOR     PATCH
2.0.0          1.1.0     1.0.1
```

---

## ✅ 完整工作流程

### 场景 1: 修复 Bug

```bash
# 1. 修复 bug
vim src/fix_bug.js

# 2. 升级补丁版本
npm run version:patch

# 3. 提交代码
git add .
git commit -m "fix: resolve image processing bug"

# 4. 发布
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin main --tags
```

### 场景 2: 添加新功能

```bash
# 1. 开发新功能
vim src/new_feature.js

# 2. 升级次版本
npm run version:minor

# 3. 提交代码
git add .
git commit -m "feat: add batch processing"

# 4. 发布
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin main --tags
```

### 场景 3: 重大重构

```bash
# 1. 重构代码
vim src/

# 2. 升级主版本
npm run version:major

# 3. 提交代码
git add .
git commit -m "breaking: refactor API architecture"

# 4. 发布
git tag -a v2.0.0 -m "Release 2.0.0"
git push origin main --tags
```

---

## 📝 示例输出

```bash
$ npm run version:patch

ℹ️  开始升级 patch 版本...
✅ VERSION.txt 已升级: 1.0.0 → 1.0.1
✅ package.json 版本号已更新: 1.0.0 → 1.0.1
✅ 版本升级完成: 1.0.1
ℹ️  💡 提示: 请提交更改到 git 仓库
```

---

## 🔍 验证版本同步

```bash
# 检查 VERSION.txt
cat VERSION.txt

# 检查 package.json
node -p "require('./package.json').version"

# 两者应该一致
```

---

## ⚠️ 常见错误

### 错误 1: 忘记同步

```bash
# ❌ 错误做法
echo "1.0.1" > VERSION.txt
git add VERSION.txt
git commit -m "bump version"
# package.json 版本号未更新！

# ✅ 正确做法
echo "1.0.1" > VERSION.txt
npm run version:sync
git add VERSION.txt package.json
git commit -m "bump version"
```

### 错误 2: 直接修改 package.json

```bash
# ❌ 错误做法
vim package.json  # 手动修改 version 字段
# VERSION.txt 未更新！

# ✅ 正确做法
npm run version:patch
# 自动更新两个文件
```

---

## 📚 更多信息

- [详细版本管理指南](VERSION_MANAGEMENT.md)
- [实施报告](VERSION_IMPLEMENTATION_REPORT.md)
- [Semantic Versioning 规范](https://semver.org/)

---

**最后更新**: 2025-01-07
**当前版本**: 1.0.0
