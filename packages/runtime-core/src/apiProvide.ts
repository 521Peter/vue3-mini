import { currentInstance } from "./component";

export function provide(key: string, value: any) {
  if (!currentInstance) return;

  const parentProvides = currentInstance.parent?.provides || null;
  let curProvides = currentInstance.provides;
  // 如果当前组件的provides和父组件的一样,要深拷贝当前对象，避免操作同一份对象
  if (parentProvides === curProvides) {
    curProvides = currentInstance.provides = Object.create(parentProvides);
  }
  curProvides[key] = value;
}
export function inject(key: string, defaultValue: any) {
  if (!currentInstance) return;

  const provides = currentInstance.parent.provides;
  if (provide && key in provide) {
    return provides[key];
  } else {
    return defaultValue;
  }
}
