import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isRef, RefImpl } from "./ref";
import { isReactive } from "vue";

interface Options {
  deep: boolean;
  immediate: boolean;
}

export function watch(source, cb: Function, options: Options) {
  doWatch(source, cb, options);
}

function doWatch(source, cb: Function, { deep, immediate }: Options) {
  let oldValue;
  let getter;
  if (isReactive(source)) {
    getter = () => traverse(source, deep ? undefined : 1);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }
  const job = () => {
    let newValue = effect.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  };
  // 遍历源数据，手动触发依赖绑定
  const effect = new ReactiveEffect(getter, job);

  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  }
}

// 递归遍历 seen的作用：防止对象循环引用
function traverse(
  source: ProxyConstructor,
  depth: number | undefined,
  curDepth = 0,
  seen = new Set(),
) {
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
