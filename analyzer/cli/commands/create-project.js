const fs = require('fs');
const path = require('path');
const ConfigPath = require('../../config/config-path');
const Logger = require('../../config/logger');
const logger = new Logger();
const FileUtils = require('../../utils/file-utils');

// 加载配置文件
function loadConfig() {
  try {
    const config = ConfigPath.loadConfig();
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

// 复制文件
function copyFile(src, dest) {
  FileUtils.file.copy(src, dest);
}

// 复制目录
function copyDirectory(src, dest) {
  FileUtils.batch.copyDirectory(src, dest);
}

// 复制目录下的文件（不包含子目录）
function copyDirectoryFilesOnly(src, dest) {
  FileUtils.batch.copyDirectoryFilesOnly(src, dest);
}

// 主函数
function main() {
  console.log('🚀 开始创建新项目...');
  console.log(`新项目路径: ${newProjectPath}`);
  
  // 检查并清理目标目录
  try {
    cleanTargetDirectory(newProjectPath);
  } catch (error) {
    console.error('清理目标目录失败',error.message);
    process.exit(1);
  }
  
  // 获取原项目根路径
  const originalProjectRoot = FileUtils.utils.extractProjectRoot(fileListPath);
  console.log(`原项目根路径: ${originalProjectRoot}`);
  
  // 创建新项目目录
  ensureDir(newProjectPath);
  
  // 1. 复制原项目根目录下的所有文件（不包括目录）
  console.log('\n📁 复制根目录文件...');
  try {
    const rootItems = fs.readdirSync(originalProjectRoot);
    rootItems.forEach(item => {
      const srcPath = path.join(originalProjectRoot, item);
      const destPath = path.join(newProjectPath, item);
      
      if (fs.statSync(srcPath).isFile()) {
        copyFile(srcPath, destPath);
      }
    });
  } catch (error) {
    console.error('复制根目录文件失败:', error.message);
  }
  
  // 2. 复制 public 目录
  console.log('\n📁 复制 public 目录...');
  const publicSrc = path.join(originalProjectRoot, 'public');
  const publicDest = path.join(newProjectPath, 'public');
  copyDirectory(publicSrc, publicDest);
  
  // 3. 复制 src/router 目录
  console.log('\n📁 复制 src/router 目录...');
  const routerSrc = path.join(originalProjectRoot, 'src', 'router');
  const routerDest = path.join(newProjectPath, 'src', 'router');
  copyDirectory(routerSrc, routerDest);
  
  // 4. 复制 src 目录下的所有文件（不包含子文件夹）
  console.log('\n📄 复制 src 目录下的文件...');
  const srcDir = path.join(originalProjectRoot, 'src');
  const destSrcDir = path.join(newProjectPath, 'src');
  copyDirectoryFilesOnly(srcDir, destSrcDir);
  
  // 5. 根据文件列表复制相关文件
  console.log('\n📄 根据文件列表复制文件...');
  try {
    const fileList = FileUtils.file.read(fileListPath).split('\n').filter(line => line.trim());
    const stats = FileUtils.batch.copyFromList(fileList, originalProjectRoot, newProjectPath);
    console.log(`\n📊 复制统计:`);
    console.log(`✓ 成功复制: ${stats.copied} 个文件`);
    console.log(`✗ 失败/跳过: ${stats.failed} 个文件`);
  } catch (error) {
    console.error('处理文件列表失败:', error.message);
  }
  
  console.log('\n🎉 项目创建完成!');
  console.log(`新项目位置: ${newProjectPath}\n`);
}

// 运行主函数
main();