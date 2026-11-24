export { B as BuildManifestChunk, a as BuildManifestModule, b as BuildManifestRoute, C as CodeUsageBuildManifest } from './build-manifest-C-14wXBI.cjs';

interface CodeUsageMapVitePluginOptions {
    /** Manifest filename inside the Vite output directory. */
    filename?: string;
    /** Optional route ownership mapping: route → entry filename/chunk name. */
    routeEntries?: Record<string, string>;
}
interface ViteResolvedConfigLike {
    root?: string;
    build?: {
        outDir?: string;
    };
}
interface ViteBundleChunkLike {
    type: 'chunk';
    fileName: string;
    name?: string;
    isEntry?: boolean;
    isDynamicEntry?: boolean;
    imports?: string[];
    dynamicImports?: string[];
    modules?: Record<string, {
        renderedLength?: number;
    }>;
    viteMetadata?: {
        importedCss?: Iterable<string> | Set<string>;
        importedAssets?: Iterable<string>;
    };
}
interface ViteBundleAssetLike {
    type: 'asset';
    fileName: string;
    name?: string;
    names?: string[];
}
type ViteBundleLike = Record<string, ViteBundleChunkLike | ViteBundleAssetLike>;
interface VitePluginLike {
    name: string;
    apply: 'build';
    enforce?: 'post';
    configResolved(config: ViteResolvedConfigLike): void;
    generateBundle(this: {
        emitFile?: (asset: {
            type: 'asset';
            fileName: string;
            source: string;
        }) => void;
    }, options: {
        dir?: string;
        file?: string;
    }, bundle: ViteBundleLike): void;
    closeBundle(): void;
}
/**
 * Official Vite build plugin. It writes a Code Usage Map build manifest with
 * entry/initial/lazy chunks, CSS, static/dynamic imports, source module bytes
 * and optional route-to-entry ownership. It does not run analysis inside the
 * build and never ships into the browser bundle.
 */
declare function codeUsageMapVitePlugin(options?: CodeUsageMapVitePluginOptions): VitePluginLike;

export { type CodeUsageMapVitePluginOptions, codeUsageMapVitePlugin };
