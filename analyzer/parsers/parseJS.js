
const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const push = require('../collector/push');
const path = require('path')

module.exports = function parseJS(code, ctx, stack, file) {
  // if(file && path.normalize(file) === path.normalize('J:\\ifs-eui\\src\\modules\\tender\\routes\\house-resource\\house-resource-purchaser.js')){
  //   console.log("parseJS ->",code)
  // }

  if (!code || !code.trim()) return;
  const ast = babel.parse(code, { sourceType: 'unambiguous', plugins: ['typescript', 'jsx'] });
  traverse(ast, {
    ImportDeclaration({ node }) {
      // console.log("ImportDeclaration", node)
      if(file && path.normalize(file) === path.normalize('J:\\ifs-eui\\src\\modules\\tender\\routes\\house-resource\\house-resource-purchaser.js')){
        console.log("ImportDeclaration ->",node)
      }
      // return
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
