// Volar 配置文件
// 参考: https://vuejs.org/guide/typescript/overview.html#volar-setup

module.exports = {
  // 语言服务器配置
  languageServer: {
    // 混合模式: 使用 TypeScript 插件
    hybridMode: true,
  },

  // 功能配置
  features: {
    // 自动完成引用
    autoCompleteRefs: true,

    // 诊断
    diagnostics: {
      // 检查模板语法
      templateSyntax: true,
      // 检查脚本语法
      scriptSyntax: true,
      // 检查样式语法
      styleSyntax: true,
    },

    // 代码片段
    codeLens: {
      // 显示 Pug 工具
      pugTools: false,
    },

    // 格式化
    format: {
      // 启用格式化
      enable: true,
    },
  },

  // TypeScript 插件配置
  typescript: {
    // TypeScript SDK 路径
    tsdk: './node_modules/typescript/lib',
  },

  // 文件关联
  fileAssociations: [
    {
      pattern: '**/*.vue',
      language: 'vue',
    },
    {
      pattern: '**/*.ts',
      language: 'typescript',
    },
    {
      pattern: '**/*.tsx',
      language: 'typescript',
    },
  ],

  // Quasar 组件自动导入
  autoImport: {
    // 启用 Quasar 组件自动导入
    enable: true,
  },
};
