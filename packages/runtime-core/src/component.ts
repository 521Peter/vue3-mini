import { hasOwn, isFunction } from "@vue/shared";
import { ComponentInstance, ComponentType, Vnode } from "./createVnode";
import { reactive } from "@vue/reactivity";

export function createComponentInstance(vnode: Vnode) {
  const { render } = vnode.type as ComponentType;
  const instance: ComponentInstance = {
    isMounted: false,
    subTree: null,
    data: null,
    render,
    update: null,
    // 组件内定义的属性
    propsOptions: (vnode.type as ComponentType).props,
    // 当前组件应有的属性
    props: {},
    // attrs = 外部传入的属性 - 组件内定义的属性
    attrs: {},
    proxy: null,
    vnode,
  };
  vnode.component = instance;
  return instance;
}

const initProps = (instance: ComponentInstance, rawProps) => {
  const { propsOptions } = instance;
  let props = {};
  let attrs = {};
  for (let key in rawProps) {
    let value = rawProps[key];
    if (key in propsOptions) {
      props[key] = value;
    } else {
      attrs[key] = value;
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
};

const publicProperty = {
  $attrs: (instance: ComponentInstance) => instance.attrs,
};

const handler = {
  get(target, key, receiver) {
    const { props, data } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    let getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, newValue, receiver) {
    const { props, data } = target;
    if (data && hasOwn(data, key)) {
      data[key] = newValue;
    } else if (props && hasOwn(props, key)) {
      console.warn("props is readonly");
      // props[key] = newValue;
      return false;
    }
    return true;
  },
};

export function setupComponent(instance: ComponentInstance) {
  initProps(instance, instance.vnode.props);

  const proxy = new Proxy(instance, handler);
  instance.proxy = proxy;

  const { data = () => {} } = instance.vnode.type as ComponentType;
  if (data && !isFunction(data)) {
    return console.warn("data must be a function");
  }
  instance.data = reactive(data.call(proxy));
}
