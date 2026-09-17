import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export function sourceFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? sourceFiles(`${directory}/${entry.name}`)
        : /\.(tsx?|css)$/.test(entry.name)
          ? [`${directory}/${entry.name}`]
          : [],
    );
}
export function checkFrontend(files) {
  const errors = [],
    graph = new Map();
  const feature = (file) => file.match(/^src\/features\/([^/]+)/)?.[1];
  function resolve(file, spec) {
    const base = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), spec.split('?')[0]),
    );
    return [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find((p) =>
      files.has(p),
    );
  }
  for (const [file, source] of files) {
    const imports = file.endsWith('.css')
      ? [...source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)]
          .map((match) => `import ${JSON.stringify(match[1])};`)
          .join('\n')
      : source;
    const ast = ts.createSourceFile(file, imports, ts.ScriptTarget.Latest, true),
      dependencies = [];
    const visit = (node) => {
      let spec,
        typeOnly = false;
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        spec = node.moduleSpecifier.text;
        typeOnly = !!node.isTypeOnly || !!node.importClause?.isTypeOnly;
        if (
          ts.isImportDeclaration(node) &&
          node.importClause?.namedBindings &&
          ts.isNamedImports(node.importClause.namedBindings) &&
          !node.importClause.name
        )
          typeOnly ||= node.importClause.namedBindings.elements.every((n) => n.isTypeOnly);
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        ts.isStringLiteral(node.arguments[0])
      )
        spec = node.arguments[0].text;
      if (spec) {
        if (
          /\/lessons\/[^/]+\/(trace|presets)\.ts$/.test(file) &&
          /^(react|react-dom|@tanstack\/react-query)(\/|$)/.test(spec) &&
          !typeOnly
        )
          errors.push(`${file}: pure lesson code imports ${spec}`);
        if (spec.startsWith('.')) {
          const target = resolve(file, spec);
          if (target) {
            if (file.startsWith('src/shared/') && !target.startsWith('src/shared/'))
              errors.push(`${file}: shared code cannot depend on ${target}`);
            if (
              feature(file) &&
              feature(target) &&
              feature(file) !== feature(target) &&
              !target.endsWith('/index.ts') &&
              !target.endsWith('/index.tsx')
            )
              errors.push(`${file}: cross-feature import must use the public entry: ${target}`);
            if (file.startsWith('src/features/') && target.startsWith('src/app/'))
              errors.push(`${file}: features cannot depend on the application shell`);
            if (
              file.includes('/visualizers/core/') &&
              /\/visualizers\/(lessons|components|registry)/.test(target)
            )
              errors.push(`${file}: visualizer core depends on a lesson or renderer`);
            if (
              /\/lessons\/[^/]+\/trace\.ts$/.test(file) &&
              (/\.(tsx)$/.test(target) ||
                target.includes('/shared/api/') ||
                target.endsWith('/adapter.ts'))
            )
              errors.push(
                `${file}: trace generation must remain independent of presentation and API access`,
              );
            if (!typeOnly) dependencies.push(target);
          } else if (!spec.includes('?raw') && !/\.(py|png|svg)$/.test(spec))
            errors.push(`${file}: unresolved internal module ${spec}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    graph.set(file, dependencies);
  }
  const visited = new Set(),
    active = [];
  function visit(file) {
    if (active.includes(file)) {
      errors.push(
        'Dependency cycle: ' + [...active.slice(active.indexOf(file)), file].join(' -> '),
      );
      return;
    }
    if (visited.has(file)) return;
    active.push(file);
    for (const next of graph.get(file) ?? []) visit(next);
    active.pop();
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file);
  return errors;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkFrontend(
    new Map(sourceFiles('src').map((file) => [file, fs.readFileSync(file, 'utf8')])),
  );
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log('Frontend architecture: boundaries, module resolution, and runtime cycles passed.');
  const python =
    process.env.PYTHON ??
    ['.venv/Scripts/python.exe', '.venv/bin/python'].find((p) => fs.existsSync(p)) ??
    (process.platform === 'win32' ? 'python' : 'python3');
  const result = spawnSync(python, ['scripts/check-architecture.py'], { stdio: 'inherit' });
  if (result.status !== 0) process.exitCode = 1;
}
