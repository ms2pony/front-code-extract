const { parseBarrel } = require('../parsers/parseBarrel');

class BarrelTracker {
  constructor() {
    // key: barrel文件路径, value: 符号到实际文件的映射
    this.barrelMappings = new Map();
  }
  
  /**
   * 判断文件是否为barrel文件（包含index.js）
   * @param {string} filePath - 文件路径
   * @returns {boolean}
   */
  static isBarrelFile(filePath) {
    if (!filePath) return false;
    return filePath.endsWith('/index.js') || filePath.endsWith('\\index.js');
  }
  
  /**
   * 解析barrel文件并获取符号映射
   * @param {string} barrelPath - barrel文件路径
   * @param {string|string[]} symbols - 导入的符号
   * @returns {Object} - 符号到文件路径的映射
   */
  resolveBarrelSymbols(barrelPath, symbols) {
    const cacheKey = `${barrelPath}:${Array.isArray(symbols) ? symbols.join(',') : symbols}`;
    
    if (this.barrelMappings.has(cacheKey)) {
      return this.barrelMappings.get(cacheKey);
    }
    
    const symbolMap = parseBarrel(barrelPath, symbols);
    this.barrelMappings.set(cacheKey, symbolMap);
    
    return symbolMap;
  }
  
  /**
   * 根据符号获取实际的文件路径
   * @param {string} barrelPath - barrel文件路径
   * @param {string} symbol - 导入的符号
   * @returns {string|null} - 实际的文件路径
   */
  getActualFilePath(barrelPath, symbol) {
    const symbolMap = this.resolveBarrelSymbols(barrelPath, symbol);
    return symbolMap[symbol] || null;
  }
  
  /**
   * 清空缓存
   */
  clear() {
    this.barrelMappings.clear();
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalBarrelFiles: this.barrelMappings.size,
      mappings: Array.from(this.barrelMappings.entries())
    };
  }
}

// 创建全局实例
const barrelTracker = new BarrelTracker();

module.exports = {
  BarrelTracker,
  barrelTracker
};