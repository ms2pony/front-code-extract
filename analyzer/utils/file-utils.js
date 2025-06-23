const fs = require('fs');
const path = require('path');

/**
 * 文件处理工具类
 * 统一管理项目中的文件和目录操作
 */
class FileUtils {
  /**
   * 目录操作相关方法
   */
  static directory = {
    /**
     * 确保目录存在，如果不存在则创建
     * @param {string} dirPath - 目录路径
     */
    ensure(dirPath) {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    },

    /**
     * 检查目录是否存在
     * @param {string} dirPath - 目录路径
     * @returns {boolean} 目录是否存在
     */
    exists(dirPath) {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    },

    /**
     * 递归删除目录及其所有内容
     * @param {string} dirPath - 目录路径
     */
    remove(dirPath) {
      try {
        if (fs.existsSync(dirPath)) {
          const items = fs.readdirSync(dirPath);
          
          items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            if (fs.statSync(itemPath).isDirectory()) {
              this.remove(itemPath);
            } else {
              fs.unlinkSync(itemPath);
            }
          });
          
          fs.rmdirSync(dirPath);
        }
      } catch (error) {
        throw new Error(`删除目录失败: ${dirPath} - ${error.message}`);
      }
    },

    /**
     * 读取目录内容
     * @param {string} dirPath - 目录路径
     * @returns {string[]} 目录内容列表
     */
    read(dirPath) {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`目录不存在: ${dirPath}`);
      }
      return fs.readdirSync(dirPath);
    },

    /**
     * 获取目录统计信息
     * @param {string} dirPath - 目录路径
     * @returns {object} 包含文件和目录数量的统计信息
     */
    getStats(dirPath) {
      const items = this.read(dirPath);
      let fileCount = 0;
      let dirCount = 0;
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          dirCount++;
        } else {
          fileCount++;
        }
      });
      
      return { fileCount, dirCount, totalCount: fileCount + dirCount };
    }
  };

  /**
   * 文件操作相关方法
   */
  static file = {
    /**
     * 检查文件是否存在
     * @param {string} filePath - 文件路径
     * @returns {boolean} 文件是否存在
     */
    exists(filePath) {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    },

    /**
     * 读取文件内容
     * @param {string} filePath - 文件路径
     * @param {string} encoding - 编码格式，默认为 'utf8'
     * @returns {string} 文件内容
     */
    read(filePath, encoding = 'utf8') {
      try {
        return fs.readFileSync(filePath, encoding);
      } catch (error) {
        throw new Error(`读取文件失败: ${filePath} - ${error.message}`);
      }
    },

    /**
     * 写入文件内容
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     * @param {string} encoding - 编码格式，默认为 'utf8'
     */
    write(filePath, content, encoding = 'utf8') {
      try {
        // 确保目录存在
        FileUtils.directory.ensure(path.dirname(filePath));
        fs.writeFileSync(filePath, content, encoding);
      } catch (error) {
        throw new Error(`写入文件失败: ${filePath} - ${error.message}`);
      }
    },

    /**
     * 复制文件
     * @param {string} src - 源文件路径
     * @param {string} dest - 目标文件路径
     * @param {object} options - 选项
     * @param {boolean} options.overwrite - 是否覆盖已存在的文件，默认为 true
     * @returns {boolean} 是否成功复制
     */
    copy(src, dest, options = { overwrite: true }) {
      try {
        if (!this.exists(src)) {
          throw new Error(`源文件不存在: ${src}`);
        }
        
        if (!options.overwrite && this.exists(dest)) {
          return false; // 文件已存在且不覆盖
        }
        
        // 确保目标目录存在
        FileUtils.directory.ensure(path.dirname(dest));
        fs.copyFileSync(src, dest);
        return true;
      } catch (error) {
        throw new Error(`复制文件失败: ${src} -> ${dest} - ${error.message}`);
      }
    },

    /**
     * 删除文件
     * @param {string} filePath - 文件路径
     */
    remove(filePath) {
      try {
        if (this.exists(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        throw new Error(`删除文件失败: ${filePath} - ${error.message}`);
      }
    },

    /**
     * 获取文件扩展名
     * @param {string} filePath - 文件路径
     * @returns {string} 文件扩展名
     */
    getExtension(filePath) {
      return path.extname(filePath);
    },

    /**
     * 获取文件大小
     * @param {string} filePath - 文件路径
     * @returns {number} 文件大小（字节）
     */
    getSize(filePath) {
      if (!this.exists(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }
      return fs.statSync(filePath).size;
    }
  };

  /**
   * 批量操作相关方法
   */
  static batch = {
    /**
     * 递归复制整个目录
     * @param {string} src - 源目录路径
     * @param {string} dest - 目标目录路径
     * @param {object} options - 选项
     * @param {boolean} options.overwrite - 是否覆盖已存在的文件，默认为 true
     * @returns {object} 复制统计信息
     */
    copyDirectory(src, dest, options = { overwrite: true }) {
      const stats = { copied: 0, skipped: 0, failed: 0 };
      
      try {
        if (!FileUtils.directory.exists(src)) {
          throw new Error(`源目录不存在: ${src}`);
        }
        
        FileUtils.directory.ensure(dest);
        const items = FileUtils.directory.read(src);
        
        items.forEach(item => {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);
          
          try {
            if (fs.statSync(srcPath).isDirectory()) {
              const subStats = this.copyDirectory(srcPath, destPath, options);
              stats.copied += subStats.copied;
              stats.skipped += subStats.skipped;
              stats.failed += subStats.failed;
            } else {
              const copied = FileUtils.file.copy(srcPath, destPath, options);
              if (copied) {
                stats.copied++;
              } else {
                stats.skipped++;
              }
            }
          } catch (error) {
            stats.failed++;
            console.warn(`复制失败: ${srcPath} - ${error.message}`);
          }
        });
        
      } catch (error) {
        throw new Error(`复制目录失败: ${src} -> ${dest} - ${error.message}`);
      }
      
      return stats;
    },

    /**
     * 复制目录下的文件（不包含子目录）
     * @param {string} src - 源目录路径
     * @param {string} dest - 目标目录路径
     * @param {object} options - 选项
     * @returns {object} 复制统计信息
     */
    copyDirectoryFilesOnly(src, dest, options = { overwrite: true }) {
      const stats = { copied: 0, skipped: 0, failed: 0 };
      
      try {
        if (!FileUtils.directory.exists(src)) {
          throw new Error(`源目录不存在: ${src}`);
        }
        
        FileUtils.directory.ensure(dest);
        const items = FileUtils.directory.read(src);
        
        items.forEach(item => {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);
          
          try {
            // 只复制文件，跳过目录
            if (fs.statSync(srcPath).isFile()) {
              const copied = FileUtils.file.copy(srcPath, destPath, options);
              if (copied) {
                stats.copied++;
              } else {
                stats.skipped++;
              }
            }
          } catch (error) {
            stats.failed++;
            console.warn(`复制文件失败: ${srcPath} - ${error.message}`);
          }
        });
        
      } catch (error) {
        throw new Error(`复制目录文件失败: ${src} -> ${dest} - ${error.message}`);
      }
      
      return stats;
    },

    /**
     * 根据文件列表批量复制文件
     * @param {string[]} fileList - 文件路径列表
     * @param {string} srcRoot - 源根目录
     * @param {string} destRoot - 目标根目录
     * @param {object} options - 选项
     * @returns {object} 复制统计信息
     */
    copyFromList(fileList, srcRoot, destRoot, options = { overwrite: true }) {
      const stats = { copied: 0, skipped: 0, failed: 0 };
      
      fileList.forEach(filePath => {
        try {
          const trimmedPath = filePath.trim();
          if (trimmedPath && FileUtils.file.exists(trimmedPath)) {
            // 计算相对于源根目录的路径
            const relativePath = path.relative(srcRoot, trimmedPath);
            const destPath = path.join(destRoot, relativePath);
            
            const copied = FileUtils.file.copy(trimmedPath, destPath, options);
            if (copied) {
              stats.copied++;
            } else {
              stats.skipped++;
            }
          } else {
            stats.failed++;
            console.warn(`文件不存在: ${trimmedPath}`);
          }
        } catch (error) {
          stats.failed++;
          console.warn(`复制文件失败: ${filePath} - ${error.message}`);
        }
      });
      
      return stats;
    }
  };

  /**
   * 路径操作相关方法
   */
  static path = {
    /**
     * 规范化路径
     * @param {string} inputPath - 输入路径
     * @returns {string} 规范化后的路径
     */
    normalize(inputPath) {
      return path.normalize(inputPath);
    },

    /**
     * 获取相对路径
     * @param {string} from - 起始路径
     * @param {string} to - 目标路径
     * @returns {string} 相对路径
     */
    relative(from, to) {
      return path.relative(from, to);
    },

    /**
     * 连接路径
     * @param {...string} paths - 路径片段
     * @returns {string} 连接后的路径
     */
    join(...paths) {
      return path.join(...paths);
    },

    /**
     * 解析为绝对路径
     * @param {...string} paths - 路径片段
     * @returns {string} 绝对路径
     */
    resolve(...paths) {
      return path.resolve(...paths);
    },

    /**
     * 获取目录名
     * @param {string} filePath - 文件路径
     * @returns {string} 目录名
     */
    dirname(filePath) {
      return path.dirname(filePath);
    },

    /**
     * 获取文件名（包含扩展名）
     * @param {string} filePath - 文件路径
     * @returns {string} 文件名
     */
    basename(filePath) {
      return path.basename(filePath);
    },

    /**
     * 获取文件扩展名
     * @param {string} filePath - 文件路径
     * @returns {string} 扩展名
     */
    extname(filePath) {
      return path.extname(filePath);
    }
  };

  /**
   * 工具方法
   */
  static utils = {
    /**
     * 从文件列表中提取项目根路径
     * @param {string} fileListPath - 文件列表路径
     * @param {string} marker - 路径标记，默认为 '\\src\\'
     * @returns {string} 项目根路径
     */
    extractProjectRoot(fileListPath, marker = '\\src\\') {
      try {
        const fileList = FileUtils.file.read(fileListPath);
        const firstLine = fileList.split('\n')[0].trim();
        
        if (firstLine) {
          const markerIndex = firstLine.indexOf(marker);
          if (markerIndex !== -1) {
            return firstLine.substring(0, markerIndex);
          }
        }
        
        throw new Error('无法从文件列表中确定项目根路径');
      } catch (error) {
        throw new Error(`提取项目根路径失败: ${error.message}`);
      }
    },

    /**
     * 清理目标目录（根据配置决定是否删除）
     * @param {string} targetPath - 目标路径
     * @param {boolean} dropIfExists - 如果存在是否删除
     */
    cleanTargetDirectory(targetPath, dropIfExists = false) {
      if (FileUtils.directory.exists(targetPath)) {
        if (dropIfExists) {
          FileUtils.directory.remove(targetPath);
          return { action: 'removed', message: '目标目录已删除' };
        } else {
          throw new Error('目标目录已存在，且配置为不删除已存在目录');
        }
      }
      return { action: 'none', message: '目标目录不存在，无需清理' };
    },

    /**
     * 获取文件类型图标
     * @param {string} filename - 文件名
     * @returns {string} 文件图标
     */
    getFileIcon(filename) {
      const ext = path.extname(filename);
      const icons = {
        '.vue': '🟢',
        '.js': '🟡',
        '.ts': '🔵',
        '.css': '🎨',
        '.less': '🎨',
        '.scss': '🎨',
        '.png': '🖼️',
        '.jpg': '🖼️',
        '.jpeg': '🖼️',
        '.gif': '🖼️',
        '.svg': '🖼️',
        '.json': '📋',
        '.md': '📝',
        '.html': '🌐'
      };
      return icons[ext] || '📄';
    },

    /**
     * 检查是否为文本文件
     * @param {string} filePath - 文件路径
     * @returns {boolean} 是否为文本文件
     */
    isTextFile(filePath) {
      const textFileExtensions = ['.vue', '.js', '.ts', '.css', '.less', '.scss', '.json', '.md', '.html', '.txt'];
      const ext = path.extname(filePath);
      return textFileExtensions.includes(ext);
    },

    /**
     * 检查是否为前端代码文件
     * @param {string} filePath - 文件路径
     * @returns {boolean} 是否为前端代码文件
     */
    isFrontendFile(filePath) {
      const frontendExtensions = ['.vue', '.js', '.ts', '.css', '.less', '.scss'];
      const ext = path.extname(filePath);
      return frontendExtensions.includes(ext);
    }
  };
}

module.exports = FileUtils;