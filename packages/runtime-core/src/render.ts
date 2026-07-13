import { hasOwn, ShapeFlags } from "@vue/shared";
import { isSameVNode, Vnode, Text, Fragment } from "./createVnode";
import { getSequence } from "./seq";
import { isRef, reactive, ReactiveEffect } from "@vue/reactivity";
import { queueJob } from "./scheduler";
import {
  ComponentInstance,
  createComponentInstance,
  setupComponent,
} from "./component";
import { runHooks } from "./apiLifecycle";

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
  const mountElement = (vnode, container: HTMLElement, anchor) => {
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
    hostInsert(ele, container, anchor);
  };

  const unmount = (vnode: Vnode) => {
    const { type, shapeFlag } = vnode;
    if (type === Fragment) {
      unmountChildren(vnode.children);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      // 组件卸载
      unmount(vnode.component.subTree);
    } else {
      hostRemove(vnode.el);
    }
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

  const patchKeyedChildren = (c1: Vnode[], c2: Vnode[], el: HTMLElement) => {
    // 为了尽可能复用元素节点，会使用while循环分别从头部和尾部进行比对，记录当前遍历的索引
    // 是相同的虚拟节点，则进行patch操作。否则跳出循环
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // 从头开始比
    while (i <= e1 && i <= e2) {
      let n1 = c1[i];
      let n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // console.log("i e1 e2", i, e1, e2);
    // 从尾部开始比
    while (i <= e1 && i <= e2) {
      let n1 = c1[e1];
      let n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // console.log("i e1 e2", i, e1, e2);

    if (i > e1) {
      // [a,b] => [a,b,c] 头循环 i e1 e2 2 1 2
      // [a,b] => [c,a,b] 尾循环 i e1 e2 0 -1 0
      // 规律：i > e1  i <= e2
      // 新的多，增加操作
      if (i <= e2) {
        let nextPos = e2 + 1;
        let anchor = c2[nextPos];
        if (anchor?.el) {
          while (i <= e2) {
            // 在anchor前面插入元素
            patch(null, c2[i], el, anchor.el);
            i++;
          }
        } else {
          let j = i;
          while (j <= e2) {
            // 直接向后插入元素
            patch(null, c2[j], el);
            j++;
          }
        }
      }
    } else if (i > e2) {
      // [a,b,c] => [a,b] 头循环 i e1 e2 2 2 1
      // [c,a,b] => [a,b] 尾循环 i e1 e2 0 0 -1
      // 规律：i > e2  i <= e1
      // 旧的多，删除操作
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    } else {
      // console.log("i e1 e2", i, e1, e2);
      let s1 = i;
      let s2 = i;
      // s1-e1部分 和 s2-e2部分 不一样
      // 可以根据新的建立映射表
      let keyToNewIndexMap: Map<Vnode["key"], number> = new Map();
      let len = e2 - s2 + 1;
      let newIndexToOldIndex = new Array(len).fill(0);
      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }

      // 遍历旧的部分，如果在映射表中没找到，就删除；找到就更新节点
      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i];
        const newIndex = keyToNewIndexMap.get(vnode.key);
        if (newIndex === undefined) {
          unmount(vnode);
        } else {
          newIndexToOldIndex[newIndex - s2] = i + 1;
          // 比较前后节点的差异，更新属性和孩子
          patch(vnode, c2[newIndex], el);
        }
      }
      // console.log("keyToNewIndexMap", keyToNewIndexMap);
      let increasingSeq = getSequence(newIndexToOldIndex);
      // console.log("increasingSeq", increasingSeq);
      // console.log("newIndexToOldIndex", newIndexToOldIndex);

      // 调整顺序
      // 倒序比对每个元素，做插入操作
      let j = increasingSeq.length - 1;
      for (let i = len - 1; i >= 0; i--) {
        let newIndex = s2 + i;
        let vnode = c2[newIndex];
        let anchor = c2[newIndex + 1].el;
        // console.log("vnode.el", vnode.el);
        // console.log("anchor", anchor);

        if (!vnode.el) {
          // 如果当前虚拟节点没有el元素，说明是新增的，需要添加到anchor的前面
          patch(null, vnode, el, anchor);
        } else {
          // diff算法优化：顺序对的元素不做调整
          if (i === increasingSeq[j]) {
            j--;
          } else {
            // 调整元素位置，重新插入
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
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
          patchKeyedChildren(c1 as Array<Vnode>, c2 as Array<Vnode>, el);
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

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 如果n1为null，n2有值，需要将n2挂载到真实dom上
      mountElement(n2, container, anchor);
    } else {
      // 相同虚拟节点，需要比较元素的属性、children...
      patchElement(n1, n2, container);
    }
  };

  const patchText = (n1: Vnode, n2: Vnode, container) => {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children);
      hostInsert(n2.el, container);
    } else {
      let el = (n2.el = n1.el);
      hostSetText(el, n2.children);
    }
  };

  const patchFragment = (n1: Vnode, n2: Vnode, container) => {
    if (n1 === null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };

  const updateComponentPreRender = (
    instance: ComponentInstance,
    next: Vnode,
  ) => {
    instance.vnode = next;
    instance.next = null;
    updateProps(instance, instance.props, next.props);
  };

  const renderComponent = (instance: ComponentInstance) => {
    const { proxy, attrs, vnode, render } = instance;
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      return render.call(proxy, proxy);
    } else {
      console.log("vnode.type", vnode.type);
      // 函数式渲染
      return (vnode.type as Function).call(attrs, attrs);
    }
  };

  const setupRenderEffect = (instance: ComponentInstance, container) => {
    const { m, bm, u, bu } = instance;
    const componentUpdateFn = () => {
      if (instance.isMounted) {
        bu && runHooks(bu);
        // 组件更新
        const { next } = instance;
        // 如果有next，说明要更新属性或者插槽
        if (next) {
          updateComponentPreRender(instance, next);
        }

        const subTree = renderComponent(instance);
        patch(instance.subTree, subTree, container, null, instance);
        instance.subTree = subTree;
        u && runHooks(u);
      } else {
        bm && runHooks(bm);
        // 组件挂载
        const subTree = renderComponent(instance);
        patch(null, subTree, container, null, instance);
        instance.subTree = subTree;
        instance.isMounted = true;
        m && runHooks(m);
      }
    };

    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(update),
    );
    const update = (instance.update = () => {
      effect.run();
    });
    update();
  };

  const mountComponent = (
    vnode: Vnode,
    container,
    parentInstance: ComponentInstance,
  ) => {
    // 1.创建组件实例
    const instance = createComponentInstance(vnode, parentInstance);
    // 2.给组件实例赋值
    setupComponent(instance);
    // 3.绑定更新函数
    setupRenderEffect(instance, container);
  };

  const hasPropsChanged = (prevProps, nextProps) => {
    prevProps = prevProps || {};
    nextProps = nextProps || {};

    if (prevProps === nextProps) return false;

    const pKeys = Object.keys(prevProps);
    const nKeys = Object.keys(nextProps);

    if (nKeys.length !== pKeys.length) {
      return true;
    }
    for (let k of nKeys) {
      if (nextProps[k] !== prevProps[k]) {
        return true;
      }
    }
    return false;
  };

  const updateProps = (instance: ComponentInstance, prevProps, nextProps) => {
    if (hasPropsChanged(prevProps, nextProps)) {
      for (let k in nextProps) {
        instance.props[k] = nextProps[k];
      }
      for (let k in prevProps) {
        if (!(k in nextProps)) {
          delete instance.props[k];
        }
      }
    }
  };

  const shouldComponentUpdate = (n1: Vnode, n2: Vnode) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    return hasPropsChanged(prevProps, nextProps);
  };

  const updateComponent = (n1: Vnode, n2: Vnode) => {
    const instance = (n2.component = n1.component);

    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  };

  const processComponent = (
    n1: Vnode,
    n2: Vnode,
    container,
    anchor,
    parentInstance: ComponentInstance,
  ) => {
    // console.log("虚拟节点", n1, n2);

    if (n1 === null) {
      // 挂载组件
      mountComponent(n2, container, parentInstance);
    } else {
      updateComponent(n1, n2);
    }
  };

  const patch = (
    n1: Vnode,
    n2: Vnode,
    container,
    anchor: null | HTMLElement = null,
    parentInstance?: ComponentInstance,
  ) => {
    // 相同节点不做处理
    if (n1 === n2) return;

    // 如果两个节点不相同，删掉之前的，挂载最新的
    if (n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

    const { type, shapeFlag, ref } = n2;

    switch (type) {
      case Text:
        patchText(n1, n2, container);
        break;
      case Fragment:
        patchFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentInstance || null);
        }
    }

    setRef(ref, n2);
  };

  const setRef = (rawRef, vnode: Vnode) => {
    const { shapeFlag, el, component } = vnode;
    let value = null;
    if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // vnode是组件
      value = component?.exposed ? component.exposed : component.proxy;
    } else {
      // vnode是普通元素
      value = el;
    }
    if (isRef(rawRef)) {
      rawRef.value = value;
    }
  };

  const render = (vnode, container) => {
    // console.log(container._vnode);

    // 如果vnode为空，而且这个容器挂载过虚拟节点，那么移出元素
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      // 将虚拟节点渲染成真实节点
      patch(container._vnode || null, vnode, container);
      // 保存当前的虚拟节点
      container._vnode = vnode;
    }
  };

  return {
    render,
  };
}
