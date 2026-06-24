// 对节点元素的增删改查等
export const nodeOps = {
  insert(el: Element, parent: Element, anchor?: Element | null) {
    // 如果第三个参数不传，相当于简单的插入
    // 传了，表示将el插入到anchor的前面
    parent.insertBefore(el, anchor || null);
  },
  remove(el: Element) {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },
  createElement: (type) => document.createElement(type),
  createText: (text) => document.createTextNode(text),
  setText: (node: Element, text) => (node.nodeValue = text),
  setElementText: (el: Element, text) => (el.textContent = text),
  parentNode: (node: Element) => node.parentNode,
  nextSibling: (node: Element) => node.nextSibling,
};
