import { activeEffect, trackEffect, triggerEffects } from "./effect";

const targetMap = new WeakMap();

// 创建map，并且给map添加名字和清除自身的方法
function createDep(cleanup, name) {
  let dep = new Map() as any;
  dep.cleanup = cleanup;
  dep.name = name;
  return dep;
}

export function track(target, key) {
  // activeEffect表示当前effect实例，如果为undefined，说明属性是在effect函数之外访问的，无需收集依赖
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(
      key,
      (dep = createDep(() => {
        depsMap.delete(key);
      }, key)),
    );
  }

  // 收集effect
  trackEffect(activeEffect, dep);

  // console.log(targetMap);
}

// Map:{obj:{属性:Map:{effect,effect...}}}

export function trigger(target: object, key, newValue, oldValue) {
  console.log("targetMap", targetMap);

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    console.log("找不到depsMap");
    return;
  }
  let dep = depsMap.get(key);
  // 没有dep，说明该属性不在effect中
  if (!dep) {
    return;
  }

  // 触发effect，一个属性可能对应多个effect
  triggerEffects(dep);
}
