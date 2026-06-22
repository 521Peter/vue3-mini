import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";
import { DirtyLevel } from "./constants";

class ComputedRefImpl {
  public _value; // 用来保存上一次执行的结果
  public effect;
  public dep;
  constructor(
    getter,
    public setter,
  ) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        this.effect.dirty = DirtyLevel.DIRTY;
        triggerRefValue(this);
      },
    );
  }

  get value() {
    // 如果是脏数据，执行并缓存结果
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    }
    return this._value;
  }
  set value(v) {
    this.setter(v);
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);

  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}
