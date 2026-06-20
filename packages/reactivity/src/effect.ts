type Dep = Map<ReactiveEffect, number>;

export function effect(fn: Function, options?) {
  if (typeof fn !== "function") {
    console.error("传入的不是函数");
    return fn;
  }

  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();

  // 合并选项
  if (options) {
    Object.assign(_effect, options);
  }

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

function preCleanEffect(effect: ReactiveEffect) {
  effect._trackId++;
  effect._depsLength = 0;
}

function postCleanEffect(effect: ReactiveEffect) {
  // [flag,a,b,c]
  // [flag]
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect);
    }
    effect.deps.length = effect._depsLength;
  }
}

// 当前运行的effect实例
export let activeEffect: undefined | ReactiveEffect;
class ReactiveEffect {
  // 记录当前effect执行了多少次
  _trackId = 0;
  deps: Dep[] = [];
  _depsLength = 0;
  isRunning = false;
  public active = true;
  // 如果fn中使用的响应式数据变化了，要重新调用 run 方法
  constructor(
    public fn: Function,
    public scheduler: Function,
  ) {}

  run() {
    // 如果不是响应式，执行完直接返回
    if (!this.active) return this.fn();

    preCleanEffect(this);

    // 记录父effect，解决effect嵌套引发的bug
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      this.isRunning = true;
      return this.fn();
    } finally {
      postCleanEffect(this);
      activeEffect = lastEffect;
      this.isRunning = false;
    }
  }
}

function cleanDepEffect(dep: Dep, effect: ReactiveEffect) {
  dep.delete(effect);
  // map为空，则直接删除这个map
  if (dep.size === 0) {
    (dep as any).cleanup();
  }
}

// 双向记录
export function trackEffect(effect: ReactiveEffect, dep: Dep) {
  // 防止一个属性，在同一个effect中多次收集依赖
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId); // 更新id

    // {flag,name}
    // {flag,age}
    // 每次执行完effect,让_depsLength为0，然后就能从头依次比较deps中的每个元素
    let oldDep = effect.deps[effect._depsLength];
    // 相同则不处理;不相同需要删掉之前的，换新的
    if (oldDep === dep) {
      effect._depsLength++;
    } else {
      if (oldDep) {
        cleanDepEffect(oldDep, effect);
      }
      effect.deps[effect._depsLength++] = dep;
    }
  }
}

export function triggerEffects(dep: Map<ReactiveEffect, number>) {
  for (let effect of dep.keys()) {
    if (effect.scheduler && !effect.isRunning) {
      effect.scheduler();
    }
  }
}
