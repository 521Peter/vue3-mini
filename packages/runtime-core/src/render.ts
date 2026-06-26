import { ShapeFlags } from "@vue/shared";
import { isSameVNode, Vnode } from "./createVnode";

interface RenderOptions {
  insert(el: Element, parent: Element, anchor?: Element): void;
  remove(el: Element): void;
  createElement: (type: any) => any;
  createText: (text: any) => Text;
  setText: (node: Element, text: any) => any;
  setElementText: (el: Element, text: any) => any;
  parentNode: (node: Element) => ParentNode;
  nextSibling: (node: Element) => ChildNode;
  patchProp: (el: HTMLElement, key: any, preValue: any, nextValue: any) => void;
}

export function createRender(renderOptions: RenderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  const mountChildren = (children, container: HTMLElement) => {
    for (let ch of children) {
      patch(null, ch, container);
    }
  };

  // 将虚拟节点挂载到真实dom上
  const mountElement = (vnode, container: HTMLElement) => {
    const { type, props, children, shapeFlag } = vnode;
    const ele = hostCreateElement(type);
    vnode.el = ele;
    // 按位&运算
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果children是普通文本
      hostSetElementText(ele, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果children是数组
      mountChildren(children, ele);
    }

    for (let k in props) {
      hostPatchProp(ele, k, null, props[k]);
    }
    hostInsert(ele, container);
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  const patchProps = (n1, n2, el: HTMLElement) => {
    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // 用最新的属性
    for (let k in newProps) {
      hostPatchProp(el, k, oldProps[k], newProps[k]);
    }

    // 删除旧的、不用的
    for (let k in oldProps) {
      !(k in newProps) && hostPatchProp(el, k, oldProps[k], null);
    }
  };

  const unmountChildren = (ch) => {
    for (let c of ch) {
      unmount(c);
    }
  };

  const patchChildren = (n1: Vnode, n2: Vnode, el: HTMLElement) => {
    // children可能是null、文本或者数组
    let c1 = n1.children;
    let c2 = n2.children;

    let preShapeFlag = n1.shapeFlag;
    let curShapeFlag = n2.shapeFlag;
    // 一共9种情况，可以汇总成以下情况
    //1.新的是文本，老的是数组移除老的：
    //2.新的是文本，老的也是文本，内容不相同替换
    //3.老的是数组，新的是数组，diff 算法
    //4.老的是数组，新的不是数组，移除老的子节点
    //5.老的是文本，新的是空
    //6.老的是文本，新的是数组

    if (curShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c1 != c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (curShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 子节点都是数组，diff算法比较，复用节点
        } else {
          unmountChildren(c1);
        }
      } else {
        if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }

        if (curShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  const patchElement = (n1, n2, container) => {
    // 复用dom
    const el = (n2.el = n1.el);

    // 比较属性
    patchProps(n1, n2, el);

    // 比较children
    patchChildren(n1, n2, el);
  };

  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 如果n1为null，n2有值，需要将n2挂载到真实dom上
      mountElement(n2, container);
    } else {
      // 相同虚拟节点，需要比较元素的属性、children...
      patchElement(n1, n2, container);
    }
  };

  const patch = (n1, n2, container) => {
    // 相同节点不做处理
    if (n1 === n2) return;

    // 如果两个节点不相同，删掉之前的，挂载最新的
    if (n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

    processElement(n1, n2, container);
  };

  const render = (vnode, container) => {
    console.log(container._vnode);

    // 如果vnode为空，而且这个容器挂载过虚拟节点，那么移出元素
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    }
    // 将虚拟节点渲染成真实节点
    patch(container._vnode || null, vnode, container);
    // 保存当前的虚拟节点
    container._vnode = vnode;
  };

  return {
    render,
  };
}
