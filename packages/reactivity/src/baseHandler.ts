import { track, trigger } from "./reactiveEffect";

// baseHandler.ts
export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true;

    // 依赖收集，记录哪些地方用到这个数据
    track(target, key);

    return Reflect.get(target, key, receiver);
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
