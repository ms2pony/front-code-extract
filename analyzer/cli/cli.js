
// #!/usr/bin/env node
const path = require('path');
const collectDeps = require('../collector/collectDeps');
const { setAliasRoot } = require('../resolve');
const { generateReport, outputToFiles } = require('../stats/output');
const Logger = require('../utils/logger');
const ConfigPath = require('../utils/config-path');

const logger = new Logger();

// 读取配置文件
function loadConfig() {
  return ConfigPath.loadCliConfig();
}

(async () => {
  const [,, entryArg, rootArg, outputArg] = process.argv;
  const config = loadConfig();
  
  let entryFile = entryArg || config.entryFile;
  
  if (!entryFile || (Array.isArray(entryFile) && entryFile.length === 0)) {
    logger.configError('入口文件', `请通过以下方式之一设置入口文件:
1. 命令行参数: node cli.js <entry-file> [project-root] [output-dir]
2. 配置文件: 在 config/cli-config.js 中设置 entryFile`);
    process.exit(1);
  }
  
  // 确保entryFile是数组格式
  if (!Array.isArray(entryFile)) {
    entryFile = [entryFile];
  }
  
  const entries = entryFile.map(file => path.resolve(file));
  const projectRoot = rootArg || config.projectRoot || path.dirname(entries[0]);
  const outputDir = outputArg || config.outputDir || path.join(process.cwd(), 'output');
  
  // 简化配置显示
  logger.info('开始分析依赖...');
  logger.debug(`入口文件: ${entries.length === 1 ? entries[0] : entries.length + '个文件'}`);
  logger.debug(`项目根目录: ${projectRoot}`);
  logger.debug(`输出目录: ${outputDir}`);
  
  setAliasRoot(path.resolve(projectRoot));

  const result = await collectDeps(entries, path.resolve(projectRoot));
  const deps = result.dependencies;
  const aliasStats = result.aliasStats;
  
  logger.info('生成报告...');
  const report = generateReport(deps, entries, path.resolve(projectRoot), aliasStats);
  
  logger.info('输出到文件...');
  const outputPaths = outputToFiles(report, path.resolve(outputDir));
  
  logger.success('分析完成!');
  logger.info(`输出目录: ${path.resolve(outputDir)}`);
  logger.info(`总文件数: ${report.statistics.total}`);
  
  // 根据配置执行后续操作
  const secondCreateOrMerge = config.secondCreateOrMerge;
  if (secondCreateOrMerge === 1 || secondCreateOrMerge === 2) {
    logger.info(secondCreateOrMerge === 1 ? '开始创建新项目...' : '开始创建项目（准备合并）...');
    
    try {
      const { execSync } = require('child_process');
      const createProjectPath = path.join(__dirname, 'commands', 'create-project.js');
      
      execSync(`node "${createProjectPath}"`, { stdio: 'inherit', cwd: __dirname });
      
      if (secondCreateOrMerge === 2) {
        logger.info('开始合并项目...');
        const mergeProjectPath = path.join(__dirname, 'commands', 'merge-projects.js');
        execSync(`node "${mergeProjectPath}"`, { stdio: 'inherit', cwd: __dirname });
      }
      
      logger.success('所有操作完成!');
    } catch (error) {
      logger.error(`执行后续操作失败: ${error.message}`);
      process.exit(1);
    }
  }
})();
