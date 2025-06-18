
const path = require('path');
const fs = require('fs');
const { ResolverFactory, CachedInputFileSystem } = require('enhanced-resolve');

let aliasRoot = process.cwd();

function setAliasRoot(root) {
  aliasRoot = root;
}

function createResolver() {
  return ResolverFactory.createResolver({
    alias: {
      '@': path.join(aliasRoot, 'src'),
      '@styles': path.join(aliasRoot, 'src/styles'),
      '@assets': path.join(aliasRoot, 'src/assets'),
      '@components': path.join(aliasRoot, 'src/components')
    },
    extensions: ['.vue', '.js', '.ts', '.json', '.css', '.less', '.png'],
    mainFiles: ['index'],
    fileSystem: new CachedInputFileSystem(fs, 4000),
    symlinks: false,
    useSyncFileSystemCalls: true
  });
}

let resolver = createResolver();

function resetResolver() {
  resolver = createResolver();
}

function resolvePath(ctx, request) {
  const cleaned = request.startsWith('~') ? request.slice(1) : request;
  return resolver.resolveSync({}, ctx, cleaned);
}

module.exports = { resolvePath, setAliasRoot, resetResolver };
