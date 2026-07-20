import { h } from "../h";

export function Transition(props, { slots }) {
  return h(BaseTransitionImpl, resolveTransitionProps(props), slots);
}

function nextFrame(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

function resolveTransitionProps(props) {
  const {
    name = "v",
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    LeaveToClass = `${name}-leave-to`,
    onBeforeEnter,
    onEnter,
    onLeave,
  } = props;

  return {
    onBeforeEnter(el: Element) {
      onBeforeEnter && onBeforeEnter(el);
      el.classList.add(enterFromClass);
      el.classList.add(enterActiveClass);
    },
    onEnter(el: Element, done: Function) {
      const resolve = () => {
        el.classList.remove(enterActiveClass);
        el.classList.remove(enterToClass);
        done && done();
      };
      onEnter && onEnter(el, resolve);

      // 下下帧去修改样式，确保有过渡效果
      nextFrame(() => {
        el.classList.remove(enterFromClass);
        el.classList.add(enterToClass);

        if (!onEnter || onEnter.length <= 1) {
          el.addEventListener("transitionend", resolve);
        }
      });
    },
    onLeave(el, done) {
      const resolve = () => {
        el.classList.remove(leaveActiveClass);
        el.classList.remove(LeaveToClass);
        done && done();
      };

      onLeave && onLeave(el, resolve);
      el.classList.add(leaveFromClass);
      document.body.offsetHeight;
      el.classList.add(leaveActiveClass);

      // 下下帧去修改样式，确保有过渡效果
      nextFrame(() => {
        el.classList.remove(leaveFromClass);
        el.classList.add(LeaveToClass);

        if (!onEnter || onEnter.length <= 1) {
          el.addEventListener("transitionend", resolve);
        }
      });
    },
  };
}

const BaseTransitionImpl = {
  props: {
    onBeforeEnter: Function,
    onEnter: Function,
    onLeave: Function,
  },
  setup(props, { slots }) {
    return () => {
      const vnode = slots.default && slots.default();
      if (!vnode) {
        return;
      }

      vnode.transition = {
        beforeEnter: props.onBeforeEnter,
        enter: props.onEnter,
        leave: props.onLeave,
      };

      return vnode;
    };
  },
};
