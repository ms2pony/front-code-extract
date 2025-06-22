
const { parse } = require('@vue/compiler-sfc');
const parse5 = require('parse5');
const parseJS = require('./parseJS');
const parseCSS = require('./parseCSS');
const push = require('../collector/push');

module.exports = async function parseVue(code, ctx, stack) {
  const { descriptor } = parse(code);

  // console.log("parseVue", ctx)
  // return

  // scripts
  const scripts = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n');
  parseJS(scripts, ctx, stack);

  // template
  if (descriptor.template) {
    // const collect = [];
    // const parser = new html.Parser({
    //   onopentag(name, attrs) {
    //     ['src', 'href'].forEach(k => attrs[k] && collect.push(attrs[k]));
    //   }
    // });
    // parser.write(descriptor.template.content); parser.end();
    // collect.forEach(req => push(req, ctx, stack));

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
        req.startsWith('mailto:')
      ) return; // ❌ 忽略非资源引用
      push(req, ctx, stack);
    });
  }

  // styles
  for (const style of descriptor.styles) {
    // scssCode = style.content.replace(/@import\s+["']~(.*?)["']/g, '@import "$1"');

    await parseCSS(style.content, ctx, stack);
  }
};
