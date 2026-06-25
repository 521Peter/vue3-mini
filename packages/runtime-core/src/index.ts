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

  // 将虚拟节点挂载到真实dom上
  const mountElement = (vnode, container: HTMLElement) => {
    const { type, props, children } = vnode;
    const ele = hostCreateElement(type);
    hostSetElementText(ele, children);
    for (let k in props) {
      hostPatchProp(ele, k, null, props[k]);
    }
    hostInsert(ele, container);
  };

  const patch = (n1, n2, container) => {
    // 相同节点不做处理
    if (n1 === n2) return;

    // 如果n1为null，说明是首次渲染，需要将传入的虚拟节点挂载到真实dom上
    if (n1 === null) {
      mountElement(n2, container);
    }
  };

  const render = (vnode, container) => {
    // 将虚拟节点渲染成真实节点
    patch(container._vnode || null, vnode, container);
    // 保存当前的虚拟节点
    container._vonde = vnode;
  };

  return {
    render,
  };
}
