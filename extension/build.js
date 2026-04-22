'use strict';

const esbuild = require('esbuild');
const path = require('path');
const watch = process.argv.includes('--watch');

esbuild.context({
    entryPoints: [path.join(__dirname, 'src/extension.js')],
    bundle: true,
    outfile: path.join(__dirname, 'dist/extension.js'),
    platform: 'node',
    target: 'node18',
    external: [
        'vscode',
        // These large runtime modules stay external and load from extension/node_modules.
        'puppeteer-core',
        // orz markdown parser
        '@orz-how/markdown-parser',
        // highlight.js
        'highlight.js',
        // node-html-parser
        'node-html-parser',
        // pdf-lib is large — keep as external so it loads from node_modules
        'pdf-lib',
    ],
    format: 'cjs',
    sourcemap: true,
    logLevel: 'info',
}).then(async (ctx) => {
    if (watch) {
        await ctx.watch();
        console.log('Watching for changes…');
    } else {
        await ctx.rebuild();
        await ctx.dispose();
        console.log('Build complete.');
    }
}).catch(() => process.exit(1));
