/**
 * 别名匹配工具
 * 用于匹配依赖报告中的别名使用情况与配置中的别名定义
 */

const fs = require('fs');

class AliasMatcher {
  /**
   * 从依赖报告中获取别名使用情况
   * @param {string} reportPath - 依赖报告文件路径
   * @returns {Object} - 别名使用情况对象
   */
  static getAliasUsageFromReport(reportPath) {
    try {
      const reportContent = fs.readFileSync(reportPath, 'utf-8');
      const report = JSON.parse(reportContent);

      console.log("getAliasUsageFromReport --- report", report)

    //   return
      return report.aliasStatistics.aliasUsage || {};
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
      // 由于resolver.js是一个模块，我们需要直接引入它
      const resolver = require(resolverPath);
      return resolver.alias || {};
    } catch (error) {
      console.error('读取resolver配置失败:', error);
      return {};
    }
  }

  /**
   * 匹配别名使用情况与别名定义（纯文本处理）
   * @param {Object} aliasUsage - 别名使用情况对象
   * @param {Object} aliasDefinitions - 别名定义对象
   * @returns {Array} - 匹配结果数组，按精确度排序
   */
  static matchAliasUsage(aliasUsage, aliasDefinitions) {
    const result = [];
    const usedAliases = Object.keys(aliasUsage);

    // 遍历所有使用过的别名
    for (const usedAlias of usedAliases) {
      const matchedAliases = [];

      // 查找所有可能匹配的别名定义
      for (const [definedAlias, aliasPath] of Object.entries(aliasDefinitions)) {
        // 检查使用的别名是否与定义的别名匹配
        // 1. 完全匹配
        // 2. 使用的别名以定义的别名开头，后面跟着/或结束
        if (usedAlias === definedAlias || 
            (usedAlias.startsWith(definedAlias) && 
             (usedAlias.length === definedAlias.length || usedAlias[definedAlias.length] === '/'))) {
          matchedAliases.push({
            usedAlias,
            definedAlias,
            aliasPath,
            usageCount: aliasUsage[usedAlias],
            // 计算路径深度（斜杠数量）作为精确度指标
            depth: (definedAlias.match(/\//g) || []).length + 1
          });
        }
      }

      // 将匹配结果添加到结果数组
      result.push(...matchedAliases);
    }

    // 按精确度排序（路径越长越精确）
    return result.sort((a, b) => {
      // 首先按照定义别名的深度排序（越深越精确）
      if (b.depth !== a.depth) {
        return b.depth - a.depth;
      }
      // 如果深度相同，按照定义别名的长度排序
      if (b.definedAlias.length !== a.definedAlias.length) {
        return b.definedAlias.length - a.definedAlias.length;
      }
      // 如果长度也相同，按照使用次数排序
      return b.usageCount - a.usageCount;
    });
  }

  /**
   * 生成别名配置对象（用于vue.config.js）
   * @param {Array} matchResult - 匹配结果数组
   * @returns {Object} - 别名配置对象
   */
  static generateAliasConfig(matchResult) {
    const aliasConfig = {};
    
    // 去重处理，确保每个别名只出现一次
    const uniqueAliases = new Map();
    
    for (const match of matchResult) {
      if (!uniqueAliases.has(match.definedAlias)) {
        uniqueAliases.set(match.definedAlias, match.aliasPath);
      }
    }
    
    // 转换为配置对象格式
    for (const [alias, path] of uniqueAliases) {
      aliasConfig[alias] = path;
    }
    
    return aliasConfig;
  }

  /**
   * 生成Vue配置文件内容
   * @param {string} templateContent - 模板文件内容
   * @param {Object} aliasConfig - 别名配置对象
   * @returns {string} - 生成的配置文件内容
   */
  static generateVueConfig(templateContent, aliasConfig) {
    // 生成alias配置字符串
    const aliasEntries = Object.entries(aliasConfig).map(([alias, path]) => {
      return `        "${alias}": resolve("${path}")`;
    });
    
    const aliasConfigString = aliasEntries.join(',\n');
    
    // 替换模板中的alias配置
    const aliasRegex = /alias:\s*{[\s\S]*?}/;
    const newAliasConfig = `alias: {
${aliasConfigString}
      }`;
    
    return templateContent.replace(aliasRegex, newAliasConfig);
  }

  /**
   * 生成匹配结果的可读报告
   * @param {Array} matchResult - 匹配结果数组
   * @returns {string} - 格式化的报告文本
   */
  static generateReport(matchResult) {
    if (!matchResult || matchResult.length === 0) {
      return '没有找到匹配的别名';
    }

    let report = '别名匹配报告（按精确度排序）:\n\n';
    
    for (const match of matchResult) {
      report += `使用的别名: ${match.usedAlias}\n`;
      report += `匹配的定义: ${match.definedAlias} -> ${match.aliasPath}\n`;
      report += `使用次数: ${match.usageCount}\n`;
      report += `精确度指标: ${match.depth}\n\n`;
    }

    return report;
  }
}

module.exports = AliasMatcher;