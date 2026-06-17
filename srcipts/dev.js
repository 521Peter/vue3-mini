// 打包packages下的文件
// node dev.js 要打包的名字 -f 打包的格式
import minimist from "minimist";
import { createRequire } from "module";
import { dirname, resolve } from "path"
import { fileURLToPath } from "url";
import esbuild from "esbuild"

const require = createRequire(import.meta.url)


const args = minimist(process.argv.slice(2))
console.log("args", args)

const target = args._[0] || "reactivity" // 打包哪个文件
const format = args.f || "iife" // 打包的格式
console.log("target", target)
console.log("format", format)

const __filename = fileURLToPath(import.meta.url) // 获取文件的绝对路径
const __dirname = dirname(__filename)
console.log(__filename, __dirname)
// 入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
const pkg = require(`../packages/${target}/package.json`)

esbuild.context({
    entryPoints: [entry], // 入口
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 出口
    bundle: true, // reactivity -> shared 会打包到一起
    platform: "browser", // 打包后给浏览器使用
    sourcemap: true, // 可以调试源代码
    format, // cjs esm iife
    globalName: pkg.buildOptions?.name, // iife 的全局名称
}).then((ctx) => {
    console.log("start dev")
    return ctx.watch(); // 监听入口文件，持续打包
})