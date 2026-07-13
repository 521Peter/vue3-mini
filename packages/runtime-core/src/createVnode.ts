import {
  isArray,
  isFunction,
  isObject,
  isString,
  ShapeFlags,
} from "@vue/shared";
import { ComponentType, ComponentInstance } from "./component";

export interface Vnode {
  __v_isVNode: boolean;
  type: string | symbol | ComponentType | Function;
  props: Record<string, any>;
  key?: string | number;
  children: null | Array<any> | string;
  shapeFlag: ShapeFlags;
  // el?: HTMLElement | Text;
  el?;
  component?: ComponentInstance;
  ref: any;
}

export const Text = Symbol("Text");
// children都是数组
export const Fragment = Symbol("Fragment");

// 必须传固定参数：props为属性；children为数组
export function createVnode(type, props, children?): Vnode {
  // type为对象时，说明是组件类型
  let shapeFlag = 0;
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT;
  } else if (isFunction(type)) {
    shapeFlag = ShapeFlags.FUNCTIONAL_COMPONENT;
  } else if (isObject(type)) {
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT;
  } else {
    shapeFlag = 0;
  }

  let vnode = {
    __v_isVNode: true,
    type,
    props,
    key: props?.key || null,
    children: null,
    shapeFlag,
    ref: props?.ref || null,
  };

  if (isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      // 将子节点转化为虚拟节点
      if (!isObject(child)) {
        children[i] = createVnode(Text, null, String(child));
      }
    }

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
