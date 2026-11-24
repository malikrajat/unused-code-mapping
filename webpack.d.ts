export { B as BuildManifestChunk, a as BuildManifestModule, b as BuildManifestRoute, C as CodeUsageBuildManifest } from './build-manifest-C-14wXBI.js';

interface CodeUsageMapWebpackPluginOptions {
    /** Manifest filename inside `output.path`. */
    filename?: string;
    /** Optional route ownership mapping: route → entrypoint name or file. */
    routeEntries?: Record<string, string>;
}
interface WebpackModuleLike {
    name?: string;
    identifier?: string;
    size?: number;
}
interface WebpackChunkLike {
    files?: string[];
    entry?: boolean;
    initial?: boolean;
    names?: string[];
    modules?: WebpackModuleLike[];
}
interface WebpackStatsJson {
    chunks?: WebpackChunkLike[];
    entrypoints?: Record<string, {
        assets?: Array<{
            name?: string;
        }>;
        chunks?: Array<string | number>;
    }>;
}
interface WebpackCompilationLike {
    getStats(): {
        toJson(options: Record<string, unknown>): WebpackStatsJson;
    };
}
interface WebpackCompilerLike {
    options?: {
        output?: {
            path?: string;
        };
    };
    hooks?: {
        afterEmit?: {
            tapPromise(name: string, callback: (compilation: WebpackCompilationLike) => Promise<void>): void;
            tap(name: string, callback: (compilation: WebpackCompilationLike) => void): void;
        };
    };
}
/**
 * Official Webpack plugin. It writes entrypoint/chunk/CSS/module attribution
 * and route metadata after emit without adding code to the browser bundle.
 */
declare class CodeUsageMapWebpackPlugin {
    readonly name = "code-usage-map-webpack";
    private readonly filename;
    private readonly routeEntries;
    constructor(options?: CodeUsageMapWebpackPluginOptions);
    apply(compiler: WebpackCompilerLike): void;
}

export { CodeUsageMapWebpackPlugin, type CodeUsageMapWebpackPluginOptions };
