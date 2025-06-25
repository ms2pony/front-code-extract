const { parseContext } = require('../parsers/parseContext');
const path = require('path');

class ContextTracker {
  constructor() {
    // key: context文件路径, value: 解析结果缓存
    this.contextMappings = new Map();
  }
  
  /**
   * 判断文件是否可能包含require.context
   * @param {string} filePath - 文件路径
   * @returns {boolean}
   */
  static isContextFile(filePath) {
    if (!filePath) return false;
    
    // 常见的context文件模式
    const contextPatterns = [
      /\/index\.js$/,           // index.js文件
      /\/install\.js$/,        // install.js文件
      /extension.*\/index\.js$/, // extension目录下的index.js
      /components?\/index\.js$/  // components目录下的index.js
    ];
    
    const normalizedPath = filePath.replace(/\\/g, '/');
    return contextPatterns.some(pattern => pattern.test(normalizedPath));
  }
  
  /**
   * 解析context文件并获取符号映射
   * @param {string} contextPath - context文件路径
   * @param {string|string[]} symbols - 导入的符号
   * @returns {Object} - 解析结果
   */
  resolveContextSymbols(contextPath, symbols) {
    const cacheKey = `${contextPath}:${Array.isArray(symbols) ? symbols.join(',') : symbols}`;
    
    if (this.contextMappings.has(cacheKey)) {
      return this.contextMappings.get(cacheKey);
    }
    
    const result = parseContext(contextPath, symbols);
    this.contextMappings.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * 根据符号获取实际的文件路径
   * @param {string} contextPath - context文件路径
   * @param {string} symbol - 导入的符号
   * @returns {string|null} - 实际的文件路径
   */
  getActualFilePath(contextPath, symbol) {
    const result = this.resolveContextSymbols(contextPath, symbol);
    return result.symbolToFileMap[symbol] || null;
  }
  
  /**
   * 获取Vue install文件列表
   * @param {string} contextPath - context文件路径
   * @returns {string[]} - Vue install文件路径列表
   */
  getVueInstallFiles(contextPath) {
    const result = this.resolveContextSymbols(contextPath, ['*']);
    return result.vueInstallFiles || [];
  }
  
  /**
   * 获取context类型
   * @param {string} contextPath - context文件路径
   * @returns {string} - context类型
   */
  getContextType(contextPath) {
    const result = this.resolveContextSymbols(contextPath, ['*']);
    return result.type;
  }
  
  /**
   * 清空缓存
   */
  clear() {
    this.contextMappings.clear();
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalContextFiles: this.contextMappings.size,
      mappings: Array.from(this.contextMappings.entries())
    };
  }
}

// 创建全局实例
const contextTracker = new ContextTracker();

module.exports = {
  ContextTracker,
  contextTracker
};