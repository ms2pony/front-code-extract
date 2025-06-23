/**
 * 别名处理器主类
 * 整合文件操作和文本处理功能
 */

const AliasMatcher = require('./alias-matcher');
const AliasFileHandler = require('./alias-file-handler');

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
      reportOutputPath,
      jsonOutputPath
    } = options;

    try {
      // 1. 读取数据
      console.log('正在读取数据文件...');
      const aliasUsage = AliasFileHandler.getAliasUsageFromReport(reportPath);
      const aliasDefinitions = AliasFileHandler.getAliasFromResolver(resolverPath);
      const templateContent = AliasFileHandler.readTemplate(templatePath);

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
      AliasFileHandler.writeConfig(outputPath, vueConfigContent);
      
      // 6. 生成报告（可选）
    //   if (reportOutputPath) {
    //     const report = AliasMatcher.generateReport(matchResult);
    //     AliasFileHandler.writeReport(reportOutputPath, report);
    //   }
      
      // 7. 写入JSON结果（可选）
    //   if (jsonOutputPath) {
    //     AliasFileHandler.writeMatchResultJson(jsonOutputPath, matchResult);
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
}

module.exports = AliasProcessor;