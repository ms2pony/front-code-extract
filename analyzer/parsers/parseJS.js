
const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const push = require('../collector/push');
const path = require('path')

module.exports = function parseJS(code, ctx, stack, file) {
  if (!code || !code.trim()) return;
  const ast = babel.parse(code, 
    { sourceType: 
      // 'unambiguous', 
      'module', //用module试试，看会不会有问题
      plugins: ['typescript', 'jsx'] }
  );
  traverse(ast, {
    ImportDeclaration({ node }) {
      push(node.source.value, ctx, stack,file);
    },
    ExportNamedDeclaration({ node }) {
      if (node.source) push(node.source.value, ctx, stack,file);
    },
    CallExpression({ node }) {
      const callee = node.callee.name;
      const arg = node.arguments[0];
      if ((callee === 'require' || callee === 'import') && arg && arg.type === 'StringLiteral') {
        push(arg.value, ctx, stack, file);
      }
    }
  });
};
