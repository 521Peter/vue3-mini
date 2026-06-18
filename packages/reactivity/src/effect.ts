export function effect(fn: Function, options?) {
  if (typeof fn !== "function") {
    console.error("传入的不是函数");
    return fn;
  }

  const _effect = new ReactiveEffect(fn);
  _effect.run();
  return _effect;
}

// 当前运行的effect实例
export let activeEffect: undefined | ReactiveEffect;
class ReactiveEffect {
  // 记录当前effect执行了多少次
  _trackId = 0;
  deps: Map<ReactiveEffect, number>[] = [];
  public active = true;
  // 如果fn中使用的响应式数据变化了，要重新调用 run 方法
  constructor(public fn: Function) {}

  run() {
    // 如果不是响应式，执行完直接返回
    if (!this.active) return this.fn();

    // 记录父effect，解决effect嵌套引发的bug
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = lastEffect;
    }
  }
}

// 双向记录
export function trackEffect(
  effect: ReactiveEffect,
  dep: Map<ReactiveEffect, number>,
) {
  dep.set(effect, effect._trackId);
  effect.deps.push(dep);
}

export function triggerEffects(dep: Map<ReactiveEffect, number>) {
  for (let effect of dep.keys()) {
    effect.run();
  }
}
