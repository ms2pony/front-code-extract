const path = require('path');

/**
 * 统一的配置文件路径管理
 * 提供获取配置文件路径的统一方法
 */
class ConfigPath {
  /**
   * 获取配置文件的绝对路径
   * @param {string} fromDir - 调用文件所在目录的 __dirname
   * @returns {string} 配置文件的绝对路径
   */
  static getConfigPath(fromDir) {
    // 计算相对于调用文件的配置文件路径
    const configDir = path.resolve(__dirname);
    const configFile = path.join(configDir, 'cli-config.js');
    return configFile;
  }
  
  /**
   * 直接获取配置文件路径（推荐使用）
   * @returns {string} 配置文件的绝对路径
   */
  static get path() {
    return path.join(__dirname, 'cli-config.js');
  }
  
  /**
   * 加载配置文件并清除缓存
   * @returns {object} 配置对象
   */
  static loadConfig() {
    const configPath = this.path;
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