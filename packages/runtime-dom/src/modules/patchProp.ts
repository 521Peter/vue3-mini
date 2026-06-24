// { color: 'red', fontSize: '20px' } => { color: 'blue' }
export default function patchStyle(el: HTMLElement, prevValue, nextValue) {
  // 先更新或添加最新的style属性
  for (let k in nextValue) {
    el.style[k] = nextValue[k];
  }

  // 删除旧的不用的属性
  for (let k in prevValue) {
    if (nextValue[k] === null) {
      el.style[k] = null;
    }
  }
}
