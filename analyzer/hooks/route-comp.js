/**
 * 路由组件处理器
 * 用于将路由文件中的组件导入替换为mock组件
 */

const RouteProcessor = require('../textproc/route-proc');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class RouteComponentProcessor {
  /**
   * 从dependency-report.json读取路由文件列表
   * @param {string} projectPath - 项目根路径
   * @returns {string[]} - 路由文件列表
   */
  static getRouteFilesFromReport(projectPath) {
    try {
      const reportPath = path.join(projectPath, '..', 'dependency-report.json');
      console.log(`依赖报告文件路径: ${reportPath}`);
      
      if (!fs.existsSync(reportPath)) {
        console.log('⚠ 未找到依赖报告文件，无法获取路由文件列表');
        return [];
      }
      
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(reportContent);
      
      if (report.routeStatistics && report.routeStatistics.routeFiles) {
        return report.routeStatistics.routeFiles.map(routeFile => routeFile.absolute);
      }
      
      return [];
    } catch (error) {
      console.error('读取路由文件列表失败:', error.message);
      logger.error('读取路由文件列表失败', error.message);
      return [];
    }
  }
  
  /**
   * 处理所有路由文件，替换组件导入为mock组件
   * @param {string} projectPath - 项目根路径
   * @param {string} mockComponentPath - mock组件的绝对路径
   */
  static processAllRoutes(projectPath, mockComponentPath) {
    console.log('\n🔄 开始处理路由文件...');
    
    // 从报告文件读取路由文件列表
    const routeFiles = this.getRouteFilesFromReport(projectPath);
    
    if (routeFiles.length === 0) {
      console.log('⚠ 未找到任何路由文件');
      return {
        total: 0,
        success: 0,
        failed: 0,
        results: []
      };
    }
    
    console.log(`📁 找到 ${routeFiles.length} 个路由文件`);
    
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    // 处理每个路由文件
    for (const routeFile of routeFiles) {
      // 将老项目路径转换为新项目路径
      // 从dependency-report.json读取老项目根路径
      const reportPath = path.join(projectPath, '..', 'dependency-report.json');
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(reportContent);
      const oldProjectPath = report.summary.projectRoot;
      
      // 计算相对于老项目的相对路径
      const relativePath = path.relative(oldProjectPath, routeFile);
      // 转换为新项目的绝对路径
      const newRouteFile = path.join(projectPath, relativePath);
      
      // 检查新项目中的文件是否存在
      if (!fs.existsSync(newRouteFile)) {
        console.log(`⚠ 新项目中不存在路由文件: ${path.basename(newRouteFile)}`);
        continue;
      }
      
      console.log(`🔧 处理路由文件: ${path.basename(newRouteFile)}`);
      
      const result = RouteProcessor.processRouteFile(newRouteFile, mockComponentPath);
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`  ✓ ${result.message}`);
      } else {
        failedCount++;
        console.log(`  ✗ ${result.message}: ${result.error}`);
        logger.error(`路由文件处理失败: ${routeFile}`, result.error);
      }
    }
    
    // 输出统计信息
    console.log('\n📊 路由文件处理统计:');
    console.log(`✓ 成功处理: ${successCount} 个文件`);
    console.log(`✗ 处理失败: ${failedCount} 个文件`);
    console.log(`📁 总计: ${routeFiles.length} 个文件`);
    
    return {
      total: routeFiles.length,
      success: successCount,
      failed: failedCount,
      results: results
    };
  }
  
  /**
   * 获取默认的mock组件路径
   * @param {string} projectPath - 项目根路径
   * @returns {string} - mock组件的绝对路径
   */
  static getDefaultMockComponentPath(projectPath) {
    return path.join(projectPath, 'src', 'mock', 'components', 'route-components.vue');
  }
}

module.exports = RouteComponentProcessor;