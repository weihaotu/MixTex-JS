import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
    main: {
        build: {
            outDir: 'out/main',
            rollupOptions: {
                external: ['electron', 'onnxruntime-node'],
                output: {
                    format: 'cjs'
                },
                plugins: [
                    // 新增：处理 sharp 的动态导入
                    commonjs({
                        dynamicRequireTargets: [
                            // 包含 sharp 的二进制文件路径
                            'node_modules/sharp/lib/*.js',
                            'node_modules/sharp/build/**/*.js',
                            'node_modules/sharp/build/Release/*.node'
                        ],
                        ignoreDynamicRequires: true // 忽略其他动态导入警告
                    })
                ]
            }
        },
        resolve: {
            alias: {
                'onnxruntime-node': resolve(__dirname, 'node_modules/onnxruntime-node')
            }
        }
    },
    preload: {
        build: {
            outDir: 'out/preload',
            rollupOptions: {
                external: ['electron', 'path']
            }
        }
    },
    renderer: {
        root: '.',
        server: {
            port: 5173  // Vite 默认端口
        },
        build: {
            outDir: 'out/renderer',
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'index.html')
                }
            }
        },
        resolve: {
            alias: {
                '@': resolve('src/renderer')
            }
        },
        plugins: [react()]
    }
}); 