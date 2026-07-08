import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";

export interface ComponentType {
  data: Function;
  render: Function;
  props: Record<string, any>;
  setup?: (
    props: Record<string | symbol, any>,
    ctx: Partial<{
      emit: Function;
      attrs: Record<string | symbol, any>;
      slots: Record<string | symbol, any>;
      expose: Function;
    }>,
  ) => Record<string | symbol, any> | Function;
}

export interface ComponentInstance {
  isMounted: Boolean;
  subTree: Vnode;
  data: any;
  render: Function;
  update: Function;
  propsOptions: Record<string | symbol, any>;
  props: Record<string | symbol, any>;
  attrs: Record<string | symbol, any>;
  proxy: any;
  vnode: Vnode;
  next?: Vnode;
  setupState: Record<string | symbol, any>;
  slots: Record<string | symbol, any>;
  exposed: Record<string | symbol, any> | null;
}

export interface Vnode {
  __v_isVNode: boolean;
  type: string | symbol | ComponentType;
  props: Record<string, any>;
  key?: string | number;
  children: null | Array<any> | string;
  shapeFlag: ShapeFlags;
  // el?: HTMLElement | Text;
  el?;
  component?: ComponentInstance;
}

export const Text = Symbol("Text");
// children都是数组
export const Fragment = Symbol("Fragment");

// 必须传固定参数：props为属性；children为数组
export function createVnode(type, props, children?): Vnode {
  // type为对象时，说明是组件类型
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : 0;
  let vnode = {
    __v_isVNode: true,
    type,
    props,
    key: props?.key || null,
    children: null,
    shapeFlag,
  };

  if (isArray(children)) {
    vnode.children = children;
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN;
  } else if (isObject(children)) {
    // 说明是插槽
    vnode.children = children;
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.SLOTS_CHILDREN;
  } else {
    vnode.children = children ? String(children) : null;
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN;
  }

  return vnode;
}

export function isVNode(value) {
  return value?.__v_isVNode === true;
}

// 这里的key用户可以传，不传就是undefined
export function isSameVNode(v1: Vnode, v2: Vnode) {
  return v1.type === v2.type && v1.key === v2.key;
}
