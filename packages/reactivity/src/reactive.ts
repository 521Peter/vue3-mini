import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from "./baseHandler";

const reactiveMap = new WeakMap();

export function reactive(target) {
  return createReactiveObj(target);
}

function createReactiveObj(target) {
  // 不是响应式对象，则不做处理返回原值
  if (!isObject(target)) return target;

  // 如果已经是响应式对象，无需再代理，直接返回
  if (target[ReactiveFlags.IS_REACTIVE]) return target;

  // 命中缓存的代理对象，直接返回，对于同一个对象，使用同一个响应式对象即可
  const existProxy = reactiveMap.get(target);
  if (existProxy) return existProxy;

  const proxy = new Proxy(target, mutableHandlers);
  // 记录代理对象
  reactiveMap.set(target, proxy);
  return proxy;
}
