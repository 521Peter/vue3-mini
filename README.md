# vue3-mini

> 从零实现 Vue 3 核心机制 — 响应式系统 · 虚拟 DOM · Diff 算法 · 组件渲染

## 项目简介

本项目是一个**手写简化版 Vue 3**，深入理解并复现了 Vue 3 源码中的核心模块，包括响应式系统、虚拟 DOM 渲染引擎、Diff 算法与组件系统。使用 TypeScript 编写，基于 esbuild 构建，采用 Monorepo 架构组织多个包。

## 技术亮点

- **响应式系统**：基于 `Proxy` 实现 `reactive`、`ref`、`computed`、`watch`/`watchEffect`，支持深层代理、依赖收集/触发、调度器、嵌套 effect、`toRefs`/`proxyRefs` 自动脱 ref
- **虚拟 DOM**：实现 `h()` 函数创建 VNode，支持 Element / Text / Fragment / Component 四种节点类型，使用**位运算**（ShapeFlags）高效判断节点形态
- **Diff 算法**：实现**双端对比**（头-头、尾-尾）+ **Key 映射表** + **最长递增子序列（LIS）** 优化，最小化 DOM 移动操作
- **组件系统**：组件实例创建、Props/Attrs 分离、基于 Proxy 代理对象统一访问 data/props/`$attrs`
- **异步更新**：基于微任务（`Promise.resolve`）实现 `queueJob` 调度器，批量合并同一组件的多次状态更新，避免重复渲染
- **工程化**：Monorepo 分包管理（reactivity / runtime-core / runtime-dom / shared），esbuild 按需构建 + watch 热更新

## 项目结构

```
vue3.4/
├── packages/
│   ├── reactivity/          # 响应式系统
│   │   └── src/
│   │       ├── reactive.ts      # reactive() 响应式代理
│   │       ├── baseHandler.ts   # Proxy handlers (get/set)
│   │       ├── effect.ts        # effect() 副作用 + 依赖追踪
│   │       ├── ref.ts           # ref / toRef / toRefs / proxyRefs
│   │       ├── computed.ts      # computed() 计算属性
│   │       ├── apiWatch.ts      # watch() / watchEffect()
│   │       └── constants.ts     # DirtyLevel / ReactiveFlags
│   ├── runtime-core/        # 运行时核心
│   │   └── src/
│   │       ├── createVnode.ts   # VNode 创建 & 类型定义
│   │       ├── h.ts             # h() 渲染函数
│   │       ├── render.ts        # 渲染器 (mount / patch / diff)
│   │       ├── component.ts     # 组件实例创建 & 初始化
│   │       ├── scheduler.ts     # 异步更新调度器
│   │       └── seq.ts           # 最长递增子序列算法
│   ├── runtime-dom/         # DOM 渲染器
│   │   └── src/
│   │       ├── index.ts         # createRender() 入口
│   │       ├── nodeOps.ts       # DOM 节点操作
│   │       └── modules/         # patchProp 模块
│   │           ├── patchProp.ts     # 属性统一处理
│   │           ├── patchClass.ts    # class 处理
│   │           ├── patchAttr.ts     # attribute 处理
│   │           └── patchEvent.ts    # 事件处理
│   └── shared/              # 公共工具
│       └── src/
│           ├── index.ts         # 类型判断工具函数
│           └── shapeFlags.ts    # VNode 形态位运算标识
└── scripts/
    └── dev.js               # esbuild 构建脚本
```

## 核心实现

### 1. 响应式系统

| API                         | 实现要点                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `reactive()`                | Proxy 代理 + WeakMap 缓存；`IS_REACTIVE` 标记防重复代理                                    |
| `effect()`                  | `ReactiveEffect` 类封装，支持 `_trackId` 依赖去重、嵌套 effect（父子栈）、`scheduler` 调度 |
| `ref()`                     | `RefImpl` 类包装，`ObjectRefImpl` 实现 `toRef`/`toRefs`，`proxyRefs` 自动脱 ref            |
| `computed()`                | `ComputedRefImpl` 懒计算 + `DirtyLevel` 脏检查缓存                                         |
| `watch()` / `watchEffect()` | `traverse()` 递归深度监听，`onCleanup` 竞态清理，支持 `immediate`/`deep` 选项              |

