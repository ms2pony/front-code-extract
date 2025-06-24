/**
 * 脚手架获取和复制处理器
 * 负责从Git仓库下载脚手架模板并复制到目标目录
 */

const { execSync } = require('child_process');
const path = require('path');
const FileUtils = require('../utils/file-utils');
const ConfigPath = require('../utils/config-path');
// 移除这行：const getPlan = require('./index');

class GetScaffoldProcessor {
  /**
   * 处理脚手架下载和复制
   * @param {Object} options - 配置选项
   * @param {string} options.newProjectPath - 新项目路径
   * @param {string} options.gitUrl - 获取计划的函数
   */
  static process(options) {
    const {
      newProjectPath,
      planName = 'eui',
      gitUrl  // 从参数中获取
    } = options;

    try {
      console.log('\n🔧 开始执行脚手架获取流程...');
      const scaffoldPath = ConfigPath.scaffoldPath;
      
      console.log(`脚手架计划: ${planName}`);
      console.log(`Git URL: ${gitUrl}`);
      console.log(`脚手架存放路径: ${scaffoldPath}`);
      
      // 2. 下载脚手架模板
      const downloadSuccess = GetScaffoldProcessor.downloadScaffold(gitUrl, scaffoldPath);
      if (!downloadSuccess) {
        throw new Error('脚手架下载失败');
      }
      
      // 3. 复制脚手架到新项目
      const copyStats = GetScaffoldProcessor.copyScaffoldToProject(scaffoldPath, newProjectPath);
      
      console.log('✅ 脚手架获取流程完成');
      
      return {
        success: true,
        scaffoldPath,
        copyStats,
        message: '脚手架获取和复制成功'
      };
      
    } catch (error) {
      console.error('❌ 脚手架获取流程失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 下载脚手架模板
   * @param {string} gitUrl - Git仓库URL
   * @param {string} targetPath - 目标路径
   * @returns {boolean} 是否下载成功
   */
  static downloadScaffold(gitUrl, targetPath) {
    try {
      console.log('\n🔄 正在下载脚手架模板...');
      
      // 如果目标目录已存在，先删除
      if (FileUtils.directory.exists(targetPath)) {
        console.log('删除已存在的脚手架目录...');
        FileUtils.directory.remove(targetPath);
      }
      
      // 确保父目录存在
      FileUtils.directory.ensure(path.dirname(targetPath));
      
      // 执行 git clone
      execSync(`git clone ${gitUrl} "${targetPath}"`, {
        stdio: 'inherit',
        cwd: path.dirname(targetPath)
      });
      
      // 删除 .git 目录
      const gitDir = path.join(targetPath, '.git');
      if (FileUtils.directory.exists(gitDir)) {
        console.log('清理 .git 目录...');
        FileUtils.directory.remove(gitDir);
      }
      
      console.log('✅ 脚手架模板下载完成');
      return true;
      
    } catch (error) {
      console.error('❌ 下载脚手架模板失败:', error.message);
      return false;
    }
  }

  /**
   * 从脚手架模板复制文件到新项目
   * @param {string} scaffoldPath - 脚手架路径
   * @param {string} newProjectPath - 新项目路径
   * @returns {Object} 复制统计信息
   */
  static copyScaffoldToProject(scaffoldPath, newProjectPath) {
    try {
      console.log('\n📁 正在复制脚手架文件到新项目...');
      
      // 复制整个脚手架目录到新项目路径
      const stats = FileUtils.batch.copyDirectory(scaffoldPath, newProjectPath, { overwrite: true });
      
      console.log(`\n📊 脚手架复制统计:`);
      console.log(`✓ 成功复制: ${stats.copied} 个文件`);
      console.log(`⚠ 跳过: ${stats.skipped} 个文件`);
      console.log(`✗ 失败: ${stats.failed} 个文件`);
      
      return stats;
      
    } catch (error) {
      console.error('复制脚手架文件失败:', error.message);
      throw error;
    }
  }
}

module.exports = GetScaffoldProcessor;