import { isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { RefImpl } from "./ref";

interface Options {
  deep: boolean;
}

export function watch(source, cb: Function, options: Options) {
  doWatch(source, cb, options);
}

function doWatch(source, cb: Function, { deep }: Options) {
  let oldValue;
  const job = () => {
    let newValue = effect.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  };
  // 遍历源数据，手动触发依赖绑定
  const effect = new ReactiveEffect(
    () => traverse(source, deep ? undefined : 1),
    job,
  );
  oldValue = effect.run();
}

// 递归遍历 seen的作用：防止对象循环引用
function traverse(
  source: RefImpl | ProxyConstructor,
  depth: number | undefined,
  curDepth = 0,
  seen = new Set(),
) {
  if (source instanceof RefImpl) {
    return source.value;
  }
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (curDepth >= depth) {
      return source;
    }
    curDepth++;
  }
  if (seen.has(source)) {
    return source;
  }

  seen.add(source);
  for (let key in source) {
    traverse(source[key], depth, curDepth, seen);
  }

  return source;
}
