const path = require('path');

// 获取项目根目录（analyzer目录的上级目录）
const PROJECT_ROOT = path.resolve(__dirname, '../');

// 原始配置对象
const config = {
  // 入口文件路径，直接写相对路径即可（相对于项目根目录）
  // 示例: "sample-app/src/main.js" 会自动解析为绝对路径
  entryFile: "J:\\ifs-eui\\src\\modules\\common\\src\\extension\\index.js ",
  
  // 项目根目录，直接写相对路径即可（相对于项目根目录）
  // 示例: "sample-app" 会自动解析为绝对路径
  projectRoot: "J:\\ifs-eui",
  
  // 输出目录，直接写相对路径即可（相对于项目根目录）
  // 示例: "output" 会自动解析为绝对路径
  outputDir: "output"
};

// 自动转换相对路径为绝对路径的处理函数
function resolveConfig(config) {
  const resolved = {};
  for (const [key, value] of Object.entries(config)) {
    const trimmedValue = value.trim();
    if (typeof trimmedValue === 'string' && trimmedValue && !path.isAbsolute(trimmedValue)) {
      resolved[key] = path.resolve(PROJECT_ROOT, trimmedValue);
    } else {
      resolved[key] = trimmedValue;
    }
  }
  return resolved;
}

// 导出自动解析后的配置
module.exports = resolveConfig(config);