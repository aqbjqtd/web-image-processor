# 版本管理使用示例

## 实际场景示例

### 场景 1: 修复 Bug 并发布补丁版本

```bash
# 开发流程
$ vim src/components/ImageProcessor.vue
# ... 修复了一个 bug ...

# 升级补丁版本
$ npm run version:patch

ℹ️  开始升级 patch 版本...
✅ VERSION.txt 已升级: 1.0.0 → 1.0.1
✅ package.json 版本号已更新: 1.0.0 → 1.0.1
✅ 版本升级完成: 1.0.1
ℹ️  💡 提示: 请提交更改到 git 仓库

# 提交代码
$ git add .
$ git commit -m "fix: 修复图片处理内存泄漏问题"

# 创建标签并推送
$ git tag -a v1.0.1 -m "Release 1.0.1: 修复内存泄漏"
$ git push origin main
$ git push origin v1.0.1
```

### 场景 2: 添加新功能并发布次版本

```bash
# 开发流程
$ vim src/components/BatchProcessor.vue
# ... 添加了批量处理功能 ...

# 升级次版本
$ npm run version:minor

ℹ️  开始升级 minor 版本...
✅ VERSION.txt 已升级: 1.0.1 → 1.1.0
✅ package.json 版本号已更新: 1.0.1 → 1.1.0
✅ 版本升级完成: 1.1.0
ℹ️  💡 提示: 请提交更改到 git 仓库

# 提交代码
$ git add .
$ git commit -m "feat: 添加批量图片处理功能"

# 创建标签并推送
$ git tag -a v1.1.0 -m "Release 1.1.0: 批量处理功能"
$ git push origin main
$ git push origin v1.1.0
```

### 场景 3: 重大 API 重构并发布主版本

```bash
# 重构流程
$ vim src/utils/ImageProcessor.ts
# ... 完全重构了 API，不兼容旧版本 ...

# 升级主版本
$ npm run version:major

ℹ️  开始升级 major 版本...
✅ VERSION.txt 已升级: 1.1.0 → 2.0.0
✅ package.json 版本号已更新: 1.1.0 → 2.0.0
✅ 版本升级完成: 2.0.0
ℹ️  💡 提示: 请提交更改到 git 仓库

# 提交代码
$ git add .
$ git commit -m "breaking: 重构图像处理 API，提升性能"

# 创建标签并推送
$ git tag -a v2.0.0 -m "Release 2.0.0: 重大 API 重构"
$ git push origin main
$ git push origin v2.0.0
```

### 场景 4: 手动设置预发布版本

```bash
# 手动编辑 VERSION.txt
$ echo "1.0.0-beta.1" > VERSION.txt

# 同步到 package.json
$ npm run version:sync

ℹ️  开始同步版本号...
ℹ️  VERSION.txt 版本: 1.0.0-beta.1
✅ package.json 版本号已更新: 1.0.0 → 1.0.0-beta.1
✅ 版本号同步完成！

# 提交代码
$ git add VERSION.txt package.json
$ git commit -m "chore: 发布 beta 测试版本"
$ git tag -a v1.0.0-beta.1 -m "Beta 1: 测试版本"
$ git push origin main --tags
```

### 场景 5: 从预发布版本升级到稳定版本

```bash
# 当前版本: 1.0.0-beta.1

# 手动编辑 VERSION.txt
$ echo "1.0.0" > VERSION.txt

# 同步到 package.json
$ npm run version:sync

ℹ️  开始同步版本号...
ℹ️  VERSION.txt 版本: 1.0.0
✅ package.json 版本号已更新: 1.0.0-beta.1 → 1.0.0
✅ 版本号同步完成！

# 提交代码
$ git add VERSION.txt package.json
$ git commit -m "chore: 发布稳定版本 1.0.0"
$ git tag -a v1.0.0 -m "Release 1.0.0: 首个稳定版本"
$ git push origin main --tags
```

## 团队协作示例

### 开发者 A: 修复 Bug

```bash
# 开发者 A 的操作
$ git checkout -b fix/fix-memory-leak
$ vim src/utils/processor.ts
$ git commit -am "fix: 修复内存泄漏"
$ git push origin fix/fix-memory-leak

# 创建 Pull Request
# PR 标题: "fix: 修复图片处理内存泄漏问题"
```

### 维护者 B: 审核并合并

