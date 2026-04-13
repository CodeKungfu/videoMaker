# AI 漫剧工作流平台 (VideoMaker)

基于 Vue 3 + Express + Prisma (SQLite) 开发的端到端 AI 漫剧工作流系统。专为个人创作者设计，致力于将“灵感”变成“可复现的流水线”。

## 核心功能特性

- 🎬 **剧本与分镜编辑器**：结构化拆解“主体、动作、情绪、场景、对白”，支持**真实拖拽排序**与**一键复制镜头参数**。
- 📦 **视觉Bible与资产库**：统一管理角色、场景与关键道具。支持上传本地参考图，设定外形锚点与禁用元素。
- 🏭 **镜头生产车间**：
  - **智能提示词 (Prompt) 组装**：自动将分镜参数与对应资产库的角色锚点/禁忌词组合，生成精准的正负向提示词。
  - **支持手动编辑 Prompt**，高度可控。
  - **本地生图上传**：不仅支持调用 API，也支持在使用 WebUI/ComfyUI 跑出满意图像后，直接本地上传定稿。
- 🖼️ **排版与合成导出**：
  - **对话气泡自由拖拽**，防遮挡画面。
  - **全局样式控制**：面板间距、外边距、背景颜色，以及 3 种气泡风格（日漫、现代毛玻璃、内心独白）。
  - **一键长图导出**：集成 `html2canvas`，纯前端渲染拼接长图直接下载。
- 🚦 **质量控制**：内置发布前质检 Checklist。

## 技术栈
- **前端**: Vue 3 (Composition API) + Tailwind CSS + Pinia + Vue Router
- **后端**: Node.js + Express + Multer (本地文件上传)
- **数据库**: SQLite + Prisma ORM
- **工具库**: `html2canvas` (长图导出), `@vueuse/core` (拖拽与交互), `lucide-vue-next` (图标)

## 本地快速启动

1. **安装依赖**
```bash
npm install
```

2. **初始化数据库**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. **启动开发服务器** (将同时启动前端 Vite 并在 3001 端口启动后端 API)
```bash
npm run dev
```

4. **访问系统**
打开浏览器访问: `http://localhost:5173` (或终端提示的本地端口)

## 目录结构简介

- `src/` : Vue 3 前端代码
  - `pages/` : 核心业务视图 (工作台、分镜、资产、生产车间、合成导出)
  - `components/` : 共享组件 (项目侧边栏、Toast 提示等)
- `api/` : Express 后端代码
  - `routes/` : RESTful 接口 (项目、分镜、资产、上传)
- `prisma/` : 数据库模型定义与迁移文件
- `public/uploads/` : 本地图片上传的默认存储路径 (gitignore 已忽略)

