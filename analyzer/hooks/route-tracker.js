/**
 * 辅助route-comp，查看哪些文件引用了路由信息
 */

class RouteTracker {
  constructor() {
    // key: 引用路由文件的文件路径, value: 依赖的路由文件数组
    this.routeReferences = new Map();
  }

  /**
   * 判断文件路径是否为路由文件
   * @param {string} filePath - 文件的绝对路径
   * @returns {boolean} - 是否为路由文件
   */
  static isRouteFile(filePath) {
    if (!filePath) return false;
    
    // 标准化路径分隔符为正斜杠
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // 路由文件路径正则表达式 - 支持绝对路径
    const routePatterns = [
      /\/src\/router\//,                    // **/src/router/**
      /\/src\/modules\/[^/]+\/src\/routes\//,  // **/src/modules/xx/src/routes/**
      /\/src\/modules\/[^/]+\/routes\//      // **/src/modules/xx/routes/**
    ];
    
    return routePatterns.some(pattern => pattern.test(normalizedPath));
  }

  /**
   * 记录路由文件引用关系
   * @param {string} sourceFile - 引用路由文件的源文件路径
   * @param {string} routeFile - 被引用的路由文件路径
   */
  addRouteReference(sourceFile, routeFile) {
    if (!this.routeReferences.has(sourceFile)) {
      this.routeReferences.set(sourceFile, []);
    }
    
    const routes = this.routeReferences.get(sourceFile);
    if (!routes.includes(routeFile)) {
      routes.push(routeFile);
    }
  }

  /**
   * 获取指定文件引用的所有路由文件
   * @param {string} sourceFile - 源文件路径
   * @returns {string[]} - 引用的路由文件列表
   */
  getRouteReferences(sourceFile) {
    return this.routeReferences.get(sourceFile) || [];
  }

  /**
   * 获取所有路由引用关系
   * @returns {Map} - 完整的路由引用映射
   */
  getAllRouteReferences() {
    return this.routeReferences;
  }

  /**
   * 获取引用了路由文件的所有源文件
   * @returns {string[]} - 源文件路径列表
   */
  getSourceFiles() {
    return Array.from(this.routeReferences.keys());
  }

  /**
   * 获取被引用的所有路由文件
   * @returns {string[]} - 路由文件路径列表
   */
  getAllRouteFiles() {
    const routeFiles = new Set();
    for (const routes of this.routeReferences.values()) {
      routes.forEach(route => routeFiles.add(route));
    }
    return Array.from(routeFiles);
  }

  /**
   * 清空所有记录
   */
  clear() {
    this.routeReferences.clear();
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      totalSourceFiles: this.routeReferences.size,
      totalRouteFiles: this.getAllRouteFiles().length,
      totalReferences: Array.from(this.routeReferences.values())
        .reduce((sum, routes) => sum + routes.length, 0)
    };
  }
}

// 创建全局实例
const routeTracker = new RouteTracker();

module.exports = {
  RouteTracker,
  routeTracker
};
