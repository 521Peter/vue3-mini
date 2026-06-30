import { ShapeFlags } from "./shapeFlags";

export function isObject(value) {
  return typeof value === "object" && value !== null;
}

export function isFunction(value) {
  return typeof value === "function";
}

export function isArray(value) {
  return Array.isArray(value);
}

export function isString(value) {
  return typeof value === "string";
}

export function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export { ShapeFlags };
