const path = require('path');

// 获取项目根目录（analyzer目录的上级目录）
const PROJECT_ROOT = path.resolve(__dirname, '../');

// 原始配置对象
const config = {
  // 入口文件路径，支持字符串或数组
  entryFile: [
    "J:\\gitlab\\ifs-eui\\src\\modules\\common\\src\\extension\\index.js",
    "J:\\gitlab\\ifs-eui\\src\\modules\\common\\src\\layout\\portal\\index.vue",
    "J:\\gitlab\\ifs-eui\\src\\modules\\tender\\views\\pay\\purchaser-pay-edit.vue",
    "J:\\gitlab\\ifs-eui\\src\\bootstrap.js",
  ],
  
  // 项目根目录
  projectRoot: "J:\\gitlab\\ifs-eui",
  
  // 输出目录，直接写相对路径即可（相对于项目根目录）
  // 示例: "output" 会自动解析为绝对路径
  outputDir: "output",

  mergeOption:{
    // 新项目 - 待合并的项目
    srcProjectPath:'K:\\front-code-extract\\analyzer\\output\\eui-pay-edit-part',
    // dest - 目标项目
    targetProjectPath:'K:\\front-code-extract\\analyzer\\output\\dest',

  },

  // 得到依赖关系后是重新创建新项目还是合并到老项目 1-重新创建 2-创建新项目然后再合并到老项目
  secondCreateOrMerge: 1,

  createOption:{
    // 新项目路径
    targetProjectPath:'K:\\front-code-extract\\analyzer\\output\\eui-pay-core',
    dropIfExists:true,
  }
};

// 自动转换相对路径为绝对路径的处理函数
function resolveConfig(config) {
  const resolved = {};
  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      // 处理数组类型的配置项
      resolved[key] = value.map(item => {
        if (typeof item === 'string' && item) {
          const trimmedValue = item.trim();
          if (!path.isAbsolute(trimmedValue)) {
            return path.resolve(PROJECT_ROOT, trimmedValue);
          }
          return trimmedValue;
        }
        return item;
      });
    } else if (typeof value === 'string' && value) {
      // 处理字符串类型的配置项
      const trimmedValue = value.trim();
      if (!path.isAbsolute(trimmedValue)) {
        resolved[key] = path.resolve(PROJECT_ROOT, trimmedValue);
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