
const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const push = require('./push');

module.exports = async function parseCSS(code, ctx, stack) {
  await postcss([
    root => {
      root.walkAtRules('import', rule => {
        const req = rule.params.replace(/['"]/g, '').split(/\s|url/)[0];
        push(req, ctx, stack, 'css-import');
      });
      root.walkDecls(decl => {
        valueParser(decl.value).walk(node => {
          if (node.type === 'function' && node.value === 'url' && node.nodes && node.nodes[0]) {
            push(node.nodes[0].value, ctx, stack);
          }
        });
      });
    }
  ]).process(code, { from: undefined,syntax: require('postcss-scss')  });
};
