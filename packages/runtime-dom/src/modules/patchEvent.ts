function createCallback(invoker, newValue) {
  invoker = (e) => invoker.value(e);
  // 更改value属性，可以间接修改对应的调用函数
  invoker.value = newValue;
  return invoker;
}

// onClick = ()=>{}
export default function patchEvent(
  el: HTMLElement & Partial<{ _vei: Object }>,
  name: string,
  nextValue,
) {
  const eventName = name.slice(2).toLowerCase();
  // 给元素绑定一个属性来管理已经绑定的事件（vue_event_invoker）
  // {name1:特殊的函数,name2...} 函数里面有value属性，保存了真正要执行的函数
  const invokers = el._vei || (el._vei = {});
  // 是否存在同名的事件绑定
  const existingInvoker = invokers[name];

  if (existingInvoker && nextValue) {
    // 之前绑定过函数,且有新值，直接替换
    existingInvoker.value = nextValue;
  } else if (existingInvoker && !nextValue) {
    // 之前绑定过，现在没有，直接删除原来的,解绑事件
    el.removeEventListener(eventName, existingInvoker);
    invokers[name] = undefined;
  } else if (!existingInvoker && nextValue) {
    // 之前没绑定，现在有值了。绑定事件
    const callback = createCallback(existingInvoker, nextValue);
    invokers[name] = callback;
    el.addEventListener(eventName, callback);
  }
}
