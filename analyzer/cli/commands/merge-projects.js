const fs = require('fs');
const path = require('path');
const ConfigPath = require('../../config/config-path');

// 加载配置文件
function loadConfig() {
  try {
    const config = ConfigPath.loadConfig();
    return config.mergeOption || {};
  } catch (error) {
    console.warn('⚠️ 无法加载配置文件，使用默认配置');
    return {
      srcProjectPath: '',
      targetProjectPath: ''
    };
  }
}

// 获取命令行参数和配置
const args = process.argv.slice(2);
const config = loadConfig();

// 确定项目路径：命令行参数优先，其次是配置文件
let projectAPath, projectBPath;

if (args.length >= 2) {
  projectAPath = path.resolve(args[0]);
  projectBPath = path.resolve(args[1]);
  console.log('📝 使用命令行参数指定的项目路径');
} else if (config.targetProjectPath && config.srcProjectPath) {
  projectAPath = path.resolve(config.targetProjectPath);
  projectBPath = path.resolve(config.srcProjectPath);
  console.log('📝 使用配置文件指定的项目路径');
} else {
  console.log('使用方法: node merge-projects.js <项目A路径> <项目B路径>');
  console.log('示例: node merge-projects.js D:\\project-a D:\\project-b');
  console.log('说明: 将项目B的文件合并到项目A中，已存在的文件将被跳过');
  console.log('或者在配置文件中设置 mergeOption.targetProjectPath 和 mergeOption.srcProjectPath');
  process.exit(1);
}

// 验证路径是否存在
if (!fs.existsSync(projectAPath)) {
  console.error(`❌ 项目A路径不存在: ${projectAPath}`);
  process.exit(1);
}

if (!fs.existsSync(projectBPath)) {
  console.error(`❌ 项目B路径不存在: ${projectBPath}`);
  process.exit(1);
}

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 复制文件（如果不存在）
function copyFileIfNotExists(src, dest) {
  try {
    if (fs.existsSync(dest)) {
      console.log(`⏭️ 跳过已存在文件: ${path.relative(projectAPath, dest)}`);
      return false;
    }
    
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    console.log(`✅ 复制文件: ${path.relative(projectBPath, src)} -> ${path.relative(projectAPath, dest)}`);
    return true;
  } catch (error) {
    console.error(`❌ 复制失败: ${src} - ${error.message}`);
    return false;
  }
}

// 递归合并目录
function mergeDirectory(srcDir, destDir, stats) {
  try {
    if (!fs.existsSync(srcDir)) {
      return;
    }
    
    const items = fs.readdirSync(srcDir);
    
    items.forEach(item => {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        // 递归处理子目录
        ensureDir(destPath);
        mergeDirectory(srcPath, destPath, stats);
      } else {
        // 处理文件
        const copied = copyFileIfNotExists(srcPath, destPath);
        if (copied) {
          stats.copied++;
        } else {
          stats.skipped++;
        }
        stats.total++;
      }
    });
    
  } catch (error) {
    console.error(`❌ 处理目录失败: ${srcDir} - ${error.message}`);
  }
}

// 主函数
function main() {
  console.log('🚀 开始合并项目...');
  console.log(`项目A (目标): ${projectAPath}`);
  console.log(`项目B (源): ${projectBPath}`);
  console.log('\n📋 合并规则:');
  console.log('- 如果文件在项目A中已存在，则跳过');
  console.log('- 如果文件在项目A中不存在，则从项目B复制');
  console.log('- 自动创建必要的目录结构\n');
  
  const stats = {
    total: 0,
    copied: 0,
    skipped: 0
  };
  
  const startTime = Date.now();
  
  // 开始合并
  mergeDirectory(projectBPath, projectAPath, stats);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // 输出统计信息
  console.log('\n📊 合并完成统计:');
  console.log(`⏱️ 耗时: ${duration} 秒`);
  console.log(`📁 总文件数: ${stats.total}`);
  console.log(`✅ 成功复制: ${stats.copied} 个文件`);
  console.log(`⏭️ 跳过文件: ${stats.skipped} 个文件`);
  
  if (stats.copied > 0) {
    console.log('\n🎉 项目合并完成!');
  } else {
    console.log('\n✨ 没有新文件需要复制，项目已是最新状态!');
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 程序异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
main();