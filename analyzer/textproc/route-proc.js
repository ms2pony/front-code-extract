/**
 * 路由文件处理工具
 * 用于替换路由文件中的组件导入为mock组件
 */

class RouteProcessor {
  /**
   * 替换路由文件中的组件导入
   * @param {string} routeContent - 路由文件内容
   * @param {string} mockComponentPath - mock组件的相对路径
   * @returns {string} - 处理后的路由文件内容
   */
  static replaceComponentImports(routeContent, mockComponentPath) {
    // 匹配 component: () => import(...) 的模式
    const importRegex = /component:\s*\(\)\s*=>\s*import\s*\([^)]*\)\s*['"`][^'"`)]*['"`]\s*\)/g;
    
    // 替换为mock组件导入
    const replacement = `component: () => import('${mockComponentPath}')`;
    
    return routeContent.replace(importRegex, replacement);
  }

  /**
   * 更精确的替换方法，保留注释
   * @param {string} routeContent - 路由文件内容
   * @param {string} mockComponentPath - mock组件的相对路径
   * @returns {string} - 处理后的路由文件内容
   */
  static replaceComponentImportsAdvanced(routeContent, mockComponentPath) {
    // 匹配更复杂的import模式，包括webpack注释
    const importRegex = /component:\s*\(\)\s*=>\s*import\s*\(\s*(?:\/\*[^*]*\*\/\s*)?['"`]([^'"`)]*)['"`]\s*\)/g;
    
    return routeContent.replace(importRegex, (match, importPath) => {
      // 保留原有的格式，只替换路径
      return `component: () => import('${mockComponentPath}')`;
    });
  }

  /**
   * 计算mock组件的相对路径
   * @param {string} routeFilePath - 路由文件的绝对路径
   * @param {string} mockComponentPath - mock组件的绝对路径
   * @returns {string} - 相对路径
   */
  static calculateRelativePath(routeFilePath, mockComponentPath) {
    const path = require('path');
    
    // 计算相对路径
    const relativePath = path.relative(path.dirname(routeFilePath), mockComponentPath);
    
    // 确保使用正斜杠（适用于import语句）
    return relativePath.replace(/\\/g, '/');
  }

  /**
   * 处理单个路由文件
   * @param {string} routeFilePath - 路由文件路径
   * @param {string} mockComponentPath - mock组件路径
   * @returns {Object} - 处理结果
   */
  static processRouteFile(routeFilePath, mockComponentPath) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      // 读取路由文件内容
      const routeContent = fs.readFileSync(routeFilePath, 'utf8');
      
      // 计算相对路径
      const relativePath = this.calculateRelativePath(routeFilePath, mockComponentPath);
      
      // 替换组件导入
      const processedContent = this.replaceComponentImportsAdvanced(routeContent, relativePath);
      
      // 写回文件
      fs.writeFileSync(routeFilePath, processedContent, 'utf8');
      
      return {
        success: true,
        filePath: routeFilePath,
        relativePath: relativePath,
        message: '路由文件处理成功'
      };
    } catch (error) {
      return {
        success: false,
        filePath: routeFilePath,
        error: error.message,
        message: '路由文件处理失败'
      };
    }
  }
}

module.exports = RouteProcessor;