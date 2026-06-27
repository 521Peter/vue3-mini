import { isArray, isString, ShapeFlags } from "@vue/shared";

export interface Vnode {
  __v_isVNode: boolean;
  type: string;
  props: Record<string, any>;
  key?: string | number;
  children: null | Array<any> | string;
  shapeFlag: number;
  el?: HTMLElement;
}

// 必须传固定参数：props为属性；children为数组
export function createVnode(type, props, children?): Vnode {
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
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
