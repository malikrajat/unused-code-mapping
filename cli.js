#!/usr/bin/env node
import path8 from 'path';
import { existsSync, statSync, writeFileSync, readFileSync, readdirSync, unlinkSync, createReadStream, copyFileSync, mkdirSync } from 'fs';
import { spawnSync, spawn } from 'child_process';
import { stdin, stderr } from 'process';
import fg from 'fast-glob';
import { Command } from 'commander';
import pc from 'picocolors';
import { pathToFileURL, fileURLToPath } from 'url';
import { builtinModules, createRequire } from 'module';
import ts7 from 'typescript';
import { createHash } from 'crypto';
import postcss from 'postcss';
import scss from 'postcss-scss';
import less from 'postcss-less';
import selectorParser from 'postcss-selector-parser';
import { originalPositionFor, AnyMap, decodedMappings } from '@jridgewell/trace-mapping';
import { brotliCompressSync, constants, gzipSync } from 'zlib';
import { createInterface } from 'readline/promises';
import http from 'http';

// src/version.ts
var TOOL_VERSION = "1.0.0";
var CACHE_VERSION = 7;
function toPosix(value) {
  return value.replaceAll("\\", "/");
}
function relativePosix(root, file) {
  const relative = path8.relative(root, file);
  return toPosix(relative === "" ? "." : relative);
}
function resolveFrom(root, value) {
  return path8.isAbsolute(value) ? path8.normalize(value) : path8.resolve(root, value);
}
function hashString(value, length = 16) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}
function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}
function readText(file) {
  return readFileSync(file, "utf8");
}
function readJsonFile(file) {
  return JSON.parse(readText(file));
}
function writeJsonFile(file, value) {
  ensureDir(path8.dirname(file));
  writeFileSync(file, `${JSON.stringify(value, null, 2)}
`, "utf8");
}
function writeTextFile(file, value) {
  ensureDir(path8.dirname(file));
  writeFileSync(file, value, "utf8");
}
function safeReadJson(file) {
  if (!existsSync(file)) return void 0;
  try {
    return readJsonFile(file);
  } catch {
    return void 0;
  }
}
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unit]}`;
}
function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(2);
  return `${rounded}%`;
}
function truncate(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}\u2026`;
}
function abortError(signal) {
  if (!signal?.aborted) return void 0;
  const reason = signal.reason;
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === "string" ? reason : "Operation aborted");
}
function throwIfAborted(signal) {
  const error = abortError(signal);
  if (error) throw error;
}
function splitComma(value) {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

// src/integrations/detect.ts
var FRAMEWORKS = [
  { name: "React", pkg: "react" },
  { name: "Preact", pkg: "preact" },
  { name: "Vue", pkg: "vue" },
  { name: "Angular", pkg: "@angular/core" },
  { name: "Svelte", pkg: "svelte" },
  { name: "Solid", pkg: "solid-js" },
  { name: "Next.js", pkg: "next" },
  { name: "Nuxt", pkg: "nuxt" },
  { name: "Astro", pkg: "astro" },
  { name: "Lit / Web Components", pkg: "lit" },
  { name: "Ember", pkg: "ember-source" },
  { name: "Qwik", pkg: "@builder.io/qwik" }
];
var BUILD_TOOLS = [
  { name: "Vite", pkg: "vite", configs: ["vite.config.ts", "vite.config.js", "vite.config.mjs", "vite.config.mts"] },
  { name: "Webpack", pkg: "webpack", configs: ["webpack.config.js", "webpack.config.ts", "webpack.config.cjs", "webpack.config.mjs"] },
  { name: "Rollup", pkg: "rollup", configs: ["rollup.config.js", "rollup.config.ts", "rollup.config.mjs"] },
  { name: "esbuild", pkg: "esbuild", configs: ["esbuild.config.js", "esbuild.config.mjs", "esbuild.config.ts"] },
  { name: "Parcel", pkg: "parcel", configs: [".parcelrc"] },
  { name: "Angular CLI", pkg: "@angular/cli", configs: ["angular.json"] },
  { name: "Next.js", pkg: "next", configs: ["next.config.js", "next.config.mjs", "next.config.ts"] },
  { name: "Nuxt", pkg: "nuxt", configs: ["nuxt.config.ts", "nuxt.config.js"] },
  { name: "Astro", pkg: "astro", configs: ["astro.config.mjs", "astro.config.ts", "astro.config.js"] }
];
var SOURCE_FILE_GLOBS = [
  "**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
  "**/*.{css,scss,sass,less}",
  "**/*.{html,htm}",
  "**/*.{vue,svelte,astro}"
];
var DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.hg/**",
  "**/.svn/**",
  "**/coverage/**",
  "**/.nyc_output/**",
  "**/.cache/**",
  "**/.turbo/**",
  "**/.parcel-cache/**",
  "**/.vite/**",
  "**/__snapshots__/**"
];
var SAFE_EXCLUDE_PATTERNS = DEFAULT_EXCLUDES;
var BUILD_DIR_CANDIDATES = [
  "dist",
  "build",
  "out",
  "output",
  "www",
  "public/build",
  "public/dist",
  "storybook-static",
  ".next",
  ".next/static",
  ".nuxt",
  ".nuxt/dist/client",
  ".output/public",
  ".svelte-kit/output/client",
  ".astro"
];
var LANGUAGE_BY_EXT = {
  ".js": "js",
  ".jsx": "jsx",
  ".mjs": "mjs",
  ".cjs": "cjs",
  ".ts": "ts",
  ".tsx": "tsx",
  ".mts": "mts",
  ".cts": "cts",
  ".css": "css",
  ".scss": "scss",
  ".sass": "sass",
  ".less": "less",
  ".html": "html",
  ".htm": "html",
  ".vue": "vue",
  ".svelte": "svelte",
  ".astro": "astro",
  ".json": "json"
};
function fileType(file) {
  return LANGUAGE_BY_EXT[path8.extname(file).toLowerCase()] ?? "other";
}
function isScriptFile(file) {
  const type = fileType(file);
  return ["js", "jsx", "mjs", "cjs", "ts", "tsx", "mts", "cts", "vue", "svelte", "astro"].includes(type);
}
function isStyleFile(file) {
  return ["css", "scss", "sass", "less"].includes(fileType(file));
}
function isTemplateFile(file) {
  return ["html", "vue", "svelte", "astro"].includes(fileType(file));
}
function readPackageJson(root) {
  const file = path8.join(root, "package.json");
  if (!existsSync(file)) return {};
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    if (raw && typeof raw === "object") {
      return { path: file, value: raw };
    }
  } catch {
    return { path: file };
  }
  return { path: file };
}
function detectPackageManager(root, pkg) {
  const declared = pkg?.packageManager?.split("@")[0]?.trim();
  if (declared) return declared;
  if (existsSync(path8.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path8.join(root, "yarn.lock"))) return "yarn";
  if (existsSync(path8.join(root, "bun.lockb")) || existsSync(path8.join(root, "bun.lock"))) return "bun";
  if (existsSync(path8.join(root, "package-lock.json"))) return "npm";
  return "npm";
}
function detectProject(root, options = {}) {
  const { path: packageJsonPath, value: pkg } = readPackageJson(root);
  const dependencies = {
    ...pkg?.dependencies ?? {},
    ...pkg?.devDependencies ?? {}
  };
  const frameworks = FRAMEWORKS.filter((item) => item.pkg in dependencies).map((item) => ({
    name: item.name,
    packageName: item.pkg,
    source: "dependency"
  }));
  const buildTools = [];
  for (const tool of BUILD_TOOLS) {
    const hasPackage = tool.pkg in dependencies;
    const config = tool.configs.find((name) => existsSync(path8.join(root, name)));
    if (hasPackage || config) {
      buildTools.push({
        name: tool.name,
        source: hasPackage ? "dependency" : "config-file"
      });
    }
  }
  const configuredBuildDirs = options.buildDirs?.length ? options.buildDirs.map((dir) => path8.resolve(root, dir)) : [];
  const autoBuildDirs = BUILD_DIR_CANDIDATES.map((dir) => path8.resolve(root, dir)).filter((dir) => existsSync(dir));
  const buildDirs = dedupePaths(configuredBuildDirs.length ? configuredBuildDirs : autoBuildDirs).filter((dir) => existsSync(dir));
  for (const dir of buildDirs) {
    if (!buildTools.some((tool) => tool.name === "Vite") && existsSync(path8.join(dir, ".vite"))) {
      buildTools.push({ name: "Vite", source: "build-output" });
    }
    if (!buildTools.some((tool) => tool.name === "Next.js") && path8.basename(path8.dirname(dir)) === ".next") {
      buildTools.push({ name: "Next.js", source: "build-output" });
    }
  }
  const sourceRoots = (options.source?.length ? options.source : detectSourceRoots(root)).map(
    (dir) => path8.resolve(root, dir)
  );
  const tsconfigCandidate = options.tsconfig ? path8.resolve(root, options.tsconfig) : ["tsconfig.json", "tsconfig.build.json", "jsconfig.json"].map((name) => path8.join(root, name)).find((file) => existsSync(file));
  const ignore = [
    ...DEFAULT_EXCLUDES,
    ...buildDirs.map((dir) => `${toPosix(path8.relative(root, dir))}/**`),
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/.nuxt/**",
    "**/.svelte-kit/**"
  ];
  const files = fg.sync(SOURCE_FILE_GLOBS, {
    cwd: root,
    absolute: true,
    onlyFiles: true,
    unique: true,
    dot: false,
    ignore
  }).map((file) => path8.normalize(file));
  const filesByLanguage = {};
  const textFiles = [];
  const supportedFiles = [];
  const templateFiles = [];
  for (const file of files) {
    const type = fileType(file);
    filesByLanguage[type] = (filesByLanguage[type] ?? 0) + 1;
    if (type !== "other") textFiles.push(file);
    if (isScriptFile(file) || isStyleFile(file) || type === "html") supportedFiles.push(file);
    if (options.includeTemplates !== false && isTemplateFile(file)) templateFiles.push(file);
  }
  return {
    root,
    name: pkg?.name ?? path8.basename(root),
    version: pkg?.version,
    packageJsonPath,
    packageJson: pkg,
    packageManager: detectPackageManager(root, pkg),
    frameworks,
    buildTools: dedupeBuildTools(buildTools),
    sourceRoots,
    buildDirs,
    detectedEntryPoints: detectEntryPoints(root, pkg, sourceRoots),
    tsconfig: tsconfigCandidate,
    filesByLanguage,
    textFiles,
    supportedFiles,
    templateFiles
  };
}
function dedupePaths(values) {
  const seen = /* @__PURE__ */ new Set();
  return values.filter((value) => {
    const normalized = path8.resolve(value);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
function dedupeBuildTools(values) {
  const seen = /* @__PURE__ */ new Set();
  return values.filter((value) => {
    if (seen.has(value.name)) return false;
    seen.add(value.name);
    return true;
  });
}
function detectSourceRoots(root) {
  const candidates = ["src", "app", "source", "ui", "client", "frontend"];
  const found = candidates.filter((dir) => existsSync(path8.join(root, dir)));
  if (found.length > 0) return found;
  return ["."];
}
function detectEntryPoints(root, pkg, sourceRoots) {
  const results = /* @__PURE__ */ new Set();
  const packageFields = [pkg?.source, pkg?.module, pkg?.main, pkg?.browser];
  for (const field of packageFields) {
    if (!field) continue;
    const resolved = path8.resolve(root, field);
    if (existsSync(resolved) && sourceRoots.some((dir) => resolved.startsWith(dir))) {
      results.add(resolved);
    }
  }
  const globs = [
    "main.{js,jsx,ts,tsx,mjs,mts}",
    "index.{js,jsx,ts,tsx,mjs,mts}",
    "app.{js,jsx,ts,tsx,mjs,mts}",
    "**/main.{js,jsx,ts,tsx,mjs,mts}",
    "**/index.{js,jsx,ts,tsx,mjs,mts}",
    "**/App.{js,jsx,ts,tsx}",
    "**/root.{js,jsx,ts,tsx}",
    "**/+page.{js,jsx,ts,tsx,svelte,vue}",
    "**/page.{js,jsx,ts,tsx}",
    "**/pages/**/*.{js,jsx,ts,tsx,vue,svelte,astro}",
    "**/app/**/page.{js,jsx,ts,tsx}",
    "**/routes/**/*.{js,jsx,ts,tsx,vue,svelte}",
    "**/pages/**/*.{md,mdx}"
  ];
  const ignore = [
    ...DEFAULT_EXCLUDES,
    "**/*.test.*",
    "**/*.spec.*",
    "**/*.stories.*",
    "**/dist/**",
    "**/build/**"
  ];
  const files = fg.sync(globs, {
    cwd: root,
    absolute: true,
    onlyFiles: true,
    unique: true,
    ignore
  });
  for (const file of files) {
    if (sourceRoots.some((dir) => file.startsWith(dir) || dir === root)) results.add(path8.normalize(file));
  }
  if (results.size === 0) {
    const fallback = fg.sync(["**/src/index.{js,ts,jsx,tsx}", "**/src/main.{js,ts,jsx,tsx}"], {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      ignore
    });
    fallback.forEach((file) => results.add(path8.normalize(file)));
  }
  return [...results].slice(0, 200);
}

// src/config.ts
var CONFIG_FILE_NAMES = [
  "code-usage-map.config.ts",
  "code-usage-map.config.mts",
  "code-usage-map.config.cts",
  "code-usage-map.config.js",
  "code-usage-map.config.mjs",
  "code-usage-map.config.cjs",
  "code-usage-map.config.json"
];
function findConfigFile(root, explicit) {
  if (explicit) {
    const resolved = path8.isAbsolute(explicit) ? explicit : path8.resolve(root, explicit);
    return existsSync(resolved) ? resolved : void 0;
  }
  for (const name of CONFIG_FILE_NAMES) {
    const file = path8.join(root, name);
    if (existsSync(file)) return file;
  }
  return void 0;
}
function readPackageConfig(root) {
  const packageJsonPath = path8.join(root, "package.json");
  if (!existsSync(packageJsonPath)) return {};
  try {
    const raw = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    if (raw.codeUsageMap && typeof raw.codeUsageMap === "object") {
      return { config: raw.codeUsageMap, packageJsonPath };
    }
  } catch {
  }
  return { packageJsonPath };
}
async function loadJavaScriptConfig(file) {
  const url = `${pathToFileURL(file).href}?cum=${Date.now()}`;
  const loaded = await import(url);
  if (loaded && typeof loaded === "object" && "default" in loaded) {
    return loaded.default;
  }
  return loaded;
}
function loadTypeScriptConfig(file, warnings) {
  const source = readFileSync(file, "utf8");
  const transpiled = ts7.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      module: ts7.ModuleKind.CommonJS,
      target: ts7.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts7.JsxEmit.ReactJSX,
      sourceMap: false,
      inlineSourceMap: false
    },
    reportDiagnostics: true
  });
  if (transpiled.diagnostics?.length) {
    for (const diagnostic of transpiled.diagnostics) {
      warnings.push(`Config transpile diagnostic: ${ts7.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
    }
  }
  const moduleObject = { exports: {} };
  const localRequire = createRequire(file);
  const dirname = path8.dirname(file);
  const runner = new Function("exports", "require", "module", "__filename", "__dirname", transpiled.outputText);
  runner(moduleObject.exports, localRequire, moduleObject, file, dirname);
  const exported = moduleObject.exports;
  if (exported && typeof exported === "object" && "default" in exported) {
    return exported.default;
  }
  return exported;
}
async function loadConfig(root, explicit) {
  const warnings = [];
  const configPath = findConfigFile(root, explicit);
  if (!configPath) {
    if (explicit) {
      warnings.push(`Config file not found: ${explicit}`);
    }
    const fromPackage = readPackageConfig(root);
    if (fromPackage.config) {
      return {
        config: validateConfigObject(fromPackage.config, fromPackage.packageJsonPath ?? "package.json"),
        configPath: fromPackage.packageJsonPath,
        warnings
      };
    }
    return { config: {}, warnings };
  }
  try {
    let value;
    if (configPath.endsWith(".json")) {
      value = JSON.parse(readFileSync(configPath, "utf8"));
    } else if (/\.(ts|mts|cts)$/i.test(configPath)) {
      value = loadTypeScriptConfig(configPath, warnings);
    } else {
      value = await loadJavaScriptConfig(configPath);
    }
    return {
      config: validateConfigObject(value, configPath),
      configPath,
      warnings
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load config ${configPath}: ${message}`);
  }
}
var TOP_LEVEL_KEYS = /* @__PURE__ */ new Set([
  "source",
  "include",
  "exclude",
  "output",
  "mode",
  "entryPoints",
  "routes",
  "tsconfig",
  "analysis",
  "build",
  "css",
  "runtime",
  "sourceMaps",
  "thresholds",
  "reporters",
  "cache",
  "baseline",
  "logging"
]);
var ANALYSIS_KEYS = /* @__PURE__ */ new Set([
  "javascript",
  "typescript",
  "css",
  "dependencies",
  "bundles",
  "sourceMaps",
  "runtime",
  "duplicates",
  "unreachableCode",
  "recommendations"
]);
var BUILD_KEYS = /* @__PURE__ */ new Set(["dir", "manifest", "command"]);
var CSS_KEYS = /* @__PURE__ */ new Set([
  "safelist",
  "safelistPatterns",
  "specificityThreshold",
  "checkCustomProperties",
  "scanTemplates",
  "analyzeOverriddenDeclarations"
]);
var RUNTIME_KEYS = /* @__PURE__ */ new Set([
  "enabled",
  "baseUrl",
  "routes",
  "browser",
  "headless",
  "timeoutMs",
  "settleMs",
  "waitUntil",
  "navigation",
  "collectCoverage",
  "collectCss",
  "collectNetwork",
  "interactive",
  "snapshotIntervalMs",
  "viewport",
  "scenarios",
  "storageState",
  "ignoreHTTPSErrors"
]);
var SOURCE_MAP_KEYS = /* @__PURE__ */ new Set(["enabled", "maxMappingsPerFile"]);
var THRESHOLD_KEYS = /* @__PURE__ */ new Set([
  "maxTotalBundleBytes",
  "maxBundleGrowthBytes",
  "maxBundleGrowthPercent",
  "maxCssGrowthBytes",
  "maxCssGrowthPercent",
  "maxNewFindings",
  "maxRouteGrowthPercent",
  "failOn"
]);
var REPORTER_KEYS = /* @__PURE__ */ new Set(["console", "json", "html"]);
var CACHE_KEYS = /* @__PURE__ */ new Set(["enabled", "dir"]);
var LOGGING_KEYS = /* @__PURE__ */ new Set(["level"]);
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function assertKeys(value, allowed, prefix) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`Unknown configuration option "${prefix}${key}".`);
    }
  }
}
function asString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Configuration option "${field}" must be a non-empty string.`);
  }
  return value;
}
function asOptionalString(value, field) {
  if (value === void 0) return void 0;
  return asString(value, field);
}
function asBoolean(value, field) {
  if (typeof value !== "boolean") {
    throw new Error(`Configuration option "${field}" must be a boolean.`);
  }
  return value;
}
function asNumber(value, field, min = 0) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    throw new Error(`Configuration option "${field}" must be a number >= ${min}.`);
  }
  return value;
}
function asStringArray(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Configuration option "${field}" must be an array of strings.`);
  }
  return value;
}
function asRoutes(value, field) {
  if (!Array.isArray(value)) {
    throw new Error(`Configuration option "${field}" must be an array.`);
  }
  return value.map((entry2, index) => {
    if (typeof entry2 === "string" && entry2.trim() !== "") return entry2;
    if (isObject(entry2)) {
      assertKeys(entry2, /* @__PURE__ */ new Set(["name", "path", "url"]), `${field}[${index}].`);
      const name = asOptionalString(entry2.name, `${field}[${index}].name`);
      const routePath = asOptionalString(entry2.path, `${field}[${index}].path`);
      const url = asOptionalString(entry2.url, `${field}[${index}].url`);
      if (!routePath && !url) {
        throw new Error(`Route at ${field}[${index}] must define "path" or "url".`);
      }
      if (url) asHttpUrl(url, `${field}[${index}].url`, true);
      return { ...name ? { name } : {}, ...routePath ? { path: routePath } : {}, ...url ? { url } : {} };
    }
    throw new Error(`Invalid route at ${field}[${index}].`);
  });
}
function asHttpUrl(value, field, allowRelative = false) {
  if (allowRelative && value.startsWith("/")) return value;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Configuration option "${field}" must be an absolute http(s) URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Configuration option "${field}" must use http or https.`);
  }
  return value;
}
function asRuntimeActions(value, field) {
  if (!Array.isArray(value)) throw new Error(`Configuration option "${field}" must be an array.`);
  const allowedTypes = /* @__PURE__ */ new Set(["click", "hover", "fill", "press", "waitForSelector", "wait", "select"]);
  return value.map((entry2, index) => {
    if (!isObject(entry2)) throw new Error(`Invalid runtime action at ${field}[${index}].`);
    assertKeys(entry2, /* @__PURE__ */ new Set(["type", "selector", "value", "key", "ms", "timeoutMs"]), `${field}[${index}].`);
    const type = asString(entry2.type, `${field}[${index}].type`);
    if (!allowedTypes.has(type)) {
      throw new Error(`Runtime action type "${type}" at ${field}[${index}] is not supported.`);
    }
    if (type !== "wait" && !entry2.selector) {
      throw new Error(`Runtime action "${type}" at ${field}[${index}] requires a selector.`);
    }
    return {
      type,
      ...entry2.selector ? { selector: asString(entry2.selector, `${field}[${index}].selector`) } : {},
      ...entry2.value !== void 0 ? { value: String(entry2.value) } : {},
      ...entry2.key !== void 0 ? { key: String(entry2.key) } : {},
      ...entry2.ms !== void 0 ? { ms: asNumber(entry2.ms, `${field}[${index}].ms`) } : {},
      ...entry2.timeoutMs !== void 0 ? { timeoutMs: asNumber(entry2.timeoutMs, `${field}[${index}].timeoutMs`) } : {}
    };
  });
}
function asScenarios(value, field) {
  if (!Array.isArray(value)) throw new Error(`Configuration option "${field}" must be an array.`);
  return value.map((entry2, index) => {
    if (!isObject(entry2)) throw new Error(`Invalid scenario at ${field}[${index}].`);
    assertKeys(entry2, /* @__PURE__ */ new Set(["route", "actions", "strict"]), `${field}[${index}].`);
    return {
      route: asString(entry2.route, `${field}[${index}].route`),
      actions: asRuntimeActions(entry2.actions, `${field}[${index}].actions`),
      ...entry2.strict !== void 0 ? { strict: asBoolean(entry2.strict, `${field}[${index}].strict`) } : {}
    };
  });
}
function validateConfigObject(value, source) {
  if (!isObject(value)) {
    throw new Error(`Config ${source} must export an object.`);
  }
  assertKeys(value, TOP_LEVEL_KEYS, "");
  const config = {};
  if (value.source !== void 0) {
    config.source = typeof value.source === "string" ? asString(value.source, "source") : asStringArray(value.source, "source");
    if (config.source.length === 0) throw new Error('Configuration option "source" cannot be empty.');
  }
  if (value.include !== void 0) config.include = asStringArray(value.include, "include");
  if (value.exclude !== void 0) config.exclude = asStringArray(value.exclude, "exclude");
  if (value.output !== void 0) config.output = asString(value.output, "output");
  if (value.mode !== void 0) {
    const mode = asString(value.mode, "mode");
    if (mode !== "application" && mode !== "library") {
      throw new Error('Configuration option "mode" must be "application" or "library".');
    }
    config.mode = mode;
  }
  if (value.entryPoints !== void 0) config.entryPoints = asStringArray(value.entryPoints, "entryPoints");
  if (value.routes !== void 0) config.routes = asRoutes(value.routes, "routes");
  if (value.tsconfig !== void 0) config.tsconfig = asString(value.tsconfig, "tsconfig");
  if (value.baseline !== void 0) config.baseline = asString(value.baseline, "baseline");
  if (value.analysis !== void 0) {
    if (!isObject(value.analysis)) throw new Error('Configuration option "analysis" must be an object.');
    assertKeys(value.analysis, ANALYSIS_KEYS, "analysis.");
    const analysis = {};
    for (const key of ANALYSIS_KEYS) {
      const current = value.analysis[key];
      if (current !== void 0) {
        analysis[key] = asBoolean(current, `analysis.${key}`);
      }
    }
    config.analysis = analysis;
  }
  if (value.build !== void 0) {
    if (!isObject(value.build)) throw new Error('Configuration option "build" must be an object.');
    assertKeys(value.build, BUILD_KEYS, "build.");
    const build = {};
    if (value.build.dir !== void 0) {
      build.dir = typeof value.build.dir === "string" ? asString(value.build.dir, "build.dir") : asStringArray(value.build.dir, "build.dir");
    }
    if (value.build.manifest !== void 0) build.manifest = asString(value.build.manifest, "build.manifest");
    if (value.build.command !== void 0) build.command = asString(value.build.command, "build.command");
    config.build = build;
  }
  if (value.css !== void 0) {
    if (!isObject(value.css)) throw new Error('Configuration option "css" must be an object.');
    assertKeys(value.css, CSS_KEYS, "css.");
    const css = {};
    if (value.css.safelist !== void 0) css.safelist = asStringArray(value.css.safelist, "css.safelist");
    if (value.css.safelistPatterns !== void 0) {
      css.safelistPatterns = asStringArray(value.css.safelistPatterns, "css.safelistPatterns");
    }
    if (value.css.specificityThreshold !== void 0) {
      css.specificityThreshold = asNumber(value.css.specificityThreshold, "css.specificityThreshold", 0);
    }
    if (value.css.checkCustomProperties !== void 0) {
      css.checkCustomProperties = asBoolean(value.css.checkCustomProperties, "css.checkCustomProperties");
    }
    if (value.css.scanTemplates !== void 0) {
      css.scanTemplates = asBoolean(value.css.scanTemplates, "css.scanTemplates");
    }
    if (value.css.analyzeOverriddenDeclarations !== void 0) {
      css.analyzeOverriddenDeclarations = asBoolean(
        value.css.analyzeOverriddenDeclarations,
        "css.analyzeOverriddenDeclarations"
      );
    }
    config.css = css;
  }
  if (value.runtime !== void 0) {
    if (!isObject(value.runtime)) throw new Error('Configuration option "runtime" must be an object.');
    assertKeys(value.runtime, RUNTIME_KEYS, "runtime.");
    const runtime = {};
    if (value.runtime.enabled !== void 0) runtime.enabled = asBoolean(value.runtime.enabled, "runtime.enabled");
    if (value.runtime.baseUrl !== void 0) {
      runtime.baseUrl = asHttpUrl(asString(value.runtime.baseUrl, "runtime.baseUrl"), "runtime.baseUrl");
    }
    if (value.runtime.routes !== void 0) runtime.routes = asRoutes(value.runtime.routes, "runtime.routes");
    if (value.runtime.browser !== void 0) {
      const browser = asString(value.runtime.browser, "runtime.browser");
      if (browser !== "chromium" && browser !== "firefox" && browser !== "webkit") {
        throw new Error('Configuration option "runtime.browser" must be chromium, firefox or webkit.');
      }
      runtime.browser = browser;
    }
    if (value.runtime.headless !== void 0) runtime.headless = asBoolean(value.runtime.headless, "runtime.headless");
    if (value.runtime.timeoutMs !== void 0) {
      runtime.timeoutMs = asNumber(value.runtime.timeoutMs, "runtime.timeoutMs", 1e3);
    }
    if (value.runtime.settleMs !== void 0) {
      runtime.settleMs = asNumber(value.runtime.settleMs, "runtime.settleMs", 0);
    }
    if (value.runtime.snapshotIntervalMs !== void 0) {
      runtime.snapshotIntervalMs = asNumber(value.runtime.snapshotIntervalMs, "runtime.snapshotIntervalMs", 100);
    }
    if (value.runtime.waitUntil !== void 0) {
      const waitUntil = asString(value.runtime.waitUntil, "runtime.waitUntil");
      if (!["load", "domcontentloaded", "networkidle", "commit"].includes(waitUntil)) {
        throw new Error('Configuration option "runtime.waitUntil" must be load, domcontentloaded, networkidle or commit.');
      }
      runtime.waitUntil = waitUntil;
    }
    if (value.runtime.navigation !== void 0) {
      const navigation = asString(value.runtime.navigation, "runtime.navigation");
      if (navigation !== "auto" && navigation !== "goto") {
        throw new Error('Configuration option "runtime.navigation" must be "auto" or "goto".');
      }
      runtime.navigation = navigation;
    }
    for (const key of ["collectCoverage", "collectCss", "collectNetwork", "interactive", "ignoreHTTPSErrors"]) {
      if (value.runtime[key] !== void 0) {
        runtime[key] = asBoolean(value.runtime[key], `runtime.${key}`);
      }
    }
    if (value.runtime.viewport !== void 0) {
      if (!isObject(value.runtime.viewport)) throw new Error('Configuration option "runtime.viewport" must be an object.');
      assertKeys(value.runtime.viewport, /* @__PURE__ */ new Set(["width", "height"]), "runtime.viewport.");
      runtime.viewport = {
        width: asNumber(value.runtime.viewport.width, "runtime.viewport.width", 1),
        height: asNumber(value.runtime.viewport.height, "runtime.viewport.height", 1)
      };
    }
    if (value.runtime.scenarios !== void 0) {
      runtime.scenarios = asScenarios(value.runtime.scenarios, "runtime.scenarios");
    }
    if (value.runtime.storageState !== void 0) {
      runtime.storageState = asString(value.runtime.storageState, "runtime.storageState");
    }
    config.runtime = runtime;
  }
  if (value.sourceMaps !== void 0) {
    if (!isObject(value.sourceMaps)) throw new Error('Configuration option "sourceMaps" must be an object.');
    assertKeys(value.sourceMaps, SOURCE_MAP_KEYS, "sourceMaps.");
    const sourceMaps = {};
    if (value.sourceMaps.enabled !== void 0) {
      sourceMaps.enabled = asBoolean(value.sourceMaps.enabled, "sourceMaps.enabled");
    }
    if (value.sourceMaps.maxMappingsPerFile !== void 0) {
      sourceMaps.maxMappingsPerFile = asNumber(
        value.sourceMaps.maxMappingsPerFile,
        "sourceMaps.maxMappingsPerFile",
        100
      );
    }
    config.sourceMaps = sourceMaps;
  }
  if (value.thresholds !== void 0) {
    if (!isObject(value.thresholds)) throw new Error('Configuration option "thresholds" must be an object.');
    assertKeys(value.thresholds, THRESHOLD_KEYS, "thresholds.");
    const thresholds = {};
    for (const key of [
      "maxTotalBundleBytes",
      "maxBundleGrowthBytes",
      "maxBundleGrowthPercent",
      "maxCssGrowthBytes",
      "maxCssGrowthPercent",
      "maxNewFindings",
      "maxRouteGrowthPercent"
    ]) {
      if (value.thresholds[key] !== void 0) {
        thresholds[key] = asNumber(value.thresholds[key], `thresholds.${key}`, 0);
      }
    }
    if (value.thresholds.failOn !== void 0) {
      const categories = [
        "unused-import",
        "unused-export",
        "unused-variable",
        "unused-function",
        "unused-class",
        "unused-class-method",
        "unused-type",
        "unused-enum-member",
        "unused-type-parameter",
        "unused-decorator",
        "unused-event-handler",
        "unreachable-code",
        "unused-type-only-import",
        "circular-dependency",
        "duplicate-code",
        "unused-css-selector",
        "unused-css-declaration",
        "duplicate-css-selector",
        "duplicate-css-rule",
        "unused-css-custom-property",
        "unused-stylesheet",
        "css-specificity",
        "unused-dependency",
        "duplicate-dependency",
        "heavy-dependency",
        "unused-module",
        "unused-bundle-code",
        "route-exclusive-module",
        "code-splitting-opportunity",
        "polyfill-included",
        "tree-shaking-opportunity"
      ];
      const failOn = asStringArray(value.thresholds.failOn, "thresholds.failOn");
      for (const category of failOn) {
        if (!categories.includes(category)) {
          throw new Error(`Unknown finding category "${category}" in thresholds.failOn.`);
        }
      }
      thresholds.failOn = failOn;
    }
    config.thresholds = thresholds;
  }
  if (value.reporters !== void 0) {
    if (!isObject(value.reporters)) throw new Error('Configuration option "reporters" must be an object.');
    assertKeys(value.reporters, REPORTER_KEYS, "reporters.");
    const reporters = {};
    for (const key of ["console", "json", "html"]) {
      if (value.reporters[key] !== void 0) reporters[key] = asBoolean(value.reporters[key], `reporters.${key}`);
    }
    config.reporters = reporters;
  }
  if (value.cache !== void 0) {
    if (!isObject(value.cache)) throw new Error('Configuration option "cache" must be an object.');
    assertKeys(value.cache, CACHE_KEYS, "cache.");
    const cache = {};
    if (value.cache.enabled !== void 0) cache.enabled = asBoolean(value.cache.enabled, "cache.enabled");
    if (value.cache.dir !== void 0) cache.dir = asString(value.cache.dir, "cache.dir");
    config.cache = cache;
  }
  if (value.logging !== void 0) {
    if (!isObject(value.logging)) throw new Error('Configuration option "logging" must be an object.');
    assertKeys(value.logging, LOGGING_KEYS, "logging.");
    const logging = {};
    if (value.logging.level !== void 0) {
      const level = asString(value.logging.level, "logging.level");
      if (!["silent", "error", "warn", "info", "debug"].includes(level)) {
        throw new Error('Configuration option "logging.level" must be silent, error, warn, info or debug.');
      }
      logging.level = level;
    }
    config.logging = logging;
  }
  return config;
}
function defaultSource(root) {
  if (existsSync(path8.join(root, "src"))) return ["src"];
  if (existsSync(path8.join(root, "app"))) return ["app"];
  return ["."];
}
function resolveConfig(root, user, configPath, loadWarnings = []) {
  const warnings = [...loadWarnings];
  const issues = [];
  const sourceValues = user.source ? Array.isArray(user.source) ? user.source : [user.source] : defaultSource(root);
  const source = [...new Set(sourceValues.map((value) => resolveFrom(root, value)))];
  if (source.length === 0) {
    issues.push({ path: "source", message: "At least one source directory is required." });
  }
  for (const dir of source) {
    if (!existsSync(dir)) {
      warnings.push(`Source path does not exist: ${dir}`);
    }
  }
  let output;
  if (user.output) {
    output = resolveFrom(root, user.output);
  } else {
    output = path8.join(root, "code-usage-map-report");
  }
  const buildDirValues = user.build?.dir ? Array.isArray(user.build.dir) ? user.build.dir : [user.build.dir] : [];
  const build = {
    ...buildDirValues.length > 0 ? { dir: buildDirValues.map((value) => resolveFrom(root, value)) } : {},
    ...user.build?.manifest ? { manifest: resolveFrom(root, user.build.manifest) } : {},
    ...user.build?.command ? { command: user.build.command } : {}
  };
  const entryPoints = [...new Set((user.entryPoints ?? []).map((value) => resolveFrom(root, value)))];
  const analysis = {
    javascript: true,
    typescript: true,
    css: true,
    dependencies: true,
    bundles: true,
    sourceMaps: true,
    runtime: true,
    duplicates: true,
    unreachableCode: true,
    recommendations: true,
    ...user.analysis
  };
  const css = {
    safelist: [],
    safelistPatterns: [],
    specificityThreshold: 40,
    checkCustomProperties: true,
    scanTemplates: true,
    analyzeOverriddenDeclarations: true,
    ...user.css
  };
  for (const pattern of css.safelistPatterns) {
    try {
      new RegExp(pattern);
    } catch {
      warnings.push(`Invalid regular expression in css.safelistPatterns: ${pattern}`);
    }
  }
  const runtimeRoutes = user.runtime?.routes ?? user.routes ?? [];
  const runtime = {
    enabled: true,
    browser: "chromium",
    headless: true,
    timeoutMs: 3e4,
    settleMs: 500,
    waitUntil: "load",
    navigation: "auto",
    collectCoverage: true,
    collectCss: true,
    collectNetwork: true,
    interactive: false,
    snapshotIntervalMs: 500,
    viewport: { width: 1365, height: 900 },
    scenarios: [],
    ignoreHTTPSErrors: false,
    ...user.runtime,
    routes: runtimeRoutes
  };
  if (user.runtime?.baseUrl) runtime.baseUrl = user.runtime.baseUrl;
  const sourceMaps = {
    enabled: true,
    maxMappingsPerFile: 25e4,
    ...user.sourceMaps
  };
  const thresholds = { ...user.thresholds };
  const reporters = {
    console: true,
    json: true,
    html: true,
    ...user.reporters
  };
  const cache = {
    enabled: true,
    dir: path8.join(root, ".code-usage-map", "cache"),
    ...user.cache,
    ...user.cache?.dir ? { dir: resolveFrom(root, user.cache.dir) } : {}
  };
  const logging = {
    level: "info",
    ...user.logging
  };
  const config = {
    root,
    source,
    include: user.include ?? [],
    exclude: [...SAFE_EXCLUDE_PATTERNS, ...user.exclude ?? []],
    output,
    mode: user.mode ?? "application",
    entryPoints,
    routes: user.routes ?? [],
    ...user.tsconfig ? { tsconfig: resolveFrom(root, user.tsconfig) } : existsSync(path8.join(root, "tsconfig.json")) ? { tsconfig: path8.join(root, "tsconfig.json") } : existsSync(path8.join(root, "jsconfig.json")) ? { tsconfig: path8.join(root, "jsconfig.json") } : {},
    analysis,
    build,
    css,
    runtime,
    sourceMaps,
    thresholds,
    reporters,
    cache,
    ...user.baseline ? { baseline: resolveFrom(root, user.baseline) } : {},
    logging
  };
  return { config, configPath, warnings, issues };
}
async function loadResolvedConfig(root, explicitConfig) {
  const loaded = await loadConfig(root, explicitConfig);
  const resolved = resolveConfig(root, loaded.config, loaded.configPath, loaded.warnings);
  return { ...resolved, configFile: loaded.configPath };
}

// src/types.ts
var REPORT_SCHEMA_VERSION = "1.0.0";
var TOOL_NAME = "@codewithrajat/code-usage-map";
var ALL_SOURCE_EXTENSIONS = "{js,jsx,mjs,cjs,ts,tsx,mts,cts,css,scss,sass,less,html,htm,vue,svelte,astro}";
var IGNORED_SEGMENTS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "coverage",
  ".nyc_output",
  ".cache",
  ".turbo",
  ".parcel-cache",
  ".vite"
]);
function isTestOrStoryFile(file) {
  const normalized = toPosix(file).toLowerCase();
  return /\.(test|spec|stories|story)\.[^.]+$/.test(normalized) || normalized.includes("/__tests__/") || normalized.includes("/__mocks__/") || normalized.includes("/tests/") || normalized.includes("/test/") || normalized.includes("/e2e/");
}
function isDeclarationFile(file) {
  return /\.d\.(ts|mts|cts)$/i.test(file);
}
function scriptLikeFile(file) {
  return /\.(js|jsx|mjs|cjs|ts|tsx|mts|cts|vue|svelte|astro)$/i.test(file);
}
function styleLikeFile(file) {
  return /\.(css|scss|sass|less)$/i.test(file);
}
function templateLikeFile(file) {
  return /\.(html?|vue|svelte|astro)$/i.test(file);
}
function globForDirectory(root, dir) {
  const relative = toPosix(path8.relative(root, dir)) || ".";
  return relative === "." ? `**/*.${ALL_SOURCE_EXTENSIONS}` : `${relative}/**/*.${ALL_SOURCE_EXTENSIONS}`;
}
function excludeGlobs(config, detectedBuildDirs) {
  const ignores = /* @__PURE__ */ new Set([
    ...config.exclude,
    "**/.git/**",
    "**/coverage/**",
    "**/.nyc_output/**",
    "**/.code-usage-map/**"
  ]);
  const excludeAbsolute = (dir) => {
    if (!existsSync(dir)) return;
    const relative = toPosix(path8.relative(config.root, dir));
    if (relative === "" || relative.startsWith("..")) return;
    ignores.add(`${relative}/**`);
  };
  excludeAbsolute(config.output);
  if (config.cache.dir) excludeAbsolute(config.cache.dir);
  for (const buildDir of config.build.dir ?? []) excludeAbsolute(buildDir);
  for (const buildDir of detectedBuildDirs) excludeAbsolute(buildDir);
  return [...ignores];
}
function collectSourceFiles(config, detection) {
  const patterns = [];
  const directFiles = [];
  for (const source of config.source) {
    if (!existsSync(source)) continue;
    let isFile2 = false;
    try {
      isFile2 = statSync(source).isFile();
    } catch {
      isFile2 = false;
    }
    if (isFile2) {
      directFiles.push(path8.normalize(source));
    } else {
      patterns.push(globForDirectory(config.root, source));
    }
  }
  patterns.push(...config.include);
  if (patterns.length === 0) patterns.push(`**/*.${ALL_SOURCE_EXTENSIONS}`);
  const ignore = excludeGlobs(config, detection.buildDirs);
  let files = [];
  try {
    files = fg.sync(patterns, {
      cwd: config.root,
      absolute: true,
      onlyFiles: true,
      unique: true,
      dot: false,
      followSymbolicLinks: false,
      ignore
    }).map((file) => path8.normalize(file));
  } catch {
    files = [];
  }
  for (const file of directFiles) {
    if (!files.includes(file)) files.push(file);
  }
  try {
    const extraHtml = fg.sync(["*.html", "*.htm", "public/**/*.html", "public/**/*.htm"], {
      cwd: config.root,
      absolute: true,
      onlyFiles: true,
      unique: true,
      dot: false,
      ignore
    }).map((file) => path8.normalize(file));
    for (const file of extraHtml) {
      if (!files.includes(file)) files.push(file);
    }
  } catch {
  }
  const filtered = files.filter((file) => {
    const segments = toPosix(path8.relative(config.root, file)).split("/");
    if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return false;
    if (config.output && (file === config.output || file.startsWith(`${config.output}${path8.sep}`))) return false;
    if (config.cache.dir && file.startsWith(`${config.cache.dir}${path8.sep}`)) return false;
    return true;
  });
  const scripts = filtered.filter(scriptLikeFile);
  const styles = filtered.filter(styleLikeFile);
  const templates = filtered.filter(templateLikeFile);
  const html = filtered.filter((file) => /\.html?$/i.test(file));
  return {
    root: config.root,
    files: filtered,
    scripts,
    styles,
    templates,
    html,
    fileSet: new Set(filtered),
    sourceRoots: detection.sourceRoots,
    buildDirs: detection.buildDirs
  };
}
function lineAt(content, offset) {
  let line = 1;
  for (let index = 0; index < offset && index < content.length; index += 1) {
    if (content.charCodeAt(index) === 10) line += 1;
  }
  return line;
}
function findTags(content, tag) {
  const matches = [];
  const expression = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}\\s*>`, "gi");
  let match;
  while ((match = expression.exec(content)) !== null) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    const contentStart = (match.index ?? 0) + match[0].indexOf(">") + 1;
    matches.push({
      attrs,
      content: body,
      contentStart,
      contentEnd: contentStart + body.length,
      tagStart: match.index ?? 0,
      tagEnd: (match.index ?? 0) + match[0].length
    });
  }
  return matches;
}
function attrValue(attrs, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attrs);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}
function hasAttr(attrs, name) {
  return new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, "i").test(attrs);
}
function maskRanges(content, keepRanges) {
  const sorted = [...keepRanges].sort((a, b) => a.start - b.start);
  const result = [];
  let cursor = 0;
  const blank = (segment) => segment.replace(/[^\r\n]/g, " ");
  for (const range of sorted) {
    if (range.start > cursor) result.push(blank(content.slice(cursor, range.start)));
    result.push(content.slice(range.start, range.end));
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < content.length) result.push(blank(content.slice(cursor)));
  return result.join("");
}
function languageFromAttrs(attrs, fallback, kind) {
  const lang = attrValue(attrs, "lang")?.toLowerCase();
  if (lang === "ts" || lang === "typescript") return hasAttr(attrs, "setup") || kind === "astro" ? "ts" : "ts";
  if (lang === "tsx") return "tsx";
  if (lang === "jsx") return "jsx";
  if (lang === "js" || lang === "javascript") return "js";
  return fallback;
}
function scriptKindFrom(languages) {
  if (languages.includes("tsx")) return "tsx";
  if (languages.includes("ts")) return "ts";
  if (languages.includes("jsx")) return "jsx";
  return "js";
}
function virtualExtension(kind) {
  if (kind === "tsx") return ".tsx";
  if (kind === "ts") return ".ts";
  if (kind === "jsx") return ".jsx";
  return ".js";
}
function extractSfc(file, content) {
  const extension = path8.extname(file).toLowerCase();
  let kind;
  if (extension === ".vue") kind = "vue";
  else if (extension === ".svelte") kind = "svelte";
  else if (extension === ".astro") kind = "astro";
  if (!kind) return void 0;
  const scripts = [];
  const styles = [];
  const maskRangesToKeep = [];
  if (kind === "astro") {
    const frontmatter = /^(?:\uFEFF)?\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/.exec(content);
    if (frontmatter) {
      const body = frontmatter[1] ?? "";
      const bodyStart = (frontmatter.index ?? 0) + frontmatter[0].indexOf(body);
      scripts.push({
        content: body,
        startOffset: bodyStart,
        startLine: lineAt(content, bodyStart),
        language: "ts",
        setup: false,
        contextModule: false,
        tag: "frontmatter"
      });
      maskRangesToKeep.push({ start: bodyStart, end: bodyStart + body.length });
    }
  }
  for (const tag of findTags(content, "script")) {
    const isContext = hasAttr(tag.attrs, "context") && /context\s*=\s*["']module["']/i.test(tag.attrs);
    const language = languageFromAttrs(tag.attrs, kind === "astro" ? "ts" : "js", kind);
    scripts.push({
      content: tag.content,
      startOffset: tag.contentStart,
      startLine: lineAt(content, tag.contentStart),
      language,
      setup: hasAttr(tag.attrs, "setup"),
      contextModule: isContext,
      tag: "script"
    });
    maskRangesToKeep.push({ start: tag.contentStart, end: tag.contentEnd });
  }
  for (const tag of findTags(content, "style")) {
    const lang = attrValue(tag.attrs, "lang")?.toLowerCase();
    let language = "css";
    if (lang === "scss") language = "scss";
    else if (lang === "sass") language = "sass";
    else if (lang === "less") language = "less";
    styles.push({
      content: tag.content,
      startOffset: tag.contentStart,
      startLine: lineAt(content, tag.contentStart),
      language,
      module: hasAttr(tag.attrs, "module"),
      scoped: hasAttr(tag.attrs, "scoped")
    });
  }
  const scriptRanges = [
    ...findTags(content, "script").map((tag) => ({ start: tag.tagStart, end: tag.tagEnd })),
    ...findTags(content, "style").map((tag) => ({ start: tag.tagStart, end: tag.tagEnd }))
  ];
  if (kind === "astro") {
    const frontmatter = /^(?:\uFEFF)?\s*---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/.exec(content);
    if (frontmatter) scriptRanges.push({ start: frontmatter.index ?? 0, end: (frontmatter.index ?? 0) + frontmatter[0].length });
  }
  const templateText = maskRanges(content, invertRanges(content.length, scriptRanges));
  const languages = scripts.map((block) => block.language);
  const scriptKind = scriptKindFrom(languages.length > 0 ? languages : ["js"]);
  const virtualContent = maskRanges(content, maskRangesToKeep);
  const hasCode = scripts.some((block) => block.content.trim() !== "");
  const result = {
    kind,
    scripts,
    styles,
    templateText,
    scriptKind
  };
  if (hasCode) {
    result.virtualContent = virtualContent;
    result.virtualPath = `${path8.normalize(file)}.cum${virtualExtension(scriptKind)}`;
  }
  return result;
}
function invertRanges(length, removed) {
  const sorted = [...removed].sort((a, b) => a.start - b.start);
  const kept = [];
  let cursor = 0;
  for (const range of sorted) {
    if (range.start > cursor) kept.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < length) kept.push({ start: cursor, end: length });
  return kept;
}
function templateIdentifiers(template) {
  const identifiers = /* @__PURE__ */ new Set();
  const expression = /\b(?:[A-Za-z_$][\w$]*)(?:\s*(?:\.|\[)[^\]\n}]*)?|\b(?:v-[\w-]+|on[A-Z][\w]*|@[\w-]+)\b/g;
  for (const match of template.matchAll(expression)) {
    const raw = match[0] ?? "";
    const name = raw.split(/[.[\s]/)[0] ?? "";
    if (name.length > 1) identifiers.add(name);
  }
  return identifiers;
}
function loadCompilerOptions(tsconfig) {
  const warnings = [];
  let options = {};
  if (tsconfig && existsSync(tsconfig)) {
    const read = ts7.readConfigFile(tsconfig, (file) => ts7.sys.readFile(file));
    if (read.error) {
      warnings.push(`tsconfig: ${ts7.flattenDiagnosticMessageText(read.error.messageText, " ")}`);
    } else {
      const parsed = ts7.parseJsonConfigFileContent(
        read.config,
        ts7.sys,
        path8.dirname(tsconfig),
        {},
        tsconfig
      );
      options = parsed.options;
      for (const diagnostic of parsed.errors.slice(0, 5)) {
        warnings.push(`tsconfig: ${ts7.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
      }
    }
  } else if (tsconfig) {
    warnings.push(`tsconfig not found: ${tsconfig}`);
  }
  options = {
    ...options,
    allowJs: true,
    checkJs: false,
    noEmit: true,
    skipLibCheck: true,
    sourceMap: false,
    inlineSourceMap: false,
    declaration: false,
    declarationMap: false,
    composite: false,
    incremental: false,
    resolveJsonModule: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    allowArbitraryExtensions: true,
    allowImportingTsExtensions: true,
    moduleDetection: ts7.ModuleDetectionKind.Force,
    jsx: options.jsx ?? ts7.JsxEmit.Preserve,
    target: options.target ?? ts7.ScriptTarget.ES2022,
    module: options.module ?? ts7.ModuleKind.ESNext,
    moduleResolution: options.moduleResolution ?? ts7.ModuleResolutionKind.Bundler,
    newLine: ts7.NewLineKind.LineFeed
  };
  return { options, warnings };
}
function readSourceText(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return void 0;
  }
}
function scriptKindFor(language) {
  if (language === "tsx") return ts7.ScriptKind.TSX;
  if (language === "jsx") return ts7.ScriptKind.JSX;
  if (language === "ts") return ts7.ScriptKind.TS;
  return ts7.ScriptKind.JS;
}
function createStaticProgram(scriptFiles, options, warnings) {
  const virtualByFile = /* @__PURE__ */ new Map();
  const originalByFile = /* @__PURE__ */ new Map();
  const rootNames = [];
  const virtualWarnings = [];
  for (const file of scriptFiles) {
    const extension = path8.extname(file).toLowerCase();
    if (extension === ".vue" || extension === ".svelte" || extension === ".astro") {
      const content = readSourceText(file);
      if (content === void 0) {
        virtualWarnings.push(`Could not read ${file}.`);
        continue;
      }
      const extraction = extractSfc(file, content);
      if (extraction?.virtualPath && extraction.virtualContent !== void 0) {
        const virtualFile = path8.normalize(extraction.virtualPath);
        const scriptKind = scriptKindFor(extraction.scriptKind);
        virtualByFile.set(virtualFile, {
          fileName: virtualFile,
          originalFile: path8.normalize(file),
          content: extraction.virtualContent,
          scriptKind,
          extraction
        });
        originalByFile.set(virtualFile, path8.normalize(file));
        rootNames.push(virtualFile);
      }
      continue;
    }
    rootNames.push(path8.normalize(file));
  }
  const host = ts7.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  const originalFileExists = host.fileExists.bind(host);
  const originalReadFile = host.readFile.bind(host);
  const originalRealpath = host.realpath?.bind(host);
  const lookupVirtual = (fileName) => {
    return virtualByFile.get(path8.normalize(fileName));
  };
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const virtual = lookupVirtual(fileName);
    if (virtual) {
      return ts7.createSourceFile(
        fileName,
        virtual.content,
        languageVersion,
        true,
        virtual.scriptKind
      );
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };
  host.fileExists = (fileName) => lookupVirtual(fileName) !== void 0 || originalFileExists(fileName);
  host.readFile = (fileName) => lookupVirtual(fileName)?.content ?? originalReadFile(fileName);
  if (originalRealpath) {
    host.realpath = (fileName) => lookupVirtual(fileName) ? fileName : originalRealpath(fileName);
  }
  const program2 = ts7.createProgram({
    rootNames,
    options,
    host
  });
  const checker = program2.getTypeChecker();
  const diagnostics = program2.getSyntacticDiagnostics();
  const grouped = /* @__PURE__ */ new Map();
  const samples = /* @__PURE__ */ new Map();
  for (const diagnostic of diagnostics) {
    const file = diagnostic.file?.fileName ?? "<program>";
    grouped.set(file, (grouped.get(file) ?? 0) + 1);
    if (!samples.has(file)) {
      samples.set(file, ts7.flattenDiagnosticMessageText(diagnostic.messageText, " "));
    }
  }
  for (const [file, count] of [...grouped].slice(0, 10)) {
    const original = originalByFile.get(path8.normalize(file)) ?? file;
    virtualWarnings.push(
      `Parse diagnostics in ${original}: ${count} issue${count === 1 ? "" : "s"} (${samples.get(file) ?? "unknown"}).`
    );
  }
  if (grouped.size > 10) {
    virtualWarnings.push(`Parse diagnostics found in ${grouped.size - 10} additional files.`);
  }
  warnings.push(...virtualWarnings);
  return {
    program: program2,
    checker,
    options,
    virtualByFile,
    originalByFile,
    warnings: virtualWarnings
  };
}
var ASSET_EXTENSIONS = /* @__PURE__ */ new Set([
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".json",
  ".txt",
  ".md",
  ".wasm"
]);
var BUILTINS = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));
var RESOLVE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".astro",
  ".css",
  ".scss",
  ".sass",
  ".less"
];
function packageNameFromSpecifier(specifier) {
  if (!specifier || specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("\\") || specifier.startsWith("node:") || specifier.startsWith("http:") || specifier.startsWith("https:") || specifier.startsWith("data:") || specifier.startsWith("virtual:") || specifier.startsWith("\0") || specifier.startsWith("#")) {
    return void 0;
  }
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split("/")[0];
}
function isBuiltinSpecifier(specifier) {
  return specifier.startsWith("node:") || BUILTINS.has(specifier.split("/")[0] ?? "");
}
function stripQuery(specifier) {
  return specifier.replace(/[?#].*$/, "");
}
function pageLikeFile(file) {
  const normalized = toPosix(file).toLowerCase();
  return /\/pages\//.test(normalized) || /\/app\//.test(normalized) || /\/routes\//.test(normalized) || /\/views\//.test(normalized) || /\/screens\//.test(normalized) || /\/\+page\.[a-z]+$/.test(normalized) || /\/(page|layout|template|route|error|not-found)\.[a-z]+$/.test(normalized) || /\.(vue|svelte|astro)$/.test(normalized);
}
function scriptRootsFromHtml(htmlFiles, root) {
  const references = [];
  for (const file of htmlFiles) {
    if (!existsSync(file)) continue;
    let content = "";
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const regex = /<(?:script\b[^>]*\bsrc|link\b[^>]*\bhref)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const reference = match[1] ?? match[2] ?? match[3];
      if (!reference) continue;
      if (reference.startsWith("http:") || reference.startsWith("https:") || reference.startsWith("//")) continue;
      let resolved;
      if (reference.startsWith("/")) {
        const candidate = path8.resolve(root, `.${stripQuery(reference)}`);
        if (existsSync(candidate)) resolved = candidate;
      } else {
        const candidate = path8.resolve(path8.dirname(file), stripQuery(reference));
        if (existsSync(candidate)) resolved = candidate;
      }
      references.push({ file, reference, ...resolved ? { resolvedFile: resolved } : {} });
    }
  }
  return references;
}
function resolveFileCandidates(base, analyzedFiles, root) {
  const normalizedBase = path8.normalize(base);
  const candidates = /* @__PURE__ */ new Set();
  candidates.add(normalizedBase);
  const ext = path8.extname(normalizedBase).toLowerCase();
  if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
    const without = normalizedBase.slice(0, -ext.length);
    const tsExtensions = ext === ".mjs" ? [".mts", ".ts"] : ext === ".cjs" ? [".cts", ".ts"] : [".ts", ".tsx"];
    for (const candidateExt of tsExtensions) candidates.add(`${without}${candidateExt}`);
  }
  for (const candidateExt of RESOLVE_EXTENSIONS) candidates.add(`${normalizedBase}${candidateExt}`);
  for (const candidateExt of RESOLVE_EXTENSIONS) candidates.add(path8.join(normalizedBase, `index${candidateExt}`));
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      if (statSync(candidate).isFile()) {
        if (candidate.startsWith(root) || analyzedFiles.has(candidate)) return candidate;
      }
    } catch {
    }
  }
  return void 0;
}
function resolveImport(specifier, containingFile, analyzedFiles, root, options) {
  const cleaned = stripQuery(specifier);
  if (cleaned.startsWith("http:") || cleaned.startsWith("https:") || cleaned.startsWith("data:")) return void 0;
  const relativeOrAbsolute = cleaned.startsWith(".") || cleaned.startsWith("/");
  if (relativeOrAbsolute) {
    const base = cleaned.startsWith("/") ? path8.resolve(root, `.${cleaned}`) : path8.resolve(path8.dirname(containingFile), cleaned);
    const resolved = resolveFileCandidates(base, analyzedFiles, root);
    if (resolved) return resolved;
  }
  try {
    const resolution = ts7.resolveModuleName(cleaned, containingFile, options, ts7.sys);
    const resolved = resolution.resolvedModule?.resolvedFileName;
    if (resolved && !resolved.includes("node_modules")) {
      return path8.normalize(resolved);
    }
  } catch {
  }
  if (relativeOrAbsolute) {
    return resolveFileCandidates(
      path8.resolve(path8.dirname(containingFile), cleaned),
      analyzedFiles,
      root
    );
  }
  return void 0;
}
function lineColumn(sourceFile, node) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: position.line + 1, column: position.character + 1 };
}
function collectBindings(importClause, sourceFile) {
  if (!importClause) return [];
  const bindings = [];
  if (importClause.name) {
    const position = lineColumn(sourceFile, importClause.name);
    bindings.push({
      imported: "default",
      local: importClause.name.text,
      typeOnly: importClause.isTypeOnly,
      line: position.line,
      column: position.column
    });
  }
  if (importClause.namedBindings) {
    if (ts7.isNamespaceImport(importClause.namedBindings)) {
      const position = lineColumn(sourceFile, importClause.namedBindings.name);
      bindings.push({
        imported: "*",
        local: importClause.namedBindings.name.text,
        typeOnly: importClause.isTypeOnly,
        line: position.line,
        column: position.column
      });
    } else {
      for (const element of importClause.namedBindings.elements) {
        const position = lineColumn(sourceFile, element.name);
        bindings.push({
          imported: element.propertyName?.text ?? element.name.text,
          local: element.name.text,
          typeOnly: importClause.isTypeOnly || element.isTypeOnly,
          line: position.line,
          column: position.column
        });
      }
    }
  }
  return bindings;
}
function exportNames(node) {
  if (!node.exportClause) return [];
  if (ts7.isNamespaceExport(node.exportClause)) return ["*"];
  return node.exportClause.elements.map((element) => element.propertyName?.text ?? element.name.text);
}
function isAsset(specifier) {
  return ASSET_EXTENSIONS.has(path8.extname(stripQuery(specifier)).toLowerCase());
}
function isLikelyGlobImport(node) {
  if (ts7.isPropertyAccessExpression(node.expression)) {
    const name = node.expression.name.text;
    if ((name === "glob" || name === "globEager") && ts7.isMetaProperty(node.expression.expression)) {
      return "glob";
    }
    if (name === "context" && node.expression.expression.getText().includes("require")) {
      return "require-context";
    }
  }
  return void 0;
}
function buildImportGraph(staticProgram, analyzedFiles, root, configuredEntryPoints, htmlFiles, signal) {
  const imports = [];
  const externalImports = [];
  const assetImports = [];
  const dynamicPatterns = [];
  const warnings = [];
  const analyzedSet = new Set(analyzedFiles.map((file) => path8.normalize(file)));
  const htmlReferences = scriptRootsFromHtml(htmlFiles, root);
  const isVirtual = (fileName) => staticProgram.virtualByFile.has(path8.normalize(fileName));
  const originalOf = (fileName) => staticProgram.virtualByFile.get(path8.normalize(fileName))?.originalFile ?? path8.normalize(fileName);
  const virtualOriginalSet = new Set(
    [...staticProgram.virtualByFile.values()].map((value) => path8.normalize(value.originalFile))
  );
  const programSourceFiles = staticProgram.program.getSourceFiles().filter((sourceFile) => {
    const normalized = path8.normalize(sourceFile.fileName);
    if (sourceFile.isDeclarationFile && !analyzedSet.has(normalized) && !virtualOriginalSet.has(normalized)) {
      return false;
    }
    if (normalized.includes(`${path8.sep}node_modules${path8.sep}`)) return false;
    if (analyzedSet.has(normalized) || virtualOriginalSet.has(normalized)) return true;
    return !sourceFile.isDeclarationFile && !normalized.includes(`${path8.sep}typescript${path8.sep}lib${path8.sep}`);
  });
  const processImportDeclaration = (sourceFile, node) => {
    if (!ts7.isStringLiteralLike(node.moduleSpecifier)) return;
    const specifier = node.moduleSpecifier.text;
    const original = originalOf(sourceFile.fileName);
    if (!analyzedSet.has(original)) return;
    const bindings = collectBindings(node.importClause, sourceFile);
    const typeOnly = Boolean(node.importClause?.isTypeOnly) || bindings.length > 0 && bindings.every((binding) => binding.typeOnly);
    const resolved = resolveImport(specifier, original, analyzedSet, root, staticProgram.options);
    const position = lineColumn(sourceFile, node.moduleSpecifier);
    const packageName = packageNameFromSpecifier(specifier);
    const asset = isAsset(specifier);
    const record = {
      file: original,
      relativeFile: toPosix(path8.relative(root, original)),
      specifier,
      kind: typeOnly ? "type" : bindings.length === 0 ? "side-effect" : "static",
      line: position.line,
      column: position.column,
      bindings,
      typeOnly,
      ...packageName && !isBuiltinSpecifier(specifier) ? { packageName } : {},
      ...resolved ? { resolvedFile: resolved, resolvedRelativeFile: toPosix(path8.relative(root, resolved)) } : {},
      isAsset: asset,
      sourceNodeKind: "import"
    };
    imports.push(record);
    if (asset) assetImports.push(record);
    if (packageName && !isBuiltinSpecifier(specifier)) {
      externalImports.push({
        packageName,
        specifier,
        file: original,
        relativeFile: record.relativeFile,
        typeOnly,
        dynamic: false,
        kind: typeOnly ? "type" : "static",
        names: bindings.map((binding) => binding.imported)
      });
    }
  };
  const processExportDeclaration = (sourceFile, node) => {
    if (!node.moduleSpecifier || !ts7.isStringLiteralLike(node.moduleSpecifier)) return;
    const original = originalOf(sourceFile.fileName);
    if (!analyzedSet.has(original)) return;
    const specifier = node.moduleSpecifier.text;
    const position = lineColumn(sourceFile, node.moduleSpecifier);
    const names = exportNames(node);
    const resolved = resolveImport(specifier, original, analyzedSet, root, staticProgram.options);
    const packageName = packageNameFromSpecifier(specifier);
    const record = {
      file: original,
      relativeFile: toPosix(path8.relative(root, original)),
      specifier,
      kind: node.isTypeOnly ? "type" : "re-export",
      line: position.line,
      column: position.column,
      bindings: names.map((name) => ({ imported: name, local: name, typeOnly: node.isTypeOnly, line: position.line, column: position.column })),
      typeOnly: node.isTypeOnly,
      ...packageName && !isBuiltinSpecifier(specifier) ? { packageName } : {},
      ...resolved ? { resolvedFile: resolved, resolvedRelativeFile: toPosix(path8.relative(root, resolved)) } : {},
      isAsset: isAsset(specifier),
      sourceNodeKind: "export"
    };
    imports.push(record);
    if (record.isAsset) assetImports.push(record);
    if (packageName && !isBuiltinSpecifier(specifier)) {
      externalImports.push({
        packageName,
        specifier,
        file: original,
        relativeFile: record.relativeFile,
        typeOnly: node.isTypeOnly,
        dynamic: false,
        kind: node.isTypeOnly ? "type" : "re-export",
        names
      });
    }
  };
  const processCall = (sourceFile, node) => {
    const original = originalOf(sourceFile.fileName);
    const position = lineColumn(sourceFile, node.expression);
    const dynamicKind = isLikelyGlobImport(node);
    if (dynamicKind) {
      if (analyzedSet.has(original)) {
        dynamicPatterns.push({
          file: original,
          relativeFile: toPosix(path8.relative(root, original)),
          kind: "glob-import",
          description: dynamicKind === "glob" ? "import.meta.glob() loads modules with a generated expression." : "require.context() loads modules with a generated expression.",
          line: position.line
        });
      }
      return;
    }
    if (ts7.isIdentifier(node.expression) && node.expression.text === "eval") {
      if (analyzedSet.has(original)) {
        dynamicPatterns.push({
          file: original,
          relativeFile: toPosix(path8.relative(root, original)),
          kind: "eval",
          description: "Direct eval() can reference local bindings dynamically.",
          line: position.line
        });
      }
      return;
    }
    if (ts7.isPropertyAccessExpression(node.expression) && ["defineProperty", "getOwnPropertyDescriptor", "getOwnPropertyNames"].includes(node.expression.name.text) && node.expression.expression.getText(sourceFile).endsWith("Object")) {
      if (analyzedSet.has(original)) {
        dynamicPatterns.push({
          file: original,
          relativeFile: toPosix(path8.relative(root, original)),
          kind: "reflection",
          description: `${node.expression.getText(sourceFile)} uses runtime reflection.`,
          line: position.line
        });
      }
    }
    const isDynamicImport = node.expression.kind === ts7.SyntaxKind.ImportKeyword;
    const isRequire = ts7.isIdentifier(node.expression) && node.expression.text === "require";
    if (!isDynamicImport && !isRequire) return;
    const argument = node.arguments[0];
    if (argument && ts7.isStringLiteralLike(argument)) {
      if (!analyzedSet.has(original)) return;
      const specifier = argument.text;
      const resolved = resolveImport(specifier, original, analyzedSet, root, staticProgram.options);
      const packageName = packageNameFromSpecifier(specifier);
      const record = {
        file: original,
        relativeFile: toPosix(path8.relative(root, original)),
        specifier,
        kind: isDynamicImport ? "dynamic" : "require",
        line: position.line,
        column: position.column,
        bindings: [],
        typeOnly: false,
        ...packageName && !isBuiltinSpecifier(specifier) ? { packageName } : {},
        ...resolved ? { resolvedFile: resolved, resolvedRelativeFile: toPosix(path8.relative(root, resolved)) } : {},
        isAsset: isAsset(specifier),
        sourceNodeKind: isDynamicImport ? "dynamic-import" : "require"
      };
      imports.push(record);
      if (record.isAsset) assetImports.push(record);
      if (packageName && !isBuiltinSpecifier(specifier)) {
        externalImports.push({
          packageName,
          specifier,
          file: original,
          relativeFile: record.relativeFile,
          typeOnly: false,
          dynamic: isDynamicImport,
          kind: isDynamicImport ? "dynamic" : "require",
          names: []
        });
      }
    } else if (analyzedSet.has(original)) {
      dynamicPatterns.push({
        file: original,
        relativeFile: toPosix(path8.relative(root, original)),
        kind: "dynamic-module",
        description: `${isDynamicImport ? "import()" : "require()"} uses a computed module specifier.`,
        line: position.line
      });
    }
  };
  for (const sourceFile of programSourceFiles) {
    if (signal?.aborted) break;
    const normalizedFile = path8.normalize(sourceFile.fileName);
    if (sourceFile.isDeclarationFile) continue;
    if (normalizedFile.includes(`${path8.sep}node_modules${path8.sep}`)) continue;
    const visit = (node) => {
      if (ts7.isImportDeclaration(node)) {
        processImportDeclaration(sourceFile, node);
        return;
      }
      if (ts7.isExportDeclaration(node)) {
        processExportDeclaration(sourceFile, node);
        return;
      }
      if (ts7.isImportEqualsDeclaration(node) && ts7.isExternalModuleReference(node.moduleReference)) {
        const expression = node.moduleReference.expression;
        if (ts7.isStringLiteralLike(expression)) {
          const original = originalOf(sourceFile.fileName);
          if (analyzedSet.has(original)) {
            const specifier = expression.text;
            const packageName = packageNameFromSpecifier(specifier);
            const position = lineColumn(sourceFile, expression);
            const resolved = resolveImport(specifier, original, analyzedSet, root, staticProgram.options);
            imports.push({
              file: original,
              relativeFile: toPosix(path8.relative(root, original)),
              specifier,
              kind: "require",
              line: position.line,
              column: position.column,
              bindings: [{ imported: "default", local: node.name.text, typeOnly: false, line: position.line, column: position.column }],
              typeOnly: false,
              ...packageName && !isBuiltinSpecifier(specifier) ? { packageName } : {},
              ...resolved ? { resolvedFile: resolved, resolvedRelativeFile: toPosix(path8.relative(root, resolved)) } : {},
              isAsset: isAsset(specifier),
              sourceNodeKind: "import-equals"
            });
            if (packageName && !isBuiltinSpecifier(specifier)) {
              externalImports.push({
                packageName,
                specifier,
                file: original,
                relativeFile: toPosix(path8.relative(root, original)),
                typeOnly: false,
                dynamic: false,
                kind: "require",
                names: ["default"]
              });
            }
          }
        }
      }
      if (ts7.isNewExpression(node) && ts7.isIdentifier(node.expression) && node.expression.text === "Function") {
        const original = originalOf(sourceFile.fileName);
        if (analyzedSet.has(original)) {
          const position = lineColumn(sourceFile, node.expression);
          dynamicPatterns.push({
            file: original,
            relativeFile: toPosix(path8.relative(root, original)),
            kind: "new-function",
            description: "new Function() can execute dynamically generated code.",
            line: position.line
          });
        }
      }
      if (ts7.isElementAccessExpression(node) && !ts7.isStringLiteralLike(node.argumentExpression) && !ts7.isNumericLiteral(node.argumentExpression)) {
        const objectText = node.expression.getText(sourceFile);
        if (["window", "globalThis", "self", "global", "this"].includes(objectText)) {
          const original = originalOf(sourceFile.fileName);
          if (analyzedSet.has(original)) {
            const position = lineColumn(sourceFile, node.expression);
            dynamicPatterns.push({
              file: original,
              relativeFile: toPosix(path8.relative(root, original)),
              kind: "dynamic-member",
              description: `Computed property access on ${objectText} can reach any property.`,
              line: position.line
            });
          }
        }
      }
      if (ts7.isCallExpression(node)) processCall(sourceFile, node);
      ts7.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  const hasGlobImports = dynamicPatterns.some((pattern) => pattern.kind === "glob-import");
  const hasDynamicModuleLoading = dynamicPatterns.some(
    (pattern) => pattern.kind === "dynamic-module" || pattern.kind === "glob-import"
  );
  const moduleList = /* @__PURE__ */ new Map();
  for (const file of analyzedFiles) {
    const original = staticProgram.virtualByFile.get(path8.normalize(file))?.originalFile ?? path8.normalize(file);
    if (moduleList.has(path8.normalize(original))) continue;
    let bytes = 0;
    let lines = 0;
    try {
      const stat = statSync(original);
      bytes = stat.size;
      const content = readFileSync(original, "utf8");
      lines = content === "" ? 0 : content.split(/\r\n|\r|\n/).length;
    } catch {
    }
    moduleList.set(path8.normalize(original), {
      file: original,
      relativeFile: toPosix(path8.relative(root, original)),
      type: fileType(original),
      isVirtual: isVirtual(file),
      ...isVirtual(file) ? { originalFile: original } : {},
      entry: false,
      pageLike: pageLikeFile(original),
      reachable: false,
      isTest: isTestOrStoryFile(original),
      importCount: 0,
      importerCount: 0,
      importers: [],
      dynamicImportTarget: false,
      bytes,
      lines
    });
  }
  for (const record of imports) {
    const module = moduleList.get(path8.normalize(record.file));
    if (module) module.importCount += 1;
    if (record.resolvedFile) {
      const target = moduleList.get(path8.normalize(record.resolvedFile));
      if (target) {
        target.importerCount += 1;
        if (!target.importers.includes(record.relativeFile)) target.importers.push(record.relativeFile);
        if (record.kind === "dynamic") target.dynamicImportTarget = true;
      }
    }
  }
  const configuredRoots = /* @__PURE__ */ new Set();
  for (const entry2 of configuredEntryPoints) {
    const normalized = path8.normalize(entry2);
    if (moduleList.has(normalized)) configuredRoots.add(normalized);
  }
  for (const reference of htmlReferences) {
    if (reference.resolvedFile && moduleList.has(path8.normalize(reference.resolvedFile))) {
      configuredRoots.add(path8.normalize(reference.resolvedFile));
    }
  }
  for (const module of moduleList.values()) {
    if (module.pageLike) configuredRoots.add(module.file);
  }
  const entryPoints = [...configuredRoots];
  const queue = [...entryPoints];
  const reachable = /* @__PURE__ */ new Set();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    for (const record of imports) {
      if (path8.normalize(record.file) !== current) continue;
      const target = record.resolvedFile ? path8.normalize(record.resolvedFile) : void 0;
      if (!target || reachable.has(target)) continue;
      if (!moduleList.has(target)) continue;
      queue.push(target);
    }
  }
  for (const module of moduleList.values()) {
    module.entry = entryPoints.includes(module.file);
    module.reachable = reachable.has(module.file);
  }
  if (entryPoints.length === 0) {
    warnings.push("No application entry points were detected; unused-module findings are skipped.");
  }
  const circularDependencies = findCircularDependencies(moduleList, imports, root);
  const typeOnlyImports = buildTypeOnlyImportRecords(imports);
  const sourceFiles = [...moduleList.values()].map((module) => ({
    file: module.file,
    relativeFile: module.relativeFile,
    type: module.type,
    lines: module.lines,
    bytes: module.bytes,
    isSfc: [".vue", ".svelte", ".astro"].includes(path8.extname(module.file).toLowerCase()),
    isTest: module.isTest,
    isDeclaration: isDeclarationFile(module.file)
  }));
  return {
    imports,
    externalImports: dedupeExternalImports(externalImports),
    assetImports,
    modules: [...moduleList.values()],
    sourceFiles,
    dynamicPatterns,
    typeOnlyImports,
    entryPoints,
    reachableFiles: [...reachable],
    circularDependencies,
    htmlReferences,
    hasDynamicModuleLoading,
    hasGlobImports,
    warnings
  };
}
function buildTypeOnlyImportRecords(imports) {
  const grouped = /* @__PURE__ */ new Map();
  for (const record of imports) {
    if (!record.typeOnly) continue;
    const names = record.bindings.map((binding) => binding.imported);
    const key = `${record.relativeFile}|${record.specifier}`;
    const existing = grouped.get(key);
    if (existing) {
      for (const name of names) if (!existing.names.includes(name)) existing.names.push(name);
    } else {
      grouped.set(key, {
        source: record.specifier,
        file: record.file,
        relativeFile: record.relativeFile,
        names,
        ...record.packageName ? { packageName: record.packageName } : {}
      });
    }
  }
  return [...grouped.values()];
}
function dedupeExternalImports(records) {
  const map = /* @__PURE__ */ new Map();
  for (const record of records) {
    const key = `${record.file}|${record.specifier}|${record.typeOnly ? "t" : "v"}|${record.dynamic ? "d" : "s"}`;
    const existing = map.get(key);
    if (existing) {
      for (const name of record.names) if (!existing.names.includes(name)) existing.names.push(name);
    } else {
      map.set(key, { ...record, names: [...record.names] });
    }
  }
  return [...map.values()];
}
function findCircularDependencies(modules, imports, root) {
  const nodes = [...modules.keys()];
  const adjacency = /* @__PURE__ */ new Map();
  for (const node of nodes) adjacency.set(node, []);
  for (const record of imports) {
    const from = path8.normalize(record.file);
    const to = record.resolvedFile ? path8.normalize(record.resolvedFile) : void 0;
    if (!to || !modules.has(from) || !modules.has(to)) continue;
    const list = adjacency.get(from);
    if (list) list.push(record);
  }
  let index = 0;
  const stack = [];
  const onStack = /* @__PURE__ */ new Set();
  const indices = /* @__PURE__ */ new Map();
  const lowlink = /* @__PURE__ */ new Map();
  const components = [];
  const strongConnect = (node) => {
    indices.set(node, index);
    lowlink.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);
    for (const edge of adjacency.get(node) ?? []) {
      const target = edge.resolvedFile ? path8.normalize(edge.resolvedFile) : void 0;
      if (!target || !adjacency.has(target)) continue;
      if (!indices.has(target)) {
        strongConnect(target);
        lowlink.set(node, Math.min(lowlink.get(node) ?? 0, lowlink.get(target) ?? 0));
      } else if (onStack.has(target)) {
        lowlink.set(node, Math.min(lowlink.get(node) ?? 0, indices.get(target) ?? 0));
      }
    }
    if ((lowlink.get(node) ?? 0) === (indices.get(node) ?? 0)) {
      const component = [];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) break;
        onStack.delete(current);
        component.push(current);
        if (current === node) break;
      }
      if (component.length > 1) components.push(component);
    }
  };
  for (const node of nodes) {
    if (!indices.has(node)) strongConnect(node);
  }
  const selfLoops = [];
  for (const [node, edges] of adjacency) {
    if (edges.some((edge) => edge.resolvedFile && path8.normalize(edge.resolvedFile) === node)) {
      selfLoops.push([node]);
    }
  }
  const all = [...components, ...selfLoops];
  return all.slice(0, 100).map((component) => {
    const set = new Set(component);
    const edges = imports.filter(
      (edge) => set.has(path8.normalize(edge.file)) && edge.resolvedFile && set.has(path8.normalize(edge.resolvedFile))
    );
    const typeOnly = edges.every((edge) => edge.typeOnly);
    const first = edges[0];
    return {
      files: component.map((file) => path8.normalize(file)),
      relativeFiles: component.map((file) => toPosix(path8.relative(root, file))),
      ...first ? { line: first.line } : {},
      typeOnly
    };
  });
}
var lineCache = /* @__PURE__ */ new Map();
function readSourceLines(file) {
  const cached = lineCache.get(file);
  if (cached) return cached;
  try {
    const content = readFileSync(file, "utf8");
    const lines = content.split(/\r\n|\r|\n/);
    lineCache.set(file, lines);
    if (lineCache.size > 500) {
      const first = lineCache.keys().next().value;
      if (first) lineCache.delete(first);
    }
    return lines;
  } catch {
    return void 0;
  }
}
function buildSnippet(file, line, options = {}) {
  const lines = readSourceLines(file);
  if (!lines || line < 1) return void 0;
  const context = Math.max(0, options.context ?? 2);
  const maxLineLength = options.maxLineLength ?? 500;
  const start = Math.max(1, line - context);
  const end = Math.min(lines.length, line + context);
  const snippetLines = [];
  for (let current = start; current <= end; current += 1) {
    const raw = lines[current - 1] ?? "";
    snippetLines.push({
      line: current,
      text: raw.length > maxLineLength ? `${raw.slice(0, maxLineLength)}\u2026` : raw
    });
  }
  const before = Math.max(0, line - 1);
  const after = Math.max(0, lines.length - line);
  return {
    startLine: start,
    highlightLine: line,
    lines: snippetLines,
    ...before + after > context * 2 ? { truncated: true } : {},
    ...options.ruleText ? { ruleText: options.ruleText } : {}
  };
}

// src/static/finding-utils.ts
function defaultSeverity(category, status, confidence, bytes = 0) {
  if (category === "css-specificity" || category === "polyfill-included") return "info";
  if (category === "duplicate-code" || category === "unused-css-declaration") return "low";
  if (category === "circular-dependency") return "medium";
  if (category === "duplicate-css-rule" || category === "duplicate-css-selector") return "low";
  if (category === "unused-type-parameter" || category === "unused-type-only-import") return "low";
  if (status === "confirmed-unused") {
    if (bytes >= 8e3) return "high";
    return bytes > 0 ? "medium" : "low";
  }
  if (status === "potentially-unused") {
    return confidence === "high" && bytes >= 4e3 ? "medium" : "low";
  }
  return "info";
}
function fingerprintFor(category, relativeFile, symbol, symbolKind, suffix) {
  return [category, relativeFile, symbol ?? "", symbolKind, suffix ?? ""].join("|");
}
function createFinding(input) {
  const relativeFile = relativePosix(input.root, input.file);
  const fingerprint = fingerprintFor(
    input.category,
    relativeFile,
    input.symbol,
    input.symbolKind,
    input.fingerprintSuffix
  );
  const id = `f_${hashString(`${fingerprint}|${input.line}|${input.column}|${input.idSuffix ?? ""}`, 12)}`;
  const snippet = input.snippet ?? (input.symbolKind === "css-selector" || input.symbolKind === "css-rule" ? buildSnippet(input.file, input.line, { context: 3, ruleText: input.ruleText }) : buildSnippet(input.file, input.line, { context: 2 }));
  const size = input.size ?? {};
  const severity = input.severity ?? defaultSeverity(input.category, input.status, input.confidence, size.estimatedRemovableBytes ?? size.sourceBytes ?? 0);
  const location = {
    file: input.file,
    relativeFile,
    line: input.line,
    column: input.column,
    ...input.endLine !== void 0 ? { endLine: input.endLine } : {},
    ...input.endColumn !== void 0 ? { endColumn: input.endColumn } : {},
    fileType: fileType(input.file)
  };
  return {
    id,
    fingerprint,
    category: input.category,
    status: input.status,
    confidence: input.confidence,
    severity,
    title: input.title,
    description: input.description,
    location,
    ...input.symbol ? { symbol: input.symbol } : {},
    symbolKind: input.symbolKind,
    ...input.parent ? { parent: input.parent } : {},
    ...input.mapping ? { mapping: input.mapping } : {},
    ...input.runtime ? { runtime: input.runtime } : {},
    ...input.css ? { css: input.css } : {},
    ...input.duplicate ? { duplicate: input.duplicate } : {},
    ...input.dependency ? { dependency: input.dependency } : {},
    size,
    evidence: input.evidence ?? [],
    ...snippet ? { snippet } : {},
    ...input.fix ? { fix: input.fix } : {},
    routeHints: input.routeHints ?? [],
    recommendationIds: [],
    tags: input.tags ?? []
  };
}
function uniqueFindingFingerprints(findings) {
  const counts = /* @__PURE__ */ new Map();
  for (const finding of findings) {
    const count = counts.get(finding.fingerprint) ?? 0;
    counts.set(finding.fingerprint, count + 1);
    if (count > 0) {
      finding.fingerprint = `${finding.fingerprint}#${count + 1}`;
    }
  }
  return findings;
}
function isAbrupt(statement) {
  return ts7.isReturnStatement(statement) || ts7.isThrowStatement(statement) || ts7.isBreakStatement(statement) || ts7.isContinueStatement(statement);
}
function isDeclarationStatement(statement) {
  return ts7.isFunctionDeclaration(statement) || ts7.isClassDeclaration(statement) || ts7.isInterfaceDeclaration(statement) || ts7.isTypeAliasDeclaration(statement) || ts7.isEnumDeclaration(statement) || ts7.isVariableStatement(statement) || ts7.isModuleDeclaration(statement);
}
function parentName(node) {
  let current = node.parent;
  while (current) {
    if (ts7.isFunctionDeclaration(current) || ts7.isMethodDeclaration(current) || ts7.isConstructorDeclaration(current) || ts7.isGetAccessorDeclaration(current) || ts7.isSetAccessorDeclaration(current) || ts7.isClassDeclaration(current)) {
      if (current.name && ts7.isIdentifier(current.name)) return current.name.text;
    }
    current = current.parent;
  }
  return void 0;
}
function lineColumn2(sourceFile, node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(Math.max(node.getStart(sourceFile), node.getEnd() - 1));
  return {
    line: start.line + 1,
    column: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 2
  };
}
function makeUnreachableFinding(root, file, sourceFile, node, title, description, category = "unreachable-code") {
  const position = lineColumn2(sourceFile, node);
  const sourceBytes = Math.max(0, node.getEnd() - node.getStart(sourceFile));
  return createFinding({
    root,
    category,
    status: "confirmed-unused",
    confidence: "high",
    title,
    description,
    file,
    line: position.line,
    column: position.column,
    endLine: position.endLine,
    endColumn: position.endColumn,
    symbolKind: "unknown",
    ...parentName(node) ? { parent: parentName(node) } : {},
    size: {
      sourceBytes,
      estimatedRemovableBytes: sourceBytes,
      basis: `Unreachable source span (${sourceBytes} bytes).`
    },
    evidence: [
      {
        kind: "parser",
        description: "TypeScript control-flow structure proves this statement cannot execute.",
        file: toPosix(file),
        line: position.line
      }
    ],
    tags: ["static-proof"],
    fingerprintSuffix: `${position.line}:${position.column}`
  });
}
function findUnreachableCode(root, file, sourceFile, maxFindings = 200) {
  const findings = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (node, title, description) => {
    const key = `${node.getStart(sourceFile)}`;
    if (seen.has(key) || findings.length >= maxFindings) return findings.length >= maxFindings;
    seen.add(key);
    findings.push(makeUnreachableFinding(root, file, sourceFile, node, title, description));
    return findings.length >= maxFindings;
  };
  const visitStatements = (statements) => {
    let abrupt;
    for (const statement of statements) {
      if (abrupt) {
        if (!isDeclarationStatement(statement)) {
          if (push(statement, "Unreachable code", `This statement follows a ${abrupt.getText(sourceFile).split(/\s+/)[0] ?? "terminating"} statement and cannot execute.`)) {
            return;
          }
        }
      }
      if (isAbrupt(statement)) abrupt = statement;
    }
  };
  const visit = (node) => {
    if (findings.length >= maxFindings) return;
    if (ts7.isBlock(node) || ts7.isModuleBlock(node)) {
      visitStatements(node.statements);
    }
    if (ts7.isIfStatement(node)) {
      const condition = node.expression;
      const falseLiteral = condition.kind === ts7.SyntaxKind.FalseKeyword || ts7.isNumericLiteral(condition) && Number(condition.text) === 0 || ts7.isStringLiteral(condition) && condition.text === "" || condition.kind === ts7.SyntaxKind.NullKeyword;
      const trueLiteral = condition.kind === ts7.SyntaxKind.TrueKeyword;
      if (falseLiteral && !ts7.isIfStatement(node.thenStatement) && !ts7.isBlock(node.thenStatement)) {
        push(
          node.thenStatement,
          "Unreachable branch",
          "The condition is a false literal, so this branch can never execute."
        );
      } else if (falseLiteral) {
        push(node.thenStatement, "Unreachable branch", "The condition is a false literal, so this branch can never execute.");
      } else if (trueLiteral && node.elseStatement) {
        push(node.elseStatement, "Unreachable else branch", "The condition is a true literal, so the else branch can never execute.");
      }
    }
    if ((ts7.isWhileStatement(node) || ts7.isForStatement(node)) && node.statement && (ts7.isWhileStatement(node) && (node.expression.kind === ts7.SyntaxKind.FalseKeyword || ts7.isNumericLiteral(node.expression) && Number(node.expression.text) === 0) || ts7.isForStatement(node) && node.condition && (node.condition.kind === ts7.SyntaxKind.FalseKeyword || ts7.isNumericLiteral(node.condition) && Number(node.condition.text) === 0))) {
      push(node.statement, "Unreachable loop body", "The loop condition is a false literal, so the body can never execute.");
    }
    ts7.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}
function normalizedTokens(text) {
  const scanner = ts7.createScanner(ts7.ScriptTarget.Latest, true, ts7.LanguageVariant.Standard, text);
  const tokens = [];
  let punctuationCount = 0;
  let token = scanner.scan();
  while (token !== ts7.SyntaxKind.EndOfFileToken) {
    if (token === ts7.SyntaxKind.Identifier) {
      tokens.push("ID");
    } else if (token === ts7.SyntaxKind.StringLiteral || token === ts7.SyntaxKind.NoSubstitutionTemplateLiteral || token === ts7.SyntaxKind.TemplateHead || token === ts7.SyntaxKind.TemplateMiddle || token === ts7.SyntaxKind.TemplateTail) {
      tokens.push("STR");
    } else if (token === ts7.SyntaxKind.NumericLiteral || token === ts7.SyntaxKind.BigIntLiteral) {
      tokens.push("NUM");
    } else {
      const value = scanner.getTokenText();
      if (/[^\w\s]/.test(value)) punctuationCount += 1;
      tokens.push(value);
    }
    token = scanner.scan();
  }
  return {
    hash: hashString(tokens.join(" "), 16),
    tokenCount: tokens.length,
    punctuationCount
  };
}
function candidateName(node) {
  if (node.name && ts7.isIdentifier(node.name)) return node.name.text;
  if (ts7.isConstructorDeclaration(node)) return "constructor";
  const parent = node.parent;
  if (ts7.isVariableDeclaration(parent) && ts7.isIdentifier(parent.name)) return parent.name.text;
  if (ts7.isPropertyDeclaration(parent) && ts7.isIdentifier(parent.name)) return parent.name.text;
  return void 0;
}
function collectCandidates(file, relativeFile, sourceFile) {
  const candidates = [];
  const visit = (node) => {
    const isCandidate = (ts7.isFunctionDeclaration(node) || ts7.isMethodDeclaration(node) || ts7.isConstructorDeclaration(node) || ts7.isGetAccessorDeclaration(node) || ts7.isSetAccessorDeclaration(node) || ts7.isArrowFunction(node) || ts7.isFunctionExpression(node)) && Boolean(node.body);
    if (isCandidate && node.body) {
      const body = node.body.getText(sourceFile);
      const normalized = normalizedTokens(body);
      if (normalized.tokenCount >= 50 && normalized.punctuationCount >= 12) {
        const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const end = sourceFile.getLineAndCharacterOfPosition(Math.max(node.getStart(sourceFile), node.getEnd() - 1));
        const name = candidateName(node);
        candidates.push({
          node,
          candidate: {
            file,
            relativeFile,
            line: start.line + 1,
            column: start.character + 1,
            endLine: end.line + 1,
            ...name ? { symbol: name } : {},
            sourceBytes: node.getEnd() - node.getStart(sourceFile),
            tokenCount: normalized.tokenCount,
            hash: normalized.hash
          }
        });
      }
    }
    ts7.forEachChild(node, visit);
  };
  visit(sourceFile);
  return candidates;
}
function findDuplicateCode(root, files, maxGroups = 30) {
  const groups = /* @__PURE__ */ new Map();
  for (const entry2 of files) {
    for (const { candidate } of collectCandidates(entry2.file, entry2.relativeFile, entry2.sourceFile)) {
      const existing = groups.get(candidate.hash);
      if (existing) {
        existing.candidates.push(candidate);
      } else {
        groups.set(candidate.hash, {
          hash: candidate.hash,
          tokenCount: candidate.tokenCount,
          candidates: [candidate]
        });
      }
    }
  }
  const findings = [];
  for (const group of [...groups.values()].sort((a, b) => b.tokenCount - a.tokenCount)) {
    if (findings.length >= maxGroups) break;
    if (group.candidates.length < 2) continue;
    const uniqueLocations = new Set(
      group.candidates.map((candidate) => `${candidate.relativeFile}:${candidate.line}`)
    );
    if (uniqueLocations.size < 2) continue;
    const first = group.candidates[0];
    if (!first) continue;
    findings.push(
      createFinding({
        root,
        category: "duplicate-code",
        status: "unknown",
        confidence: "medium",
        title: `${group.candidates.length} functions share identical normalized logic`,
        description: "Bodies match after normalizing identifiers and literals. This is an advisory refactor opportunity; framework boilerplate can be intentionally duplicated.",
        file: first.file,
        line: first.line,
        column: first.column,
        endLine: first.endLine,
        ...first.symbol ? { symbol: first.symbol } : {},
        symbolKind: first.symbol ? "function" : "unknown",
        duplicate: {
          groupId: `dup_${group.hash}`,
          occurrences: group.candidates.slice(0, 20).map((candidate) => ({
            file: candidate.file,
            relativeFile: candidate.relativeFile,
            line: candidate.line,
            ...candidate.symbol ? { symbol: candidate.symbol } : {}
          })),
          normalizedHash: group.hash,
          tokenCount: group.tokenCount
        },
        size: {
          sourceBytes: first.sourceBytes,
          basis: "Size of the first occurrence; duplicates are overlapping candidates."
        },
        evidence: [
          {
            kind: "parser",
            description: `${group.tokenCount} normalized tokens matched across ${group.candidates.length} functions.`
          }
        ],
        tags: ["advisory", "refactor"],
        fingerprintSuffix: group.hash
      })
    );
  }
  return findings;
}

// src/static/analyze.ts
var FRAMEWORK_METHOD_NAMES = /* @__PURE__ */ new Set([
  "render",
  "componentDidMount",
  "componentDidUpdate",
  "componentWillUnmount",
  "componentWillMount",
  "componentWillReceiveProps",
  "shouldComponentUpdate",
  "getDerivedStateFromProps",
  "getSnapshotBeforeUpdate",
  "getInitialState",
  "ngOnInit",
  "ngOnDestroy",
  "ngOnChanges",
  "ngAfterViewInit",
  "ngAfterViewChecked",
  "ngAfterContentInit",
  "ngAfterContentChecked",
  "ngDoCheck",
  "setup",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeUnmount",
  "unmounted",
  "created",
  "activated",
  "deactivated",
  "connectedCallback",
  "disconnectedCallback",
  "attributeChangedCallback",
  "adoptedCallback",
  "observedAttributes"
]);
function canonicalSymbol(checker, symbol) {
  let current = symbol;
  const seen = /* @__PURE__ */ new Set();
  while ((current.flags & ts7.SymbolFlags.Alias) !== 0 && !seen.has(current)) {
    seen.add(current);
    try {
      const next = checker.getAliasedSymbol(current);
      if (!next || next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}
function hasModifier(node, flag) {
  if (!ts7.canHaveModifiers(node)) return false;
  return (ts7.getCombinedModifierFlags(node) & flag) !== 0;
}
function isDefaultExport(node) {
  return hasModifier(node, ts7.ModifierFlags.Default);
}
function isExportedDeclaration(node) {
  if (hasModifier(node, ts7.ModifierFlags.Export)) return true;
  const parent = node.parent;
  if (parent && ts7.isVariableStatement(parent)) return hasModifier(parent, ts7.ModifierFlags.Export);
  return false;
}
function isAmbient(node, sourceFile) {
  if (sourceFile.isDeclarationFile) return true;
  let current = node;
  while (current) {
    if (hasModifier(current, ts7.ModifierFlags.Ambient)) {
      return true;
    }
    if (ts7.isModuleDeclaration(current) && (current.flags & ts7.NodeFlags.GlobalAugmentation) !== 0) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
function functionParentName(node) {
  let current = node.parent;
  while (current) {
    if ((ts7.isFunctionDeclaration(current) || ts7.isMethodDeclaration(current) || ts7.isGetAccessorDeclaration(current) || ts7.isSetAccessorDeclaration(current) || ts7.isClassDeclaration(current)) && current.name && ts7.isIdentifier(current.name)) {
      return current.name.text;
    }
    current = current.parent;
  }
  return void 0;
}
function findEnclosingClass(node) {
  let current = node.parent;
  while (current) {
    if (ts7.isClassDeclaration(current)) return current;
    if (ts7.isFunctionLike(current)) return void 0;
    current = current.parent;
  }
  return void 0;
}
function parentRecordFor(node, recordByNode) {
  let current = node.parent;
  while (current) {
    const record = recordByNode.get(current);
    if (record) return record;
    current = current.parent;
  }
  return void 0;
}
function lineColumn3(sourceFile, node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const endPosition = Math.max(node.getStart(sourceFile), node.getEnd() - 1);
  const end = sourceFile.getLineAndCharacterOfPosition(endPosition);
  return {
    line: start.line + 1,
    column: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 2
  };
}
function symbolCount(counts, symbol) {
  if (!symbol) return { value: 0, type: 0, write: 0 };
  return counts.get(symbol) ?? { value: 0, type: 0, write: 0 };
}
function isTypePosition(node) {
  if (!ts7.isPartOfTypeNode(node)) return false;
  let current = node;
  while (current.parent) {
    const parent = current.parent;
    if (ts7.isHeritageClause(parent)) {
      if (parent.token === ts7.SyntaxKind.ExtendsKeyword && parent.parent && ts7.isClassLike(parent.parent)) {
        return false;
      }
      return true;
    }
    if (ts7.isStatement(parent) || ts7.isSourceFile(parent)) break;
    current = parent;
  }
  return true;
}
function isExportTypeContext(node) {
  let current = node;
  while (current) {
    if (ts7.isExportSpecifier(current)) {
      const declaration = current.parent?.parent;
      if (declaration && ts7.isExportDeclaration(declaration)) return declaration.isTypeOnly;
    }
    if (ts7.isStatement(current)) return false;
    current = current.parent;
  }
  return false;
}
function exportSpecifierContext(node) {
  let current = node;
  while (current) {
    if (ts7.isExportSpecifier(current)) {
      const declaration = current.parent.parent;
      if (declaration && ts7.isExportDeclaration(declaration)) {
        return { local: !declaration.moduleSpecifier, reExport: Boolean(declaration.moduleSpecifier) };
      }
      return void 0;
    }
    if (ts7.isStatement(current)) return void 0;
    current = current.parent;
  }
  return void 0;
}
function isDeclaredName(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (ts7.isImportClause(parent) && parent.name === node) return true;
  if (ts7.isImportSpecifier(parent) && (parent.name === node || parent.propertyName === node)) return true;
  if (ts7.isNamespaceImport(parent) && parent.name === node) return true;
  if (ts7.isNamespaceExport(parent) && parent.name === node) return true;
  if (ts7.isExportSpecifier(parent) && parent.propertyName === node) return true;
  if (ts7.isImportEqualsDeclaration(parent) && parent.name === node) return true;
  if (ts7.isBindingElement(parent) && parent.name === node) return true;
  if (ts7.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts7.isParameter(parent) && parent.name === node) return true;
  if (ts7.isPropertyDeclaration(parent) && parent.name === node) return true;
  if (ts7.isPropertySignature(parent) && parent.name === node) return true;
  if (ts7.isPropertyAssignment(parent) && parent.name === node) return true;
  if (ts7.isMethodDeclaration(parent) && parent.name === node) return true;
  if (ts7.isMethodSignature(parent) && parent.name === node) return true;
  if (ts7.isGetAccessorDeclaration(parent) && parent.name === node) return true;
  if (ts7.isSetAccessorDeclaration(parent) && parent.name === node) return true;
  if (ts7.isFunctionDeclaration(parent) && parent.name === node) return true;
  if (ts7.isFunctionExpression(parent) && parent.name === node) return true;
  if (ts7.isClassDeclaration(parent) && parent.name === node) return true;
  if (ts7.isClassExpression(parent) && parent.name === node) return true;
  if (ts7.isInterfaceDeclaration(parent) && parent.name === node) return true;
  if (ts7.isTypeAliasDeclaration(parent) && parent.name === node) return true;
  if (ts7.isEnumDeclaration(parent) && parent.name === node) return true;
  if (ts7.isEnumMember(parent) && parent.name === node) return true;
  if (ts7.isTypeParameterDeclaration(parent) && parent.name === node) return true;
  if (ts7.isModuleDeclaration(parent) && parent.name === node) return true;
  if (ts7.isJsxAttribute(parent) && parent.name === node) return true;
  if (ts7.isLabeledStatement(parent) && parent.label === node) return true;
  if ((ts7.isBreakStatement(parent) || ts7.isContinueStatement(parent)) && parent.label === node) return true;
  if (ts7.isNamedTupleMember(parent) && parent.name === node) return true;
  return false;
}
function isWriteReference(node) {
  const direct = node.parent;
  if (direct && ts7.isBinaryExpression(direct)) {
    if (direct.left === node && direct.operatorToken.kind === ts7.SyntaxKind.EqualsToken) return true;
  }
  if (direct && (ts7.isPrefixUnaryExpression(direct) || ts7.isPostfixUnaryExpression(direct)) && (direct.operator === ts7.SyntaxKind.PlusPlusToken || direct.operator === ts7.SyntaxKind.MinusMinusToken) && direct.operand === node) {
    return true;
  }
  if (direct && ts7.isPropertyAccessExpression(direct) && direct.name === node) {
    let target = direct;
    while (target.parent && ts7.isParenthesizedExpression(target.parent)) target = target.parent;
    const parent = target.parent;
    if (parent && ts7.isBinaryExpression(parent) && parent.left === target && parent.operatorToken.kind === ts7.SyntaxKind.EqualsToken) {
      return true;
    }
  }
  let current = node;
  while (current.parent) {
    const parent = current.parent;
    if (parent && ts7.isBinaryExpression(parent) && parent.left === current) {
      return parent.operatorToken.kind === ts7.SyntaxKind.EqualsToken;
    }
    if (parent && (ts7.isPrefixUnaryExpression(parent) || ts7.isPostfixUnaryExpression(parent)) && (parent.operator === ts7.SyntaxKind.PlusPlusToken || parent.operator === ts7.SyntaxKind.MinusMinusToken) && parent.operand === current) {
      return true;
    }
    const assignmentPatternParent = ts7.isParenthesizedExpression(parent) || ts7.isArrayLiteralExpression(parent) || ts7.isObjectLiteralExpression(parent) || ts7.isPropertyAssignment(parent) || ts7.isShorthandPropertyAssignment(parent) || ts7.isSpreadElement(parent) || ts7.isSpreadAssignment(parent);
    if (assignmentPatternParent) {
      current = parent;
      continue;
    }
    break;
  }
  return false;
}
function expressionHasSideEffects(expression) {
  if (!expression) return false;
  let hasSideEffects = false;
  const visit = (node) => {
    if (hasSideEffects) return;
    if (ts7.isCallExpression(node) || ts7.isNewExpression(node) || ts7.isAwaitExpression(node) || ts7.isYieldExpression(node) || ts7.isDeleteExpression(node) || ts7.isTaggedTemplateExpression(node) || ts7.isPrefixUnaryExpression(node) || ts7.isPostfixUnaryExpression(node) || ts7.isBinaryExpression(node) && node.operatorToken.kind >= ts7.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts7.SyntaxKind.LastAssignment) {
      hasSideEffects = true;
      return;
    }
    ts7.forEachChild(node, visit);
  };
  visit(expression);
  return hasSideEffects;
}
function typescriptModuleExports(checker, sourceFile) {
  const result = /* @__PURE__ */ new Set();
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) return result;
  try {
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      result.add(canonicalSymbol(checker, exported));
      result.add(exported);
    }
  } catch {
  }
  return result;
}
function sfcHasJsx(sourceFile) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (ts7.isJsxElement(node) || ts7.isJsxSelfClosingElement(node) || ts7.isJsxFragment(node)) {
      found = true;
      return;
    }
    ts7.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}
function buildSourceFileMap(staticFiles, program2) {
  const result = /* @__PURE__ */ new Map();
  const virtualOriginals = /* @__PURE__ */ new Map();
  for (const virtual of program2.virtualByFile.values()) {
    virtualOriginals.set(path8.normalize(virtual.originalFile), virtual.fileName);
  }
  for (const file of staticFiles) {
    const normalized = path8.normalize(file);
    const virtualPath = virtualOriginals.get(normalized);
    const sourceFile = program2.program.getSourceFile(virtualPath ?? normalized);
    if (sourceFile) result.set(normalized, sourceFile);
  }
  return result;
}
function analyzeStatic(options) {
  const { root, config, files, signal } = options;
  const warnings = [];
  const compiler = loadCompilerOptions(config.tsconfig);
  warnings.push(...compiler.warnings);
  const staticProgram = createStaticProgram(files.scripts, compiler.options, warnings);
  const checker = staticProgram.checker;
  const sourceFileMap = buildSourceFileMap(files.scripts, staticProgram);
  const analyzedFiles = [...sourceFileMap.keys()];
  const analysisMode = config.mode;
  const graph = buildImportGraph(
    staticProgram,
    analyzedFiles,
    root,
    [...config.entryPoints, ...options.detection.detectedEntryPoints],
    files.html,
    signal
  );
  warnings.push(...graph.warnings);
  const entryLikeFiles = new Set(
    graph.modules.filter((module) => module.entry || module.pageLike).map((module) => module.file)
  );
  const dynamicConsumedFiles = /* @__PURE__ */ new Set();
  for (const record of graph.imports) {
    if ((record.kind === "dynamic" || record.kind === "require") && record.resolvedFile) {
      dynamicConsumedFiles.add(path8.normalize(record.resolvedFile));
    }
    if (record.kind === "re-export" && record.bindings.length === 0 && record.resolvedFile) {
      dynamicConsumedFiles.add(path8.normalize(record.resolvedFile));
    }
  }
  const records = [];
  const recordByNode = /* @__PURE__ */ new Map();
  const importAliasSymbols = /* @__PURE__ */ new Map();
  const recordsByFile = /* @__PURE__ */ new Map();
  const moduleExportsByFile = /* @__PURE__ */ new Map();
  const addRecord = (record) => {
    const relativeFile = toPosix(path8.relative(root, record.file));
    const parentRecord = parentRecordFor(record.node, recordByNode);
    const enclosingClass = findEnclosingClass(record.node);
    const classRecord = record.kind === "class" ? void 0 : enclosingClass ? recordByNode.get(enclosingClass) : void 0;
    const finalRecord = {
      ...record,
      relativeFile,
      spanBytes: record.spanBytes ?? Math.max(0, record.node.getEnd() - record.node.getStart(record.sourceFile)),
      weakRefs: record.weakRefs ?? 0,
      classDecorated: record.classDecorated ?? Boolean(classRecord?.decorated),
      classExported: record.classExported ?? Boolean(classRecord?.exported),
      parentRecord: record.parentRecord ?? parentRecord,
      classRecord: record.classRecord ?? classRecord
    };
    records.push(finalRecord);
    recordByNode.set(finalRecord.node, finalRecord);
    const list = recordsByFile.get(finalRecord.file);
    if (list) list.push(finalRecord);
    else recordsByFile.set(finalRecord.file, [finalRecord]);
    if (finalRecord.symbol) {
      const exports = moduleExportsByFile.get(finalRecord.file);
      if (!exports) {
        moduleExportsByFile.set(finalRecord.file, typescriptModuleExports(checker, record.sourceFile));
      }
    }
    return finalRecord;
  };
  const getExports = (sourceFile, file) => {
    const existing = moduleExportsByFile.get(file);
    if (existing) return existing;
    const exports = typescriptModuleExports(checker, sourceFile);
    moduleExportsByFile.set(file, exports);
    return exports;
  };
  for (const [file, sourceFile] of sourceFileMap) {
    if (isTestOrStoryFile(file) || isDeclarationFile(file)) continue;
    const exports = getExports(sourceFile, file);
    const addImportRecords = () => {
      const visitImports = (node) => {
        if (ts7.isImportDeclaration(node)) {
          const source = ts7.isStringLiteralLike(node.moduleSpecifier) ? node.moduleSpecifier.text : "";
          const clause = node.importClause;
          if (!clause || !source) return;
          const names = [];
          if (clause.name) names.push({ node: clause.name, imported: "default", typeOnly: clause.isTypeOnly });
          if (clause.namedBindings) {
            if (ts7.isNamespaceImport(clause.namedBindings)) {
              names.push({
                node: clause.namedBindings.name,
                imported: "*",
                typeOnly: clause.isTypeOnly
              });
            } else {
              for (const element of clause.namedBindings.elements) {
                names.push({
                  node: element.name,
                  imported: element.propertyName?.text ?? element.name.text,
                  typeOnly: clause.isTypeOnly || element.isTypeOnly
                });
              }
            }
          }
          for (const binding of names) {
            const symbol = checker.getSymbolAtLocation(binding.node);
            const position = lineColumn3(sourceFile, binding.node);
            const category = binding.typeOnly ? "unused-type-only-import" : "unused-import";
            addRecord({
              node,
              nameNode: binding.node,
              sourceFile,
              file,
              symbol,
              canonical: symbol ? canonicalSymbol(checker, symbol) : void 0,
              name: binding.node.text,
              category,
              symbolKind: "import",
              exported: false,
              defaultExport: false,
              typeOnlyDeclaration: binding.typeOnly,
              decorated: false,
              classDecorated: false,
              ambient: false,
              line: position.line,
              column: position.column,
              endLine: position.endLine,
              endColumn: position.endColumn,
              importDeclaration: node,
              importDeclaredTypeOnly: clause.isTypeOnly,
              importLocalName: binding.node.text,
              importSource: source,
              kind: "import"
            });
            if (symbol && binding.imported === "*") {
              importAliasSymbols.set(symbol, {
                file,
                relativeFile: toPosix(path8.relative(root, file)),
                specifier: source,
                kind: "static",
                line: position.line,
                column: position.column,
                bindings: [],
                typeOnly: binding.typeOnly,
                isAsset: false,
                sourceNodeKind: "import"
              });
            }
          }
          return;
        }
        ts7.forEachChild(node, visitImports);
      };
      visitImports(sourceFile);
    };
    addImportRecords();
    const visit = (node) => {
      const make = (nameNode, kind, category, symbolKind, extra = {}) => {
        const symbol = nameNode ? checker.getSymbolAtLocation(nameNode) : void 0;
        if (!symbol) return;
        const canonical = canonicalSymbol(checker, symbol);
        const position = lineColumn3(sourceFile, nameNode ?? node);
        const classNode = findEnclosingClass(node);
        const classRecord = classNode ? recordByNode.get(classNode) : void 0;
        const decorated = Boolean(ts7.canHaveDecorators(node) && ts7.getDecorators(node)?.length);
        const classDecorated = Boolean(
          classNode && ts7.canHaveDecorators(classNode) && ts7.getDecorators(classNode)?.length
        );
        const moduleExported = exports.has(canonical) || exports.has(symbol);
        const exported = extra.exported ?? (moduleExported || isExportedDeclaration(node));
        addRecord({
          node,
          nameNode,
          sourceFile,
          file,
          symbol,
          canonical,
          name: extra.name ?? (nameNode && ts7.isIdentifier(nameNode) ? nameNode.text : nameNode?.getText(sourceFile) ?? "<anonymous>"),
          category,
          symbolKind,
          exported,
          classExported: classRecord?.exported ?? Boolean(classNode && (exports.has(canonical) || isExportedDeclaration(classNode))),
          defaultExport: extra.defaultExport ?? isDefaultExport(node),
          typeOnlyDeclaration: extra.typeOnly ?? false,
          decorated,
          classDecorated,
          ambient: isAmbient(node, sourceFile),
          line: position.line,
          column: position.column,
          endLine: position.endLine,
          endColumn: position.endColumn,
          parent: extra.parentName ?? functionParentName(node) ?? (classNode && classNode.name ? classNode.name.text : void 0),
          ...extra.initializer ? { initializer: extra.initializer } : {},
          kind
        });
      };
      if (ts7.isFunctionDeclaration(node) && node.name && node.body) {
        make(node.name, "function", "unused-function", "function");
      } else if (ts7.isClassDeclaration(node) && node.name) {
        make(node.name, "class", "unused-class", "class");
      } else if (ts7.isVariableDeclaration(node) && ts7.isIdentifier(node.name)) {
        const constStatement = ts7.isVariableDeclarationList(node.parent) && (node.parent.flags & ts7.NodeFlags.Const) !== 0;
        make(node.name, "variable", "unused-variable", constStatement ? "constant" : "variable", {
          initializer: node.initializer
        });
      } else if (ts7.isInterfaceDeclaration(node) && node.name) {
        make(node.name, "type", "unused-type", "interface", { typeOnly: true });
      } else if (ts7.isTypeAliasDeclaration(node) && node.name) {
        make(node.name, "type", "unused-type", "type", { typeOnly: true });
      } else if (ts7.isEnumDeclaration(node) && node.name) {
        make(node.name, "enum", "unused-type", "enum", { typeOnly: false });
      } else if (ts7.isEnumMember(node) && ts7.isIdentifier(node.name)) {
        const enumNode = node.parent;
        const enumRecord = recordByNode.get(enumNode);
        make(node.name, "enum-member", "unused-enum-member", "enum-member", {
          parentName: enumRecord?.name ?? (enumNode.name && ts7.isIdentifier(enumNode.name) ? enumNode.name.text : void 0)
        });
      } else if ((ts7.isMethodDeclaration(node) || ts7.isGetAccessorDeclaration(node) || ts7.isSetAccessorDeclaration(node)) && node.name && ts7.isIdentifier(node.name) && findEnclosingClass(node) && !ts7.isConstructorDeclaration(node) && !FRAMEWORK_METHOD_NAMES.has(node.name.text)) {
        make(node.name, "method", "unused-class-method", "method");
      } else if (ts7.isPropertyDeclaration(node) && ts7.isIdentifier(node.name) && (hasModifier(node, ts7.ModifierFlags.Private) || ts7.isPrivateIdentifier(node.name))) {
        make(node.name, "property", "unused-variable", "property", { initializer: node.initializer });
      } else if (ts7.isTypeParameterDeclaration(node)) {
        const enclosing = parentRecordFor(node, recordByNode);
        make(node.name, "type-parameter", "unused-type-parameter", "type-parameter", {
          parentName: enclosing?.name
        });
      }
      ts7.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  if (signal?.aborted) throw new Error("Analysis aborted");
  const valueRefs = /* @__PURE__ */ new Map();
  const bump = (map, symbol, kind) => {
    const current = map.get(symbol) ?? { value: 0, type: 0, write: 0 };
    current[kind] += 1;
    map.set(symbol, current);
  };
  const recordsByCanonical = /* @__PURE__ */ new Map();
  for (const record of records) {
    if (record.canonical) {
      const list = recordsByCanonical.get(record.canonical);
      if (list) list.push(record);
      else recordsByCanonical.set(record.canonical, [record]);
    }
  }
  const dynamicNamespaceAliases = /* @__PURE__ */ new Set();
  const jsxFiles = /* @__PURE__ */ new Set();
  const incrementReference = (symbol, kind, node, sourceFile) => {
    const file = staticProgram.virtualByFile.get(path8.normalize(sourceFile.fileName))?.originalFile ?? path8.normalize(sourceFile.fileName);
    if (symbol.flags & ts7.SymbolFlags.Alias) {
      bump(valueRefs, symbol, kind);
      let target;
      try {
        target = canonicalSymbol(checker, symbol);
      } catch {
        return;
      }
      const selfRecords = recordsByCanonical.get(target) ?? [];
      const isSelf = selfRecords.some(
        (record) => record.file === file && node.getStart(sourceFile) >= record.node.getStart(record.sourceFile) && node.getEnd() <= record.node.getEnd()
      );
      if (!isSelf) bump(valueRefs, target, kind);
    } else {
      const selfRecords = recordsByCanonical.get(symbol) ?? [];
      const isSelf = selfRecords.some(
        (record) => record.file === file && node.getStart(sourceFile) >= record.node.getStart(record.sourceFile) && node.getEnd() <= record.node.getEnd()
      );
      if (!isSelf) bump(valueRefs, symbol, kind);
    }
  };
  const walkProgramFile = (sourceFile) => {
    if (sourceFile.isDeclarationFile) return;
    const normalized = path8.normalize(sourceFile.fileName);
    if (normalized.includes(`${path8.sep}node_modules${path8.sep}`)) return;
    if (sfcHasJsx(sourceFile)) jsxFiles.add(normalized);
    const visit = (node) => {
      if (ts7.isIdentifier(node) || ts7.isPrivateIdentifier(node)) {
        if (!isDeclaredName(node)) {
          const symbol = checker.getSymbolAtLocation(node);
          if (symbol) {
            const kind = isWriteReference(node) ? "write" : isTypePosition(node) || isExportTypeContext(node) ? "type" : "value";
            const exportContext = exportSpecifierContext(node);
            if (exportContext?.local) {
              if ((symbol.flags & ts7.SymbolFlags.Alias) !== 0) {
                bump(valueRefs, symbol, kind);
              }
            } else {
              incrementReference(symbol, kind, node, sourceFile);
            }
          }
        }
      }
      if (ts7.isElementAccessExpression(node) && ts7.isStringLiteralLike(node.argumentExpression)) {
        try {
          const type = checker.getTypeAtLocation(node.expression);
          const property = checker.getPropertyOfType(type, node.argumentExpression.text);
          if (property) {
            incrementReference(property, isWriteReference(node) ? "write" : "value", node, sourceFile);
          }
        } catch {
        }
      }
      if (ts7.isElementAccessExpression(node) && !ts7.isStringLiteralLike(node.argumentExpression) && !ts7.isNumericLiteral(node.argumentExpression)) {
        const symbol = checker.getSymbolAtLocation(node.expression);
        if (symbol && (symbol.flags & ts7.SymbolFlags.Alias) !== 0) {
          dynamicNamespaceAliases.add(symbol);
        }
      }
      if (ts7.isCallExpression(node) && ts7.isPropertyAccessExpression(node.expression)) {
        const name = node.expression.name.text;
        if ((name === "keys" || name === "values" || name === "entries") && node.arguments.length > 0) {
          const argument = node.arguments[0];
          if (argument) {
            const symbol = checker.getSymbolAtLocation(argument);
            if (symbol && (symbol.flags & ts7.SymbolFlags.Alias) !== 0) dynamicNamespaceAliases.add(symbol);
          }
        }
      }
      if ((ts7.isSpreadElement(node) || ts7.isSpreadAssignment(node)) && ts7.isIdentifier(node.expression)) {
        const symbol = checker.getSymbolAtLocation(node.expression);
        if (symbol && (symbol.flags & ts7.SymbolFlags.Alias) !== 0) dynamicNamespaceAliases.add(symbol);
      }
      ts7.forEachChild(node, visit);
    };
    visit(sourceFile);
    if (jsxFiles.has(normalized)) {
      for (const record of records) {
        if (record.kind === "import" && record.importLocalName === "React" && record.file === (staticProgram.virtualByFile.get(normalized)?.originalFile ?? normalized)) {
          record.weakRefs += 1;
        }
      }
    }
  };
  for (const sourceFile of staticProgram.program.getSourceFiles()) {
    if (signal?.aborted) break;
    walkProgramFile(sourceFile);
  }
  if (signal?.aborted) throw new Error("Analysis aborted");
  for (const [file, sourceFile] of sourceFileMap) {
    const extension = path8.extname(file).toLowerCase();
    if (![".vue", ".svelte", ".astro"].includes(extension)) continue;
    let content = "";
    try {
      content = ts7.sys.readFile(file) ?? "";
    } catch {
      continue;
    }
    const extraction = extractSfc(file, content);
    if (!extraction) continue;
    const names = templateIdentifiers(extraction.templateText);
    for (const record of recordsByFile.get(file) ?? []) {
      if (names.has(record.name)) record.weakRefs += 1;
    }
  }
  for (const [aliasSymbol, record] of importAliasSymbols) {
    if (!dynamicNamespaceAliases.has(aliasSymbol)) continue;
    const importRecord = graph.imports.find(
      (item) => item.file === record.file && item.specifier === record.specifier && item.bindings.some((binding) => binding.imported === "*")
    );
    if (importRecord?.resolvedFile) dynamicConsumedFiles.add(path8.normalize(importRecord.resolvedFile));
  }
  const dynamicPatterns = graph.dynamicPatterns;
  const patternsByFile = /* @__PURE__ */ new Map();
  for (const pattern of dynamicPatterns) {
    const set = patternsByFile.get(pattern.file) ?? /* @__PURE__ */ new Set();
    set.add(pattern.kind);
    patternsByFile.set(pattern.file, set);
  }
  const projectDynamicRisk = dynamicPatterns.some(
    (pattern) => ["eval", "new-function", "dynamic-member", "reflection", "dynamic-module"].includes(pattern.kind)
  );
  const findings = [];
  const typeOnlyUsage = /* @__PURE__ */ new Map();
  const importRecords = records.filter((record) => record.kind === "import");
  for (const record of importRecords) {
    const counts = symbolCount(valueRefs, record.symbol);
    const total = counts.value + counts.type + record.weakRefs;
    if (total === 0) {
      const filePatterns = patternsByFile.get(record.file) ?? /* @__PURE__ */ new Set();
      const dynamicRisk = filePatterns.has("eval") || filePatterns.has("new-function");
      const category = record.importDeclaredTypeOnly ? "unused-type-only-import" : record.typeOnlyDeclaration ? "unused-type-only-import" : "unused-import";
      const status = dynamicRisk ? "potentially-unused" : "confirmed-unused";
      const confidence = dynamicRisk ? "medium" : "high";
      const finding = createFinding({
        root,
        category,
        status,
        confidence,
        title: `Unused import "${record.name}"`,
        description: `The imported binding "${record.name}" from "${record.importSource ?? "a module"}" has no static references. ${dynamicRisk ? "Dynamic eval was detected in this file, so removal needs review." : "The import binding can be removed safely; module evaluation side effects must be preserved."}`,
        file: record.file,
        line: record.line,
        column: record.column,
        endLine: record.endLine,
        endColumn: record.endColumn,
        symbol: record.name,
        symbolKind: "import",
        ...record.parent ? { parent: record.parent } : {},
        size: {
          sourceBytes: record.spanBytes,
          estimatedRemovableBytes: dynamicRisk ? 0 : record.name.length + 6,
          basis: "Import binding syntax only; module evaluation is preserved."
        },
        evidence: [
          {
            kind: "no-static-reference",
            description: `No value or type references found for "${record.name}".`,
            file: toPosix(record.relativeFile),
            line: record.line
          },
          ...dynamicRisk ? [
            {
              kind: "dynamic-access",
              description: "Dynamic eval/new Function in the same file can access local bindings.",
              file: toPosix(record.relativeFile),
              line: record.line
            }
          ] : []
        ],
        tags: ["import", ...record.importDeclaredTypeOnly ? ["type-only"] : []],
        fingerprintSuffix: record.importSource ?? ""
      });
      record.finding = finding;
      findings.push(finding);
    } else if (!record.importDeclaredTypeOnly && counts.value === 0 && counts.type > 0) {
      const entry2 = {
        source: record.importSource ?? "",
        file: record.file,
        relativeFile: record.relativeFile,
        names: [record.name]
      };
      const packageName = graph.externalImports.find(
        (external) => external.file === record.file && external.specifier === record.importSource
      )?.packageName;
      if (packageName) entry2.packageName = packageName;
      const key = `${entry2.file}|${entry2.source}`;
      const existing = typeOnlyUsage.get(key);
      if (existing) {
        if (!existing.names.includes(record.name)) existing.names.push(record.name);
      } else {
        typeOnlyUsage.set(key, entry2);
      }
    }
  }
  const parentHasFinding = (record) => {
    let current = record.parentRecord;
    while (current) {
      if (current.finding) return true;
      current = current.parentRecord;
    }
    return false;
  };
  const importDeclGroups = /* @__PURE__ */ new Map();
  for (const record of importRecords) {
    if (!record.importDeclaration) continue;
    const group = importDeclGroups.get(record.importDeclaration);
    if (group) group.push(record);
    else importDeclGroups.set(record.importDeclaration, [record]);
  }
  for (const record of records) {
    if (record.kind === "import") continue;
    if (record.ambient) continue;
    if (record.decorated || record.classDecorated) continue;
    if (record.exported && analysisMode === "library") continue;
    if (record.exported && entryLikeFiles.has(record.file)) continue;
    if (record.exported && dynamicConsumedFiles.has(record.file)) continue;
    if (record.kind === "method" && record.classExported && (analysisMode === "library" || entryLikeFiles.has(record.file))) {
      continue;
    }
    if (parentHasFinding(record)) continue;
    if (record.kind === "method" && record.parentRecord?.kind === "class" && parentHasFinding(record.parentRecord)) {
      continue;
    }
    const counts = symbolCount(valueRefs, record.canonical);
    const total = counts.value + counts.type + record.weakRefs;
    if (total > 0) continue;
    const filePatterns = patternsByFile.get(record.file) ?? /* @__PURE__ */ new Set();
    const dynamicEval = filePatterns.has("eval") || filePatterns.has("new-function");
    const dynamicMember = filePatterns.has("dynamic-member") || filePatterns.has("reflection");
    const exportedRisk = record.exported && (graph.hasDynamicModuleLoading || projectDynamicRisk || dynamicConsumedFiles.has(record.file));
    const isTypeOnly = record.typeOnlyDeclaration;
    const category = isTypeOnly || record.kind === "type-parameter" || record.kind === "enum-member" ? record.category : record.exported ? "unused-export" : record.category;
    let status;
    let confidence;
    let severity;
    if (exportedRisk) {
      status = "dynamically-referenced";
      confidence = "low";
      severity = "info";
    } else if (record.exported) {
      status = "potentially-unused";
      confidence = record.kind === "method" ? "medium" : "high";
      severity = "low";
    } else if (record.kind === "method" && !isTypeOnly) {
      const privateMethod = record.nameNode ? ts7.isPrivateIdentifier(record.nameNode) || hasModifier(record.node, ts7.ModifierFlags.Private) : false;
      const memberRisk = dynamicMember || dynamicEval || !privateMethod;
      status = memberRisk ? "potentially-unused" : "confirmed-unused";
      confidence = privateMethod && !dynamicMember && !dynamicEval ? "high" : "medium";
      severity = privateMethod ? void 0 : "low";
    } else if (record.kind === "enum-member") {
      status = "potentially-unused";
      confidence = "medium";
      severity = "low";
    } else if (record.kind === "type-parameter") {
      status = "confirmed-unused";
      confidence = "high";
      severity = "low";
    } else if (record.kind === "variable" && counts.write > 0) {
      status = "confirmed-unused";
      confidence = dynamicEval ? "medium" : "high";
      severity = "low";
    } else if (dynamicEval) {
      status = "potentially-unused";
      confidence = "medium";
    } else {
      status = "confirmed-unused";
      confidence = "high";
    }
    if (record.kind === "type-parameter" && record.parentRecord?.exported) continue;
    if (record.kind === "enum-member" && record.parentRecord?.finding) continue;
    if (record.kind === "method" && record.parentRecord?.finding) continue;
    const parentKind = record.symbolKind;
    const typeBasis = isTypeOnly ? "Type-only source span." : "Declaration source span.";
    const sideEffectInitializer = record.kind === "variable" && expressionHasSideEffects(record.initializer);
    const canEstimate = (status === "confirmed-unused" || status === "potentially-unused") && !record.exported;
    const estimated = canEstimate && status === "confirmed-unused" && !sideEffectInitializer && record.kind !== "method" ? record.spanBytes : canEstimate && status === "confirmed-unused" && record.kind === "method" ? record.spanBytes : 0;
    const titlePrefix = status === "confirmed-unused" ? "Unused" : status === "dynamically-referenced" ? "Dynamically referenced" : "Potentially unused";
    const title = `${titlePrefix} ${humanizeKind(parentKind)} "${record.name}"`;
    const evidence = [
      {
        kind: "no-static-reference",
        description: `No static value or type references were found for "${record.name}".`,
        file: record.relativeFile,
        line: record.line
      },
      ...record.exported ? [
        {
          kind: "static-reference",
          description: "The declaration is exported. External consumers cannot be fully enumerated.",
          file: record.relativeFile,
          line: record.line
        }
      ] : [],
      ...status === "dynamically-referenced" ? [
        {
          kind: "dynamic-access",
          description: "Dynamic module loading or reflection was detected in the project.",
          file: record.relativeFile,
          line: record.line
        }
      ] : [],
      ...dynamicEval ? [
        {
          kind: "dynamic-access",
          description: "eval/new Function is present in this file.",
          file: record.relativeFile,
          line: record.line
        }
      ] : [],
      ...sideEffectInitializer ? [
        {
          kind: "parser",
          description: "The initializer contains calls/assignments; removing it can change behavior.",
          file: record.relativeFile,
          line: record.line
        }
      ] : []
    ];
    const finding = createFinding({
      root,
      category,
      status,
      confidence,
      ...severity ? { severity } : {},
      title,
      description: status === "confirmed-unused" ? `${capitalize(humanizeKind(parentKind))} "${record.name}" is not referenced inside the analyzed project. ${record.exported ? "" : "Static evidence supports removal after checking for reflection. "}${isTypeOnly ? "This is a type-only declaration." : ""}${sideEffectInitializer ? " Preserve initializer side effects." : ""}` : status === "dynamically-referenced" ? `No static references were found, but dynamic module loading/reflection means this export may be consumed externally. Do not remove without verification.` : `No static references were found. ${record.exported ? "It is exported, so external or framework consumers may still use it." : "Runtime states not observed by static analysis may still use it."}`,
      file: record.file,
      line: record.line,
      column: record.column,
      endLine: record.endLine,
      endColumn: record.endColumn,
      symbol: record.name,
      symbolKind: parentKind,
      ...record.parent ? { parent: record.parent } : {},
      size: {
        sourceBytes: record.spanBytes,
        ...estimated > 0 ? { estimatedRemovableBytes: estimated } : {},
        basis: estimated > 0 ? `${typeBasis} Overlapping spans are not guaranteed to add up.` : sideEffectInitializer ? "Initializer has side effects; no removable-byte estimate is claimed." : "Removal is not recommended without external/runtime verification; no savings estimate claimed."
      },
      evidence,
      tags: [
        record.exported ? "exported" : "local",
        ...isTypeOnly ? ["type-only"] : [],
        ...record.kind === "method" ? ["class-member"] : [],
        ...sideEffectInitializer ? ["side-effect-initializer"] : []
      ],
      fingerprintSuffix: record.defaultExport ? "default" : void 0
    });
    record.finding = finding;
    findings.push(finding);
  }
  for (const [declaration, group] of importDeclGroups) {
    if (group.length === 0) continue;
    if (!group.every((record) => record.finding && record.finding.status === "confirmed-unused")) continue;
    const first = group[0];
    const firstFinding = first?.finding;
    if (!first || !firstFinding) continue;
    const sourceFile = first.sourceFile;
    const start = declaration.getStart(sourceFile);
    const end = declaration.getEnd();
    const expectedText = sourceFile.text.slice(start, end);
    if (/\b(?:with|assert)\s*\{/.test(expectedText)) continue;
    if (expectedText.includes("/*") || expectedText.includes("//")) continue;
    const clause = declaration.importClause;
    if (!clause) continue;
    if (clause.isTypeOnly) {
      firstFinding.fix = {
        kind: "remove-range",
        startOffset: start,
        endOffset: end,
        expectedText,
        safe: true,
        description: "Delete a fully unused type-only import. Type-only code has no runtime effect."
      };
      firstFinding.size.estimatedRemovableBytes = expectedText.length;
      firstFinding.size.basis = "Type-only import declaration removed.";
    } else if (!group.every((record) => record.typeOnlyDeclaration)) {
      const moduleText = declaration.moduleSpecifier.getText(sourceFile);
      firstFinding.fix = {
        kind: "replace-range",
        startOffset: start,
        endOffset: end,
        replacement: `import ${moduleText};`,
        expectedText,
        safe: true,
        description: "Replace the fully unused import with a side-effect import, preserving module evaluation."
      };
      firstFinding.size.estimatedRemovableBytes = 0;
      firstFinding.size.basis = "Only binding syntax is removed; module evaluation is preserved.";
    }
  }
  if (graph.entryPoints.length > 0 && !graph.hasGlobImports) {
    for (const module of graph.modules) {
      if (module.reachable || module.entry || module.importerCount > 0 || module.dynamicImportTarget) continue;
      if (module.isTest || module.pageLike) continue;
      if (isDeclarationFile(module.file)) continue;
      if (!["js", "jsx", "mjs", "cjs", "ts", "tsx", "mts", "cts"].includes(module.type)) continue;
      const relative = module.relativeFile.toLowerCase();
      const basename = path8.basename(relative);
      if (/\/(scripts|tools|bin|config|configs|migrations|seeds)\//.test(`/${relative}/`) || /\.(config|setup)\.[^.]+$/.test(relative) || /^(build|esbuild|webpack|rollup|vite|vitest|playwright|jest|tsup|babel|postcss|tailwind)(\.config)?\.(?:[cm]?[jt]s)$/i.test(basename) || relative.includes("vite-env") || relative.includes("env.d.ts")) {
        continue;
      }
      const text = ts7.sys.readFile(module.file);
      if (text?.startsWith("#!")) continue;
      const finding = createFinding({
        root,
        category: "unused-module",
        status: "potentially-unused",
        confidence: "medium",
        title: `Unreferenced module ${module.relativeFile}`,
        description: "No entry point, HTML reference, static import, or dynamic import reaches this module. Framework file conventions and non-literal dynamic loading are excluded from this check.",
        file: module.file,
        line: 1,
        column: 1,
        symbol: module.relativeFile,
        symbolKind: "module",
        size: {
          sourceBytes: module.bytes,
          estimatedRemovableBytes: 0,
          basis: "Whole-module removal is not claimed until imports and external usage are verified."
        },
        evidence: [
          {
            kind: "no-static-reference",
            description: "No reachable importer or entry point was found.",
            file: module.relativeFile,
            line: 1
          }
        ],
        tags: ["module"]
      });
      findings.push(finding);
    }
  } else if (graph.entryPoints.length > 0 && graph.hasGlobImports) {
    warnings.push("Glob imports were detected; unused-module findings were skipped because reachability is dynamic.");
  }
  for (const cycle of graph.circularDependencies) {
    const first = cycle.files[0];
    if (!first) continue;
    const finding = createFinding({
      root,
      category: "circular-dependency",
      status: "unknown",
      confidence: "high",
      title: `Circular dependency (${cycle.relativeFiles.length} modules)`,
      description: cycle.typeOnly ? "These modules form a type-only import cycle. It is erased at runtime but can still complicate type architecture." : "These modules import each other through a runtime import cycle. This can cause partially initialized modules and bundler ordering problems.",
      file: first,
      line: cycle.line ?? 1,
      column: 1,
      symbol: cycle.relativeFiles.join(" \u2192 "),
      symbolKind: "module",
      size: {},
      evidence: [
        {
          kind: "parser",
          description: `Cycle: ${cycle.relativeFiles.join(" \u2192 ")}`,
          file: cycle.relativeFiles[0]
        }
      ],
      tags: ["dependency-graph", ...cycle.typeOnly ? ["type-only"] : []],
      fingerprintSuffix: hashString([...cycle.relativeFiles].sort().join("|"), 12)
    });
    findings.push(finding);
  }
  if (config.analysis.unreachableCode) {
    for (const [file, sourceFile] of sourceFileMap) {
      if (isTestOrStoryFile(file) || isDeclarationFile(file)) continue;
      findings.push(...findUnreachableCode(root, file, sourceFile));
    }
  }
  if (config.analysis.duplicates) {
    const duplicateInput = [...sourceFileMap].filter(([file]) => !isTestOrStoryFile(file) && !isDeclarationFile(file)).map(([file, sourceFile]) => ({
      file,
      relativeFile: toPosix(path8.relative(root, file)),
      sourceFile
    }));
    findings.push(...findDuplicateCode(root, duplicateInput));
  }
  const typeOnlyImports = [...graph.typeOnlyImports];
  for (const entry2 of typeOnlyUsage.values()) {
    const existing = typeOnlyImports.find(
      (item) => item.file === entry2.file && item.source === entry2.source
    );
    if (existing) {
      for (const name of entry2.names) if (!existing.names.includes(name)) existing.names.push(name);
      if (!existing.packageName && entry2.packageName) existing.packageName = entry2.packageName;
    } else {
      typeOnlyImports.push(entry2);
    }
  }
  const finalFindings = uniqueFindingFingerprints(findings).sort((a, b) => {
    const severityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4
    };
    const severity = severityOrder[a.severity] - severityOrder[b.severity];
    if (severity !== 0) return severity;
    if (a.location.relativeFile !== b.location.relativeFile) {
      return a.location.relativeFile.localeCompare(b.location.relativeFile);
    }
    return a.location.line - b.location.line;
  });
  if (dynamicPatterns.length > 0) {
    warnings.push(
      `${dynamicPatterns.length} dynamic/reflection pattern${dynamicPatterns.length === 1 ? "" : "s"} detected. Findings affected by dynamic access are marked conservatively.`
    );
  }
  if (graph.entryPoints.length === 0) {
    warnings.push("No reachable entry point was detected; unused-module analysis was skipped.");
  }
  const moduleMap = new Map(graph.modules.map((module) => [module.file, module]));
  const normalizedModules = [...moduleMap.values()];
  const totalLines = graph.sourceFiles.reduce((sum, file) => sum + file.lines, 0);
  return {
    findings: finalFindings,
    modules: normalizedModules,
    files: graph.sourceFiles,
    imports: graph.imports,
    externalImports: graph.externalImports,
    typeOnlyImports: dedupeTypeOnlyImports(typeOnlyImports),
    assetImports: graph.assetImports,
    dynamicPatterns,
    warnings: [...new Set(warnings)],
    entryPoints: graph.entryPoints,
    reachableFiles: graph.reachableFiles,
    circularDependencies: graph.circularDependencies,
    totalLines,
    symbolCount: records.length,
    hasDynamicModuleLoading: graph.hasDynamicModuleLoading,
    hasGlobImports: graph.hasGlobImports,
    htmlReferences: graph.htmlReferences
  };
}
function dedupeTypeOnlyImports(entries) {
  const map = /* @__PURE__ */ new Map();
  for (const entry2 of entries) {
    const key = `${entry2.file}|${entry2.source}`;
    const existing = map.get(key);
    if (existing) {
      for (const name of entry2.names) if (!existing.names.includes(name)) existing.names.push(name);
      if (!existing.packageName && entry2.packageName) existing.packageName = entry2.packageName;
    } else {
      map.set(key, { ...entry2, names: [...entry2.names] });
    }
  }
  return [...map.values()];
}
function humanizeKind(kind) {
  switch (kind) {
    case "function":
      return "function";
    case "class":
      return "class";
    case "method":
      return "method";
    case "property":
      return "property";
    case "interface":
      return "interface";
    case "type":
      return "type";
    case "enum":
      return "enum";
    case "enum-member":
      return "enum member";
    case "type-parameter":
      return "type parameter";
    case "variable":
      return "variable";
    case "constant":
      return "constant";
    case "module":
      return "module";
    default:
      return "declaration";
  }
}
function capitalize(value) {
  return value.length > 0 ? `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}` : value;
}
function lineResolver(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) starts.push(index + 1);
  }
  return {
    lineAt(offset) {
      let low = 0;
      let high = starts.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const start = starts[mid] ?? 0;
        if (start <= offset) low = mid + 1;
        else high = mid - 1;
      }
      return Math.max(1, high + 1);
    }
  };
}
function entry(map, key) {
  const existing = map.get(key);
  if (existing) return existing;
  const created = [];
  map.set(key, created);
  return created;
}
function addHit(map, token, hit) {
  if (!token) return;
  entry(map, token).push(hit);
}
function addClassToken(index, token, hit) {
  const cleaned = token.trim();
  if (!/^[A-Za-z_][\w-]*$/.test(cleaned)) return;
  addHit(index.classes, cleaned, hit);
}
function addClassString(index, value, file, line, kind, context) {
  for (const token of value.split(/[\s,]+/)) {
    if (!token) continue;
    addClassToken(index, token, { file, line, kind, context });
  }
}
function addGenericStrings(index, text, file, resolver, root, styleByBasename) {
  const regex = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let raw = match[0];
    const line = resolver.lineAt(match.index);
    raw = raw.slice(1, -1);
    if (raw.length === 0 || raw.length > 500) continue;
    if (raw.includes("\n")) continue;
    const parts = raw.includes("${") ? raw.split(/\$\{[^}]*\}/g) : [raw];
    for (const part of parts) {
      for (const token of part.split(/\s+/)) {
        if (/^[A-Za-z_][\w-]*$/.test(token)) {
          addClassToken(index, token, {
            file,
            line,
            kind: "weak",
            context: "string literal"
          });
        }
      }
    }
    const clean = raw.replace(/[?#].*$/, "");
    if (/\.(css|scss|sass|less)$/i.test(clean)) {
      const resolved = clean.startsWith("/") ? path8.resolve(root, `.${clean}`) : path8.isAbsolute(clean) ? clean : path8.resolve(path8.dirname(file), clean);
      if (existsSync(resolved)) index.referencedStylesheets.add(path8.normalize(resolved));
      else {
        const byName = styleByBasename.get(path8.basename(clean).toLowerCase()) ?? [];
        if (byName.length === 1 && byName[0]) index.referencedStylesheets.add(byName[0]);
      }
    }
  }
}
function addSelectorString(index, selector, file, line, context) {
  const hit = { file, line, kind: "query", context };
  for (const match of selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
    if (match[1]) addHit(index.classes, match[1], hit);
  }
  for (const match of selector.matchAll(/#([A-Za-z_][\w-]*)/g)) {
    if (match[1]) addHit(index.ids, match[1], hit);
  }
  for (const match of selector.matchAll(/\[([A-Za-z_][\w:-]*)/g)) {
    if (match[1]) {
      const values = entry(index.attributes, match[1]);
      values.push({ hit });
    }
  }
  for (const match of selector.matchAll(/(?:^|[\s>+~,])([a-z][\w-]*)/g)) {
    if (match[1]) addHit(index.tags, match[1], hit);
  }
}
function addAttribute(index, name, value, hit) {
  const cleanName = name.trim().toLowerCase();
  if (!/^[a-z_:][\w:.-]*$/i.test(cleanName)) return;
  entry(index.attributes, cleanName).push({
    ...value !== void 0 && value !== "" ? { value } : {},
    hit
  });
}
function parseMarkupAttributes(index, markup, file, resolver) {
  const tagRegex = /<([a-z][\w-]*)([^<>]*)>/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(markup)) !== null) {
    const tag = tagMatch[1] ?? "";
    const attrs = tagMatch[2] ?? "";
    const line = resolver.lineAt(tagMatch.index);
    if (tag) {
      addHit(index.tags, tag.toLowerCase(), {
        file,
        line,
        kind: "strong",
        context: "markup element"
      });
    }
    const attrRegex = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const name = attrMatch[1] ?? "";
      const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];
      addAttribute(index, name, value, {
        file,
        line,
        kind: "strong",
        context: "markup attribute"
      });
      if (name.toLowerCase() === "id" && value) {
        addHit(index.ids, value.trim(), {
          file,
          line,
          kind: "strong",
          context: "id attribute"
        });
      }
    }
    const booleanAttrs = /(?:^|\s)(hidden|disabled|checked|open|selected|required|multiple|autofocus|controls|loop|muted|readonly|novalidate|async|defer)\b/gi;
    let booleanMatch;
    while ((booleanMatch = booleanAttrs.exec(attrs)) !== null) {
      if (booleanMatch[1]) {
        addAttribute(index, booleanMatch[1], void 0, {
          file,
          line,
          kind: "strong",
          context: "boolean attribute"
        });
      }
    }
  }
}
function scanClassAttributes(index, text, file, resolver) {
  const regex = /\b(?:class|className|:class|v-bind:class)\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|\{([\s\S]*?)\})/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const line = resolver.lineAt(match.index);
    const direct = match[1] ?? match[2] ?? match[3];
    if (direct !== void 0) {
      addClassString(index, direct, file, line, "strong", "class attribute");
    }
    const expression = match[4];
    if (expression !== void 0) {
      const raw = expression;
      const staticStrings = raw.match(/['"`]([^'"`]+)['"`]/g) ?? [];
      for (const literal of staticStrings) {
        addClassString(index, literal.slice(1, -1), file, line, "strong", "conditional class");
      }
      for (const key of raw.matchAll(/['"]([\w-]+)['"]\s*:/g)) {
        if (key[1]) addClassString(index, key[1], file, line, "strong", "conditional class key");
      }
      for (const key of raw.matchAll(/(?:^|[,{}])\s*([A-Za-z_][\w-]*)\s*:/g)) {
        if (key[1] && !["http", "https"].includes(key[1])) {
          addClassString(index, key[1], file, line, "strong", "conditional class key");
        }
      }
      index.dynamicClasses = true;
      index.dynamicFiles.add(file);
    }
  }
  const assignmentRegex = /\b(?:class|className)\s*=\s*([^;\n]+)/g;
  while ((match = assignmentRegex.exec(text)) !== null) {
    const value = match[1] ?? "";
    if (value.includes("${") || /[A-Za-z_$][\w$]*\s*\+/.test(value)) {
      index.dynamicClasses = true;
      index.dynamicFiles.add(file);
    }
  }
  const classListRegex = /classList\s*\.\s*(?:add|remove|toggle|replace|contains)\s*\(([^)]*)\)/g;
  while ((match = classListRegex.exec(text)) !== null) {
    const line = resolver.lineAt(match.index);
    const args = match[1] ?? "";
    for (const literal of args.matchAll(/['"`]([^'"`]+)['"`]/g)) {
      if (literal[1]) addClassString(index, literal[1], file, line, "strong", "classList");
    }
    if (/[A-Za-z_$][\w$]*/.test(args.replace(/['"`][^'"`]*['"`]/g, ""))) {
      index.dynamicClasses = true;
      index.dynamicFiles.add(file);
    }
  }
  const svelteClass = /\bclass:([A-Za-z_][\w-]*)/g;
  while ((match = svelteClass.exec(text)) !== null) {
    if (match[1]) addClassString(index, match[1], file, resolver.lineAt(match.index), "strong", "Svelte class directive");
  }
  const clsxRegex = /\b(?:clsx|classnames|classNames|cn|twMerge)\s*\(([\s\S]{0,500}?)\)/g;
  while ((match = clsxRegex.exec(text)) !== null) {
    const args = match[1] ?? "";
    for (const literal of args.matchAll(/['"`]([^'"`]+)['"`]/g)) {
      if (literal[1]) {
        addClassString(index, literal[1], file, resolver.lineAt(match.index), "strong", "class helper");
      }
    }
    if (/[A-Za-z_$][\w$]*/.test(args.replace(/['"`][^'"`]*['"`]/g, ""))) {
      index.dynamicClasses = true;
      index.dynamicFiles.add(file);
    }
  }
}
function scanQueryUsage(index, text, file, resolver) {
  const selectorCalls = /(?:querySelector|querySelectorAll|matches|closest|getElementsByClassName)\s*\(\s*(['"`])([\s\S]*?)\1/g;
  let match;
  while ((match = selectorCalls.exec(text)) !== null) {
    const selector = match[2] ?? "";
    addSelectorString(index, selector, file, resolver.lineAt(match.index), "selector query");
  }
  const idCalls = /getElementById\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;
  while ((match = idCalls.exec(text)) !== null) {
    const id = match[2] ?? "";
    addHit(index.ids, id, {
      file,
      line: resolver.lineAt(match.index),
      kind: "strong",
      context: "getElementById"
    });
  }
  const attributeCalls = /setAttribute\s*\(\s*(['"`])([\w:-]+)\1(?:\s*,\s*(['"`])([^'"`]*)\3)?\s*\)/g;
  while ((match = attributeCalls.exec(text)) !== null) {
    const name = match[2] ?? "";
    const value = match[4] ?? "";
    const line = resolver.lineAt(match.index);
    addAttribute(index, name, value || void 0, { file, line, kind: "strong", context: "setAttribute" });
    if (name === "class") addClassString(index, value, file, line, "strong", "setAttribute");
    else if (name === "id") addHit(index.ids, value, { file, line, kind: "strong", context: "setAttribute" });
  }
  const propertyAttributes = /\.(hidden|disabled|checked|open|selected|readOnly)\s*=\s*(?:true|false)/g;
  while ((match = propertyAttributes.exec(text)) !== null) {
    const name = (match[1] ?? "").toLowerCase();
    if (name) addAttribute(index, name === "readonly" ? "readonly" : name, void 0, {
      file,
      line: resolver.lineAt(match.index),
      kind: "strong",
      context: "DOM property"
    });
  }
  const tagCalls = /(?:createElement|getElementsByTagName)\s*\(\s*(['"`])([a-z][\w-]*)\1/g;
  while ((match = tagCalls.exec(text)) !== null) {
    const tag = match[2] ?? "";
    addHit(index.tags, tag, {
      file,
      line: resolver.lineAt(match.index),
      kind: "strong",
      context: "tag API"
    });
  }
  const defineCalls = /customElements\s*\.\s*define\s*\(\s*(['"`])([a-z][\w-]*)\1/g;
  while ((match = defineCalls.exec(text)) !== null) {
    addHit(index.tags, match[2] ?? "", {
      file,
      line: resolver.lineAt(match.index),
      kind: "strong",
      context: "custom element"
    });
  }
}
function scanMarkupLinks(index, html, file, root, resolver, styleByBasename) {
  const linkRegex = /<link\b([^>]*)>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1] ?? "";
    const rel = /\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const relValue = rel?.[1] ?? rel?.[2] ?? rel?.[3] ?? "";
    const hrefValue = href?.[1] ?? href?.[2] ?? href?.[3];
    if (!hrefValue) continue;
    if (!/stylesheet/i.test(relValue) && !/\.(css|scss|less|sass)(?:[?#]|$)/i.test(hrefValue)) continue;
    const clean = hrefValue.replace(/[?#].*$/, "");
    if (/^(?:https?:)?\/\//i.test(clean)) continue;
    const resolved = clean.startsWith("/") ? path8.resolve(root, `.${clean}`) : path8.resolve(path8.dirname(file), clean);
    if (existsSync(resolved)) index.referencedStylesheets.add(path8.normalize(resolved));
    else {
      const byName = styleByBasename.get(path8.basename(clean).toLowerCase()) ?? [];
      if (byName.length === 1 && byName[0]) index.referencedStylesheets.add(byName[0]);
    }
  }
}
function scanCssModuleBinding(index, binding, moduleFile, text, file, resolver) {
  if (!binding) return;
  const escaped = binding.replace(/[$]/g, "\\$&");
  const prefix = "(?:^|[^\\w$])";
  const usage = new RegExp(`${prefix}${escaped}\\s*(?:\\?\\.|\\.)\\s*([A-Za-z_$][\\w$-]*)`, "g");
  let match;
  while ((match = usage.exec(text)) !== null) {
    if (match[1]) {
      const set = index.moduleUsage.get(moduleFile) ?? /* @__PURE__ */ new Set();
      set.add(match[1]);
      index.moduleUsage.set(moduleFile, set);
    }
  }
  const bracketUsage = new RegExp(`${prefix}${escaped}\\s*\\[\\s*['"]([^'"]+)['"]\\s*\\]`, "g");
  while ((match = bracketUsage.exec(text)) !== null) {
    if (match[1]) {
      const set = index.moduleUsage.get(moduleFile) ?? /* @__PURE__ */ new Set();
      set.add(match[1]);
      index.moduleUsage.set(moduleFile, set);
    }
  }
  const destructure = new RegExp(`\\{[^}]*\\}\\s*=\\s*${escaped}(?![\\w$])`, "g");
  while ((match = destructure.exec(text)) !== null) {
    const keys = match[0].slice(1, match[0].indexOf("}")).split(",");
    for (const key of keys) {
      const name = key.split(":")[0]?.trim().replace(/['"`]/g, "");
      if (name) {
        const set = index.moduleUsage.get(moduleFile) ?? /* @__PURE__ */ new Set();
        set.add(name);
        index.moduleUsage.set(moduleFile, set);
      }
    }
  }
}
function readTextSafe(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return void 0;
  }
}
function maskStyleBlocks(content) {
  return content.replace(
    /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,
    (value) => value.replace(/[^\r\n]/g, " ")
  );
}
function buildCssUsageIndex(root, config, files, staticResult) {
  const index = {
    classes: /* @__PURE__ */ new Map(),
    ids: /* @__PURE__ */ new Map(),
    tags: /* @__PURE__ */ new Map(),
    attributes: /* @__PURE__ */ new Map(),
    moduleUsage: /* @__PURE__ */ new Map(),
    moduleImports: /* @__PURE__ */ new Map(),
    referencedStylesheets: /* @__PURE__ */ new Set(),
    dynamicClasses: false,
    dynamicFiles: /* @__PURE__ */ new Set(),
    cssInJs: false,
    warnings: []
  };
  const textByFile = /* @__PURE__ */ new Map();
  const resolverByFile = /* @__PURE__ */ new Map();
  const styleByBasename = /* @__PURE__ */ new Map();
  for (const styleFile of files.styles) {
    const basename = path8.basename(styleFile).toLowerCase();
    const list = styleByBasename.get(basename) ?? [];
    list.push(path8.normalize(styleFile));
    styleByBasename.set(basename, list);
  }
  for (const file of files.scripts) {
    const raw = readTextSafe(file);
    if (raw === void 0) continue;
    const extension = path8.extname(file).toLowerCase();
    let text = raw;
    if (extension === ".vue" || extension === ".svelte" || extension === ".astro") {
      const extraction = extractSfc(file, raw);
      if (extraction) {
        text = config.css.scanTemplates ? maskStyleBlocks(raw) : extraction.virtualContent ?? "";
      }
    }
    textByFile.set(file, text);
    const resolver = lineResolver(text);
    resolverByFile.set(file, resolver);
    scanClassAttributes(index, text, file, resolver);
    scanQueryUsage(index, text, file, resolver);
    if (config.css.scanTemplates) parseMarkupAttributes(index, text, file, resolver);
    addGenericStrings(index, text, file, resolver, root, styleByBasename);
    if (/\b(?:styled\s*[.(]|styled\.|makeStyles|createStyles|useStyles|css\s*`|styled-components|@emotion)/.test(text)) {
      index.cssInJs = true;
      index.dynamicClasses = true;
      index.dynamicFiles.add(file);
    }
  }
  for (const file of files.html) {
    const raw = readTextSafe(file);
    if (raw === void 0) continue;
    const masked = maskStyleBlocks(raw);
    textByFile.set(file, masked);
    const resolver = lineResolver(masked);
    resolverByFile.set(file, resolver);
    if (config.css.scanTemplates) {
      scanClassAttributes(index, masked, file, resolver);
      parseMarkupAttributes(index, masked, file, resolver);
      scanQueryUsage(index, masked, file, resolver);
      addGenericStrings(index, masked, file, resolver, root, styleByBasename);
    }
    scanMarkupLinks(index, masked, file, root, resolver, styleByBasename);
  }
  for (const record of staticResult.assetImports) {
    const resolved = record.resolvedFile;
    if (!resolved) continue;
    if (/\.(css|scss|sass|less)$/i.test(resolved)) {
      index.referencedStylesheets.add(path8.normalize(resolved));
    }
    if (!/\.module\.(css|scss|sass|less)$/i.test(record.specifier)) continue;
    const moduleFile = path8.normalize(resolved);
    index.moduleImports.set(moduleFile, [
      ...index.moduleImports.get(moduleFile) ?? [],
      record.relativeFile
    ]);
    const text = textByFile.get(record.file) ?? readTextSafe(record.file);
    resolverByFile.get(record.file) ?? lineResolver(text ?? "");
    if (text) {
      for (const binding of record.bindings) {
        scanCssModuleBinding(index, binding.local, moduleFile, text, record.file);
      }
    }
  }
  for (const file of files.scripts) {
    const extension = path8.extname(file).toLowerCase();
    if (![".vue", ".svelte", ".astro"].includes(extension)) continue;
    const raw = readTextSafe(file);
    if (!raw) continue;
    const extraction = extractSfc(file, raw);
    if (!extraction || extraction.styles.every((style) => !style.module)) continue;
    const text = textByFile.get(file) ?? maskStyleBlocks(raw);
    resolverByFile.get(file) ?? lineResolver(text);
    scanCssModuleBinding(index, "$style", path8.normalize(file), text);
    const useCssModule = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*useCssModule\s*\(/g;
    let match;
    while ((match = useCssModule.exec(text)) !== null) {
      if (match[1]) scanCssModuleBinding(index, match[1], path8.normalize(file), text);
    }
  }
  for (const pattern of config.css.safelistPatterns) {
    try {
      new RegExp(pattern);
    } catch {
      index.warnings.push(`Invalid CSS safelist regular expression: ${pattern}`);
    }
  }
  return index;
}
function usageKindForClass(index, token) {
  const hits = index.classes.get(token);
  if (!hits || hits.length === 0) return "none";
  return hits.some((hit) => hit.kind === "strong" || hit.kind === "query") ? "strong" : "weak";
}
function usageKindForId(index, token) {
  const hits = index.ids.get(token);
  if (!hits || hits.length === 0) return "none";
  return hits.some((hit) => hit.kind === "strong" || hit.kind === "query") ? "strong" : "weak";
}
var CSS_IN_JS_TAG = /(?:^|[.(])(?:styled|css|createGlobalStyle|injectGlobal|keyframes|Global|sx)\b/;
function templateInfo(template, sourceFile) {
  const startOffset = template.getStart(sourceFile) + 1;
  const endOffset = Math.max(startOffset, template.getEnd() - 1);
  const source = sourceFile.text.slice(startOffset, endOffset);
  if (!ts7.isTemplateExpression(template)) {
    return { text: source, startOffset, endOffset, dynamic: false };
  }
  const replaced = source.replace(
    /\$\{[\s\S]*?\}/g,
    (match) => `0${" ".repeat(Math.max(0, match.length - 1))}`
  );
  return { text: replaced, startOffset, endOffset, dynamic: true };
}
function positionAt(sourceFile, offset) {
  const position = sourceFile.getLineAndCharacterOfPosition(Math.max(0, offset));
  return { line: position.line + 1, column: position.character + 1 };
}
function declarationsKey(declarations) {
  return declarations.map((declaration) => declaration.replace(/\s+/g, " ").trim()).filter(Boolean).sort().join("|");
}
function collectStyles(node, sourceFile, contentStart, selectors, declarations, insideGlobalRule) {
  if (node.type === "decl") {
    const decl = node;
    const offset = contentStart + (decl.source?.start?.offset ?? 0);
    const position = positionAt(sourceFile, offset);
    declarations.push({
      prop: decl.prop,
      value: decl.value,
      line: position.line,
      column: position.column
    });
    return;
  }
  if (node.type === "rule") {
    const rule = node;
    const ruleDeclarations = [];
    for (const child of rule.nodes ?? []) {
      if (child.type === "decl") {
        const decl = child;
        ruleDeclarations.push(`${decl.prop}: ${decl.value}${decl.important ? " !important" : ""}`);
      }
    }
    const offset = contentStart + (rule.source?.start?.offset ?? 0);
    const position = positionAt(sourceFile, offset);
    selectors.push({
      selector: rule.selector.trim(),
      line: position.line,
      column: position.column,
      declarations: ruleDeclarations,
      declarationKey: declarationsKey(ruleDeclarations)
    });
    for (const child of rule.nodes ?? []) {
      collectStyles(child, sourceFile, contentStart, selectors, declarations);
    }
    return;
  }
  if (node.type === "atrule") {
    for (const child of node.nodes ?? []) {
      collectStyles(child, sourceFile, contentStart, selectors, declarations);
    }
  }
}
function extractFromSource(file, root, code, sourceKind, warnings) {
  const sourceFile = ts7.createSourceFile(`${file}.cum-css-in-js.ts`, code, ts7.ScriptTarget.Latest, true, sourceKind);
  const blocks = [];
  const visit = (node) => {
    if (ts7.isTaggedTemplateExpression(node)) {
      const tag = node.tag.getText(sourceFile);
      if (CSS_IN_JS_TAG.test(`(${tag}`)) {
        const info = templateInfo(node.template, sourceFile);
        const kind = /styled|sx/.test(tag) ? "component" : "global";
        const textForParse = info.text.trim();
        if (textForParse) {
          try {
            const parsed = postcss.parse(info.text, { from: file });
            const selectors = [];
            const declarations = [];
            for (const child of parsed.nodes) {
              collectStyles(child, sourceFile, info.startOffset, selectors, declarations, false);
            }
            const start = positionAt(sourceFile, info.startOffset);
            const end = positionAt(sourceFile, info.endOffset);
            const directKeys = declarations.map((declaration) => `${declaration.prop}: ${declaration.value}`);
            blocks.push({
              file,
              relativeFile: toPosix(path8.relative(root, file)),
              tag,
              kind,
              startLine: start.line,
              endLine: end.line,
              cssText: info.text.slice(0, 4e3),
              dynamic: info.dynamic,
              declarations,
              selectors,
              declarationKey: declarationsKey(directKeys)
            });
          } catch (error) {
            warnings.push(
              `Could not parse CSS-in-JS template in ${toPosix(path8.relative(root, file))}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }
    }
    ts7.forEachChild(node, visit);
  };
  visit(sourceFile);
  return blocks;
}
function extractCssInJs(root, scriptFiles, warnings, signal) {
  const blocks = [];
  for (const file of scriptFiles) {
    if (signal?.aborted) break;
    let raw;
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const extension = path8.extname(file).toLowerCase();
    const sourceKind = extension === ".tsx" || extension === ".jsx" ? ts7.ScriptKind.TSX : extension === ".js" || extension === ".jsx" ? ts7.ScriptKind.JS : ts7.ScriptKind.TS;
    if ([".vue", ".svelte", ".astro"].includes(extension)) {
      const extraction = extractSfc(file, raw);
      if (extraction?.virtualContent) {
        blocks.push(
          ...extractFromSource(
            file,
            root,
            extraction.virtualContent,
            extraction.scriptKind === "tsx" ? ts7.ScriptKind.TSX : extraction.scriptKind === "jsx" ? ts7.ScriptKind.JSX : extraction.scriptKind === "js" ? ts7.ScriptKind.JS : ts7.ScriptKind.TS,
            warnings
          )
        );
      }
    } else {
      blocks.push(...extractFromSource(file, root, raw, sourceKind, warnings));
    }
  }
  return blocks;
}
function declarationKeyFromRuleText(ruleText) {
  const start = ruleText.indexOf("{");
  const end = ruleText.lastIndexOf("}");
  if (start < 0 || end <= start) return "";
  const body = ruleText.slice(start + 1, end);
  try {
    const parsed = postcss.parse(`.__cum {${body}}`);
    const declarations = [];
    const visit = (nodes) => {
      for (const node of nodes ?? []) {
        if (node.type === "decl") {
          declarations.push(`${node.prop}: ${node.value}${node.important ? " !important" : ""}`);
        } else if ("nodes" in node) {
          visit(node.nodes);
        }
      }
    };
    visit(parsed.nodes);
    return declarationsKey(declarations);
  } catch {
    return "";
  }
}

// src/css/analyze.ts
var GLOBAL_SKIP_TAGS = /* @__PURE__ */ new Set(["html", "body", "head", "html:root", "*"]);
var STATE_PSEUDO = /:(?:hover|focus|focus-within|focus-visible|active|visited|target|checked|disabled|enabled|invalid|valid|placeholder-shown|autofill|open|popover-open|user-invalid|user-valid|has|defined|default|optional|required|read-only|read-write|indeterminate|fullscreen|modal|picture-in-picture|playing|paused|muted|volume-locked|seeking|buffering|stalled)\b|::[A-Za-z-]+/;
function readTextSafe2(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return void 0;
  }
}
function offsetToPosition(text, offset) {
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lineStart = 0;
  for (let index = 0; index < safeOffset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
      lineStart = index + 1;
    }
  }
  return { line, column: safeOffset - lineStart + 1 };
}
function positionFromLineColumn(text, line, column) {
  const lines = text.split(/\r\n|\r|\n/);
  let offset = 0;
  for (let index = 0; index < Math.max(0, line - 1) && index < lines.length; index += 1) {
    offset += (lines[index]?.length ?? 0) + 1;
  }
  return offset + Math.max(0, column - 1);
}
function nodeOffset(node, content) {
  const start = node.source?.start;
  if (start?.offset !== void 0) return start.offset;
  if (start?.line !== void 0 && start.column !== void 0) {
    return positionFromLineColumn(content, start.line, start.column);
  }
  return 0;
}
function sourcePosition(source, contentOffset) {
  if (source.sassMap) {
    const generated = offsetToPosition(source.content, contentOffset);
    const mapped = originalPositionFor(source.sassMap, {
      line: Math.max(1, generated.line),
      column: Math.max(0, generated.column - 1)
    });
    if (mapped.line !== null) {
      return {
        line: mapped.line + source.sassLineOffset,
        column: (mapped.column ?? 0) + 1
      };
    }
  }
  return offsetToPosition(source.originalContent, source.blockStartOffset + contentOffset);
}
function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}
function splitSelectors(raw) {
  try {
    const root = selectorParser().astSync(raw);
    return (root.nodes ?? []).map((node, index) => ({
      text: node.toString().trim(),
      sourceIndex: node.sourceIndex ?? index
    }));
  } catch {
    return postcss.list.comma(raw).filter(Boolean).map((text, index) => ({ text: text.trim(), sourceIndex: index }));
  }
}
function combineSelectors(parents, child) {
  if (parents.length === 0) return [child];
  return parents.map((parent) => {
    if (child.includes("&")) return child.replaceAll("&", parent);
    return `${parent} ${child}`;
  });
}
function selectorAst(selector) {
  try {
    return selectorParser().astSync(selector);
  } catch {
    return void 0;
  }
}
function collectTokens(node, module, insideGlobal, contribute, tokens, seen) {
  const key = node.type === "class" || node.type === "id" || node.type === "tag" ? `${node.type}:${node.value ?? ""}:${insideGlobal ? "g" : "l"}:${contribute ? "s" : "n"}` : "";
  if (key && seen.has(key) && node.type === "class") ; else if (key) {
    seen.add(key);
  }
  if (node.type === "class" && node.value) {
    if (module && !insideGlobal) tokens.localClasses.push(node.value);
    else tokens.globalClasses.push(node.value);
    if (contribute) tokens.specificity.classes += 1;
  } else if (node.type === "id" && node.value) {
    tokens.ids.push(node.value);
    if (contribute) tokens.specificity.ids += 1;
  } else if (node.type === "tag" && node.value) {
    tokens.tags.push(node.value.toLowerCase());
    if (contribute) tokens.specificity.elements += 1;
  } else if (node.type === "attribute") {
    const name = node.attribute ?? "";
    const value = typeof node.value === "string" ? node.value : node.value !== void 0 ? String(node.value) : void 0;
    if (name) tokens.attributes.push({ name, ...value ? { value } : {} });
    if (contribute) tokens.specificity.classes += 1;
  } else if (node.type === "pseudo") {
    const pseudo = node.value ?? "";
    if (pseudo.startsWith("::")) {
      if (contribute) tokens.specificity.elements += 1;
    } else {
      if (contribute && pseudo !== ":where") tokens.specificity.classes += 1;
      if (STATE_PSEUDO.test(pseudo)) tokens.statePseudo = true;
    }
    if (pseudo === ":global") {
      for (const child of node.nodes ?? []) collectTokens(child, module, true, contribute, tokens, seen);
      return;
    }
    if (pseudo === ":local") {
      for (const child of node.nodes ?? []) collectTokens(child, module, false, contribute, tokens, seen);
      return;
    }
    const nextContribute = contribute && pseudo !== ":where";
    for (const child of node.nodes ?? []) {
      collectTokens(child, module, insideGlobal, nextContribute, tokens, seen);
    }
  } else if (node.type === "nesting") ;
  if (node.type !== "pseudo") {
    for (const child of node.nodes ?? []) {
      collectTokens(child, module, insideGlobal, contribute, tokens, seen);
    }
  }
}
function tokenizeSelector(selector, module) {
  const tokens = {
    localClasses: [],
    globalClasses: [],
    ids: [],
    tags: [],
    attributes: [],
    statePseudo: STATE_PSEUDO.test(selector),
    specificity: { ids: 0, classes: 0, elements: 0, score: 0 },
    dynamic: /#\{|@\{/.test(selector)
  };
  const ast = selectorAst(selector);
  if (ast) {
    for (const node of ast.nodes ?? []) {
      collectTokens(node, module, false, true, tokens, /* @__PURE__ */ new Set());
    }
  } else {
    tokens.dynamic = true;
    for (const match of selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
      if (module) tokens.localClasses.push(match[1] ?? "");
      else tokens.globalClasses.push(match[1] ?? "");
      tokens.specificity.classes += 1;
    }
    for (const match of selector.matchAll(/#([A-Za-z_][\w-]*)/g)) {
      tokens.ids.push(match[1] ?? "");
      tokens.specificity.ids += 1;
    }
    for (const match of selector.matchAll(/(?:^|[\s>+~,])([a-z][\w-]*)/g)) {
      tokens.tags.push((match[1] ?? "").toLowerCase());
      tokens.specificity.elements += 1;
    }
  }
  tokens.localClasses = [...new Set(tokens.localClasses.filter(Boolean))];
  tokens.globalClasses = [...new Set(tokens.globalClasses.filter(Boolean))];
  tokens.ids = [...new Set(tokens.ids.filter(Boolean))];
  tokens.tags = [...new Set(tokens.tags.filter(Boolean))];
  tokens.specificity.score = tokens.specificity.ids * 100 + tokens.specificity.classes * 10 + tokens.specificity.elements;
  return tokens;
}
function selectorKind(tokens) {
  const classCount = tokens.localClasses.length + tokens.globalClasses.length;
  if (tokens.ids.length > 0 && classCount === 0 && tokens.attributes.length === 0) return "id";
  if (tokens.attributes.length > 0 && classCount === 0 && tokens.ids.length === 0) return "attribute";
  if (classCount > 0 && tokens.ids.length === 0 && tokens.attributes.length === 0 && tokens.tags.length === 0) return "class";
  if (classCount === 0 && tokens.ids.length === 0 && tokens.attributes.length === 0 && tokens.tags.length > 0) return "tag";
  if (tokens.statePseudo) return "pseudo";
  return "complex";
}
function normalizeSelector(selector) {
  return selector.replace(/\s+/g, " ").replace(/\s*([>+~,])\s*/g, "$1").trim();
}
function declarationTexts(rule) {
  const texts = [];
  for (const node of rule.nodes ?? []) {
    if (node.type === "decl") texts.push(`${node.prop}: ${node.value}${node.important ? " !important" : ""}`);
  }
  return texts;
}
function declarationKeys(rule) {
  const keys = [];
  for (const node of rule.nodes ?? []) {
    if (node.type === "decl") {
      keys.push(`${node.prop.trim()}:${node.value.trim()}${node.important ? "!important" : ""}`);
    }
  }
  return keys;
}
function declarationInfos(rule, source) {
  const infos = [];
  for (const node of rule.nodes ?? []) {
    if (node.type !== "decl") continue;
    const offset = nodeOffset(node, source.content);
    const position = sourcePosition(source, offset);
    infos.push({
      prop: node.prop.trim(),
      value: node.value.trim(),
      important: Boolean(node.important),
      text: node.toString(),
      line: position.line,
      column: position.column,
      offset,
      bytes: byteLength(node.toString())
    });
  }
  return infos;
}
function ruleSourceBytes(rule, source) {
  const offset = nodeOffset(rule, source.content);
  const endOffset = rule.source?.end?.offset ?? offset + rule.toString().length;
  return {
    bytes: Math.max(0, endOffset - offset),
    offset,
    endOffset
  };
}
async function compileSass(content, file, warnings) {
  try {
    const sassModule = await import('sass');
    const result = sassModule.compileString(content, {
      syntax: "indented",
      style: "expanded",
      sourceMap: true,
      url: pathToFileURL(file),
      loadPaths: [path8.dirname(file)]
    });
    let map;
    if (result.sourceMap) {
      try {
        map = new AnyMap(result.sourceMap);
      } catch {
        map = void 0;
      }
    }
    return { css: result.css, ...map ? { map } : {} };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(`Sass compilation failed for ${file}: ${message}`);
    return void 0;
  }
}
async function prepareStyleSources(root, files, warnings) {
  const sources = [];
  for (const file of files.styles) {
    const content = readTextSafe2(file);
    if (content === void 0) {
      warnings.push(`Could not read stylesheet ${toPosix(path8.relative(root, file))}.`);
      continue;
    }
    const extension = path8.extname(file).toLowerCase();
    if (extension === ".sass") {
      const compiled = await compileSass(content, file, warnings);
      if (!compiled) continue;
      sources.push({
        file,
        relativeFile: toPosix(path8.relative(root, file)),
        language: "sass",
        content: compiled.css,
        originalContent: content,
        blockStartOffset: 0,
        blockStartLine: 1,
        module: /\.module\.sass$/i.test(file),
        scoped: false,
        kind: "file",
        sassLineOffset: 0,
        ...compiled.map ? { sassMap: compiled.map } : {}
      });
      continue;
    }
    const language = extension === ".scss" ? "scss" : extension === ".less" ? "less" : "css";
    sources.push({
      file,
      relativeFile: toPosix(path8.relative(root, file)),
      language,
      content,
      originalContent: content,
      blockStartOffset: 0,
      blockStartLine: 1,
      module: /\.module\.(css|scss|less)$/i.test(file),
      scoped: false,
      kind: "file",
      sassLineOffset: 0
    });
  }
  for (const file of files.scripts) {
    const extension = path8.extname(file).toLowerCase();
    if (![".vue", ".svelte", ".astro"].includes(extension)) continue;
    const content = readTextSafe2(file);
    if (!content) continue;
    const extraction = extractSfc(file, content);
    if (!extraction) continue;
    for (const style of extraction.styles) {
      if (style.language === "sass") {
        const compiled = await compileSass(style.content, file, warnings);
        if (!compiled) continue;
        sources.push({
          file,
          relativeFile: toPosix(path8.relative(root, file)),
          language: "sass",
          content: compiled.css,
          originalContent: content,
          blockStartOffset: style.startOffset,
          blockStartLine: style.startLine,
          module: style.module,
          scoped: style.scoped,
          kind: "sfc",
          sassLineOffset: style.startLine - 1,
          ...compiled.map ? { sassMap: compiled.map } : {}
        });
      } else {
        sources.push({
          file,
          relativeFile: toPosix(path8.relative(root, file)),
          language: style.language,
          content: style.content,
          originalContent: content,
          blockStartOffset: style.startOffset,
          blockStartLine: style.startLine,
          module: style.module,
          scoped: style.scoped,
          kind: "sfc",
          sassLineOffset: 0
        });
      }
    }
  }
  for (const file of files.html) {
    const content = readTextSafe2(file);
    if (!content) continue;
    const regex = /<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const attrs = match[1] ?? "";
      const body = match[2] ?? "";
      if (body.trim() === "") continue;
      const bodyStart = (match.index ?? 0) + match[0].indexOf(">") + 1;
      const line = offsetToPosition(content, bodyStart).line;
      sources.push({
        file,
        relativeFile: toPosix(path8.relative(root, file)),
        language: /\blang\s*=\s*["'](scss|sass|less)["']/i.exec(attrs)?.[1]?.toLowerCase() === "scss" ? "scss" : /\blang\s*=\s*["']less["']/i.test(attrs) ? "less" : "css",
        content: body,
        originalContent: content,
        blockStartOffset: bodyStart,
        blockStartLine: line,
        module: false,
        scoped: false,
        kind: "html",
        sassLineOffset: 0
      });
    }
  }
  return sources;
}
function resolveStyleFile(root, specifier, containingFile, knownFiles) {
  const clean = specifier.replace(/\[.*$/, "").replace(/[?#].*$/, "").trim();
  if (!clean || /^(?:https?:|sass:|url\()/i.test(clean)) return void 0;
  const base = clean.startsWith("/") ? path8.resolve(root, `.${clean}`) : path8.resolve(path8.dirname(containingFile), clean);
  const candidates = /* @__PURE__ */ new Set([base]);
  const withoutExtension = base.replace(/\.(css|scss|sass|less)$/i, "");
  for (const extension of [".css", ".scss", ".sass", ".less"]) {
    candidates.add(`${base}${extension}`);
    candidates.add(`${withoutExtension}${extension}`);
    candidates.add(path8.join(path8.dirname(base), `_${path8.basename(withoutExtension)}${extension}`));
    candidates.add(path8.join(base, `index${extension}`));
    candidates.add(path8.join(base, `_index${extension}`));
  }
  for (const candidate of candidates) {
    if (existsSync(candidate) && knownFiles.has(path8.normalize(candidate))) return path8.normalize(candidate);
    if (existsSync(candidate) && /\.(css|scss|sass|less)$/i.test(candidate)) {
      try {
        if (statSync(candidate).isFile()) return path8.normalize(candidate);
      } catch {
      }
    }
  }
  return void 0;
}
function isSafelisted(config, selector, tokens) {
  const trimmed = selector.trim();
  const allTokens = [...tokens.localClasses, ...tokens.globalClasses, ...tokens.ids];
  for (const entry2 of config.css.safelist) {
    if (entry2 === trimmed) return true;
    const bare = entry2.replace(/^[.#]/, "");
    if (allTokens.includes(entry2) || allTokens.includes(bare)) return true;
    if (trimmed === `.${entry2}` || trimmed === `#${entry2}`) return true;
  }
  for (const pattern of config.css.safelistPatterns) {
    try {
      if (new RegExp(pattern).test(trimmed) || allTokens.some((token) => new RegExp(pattern).test(token))) return true;
    } catch {
    }
  }
  return false;
}
function evaluateSelector(parsed, index) {
  const missing = [];
  let usedKind = "none";
  const noteUsage = (kind) => {
    if (kind === "strong") usedKind = "strong";
    else if (kind === "weak" && usedKind === "none") usedKind = "weak";
  };
  if (parsed.module && parsed.tokens.localClasses.length > 0) {
    const moduleSet = index.moduleUsage.get(parsed.file) ?? /* @__PURE__ */ new Set();
    for (const token of parsed.tokens.localClasses) {
      if (moduleSet.has(token)) noteUsage("strong");
      else missing.push(`.${token}`);
    }
  }
  for (const token of parsed.tokens.globalClasses) {
    const kind = usageKindForClass(index, token);
    if (kind === "none") missing.push(`.${token}`);
    else noteUsage(kind);
  }
  for (const token of parsed.tokens.ids) {
    const kind = usageKindForId(index, token);
    if (kind === "none") missing.push(`#${token}`);
    else noteUsage(kind);
  }
  for (const attribute of parsed.tokens.attributes) {
    const hits = index.attributes.get(attribute.name.toLowerCase());
    if (!hits || hits.length === 0) {
      missing.push(`[${attribute.name}]`);
    } else {
      noteUsage("strong");
    }
  }
  if (parsed.tokens.localClasses.length === 0 && parsed.tokens.globalClasses.length === 0 && parsed.tokens.ids.length === 0 && parsed.tokens.attributes.length === 0 && parsed.tokens.tags.length > 0) {
    const hasTag = parsed.tokens.tags.some((tag) => !GLOBAL_SKIP_TAGS.has(tag) && index.tags.has(tag));
    if (hasTag) noteUsage("strong");
    else {
      for (const tag of parsed.tokens.tags) {
        if (!GLOBAL_SKIP_TAGS.has(tag)) missing.push(tag);
      }
    }
  }
  const dynamicRisk = Boolean(index.dynamicClasses) || index.cssInJs || parsed.dynamicRisk || parsed.tokens.dynamic;
  return {
    used: missing.length === 0,
    usedKind,
    missing,
    dynamicRisk
  };
}
async function analyzeCss(options) {
  const { root, config, files, staticResult, signal } = options;
  const warnings = [];
  const usage = buildCssUsageIndex(root, config, files, staticResult);
  warnings.push(...usage.warnings);
  const cssInJsBlocks = extractCssInJs(root, files.scripts, warnings, signal);
  if (usage.cssInJs) {
    warnings.push(
      cssInJsBlocks.length > 0 ? "CSS-in-JS tagged templates were extracted with source mapping; object-style CSS-in-JS is observed at runtime only." : "CSS-in-JS patterns were detected. Object-style/runtime styles are observed through the browser collector."
    );
  }
  const sources = await prepareStyleSources(root, files, warnings);
  const knownStyleFiles = new Set(
    sources.filter((source) => source.kind === "file").map((source) => path8.normalize(source.file))
  );
  const realSources = /* @__PURE__ */ new Map();
  for (const source of sources) {
    if (source.kind === "file") realSources.set(path8.normalize(source.file), source);
  }
  const selectors = [];
  const rules = [];
  const stylesheetImports = /* @__PURE__ */ new Map();
  const referencedBy = /* @__PURE__ */ new Map();
  const importsForSfcOrHtml = [];
  const customPropertyDecls = [];
  const keyframeDefs = [];
  const composedClasses = /* @__PURE__ */ new Map();
  const allRuleCounts = /* @__PURE__ */ new Map();
  const allSelectorCounts = /* @__PURE__ */ new Map();
  let ruleId = 0;
  const addReference = (fromFile, toFile) => {
    usage.referencedStylesheets.add(path8.normalize(toFile));
    const relative = toPosix(path8.relative(root, fromFile));
    const list = referencedBy.get(path8.normalize(toFile)) ?? [];
    if (!list.includes(relative)) list.push(relative);
    referencedBy.set(path8.normalize(toFile), list);
  };
  for (const source of sources) {
    if (signal?.aborted) throw new Error("CSS analysis aborted");
    let parsed;
    try {
      if (source.language === "scss") parsed = scss.parse(source.content, { from: source.file });
      else if (source.language === "less") parsed = less.parse(source.content, { from: source.file });
      else parsed = postcss.parse(source.content, { from: source.file });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`CSS parse failed for ${source.relativeFile}: ${message}`);
      continue;
    }
    const walk = (node, parentSelectors, atRules, inKeyframes) => {
      if (signal?.aborted) return;
      if (node.type === "atrule") {
        const atRule = node;
        const name = atRule.name.toLowerCase();
        if (name === "import" || name === "use" || name === "forward") {
          const quoted = /(['"])(.*?)\1/.exec(atRule.params);
          const urlCall = /url\(\s*(['"]?)(.*?)\1\s*\)/.exec(atRule.params);
          const specifier = quoted?.[2] ?? urlCall?.[2];
          if (specifier) {
            const resolved = resolveStyleFile(root, specifier, source.file, knownStyleFiles);
            if (resolved) {
              addReference(source.file, resolved);
              const imports = stylesheetImports.get(path8.normalize(source.file)) ?? [];
              if (!imports.includes(resolved)) imports.push(resolved);
              stylesheetImports.set(path8.normalize(source.file), imports);
              if (source.kind !== "file") importsForSfcOrHtml.push(resolved);
            }
          }
          return;
        }
        if (name === "keyframes" || name === "-webkit-keyframes" || name === "-moz-keyframes" || name === "-o-keyframes") {
          {
            const keyframeName = atRule.params.trim().replace(/^['"]|['"]$/g, "");
            if (keyframeName) keyframeDefs.push({ name: keyframeName, atRule, source, params: atRule.params });
          }
          return;
        }
        if (["font-face", "page", "property", "counter-style", "font-feature-values", "viewport"].includes(name)) {
          return;
        }
        if (atRule.nodes) {
          const nextContext = name === "media" || name === "supports" || name === "container" || name === "layer" || name === "scope" || name === "document" ? [...atRules, `@${name}${atRule.params ? ` ${atRule.params}` : ""}`] : atRules;
          for (const child of atRule.nodes) walk(child, parentSelectors, nextContext);
        }
        return;
      }
      if (node.type !== "rule") return;
      const rule = node;
      const rawSelector = rule.selector.trim();
      if (!rawSelector || rawSelector.startsWith(":export") || rawSelector.startsWith(":import")) {
        return;
      }
      const ruleOffset = nodeOffset(rule, source.content);
      const bytesInfo = ruleSourceBytes(rule, source);
      const rawParts = splitSelectors(rawSelector);
      const infos = declarationInfos(rule, source);
      const ruleRecord = {
        id: ruleId,
        source,
        file: source.file,
        relativeFile: source.relativeFile,
        line: sourcePosition(source, ruleOffset).line,
        column: sourcePosition(source, ruleOffset).column,
        selectorText: rawSelector,
        atRules,
        declarations: declarationTexts(rule),
        declarationKeys: declarationKeys(rule),
        declarationInfos: infos,
        bytes: bytesInfo.bytes,
        ruleText: truncate(rule.toString(), 2e3),
        offset: ruleOffset,
        selectorCount: rawParts.length
      };
      rules.push(ruleRecord);
      ruleId += 1;
      allRuleCounts.set(source.file, (allRuleCounts.get(source.file) ?? 0) + 1);
      for (const declaration of rule.nodes ?? []) {
        if (declaration.type !== "decl") continue;
        const decl = declaration;
        const prop = decl.prop.trim();
        if (prop.startsWith("--")) {
          const declOffset = nodeOffset(decl, source.content);
          const position = sourcePosition(source, declOffset);
          customPropertyDecls.push({
            name: prop,
            decl,
            source,
            line: position.line,
            column: position.column,
            valueBytes: byteLength(decl.toString())
          });
        }
        if (prop.toLowerCase() === "composes") {
          const componentNames = decl.value.split(/\s+/).filter((part) => part && !part.startsWith("from"));
          const set = composedClasses.get(source.file) ?? /* @__PURE__ */ new Set();
          for (const name of componentNames) {
            if (/^[A-Za-z_][\w-]*$/.test(name)) set.add(name);
          }
          composedClasses.set(source.file, set);
        }
      }
      const combinedSelectors = [];
      for (const part of rawParts) {
        for (const combined of combineSelectors(parentSelectors, part.text)) {
          combinedSelectors.push({ text: combined, sourceIndex: part.sourceIndex });
          const tokens = tokenizeSelector(combined, source.module);
          const selectorOffset = ruleOffset + part.sourceIndex;
          const position = sourcePosition(source, selectorOffset);
          const module = source.module;
          const normalized = normalizeSelector(combined);
          const parsed2 = {
            source,
            file: source.file,
            relativeFile: source.relativeFile,
            selector: combined.trim(),
            normalizedSelector: normalized,
            line: position.line,
            column: position.column,
            selectorBytes: byteLength(combined),
            selectorCount: ruleRecord.selectorCount,
            ruleBytes: ruleRecord.bytes,
            ruleText: ruleRecord.ruleText,
            declarations: ruleRecord.declarations,
            atRules,
            ...atRules.find((context) => context.startsWith("@media")) ? { media: atRules.find((context) => context.startsWith("@media")) } : {},
            tokens,
            module,
            ruleId: ruleRecord.id,
            used: false,
            usedKind: "none",
            safelisted: isSafelisted(config, combined, tokens),
            missingTokens: [],
            dynamicRisk: /#\{|@\{/.test(combined),
            details: {
              selector: combined.trim(),
              selectorKind: selectorKind(tokens),
              declarations: ruleRecord.declarations.slice(0, 30),
              ruleText: ruleRecord.ruleText,
              stylesheet: source.relativeFile,
              matchedElements: 0,
              matchedRoutes: [],
              specificity: tokens.specificity,
              ...atRules.find((context) => context.startsWith("@media")) ? { media: atRules.find((context) => context.startsWith("@media")) } : {},
              atRules,
              safelisted: false
            }
          };
          selectors.push(parsed2);
          allSelectorCounts.set(source.file, (allSelectorCounts.get(source.file) ?? 0) + 1);
        }
      }
      const nextParents = combinedSelectors.map((item) => item.text);
      for (const child of rule.nodes ?? []) {
        walk(child, nextParents, atRules);
      }
    };
    for (const node of parsed.nodes) {
      walk(node, [], []);
    }
  }
  for (const [file, names] of composedClasses) {
    const moduleUsage = usage.moduleUsage.get(file);
    if (moduleUsage && moduleUsage.size > 0) {
      for (const name of names) moduleUsage.add(name);
    }
  }
  const roots = /* @__PURE__ */ new Set();
  for (const file of usage.referencedStylesheets) {
    if (realSources.has(path8.normalize(file))) roots.add(path8.normalize(file));
  }
  for (const file of importsForSfcOrHtml) {
    if (realSources.has(path8.normalize(file))) roots.add(path8.normalize(file));
  }
  const reachableStyles = /* @__PURE__ */ new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachableStyles.has(current)) continue;
    reachableStyles.add(current);
    for (const next of stylesheetImports.get(current) ?? []) {
      if (!reachableStyles.has(next)) queue.push(next);
    }
  }
  const unusedStylesheetFiles = [...realSources.keys()].filter((file) => !reachableStyles.has(file));
  for (const parsed of selectors) {
    const evaluation = evaluateSelector(parsed, usage);
    parsed.used = evaluation.used || parsed.safelisted;
    parsed.usedKind = evaluation.usedKind;
    parsed.missingTokens = evaluation.missing;
    parsed.dynamicRisk = evaluation.dynamicRisk;
    parsed.details.safelisted = parsed.safelisted;
  }
  const findings = [];
  const unusedStylesheetSet = new Set(unusedStylesheetFiles);
  const stylesheets = [...realSources.values()].map((source) => {
    let bytes = 0;
    try {
      bytes = statSync(source.file).size;
    } catch {
      bytes = byteLength(source.originalContent);
    }
    const imports = stylesheetImports.get(path8.normalize(source.file)) ?? [];
    return {
      file: source.file,
      relativeFile: source.relativeFile,
      language: source.language,
      module: source.module,
      scoped: source.scoped,
      bytes,
      rules: allRuleCounts.get(source.file) ?? 0,
      selectors: allSelectorCounts.get(source.file) ?? 0,
      referenced: reachableStyles.has(path8.normalize(source.file)),
      referencedBy: referencedBy.get(path8.normalize(source.file)) ?? [],
      imports,
      unused: unusedStylesheetSet.has(path8.normalize(source.file))
    };
  });
  for (const stylesheet of stylesheets) {
    if (!stylesheet.unused) continue;
    findings.push(
      createFinding({
        root,
        category: "unused-stylesheet",
        status: "potentially-unused",
        confidence: "medium",
        title: `Unreferenced stylesheet ${stylesheet.relativeFile}`,
        description: "No JavaScript import, CSS @import/@use, HTML stylesheet link, or reachable CSS dependency references this file. Build-tool auto-imports and runtime URL construction may still load it.",
        file: stylesheet.file,
        line: 1,
        column: 1,
        symbol: stylesheet.relativeFile,
        symbolKind: "css-rule",
        css: {
          selector: stylesheet.relativeFile,
          selectorKind: "stylesheet",
          stylesheet: stylesheet.relativeFile,
          declarations: [],
          matchedRoutes: [],
          staticReferences: [],
          dynamicRisk: usage.dynamicClasses
        },
        size: {
          sourceBytes: stylesheet.bytes,
          estimatedRemovableBytes: 0,
          basis: "Whole stylesheet removal is not claimed until dynamic references are verified."
        },
        evidence: [
          {
            kind: "no-static-reference",
            description: "No stylesheet import, @use/@forward chain, or HTML link reaches this file.",
            file: stylesheet.relativeFile,
            line: 1
          }
        ],
        tags: ["css", "stylesheet"],
        fingerprintSuffix: stylesheet.relativeFile
      })
    );
  }
  for (const parsed of selectors) {
    if (unusedStylesheetSet.has(path8.normalize(parsed.file))) continue;
    if (parsed.used) continue;
    const hasMeaningfulTarget = parsed.tokens.localClasses.length > 0 || parsed.tokens.globalClasses.length > 0 || parsed.tokens.ids.length > 0 || parsed.tokens.attributes.length > 0 || parsed.tokens.tags.some((tag) => !GLOBAL_SKIP_TAGS.has(tag));
    if (!hasMeaningfulTarget) continue;
    if (parsed.used) continue;
    const risks = [];
    let confidence = "high";
    if (parsed.tokens.statePseudo) {
      risks.push("Selector depends on an interaction/state pseudo-class or pseudo-element.");
      confidence = "medium";
    }
    if (parsed.media) {
      risks.push(`Responsive rule is inside ${parsed.media}; it may be inactive in all observed viewports.`);
      confidence = "medium";
    }
    if (parsed.dynamicRisk) {
      risks.push("Dynamic class construction or runtime-generated selectors were detected.");
      confidence = "medium";
    }
    if (parsed.module) {
      risks.push("CSS Modules scoping requires binding usage evidence; external consumers may import this module.");
      confidence = "medium";
    }
    if (parsed.tokens.localClasses.length === 0 && parsed.tokens.globalClasses.length === 0 && parsed.tokens.ids.length === 0 && parsed.tokens.attributes.length === 0) {
      risks.push("Tag-only selectors are broad and can be produced by runtime markup.");
      confidence = "low";
    }
    if (parsed.tokens.dynamic) {
      risks.push("The selector contains build-time interpolation.");
    }
    const declarationDetails = parsed.declarations.slice(0, 30);
    const finding = createFinding({
      root,
      category: "unused-css-selector",
      status: "potentially-unused",
      confidence,
      title: `Potentially unused selector "${truncate(parsed.selector, 120)}"`,
      description: `No static class, id, attribute, tag or CSS Module binding reference was found for this selector.${risks.length > 0 ? ` ${risks.join(" ")}` : ""} CSS is never marked confirmed unused without manual/runtime verification.`,
      file: parsed.file,
      line: parsed.line,
      column: parsed.column,
      endLine: parsed.line,
      symbol: parsed.selector,
      symbolKind: "css-selector",
      parent: parsed.source.module ? "CSS Module" : void 0,
      css: {
        ...parsed.details,
        declarations: declarationDetails,
        matchedElements: 0,
        matchedRoutes: [],
        staticReferences: [],
        dynamicRisk: parsed.dynamicRisk,
        safelisted: false,
        specificity: parsed.tokens.specificity
      },
      size: {
        sourceBytes: parsed.selectorBytes,
        estimatedRemovableBytes: parsed.selectorCount === 1 ? parsed.ruleBytes : parsed.selectorBytes,
        basis: parsed.selectorCount === 1 ? "Selector is the only selector in its rule; the rule could be removed after review." : "Only this selector list item is estimated; declarations may be shared with other selectors."
      },
      evidence: [
        {
          kind: "no-static-reference",
          description: `No static reference found for: ${parsed.missingTokens.join(", ") || "the selector target"}.`,
          file: parsed.relativeFile,
          line: parsed.line
        },
        ...risks.map((description) => ({
          kind: description.includes("Dynamic") ? "dynamic-access" : description.includes("Responsive") ? "configuration" : "parser",
          description,
          file: parsed.relativeFile,
          line: parsed.line
        }))
      ],
      tags: [
        "css",
        `selector-${parsed.details.selectorKind}`,
        ...parsed.tokens.statePseudo ? ["state-selector"] : [],
        ...parsed.media ? ["media-query"] : [],
        ...parsed.module ? ["css-module"] : [],
        ...parsed.dynamicRisk ? ["dynamic-risk"] : []
      ],
      fingerprintSuffix: `${parsed.atRules.join(">")}|${parsed.normalizedSelector}`
    });
    parsed.finding = finding;
    findings.push(finding);
  }
  const duplicateRuleKeys = /* @__PURE__ */ new Map();
  const selectorGroups = /* @__PURE__ */ new Map();
  const duplicateFindings = [];
  for (const rule of rules) {
    if (unusedStylesheetSet.has(path8.normalize(rule.file))) continue;
    const atContext = rule.atRules.join(">");
    const declarationKey = [...rule.declarationKeys].sort().join("|");
    const normalizedSelector = normalizeSelector(rule.selectorText);
    const ruleKey = `${rule.file}|${atContext}|${normalizedSelector}|${declarationKey}`;
    const first = duplicateRuleKeys.get(ruleKey);
    if (first) {
      duplicateFindings.push(
        createFinding({
          root,
          category: "duplicate-css-rule",
          status: "potentially-unused",
          confidence: "medium",
          title: `Duplicate CSS rule for "${truncate(rule.selectorText, 100)}"`,
          description: "An identical selector and declaration set appears earlier in the same file and at-rule context. Removing one copy usually does not change the cascade, but verify generated CSS and fallbacks.",
          file: rule.file,
          line: rule.line,
          column: rule.column,
          symbol: rule.selectorText,
          symbolKind: "css-rule",
          css: {
            selector: rule.selectorText,
            selectorKind: "complex",
            declarations: rule.declarations,
            ruleText: rule.ruleText,
            stylesheet: rule.relativeFile,
            atRules: rule.atRules,
            matchedRoutes: [],
            staticReferences: [],
            dynamicRisk: false
          },
          size: {
            sourceBytes: rule.bytes,
            estimatedRemovableBytes: rule.bytes,
            basis: "Duplicate rule source span; estimates overlap with other CSS findings."
          },
          evidence: [
            {
              kind: "parser",
              description: `Identical rule first appears at line ${first.line}.`,
              file: rule.relativeFile,
              line: first.line
            }
          ],
          tags: ["css", "duplicate"],
          fingerprintSuffix: `${atContext}|${normalizedSelector}|${hashString(declarationKey, 8)}`,
          idSuffix: `${rule.offset}`
        })
      );
    } else {
      duplicateRuleKeys.set(ruleKey, rule);
    }
    const selectorKey = `${rule.file}|${atContext}|${normalizedSelector}`;
    const group = selectorGroups.get(selectorKey) ?? [];
    group.push(rule);
    selectorGroups.set(selectorKey, group);
  }
  const duplicateRules = new Set(
    duplicateFindings.filter((finding) => finding.category === "duplicate-css-rule").map((finding) => `${finding.location.file}|${finding.location.line}`)
  );
  for (const [key, group] of selectorGroups) {
    if (group.length < 2) continue;
    if (new Set(group.map((rule) => [...rule.declarationKeys].sort().join("|"))).size < 2) continue;
    const second = group[1];
    if (!second) continue;
    if (duplicateRules.has(`${second.file}|${second.line}`)) continue;
    const atContext = key.split("|")[1] ?? "";
    duplicateFindings.push(
      createFinding({
        root,
        category: "duplicate-css-selector",
        status: "unknown",
        confidence: "high",
        title: `Duplicate selector declaration blocks for "${truncate(second.selectorText, 100)}"`,
        description: "The same selector appears more than once with different declarations in this file and at-rule context. This can be an intentional cascade override; merge only after review.",
        file: second.file,
        line: second.line,
        column: second.column,
        symbol: second.selectorText,
        symbolKind: "css-rule",
        css: {
          selector: second.selectorText,
          selectorKind: "complex",
          declarations: second.declarations,
          ruleText: second.ruleText,
          stylesheet: second.relativeFile,
          atRules: second.atRules,
          matchedRoutes: [],
          staticReferences: [],
          dynamicRisk: true
        },
        size: { sourceBytes: second.bytes, basis: "Advisory duplicate; no savings estimated." },
        evidence: [
          {
            kind: "parser",
            description: `Selector appears in ${group.length} rules (${atContext || "root"}).`,
            file: second.relativeFile,
            line: group[0]?.line
          }
        ],
        tags: ["css", "duplicate", "advisory"],
        fingerprintSuffix: `${atContext}|${normalizeSelector(second.selectorText)}`
      })
    );
  }
  const overriddenDeclarationKeys = /* @__PURE__ */ new Set();
  const overriddenDeclarationFinding = (rule, previous, laterRule, later, context) => {
    overriddenDeclarationKeys.add(`${rule.file}|${previous.offset}|${previous.prop}`);
    return createFinding({
      root,
      category: "unused-css-declaration",
      status: "potentially-unused",
      confidence: "low",
      title: `Potentially overridden CSS declaration "${previous.prop}"`,
      description: context === "same-rule" ? "A later declaration of the same property in this rule overrides this value. This may be an intentional progressive-enhancement/browser fallback, so removal requires review." : "A later rule with the same selector and at-rule context overrides this declaration. This may be an intentional fallback or cascade technique, so removal requires review.",
      file: rule.file,
      line: previous.line,
      column: previous.column,
      symbol: `${previous.prop}: ${previous.value}`,
      symbolKind: "css-property",
      css: {
        selector: rule.selectorText,
        selectorKind: "complex",
        declarations: rule.declarations,
        ruleText: rule.ruleText,
        stylesheet: rule.relativeFile,
        atRules: rule.atRules,
        matchedRoutes: [],
        staticReferences: [],
        dynamicRisk: true
      },
      size: {
        sourceBytes: previous.bytes,
        basis: "Overridden declaration source span. No savings estimate is claimed because fallback semantics may require it."
      },
      evidence: [
        {
          kind: "parser",
          description: context === "same-rule" ? `A later declaration of "${previous.prop}" appears in this rule.` : `A later rule for the same selector declares "${previous.prop}".`,
          file: laterRule.relativeFile,
          line: later.line
        }
      ],
      tags: ["css", "declaration", "overridden", "fallback-risk"],
      fingerprintSuffix: `${rule.offset}|${previous.prop}|${previous.line}`,
      idSuffix: `${laterRule.offset}:${later.offset}`
    });
  };
  for (const rule of rules) {
    if (unusedStylesheetSet.has(path8.normalize(rule.file))) continue;
    const seen = /* @__PURE__ */ new Map();
    for (const declaration of rule.declarationInfos) {
      const prop = declaration.prop;
      const value = declaration.value;
      if (!prop || prop.startsWith("-") || prop.startsWith("--") || prop === "composes") {
        seen.set(prop, declaration);
        continue;
      }
      const previous = seen.get(prop);
      if (!previous) {
        seen.set(prop, declaration);
        continue;
      }
      const exactDuplicate = previous.value === value && previous.important === declaration.important;
      if (exactDuplicate) {
        findings.push(
          createFinding({
            root,
            category: "unused-css-declaration",
            status: "potentially-unused",
            confidence: "high",
            title: `Redundant CSS declaration "${prop}"`,
            description: "The same property/value/importance is declared more than once in this rule. Removing the later duplicate leaves the computed value unchanged.",
            file: rule.file,
            line: declaration.line,
            column: declaration.column,
            symbol: `${prop}: ${value}`,
            symbolKind: "css-property",
            css: {
              selector: rule.selectorText,
              selectorKind: "complex",
              declarations: rule.declarations,
              ruleText: rule.ruleText,
              stylesheet: rule.relativeFile,
              atRules: rule.atRules,
              matchedRoutes: [],
              staticReferences: [],
              dynamicRisk: false
            },
            size: {
              sourceBytes: declaration.bytes,
              estimatedRemovableBytes: declaration.bytes,
              basis: "Exact duplicate declaration source span."
            },
            evidence: [
              {
                kind: "parser",
                description: "An identical property/value/importance declaration appears earlier in the same rule.",
                file: rule.relativeFile,
                line: previous.line
              }
            ],
            tags: ["css", "declaration", "duplicate"],
            fingerprintSuffix: `${rule.offset}|${prop}|${declaration.line}`
          })
        );
        seen.set(prop, declaration);
      } else if (config.css.analyzeOverriddenDeclarations && (!previous.important || declaration.important)) {
        findings.push(
          overriddenDeclarationFinding(rule, previous, rule, declaration, "same-rule")
        );
        seen.set(prop, declaration);
      } else if (!previous.important || declaration.important) {
        seen.set(prop, declaration);
      }
    }
  }
  if (config.css.analyzeOverriddenDeclarations) {
    const ruleGroups = /* @__PURE__ */ new Map();
    for (const rule of rules) {
      if (unusedStylesheetSet.has(path8.normalize(rule.file))) continue;
      const key = `${rule.file}|${rule.atRules.join(">")}|${normalizeSelector(rule.selectorText)}`;
      const group = ruleGroups.get(key) ?? [];
      group.push(rule);
      ruleGroups.set(key, group);
    }
    for (const group of ruleGroups.values()) {
      if (group.length < 2) continue;
      const latest = /* @__PURE__ */ new Map();
      for (const rule of group) {
        for (const declaration of rule.declarationInfos) {
          const prop = declaration.prop;
          if (!prop || prop.startsWith("-") || prop.startsWith("--") || prop === "composes") continue;
          const previous = latest.get(prop);
          if (previous && previous.rule.id !== rule.id && (!previous.declaration.important || declaration.important)) {
            const exact = previous.declaration.value === declaration.value && previous.declaration.important === declaration.important;
            const key = `${previous.rule.file}|${previous.declaration.offset}|${prop}`;
            if (!exact && !overriddenDeclarationKeys.has(key)) {
              findings.push(
                overriddenDeclarationFinding(
                  previous.rule,
                  previous.declaration,
                  rule,
                  declaration,
                  "later-rule"
                )
              );
            }
          }
          if (!previous || !previous.declaration.important || declaration.important) {
            latest.set(prop, { rule, declaration });
          }
        }
      }
    }
  }
  findings.push(...duplicateFindings);
  let highSpecificityCount = 0;
  for (const parsed of selectors) {
    if (unusedStylesheetSet.has(path8.normalize(parsed.file))) continue;
    if (parsed.tokens.specificity.score > config.css.specificityThreshold) {
      highSpecificityCount += 1;
      if (parsed.used && !parsed.finding) {
        findings.push(
          createFinding({
            root,
            category: "css-specificity",
            status: "unknown",
            confidence: "high",
            title: `High CSS specificity (${parsed.tokens.specificity.score}) for "${truncate(parsed.selector, 100)}"`,
            description: "The selector is used but has a high specificity score. Lowering specificity can make overrides and theming easier; this is advisory.",
            file: parsed.file,
            line: parsed.line,
            column: parsed.column,
            symbol: parsed.selector,
            symbolKind: "css-selector",
            css: {
              ...parsed.details,
              matchedRoutes: [],
              staticReferences: [],
              dynamicRisk: false
            },
            size: {},
            evidence: [
              {
                kind: "parser",
                description: `Specificity ${parsed.tokens.specificity.score}: ${parsed.tokens.specificity.ids} id(s), ${parsed.tokens.specificity.classes} class/attribute/pseudo-class, ${parsed.tokens.specificity.elements} element/pseudo-element.`,
                file: parsed.relativeFile,
                line: parsed.line
              }
            ],
            tags: ["css", "specificity", "advisory"],
            fingerprintSuffix: `${parsed.atRules.join(">")}|${parsed.normalizedSelector}`
          })
        );
      }
    }
  }
  const maskHtmlStyles = (text) => text.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, (value) => value.replace(/[^\r\n]/g, " "));
  const usageTexts = [
    ...sources.map((source) => source.content),
    ...files.scripts.map((file) => maskHtmlStyles(readTextSafe2(file) ?? "")),
    ...files.html.map((file) => maskHtmlStyles(readTextSafe2(file) ?? ""))
  ].map((text) => text.replace(/\/\*[\s\S]*?\*\//g, " "));
  const combinedUsageText = usageTexts.join("\n");
  const customProperties = [];
  const unusedCustomPropertyNames = /* @__PURE__ */ new Set();
  if (config.css.checkCustomProperties) {
    const seenCustom = /* @__PURE__ */ new Set();
    for (const declaration of customPropertyDecls) {
      if (unusedStylesheetSet.has(path8.normalize(declaration.source.file))) continue;
      if (seenCustom.has(`${declaration.source.file}|${declaration.name}|${declaration.line}`)) continue;
      seenCustom.add(`${declaration.source.file}|${declaration.name}|${declaration.line}`);
      const escaped = declaration.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const varUsage = new RegExp(`var\\(\\s*${escaped}\\b`, "g");
      const apiUsage = new RegExp(
        `(?:getPropertyValue|setProperty|removeProperty)\\s*\\(\\s*['"]${escaped}['"]`,
        "g"
      );
      const usageCount = (combinedUsageText.match(varUsage) ?? []).length + (combinedUsageText.match(apiUsage) ?? []).length;
      const info = {
        name: declaration.name,
        file: declaration.source.file,
        relativeFile: declaration.source.relativeFile,
        line: declaration.line,
        column: declaration.column,
        used: usageCount > 0,
        usageCount
      };
      customProperties.push(info);
      if (usageCount === 0) {
        unusedCustomPropertyNames.add(declaration.name);
        findings.push(
          createFinding({
            root,
            category: "unused-css-custom-property",
            status: "potentially-unused",
            confidence: "medium",
            title: `Potentially unused CSS custom property "${declaration.name}"`,
            description: "No var() reference or CSSOM getPropertyValue/setProperty/removeProperty use was found in source files. External styles, shadow DOM consumers and runtime code can still use it.",
            file: declaration.source.file,
            line: declaration.line,
            column: declaration.column,
            symbol: declaration.name,
            symbolKind: "css-property",
            css: {
              selector: declaration.name,
              selectorKind: "custom-property",
              declarations: [declaration.decl.toString()],
              ruleText: truncate(declaration.decl.parent?.toString() ?? declaration.decl.toString(), 2e3),
              stylesheet: declaration.source.relativeFile,
              matchedRoutes: [],
              staticReferences: [],
              dynamicRisk: usage.dynamicClasses
            },
            size: {
              sourceBytes: declaration.valueBytes,
              estimatedRemovableBytes: declaration.valueBytes,
              basis: "Custom property declaration source span."
            },
            evidence: [
              {
                kind: "no-static-reference",
                description: "No var() or CSSOM custom-property API reference was found.",
                file: declaration.source.relativeFile,
                line: declaration.line
              }
            ],
            tags: ["css", "custom-property"],
            fingerprintSuffix: `${declaration.source.relativeFile}|${declaration.name}`
          })
        );
      }
    }
  }
  const keyframes = [];
  for (const definition of keyframeDefs) {
    if (unusedStylesheetSet.has(path8.normalize(definition.source.file))) continue;
    if (definition.params.includes("#{")) continue;
    const position = sourcePosition(definition.source, nodeOffset(definition.atRule, definition.source.content));
    const escaped = definition.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const occurrenceCount = (combinedUsageText.match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length;
    const definitionCount = keyframeDefs.filter((item) => item.name === definition.name).length;
    const used = occurrenceCount > definitionCount;
    keyframes.push({
      name: definition.name,
      file: definition.source.file,
      relativeFile: definition.source.relativeFile,
      line: position.line,
      column: position.column,
      used
    });
    if (!used) {
      const ruleText = truncate(definition.atRule.toString(), 2e3);
      findings.push(
        createFinding({
          root,
          category: "unused-css-selector",
          status: "potentially-unused",
          confidence: "medium",
          title: `Potentially unused @keyframes "${definition.name}"`,
          description: "The keyframes name does not appear in any animation/transition declaration or script string outside its own definition.",
          file: definition.source.file,
          line: position.line,
          column: position.column,
          symbol: `@keyframes ${definition.name}`,
          symbolKind: "css-selector",
          css: {
            selector: `@keyframes ${definition.name}`,
            selectorKind: "keyframes",
            declarations: [],
            ruleText,
            stylesheet: definition.source.relativeFile,
            matchedRoutes: [],
            staticReferences: [],
            dynamicRisk: usage.dynamicClasses
          },
          size: {
            sourceBytes: byteLength(ruleText),
            estimatedRemovableBytes: byteLength(ruleText),
            basis: "Keyframes definition source span; animations may be configured externally."
          },
          evidence: [
            {
              kind: "no-static-reference",
              description: "No animation/transition reference was found outside the keyframes definition.",
              file: definition.source.relativeFile,
              line: position.line
            }
          ],
          tags: ["css", "animation", "keyframes"],
          fingerprintSuffix: definition.name
        })
      );
    }
  }
  const finalFindings = uniqueFindingFingerprints(findings).sort((a, b) => {
    if (a.location.relativeFile !== b.location.relativeFile) {
      return a.location.relativeFile.localeCompare(b.location.relativeFile);
    }
    return a.location.line - b.location.line;
  });
  const unusedSelectorFindings = finalFindings.filter((finding) => finding.category === "unused-css-selector");
  const usedSelectors = selectors.filter((selector) => selector.used).length;
  const unusedStylesheetList = unusedStylesheetFiles.map((file) => relativePosix(root, file));
  const moduleFiles = /* @__PURE__ */ new Set([
    ...selectors.filter((selector) => selector.module).map((selector) => selector.file),
    ...usage.moduleImports.keys()
  ]);
  const dynamicRiskSelectors = selectors.filter(
    (selector) => selector.dynamicRisk || selector.tokens.statePseudo || Boolean(selector.media)
  ).length;
  const report = {
    files: sources.length,
    rules: rules.length,
    selectors: selectors.length,
    matchedSelectors: usedSelectors,
    unmatchedSelectors: unusedSelectorFindings.length,
    dynamicRiskSelectors,
    stylesheetFiles: stylesheets.length,
    unusedStylesheetFiles: unusedStylesheetList,
    customProperties: customProperties.length,
    unusedCustomProperties: [...unusedCustomPropertyNames],
    duplicateRules: finalFindings.filter((finding) => finding.category === "duplicate-css-rule").length,
    highSpecificitySelectors: highSpecificityCount,
    modules: moduleFiles.size,
    runtimeInjectedRules: 0,
    cssInJsBlocks: cssInJsBlocks.length,
    cssInJsSources: cssInJsBlocks.slice(0, 2e3).map((block) => ({
      file: block.file,
      relativeFile: block.relativeFile,
      line: block.startLine,
      endLine: block.endLine,
      tag: block.tag,
      kind: block.kind,
      dynamic: block.dynamic,
      selectors: block.selectors.map((selector) => selector.selector)
    })),
    notes: [
      "Static CSS results are potential findings. Runtime matching is required before removal.",
      "Media-query, interaction-state, pseudo-element and dynamically generated selectors are deliberately conservative.",
      "CSS-in-JS tagged templates are source-extracted; object-style/runtime CSS-in-JS is mapped through the browser CSSOM."
    ]
  };
  if (sources.length === 0) {
    warnings.push("No source CSS, SCSS, LESS, SFC style blocks, or HTML style blocks were found.");
  }
  return {
    findings: finalFindings,
    report,
    stylesheets,
    customProperties,
    keyframes,
    warnings: [...new Set(warnings)],
    selectorCount: selectors.length,
    usedSelectorCount: usedSelectors,
    unusedSelectorCount: unusedSelectorFindings.length,
    dynamicRiskSelectorCount: dynamicRiskSelectors,
    duplicateRuleCount: report.duplicateRules,
    highSpecificityCount,
    moduleCount: moduleFiles.size,
    cssInJsBlocks,
    selectors: selectors.map((parsed) => ({
      selector: parsed.selector,
      file: parsed.file,
      relativeFile: parsed.relativeFile,
      line: parsed.line,
      stylesheet: parsed.relativeFile,
      module: parsed.module,
      classes: [...parsed.tokens.localClasses, ...parsed.tokens.globalClasses],
      ids: parsed.tokens.ids,
      tags: parsed.tokens.tags,
      used: parsed.used,
      safelisted: parsed.safelisted,
      details: parsed.details
    }))
  };
}
var IMPLICIT_RUNTIME_PACKAGES = /* @__PURE__ */ new Set([
  "tslib",
  "@babel/runtime",
  "core-js",
  "core-js-pure",
  "regenerator-runtime",
  "zone.js",
  "reflect-metadata"
]);
var BUILTIN_PREFIXES = ["node:"];
function tsconfigAliasPatterns(tsconfig) {
  if (!tsconfig || !existsSync(tsconfig)) return [];
  try {
    const read = ts7.readConfigFile(tsconfig, (file) => ts7.sys.readFile(file));
    if (read.error) return [];
    const parsed = ts7.parseJsonConfigFileContent(read.config, ts7.sys, path8.dirname(tsconfig), {}, tsconfig);
    return Object.keys(parsed.options.paths ?? {});
  } catch {
    return [];
  }
}
function matchesAlias(specifier, patterns) {
  for (const pattern of patterns) {
    if (!pattern.includes("*")) {
      if (specifier === pattern) return true;
    } else {
      const prefix = pattern.slice(0, pattern.indexOf("*"));
      const suffix = pattern.slice(pattern.indexOf("*") + 1);
      if (specifier.startsWith(prefix) && specifier.endsWith(suffix)) return true;
    }
  }
  return false;
}
function collectDeclared(pkg) {
  const result = /* @__PURE__ */ new Map();
  const groups = [
    ["dependencies", pkg?.dependencies],
    ["devDependencies", pkg?.devDependencies],
    ["peerDependencies", pkg?.peerDependencies],
    ["optionalDependencies", pkg?.optionalDependencies]
  ];
  for (const [type, deps] of groups) {
    for (const [name, version] of Object.entries(deps ?? {})) {
      if (!result.has(name)) {
        result.set(name, {
          name,
          version,
          type,
          workspace: typeof version === "string" && version.startsWith("workspace:")
        });
      }
    }
  }
  return result;
}
function duplicateReport(versions, locations) {
  return [...versions.entries()].filter(([, set]) => set.size > 1).map(([packageName, set]) => ({
    packageName,
    versions: [...set].sort(),
    locations: [...locations.get(packageName) ?? []].slice(0, 20),
    source: "lockfile"
  }));
}
function parseNpmLock(file) {
  const parsed = safeReadJson(file);
  if (!parsed) return void 0;
  const versions = /* @__PURE__ */ new Map();
  const locations = /* @__PURE__ */ new Map();
  if (parsed.packages) {
    for (const [location, metadata] of Object.entries(parsed.packages)) {
      if (!location || !metadata.version) continue;
      const name = location.split("node_modules/").pop();
      if (!name) continue;
      const set = versions.get(name) ?? /* @__PURE__ */ new Set();
      set.add(metadata.version);
      versions.set(name, set);
      const locationSet = locations.get(name) ?? /* @__PURE__ */ new Set();
      locationSet.add(location);
      locations.set(name, locationSet);
    }
  } else if (parsed.dependencies) {
    const visit = (deps) => {
      for (const [name, metadata] of Object.entries(deps)) {
        if (metadata.version) {
          const set = versions.get(name) ?? /* @__PURE__ */ new Set();
          set.add(metadata.version);
          versions.set(name, set);
        }
        if (metadata.dependencies) {
          visit(metadata.dependencies);
        }
      }
    };
    visit(parsed.dependencies);
  }
  return { duplicates: duplicateReport(versions, locations), lockfile: file };
}
function parsePnpmLock(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return void 0;
  }
  const versions = /* @__PURE__ */ new Map();
  const locations = /* @__PURE__ */ new Map();
  let inPackages = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (/^\S/.test(line) && !/^packages:/.test(line)) {
      inPackages = false;
      continue;
    }
    if (!inPackages) continue;
    const header = /^\s{2,}(?:'([^']+)'|"([^"]+)"|([^:]+)):\s*$/.exec(line);
    if (!header) continue;
    const key = (header[1] ?? header[2] ?? header[3] ?? "").trim();
    if (!key || /^(?:link|file|workspace):/.test(key)) continue;
    const cleaned = key.replace(/^\//, "").replace(/\((?:[^)]*)\)/g, "");
    let name;
    let version;
    const at = /^((?:@[^/]+\/)?[^@/]+)@([^@\s]+)$/.exec(cleaned);
    if (at) {
      name = at[1];
      version = at[2];
    } else {
      const slash = /^((?:@[^/]+\/)?[^/]+)\/([^/]+)$/.exec(cleaned);
      if (slash) {
        name = slash[1];
        version = slash[2];
      }
    }
    if (!name || !version || !/^\d/.test(version)) continue;
    const set = versions.get(name) ?? /* @__PURE__ */ new Set();
    set.add(version);
    versions.set(name, set);
    const locationSet = locations.get(name) ?? /* @__PURE__ */ new Set();
    locationSet.add(key);
    locations.set(name, locationSet);
  }
  return { duplicates: duplicateReport(versions, locations), lockfile: file };
}
function parseYarnLock(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return void 0;
  }
  const versions = /* @__PURE__ */ new Map();
  const locations = /* @__PURE__ */ new Map();
  let currentName;
  let currentHeader = "";
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*$/.test(line) || /^\s*#/.test(line)) continue;
    if (!/^\s/.test(line)) {
      currentHeader = line.replace(/:$/, "").trim();
      const firstSelector = currentHeader.split(",")[0]?.trim() ?? "";
      const selector = firstSelector.replace(/^"|"$/g, "");
      const match = /^((?:@[^/]+\/)?[^@]+)@(?:npm:|[^@]+$)/.exec(selector);
      currentName = match?.[1]?.trim();
      if (currentName && !versions.has(currentName)) versions.set(currentName, /* @__PURE__ */ new Set());
      continue;
    }
    const versionMatch = /^\s+version:?\s+"?([^"\s]+)"?/.exec(line);
    if (!versionMatch || !currentName) continue;
    const version = versionMatch[1];
    if (!version) continue;
    const set = versions.get(currentName) ?? /* @__PURE__ */ new Set();
    set.add(version);
    versions.set(currentName, set);
    const locationSet = locations.get(currentName) ?? /* @__PURE__ */ new Set();
    locationSet.add(currentHeader || currentName);
    locations.set(currentName, locationSet);
  }
  return { duplicates: duplicateReport(versions, locations), lockfile: file };
}
function parseLockfiles(root) {
  const candidates = [
    { file: path8.join(root, "package-lock.json"), parser: parseNpmLock },
    { file: path8.join(root, "npm-shrinkwrap.json"), parser: parseNpmLock },
    { file: path8.join(root, "pnpm-lock.yaml"), parser: parsePnpmLock },
    { file: path8.join(root, "yarn.lock"), parser: parseYarnLock }
  ];
  const duplicates = /* @__PURE__ */ new Map();
  const lockfiles = [];
  for (const candidate of candidates) {
    if (!existsSync(candidate.file)) continue;
    const parsed = candidate.parser(candidate.file);
    if (!parsed) continue;
    lockfiles.push(candidate.file);
    for (const duplicate of parsed.duplicates) {
      const key = `${duplicate.packageName}|${duplicate.versions.join(",")}`;
      const existing = duplicates.get(key);
      if (existing) {
        for (const location of duplicate.locations) {
          if (!existing.locations.includes(location)) existing.locations.push(location);
        }
      } else {
        duplicates.set(key, duplicate);
      }
    }
  }
  return { duplicates: [...duplicates.values()], lockfiles };
}
function weakReferenceTexts(root, pkg, files) {
  const scripts = Object.values(pkg?.scripts ?? {}).join("\n");
  const configFiles = fg.sync(
    [
      "*.config.{js,cjs,mjs,ts,mts,cts}",
      ".parcelrc",
      ".babelrc",
      "angular.json",
      "next.config.*",
      "nuxt.config.*",
      "astro.config.*",
      "postcss.config.*",
      "tailwind.config.*",
      "babel.config.*",
      "vite.config.*",
      "webpack.config.*",
      "rollup.config.*",
      "tsconfig*.json",
      "package.json"
    ],
    {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      unique: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**"]
    }
  );
  let config = "";
  for (const file of configFiles) {
    if (file.endsWith("package.json")) continue;
    try {
      const text = readFileSync(file, "utf8");
      if (text.length < 1e6) config += `
${text}`;
    } catch {
    }
  }
  let source = "";
  for (const file of [...files.scripts, ...files.styles, ...files.html]) {
    try {
      const text = readFileSync(file, "utf8");
      if (text.length < 1e6) source += `
${text}`;
    } catch {
    }
  }
  return { scripts, config, source };
}
function packageMentions(text, packageName) {
  if (!text) return false;
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\w@/-])${escaped}(?=$|[^\\w/-])`).test(text);
}
function singularDependencyType(type) {
  if (type === "devDependencies") return "devDependency";
  if (type === "peerDependencies") return "peerDependency";
  if (type === "optionalDependencies") return "optionalDependency";
  return "dependency";
}
function groupTypeOnly(entries) {
  const map = /* @__PURE__ */ new Map();
  for (const entry2 of entries) {
    const key = `${entry2.file}|${entry2.source}`;
    const existing = map.get(key);
    if (existing) {
      for (const name of entry2.names) if (!existing.names.includes(name)) existing.names.push(name);
      if (!existing.packageName && entry2.packageName) existing.packageName = entry2.packageName;
    } else {
      map.set(key, { ...entry2, names: [...entry2.names] });
    }
  }
  return map;
}
function analyzeDependencies(options) {
  const { root, detection, files, staticResult, signal } = options;
  const warnings = [];
  const pkg = detection.packageJson;
  const packageJsonPath = detection.packageJsonPath;
  const declared = collectDeclared(pkg);
  const aliases = tsconfigAliasPatterns(detection.tsconfig);
  const typeOnlyMap = groupTypeOnly(staticResult.typeOnlyImports);
  const typeOnlyKeys = new Set(typeOnlyMap.keys());
  const importMap = /* @__PURE__ */ new Map();
  for (const record of staticResult.externalImports) {
    if (signal?.aborted) throw new Error("Dependency analysis aborted");
    if (matchesAlias(record.specifier, aliases)) continue;
    if (BUILTIN_PREFIXES.some((prefix) => record.specifier.startsWith(prefix))) continue;
    if (!declared.has(record.packageName) && !declared.has(record.specifier)) ;
    const current = importMap.get(record.packageName) ?? {
      importers: /* @__PURE__ */ new Set(),
      value: 0,
      typeOnly: 0,
      dynamic: false
    };
    current.importers.add(record.relativeFile);
    if (record.typeOnly || typeOnlyKeys.has(`${record.file}|${record.specifier}`)) current.typeOnly += 1;
    else current.value += 1;
    if (record.dynamic) current.dynamic = true;
    importMap.set(record.packageName, current);
  }
  const references = weakReferenceTexts(root, pkg, files);
  const declaredReports = [];
  const findings = [];
  const unused = [];
  const frameworkPackages = new Set(detection.frameworks.map((framework) => framework.packageName));
  const frameworkNames = new Set(detection.frameworks.map((framework) => framework.name));
  const frameworkImplicit = (name) => {
    if (frameworkPackages.has(name)) return true;
    if (frameworkNames.has("React") && (name === "react-dom" || name.startsWith("react-dom/"))) return true;
    if (frameworkNames.has("Next.js") && ["react", "react-dom", "styled-jsx"].includes(name)) return true;
    if (frameworkNames.has("Nuxt") && name.startsWith("@nuxt/")) return true;
    if (frameworkNames.has("Astro") && name.startsWith("@astrojs/")) return true;
    if (frameworkNames.has("Angular") && name.startsWith("@angular/")) return true;
    if (frameworkNames.has("Vue") && (name === "vue" || name.startsWith("@vue/"))) return true;
    if (frameworkNames.has("Svelte") && (name === "svelte" || name.startsWith("@sveltejs/"))) return true;
    if (frameworkNames.has("Preact") && (name === "preact" || name.startsWith("preact/"))) return true;
    if (frameworkNames.has("Solid") && (name === "solid-js" || name.startsWith("solid-js/"))) return true;
    return false;
  };
  for (const dependency of declared.values()) {
    const imports = importMap.get(dependency.name);
    const usedInScripts = packageMentions(references.scripts, dependency.name);
    const usedInConfig = packageMentions(references.config, dependency.name);
    const mentionedInSource = packageMentions(references.source, dependency.name);
    const implicit = IMPLICIT_RUNTIME_PACKAGES.has(dependency.name) || frameworkImplicit(dependency.name);
    const dynamicLoading = staticResult.hasDynamicModuleLoading;
    const importCount = (imports?.value ?? 0) + (imports?.typeOnly ?? 0);
    const used = importCount > 0 || usedInScripts || usedInConfig || mentionedInSource || implicit || dependency.type === "devDependencies" || dependency.type === "peerDependencies" || dependency.type === "optionalDependencies";
    let status = "unknown";
    let confidence = "high";
    let reason;
    if (importCount > 0) {
      reason = `Imported ${importCount} time${importCount === 1 ? "" : "s"} across ${imports?.importers.size ?? 0} file${(imports?.importers.size ?? 0) === 1 ? "" : "s"}.`;
      status = "executed";
    } else if (usedInScripts) {
      reason = "Referenced by a package.json script.";
    } else if (usedInConfig) {
      reason = "Referenced by a build/tooling configuration file.";
    } else if (mentionedInSource) {
      reason = "Referenced as a string in project source; this is weak usage evidence.";
      confidence = "medium";
    } else if (implicit) {
      reason = "Known implicitly-injected runtime/tooling package.";
    } else if (dependency.type !== "dependencies") {
      reason = `${dependency.type} are not evaluated as runtime bundle dependencies.`;
    } else if (dynamicLoading) {
      reason = "No static import was found, but computed dynamic module loading exists in the project.";
      confidence = "low";
    } else {
      reason = "No static import, script, config, or source reference was found.";
      status = "potentially-unused";
      confidence = "high";
    }
    const report2 = {
      name: dependency.name,
      declaredIn: dependency.type,
      ...dependency.version ? { version: dependency.version } : {},
      importedBy: [...imports?.importers ?? []].slice(0, 30),
      importCount,
      importKinds: {
        value: imports?.value ?? 0,
        typeOnly: imports?.typeOnly ?? 0
      },
      dynamicallyImported: imports?.dynamic ?? false,
      usedInScripts,
      status,
      confidence,
      reason
    };
    declaredReports.push(report2);
    if (status === "potentially-unused" && dependency.type === "dependencies" && !used) {
      unused.push(report2);
      if (packageJsonPath) {
        findings.push(
          createFinding({
            root,
            category: "unused-dependency",
            status: "potentially-unused",
            confidence,
            title: `Potentially unused dependency "${dependency.name}"`,
            description: `${reason} Dynamic imports and toolchain-only usage can still require this package. Review before removing from package.json.`,
            file: packageJsonPath,
            line: 1,
            column: 1,
            symbol: dependency.name,
            symbolKind: "dependency",
            dependency: {
              packageName: dependency.name,
              dependencyType: singularDependencyType(dependency.type),
              ...dependency.version ? { versions: [dependency.version] } : {},
              reason
            },
            size: {
              basis: "Package removal impact depends on the bundle and is measured separately when source maps attribute package code."
            },
            evidence: [
              {
                kind: "no-static-reference",
                description: "No import, script, configuration, or source-string reference was found.",
                file: toPosix(path8.relative(root, packageJsonPath)),
                line: 1
              }
            ],
            tags: ["dependency", "package-json"],
            fingerprintSuffix: `${dependency.name}|${dependency.type}`
          })
        );
      }
    }
  }
  const duplicates = parseLockfiles(root);
  for (const duplicate of duplicates.duplicates) {
    if (packageJsonPath) {
      findings.push(
        createFinding({
          root,
          category: "duplicate-dependency",
          status: "unknown",
          confidence: "high",
          title: `Duplicate versions of "${duplicate.packageName}"`,
          description: `The lockfile contains multiple resolved versions (${duplicate.versions.join(", ")}). Deduplicate or align versions to reduce bundle weight and API drift.`,
          file: packageJsonPath,
          line: 1,
          column: 1,
          symbol: duplicate.packageName,
          symbolKind: "dependency",
          dependency: {
            packageName: duplicate.packageName,
            dependencyType: "dependency",
            versions: duplicate.versions,
            reason: "Multiple lockfile resolutions were found."
          },
          size: {},
          evidence: [
            {
              kind: "lockfile",
              description: `Resolved at ${duplicate.locations.length} lockfile location(s).`,
              file: toPosix(path8.relative(root, duplicates.lockfiles[0] ?? packageJsonPath)),
              line: 1
            }
          ],
          tags: ["dependency", "duplicate", "lockfile"],
          fingerprintSuffix: duplicate.versions.join("|")
        })
      );
    }
  }
  const polyfillNames = ["core-js", "core-js-pure", "regenerator-runtime", "@babel/polyfill"];
  for (const polyfill of polyfillNames) {
    const declaredPolyfill = declared.get(polyfill);
    const importedPolyfill = importMap.get(polyfill);
    if (!declaredPolyfill && !importedPolyfill) continue;
    if (!packageJsonPath) continue;
    findings.push(
      createFinding({
        root,
        category: "polyfill-included",
        status: "unknown",
        confidence: "low",
        title: `Polyfill package "${polyfill}" is included`,
        description: "The project includes a polyfill package. Whether it is unnecessary depends on browserslist targets and runtime APIs actually used; the tool does not claim removal savings.",
        file: packageJsonPath,
        line: 1,
        column: 1,
        symbol: polyfill,
        symbolKind: "dependency",
        dependency: {
          packageName: polyfill,
          dependencyType: singularDependencyType(declaredPolyfill?.type ?? "dependencies"),
          reason: "Polyfill package detected; necessity requires browser target analysis."
        },
        size: {},
        evidence: [
          {
            kind: "configuration",
            description: "Polyfill package appears in package.json or source imports.",
            file: toPosix(path8.relative(root, packageJsonPath)),
            line: 1
          }
        ],
        tags: ["dependency", "polyfill", "advisory"],
        fingerprintSuffix: polyfill
      })
    );
  }
  const unresolvedImports = /* @__PURE__ */ new Set();
  for (const record of staticResult.externalImports) {
    if (matchesAlias(record.specifier, aliases)) continue;
    if (record.specifier.startsWith("#")) continue;
    if (!declared.has(record.packageName) && !declared.has(record.specifier)) {
      unresolvedImports.add(record.packageName);
    }
  }
  const typeOnlyImports = [...typeOnlyMap.values()].map((entry2) => ({
    ...entry2,
    ...entry2.packageName && matchesAlias(entry2.source, aliases) ? { packageName: void 0 } : {}
  }));
  const report = {
    ...packageJsonPath ? { packageJson: packageJsonPath } : {},
    packageManager: detection.packageManager,
    declared: declared.size,
    packages: declaredReports.sort((a, b) => a.name.localeCompare(b.name)),
    unused,
    unresolvedImports: [...unresolvedImports].sort(),
    duplicateVersions: duplicates.duplicates,
    typeOnlyImports,
    ...duplicates.lockfiles[0] ? { lockfile: duplicates.lockfiles[0] } : {},
    notes: [
      "Only runtime dependencies are reported as potentially unused; dev, peer and optional dependencies remain informational.",
      "Dynamic module loading, build plugins, scripts and source-string references are considered before flagging a package.",
      "Duplicate versions are parsed from package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml and yarn.lock; duplicate package code is also detected from source maps.",
      "Polyfill necessity depends on browser targets and is reported as advisory only."
    ]
  };
  if (!packageJsonPath) {
    warnings.push("No package.json found; dependency analysis is limited.");
  }
  const transitive = [...importMap.entries()].filter(([name]) => !declared.has(name) && !matchesAlias(name, aliases)).map(([name, imports]) => ({
    name,
    declaredIn: "transitive",
    importedBy: [...imports.importers].slice(0, 30),
    importCount: imports.value + imports.typeOnly,
    importKinds: { value: imports.value, typeOnly: imports.typeOnly },
    dynamicallyImported: imports.dynamic,
    usedInScripts: false,
    status: "unknown",
    confidence: "high",
    reason: "Imported by source but not declared directly in package.json (workspace/transitive)."
  }));
  report.packages.push(...transitive.sort((a, b) => a.name.localeCompare(b.name)));
  if (unresolvedImports.size > 0) {
    warnings.push(
      `Unresolved bare imports: ${truncate([...unresolvedImports].join(", "), 300)}. These may be workspace or transitive packages.`
    );
  }
  return { report, findings, warnings };
}
function readSourceMapUrl(text, extension) {
  if (extension === "js") {
    const matches2 = [...text.matchAll(/\/\/[#@]\s*sourceMappingURL=([^\s'"]+)/g)];
    return matches2[matches2.length - 1]?.[1];
  }
  const matches = [...text.matchAll(/\/\*[#@]\s*sourceMappingURL=([^*\s]+)\s*\*\//g)];
  return matches[matches.length - 1]?.[1];
}
function decodeDataUri(uri) {
  const comma = uri.indexOf(",");
  if (comma < 0) throw new Error("Malformed source map data URI.");
  const header = uri.slice(0, comma);
  const payload = uri.slice(comma + 1);
  if (/;base64/i.test(header)) return Buffer.from(payload, "base64").toString("utf8");
  return decodeURIComponent(payload);
}
function loadSourceMapFromFile(generatedFile, text, root, warnings, maxMappingsPerFile = 25e4) {
  const extension = path8.extname(generatedFile).toLowerCase() === ".css" ? "css" : "js";
  const url = readSourceMapUrl(text, extension);
  const baseIndex = {
    generatedFile,
    kind: "none",
    sources: [],
    reverseByKey: /* @__PURE__ */ new Map(),
    attribution: [],
    mappedBytes: 0,
    totalBytes: Buffer.byteLength(text, "utf8"),
    warnings: []
  };
  if (!url) return baseIndex;
  let loaded;
  try {
    if (url.startsWith("data:")) {
      const json = JSON.parse(decodeDataUri(url));
      loaded = { json, kind: "inline" };
    } else if (/^https?:/i.test(url)) {
      warnings.push(`Remote source map ignored for offline analysis: ${url}`);
      return baseIndex;
    } else {
      const clean = url.replace(/[?#].*$/, "");
      const mapFile = path8.resolve(path8.dirname(generatedFile), decodeURIComponent(clean));
      if (!existsSync(mapFile)) {
        warnings.push(`Source map not found: ${mapFile}`);
        return baseIndex;
      }
      const raw = readFileSync(mapFile, "utf8");
      const json = JSON.parse(raw);
      loaded = { json, mapFile, kind: "external" };
    }
  } catch (error) {
    warnings.push(
      `Failed to load source map for ${path8.basename(generatedFile)}: ${error instanceof Error ? error.message : String(error)}`
    );
    return baseIndex;
  }
  const indexed = Array.isArray(loaded.json.sections);
  const mapUrl = pathToFileURL(loaded.mapFile ?? generatedFile).href;
  let map;
  try {
    map = new AnyMap(
      loaded.json,
      mapUrl
    );
  } catch (error) {
    warnings.push(
      `Failed to parse source map for ${path8.basename(generatedFile)}: ${error instanceof Error ? error.message : String(error)}`
    );
    return baseIndex;
  }
  const sources = resolveSources(map, root);
  const sourceByIndex = /* @__PURE__ */ new Map();
  sources.forEach((source, index) => sourceByIndex.set(index, source));
  const reverseByKey = /* @__PURE__ */ new Map();
  const attribution = /* @__PURE__ */ new Map();
  let mappedBytes = 0;
  const lineStarts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) lineStarts.push(index + 1);
  }
  let mappingsTruncated = false;
  try {
    const decoded = decodedMappings(map);
    const maxSegments = Math.max(100, maxMappingsPerFile);
    let visited = 0;
    for (let lineIndex = 0; lineIndex < decoded.length; lineIndex += 1) {
      const segments = decoded[lineIndex];
      if (!segments) continue;
      for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
        const segment = segments[segmentIndex];
        if (!segment) continue;
        visited += 1;
        if (visited > maxSegments) {
          mappingsTruncated = true;
          break;
        }
        const generatedColumn = segment[0] ?? 0;
        const sourceIndex = segment[1];
        const originalLine = segment[2];
        const originalColumn = segment[3];
        if (sourceIndex === void 0 || originalLine === void 0 || originalColumn === void 0) {
          continue;
        }
        const source = sourceByIndex.get(sourceIndex);
        if (!source) continue;
        const nameIndex = segment[4];
        const name = nameIndex !== void 0 ? map.names[nameIndex] : void 0;
        const generatedLine = lineIndex + 1;
        const original1BasedLine = originalLine + 1;
        const entry2 = {
          generatedLine,
          generatedColumn: generatedColumn + 1,
          originalLine: original1BasedLine,
          originalColumn: originalColumn + 1,
          ...name ? { name } : {}
        };
        for (const key of [source.display, source.file].filter((value) => Boolean(value))) {
          const existing = reverseByKey.get(key) ?? [];
          if (existing.length < 2e4) existing.push(entry2);
          reverseByKey.set(key, existing);
        }
        const lineStart = lineStarts[lineIndex] ?? 0;
        const nextSegment = segments[segmentIndex + 1];
        const nextColumn = nextSegment?.[0] ?? (text.slice(lineStart).split("\n")[0]?.length ?? 0);
        const startOffset = lineStart + generatedColumn;
        const endOffset = lineStart + Math.max(generatedColumn + 1, nextColumn);
        const bytes = Math.max(0, Math.min(endOffset, text.length) - Math.min(startOffset, text.length));
        const current = attribution.get(source.display) ?? { source, bytes: 0, segments: 0 };
        current.bytes += bytes;
        current.segments += 1;
        attribution.set(source.display, current);
        mappedBytes += bytes;
      }
      if (visited > maxSegments) break;
    }
  } catch (error) {
    warnings.push(
      `Failed to decode mappings for ${path8.basename(generatedFile)}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (mappingsTruncated) {
    warnings.push(
      `Mappings truncated after ${maxMappingsPerFile} segments for ${path8.basename(generatedFile)}. Increase sourceMaps.maxMappingsPerFile for complete attribution.`
    );
  }
  for (const entry2 of reverseByKey.values()) {
    entry2.sort((a, b) => a.originalLine - b.originalLine || a.originalColumn - b.originalColumn);
  }
  const modules = [...attribution.values()].map((item) => ({
    sourceFile: item.source.display,
    ...item.source.packageName ? { packageName: item.source.packageName } : {},
    ...item.source.version ? { version: item.source.version } : {},
    bytes: item.bytes,
    mappingSegments: item.segments
  })).sort((a, b) => b.bytes - a.bytes);
  return {
    generatedFile,
    ...loaded.mapFile ? { sourceMapFile: loaded.mapFile } : {},
    kind: indexed ? "indexed" : loaded.kind,
    map,
    sources,
    reverseByKey,
    attribution: modules,
    mappedBytes,
    totalBytes: Buffer.byteLength(text, "utf8"),
    warnings: []
  };
}
function resolveSources(map, root) {
  const resolved = map.resolvedSources ?? [];
  return resolved.map((resolvedSource, index) => {
    const raw = map.sources[index] ?? resolvedSource;
    return resolveSourceInfo(raw, resolvedSource, root);
  });
}
function packageFromSource(source) {
  const normalized = source.replaceAll("\\", "/");
  const lastNodeModules = normalized.lastIndexOf("node_modules/");
  if (lastNodeModules < 0) return { isNodeModules: false };
  const tail = normalized.slice(lastNodeModules + "node_modules/".length);
  const workspaceIndex = tail.indexOf("/node_modules/");
  const packagePath = workspaceIndex >= 0 ? tail.slice(0, workspaceIndex) : tail;
  const segments = packagePath.split("/");
  if (segments[0]?.startsWith("@") && segments[1]) {
    return {
      packageName: `${segments[0]}/${segments[1]}`,
      isNodeModules: true
    };
  }
  const pnpm = /(?:^|\/)(?:@([^/]+)\/)?([^/@]+)@([^/]+)/.exec(packagePath);
  if (segments[0]) {
    return {
      packageName: segments[0],
      ...pnpm?.[3] ? { version: pnpm[3] } : {},
      isNodeModules: true
    };
  }
  return { isNodeModules: true };
}
function cleanVirtualSource(source) {
  let value = source;
  value = value.replace(/^(?:webpack|webpack-internal|vite|rollup|turbopack|meteor|ng|file):\/\//i, "");
  value = value.replace(/^\/+/, "");
  value = value.replace(/^(?:\.\/)+/, "");
  value = value.replace(/[?#].*$/, "");
  return value;
}
function resolveSourceInfo(raw, resolved, root) {
  const packageInfo = packageFromSource(raw.includes("node_modules") ? raw : resolved);
  let absolute;
  let display = raw;
  const candidates = [];
  if (resolved.startsWith("file://")) {
    try {
      candidates.push(fileURLToPath(resolved));
    } catch {
    }
  }
  for (const candidate of [resolved, raw]) {
    if (!candidate) continue;
    const cleaned = cleanVirtualSource(candidate);
    if (/^[A-Za-z]:[\\/]/.test(cleaned) || cleaned.startsWith("/")) {
      candidates.push(path8.normalize(cleaned));
    } else {
      candidates.push(path8.resolve(root, cleaned));
    }
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      absolute = path8.normalize(candidate);
      break;
    }
  }
  if (!absolute) {
    for (const candidate of candidates) {
      const normalizedCandidate = toPosix(candidate);
      if (existsSync(normalizedCandidate)) {
        absolute = path8.normalize(normalizedCandidate);
        break;
      }
    }
  }
  if (absolute && absolute.startsWith(root)) {
    display = toPosix(path8.relative(root, absolute));
  } else {
    const cleaned = cleanVirtualSource(raw);
    display = cleaned.includes("node_modules/") ? cleaned.slice(cleaned.lastIndexOf("node_modules/")) : cleaned;
    if (!display) display = resolved;
  }
  const fromDisplay = packageFromSource(display);
  return {
    raw,
    display,
    ...absolute ? { file: absolute } : {},
    ...fromDisplay.packageName ?? packageInfo.packageName ? { packageName: fromDisplay.packageName ?? packageInfo.packageName } : {},
    ...fromDisplay.version ?? packageInfo.version ? { version: fromDisplay.version ?? packageInfo.version } : {},
    isNodeModules: fromDisplay.isNodeModules || packageInfo.isNodeModules
  };
}
function findGeneratedPosition(index, sourceKeys, originalLine, symbol) {
  const entries = [];
  for (const key of sourceKeys) {
    const found = index.reverseByKey.get(key);
    if (found) entries.push(...found);
  }
  if (entries.length > 0) {
    if (symbol) {
      const named = entries.filter((entry2) => entry2.name === symbol).sort(
        (a, b) => Math.abs(a.originalLine - originalLine) - Math.abs(b.originalLine - originalLine) || a.generatedLine - b.generatedLine
      )[0];
      if (named) {
        return {
          generatedFile: index.generatedFile,
          generatedLine: named.generatedLine,
          generatedColumn: named.generatedColumn,
          precision: "symbol",
          entry: named
        };
      }
    }
    let best;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const entry2 of entries) {
      const distance = Math.abs(entry2.originalLine - originalLine);
      if (distance < bestDistance) {
        best = entry2;
        bestDistance = distance;
      } else if (distance === bestDistance && entry2.generatedLine < (best?.generatedLine ?? Number.POSITIVE_INFINITY)) {
        best = entry2;
      }
    }
    if (best) {
      if (bestDistance === 0) {
        return {
          generatedFile: index.generatedFile,
          generatedLine: best.generatedLine,
          generatedColumn: best.generatedColumn,
          precision: symbol && best.name === symbol ? "symbol" : "line-column",
          entry: best
        };
      }
      if (bestDistance <= 3) {
        return {
          generatedFile: index.generatedFile,
          generatedLine: best.generatedLine,
          generatedColumn: best.generatedColumn,
          precision: "line",
          entry: best
        };
      }
      return {
        generatedFile: index.generatedFile,
        generatedLine: best.generatedLine,
        generatedColumn: best.generatedColumn,
        precision: "file",
        entry: best
      };
    }
  }
  const attributed = index.attribution.find(
    (item) => sourceKeys.some(
      (key) => item.sourceFile === key || item.sourceFile.endsWith(key) || key.endsWith(item.sourceFile)
    )
  );
  if (!attributed) return void 0;
  return {
    generatedFile: index.generatedFile,
    generatedLine: 1,
    generatedColumn: 1,
    precision: "file"
  };
}
function mapGeneratedToOriginal(index, line, column, root) {
  if (!index.map) return void 0;
  try {
    const mapped = originalPositionFor(index.map, { line, column });
    if (mapped.line === null || mapped.source === null) return void 0;
    const source = resolveSourceInfo(mapped.source, mapped.source, root);
    return {
      source,
      line: mapped.line,
      column: (mapped.column ?? 0) + 1
    };
  } catch {
    return void 0;
  }
}
function buildSourceMapReport(indexes, mappedFindings, totalMappedFindings) {
  const jsFiles = indexes.filter((index) => path8.extname(index.generatedFile).toLowerCase() !== ".css").length;
  const filesWithSourceMaps = indexes.filter((index) => index.kind !== "none").length;
  const inlineMaps = indexes.filter((index) => index.kind === "inline").length;
  const externalMaps = indexes.filter((index) => index.kind === "external").length;
  const indexedMaps = indexes.filter((index) => index.kind === "indexed").length;
  return {
    enabled: true,
    jsFiles,
    filesWithSourceMaps,
    inlineMaps,
    externalMaps,
    indexedMaps,
    resolvedFindings: mappedFindings,
    unresolvedFindings: Math.max(0, totalMappedFindings - mappedFindings),
    precision: { symbol: 0, lineColumn: 0, line: 0, file: 0 },
    notes: [
      "Precision is reported per finding. Symbol-level mapping requires a source map names table and a matching symbol.",
      "Remote HTTP source maps are intentionally ignored; analysis stays local and offline.",
      `Index fingerprint: ${hashString(indexes.map((index) => path8.basename(index.generatedFile)).join("|"), 12)}`
    ]
  };
}

// src/bundle/analyze.ts
var MAX_COMPRESS_BYTES = 100 * 1024 * 1024;
var MAX_TEXT_BYTES = 60 * 1024 * 1024;
function compressionSizes(buffer, file, warnings) {
  if (buffer.length > MAX_COMPRESS_BYTES) {
    warnings.push(`Compression skipped for ${file} because it exceeds ${MAX_COMPRESS_BYTES} bytes.`);
    return { gzip: 0, brotli: 0 };
  }
  try {
    return {
      gzip: gzipSync(buffer, { level: 9 }).length,
      brotli: brotliCompressSync(buffer, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: 9
        }
      }).length
    };
  } catch {
    warnings.push(`Compression failed for ${file}.`);
    return { gzip: 0, brotli: 0 };
  }
}
function routeFromHtml(relativeHtml) {
  const withoutExt = relativeHtml.replace(/\.html?$/i, "");
  if (withoutExt === "index" || withoutExt.endsWith("/index")) {
    const dir = withoutExt.replace(/\/?index$/, "");
    return `/${dir}`.replace(/\/+/g, "/");
  }
  return `/${withoutExt}`.replace(/\/+/g, "/");
}
function discoverBuildDirs(root, config, detection) {
  const configured = config.build.dir ? Array.isArray(config.build.dir) ? config.build.dir : [config.build.dir] : [];
  const dirs = (configured.length > 0 ? configured : detection.buildDirs).map((dir) => path8.resolve(root, dir)).filter((dir) => existsSync(dir));
  const unique = [...new Set(dirs)];
  return unique.filter((dir) => {
    path8.basename(path8.dirname(dir));
    if (path8.basename(dir) === ".next" && unique.some((other) => other === path8.join(dir, "static"))) {
      return false;
    }
    return true;
  });
}
function isRelevantBuildFile(file, buildRoot) {
  const relative = toPosix(path8.relative(buildRoot, file));
  if (path8.basename(buildRoot) === ".next") {
    return relative.startsWith("static/") && !relative.includes("/server/");
  }
  if (path8.basename(buildRoot) === "static" && path8.basename(path8.dirname(buildRoot)) === ".next") {
    return !relative.includes("/server/");
  }
  if (relative.includes("/node_modules/")) return false;
  return /\.(js|mjs|cjs|css)$/i.test(file);
}
function resolveAssetUrl(url, htmlFile, buildRoot, fileSet) {
  const clean = url.replace(/[?#].*$/, "");
  if (!clean || /^(?:https?:)?\/\//i.test(clean) || clean.startsWith("data:")) return void 0;
  const candidates = /* @__PURE__ */ new Set();
  if (clean.startsWith("/")) {
    candidates.add(path8.resolve(buildRoot, `.${clean}`));
  } else {
    candidates.add(path8.resolve(path8.dirname(htmlFile), clean));
    candidates.add(path8.resolve(buildRoot, clean));
  }
  for (const candidate of candidates) {
    if (fileSet.has(path8.normalize(candidate))) return path8.normalize(candidate);
  }
  return void 0;
}
function extractHtmlAssets(html) {
  const scripts = [];
  const styles = [];
  const preloads = [];
  const tagRegex = /<(script|link)\b([^>]*)>/gi;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = (match[1] ?? "").toLowerCase();
    const attrs = match[2] ?? "";
    const src = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const rel = /\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    if (tag === "script" && src) {
      scripts.push(src[1] ?? src[2] ?? src[3] ?? "");
    } else if (tag === "link" && href) {
      const hrefValue = href[1] ?? href[2] ?? href[3] ?? "";
      const relValue = (rel?.[1] ?? rel?.[2] ?? rel?.[3] ?? "").toLowerCase();
      if (relValue.includes("stylesheet")) styles.push(hrefValue);
      else if (relValue.includes("modulepreload") || relValue.includes("preload")) preloads.push(hrefValue);
    }
  }
  return { scripts, styles, preloads };
}
function readJsonSafe(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return void 0;
  }
}
function applyViteManifest(file, buildRoot, assetsByFile, buildAssetByRelative) {
  const manifest = readJsonSafe(file);
  if (!manifest) return void 0;
  const results = [];
  const visited = /* @__PURE__ */ new Set();
  const visit = (key, initial, route) => {
    if (visited.has(`${key}|${initial}`)) return;
    visited.add(`${key}|${initial}`);
    const entry2 = manifest[key];
    if (!entry2) return;
    const keyRoute = key.endsWith(".html") ? routeFromHtml(key) : "/";
    for (const css of entry2.css ?? []) {
      const relative = toPosix(css);
      const asset = buildAssetByRelative.get(relative) ?? assetsByFile.get(path8.resolve(buildRoot, relative));
      if (asset) {
        if (initial) asset.initial = true;
        asset.routes.add(keyRoute);
        results.push({ file: asset.file, initial, routes: [keyRoute], buildRoot });
      }
    }
    if (entry2.file) {
      const relative = toPosix(entry2.file);
      const asset = buildAssetByRelative.get(relative) ?? assetsByFile.get(path8.resolve(buildRoot, relative));
      if (asset) {
        if (initial) asset.initial = true;
        asset.routes.add(keyRoute);
        results.push({ file: asset.file, initial, routes: [keyRoute], buildRoot });
      }
    }
    for (const imported of entry2.imports ?? []) visit(imported, initial);
    for (const dynamic of entry2.dynamicImports ?? []) visit(dynamic, false);
  };
  for (const [key, entry2] of Object.entries(manifest)) {
    if (entry2.isEntry || key.endsWith(".html")) visit(key, true);
  }
  return results;
}
function applyCodeUsageBuildManifest(file, buildRoot, root, assetsByFile, buildAssetByRelative) {
  const manifest = readJsonSafe(file);
  if (!manifest || !Array.isArray(manifest.chunks)) return void 0;
  const results = [];
  const fileAsset = (relative) => {
    const normalized = toPosix(relative).replace(/^\/+/, "");
    return buildAssetByRelative.get(normalized) ?? assetsByFile.get(path8.resolve(buildRoot, normalized));
  };
  const attach = (asset, routes, initial) => {
    if (initial) asset.initial = true;
    for (const route of routes) asset.routes.add(route);
    results.push({ file: asset.file, initial, routes, buildRoot });
  };
  for (const route of manifest.routes ?? []) {
    if (!route.route) continue;
    for (const fileReference of route.files ?? []) {
      const asset = fileAsset(fileReference);
      if (asset) attach(asset, [route.route], route.initial !== false);
    }
  }
  for (const chunk of manifest.chunks) {
    if (!chunk.file) continue;
    const routes = Array.isArray(chunk.routes) ? chunk.routes.filter((route) => route.length > 0) : ["/"];
    const asset = fileAsset(chunk.file);
    if (asset) {
      attach(asset, routes, chunk.initial === true || chunk.entry === true);
      if (asset.modules.length === 0 && Array.isArray(chunk.modules)) {
        asset.modules = chunk.modules.filter((module) => Boolean(module.id)).map((module) => {
          let clean = (module.id ?? "").split("!").pop() ?? module.id ?? "";
          clean = clean.replace(/^webpack:\/\/[^/]*\/?/, "").replace(/[?#].*$/, "");
          const absolute = path8.isAbsolute(clean) ? clean : path8.resolve(root, clean);
          const display = absolute.startsWith(root) ? toPosix(path8.relative(root, absolute)) : clean;
          const packageInfo = packageFromSource(display);
          return {
            sourceFile: display,
            ...packageInfo.packageName ? { packageName: packageInfo.packageName } : {},
            ...packageInfo.version ? { version: packageInfo.version } : {},
            bytes: module.bytes ?? 0,
            mappingSegments: 0
          };
        }).sort((a, b) => b.bytes - a.bytes);
      }
    }
    for (const css of chunk.css ?? []) {
      const cssAsset = fileAsset(css);
      if (cssAsset) attach(cssAsset, routes, chunk.initial === true || chunk.entry === true);
    }
  }
  return results;
}
function applyNextManifest(file, buildRoot, assetsByFile, buildAssetByRelative) {
  const manifest = readJsonSafe(file);
  if (!manifest) return void 0;
  if (!("pages" in manifest) && !("app" in manifest) && !("rootMainFiles" in manifest)) return void 0;
  const results = [];
  const mark = (route, chunks, initial) => {
    for (const chunk of chunks) {
      const candidates = [
        path8.resolve(buildRoot, chunk),
        path8.resolve(buildRoot, "static", chunk),
        path8.resolve(path8.dirname(buildRoot), chunk),
        path8.resolve(path8.dirname(buildRoot), "static", chunk)
      ];
      let asset;
      for (const candidate of candidates) {
        asset = assetsByFile.get(path8.normalize(candidate)) ?? buildAssetByRelative.get(toPosix(path8.relative(buildRoot, candidate)));
        if (asset) break;
      }
      if (!asset) continue;
      if (initial) asset.initial = true;
      asset.routes.add(route);
      results.push({ file: asset.file, initial, routes: [route], buildRoot });
    }
  };
  for (const [route, chunks] of Object.entries(manifest.pages ?? {})) {
    mark(route, chunks, route === "/" || route === "/_app" || route === "/_document");
  }
  for (const [route, chunks] of Object.entries(manifest.pagesChunks ?? {})) {
    mark(route, chunks, route === "/" || route === "/_app");
  }
  for (const [route, chunks] of Object.entries(manifest.app ?? {})) {
    mark(route, chunks, route === "/" || route === "/_app" || route === "/layout");
  }
  mark("/", manifest.rootMainFiles ?? [], true);
  return results;
}
function analyzeBundles(options) {
  const { root, config, detection, signal } = options;
  const warnings = [];
  const buildDirs = discoverBuildDirs(root, config, detection);
  if (buildDirs.length === 0) {
    const report2 = {
      available: false,
      buildDirs: [],
      files: [],
      totals: {
        rawBytes: 0,
        gzipBytes: 0,
        brotliBytes: 0,
        jsRawBytes: 0,
        cssRawBytes: 0,
        initialRawBytes: 0,
        lazyRawBytes: 0
      },
      initialFileIds: [],
      lazyFileIds: [],
      duplicateDependencies: [],
      heavyDependencies: [],
      mappingCoverage: { jsFiles: 0, mappedJsFiles: 0, cssFiles: 0, mappedCssFiles: 0, mappedPercent: 0 },
      notes: ["No build output directory was detected. Build the application or set build.dir to analyze bundles."]
    };
    return { report: report2, findings: [], sourceMapIndexes: [], warnings, cssFiles: [], jsFiles: [] };
  }
  const patterns = buildDirs.map((dir) => `${toPosix(path8.relative(root, dir))}/**/*.{js,mjs,cjs,css}`);
  let discovered = [];
  try {
    discovered = fg.sync(patterns, {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      unique: true,
      dot: true,
      ignore: ["**/*.map", "**/node_modules/**", "**/.git/**"]
    }).map((file) => path8.normalize(file));
  } catch (error) {
    warnings.push(`Build file discovery failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const buildRootFor = (file) => {
    let best = buildDirs[0] ?? root;
    for (const dir of buildDirs) {
      if (file.startsWith(dir) && dir.length > best.length) best = dir;
    }
    return best;
  };
  const assetsByFile = /* @__PURE__ */ new Map();
  const buildAssetByRelative = /* @__PURE__ */ new Map();
  for (const file of discovered) {
    if (signal?.aborted) throw new Error("Bundle analysis aborted");
    const buildRoot = buildRootFor(file);
    if (!isRelevantBuildFile(file, buildRoot)) continue;
    if (assetsByFile.has(file)) continue;
    const type = path8.extname(file).toLowerCase() === ".css" ? "css" : "js";
    let buffer;
    try {
      buffer = readFileSync(file);
    } catch {
      warnings.push(`Could not read build asset ${toPosix(path8.relative(root, file))}.`);
      continue;
    }
    const compressed = compressionSizes(buffer, toPosix(path8.relative(root, file)), warnings);
    const text = buffer.length <= MAX_TEXT_BYTES ? buffer.toString("utf8") : void 0;
    const asset = {
      file,
      relativeToBuild: toPosix(path8.relative(buildRoot, file)),
      buildRoot,
      type,
      rawBytes: buffer.length,
      gzipBytes: compressed.gzip,
      brotliBytes: compressed.brotli,
      initial: false,
      routes: /* @__PURE__ */ new Set(),
      ...text ? { text } : {},
      modules: [],
      notes: []
    };
    if (text) {
      const mapWarnings = [];
      if (config.analysis.sourceMaps && config.sourceMaps.enabled) {
        const index = loadSourceMapFromFile(
          file,
          text,
          root,
          mapWarnings,
          config.sourceMaps.maxMappingsPerFile
        );
        asset.index = index;
        asset.modules = index.attribution;
        warnings.push(...mapWarnings.map((warning) => `${toPosix(path8.relative(root, file))}: ${warning}`));
        if (index.kind !== "none") asset.notes.push(`Source map: ${index.kind}`);
      }
    } else {
      asset.notes.push("Text/source-map analysis skipped because the file is too large.");
    }
    assetsByFile.set(file, asset);
    buildAssetByRelative.set(asset.relativeToBuild, asset);
  }
  const htmlFiles = fg.sync(
    buildDirs.map((dir) => `${toPosix(path8.relative(root, dir))}/**/*.{html,htm}`),
    {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      unique: true,
      dot: true,
      ignore: ["**/node_modules/**"]
    }
  ).map((file) => path8.normalize(file));
  const fileSet = new Set(assetsByFile.keys());
  for (const htmlFile of htmlFiles) {
    const buildRoot = buildRootFor(htmlFile);
    const route = routeFromHtml(toPosix(path8.relative(buildRoot, htmlFile)));
    let html = "";
    try {
      html = readFileSync(htmlFile, "utf8");
    } catch {
      continue;
    }
    const extracted = extractHtmlAssets(html);
    for (const reference of [...extracted.scripts, ...extracted.styles, ...extracted.preloads]) {
      const assetFile = resolveAssetUrl(reference, htmlFile, buildRoot, fileSet);
      if (!assetFile) continue;
      const asset = assetsByFile.get(assetFile);
      if (!asset) continue;
      asset.initial = true;
      asset.routes.add(route);
    }
  }
  let manifestUsed;
  for (const buildRoot of buildDirs) {
    for (const name of [
      "code-usage-map.vite.json",
      "code-usage-map.webpack.json",
      "code-usage-map.manifest.json"
    ]) {
      const candidate = path8.join(buildRoot, name);
      if (!existsSync(candidate)) continue;
      const applied = applyCodeUsageBuildManifest(candidate, buildRoot, root, assetsByFile, buildAssetByRelative);
      if (applied) {
        manifestUsed = candidate;
        break;
      }
    }
    if (manifestUsed) break;
  }
  if (config.build.manifest && existsSync(config.build.manifest)) {
    const manifestDirectory = path8.dirname(config.build.manifest);
    const manifestRoot = buildDirs[0] ?? (path8.basename(manifestDirectory) === ".vite" ? path8.dirname(manifestDirectory) : manifestDirectory);
    const custom = applyCodeUsageBuildManifest(
      config.build.manifest,
      manifestRoot,
      root,
      assetsByFile,
      buildAssetByRelative
    );
    const vite = custom ? void 0 : applyViteManifest(config.build.manifest, manifestRoot, assetsByFile, buildAssetByRelative);
    const next = custom || vite ? void 0 : applyNextManifest(config.build.manifest, manifestRoot, assetsByFile, buildAssetByRelative);
    if (custom || vite || next) manifestUsed = config.build.manifest;
  }
  for (const buildRoot of buildDirs) {
    if (manifestUsed) break;
    const manifests = [
      path8.join(buildRoot, ".vite", "manifest.json"),
      path8.join(buildRoot, "manifest.json"),
      path8.join(buildRoot, "build-manifest.json"),
      path8.join(buildRoot, "app-build-manifest.json"),
      path8.join(path8.dirname(buildRoot), ".next", "build-manifest.json"),
      path8.join(path8.dirname(buildRoot), ".next", "app-build-manifest.json")
    ].filter((file) => existsSync(file));
    for (const manifest of manifests) {
      const vite = applyViteManifest(manifest, buildRoot, assetsByFile, buildAssetByRelative);
      const next = vite ? void 0 : applyNextManifest(manifest, buildRoot, assetsByFile, buildAssetByRelative);
      if (vite || next) {
        manifestUsed = manifest;
        break;
      }
    }
    if (manifestUsed) break;
  }
  const initialQueue = [...assetsByFile.values()].filter((asset) => asset.initial && asset.type === "js");
  const initialVisited = /* @__PURE__ */ new Set();
  while (initialQueue.length > 0) {
    const asset = initialQueue.shift();
    if (!asset || !asset.text || initialVisited.has(asset.file)) continue;
    initialVisited.add(asset.file);
    const importRegex = /\b(?:import|export)\s*(?:[^'"();]*?\bfrom\s*)?["']([^"']+)["']/g;
    let imported;
    while ((imported = importRegex.exec(asset.text)) !== null) {
      const specifier = imported[1];
      if (!specifier || !specifier.startsWith(".")) continue;
      const clean = specifier.replace(/[?#].*$/, "");
      const targetFile = path8.resolve(path8.dirname(asset.file), clean);
      const target = assetsByFile.get(path8.normalize(targetFile)) ?? buildAssetByRelative.get(toPosix(path8.relative(asset.buildRoot, targetFile)));
      if (!target || initialVisited.has(target.file)) continue;
      target.initial = true;
      for (const route of asset.routes) target.routes.add(route);
      if (target.type === "js") initialQueue.push(target);
    }
  }
  const files = [...assetsByFile.values()].map((asset) => {
    const index = asset.index;
    const mappedBytes = index?.mappedBytes ?? 0;
    const relativePath = toPosix(path8.relative(root, asset.file));
    return {
      id: `b_${hashString(relativePath, 12)}`,
      file: asset.file,
      relativePath,
      type: asset.type,
      rawBytes: asset.rawBytes,
      gzipBytes: asset.gzipBytes,
      brotliBytes: asset.brotliBytes,
      initial: asset.initial,
      routes: [...asset.routes].sort(),
      ...index?.sourceMapFile ? { sourceMapFile: index.sourceMapFile } : {},
      ...index ? { sourceMapKind: index.kind } : {},
      mapped: Boolean(index && index.kind !== "none"),
      mappedBytes,
      unmappedBytes: Math.max(0, asset.rawBytes - mappedBytes),
      modules: asset.modules,
      notes: [
        ...asset.notes,
        ...index?.warnings ?? [],
        ...index && index.kind === "none" ? ["No source map found."] : []
      ]
    };
  }).sort((a, b) => b.rawBytes - a.rawBytes);
  const initialFiles = files.filter((file) => file.initial);
  const lazyFiles = files.filter((file) => !file.initial);
  const jsFiles = files.filter((file) => file.type === "js");
  const cssFiles = files.filter((file) => file.type === "css");
  const mappedJs = jsFiles.filter((file) => file.mapped).length;
  const mappedCss = cssFiles.filter((file) => file.mapped).length;
  const totals = {
    rawBytes: files.reduce((sum, file) => sum + file.rawBytes, 0),
    gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
    brotliBytes: files.reduce((sum, file) => sum + file.brotliBytes, 0),
    jsRawBytes: jsFiles.reduce((sum, file) => sum + file.rawBytes, 0),
    cssRawBytes: cssFiles.reduce((sum, file) => sum + file.rawBytes, 0),
    initialRawBytes: initialFiles.reduce((sum, file) => sum + file.rawBytes, 0),
    lazyRawBytes: lazyFiles.reduce((sum, file) => sum + file.rawBytes, 0)
  };
  const packages = /* @__PURE__ */ new Map();
  for (const file of files) {
    for (const module of file.modules) {
      if (!module.packageName) continue;
      const current = packages.get(module.packageName) ?? { bytes: 0, files: /* @__PURE__ */ new Set(), versions: /* @__PURE__ */ new Set() };
      current.bytes += module.bytes;
      current.files.add(file.relativePath);
      if (module.version) current.versions.add(module.version);
      packages.set(module.packageName, current);
    }
  }
  const duplicateDependencies = [...packages.entries()].filter(([, info]) => info.versions.size > 1).map(([packageName, info]) => ({
    packageName,
    versions: [...info.versions].sort(),
    locations: [...info.files],
    source: "source-map"
  }));
  const heavyDependencies = [...packages.entries()].map(([packageName, info]) => ({
    packageName,
    bytes: info.bytes,
    files: [...info.files]
  })).sort((a, b) => b.bytes - a.bytes).slice(0, 12);
  const findings = [];
  for (const dependency of heavyDependencies.slice(0, 6)) {
    if (dependency.bytes < 4e4) continue;
    const file = files.find((candidate) => candidate.type === "js" && dependency.files.includes(candidate.relativePath));
    if (!file) continue;
    findings.push(
      createFinding({
        root,
        category: "heavy-dependency",
        status: "unknown",
        confidence: "high",
        title: `Heavy dependency "${dependency.packageName}" (${Math.round(dependency.bytes / 1024)} KB attributed)`,
        description: "Source-map attribution places this package in the JS bundle. Attribution is approximate and may include shared runtime helpers. Use bundle analysis and runtime coverage before choosing a replacement.",
        file: file.file,
        line: 1,
        column: 1,
        symbol: dependency.packageName,
        symbolKind: "dependency",
        dependency: {
          packageName: dependency.packageName,
          dependencyType: "dependency",
          reason: "Source-map module attribution exceeds the heavy-dependency threshold."
        },
        size: {
          bundleAttributedBytes: dependency.bytes,
          basis: "Approximate mapped bundle bytes; overlapping attribution is not additive with other findings."
        },
        evidence: [
          {
            kind: "source-map",
            description: `Attributed across: ${dependency.files.join(", ")}.`,
            file: file.relativePath,
            line: 1
          }
        ],
        tags: ["dependency", "bundle", "heavy"],
        fingerprintSuffix: dependency.packageName
      })
    );
  }
  for (const duplicate of duplicateDependencies) {
    const file = files.find((candidate) => duplicate.locations.includes(candidate.relativePath));
    if (!file) continue;
    findings.push(
      createFinding({
        root,
        category: "duplicate-dependency",
        status: "unknown",
        confidence: "medium",
        title: `Multiple bundled versions of "${duplicate.packageName}"`,
        description: `Source maps show versions ${duplicate.versions.join(", ")} in the build. Deduplicate versions to reduce bundle weight.`,
        file: file.file,
        line: 1,
        column: 1,
        symbol: duplicate.packageName,
        symbolKind: "dependency",
        dependency: {
          packageName: duplicate.packageName,
          dependencyType: "dependency",
          versions: duplicate.versions,
          reason: "Multiple versions appear in bundle source-map attribution."
        },
        size: {},
        evidence: [
          {
            kind: "source-map",
            description: `Bundle files: ${duplicate.locations.join(", ")}.`,
            file: file.relativePath,
            line: 1
          }
        ],
        tags: ["dependency", "duplicate", "bundle"],
        fingerprintSuffix: `bundle|${duplicate.versions.join("|")}`
      })
    );
  }
  if (files.length === 0) {
    warnings.push("Build directories were found but no JavaScript or CSS assets matched.");
  }
  if (initialFiles.length === 0 && files.length > 0) {
    warnings.push(
      "Initial/lazy asset classification was unavailable (no entry HTML or supported manifest). Set build.dir or provide an entry manifest."
    );
  }
  const report = {
    available: files.length > 0,
    buildDirs,
    files,
    totals,
    initialFileIds: initialFiles.map((file) => file.id),
    lazyFileIds: lazyFiles.map((file) => file.id),
    duplicateDependencies,
    heavyDependencies,
    mappingCoverage: {
      jsFiles: jsFiles.length,
      mappedJsFiles: mappedJs,
      cssFiles: cssFiles.length,
      mappedCssFiles: mappedCss,
      mappedPercent: jsFiles.length + cssFiles.length > 0 ? Math.round((mappedJs + mappedCss) / (jsFiles.length + cssFiles.length) * 1e3) / 10 : 0
    },
    ...manifestUsed ? { manifestUsed } : {},
    notes: [
      "Gzip uses level 9 and Brotli uses quality 9; measured values can differ from CDN defaults.",
      "Module byte attribution is approximate: each mapping segment spans generated code and does not represent guaranteed removable bytes.",
      "Initial/lazy classification comes from entry HTML and supported Vite/Next manifests. Unknown assets remain classified as lazy.",
      "Total raw/gzip/Brotli sizes are disjoint file sizes. Module and finding estimates are overlapping and must not be summed."
    ]
  };
  return {
    report,
    findings,
    sourceMapIndexes: [...assetsByFile.values()].map((asset) => asset.index).filter((index) => index !== void 0 && index.kind !== "none"),
    warnings: [...new Set(warnings)],
    cssFiles: cssFiles.map((file) => file.file),
    jsFiles: jsFiles.map((file) => file.file)
  };
}

// src/runtime/types.ts
var RUNTIME_SESSION_SCHEMA = 1;

// src/runtime/store.ts
function runtimeDirectory(root) {
  return path8.join(root, ".code-usage-map", "runtime");
}
function saveRuntimeSession(root, session) {
  const dir = ensureDir(runtimeDirectory(root));
  const safeStamp = session.startedAt.replace(/[^0-9A-Za-z]/g, "-");
  const file = path8.join(dir, `${safeStamp}-${session.id}.json`);
  writeTextFile(file, `${JSON.stringify(session)}
`);
  return file;
}
function loadRuntimeSessions(root, signal) {
  const dir = runtimeDirectory(root);
  const warnings = [];
  const sessions = [];
  if (!existsSync(dir)) return { sessions, warnings };
  let entries = [];
  try {
    entries = readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
  } catch {
    return { sessions, warnings: [`Could not read runtime sessions from ${dir}.`] };
  }
  for (const name of entries) {
    if (signal?.aborted) break;
    const file = path8.join(dir, name);
    try {
      const session = readJsonFile(file);
      if (session.schemaVersion !== RUNTIME_SESSION_SCHEMA) {
        warnings.push(`Skipped runtime session with unsupported schema: ${name}.`);
        continue;
      }
      if (!Array.isArray(session.visits)) {
        warnings.push(`Skipped malformed runtime session: ${name}.`);
        continue;
      }
      sessions.push(session);
    } catch (error) {
      warnings.push(`Skipped unreadable runtime session ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return { sessions, warnings };
}
function clearRuntimeSessions(root) {
  const dir = runtimeDirectory(root);
  if (!existsSync(dir)) return 0;
  let removed = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    try {
      unlinkSync(path8.join(dir, name));
      removed += 1;
    } catch {
    }
  }
  return removed;
}

// src/runtime/merge.ts
function coverageKey(entry2) {
  return `${entry2.url}|${entry2.startOffset}|${entry2.endOffset}|${entry2.functionName}`;
}
function mergeRuntimeSessions(sessions, warnings = []) {
  const routes = /* @__PURE__ */ new Map();
  const sessionIdsByRoute = /* @__PURE__ */ new Map();
  const sessionCoverage = {
    available: false,
    functions: [],
    scripts: []
  };
  const sessionWarnings = [...warnings];
  const baseUrls = new Set(sessions.map((session) => session.baseUrl));
  if (baseUrls.size > 1) {
    sessionWarnings.push(
      "Runtime sessions were collected from multiple base URLs. Route data is merged by path; verify that the builds are comparable."
    );
  }
  const getRoute = (route, name) => {
    const existing = routes.get(route);
    if (existing) {
      if (name) existing.names.add(name);
      return existing;
    }
    const created = {
      route,
      names: new Set(name ? [name] : []),
      paths: /* @__PURE__ */ new Set([route]),
      sessions: 0,
      scripts: /* @__PURE__ */ new Set(),
      resources: [],
      selectors: /* @__PURE__ */ new Map(),
      domClasses: /* @__PURE__ */ new Set(),
      domIds: /* @__PURE__ */ new Set(),
      domTags: /* @__PURE__ */ new Set(),
      stylesheets: /* @__PURE__ */ new Set(),
      interactions: 0,
      dynamicCss: [],
      coverage: { available: false, functions: [], scripts: [] },
      warnings: /* @__PURE__ */ new Set()
    };
    routes.set(route, created);
    return created;
  };
  const addCoverage = (target, coverage) => {
    if (!coverage.available) return;
    target.available = true;
    for (const fn of coverage.functions) {
      const key = coverageKey(fn);
      if (target.functions.some((existing) => coverageKey(existing) === key)) continue;
      target.functions.push(fn);
    }
    for (const script of coverage.scripts) {
      const existing = target.scripts.find((item) => item.url === script.url);
      if (existing) {
        existing.totalFunctions += script.totalFunctions;
        existing.executedFunctions += script.executedFunctions;
        existing.totalFunctionBytes += script.totalFunctionBytes;
        existing.executedFunctionBytes += script.executedFunctionBytes;
      } else {
        target.scripts.push({ ...script });
      }
    }
  };
  for (const session of sessions) {
    for (const visit of session.visits) {
      const routeKeys = visit.snapshot.routes.length > 0 ? visit.snapshot.routes.map((route) => route.route) : [visit.route];
      const routeSet = new Set(routeKeys);
      routeSet.add(visit.route);
      const seenSessions = sessionIdsByRoute.get(visit.route) ?? /* @__PURE__ */ new Set();
      for (const routeKey of routeSet) {
        const route = getRoute(routeKey, visit.name);
        route.paths.add(visit.route);
        for (const path27 of visit.snapshot.routes.map((item) => item.route)) route.paths.add(path27);
        if (!seenSessions.has(session.id)) {
          route.sessions += 1;
          seenSessions.add(session.id);
          sessionIdsByRoute.set(visit.route, seenSessions);
        }
        route.interactions += visit.snapshot.routes.filter((item) => item.route === routeKey).reduce((sum, item) => sum + item.interactions.length, 0);
        for (const warning of visit.warnings) route.warnings.add(warning);
      }
      for (const snapshotRoute of visit.snapshot.routes) {
        const route = getRoute(snapshotRoute.route, visit.name);
        for (const selector of snapshotRoute.selectors) {
          const existing = route.selectors.get(selector.selector);
          if (existing) {
            for (const sheet of selector.sheets) existing.sheets.add(sheet);
            existing.matchedElements = Math.max(existing.matchedElements, selector.matchedElements);
            existing.stateOnly = existing.stateOnly && selector.stateOnly;
            for (const media of selector.media) existing.media.add(media);
            existing.mediaActive = existing.mediaActive || selector.mediaActive;
            if (!existing.ruleText && selector.ruleText) existing.ruleText = selector.ruleText;
          } else {
            route.selectors.set(selector.selector, {
              selector: selector.selector,
              sheets: new Set(selector.sheets),
              matchedElements: selector.matchedElements,
              stateOnly: selector.stateOnly,
              media: new Set(selector.media),
              mediaActive: selector.mediaActive,
              ...selector.ruleText ? { ruleText: selector.ruleText } : {}
            });
          }
        }
        for (const token of snapshotRoute.dom.classes) route.domClasses.add(token);
        for (const token of snapshotRoute.dom.ids) route.domIds.add(token);
        for (const token of snapshotRoute.dom.tags) route.domTags.add(token);
        for (const stylesheet of snapshotRoute.stylesheets) route.stylesheets.add(stylesheet);
        for (const script of snapshotRoute.scripts) route.scripts.add(script);
        for (const resource of snapshotRoute.resources) {
          const existing = route.resources.find((item) => item.url === resource.url);
          if (existing) existing.bytes = Math.max(existing.bytes, resource.bytes);
          else route.resources.push({ url: resource.url, type: resource.type, bytes: resource.bytes });
        }
        for (const dynamic of snapshotRoute.dynamicCss) {
          if (!route.dynamicCss.includes(dynamic.text) && route.dynamicCss.length < 200) route.dynamicCss.push(dynamic.text);
        }
      }
      if (visit.coverage) {
        const route = getRoute(visit.route, visit.name);
        addCoverage(route.coverage, visit.coverage);
      }
    }
    if (session.coverageSession) {
      addCoverage(sessionCoverage, session.coverageSession);
    }
    for (const warning of session.warnings) sessionWarnings.push(warning);
  }
  for (const route of routes.values()) {
    route.resources.sort((a, b) => a.url.localeCompare(b.url));
    route.scripts = new Set(route.scripts);
  }
  return {
    sessions,
    routes,
    sessionCoverage,
    warnings: [...new Set(sessionWarnings)]
  };
}
var UNMATCHED_LIMIT = 300;
var MATCHED_LIMIT = 300;
var MODULE_LIMIT = 500;
var MAX_FINDINGS = 100;
function normalizeSelector2(selector) {
  return selector.replace(/\s+/g, " ").replace(/\s*([>+~,])\s*/g, "$1").trim();
}
function classesInSelector(selector) {
  return [...new Set([...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1] ?? "").filter(Boolean))];
}
function idsInSelector(selector) {
  return [...new Set([...selector.matchAll(/#([A-Za-z_][\w-]*)/g)].map((match) => match[1] ?? "").filter(Boolean))];
}
function tokenCorrelates(sourceToken, runtimeToken) {
  if (sourceToken === runtimeToken) return true;
  if (runtimeToken.startsWith(`${sourceToken}__`) || runtimeToken.startsWith(`${sourceToken}_`)) return true;
  if (runtimeToken.startsWith(`${sourceToken}-`)) return true;
  const boundary = new RegExp(`(?:^|[_-])${sourceToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[_-]|$)`);
  return boundary.test(runtimeToken);
}
function selectorsCorrelate(sourceSelector, runtimeSelector) {
  const source = normalizeSelector2(sourceSelector);
  const runtime = normalizeSelector2(runtimeSelector);
  if (source === runtime) return true;
  const sourceClasses = classesInSelector(source);
  const sourceIds = idsInSelector(source);
  if (sourceClasses.length === 0 && sourceIds.length === 0) return false;
  const runtimeClasses = classesInSelector(runtime);
  const runtimeIds = idsInSelector(runtime);
  const classesMatch = sourceClasses.every(
    (token) => runtimeClasses.some((runtimeToken) => tokenCorrelates(token, runtimeToken))
  );
  const idsMatch = sourceIds.every((token) => runtimeIds.includes(token));
  return classesMatch && idsMatch;
}
function stripQuery2(url) {
  return url.replace(/[?#].*$/, "");
}
function pathnameOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return void 0;
  }
}
function routeInputPath(input) {
  let routePath;
  let name;
  if (typeof input === "string") routePath = input;
  else {
    routePath = input.path;
    name = input.name;
    if (!routePath && input.url) {
      try {
        const url = new URL(input.url);
        routePath = /^#\//.test(url.hash) ? url.hash.slice(1) : url.pathname;
      } catch {
        routePath = input.url;
      }
    }
  }
  if (!routePath) return void 0;
  let id = routePath;
  if (/^https?:\/\//i.test(id)) {
    try {
      const url = new URL(id);
      id = /^#\//.test(url.hash) ? url.hash.slice(1) : url.pathname;
    } catch {
    }
  }
  if (!id.startsWith("/")) id = `/${id}`;
  if (id.length > 1) id = id.replace(/\/+$/, "");
  return { id: id || "/", name: name ?? id };
}
function routeKind(routeCount, usedLinkNavigation, htmlRouteCount, detection) {
  if (htmlRouteCount > 1) return "mpa";
  if (usedLinkNavigation) return "spa";
  const spaFrameworks = /* @__PURE__ */ new Set([
    "React",
    "Vue",
    "Angular",
    "Svelte",
    "Solid",
    "Preact",
    "Next.js",
    "Nuxt",
    "Astro"
  ]);
  if (detection.frameworks.some((framework) => spaFrameworks.has(framework.name)) && routeCount > 1) return "spa";
  if (routeCount > 0) return "manual";
  return "unknown";
}
function analyzeRoutes(input) {
  const { root, config, detection, bundle, css, runtime, signal } = input;
  const warnings = [];
  const findings = input.findings;
  const routes = /* @__PURE__ */ new Map();
  const spaRuntime = runtime.sessions.some((session) => {
    if (session.visits.length < 2) return false;
    const origins = new Set(session.visits.map((visit) => visit.snapshot.timeOrigin));
    return origins.size === 1;
  });
  const executedGlobal = [];
  const executedByRoute = /* @__PURE__ */ new Map();
  const executedFilesGlobal = /* @__PURE__ */ new Map();
  const executedFilesByRoute = /* @__PURE__ */ new Map();
  const executedScriptsByRoute = /* @__PURE__ */ new Map();
  const executedScriptsGlobal = /* @__PURE__ */ new Set();
  const bundleJsByUrl = /* @__PURE__ */ new Map();
  const bundleCssByUrl = /* @__PURE__ */ new Map();
  const bundleFileByPath = /* @__PURE__ */ new Map();
  for (const file of bundle.report.files) {
    bundleFileByPath.set(path8.normalize(file.file), file);
    const relative = file.relativePath.replace(/^\/+/, "");
    if (file.type === "js") {
      bundleJsByUrl.set(relative, file);
      bundleJsByUrl.set(path8.basename(relative), file);
    } else {
      bundleCssByUrl.set(relative, file);
      bundleCssByUrl.set(path8.basename(relative), file);
    }
  }
  const sourceMapIndexByFile = new Map(
    bundle.sourceMapIndexes.map((index) => [path8.normalize(index.generatedFile), index])
  );
  function bundleFileForUrl(url, type) {
    if (url.startsWith("inline:") || url.startsWith("style:") || url.startsWith("adopted:")) return void 0;
    const pathname = pathnameOf(url);
    if (!pathname) return void 0;
    const normalizedPath = decodeURIComponent(pathname).replace(/^\/+/, "");
    if (type === "js") {
      const direct = bundleJsByUrl.get(normalizedPath);
      if (direct) return direct;
      for (const [key, file] of bundleJsByUrl) {
        if (normalizedPath.endsWith(`/${key}`) || normalizedPath.endsWith(key)) return file;
      }
    } else {
      const direct = bundleCssByUrl.get(normalizedPath);
      if (direct) return direct;
      for (const [key, file] of bundleCssByUrl) {
        if (normalizedPath.endsWith(`/${key}`) || normalizedPath.endsWith(key)) return file;
      }
    }
    return void 0;
  }
  function addExecuted(executed, route) {
    executedGlobal.push(executed);
    if (route) {
      const list = executedByRoute.get(route) ?? [];
      list.push(executed);
      executedByRoute.set(route, list);
      const routeFiles = executedFilesByRoute.get(route) ?? /* @__PURE__ */ new Map();
      const set = routeFiles.get(executed.relativeFile) ?? /* @__PURE__ */ new Set();
      set.add(route);
      routeFiles.set(executed.relativeFile, set);
      executedFilesByRoute.set(route, routeFiles);
    }
    const global = executedFilesGlobal.get(executed.relativeFile) ?? /* @__PURE__ */ new Set();
    if (route) global.add(route);
    executedFilesGlobal.set(executed.relativeFile, global);
  }
  function processCoverage(route, coverage) {
    for (const script of coverage.scripts) {
      const url = stripQuery2(script.url);
      if (route) {
        const set = executedScriptsByRoute.get(route) ?? /* @__PURE__ */ new Set();
        if (script.executedFunctions > 0) set.add(url);
        executedScriptsByRoute.set(route, set);
      }
      if (script.executedFunctions > 0) executedScriptsGlobal.add(url);
    }
    for (const fn of coverage.functions) {
      const url = stripQuery2(fn.url);
      if (route) {
        const set = executedScriptsByRoute.get(route) ?? /* @__PURE__ */ new Set();
        set.add(url);
        executedScriptsByRoute.set(route, set);
      }
      executedScriptsGlobal.add(url);
      const file = bundleFileForUrl(url, "js");
      if (!file) continue;
      const index = sourceMapIndexByFile.get(path8.normalize(file.file));
      if (!index) continue;
      const start = mapGeneratedToOriginal(index, fn.startLine, Math.max(0, fn.startColumn - 1), root);
      if (!start) continue;
      const end = mapGeneratedToOriginal(index, fn.endLine, Math.max(0, fn.endColumn - 1), root);
      const sourceFile = start.source.file;
      const relativeFile = sourceFile ? relativePosix(root, sourceFile) : start.source.display;
      addExecuted(
        {
          ...sourceFile ? { file: sourceFile } : {},
          relativeFile,
          startLine: start.line,
          endLine: end?.line ?? start.line,
          functionName: fn.functionName,
          bytes: fn.bytes,
          ...route ? { route } : {}
        },
        route
      );
    }
  }
  for (const [route, merged] of runtime.routes) {
    processCoverage(route, merged.coverage);
  }
  if (runtime.sessionCoverage.available) {
    processCoverage(void 0, runtime.sessionCoverage);
  }
  if (runtime.sessions.length > 0 && runtime.sessionCoverage.available) {
    warnings.push(
      "Interactive session coverage is session-level; route-specific execution is available for automated route visits."
    );
  }
  const runtimeSelectors = /* @__PURE__ */ new Map();
  const domClasses = /* @__PURE__ */ new Set();
  for (const [route, merged] of runtime.routes) {
    for (const selector of merged.selectors.keys()) {
      const set = runtimeSelectors.get(selector) ?? /* @__PURE__ */ new Set();
      set.add(route);
      runtimeSelectors.set(selector, set);
    }
    for (const token of merged.domClasses) domClasses.add(token);
  }
  const sourceSelectorIndex = /* @__PURE__ */ new Map();
  for (const selector of css.selectors) {
    const key = normalizeSelector2(selector.selector);
    const list = sourceSelectorIndex.get(key) ?? [];
    list.push(selector);
    sourceSelectorIndex.set(key, list);
  }
  function findSourceSelector(runtimeSelector, preferredFiles) {
    const exact = sourceSelectorIndex.get(normalizeSelector2(runtimeSelector));
    if (exact) {
      if (preferredFiles && preferredFiles.size > 0) {
        const preferred = exact.find((item) => preferredFiles.has(item.file) || preferredFiles.has(item.relativeFile));
        if (preferred) return preferred;
      }
      return exact[0];
    }
    let best;
    let bestScore = 0;
    for (const candidate of css.selectors) {
      if (!selectorsCorrelate(candidate.selector, runtimeSelector)) continue;
      let score = 1;
      if (preferredFiles?.has(candidate.file) || preferredFiles?.has(candidate.relativeFile)) score += 10;
      if (candidate.classes.length > 0) score += candidate.classes.length;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  }
  function findCssInJsSource(runtimeSelector, ruleText, sheets) {
    if (!sheets.some((sheet) => sheet.startsWith("style:") || sheet.startsWith("inline:") || sheet.startsWith("adopted:"))) {
      return void 0;
    }
    for (const block of css.cssInJsBlocks) {
      for (const selector of block.selectors) {
        if (selectorsCorrelate(selector.selector, runtimeSelector)) {
          return {
            file: block.file,
            relativeFile: block.relativeFile,
            line: selector.line,
            column: selector.column,
            selector: selector.selector
          };
        }
      }
    }
    const runtimeKey = declarationKeyFromRuleText(ruleText ?? "");
    if (!runtimeKey) return void 0;
    for (const block of css.cssInJsBlocks) {
      const keys = [block.declarationKey, ...block.selectors.map((selector) => selector.declarationKey)];
      if (!keys.includes(runtimeKey)) continue;
      return {
        file: block.file,
        relativeFile: block.relativeFile,
        line: block.startLine,
        column: 1,
        selector: runtimeSelector
      };
    }
    return void 0;
  }
  const cssSelectorsByBundleFileCache = /* @__PURE__ */ new Map();
  function parseBundleCss(file) {
    const cached = cssSelectorsByBundleFileCache.get(file.file);
    if (cached) return cached;
    const result = [];
    let text = "";
    try {
      text = readFileSync(file.file, "utf8");
    } catch {
      cssSelectorsByBundleFileCache.set(file.file, result);
      return result;
    }
    const index = sourceMapIndexByFile.get(path8.normalize(file.file));
    const seen = /* @__PURE__ */ new Set();
    try {
      const parsedRoot = postcss.parse(text, { from: file.file });
      const walk = (node, parents, media) => {
        if (result.length >= 2e4) return;
        if (node.type === "atrule") {
          const atRule = node;
          if (/keyframes$/i.test(atRule.name)) return;
          const nextMedia = atRule.name === "media" ? [...media, atRule.params] : media;
          for (const child of atRule.nodes ?? []) walk(child, parents, nextMedia);
          return;
        }
        if (node.type !== "rule") return;
        const rule = node;
        const parts = postcss.list.comma(rule.selector);
        const combined = [];
        for (const part of parts) {
          const children = parents.length > 0 ? parents.map((parent) => part.includes("&") ? part.replaceAll("&", parent) : `${parent} ${part}`) : [part];
          combined.push(...children);
        }
        for (const selector of combined) {
          const normalized = normalizeSelector2(selector);
          if (!normalized || seen.has(normalized)) continue;
          seen.add(normalized);
          const start = rule.source?.start;
          if (!start) continue;
          let sourceFile;
          let sourceLine;
          let sourceColumn;
          let sourceRelative;
          if (index) {
            const mapped = mapGeneratedToOriginal(index, start.line, Math.max(0, start.column - 1), root);
            if (mapped) {
              sourceFile = mapped.source.file;
              sourceRelative = mapped.source.display;
              sourceLine = mapped.line;
              sourceColumn = mapped.column;
            }
          }
          result.push({
            selector: selector.trim(),
            line: start.line,
            column: start.column,
            bytes: Buffer.byteLength(selector, "utf8"),
            media,
            ...sourceFile ? { sourceFile } : {},
            ...sourceLine ? { sourceLine } : {},
            ...sourceColumn ? { sourceColumn } : {},
            ...sourceRelative ? { sourceRelative } : {}
          });
        }
        const nextParents = combined;
        for (const child of rule.nodes ?? []) walk(child, nextParents, media);
      };
      for (const node of parsedRoot.nodes) walk(node, [], []);
    } catch {
      warnings.push(`Could not parse built CSS ${file.relativePath} for route-level CSS analysis.`);
    }
    cssSelectorsByBundleFileCache.set(file.file, result);
    return result;
  }
  function getRoute(id) {
    const existing = routes.get(id);
    if (existing) return existing;
    const created = {
      id,
      names: /* @__PURE__ */ new Set([id]),
      kind: "unknown",
      source: "static",
      sessions: 0,
      assetsJs: [],
      assetsCss: [],
      modules: [],
      matchedSelectors: [],
      matchedKeys: /* @__PURE__ */ new Set(),
      routeExclusiveSelectors: [],
      unmatchedSelectors: [],
      unmatchedCount: 0,
      unmatchedBytes: 0,
      stylesheets: [],
      notes: [],
      cssLoadedFiles: [],
      jsLoadedFiles: []
    };
    routes.set(id, created);
    return created;
  }
  function preferredSourceFilesForSheets(sheets) {
    const files = /* @__PURE__ */ new Set();
    for (const sheet of sheets) {
      const bundleFile = bundleFileForUrl(sheet, "css");
      if (!bundleFile) continue;
      for (const module of bundleFile.modules) {
        files.add(module.sourceFile);
        if (!module.sourceFile.startsWith("node_modules/")) files.add(`/${module.sourceFile}`);
      }
    }
    return files;
  }
  function runtimeUrlForFile(file) {
    return file.relativePath;
  }
  function fallbackCssFiles(route, id) {
    const routed = bundle.report.files.filter((file) => file.type === "css" && file.routes.includes(id));
    if (routed.length > 0) return routed;
    if (!route) return bundle.report.files.filter((file) => file.type === "css" && file.initial);
    return bundle.report.files.filter((file) => file.type === "css" && file.initial);
  }
  function fallbackJsFiles(route, id) {
    const routed = bundle.report.files.filter((file) => file.type === "js" && file.routes.includes(id));
    if (routed.length > 0) return routed;
    if (!route) return bundle.report.files.filter((file) => file.type === "js" && file.initial);
    return bundle.report.files.filter((file) => file.type === "js" && file.initial);
  }
  for (const [routeId, merged] of runtime.routes) {
    const raw = getRoute(routeId);
    raw.source = "runtime";
    raw.sessions = Math.max(raw.sessions, merged.sessions);
    for (const name of merged.names) if (name) raw.names.add(name);
    const cssUrls = /* @__PURE__ */ new Set();
    const jsUrls = /* @__PURE__ */ new Set();
    for (const resource of merged.resources) {
      if (resource.type === "css") cssUrls.add(stripQuery2(resource.url));
      if (resource.type === "js") jsUrls.add(stripQuery2(resource.url));
    }
    for (const stylesheet of merged.stylesheets) {
      if (!stylesheet.startsWith("inline:") && !stylesheet.startsWith("style:") && !stylesheet.startsWith("adopted:")) {
        cssUrls.add(stripQuery2(stylesheet));
      }
    }
    for (const script of merged.scripts) jsUrls.add(stripQuery2(script));
    for (const selector of merged.selectors.values()) {
      for (const sheet of selector.sheets) {
        if (!sheet.startsWith("inline:") && !sheet.startsWith("style:") && !sheet.startsWith("adopted:")) {
          cssUrls.add(stripQuery2(sheet));
        }
      }
    }
    const jsFiles = /* @__PURE__ */ new Map();
    for (const url of jsUrls) {
      const file = bundleFileForUrl(url, "js");
      if (file) jsFiles.set(path8.normalize(file.file), file);
      raw.assetsJs.push({
        url,
        ...file ? { bundleFile: file.file, bytes: merged.resources.find((item) => stripQuery2(item.url) === url)?.bytes || file.rawBytes } : {},
        executed: executedScriptsByRoute.get(routeId)?.has(url) ?? false,
        status: executedScriptsByRoute.get(routeId)?.has(url) ? "executed" : merged.coverage.available ? "not-observed" : "unknown",
        sourceModules: file?.modules.map((module) => module.sourceFile) ?? []
      });
    }
    if (jsFiles.size === 0) {
      for (const file of fallbackJsFiles(merged, routeId)) {
        jsFiles.set(path8.normalize(file.file), file);
        const url = runtimeUrlForFile(file);
        if (!raw.assetsJs.some((asset) => asset.url === url)) {
          raw.assetsJs.push({
            url,
            bundleFile: file.file,
            bytes: file.rawBytes,
            executed: false,
            status: "unknown",
            sourceModules: file.modules.map((module) => module.sourceFile)
          });
        }
      }
    }
    if (spaRuntime) {
      for (const file of bundle.report.files) {
        if (file.type === "js" && file.initial) jsFiles.set(path8.normalize(file.file), file);
      }
    }
    const cssFiles = /* @__PURE__ */ new Map();
    for (const url of cssUrls) {
      const file = bundleFileForUrl(url, "css");
      if (file) cssFiles.set(path8.normalize(file.file), file);
      else {
        raw.assetsCss.push({
          url,
          bytes: merged.resources.find((item) => stripQuery2(item.url) === url)?.bytes ?? 0,
          executed: false,
          status: "unknown",
          sourceModules: []
        });
      }
      raw.stylesheets.push(url);
    }
    if (spaRuntime) {
      for (const file of bundle.report.files) {
        if (file.type === "css" && file.initial) cssFiles.set(path8.normalize(file.file), file);
      }
    } else if (cssFiles.size === 0) {
      for (const file of fallbackCssFiles(merged, routeId)) {
        cssFiles.set(path8.normalize(file.file), file);
        const url = runtimeUrlForFile(file);
        if (!raw.stylesheets.includes(url)) raw.stylesheets.push(url);
      }
    }
    raw.cssLoadedFiles = [...cssFiles.values()].map((file) => file.relativePath);
    raw.jsLoadedFiles = [...jsFiles.values()].map((file) => file.relativePath);
    for (const [url, file] of [...jsFiles]) {
      if (!raw.assetsJs.some((asset) => asset.url === url || asset.bundleFile === file.file)) {
        raw.assetsJs.push({
          url,
          bundleFile: file.file,
          bytes: file.rawBytes,
          executed: false,
          status: "unknown",
          sourceModules: file.modules.map((module) => module.sourceFile)
        });
      }
    }
    const executedCss = /* @__PURE__ */ new Set();
    for (const selector of merged.selectors.values()) {
      for (const sheet of selector.sheets) executedCss.add(stripQuery2(sheet));
    }
    for (const file of cssFiles.values()) {
      const url = runtimeUrlForFile(file);
      if (raw.assetsCss.some((asset) => asset.url === url || asset.bundleFile === file.file)) continue;
      const urlMatch = [...cssUrls].find((candidate) => bundleFileForUrl(candidate, "css")?.file === file.file);
      raw.assetsCss.push({
        url: urlMatch ?? url,
        bundleFile: file.file,
        bytes: file.rawBytes,
        executed: executedCss.has(url) || (urlMatch ? executedCss.has(urlMatch) : false),
        status: executedCss.has(url) || (urlMatch ? executedCss.has(urlMatch) : false) ? "executed" : merged.coverage.available ? "not-observed" : "unknown",
        sourceModules: file.modules.map((module) => module.sourceFile)
      });
    }
    for (const file of jsFiles.values()) {
      for (const module of file.modules) {
        const relative = module.sourceFile.replace(/^\/+/, "");
        const routeExecuted = executedByRoute.get(routeId)?.some((entry2) => entry2.relativeFile === relative) ?? false;
        const globallyExecuted = executedGlobal.some((entry2) => entry2.relativeFile === relative);
        const executed = routeExecuted;
        raw.modules.push({
          sourceFile: module.sourceFile,
          bundleFile: file.file,
          bytes: module.bytes,
          executed,
          ...globallyExecuted && !routeExecuted ? { previouslyExecuted: true } : {},
          shared: false,
          status: executed ? "executed" : merged.coverage.available ? "not-observed" : "unknown",
          confidence: executed ? "high" : merged.coverage.available ? "medium" : "low"
        });
      }
    }
    for (const entry2 of executedByRoute.get(routeId) ?? []) {
      const relative = entry2.relativeFile.replace(/^\/+/, "");
      if (entry2.relativeFile.startsWith("node_modules/")) continue;
      if (raw.modules.some((module) => module.sourceFile?.replace(/^\/+/, "") === relative)) continue;
      for (const file of bundle.report.files) {
        const module = file.modules.find((item) => item.sourceFile.replace(/^\/+/, "") === relative);
        if (!module) continue;
        raw.modules.push({
          sourceFile: module.sourceFile,
          bundleFile: file.file,
          bytes: module.bytes,
          executed: true,
          shared: false,
          status: "executed",
          confidence: "high"
        });
        break;
      }
    }
    if (config.analysis.css) for (const selector of merged.selectors.values()) {
      const source = findSourceSelector(selector.selector, preferredSourceFilesForSheets([...selector.sheets]));
      const cssInJs = source ? void 0 : findCssInJsSource(selector.selector, selector.ruleText, [...selector.sheets]);
      const key = source ? `${source.relativeFile}|${normalizeSelector2(source.selector)}` : cssInJs ? `${cssInJs.relativeFile}|${normalizeSelector2(cssInJs.selector)}` : normalizeSelector2(selector.selector);
      if (raw.matchedKeys.has(key)) continue;
      raw.matchedKeys.add(key);
      raw.matchedSelectors.push({
        selector: source?.selector ?? cssInJs?.selector ?? selector.selector,
        ...source ? { stylesheet: source.relativeFile, sourceFile: source.file, line: source.line, column: 1 } : cssInJs ? {
          stylesheet: cssInJs.relativeFile,
          sourceFile: cssInJs.file,
          line: cssInJs.line,
          column: cssInJs.column
        } : { stylesheet: [...selector.sheets][0] },
        matched: true,
        status: selector.stateOnly ? "unknown" : "executed",
        confidence: selector.stateOnly ? "medium" : "high"
      });
    }
    const matchedRuntimeSelectors = new Set(
      [...merged.selectors.keys()].map((selector) => normalizeSelector2(selector))
    );
    const unmatched = [];
    let unmatchedCount = 0;
    let unmatchedBytes = 0;
    const seenUnmatched = /* @__PURE__ */ new Set();
    if (config.analysis.css) for (const file of cssFiles.values()) {
      for (const selector of parseBundleCss(file)) {
        if (matchedRuntimeSelectors.has(normalizeSelector2(selector.selector))) continue;
        const source = findSourceSelector(selector.selector, new Set(file.modules.map((module) => module.sourceFile)));
        if (source?.safelisted) continue;
        const key = `${selector.sourceRelative ?? file.relativePath}|${normalizeSelector2(selector.selector)}`;
        if (seenUnmatched.has(key)) continue;
        seenUnmatched.add(key);
        unmatchedCount += 1;
        unmatchedBytes += selector.bytes;
        if (unmatched.length >= UNMATCHED_LIMIT) continue;
        unmatched.push({
          selector: source?.selector ?? selector.selector,
          stylesheet: source?.relativeFile ?? selector.sourceRelative ?? file.relativePath,
          ...source ? { sourceFile: source.file, line: source.line, column: 1 } : {},
          ...selector.sourceFile ? { sourceFile: selector.sourceFile } : {},
          ...selector.sourceLine ? { line: selector.sourceLine } : {},
          ...selector.sourceColumn ? { column: selector.sourceColumn } : {},
          ...selector.sourceRelative ? { sourceFile: selector.sourceFile ?? selector.sourceRelative } : {},
          bytes: selector.bytes,
          matched: false,
          status: "not-observed",
          confidence: selector.media.length > 0 ? "low" : "medium"
        });
      }
    }
    raw.unmatchedSelectors = unmatched;
    raw.unmatchedCount = unmatchedCount;
    raw.unmatchedBytes = unmatchedBytes;
    if (!config.analysis.css) {
      raw.notes.push("CSS analysis is disabled; route CSS usage was not computed.");
    }
    if (unmatchedCount > UNMATCHED_LIMIT) {
      raw.notes.push(
        `Showing ${UNMATCHED_LIMIT} of ${unmatchedCount} CSS selectors not matched on this route.`
      );
    }
    raw.notes.push(
      "Selectors listed as unmatched on this route may still be used on other routes; they are route-level optimization signals, not global unused-code findings."
    );
    const scriptTotals = merged.coverage.scripts;
    if (scriptTotals.length > 0 && merged.coverage.available) {
      const executedFunctions = scriptTotals.reduce((sum, script) => sum + script.executedFunctions, 0);
      const totalFunctions = scriptTotals.reduce((sum, script) => sum + script.totalFunctions, 0);
      const executedBytes = scriptTotals.reduce((sum, script) => sum + script.executedFunctionBytes, 0);
      const totalBytes = scriptTotals.reduce((sum, script) => sum + script.totalFunctionBytes, 0);
      raw.coverage = {
        executedFunctions,
        totalFunctions,
        executedBytes,
        totalBytes,
        percent: totalBytes > 0 ? Math.round(executedBytes / totalBytes * 1e3) / 10 : 0
      };
    }
    if (!merged.coverage.available && runtime.sessions.length > 0) {
      raw.notes.push("Function-level coverage was unavailable for this route; script loading and CSS/DOM evidence are still reported.");
    }
    for (const warning of merged.warnings) raw.notes.push(warning);
    raw.source = "runtime";
    raw.kind = routeKind(runtime.routes.size, runtime.sessions.some((session) => session.visits.some((visit) => visit.navigation === "link")), 0, detection);
  }
  for (const routeInput of config.routes) {
    const parsed = routeInputPath(routeInput);
    if (!parsed) continue;
    const raw = getRoute(parsed.id);
    raw.names.add(parsed.name);
    if (!runtime.routes.has(parsed.id)) {
      raw.kind = "manual";
      raw.source = "static";
      raw.notes.push("Configured route was not observed in runtime sessions.");
    }
  }
  const sourceHtmlRoutes = /* @__PURE__ */ new Set();
  for (const htmlFile of input.htmlFiles ?? []) {
    let relative = path8.relative(root, htmlFile).replaceAll("\\", "/");
    relative = relative.replace(/^public\//, "").replace(/^src\/pages\//, "").replace(/^src\//, "").replace(/^pages\//, "");
    const withoutExtension = relative.replace(/\.html?$/i, "");
    const id = withoutExtension === "index" || withoutExtension.endsWith("/index") ? `/${withoutExtension.replace(/\/?index$/, "")}`.replace(/\/+/g, "/") : `/${withoutExtension}`.replace(/\/+/g, "/");
    const normalized = id.length > 1 ? id.replace(/\/+$/, "") : "/";
    sourceHtmlRoutes.add(normalized);
    const raw = getRoute(normalized);
    if (raw.source !== "runtime") {
      raw.kind = sourceHtmlRoutes.size > 1 ? "mpa" : "manual";
      raw.source = "static";
      raw.notes.push("Route derived from a source HTML page. Build the app for asset-level analysis.");
    }
  }
  const htmlRouteIds = new Set(sourceHtmlRoutes);
  for (const file of bundle.report.files) {
    for (const route of file.routes) {
      htmlRouteIds.add(route);
      const raw = getRoute(route);
      if (raw.source === "runtime") continue;
      raw.source = "static";
      if (raw.kind === "unknown") raw.kind = "manual";
      raw.notes.push("Static route derived from built HTML/manifest assets. No runtime observation.");
      if (file.type === "js" && !raw.assetsJs.some((asset) => asset.url === file.relativePath)) {
        raw.assetsJs.push({
          url: file.relativePath,
          bundleFile: file.file,
          bytes: file.rawBytes,
          executed: false,
          status: "unknown",
          sourceModules: file.modules.map((module) => module.sourceFile)
        });
        raw.jsLoadedFiles.push(file.relativePath);
        for (const module of file.modules) {
          raw.modules.push({
            sourceFile: module.sourceFile,
            bundleFile: file.file,
            bytes: module.bytes,
            executed: false,
            shared: false,
            status: "unknown",
            confidence: "low"
          });
        }
      }
      if (file.type === "css" && !raw.assetsCss.some((asset) => asset.url === file.relativePath)) {
        raw.assetsCss.push({
          url: file.relativePath,
          bundleFile: file.file,
          bytes: file.rawBytes,
          executed: false,
          status: "unknown",
          sourceModules: file.modules.map((module) => module.sourceFile)
        });
        raw.stylesheets.push(file.relativePath);
        raw.cssLoadedFiles.push(file.relativePath);
      }
    }
  }
  const moduleLoadedRoutes = /* @__PURE__ */ new Map();
  const moduleExecutedRoutes = /* @__PURE__ */ new Map();
  const moduleNamedExecutedRoutes = /* @__PURE__ */ new Map();
  const moduleInitial = /* @__PURE__ */ new Map();
  const moduleBytes = /* @__PURE__ */ new Map();
  const moduleFile = /* @__PURE__ */ new Map();
  for (const raw of routes.values()) {
    for (const module of raw.modules) {
      if (!module.sourceFile) continue;
      const key = module.sourceFile.replace(/^\/+/, "");
      const loaded = moduleLoadedRoutes.get(key) ?? /* @__PURE__ */ new Set();
      loaded.add(raw.id);
      moduleLoadedRoutes.set(key, loaded);
      if (module.executed) {
        const executed = moduleExecutedRoutes.get(key) ?? /* @__PURE__ */ new Set();
        executed.add(raw.id);
        moduleExecutedRoutes.set(key, executed);
      }
      const namedEntries = executedByRoute.get(raw.id)?.filter(
        (entry2) => entry2.relativeFile === key && entry2.functionName.trim() !== ""
      ) ?? [];
      if (namedEntries.length > 0) {
        const named = moduleNamedExecutedRoutes.get(key) ?? /* @__PURE__ */ new Set();
        named.add(raw.id);
        moduleNamedExecutedRoutes.set(key, named);
      }
      if (module.bytes) moduleBytes.set(key, Math.max(moduleBytes.get(key) ?? 0, module.bytes));
      if (module.bundleFile) {
        moduleFile.set(key, module.bundleFile);
        const file = bundleFileByPath.get(path8.normalize(module.bundleFile));
        if (file?.initial) moduleInitial.set(key, true);
      }
    }
  }
  const runtimeSelectorRoutes = /* @__PURE__ */ new Map();
  for (const [routeId, merged] of runtime.routes) {
    for (const selector of merged.selectors.keys()) {
      const set = runtimeSelectorRoutes.get(normalizeSelector2(selector)) ?? /* @__PURE__ */ new Set();
      set.add(routeId);
      runtimeSelectorRoutes.set(normalizeSelector2(selector), set);
    }
  }
  const reports = [];
  for (const raw of routes.values()) {
    if (signal?.aborted) break;
    const moduleMap = /* @__PURE__ */ new Map();
    for (const module of raw.modules) {
      const key = `${module.sourceFile}|${module.bundleFile ?? ""}`;
      const existing = moduleMap.get(key);
      if (existing) {
        existing.bytes = Math.max(existing.bytes ?? 0, module.bytes ?? 0);
        existing.executed = existing.executed || module.executed;
        if (module.previouslyExecuted) existing.previouslyExecuted = true;
      } else {
        moduleMap.set(key, { ...module });
      }
    }
    const modules = [...moduleMap.values()].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0));
    for (const module of modules) {
      const key = module.sourceFile?.replace(/^\/+/, "") ?? "";
      const loaded = moduleLoadedRoutes.get(key) ?? /* @__PURE__ */ new Set();
      const executed = moduleExecutedRoutes.get(key) ?? /* @__PURE__ */ new Set();
      module.shared = loaded.size > 1 || executed.size > 1;
      if (!module.executed && executed.size > 0) module.previouslyExecuted = true;
      module.status = module.executed ? "executed" : raw.source === "runtime" ? "not-observed" : "unknown";
      module.confidence = module.executed ? "high" : raw.source === "runtime" ? "medium" : "low";
    }
    const routeExclusiveModules = modules.filter((module) => {
      const key = module.sourceFile?.replace(/^\/+/, "") ?? "";
      return (moduleLoadedRoutes.get(key)?.size ?? 0) === 1 && (moduleExecutedRoutes.get(key)?.size ?? 0) <= 1;
    });
    const sharedModules = modules.filter((module) => module.shared);
    const loadedNotExecutedModules = modules.filter((module) => !module.executed);
    const exclusiveMatched = raw.matchedSelectors.filter((selector) => {
      const routeSet = runtimeSelectorRoutes.get(normalizeSelector2(selector.selector));
      return routeSet?.size === 1;
    });
    reports.push({
      id: raw.id,
      path: raw.id,
      name: [...raw.names].sort((a, b) => a.length - b.length)[0] ?? raw.id,
      ...raw.url ? { url: raw.url } : {},
      kind: raw.source === "runtime" ? routeKind(
        runtime.routes.size,
        runtime.sessions.some((session) => session.visits.some((visit) => visit.navigation === "link")),
        htmlRouteIds.size,
        detection
      ) : htmlRouteIds.size > 1 ? "mpa" : raw.kind === "unknown" ? "manual" : raw.kind,
      source: raw.source,
      sessionsObserved: raw.sessions,
      assets: {
        js: raw.assetsJs.slice(0, 300),
        css: raw.assetsCss.slice(0, 300)
      },
      modules: modules.slice(0, MODULE_LIMIT),
      routeExclusiveModules: routeExclusiveModules.slice(0, MODULE_LIMIT),
      sharedModules: sharedModules.slice(0, MODULE_LIMIT),
      loadedNotExecutedModules: loadedNotExecutedModules.slice(0, MODULE_LIMIT),
      cssUsage: {
        matchedSelectors: raw.matchedSelectors.slice(0, MATCHED_LIMIT),
        routeExclusiveSelectors: exclusiveMatched.slice(0, MATCHED_LIMIT),
        unmatchedSelectors: raw.unmatchedSelectors,
        matchedSelectorCount: raw.matchedSelectors.length,
        unmatchedSelectorCount: raw.unmatchedCount,
        unmatchedSelectorBytes: raw.unmatchedBytes,
        stylesheets: [...new Set(raw.stylesheets)].sort(),
        ...raw.assetsCss.length > 0 ? { bytes: raw.assetsCss.reduce((sum, asset) => sum + (asset.bytes ?? 0), 0) } : {}
      },
      ...raw.coverage ? { coverage: raw.coverage } : {},
      notes: [...new Set(raw.notes)]
    });
  }
  reports.sort((a, b) => a.path.localeCompare(b.path));
  const sourceCssLoadedRoutes = /* @__PURE__ */ new Map();
  for (const [routeId, merged] of runtime.routes) {
    const cssFiles = /* @__PURE__ */ new Set();
    for (const resource of merged.resources) {
      if (resource.type !== "css") continue;
      const file = bundleFileForUrl(resource.url, "css");
      if (file) cssFiles.add(file);
    }
    for (const stylesheet of merged.stylesheets) {
      const file = bundleFileForUrl(stylesheet, "css");
      if (file) cssFiles.add(file);
    }
    for (const file of cssFiles) {
      for (const module of file.modules) {
        const key = module.sourceFile.replace(/^\/+/, "");
        const set = sourceCssLoadedRoutes.get(key) ?? /* @__PURE__ */ new Set();
        set.add(routeId);
        sourceCssLoadedRoutes.set(key, set);
      }
    }
  }
  const routeFindings = [];
  for (const [source, executedRoutes] of moduleNamedExecutedRoutes) {
    if (routeFindings.length >= MAX_FINDINGS) break;
    if (executedRoutes.size !== 1) continue;
    const loadedRoutes = moduleLoadedRoutes.get(source);
    if (!loadedRoutes || loadedRoutes.size < 2) continue;
    if (!moduleInitial.get(source)) continue;
    const bytes = moduleBytes.get(source) ?? 0;
    if (bytes < 2048) continue;
    if (source.startsWith("node_modules/") || source.startsWith("../") || source.startsWith("/")) continue;
    const absolute = path8.resolve(root, source);
    if (!existsSync(absolute)) continue;
    const executedRoute = [...executedRoutes][0] ?? "";
    const otherRoutes = [...loadedRoutes].filter((route) => route !== executedRoute);
    if (otherRoutes.length === 0) continue;
    routeFindings.push(
      createFinding({
        root,
        category: "code-splitting-opportunity",
        status: "potentially-unused",
        confidence: "medium",
        title: `Route-specific module loaded on other routes: ${source}`,
        description: `This module executed only on ${executedRoute} but its bundle is loaded on ${otherRoutes.join(", ")}. Consider moving the import behind a dynamic import or route chunk. Verify with benchmarked bundles first.`,
        file: absolute,
        line: 1,
        column: 1,
        symbol: source,
        symbolKind: "module",
        size: {
          bundleAttributedBytes: bytes,
          basis: "Largest source-map attribution for this module; not a guaranteed removable size."
        },
        evidence: [
          {
            kind: "coverage",
            description: `Executed on ${executedRoute}; also loaded on ${otherRoutes.join(", ")}.`,
            file: source,
            line: 1
          },
          {
            kind: "source-map",
            description: `Initial bundle chunk: ${moduleFile.get(source) ?? "unknown"}.`,
            file: moduleFile.get(source)
          }
        ],
        routeHints: [.../* @__PURE__ */ new Set([...loadedRoutes, ...executedRoutes])].sort(),
        tags: ["route", "code-splitting", "runtime"],
        fingerprintSuffix: source
      })
    );
  }
  const popup = /* @__PURE__ */ new Set();
  for (const finding of findings) {
    if (signal?.aborted) break;
    const folder = finding.location.relativeFile;
    const executedRoutes = executedFilesGlobal.get(folder);
    const loadedRoutes = moduleLoadedRoutes.get(folder);
    if (finding.category === "unused-module" && (loadedRoutes?.size ?? 0) > 0) {
      popup.add(finding.id);
      continue;
    }
    if (["unused-export", "unused-function", "unused-class", "unused-class-method"].includes(finding.category) && ["function", "class", "method"].includes(finding.symbolKind)) {
      const entries = executedGlobal.filter((entry2) => entry2.relativeFile === folder);
      const start = finding.location.line;
      const end = finding.location.endLine ?? start;
      const executed = entries.some(
        (entry2) => finding.symbol && entry2.functionName && entry2.functionName === finding.symbol || entry2.startLine >= start - 1 && entry2.startLine <= end + 1
      );
      if (executed) {
        popup.add(finding.id);
        continue;
      }
    }
    if (finding.category === "unused-css-selector" && finding.css?.selector) {
      const matched = [...runtimeSelectors.keys()].some(
        (selector) => selectorsCorrelate(finding.css?.selector ?? "", selector)
      );
      const sourceClasses = classesInSelector(finding.css.selector);
      const domMatch = sourceClasses.length > 0 && sourceClasses.every((token) => domClasses.has(token));
      if (matched || domMatch) {
        popup.add(finding.id);
        continue;
      }
    }
    if (finding.category === "unused-stylesheet") {
      const related = css.selectors.filter(
        (selector) => selector.file === finding.location.file || selector.relativeFile === folder
      );
      const matched = related.some(
        (selector) => [...runtimeSelectors.keys()].some((runtimeSelector) => selectorsCorrelate(selector.selector, runtimeSelector))
      );
      if (matched) {
        popup.add(finding.id);
        continue;
      }
    }
    const runtimeEvidenceApplies = runtime.sessions.length > 0 && (finding.location.fileType === "css" || finding.location.fileType === "scss" || finding.location.fileType === "less" || finding.location.fileType === "sass" || ["js", "jsx", "mjs", "cjs", "ts", "tsx", "mts", "cts", "vue", "svelte", "astro"].includes(finding.location.fileType));
    if (!runtimeEvidenceApplies) continue;
    const observedRoutes = [...executedRoutes ?? []].filter((route) => route !== void 0);
    const loaded = loadedRoutes ? [...loadedRoutes] : [];
    const cssLoaded = sourceCssLoadedRoutes.get(folder);
    const runtimeRoutesForFinding = loaded.length > 0 ? loaded : cssLoaded ? [...cssLoaded] : [];
    finding.runtime = {
      observed: false,
      sessions: runtime.sessions.length,
      routesObserved: observedRoutes.sort(),
      routesLoaded: [...new Set(runtimeRoutesForFinding)].sort(),
      note: observedRoutes.length > 0 ? "The module executed during runtime sessions, but this symbol was not observed as executed." : "This finding was not contradicted by runtime sessions; absence of execution is not proof of unused code."
    };
    for (const route of runtimeRoutesForFinding) {
      if (!finding.routeHints.includes(route)) finding.routeHints.push(route);
    }
    finding.routeHints = [...new Set(finding.routeHints)].sort();
  }
  const filteredFindings = findings.filter((finding) => !popup.has(finding.id));
  for (const finding of routeFindings) filteredFindings.push(finding);
  const matchedSelectorCount = runtime.routes.size > 0 ? new Set(
    [...runtime.routes.values()].flatMap(
      (route) => [...route.selectors.keys()].map((selector) => normalizeSelector2(selector))
    )
  ).size : 0;
  return {
    routes: reports,
    findings: filteredFindings,
    warnings: [...new Set(warnings)],
    executedSources: executedGlobal,
    runtimeMatchedSelectors: matchedSelectorCount,
    runtimeMatchedRoutes: runtime.routes.size
  };
}
var JS_CATEGORIES = /* @__PURE__ */ new Set([
  "unused-import",
  "unused-export",
  "unused-variable",
  "unused-function",
  "unused-class",
  "unused-class-method",
  "unused-type",
  "unused-enum-member",
  "unused-type-parameter",
  "unused-decorator",
  "unused-event-handler",
  "unreachable-code",
  "unused-type-only-import",
  "circular-dependency",
  "duplicate-code",
  "unused-module",
  "tree-shaking-opportunity"
]);
var CSS_CATEGORIES = /* @__PURE__ */ new Set([
  "unused-css-selector",
  "unused-css-declaration",
  "duplicate-css-selector",
  "duplicate-css-rule",
  "unused-css-custom-property",
  "unused-stylesheet",
  "css-specificity"
]);
function sourceMatches(moduleSource, finding) {
  const keys = [finding.location.relativeFile, finding.location.file, toPosix(finding.location.file)];
  return keys.some(
    (key) => moduleSource === key || moduleSource.endsWith(`/${key}`) || key.endsWith(moduleSource) || toPosix(moduleSource).endsWith(`/${finding.location.relativeFile}`)
  );
}
function indexScore(index, finding) {
  let score = 0;
  for (const module of index.attribution) {
    if (sourceMatches(module.sourceFile, finding)) score += module.bytes;
  }
  if (index.reverseByKey.has(finding.location.relativeFile)) score += 1e6;
  if (index.reverseByKey.has(finding.location.file)) score += 1e6;
  return score;
}
function mappingChain(finding, generatedFile, root) {
  const relativeGenerated = toPosix(path8.relative(root, generatedFile));
  return [
    { kind: "bundle", label: relativeGenerated, file: generatedFile },
    { kind: "chunk", label: path8.basename(generatedFile), file: generatedFile },
    {
      kind: "module",
      label: finding.css?.stylesheet ?? finding.location.relativeFile
    },
    {
      kind: "source",
      label: finding.location.relativeFile,
      file: finding.location.file,
      line: finding.location.line,
      column: finding.location.column
    },
    ...finding.symbol ? [
      {
        kind: "symbol",
        label: finding.parent ? `${finding.parent}.${finding.symbol}` : finding.symbol,
        file: finding.location.file,
        line: finding.location.line,
        column: finding.location.column
      }
    ] : []
  ];
}
function attachSourceMappings(findings, indexes, bundle, root) {
  const precision = { symbol: 0, lineColumn: 0, line: 0, file: 0 };
  let mappedFindings = 0;
  let eligibleFindings = 0;
  const routeMap = /* @__PURE__ */ new Map();
  for (const file of bundle.files) {
    for (const module of file.modules) {
      const key = toPosix(module.sourceFile);
      const routes = routeMap.get(key) ?? /* @__PURE__ */ new Set();
      for (const route of file.routes) routes.add(route);
      routeMap.set(key, routes);
    }
  }
  for (const finding of findings) {
    const isJs = JS_CATEGORIES.has(finding.category);
    const isCss = CSS_CATEGORIES.has(finding.category);
    if (!isJs && !isCss) continue;
    eligibleFindings += 1;
    const candidates = indexes.filter((index) => {
      const extension = path8.extname(index.generatedFile).toLowerCase();
      if (isCss) return extension === ".css";
      return extension !== ".css";
    }).map((index) => ({ index, score: indexScore(index, finding) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    for (const [key, routes] of routeMap) {
      if (sourceMatches(key, finding)) {
        for (const route of routes) {
          if (!finding.routeHints.includes(route)) finding.routeHints.push(route);
        }
      }
    }
    const best = candidates[0];
    if (!best) continue;
    const lookup = findGeneratedPosition(
      best.index,
      [finding.location.relativeFile, finding.location.file],
      finding.location.line,
      finding.symbol
    );
    if (!lookup) continue;
    const sourceFile = best.index.generatedFile;
    finding.mapping = {
      precision: lookup.precision,
      generatedFile: sourceFile,
      generatedLine: lookup.generatedLine,
      generatedColumn: lookup.generatedColumn,
      originalFile: finding.location.file,
      originalLine: finding.location.line,
      originalColumn: finding.location.column,
      ...best.index.sourceMapFile ? { sourceMapFile: best.index.sourceMapFile } : {},
      chunk: path8.basename(sourceFile),
      chain: mappingChain(finding, sourceFile, root),
      ...lookup.precision === "file" ? { limitation: "Only file-level attribution was available for this finding." } : lookup.precision === "line" ? { limitation: "Nearest mapping lines were used; generated column is approximate." } : {}
    };
    const routesForGenerated = bundle.files.find((file) => file.file === sourceFile)?.routes ?? [];
    for (const route of routesForGenerated) {
      if (!finding.routeHints.includes(route)) finding.routeHints.push(route);
    }
    mappedFindings += 1;
    if (finding.mapping.precision === "symbol") precision.symbol += 1;
    else if (finding.mapping.precision === "line-column") precision.lineColumn += 1;
    else if (finding.mapping.precision === "line") precision.line += 1;
    else precision.file += 1;
  }
  for (const finding of findings) {
    if (finding.routeHints.length > 0) finding.routeHints.sort();
  }
  return { mappedFindings, eligibleFindings, precision };
}
function createSourceMapReport(indexes, summary, enabled) {
  const base = buildSourceMapReport(indexes, summary.mappedFindings, summary.eligibleFindings);
  return {
    ...base,
    enabled,
    precision: summary.precision,
    resolvedFindings: summary.mappedFindings,
    unresolvedFindings: Math.max(0, summary.eligibleFindings - summary.mappedFindings)
  };
}
var CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 };
function aggregateConfidence(findings) {
  if (findings.length === 0) return "medium";
  const min = findings.reduce(
    (current, finding) => Math.min(current, CONFIDENCE_RANK[finding.confidence]),
    2
  );
  if (min <= 0) return "low";
  if (min === 1) return "medium";
  return "high";
}
function fileTypeOf(file) {
  return fileType(file);
}
function locationOf(file, line, root, column = 1) {
  if (!file) return void 0;
  return {
    file,
    relativeFile: path8.relative(root, file).replaceAll("\\", "/"),
    line,
    column,
    fileType: fileTypeOf(file)
  };
}
function groupForFinding(finding) {
  const file = finding.location.relativeFile;
  const category = finding.category;
  if (category === "unused-import" || category === "unused-type-only-import") {
    return {
      key: `imports|${file}`,
      category: "remove-unused",
      title: `Remove unused imports in ${file}`,
      reason: "Imported bindings have no value or type references in the analyzed project.",
      action: "Remove the unused import bindings; preserve module evaluation by keeping side-effect imports when needed.",
      benefits: ["Smaller source surface", "Clearer module dependencies", "Safe automated edits for fully-unused imports"],
      complexity: "low",
      risk: "low",
      steps: [
        "Review the listed bindings and any dynamic eval/reflection context.",
        "Run `npx @codewithrajat/code-usage-map fix --dry-run` to preview safe import edits.",
        "Apply with `--apply`, then run tests and type checking."
      ]
    };
  }
  if ([
    "unused-export",
    "unused-variable",
    "unused-function",
    "unused-class",
    "unused-class-method",
    "unused-type",
    "unused-enum-member",
    "unused-type-parameter",
    "unused-module"
  ].includes(category)) {
    const confirmed = finding.status === "confirmed-unused";
    return {
      key: `js|${file}|${confirmed ? "confirmed" : "potential"}`,
      category: category === "unused-export" ? "investigate" : "remove-unused",
      title: confirmed ? `Remove statically unused code in ${file}` : `Review potentially unused exports/types in ${file}`,
      reason: confirmed ? "TypeScript symbol references show no internal callers. Framework reflection and external consumers are checked by the analyzer where possible." : "No static references were found, but exports, framework entry points, or dynamic consumers may still use these symbols.",
      action: confirmed ? "Remove the declarations or move them into tests/examples if they are intentional API examples." : "Search external consumers and runtime evidence before changing public exports or entry-point code.",
      benefits: ["Less dead source code", "Better tree-shaking behavior", "Clearer module ownership"],
      complexity: confirmed ? "low" : "medium",
      risk: confirmed ? "low" : "medium",
      steps: confirmed ? [
        "Review the source locations and runtime evidence.",
        "Remove declarations, retaining any required side-effect initializers.",
        "Run type checking, tests, and a production build."
      ] : [
        "Confirm the symbols are not consumed externally or by framework conventions.",
        "Use runtime collection to exercise lazy routes and dialogs.",
        "Convert only verified findings into removals."
      ]
    };
  }
  if (category === "unreachable-code") {
    return {
      key: `unreachable|${file}`,
      category: "remove-unused",
      title: `Remove unreachable code in ${file}`,
      reason: "Control-flow analysis proves these statements cannot execute.",
      action: "Delete the unreachable statements or fix the control flow.",
      benefits: ["Less confusing dead code", "Smaller parsed source"],
      complexity: "low",
      risk: "low",
      steps: ["Review the proof (return/throw/break/continue or literal condition).", "Remove or restructure the dead statements.", "Run tests."]
    };
  }
  if (category === "circular-dependency") {
    return {
      key: "circular",
      category: "investigate",
      title: "Break runtime circular dependencies",
      reason: "Cycles can lead to partially initialized modules and bundler ordering bugs.",
      action: "Extract shared symbols into a dependency-free module or invert one side of the cycle.",
      benefits: ["More predictable initialization", "Safer tree-shaking"],
      complexity: "medium",
      risk: "medium",
      steps: ["Review each import chain.", "Extract shared types/constants.", "Re-run analysis to confirm cycles are gone."]
    };
  }
  if (category === "duplicate-code") {
    return {
      key: `duplicate|${file}`,
      category: "duplicate-code",
      title: "Consolidate duplicate logic",
      reason: "Normalized function bodies match after identifier/literal normalization.",
      action: "Extract shared logic only if the duplicated functions have the same behavioral contract.",
      benefits: ["Less maintenance duplication", "Smaller source footprint"],
      complexity: "medium",
      risk: "medium",
      steps: ["Compare the listed occurrences.", "Extract a shared helper with tests.", "Remove one copy at a time."]
    };
  }
  if (category === "unused-css-selector") {
    const confidence = aggregateConfidence([finding]);
    return {
      key: `css-selector|${file}`,
      category: "remove-css",
      title: `Review potentially unused CSS selectors in ${file}`,
      reason: "No static or runtime references matched these selectors across collected states.",
      action: "Verify states/responsive breakpoints and runtime-generated class names, then remove or safelist.",
      benefits: ["Smaller stylesheets", "Less route CSS weight"],
      complexity: "medium",
      risk: confidence === "high" ? "medium" : "high",
      steps: [
        "Open the route report and test the selectors at mobile/desktop widths and interaction states.",
        "Search for dynamic class construction and third-party widgets.",
        "Add required patterns to `css.safelist` or remove the selector."
      ]
    };
  }
  if (category === "unused-css-custom-property") {
    return {
      key: `css-variable|${file}`,
      category: "remove-css",
      title: `Remove unused CSS custom properties in ${file}`,
      reason: "No var()/CSSOM usage was found in source or analyzed styles.",
      action: "Remove the declarations after checking external themes and runtime consumers.",
      benefits: ["Cleaner design tokens"],
      complexity: "low",
      risk: "medium",
      steps: ["Search all source and theme files.", "Check external consumers/shadow DOM.", "Remove the declaration."]
    };
  }
  if (category === "unused-stylesheet") {
    return {
      key: `css-file|${file}`,
      category: "remove-css",
      title: `Review unreferenced stylesheet ${file}`,
      reason: "No import chain, HTML link, or runtime match reaches this stylesheet.",
      action: "Remove the file only after confirming no build-tool auto-import or URL-based loading exists.",
      benefits: ["Less dead CSS"],
      complexity: "low",
      risk: "medium",
      steps: ["Check framework auto-import conventions.", "Search raw URL strings.", "Remove the file and run the production build."]
    };
  }
  if (category === "duplicate-css-selector" || category === "duplicate-css-rule") {
    return {
      key: `css-duplicate|${file}|${category}`,
      category: "remove-css",
      title: `Consolidate duplicate CSS in ${file}`,
      reason: "Repeated selectors/declarations can increase CSS size and cascade complexity.",
      action: "Merge only rules with identical cascade context; preserve intentional browser fallbacks.",
      benefits: ["Smaller CSS", "Simpler cascade"],
      complexity: "low",
      risk: "medium",
      steps: ["Inspect the rules and media contexts.", "Merge identical blocks.", "Verify at all breakpoints."]
    };
  }
  if (category === "unused-css-declaration") {
    return {
      key: `css-decl|${file}`,
      category: "remove-css",
      title: `Remove redundant CSS declarations in ${file}`,
      reason: "The same property/value is declared more than once in a rule.",
      action: "Remove the duplicate declaration.",
      benefits: ["Smaller CSS"],
      complexity: "low",
      risk: "low",
      steps: ["Confirm there are no fallback comments or hacks.", "Remove the duplicate."]
    };
  }
  if (category === "css-specificity") {
    return {
      key: `css-specificity|${file}`,
      category: "reduce-specificity",
      title: `Reduce high CSS specificity in ${file}`,
      reason: "High-specificity selectors make overrides and theming harder.",
      action: "Reduce selector depth or use :where()/lower-specificity class selectors.",
      benefits: ["Easier overrides", "More maintainable styles"],
      complexity: "medium",
      risk: "medium",
      steps: ["Find the selector and its overrides.", "Refactor to a flatter selector.", "Verify visual regression."]
    };
  }
  if (category === "unused-dependency") {
    return {
      key: "dependencies|unused",
      category: "remove-dependency",
      title: "Review potentially unused dependencies",
      reason: "These runtime dependencies have no imports, scripts, config references, or source-string evidence.",
      action: "Remove verified packages from package.json and regenerate the lockfile.",
      benefits: ["Smaller dependency graph", "Faster installs", "Less supply-chain surface"],
      complexity: "low",
      risk: "medium",
      steps: [
        "Check build plugins, test-only usage, CLI usage, and dynamic require/import patterns.",
        "Remove one package at a time.",
        "Run the production build and inspect bundle sizes."
      ]
    };
  }
  if (category === "duplicate-dependency") {
    return {
      key: "dependencies|duplicate",
      category: "remove-dependency",
      title: "Deduplicate package versions",
      reason: "Multiple resolved versions increase install and bundle size.",
      action: "Align version ranges, use package-manager overrides/resolutions, and refresh the lockfile.",
      benefits: ["Smaller bundles", "Fewer API divergences"],
      complexity: "medium",
      risk: "medium",
      steps: ["Run your package manager\u2019s dedupe/why command.", "Align compatible ranges.", "Verify the lockfile and build output."]
    };
  }
  if (category === "heavy-dependency") {
    return {
      key: `dependency|heavy|${finding.symbol ?? file}`,
      category: "replace-dependency",
      title: `Evaluate heavy dependency "${finding.symbol ?? "unknown"}"`,
      reason: "Source-map attribution assigns significant bundle bytes to this package.",
      action: "Measure actual runtime usage, then replace with a lighter alternative or load it only where needed.",
      benefits: ["Potential bundle reduction", "Better route performance"],
      complexity: "medium",
      risk: "medium",
      steps: ["Verify attributed bytes with a bundle analyzer.", "Check alternative package licenses and APIs.", "Measure gzip/Brotli before and after."]
    };
  }
  if (category === "code-splitting-opportunity") {
    return {
      key: `code-splitting|${finding.id}`,
      category: "code-split",
      title: `Lazy-load route-specific module ${finding.symbol ?? file}`,
      reason: "The module executed on one route but is loaded on other routes.",
      action: "Move the import behind a route-level dynamic import and benchmark the initial bundle.",
      benefits: ["Smaller initial/route JavaScript", "Faster route startup elsewhere"],
      complexity: "medium",
      risk: "medium",
      steps: ["Verify route ownership.", "Introduce `import()` at the route boundary.", "Measure initial and total transfer sizes."]
    };
  }
  if (category === "polyfill-included") {
    return {
      key: "polyfill",
      category: "investigate",
      title: "Verify polyfill necessity against browser targets",
      reason: "A polyfill package is present; static source cannot prove it is unnecessary.",
      action: "Compare browserslist targets and generated code, then trim polyfill imports only if targets are covered natively.",
      benefits: ["Potential bundle reduction"],
      complexity: "medium",
      risk: "medium",
      steps: ["Review browserslist.", "Check the polyfill configuration.", "Measure builds for supported targets."]
    };
  }
  return void 0;
}
function buildGroupRecommendation(group, root) {
  const findings = group.findings.slice(0, 500);
  const estimatedBytes = findings.reduce(
    (sum, finding) => sum + (finding.size.estimatedRemovableBytes ?? 0),
    0
  );
  const locations = [];
  const seenLocations = /* @__PURE__ */ new Set();
  for (const finding of findings) {
    const key = `${finding.location.relativeFile}|${finding.location.line}`;
    if (seenLocations.has(key)) continue;
    seenLocations.add(key);
    locations.push(finding.location);
    if (locations.length >= 20) break;
  }
  const recommendation = {
    id: `r_${hashString(`${group.category}|${group.key}`, 12)}`,
    category: group.category,
    title: group.title,
    reason: group.reason,
    action: group.action,
    benefits: group.benefits,
    complexity: group.complexity,
    risk: group.risk,
    confidence: aggregateConfidence(findings),
    findingIds: findings.map((finding) => finding.id),
    locations,
    ...estimatedBytes > 0 ? {
      sizeImpact: {
        estimatedBytes,
        basis: "Sum of per-finding removable estimates; overlaps and shared declarations may reduce actual savings.",
        additive: false,
        note: "Do not add this value to other recommendations or total bundle sizes."
      }
    } : {},
    steps: group.steps
  };
  for (const finding of findings) {
    if (!finding.recommendationIds.includes(recommendation.id)) {
      finding.recommendationIds.push(recommendation.id);
    }
  }
  return recommendation;
}
function generateRecommendations(options) {
  const { root, findings, routes } = options;
  const groups = /* @__PURE__ */ new Map();
  for (const finding of findings) {
    const template = groupForFinding(finding);
    if (!template) continue;
    const existing = groups.get(template.key);
    if (existing) existing.findings.push(finding);
    else groups.set(template.key, { ...template, findings: [finding] });
  }
  const recommendations = [...groups.values()].map(
    (group) => buildGroupRecommendation(group)
  );
  const bundledUnusedExports = findings.filter(
    (finding) => finding.category === "unused-export" && finding.mapping
  );
  const treeShakingRecommendationId = `r_${hashString("tree-shaking|bundled-unused-exports", 12)}`;
  if (bundledUnusedExports.length > 0) {
    recommendations.push({
      id: treeShakingRecommendationId,
      category: "tree-shaking",
      title: "Verify tree-shaking for bundled unused exports",
      reason: `${bundledUnusedExports.length} exported symbol(s) without static consumers were still attributed to generated bundles.`,
      action: "Remove verified unused exports, ensure the package/module is side-effect safe, and compare production minified builds.",
      benefits: ["Potential minifier dead-code removal", "Clearer public module surface"],
      complexity: "low",
      risk: "medium",
      confidence: aggregateConfidence(bundledUnusedExports),
      findingIds: bundledUnusedExports.map((finding) => finding.id),
      locations: bundledUnusedExports.slice(0, 15).map((finding) => finding.location),
      steps: [
        "Confirm exports are not consumed externally or through framework conventions.",
        "Mark modules with accurate `sideEffects` metadata where applicable.",
        "Rebuild with production minification and compare the bundle report."
      ]
    });
    for (const finding of bundledUnusedExports) {
      if (!finding.recommendationIds.includes(treeShakingRecommendationId)) {
        finding.recommendationIds.push(treeShakingRecommendationId);
      }
    }
  }
  for (const route of routes) {
    if (route.source !== "runtime") continue;
    if (route.cssUsage.unmatchedSelectorCount < 12 || route.cssUsage.unmatchedSelectorBytes < 5e3) continue;
    const locations = [];
    for (const selector of route.cssUsage.unmatchedSelectors.slice(0, 15)) {
      const file = selector.sourceFile ?? selector.stylesheet;
      if (!file) continue;
      const line = selector.line ?? 1;
      const location = locationOf(file, line, root);
      if (location) locations.push(location);
    }
    recommendations.push({
      id: `r_${hashString(`route-css|${route.id}`, 12)}`,
      category: "route-css",
      title: `Reduce CSS loaded but unmatched on ${route.path}`,
      reason: `${route.cssUsage.unmatchedSelectorCount} selectors loaded on this route did not match the route DOM across ${route.sessionsObserved} session(s).`,
      action: "Split genuinely route-specific styles into route chunks, or preload only the CSS required by the initial route.",
      benefits: ["Lower route CSS transfer", "Faster route rendering", "Clearer cache boundaries"],
      complexity: "medium",
      risk: "medium",
      confidence: "medium",
      findingIds: [],
      locations: locations.slice(0, 20),
      sizeImpact: {
        estimatedBytes: route.cssUsage.unmatchedSelectorBytes,
        basis: "Selector bytes loaded on this route but not matched. Selectors may still apply to states/browser widths not exercised.",
        additive: false,
        note: "Route-level CSS estimates overlap with other routes and global unused-CSS findings."
      },
      steps: [
        `Open the ${route.path} route report and inspect unmatched selectors.`,
        "Exercise dialogs, hover/focus states, and responsive breakpoints before removing styles.",
        "Move styles imported globally into route-level CSS entry points.",
        "Measure gzip/Brotli CSS sizes for the route before and after."
      ]
    });
  }
  const rankRisk = { low: 0, medium: 1, high: 2 };
  recommendations.sort((a, b) => {
    const risk = rankRisk[a.risk] - rankRisk[b.risk];
    if (risk !== 0) return risk;
    const confidence = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (confidence !== 0) return confidence;
    return (b.sizeImpact?.estimatedBytes ?? 0) - (a.sizeImpact?.estimatedBytes ?? 0);
  });
  return recommendations;
}

// src/core/analyze.ts
function emptyCssResult() {
  const report = {
    files: 0,
    rules: 0,
    selectors: 0,
    matchedSelectors: 0,
    unmatchedSelectors: 0,
    dynamicRiskSelectors: 0,
    stylesheetFiles: 0,
    unusedStylesheetFiles: [],
    customProperties: 0,
    unusedCustomProperties: [],
    duplicateRules: 0,
    highSpecificitySelectors: 0,
    modules: 0,
    runtimeInjectedRules: 0,
    cssInJsBlocks: 0,
    cssInJsSources: [],
    notes: ["CSS analysis is disabled."]
  };
  return {
    findings: [],
    report,
    stylesheets: [],
    customProperties: [],
    keyframes: [],
    warnings: [],
    selectorCount: 0,
    usedSelectorCount: 0,
    unusedSelectorCount: 0,
    dynamicRiskSelectorCount: 0,
    duplicateRuleCount: 0,
    highSpecificityCount: 0,
    moduleCount: 0,
    cssInJsBlocks: [],
    selectors: []
  };
}
function emptyDependencyResult() {
  const report = {
    declared: 0,
    packages: [],
    unused: [],
    unresolvedImports: [],
    duplicateVersions: [],
    typeOnlyImports: [],
    notes: ["Dependency analysis is disabled."]
  };
  return { report, findings: [], warnings: [] };
}
function emptyBundleResult() {
  const report = {
    available: false,
    buildDirs: [],
    files: [],
    totals: {
      rawBytes: 0,
      gzipBytes: 0,
      brotliBytes: 0,
      jsRawBytes: 0,
      cssRawBytes: 0,
      initialRawBytes: 0,
      lazyRawBytes: 0
    },
    initialFileIds: [],
    lazyFileIds: [],
    duplicateDependencies: [],
    heavyDependencies: [],
    mappingCoverage: { jsFiles: 0, mappedJsFiles: 0, cssFiles: 0, mappedCssFiles: 0, mappedPercent: 0 },
    notes: ["Bundle analysis is disabled."]
  };
  return { report, findings: [], sourceMapIndexes: [], warnings: [], cssFiles: [], jsFiles: [] };
}
function emptyStaticResult() {
  return {
    findings: [],
    modules: [],
    files: [],
    imports: [],
    externalImports: [],
    typeOnlyImports: [],
    assetImports: [],
    dynamicPatterns: [],
    warnings: [],
    entryPoints: [],
    reachableFiles: [],
    circularDependencies: [],
    totalLines: 0,
    symbolCount: 0,
    hasDynamicModuleLoading: false,
    hasGlobImports: false,
    htmlReferences: []
  };
}
function cacheKey(config, files, detection, signal) {
  const hash = createHash("sha256");
  hash.update(`cache:${CACHE_VERSION}|tool:${TOOL_VERSION}|schema:${REPORT_SCHEMA_VERSION}`);
  const relevantConfig = {
    mode: config.mode,
    analysis: config.analysis,
    css: config.css,
    tsconfig: config.tsconfig,
    entryPoints: config.entryPoints,
    source: config.source,
    include: config.include,
    exclude: config.exclude,
    routes: config.routes
  };
  hash.update(JSON.stringify(relevantConfig));
  hash.update(detection.detectedEntryPoints.slice().sort().join("|"));
  hash.update(detection.frameworks.map((framework) => framework.packageName).sort().join("|"));
  if (config.tsconfig) {
    try {
      hash.update(readFileSync(config.tsconfig));
    } catch {
    }
  }
  for (const file of [...files.files].sort()) {
    if (signal?.aborted) break;
    hash.update(file);
    try {
      hash.update(readFileSync(file));
    } catch {
      hash.update("unreadable");
    }
  }
  return hash.digest("hex").slice(0, 32);
}
function loadCache(config, key) {
  if (!config.cache.enabled || !config.cache.dir) return void 0;
  const file = path8.join(config.cache.dir, `analysis-${key}.json`);
  try {
    const cached = readJsonFile(file);
    if (cached.cacheVersion !== CACHE_VERSION || cached.key !== key) return void 0;
    if (!cached.staticResult || !cached.cssResult || !cached.dependencyResult) return void 0;
    return cached;
  } catch {
    return void 0;
  }
}
function saveCache(config, key, data) {
  if (!config.cache.enabled || !config.cache.dir) return;
  try {
    ensureDir(config.cache.dir);
    const file = path8.join(config.cache.dir, `analysis-${key}.json`);
    writeJsonFile(file, data);
    const entries = readdirSync(config.cache.dir).filter((name) => name.startsWith("analysis-") && name.endsWith(".json")).map((name) => ({
      name,
      mtime: (() => {
        try {
          return statSync(path8.join(config.cache.dir ?? "", name)).mtimeMs;
        } catch {
          return 0;
        }
      })()
    })).sort((a, b) => b.mtime - a.mtime);
    for (const entry2 of entries.slice(5)) {
      try {
        unlinkSync(path8.join(config.cache.dir ?? "", entry2.name));
      } catch {
      }
    }
  } catch {
  }
}
function filterFindingsForToggles(findings, config) {
  return findings.filter((finding) => {
    const type = finding.location.fileType;
    const isJs = ["js", "jsx", "mjs", "cjs"].includes(type);
    const isTs = ["ts", "tsx", "mts", "cts"].includes(type);
    const isSfc = ["vue", "svelte", "astro"].includes(type);
    const isCss = ["css", "scss", "less", "sass"].includes(type) || (type === "html" || isSfc) && (finding.category.includes("css") || finding.category === "unused-stylesheet");
    if (isJs && !config.analysis.javascript) return false;
    if (isTs && !config.analysis.typescript) return false;
    if (isSfc && !config.analysis.javascript && !config.analysis.typescript) return false;
    if (isCss && !config.analysis.css) return false;
    if (finding.category === "unused-stylesheet" || finding.category.startsWith("unused-css") || finding.category.startsWith("duplicate-css") || finding.category === "css-specificity") {
      if (!config.analysis.css) return false;
    }
    if (finding.category === "unused-type" || finding.category === "unused-type-parameter" || finding.category === "unused-type-only-import") {
      if (!config.analysis.typescript) return false;
    }
    return true;
  });
}
function findingCounts(findings) {
  const byCategory = {};
  const bySeverity = {};
  const byConfidence = {};
  const counts = {
    total: findings.length,
    confirmedUnused: 0,
    potentiallyUnused: 0,
    notObserved: 0,
    dynamicallyReferenced: 0,
    unknown: 0,
    byCategory,
    bySeverity,
    byConfidence
  };
  for (const finding of findings) {
    if (finding.status === "confirmed-unused") counts.confirmedUnused += 1;
    else if (finding.status === "potentially-unused") counts.potentiallyUnused += 1;
    else if (finding.status === "not-observed") counts.notObserved += 1;
    else if (finding.status === "dynamically-referenced") counts.dynamicallyReferenced += 1;
    else counts.unknown += 1;
    byCategory[finding.category] = (byCategory[finding.category] ?? 0) + 1;
    bySeverity[finding.severity] = (bySeverity[finding.severity] ?? 0) + 1;
    byConfidence[finding.confidence] = (byConfidence[finding.confidence] ?? 0) + 1;
  }
  return counts;
}
function disjointConfirmedBytes(findings) {
  const candidates = findings.filter(
    (finding) => finding.status === "confirmed-unused" && !finding.category.includes("css") && (finding.size.estimatedRemovableBytes ?? 0) > 0
  ).sort((a, b) => {
    if (a.location.relativeFile !== b.location.relativeFile) {
      return a.location.relativeFile.localeCompare(b.location.relativeFile);
    }
    return a.location.line - b.location.line;
  });
  let total = 0;
  let lastFile = "";
  let lastEnd = -1;
  for (const finding of candidates) {
    const end = finding.location.endLine ?? finding.location.line;
    if (finding.location.relativeFile === lastFile && finding.location.line <= lastEnd) continue;
    total += finding.size.estimatedRemovableBytes ?? 0;
    lastFile = finding.location.relativeFile;
    lastEnd = end;
  }
  return total;
}
function runtimeSummary(runtime, sessions) {
  const summaries = sessions.map((session) => {
    const routes = new Set(session.visits.map((visit) => visit.route));
    const scripts = /* @__PURE__ */ new Set();
    const stylesheets = /* @__PURE__ */ new Set();
    let dynamic = 0;
    for (const visit of session.visits) {
      for (const resource of visit.snapshot.routes.flatMap((route) => route.resources)) {
        if (resource.type === "js") scripts.add(resource.url);
        if (resource.type === "css") stylesheets.add(resource.url);
      }
      for (const route of visit.snapshot.routes) {
        for (const script of route.scripts) scripts.add(script);
        for (const sheet of route.stylesheets) stylesheets.add(sheet);
        dynamic += route.dynamicCss.length;
      }
    }
    return {
      id: session.id,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      baseUrl: session.baseUrl,
      browser: session.browser,
      interactive: session.interactive,
      routes: [...routes].sort(),
      scripts: scripts.size,
      stylesheets: stylesheets.size,
      dynamicStylesheets: dynamic,
      coverageUsed: Boolean(session.coverageSession?.available) || session.visits.some((visit) => visit.coverage?.available),
      networkUsed: session.visits.some((visit) => visit.snapshot.routes.some((route) => route.resources.length > 0))
    };
  });
  const scriptAssets = /* @__PURE__ */ new Set();
  const stylesheetAssets = /* @__PURE__ */ new Set();
  let dynamicStylesheets = 0;
  for (const route of runtime.routes.values()) {
    for (const resource of route.resources) {
      if (resource.type === "js") scriptAssets.add(resource.url);
      if (resource.type === "css") stylesheetAssets.add(resource.url);
    }
    for (const script of route.scripts) scriptAssets.add(script);
    for (const sheet of route.stylesheets) stylesheetAssets.add(sheet);
    dynamicStylesheets += route.dynamicCss.length;
  }
  const interactive = sessions.some((session) => session.interactive);
  return {
    available: sessions.length > 0,
    sessions: summaries,
    mergedSessions: sessions.length,
    routes: runtime.routes.size,
    scriptAssets: scriptAssets.size,
    stylesheets: stylesheetAssets.size,
    dynamicStylesheets,
    ...sessions[0]?.browser ? { browser: sessions[0].browser } : {},
    notes: [
      ...interactive ? ["Interactive sessions provide route CSS/DOM data and session-level JavaScript coverage."] : [],
      ...runtime.warnings.length > 0 ? runtime.warnings : [],
      ...sessions.length === 0 ? ["No runtime sessions were found. Run `code-usage-map analyze` after starting the app."] : []
    ]
  };
}
function projectReport(root, detection, config, staticResult) {
  const entryPoints = /* @__PURE__ */ new Set([...detection.detectedEntryPoints, ...staticResult.entryPoints]);
  return {
    root,
    name: detection.name,
    ...detection.version ? { version: detection.version } : {},
    mode: config.mode,
    packageManager: detection.packageManager,
    frameworks: detection.frameworks,
    buildTools: detection.buildTools,
    sourceRoots: detection.sourceRoots.map((dir) => relativePosix(root, dir)),
    buildDirs: detection.buildDirs.map((dir) => relativePosix(root, dir)),
    entryPoints: [...entryPoints].map((file) => relativePosix(root, file)).sort(),
    ...detection.tsconfig ? { tsconfig: relativePosix(root, detection.tsconfig) } : {},
    filesByLanguage: detection.filesByLanguage
  };
}
async function runFullAnalysis(options) {
  const start = Date.now();
  const { root, config, signal } = options;
  const progress = options.onProgress;
  const warnings = [];
  const detection = options.detection ?? detectProject(root, {
    source: config.source,
    buildDirs: config.build.dir ? Array.isArray(config.build.dir) ? config.build.dir : [config.build.dir] : void 0,
    tsconfig: config.tsconfig,
    includeTemplates: config.css.scanTemplates
  });
  progress?.({ phase: "detect", message: `Detected ${detection.name}${detection.frameworks.length > 0 ? ` (${detection.frameworks.map((item) => item.name).join(", ")})` : ""}.` });
  const files = collectSourceFiles(config, detection);
  if (files.files.length === 0) {
    warnings.push("No source files matched the configured source/include/exclude patterns.");
  }
  let key = "";
  let cached;
  if (config.cache.enabled && !options.refresh) {
    progress?.({ phase: "cache", message: "Checking analysis cache." });
    key = cacheKey(config, files, detection, signal);
    cached = loadCache(config, key);
  }
  let staticResult;
  let cssResult;
  let dependencyResult;
  if (cached) {
    staticResult = cached.staticResult;
    cssResult = config.analysis.css ? cached.cssResult : emptyCssResult();
    dependencyResult = config.analysis.dependencies ? cached.dependencyResult : emptyDependencyResult();
    warnings.push(...cached.warnings, "Loaded cached static/CSS/dependency analysis.");
    progress?.({ phase: "cache", message: "Reused cached static analysis." });
  } else {
    progress?.({ phase: "static", message: `Analyzing JavaScript/TypeScript in ${files.scripts.length} file(s).` });
    staticResult = config.analysis.javascript || config.analysis.typescript || config.analysis.dependencies || config.analysis.css ? analyzeStatic({ root, config, detection, files, signal }) : emptyStaticResult();
    progress?.({ phase: "css", message: config.analysis.css ? `Analyzing CSS in ${files.styles.length} source file(s).` : "CSS analysis disabled." });
    cssResult = config.analysis.css ? await analyzeCss({ root, config, files, staticResult, signal }) : emptyCssResult();
    progress?.({ phase: "dependencies", message: config.analysis.dependencies ? "Analyzing dependencies." : "Dependency analysis disabled." });
    dependencyResult = config.analysis.dependencies ? analyzeDependencies({ root, detection, files, staticResult, signal }) : emptyDependencyResult();
    if (config.cache.enabled) {
      progress?.({ phase: "cache", message: "Writing analysis cache." });
      key = key || cacheKey(config, files, detection, signal);
      saveCache(config, key, {
        cacheVersion: CACHE_VERSION,
        key,
        staticResult,
        cssResult,
        dependencyResult,
        warnings: [...staticResult.warnings, ...cssResult.warnings, ...dependencyResult.warnings]
      });
    }
  }
  warnings.push(...staticResult.warnings, ...cssResult.warnings, ...dependencyResult.warnings);
  progress?.({ phase: "bundles", message: config.analysis.bundles ? "Analyzing build outputs and source maps." : "Bundle analysis disabled." });
  const bundleResult = config.analysis.bundles ? analyzeBundles({ root, config, detection, signal }) : emptyBundleResult();
  warnings.push(...bundleResult.warnings);
  let findings = [
    ...staticResult.findings,
    ...cssResult.findings,
    ...dependencyResult.findings,
    ...bundleResult.findings
  ];
  findings = filterFindingsForToggles(findings, config);
  let sessions = [];
  if (config.analysis.runtime) {
    progress?.({ phase: "runtime", message: "Merging runtime sessions." });
    if (options.runtimeSessions) {
      sessions = options.runtimeSessions;
    } else {
      const loaded = loadRuntimeSessions(root, signal);
      sessions = loaded.sessions;
      warnings.push(...loaded.warnings);
    }
  }
  const runtime = mergeRuntimeSessions(sessions);
  warnings.push(...runtime.warnings);
  progress?.({ phase: "routes", message: "Building route-level usage reports." });
  const routeAnalysis = analyzeRoutes({
    root,
    config,
    detection,
    bundle: bundleResult,
    css: cssResult,
    runtime,
    findings,
    htmlFiles: files.html,
    signal
  });
  findings = routeAnalysis.findings;
  warnings.push(...routeAnalysis.warnings);
  if (config.analysis.sourceMaps && config.sourceMaps.enabled && config.analysis.bundles && runtime.sessions.some(
    (session) => session.visits.some((visit) => (visit.coverage?.functions.length ?? 0) > 0)
  ) && routeAnalysis.executedSources.length === 0) {
    warnings.push(
      "Runtime coverage was collected but no executed function could be mapped to source. Confirm that production source maps are served and bundle URL paths match build files."
    );
  }
  let mappingSummary = {
    mappedFindings: 0,
    eligibleFindings: 0,
    precision: { symbol: 0, lineColumn: 0, line: 0, file: 0 }
  };
  if (config.analysis.sourceMaps && config.sourceMaps.enabled && config.analysis.bundles) {
    progress?.({ phase: "source-maps", message: "Mapping findings through bundle source maps." });
    mappingSummary = attachSourceMappings(findings, bundleResult.sourceMapIndexes, bundleResult.report, root);
  }
  const sourceMapReport = createSourceMapReport(
    bundleResult.sourceMapIndexes,
    mappingSummary,
    config.analysis.sourceMaps && config.sourceMaps.enabled && config.analysis.bundles
  );
  progress?.({ phase: "recommendations", message: "Generating recommendations." });
  const recommendations = config.analysis.recommendations ? generateRecommendations({ root, findings, routes: routeAnalysis.routes, cssInJs: cssResult.warnings.some((warning) => warning.includes("CSS-in-JS")) }) : [];
  const finalCssFindings = findings.filter(
    (finding) => finding.category === "unused-css-selector" || finding.category === "unused-stylesheet"
  );
  const unusedStylesheetFindings = findings.filter((finding) => finding.category === "unused-stylesheet");
  const cssReport = {
    ...cssResult.report,
    matchedSelectors: Math.max(cssResult.report.matchedSelectors, routeAnalysis.runtimeMatchedSelectors),
    unmatchedSelectors: finalCssFindings.filter((finding) => finding.category === "unused-css-selector").length,
    unusedStylesheetFiles: unusedStylesheetFindings.map((finding) => finding.location.relativeFile),
    runtimeInjectedRules: [...runtime.routes.values()].reduce((sum, route) => sum + route.dynamicCss.length, 0),
    notes: [
      ...cssResult.report.notes,
      ...runtime.sessions.length > 0 ? ["Runtime selector matches have been merged into CSS coverage."] : []
    ]
  };
  const duplicateMap = /* @__PURE__ */ new Map();
  for (const duplicate of [...dependencyResult.report.duplicateVersions, ...bundleResult.report.duplicateDependencies]) {
    const key2 = `${duplicate.packageName}|${duplicate.versions.join(",")}`;
    const existing = duplicateMap.get(key2);
    if (existing) {
      for (const location of duplicate.locations) if (!existing.locations.includes(location)) existing.locations.push(location);
    } else {
      duplicateMap.set(key2, { ...duplicate, locations: [...duplicate.locations] });
    }
  }
  const bundleReport = {
    ...bundleResult.report,
    duplicateDependencies: [...duplicateMap.values()]
  };
  const counts = findingCounts(findings);
  const sourceFileSet = /* @__PURE__ */ new Set([
    ...staticResult.files.map((file) => file.file),
    ...cssResult.stylesheets.map((stylesheet) => stylesheet.file),
    ...detection.templateFiles
  ]);
  const potentialRuntime = Math.max(
    0,
    ...routeAnalysis.routes.map(
      (route) => route.coverage ? Math.max(0, route.coverage.totalBytes - route.coverage.executedBytes) : 0
    )
  );
  const confirmedStatic = disjointConfirmedBytes(findings);
  const summary = {
    sourceFiles: sourceFileSet.size,
    javascriptFiles: staticResult.files.filter((file) => ["js", "jsx", "mjs", "cjs"].includes(file.type)).length,
    typescriptFiles: staticResult.files.filter((file) => ["ts", "tsx", "mts", "cts"].includes(file.type)).length,
    cssFiles: cssResult.stylesheets.length,
    templateFiles: detection.templateFiles.length,
    totalLines: staticResult.totalLines,
    modules: staticResult.modules.length,
    symbols: staticResult.symbolCount,
    buildFiles: bundleReport.files.length,
    findings: counts,
    cssSelectors: cssReport.selectors,
    unusedCssSelectors: counts.byCategory["unused-css-selector"] ?? 0,
    routes: routeAnalysis.routes.length,
    dependencies: dependencyResult.report.declared,
    unusedDependencies: dependencyResult.report.unused.length,
    recommendations: recommendations.length,
    bundles: {
      jsRawBytes: bundleReport.totals.jsRawBytes,
      cssRawBytes: bundleReport.totals.cssRawBytes,
      totalRawBytes: bundleReport.totals.rawBytes,
      gzipBytes: bundleReport.totals.gzipBytes,
      brotliBytes: bundleReport.totals.brotliBytes
    },
    estimatedCandidateBytes: {
      confirmedStatic,
      potentialRuntime,
      additive: false,
      note: "confirmedStatic avoids nested/overlapping confirmed spans. potentialRuntime is the largest single-route unexecuted-function estimate. Do not add them or sum across routes."
    }
  };
  const runtimeReport = runtimeSummary(runtime, sessions);
  const warningObjects = [...new Set(warnings)].map((message) => ({
    code: message.startsWith("Loaded cached") ? "cache-hit" : "analysis",
    message,
    fatal: false
  }));
  if (options.configPath) {
    warningObjects.push({
      code: "config",
      message: `Configuration: ${relativePosix(root, options.configPath)}`,
      fatal: false
    });
  }
  const command = options.command ?? "api";
  const report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generator: {
      name: TOOL_NAME,
      version: TOOL_VERSION,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      durationMs: Date.now() - start,
      nodeVersion: process.version,
      platform: process.platform,
      command
    },
    project: projectReport(root, detection, config, staticResult),
    config,
    summary,
    findings: findings.sort((a, b) => {
      const severityOrder = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4
      };
      const severity = severityOrder[a.severity] - severityOrder[b.severity];
      if (severity !== 0) return severity;
      if (a.location.relativeFile !== b.location.relativeFile) {
        return a.location.relativeFile.localeCompare(b.location.relativeFile);
      }
      return a.location.line - b.location.line;
    }),
    routes: routeAnalysis.routes,
    css: cssReport,
    bundles: bundleReport,
    dependencies: dependencyResult.report,
    sourceMaps: sourceMapReport,
    runtime: runtimeReport,
    recommendations,
    warnings: warningObjects,
    limitations: [
      "Static analysis never executes application source code; runtime behavior can differ.",
      "CSS selectors and declarations are never marked confirmed unused without manual verification. Missing runtime matches are not proof.",
      "Precise function coverage is Chromium-only. Interactive sessions provide session-level coverage rather than route-scoped coverage.",
      "Source-map symbol precision depends on the map names table and bundler output; otherwise line/file precision is reported.",
      "Framework lifecycle methods and decorated classes are excluded from some unused-method checks to avoid false positives.",
      "Re-export barrels and non-literal dynamic module loading can hide external consumers; affected findings are conservative.",
      "CSS-in-JS and shadow DOM styles are observed via runtime CSSOM where accessible; cross-origin stylesheets may be unreadable.",
      "Indented Sass requires the optional `sass` peer dependency. SCSS/LESS variables are not treated as unused declarations.",
      "Next.js/Webpack initial/lazy classification is partial unless an entry HTML file or supported manifest is available.",
      "Size estimates are candidates, not guaranteed savings. Never add overlapping estimates to bundle totals.",
      "Safe autofix is limited to fully unused import declarations; CSS removal and behavioral refactors require developer review."
    ]
  };
  progress?.({ phase: "done", message: `Analysis complete: ${findings.length} finding(s), ${recommendations.length} recommendation(s).` });
  return {
    report,
    findings,
    routes: routeAnalysis.routes,
    recommendations,
    staticResult,
    cssResult,
    dependencyResult,
    bundleResult,
    runtime,
    sessions,
    routeAnalysis,
    durationMs: Date.now() - start,
    warnings: [...new Set(warnings)]
  };
}
function statusColor(status) {
  if (status === "confirmed-unused") return pc.red;
  if (status === "potentially-unused") return pc.yellow;
  if (status === "dynamically-referenced") return pc.magenta;
  if (status === "executed") return pc.green;
  return pc.gray;
}
function findingLine(finding) {
  const location = `${finding.location.relativeFile}:${finding.location.line}:${finding.location.column}`;
  const symbol = finding.symbol ? pc.bold(truncate(finding.symbol, 70)) : finding.title;
  const mapping = finding.mapping ? pc.gray(` \u2192 ${toPosix(path8.basename(finding.mapping.generatedFile))}:${finding.mapping.generatedLine} (${finding.mapping.precision})`) : "";
  const size = finding.size.estimatedRemovableBytes ? pc.gray(` ~${formatBytes(finding.size.estimatedRemovableBytes)}`) : "";
  const routes = finding.routeHints.length > 0 ? pc.cyan(` [${finding.routeHints.slice(0, 4).join(", ")}]`) : "";
  return `  ${statusColor(finding.status)(finding.status)} ${pc.gray(finding.category.padEnd(28))} ${symbol}
    ${pc.underline(location)}${mapping}${size}${routes}`;
}
function routeLine(route) {
  const executed = route.modules.filter((module) => module.executed).length;
  const loaded = route.modules.length;
  const coverage = route.coverage ? `${formatPercent(route.coverage.percent)} exec` : "no JS coverage";
  const unmatched = route.cssUsage.unmatchedSelectorCount;
  const cssBytes = route.cssUsage.bytes ? formatBytes(route.cssUsage.bytes) : "0 B";
  return `  ${pc.bold(route.path.padEnd(28))} ${pc.gray(route.kind.padEnd(7))} ${coverage.padEnd(16)} modules ${executed}/${loaded}  CSS unmatched ${String(unmatched).padEnd(5)} (${cssBytes} loaded)`;
}
function renderConsoleReport(report, options = {}) {
  const lines = [];
  const maxFindings = options.maxFindings ?? 15;
  const maxRoutes = options.maxRoutes ?? 12;
  const maxRecommendations = options.maxRecommendations ?? 8;
  const summary = report.summary;
  lines.push("");
  lines.push(pc.bold(pc.cyan("Code Usage Map")) + pc.gray(`  ${report.project.name}  \u2022  ${report.project.mode} project`));
  lines.push(pc.gray(`Root: ${report.project.root}`));
  if (report.project.frameworks.length > 0 || report.project.buildTools.length > 0) {
    lines.push(
      pc.gray("Detected: ") + [
        ...report.project.frameworks.map((framework) => framework.name),
        ...report.project.buildTools.map((tool) => tool.name)
      ].join(", ")
    );
  }
  lines.push("");
  lines.push(pc.bold("Summary"));
  lines.push(
    `  Source files ${pc.bold(String(summary.sourceFiles))}  \u2022  JS ${summary.javascriptFiles}  \u2022  TS ${summary.typescriptFiles}  \u2022  CSS ${summary.cssFiles}  \u2022  Routes ${summary.routes}  \u2022  Build assets ${summary.buildFiles}`
  );
  lines.push(
    `  Findings ${pc.bold(String(summary.findings.total))}  \u2022  confirmed ${pc.red(String(summary.findings.confirmedUnused))}  \u2022  potential ${pc.yellow(String(summary.findings.potentiallyUnused))}  \u2022  recommendations ${summary.recommendations}`
  );
  lines.push(
    `  Bundles ${formatBytes(summary.bundles.totalRawBytes)} raw  \u2022  ${formatBytes(summary.bundles.gzipBytes)} gzip  \u2022  ${formatBytes(summary.bundles.brotliBytes)} brotli  \u2022  unused CSS selectors ${summary.unusedCssSelectors}`
  );
  lines.push(
    `  Candidate static removal ${formatBytes(summary.estimatedCandidateBytes.confirmedStatic)} ${pc.gray("(not guaranteed, not additive with runtime)")}`
  );
  lines.push("");
  const topFindings = report.findings.filter((finding) => finding.severity !== "info").slice(0, maxFindings);
  if (topFindings.length > 0) {
    lines.push(pc.bold(`Top findings (${report.findings.length} total)`));
    for (const finding of topFindings) lines.push(findingLine(finding));
    if (report.findings.length > topFindings.length) {
      lines.push(pc.gray(`  \u2026 ${report.findings.length - topFindings.length} more in JSON/HTML report`));
    }
    lines.push("");
  }
  if (report.routes.length > 0) {
    lines.push(pc.bold("Routes"));
    for (const route of report.routes.slice(0, maxRoutes)) lines.push(routeLine(route));
    if (report.routes.length > maxRoutes) lines.push(pc.gray(`  \u2026 ${report.routes.length - maxRoutes} more routes`));
    lines.push("");
  } else {
    lines.push(pc.bold("Routes"));
    lines.push(pc.gray("  No route data yet. Add routes to configuration or run:"));
    lines.push(pc.cyan("  npx @codewithrajat/code-usage-map analyze --url http://localhost:5173 --routes /,/dashboard"));
    lines.push("");
  }
  if (report.css.unusedCustomProperties.length > 0 || report.css.unusedStylesheetFiles.length > 0) {
    lines.push(pc.bold("CSS"));
    if (report.css.unusedCustomProperties.length > 0) {
      lines.push(`  Unused custom properties: ${pc.yellow(report.css.unusedCustomProperties.slice(0, 8).join(", "))}`);
    }
    if (report.css.unusedStylesheetFiles.length > 0) {
      lines.push(`  Unreferenced stylesheets: ${pc.yellow(report.css.unusedStylesheetFiles.slice(0, 8).join(", "))}`);
    }
    lines.push("");
  }
  if (report.recommendations.length > 0) {
    lines.push(pc.bold("Recommendations"));
    for (const recommendation of report.recommendations.slice(0, maxRecommendations)) {
      const impact = recommendation.sizeImpact ? pc.gray(` ~${formatBytes(recommendation.sizeImpact.estimatedBytes)}`) : "";
      lines.push(
        `  ${pc.cyan("\u2022")} ${pc.bold(truncate(recommendation.title, 100))} ${pc.gray(`[risk ${recommendation.risk}, ${recommendation.confidence}]`)}${impact}`
      );
      lines.push(pc.gray(`    ${truncate(recommendation.action, 160)}`));
    }
    if (report.recommendations.length > maxRecommendations) {
      lines.push(pc.gray(`  \u2026 ${report.recommendations.length - maxRecommendations} more recommendations`));
    }
    lines.push("");
  }
  if (report.warnings.length > 0) {
    const important = report.warnings.filter((warning) => !warning.message.startsWith("Configuration:"));
    if (important.length > 0) {
      lines.push(pc.bold("Warnings"));
      for (const warning of important.slice(0, 8)) lines.push(`  ${pc.yellow("!")} ${truncate(warning.message, 180)}`);
      lines.push("");
    }
  }
  lines.push(
    pc.gray(
      `Generated in ${(report.generator.durationMs / 1e3).toFixed(2)}s with ${report.generator.name}@${report.generator.version}`
    )
  );
  if (options.showPaths !== false) {
    lines.push(pc.gray("Open the HTML report for clickable source links, route CSS drill-down and mapping chains."));
  }
  lines.push("");
  return lines.join("\n");
}

// src/report/html.ts
var STYLES = String.raw`
:root {
  color-scheme: light;
  --bg: #f5f7fb;
  --panel: #ffffff;
  --ink: #172033;
  --muted: #667085;
  --line: #e4e8f0;
  --accent: #4f46e5;
  --accent-soft: #eef2ff;
  --green: #087443;
  --green-soft: #e8f7ef;
  --red: #b42318;
  --red-soft: #fee4e2;
  --amber: #8a4b08;
  --amber-soft: #fef0c7;
  --gray-soft: #f2f4f7;
  --blue: #175cd3;
  --blue-soft: #eff8ff;
  --shadow: 0 10px 30px rgba(23, 32, 51, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font-size: 14px; line-height: 1.45; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code, pre, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
button, input, select { font: inherit; }
button { cursor: pointer; }
.topbar {
  background: #111827; color: #fff; padding: 18px 26px; display: flex; align-items: center;
  justify-content: space-between; gap: 18px; position: sticky; top: 0; z-index: 30;
}
.brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.brand-mark {
  width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #818cf8, #22d3ee);
  display: grid; place-items: center; font-weight: 800; color: #0b1120; flex: 0 0 auto;
}
.brand-title { font-size: 17px; font-weight: 700; letter-spacing: .01em; }
.brand-sub { font-size: 12px; color: #a5b4fc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-meta { font-size: 12px; color: #cbd5e1; text-align: right; min-width: 180px; }
.layout { display: grid; grid-template-columns: 215px minmax(0, 1fr); min-height: calc(100vh - 70px); }
.sidebar { background: #fff; border-right: 1px solid var(--line); padding: 18px 12px; position: sticky; top: 70px; height: calc(100vh - 70px); overflow-y: auto; }
.tab-btn {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; margin: 2px 0;
  border: 0; border-radius: 9px; background: transparent; color: var(--ink); text-align: left; font-weight: 550;
}
.tab-btn:hover { background: var(--gray-soft); }
.tab-btn.active { background: var(--accent-soft); color: var(--accent); }
.tab-count { margin-left: auto; font-size: 11px; background: var(--gray-soft); color: var(--muted); border-radius: 99px; padding: 1px 7px; }
main { padding: 26px; max-width: 1600px; width: 100%; margin: 0 auto; }
h1 { font-size: 25px; margin: 0 0 4px; letter-spacing: -.02em; }
h2 { font-size: 16px; margin: 0 0 13px; }
h3 { font-size: 14px; margin: 0 0 8px; }
.subtitle { color: var(--muted); margin: 0 0 20px; }
.tab-panel { display: none; }
.tab-panel.active { display: block; animation: fade .16s ease-out; }
@keyframes fade { from { opacity: .4; transform: translateY(3px); } to { opacity: 1; transform: none; } }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 18px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px; box-shadow: 0 1px 2px rgba(23,32,51,.03); }
.card-label { color: var(--muted); font-size: 12px; margin-bottom: 4px; }
.card-value { font-size: 22px; font-weight: 750; letter-spacing: -.02em; }
.card-note { color: var(--muted); font-size: 11px; margin-top: 3px; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 13px; padding: 17px; margin-bottom: 15px; box-shadow: 0 1px 2px rgba(23,32,51,.03); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
.grid > .panel { margin: 0; }
.bar-row { display: grid; grid-template-columns: minmax(90px, 170px) minmax(80px, 1fr) 56px; align-items: center; gap: 10px; margin: 7px 0; font-size: 12px; }
.bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { height: 7px; border-radius: 99px; background: var(--gray-soft); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #6366f1, #22d3ee); }
.bar-value { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }
.filterbar { position: sticky; top: 70px; z-index: 20; background: rgba(245,247,251,.96); backdrop-filter: blur(8px); padding: 10px 0 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.filterbar input[type="search"] { flex: 1 1 260px; min-width: 200px; }
input[type="search"], select {
  border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 8px 10px; color: var(--ink); min-height: 36px;
}
input[type="search"]:focus, select:focus { outline: 2px solid #c7d2fe; border-color: var(--accent); }
.btn { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 7px 11px; color: var(--ink); }
.btn:hover { border-color: #c7d2fe; background: var(--accent-soft); }
.btn.primary { border-color: var(--accent); background: var(--accent); color: #fff; }
.btn.primary:hover { background: #4338ca; }
.btn.link { border: 0; background: transparent; color: var(--accent); padding: 2px 4px; text-decoration: underline; }
.small { font-size: 12px; }
.muted { color: var(--muted); }
.list { display: grid; gap: 9px; }
.finding {
  background: var(--panel); border: 1px solid var(--line); border-radius: 11px; padding: 13px 15px; cursor: pointer;
  transition: border-color .12s, box-shadow .12s;
}
.finding:hover { border-color: #c7d2fe; box-shadow: var(--shadow); }
.finding-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.finding-title { font-weight: 650; word-break: break-word; }
.finding-meta { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin-top: 6px; color: var(--muted); font-size: 12px; }
.path { word-break: break-all; }
.badges { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.badge { border-radius: 99px; padding: 2px 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .02em; white-space: nowrap; border: 1px solid transparent; }
.status-confirmed-unused { background: var(--red-soft); color: var(--red); }
.status-potentially-unused { background: var(--amber-soft); color: var(--amber); }
.status-not-observed { background: var(--blue-soft); color: var(--blue); }
.status-dynamically-referenced { background: #f4f3ff; color: #5925dc; }
.status-executed { background: var(--green-soft); color: var(--green); }
.status-unknown { background: var(--gray-soft); color: var(--muted); }
.conf-high { background: #ecfdf3; color: var(--green); }
.conf-medium { background: var(--amber-soft); color: var(--amber); }
.conf-low { background: var(--gray-soft); color: var(--muted); }
.sev-critical, .sev-high { background: var(--red-soft); color: var(--red); }
.sev-medium { background: var(--amber-soft); color: var(--amber); }
.sev-low { background: var(--blue-soft); color: var(--blue); }
.sev-info { background: var(--gray-soft); color: var(--muted); }
.tag { background: var(--gray-soft); color: #475467; padding: 2px 7px; border-radius: 6px; font-size: 10.5px; }
.chip { display: inline-flex; align-items: center; gap: 5px; background: var(--accent-soft); color: var(--accent); border-radius: 99px; padding: 2px 8px; font-size: 11px; }
.empty { padding: 28px; border: 1px dashed var(--line); border-radius: 12px; text-align: center; color: var(--muted); background: rgba(255,255,255,.55); }
.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.section-head h2 { margin: 0; }
.route-card { background: var(--panel); border: 1px solid var(--line); border-radius: 13px; margin-bottom: 14px; overflow: hidden; }
.route-head { padding: 16px 17px; display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; cursor: pointer; }
.route-path { font-size: 18px; font-weight: 750; letter-spacing: -.01em; }
.route-stats { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; color: var(--muted); font-size: 12px; }
.route-stat strong { color: var(--ink); font-size: 14px; display: block; }
.route-body { padding: 0 17px 17px; border-top: 1px solid var(--line); }
.route-body[hidden] { display: none; }
.subpanel { padding: 14px 0 0; }
.subpanel > h3 { display: flex; justify-content: space-between; gap: 10px; }
.mini-list { display: grid; gap: 5px; max-height: 330px; overflow: auto; border: 1px solid var(--line); border-radius: 9px; padding: 7px; background: #fcfdff; }
.mini-row { display: flex; justify-content: space-between; gap: 12px; padding: 5px 7px; border-radius: 6px; font-size: 12px; }
.mini-row:hover { background: var(--accent-soft); }
.mini-main { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini-side { flex: 0 0 auto; color: var(--muted); font-variant-numeric: tabular-nums; }
.progress { height: 7px; border-radius: 99px; background: var(--gray-soft); overflow: hidden; margin-top: 10px; max-width: 420px; }
.progress > span { display: block; height: 100%; background: var(--green); }
.table-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 9px; }
table { border-collapse: collapse; width: 100%; font-size: 12px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { background: #f8fafc; color: var(--muted); font-weight: 650; position: sticky; top: 0; }
tr:last-child td { border-bottom: 0; }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.drawer {
  position: fixed; z-index: 60; right: 0; top: 0; height: 100vh; width: min(760px, 96vw); background: #fff;
  box-shadow: -24px 0 60px rgba(15,23,42,.2); overflow-y: auto; padding: 24px 26px 60px;
}
.drawer[hidden] { display: none; }
.backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.35); z-index: 50; }
.backdrop[hidden] { display: none; }
.drawer-close { position: sticky; top: 0; float: right; border: 1px solid var(--line); background: #fff; border-radius: 8px; width: 34px; height: 34px; font-size: 18px; z-index: 2; }
.drawer-title { font-size: 21px; font-weight: 750; line-height: 1.3; padding-right: 42px; margin: 0 0 10px; }
.drawer h3 { margin-top: 22px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.drawer p { margin: 7px 0; }
.snippet { background: #0f172a; color: #e2e8f0; border-radius: 10px; overflow: auto; padding: 12px 0; font-size: 12px; line-height: 1.55; }
.snippet-line { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 10px; padding: 0 14px; white-space: pre; }
.snippet-line.highlight { background: rgba(99,102,241,.25); }
.snippet-no { color: #64748b; text-align: right; user-select: none; }
.source-actions { display: flex; flex-wrap: wrap; gap: 7px; margin: 8px 0 14px; }
.chain { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin: 8px 0; }
.chain-hop { border: 1px solid var(--line); background: #fbfcff; border-radius: 7px; padding: 5px 8px; font-size: 11px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.chain-arrow { color: var(--muted); }
.kv { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 5px 12px; font-size: 12px; }
.kv dt { color: var(--muted); }
.kv dd { margin: 0; word-break: break-word; }
.recommendation { border: 1px solid var(--line); border-radius: 12px; padding: 14px 15px; margin-bottom: 10px; background: #fff; }
.recommendation h3 { margin: 0 0 6px; font-size: 15px; color: var(--ink); text-transform: none; letter-spacing: 0; }
.recommendation ol { margin: 8px 0 0 20px; padding: 0; color: #344054; }
.recommendation li { margin: 3px 0; }
.split { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 15px; }
.side-note { background: #fffbeb; border: 1px solid #fde68a; color: #713f12; border-radius: 10px; padding: 12px; font-size: 12px; }
.info-note { background: var(--blue-soft); border: 1px solid #b2ddff; color: #194185; border-radius: 10px; padding: 12px; font-size: 12px; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; display: flex; overflow-x: auto; gap: 4px; border-right: 0; border-bottom: 1px solid var(--line); padding: 8px; top: 70px; }
  .tab-btn { width: auto; white-space: nowrap; }
  .tab-count { display: none; }
  main { padding: 18px 14px; }
  .split { grid-template-columns: 1fr; }
  .filterbar { top: 70px; }
  .top-meta { display: none; }
}
`;
var CLIENT = String.raw`
(function () {
  'use strict';
  var data = JSON.parse(document.getElementById('cum-data').textContent);
  var root = data.project.root;
  var recById = {};
  data.recommendations.forEach(function (rec) { recById[rec.id] = rec; });
  var state = { tab: 'overview', search: '', category: '', status: '', confidence: '', severity: '', route: '', language: '', kind: '', file: '', parent: '', finding: '', limit: 240 };
  var filterSelects = { category: 'filterCategory', status: 'filterStatus', confidence: 'filterConfidence', severity: 'filterSeverity', route: 'filterRoute', language: 'filterLanguage', kind: 'filterKind', file: 'filterFile', parent: 'filterParent' };

  function byId(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function append(parent) {
    for (var i = 1; i < arguments.length; i += 1) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function bytes(value) {
    if (value === undefined || value === null || !isFinite(value) || value <= 0) return '0 B';
    if (value < 1024) return Math.round(value) + ' B';
    var units = ['KB', 'MB', 'GB'];
    var v = value / 1024;
    var i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
    return (v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + units[i];
  }
  function pct(value) { return (value === undefined || value === null || !isFinite(value)) ? '0%' : (Math.round(value * 10) / 10) + '%'; }
  function absPath(p) {
    if (!p) return '';
    if (p.charAt(0) === '/' || /^[A-Za-z]:[\\/]/.test(p)) return p;
    return root.replace(/[\\/]+$/, '') + '/' + p.replace(/^[\\/]+/, '');
  }
  function editorHref(p, line, column) {
    var a = absPath(p).replace(/\\/g, '/');
    return 'vscode://file/' + encodeURI(a) + ':' + (line || 1) + ':' + (column || 1);
  }
  function fileHref(p, line, column) {
    var a = absPath(p).replace(/\\/g, '/');
    var href = /^[A-Za-z]:/.test(a) ? 'file:///' + encodeURI(a) : 'file://' + encodeURI(a);
    if (line) href += '#L' + line;
    return href;
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      var area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(area);
    }
  }
  function copyButton(text, label) {
    var b = el('button', 'btn small', label || 'Copy path');
    b.type = 'button';
    b.addEventListener('click', function (event) { event.stopPropagation(); copyText(text); b.textContent = 'Copied'; setTimeout(function () { b.textContent = label || 'Copy path'; }, 1200); });
    return b;
  }
  function sourceActions(container, file, line, column, options) {
    if (!file) return container;
    var actions = el('div', 'source-actions');
    var open = el('a', 'btn small', 'Open in editor');
    open.href = editorHref(file, line, column);
    var fileLink = el('a', 'btn small', 'Open file');
    fileLink.href = fileHref(file, line, column);
    actions.appendChild(open);
    actions.appendChild(fileLink);
    actions.appendChild(copyButton(absPath(file) + (line ? ':' + line : ''), 'Copy path'));
    if (options && options.relative) actions.appendChild(el('span', 'tag mono', options.relative + (line ? ':' + line : '')));
    container.appendChild(actions);
    return container;
  }
  function badge(text, cls) { return el('span', 'badge ' + (cls || ''), text); }
  function statusBadge(status) { return badge(status, 'status-' + status); }
  function confidenceBadge(confidence) { return badge(confidence + ' confidence', 'conf-' + confidence); }
  function severityBadge(severity) { return badge(severity, 'sev-' + severity); }
  function card(label, value, note) {
    var c = el('div', 'card');
    c.appendChild(el('div', 'card-label', label));
    c.appendChild(el('div', 'card-value', value));
    if (note) c.appendChild(el('div', 'card-note', note));
    return c;
  }
  function barRow(label, value, max, text) {
    var row = el('div', 'bar-row');
    row.appendChild(el('span', 'bar-label', label));
    var track = el('div', 'bar-track');
    var fill = el('span', 'bar-fill');
    fill.style.width = Math.max(1, Math.round((value / Math.max(1, max)) * 100)) + '%';
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('span', 'bar-value', text));
    return row;
  }
  function kvList(entries) {
    var dl = el('dl', 'kv');
    entries.forEach(function (entry) {
      if (entry[1] === undefined || entry[1] === null || entry[1] === '') return;
      dl.appendChild(el('dt', null, entry[0]));
      var dd = el('dd');
      if (entry[2]) dd.appendChild(entry[2]); else dd.textContent = String(entry[1]);
      dl.appendChild(dd);
    });
    return dl;
  }
  function linkToFile(file, line, column, label) {
    var a = el('a', 'path', label || file);
    a.href = editorHref(file, line, column);
    return a;
  }

  // Tabs
  var tabs = ['overview', 'findings', 'routes', 'css', 'bundles', 'mapping', 'recommendations'];
  tabs.forEach(function (name) {
    var btn = document.querySelector('.tab-btn[data-tab="' + name + '"]');
    if (btn) btn.addEventListener('click', function () { showTab(name); });
  });
  function showTab(name) {
    state.tab = name;
    tabs.forEach(function (tab) {
      var panel = byId('tab-' + tab);
      var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
      if (panel) panel.classList.toggle('active', tab === name);
      if (btn) btn.classList.toggle('active', tab === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Overview
  function renderOverview() {
    var s = data.summary;
    var cards = byId('summaryCards');
    clear(cards);
    cards.appendChild(card('Source files', s.sourceFiles, s.javascriptFiles + ' JS · ' + s.typescriptFiles + ' TS · ' + s.cssFiles + ' CSS'));
    cards.appendChild(card('Findings', s.findings.total, s.findings.confirmedUnused + ' confirmed · ' + s.findings.potentiallyUnused + ' potential'));
    cards.appendChild(card('Bundle size', bytes(s.bundles.totalRawBytes), bytes(s.bundles.gzipBytes) + ' gzip · ' + bytes(s.bundles.brotliBytes) + ' brotli'));
    cards.appendChild(card('Routes', s.routes, data.runtime.available ? data.runtime.scriptAssets + ' scripts · ' + data.runtime.stylesheets + ' stylesheets' : 'No runtime sessions'));
    cards.appendChild(card('Unused CSS selectors', s.unusedCssSelectors, s.cssSelectors + ' selectors analyzed'));
    cards.appendChild(card('Candidate source removal', bytes(s.estimatedCandidateBytes.confirmedStatic), 'Not guaranteed; not additive with runtime'));

    var categories = Object.keys(s.findings.byCategory).sort(function (a, b) { return s.findings.byCategory[b] - s.findings.byCategory[a]; });
    var maxCategory = Math.max.apply(null, [1].concat(categories.map(function (k) { return s.findings.byCategory[k]; })));
    var categoryBars = clear(byId('categoryBars'));
    if (categories.length === 0) categoryBars.appendChild(el('div', 'empty', 'No findings.'));
    categories.forEach(function (key) { categoryBars.appendChild(barRow(key, s.findings.byCategory[key], maxCategory, String(s.findings.byCategory[key]))); });

    var bundleBars = clear(byId('bundleBars'));
    var initial = data.bundles.totals.initialRawBytes;
    var lazy = data.bundles.totals.lazyRawBytes;
    var total = Math.max(1, initial + lazy);
    bundleBars.appendChild(barRow('Initial', initial, total, bytes(initial)));
    bundleBars.appendChild(barRow('Lazy', lazy, total, bytes(lazy)));
    bundleBars.appendChild(barRow('JavaScript', data.bundles.totals.jsRawBytes, total, bytes(data.bundles.totals.jsRawBytes)));
    bundleBars.appendChild(barRow('CSS', data.bundles.totals.cssRawBytes, total, bytes(data.bundles.totals.cssRawBytes)));
    if (!data.bundles.available) bundleBars.appendChild(el('div', 'muted small', 'Build output was not found. Build the app or set build.dir.'));

    var scope = clear(byId('scope'));
    scope.appendChild(kvList([
      ['Project', data.project.name + (data.project.version ? ' ' + data.project.version : '')],
      ['Mode', data.project.mode],
      ['Package manager', data.project.packageManager],
      ['Frameworks', data.project.frameworks.map(function (f) { return f.name; }).join(', ') || 'None detected'],
      ['Build tools', data.project.buildTools.map(function (t) { return t.name; }).join(', ') || 'None detected'],
      ['Source roots', data.project.sourceRoots.join(', ')],
      ['Build dirs', data.project.buildDirs.join(', ') || 'None'],
      ['Entry points', data.project.entryPoints.slice(0, 20).join(', ')],
      ['Runtime sessions', data.runtime.sessions.length + ' session(s)' + (data.runtime.available ? ' · ' + data.runtime.routes + ' routes' : '')],
      ['Generated', data.generator.generatedAt + ' in ' + (data.generator.durationMs / 1000).toFixed(2) + 's']
    ]));
    var limit = clear(byId('limitations'));
    data.limitations.forEach(function (item) { limit.appendChild(el('li', null, item)); });

    var runtimePanel = byId('runtimePanel');
    clear(runtimePanel);
    if (data.runtime.available) {
      var list = el('div', 'list');
      data.runtime.sessions.forEach(function (session) {
        var row = el('div', 'panel');
        row.appendChild(el('div', 'finding-title', 'Session ' + session.id));
        row.appendChild(el('div', 'finding-meta', session.baseUrl + ' · ' + session.browser + ' · ' + session.routes.length + ' route(s) · ' + session.scripts + ' scripts · ' + session.stylesheets + ' stylesheets' + (session.interactive ? ' · interactive' : '')));
        list.appendChild(row);
      });
      runtimePanel.appendChild(list);
    } else {
      runtimePanel.appendChild(el('div', 'empty', 'No runtime sessions. Run code-usage-map analyze to collect actual route usage.'));
    }

    var warnings = clear(byId('warningsList'));
    var meaningful = data.warnings.filter(function (w) { return w.code !== 'config'; });
    if (meaningful.length === 0) warnings.appendChild(el('div', 'muted small', 'No warnings.'));
    meaningful.slice(0, 30).forEach(function (warning) { warnings.appendChild(el('li', null, warning.message)); });
  }

  // Findings
  function categoryOptions() {
    var select = byId('filterCategory');
    var categories = Object.keys(data.summary.findings.byCategory).sort();
    categories.forEach(function (key) {
      var option = el('option', null, key + ' (' + data.summary.findings.byCategory[key] + ')');
      option.value = key;
      select.appendChild(option);
    });
    var routes = byId('filterRoute');
    data.routes.forEach(function (route) {
      var option = el('option', null, route.path + (route.name && route.name !== route.path ? ' · ' + route.name : ''));
      option.value = route.id;
      routes.appendChild(option);
    });
    var files = byId('filterFile');
    var fileNames = {};
    data.findings.forEach(function (finding) { fileNames[finding.location.relativeFile] = true; });
    Object.keys(fileNames).sort().forEach(function (fileName) {
      var option = el('option', null, fileName);
      option.value = fileName;
      files.appendChild(option);
    });
    var kinds = byId('filterKind');
    var symbolKinds = {};
    data.findings.forEach(function (finding) { symbolKinds[finding.symbolKind] = true; });
    Object.keys(symbolKinds).sort().forEach(function (kind) {
      var option = el('option', null, kind);
      option.value = kind;
      kinds.appendChild(option);
    });
    var parents = byId('filterParent');
    var parentNames = {};
    data.findings.forEach(function (finding) { if (finding.parent) parentNames[finding.parent] = true; });
    Object.keys(parentNames).sort().forEach(function (parent) {
      var option = el('option', null, parent);
      option.value = parent;
      parents.appendChild(option);
    });
  }
  function findingLanguage(finding) {
    var type = finding.location.fileType;
    if (['css', 'scss', 'less', 'sass'].indexOf(type) !== -1) return 'css';
    if (finding.category.indexOf('css') !== -1) return 'css';
    if (['unused-dependency', 'duplicate-dependency', 'heavy-dependency', 'polyfill-included'].indexOf(finding.category) !== -1) return 'dependency';
    if (['code-splitting-opportunity', 'unused-bundle-code'].indexOf(finding.category) !== -1) return 'bundle';
    if (['ts', 'tsx', 'mts', 'cts'].indexOf(type) !== -1) return 'ts';
    if (['unused-type', 'unused-type-parameter', 'unused-type-only-import'].indexOf(finding.category) !== -1) return 'ts';
    if (['js', 'jsx', 'mjs', 'cjs', 'vue', 'svelte', 'astro'].indexOf(type) !== -1) return 'js';
    return 'other';
  }
  function findingPasses(finding) {
    if (state.category && finding.category !== state.category) return false;
    if (state.status && finding.status !== state.status) return false;
    if (state.confidence && finding.confidence !== state.confidence) return false;
    if (state.severity && finding.severity !== state.severity) return false;
    if (state.route && (finding.routeHints || []).indexOf(state.route) === -1) return false;
    if (state.language && findingLanguage(finding) !== state.language) return false;
    if (state.kind && finding.symbolKind !== state.kind) return false;
    if (state.file && finding.location.relativeFile !== state.file) return false;
    if (state.parent && finding.parent !== state.parent) return false;
    if (state.search) {
      var haystack = [finding.title, finding.description, finding.symbol, finding.location.relativeFile, finding.category, finding.css && finding.css.selector, finding.parent, (finding.tags || []).join(' ')].join(' ').toLowerCase();
      if (haystack.indexOf(state.search.toLowerCase()) === -1) return false;
    }
    return true;
  }
  var filterKeys = ['search', 'category', 'status', 'confidence', 'severity', 'route', 'language', 'kind', 'file', 'parent'];
  function filterEntries() {
    var entries = [];
    filterKeys.forEach(function (key) { if (state[key]) entries.push([key, state[key]]); });
    return entries;
  }
  function updateLocation() {
    var parts = filterEntries().map(function (entry) { return entry[0] + '=' + encodeURIComponent(entry[1]); });
    if (state.finding) parts.push('finding=' + encodeURIComponent(state.finding));
    var url = window.location.pathname + window.location.search + (parts.length ? '#' + parts.join('&') : '');
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', url);
  }
  function applyLocationFilters() {
    var raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return '';
    var finding = '';
    raw.split('&').forEach(function (part) {
      var eq = part.indexOf('=');
      if (eq < 0) return;
      var key = decodeURIComponent(part.slice(0, eq));
      var value = decodeURIComponent(part.slice(eq + 1));
      if (key === 'finding') { finding = value; return; }
      if (filterKeys.indexOf(key) !== -1) state[key] = value;
    });
    byId('findingSearch').value = state.search;
    Object.keys(filterSelects).forEach(function (key) {
      var select = byId(filterSelects[key]);
      if (select) select.value = state[key] || '';
    });
    renderFindings();
    return finding;
  }
  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime });
    var url = URL.createObjectURL(blob);
    var link = el('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csvCell(value) {
    var text = value === undefined || value === null ? '' : String(value);
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function exportFindings(format) {
    var findings = data.findings.filter(findingPasses);
    var base = (data.project.name || 'code-usage-map').replace(/[^A-Za-z0-9._-]+/g, '-');
    updateLocation();
    if (format === 'csv') {
      var rows = [['id', 'title', 'category', 'status', 'confidence', 'severity', 'file', 'line', 'column', 'symbol', 'symbolKind', 'routes', 'estimatedRemovableBytes']];
      findings.forEach(function (finding) {
        rows.push([
          finding.id,
          finding.title,
          finding.category,
          finding.status,
          finding.confidence,
          finding.severity,
          finding.location.relativeFile,
          finding.location.line,
          finding.location.column,
          finding.symbol,
          finding.symbolKind,
          (finding.routeHints || []).join(' '),
          finding.size.estimatedRemovableBytes || ''
        ]);
      });
      downloadText(base + '-findings.csv', rows.map(function (row) { return row.map(csvCell).join(','); }).join('\n') + '\n', 'text/csv;charset=utf-8');
      return;
    }
    var payload = {
      project: data.project,
      generatedAt: data.generator.generatedAt,
      exportedAt: new Date().toISOString(),
      filters: filterEntries().reduce(function (out, entry) { out[entry[0]] = entry[1]; return out; }, {}),
      count: findings.length,
      findings: findings
    };
    downloadText(base + '-findings.json', JSON.stringify(payload, null, 2) + '\n', 'application/json');
  }
  function copyFilterLink(button) {
    updateLocation();
    copyText(window.location.href);
    if (button) {
      var label = button.textContent;
      button.textContent = 'Copied';
      setTimeout(function () { button.textContent = label; }, 1200);
    }
  }
  function renderFindings() {
    var list = clear(byId('findingsList'));
    var all = data.findings.filter(findingPasses);
    byId('findingCount').textContent = all.length + ' of ' + data.findings.length + ' findings';
    var shown = all.slice(0, state.limit);
    if (shown.length === 0) {
      list.appendChild(el('div', 'empty', 'No findings match the current filters.'));
      return;
    }
    shown.forEach(function (finding) {
      var row = el('article', 'finding');
      row.tabIndex = 0;
      row.addEventListener('click', function () { openFinding(finding.id); });
      row.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFinding(finding.id); } });
      var top = el('div', 'finding-top');
      var left = el('div');
      left.appendChild(el('div', 'finding-title', finding.title));
      var meta = el('div', 'finding-meta');
      meta.appendChild(el('span', 'mono path', finding.location.relativeFile + ':' + finding.location.line + ':' + finding.location.column));
      if (finding.size.estimatedRemovableBytes) meta.appendChild(el('span', null, '~' + bytes(finding.size.estimatedRemovableBytes) + ' candidate'));
      if (finding.mapping) meta.appendChild(el('span', null, '→ ' + finding.mapping.chunk + ':' + finding.mapping.generatedLine + ' (' + finding.mapping.precision + ')'));
      (finding.routeHints || []).slice(0, 5).forEach(function (route) { meta.appendChild(el('span', 'chip', route)); });
      left.appendChild(meta);
      top.appendChild(left);
      var badges = el('div', 'badges');
      badges.appendChild(severityBadge(finding.severity));
      badges.appendChild(statusBadge(finding.status));
      badges.appendChild(confidenceBadge(finding.confidence));
      badges.appendChild(el('span', 'tag', finding.category));
      top.appendChild(badges);
      row.appendChild(top);
      list.appendChild(row);
    });
    if (all.length > shown.length) {
      var more = el('button', 'btn', 'Show ' + Math.min(240, all.length - shown.length) + ' more');
      more.addEventListener('click', function () { state.limit += 240; renderFindings(); });
      list.appendChild(more);
    }
  }
  function resetFilters() {
    state.search = '';
    state.category = '';
    state.status = '';
    state.confidence = '';
    state.severity = '';
    state.route = '';
    state.language = '';
    state.kind = '';
    state.file = '';
    state.parent = '';
    state.limit = 240;
    byId('findingSearch').value = '';
    Object.keys(filterSelects).forEach(function (key) { byId(filterSelects[key]).value = ''; });
    renderFindings();
    updateLocation();
  }

  // Drawer
  function openFinding(id) {
    var finding = data.findings.find(function (f) { return f.id === id; });
    if (!finding) return;
    var drawer = byId('drawer');
    var body = clear(byId('drawerBody'));
    byId('backdrop').hidden = false;
    drawer.hidden = false;
    var close = el('button', 'drawer-close', '×');
    close.setAttribute('aria-label', 'Close finding details');
    close.addEventListener('click', closeDrawer);
    body.appendChild(close);
    body.appendChild(el('h2', 'drawer-title', finding.title));
    var badges = el('div', 'badges');
    badges.appendChild(severityBadge(finding.severity));
    badges.appendChild(statusBadge(finding.status));
    badges.appendChild(confidenceBadge(finding.confidence));
    badges.appendChild(el('span', 'tag', finding.category));
    (finding.tags || []).forEach(function (tag) { badges.appendChild(el('span', 'tag', tag)); });
    body.appendChild(badges);
    body.appendChild(el('p', 'muted', finding.description));

    body.appendChild(el('h3', null, 'Source'));
    sourceActions(body, finding.location.file, finding.location.line, finding.location.column, { relative: finding.location.relativeFile });
    if (finding.snippet) {
      var pre = el('div', 'snippet');
      finding.snippet.lines.forEach(function (line) {
        var row = el('div', 'snippet-line' + (line.line === finding.snippet.highlightLine ? ' highlight' : ''));
        row.appendChild(el('span', 'snippet-no', line.line));
        row.appendChild(el('span', null, line.text));
        pre.appendChild(row);
      });
      body.appendChild(pre);
    }

    if (finding.css) {
      body.appendChild(el('h3', null, 'CSS details'));
      var cssEntries = [
        ['Selector', finding.css.selector],
        ['Kind', finding.css.selectorKind],
        ['Stylesheet', finding.css.stylesheet],
        ['Matched elements', finding.css.matchedElements],
        ['Matched routes', (finding.css.matchedRoutes || []).join(', ')],
        ['Specificity', finding.css.specificity ? finding.css.specificity.score + ' (' + finding.css.specificity.ids + ' ids, ' + finding.css.specificity.classes + ' classes, ' + finding.css.specificity.elements + ' elements)' : ''],
        ['Media', finding.css.media]
      ];
      body.appendChild(kvList(cssEntries));
      if (finding.css.ruleText) {
        var rule = el('pre', 'snippet');
        var ruleLine = el('div', 'snippet-line');
        ruleLine.appendChild(el('span', 'snippet-no', finding.location.line));
        ruleLine.appendChild(el('span', null, finding.css.ruleText));
        rule.appendChild(ruleLine);
        body.appendChild(rule);
      }
    }

    if (finding.runtime) {
      body.appendChild(el('h3', null, 'Runtime evidence'));
      body.appendChild(kvList([
        ['Observed', finding.runtime.observed ? 'yes' : 'no'],
        ['Sessions', finding.runtime.sessions],
        ['Routes observed', finding.runtime.routesObserved.join(', ') || 'none'],
        ['Routes loaded', finding.runtime.routesLoaded.join(', ') || 'none'],
        ['Note', finding.runtime.note]
      ]));
    }

    if (finding.mapping) {
      body.appendChild(el('h3', null, 'Source mapping chain'));
      var chain = el('div', 'chain');
      finding.mapping.chain.forEach(function (hop, index) {
        if (index > 0) chain.appendChild(el('span', 'chain-arrow', '→'));
        var node = hop.file ? linkToFile(hop.file, hop.line, hop.column, hop.kind + ': ' + hop.label) : el('span', 'chain-hop', hop.kind + ': ' + hop.label);
        if (!hop.file) node.className = 'chain-hop';
        chain.appendChild(node);
      });
      body.appendChild(chain);
      body.appendChild(kvList([
        ['Precision', finding.mapping.precision],
        ['Generated', finding.mapping.generatedFile + ':' + finding.mapping.generatedLine + ':' + finding.mapping.generatedColumn],
        ['Original', finding.mapping.originalFile + ':' + finding.mapping.originalLine + ':' + finding.mapping.originalColumn],
        ['Source map', finding.mapping.sourceMapFile],
        ['Limitation', finding.mapping.limitation]
      ]));
    }

    if (finding.fix) {
      body.appendChild(el('h3', null, 'Safe fix available'));
      var fix = el('div', 'info-note');
      fix.textContent = finding.fix.description + (finding.fix.safe ? ' Preview with: npx @codewithrajat/code-usage-map fix --dry-run' : ' Manual review required.');
      body.appendChild(fix);
    }

    var recs = (finding.recommendationIds || []).map(function (rid) { return recById[rid]; }).filter(Boolean);
    if (recs.length > 0) {
      body.appendChild(el('h3', null, 'Recommendations'));
      recs.forEach(function (rec) { body.appendChild(renderRecommendation(rec, true)); });
    }

    var evidence = el('div', null);
    evidence.appendChild(el('h3', null, 'Evidence'));
    var evidenceList = el('ul');
    (finding.evidence || []).forEach(function (item) {
      var li = el('li', null, item.description + (item.file ? ' (' + item.file + (item.line ? ':' + item.line : '') + ')' : ''));
      evidenceList.appendChild(li);
    });
    evidence.appendChild(evidenceList);
    body.appendChild(evidence);
    drawer.scrollTop = 0;
    state.finding = id;
    updateLocation();
  }
  function closeDrawer() {
    byId('drawer').hidden = true;
    byId('backdrop').hidden = true;
    state.finding = '';
    updateLocation();
  }
  byId('backdrop').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeDrawer(); });

  // Routes
  function renderRoutes() {
    var container = clear(byId('routesList'));
    if (!data.routes.length) {
      container.appendChild(el('div', 'empty', 'No route data. Configure routes and run: code-usage-map analyze --url http://localhost:5173 --routes /,/dashboard,/settings'));
      return;
    }
    data.routes.forEach(function (route) {
      var cardEl = el('section', 'route-card');
      var head = el('div', 'route-head');
      var left = el('div');
      left.appendChild(el('div', 'route-path', route.path));
      if (route.name && route.name !== route.path) left.appendChild(el('div', 'muted small', route.name));
      var badges = el('div', 'badges');
      badges.appendChild(el('span', 'tag', route.kind));
      badges.appendChild(el('span', 'tag', route.source + ' data'));
      badges.appendChild(el('span', 'tag', route.sessionsObserved + ' session(s)'));
      if (route.coverage) badges.appendChild(el('span', 'chip', pct(route.coverage.percent) + ' JS coverage'));
      left.appendChild(badges);
      var stats = el('div', 'route-stats');
      var executed = route.modules.filter(function (m) { return m.executed; }).length;
      var loaded = route.modules.length;
      var stat1 = el('div', 'route-stat');
      stat1.appendChild(el('strong', null, route.cssUsage.matchedSelectorCount + ' / ' + route.cssUsage.unmatchedSelectorCount));
      stat1.appendChild(el('span', null, 'CSS matched / unmatched'));
      stats.appendChild(stat1);
      var stat2 = el('div', 'route-stat');
      stat2.appendChild(el('strong', null, executed + ' / ' + loaded));
      stat2.appendChild(el('span', null, 'JS modules executed / loaded'));
      stats.appendChild(stat2);
      var stat3 = el('div', 'route-stat');
      stat3.appendChild(el('strong', null, bytes(route.cssUsage.bytes || 0)));
      stat3.appendChild(el('span', null, 'CSS loaded'));
      stats.appendChild(stat3);
      left.appendChild(stats);
      if (route.coverage) {
        var progress = el('div', 'progress');
        var fill = el('span');
        fill.style.width = Math.max(0, Math.min(100, route.coverage.percent)) + '%';
        progress.appendChild(fill);
        left.appendChild(progress);
      }
      head.appendChild(left);
      var actions = el('div', 'source-actions');
      var filter = el('button', 'btn primary', 'Filter findings');
      filter.addEventListener('click', function (event) {
        event.stopPropagation();
        state.route = route.id;
        byId('filterRoute').value = route.id;
        renderFindings();
        updateLocation();
        showTab('findings');
      });
      actions.appendChild(filter);
      head.appendChild(actions);
      cardEl.appendChild(head);

      var body = el('div', 'route-body');
      body.hidden = true;
      head.addEventListener('click', function () { body.hidden = !body.hidden; });

      var loadedNotExecuted = route.loadedNotExecutedModules || [];
      var notExecutedPanel = el('div', 'subpanel');
      var notExecutedHead = el('h3');
      notExecutedHead.appendChild(el('span', null, 'Loaded but not executed on this route'));
      notExecutedHead.appendChild(el('span', 'muted small', loadedNotExecuted.length + ' module(s)'));
      notExecutedPanel.appendChild(notExecutedHead);
      if (loadedNotExecuted.length === 0) notExecutedPanel.appendChild(el('div', 'muted small', 'No modules listed.'));
      else {
        var mini = el('div', 'mini-list');
        loadedNotExecuted.slice(0, 120).forEach(function (module) {
          var row = el('div', 'mini-row');
          var main = el('div', 'mini-main');
          var file = module.sourceFile || module.bundleFile;
          if (file) main.appendChild(sourceLink(file, 1, 1, module.sourceFile || module.bundleFile));
          else main.textContent = '(generated module)';
          row.appendChild(main);
          row.appendChild(el('span', 'mini-side', (module.previouslyExecuted ? 'executed earlier · ' : '') + bytes(module.bytes || 0)));
          mini.appendChild(row);
        });
        notExecutedPanel.appendChild(mini);
      }
      body.appendChild(notExecutedPanel);

      var matchedPanel = el('div', 'subpanel');
      var matchedHead = el('h3');
      matchedHead.appendChild(el('span', null, 'Matched CSS on this route'));
      matchedHead.appendChild(el('span', 'muted small', route.cssUsage.matchedSelectorCount + ' selector(s)'));
      matchedPanel.appendChild(matchedHead);
      matchedPanel.appendChild(el('div', 'muted small', 'Includes CSS-in-JS selectors source-mapped to tagged templates where possible.'));
      if (route.cssUsage.matchedSelectors.length === 0) matchedPanel.appendChild(el('div', 'muted small', 'No matched selectors were captured.'));
      else {
        var matchedList = el('div', 'mini-list');
        route.cssUsage.matchedSelectors.slice(0, 120).forEach(function (usage) {
          var row = el('div', 'mini-row');
          var main = el('div', 'mini-main');
          main.appendChild(el('span', 'mono', usage.selector));
          if (usage.sourceFile || usage.stylesheet) {
            main.appendChild(el('span', 'muted small', ' · '));
            main.appendChild(sourceLink(usage.sourceFile || usage.stylesheet, usage.line || 1, usage.column || 1, 'Open source'));
          }
          row.appendChild(main);
          row.appendChild(el('span', 'mini-side', usage.status + ' · ' + usage.confidence));
          matchedList.appendChild(row);
        });
        matchedPanel.appendChild(matchedList);
      }
      body.appendChild(matchedPanel);

      var unmatchedPanel = el('div', 'subpanel');
      var unmatchedHead = el('h3');
      unmatchedHead.appendChild(el('span', null, 'CSS loaded but unmatched on this route'));
      unmatchedHead.appendChild(el('span', 'muted small', route.cssUsage.unmatchedSelectorCount + ' selector(s), ' + bytes(route.cssUsage.unmatchedSelectorBytes) + ' selector bytes'));
      unmatchedPanel.appendChild(unmatchedHead);
      unmatchedPanel.appendChild(el('div', 'side-note', 'These selectors did not match this route in collected states. They may apply to hover/focus, other viewports, or other routes. They are route-level optimization signals, not confirmed dead code.'));
      if (route.cssUsage.unmatchedSelectors.length === 0) unmatchedPanel.appendChild(el('div', 'muted small', 'No unmatched selectors were captured.'));
      else {
        var cssList = el('div', 'mini-list');
        route.cssUsage.unmatchedSelectors.slice(0, 120).forEach(function (selector) {
          var row = el('div', 'mini-row');
          var main = el('div', 'mini-main');
          main.appendChild(el('span', 'mono', selector.selector));
          if (selector.sourceFile || selector.stylesheet) {
            main.appendChild(el('span', 'muted small', ' · '));
            main.appendChild(sourceLink(selector.sourceFile || selector.stylesheet, selector.line || 1, selector.column || 1, 'Open CSS'));
          }
          row.appendChild(main);
          row.appendChild(el('span', 'mini-side', bytes(selector.bytes || 0) + ' · ' + selector.confidence));
          cssList.appendChild(row);
        });
        unmatchedPanel.appendChild(cssList);
        if (route.cssUsage.unmatchedSelectorCount > 120) unmatchedPanel.appendChild(el('div', 'muted small', 'Showing 120 selectors in the dashboard; use the JSON/HTML data for the full list.'));
      }
      body.appendChild(unmatchedPanel);

      var modulesPanel = el('div', 'subpanel');
      modulesPanel.appendChild(el('h3', null, 'Shared and route-exclusive modules'));
      modulesPanel.appendChild(kvList([
        ['Shared modules', (route.sharedModules || []).slice(0, 30).map(function (m) { return m.sourceFile || m.bundleFile; }).join(', ') || 'None'],
        ['Exclusive modules', (route.routeExclusiveModules || []).slice(0, 30).map(function (m) { return m.sourceFile || m.bundleFile; }).join(', ') || 'None']
      ]));
      body.appendChild(modulesPanel);

      var exclusive = route.routeExclusiveModules || [];
      var shared = route.sharedModules || [];
      var exclusiveBytes = exclusive.reduce(function (sum, module) { return sum + (module.bytes || 0); }, 0);
      var sharedBytes = shared.reduce(function (sum, module) { return sum + (module.bytes || 0); }, 0);
      var simulation = el('div', 'subpanel');
      simulation.appendChild(el('h3', null, 'Code-split simulation (estimate only)'));
      simulation.appendChild(kvList([
        ['Route-exclusive JS', bytes(exclusiveBytes) + ' across ' + exclusive.length + ' module(s)'],
        ['Shared JS', bytes(sharedBytes) + ' across ' + shared.length + ' module(s)'],
        ['CSS unmatched on this route', bytes(route.cssUsage.unmatchedSelectorBytes || 0) + ' (potential, not removable by JS splitting)']
      ]));
      if (exclusive.length > 0) {
        var exclusiveList = el('div', 'mini-list');
        exclusive.slice(0, 8).forEach(function (module) {
          var row = el('div', 'mini-row');
          var main = el('div', 'mini-main');
          var file = module.sourceFile || module.bundleFile;
          if (file) main.appendChild(sourceLink(file, 1, 1, file));
          else main.textContent = '(generated module)';
          row.appendChild(main);
          row.appendChild(el('span', 'mini-side', bytes(module.bytes || 0)));
          exclusiveList.appendChild(row);
        });
        simulation.appendChild(exclusiveList);
      }
      simulation.appendChild(el('div', 'side-note', 'Estimate: routing these exclusive modules behind a dynamic import can reduce this route\'s initial JavaScript by roughly the listed exclusive bytes. Shared modules stay because other routes need them. Actual savings depend on bundler chunk placement, preloads, cache reuse and whether the modules are already async.'));
      body.appendChild(simulation);

      var assetsPanel = el('div', 'subpanel');
      assetsPanel.appendChild(el('h3', null, 'Loaded assets'));
      var assetWrap = el('div', 'table-wrap');
      var table = el('table');
      var thead = el('thead');
      var hr = el('tr');
      ['Type', 'Asset', 'Bytes', 'Executed/observed', 'Source modules'].forEach(function (label) { hr.appendChild(el('th', null, label)); });
      thead.appendChild(hr);
      table.appendChild(thead);
      var tbody = el('tbody');
      route.assets.js.concat(route.assets.css).forEach(function (asset) {
        var tr = el('tr');
        tr.appendChild(el('td', null, asset.url.match(/\.css(?:[?#]|$)/i) ? 'CSS' : 'JS'));
        var td = el('td');
        td.appendChild(el('span', 'mono path', asset.url));
        tr.appendChild(td);
        tr.appendChild(el('td', 'num', bytes(asset.bytes || 0)));
        tr.appendChild(el('td', null, asset.executed ? 'yes' : 'not observed'));
        tr.appendChild(el('td', null, (asset.sourceModules || []).length));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      assetWrap.appendChild(table);
      assetsPanel.appendChild(assetWrap);
      body.appendChild(assetsPanel);

      var notesPanel = el('div', 'subpanel');
      notesPanel.appendChild(el('h3', null, 'Route notes'));
      var notes = el('ul', 'small muted');
      (route.notes || []).forEach(function (note) { notes.appendChild(el('li', null, note)); });
      notesPanel.appendChild(notes);
      body.appendChild(notesPanel);
      cardEl.appendChild(body);
      container.appendChild(cardEl);
    });
  }
  function sourceLink(file, line, column, label) {
    var a = el('a', null, label || file);
    a.href = editorHref(file, line, column);
    a.className = 'mono';
    return a;
  }

  // CSS tab
  function renderCss() {
    var summary = byId('cssSummary');
    clear(summary);
    summary.appendChild(card('Selectors', data.css.selectors, data.css.matchedSelectors + ' matched · ' + data.css.unmatchedSelectors + ' unmatched'));
    summary.appendChild(card('Stylesheets', data.css.stylesheetFiles, data.css.unusedStylesheetFiles.length + ' unreferenced'));
    summary.appendChild(card('Custom properties', data.css.customProperties, data.css.unusedCustomProperties.length + ' potentially unused'));
    summary.appendChild(card('Runtime injected', data.css.runtimeInjectedRules, 'CSS-in-JS / constructable sheets'));
    summary.appendChild(card('CSS-in-JS blocks', data.css.cssInJsBlocks, 'source-mapped tagged templates'));

    var cssInJs = clear(byId('cssInJsBlocks'));
    if (!data.css.cssInJsSources || data.css.cssInJsSources.length === 0) {
      cssInJs.appendChild(el('div', 'muted small', 'No tagged-template CSS-in-JS blocks extracted. Object-style CSS-in-JS is runtime-only.'));
    } else {
      data.css.cssInJsSources.slice(0, 200).forEach(function (block) {
        var row = el('div', 'mini-row');
        var main = el('div', 'mini-main');
        main.appendChild(el('span', 'tag', block.kind));
        main.appendChild(el('span', 'muted small', ' ' + block.tag + ' · '));
        main.appendChild(sourceLink(block.file, block.line, 1, block.relativeFile + ':' + block.line));
        if (block.selectors.length) main.appendChild(el('span', 'muted small', ' · ' + block.selectors.slice(0, 3).join(', ')));
        row.appendChild(main);
        row.appendChild(el('span', 'mini-side', block.dynamic ? 'dynamic' : 'static'));
        cssInJs.appendChild(row);
      });
    }

    var unused = data.findings.filter(function (f) { return f.category === 'unused-css-selector'; });
    var list = clear(byId('cssSelectors'));
    if (unused.length === 0) list.appendChild(el('div', 'empty', 'No potentially unused CSS selectors.'));
    unused.slice(0, 300).forEach(function (finding) {
      var row = el('div', 'finding');
      row.addEventListener('click', function () { openFinding(finding.id); });
      var top = el('div', 'finding-top');
      var left = el('div');
      left.appendChild(el('div', 'finding-title mono', (finding.css && finding.css.selector) || finding.title));
      var meta = el('div', 'finding-meta');
      meta.appendChild(el('span', 'mono', finding.location.relativeFile + ':' + finding.location.line));
      if (finding.css && finding.css.specificity) meta.appendChild(el('span', null, 'specificity ' + finding.css.specificity.score));
      if (finding.css && finding.css.matchedRoutes && finding.css.matchedRoutes.length) meta.appendChild(el('span', null, 'matched: ' + finding.css.matchedRoutes.join(', ')));
      meta.appendChild(el('span', null, bytes(finding.size.estimatedRemovableBytes || 0) + ' candidate'));
      left.appendChild(meta);
      top.appendChild(left);
      var badges = el('div', 'badges');
      badges.appendChild(statusBadge(finding.status));
      badges.appendChild(confidenceBadge(finding.confidence));
      top.appendChild(badges);
      row.appendChild(top);
      list.appendChild(row);
    });

    var sheets = clear(byId('cssStylesheets'));
    if (!data.css.unusedStylesheetFiles.length) sheets.appendChild(el('div', 'muted small', 'No unreferenced stylesheet files.'));
    data.css.unusedStylesheetFiles.forEach(function (file) {
      var row = el('div', 'mini-row');
      var main = el('div', 'mini-main');
      main.appendChild(sourceLink(file, 1, 1, file));
      row.appendChild(main);
      sheets.appendChild(row);
    });

    var props = clear(byId('cssProperties'));
    if (!data.css.unusedCustomProperties.length) props.appendChild(el('div', 'muted small', 'No unused custom properties detected.'));
    data.css.unusedCustomProperties.forEach(function (name) {
      var f = data.findings.find(function (finding) { return finding.category === 'unused-css-custom-property' && finding.symbol === name; });
      var row = el('div', 'mini-row');
      var main = el('div', 'mini-main mono', name);
      if (f) main.appendChild(el('span', 'muted small', ' · ' + f.location.relativeFile + ':' + f.location.line));
      row.appendChild(main);
      if (f) { row.style.cursor = 'pointer'; row.addEventListener('click', function () { openFinding(f.id); }); }
      props.appendChild(row);
    });
  }

  // Bundles
  function renderBundles() {
    var cards = clear(byId('bundleCards'));
    cards.appendChild(card('Raw', bytes(data.bundles.totals.rawBytes), data.bundles.files.length + ' files'));
    cards.appendChild(card('Gzip', bytes(data.bundles.totals.gzipBytes), 'level 9'));
    cards.appendChild(card('Brotli', bytes(data.bundles.totals.brotliBytes), 'quality 9'));
    cards.appendChild(card('Initial', bytes(data.bundles.totals.initialRawBytes), data.bundles.initialFileIds.length + ' files'));
    cards.appendChild(card('Lazy', bytes(data.bundles.totals.lazyRawBytes), data.bundles.lazyFileIds.length + ' files'));
    cards.appendChild(card('Mapped', data.bundles.mappingCoverage.mappedPercent + '%', 'assets with source maps'));

    var wrap = clear(byId('bundleFiles'));
    if (!data.bundles.files.length) {
      wrap.appendChild(el('div', 'empty', 'No build assets. Build the project or set build.dir.'));
    } else {
      var tableWrap = el('div', 'table-wrap');
      var table = el('table');
      var thead = el('thead');
      var hr = el('tr');
      ['Type', 'Chunk', 'Raw', 'Gzip', 'Brotli', 'Initial', 'Routes', 'Mapped', 'Modules'].forEach(function (label) { hr.appendChild(el('th', null, label)); });
      thead.appendChild(hr); table.appendChild(thead);
      var tbody = el('tbody');
      data.bundles.files.slice(0, 600).forEach(function (file) {
        var tr = el('tr');
        tr.appendChild(el('td', null, file.type.toUpperCase()));
        var td = el('td');
        var a = el('a', 'mono path', file.relativePath);
        a.href = editorHref(file.file, 1, 1);
        td.appendChild(a);
        tr.appendChild(td);
        tr.appendChild(el('td', 'num', bytes(file.rawBytes)));
        tr.appendChild(el('td', 'num', bytes(file.gzipBytes)));
        tr.appendChild(el('td', 'num', bytes(file.brotliBytes)));
        tr.appendChild(el('td', null, file.initial ? 'yes' : 'no'));
        tr.appendChild(el('td', null, (file.routes || []).join(', ')));
        tr.appendChild(el('td', null, file.mapped ? file.sourceMapKind : 'no'));
        tr.appendChild(el('td', 'num', String((file.modules || []).length)));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody); tableWrap.appendChild(table); wrap.appendChild(tableWrap);
    }

    var heavy = clear(byId('heavyDependencies'));
    if (!data.bundles.heavyDependencies.length) heavy.appendChild(el('div', 'muted small', 'No package attribution available.'));
    data.bundles.heavyDependencies.forEach(function (dep) { heavy.appendChild(barRow(dep.packageName, dep.bytes, Math.max(1, data.bundles.heavyDependencies[0].bytes), bytes(dep.bytes))); });

    var duplicates = clear(byId('duplicateDependencies'));
    if (!data.bundles.duplicateDependencies.length) duplicates.appendChild(el('div', 'muted small', 'No duplicate package versions detected.'));
    data.bundles.duplicateDependencies.forEach(function (dup) {
      duplicates.appendChild(el('div', 'mini-row', dup.packageName + ': ' + dup.versions.join(', ')));
    });

    var deps = clear(byId('dependencyList'));
    var packages = data.dependencies.packages.slice(0, 200);
    if (!packages.length) deps.appendChild(el('div', 'muted small', 'No dependencies analyzed.'));
    packages.forEach(function (pkg) {
      var row = el('div', 'mini-row');
      var main = el('div', 'mini-main');
      main.appendChild(el('strong', null, pkg.name));
      main.appendChild(el('span', 'muted small', ' · ' + pkg.declaredIn + ' · ' + pkg.importCount + ' import(s)'));
      row.appendChild(main);
      row.appendChild(el('span', 'mini-side', pkg.status));
      deps.appendChild(row);
    });
  }

  // Mapping
  function renderMapping() {
    var cards = clear(byId('mappingCards'));
    cards.appendChild(card('Resolved findings', data.sourceMaps.resolvedFindings, data.sourceMaps.unresolvedFindings + ' unresolved'));
    cards.appendChild(card('Symbol precision', data.sourceMaps.precision.symbol, data.sourceMaps.precision.lineColumn + ' line+column'));
    cards.appendChild(card('Line/file precision', data.sourceMaps.precision.line + ' / ' + data.sourceMaps.precision.file, 'Precision depends on source maps'));
    cards.appendChild(card('Mapped assets', data.sourceMaps.filesWithSourceMaps, data.sourceMaps.inlineMaps + ' inline · ' + data.sourceMaps.externalMaps + ' external · ' + data.sourceMaps.indexedMaps + ' indexed'));
    var list = clear(byId('mappingList'));
    var mapped = data.findings.filter(function (f) { return f.mapping; }).slice(0, 500);
    if (!mapped.length) {
      list.appendChild(el('div', 'empty', 'No finding-level source mapping is available. Build with source maps and enable sourceMaps.'));
      return;
    }
    mapped.forEach(function (finding) {
      var row = el('div', 'finding');
      row.addEventListener('click', function () { openFinding(finding.id); });
      var top = el('div', 'finding-top');
      var left = el('div');
      left.appendChild(el('div', 'finding-title', finding.title));
      var chain = el('div', 'chain');
      finding.mapping.chain.forEach(function (hop, index) {
        if (index > 0) chain.appendChild(el('span', 'chain-arrow', '→'));
        if (hop.file) chain.appendChild(sourceLink(hop.file, hop.line, hop.column, hop.label));
        else chain.appendChild(el('span', 'chain-hop', hop.label));
      });
      left.appendChild(chain);
      top.appendChild(left);
      top.appendChild(el('span', 'tag', finding.mapping.precision));
      row.appendChild(top);
      list.appendChild(row);
    });
  }

  // Recommendations
  function renderRecommendation(rec, compact) {
    var cardEl = el('article', 'recommendation');
    var badges = el('div', 'badges');
    badges.appendChild(confidenceBadge(rec.confidence));
    badges.appendChild(badge('risk ' + rec.risk, rec.risk === 'low' ? 'sev-low' : rec.risk === 'medium' ? 'sev-medium' : 'sev-high'));
    badges.appendChild(el('span', 'tag', rec.complexity + ' complexity'));
    badges.appendChild(el('span', 'tag', rec.category));
    cardEl.appendChild(badges);
    cardEl.appendChild(el('h3', null, rec.title));
    cardEl.appendChild(el('p', null, rec.reason));
    cardEl.appendChild(el('p', null, rec.action));
    if (rec.sizeImpact) cardEl.appendChild(el('div', 'info-note', 'Estimated candidate size: ' + bytes(rec.sizeImpact.estimatedBytes) + '. ' + rec.sizeImpact.note));
    if (!compact) {
      var steps = el('ol');
      rec.steps.forEach(function (step) { steps.appendChild(el('li', null, step)); });
      cardEl.appendChild(steps);
      if (rec.benefits.length) {
        var benefits = el('ul', 'small');
        rec.benefits.forEach(function (benefit) { benefits.appendChild(el('li', null, benefit)); });
        cardEl.appendChild(benefits);
      }
      if (rec.locations.length) {
        var locations = el('div', 'source-actions');
        rec.locations.slice(0, 8).forEach(function (loc) {
          var a = el('a', 'btn small', loc.relativeFile + ':' + loc.line);
          a.href = editorHref(loc.file, loc.line, loc.column);
          locations.appendChild(a);
        });
        cardEl.appendChild(locations);
      }
      if (rec.findingIds.length) {
        var find = el('button', 'btn small', 'View ' + rec.findingIds.length + ' finding(s)');
        find.addEventListener('click', function () {
          var first = rec.findingIds[0];
          if (first) openFinding(first);
        });
        cardEl.appendChild(find);
      }
    }
    return cardEl;
  }
  function renderRecommendations() {
    var list = clear(byId('recommendationList'));
    if (!data.recommendations.length) {
      list.appendChild(el('div', 'empty', 'No recommendations.'));
      return;
    }
    data.recommendations.forEach(function (rec) { list.appendChild(renderRecommendation(rec, false)); });
  }

  // Filters
  function bindFilters() {
    byId('findingSearch').addEventListener('input', function (event) { state.search = event.target.value; state.limit = 240; renderFindings(); updateLocation(); });
    var map = {
      filterCategory: 'category',
      filterStatus: 'status',
      filterConfidence: 'confidence',
      filterSeverity: 'severity',
      filterRoute: 'route',
      filterLanguage: 'language',
      filterKind: 'kind',
      filterFile: 'file',
      filterParent: 'parent'
    };
    Object.keys(map).forEach(function (id) {
      byId(id).addEventListener('change', function (event) { state[map[id]] = event.target.value; state.limit = 240; renderFindings(); updateLocation(); });
    });
    byId('resetFilters').addEventListener('click', resetFilters);
    byId('exportFindings').addEventListener('click', function () { exportFindings('json'); });
    byId('exportCsv').addEventListener('click', function () { exportFindings('csv'); });
    byId('copyFilterLink').addEventListener('click', function (event) { copyFilterLink(event.currentTarget); });
  }

  function init() {
    document.title = 'Code Usage Map · ' + data.project.name;
    byId('brandSub').textContent = data.project.name + ' · ' + data.project.mode + ' · ' + data.project.root;
    byId('generatedMeta').textContent = 'Generated ' + data.generator.generatedAt + ' · ' + data.generator.name + '@' + data.generator.version;
    byId('tabCountFindings').textContent = data.summary.findings.total;
    byId('tabCountRoutes').textContent = data.summary.routes;
    byId('tabCountCss').textContent = data.summary.unusedCssSelectors;
    byId('tabCountRecs').textContent = data.summary.recommendations;
    renderOverview();
    renderFindings();
    renderRoutes();
    renderCss();
    renderBundles();
    renderMapping();
    renderRecommendations();
    categoryOptions();
    bindFilters();
    var pendingFinding = applyLocationFilters();
    if (pendingFinding) {
      setTimeout(function () { openFinding(pendingFinding); }, 30);
    }
  }
  init();
})();
`;
function escapeJsonForScript(value) {
  return value.replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function renderHtmlReport(report) {
  const payload = escapeJsonForScript(JSON.stringify(report));
  const title = escapeHtml(`Code Usage Map \xB7 ${report.project.name}`);
  const description = escapeHtml(
    truncate(
      `Offline code usage report for ${report.project.name}. ${report.summary.findings.total} findings across ${report.summary.sourceFiles} source files and ${report.summary.routes} routes.`,
      300
    )
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${title}</title>
<meta name="description" content="${description}">
<style>${STYLES}</style>
</head>
<body>
<header class="topbar">
  <div class="brand">
    <div class="brand-mark">CU</div>
    <div>
      <div class="brand-title">Code Usage Map</div>
      <div class="brand-sub" id="brandSub">Offline report</div>
    </div>
  </div>
  <div class="top-meta" id="generatedMeta"></div>
</header>
<div class="layout">
  <nav class="sidebar" aria-label="Report sections">
    <button class="tab-btn active" data-tab="overview" type="button">Overview</button>
    <button class="tab-btn" data-tab="findings" type="button">Findings <span class="tab-count" id="tabCountFindings"></span></button>
    <button class="tab-btn" data-tab="routes" type="button">Routes <span class="tab-count" id="tabCountRoutes"></span></button>
    <button class="tab-btn" data-tab="css" type="button">CSS <span class="tab-count" id="tabCountCss"></span></button>
    <button class="tab-btn" data-tab="bundles" type="button">Bundles &amp; deps</button>
    <button class="tab-btn" data-tab="mapping" type="button">Source mapping</button>
    <button class="tab-btn" data-tab="recommendations" type="button">Recommendations <span class="tab-count" id="tabCountRecs"></span></button>
  </nav>
  <main>
    <section class="tab-panel active" id="tab-overview">
      <h1>Project analysis</h1>
      <p class="subtitle">Static evidence, runtime observations, route-level CSS and source-mapped bundle attribution.</p>
      <div class="cards" id="summaryCards"></div>
      <div class="grid">
        <div class="panel"><h2>Findings by category</h2><div id="categoryBars"></div></div>
        <div class="panel"><h2>Bundle composition</h2><div id="bundleBars"></div></div>
      </div>
      <div class="panel"><h2>Analysis scope</h2><div id="scope"></div></div>
      <div class="panel"><h2>Runtime sessions</h2><div id="runtimePanel"></div></div>
      <div class="panel"><h2>Warnings</h2><ul class="small" id="warningsList"></ul></div>
      <div class="panel"><h2>Limitations</h2><ul class="small muted" id="limitations"></ul></div>
    </section>

    <section class="tab-panel" id="tab-findings">
      <div class="section-head">
        <div><h1>Findings</h1><p class="subtitle">Click any finding for source snippets, mapping chains and recommendations.</p></div>
      </div>
      <div class="filterbar">
        <input type="search" id="findingSearch" placeholder="Search symbol, file, selector, tag\u2026" aria-label="Search findings">
        <select id="filterCategory" aria-label="Filter by category"><option value="">All categories</option></select>
        <select id="filterStatus" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="confirmed-unused">confirmed-unused</option>
          <option value="potentially-unused">potentially-unused</option>
          <option value="not-observed">not-observed</option>
          <option value="dynamically-referenced">dynamically-referenced</option>
          <option value="unknown">unknown</option>
        </select>
        <select id="filterConfidence" aria-label="Filter by confidence">
          <option value="">All confidence</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
        </select>
        <select id="filterSeverity" aria-label="Filter by severity">
          <option value="">All severities</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option><option value="info">info</option>
        </select>
        <select id="filterRoute" aria-label="Filter by route"><option value="">All routes</option></select>
        <select id="filterLanguage" aria-label="Filter by language">
          <option value="">All languages</option>
          <option value="js">JavaScript</option>
          <option value="ts">TypeScript</option>
          <option value="css">CSS</option>
          <option value="dependency">Dependencies</option>
          <option value="bundle">Bundles</option>
        </select>
        <select id="filterKind" aria-label="Filter by symbol kind"><option value="">All symbol kinds</option></select>
        <select id="filterFile" aria-label="Filter by source file"><option value="">All files</option></select>
        <select id="filterParent" aria-label="Filter by component or class"><option value="">All components/classes</option></select>
        <button class="btn" id="resetFilters" type="button">Clear</button>
        <button class="btn" id="exportFindings" type="button">Export filtered JSON</button>
        <button class="btn" id="exportCsv" type="button">Export CSV</button>
        <button class="btn" id="copyFilterLink" type="button">Copy filter link</button>
      </div>
      <div class="muted small" id="findingCount"></div>
      <div class="list" id="findingsList"></div>
    </section>

    <section class="tab-panel" id="tab-routes">
      <h1>Routes</h1>
      <p class="subtitle">Executed JavaScript, loaded modules, matched CSS and CSS loaded but unmatched on each route.</p>
      <div class="info-note">Route-level \u201Cunmatched CSS\u201D is not confirmed dead code. It shows CSS available on a route that did not match the collected DOM/states for that route. Expand a route for source links and details.</div>
      <div id="routesList" style="margin-top:14px"></div>
    </section>

    <section class="tab-panel" id="tab-css">
      <h1>CSS usage</h1>
      <p class="subtitle">Selectors are potential findings. Runtime matching and browser states improve confidence.</p>
      <div class="cards" id="cssSummary"></div>
      <div class="panel"><h2>Potentially unused selectors</h2><div class="list" id="cssSelectors"></div></div>
      <div class="panel"><h2>Source-mapped CSS-in-JS blocks</h2><div id="cssInJsBlocks" class="mini-list"></div></div>
      <div class="grid">
        <div class="panel"><h2>Unreferenced stylesheet files</h2><div id="cssStylesheets" class="mini-list"></div></div>
        <div class="panel"><h2>Potentially unused custom properties</h2><div id="cssProperties" class="mini-list"></div></div>
      </div>
    </section>

    <section class="tab-panel" id="tab-bundles">
      <h1>Bundles &amp; dependencies</h1>
      <p class="subtitle">Raw, gzip and Brotli sizes, initial/lazy classification, source-map attribution and dependency health.</p>
      <div class="cards" id="bundleCards"></div>
      <div class="panel"><h2>Build assets</h2><div id="bundleFiles"></div></div>
      <div class="grid">
        <div class="panel"><h2>Heavy dependencies</h2><div id="heavyDependencies"></div></div>
        <div class="panel"><h2>Duplicate versions</h2><div id="duplicateDependencies"></div></div>
      </div>
      <div class="panel"><h2>Declared dependencies</h2><div id="dependencyList" class="mini-list"></div></div>
    </section>

    <section class="tab-panel" id="tab-mapping">
      <h1>Source mapping</h1>
      <p class="subtitle">Every finding keeps its original source location. Generated chunk positions come from decoded source maps.</p>
      <div class="cards" id="mappingCards"></div>
      <div class="side-note" style="margin-bottom:14px">Precision is explicit. Symbol-level mapping requires the source map names table. Line- or file-level mapping is reported instead of inventing positions.</div>
      <div class="list" id="mappingList"></div>
    </section>

    <section class="tab-panel" id="tab-recommendations">
      <h1>Recommendations</h1>
      <p class="subtitle">Actionable next steps with risk, complexity, source links and candidate size impact.</p>
      <div id="recommendationList"></div>
    </section>
  </main>
</div>

<div class="backdrop" id="backdrop" hidden></div>
<aside class="drawer" id="drawer" hidden aria-label="Finding details">
  <div id="drawerBody"></div>
</aside>

<script type="application/json" id="cum-data">${payload}</script>
<script>${CLIENT}</script>
</body>
</html>`;
}

// src/report/write.ts
function writeReports(report, options = {}) {
  const output = report.config.output;
  ensureDir(output);
  const consoleText = renderConsoleReport(report);
  let jsonPath;
  let htmlPath;
  const writeJson = options.json ?? report.config.reporters.json;
  const writeHtml = options.html ?? report.config.reporters.html;
  if (writeJson) {
    jsonPath = path8.join(output, "code-usage-map.json");
    writeJsonFile(jsonPath, report);
  }
  if (writeHtml) {
    htmlPath = path8.join(output, "code-usage-map.html");
    writeTextFile(htmlPath, renderHtmlReport(report));
  }
  return {
    consoleText,
    ...jsonPath ? { jsonPath } : {},
    ...htmlPath ? { htmlPath } : {}
  };
}
function writeBaseline(report, file) {
  const target = path8.isAbsolute(file) ? file : path8.resolve(report.project.root, file);
  writeJsonFile(target, report);
  return target;
}

// src/compare/compare.ts
function numbers(baseline, current) {
  const delta = current - baseline;
  return {
    baseline,
    current,
    delta,
    percent: baseline > 0 ? delta / baseline * 100 : 0
  };
}
function signedBytes(bytes) {
  return `${bytes >= 0 ? "+" : "-"}${formatBytes(Math.abs(bytes))}`;
}
function routeBytes(route) {
  const seen = /* @__PURE__ */ new Set();
  let total = 0;
  for (const asset of [...route.assets.js, ...route.assets.css]) {
    const key = asset.bundleFile ?? asset.url;
    if (seen.has(key)) continue;
    seen.add(key);
    total += asset.bytes ?? 0;
  }
  return total;
}
function compareReports(baseline, current, thresholds, baselinePath = "baseline.json", currentPath) {
  const baselineFingerprints = new Set(baseline.findings.map((finding) => finding.fingerprint));
  const currentFingerprints = new Set(current.findings.map((finding) => finding.fingerprint));
  const newFindings = current.findings.filter((finding) => !baselineFingerprints.has(finding.fingerprint));
  const resolvedFindings = baseline.findings.filter((finding) => !currentFingerprints.has(finding.fingerprint));
  const bundle = {
    rawBytes: numbers(baseline.bundles.totals.rawBytes, current.bundles.totals.rawBytes),
    gzipBytes: numbers(baseline.bundles.totals.gzipBytes, current.bundles.totals.gzipBytes),
    cssRawBytes: numbers(baseline.bundles.totals.cssRawBytes, current.bundles.totals.cssRawBytes)
  };
  const routeMap = new Map(baseline.routes.map((route) => [route.id, route]));
  for (const route of current.routes) if (!routeMap.has(route.id)) routeMap.set(route.id, route);
  const routes = [...routeMap.values()].map((route) => {
    const baseRoute = baseline.routes.find((item) => item.id === route.id);
    const currentRoute = current.routes.find((item) => item.id === route.id);
    const baseBytes = baseRoute ? routeBytes(baseRoute) : 0;
    const currentBytes = currentRoute ? routeBytes(currentRoute) : 0;
    return {
      id: route.id,
      name: currentRoute?.name ?? baseRoute?.name ?? route.id,
      baselineBytes: baseBytes,
      currentBytes,
      delta: currentBytes - baseBytes,
      percent: baseBytes > 0 ? (currentBytes - baseBytes) / baseBytes * 100 : 0
    };
  });
  const failOn = new Set(thresholds.failOn ?? []);
  const eligibleNewFindings = failOn.size > 0 ? newFindings.filter((finding) => failOn.has(finding.category)) : newFindings.filter((finding) => finding.status === "confirmed-unused");
  const regressions = [];
  if (thresholds.maxTotalBundleBytes !== void 0 && bundle.rawBytes.current > thresholds.maxTotalBundleBytes) {
    regressions.push({
      kind: "total-bundle-limit",
      message: `Total bundle size ${formatBytes(bundle.rawBytes.current)} exceeds the configured limit ${formatBytes(thresholds.maxTotalBundleBytes)}.`,
      current: bundle.rawBytes.current,
      limit: thresholds.maxTotalBundleBytes
    });
  }
  if (thresholds.maxBundleGrowthBytes !== void 0 && bundle.rawBytes.delta > thresholds.maxBundleGrowthBytes) {
    regressions.push({
      kind: "bundle-growth",
      message: `Bundle grew by ${formatBytes(bundle.rawBytes.delta)}, above the allowed ${formatBytes(thresholds.maxBundleGrowthBytes)}.`,
      baseline: bundle.rawBytes.baseline,
      current: bundle.rawBytes.current,
      delta: bundle.rawBytes.delta,
      limit: thresholds.maxBundleGrowthBytes
    });
  }
  if (thresholds.maxBundleGrowthPercent !== void 0 && bundle.rawBytes.delta > 0 && bundle.rawBytes.percent > thresholds.maxBundleGrowthPercent) {
    regressions.push({
      kind: "bundle-growth",
      message: `Bundle grew by ${formatPercent(bundle.rawBytes.percent)}, above the allowed ${formatPercent(thresholds.maxBundleGrowthPercent)}.`,
      baseline: bundle.rawBytes.baseline,
      current: bundle.rawBytes.current,
      delta: bundle.rawBytes.delta,
      percent: bundle.rawBytes.percent,
      limit: thresholds.maxBundleGrowthPercent
    });
  }
  if (thresholds.maxCssGrowthBytes !== void 0 && bundle.cssRawBytes.delta > thresholds.maxCssGrowthBytes) {
    regressions.push({
      kind: "css-growth",
      message: `CSS grew by ${formatBytes(bundle.cssRawBytes.delta)}, above the allowed ${formatBytes(thresholds.maxCssGrowthBytes)}.`,
      baseline: bundle.cssRawBytes.baseline,
      current: bundle.cssRawBytes.current,
      delta: bundle.cssRawBytes.delta,
      limit: thresholds.maxCssGrowthBytes
    });
  }
  if (thresholds.maxCssGrowthPercent !== void 0 && bundle.cssRawBytes.delta > 0 && bundle.cssRawBytes.percent > thresholds.maxCssGrowthPercent) {
    regressions.push({
      kind: "css-growth",
      message: `CSS grew by ${formatPercent(bundle.cssRawBytes.percent)}, above the allowed ${formatPercent(thresholds.maxCssGrowthPercent)}.`,
      baseline: bundle.cssRawBytes.baseline,
      current: bundle.cssRawBytes.current,
      delta: bundle.cssRawBytes.delta,
      percent: bundle.cssRawBytes.percent,
      limit: thresholds.maxCssGrowthPercent
    });
  }
  const newFindingLimit = thresholds.maxNewFindings ?? (failOn.size > 0 ? 0 : void 0);
  if (newFindingLimit !== void 0 && eligibleNewFindings.length > newFindingLimit) {
    regressions.push({
      kind: "new-finding",
      message: `${eligibleNewFindings.length} new qualifying finding(s), above the allowed ${newFindingLimit}.`,
      current: eligibleNewFindings.length,
      limit: newFindingLimit,
      findingIds: eligibleNewFindings.slice(0, 50).map((finding) => finding.id)
    });
  }
  if (thresholds.maxRouteGrowthPercent !== void 0) {
    for (const route of routes) {
      if (route.baselineBytes <= 0 || route.delta <= 0) continue;
      if (route.percent > thresholds.maxRouteGrowthPercent) {
        regressions.push({
          kind: "route-growth",
          message: `Route ${route.id} grew by ${formatPercent(route.percent)}, above the allowed ${formatPercent(thresholds.maxRouteGrowthPercent)}.`,
          baseline: route.baselineBytes,
          current: route.currentBytes,
          delta: route.delta,
          percent: route.percent,
          limit: thresholds.maxRouteGrowthPercent
        });
      }
    }
  }
  return {
    baselinePath,
    ...currentPath ? { currentPath } : {},
    baselineGeneratedAt: baseline.generator.generatedAt,
    currentGeneratedAt: current.generator.generatedAt,
    bundle,
    findings: {
      baseline: baseline.findings.length,
      current: current.findings.length,
      new: newFindings,
      resolved: resolvedFindings,
      newFingerprints: newFindings.map((finding) => finding.fingerprint),
      resolvedFingerprints: resolvedFindings.map((finding) => finding.fingerprint)
    },
    routes,
    thresholds,
    regressions,
    passed: regressions.length === 0
  };
}
function formatComparison(result) {
  const lines = [];
  lines.push(`Baseline: ${result.baselinePath} (${result.baselineGeneratedAt ?? "unknown"})`);
  if (result.currentPath) lines.push(`Current:  ${result.currentPath} (${result.currentGeneratedAt ?? "unknown"})`);
  lines.push("");
  lines.push(
    `Bundle raw:  ${formatBytes(result.bundle.rawBytes.baseline)} \u2192 ${formatBytes(result.bundle.rawBytes.current)}  ${signedBytes(result.bundle.rawBytes.delta)} (${formatPercent(result.bundle.rawBytes.percent)})`
  );
  lines.push(
    `Bundle gzip: ${formatBytes(result.bundle.gzipBytes.baseline)} \u2192 ${formatBytes(result.bundle.gzipBytes.current)}  ${signedBytes(result.bundle.gzipBytes.delta)}`
  );
  lines.push(
    `CSS raw:     ${formatBytes(result.bundle.cssRawBytes.baseline)} \u2192 ${formatBytes(result.bundle.cssRawBytes.current)}  ${signedBytes(result.bundle.cssRawBytes.delta)}`
  );
  lines.push("");
  lines.push(`Findings: ${result.findings.baseline} \u2192 ${result.findings.current} (${result.findings.new.length} new, ${result.findings.resolved.length} resolved)`);
  if (result.findings.new.length > 0) {
    for (const finding of result.findings.new.slice(0, 12)) {
      lines.push(`  + ${finding.category}  ${finding.location.relativeFile}:${finding.location.line}  ${finding.symbol ?? finding.title}`);
    }
    if (result.findings.new.length > 12) lines.push(`  \u2026 ${result.findings.new.length - 12} more new findings`);
  }
  const changedRoutes = result.routes.filter((route) => route.delta !== 0);
  if (changedRoutes.length > 0) {
    lines.push("");
    lines.push("Route size changes:");
    for (const route of changedRoutes.slice(0, 20)) {
      lines.push(
        `  ${route.id}: ${formatBytes(route.baselineBytes)} \u2192 ${formatBytes(route.currentBytes)} (${signedBytes(route.delta)})`
      );
    }
  }
  lines.push("");
  if (result.regressions.length > 0) {
    lines.push("Threshold regressions:");
    for (const regression of result.regressions) lines.push(`  FAIL ${regression.message}`);
    lines.push("");
    lines.push("Comparison failed.");
  } else {
    lines.push("Comparison passed configured thresholds.");
  }
  return lines.join("\n");
}

// src/runtime/browser-collector.ts
function installBrowserCollector(options) {
  const KEY = "__codeUsageMapRuntime";
  const globalRecord = window;
  if (globalRecord[KEY]) return;
  const interval = Math.max(250, options?.snapshotIntervalMs ?? 600);
  const collectCss = options?.collectCss !== false;
  const collectNetwork = options?.collectNetwork !== false;
  const MAX_RULES = 3e4;
  const MAX_DYNAMIC_CSS = 200;
  const MAX_INTERACTIONS = 1e3;
  const createRoute = () => ({
    selectors: /* @__PURE__ */ new Map(),
    classes: /* @__PURE__ */ new Set(),
    ids: /* @__PURE__ */ new Set(),
    tags: /* @__PURE__ */ new Set(),
    stylesheets: /* @__PURE__ */ new Set(),
    scripts: /* @__PURE__ */ new Set(),
    resources: /* @__PURE__ */ new Map(),
    interactions: [],
    dynamicCss: [],
    warnings: /* @__PURE__ */ new Set()
  });
  const state = {
    currentRoute: routeKey(),
    overrideRoute: void 0,
    routes: /* @__PURE__ */ new Map(),
    seenResources: /* @__PURE__ */ new Set(),
    seenInlineCss: /* @__PURE__ */ new Set(),
    warnings: /* @__PURE__ */ new Set(),
    sweeping: false,
    ruleTruncated: false,
    sheetWarning: false
  };
  function routeKey() {
    const hash = window.location.hash;
    if (/^#\//.test(hash)) return hash.slice(1) || "/";
    return window.location.pathname || "/";
  }
  function currentRoute() {
    return state.overrideRoute ?? state.currentRoute;
  }
  function ensureRoute(route = currentRoute()) {
    const existing = state.routes.get(route);
    if (existing) return existing;
    const created = createRoute();
    state.routes.set(route, created);
    return created;
  }
  function splitSelectors2(value) {
    const result = [];
    let depth = 0;
    let quote;
    let start = 0;
    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      if (quote) {
        if (char === "\\") index += 1;
        else if (char === quote) quote = void 0;
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === "(" || char === "[") depth += 1;
      else if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
      else if (char === "," && depth === 0) {
        const part = value.slice(start, index).trim();
        if (part) result.push(part);
        start = index + 1;
      }
    }
    const tail = value.slice(start).trim();
    if (tail) result.push(tail);
    return result.length > 0 ? result : [value.trim()];
  }
  function selectorVariants(selector) {
    const variants = /* @__PURE__ */ new Set([selector]);
    const withoutPseudoElements = selector.replace(/::[A-Za-z-]+(?:\([^)]*\))?/g, "");
    if (withoutPseudoElements.trim()) variants.add(withoutPseudoElements);
    const withoutState = withoutPseudoElements.replace(
      /:(?:hover|focus-within|focus-visible|focus|active|visited|target|checked|disabled|enabled|invalid|valid|placeholder-shown|autofill|open|popover-open|user-invalid|user-valid|fullscreen|modal|picture-in-picture|playing|paused|muted|seeking|buffering|stalled)(?![\w-])/g,
      ""
    ).replace(/:not\(\s*\)/g, "");
    if (withoutState.trim()) variants.add(withoutState);
    return [...variants].filter((variant) => {
      if (!variant.trim()) return false;
      try {
        document.createDocumentFragment().querySelector(variant);
        return true;
      } catch {
        return false;
      }
    });
  }
  function collectRoots() {
    const roots = [document];
    const visit = (root) => {
      const elements = Array.from(root.querySelectorAll("*"));
      for (const element of elements) {
        const shadow = element.shadowRoot;
        if (shadow) {
          roots.push(shadow);
          visit(shadow);
        }
      }
    };
    visit(document);
    return roots;
  }
  function countMatches(selector, roots) {
    let count = 0;
    for (const root of roots) {
      try {
        count += root.querySelectorAll(selector).length;
      } catch {
        continue;
      }
      if (count > 9999) return 9999;
    }
    return count;
  }
  function collectStyleSheets(roots) {
    const result = [];
    const seen = /* @__PURE__ */ new Set();
    let inlineIndex = 0;
    const add = (sheet, keyHint) => {
      if (!sheet || seen.has(sheet)) return;
      seen.add(sheet);
      const key = sheet.href ?? keyHint ?? `inline:${inlineIndex}`;
      inlineIndex += 1;
      result.push({ sheet, key });
    };
    for (const sheet of Array.from(document.styleSheets)) add(sheet);
    const adopted = document.adoptedStyleSheets ?? [];
    for (const sheet of Array.from(adopted)) add(sheet, "adopted:document");
    for (const root of roots) {
      if (root === document) continue;
      const shadowRoot = root;
      const shadowAdopted = shadowRoot.adoptedStyleSheets ?? [];
      for (const sheet of Array.from(shadowAdopted)) add(sheet, "adopted:shadow");
    }
    for (const root of roots) {
      for (const element of Array.from(root.querySelectorAll('style,link[rel="stylesheet"]'))) {
        if (element instanceof HTMLStyleElement) add(element.sheet, `style:${element.textContent?.slice(0, 20) ?? ""}`);
        else if (element instanceof HTMLLinkElement) add(element.sheet, element.href);
      }
    }
    return result;
  }
  function mediaMatches(text) {
    try {
      return window.matchMedia(text).matches;
    } catch {
      return true;
    }
  }
  function addSelector(route, sheetKey, selector, matched, stateOnly, media, mediaActive, ruleText) {
    const normalized = selector.replace(/\s+/g, " ").trim();
    if (!normalized) return;
    const key = normalized;
    const existing = route.selectors.get(key);
    if (existing) {
      existing.sheets.add(sheetKey);
      existing.matchedElements = Math.max(existing.matchedElements, matched);
      existing.stateOnly = existing.stateOnly && stateOnly;
      for (const item of media) existing.media.add(item);
      existing.mediaActive = existing.mediaActive || mediaActive;
      if (!existing.ruleText && ruleText) existing.ruleText = ruleText;
      return;
    }
    route.selectors.set(key, {
      selector: normalized,
      sheets: /* @__PURE__ */ new Set([sheetKey]),
      matchedElements: matched,
      stateOnly,
      media: new Set(media),
      mediaActive,
      ...ruleText ? { ruleText } : {}
    });
  }
  function walkRules(rule, sheetKey, roots, route, media, ruleCounter) {
    if (ruleCounter.count > MAX_RULES) {
      if (!state.ruleTruncated) {
        state.ruleTruncated = true;
        state.warnings.add(`CSS rule sweep stopped after ${MAX_RULES} rules.`);
      }
      return;
    }
    ruleCounter.count += 1;
    if (rule.styleSheet) {
      try {
        visitStyleSheet(rule.styleSheet, rule.styleSheet.href ?? sheetKey, roots, route, media, ruleCounter);
      } catch {
      }
      return;
    }
    const mediaList = rule.media?.mediaText;
    const nextMedia = mediaList ? [...media, mediaList] : media;
    const isStyleRule = typeof rule.selectorText === "string" && rule.selectorText.trim() !== "";
    if (isStyleRule && rule.selectorText) {
      const ruleText = `${rule.selectorText}{${rule.style?.cssText ?? ""}}`;
      const active = nextMedia.every((item) => mediaMatches(item));
      for (const selector of splitSelectors2(rule.selectorText)) {
        let matched = 0;
        let stateOnly = false;
        const variants = selectorVariants(selector);
        for (let index = 0; index < variants.length; index += 1) {
          const variant = variants[index];
          if (!variant) continue;
          const count = countMatches(variant, roots);
          if (count > 0) {
            matched = count;
            stateOnly = index > 0 || !active;
            break;
          }
        }
        if (matched > 0) {
          addSelector(route, sheetKey, selector, matched, stateOnly, nextMedia, active, ruleText.slice(0, 1200));
        }
      }
    }
    if (rule.cssRules) {
      for (const child of Array.from(rule.cssRules)) {
        walkRules(child, sheetKey, roots, route, nextMedia, ruleCounter);
      }
    }
  }
  function visitStyleSheet(sheet, key, roots, route, media, ruleCounter) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      if (!state.sheetWarning) {
        state.sheetWarning = true;
        state.warnings.add("Some cross-origin stylesheets could not be inspected; CSS coverage is partial.");
      }
      return;
    }
    for (const rule of Array.from(rules)) {
      walkRules(rule, key, roots, route, media, ruleCounter);
    }
  }
  function recordResource(entry2) {
    if (!collectNetwork) return;
    const type = entry2.initiatorType === "script" || /\.(?:mjs?|cjs)(?:[?#]|$)/i.test(entry2.name) ? "js" : entry2.initiatorType === "link" || entry2.initiatorType === "css" || /\.css(?:[?#]|$)/i.test(entry2.name) ? "css" : "other";
    if (type === "other") return;
    const key = `${entry2.name}|${Math.round(entry2.startTime)}`;
    if (state.seenResources.has(key)) return;
    state.seenResources.add(key);
    const route = ensureRoute();
    route.resources.set(key, {
      url: entry2.name,
      type,
      bytes: entry2.encodedBodySize || entry2.transferSize || 0,
      ...entry2.initiatorType ? { initiatorType: entry2.initiatorType } : {},
      startTime: Math.round(entry2.startTime),
      ...entry2.duration ? { duration: Math.round(entry2.duration) } : {}
    });
  }
  function scanResourceEntries() {
    if (!collectNetwork) return;
    try {
      for (const entry2 of performance.getEntriesByType("resource")) {
        recordResource(entry2);
      }
    } catch {
    }
  }
  function recordDynamicCss(text) {
    if (!collectCss) return;
    const route = ensureRoute();
    if (route.dynamicCss.length >= MAX_DYNAMIC_CSS) return;
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    route.dynamicCss.push({ text: cleaned.slice(0, 3e3), route: currentRoute() });
  }
  function sweep() {
    if (state.sweeping) return;
    state.sweeping = true;
    try {
      const route = ensureRoute();
      if (collectCss) {
        const roots = collectRoots();
        for (const root of roots) {
          for (const element of Array.from(root.querySelectorAll("*"))) {
            for (const token of Array.from(element.classList)) route.classes.add(token);
            if (element.id) route.ids.add(element.id);
            route.tags.add(element.tagName.toLowerCase());
          }
        }
        const sheets = collectStyleSheets(roots);
        for (const { sheet, key } of sheets) {
          route.stylesheets.add(key);
          const ruleCounter = { count: 0 };
          try {
            visitStyleSheet(sheet, key, roots, route, [], ruleCounter);
          } catch {
            if (!state.sheetWarning) {
              state.sheetWarning = true;
              state.warnings.add("A stylesheet could not be inspected completely.");
            }
          }
        }
        for (const rootItem of roots) {
          for (const style of Array.from(rootItem.querySelectorAll("style"))) {
            const text = (style.textContent ?? "").trim();
            if (!text) continue;
            const styleKey = text.slice(0, 160);
            if (state.seenInlineCss.has(styleKey)) continue;
            state.seenInlineCss.add(styleKey);
            recordDynamicCss(text);
          }
        }
      }
      for (const script of Array.from(document.querySelectorAll("script[src]"))) {
        const src = script.getAttribute("src");
        if (src) {
          try {
            route.scripts.add(new URL(src, document.baseURI).href);
          } catch {
            route.scripts.add(src);
          }
        }
      }
      for (const link of Array.from(document.querySelectorAll("link[href]"))) {
        const rel = link.getAttribute("rel") ?? "";
        if (rel.includes("stylesheet")) {
          const href = link.getAttribute("href");
          if (href) {
            try {
              route.stylesheets.add(new URL(href, document.baseURI).href);
            } catch {
              route.stylesheets.add(href);
            }
          }
        }
      }
      scanResourceEntries();
    } catch (error) {
      state.warnings.add(`Runtime snapshot failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      state.sweeping = false;
    }
  }
  let sweepTimer;
  function scheduleSweep(delay = 180) {
    if (sweepTimer !== void 0) window.clearTimeout(sweepTimer);
    sweepTimer = window.setTimeout(() => {
      sweepTimer = void 0;
      sweep();
    }, delay);
  }
  function afterRouteChange() {
    state.currentRoute = routeKey();
    scheduleSweep(120);
    window.setTimeout(() => scheduleSweep(350), 350);
  }
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);
  const wrappedPushState = function(data, title, url) {
    sweep();
    originalPushState(data, title, url);
    afterRouteChange();
  };
  const wrappedReplaceState = function(data, title, url) {
    sweep();
    originalReplaceState(data, title, url);
    afterRouteChange();
  };
  history.pushState = wrappedPushState;
  history.replaceState = wrappedReplaceState;
  window.addEventListener("popstate", () => {
    sweep();
    afterRouteChange();
  });
  window.addEventListener("hashchange", () => {
    sweep();
    afterRouteChange();
  });
  const interactionTypes = /* @__PURE__ */ new Set(["click", "input", "change", "submit", "keydown"]);
  const recordInteraction = (event) => {
    if (!interactionTypes.has(event.type)) return;
    const target = event.target;
    const tag = target instanceof Element ? target.tagName.toLowerCase() : "unknown";
    const route = ensureRoute();
    if (route.interactions.length < MAX_INTERACTIONS) route.interactions.push({ type: event.type, tag });
  };
  for (const type of interactionTypes) {
    document.addEventListener(type, recordInteraction, { capture: true, passive: true });
  }
  if (collectNetwork) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry2 of list.getEntries()) {
          if (entry2.entryType === "resource") recordResource(entry2);
        }
      });
      observer.observe({ type: "resource", buffered: true });
    } catch {
    }
  }
  try {
    const mutationObserver = new MutationObserver((mutations) => {
      const relevant = mutations.some(
        (mutation) => mutation.type === "childList" || mutation.type === "attributes" && ["class", "id", "style"].includes(mutation.attributeName ?? "")
      );
      if (relevant) scheduleSweep();
    });
    mutationObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "id", "style"]
    });
  } catch {
  }
  if (collectCss) try {
    const originalInsertRule = CSSStyleSheet.prototype.insertRule;
    CSSStyleSheet.prototype.insertRule = function(rule, index) {
      const result = originalInsertRule.call(this, rule, index);
      recordDynamicCss(rule);
      return result;
    };
  } catch {
  }
  if (collectCss) try {
    const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
    if (typeof originalReplaceSync === "function") {
      CSSStyleSheet.prototype.replaceSync = function(text) {
        originalReplaceSync.call(this, text);
        recordDynamicCss(text);
      };
    }
  } catch {
  }
  window.addEventListener("load", () => scheduleSweep(0));
  scheduleSweep(0);
  window.setInterval(() => sweep(), interval);
  const api = {
    take() {
      sweep();
      const routes = [];
      for (const [routeName, route] of state.routes) {
        const hasData = route.selectors.size > 0 || route.classes.size > 0 || route.ids.size > 0 || route.resources.size > 0 || route.interactions.length > 0 || route.dynamicCss.length > 0 || route.stylesheets.size > 0;
        if (!hasData) continue;
        routes.push({
          route: routeName,
          selectors: [...route.selectors.values()].map((entry2) => ({
            selector: entry2.selector,
            sheets: [...entry2.sheets].sort(),
            matchedElements: entry2.matchedElements,
            stateOnly: entry2.stateOnly,
            media: [...entry2.media],
            mediaActive: entry2.mediaActive,
            ...entry2.ruleText ? { ruleText: entry2.ruleText } : {}
          })).sort((a, b) => a.selector.localeCompare(b.selector)),
          dom: {
            classes: [...route.classes].sort(),
            ids: [...route.ids].sort(),
            tags: [...route.tags].sort()
          },
          stylesheets: [...route.stylesheets].sort(),
          scripts: [...route.scripts].sort(),
          resources: [...route.resources.values()].sort((a, b) => a.startTime - b.startTime),
          interactions: route.interactions.slice(0, MAX_INTERACTIONS),
          dynamicCss: route.dynamicCss.slice(0, MAX_DYNAMIC_CSS),
          capturedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        for (const warning of route.warnings) state.warnings.add(warning);
      }
      const snapshot = {
        href: window.location.href,
        timeOrigin: performance.timeOrigin || Date.now(),
        routes,
        warnings: [...state.warnings]
      };
      state.routes.clear();
      return snapshot;
    },
    setRoute(name) {
      state.overrideRoute = name && name.trim() ? name.trim() : void 0;
      if (state.overrideRoute) scheduleSweep(0);
    }
  };
  globalRecord[KEY] = api;
}

// src/runtime/collect.ts
function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Runtime base URL must be absolute: ${value}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Runtime base URL must use http or https: ${value}`);
  }
  return url;
}
function canonicalRouteId(pathname, basePath) {
  let value = pathname || "/";
  if (!value.startsWith("/")) value = `/${value}`;
  const normalizedBase = basePath.replace(/\/+$/, "");
  if (normalizedBase && normalizedBase !== "/") {
    if (value === normalizedBase) value = "/";
    else if (value.startsWith(`${normalizedBase}/`)) value = value.slice(normalizedBase.length);
  }
  if (value.length > 1) value = value.replace(/\/+$/, "");
  return value || "/";
}
function routePathFromUrl(url) {
  if (/^#\//.test(url.hash)) return url.hash.slice(1) || "/";
  return canonicalRouteId(url.pathname, "");
}
function resolveRoutes(baseUrl, inputs, basePath) {
  const basePathname = baseUrl.pathname.endsWith("/") ? baseUrl.pathname : `${baseUrl.pathname}/`;
  const routes = [];
  for (const input of inputs) {
    let pathValue;
    let urlValue;
    let nameValue;
    if (typeof input === "string") {
      if (/^https?:\/\//i.test(input)) urlValue = input;
      else pathValue = input;
    } else {
      pathValue = input.path;
      urlValue = input.url;
      nameValue = input.name;
    }
    if (!pathValue && !urlValue) continue;
    let target;
    if (urlValue) {
      target = new URL(urlValue);
    } else {
      const cleanPath = (pathValue ?? "/").trim();
      if (/^#\//.test(cleanPath)) {
        target = new URL(baseUrl.toString());
        target.hash = cleanPath;
      } else {
        const relative = cleanPath.replace(/^\/+/, "");
        target = new URL(relative, `${baseUrl.origin}${basePathname}`);
      }
    }
    const routePath = pathValue ?? routePathFromUrl(target);
    const id = canonicalRouteId(
      /^#\//.test(target.hash) ? target.hash.slice(1) : routePath.startsWith("/") ? routePath : routePathFromUrl(target),
      basePath
    );
    routes.push({
      id,
      name: nameValue ?? id,
      path: routePath,
      url: target.href
    });
  }
  return routes;
}
var ChromiumCoverage = class _ChromiumCoverage {
  available = true;
  client;
  active = false;
  scriptUrls = /* @__PURE__ */ new Map();
  scriptSources = /* @__PURE__ */ new Map();
  warnings = [];
  browserName = "chromium";
  static async create(context, page, browserName) {
    if (browserName !== "chromium") return void 0;
    try {
      const client = await context.newCDPSession(page);
      const coverage = new _ChromiumCoverage();
      coverage.client = client;
      client.on("Debugger.scriptParsed", (event) => {
        const parsed = event;
        if (parsed.scriptId) coverage.scriptUrls.set(parsed.scriptId, parsed.url ?? "");
      });
      await client.send("Profiler.enable");
      await client.send("Debugger.enable");
      return coverage;
    } catch {
      return void 0;
    }
  }
  async start() {
    if (!this.client) return false;
    if (this.active) await this.stop();
    try {
      await this.client.send("Profiler.startPreciseCoverage", {
        callCount: true,
        detailed: true
      });
      this.active = true;
      return true;
    } catch (error) {
      this.warnings.push(
        `Precise coverage could not start: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }
  async stop() {
    if (!this.client || !this.active) return;
    try {
      await this.client.send("Profiler.stopPreciseCoverage");
    } catch {
    }
    this.active = false;
  }
  async take() {
    const empty = {
      available: false,
      browser: this.browserName,
      functions: [],
      scripts: [],
      truncated: false,
      note: this.warnings.join(" ")
    };
    if (!this.client || !this.active) return empty;
    let raw;
    try {
      raw = await this.client.send("Profiler.takePreciseCoverage");
    } catch (error) {
      this.warnings.push(
        `Precise coverage could not be read: ${error instanceof Error ? error.message : String(error)}`
      );
      await this.stop();
      return { ...empty, note: this.warnings.join(" ") };
    }
    await this.stop();
    const functions = [];
    const scripts = [];
    let truncated = false;
    const MAX_FUNCTIONS = 5e4;
    for (const entry2 of raw.result) {
      if (!entry2.url || entry2.url.startsWith("data:") || entry2.url.startsWith("blob:")) continue;
      if (this.scriptUrls.get(entry2.scriptId) === void 0) {
        this.scriptUrls.set(entry2.scriptId, entry2.url);
      }
      let totalFunctions = 0;
      let executedFunctions = 0;
      let totalFunctionBytes = 0;
      let executedFunctionBytes = 0;
      let text;
      const needsText = entry2.functions.some((fn) => fn.ranges.some((range) => range.count > 0));
      if (needsText) {
        text = await this.getScriptSource(entry2.scriptId);
      }
      const lineStarts = text ? buildLineStarts(text) : void 0;
      for (const fn of entry2.functions) {
        const first = fn.ranges[0];
        if (!first) continue;
        totalFunctions += 1;
        const spanBytes = Math.max(0, first.endOffset - first.startOffset);
        totalFunctionBytes += spanBytes;
        const maxCount = fn.ranges.reduce((max, range) => Math.max(max, range.count), 0);
        if (maxCount <= 0) continue;
        executedFunctions += 1;
        executedFunctionBytes += spanBytes;
        if (!lineStarts) continue;
        if (functions.length >= MAX_FUNCTIONS) {
          truncated = true;
          continue;
        }
        const start = offsetToPosition2(lineStarts, first.startOffset);
        const end = offsetToPosition2(lineStarts, first.endOffset);
        functions.push({
          url: entry2.url,
          functionName: fn.functionName,
          startOffset: first.startOffset,
          endOffset: first.endOffset,
          startLine: start.line,
          startColumn: start.column,
          endLine: end.line,
          endColumn: end.column,
          bytes: spanBytes,
          count: maxCount
        });
      }
      if (totalFunctions > 0) {
        scripts.push({
          url: entry2.url,
          totalFunctions,
          executedFunctions,
          totalFunctionBytes,
          executedFunctionBytes
        });
      }
    }
    return {
      available: true,
      browser: this.browserName,
      functions,
      scripts,
      truncated,
      ...this.warnings.length > 0 ? { note: this.warnings.join(" ") } : {}
    };
  }
  async getScriptSource(scriptId) {
    if (this.scriptSources.has(scriptId)) return this.scriptSources.get(scriptId);
    if (!this.client) return void 0;
    try {
      const result = await this.client.send("Debugger.getScriptSource", { scriptId });
      this.scriptSources.set(scriptId, result.scriptSource);
      return result.scriptSource;
    } catch {
      this.scriptSources.set(scriptId, void 0);
      return void 0;
    }
  }
  async close() {
    await this.stop();
    try {
      await this.client?.detach();
    } catch {
    }
    this.client = void 0;
  }
};
function buildLineStarts(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) starts.push(index + 1);
  }
  return starts;
}
function offsetToPosition2(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if ((lineStarts[mid] ?? 0) <= offset) low = mid + 1;
    else high = mid - 1;
  }
  const lineIndex = Math.max(0, high);
  return {
    line: lineIndex + 1,
    column: offset - (lineStarts[lineIndex] ?? 0) + 1
  };
}
async function launchBrowser(browserName, headless) {
  let playwrightModule;
  try {
    playwrightModule = await import('playwright');
  } catch {
    throw new Error(
      'Runtime collection requires Playwright. Install it with "npm i -D playwright" and then "npx playwright install chromium".'
    );
  }
  const browserType = playwrightModule[browserName];
  const options = { headless };
  try {
    return await browserType.launch(options);
  } catch (error) {
    if (browserName === "chromium") {
      for (const channel of ["chrome", "msedge"]) {
        try {
          return await browserType.launch({ headless, channel });
        } catch {
        }
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to launch ${browserName}: ${message}
Install browsers with "npx playwright install ${browserName}" or run with --interactive using an installed browser.`
    );
  }
}
function findScenario(scenarios, route) {
  return scenarios.find((scenario) => {
    if (scenario.route === "*") return true;
    return scenario.route === route.id || scenario.route === route.path || scenario.route === route.name || scenario.route === route.url;
  });
}
async function runActions(page, actions, route, scenario, timeoutMs, settleMs, warnings) {
  const performed = [];
  for (const action of actions) {
    const timeout = action.timeoutMs ?? timeoutMs;
    const selector = action.selector;
    try {
      switch (action.type) {
        case "click":
          if (!selector) throw new Error("click requires a selector");
          await page.locator(selector).first().click({ timeout });
          break;
        case "hover":
          if (!selector) throw new Error("hover requires a selector");
          await page.locator(selector).first().hover({ timeout });
          break;
        case "fill":
          if (!selector) throw new Error("fill requires a selector");
          await page.locator(selector).first().fill(action.value ?? "", { timeout });
          break;
        case "press":
          if (selector) await page.locator(selector).first().press(action.key ?? "Enter", { timeout });
          else await page.keyboard.press(action.key ?? "Enter");
          break;
        case "waitForSelector":
          if (!selector) throw new Error("waitForSelector requires a selector");
          await page.locator(selector).first().waitFor({ state: "visible", timeout });
          break;
        case "wait":
          await page.waitForTimeout(action.ms ?? settleMs);
          break;
        case "select":
          if (!selector) throw new Error("select requires a selector");
          await page.locator(selector).first().selectOption(action.value ?? "", { timeout });
          break;
      }
      performed.push(`${action.type}${selector ? ` ${selector}` : ""}`);
      if (action.type !== "wait" && action.ms) await page.waitForTimeout(action.ms);
      else await page.waitForTimeout(Math.min(200, settleMs));
    } catch (error) {
      const message = `Scenario action "${action.type}${selector ? ` ${selector}` : ""}" failed on ${route.id}: ${error instanceof Error ? error.message : String(error)}`;
      warnings.push(message);
      if (scenario?.strict) throw new Error(message);
    }
  }
  return performed;
}
async function takeSnapshot(page, basePath, warnings) {
  try {
    const snapshot = await page.evaluate(() => {
      const globalWindow = window;
      return globalWindow.__codeUsageMapRuntime?.take() ?? null;
    });
    if (!snapshot) {
      warnings.push("The in-page collector was not available. CSS/DOM runtime data is incomplete.");
      return {
        href: page.url(),
        timeOrigin: Date.now(),
        routes: [],
        warnings: ["Collector unavailable."]
      };
    }
    return {
      ...snapshot,
      routes: snapshot.routes.map((route) => ({
        ...route,
        route: canonicalRouteId(route.route, basePath)
      }))
    };
  } catch (error) {
    warnings.push(`Runtime snapshot failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      href: page.url(),
      timeOrigin: Date.now(),
      routes: [],
      warnings: [error instanceof Error ? error.message : String(error)]
    };
  }
}
async function tryLinkNavigation(page, route, timeoutMs) {
  try {
    const target = new URL(route.url);
    const index = await page.evaluate((targetUrl) => {
      const targetParsed = new URL(targetUrl);
      const anchors = Array.from(document.querySelectorAll("a[href]"));
      for (let index2 = 0; index2 < anchors.length; index2 += 1) {
        const anchor = anchors[index2];
        if (!(anchor instanceof HTMLAnchorElement)) continue;
        let href;
        try {
          href = new URL(anchor.href, document.baseURI);
        } catch {
          continue;
        }
        if (href.origin !== targetParsed.origin) continue;
        if (href.pathname !== targetParsed.pathname) continue;
        if (targetParsed.hash && href.hash !== targetParsed.hash) continue;
        return index2;
      }
      return -1;
    }, target.href);
    if (index < 0) return false;
    await page.locator("a[href]").nth(index).click({ timeout: Math.min(timeoutMs, 1e4) });
    try {
      await page.waitForURL(
        (url) => url.pathname === target.pathname && (!target.hash || url.hash === target.hash),
        { timeout: Math.min(timeoutMs, 1e4) }
      );
    } catch {
    }
    return true;
  } catch {
    return false;
  }
}
async function waitForEnter(signal) {
  const readline = createInterface({ input: stdin, output: stderr });
  const aborted = new Promise((resolve) => {
    if (!signal) return;
    signal.addEventListener("abort", () => {
      readline.close();
      resolve();
    }, { once: true });
  });
  try {
    await Promise.race([
      readline.question("Interactive runtime analysis is active. Navigate the app, then press Enter to finish. "),
      aborted
    ]);
  } finally {
    readline.close();
  }
}
async function collectRuntime(input) {
  const options = input.options ?? {};
  const runtime = input.config.runtime;
  const baseUrlValue = options.baseUrl ?? runtime.baseUrl;
  if (!baseUrlValue) {
    throw new Error(
      "Runtime collection needs a base URL. Pass --url http://localhost:3000, set runtime.baseUrl, or let the CLI serve an existing build directory."
    );
  }
  const baseUrl = normalizeBaseUrl(baseUrlValue);
  const basePath = baseUrl.pathname;
  const browserName = options.browser ?? runtime.browser;
  const interactive = options.interactive ?? runtime.interactive;
  const headless = interactive ? false : options.headless ?? runtime.headless;
  if (interactive && !stdin.isTTY) {
    throw new Error("Interactive mode requires a TTY. Use automated --routes for CI.");
  }
  throwIfAborted(options.signal);
  const routeInputs = options.routes ?? runtime.routes;
  const configuredRoutes = resolveRoutes(
    baseUrl,
    routeInputs.length > 0 ? routeInputs : ["/"],
    basePath
  );
  options.onProgress?.({
    phase: "runtime",
    message: interactive ? `Opening ${baseUrl.href} for interactive collection.` : `Opening ${baseUrl.href} and visiting ${configuredRoutes.length} route${configuredRoutes.length === 1 ? "" : "s"}.`
  });
  const browser = await launchBrowser(browserName, headless);
  let context;
  let page;
  let coverage;
  const visits = [];
  const sessionWarnings = [];
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const sessionId = `rt_${Date.now()}_${hashString(Math.random().toString(), 6)}`;
  let userAgent;
  try {
    const storageState = runtime.storageState ? path8.isAbsolute(runtime.storageState) ? runtime.storageState : path8.resolve(input.root, runtime.storageState) : void 0;
    context = await browser.newContext({
      viewport: runtime.viewport,
      ignoreHTTPSErrors: runtime.ignoreHTTPSErrors,
      ...storageState && existsSync(storageState) ? { storageState } : {}
    });
    page = await context.newPage();
    page.setDefaultTimeout(runtime.timeoutMs);
    userAgent = await page.evaluate(() => navigator.userAgent).catch(() => void 0);
    const collectorSource = `(${installBrowserCollector.toString()})(${JSON.stringify({
      snapshotIntervalMs: runtime.snapshotIntervalMs,
      collectCss: runtime.collectCss,
      collectNetwork: runtime.collectNetwork
    })});`;
    await page.addInitScript({ content: collectorSource });
    page.on("pageerror", (error) => {
      if (sessionWarnings.length < 30) {
        sessionWarnings.push(`Page error: ${String(error.message).slice(0, 500)}`);
      }
    });
    if (browserName !== "chromium") {
      sessionWarnings.push(
        `Precise JavaScript coverage is Chromium-only. ${browserName} collection includes script loading, route CSS/DOM and resources but not function coverage.`
      );
    } else if (runtime.collectCoverage) {
      coverage = await ChromiumCoverage.create(context, page, browserName);
      if (!coverage) {
        sessionWarnings.push("Unable to attach Chromium precise coverage; route analysis will use script/resource loading only.");
      }
    }
    if (interactive) {
      if (coverage) await coverage.start();
      await page.goto(baseUrl.href, {
        waitUntil: runtime.waitUntil,
        timeout: runtime.timeoutMs
      });
      await page.waitForTimeout(runtime.settleMs);
      options.onProgress?.({
        phase: "runtime",
        message: "Interactive browser is ready. Navigate routes and interactions, then press Enter in the terminal."
      });
      throwIfAborted(options.signal);
      await waitForEnter(options.signal);
      throwIfAborted(options.signal);
      await page.waitForTimeout(runtime.settleMs);
      const snapshot = await takeSnapshot(page, basePath, sessionWarnings);
      const sessionCoverage = coverage ? await coverage.take() : void 0;
      const routeSnapshots = snapshot.routes.length > 0 ? snapshot.routes : [
        {
          route: canonicalRouteId(new URL(page.url()).pathname, basePath),
          selectors: [],
          dom: { classes: [], ids: [], tags: [] },
          stylesheets: [],
          scripts: [],
          resources: [],
          interactions: [],
          dynamicCss: [],
          capturedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
      const now = (/* @__PURE__ */ new Date()).toISOString();
      for (const routeSnapshot of routeSnapshots) {
        visits.push({
          route: routeSnapshot.route,
          name: routeSnapshot.route,
          path: routeSnapshot.route,
          url: page.url(),
          navigation: "interactive",
          startedAt,
          finishedAt: now,
          durationMs: Date.parse(now) - Date.parse(startedAt),
          snapshot: { ...snapshot, routes: [routeSnapshot] },
          actions: [],
          warnings: [...snapshot.warnings]
        });
      }
      const session2 = {
        schemaVersion: 1,
        id: sessionId,
        startedAt,
        finishedAt: now,
        baseUrl: baseUrl.href,
        browser: browserName,
        headless,
        interactive: true,
        navigationMode: runtime.navigation,
        viewport: runtime.viewport,
        ...userAgent ? { userAgent } : {},
        visits,
        ...sessionCoverage ? { coverageSession: sessionCoverage } : {},
        warnings: [.../* @__PURE__ */ new Set([...sessionWarnings, ...snapshot.warnings])]
      };
      if (input.persist !== false) saveRuntimeSession(input.root, session2);
      for (const visit of visits) {
        options.onProgress?.({
          phase: "runtime",
          message: `Captured route ${visit.route}${sessionCoverage?.available ? " (session-level JS coverage)" : ""}.`
        });
      }
      return {
        sessions: [session2],
        result: {
          sessionIds: [session2.id],
          routes: visits.map((visit) => visit.route),
          baseUrl: baseUrl.href
        }
      };
    }
    for (let routeIndex = 0; routeIndex < configuredRoutes.length; routeIndex += 1) {
      throwIfAborted(options.signal);
      const route = configuredRoutes[routeIndex];
      if (!route) continue;
      const started = /* @__PURE__ */ new Date();
      const visitWarnings = [];
      let navigation = routeIndex === 0 ? "initial" : "goto";
      if (coverage) {
        const startedCoverage = await coverage.start();
        if (!startedCoverage) visitWarnings.push("Coverage did not start for this route.");
      }
      try {
        if (routeIndex === 0) {
          await page.goto(route.url, {
            waitUntil: runtime.waitUntil,
            timeout: runtime.timeoutMs
          });
        } else if (runtime.navigation === "auto") {
          const linked = await tryLinkNavigation(page, route, runtime.timeoutMs);
          if (linked) {
            navigation = "link";
          } else {
            await page.goto(route.url, {
              waitUntil: runtime.waitUntil,
              timeout: runtime.timeoutMs
            });
          }
        } else {
          await page.goto(route.url, {
            waitUntil: runtime.waitUntil,
            timeout: runtime.timeoutMs
          });
        }
        await page.waitForTimeout(runtime.settleMs);
        const scenario = findScenario(runtime.scenarios, route);
        const actions = scenario ? await runActions(
          page,
          scenario.actions,
          route,
          scenario,
          runtime.timeoutMs,
          runtime.settleMs,
          visitWarnings
        ) : [];
        await page.waitForTimeout(runtime.settleMs);
        const routeCoverage = coverage ? await coverage.take() : void 0;
        const snapshot = await takeSnapshot(page, basePath, visitWarnings);
        const matchingRoutes = snapshot.routes.filter((item) => item.route === route.id);
        const selectedRoutes = matchingRoutes.length > 0 ? matchingRoutes : snapshot.routes.length > 0 ? [snapshot.routes[snapshot.routes.length - 1]] : [];
        const visitSnapshot = { ...snapshot, routes: selectedRoutes };
        const canonical = route.id;
        const finished = /* @__PURE__ */ new Date();
        visits.push({
          route: canonical,
          name: route.name,
          path: route.id,
          url: page.url(),
          navigation,
          startedAt: started.toISOString(),
          finishedAt: finished.toISOString(),
          durationMs: finished.getTime() - started.getTime(),
          snapshot: visitSnapshot,
          ...routeCoverage ? { coverage: routeCoverage } : {},
          actions,
          warnings: [...visitWarnings, ...snapshot.warnings]
        });
        options.onProgress?.({
          phase: "runtime",
          message: `Captured ${canonical} (${navigation}${routeCoverage?.available ? `, ${routeCoverage.functions.length} executed function records` : ", no function coverage"}).`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        visitWarnings.push(`Route ${route.id} failed: ${message}`);
        sessionWarnings.push(`Route ${route.id} failed: ${message}`);
        const routeCoverage = coverage ? await coverage.take() : void 0;
        const snapshot = await takeSnapshot(page, basePath, visitWarnings);
        const finished = /* @__PURE__ */ new Date();
        visits.push({
          route: route.id,
          name: route.name,
          path: route.id,
          url: page.url(),
          navigation,
          startedAt: started.toISOString(),
          finishedAt: finished.toISOString(),
          durationMs: finished.getTime() - started.getTime(),
          snapshot,
          ...routeCoverage ? { coverage: routeCoverage } : {},
          actions: [],
          warnings: [...visitWarnings, ...snapshot.warnings]
        });
        options.onProgress?.({
          phase: "runtime",
          message: `Route ${route.id} reported an error but was captured for diagnostics.`
        });
      }
    }
    if (coverage) await coverage.close();
    const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    const session = {
      schemaVersion: 1,
      id: sessionId,
      startedAt,
      finishedAt,
      baseUrl: baseUrl.href,
      browser: browserName,
      headless,
      interactive: false,
      navigationMode: runtime.navigation,
      viewport: runtime.viewport,
      ...userAgent ? { userAgent } : {},
      visits,
      warnings: [.../* @__PURE__ */ new Set([...sessionWarnings, ...visits.flatMap((visit) => visit.warnings)])]
    };
    if (input.persist !== false) saveRuntimeSession(input.root, session);
    return {
      sessions: [session],
      result: {
        sessionIds: [session.id],
        routes: visits.map((visit) => visit.route),
        baseUrl: baseUrl.href
      }
    };
  } finally {
    await coverage?.close().catch(() => void 0);
    await context?.close().catch(() => void 0);
    await browser.close().catch(() => void 0);
  }
}
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm"
};
function safeResolve(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0] ?? "/");
  const candidate = path8.resolve(root, `.${decoded}`);
  if (candidate !== root && !candidate.startsWith(`${root}${path8.sep}`)) return void 0;
  return candidate;
}
function isFile(file) {
  try {
    return existsSync(file) && statSync(file).isFile();
  } catch {
    return false;
  }
}
async function startStaticServer(rootDir) {
  const root = path8.resolve(rootDir);
  const index = path8.join(root, "index.html");
  const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405);
      response.end("Method Not Allowed");
      return;
    }
    const resolved = safeResolve(root, request.url ?? "/");
    if (!resolved) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const candidates = [
      resolved,
      `${resolved}.html`,
      path8.join(resolved, "index.html")
    ];
    let file = candidates.find(isFile);
    const accept = request.headers.accept ?? "";
    if (!file && accept.includes("text/html") && isFile(index)) file = index;
    if (!file) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }
    const extension = path8.extname(file).toLowerCase();
    response.writeHead(200, {
      "content-type": MIME[extension] ?? "application/octet-stream",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(file).on("error", () => {
      response.destroy();
    }).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  if (!port) {
    server.close();
    throw new Error("Failed to start the local static server.");
  }
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => {
      server.close(() => resolve());
    })
  };
}
function lineAt2(text, offset) {
  let line = 1;
  for (let index = 0; index < offset && index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) line += 1;
  }
  return line;
}
function makePatch(fixes, root) {
  const chunks = [];
  for (const fix of fixes) {
    const relative = toPosix(path8.relative(root, fix.file));
    const oldLines = fix.expectedText.split(/\r\n|\r|\n/);
    const newLines = fix.replacement.split(/\r\n|\r|\n/);
    const header = `--- a/${relative}
+++ b/${relative}
@@ -${fix.startLine},${oldLines.length} +${fix.startLine},${newLines.length} @@
`;
    const removed = oldLines.map((line) => `-${line}`).join("\n");
    const added = newLines.map((line) => `+${line}`).join("\n");
    chunks.push(`${header}${removed}
${added}`);
  }
  return chunks.length > 0 ? `${chunks.join("\n")}
` : "";
}
function buildFixPreview(options) {
  const { root, findings } = options;
  const selected = options.findingIds?.length ? findings.filter((finding) => options.findingIds?.includes(finding.id)) : findings;
  const fixes = [];
  const skipped = [];
  const rangesByFile = /* @__PURE__ */ new Map();
  for (const finding of selected) {
    if (!finding.fix) {
      if (options.findingIds?.includes(finding.id)) {
        skipped.push({ findingId: finding.id, reason: "No automatic safe fix is available for this finding." });
      }
      continue;
    }
    if (!finding.fix.safe) {
      skipped.push({ findingId: finding.id, reason: "The available fix is marked for manual review." });
      continue;
    }
    const file = finding.location.file;
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      skipped.push({ findingId: finding.id, reason: "Source file is no longer readable." });
      continue;
    }
    const fix = finding.fix;
    if (content.slice(fix.startOffset, fix.endOffset) !== fix.expectedText) {
      skipped.push({
        findingId: finding.id,
        reason: "File content changed since analysis; refusing to apply a stale edit."
      });
      continue;
    }
    const ranges = rangesByFile.get(file) ?? [];
    if (ranges.some((range) => fix.startOffset < range.end && fix.endOffset > range.start)) {
      skipped.push({ findingId: finding.id, reason: "The edit overlaps another planned fix." });
      continue;
    }
    ranges.push({ start: fix.startOffset, end: fix.endOffset });
    rangesByFile.set(file, ranges);
    fixes.push({
      findingId: finding.id,
      file,
      relativeFile: relativePosix(root, file),
      startOffset: fix.startOffset,
      endOffset: fix.endOffset,
      replacement: fix.replacement ?? "",
      expectedText: fix.expectedText,
      description: fix.description,
      startLine: lineAt2(content, fix.startOffset),
      endLine: lineAt2(content, fix.endOffset)
    });
  }
  fixes.sort((a, b) => a.relativeFile === b.relativeFile ? a.startOffset - b.startOffset : a.relativeFile.localeCompare(b.relativeFile));
  const patch = makePatch(fixes, root);
  let patchPath;
  if (patch) {
    patchPath = path8.join(options.config.output, "autofix.patch");
    writeTextFile(patchPath, patch);
  }
  return { fixes, skipped, patch, ...patchPath ? { patchPath } : {} };
}
function applyFixPreview(options) {
  const { root, config, preview } = options;
  if (preview.fixes.length === 0) {
    return { ...preview, applied: false, changedFiles: [] };
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[^0-9A-Za-z]/g, "-");
  const backupDir = path8.join(config.output, ".autofix-backups", timestamp);
  ensureDir(backupDir);
  const files = [...new Set(preview.fixes.map((fix) => fix.file))];
  const manifestFiles = [];
  const contents = /* @__PURE__ */ new Map();
  for (const file of files) {
    const relative = relativePosix(root, file);
    const backup = path8.join(backupDir, relative);
    ensureDir(path8.dirname(backup));
    copyFileSync(file, backup);
    manifestFiles.push({ file, relativeFile: relative, backup });
    contents.set(file, readFileSync(file, "utf8"));
  }
  for (const [file, original] of contents) {
    const edits = preview.fixes.filter((fix) => fix.file === file).sort((a, b) => b.startOffset - a.startOffset);
    let updated = original;
    for (const edit of edits) {
      updated = `${updated.slice(0, edit.startOffset)}${edit.replacement}${updated.slice(edit.endOffset)}`;
    }
    writeFileSync(file, updated, "utf8");
  }
  const manifestPath = path8.join(backupDir, "manifest.json");
  writeJsonFile(manifestPath, {
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    root,
    files: manifestFiles,
    findings: preview.fixes.map((fix) => fix.findingId)
  });
  writeJsonFile(path8.join(config.output, ".autofix-latest.json"), {
    backupDir,
    manifestPath,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return {
    ...preview,
    applied: true,
    backupDir,
    changedFiles: files.map((file) => relativePosix(root, file)),
    manifestPath
  };
}
function revertLatestFix(outputDir) {
  const pointer = path8.join(outputDir, ".autofix-latest.json");
  if (!existsSync(pointer)) {
    return { reverted: false, files: [], reason: "No autofix backup pointer was found." };
  }
  try {
    const latest = JSON.parse(readFileSync(pointer, "utf8"));
    if (!latest.manifestPath || !existsSync(latest.manifestPath)) {
      return { reverted: false, files: [], reason: "The latest autofix manifest is missing." };
    }
    const manifest = JSON.parse(readFileSync(latest.manifestPath, "utf8"));
    const files = [];
    for (const entry2 of manifest.files ?? []) {
      if (!entry2.file || !entry2.backup || !existsSync(entry2.backup)) continue;
      copyFileSync(entry2.backup, entry2.file);
      files.push(entry2.file);
    }
    return {
      reverted: files.length > 0,
      files,
      ...latest.backupDir ? { backupDir: latest.backupDir } : {},
      ...files.length === 0 ? { reason: "No backup files were restored." } : {}
    };
  } catch (error) {
    return {
      reverted: false,
      files: [],
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}
function formatFixPreview(preview) {
  const lines = [];
  lines.push(`${preview.fixes.length} safe fix(es) planned${preview.skipped.length > 0 ? `, ${preview.skipped.length} skipped` : ""}.`);
  for (const fix of preview.fixes) {
    lines.push(`  ${fix.relativeFile}:${fix.startLine}  ${fix.description}`);
  }
  for (const skipped of preview.skipped) {
    lines.push(`  skipped ${skipped.findingId}: ${skipped.reason}`);
  }
  if (preview.patch) {
    lines.push("");
    lines.push(preview.patch);
  }
  return lines.join("\n");
}
var ORDER = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
};
function createLogger(level = "info") {
  const logger = {
    level,
    error(message) {
      if (ORDER[logger.level] >= ORDER.error) process.stderr.write(`${pc.red("error")} ${message}
`);
    },
    warn(message) {
      if (ORDER[logger.level] >= ORDER.warn) process.stderr.write(`${pc.yellow("warn")} ${message}
`);
    },
    info(message) {
      if (ORDER[logger.level] >= ORDER.info) process.stderr.write(`${message}
`);
    },
    debug(message) {
      if (ORDER[logger.level] >= ORDER.debug) process.stderr.write(`${pc.gray(message)}
`);
    },
    raw(message) {
      process.stderr.write(`${message}
`);
    }
  };
  return logger;
}

// src/cli/index.ts
var program = new Command();
var abortController = new AbortController();
var abortAnnounced = false;
program.name("code-usage-map").description("Discover unused JavaScript and CSS, trace every finding to its original source, optimize every route.").version(TOOL_VERSION, "-v, --version").option("--config <file>", "configuration file").option("--cwd <directory>", "working directory").showHelpAfterError();
function globalOptions() {
  return program.opts();
}
function resolveRoot(directory) {
  const cwd = globalOptions().cwd ? path8.resolve(globalOptions().cwd ?? ".") : process.cwd();
  return path8.resolve(cwd, directory ?? ".");
}
function resolveConfigPath(root) {
  const configured = globalOptions().config;
  if (!configured) return void 0;
  const resolved = path8.isAbsolute(configured) ? configured : path8.resolve(root, configured);
  if (!existsSync(resolved)) {
    throw new Error(`Config file not found: ${resolved}`);
  }
  return resolved;
}
async function loadCommandConfig(root, options = {}) {
  const loaded = await loadResolvedConfig(root, resolveConfigPath(root));
  if (loaded.issues.length > 0) {
    throw new Error(loaded.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  }
  const logger = createLogger(loaded.config.logging.level);
  for (const warning of loaded.warnings) {
    if (warning.startsWith("Using config:")) continue;
    logger.warn(warning);
  }
  if (!options.silent && loaded.configFile) {
    logger.info(pc.gray(`Config: ${toPosix(path8.relative(root, loaded.configFile))}`));
  }
  return { config: loaded.config, ...loaded.configFile ? { configFile: loaded.configFile } : {}, logger };
}
function splitPaths(value) {
  return value ? splitComma(value) : [];
}
function parseRoutes(value) {
  return splitPaths(value).map((item) => item.startsWith("http") ? { url: item } : { path: item });
}
function applyCliOverrides(config, root, options) {
  const source = splitPaths(typeof options.source === "string" ? options.source : void 0);
  if (source.length > 0) config.source = source.map((item) => path8.resolve(root, item));
  if (typeof options.output === "string" && options.output.trim()) {
    config.output = path8.resolve(root, options.output);
  }
  if (typeof options.mode === "string" && (options.mode === "application" || options.mode === "library")) {
    config.mode = options.mode;
  }
  const routes = parseRoutes(typeof options.routes === "string" ? options.routes : void 0);
  if (routes.length > 0) config.routes = routes;
  if (options.js === false) config.analysis.javascript = false;
  if (options.ts === false) config.analysis.typescript = false;
  if (options.css === false) config.analysis.css = false;
  if (options.deps === false) config.analysis.dependencies = false;
  if (options.bundles === false) config.analysis.bundles = false;
  if (options.runtime === false) config.analysis.runtime = false;
  if (options.sourceMaps === false) {
    config.analysis.sourceMaps = false;
    config.sourceMaps.enabled = false;
  }
  if (options.recommendations === false) config.analysis.recommendations = false;
  if (options.cache === false) config.cache.enabled = false;
  if (options.quiet === true) config.logging.level = "silent";
  else if (options.verbose === true) config.logging.level = "debug";
}
function progressLogger(_logger, enabled) {
  if (!enabled) return void 0;
  return (event) => {
    process.stdout.write(`${pc.gray(`\u2022 ${event.message}`)}
`);
  };
}
function openReport(file) {
  if (!file || !existsSync(file)) return;
  try {
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", file], { detached: true, stdio: "ignore" }).unref();
    } else if (process.platform === "darwin") {
      spawn("open", [file], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [file], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
  }
}
function writeRuntimeSummary(message) {
  process.stderr.write(`${pc.gray("\u2022")} ${message}
`);
}
function syncLoggingLevel(logger, config) {
  logger.level = config.logging.level;
}
function packageManagerCommand(root) {
  try {
    const pkg = JSON.parse(readFileSync(path8.join(root, "package.json"), "utf8"));
    const declared = pkg.packageManager?.split("@")[0];
    if (declared) return declared;
  } catch {
  }
  if (existsSync(path8.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path8.join(root, "yarn.lock"))) return "yarn";
  if (existsSync(path8.join(root, "bun.lockb")) || existsSync(path8.join(root, "bun.lock"))) return "bun";
  return "npm";
}
function runProjectBuild(root, config, logger, jsonMode) {
  let command = config.build.command;
  if (!command) {
    let hasBuildScript = false;
    try {
      const pkg = JSON.parse(readFileSync(path8.join(root, "package.json"), "utf8"));
      hasBuildScript = Boolean(pkg.scripts?.build);
    } catch {
      hasBuildScript = false;
    }
    if (!hasBuildScript) {
      throw new Error("--build was requested but no build.command or package.json build script exists.");
    }
    command = `${packageManagerCommand(root)} run build`;
  }
  logger.info(pc.gray(`Running production build: ${command}`));
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    encoding: "utf8",
    timeout: 20 * 6e4,
    env: process.env
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (output) {
    if (jsonMode) process.stderr.write(`${output}
`);
    else process.stdout.write(`${output}
`);
  }
  if (result.status !== 0) {
    throw new Error(
      `Build command failed with exit code ${result.status ?? "unknown"}${output ? `:
${output.slice(-4e3)}` : ""}`
    );
  }
}
function printArtifacts(paths) {
  if (paths.jsonPath) process.stdout.write(`${pc.green("JSON")}  ${paths.jsonPath}
`);
  if (paths.htmlPath) process.stdout.write(`${pc.green("HTML")}  ${paths.htmlPath}
`);
  if (paths.patchPath) process.stdout.write(`${pc.green("PATCH")} ${paths.patchPath}
`);
}
function extractReportFromFile(file) {
  const raw = readFileSync(file, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !parsed.summary || !Array.isArray(parsed.findings)) {
    throw new Error(`Not a Code Usage Map report: ${file}`);
  }
  return parsed;
}
function thresholdOverrides(config, options) {
  const next = { ...config };
  const numeric = (value) => {
    if (value === void 0 || value === null || value === "") return void 0;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : void 0;
  };
  const mappings = [
    ["maxTotalBundleBytes", options.maxTotalBundleBytes],
    ["maxBundleGrowthBytes", options.maxBundleGrowthBytes],
    ["maxBundleGrowthPercent", options.maxBundleGrowthPercent],
    ["maxCssGrowthBytes", options.maxCssGrowthBytes],
    ["maxCssGrowthPercent", options.maxCssGrowthPercent],
    ["maxNewFindings", options.maxNewFindings],
    ["maxRouteGrowthPercent", options.maxRouteGrowthPercent]
  ];
  for (const [key, value] of mappings) {
    const parsed = numeric(value);
    if (parsed !== void 0) {
      next[key] = parsed;
    }
  }
  if (typeof options.failOn === "string" && options.failOn.trim()) {
    next.failOn = splitComma(options.failOn);
  }
  return next;
}
function routeFromHtml2(relative) {
  const without = relative.replace(/\.html?$/i, "");
  if (without === "index" || without.endsWith("/index")) {
    return `/${without.replace(/\/?index$/, "")}`.replace(/\/+/g, "/");
  }
  return `/${without}`.replace(/\/+/g, "/");
}
async function discoverServerRoutes(directory) {
  const files = await fg("**/*.html", {
    cwd: directory,
    onlyFiles: true,
    ignore: ["**/404.html", "**/500.html"]
  });
  const routes = /* @__PURE__ */ new Set();
  for (const file of files) {
    const route = routeFromHtml2(toPosix(file));
    if (route !== "/") routes.add(route);
  }
  routes.add("/");
  return [...routes].sort().map((route) => ({ path: route }));
}
function chooseServeDirectory(config, root) {
  const candidates = [
    ...config.build.dir ? Array.isArray(config.build.dir) ? config.build.dir : [config.build.dir] : [],
    path8.join(root, "dist"),
    path8.join(root, "build"),
    path8.join(root, "out"),
    path8.join(root, "public")
  ];
  for (const candidate of candidates) {
    const dir = path8.resolve(root, candidate);
    if (!existsSync(dir)) continue;
    try {
      if (statSync(dir).isDirectory() && existsSync(path8.join(dir, "index.html"))) return dir;
    } catch {
    }
  }
  return void 0;
}
async function scanCommand(directory, options) {
  const root = resolveRoot(directory);
  const { config, configFile, logger } = await loadCommandConfig(root);
  applyCliOverrides(config, root, options);
  syncLoggingLevel(logger, config);
  const jsonMode = options.json === true;
  if (options.build === true) runProjectBuild(root, config, logger, jsonMode);
  const progress = progressLogger(logger, !jsonMode && config.logging.level !== "silent");
  const context = await runFullAnalysis({
    root,
    config,
    ...configFile ? { configPath: configFile } : {},
    ...options.refresh === true ? { refresh: true } : {},
    signal: abortController.signal,
    ...progress ? { onProgress: progress } : {},
    command: "scan"
  });
  const written = writeReports(context.report, {
    ...options.jsonFile === false ? { json: false } : {},
    ...options.html === false ? { html: false } : {}
  });
  let baselinePath = typeof options.baseline === "string" ? path8.resolve(root, options.baseline) : config.baseline;
  if (typeof options.saveBaseline === "string") {
    baselinePath = writeBaseline(context.report, options.saveBaseline);
    logger.info(`Saved baseline: ${baselinePath}`);
  }
  if (!jsonMode && options.console !== false && config.reporters.console) {
    process.stdout.write(renderConsoleReport(context.report));
    printArtifacts(written);
    if (written.htmlPath) process.stdout.write(pc.gray(`Open the report: ${written.htmlPath}
`));
  }
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(context.report, null, 2)}
`);
  }
  if (options.open === true) openReport(written.htmlPath);
  if (options.ci === true || options.baseline !== void 0 && baselinePath) {
    if (baselinePath && existsSync(baselinePath)) {
      const baseline = extractReportFromFile(baselinePath);
      const comparison = compareReports(baseline, context.report, config.thresholds, baselinePath);
      if (!jsonMode) {
        process.stdout.write(`
${formatComparison(comparison)}
`);
      } else if (comparison.regressions.length > 0) {
        process.stderr.write(`${formatComparison(comparison)}
`);
      }
      if (!comparison.passed) process.exitCode = 1;
    } else if (config.thresholds.maxTotalBundleBytes !== void 0) {
      if (context.report.bundles.totals.rawBytes > config.thresholds.maxTotalBundleBytes) {
        logger.error(
          `Bundle size ${formatBytes(context.report.bundles.totals.rawBytes)} exceeds the limit ${formatBytes(config.thresholds.maxTotalBundleBytes)}.`
        );
        process.exitCode = 1;
      }
    } else if (options.ci === true && !jsonMode) {
      logger.warn("CI mode has no baseline; only absolute bundle-size limits can fail. Use --save-baseline and compare for regressions.");
    }
  }
}
async function analyzeCommand(directory, options) {
  const root = resolveRoot(directory);
  const { config, logger } = await loadCommandConfig(root);
  applyCliOverrides(config, root, options);
  syncLoggingLevel(logger, config);
  if (!config.runtime.enabled) throw new Error("Runtime collection is disabled in configuration.");
  const jsonMode = options.json === true;
  const progress = progressLogger(logger, !jsonMode && config.logging.level !== "silent");
  if (options.clean === true) {
    const removed = clearRuntimeSessions(root);
    logger.info(`Removed ${removed} previous runtime session(s).`);
  }
  if (options.build === true) {
    runProjectBuild(root, config, logger, jsonMode);
    if (typeof options.url === "string") {
      logger.warn("--build completed, but --url points at an already-running server. The browser will not automatically serve the new build.");
    }
  }
  let baseUrl = typeof options.url === "string" ? options.url : config.runtime.baseUrl;
  let server;
  let discoveredRoutes = [];
  if (!baseUrl) {
    const serveOption = options.serve;
    const serveDirectory = typeof serveOption === "string" ? path8.resolve(root, serveOption) : serveOption === true ? chooseServeDirectory(config, root) : chooseServeDirectory(config, root);
    if (!serveDirectory || !existsSync(path8.join(serveDirectory, "index.html"))) {
      throw new Error(
        "No runtime URL was provided and no servable build directory with index.html was found. Pass --url http://localhost:5173 or --serve <dir>."
      );
    }
    server = await startStaticServer(serveDirectory);
    baseUrl = server.baseUrl;
    logger.info(`Serving ${serveDirectory} at ${baseUrl}`);
    discoveredRoutes = await discoverServerRoutes(serveDirectory);
    if (discoveredRoutes.length > 1) logger.info(`Discovered ${discoveredRoutes.length} HTML page route(s).`);
  }
  const cliRoutes = parseRoutes(typeof options.routes === "string" ? options.routes : void 0);
  const routes = cliRoutes.length > 0 ? cliRoutes : config.routes.length > 0 ? config.routes : discoveredRoutes;
  const interactiveDefault = !routes.length && !options.headless && !jsonMode && Boolean(stdin.isTTY) && options.interactive !== false;
  const interactive = options.interactive === true || interactiveDefault;
  const browser = typeof options.browser === "string" && ["chromium", "firefox", "webkit"].includes(options.browser) ? options.browser : config.runtime.browser;
  let collectResult;
  try {
    collectResult = await collectRuntime({
      root,
      config,
      options: {
        ...baseUrl ? { baseUrl } : {},
        ...routes.length > 0 ? { routes: routes.length > 0 ? routes : [{ path: "/" }] } : {},
        browser,
        headless: options.headed === true ? false : interactive ? false : options.headless === true ? true : config.runtime.headless,
        interactive,
        signal: abortController.signal,
        ...progress ? { onProgress: progress } : {}
      },
      persist: true
    });
  } finally {
    await server?.close();
  }
  if (!jsonMode && config.logging.level !== "silent") {
    writeRuntimeSummary(
      `Collected ${collectResult.sessions.length} session(s), ${collectResult.result.routes.length} route(s), base ${collectResult.result.baseUrl}.`
    );
  }
  if (options.report === false) {
    if (jsonMode) process.stdout.write(`${JSON.stringify(collectResult.result, null, 2)}
`);
    return;
  }
  const analysis = await runFullAnalysis({
    root,
    config,
    ...progress ? { onProgress: progress } : {},
    signal: abortController.signal,
    command: "analyze",
    runtimeSessions: collectResult.sessions
  });
  const written = writeReports(analysis.report, {
    ...options.jsonFile === false ? { json: false } : {},
    ...options.html === false ? { html: false } : {}
  });
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(analysis.report, null, 2)}
`);
  } else if (config.reporters.console) {
    process.stdout.write(renderConsoleReport(analysis.report));
    printArtifacts(written);
  }
  if (options.open === true) openReport(written.htmlPath);
}
async function reportCommand(directory, options) {
  const root = resolveRoot(directory);
  const { config, configFile, logger } = await loadCommandConfig(root);
  applyCliOverrides(config, root, options);
  syncLoggingLevel(logger, config);
  const jsonMode = options.json === true;
  const progress = progressLogger(logger, !jsonMode && config.logging.level !== "silent");
  if (options.build === true) runProjectBuild(root, config, logger, jsonMode);
  let report;
  const from = typeof options.from === "string" ? path8.resolve(root, options.from) : void 0;
  if (from) {
    report = extractReportFromFile(from);
  } else {
    const context = await runFullAnalysis({
      root,
      config,
      ...configFile ? { configPath: configFile } : {},
      ...options.refresh === true ? { refresh: true } : {},
      ...progress ? { onProgress: progress } : {},
      command: "report"
    });
    report = context.report;
  }
  const written = writeReports(report, {
    ...options.jsonFile === false ? { json: false } : {},
    ...options.html === false ? { html: false } : {}
  });
  if (jsonMode) process.stdout.write(`${JSON.stringify(report, null, 2)}
`);
  else if (config.reporters.console) {
    process.stdout.write(renderConsoleReport(report));
    printArtifacts(written);
  }
  if (options.open === true) openReport(written.htmlPath);
}
async function compareCommand(directory, options) {
  const root = resolveRoot(directory);
  const { config, logger } = await loadCommandConfig(root);
  applyCliOverrides(config, root, options);
  syncLoggingLevel(logger, config);
  const baselinePath = typeof options.baseline === "string" ? path8.resolve(root, options.baseline) : config.baseline;
  if (!baselinePath) {
    throw new Error("compare needs --baseline <report.json> or a baseline path in configuration.");
  }
  if (!existsSync(baselinePath)) throw new Error(`Baseline report not found: ${baselinePath}`);
  const baseline = extractReportFromFile(baselinePath);
  let current;
  const currentPath = typeof options.current === "string" ? path8.resolve(root, options.current) : void 0;
  if (currentPath) current = extractReportFromFile(currentPath);
  else {
    if (options.build === true) runProjectBuild(root, config, logger, options.json === true);
    const context = await runFullAnalysis({
      root,
      config,
      ...options.refresh === true ? { refresh: true } : {},
      signal: abortController.signal,
      ...options.json === true || config.logging.level === "silent" ? {} : { onProgress: progressLogger(logger, true) },
      command: "compare"
    });
    current = context.report;
  }
  const thresholds = thresholdOverrides(config.thresholds, options);
  const comparison = compareReports(baseline, current, thresholds, baselinePath, currentPath);
  if (options.json === true) process.stdout.write(`${JSON.stringify(comparison, null, 2)}
`);
  else process.stdout.write(`${formatComparison(comparison)}
`);
  if (!comparison.passed) process.exitCode = 1;
}
async function fixCommand(directory, options) {
  const root = resolveRoot(directory);
  const { config, logger } = await loadCommandConfig(root);
  applyCliOverrides(config, root, options);
  syncLoggingLevel(logger, config);
  if (options.revert === true) {
    const reverted = revertLatestFix(config.output);
    if (options.json === true) process.stdout.write(`${JSON.stringify(reverted, null, 2)}
`);
    else if (reverted.reverted) {
      process.stdout.write(`Restored ${reverted.files.length} file(s) from ${reverted.backupDir ?? "backup"}.
`);
    } else {
      logger.warn(reverted.reason ?? "Nothing to revert.");
    }
    return;
  }
  const reportPath = typeof options.report === "string" ? path8.resolve(root, options.report) : path8.join(config.output, "code-usage-map.json");
  if (!existsSync(reportPath)) {
    throw new Error(`No report found at ${reportPath}. Run "code-usage-map scan" first or pass --report.`);
  }
  const report = extractReportFromFile(reportPath);
  const findingIds = splitPaths(typeof options.finding === "string" ? options.finding : void 0);
  const selected = findingIds.length > 0 ? findingIds : void 0;
  const preview = buildFixPreview({
    root,
    config,
    findings: report.findings,
    ...selected ? { findingIds: selected } : {}});
  const apply = options.apply === true;
  const result = apply ? applyFixPreview({ root, config, preview }) : { ...preview, applied: false, changedFiles: [] };
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  } else {
    process.stdout.write(`${formatFixPreview(preview)}
`);
    if (apply && result.applied) {
      process.stdout.write(
        `
Applied ${result.fixes.length} fix(es) to ${result.changedFiles.length} file(s). Backups: ${result.backupDir}
`
      );
      process.stdout.write("Revert with: npx @codewithrajat/code-usage-map fix --revert\n");
    } else if (apply) {
      process.stdout.write("\nNo safe fixes were applied.\n");
    } else {
      process.stdout.write("\nDry run only. Re-run with --apply to write these edits.\n");
    }
    if (result.patchPath) process.stdout.write(pc.green(`Patch: ${result.patchPath}
`));
  }
}
async function initCommand(directory, options) {
  const root = resolveRoot(directory);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Directory does not exist: ${root}`);
  }
  const explicitConfig = globalOptions().config;
  const configPath = explicitConfig ? path8.resolve(root, explicitConfig) : path8.join(root, "code-usage-map.config.ts");
  if (existsSync(configPath) && options.force !== true) {
    throw new Error(`Configuration already exists: ${configPath}. Use --force to overwrite.`);
  }
  const source = existsSync(path8.join(root, "src")) ? "./src" : existsSync(path8.join(root, "app")) ? "./app" : ".";
  const configObject = {
    source,
    output: "./code-usage-map-report",
    analysis: {
      javascript: true,
      typescript: true,
      css: true,
      runtime: true,
      sourceMaps: true
    },
    routes: []
  };
  const content = `import type { CodeUsageMapConfig } from '@codewithrajat/code-usage-map';

const config: CodeUsageMapConfig = ${JSON.stringify(configObject, null, 2)};
// Add routes that should be exercised by runtime analysis, for example:
// routes: ['/', '/dashboard', '/settings'],

export default config;
`;
  writeTextFile(configPath, content);
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify({ configPath, config: configObject }, null, 2)}
`);
    return;
  }
  process.stdout.write(`${pc.green("Created")} ${configPath}

`);
  process.stdout.write("Next steps:\n");
  process.stdout.write(`  1. ${pc.cyan("npx @codewithrajat/code-usage-map scan")}
`);
  process.stdout.write(`  2. Start the app and run ${pc.cyan("npx @codewithrajat/code-usage-map analyze --url http://localhost:5173")}
`);
  process.stdout.write(`  3. Open the generated HTML report; no server or upload is required.

`);
  process.stdout.write(pc.gray("Add `.code-usage-map/` and `code-usage-map-report/` to .gitignore if desired.\n"));
}
program.command("init [directory]").description("Create a typed configuration file using detected defaults.").option("--force", "overwrite an existing config").option("--json", "print machine-readable output").action(async (directory, options) => {
  await initCommand(directory, options);
});
program.command("scan [directory]").description("Run static JavaScript/TypeScript, CSS, dependency and bundle analysis.").option("--source <paths>", "comma-separated source paths").option("--output <dir>", "report output directory").option("--mode <mode>", "application or library").option("--routes <paths>", "comma-separated route paths/URLs to include in the report").option("--no-js", "disable JavaScript findings").option("--no-ts", "disable TypeScript findings").option("--no-css", "disable CSS analysis").option("--no-deps", "disable dependency analysis").option("--no-bundles", "disable bundle analysis").option("--no-runtime", "do not merge stored runtime sessions").option("--no-source-maps", "disable source-map decoding and mapping").option("--no-recommendations", "disable recommendations").option("--no-cache", "disable analysis cache").option("--refresh", "ignore cached analysis").option("--build", "run the production build before scanning").option("--json", "print the full report JSON to stdout").option("--no-json-file", "do not write code-usage-map.json").option("--no-html", "do not write the HTML report").option("--no-console", "suppress the pretty console report").option("--open", "open the HTML report").option("--save-baseline <file>", "write this report as a comparison baseline").option("--baseline <file>", "compare against a baseline after scanning").option("--ci", "use CI thresholds and exit non-zero on failure").option("--quiet", "suppress progress and non-report logs").option("--verbose", "show debug logs").action(async (directory, options) => {
  await scanCommand(directory, options);
});
program.command("analyze [directory]").description("Collect actual JavaScript/CSS usage in a browser across routes.").option("--url <url>", "running application URL").option("--routes <paths>", "comma-separated route paths/URLs").option("--browser <name>", "chromium, firefox or webkit").option("--headless", "force automated headless collection").option("--headed", "show the automated browser window").option("--interactive", "open a headed browser and collect until you press Enter").option("--serve [dir]", "serve a static build directory when --url is omitted").option("--build", "run the production build before serving/collecting").option("--clean", "delete previous runtime sessions before collecting").option("--no-report", "collect sessions without regenerating the report").option("--json", "print the resulting report JSON to stdout").option("--no-json-file", "do not write code-usage-map.json").option("--no-html", "do not write the HTML report").option("--open", "open the HTML report").option("--quiet", "suppress progress logs").option("--verbose", "show debug logs").action(async (directory, options) => {
  await analyzeCommand(directory, options);
});
program.command("report [directory]").description("Regenerate console/JSON/HTML reports from cached analysis and runtime sessions.").option("--from <file>", "render from an existing report JSON").option("--refresh", "ignore cached analysis").option("--build", "run the production build before analysis").option("--json", "print report JSON to stdout").option("--no-json-file", "do not write code-usage-map.json").option("--no-html", "do not write the HTML report").option("--open", "open the HTML report").option("--quiet", "suppress progress logs").option("--verbose", "show debug logs").action(async (directory, options) => {
  await reportCommand(directory, options);
});
program.command("compare [directory]").description("Compare the current analysis with a baseline and evaluate CI thresholds.").option("--baseline <file>", "baseline report JSON").option("--current <file>", "current report JSON (defaults to a fresh analysis)").option("--refresh", "ignore cached analysis for the current report").option("--build", "run the production build before current analysis").option("--max-total-bundle-bytes <bytes>", "fail when total raw bundle size exceeds this limit").option("--max-bundle-growth-bytes <bytes>", "allowed raw bundle growth").option("--max-bundle-growth-percent <percent>", "allowed raw bundle growth percent").option("--max-css-growth-bytes <bytes>", "allowed CSS growth").option("--max-css-growth-percent <percent>", "allowed CSS growth percent").option("--max-new-findings <count>", "allowed new qualifying findings").option("--max-route-growth-percent <percent>", "allowed per-route size growth").option("--fail-on <categories>", "comma-separated finding categories counted as new").option("--json", "print comparison JSON").option("--quiet", "suppress progress logs").action(async (directory, options) => {
  await compareCommand(directory, options);
});
program.command("fix [directory]").description("Preview or apply safe autofixes. CSS and behavioral changes are never applied automatically.").option("--report <file>", "report JSON containing fix metadata").option("--finding <ids>", "comma-separated finding IDs").option("--all", "select all safe fixes").option("--apply", "write the changes (default is dry run)").option("--revert", "restore the most recent autofix backup").option("--json", "print machine-readable output").action(async (directory, options) => {
  await fixCommand(directory, options);
});
program.action(() => {
  program.help();
});
process.once("SIGINT", () => {
  if (!abortAnnounced) {
    abortAnnounced = true;
    process.stderr.write(`
${pc.yellow("Cancelling\u2026")}
`);
    abortController.abort(new Error("Interrupted"));
    setTimeout(() => process.exit(130), 2e3).unref();
  }
});
async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (abortController.signal.aborted) {
      process.exitCode = 130;
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${pc.red("error")} ${message}
`);
    if (process.env.CODE_USAGE_MAP_DEBUG === "1" && error instanceof Error && error.stack) {
      process.stderr.write(`${error.stack}
`);
    }
    process.exitCode = 2;
  }
}
void main();
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map