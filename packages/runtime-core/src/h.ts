import { isArray, isObject } from "@vue/shared";
import { createVnode, isVNode } from "./createVnode";

export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l == 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 可能是虚拟节点或者属性
      if (isVNode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      } else {
        return createVnode(type, propsOrChildren);
      }
    }
    // propsOrChildren是数组或者文本
    return createVnode(type, null, propsOrChildren);
  } else {
    // 第二个参数后面都作为数组
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l === 3 && isVNode(children)) {
      children = [children];
    }

    return createVnode(type, propsOrChildren, children);
  }
}
