import { isArray, isString, ShapeFlags } from "@vue/shared";

// 必须传固定参数：props为属性；children为数组
export function createVnode(type, props, children?) {
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
    vnode.children = String(children);
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN;
  }

  return vnode;
}

export function isVNode(value) {
  return value?.__v_isVNode === true;
}

// 这里的key用户可以传，不传就是undefined
export function isSameVNode(v1, v2) {
  return v1.type === v2.type && v1.key === v2.key;
}
