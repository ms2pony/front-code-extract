/**
 * 别名文件处理工具
 * 负责文件读取和写入操作
 */

const fs = require('fs');
const path = require('path');

class AliasFileHandler {
  /**
   * 从依赖报告中获取别名使用情况
   * @param {string} reportPath - 依赖报告文件路径
   * @returns {Object} - 别名使用情况对象
   */
  static getAliasUsageFromReport(reportPath) {
    try {
      const reportContent = fs.readFileSync(reportPath, 'utf-8');
      const report = JSON.parse(reportContent);
      return report.aliasStatistics?.aliasUsage || report.aliasUsage || {};
    } catch (error) {
      console.error('读取依赖报告失败:', error);
      return {};
    }
  }

  /**
   * 从resolver配置中获取别名定义
   * @param {string} resolverPath - resolver配置文件路径
   * @returns {Object} - 别名定义对象
   */
  static getAliasFromResolver(resolverPath) {
    try {
      // 清除require缓存
      delete require.cache[require.resolve(resolverPath)];
      const resolver = require(resolverPath);
      return resolver.alias || {};
    } catch (error) {
      console.error('读取resolver配置失败:', error);
      return {};
    }
  }

  /**
   * 读取模板文件内容
   * @param {string} templatePath - 模板文件路径
   * @returns {string} - 模板文件内容
   */
  static readTemplate(templatePath) {
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error('读取模板文件失败:', error);
      return '';
    }
  }

  /**
   * 写入生成的配置文件
   * @param {string} outputPath - 输出文件路径
   * @param {string} content - 文件内容
   */
  static writeConfig(outputPath, content) {
    try {
      // 确保输出目录存在
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, content, 'utf-8');
      console.log(`配置文件已生成: ${outputPath}`);
    } catch (error) {
      console.error('写入配置文件失败:', error);
    }
  }

  /**
   * 写入匹配结果报告
   * @param {string} reportPath - 报告文件路径
   * @param {string} reportContent - 报告内容
   */
  static writeReport(reportPath, reportContent) {
    try {
      const dir = path.dirname(reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, reportContent, 'utf-8');
      console.log(`匹配报告已生成: ${reportPath}`);
    } catch (error) {
      console.error('写入报告文件失败:', error);
    }
  }

  /**
   * 写入匹配结果JSON文件
   * @param {string} jsonPath - JSON文件路径
   * @param {Array} matchResult - 匹配结果数组
   */
  static writeMatchResultJson(jsonPath, matchResult) {
    try {
      const dir = path.dirname(jsonPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(jsonPath, JSON.stringify(matchResult, null, 2), 'utf-8');
      console.log(`匹配结果JSON已生成: ${jsonPath}`);
    } catch (error) {
      console.error('写入JSON文件失败:', error);
    }
  }
}

module.exports = AliasFileHandler;