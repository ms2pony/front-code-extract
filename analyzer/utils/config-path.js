const path = require('path');

/**
 * 统一的配置文件路径管理
 * 提供获取配置文件路径的统一方法
 */
class ConfigPath {
  /**
   * 直接获取cli配置文件路径（推荐使用）
   * @returns {string} 配置文件的绝对路径
   */
  static get cliPath() {
    return path.join(__dirname, '../config/cli-config.js');
  }

  /**
   * 存放脚手架的目录
   */
  static get scaffoldPath() {
    return path.join(__dirname, '../textproc/scaffold');
  }
  
  /**
   * 加载cli配置文件并清除缓存
   * @returns {object} 配置对象
   */
  static loadCliConfig() {
    const configPath = this.cliPath;
    try {
      // 清除缓存以确保获取最新配置
      delete require.cache[require.resolve(configPath)];
      return require(configPath);
    } catch (error) {
      console.warn('⚠️ 无法加载配置文件，使用默认配置:', error.message);
      return {};
    }
  }
}

module.exports = ConfigPath;