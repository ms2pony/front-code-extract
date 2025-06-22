
const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const push = require('./push');
const path = require("path");
const fs = require("fs");


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

  // SCSS partial 文件自动补全 _var.scss → var
  const dirname = path.resolve(ctx);
  const fullPathNoExt = path.resolve(dirname, cleaned);
  const candidates = [
    `${fullPathNoExt}.scss`,
    path.join(path.dirname(fullPathNoExt), `_${path.basename(fullPathNoExt)}.scss`)
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const relativePath = path.relative(ctx, file).replace(/\\/g, '/');
      return relativePath.startsWith('.') ? relativePath : './' + relativePath;
    }
  }

  // 没找到匹配文件，返回原始路径
  return cleaned;
}

module.exports = async function parseCSS(code, ctx, stack) {
  await postcss([
    root => {
      root.walkAtRules('import', rule => {
        const raw = rule.params.replace(/['"]/g, '').split(/\s|url/)[0];
        const cleaned = normalizeRequest(raw,ctx);
        push(cleaned, ctx, stack, 'css-import');
      });
      root.walkDecls(decl => {
        valueParser(decl.value).walk(node => {
          if (node.type === 'function' && node.value === 'url' && node.nodes && node.nodes[0]) {
            // console.log("root.walkDecls -- request",node.nodes[0].value)
            const cleaned = normalizeRequest(node.nodes[0].value,ctx);
            push(cleaned, ctx, stack);
          }
        });
      });
    }
  ]).process(code, { from: undefined,syntax: require('postcss-scss')  });
};
