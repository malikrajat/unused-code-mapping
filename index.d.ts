/**
 * Public types for Code Usage Map.
 *
 * The report schema is intentionally serializable and versioned. Every field
 * is populated by a real analysis phase; optional fields are omitted when the
 * corresponding evidence is unavailable.
 */
declare const REPORT_SCHEMA_VERSION: "1.0.0";
declare const TOOL_NAME: "@codewithrajat/code-usage-map";
type Confidence = 'high' | 'medium' | 'low';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AnalysisStatus = 'confirmed-unused' | 'potentially-unused' | 'not-observed' | 'executed' | 'dynamically-referenced' | 'unknown';
type AnalysisMode = 'application' | 'library';
type SourceFileType = 'js' | 'jsx' | 'mjs' | 'cjs' | 'ts' | 'tsx' | 'mts' | 'cts' | 'css' | 'scss' | 'sass' | 'less' | 'html' | 'vue' | 'svelte' | 'astro' | 'json' | 'other';
interface RouteInputObject {
    /** Stable display name. Defaults to the path or URL pathname. */
    name?: string;
    /** Application path such as `/dashboard`. */
    path?: string;
    /** Absolute or base-relative URL. Takes precedence over `path`. */
    url?: string;
}
type RouteInput = string | RouteInputObject;
interface AnalysisToggles {
    javascript: boolean;
    typescript: boolean;
    css: boolean;
    dependencies: boolean;
    bundles: boolean;
    sourceMaps: boolean;
    runtime: boolean;
    duplicates: boolean;
    unreachableCode: boolean;
    recommendations: boolean;
}
type RuntimeActionType = 'click' | 'hover' | 'fill' | 'press' | 'waitForSelector' | 'wait' | 'select';
interface RuntimeAction {
    type: RuntimeActionType;
    selector?: string;
    value?: string;
    key?: string;
    /** Milliseconds for `wait`, or settle delay for other actions. */
    ms?: number;
    timeoutMs?: number;
}
interface RuntimeScenario {
    /** Route identifier (path or name) the actions belong to. */
    route: string;
    actions: RuntimeAction[];
    /** Whether failing actions abort the run. Defaults to false. */
    strict?: boolean;
}
interface RuntimeConfig {
    enabled: boolean;
    /** Required for browser collection unless the CLI starts a static server. */
    baseUrl?: string;
    routes: RouteInput[];
    browser: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
    timeoutMs: number;
    /** Wait after navigation / action before taking a snapshot. */
    settleMs: number;
    waitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
    /**
     * `auto` follows same-origin links when possible to preserve SPA state, and
     * falls back to full navigation. `goto` always performs a full navigation.
     */
    navigation: 'auto' | 'goto';
    collectCoverage: boolean;
    collectCss: boolean;
    collectNetwork: boolean;
    interactive: boolean;
    snapshotIntervalMs: number;
    viewport: {
        width: number;
        height: number;
    };
    scenarios: RuntimeScenario[];
    storageState?: string;
    ignoreHTTPSErrors: boolean;
}
interface BuildConfig {
    /** Build output directories. Auto-detected when omitted. */
    dir?: string | string[];
    /** Explicit Vite/Next/Code Usage Map manifest path. */
    manifest?: string;
    /**
     * Optional build command used by CLI `--build`. It is never executed unless
     * that flag is supplied. Defaults to the package.json build script.
     */
    command?: string;
}
interface CssConfig {
    /** Class/id/selector patterns that must never be reported as unused. */
    safelist: string[];
    /** Regular expression sources evaluated against selectors. Invalid entries warn. */
    safelistPatterns: string[];
    /** Advisory specificity score threshold. */
    specificityThreshold: number;
    checkCustomProperties: boolean;
    /** Additionally scan HTML/Vue/Svelte/Astro templates for classes and ids. */
    scanTemplates: boolean;
    /** Detect declarations overridden later in the same selector/cascade context. */
    analyzeOverriddenDeclarations: boolean;
}
interface SourceMapConfig {
    enabled: boolean;
    /** Upper bound of mappings decoded per bundle file (protects large builds). */
    maxMappingsPerFile: number;
}
interface ThresholdConfig {
    maxTotalBundleBytes?: number;
    maxBundleGrowthBytes?: number;
    maxBundleGrowthPercent?: number;
    maxCssGrowthBytes?: number;
    maxCssGrowthPercent?: number;
    maxNewFindings?: number;
    maxRouteGrowthPercent?: number;
    /** Finding categories eligible for `maxNewFindings`. Defaults to confirmed unused. */
    failOn?: FindingCategory[];
}
interface ReporterConfig {
    console: boolean;
    json: boolean;
    html: boolean;
}
interface CacheConfig {
    enabled: boolean;
    dir?: string;
}
interface LoggingConfig {
    level: 'silent' | 'error' | 'warn' | 'info' | 'debug';
}
interface CodeUsageMapConfig {
    /** Source directory or directories. Auto-detected when omitted. */
    source?: string | string[];
    /** Extra include globs, relative to the project root. */
    include?: string[];
    /** Exclude globs merged with safe defaults. */
    exclude?: string[];
    /** Report output directory. */
    output?: string;
    mode?: AnalysisMode;
    /** Additional entry points, relative to the project root. */
    entryPoints?: string[];
    routes?: RouteInput[];
    tsconfig?: string;
    analysis?: Partial<AnalysisToggles>;
    build?: BuildConfig;
    css?: Partial<CssConfig>;
    runtime?: Partial<RuntimeConfig>;
    sourceMaps?: Partial<SourceMapConfig>;
    thresholds?: ThresholdConfig;
    reporters?: Partial<ReporterConfig>;
    cache?: Partial<CacheConfig>;
    /** Baseline report used by `compare` when no file is passed. */
    baseline?: string;
    logging?: Partial<LoggingConfig>;
}
interface ResolvedCodeUsageMapConfig {
    root: string;
    source: string[];
    include: string[];
    exclude: string[];
    output: string;
    mode: AnalysisMode;
    entryPoints: string[];
    routes: RouteInput[];
    tsconfig?: string;
    analysis: AnalysisToggles;
    build: BuildConfig;
    css: CssConfig;
    runtime: RuntimeConfig;
    sourceMaps: SourceMapConfig;
    thresholds: ThresholdConfig;
    reporters: ReporterConfig;
    cache: CacheConfig;
    baseline?: string;
    logging: LoggingConfig;
}
type FindingCategory = 'unused-import' | 'unused-export' | 'unused-variable' | 'unused-function' | 'unused-class' | 'unused-class-method' | 'unused-type' | 'unused-enum-member' | 'unused-type-parameter' | 'unused-decorator' | 'unused-event-handler' | 'unreachable-code' | 'unused-type-only-import' | 'circular-dependency' | 'duplicate-code' | 'unused-css-selector' | 'unused-css-declaration' | 'duplicate-css-selector' | 'duplicate-css-rule' | 'unused-css-custom-property' | 'unused-stylesheet' | 'css-specificity' | 'unused-dependency' | 'duplicate-dependency' | 'heavy-dependency' | 'unused-module' | 'unused-bundle-code' | 'route-exclusive-module' | 'code-splitting-opportunity' | 'polyfill-included' | 'tree-shaking-opportunity';
type SymbolKind = 'function' | 'class' | 'method' | 'property' | 'variable' | 'constant' | 'interface' | 'type' | 'enum' | 'enum-member' | 'import' | 'export' | 'type-parameter' | 'decorator' | 'event-handler' | 'css-selector' | 'css-property' | 'css-rule' | 'module' | 'dependency' | 'bundle' | 'unknown';
interface SourceLocation {
    /** Absolute path. */
    file: string;
    /** POSIX path relative to the project root. */
    relativeFile: string;
    /** 1-based. */
    line: number;
    /** 1-based. */
    column: number;
    endLine?: number;
    endColumn?: number;
    fileType: SourceFileType;
}
interface CodeSnippet {
    startLine: number;
    highlightLine: number;
    lines: Array<{
        line: number;
        text: string;
    }>;
    truncated?: boolean;
    /** For CSS findings: the full rule or a bounded excerpt. */
    ruleText?: string;
}
interface MappingHop {
    kind: 'bundle' | 'chunk' | 'module' | 'source' | 'symbol';
    label: string;
    file?: string;
    line?: number;
    column?: number;
}
interface FindingMapping {
    precision: 'symbol' | 'line-column' | 'line' | 'file';
    generatedFile: string;
    generatedLine: number;
    generatedColumn: number;
    originalFile: string;
    originalLine: number;
    originalColumn: number;
    chunk?: string;
    sourceMapFile?: string;
    chain: MappingHop[];
    limitation?: string;
}
interface FindingRuntimeEvidence {
    observed: boolean;
    sessions: number;
    routesObserved: string[];
    routesLoaded: string[];
    executedFunctions?: number;
    totalFunctions?: number;
    executedBytes?: number;
    totalBytes?: number;
    note?: string;
}
interface CssSpecificity {
    ids: number;
    classes: number;
    elements: number;
    score: number;
}
interface CssFindingDetails {
    selector: string;
    selectorKind: 'class' | 'id' | 'tag' | 'attribute' | 'pseudo' | 'complex' | 'keyframes' | 'custom-property' | 'stylesheet';
    declarations?: string[];
    ruleText?: string;
    stylesheet?: string;
    matchedElements?: number;
    matchedRoutes?: string[];
    staticReferences?: string[];
    dynamicRisk?: boolean;
    specificity?: CssSpecificity;
    media?: string;
    atRules?: string[];
    safelisted?: boolean;
}
interface DuplicateFindingDetails {
    groupId: string;
    occurrences: Array<{
        file: string;
        relativeFile: string;
        line: number;
        symbol?: string;
    }>;
    normalizedHash: string;
    tokenCount: number;
}
interface DependencyFindingDetails {
    packageName: string;
    dependencyType: 'dependency' | 'devDependency' | 'peerDependency' | 'optionalDependency';
    versions?: string[];
    importers?: string[];
    reason: string;
}
interface FindingSize {
    /** Bytes in original source attributable to the finding (declaration span). */
    sourceBytes?: number;
    /** Estimated removable bytes. Never guaranteed savings. */
    estimatedRemovableBytes?: number;
    /** Bytes attributed to the containing bundle module via source maps. */
    bundleAttributedBytes?: number;
    basis?: string;
}
interface Evidence {
    kind: 'static-reference' | 'no-static-reference' | 'dynamic-access' | 'runtime-match' | 'runtime-miss' | 'coverage' | 'source-map' | 'configuration' | 'parser' | 'manifest' | 'lockfile';
    description: string;
    file?: string;
    line?: number;
    detail?: string;
}
interface FindingFix {
    kind: 'remove-range' | 'replace-range';
    /** Absolute character offsets in the original file. */
    startOffset: number;
    endOffset: number;
    replacement?: string;
    expectedText: string;
    safe: boolean;
    description: string;
}
interface Finding {
    id: string;
    fingerprint: string;
    category: FindingCategory;
    status: AnalysisStatus;
    confidence: Confidence;
    severity: Severity;
    title: string;
    description: string;
    location: SourceLocation;
    symbol?: string;
    symbolKind: SymbolKind;
    parent?: string;
    mapping?: FindingMapping;
    runtime?: FindingRuntimeEvidence;
    css?: CssFindingDetails;
    duplicate?: DuplicateFindingDetails;
    dependency?: DependencyFindingDetails;
    size: FindingSize;
    evidence: Evidence[];
    snippet?: CodeSnippet;
    fix?: FindingFix;
    routeHints: string[];
    recommendationIds: string[];
    tags: string[];
}
type RecommendationCategory = 'remove-unused' | 'lazy-load' | 'code-split' | 'remove-dependency' | 'replace-dependency' | 'tree-shaking' | 'remove-css' | 'split-css' | 'route-css' | 'reduce-specificity' | 'duplicate-code' | 'investigate';
type ImplementationComplexity = 'low' | 'medium' | 'high';
type BehaviorRisk = 'low' | 'medium' | 'high';
interface Recommendation {
    id: string;
    category: RecommendationCategory;
    title: string;
    reason: string;
    action: string;
    benefits: string[];
    complexity: ImplementationComplexity;
    risk: BehaviorRisk;
    confidence: Confidence;
    findingIds: string[];
    locations: SourceLocation[];
    sizeImpact?: {
        estimatedBytes: number;
        basis: string;
        additive: boolean;
        note: string;
    };
    steps: string[];
}
interface RouteAssetUsage {
    url: string;
    bundleFile?: string;
    bytes?: number;
    executed: boolean;
    status: AnalysisStatus;
    sourceModules: string[];
}
interface RouteModuleUsage {
    sourceFile?: string;
    bundleFile?: string;
    bytes?: number;
    executed: boolean;
    /** Executed earlier in the same SPA session, before this route. */
    previouslyExecuted?: boolean;
    shared: boolean;
    status: AnalysisStatus;
    confidence: Confidence;
    symbol?: string;
}
interface RouteCssUsage {
    selector: string;
    stylesheet?: string;
    /** Source CSS file when a CSS source map resolves it. */
    sourceFile?: string;
    line?: number;
    column?: number;
    bytes?: number;
    matched: boolean;
    status: AnalysisStatus;
    confidence: Confidence;
}
interface RouteReport {
    id: string;
    path: string;
    name: string;
    url?: string;
    kind: 'spa' | 'mpa' | 'manual' | 'unknown';
    source: 'runtime' | 'static' | 'merged';
    sessionsObserved: number;
    assets: {
        js: RouteAssetUsage[];
        css: RouteAssetUsage[];
    };
    modules: RouteModuleUsage[];
    routeExclusiveModules: RouteModuleUsage[];
    sharedModules: RouteModuleUsage[];
    loadedNotExecutedModules: RouteModuleUsage[];
    cssUsage: {
        matchedSelectors: RouteCssUsage[];
        routeExclusiveSelectors: RouteCssUsage[];
        /** Selectors present in stylesheets available on this route but not matched on it. */
        unmatchedSelectors: RouteCssUsage[];
        matchedSelectorCount: number;
        unmatchedSelectorCount: number;
        unmatchedSelectorBytes: number;
        stylesheets: string[];
        bytes?: number;
    };
    coverage?: {
        executedFunctions: number;
        totalFunctions: number;
        executedBytes: number;
        totalBytes: number;
        percent: number;
    };
    notes: string[];
}
interface ModuleAttribution {
    sourceFile: string;
    packageName?: string;
    version?: string;
    bytes: number;
    mappingSegments: number;
}
interface BundleFileReport {
    id: string;
    file: string;
    relativePath: string;
    type: 'js' | 'css' | 'other';
    rawBytes: number;
    gzipBytes: number;
    brotliBytes: number;
    initial: boolean;
    routes: string[];
    sourceMapFile?: string;
    sourceMapKind?: 'external' | 'inline' | 'indexed' | 'none';
    mapped: boolean;
    mappedBytes: number;
    unmappedBytes: number;
    modules: ModuleAttribution[];
    notes: string[];
}
interface DuplicateDependencyReport {
    packageName: string;
    versions: string[];
    locations: string[];
    source: 'lockfile' | 'source-map';
}
interface HeavyDependencyReport {
    packageName: string;
    bytes: number;
    files: string[];
    gzipContributionBytes?: number;
}
interface BundleReport {
    available: boolean;
    buildDirs: string[];
    files: BundleFileReport[];
    totals: {
        rawBytes: number;
        gzipBytes: number;
        brotliBytes: number;
        jsRawBytes: number;
        cssRawBytes: number;
        initialRawBytes: number;
        lazyRawBytes: number;
    };
    initialFileIds: string[];
    lazyFileIds: string[];
    duplicateDependencies: DuplicateDependencyReport[];
    heavyDependencies: HeavyDependencyReport[];
    mappingCoverage: {
        jsFiles: number;
        mappedJsFiles: number;
        cssFiles: number;
        mappedCssFiles: number;
        mappedPercent: number;
    };
    manifestUsed?: string;
    notes: string[];
}
interface DependencyPackageReport {
    name: string;
    declaredIn: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies' | 'transitive';
    version?: string;
    importedBy: string[];
    importCount: number;
    importKinds: {
        value: number;
        typeOnly: number;
    };
    dynamicallyImported: boolean;
    usedInScripts: boolean;
    status: AnalysisStatus;
    confidence: Confidence;
    reason: string;
}
interface TypeOnlyDependencyImport {
    source: string;
    file: string;
    relativeFile: string;
    names: string[];
    packageName?: string;
}
interface DependencyReport {
    packageJson?: string;
    packageManager?: string;
    declared: number;
    packages: DependencyPackageReport[];
    unused: DependencyPackageReport[];
    unresolvedImports: string[];
    duplicateVersions: DuplicateDependencyReport[];
    typeOnlyImports: TypeOnlyDependencyImport[];
    lockfile?: string;
    notes: string[];
}
interface CssInJsSourceReport {
    file: string;
    relativeFile: string;
    line: number;
    endLine: number;
    tag: string;
    kind: 'global' | 'component';
    dynamic: boolean;
    selectors: string[];
}
interface CssReport {
    files: number;
    rules: number;
    selectors: number;
    matchedSelectors: number;
    unmatchedSelectors: number;
    dynamicRiskSelectors: number;
    stylesheetFiles: number;
    unusedStylesheetFiles: string[];
    customProperties: number;
    unusedCustomProperties: string[];
    duplicateRules: number;
    highSpecificitySelectors: number;
    modules: number;
    runtimeInjectedRules: number;
    cssInJsBlocks: number;
    cssInJsSources: CssInJsSourceReport[];
    notes: string[];
}
interface SourceMapReport {
    enabled: boolean;
    jsFiles: number;
    filesWithSourceMaps: number;
    inlineMaps: number;
    externalMaps: number;
    indexedMaps: number;
    resolvedFindings: number;
    unresolvedFindings: number;
    precision: {
        symbol: number;
        lineColumn: number;
        line: number;
        file: number;
    };
    notes: string[];
}
interface RuntimeSessionSummary {
    id: string;
    startedAt: string;
    finishedAt: string;
    baseUrl: string;
    browser: string;
    interactive: boolean;
    routes: string[];
    scripts: number;
    stylesheets: number;
    dynamicStylesheets: number;
    coverageUsed: boolean;
    networkUsed: boolean;
}
interface RuntimeSummary {
    available: boolean;
    sessions: RuntimeSessionSummary[];
    mergedSessions: number;
    routes: number;
    scriptAssets: number;
    stylesheets: number;
    dynamicStylesheets: number;
    browser?: string;
    notes: string[];
}
interface FindingCounts {
    total: number;
    confirmedUnused: number;
    potentiallyUnused: number;
    notObserved: number;
    dynamicallyReferenced: number;
    unknown: number;
    byCategory: Partial<Record<FindingCategory, number>>;
    bySeverity: Partial<Record<Severity, number>>;
    byConfidence: Partial<Record<Confidence, number>>;
}
interface ReportSummary {
    sourceFiles: number;
    javascriptFiles: number;
    typescriptFiles: number;
    cssFiles: number;
    templateFiles: number;
    totalLines: number;
    modules: number;
    symbols: number;
    buildFiles: number;
    findings: FindingCounts;
    cssSelectors: number;
    unusedCssSelectors: number;
    routes: number;
    dependencies: number;
    unusedDependencies: number;
    recommendations: number;
    bundles: {
        jsRawBytes: number;
        cssRawBytes: number;
        totalRawBytes: number;
        gzipBytes: number;
        brotliBytes: number;
    };
    estimatedCandidateBytes: {
        confirmedStatic: number;
        potentialRuntime: number;
        additive: false;
        note: string;
    };
}
interface FrameworkDetection {
    name: string;
    packageName: string;
    source: 'dependency' | 'config-file';
}
interface BuildToolDetection {
    name: string;
    source: 'dependency' | 'config-file' | 'build-output';
}
interface ProjectReport {
    root: string;
    name: string;
    version?: string;
    mode: AnalysisMode;
    packageManager: string;
    frameworks: FrameworkDetection[];
    buildTools: BuildToolDetection[];
    sourceRoots: string[];
    buildDirs: string[];
    entryPoints: string[];
    tsconfig?: string;
    filesByLanguage: Record<string, number>;
}
interface ReportWarning {
    code: string;
    message: string;
    file?: string;
    fatal: boolean;
}
interface ReportGeneratorInfo {
    name: string;
    version: string;
    generatedAt: string;
    durationMs: number;
    nodeVersion: string;
    platform: string;
    command: string;
}
interface UsageReport {
    schemaVersion: typeof REPORT_SCHEMA_VERSION;
    generator: ReportGeneratorInfo;
    project: ProjectReport;
    config: ResolvedCodeUsageMapConfig;
    summary: ReportSummary;
    findings: Finding[];
    routes: RouteReport[];
    css: CssReport;
    bundles: BundleReport;
    dependencies: DependencyReport;
    sourceMaps: SourceMapReport;
    runtime: RuntimeSummary;
    recommendations: Recommendation[];
    warnings: ReportWarning[];
    limitations: string[];
}
interface ReportArtifacts {
    report: UsageReport;
    consoleText?: string;
    jsonPath?: string;
    htmlPath?: string;
    baselinePath?: string;
    patchPath?: string;
}
interface AnalyzeOptions {
    signal?: AbortSignal;
    onProgress?: (event: ProgressEvent) => void;
    /** Ignore cached static/CSS/dependency analysis for this run. */
    refresh?: boolean;
}
interface ProgressEvent {
    phase: 'detect' | 'static' | 'css' | 'bundles' | 'source-maps' | 'dependencies' | 'runtime' | 'routes' | 'recommendations' | 'report' | 'cache' | 'done';
    message: string;
    completed?: number;
    total?: number;
}
interface RuntimeCollectionOptions {
    signal?: AbortSignal;
    baseUrl?: string;
    routes?: RouteInput[];
    headless?: boolean;
    interactive?: boolean;
    browser?: 'chromium' | 'firefox' | 'webkit';
    onProgress?: (event: ProgressEvent) => void;
}
interface RuntimeCollectionResult {
    sessionIds: string[];
    routes: string[];
    baseUrl: string;
    screenshots?: string[];
}
interface GenerateReportOptions {
    write?: boolean;
    signal?: AbortSignal;
    onProgress?: (event: ProgressEvent) => void;
}
interface ComparisonThresholds extends ThresholdConfig {
}
interface RegressionItem {
    kind: 'bundle-growth' | 'css-growth' | 'new-finding' | 'route-growth' | 'total-bundle-limit';
    message: string;
    baseline?: number;
    current?: number;
    delta?: number;
    percent?: number;
    limit?: number;
    findingIds?: string[];
}
interface ComparisonResult {
    baselinePath: string;
    currentPath?: string;
    baselineGeneratedAt?: string;
    currentGeneratedAt?: string;
    bundle: {
        rawBytes: {
            baseline: number;
            current: number;
            delta: number;
            percent: number;
        };
        gzipBytes: {
            baseline: number;
            current: number;
            delta: number;
            percent: number;
        };
        cssRawBytes: {
            baseline: number;
            current: number;
            delta: number;
            percent: number;
        };
    };
    findings: {
        baseline: number;
        current: number;
        new: Finding[];
        resolved: Finding[];
        newFingerprints: string[];
        resolvedFingerprints: string[];
    };
    routes: Array<{
        id: string;
        name: string;
        baselineBytes: number;
        currentBytes: number;
        delta: number;
        percent: number;
    }>;
    thresholds: ThresholdConfig;
    regressions: RegressionItem[];
    passed: boolean;
}

