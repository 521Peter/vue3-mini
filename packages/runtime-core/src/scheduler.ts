const queue = [];
let isFlushing = false;
const resolvePromise = Promise.resolve();

// 如果同时在一个组件中更新多个状态，job是同一个
export function queueJob(job) {
  // 去除重复任务
  if (!queue.includes(job)) {
    queue.push(job);
  }

  if (!isFlushing) {
    isFlushing = true;
    // 等到本轮同步代码执行完毕后，在微任务中统一执行一次渲染——避免不必要的重复渲染
    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach((job) => job());
      copy.length = 0;
    });
  }
}
