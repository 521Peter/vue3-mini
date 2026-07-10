import { ComponentInstance } from "vue";
import {
  currentInstance,
  setCurrentInstance,
  unSetCurrentInstance,
} from "./component";

export enum LifecycleHooks {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
}

export type LifecycleHook = Function[];

function injectHook(lc: LifecycleHooks) {
  return (hook, target: ComponentInstance = currentInstance) => {
    const hooks = target[lc] || (target[lc] = []);
    // 给hook包了一层，确保在hook里面，能获取到instance
    const wrappedHook = () => {
      setCurrentInstance(target);
      hook();
      unSetCurrentInstance();
    };
    hooks.push(wrappedHook);
  };
}

export const onBeforeMount = injectHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = injectHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = injectHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = injectHook(LifecycleHooks.UPDATED);

export function runHooks(fns) {
  for (let fn of fns) {
    fn();
  }
}
