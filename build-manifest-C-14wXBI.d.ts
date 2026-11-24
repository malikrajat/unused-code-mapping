declare const BUILD_MANIFEST_SCHEMA_VERSION: 1;
interface BuildManifestModule {
    /** Absolute or relative module identifier. */
    id: string;
    bytes: number;
}
interface BuildManifestChunk {
    file: string;
    entry: boolean;
    initial: boolean;
    imports: string[];
    dynamicImports: string[];
    css: string[];
    modules: BuildManifestModule[];
    routes: string[];
}
interface BuildManifestRoute {
    route: string;
    files: string[];
    initial: boolean;
}
interface CodeUsageBuildManifest {
    schemaVersion: typeof BUILD_MANIFEST_SCHEMA_VERSION;
    buildTool: 'vite' | 'webpack' | 'other';
    generator: string;
    generatedAt: string;
    chunks: BuildManifestChunk[];
    routes: BuildManifestRoute[];
}

export type { BuildManifestChunk as B, CodeUsageBuildManifest as C, BuildManifestModule as a, BuildManifestRoute as b };
