// dep-graph.js
const fs       = require('fs');
const path     = require('path');
const { parse }    = require('@babel/parser');
const traverse     = require('@babel/traverse').default;

const exts = ['.ts','.tsx','.js','.jsx','.mjs','.cjs','.vue'];   // 需要时再补
const cache = new Map();      // fileAbs → { imports:[…], exports:[…] }
const barrelMap = new Map();  // barrelAbs → { exportName:fileAbs }

function parseFile(fileAbs) {
  if (cache.has(fileAbs)) return cache.get(fileAbs);

  const code = fs.readFileSync(fileAbs, 'utf8');
  const ast  = parse(code, { sourceType:'module', plugins:['typescript','jsx'] });

  const info = { imports:[], reExports:[], exportAll:[] };
  cache.set(fileAbs, info);

  traverse(ast, {
    // import {A as B} from './a'
    ImportDeclaration({ node }) {
      info.imports.push({ src: node.source.value, specifiers: node.specifiers });
    },

    // export { A } from './a'
    ExportNamedDeclaration({ node }) {
      if (node.source) {
        info.reExports.push({ src: node.source.value, specifiers: node.specifiers });
      }
    },

    // export * from './a'
    ExportAllDeclaration({ node }) {
      info.exportAll.push(node.source.value);
    },

    // require('…')   import('…')
    CallExpression({ node }) {
      const callee = node.callee.name;
      if ((callee === 'require' || callee === 'import')
          && node.arguments[0]?.type === 'StringLiteral') {
        info.imports.push({ src: node.arguments[0].value, specifiers: null/*namespace*/ });
      }
    },
  });

  return info;
}

/* ---------- 解析 barrel：导出名 → 实际文件 ---------- */
function buildBarrelMap(barrelAbs) {
  if (barrelMap.has(barrelAbs)) return barrelMap.get(barrelAbs);
  const info = parseFile(barrelAbs);
  const map  = {};

  // 1) export { X } from './x'
  info.reExports.forEach(({ src, specifiers }) => {
    const targetAbs = resolveFile(barrelAbs, src);
    specifiers.forEach(s => { map[s.exported.name] = targetAbs; });
  });

  // 2) export * from './y'
  info.exportAll.forEach(src => {
    const tAbs  = resolveFile(barrelAbs, src);
    const sub   = buildBarrelMap(tAbs);          // 递归
    Object.assign(map, sub);                     // 扑进来
  });

  // 3) 自身声明的导出，直接指向 barrel 本身
  //    (export const Foo = …)  or  export default
  //    已在 parse 阶段没记录，这里可略过，默认当作 barrel 本身
  barrelMap.set(barrelAbs, map);
  return map;
}

/* ---------- 路径解析 (alias/扩展名) ---------- */
function resolveFile(fromAbs, request) {
  if (/^[./]/.test(request)) {           // 相对 & 绝对
    const base = path.resolve(path.dirname(fromAbs), request);
    return addExt(base);
  }
  // alias，例如 '@tender/routes'
  if (request.startsWith('@tender/')) {
    const base = request.replace('@tender/', path.resolve(__dirname,'src/')+'/');
    return addExt(base);
  }
  throw new Error(`unhandled resolve for ${request}`);
}
function addExt(base) {
  if (fs.existsSync(base)) return base;
  for (const e of exts) if (fs.existsSync(base+e)) return base+e;
  throw new Error(`File not found: ${base}`);
}

/* ---------- DFS 构图 (入口文件 → 真依赖) ---------- */
function collect(entryAbs, graph = new Set()) {
  if (graph.has(entryAbs)) return;
  graph.add(entryAbs);

  const info = parseFile(entryAbs);

  // 每条 import
  for (const { src, specifiers } of info.imports) {
    const depAbs = resolveFile(entryAbs, src);

    // 如果对方是 barrel 且有指名道姓的 specifier，就精准跳转
    if (specifiers && specifiers.length && depAbs.endsWith('index.ts')) {
      const map = buildBarrelMap(depAbs);
      specifiers.forEach(sp => {
        const name   = sp.imported ? sp.imported.name : 'default';
        const real   = map[name] || depAbs;    // 没解析到就留 barrel 本身
        collect(real, graph);
      });
    } else {
      collect(depAbs, graph);
    }
  }
  // 被 export from 的也是依赖：让 re-export 能正常工作
  info.reExports.forEach(({src}) => collect(resolveFile(entryAbs, src), graph));
  info.exportAll  .forEach( src  => collect(resolveFile(entryAbs, src), graph));

  return graph;
}

/* ---------- 使用示例 ---------- */
const entry = path.resolve(__dirname,'src/pages/Checkout.vue');
const deps  = [...collect(entry)].sort();
fs.writeFileSync('deps.json', JSON.stringify(deps,null,2));
console.log(`✔ ${deps.length} files collected`);
