// 使用位运算的方式，确保组合的结果是唯一的，不会重复
export enum ShapeFlags {
  //对元素形状的判断
  ELEMENT = 1, // 1 (二进制: 0001)
  FUNCTIONAL_COMPONENT = 1 << 1, // 2 (0010)
  STATEFUL_COMPONENT = 1 << 2, // 4 (0100)
  TEXT_CHILDREN = 1 << 3, // 8 (1000)
  ARRAY_CHILDREN = 1 << 4, // 16 (0001 0000)
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
