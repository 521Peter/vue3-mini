import { hasOwn, isFunction, ShapeFlags } from "@vue/shared";
import { ComponentInstance, ComponentType, Vnode } from "./createVnode";
import { proxyRefs, reactive } from "@vue/reactivity";

export function createComponentInstance(vnode: Vnode) {
  const instance: ComponentInstance = {
    isMounted: false,
    subTree: null,
    data: null,
    render: null,
    update: null,
    // 组件内定义的属性
    propsOptions: (vnode.type as ComponentType).props,
    // 当前组件应有的属性
    props: {},
    // attrs = 外部传入的属性 - 组件内定义的属性
    attrs: {},
    proxy: null,
    vnode,
    setupState: {},
    slots: {},
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

const initSlots = (instance: ComponentInstance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
};

const publicProperty = {
  $attrs: (instance: ComponentInstance) => instance.attrs,
  $slots: (instance: ComponentInstance) => instance.slots,
};

const handler = {
  get(target, key, receiver) {
    const { props, data, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
    let getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, newValue, receiver) {
    const { props, data, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = newValue;
    } else if (props && hasOwn(props, key)) {
      console.warn("props is readonly");
      // props[key] = newValue;
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = newValue;
    }
    return true;
  },
};

export function setupComponent(instance: ComponentInstance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  // console.log("instance", instance);

  const proxy = new Proxy(instance, handler);
  instance.proxy = proxy;

  const {
    data = () => {},
    render,
    setup,
  } = instance.vnode.type as ComponentType;
  if (data && !isFunction(data)) {
    return console.warn("data must be a function");
  }
  if (setup) {
    const setupResult = setup(proxy, {});
    if (isFunction(setupResult)) {
      instance.render = setupResult as Function;
    } else {
      // ref自动解包
      instance.setupState = proxyRefs(
        setupResult as Record<string | symbol, any>,
      );
    }
  }
  if (!instance.render) {
    instance.render = render;
  }
  instance.data = reactive(data.call(proxy));
}
