import { isObject } from "@vue/shared";
import { track, trigger } from "./reactiveEffect";
import { reactive } from "./reactive";

// baseHandler.ts
export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true;

    // 依赖收集，记录哪些地方用到这个数据
    track(target, key);

    let result = Reflect.get(target, key, receiver);
    // 实现深层代理（懒代理）
    if (isObject(result)) {
      result = reactive(result);
    }

    return result;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);

    // 如果值改变了，才触发视图更新
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }

    return result;
  },
};
