/**
 * 别名处理器主类
 * 整合文件操作和文本处理功能
 */

const AliasMatcher = require('../textproc/alias-proc');
const FileUtils = require('../utils/file-utils');
const path = require('path');

class AliasProcessor {
  /**
   * 处理别名匹配并生成Vue配置文件
   * @param {Object} options - 配置选项
   * @param {string} options.reportPath - 依赖报告文件路径
   * @param {string} options.resolverPath - resolver配置文件路径
   * @param {string} options.templatePath - 模板文件路径
   * @param {string} options.outputPath - 输出文件路径
   * @param {string} [options.reportOutputPath] - 报告输出路径
   * @param {string} [options.jsonOutputPath] - JSON结果输出路径
   * @returns {Object} - 处理结果
   */
  static process(options) {
    const {
      reportPath,
      resolverPath,
      templatePath,
      outputPath,
    //   reportOutputPath,
    //   jsonOutputPath
    } = options;

    try {
      // 1. 读取数据
      console.log('正在读取数据文件...');
      const aliasUsage = this.getAliasUsageFromReport(reportPath);
      const aliasDefinitions = this.getAliasFromResolver(resolverPath);
      const templateContent = FileUtils.file.read(templatePath);

      if (!templateContent) {
        throw new Error('模板文件读取失败');
      }

      // 2. 进行别名匹配
      console.log('正在进行别名匹配...');
      const matchResult = AliasMatcher.matchAliasUsage(aliasUsage, aliasDefinitions);
      
      if (matchResult.length === 0) {
        console.warn('没有找到匹配的别名');
        return { success: false, message: '没有找到匹配的别名' };
      }

      // 3. 生成别名配置
      console.log('正在生成别名配置...');
      const aliasConfig = AliasMatcher.generateAliasConfig(matchResult);
      
      // 4. 生成Vue配置文件内容
      console.log('正在生成Vue配置文件...');
      const vueConfigContent = AliasMatcher.generateVueConfig(templateContent, aliasConfig);
      
      // 5. 写入配置文件
      FileUtils.file.write(outputPath, vueConfigContent);
      console.log(`配置文件已生成: ${outputPath}`);
      
      // 6. 生成报告（可选）
    //   if (reportOutputPath) {
    //     const report = AliasMatcher.generateReport(matchResult);
    //     FileUtils.file.write(reportOutputPath, report);
    //     console.log(`匹配报告已生成: ${reportOutputPath}`);
    //   }
      
      // 7. 写入JSON结果（可选）
    //   if (jsonOutputPath) {
    //     FileUtils.file.write(jsonOutputPath, JSON.stringify(matchResult, null, 2));
    //     console.log(`匹配结果JSON已生成: ${jsonOutputPath}`);
    //   }

      console.log(`处理完成！匹配到 ${matchResult.length} 个别名`);
      
      return {
        success: true,
        matchCount: matchResult.length,
        aliasConfig,
        matchResult
      };
      
    } catch (error) {
      console.error('处理过程中发生错误:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 从依赖报告中获取别名使用情况
   * @param {string} reportPath - 依赖报告文件路径
   * @returns {Object} - 别名使用情况对象
   */
  static getAliasUsageFromReport(reportPath) {
    try {
      const reportContent = FileUtils.file.read(reportPath);
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
      const absolutePath = path.resolve(resolverPath);
      delete require.cache[absolutePath];
      const resolver = require(absolutePath);
      return resolver.alias || {};
    } catch (error) {
      console.error('读取resolver配置失败:', error);
      return {};
    }
  }
}

module.exports = AliasProcessor;