interface CreateCodeUsageMapOptions {
    /** Working directory. Defaults to process.cwd(). */
    cwd?: string;
    /** Explicit config file, relative to cwd or absolute. */
    configFile?: string;
}
interface CodeUsageMapAnalyzer {
    readonly root: string;
    analyze(options?: AnalyzeOptions): Promise<UsageReport>;
    startRuntimeCollection(options?: RuntimeCollectionOptions): Promise<RuntimeCollectionResult>;
    generateReport(options?: GenerateReportOptions): Promise<ReportArtifacts>;
    getReport(): UsageReport | undefined;
    getConfig(): Promise<ResolvedCodeUsageMapConfig>;
}
/**
 * Creates a Code Usage Map analyzer. With no config argument, a config file or
 * package.json `codeUsageMap` field is discovered automatically.
 */
declare function createCodeUsageMap(config?: CodeUsageMapConfig, options?: CreateCodeUsageMapOptions): CodeUsageMapAnalyzer;

interface LoadedConfig {
    config: CodeUsageMapConfig;
    configPath?: string;
    warnings: string[];
}
interface ConfigValidationIssue {
    path: string;
    message: string;
}
interface ResolvedConfigResult {
    config: ResolvedCodeUsageMapConfig;
    configPath?: string;
    warnings: string[];
    issues: ConfigValidationIssue[];
}
/**
 * Identity helper for typed configuration files.
 */
