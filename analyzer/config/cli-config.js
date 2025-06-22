const path = require('path');

// 原始配置对象
const config = {
  // 入口文件路径 - 移除末尾空格
  entryFile: "J:\\ifs-eui\\src\\modules\\common\\src\\extension\\index.js",
  
  // 项目根目录
  projectRoot: "J:\\ifs-eui",
  
  // 输出目录
  outputDir: "output"
};

// 自动转换相对路径为绝对路径的处理函数
function resolveConfig(config) {
  const resolved = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string' && value) {
      // 去除首尾空格
      const trimmedValue = value.trim();
      if (!path.isAbsolute(trimmedValue)) {
        // 如果是相对路径，基于当前工作目录解析
        resolved[key] = path.resolve(process.cwd(), trimmedValue);
      } else {
        resolved[key] = trimmedValue;
      }
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

// 导出自动解析后的配置
module.exports = resolveConfig(config);