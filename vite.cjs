'use strict';

var path = require('path');
var fs = require('fs');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var path__default = /*#__PURE__*/_interopDefault(path);

// src/integrations/vite.ts
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

// src/integrations/vite.ts
function moduleBytes(modules) {
  if (!modules) return [];
  return Object.entries(modules).map(([id, info]) => ({ id, bytes: info.renderedLength ?? 0 })).sort((a, b) => b.bytes - a.bytes).slice(0, 1e4);
}
function codeUsageMapVitePlugin(options = {}) {
  const filename = options.filename ?? "code-usage-map.vite.json";
  const routeEntries = options.routeEntries ?? {};
  let root = process.cwd();
  let outputDirectory = "";
  let manifest;
  return {
    name: "code-usage-map:vite",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      root = config.root ?? process.cwd();
      outputDirectory = path__default.default.resolve(root, config.build?.outDir ?? "dist");
    },
    generateBundle(options2, bundle) {
      outputDirectory = options2.dir ? path__default.default.resolve(options2.dir) : outputDirectory;
      const chunks = [];
      const entryChunks = /* @__PURE__ */ new Map();
      const chunkFileByName = /* @__PURE__ */ new Map();
      const htmlRoutes = /* @__PURE__ */ new Map();
      for (const item of Object.values(bundle)) {
        if (item.type !== "chunk") continue;
        if (item.name) chunkFileByName.set(item.name, item.fileName);
      }
      for (const [bundleKey, item] of Object.entries(bundle)) {
        if (item.type === "asset" && /\.html?$/i.test(item.fileName)) {
          const route = `/${item.fileName.replace(/\.html?$/i, "").replace(/^index$/, "")}`.replace(/\/+/g, "/");
          const normalized = route === "" ? "/" : route;
          htmlRoutes.set(normalized, [item.fileName]);
        }
      }
      const staticImports = /* @__PURE__ */ new Map();
      for (const item of Object.values(bundle)) {
        if (item.type !== "chunk") continue;
        staticImports.set(item.fileName, new Set(item.imports ?? []));
      }
      const initial = /* @__PURE__ */ new Set();
      const queue = [];
      for (const item of Object.values(bundle)) {
        if (item.type !== "chunk") continue;
        if (item.isEntry) {
          initial.add(item.fileName);
          queue.push(item.fileName);
          const derived = routeFromEntryName(item.name ?? item.fileName);
          if (!entryChunks.has(derived)) entryChunks.set(derived, item.fileName);
        }
      }
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        for (const imported of staticImports.get(current) ?? []) {
          if (initial.has(imported)) continue;
          initial.add(imported);
          queue.push(imported);
        }
      }
      for (const item of Object.values(bundle)) {
        if (item.type !== "chunk") continue;
        const css = item.viteMetadata?.importedCss ? [...item.viteMetadata.importedCss] : [];
        const routes = [...entryChunks.entries()].filter(([, file]) => file === item.fileName).map(([route]) => route);
        if (routes.length === 0 && item.isEntry) routes.push("/");
        chunks.push({
          file: item.fileName,
          entry: Boolean(item.isEntry),
          initial: initial.has(item.fileName),
          imports: item.imports ?? [],
          dynamicImports: item.dynamicImports ?? [],
          css,
          modules: moduleBytes(item.modules),
          routes
        });
      }
      const routeManifest = /* @__PURE__ */ new Map();
      for (const [route, files] of htmlRoutes) routeManifest.set(route, { files, initial: true });
      for (const [route, file] of Object.entries(routeEntries)) {
        const resolved = chunkFileByName.get(file) ?? file;
        const existing = routeManifest.get(route);
        if (existing) existing.files.push(resolved);
        else routeManifest.set(route, { files: [resolved], initial: true });
      }
      for (const [route, file] of entryChunks) {
        const existing = routeManifest.get(route);
        if (existing) existing.files.push(file);
        else routeManifest.set(route, { files: [file], initial: true });
      }
      if (routeManifest.size === 0) routeManifest.set("/", { files: [], initial: true });
      manifest = {
        schemaVersion: BUILD_MANIFEST_SCHEMA_VERSION,
        buildTool: "vite",
        generator: "@codewithrajat/code-usage-map/vite",
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        chunks,
        routes: [...routeManifest.entries()].map(([route, value]) => ({
          route,
          files: [...new Set(value.files)],
          initial: value.initial
        }))
      };
    },
    closeBundle() {
      if (!manifest) return;
      try {
        writeBuildManifest(outputDirectory, filename, manifest);
      } catch {
      }
    }
  };
}

exports.codeUsageMapVitePlugin = codeUsageMapVitePlugin;
//# sourceMappingURL=vite.cjs.map
//# sourceMappingURL=vite.cjs.map