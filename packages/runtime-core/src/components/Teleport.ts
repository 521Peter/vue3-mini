import { ShapeFlags } from "@vue/shared";
import { ComponentInstance, Vnode } from "vue";

export const Teleport = {
  __isTeleport: true,
  process(
    n1: Vnode,
    n2: Vnode,
    container: Element,
    anchor,
    parentComponent: ComponentInstance,
    internals,
  ) {
    let { mountChildren, patchChildren, move } = internals;

    if (!n1) {
      const target = (n2.target = document.querySelector(n2.props.to));
      if (target) {
        mountChildren(n2.children, target);
      }
    } else {
      patchChildren(n1, n2, container);

      if (n2.props.to !== n1.props.to) {
        const newTarget = document.querySelector(n2.props.to);
        (n2.children as []).forEach((ch) => move(ch, newTarget));
      }
    }
  },
  remove(vnode: Vnode, unmountChildren) {
    unmountChildren(vnode.children);
  },
};

export function isTeleport(obj) {
  return Boolean(obj.__isTeleport);
}
