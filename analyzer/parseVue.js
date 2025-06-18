
const { parse } = require('@vue/compiler-sfc');
const html = require('htmlparser2');
const parseJS = require('./parseJS');
const parseCSS = require('./parseCSS');
const push = require('./push');

module.exports = async function parseVue(code, ctx, stack) {
  const { descriptor } = parse(code);

  // scripts
  const scripts = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n');
  parseJS(scripts, ctx, stack);

  // template
  if (descriptor.template) {
    const collect = [];
    const parser = new html.Parser({
      onopentag(name, attrs) {
        ['src', 'href'].forEach(k => attrs[k] && collect.push(attrs[k]));
      }
    });
    parser.write(descriptor.template.content); parser.end();
    collect.forEach(req => push(req, ctx, stack));
  }

  // styles
  for (const style of descriptor.styles) {
    await parseCSS(style.content, ctx, stack);
  }
};
