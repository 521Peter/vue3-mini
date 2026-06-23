import { activeEffect, Dep, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

export class RefImpl {
  public _value; // 用来保存ref中的值
  public __v_isRef = true; // ref标识
  public dep: Dep;
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (this.value !== newValue) {
      this._value = newValue;
      this.rawValue = newValue;
      triggerRefValue(this);
    }
  }
}

export function trackRefValue(ref) {
  if (!activeEffect) return;
  if (!ref.dep) {
    ref.dep = createDep(() => {
      ref.dep = null;
    }, "null");
  }
  trackEffect(activeEffect, ref.dep);
}

export function triggerRefValue(ref) {
  if (!ref.dep) return;

  triggerEffects(ref.dep);
}

export function toRef(obj, key: string) {
  return new ObjectRefImpl(obj, key);
}

class ObjectRefImpl {
  public __v_isRef = true;
  constructor(
    public _object,
    public _key,
  ) {}

  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

export function toRefs(obj) {
  let result = {};
  for (let key in obj) {
    result[key] = toRef(obj, key);
  }
  return result;
}

export function proxyRefs(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      // 自动脱ref
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, newValue, receiver) {
      let oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = newValue;
        return true;
      } else {
        return Reflect.set(target, key, newValue, receiver);
      }
    },
  });
}

export function isRef(obj) {
  return obj instanceof RefImpl && obj["__v_isRef"];
}
