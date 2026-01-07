#!/usr/bin/env node

/**
 * VERSION.txt 同步脚本
 *
 * 功能：
 * - 从 VERSION.txt 读取版本号
 * - 更新 package.json 的 version 字段
 * - 更新 package-lock.json
 * - 验证版本号格式
 */

const fs = require('fs');
const path = require('path');

// 版本号正则表达式（semver 格式）
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ 错误: ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Function removed as it's not being used
// function warn(message) {
//   log(`⚠️  ${message}`, 'yellow');
// }

/**
 * 验证版本号格式
 */
function validateVersion(version) {
  if (!version || typeof version !== 'string') {
    throw new Error('版本号必须是非空字符串');
  }

  const trimmedVersion = version.trim();

  if (!VERSION_REGEX.test(trimmedVersion)) {
    throw new Error(`无效的版本号格式: "${trimmedVersion}"，应符合 semver 格式 (例如: 1.0.0)`);
  }

  return trimmedVersion;
}

/**
 * 读取 VERSION.txt
 */
function readVersionTxt() {
  const versionTxtPath = path.join(__dirname, '..', 'VERSION.txt');

  if (!fs.existsSync(versionTxtPath)) {
    throw new Error(`VERSION.txt 文件不存在: ${versionTxtPath}`);
  }

  const version = fs.readFileSync(versionTxtPath, 'utf-8').trim();

  return validateVersion(version);
}

/**
 * 更新 package.json
 */
function updatePackageJson(newVersion) {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json 文件不存在: ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const oldVersion = packageJson.version;

  if (oldVersion === newVersion) {
    info(`package.json 版本号已经是 ${newVersion}，无需更新`);
    return false;
  }

  packageJson.version = newVersion;

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8'
  );

  success(`package.json 版本号已更新: ${oldVersion} → ${newVersion}`);
  return true;
}

/**
 * 升级版本号
 */
function bumpVersion(type) {
  const version = readVersionTxt();
  const parts = version.split('.').map((p, index) => {
    // 处理预发布版本标签（如 -beta.1）
    if (index === 2 && p.includes('-')) {
      return parseInt(p.split('-')[0], 10);
    }
    return parseInt(p, 10);
  });

  let major = parts[0];
  let minor = parts[1];
  let patch = parts[2];

  switch (type) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    default:
      throw new Error(`无效的升级类型: ${type}，应该是 major, minor 或 patch`);
  }

  const newVersion = `${major}.${minor}.${patch}`;

  // 更新 VERSION.txt
  const versionTxtPath = path.join(__dirname, '..', 'VERSION.txt');
  fs.writeFileSync(versionTxtPath, newVersion + '\n', 'utf-8');

  success(`VERSION.txt 已升级: ${version} → ${newVersion}`);

  return newVersion;
}

/**
 * 主函数
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'bump') {
      // 升级版本号
      const type = args[1] || 'patch';

      if (!['major', 'minor', 'patch'].includes(type)) {
        error(`无效的升级类型: ${type}`);
        process.exit(1);
      }

      info(`开始升级 ${type} 版本...`);
      const newVersion = bumpVersion(type);
      updatePackageJson(newVersion);

      success(`版本升级完成: ${newVersion}`);
      info('💡 提示: 请提交更改到 git 仓库');
    } else {
      // 同步版本号
      info('开始同步版本号...');

      const version = readVersionTxt();
      info(`VERSION.txt 版本: ${version}`);

      updatePackageJson(version);

      success('版本号同步完成！');
      info('💡 提示: 如需升级版本，请使用 npm run version:major/minor/patch');
    }
  } catch (err) {
    error(err.message);
    process.exit(1);
  }
}

// 运行主函数
main();
