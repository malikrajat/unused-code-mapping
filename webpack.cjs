'use strict';

var path = require('path');
var fs = require('fs');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var path__default = /*#__PURE__*/_interopDefault(path);

// src/integrations/build-manifest.ts
var BUILD_MANIFEST_SCHEMA_VERSION = 1;
function writeBuildManifest(outputDirectory, filename, manifest) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const file = path__default.default.join(outputDirectory, filename);
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}
`, "utf8");
  return file;
}
function routeFromEntryName(name) {
  const withoutLoader = name.split("!").pop() ?? name;
  const cleaned = withoutLoader.replace(/\\/g, "/").replace(/[?#].*$/, "");
  const base = path__default.default.posix.basename(cleaned);
  if (/^(index|main|app|client|bundle)(\.|$)/i.test(base)) return "/";
  const withoutExtension = cleaned.replace(/\.(html?|js|mjs|css)$/i, "").replace(/^\.?\//, "");
  if (!withoutExtension) return "/";
  return `/${withoutExtension}`.replace(/\/+/g, "/");
}

// src/integrations/webpack.ts
function moduleId(module) {
  const raw = module.identifier ?? module.name ?? "";
  const withoutLoaders = raw.split("!").pop() ?? raw;
  return withoutLoaderPrefix(withoutLoaders);
}
function withoutLoaderPrefix(value) {
  return value.replace(/^webpack:\/\/[^/]*\/?/, "").replace(/^\.\//, "").replace(/[?#].*$/, "");
}
var CodeUsageMapWebpackPlugin = class {
  name = "code-usage-map-webpack";
  filename;
  routeEntries;
  constructor(options = {}) {
    this.filename = options.filename ?? "code-usage-map.webpack.json";
    this.routeEntries = options.routeEntries ?? {};
  }
  apply(compiler) {
    const outputDirectory = compiler.options?.output?.path ?? process.cwd();
    const write = async (compilation) => {
      const stats = compilation.getStats().toJson({
        all: false,
        assets: true,
        chunks: true,
        chunkModules: true,
        modules: true,
        nestedModules: true,
        entrypoints: true
      });
      const chunks = (stats.chunks ?? []).map((chunk) => {
        const files = (chunk.files ?? []).map((file) => file.replaceAll("\\", "/"));
        const modules = (chunk.modules ?? []).map((module) => ({ id: moduleId(module), bytes: module.size ?? 0 })).filter((module) => module.id.length > 0).sort((a, b) => b.bytes - a.bytes).slice(0, 1e4);
        const names = chunk.names ?? [];
        const routes2 = chunk.entry ? names.length > 0 ? names.map((name) => routeFromEntryName(name)) : ["/"] : [];
        return {
          file: files[0] ?? "",
          entry: Boolean(chunk.entry),
          initial: chunk.initial !== false,
          imports: [],
          dynamicImports: [],
          css: files.filter((file) => file.endsWith(".css")),
          modules,
          routes: [...new Set(routes2)]
        };
      }).filter((chunk) => chunk.file !== "");
      const routes = /* @__PURE__ */ new Map();
      const assetsByEntryName = /* @__PURE__ */ new Map();
      for (const [entryName, entrypoint] of Object.entries(stats.entrypoints ?? {})) {
        const route = routeFromEntryName(entryName);
        const files = (entrypoint.assets ?? []).map((asset) => asset.name).filter((name) => Boolean(name)).map((name) => name.replaceAll("\\", "/"));
        assetsByEntryName.set(entryName, files);
        const set = routes.get(route) ?? /* @__PURE__ */ new Set();
        for (const file of files) set.add(file);
        routes.set(route, set);
      }
      for (const [route, entry] of Object.entries(this.routeEntries)) {
        const set = routes.get(route) ?? /* @__PURE__ */ new Set();
        const files = assetsByEntryName.get(entry);
        if (files) for (const file of files) set.add(file);
        else set.add(entry);
        routes.set(route, set);
      }
      if (routes.size === 0) routes.set("/", /* @__PURE__ */ new Set());
      const manifest = {
        schemaVersion: BUILD_MANIFEST_SCHEMA_VERSION,
        buildTool: "webpack",
        generator: "@codewithrajat/code-usage-map/webpack",
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        chunks,
        routes: [...routes.entries()].map(([route, files]) => ({
          route,
          files: [...files],
          initial: true
        }))
      };
      writeBuildManifest(outputDirectory, this.filename, manifest);
    };
    if (compiler.hooks?.afterEmit?.tapPromise) {
      compiler.hooks.afterEmit.tapPromise(this.name, write);
    } else if (compiler.hooks?.afterEmit?.tap) {
      compiler.hooks.afterEmit.tap(this.name, (compilation) => {
        void write(compilation).catch(() => void 0);
      });
    }
  }
};

exports.CodeUsageMapWebpackPlugin = CodeUsageMapWebpackPlugin;
//# sourceMappingURL=webpack.cjs.map
//# sourceMappingURL=webpack.cjs.map