```bash
# 维护者 B 的操作
$ git checkout main
$ git pull origin main
$ git merge fix/fix-memory-leak

# 升级版本号
$ npm run version:patch

ℹ️  开始升级 patch 版本...
✅ VERSION.txt 已升级: 1.0.0 → 1.0.1
✅ package.json 版本号已更新: 1.0.0 → 1.0.1
✅ 版本升级完成: 1.0.1

# 提交并发布
$ git commit -am "chore: bump version to 1.0.1"
$ git tag -a v1.0.1 -m "Release 1.0.1: 修复内存泄漏"
$ git push origin main
$ git push origin v1.0.1
```

## CI/CD 集成示例

### GitHub Actions 工作流

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Check version sync
        run: |
          VERSION=$(cat VERSION.txt)
          PACKAGE_VERSION=$(node -p "require('./package.json').version")
          if [ "$VERSION" != "$PACKAGE_VERSION" ]; then
            echo "❌ Error: VERSION.txt and package.json version mismatch"
            echo "VERSION.txt: $VERSION"
            echo "package.json: $PACKAGE_VERSION"
            exit 1
          fi
          echo "✅ Version sync check passed: $VERSION"

      - name: Create Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: Release ${{ github.ref_name }}
          draft: false
          prerelease: ${{ contains(github.ref, 'beta') || contains(github.ref, 'alpha') }}
```

## 版本回退示例

### 回退到上一个版本

```bash
# 查看版本历史
$ git log --oneline VERSION.txt
a1b2c3d chore: bump version to 1.0.3
d4e5f6g chore: bump version to 1.0.2
h7i8j9k chore: bump version to 1.0.1

# 回退到 1.0.2
$ git checkout d4e5f6g -- VERSION.txt package.json
$ git commit -m "revert: 回退版本到 1.0.2"
```

### 热修复版本（Hotfix）

```bash
# 在稳定版本上创建热修复分支
$ git checkout -b hotfix/v1.0.3 v1.0.2

# 修复紧急 bug
$ vim src/utils/processor.ts
$ git commit -am "fix: 紧急修复严重 bug"

# 升级版本号
$ npm run version:patch

# 合并回主分支
$ git checkout main
$ git merge hotfix/v1.0.3

# 发布热修复版本
$ git tag -a v1.0.3 -m "Hotfix: 修复严重 bug"
$ git push origin main --tags
```

## 版本检查脚本示例

### 检查版本是否同步

```bash
#!/bin/bash
# check-version-sync.sh

VERSION=$(cat VERSION.txt)
PACKAGE_VERSION=$(node -p "require('./package.json').version")

if [ "$VERSION" != "$PACKAGE_VERSION" ]; then
  echo "❌ Error: VERSION.txt and package.json version mismatch"
  echo "VERSION.txt: $VERSION"
  echo "package.json: $PACKAGE_VERSION"
  exit 1
fi

echo "✅ Version sync check passed: $VERSION"
exit 0
```

### 使用检查脚本

```bash
$ chmod +x check-version-sync.sh
$ ./check-version-sync.sh
✅ Version sync check passed: 1.0.0
```

## 常用 Git 命令

### 查看版本历史

```bash
# 查看 VERSION.txt 的提交历史
$ git log --oneline VERSION.txt

# 查看特定文件的版本变更
$ git log -p VERSION.txt

# 查看版本标签
$ git tag -l
```

### 比较版本差异

```bash
# 比较两个版本之间的差异
$ git diff v1.0.0 v1.1.0

# 查看特定版本的文件
$ git show v1.0.0:VERSION.txt
```

### 删除错误的标签

```bash
# 删除本地标签
$ git tag -d v1.0.0

# 删除远程标签
$ git push origin :refs/tags/v1.0.0
```

## 最佳实践总结

### 发布前检查清单

- [ ] 运行 `npm run version:sync` 确保版本同步
- [ ] 运行 `npm test` 确保测试通过
- [ ] 运行 `npm run lint` 确保代码质量
- [ ] 更新 CHANGELOG.md（如果有）
- [ ] 创建 Git Tag
- [ ] 推送到远程仓库
- [ ] 创建 GitHub Release

### 版本号规范

| 变更类型 | 版本号升级 | 示例 | 说明 |
|---------|-----------|------|------|
| Bug 修复 | PATCH | 1.0.0 → 1.0.1 | 向后兼容的问题修复 |
| 新功能 | MINOR | 1.0.0 → 1.1.0 | 向后兼容的功能新增 |
| 破坏性变更 | MAJOR | 1.0.0 → 2.0.0 | 不兼容的 API 修改 |
| 预发布版 | -PRERELEASE | 1.0.0-alpha.1 | Alpha/Beta/RC 版本 |

---

**这些示例涵盖了实际开发中的常见场景，可以根据项目需求灵活应用。**
