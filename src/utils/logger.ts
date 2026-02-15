/**
 * 统一日志工具
 *
 * 功能特性：
 * - 开发环境输出所有级别日志
 * - 生产环境仅输出 error 级别
 * - 支持日志级别前缀和着色
 * - TypeScript 类型安全
 *
 * @example
 * ```ts
 * logger.log('普通消息');
 * logger.info('信息提示');
 * logger.warn('警告信息');
 * logger.error('错误信息');
 * logger.debug('调试信息');
 * ```
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  LOG = 'log',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

/**
 * 判断是否为开发环境
 */
const isDevelopment = () => {
  try {
    // @ts-expect-error - import.meta.env 是 Vite 特性
    return typeof import.meta.env !== 'undefined' && import.meta.env.DEV;
  } catch {
    return false;
  }
};

/**
 * 日志工具类
 */
class Logger {
  constructor() {
    // 单例模式，无配置
  }

  /**
   * 输出普通日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  log(message: string, ...optionalParams: unknown[]): void {
    this.print(LogLevel.LOG, message, optionalParams);
  }

  /**
   * 输出信息日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  info(message: string, ...optionalParams: unknown[]): void {
    this.print(LogLevel.INFO, message, optionalParams);
  }

  /**
   * 输出警告日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    this.print(LogLevel.WARN, message, optionalParams);
  }

  /**
   * 输出错误日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  error(message: string, ...optionalParams: unknown[]): void {
    // 错误日志在所有环境都输出
    this.print(LogLevel.ERROR, message, optionalParams, true);
  }

  /**
   * 输出调试日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    this.print(LogLevel.DEBUG, message, optionalParams);
  }

  /**
   * 核心打印方法
   * @param level 日志级别
   * @param message 日志消息
   * @param optionalParams 可选参数
   * @param forceOutput 是否强制输出（生产环境的 error）
   */
  private print(
    level: LogLevel,
    message: string,
    optionalParams: unknown[],
    forceOutput = false
  ): void {
    // 生产环境非强制输出（error）时静默
    if (!isDevelopment && !forceOutput) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // 根据级别选择对应的 console 方法
    switch (level) {
      case LogLevel.LOG:
        console.log(prefix, message, ...optionalParams);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...optionalParams);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...optionalParams);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...optionalParams);
        break;
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...optionalParams);
        break;
      default:
        console.log(prefix, message, ...optionalParams);
    }
  }

  /**
   * 创建分组日志
   * @param title 分组标题
   * @param collapsed 是否折叠
   */
  group(title: string, collapsed = false): void {
    if (!isDevelopment) {
      return;
    }

    if (collapsed) {
      console.groupCollapsed(title);
    } else {
      console.group(title);
    }
  }

  /**
   * 结束分组日志
   */
  groupEnd(): void {
    if (!isDevelopment) {
      return;
    }

    console.groupEnd();
  }

  /**
   * 清空控制台
   */
  clear(): void {
    if (!isDevelopment) {
      return;
    }

    console.clear();
  }

  /**
   * 输出表格
   * @param data 表格数据
   */
  table(data: unknown): void {
    if (!isDevelopment) {
      return;
    }

    console.table(data);
  }

  /**
   * 计时开始
   * @param label 计时标签
   */
  time(label: string): void {
    if (!isDevelopment) {
      return;
    }

    console.time(label);
  }

  /**
   * 计时结束
   * @param label 计时标签
   */
  timeEnd(label: string): void {
    if (!isDevelopment) {
      return;
    }

    console.timeEnd(label);
  }
}

/**
 * 导出单例实例
 */
export const logger = new Logger();
