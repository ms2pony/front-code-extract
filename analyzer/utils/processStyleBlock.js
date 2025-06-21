// utils/processStyleBlock.js
const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

/**
 * 将 lang=css/scss/less 等的 style 内容处理成标准 CSS
 * @param {string} content - 样式源码
 * @param {string} lang - scss、css、less、stylus 等
 * @returns {Promise<string>} 编译后的标准 CSS
 */
async function processStyleBlock(content, lang = 'css') {
  let css = content;

  if (lang === 'scss' || lang === 'sass') {
    const result = sass.compileString(content, {
      style: 'expanded',
      loadPaths: ['./src', './node_modules']
    });
    css = result.css;
  }

  // 也可以 future 支持 less、stylus
  // TODO: less.compile() / stylus.render()

  // postcss 处理（可添加 autoprefixer, postcss-pxtorem 等）
  const processed = await postcss([autoprefixer]).process(css, { from: undefined });

  return processed.css;
}

module.exports = { processStyleBlock };
