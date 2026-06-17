export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true;

    // 依赖收集，记录哪些地方用到这个数据
    debugger;

    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    // 触发更新，用到该数据的视图要更新

    return Reflect.set(target, key, value, receiver);
  },
};
