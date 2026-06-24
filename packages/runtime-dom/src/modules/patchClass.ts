// class="btn primary"
export default function patchClass(el: Element, value) {
  // 如果没有值，说明要移除class了
  // 有值则更新
  if (value === null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}
