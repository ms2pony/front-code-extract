
const { parse } = require('@vue/compiler-sfc');
const parse5 = require('parse5');
const parseJS = require('./parseJS');
const parseCSS = require('./parseCSS');
const push = require('../collector/push');

module.exports = async function parseVue(code, ctx, stack, file) {
  const { descriptor } = parse(code);

  // scripts
  const scripts = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n');
  parseJS(scripts, ctx, stack, file);

  // template
  if (descriptor.template) {
    const fragment = parse5.parseFragment(descriptor.template.content);
    const collect = [];

    function walk(node) {
      if (node.attrs) {
        node.attrs.forEach(attr => {
          if ((attr.name === 'src' || attr.name === 'href') && attr.value) {
            // console.log("template模板处理，collect进来了", attr)
            collect.push(attr.value);
          }
        });
      }
      if (node.childNodes) {
        node.childNodes.forEach(walk);
      }
    }

    fragment.childNodes.forEach(walk);

    collect.forEach(req => {
      if (
        req.startsWith('javascript:') ||
        req.startsWith('#') ||
        req.startsWith('mailto:') ||
        req.startsWith('/') ||  // 过滤掉以/开头的路径（网站路径）
        req.startsWith('http://') ||  // 过滤掉http链接
        req.startsWith('https://') ||  // 过滤掉https链接
        req.startsWith('tel:') ||  // 过滤掉电话链接
        req.startsWith('ftp://')  // 过滤掉ftp链接
      ) return; // ❌ 忽略非资源引用
      push(req, ctx, stack, file); // 模板中的资源引用通常不涉及符号
    });
  }

  // styles
  for (const style of descriptor.styles) {
    const lang = style.lang || 'css'; // 获取 style 标签的 lang 属性
    await parseCSS(style.content, ctx, stack, file, lang);
  }
};
