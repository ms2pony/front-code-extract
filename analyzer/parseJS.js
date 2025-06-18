
const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const push = require('./push');

module.exports = function parseJS(code, ctx, stack) {
  if (!code || !code.trim()) return;
  const ast = babel.parse(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx'] });
  traverse(ast, {
    ImportDeclaration({ node }) {
      push(node.source.value, ctx, stack);
    },
    ExportNamedDeclaration({ node }) {
      if (node.source) push(node.source.value, ctx, stack);
    },
    CallExpression({ node }) {
      const callee = node.callee.name;
      const arg = node.arguments[0];
      if ((callee === 'require' || callee === 'import') && arg && arg.type === 'StringLiteral') {
        push(arg.value, ctx, stack);
      }
    }
  });
};
