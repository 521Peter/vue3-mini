import { activeEffect, Dep, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public _value; // 用来保存ref中的值
  public __v_isRef = true; // ref标识
  public dep: Dep;
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackRefEffect(this);
    return this._value;
  }
  set value(newValue) {
    if (this.value !== newValue) {
      this._value = newValue;
      this.rawValue = newValue;
      triggerRefEffect(this);
    }
  }
}

function trackRefEffect(ref: RefImpl) {
  if (!activeEffect) return;
  if (!ref.dep) {
    ref.dep = createDep(() => {
      ref.dep = null;
    }, "null");
  }
  trackEffect(activeEffect, ref.dep);
}

function triggerRefEffect(ref: RefImpl) {
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
