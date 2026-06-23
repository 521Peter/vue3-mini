import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isRef, RefImpl } from "./ref";
import { isReactive } from "vue";

interface Options {
  deep: boolean;
  immediate: boolean;
}

export function watch(source, cb: Function, options?: Options) {
  return doWatch(source, cb, options);
}

export function watchEffect(source, options) {
  return doWatch(source, null, options);
}

function doWatch(
  source,
  cb: Function,
  { deep, immediate } = { deep: true, immediate: false },
) {
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
    if (cb) {
      let newValue = effect.run();
      cb(newValue, oldValue);
      oldValue = newValue;
    } else {
      effect.run();
    }
  };
  const effect = new ReactiveEffect(getter, job);

  // 访问源数据，触发依赖绑定
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    // 没有cb,则认为是watchEffect
    effect.run();
  }

  return () => {
    effect.stop();
  };
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
