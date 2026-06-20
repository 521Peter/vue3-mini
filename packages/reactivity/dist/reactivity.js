// packages/reactivity/src/effect.ts
function effect(fn, options) {
  if (typeof fn !== "function") {
    console.error("\u4F20\u5165\u7684\u4E0D\u662F\u51FD\u6570");
    return fn;
  }
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
function preCleanEffect(effect2) {
  effect2._trackId++;
  effect2._depsLength = 0;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanDepEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
var activeEffect;
var ReactiveEffect = class {
  // 如果fn中使用的响应式数据变化了，要重新调用 run 方法
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    // 记录当前effect执行了多少次
    this._trackId = 0;
    this.deps = [];
    this._depsLength = 0;
    this.isRunning = false;
    this.active = true;
  }
  run() {
    if (!this.active) return this.fn();
    preCleanEffect(this);
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
};
function cleanDepEffect(dep, effect2) {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanup();
  }
}
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    let oldDep = effect2.deps[effect2._depsLength];
    if (oldDep === dep) {
      effect2._depsLength++;
    } else {
      if (oldDep) {
        cleanDepEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    }
  }
}
function triggerEffects(dep) {
  for (let effect2 of dep.keys()) {
    if (effect2.scheduler && !effect2.isRunning) {
      effect2.scheduler();
    }
  }
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
function createDep(cleanup, name) {
  let dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  dep.name = name;
  return dep;
}
function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(
      key,
      dep = createDep(() => {
        depsMap.delete(key);
      }, key)
    );
  }
  trackEffect(activeEffect, dep);
}
function trigger(target, key, newValue, oldValue) {
  console.log("targetMap", targetMap);
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    console.log("\u627E\u4E0D\u5230depsMap");
    return;
  }
  let dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  triggerEffects(dep);
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) return true;
    track(target, key);
    let result = Reflect.get(target, key, receiver);
    if (isObject(result)) {
      result = reactive(result);
    }
    return result;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  return createReactiveObj(target);
}
function createReactiveObj(target) {
  if (!isObject(target)) return target;
  if (target["__v_isReactive" /* IS_REACTIVE */]) return target;
  const existProxy = reactiveMap.get(target);
  if (existProxy) return existProxy;
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
export {
  activeEffect,
  effect,
  reactive,
  trackEffect,
  triggerEffects
};
//# sourceMappingURL=reactivity.js.map