### 2. 虚拟 DOM & 渲染器

- **VNode 类型**：`Text` / `Fragment` / `Element` / `Component`，通过 `Symbol` 和 `ShapeFlags` 位运算区分
- **挂载流程**：`createVnode` → `patch` → `mountElement` / `mountChildren` → DOM 操作
- **更新流程**：`patchElement` → `patchProps`（属性 diff） → `patchChildren`（子节点 diff）

### 3. Diff 算法

```
[a,b,c,d]  →  [a,c,b,e,d]
     ① 头-头比对: a 相同，i++
     ② 尾-尾比对: d 相同，e1--, e2--
     ③ 中间乱序: [b,c] ↔ [c,b,e]
         - 建立新节点 Key→Index 映射表
         - 遍历旧节点，命中则复用否则删除
         - LIS 算法求最长递增子序列 → 最小移动
```

### 4. 组件系统

- **组件实例**：`createComponentInstance()` 创建实例，含 state/render/subTree/update
- **Props/Attrs 分离**：外部属性按 `propsOptions` 归类为 props（响应式）或 attrs（通过 `$attrs` 访问）
- **Proxy 代理**：`instance.proxy` 统一代理 data/props/`$attrs` 的读写，render 中通过 `this` 访问
- **异步更新**：`queueJob` 微任务调度器，同步多次状态变更 → 一次 patch

```typescript
const instance = {
  state: reactive(data()),  // 响应式数据
  render,                   // 渲染函数
  update: effect.run,       // 更新触发（由 scheduler 异步调度）
};
```

## 开发历程

| Commit                          | 内容                                     |
| ------------------------------- | ---------------------------------------- |
| `feat: 实现reactive`            | Proxy 响应式代理 + 深层代理              |
| `feat: 收集依赖和触发依赖`      | track / trigger 依赖系统                 |
| `feat: effect调度实现`          | scheduler 调度机制                       |
| `feat: 实现ref`                 | ref / toRef / toRefs / proxyRefs         |
| `feat: 添加计算属性`            | computed 懒计算 + 脏检查                 |
| `feat: 添加watch`               | watch / watchEffect / onCleanup          |
| `feat: 位运算判断元素形状`      | ShapeFlags 位运算设计                    |
| `feat: 实现h函数创建虚拟节点`   | h() 函数 + VNode 创建                    |
| `feat: 两个元素之间的比较`      | patchElement + patchProps                |
| `feat: 子节点比较策略`          | patchChildren 9 种场景处理               |
| `feat: diff算法`                | 双端对比 + Key 映射                      |
| `feat: diff算法优化`            | LIS 最长递增子序列优化                   |
| `feat: Text节点渲染`            | Text 类型 VNode 渲染                     |
| `feat: Fragment节点渲染`        | Fragment 类型 VNode 渲染                 |
| `feat: vue组件渲染`             | 组件挂载 + 响应式更新                    |
| `feat: 组件的异步更新`          | queueJob 微任务批量更新                  |
| `feat: 通过代理对象访问组件props和$attrs` | Proxy 代理 + Props/Attrs 分离   |
| `feat: 整理组件渲染流程`        | 组件逻辑抽离至 component.ts              |

## 技术栈

- **语言**：TypeScript
- **构建**：esbuild（按需打包 + watch 热更新）
- **包管理**：pnpm（Monorepo workspace）
- **架构模式**：分层架构（shared → reactivity → runtime-core → runtime-dom）

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev
```

## 个人收获

- 深入理解 Vue 3 响应式系统、虚拟 DOM Diff 算法与组件渲染原理
- 掌握 Proxy 代理对象在组件数据访问层的设计应用
- 理解异步批量更新策略（微任务调度）如何避免不必要的重复渲染
- 实践 Monorepo 分包管理与 esbuild 构建配置
- 理解框架设计中的边界条件处理（嵌套 effect、循环引用、竞态清理等）
