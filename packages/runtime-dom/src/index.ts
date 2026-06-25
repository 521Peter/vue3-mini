import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp";
import { createRender } from "@vue/runtime-core";

export const renderOptions = Object.assign({ patchProp }, nodeOps);
export const render = (vnode, container) => {
  return createRender(renderOptions).render(vnode, container);
};

export * from "@vue/reactivity";
export * from "@vue/runtime-core";