declare function defineConfig(config: CodeUsageMapConfig): CodeUsageMapConfig;
/**
 * Loads a config file or the `codeUsageMap` package.json field.
 * TypeScript configs are transpiled and executed locally; they are never sent
 * anywhere. Only `.ts`, `.js`, `.json` and package.json configs are supported.
 */
declare function loadConfig(root: string, explicit?: string): Promise<LoadedConfig>;
/**
 * Normalizes user configuration, resolving paths and applying safe defaults.
 * Invalid regexes in `css.safelistPatterns` produce warnings instead of aborting.
 */
declare function resolveConfig(root: string, user: CodeUsageMapConfig, configPath?: string, loadWarnings?: string[]): ResolvedConfigResult;
declare function loadResolvedConfig(root: string, explicitConfig?: string): Promise<ResolvedConfigResult & {
    configFile?: string;
}>;

declare const TOOL_VERSION = "1.0.0";

export { type AnalysisMode, type AnalysisStatus, type AnalysisToggles, type AnalyzeOptions, type BehaviorRisk, type BuildConfig, type BuildToolDetection, type BundleFileReport, type BundleReport, type CacheConfig, type CodeSnippet, type CodeUsageMapAnalyzer, type CodeUsageMapConfig, type ComparisonResult, type ComparisonThresholds, type Confidence, type CreateCodeUsageMapOptions, type CssConfig, type CssFindingDetails, type CssInJsSourceReport, type CssReport, type CssSpecificity, type DependencyFindingDetails, type DependencyPackageReport, type DependencyReport, type DuplicateDependencyReport, type DuplicateFindingDetails, type Evidence, type Finding, type FindingCategory, type FindingCounts, type FindingFix, type FindingMapping, type FindingRuntimeEvidence, type FindingSize, type FrameworkDetection, type GenerateReportOptions, type HeavyDependencyReport, type ImplementationComplexity, type LoggingConfig, type MappingHop, type ModuleAttribution, type ProgressEvent, type ProjectReport, REPORT_SCHEMA_VERSION, type Recommendation, type RecommendationCategory, type RegressionItem, type ReportArtifacts, type ReportGeneratorInfo, type ReportSummary, type ReportWarning, type ReporterConfig, type ResolvedCodeUsageMapConfig, type RouteAssetUsage, type RouteCssUsage, type RouteInput, type RouteInputObject, type RouteModuleUsage, type RouteReport, type RuntimeAction, type RuntimeActionType, type RuntimeCollectionOptions, type RuntimeCollectionResult, type RuntimeConfig, type RuntimeScenario, type RuntimeSessionSummary, type RuntimeSummary, type Severity, type SourceFileType, type SourceLocation, type SourceMapConfig, type SourceMapReport, type SymbolKind, TOOL_NAME, TOOL_VERSION, type ThresholdConfig, type TypeOnlyDependencyImport, type UsageReport, createCodeUsageMap, defineConfig, loadConfig, loadResolvedConfig, resolveConfig };
