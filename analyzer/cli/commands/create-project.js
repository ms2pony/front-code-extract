const fs = require('fs');
const path = require('path');
const ConfigPath = require('../../config/config-path');
const { execSync } = require('child_process');

// 加载配置文件
function loadConfig() {
  try {
    const config = ConfigPath.loadConfig();
    return config.createOption || {};
  } catch (error) {
    console.warn('⚠️ 无法加载配置文件，使用默认配置');
    return {
      targetProjectPath: '',
      dropIfExists: false
    };
  }
}

// 获取命令行参数和配置
const args = process.argv.slice(2);
const config = loadConfig();

// 确定新项目路径：命令行参数优先，其次是配置文件
let newProjectPath;
let fileListPath;

if (args.length > 0) {
  newProjectPath = args[0];
  fileListPath = args[1] || path.join(__dirname, '..', 'output', 'file-list.txt');
  console.log('📝 使用命令行参数指定的项目路径');
} else if (config.targetProjectPath) {
  newProjectPath = config.targetProjectPath;
  console.log("----create newProjectPath",newProjectPath)
  fileListPath = path.join(__dirname, '..', 'output', 'file-list.txt');
  console.log('📝 使用配置文件指定的项目路径');
} else {
  console.log('使用方法: node create-project.js <新项目路径> [文件列表路径]');
  console.log('示例: node create-project.js D:\\new-project');
  console.log('或者在配置文件中设置 targetProjectPath');
  process.exit(1);
}

// 获取 dropIfExists 配置
const dropIfExists = config.dropIfExists || false;
console.log(`🔧 目录存在时删除策略: ${dropIfExists ? '删除' : '不删除'}`);
console.log(`📄 文件列表路径: ${fileListPath}`);

// 递归删除目录
function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          removeDirectory(itemPath);
        } else {
          fs.unlinkSync(itemPath);
        }
      });
      
      fs.rmdirSync(dirPath);
      console.log(`🗑️ 已删除目录: ${dirPath}`);
    }
  } catch (error) {
    console.error(`✗ 删除目录失败: ${dirPath} - ${error.message}`);
    throw error;
  }
}

// 检查并清理目标目录
function cleanTargetDirectory(targetPath) {
  console.log("cleanTargetDirectory --- targetPath",targetPath)
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️ 目标目录已存在: ${targetPath}`);
    
    if (dropIfExists) {
      console.log('🧹 配置为删除已存在目录，正在清理...');
      removeDirectory(targetPath);
      console.log('✅ 目标目录清理完成');
    } else {
      console.log('❌ 配置为不删除已存在目录，程序终止');
      console.log('提示: 可以设置 dropIfExists: true 来自动删除已存在的目录');
      process.exit(1);
    }
  } else {
    console.log('✅ 目标目录不存在，无需清理');
  }
}

// 确保新项目目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 复制文件
function copyFile(src, dest) {
  try {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    console.log(`✓ 复制: ${src} -> ${dest}`);
  } catch (error) {
    console.error(`✗ 复制失败: ${src} - ${error.message}`);
  }
}

// 复制目录
function copyDirectory(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      console.warn(`⚠ 目录不存在: ${src}`);
      return;
    }
    
    ensureDir(dest);
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        copyFile(srcPath, destPath);
      }
    });
    
    console.log(`✓ 复制目录: ${src} -> ${dest}`);
  } catch (error) {
    console.error(`✗ 复制目录失败: ${src} - ${error.message}`);
  }
}

// 复制目录下的文件（不包含子目录）
function copyDirectoryFilesOnly(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      console.warn(`⚠ 目录不存在: ${src}`);
      return;
    }
    
    ensureDir(dest);
    const items = fs.readdirSync(src);
    
    let copiedCount = 0;
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      // 只复制文件，跳过目录
      if (fs.statSync(srcPath).isFile()) {
        copyFile(srcPath, destPath);
        copiedCount++;
      }
    });
    
    console.log(`✓ 复制目录文件: ${src} -> ${dest} (${copiedCount} 个文件)`);
  } catch (error) {
    console.error(`✗ 复制目录文件失败: ${src} - ${error.message}`);
  }
}

// 从文件列表中提取原项目根路径
function getOriginalProjectRoot() {
  try {
    const fileList = fs.readFileSync(fileListPath, 'utf8');
    const firstLine = fileList.split('\n')[0].trim();
    
    if (firstLine) {
      // 提取 src 前面的路径部分
      const srcIndex = firstLine.indexOf('\\src\\');
      if (srcIndex !== -1) {
        return firstLine.substring(0, srcIndex);
      }
    }
    
    throw new Error('无法从文件列表中确定原项目根路径');
  } catch (error) {
    console.error('读取文件列表失败:', error.message);
    process.exit(1);
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
    console.error('清理目标目录失败，程序终止');
    process.exit(1);
  }
  
  // 获取原项目根路径
  const originalProjectRoot = getOriginalProjectRoot();
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
    const fileList = fs.readFileSync(fileListPath, 'utf8');
    const files = fileList.split('\n').filter(line => line.trim());
    
    let copiedCount = 0;
    let failedCount = 0;
    
    files.forEach(filePath => {
      const trimmedPath = filePath.trim();
      if (trimmedPath && fs.existsSync(trimmedPath)) {
        // 计算相对于原项目根目录的路径
        const relativePath = path.relative(originalProjectRoot, trimmedPath);
        const destPath = path.join(newProjectPath, relativePath);
        
        copyFile(trimmedPath, destPath);
        copiedCount++;
      } else {
        console.warn(`⚠ 文件不存在: ${trimmedPath}`);
        failedCount++;
      }
    });
    
    console.log(`\n📊 复制统计:`);
    console.log(`✓ 成功复制: ${copiedCount} 个文件`);
    console.log(`✗ 失败/跳过: ${failedCount} 个文件`);
    
  } catch (error) {
    console.error('处理文件列表失败:', error.message);
  }
  
  console.log('\n🎉 项目创建完成!');
  console.log(`新项目位置: ${newProjectPath}`);
}

// 运行主函数
main();