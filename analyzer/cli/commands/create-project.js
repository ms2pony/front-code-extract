const path = require('path');
const FileUtils = require('../../utils/file-utils');
const Logger = require('../../utils/logger');
const ConfigPath = require('../../utils/config-path');
const getPlan = require('../../hooks/index');

const logger = new Logger();

// 加载配置文件
function loadConfig() {
  try {
    const config = ConfigPath.loadCliConfig();
    return config || {};
  } catch (error) {
    logger.warn('无法加载配置文件，使用默认配置');
    return {
      targetProjectPath: '',
      dropIfExists: false
    };
  }
}

// 获取命令行参数和配置
const args = process.argv.slice(2);
const config = loadConfig().createOption;
const outputDir = loadConfig().outputDir;

// 确定新项目路径：命令行参数优先，其次是配置文件
let newProjectPath;
let fileListPath;

if (args.length > 0 && args[0].trim()) {
  newProjectPath = args[0];
  fileListPath = args[1] || path.join(__dirname, '..', 'output', 'file-list.txt');
  logger.debug('使用命令行参数指定的项目路径');
} else if (config && config.targetProjectPath) {
  newProjectPath = config.targetProjectPath;
  fileListPath = path.join(outputDir, 'file-list.txt');
  logger.debug('使用配置文件指定的项目路径');
} else {
  logger.configError('创建项目', `请在配置文件中设置以下选项:
  createOption: {
    targetProjectPath: "新项目路径",
    dropIfExists: true/false
  }
配置文件位置: config/cli-config.js`);
  process.exit(1);
}

// 获取 dropIfExists 配置
const dropIfExists = (config && config.dropIfExists) || false;
logger.debug(`目录存在时删除策略: ${dropIfExists ? '删除' : '不删除'}`);
logger.debug(`文件列表路径: ${fileListPath}`);

// 检查并清理目标目录
function cleanTargetDirectory(targetPath) {
  const result = FileUtils.utils.cleanTargetDirectory(targetPath, dropIfExists);
  console.log(result.message);
}

// 确保新项目目录存在
function ensureDir(dirPath) {
  FileUtils.directory.ensure(dirPath);
}

/**
 * 执行创建阶段的hooks
 * @param {string} planName - 脚手架计划名称
 * @param {string} point - 执行点 (start/end)
 * @param {Object} contexts - 上下文参数
 */
function executeCreateHooks(planName, phase, point, contexts) {
  try {
    console.log(`\n🔗 执行 ${point} 阶段的 hooks...`);
    
    const plan = getPlan(planName);
    if (!plan || !plan.plans) {
      console.log(`未找到脚手架计划: ${planName}`);
      return;
    }
    
    const createHooks = plan.plans.filter(p => 
      p.phase === phase && p.point === point && p.hook
    );
    
    if (createHooks.length === 0) {
      console.log(`没有找到 ${point} 阶段的 hooks`);
      return;
    }
    
    console.log(`找到 ${createHooks.length} 个 ${point} 阶段的 hooks`);
    
    // 依次执行 hooks
    for (let index = 0; index < createHooks.length; index++) {
      const hookConfig = createHooks[index];
      
      console.log(`\n📌 执行 hook ${index + 1}/${createHooks.length}: ${hookConfig.name}`);
      
      const result = hookConfig.hook({
        ...contexts[index],
        ...hookConfig.arguments
      });
      
      if (result && result.success === false) {
        const errorMsg = `Hook ${hookConfig.name} 执行失败: ${result.error || result.message}`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      } else {
        console.log(`✅ Hook ${hookConfig.name} 执行成功`);
      }
    }
    
  } catch (error) {
    console.error('❌ 执行 hooks 时发生错误:', error.message);
    throw error
  }
}

// 主函数
function main() {
  console.log('🚀 开始创建新项目...');
  console.log(`新项目路径: ${newProjectPath}`);
  
  // 检查并清理目标目录
  try {
    cleanTargetDirectory(newProjectPath);
  } catch (error) {
    console.error('清理目标目录失败', error.message);
    process.exit(1);
  }
  
  // 创建新项目目录
  ensureDir(newProjectPath);
  
  // 执行创建阶段开始时的 hooks
  const hookContexts = [
    {
      newProjectPath,
      fileListPath,
    },
    {
      newProjectPath,
    }
  ];
  
  try{
    executeCreateHooks('eui','create', 'start', hookContexts);
  }catch(error){
    logger.error('执行创建阶段开始时的hooks失败', error.message)
    return
  }
  
  // 根据文件列表复制相关文件（如果需要的话）
  if (FileUtils.file.exists(fileListPath)) {
    console.log('\n📄 根据文件列表复制额外文件...');
    try {
      // 获取原项目根路径
      const originalProjectRoot = FileUtils.utils.extractProjectRoot(fileListPath);
      console.log(`原项目根路径: ${originalProjectRoot}`);
      
      const fileList = FileUtils.file.read(fileListPath).split('\n').filter(line => line.trim());
      const stats = FileUtils.batch.copyFromList(fileList, originalProjectRoot, newProjectPath);
      console.log(`\n📊 额外文件复制统计:`);
      console.log(`✓ 成功复制: ${stats.copied} 个文件`);
      console.log(`⚠ 跳过: ${stats.skipped} 个文件`);
      console.log(`✗ 失败: ${stats.failed} 个文件`);
    } catch (error) {
      console.error('处理文件列表失败:', error.message);
    }
  } else {
    console.log('\n⚠ 未找到文件列表，跳过额外文件复制');
  }
  
  console.log('\n🎉 项目创建完成!');
  console.log(`新项目位置: ${newProjectPath}\n`);
}

// 运行主函数
main();