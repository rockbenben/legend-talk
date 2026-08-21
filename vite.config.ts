// 从 vitest/config 引 defineConfig，下面的 test 块才有类型。
// 旧的 `/// <reference types="vitest" />` 是 Vitest 2 时代的写法，3 起已弃用。
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // 函数写法，不是对象写法：Vite 8 换成了 Rolldown，对象形式直接报
        // `manualChunks is not a function`。函数形式 rollup 和 rolldown 都认。
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (/[\/]node_modules[\/](antd|@ant-design|@rc-component|dayjs)[\/]/.test(id)) return 'antd';
          if (/[\/]node_modules[\/](react-markdown|remark-[^\/]+|micromark[^\/]*|mdast-[^\/]+|unist-[^\/]+|hast-[^\/]+|unified|vfile[^\/]*)[\/]/.test(id)) return 'markdown';
          if (/[\/]node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom|zustand|i18next|react-i18next|use-sync-external-store)[\/]/.test(id)) return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    // vi.stubGlobal 装的东西默认【不会】自动卸载，会漏到同一文件后面的测试里。
    // 真漏过：一个返回 403 的 fetch stub 留在那儿没人收，后面的用例只是碰巧自己
    // 也覆盖了 fetch 才没红 —— 下一个不自带 fetch 的测试就会莫名其妙收到 403。
    unstubGlobals: true,
  },
});
