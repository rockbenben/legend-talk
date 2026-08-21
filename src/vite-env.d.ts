/// <reference types="vite/client" />
// Vite 自带的这份声明里有 `declare module '*.css' {}` 等资源模块的类型。
// 本来靠自动引入 @types 也能拿到，但 tsconfig 里写了 `"types": ["vitest/globals"]`
// ——那个字段一旦出现就是白名单，vite/client 不在里面。
// TypeScript 5.9 对没有声明的副作用 import 不报错，7 开始报 TS2882，于是
// `import '@fontsource/...css'` 这 16 行一起红。
