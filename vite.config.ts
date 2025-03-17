import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        electron([
            {
                entry: 'src/main/index.ts',
                onstart(options) {
                    // 当主进程代码更新时重启
                    options.reload();
                },
                vite: {
                    build: {
                        outDir: 'build/main',
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            },
            {
                entry: 'src/preload/index.ts',
                onstart(options) {
                    options.reload();
                },
                vite: {
                    build: {
                        outDir: 'build/preload',
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            },
        ]),
        renderer(),
    ],
    optimizeDeps: {
        exclude: ['electron']
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            path: "path-browserify",
        }
    },
    base: './',
    build: {
        outDir: 'build/renderer',
        assetsDir: 'assets',
        emptyOutDir: true,
        rollupOptions: {
            external: ['electron']
        },
        sourcemap: true
    },
    publicDir: 'public'
}); 