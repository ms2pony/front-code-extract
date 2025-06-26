
const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const push = require('../collector/push');
const path = require("path");
const fs = require("fs");
const { resolvePath } = require('../resolve');

// 统一清洗路径
function normalizeRequest(request, ctx) {
  // 去除 ~ 前缀
  let cleaned = request.startsWith('~') ? request.slice(1) : request;

  // 如果不是相对路径、绝对路径、别名路径，加上 ./
  const needsDotSlash =
    !cleaned.startsWith('.') &&
    !cleaned.startsWith('/') &&
    !cleaned.includes('@');

  if (needsDotSlash) {
    cleaned = './' + cleaned;
  }

  // 构建候选路径列表
  const candidates = [
    cleaned,
    `${cleaned}.scss`,
    `${cleaned}.css`,
    `${cleaned}.less`,
    `${cleaned}.styl`,
    `${cleaned}.stylus`,
    `${cleaned}/index.scss`,
    `${cleaned}/index.css`,
    `${cleaned}/index.less`
  ];

  // 如果是相对路径或包含路径分隔符，添加 SCSS partial 候选项
  if (cleaned.includes('/') || cleaned.startsWith('.')) {
    const baseName = path.basename(cleaned);
    const dirName = path.dirname(cleaned);
    candidates.push(
      path.join(dirName, `_${baseName}.scss`).replace(/\\/g, '/'),
      path.join(dirName, `_${baseName}.css`).replace(/\\/g, '/'),
      path.join(dirName, `_${baseName}.less`).replace(/\\/g, '/')
    );
  } else {
    // 对于单个文件名，也添加 partial 候选项
    candidates.push(
      `_${cleaned}.scss`,
      `_${cleaned}.css`,
      `_${cleaned}.less`
    );
  }

  // if(cleaned==='@auth/assets/style/components/var'){
  //   console.log("normalizeRequest -- finall candidates", candidates)
  // }

  // 使用 resolvePath 逐个尝试候选路径
  for (const candidate of candidates) {
    const result = resolvePath(ctx, candidate);
    // if(cleaned==='@auth/assets/style/components/var'){
    //   console.log("for循环", result)
    // }
    
    if (result.resolvedPath && fs.existsSync(result.resolvedPath)) {
      // 返回相对于 ctx 的路径
      const relativePath = path.relative(ctx, result.resolvedPath).replace(/\\/g, '/');
      return relativePath.startsWith('.') ? relativePath : './' + relativePath;
    }
  }

  // 没找到匹配文件，返回原始路径
  return cleaned;
}

module.exports = async function parseCSS(code, ctx, stack, file, lang = 'css') {
  let syntax;
  
  // 如果没有明确指定 lang，根据文件扩展名推断
  if (lang === 'css' && file) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.scss' || ext === '.sass') {
      lang = 'scss';
    } else if (ext === '.less') {
      lang = 'less';
    } else if (ext === '.styl' || ext === '.stylus') {
      lang = 'stylus';
    }
  }
  
  // 根据语言类型选择对应的语法解析器
  switch (lang) {
    case 'less':
      try {
        syntax = require('postcss-less');
      } catch (e) {
        console.warn('postcss-less not found, falling back to postcss-scss');
        syntax = require('postcss-scss');
      }
      break;
    case 'scss':
    case 'sass':
      syntax = require('postcss-scss');
      break;
    case 'stylus':
      try {
        syntax = require('postcss-stylus');
      } catch (e) {
        console.warn('postcss-stylus not found, falling back to postcss-scss');
        syntax = require('postcss-scss');
      }
      break;
    default:
      syntax = undefined; // 使用默认的 CSS 解析器
  }
  
  try {
    await postcss([
      root => {
        root.walkAtRules('import', rule => {
          const raw = rule.params.replace(/['"]/g, '').split(/\s|url/)[0];
          const cleaned = normalizeRequest(raw, ctx);
          push(cleaned, ctx, stack, file);
        });
        root.walkDecls(decl => {
          valueParser(decl.value).walk(node => {
            if (node.type === 'function' && node.value === 'url' && node.nodes && node.nodes[0]) {
              const cleaned = normalizeRequest(node.nodes[0].value, ctx);
              push(cleaned, ctx, stack, file);
            }
          });
        });
      }
    ]).process(code, { from: undefined, syntax });
  } catch (error) {
    console.warn(`CSS parsing failed for ${file || 'unknown file'}:`, error.message);
    // 继续执行，不中断整个解析过程
  }
};
