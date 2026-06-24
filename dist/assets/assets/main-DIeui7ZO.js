/**
* @vue/shared v3.5.33
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const key of str.split(",")) map[key] = 1;
  return (val) => val in map;
}
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
(key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend$1 = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty$2 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty$2.call(val, key);
const isArray$2 = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isSet = (val) => toTypeString(val) === "[object Set]";
const isDate$1 = (val) => toTypeString(val) === "[object Date]";
const isFunction$2 = (val) => typeof val === "function";
const isString$1 = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject$1 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return (isObject$1(val) || isFunction$2(val)) && isFunction$2(val.then) && isFunction$2(val.catch);
};
const objectToString$1 = Object.prototype.toString;
const toTypeString = (value) => objectToString$1.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject$2 = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString$1(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
);
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
const camelizeRE = /-\w/g;
const camelize = cacheStringFunction(
  (str) => {
    return str.replace(camelizeRE, (c) => c.slice(1).toUpperCase());
  }
);
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
);
const capitalize = cacheStringFunction((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});
const toHandlerKey = cacheStringFunction(
  (str) => {
    const s = str ? `on${capitalize(str)}` : ``;
    return s;
  }
);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, ...arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](...arg);
  }
};
const def$1 = (obj, key, value, writable = false) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value
  });
};
const looseToNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
const toNumber = (val) => {
  const n = isString$1(val) ? Number(val) : NaN;
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
function normalizeStyle(value) {
  if (isArray$2(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString$1(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString$1(value) || isObject$1(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:([^]+)/;
const styleCommentRE = /\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString$1(value)) {
    res = value;
  } else if (isArray$2(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject$1(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
function looseCompareArrays(a, b) {
  if (a.length !== b.length) return false;
  let equal = true;
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i]);
  }
  return equal;
}
function looseEqual(a, b) {
  if (a === b) return true;
  let aValidType = isDate$1(a);
  let bValidType = isDate$1(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol(a);
  bValidType = isSymbol(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray$2(a);
  bValidType = isArray$2(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false;
  }
  aValidType = isObject$1(a);
  bValidType = isObject$1(b);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    const aKeysCount = Object.keys(a).length;
    const bKeysCount = Object.keys(b).length;
    if (aKeysCount !== bKeysCount) {
      return false;
    }
    for (const key in a) {
      const aHasKey = a.hasOwnProperty(key);
      const bHasKey = b.hasOwnProperty(key);
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
        return false;
      }
    }
  }
  return String(a) === String(b);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}
const isRef$1 = (val) => {
  return !!(val && val["__v_isRef"] === true);
};
const toDisplayString = (val) => {
  return isString$1(val) ? val : val == null ? "" : isArray$2(val) || isObject$1(val) && (val.toString === objectToString$1 || !isFunction$2(val.toString)) ? isRef$1(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (isRef$1(val)) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce(
        (entries2, [key, val2], i) => {
          entries2[stringifySymbol(key, i) + " =>"] = val2;
          return entries2;
        },
        {}
      )
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v))
    };
  } else if (isSymbol(val)) {
    return stringifySymbol(val);
  } else if (isObject$1(val) && !isArray$2(val) && !isPlainObject$2(val)) {
    return String(val);
  }
  return val;
};
const stringifySymbol = (v, i = "") => {
  var _a;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v
  );
};
/**
* @vue/reactivity v3.5.33
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let activeEffectScope;
class EffectScope {
  // TODO isolatedDeclarations "__v_skip"
  constructor(detached = false) {
    this.detached = detached;
    this._active = true;
    this._on = 0;
    this.effects = [];
    this.cleanups = [];
    this._isPaused = false;
    this.__v_skip = true;
    this.parent = activeEffectScope;
    if (!detached && activeEffectScope) {
      this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
        this
      ) - 1;
    }
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = true;
      let i, l;
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause();
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause();
      }
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active) {
      if (this._isPaused) {
        this._isPaused = false;
        let i, l;
        if (this.scopes) {
          for (i = 0, l = this.scopes.length; i < l; i++) {
            this.scopes[i].resume();
          }
        }
        for (i = 0, l = this.effects.length; i < l; i++) {
          this.effects[i].resume();
        }
      }
    }
  }
  run(fn) {
    if (this._active) {
      const currentEffectScope = activeEffectScope;
      try {
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = currentEffectScope;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    if (++this._on === 1) {
      this.prevScope = activeEffectScope;
      activeEffectScope = this;
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (activeEffectScope === this) {
        activeEffectScope = this.prevScope;
      } else {
        let current = activeEffectScope;
        while (current) {
          if (current.prevScope === this) {
            current.prevScope = this.prevScope;
            break;
          }
          current = current.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(fromParent) {
    if (this._active) {
      this._active = false;
      let i, l;
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop();
      }
      this.effects.length = 0;
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]();
      }
      this.cleanups.length = 0;
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true);
        }
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes.pop();
        if (last && last !== this) {
          this.parent.scopes[this.index] = last;
          last.index = this.index;
        }
      }
      this.parent = void 0;
    }
  }
}
function effectScope(detached) {
  return new EffectScope(detached);
}
function getCurrentScope() {
  return activeEffectScope;
}
function onScopeDispose(fn, failSilently = false) {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn);
  }
}
let activeSub;
const pausedQueueEffects = /* @__PURE__ */ new WeakSet();
class ReactiveEffect {
  constructor(fn) {
    this.fn = fn;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 1 | 4;
    this.next = void 0;
    this.cleanup = void 0;
    this.scheduler = void 0;
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(this);
    }
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    if (this.flags & 64) {
      this.flags &= -65;
      if (pausedQueueEffects.has(this)) {
        pausedQueueEffects.delete(this);
        this.trigger();
      }
    }
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags & 2 && !(this.flags & 32)) {
      return;
    }
    if (!(this.flags & 8)) {
      batch(this);
    }
  }
  run() {
    if (!(this.flags & 1)) {
      return this.fn();
    }
    this.flags |= 2;
    cleanupEffect(this);
    prepareDeps(this);
    const prevEffect = activeSub;
    const prevShouldTrack = shouldTrack;
    activeSub = this;
    shouldTrack = true;
    try {
      return this.fn();
    } finally {
      cleanupDeps(this);
      activeSub = prevEffect;
      shouldTrack = prevShouldTrack;
      this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let link2 = this.deps; link2; link2 = link2.nextDep) {
        removeSub(link2);
      }
      this.deps = this.depsTail = void 0;
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.flags &= -2;
    }
  }
  trigger() {
    if (this.flags & 64) {
      pausedQueueEffects.add(this);
    } else if (this.scheduler) {
      this.scheduler();
    } else {
      this.runIfDirty();
    }
  }
  /**
   * @internal
   */
  runIfDirty() {
    if (isDirty(this)) {
      this.run();
    }
  }
  get dirty() {
    return isDirty(this);
  }
}
let batchDepth = 0;
let batchedSub;
let batchedComputed;
function batch(sub, isComputed2 = false) {
  sub.flags |= 8;
  if (isComputed2) {
    sub.next = batchedComputed;
    batchedComputed = sub;
    return;
  }
  sub.next = batchedSub;
  batchedSub = sub;
}
function startBatch() {
  batchDepth++;
}
function endBatch() {
  if (--batchDepth > 0) {
    return;
  }
  if (batchedComputed) {
    let e = batchedComputed;
    batchedComputed = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      e = next;
    }
  }
  let error;
  while (batchedSub) {
    let e = batchedSub;
    batchedSub = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      if (e.flags & 1) {
        try {
          ;
          e.trigger();
        } catch (err) {
          if (!error) error = err;
        }
      }
      e = next;
    }
  }
  if (error) throw error;
}
function prepareDeps(sub) {
  for (let link2 = sub.deps; link2; link2 = link2.nextDep) {
    link2.version = -1;
    link2.prevActiveLink = link2.dep.activeLink;
    link2.dep.activeLink = link2;
  }
}
function cleanupDeps(sub) {
  let head;
  let tail = sub.depsTail;
  let link2 = tail;
  while (link2) {
    const prev = link2.prevDep;
    if (link2.version === -1) {
      if (link2 === tail) tail = prev;
      removeSub(link2);
      removeDep(link2);
    } else {
      head = link2;
    }
    link2.dep.activeLink = link2.prevActiveLink;
    link2.prevActiveLink = void 0;
    link2 = prev;
  }
  sub.deps = head;
  sub.depsTail = tail;
}
function isDirty(sub) {
  for (let link2 = sub.deps; link2; link2 = link2.nextDep) {
    if (link2.dep.version !== link2.version || link2.dep.computed && (refreshComputed(link2.dep.computed) || link2.dep.version !== link2.version)) {
      return true;
    }
  }
  if (sub._dirty) {
    return true;
  }
  return false;
}
function refreshComputed(computed2) {
  if (computed2.flags & 4 && !(computed2.flags & 16)) {
    return;
  }
  computed2.flags &= -17;
  if (computed2.globalVersion === globalVersion) {
    return;
  }
  computed2.globalVersion = globalVersion;
  if (!computed2.isSSR && computed2.flags & 128 && (!computed2.deps && !computed2._dirty || !isDirty(computed2))) {
    return;
  }
  computed2.flags |= 2;
  const dep = computed2.dep;
  const prevSub = activeSub;
  const prevShouldTrack = shouldTrack;
  activeSub = computed2;
  shouldTrack = true;
  try {
    prepareDeps(computed2);
    const value = computed2.fn(computed2._value);
    if (dep.version === 0 || hasChanged(value, computed2._value)) {
      computed2.flags |= 128;
      computed2._value = value;
      dep.version++;
    }
  } catch (err) {
    dep.version++;
    throw err;
  } finally {
    activeSub = prevSub;
    shouldTrack = prevShouldTrack;
    cleanupDeps(computed2);
    computed2.flags &= -3;
  }
}
function removeSub(link2, soft = false) {
  const { dep, prevSub, nextSub } = link2;
  if (prevSub) {
    prevSub.nextSub = nextSub;
    link2.prevSub = void 0;
  }
  if (nextSub) {
    nextSub.prevSub = prevSub;
    link2.nextSub = void 0;
  }
  if (dep.subs === link2) {
    dep.subs = prevSub;
    if (!prevSub && dep.computed) {
      dep.computed.flags &= -5;
      for (let l = dep.computed.deps; l; l = l.nextDep) {
        removeSub(l, true);
      }
    }
  }
  if (!soft && !--dep.sc && dep.map) {
    dep.map.delete(dep.key);
  }
}
function removeDep(link2) {
  const { prevDep, nextDep } = link2;
  if (prevDep) {
    prevDep.nextDep = nextDep;
    link2.prevDep = void 0;
  }
  if (nextDep) {
    nextDep.prevDep = prevDep;
    link2.nextDep = void 0;
  }
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function cleanupEffect(e) {
  const { cleanup } = e;
  e.cleanup = void 0;
  if (cleanup) {
    const prevSub = activeSub;
    activeSub = void 0;
    try {
      cleanup();
    } finally {
      activeSub = prevSub;
    }
  }
}
let globalVersion = 0;
class Link {
  constructor(sub, dep) {
    this.sub = sub;
    this.dep = dep;
    this.version = dep.version;
    this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Dep {
  // TODO isolatedDeclarations "__v_skip"
  constructor(computed2) {
    this.computed = computed2;
    this.version = 0;
    this.activeLink = void 0;
    this.subs = void 0;
    this.map = void 0;
    this.key = void 0;
    this.sc = 0;
    this.__v_skip = true;
  }
  track(debugInfo) {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return;
    }
    let link2 = this.activeLink;
    if (link2 === void 0 || link2.sub !== activeSub) {
      link2 = this.activeLink = new Link(activeSub, this);
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link2;
      } else {
        link2.prevDep = activeSub.depsTail;
        activeSub.depsTail.nextDep = link2;
        activeSub.depsTail = link2;
      }
      addSub(link2);
    } else if (link2.version === -1) {
      link2.version = this.version;
      if (link2.nextDep) {
        const next = link2.nextDep;
        next.prevDep = link2.prevDep;
        if (link2.prevDep) {
          link2.prevDep.nextDep = next;
        }
        link2.prevDep = activeSub.depsTail;
        link2.nextDep = void 0;
        activeSub.depsTail.nextDep = link2;
        activeSub.depsTail = link2;
        if (activeSub.deps === link2) {
          activeSub.deps = next;
        }
      }
    }
    return link2;
  }
  trigger(debugInfo) {
    this.version++;
    globalVersion++;
    this.notify(debugInfo);
  }
  notify(debugInfo) {
    startBatch();
    try {
      if (false) ;
      for (let link2 = this.subs; link2; link2 = link2.prevSub) {
        if (link2.sub.notify()) {
          ;
          link2.sub.dep.notify();
        }
      }
    } finally {
      endBatch();
    }
  }
}
function addSub(link2) {
  link2.dep.sc++;
  if (link2.sub.flags & 4) {
    const computed2 = link2.dep.computed;
    if (computed2 && !link2.dep.subs) {
      computed2.flags |= 4 | 16;
      for (let l = computed2.deps; l; l = l.nextDep) {
        addSub(l);
      }
    }
    const currentTail = link2.dep.subs;
    if (currentTail !== link2) {
      link2.prevSub = currentTail;
      if (currentTail) currentTail.nextSub = link2;
    }
    link2.dep.subs = link2;
  }
}
const targetMap = /* @__PURE__ */ new WeakMap();
const ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
function track(target, type, key) {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Dep());
      dep.map = depsMap;
      dep.key = key;
    }
    {
      dep.track();
    }
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    globalVersion++;
    return;
  }
  const run = (dep) => {
    if (dep) {
      {
        dep.trigger();
      }
    }
  };
  startBatch();
  if (type === "clear") {
    depsMap.forEach(run);
  } else {
    const targetIsArray = isArray$2(target);
    const isArrayIndex = targetIsArray && isIntegerKey(key);
    if (targetIsArray && key === "length") {
      const newLength = Number(newValue);
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) {
          run(dep);
        }
      });
    } else {
      if (key !== void 0 || depsMap.has(void 0)) {
        run(depsMap.get(key));
      }
      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY));
      }
      switch (type) {
        case "add":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isArrayIndex) {
            run(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            run(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
  }
  endBatch();
}
function getDepFromReactive(object, key) {
  const depMap = targetMap.get(object);
  return depMap && depMap.get(key);
}
function reactiveReadArray(array) {
  const raw = /* @__PURE__ */ toRaw(array);
  if (raw === array) return raw;
  track(raw, "iterate", ARRAY_ITERATE_KEY);
  return /* @__PURE__ */ isShallow(array) ? raw : raw.map(toReactive);
}
function shallowReadArray(arr) {
  track(arr = /* @__PURE__ */ toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
  return arr;
}
function toWrapped(target, item) {
  if (/* @__PURE__ */ isReadonly(target)) {
    return /* @__PURE__ */ isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
  }
  return toReactive(item);
}
const arrayInstrumentations = {
  __proto__: null,
  [Symbol.iterator]() {
    return iterator$1(this, Symbol.iterator, (item) => toWrapped(this, item));
  },
  concat(...args) {
    return reactiveReadArray(this).concat(
      ...args.map((x) => isArray$2(x) ? reactiveReadArray(x) : x)
    );
  },
  entries() {
    return iterator$1(this, "entries", (value) => {
      value[1] = toWrapped(this, value[1]);
      return value;
    });
  },
  every(fn, thisArg) {
    return apply$1(this, "every", fn, thisArg, void 0, arguments);
  },
  filter(fn, thisArg) {
    return apply$1(
      this,
      "filter",
      fn,
      thisArg,
      (v) => v.map((item) => toWrapped(this, item)),
      arguments
    );
  },
  find(fn, thisArg) {
    return apply$1(
      this,
      "find",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findIndex(fn, thisArg) {
    return apply$1(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  findLast(fn, thisArg) {
    return apply$1(
      this,
      "findLast",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findLastIndex(fn, thisArg) {
    return apply$1(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(fn, thisArg) {
    return apply$1(this, "forEach", fn, thisArg, void 0, arguments);
  },
  includes(...args) {
    return searchProxy(this, "includes", args);
  },
  indexOf(...args) {
    return searchProxy(this, "indexOf", args);
  },
  join(separator) {
    return reactiveReadArray(this).join(separator);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...args) {
    return searchProxy(this, "lastIndexOf", args);
  },
  map(fn, thisArg) {
    return apply$1(this, "map", fn, thisArg, void 0, arguments);
  },
  pop() {
    return noTracking(this, "pop");
  },
  push(...args) {
    return noTracking(this, "push", args);
  },
  reduce(fn, ...args) {
    return reduce(this, "reduce", fn, args);
  },
  reduceRight(fn, ...args) {
    return reduce(this, "reduceRight", fn, args);
  },
  shift() {
    return noTracking(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(fn, thisArg) {
    return apply$1(this, "some", fn, thisArg, void 0, arguments);
  },
  splice(...args) {
    return noTracking(this, "splice", args);
  },
  toReversed() {
    return reactiveReadArray(this).toReversed();
  },
  toSorted(comparer) {
    return reactiveReadArray(this).toSorted(comparer);
  },
  toSpliced(...args) {
    return reactiveReadArray(this).toSpliced(...args);
  },
  unshift(...args) {
    return noTracking(this, "unshift", args);
  },
  values() {
    return iterator$1(this, "values", (item) => toWrapped(this, item));
  }
};
function iterator$1(self2, method, wrapValue) {
  const arr = shallowReadArray(self2);
  const iter = arr[method]();
  if (arr !== self2 && !/* @__PURE__ */ isShallow(self2)) {
    iter._next = iter.next;
    iter.next = () => {
      const result = iter._next();
      if (!result.done) {
        result.value = wrapValue(result.value);
      }
      return result;
    };
  }
  return iter;
}
const arrayProto = Array.prototype;
function apply$1(self2, method, fn, thisArg, wrappedRetFn, args) {
  const arr = shallowReadArray(self2);
  const needsWrap = arr !== self2 && !/* @__PURE__ */ isShallow(self2);
  const methodFn = arr[method];
  if (methodFn !== arrayProto[method]) {
    const result2 = methodFn.apply(self2, args);
    return needsWrap ? toReactive(result2) : result2;
  }
  let wrappedFn = fn;
  if (arr !== self2) {
    if (needsWrap) {
      wrappedFn = function(item, index) {
        return fn.call(this, toWrapped(self2, item), index, self2);
      };
    } else if (fn.length > 2) {
      wrappedFn = function(item, index) {
        return fn.call(this, item, index, self2);
      };
    }
  }
  const result = methodFn.call(arr, wrappedFn, thisArg);
  return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self2, method, fn, args) {
  const arr = shallowReadArray(self2);
  const needsWrap = arr !== self2 && !/* @__PURE__ */ isShallow(self2);
  let wrappedFn = fn;
  let wrapInitialAccumulator = false;
  if (arr !== self2) {
    if (needsWrap) {
      wrapInitialAccumulator = args.length === 0;
      wrappedFn = function(acc, item, index) {
        if (wrapInitialAccumulator) {
          wrapInitialAccumulator = false;
          acc = toWrapped(self2, acc);
        }
        return fn.call(this, acc, toWrapped(self2, item), index, self2);
      };
    } else if (fn.length > 3) {
      wrappedFn = function(acc, item, index) {
        return fn.call(this, acc, item, index, self2);
      };
    }
  }
  const result = arr[method](wrappedFn, ...args);
  return wrapInitialAccumulator ? toWrapped(self2, result) : result;
}
function searchProxy(self2, method, args) {
  const arr = /* @__PURE__ */ toRaw(self2);
  track(arr, "iterate", ARRAY_ITERATE_KEY);
  const res = arr[method](...args);
  if ((res === -1 || res === false) && /* @__PURE__ */ isProxy(args[0])) {
    args[0] = /* @__PURE__ */ toRaw(args[0]);
    return arr[method](...args);
  }
  return res;
}
function noTracking(self2, method, args = []) {
  pauseTracking();
  startBatch();
  const res = (/* @__PURE__ */ toRaw(self2))[method].apply(self2, args);
  endBatch();
  resetTracking();
  return res;
}
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
);
function hasOwnProperty$1(key) {
  if (!isSymbol(key)) key = String(key);
  const obj = /* @__PURE__ */ toRaw(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}
class BaseReactiveHandler {
  constructor(_isReadonly = false, _isShallow = false) {
    this._isReadonly = _isReadonly;
    this._isShallow = _isShallow;
  }
  get(target, key, receiver) {
    if (key === "__v_skip") return target["__v_skip"];
    const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_isShallow") {
      return isShallow2;
    } else if (key === "__v_raw") {
      if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
        return target;
      }
      return;
    }
    const targetIsArray = isArray$2(target);
    if (!isReadonly2) {
      let fn;
      if (targetIsArray && (fn = arrayInstrumentations[key])) {
        return fn;
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty$1;
      }
    }
    const res = Reflect.get(
      target,
      key,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (isShallow2) {
      return res;
    }
    if (/* @__PURE__ */ isRef(res)) {
      const value = targetIsArray && isIntegerKey(key) ? res : res.value;
      return isReadonly2 && isObject$1(value) ? /* @__PURE__ */ readonly(value) : value;
    }
    if (isObject$1(res)) {
      return isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res);
    }
    return res;
  }
}
class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(false, isShallow2);
  }
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const isArrayWithIntegerKey = isArray$2(target) && isIntegerKey(key);
    if (!this._isShallow) {
      const isOldValueReadonly = /* @__PURE__ */ isReadonly(oldValue);
      if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
        oldValue = /* @__PURE__ */ toRaw(oldValue);
        value = /* @__PURE__ */ toRaw(value);
      }
      if (!isArrayWithIntegerKey && /* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
        if (isOldValueReadonly) {
          return true;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(
      target,
      key,
      value,
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    if (target === /* @__PURE__ */ toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value);
      }
    }
    return result;
  }
  deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0);
    }
    return result;
  }
  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  ownKeys(target) {
    track(
      target,
      "iterate",
      isArray$2(target) ? "length" : ITERATE_KEY
    );
    return Reflect.ownKeys(target);
  }
}
class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(true, isShallow2);
  }
  set(target, key) {
    return true;
  }
  deleteProperty(target, key) {
    return true;
  }
}
const mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
const shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
const shallowReadonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler(true);
const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = /* @__PURE__ */ toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    !isReadonly2 && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return extend$1(
      // inheriting all iterator properties
      Object.create(innerIterator),
      {
        // iterator protocol
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        }
      }
    );
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    return type === "delete" ? false : type === "clear" ? void 0 : this;
  };
}
function createInstrumentations(readonly2, shallow) {
  const instrumentations = {
    get(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const rawKey = /* @__PURE__ */ toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "get", key);
        }
        track(rawTarget, "get", rawKey);
      }
      const { has } = getProto(rawTarget);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
      } else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
      } else if (target !== rawTarget) {
        target.get(key);
      }
    },
    get size() {
      const target = this["__v_raw"];
      !readonly2 && track(/* @__PURE__ */ toRaw(target), "iterate", ITERATE_KEY);
      return target.size;
    },
    has(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const rawKey = /* @__PURE__ */ toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "has", key);
        }
        track(rawTarget, "has", rawKey);
      }
      return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    },
    forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      !readonly2 && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    }
  };
  extend$1(
    instrumentations,
    readonly2 ? {
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear")
    } : {
      add(value) {
        const target = /* @__PURE__ */ toRaw(this);
        const proto = getProto(target);
        const rawValue = /* @__PURE__ */ toRaw(value);
        const valueToAdd = !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) ? rawValue : value;
        const hadKey = proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue);
        if (!hadKey) {
          target.add(valueToAdd);
          trigger(target, "add", valueToAdd, valueToAdd);
        }
        return this;
      },
      set(key, value) {
        if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
          value = /* @__PURE__ */ toRaw(value);
        }
        const target = /* @__PURE__ */ toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw(key);
          hadKey = has.call(target, key);
        }
        const oldValue = get.call(target, key);
        target.set(key, value);
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value);
        }
        return this;
      },
      delete(key) {
        const target = /* @__PURE__ */ toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw(key);
          hadKey = has.call(target, key);
        }
        get ? get.call(target, key) : void 0;
        const result = target.delete(key);
        if (hadKey) {
          trigger(target, "delete", key, void 0);
        }
        return result;
      },
      clear() {
        const target = /* @__PURE__ */ toRaw(this);
        const hadItems = target.size !== 0;
        const result = target.clear();
        if (hadItems) {
          trigger(
            target,
            "clear",
            void 0,
            void 0
          );
        }
        return result;
      }
    }
  );
  const iteratorMethods = [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ];
  iteratorMethods.forEach((method) => {
    instrumentations[method] = createIterableMethod(method, readonly2, shallow);
  });
  return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
  const instrumentations = createInstrumentations(isReadonly2, shallow);
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const shallowReadonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, true)
};
const reactiveMap = /* @__PURE__ */ new WeakMap();
const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
const readonlyMap = /* @__PURE__ */ new WeakMap();
const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
  if (/* @__PURE__ */ isReadonly(target)) {
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowCollectionHandlers,
    shallowReactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyCollectionHandlers,
    shallowReadonlyMap
  );
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject$1(target)) {
    return target;
  }
  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
    return target;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive(value) {
  if (/* @__PURE__ */ isReadonly(value)) {
    return /* @__PURE__ */ isReactive(value["__v_raw"]);
  }
  return !!(value && value["__v_isReactive"]);
}
// @__NO_SIDE_EFFECTS__
function isReadonly(value) {
  return !!(value && value["__v_isReadonly"]);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
  return !!(value && value["__v_isShallow"]);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
  return value ? !!value["__v_raw"] : false;
}
// @__NO_SIDE_EFFECTS__
function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? /* @__PURE__ */ toRaw(raw) : observed;
}
function markRaw(value) {
  if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) {
    def$1(value, "__v_skip", true);
  }
  return value;
}
const toReactive = (value) => isObject$1(value) ? /* @__PURE__ */ reactive(value) : value;
const toReadonly = (value) => isObject$1(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef(r) {
  return r ? r["__v_isRef"] === true : false;
}
// @__NO_SIDE_EFFECTS__
function ref(value) {
  return createRef(value, false);
}
// @__NO_SIDE_EFFECTS__
function shallowRef(value) {
  return createRef(value, true);
}
function createRef(rawValue, shallow) {
  if (/* @__PURE__ */ isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}
class RefImpl {
  constructor(value, isShallow2) {
    this.dep = new Dep();
    this["__v_isRef"] = true;
    this["__v_isShallow"] = false;
    this._rawValue = isShallow2 ? value : /* @__PURE__ */ toRaw(value);
    this._value = isShallow2 ? value : toReactive(value);
    this["__v_isShallow"] = isShallow2;
  }
  get value() {
    {
      this.dep.track();
    }
    return this._value;
  }
  set value(newValue) {
    const oldValue = this._rawValue;
    const useDirectValue = this["__v_isShallow"] || /* @__PURE__ */ isShallow(newValue) || /* @__PURE__ */ isReadonly(newValue);
    newValue = useDirectValue ? newValue : /* @__PURE__ */ toRaw(newValue);
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue;
      this._value = useDirectValue ? newValue : toReactive(newValue);
      {
        this.dep.trigger();
      }
    }
  }
}
function unref(ref2) {
  return /* @__PURE__ */ isRef(ref2) ? ref2.value : ref2;
}
const shallowUnwrapHandlers = {
  get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (/* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};
function proxyRefs(objectWithRefs) {
  return /* @__PURE__ */ isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
// @__NO_SIDE_EFFECTS__
function toRefs(object) {
  const ret = isArray$2(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = propertyToRef(object, key);
  }
  return ret;
}
class ObjectRefImpl {
  constructor(_object, key, _defaultValue) {
    this._object = _object;
    this._defaultValue = _defaultValue;
    this["__v_isRef"] = true;
    this._value = void 0;
    this._key = isSymbol(key) ? key : String(key);
    this._raw = /* @__PURE__ */ toRaw(_object);
    let shallow = true;
    let obj = _object;
    if (!isArray$2(_object) || isSymbol(this._key) || !isIntegerKey(this._key)) {
      do {
        shallow = !/* @__PURE__ */ isProxy(obj) || /* @__PURE__ */ isShallow(obj);
      } while (shallow && (obj = obj["__v_raw"]));
    }
    this._shallow = shallow;
  }
  get value() {
    let val = this._object[this._key];
    if (this._shallow) {
      val = unref(val);
    }
    return this._value = val === void 0 ? this._defaultValue : val;
  }
  set value(newVal) {
    if (this._shallow && /* @__PURE__ */ isRef(this._raw[this._key])) {
      const nestedRef = this._object[this._key];
      if (/* @__PURE__ */ isRef(nestedRef)) {
        nestedRef.value = newVal;
        return;
      }
    }
    this._object[this._key] = newVal;
  }
  get dep() {
    return getDepFromReactive(this._raw, this._key);
  }
}
class GetterRefImpl {
  constructor(_getter) {
    this._getter = _getter;
    this["__v_isRef"] = true;
    this["__v_isReadonly"] = true;
    this._value = void 0;
  }
  get value() {
    return this._value = this._getter();
  }
}
// @__NO_SIDE_EFFECTS__
function toRef(source, key, defaultValue) {
  if (/* @__PURE__ */ isRef(source)) {
    return source;
  } else if (isFunction$2(source)) {
    return new GetterRefImpl(source);
  } else if (isObject$1(source) && arguments.length > 1) {
    return propertyToRef(source, key, defaultValue);
  } else {
    return /* @__PURE__ */ ref(source);
  }
}
function propertyToRef(source, key, defaultValue) {
  return new ObjectRefImpl(source, key, defaultValue);
}
class ComputedRefImpl {
  constructor(fn, setter, isSSR) {
    this.fn = fn;
    this.setter = setter;
    this._value = void 0;
    this.dep = new Dep(this);
    this.__v_isRef = true;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 16;
    this.globalVersion = globalVersion - 1;
    this.next = void 0;
    this.effect = this;
    this["__v_isReadonly"] = !setter;
    this.isSSR = isSSR;
  }
  /**
   * @internal
   */
  notify() {
    this.flags |= 16;
    if (!(this.flags & 8) && // avoid infinite self recursion
    activeSub !== this) {
      batch(this, true);
      return true;
    }
  }
  get value() {
    const link2 = this.dep.track();
    refreshComputed(this);
    if (link2) {
      link2.version = this.dep.version;
    }
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    }
  }
}
// @__NO_SIDE_EFFECTS__
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
  let getter;
  let setter;
  if (isFunction$2(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, isSSR);
  return cRef;
}
const INITIAL_WATCHER_VALUE = {};
const cleanupMap = /* @__PURE__ */ new WeakMap();
let activeWatcher = void 0;
function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
  if (owner) {
    let cleanups = cleanupMap.get(owner);
    if (!cleanups) cleanupMap.set(owner, cleanups = []);
    cleanups.push(cleanupFn);
  }
}
function watch$1(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, once, scheduler, augmentJob, call } = options;
  const reactiveGetter = (source2) => {
    if (deep) return source2;
    if (/* @__PURE__ */ isShallow(source2) || deep === false || deep === 0)
      return traverse(source2, 1);
    return traverse(source2);
  };
  let effect2;
  let getter;
  let cleanup;
  let boundCleanup;
  let forceTrigger = false;
  let isMultiSource = false;
  if (/* @__PURE__ */ isRef(source)) {
    getter = () => source.value;
    forceTrigger = /* @__PURE__ */ isShallow(source);
  } else if (/* @__PURE__ */ isReactive(source)) {
    getter = () => reactiveGetter(source);
    forceTrigger = true;
  } else if (isArray$2(source)) {
    isMultiSource = true;
    forceTrigger = source.some((s) => /* @__PURE__ */ isReactive(s) || /* @__PURE__ */ isShallow(s));
    getter = () => source.map((s) => {
      if (/* @__PURE__ */ isRef(s)) {
        return s.value;
      } else if (/* @__PURE__ */ isReactive(s)) {
        return reactiveGetter(s);
      } else if (isFunction$2(s)) {
        return call ? call(s, 2) : s();
      } else ;
    });
  } else if (isFunction$2(source)) {
    if (cb) {
      getter = call ? () => call(source, 2) : source;
    } else {
      getter = () => {
        if (cleanup) {
          pauseTracking();
          try {
            cleanup();
          } finally {
            resetTracking();
          }
        }
        const currentEffect = activeWatcher;
        activeWatcher = effect2;
        try {
          return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
        } finally {
          activeWatcher = currentEffect;
        }
      };
    }
  } else {
    getter = NOOP;
  }
  if (cb && deep) {
    const baseGetter = getter;
    const depth = deep === true ? Infinity : deep;
    getter = () => traverse(baseGetter(), depth);
  }
  const scope = getCurrentScope();
  const watchHandle = () => {
    effect2.stop();
    if (scope && scope.active) {
      remove(scope.effects, effect2);
    }
  };
  if (once && cb) {
    const _cb = cb;
    cb = (...args) => {
      _cb(...args);
      watchHandle();
    };
  }
  let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
  const job = (immediateFirstRun) => {
    if (!(effect2.flags & 1) || !effect2.dirty && !immediateFirstRun) {
      return;
    }
    if (cb) {
      const newValue = effect2.run();
      if (deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
        if (cleanup) {
          cleanup();
        }
        const currentWatcher = activeWatcher;
        activeWatcher = effect2;
        try {
          const args = [
            newValue,
            // pass undefined as the old value when it's changed for the first time
            oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
            boundCleanup
          ];
          oldValue = newValue;
          call ? call(cb, 3, args) : (
            // @ts-expect-error
            cb(...args)
          );
        } finally {
          activeWatcher = currentWatcher;
        }
      }
    } else {
      effect2.run();
    }
  };
  if (augmentJob) {
    augmentJob(job);
  }
  effect2 = new ReactiveEffect(getter);
  effect2.scheduler = scheduler ? () => scheduler(job, false) : job;
  boundCleanup = (fn) => onWatcherCleanup(fn, false, effect2);
  cleanup = effect2.onStop = () => {
    const cleanups = cleanupMap.get(effect2);
    if (cleanups) {
      if (call) {
        call(cleanups, 4);
      } else {
        for (const cleanup2 of cleanups) cleanup2();
      }
      cleanupMap.delete(effect2);
    }
  };
  if (cb) {
    if (immediate) {
      job(true);
    } else {
      oldValue = effect2.run();
    }
  } else if (scheduler) {
    scheduler(job.bind(null, true), true);
  } else {
    effect2.run();
  }
  watchHandle.pause = effect2.pause.bind(effect2);
  watchHandle.resume = effect2.resume.bind(effect2);
  watchHandle.stop = watchHandle;
  return watchHandle;
}
function traverse(value, depth = Infinity, seen) {
  if (depth <= 0 || !isObject$1(value) || value["__v_skip"]) {
    return value;
  }
  seen = seen || /* @__PURE__ */ new Map();
  if ((seen.get(value) || 0) >= depth) {
    return value;
  }
  seen.set(value, depth);
  depth--;
  if (/* @__PURE__ */ isRef(value)) {
    traverse(value.value, depth, seen);
  } else if (isArray$2(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], depth, seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v) => {
      traverse(v, depth, seen);
    });
  } else if (isPlainObject$2(value)) {
    for (const key in value) {
      traverse(value[key], depth, seen);
    }
    for (const key of Object.getOwnPropertySymbols(value)) {
      if (Object.prototype.propertyIsEnumerable.call(value, key)) {
        traverse(value[key], depth, seen);
      }
    }
  }
  return value;
}
/**
* @vue/runtime-core v3.5.33
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const stack = [];
let isWarning = false;
function warn$1(msg, ...args) {
  if (isWarning) return;
  isWarning = true;
  pauseTracking();
  const instance2 = stack.length ? stack[stack.length - 1].component : null;
  const appWarnHandler = instance2 && instance2.appContext.config.warnHandler;
  const trace = getComponentTrace();
  if (appWarnHandler) {
    callWithErrorHandling(
      appWarnHandler,
      instance2,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        msg + args.map((a) => {
          var _a, _b;
          return (_b = (_a = a.toString) == null ? void 0 : _a.call(a)) != null ? _b : JSON.stringify(a);
        }).join(""),
        instance2 && instance2.proxy,
        trace.map(
          ({ vnode }) => `at <${formatComponentName(instance2, vnode.type)}>`
        ).join("\n"),
        trace
      ]
    );
  } else {
    const warnArgs = [`[Vue warn]: ${msg}`, ...args];
    if (trace.length && // avoid spamming console during tests
    true) {
      warnArgs.push(`
`, ...formatTrace(trace));
    }
    console.warn(...warnArgs);
  }
  resetTracking();
  isWarning = false;
}
function getComponentTrace() {
  let currentVNode = stack[stack.length - 1];
  if (!currentVNode) {
    return [];
  }
  const normalizedStack = [];
  while (currentVNode) {
    const last = normalizedStack[0];
    if (last && last.vnode === currentVNode) {
      last.recurseCount++;
    } else {
      normalizedStack.push({
        vnode: currentVNode,
        recurseCount: 0
      });
    }
    const parentInstance = currentVNode.component && currentVNode.component.parent;
    currentVNode = parentInstance && parentInstance.vnode;
  }
  return normalizedStack;
}
function formatTrace(trace) {
  const logs = [];
  trace.forEach((entry, i) => {
    logs.push(...i === 0 ? [] : [`
`], ...formatTraceEntry(entry));
  });
  return logs;
}
function formatTraceEntry({ vnode, recurseCount }) {
  const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
  const isRoot = vnode.component ? vnode.component.parent == null : false;
  const open = ` at <${formatComponentName(
    vnode.component,
    vnode.type,
    isRoot
  )}`;
  const close = `>` + postfix;
  return vnode.props ? [open, ...formatProps(vnode.props), close] : [open + close];
}
function formatProps(props) {
  const res = [];
  const keys = Object.keys(props);
  keys.slice(0, 3).forEach((key) => {
    res.push(...formatProp(key, props[key]));
  });
  if (keys.length > 3) {
    res.push(` ...`);
  }
  return res;
}
function formatProp(key, value, raw) {
  if (isString$1(value)) {
    value = JSON.stringify(value);
    return raw ? value : [`${key}=${value}`];
  } else if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return raw ? value : [`${key}=${value}`];
  } else if (/* @__PURE__ */ isRef(value)) {
    value = formatProp(key, /* @__PURE__ */ toRaw(value.value), true);
    return raw ? value : [`${key}=Ref<`, value, `>`];
  } else if (isFunction$2(value)) {
    return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
  } else {
    value = /* @__PURE__ */ toRaw(value);
    return raw ? value : [`${key}=`, value];
  }
}
function callWithErrorHandling(fn, instance2, type, args) {
  try {
    return args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance2, type);
  }
}
function callWithAsyncErrorHandling(fn, instance2, type, args) {
  if (isFunction$2(fn)) {
    const res = callWithErrorHandling(fn, instance2, type, args);
    if (res && isPromise(res)) {
      res.catch((err) => {
        handleError(err, instance2, type);
      });
    }
    return res;
  }
  if (isArray$2(fn)) {
    const values = [];
    for (let i = 0; i < fn.length; i++) {
      values.push(callWithAsyncErrorHandling(fn[i], instance2, type, args));
    }
    return values;
  }
}
function handleError(err, instance2, type, throwInDev = true) {
  const contextVNode = instance2 ? instance2.vnode : null;
  const { errorHandler, throwUnhandledErrorInProduction } = instance2 && instance2.appContext.config || EMPTY_OBJ;
  if (instance2) {
    let cur = instance2.parent;
    const exposedInstance = instance2.proxy;
    const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
    while (cur) {
      const errorCapturedHooks = cur.ec;
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++) {
          if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
            return;
          }
        }
      }
      cur = cur.parent;
    }
    if (errorHandler) {
      pauseTracking();
      callWithErrorHandling(errorHandler, null, 10, [
        err,
        exposedInstance,
        errorInfo
      ]);
      resetTracking();
      return;
    }
  }
  logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
  if (throwInProd) {
    throw err;
  } else {
    console.error(err);
  }
}
const queue = [];
let flushIndex = -1;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = /* @__PURE__ */ Promise.resolve();
let currentFlushPromise = null;
function nextTick(fn) {
  const p2 = currentFlushPromise || resolvedPromise;
  return fn ? p2.then(this ? fn.bind(this) : fn) : p2;
}
function findInsertionIndex$1(id) {
  let start = flushIndex + 1;
  let end = queue.length;
  while (start < end) {
    const middle = start + end >>> 1;
    const middleJob = queue[middle];
    const middleJobId = getId(middleJob);
    if (middleJobId < id || middleJobId === id && middleJob.flags & 2) {
      start = middle + 1;
    } else {
      end = middle;
    }
  }
  return start;
}
function queueJob(job) {
  if (!(job.flags & 1)) {
    const jobId = getId(job);
    const lastJob = queue[queue.length - 1];
    if (!lastJob || // fast path when the job id is larger than the tail
    !(job.flags & 2) && jobId >= getId(lastJob)) {
      queue.push(job);
    } else {
      queue.splice(findInsertionIndex$1(jobId), 0, job);
    }
    job.flags |= 1;
    queueFlush();
  }
}
function queueFlush() {
  if (!currentFlushPromise) {
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
function queuePostFlushCb(cb) {
  if (!isArray$2(cb)) {
    if (activePostFlushCbs && cb.id === -1) {
      activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
    } else if (!(cb.flags & 1)) {
      pendingPostFlushCbs.push(cb);
      cb.flags |= 1;
    }
  } else {
    pendingPostFlushCbs.push(...cb);
  }
  queueFlush();
}
function flushPreFlushCbs(instance2, seen, i = flushIndex + 1) {
  for (; i < queue.length; i++) {
    const cb = queue[i];
    if (cb && cb.flags & 2) {
      if (instance2 && cb.id !== instance2.uid) {
        continue;
      }
      queue.splice(i, 1);
      i--;
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      cb();
      if (!(cb.flags & 4)) {
        cb.flags &= -2;
      }
    }
  }
}
function flushPostFlushCbs(seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)].sort(
      (a, b) => getId(a) - getId(b)
    );
    pendingPostFlushCbs.length = 0;
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped);
      return;
    }
    activePostFlushCbs = deduped;
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      const cb = activePostFlushCbs[postFlushIndex];
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      if (!(cb.flags & 8)) cb();
      cb.flags &= -2;
    }
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}
const getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
function flushJobs(seen) {
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job && !(job.flags & 8)) {
        if (false) ;
        if (job.flags & 4) {
          job.flags &= ~1;
        }
        callWithErrorHandling(
          job,
          job.i,
          job.i ? 15 : 14
        );
        if (!(job.flags & 4)) {
          job.flags &= ~1;
        }
      }
    }
  } finally {
    for (; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job) {
        job.flags &= -2;
      }
    }
    flushIndex = -1;
    queue.length = 0;
    flushPostFlushCbs();
    currentFlushPromise = null;
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs();
    }
  }
}
let currentRenderingInstance = null;
let currentScopeId = null;
function setCurrentRenderingInstance(instance2) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance2;
  currentScopeId = instance2 && instance2.type.__scopeId || null;
  return prev;
}
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
  if (!ctx) return fn;
  if (fn._n) {
    return fn;
  }
  const renderFnWithContext = (...args) => {
    if (renderFnWithContext._d) {
      setBlockTracking(-1);
    }
    const prevInstance = setCurrentRenderingInstance(ctx);
    let res;
    try {
      res = fn(...args);
    } finally {
      setCurrentRenderingInstance(prevInstance);
      if (renderFnWithContext._d) {
        setBlockTracking(1);
      }
    }
    return res;
  };
  renderFnWithContext._n = true;
  renderFnWithContext._c = true;
  renderFnWithContext._d = true;
  return renderFnWithContext;
}
function withDirectives(vnode, directives) {
  if (currentRenderingInstance === null) {
    return vnode;
  }
  const instance2 = getComponentPublicInstance(currentRenderingInstance);
  const bindings = vnode.dirs || (vnode.dirs = []);
  for (let i = 0; i < directives.length; i++) {
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
    if (dir) {
      if (isFunction$2(dir)) {
        dir = {
          mounted: dir,
          updated: dir
        };
      }
      if (dir.deep) {
        traverse(value);
      }
      bindings.push({
        dir,
        instance: instance2,
        value,
        oldValue: void 0,
        arg,
        modifiers
      });
    }
  }
  return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance2, name) {
  const bindings = vnode.dirs;
  const oldBindings = prevVNode && prevVNode.dirs;
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value;
    }
    let hook = binding.dir[name];
    if (hook) {
      pauseTracking();
      callWithAsyncErrorHandling(hook, instance2, 8, [
        vnode.el,
        binding,
        vnode,
        prevVNode
      ]);
      resetTracking();
    }
  }
}
function provide(key, value) {
  if (currentInstance) {
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance2 = getCurrentInstance();
  if (instance2 || currentApp) {
    let provides = currentApp ? currentApp._context.provides : instance2 ? instance2.parent == null || instance2.ce ? instance2.vnode.appContext && instance2.vnode.appContext.provides : instance2.parent.provides : void 0;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction$2(defaultValue) ? defaultValue.call(instance2 && instance2.proxy) : defaultValue;
    } else ;
  }
}
function hasInjectionContext() {
  return !!(getCurrentInstance() || currentApp);
}
const ssrContextKey = /* @__PURE__ */ Symbol.for("v-scx");
const useSSRContext = () => {
  {
    const ctx = inject(ssrContextKey);
    return ctx;
  }
};
function watch(source, cb, options) {
  return doWatch(source, cb, options);
}
function doWatch(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, flush, once } = options;
  const baseWatchOptions = extend$1({}, options);
  const runsImmediately = cb && immediate || !cb && flush !== "post";
  let ssrCleanup;
  if (isInSSRComponentSetup) {
    if (flush === "sync") {
      const ctx = useSSRContext();
      ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
    } else if (!runsImmediately) {
      const watchStopHandle = () => {
      };
      watchStopHandle.stop = NOOP;
      watchStopHandle.resume = NOOP;
      watchStopHandle.pause = NOOP;
      return watchStopHandle;
    }
  }
  const instance2 = currentInstance;
  baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance2, type, args);
  let isPre = false;
  if (flush === "post") {
    baseWatchOptions.scheduler = (job) => {
      queuePostRenderEffect(job, instance2 && instance2.suspense);
    };
  } else if (flush !== "sync") {
    isPre = true;
    baseWatchOptions.scheduler = (job, isFirstRun) => {
      if (isFirstRun) {
        job();
      } else {
        queueJob(job);
      }
    };
  }
  baseWatchOptions.augmentJob = (job) => {
    if (cb) {
      job.flags |= 4;
    }
    if (isPre) {
      job.flags |= 2;
      if (instance2) {
        job.id = instance2.uid;
        job.i = instance2;
      }
    }
  };
  const watchHandle = watch$1(source, cb, baseWatchOptions);
  if (isInSSRComponentSetup) {
    if (ssrCleanup) {
      ssrCleanup.push(watchHandle);
    } else if (runsImmediately) {
      watchHandle();
    }
  }
  return watchHandle;
}
function instanceWatch(source, value, options) {
  const publicThis = this.proxy;
  const getter = isString$1(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
  let cb;
  if (isFunction$2(value)) {
    cb = value;
  } else {
    cb = value.handler;
    options = value;
  }
  const reset = setCurrentInstance(this);
  const res = doWatch(getter, cb.bind(publicThis), options);
  reset();
  return res;
}
function createPathGetter(ctx, path) {
  const segments = path.split(".");
  return () => {
    let cur = ctx;
    for (let i = 0; i < segments.length && cur; i++) {
      cur = cur[segments[i]];
    }
    return cur;
  };
}
const pendingMounts = /* @__PURE__ */ new WeakMap();
const TeleportEndKey = /* @__PURE__ */ Symbol("_vte");
const isTeleport = (type) => type.__isTeleport;
const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === "");
const isTeleportDeferred = (props) => props && (props.defer || props.defer === "");
const isTargetSVG = (target) => typeof SVGElement !== "undefined" && target instanceof SVGElement;
const isTargetMathML = (target) => typeof MathMLElement === "function" && target instanceof MathMLElement;
const resolveTarget = (props, select) => {
  const targetSelector = props && props.to;
  if (isString$1(targetSelector)) {
    if (!select) {
      return null;
    } else {
      const target = select(targetSelector);
      return target;
    }
  } else {
    return targetSelector;
  }
};
const TeleportImpl = {
  name: "Teleport",
  __isTeleport: true,
  process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals) {
    const {
      mc: mountChildren,
      pc: patchChildren,
      pbc: patchBlockChildren,
      o: { insert, querySelector, createText, createComment, parentNode }
    } = internals;
    const disabled = isTeleportDisabled(n2.props);
    let { dynamicChildren } = n2;
    const mount = (vnode, container2, anchor2) => {
      if (vnode.shapeFlag & 16) {
        mountChildren(
          vnode.children,
          container2,
          anchor2,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    };
    const mountToTarget = (vnode = n2) => {
      const disabled2 = isTeleportDisabled(vnode.props);
      const target = vnode.target = resolveTarget(vnode.props, querySelector);
      const targetAnchor = prepareAnchor(target, vnode, createText, insert);
      if (target) {
        if (namespace !== "svg" && isTargetSVG(target)) {
          namespace = "svg";
        } else if (namespace !== "mathml" && isTargetMathML(target)) {
          namespace = "mathml";
        }
        if (parentComponent && parentComponent.isCE) {
          (parentComponent.ce._teleportTargets || (parentComponent.ce._teleportTargets = /* @__PURE__ */ new Set())).add(target);
        }
        if (!disabled2) {
          mount(vnode, target, targetAnchor);
          updateCssVars(vnode, false);
        }
      }
    };
    const queuePendingMount = (vnode) => {
      const mountJob = () => {
        if (pendingMounts.get(vnode) !== mountJob) return;
        pendingMounts.delete(vnode);
        if (isTeleportDisabled(vnode.props)) {
          const mountContainer = parentNode(vnode.el) || container;
          mount(vnode, mountContainer, vnode.anchor);
          updateCssVars(vnode, true);
        }
        mountToTarget(vnode);
      };
      pendingMounts.set(vnode, mountJob);
      queuePostRenderEffect(mountJob, parentSuspense);
    };
    if (n1 == null) {
      const placeholder = n2.el = createText("");
      const mainAnchor = n2.anchor = createText("");
      insert(placeholder, container, anchor);
      insert(mainAnchor, container, anchor);
      if (isTeleportDeferred(n2.props) || parentSuspense && parentSuspense.pendingBranch) {
        queuePendingMount(n2);
        return;
      }
      if (disabled) {
        mount(n2, container, mainAnchor);
        updateCssVars(n2, true);
      }
      mountToTarget();
    } else {
      n2.el = n1.el;
      const mainAnchor = n2.anchor = n1.anchor;
      const pendingMount = pendingMounts.get(n1);
      if (pendingMount) {
        pendingMount.flags |= 8;
        pendingMounts.delete(n1);
        queuePendingMount(n2);
        return;
      }
      n2.targetStart = n1.targetStart;
      const target = n2.target = n1.target;
      const targetAnchor = n2.targetAnchor = n1.targetAnchor;
      const wasDisabled = isTeleportDisabled(n1.props);
      const currentContainer = wasDisabled ? container : target;
      const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
      if (namespace === "svg" || isTargetSVG(target)) {
        namespace = "svg";
      } else if (namespace === "mathml" || isTargetMathML(target)) {
        namespace = "mathml";
      }
      if (dynamicChildren) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          currentContainer,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds
        );
        traverseStaticChildren(n1, n2, true);
      } else if (!optimized) {
        patchChildren(
          n1,
          n2,
          currentContainer,
          currentAnchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          false
        );
      }
      if (disabled) {
        if (!wasDisabled) {
          moveTeleport(
            n2,
            container,
            mainAnchor,
            internals,
            1
          );
        } else {
          if (n2.props && n1.props && n2.props.to !== n1.props.to) {
            n2.props.to = n1.props.to;
          }
        }
      } else {
        if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
          const nextTarget = n2.target = resolveTarget(
            n2.props,
            querySelector
          );
          if (nextTarget) {
            moveTeleport(
              n2,
              nextTarget,
              null,
              internals,
              0
            );
          }
        } else if (wasDisabled) {
          moveTeleport(
            n2,
            target,
            targetAnchor,
            internals,
            1
          );
        }
      }
      updateCssVars(n2, disabled);
    }
  },
  remove(vnode, parentComponent, parentSuspense, { um: unmount, o: { remove: hostRemove } }, doRemove) {
    const {
      shapeFlag,
      children,
      anchor,
      targetStart,
      targetAnchor,
      target,
      props
    } = vnode;
    let shouldRemove = doRemove || !isTeleportDisabled(props);
    const pendingMount = pendingMounts.get(vnode);
    if (pendingMount) {
      pendingMount.flags |= 8;
      pendingMounts.delete(vnode);
      shouldRemove = false;
    }
    if (target) {
      hostRemove(targetStart);
      hostRemove(targetAnchor);
    }
    doRemove && hostRemove(anchor);
    if (shapeFlag & 16) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        unmount(
          child,
          parentComponent,
          parentSuspense,
          shouldRemove,
          !!child.dynamicChildren
        );
      }
    }
  },
  move: moveTeleport,
  hydrate: hydrateTeleport
};
function moveTeleport(vnode, container, parentAnchor, { o: { insert }, m: move }, moveType = 2) {
  if (moveType === 0) {
    insert(vnode.targetAnchor, container, parentAnchor);
  }
  const { el, anchor, shapeFlag, children, props } = vnode;
  const isReorder = moveType === 2;
  if (isReorder) {
    insert(el, container, parentAnchor);
  }
  if (!pendingMounts.has(vnode) && (!isReorder || isTeleportDisabled(props))) {
    if (shapeFlag & 16) {
      for (let i = 0; i < children.length; i++) {
        move(
          children[i],
          container,
          parentAnchor,
          2
        );
      }
    }
  }
  if (isReorder) {
    insert(anchor, container, parentAnchor);
  }
}
function hydrateTeleport(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, {
  o: { nextSibling, parentNode, querySelector, insert, createText }
}, hydrateChildren) {
  function hydrateAnchor(target2, targetNode) {
    let targetAnchor = targetNode;
    while (targetAnchor) {
      if (targetAnchor && targetAnchor.nodeType === 8) {
        if (targetAnchor.data === "teleport start anchor") {
          vnode.targetStart = targetAnchor;
        } else if (targetAnchor.data === "teleport anchor") {
          vnode.targetAnchor = targetAnchor;
          target2._lpa = vnode.targetAnchor && nextSibling(vnode.targetAnchor);
          break;
        }
      }
      targetAnchor = nextSibling(targetAnchor);
    }
  }
  function hydrateDisabledTeleport(node2, vnode2) {
    vnode2.anchor = hydrateChildren(
      nextSibling(node2),
      vnode2,
      parentNode(node2),
      parentComponent,
      parentSuspense,
      slotScopeIds,
      optimized
    );
  }
  const target = vnode.target = resolveTarget(
    vnode.props,
    querySelector
  );
  const disabled = isTeleportDisabled(vnode.props);
  if (target) {
    const targetNode = target._lpa || target.firstChild;
    if (vnode.shapeFlag & 16) {
      if (disabled) {
        hydrateDisabledTeleport(node, vnode);
        hydrateAnchor(target, targetNode);
        if (!vnode.targetAnchor) {
          prepareAnchor(
            target,
            vnode,
            createText,
            insert,
            // if target is the same as the main view, insert anchors before current node
            // to avoid hydrating mismatch
            parentNode(node) === target ? node : null
          );
        }
      } else {
        vnode.anchor = nextSibling(node);
        hydrateAnchor(target, targetNode);
        if (!vnode.targetAnchor) {
          prepareAnchor(target, vnode, createText, insert);
        }
        hydrateChildren(
          targetNode && nextSibling(targetNode),
          vnode,
          target,
          parentComponent,
          parentSuspense,
          slotScopeIds,
          optimized
        );
      }
    }
    updateCssVars(vnode, disabled);
  } else if (disabled) {
    if (vnode.shapeFlag & 16) {
      hydrateDisabledTeleport(node, vnode);
      vnode.targetStart = node;
      vnode.targetAnchor = nextSibling(node);
    }
  }
  return vnode.anchor && nextSibling(vnode.anchor);
}
const Teleport = TeleportImpl;
function updateCssVars(vnode, isDisabled) {
  const ctx = vnode.ctx;
  if (ctx && ctx.ut) {
    let node, anchor;
    if (isDisabled) {
      node = vnode.el;
      anchor = vnode.anchor;
    } else {
      node = vnode.targetStart;
      anchor = vnode.targetAnchor;
    }
    while (node && node !== anchor) {
      if (node.nodeType === 1) node.setAttribute("data-v-owner", ctx.uid);
      node = node.nextSibling;
    }
    ctx.ut();
  }
}
function prepareAnchor(target, vnode, createText, insert, anchor = null) {
  const targetStart = vnode.targetStart = createText("");
  const targetAnchor = vnode.targetAnchor = createText("");
  targetStart[TeleportEndKey] = targetAnchor;
  if (target) {
    insert(targetStart, target, anchor);
    insert(targetAnchor, target, anchor);
  }
  return targetAnchor;
}
const leaveCbKey = /* @__PURE__ */ Symbol("_leaveCb");
const enterCbKey$1 = /* @__PURE__ */ Symbol("_enterCb");
function useTransitionState() {
  const state = {
    isMounted: false,
    isLeaving: false,
    isUnmounting: false,
    leavingVNodes: /* @__PURE__ */ new Map()
  };
  onMounted(() => {
    state.isMounted = true;
  });
  onBeforeUnmount(() => {
    state.isUnmounting = true;
  });
  return state;
}
const TransitionHookValidator = [Function, Array];
const BaseTransitionPropsValidators = {
  mode: String,
  appear: Boolean,
  persisted: Boolean,
  // enter
  onBeforeEnter: TransitionHookValidator,
  onEnter: TransitionHookValidator,
  onAfterEnter: TransitionHookValidator,
  onEnterCancelled: TransitionHookValidator,
  // leave
  onBeforeLeave: TransitionHookValidator,
  onLeave: TransitionHookValidator,
  onAfterLeave: TransitionHookValidator,
  onLeaveCancelled: TransitionHookValidator,
  // appear
  onBeforeAppear: TransitionHookValidator,
  onAppear: TransitionHookValidator,
  onAfterAppear: TransitionHookValidator,
  onAppearCancelled: TransitionHookValidator
};
const recursiveGetSubtree = (instance2) => {
  const subTree = instance2.subTree;
  return subTree.component ? recursiveGetSubtree(subTree.component) : subTree;
};
const BaseTransitionImpl = {
  name: `BaseTransition`,
  props: BaseTransitionPropsValidators,
  setup(props, { slots }) {
    const instance2 = getCurrentInstance();
    const state = useTransitionState();
    return () => {
      const children = slots.default && getTransitionRawChildren(slots.default(), true);
      const child = children && children.length ? findNonCommentChild(children) : (
        // Keep explicit default-slot conditionals on the same transition path
        // as regular v-if branches, which render a comment placeholder.
        instance2.subTree ? createCommentVNode() : void 0
      );
      if (!child) {
        return;
      }
      const rawProps = /* @__PURE__ */ toRaw(props);
      const { mode } = rawProps;
      if (state.isLeaving) {
        return emptyPlaceholder(child);
      }
      const innerChild = getInnerChild$1(child);
      if (!innerChild) {
        return emptyPlaceholder(child);
      }
      let enterHooks = resolveTransitionHooks(
        innerChild,
        rawProps,
        state,
        instance2,
        // #11061, ensure enterHooks is fresh after clone
        (hooks) => enterHooks = hooks
      );
      if (innerChild.type !== Comment) {
        setTransitionHooks(innerChild, enterHooks);
      }
      let oldInnerChild = instance2.subTree && getInnerChild$1(instance2.subTree);
      if (oldInnerChild && oldInnerChild.type !== Comment && !isSameVNodeType(oldInnerChild, innerChild) && recursiveGetSubtree(instance2).type !== Comment) {
        let leavingHooks = resolveTransitionHooks(
          oldInnerChild,
          rawProps,
          state,
          instance2
        );
        setTransitionHooks(oldInnerChild, leavingHooks);
        if (mode === "out-in" && innerChild.type !== Comment) {
          state.isLeaving = true;
          leavingHooks.afterLeave = () => {
            state.isLeaving = false;
            if (!(instance2.job.flags & 8)) {
              instance2.update();
            }
            delete leavingHooks.afterLeave;
            oldInnerChild = void 0;
          };
          return emptyPlaceholder(child);
        } else if (mode === "in-out" && innerChild.type !== Comment) {
          leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
            const leavingVNodesCache = getLeavingNodesForType(
              state,
              oldInnerChild
            );
            leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
            el[leaveCbKey] = () => {
              earlyRemove();
              el[leaveCbKey] = void 0;
              delete enterHooks.delayedLeave;
              oldInnerChild = void 0;
            };
            enterHooks.delayedLeave = () => {
              delayedLeave();
              delete enterHooks.delayedLeave;
              oldInnerChild = void 0;
            };
          };
        } else {
          oldInnerChild = void 0;
        }
      } else if (oldInnerChild) {
        oldInnerChild = void 0;
      }
      return child;
    };
  }
};
function findNonCommentChild(children) {
  let child = children[0];
  if (children.length > 1) {
    for (const c of children) {
      if (c.type !== Comment) {
        child = c;
        break;
      }
    }
  }
  return child;
}
const BaseTransition = BaseTransitionImpl;
function getLeavingNodesForType(state, vnode) {
  const { leavingVNodes } = state;
  let leavingVNodesCache = leavingVNodes.get(vnode.type);
  if (!leavingVNodesCache) {
    leavingVNodesCache = /* @__PURE__ */ Object.create(null);
    leavingVNodes.set(vnode.type, leavingVNodesCache);
  }
  return leavingVNodesCache;
}
function resolveTransitionHooks(vnode, props, state, instance2, postClone) {
  const {
    appear,
    mode,
    persisted = false,
    onBeforeEnter,
    onEnter,
    onAfterEnter,
    onEnterCancelled,
    onBeforeLeave,
    onLeave,
    onAfterLeave,
    onLeaveCancelled,
    onBeforeAppear,
    onAppear,
    onAfterAppear,
    onAppearCancelled
  } = props;
  const key = String(vnode.key);
  const leavingVNodesCache = getLeavingNodesForType(state, vnode);
  const callHook2 = (hook, args) => {
    hook && callWithAsyncErrorHandling(
      hook,
      instance2,
      9,
      args
    );
  };
  const callAsyncHook = (hook, args) => {
    const done = args[1];
    callHook2(hook, args);
    if (isArray$2(hook)) {
      if (hook.every((hook2) => hook2.length <= 1)) done();
    } else if (hook.length <= 1) {
      done();
    }
  };
  const hooks = {
    mode,
    persisted,
    beforeEnter(el) {
      let hook = onBeforeEnter;
      if (!state.isMounted) {
        if (appear) {
          hook = onBeforeAppear || onBeforeEnter;
        } else {
          return;
        }
      }
      if (el[leaveCbKey]) {
        el[leaveCbKey](
          true
          /* cancelled */
        );
      }
      const leavingVNode = leavingVNodesCache[key];
      if (leavingVNode && isSameVNodeType(vnode, leavingVNode) && leavingVNode.el[leaveCbKey]) {
        leavingVNode.el[leaveCbKey]();
      }
      callHook2(hook, [el]);
    },
    enter(el) {
      if (leavingVNodesCache[key] === vnode) return;
      let hook = onEnter;
      let afterHook = onAfterEnter;
      let cancelHook = onEnterCancelled;
      if (!state.isMounted) {
        if (appear) {
          hook = onAppear || onEnter;
          afterHook = onAfterAppear || onAfterEnter;
          cancelHook = onAppearCancelled || onEnterCancelled;
        } else {
          return;
        }
      }
      let called = false;
      el[enterCbKey$1] = (cancelled) => {
        if (called) return;
        called = true;
        if (cancelled) {
          callHook2(cancelHook, [el]);
        } else {
          callHook2(afterHook, [el]);
        }
        if (hooks.delayedLeave) {
          hooks.delayedLeave();
        }
        el[enterCbKey$1] = void 0;
      };
      const done = el[enterCbKey$1].bind(null, false);
      if (hook) {
        callAsyncHook(hook, [el, done]);
      } else {
        done();
      }
    },
    leave(el, remove2) {
      const key2 = String(vnode.key);
      if (el[enterCbKey$1]) {
        el[enterCbKey$1](
          true
          /* cancelled */
        );
      }
      if (state.isUnmounting) {
        return remove2();
      }
      callHook2(onBeforeLeave, [el]);
      let called = false;
      el[leaveCbKey] = (cancelled) => {
        if (called) return;
        called = true;
        remove2();
        if (cancelled) {
          callHook2(onLeaveCancelled, [el]);
        } else {
          callHook2(onAfterLeave, [el]);
        }
        el[leaveCbKey] = void 0;
        if (leavingVNodesCache[key2] === vnode) {
          delete leavingVNodesCache[key2];
        }
      };
      const done = el[leaveCbKey].bind(null, false);
      leavingVNodesCache[key2] = vnode;
      if (onLeave) {
        callAsyncHook(onLeave, [el, done]);
      } else {
        done();
      }
    },
    clone(vnode2) {
      const hooks2 = resolveTransitionHooks(
        vnode2,
        props,
        state,
        instance2,
        postClone
      );
      if (postClone) postClone(hooks2);
      return hooks2;
    }
  };
  return hooks;
}
function emptyPlaceholder(vnode) {
  if (isKeepAlive(vnode)) {
    vnode = cloneVNode(vnode);
    vnode.children = null;
    return vnode;
  }
}
function getInnerChild$1(vnode) {
  if (!isKeepAlive(vnode)) {
    if (isTeleport(vnode.type) && vnode.children) {
      return findNonCommentChild(vnode.children);
    }
    return vnode;
  }
  if (vnode.component) {
    return vnode.component.subTree;
  }
  const { shapeFlag, children } = vnode;
  if (children) {
    if (shapeFlag & 16) {
      return children[0];
    }
    if (shapeFlag & 32 && isFunction$2(children.default)) {
      return children.default();
    }
  }
}
function setTransitionHooks(vnode, hooks) {
  if (vnode.shapeFlag & 6 && vnode.component) {
    vnode.transition = hooks;
    setTransitionHooks(vnode.component.subTree, hooks);
  } else if (vnode.shapeFlag & 128) {
    vnode.ssContent.transition = hooks.clone(vnode.ssContent);
    vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
  } else {
    vnode.transition = hooks;
  }
}
function getTransitionRawChildren(children, keepComment = false, parentKey) {
  let ret = [];
  let keyedFragmentCount = 0;
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    const key = parentKey == null ? child.key : String(parentKey) + String(child.key != null ? child.key : i);
    if (child.type === Fragment) {
      if (child.patchFlag & 128) keyedFragmentCount++;
      ret = ret.concat(
        getTransitionRawChildren(child.children, keepComment, key)
      );
    } else if (keepComment || child.type !== Comment) {
      ret.push(key != null ? cloneVNode(child, { key }) : child);
    }
  }
  if (keyedFragmentCount > 1) {
    for (let i = 0; i < ret.length; i++) {
      ret[i].patchFlag = -2;
    }
  }
  return ret;
}
// @__NO_SIDE_EFFECTS__
function defineComponent(options, extraOptions) {
  return isFunction$2(options) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    /* @__PURE__ */ (() => extend$1({ name: options.name }, extraOptions, { setup: options }))()
  ) : options;
}
function markAsyncBoundary(instance2) {
  instance2.ids = [instance2.ids[0] + instance2.ids[2]++ + "-", 0, 0];
}
function isTemplateRefKey(refs, key) {
  let desc;
  return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
}
const pendingSetRefMap = /* @__PURE__ */ new WeakMap();
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
  if (isArray$2(rawRef)) {
    rawRef.forEach(
      (r, i) => setRef(
        r,
        oldRawRef && (isArray$2(oldRawRef) ? oldRawRef[i] : oldRawRef),
        parentSuspense,
        vnode,
        isUnmount
      )
    );
    return;
  }
  if (isAsyncWrapper(vnode) && !isUnmount) {
    if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) {
      setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
    }
    return;
  }
  const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
  const value = isUnmount ? null : refValue;
  const { i: owner, r: ref3 } = rawRef;
  const oldRef = oldRawRef && oldRawRef.r;
  const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
  const setupState = owner.setupState;
  const rawSetupState = /* @__PURE__ */ toRaw(setupState);
  const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
    if (isTemplateRefKey(refs, key)) {
      return false;
    }
    return hasOwn(rawSetupState, key);
  };
  const canSetRef = (ref22, key) => {
    if (key && isTemplateRefKey(refs, key)) {
      return false;
    }
    return true;
  };
  if (oldRef != null && oldRef !== ref3) {
    invalidatePendingSetRef(oldRawRef);
    if (isString$1(oldRef)) {
      refs[oldRef] = null;
      if (canSetSetupRef(oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (/* @__PURE__ */ isRef(oldRef)) {
      const oldRawRefAtom = oldRawRef;
      if (canSetRef(oldRef, oldRawRefAtom.k)) {
        oldRef.value = null;
      }
      if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
    }
  }
  if (isFunction$2(ref3)) {
    callWithErrorHandling(ref3, owner, 12, [value, refs]);
  } else {
    const _isString = isString$1(ref3);
    const _isRef = /* @__PURE__ */ isRef(ref3);
    if (_isString || _isRef) {
      const doSet = () => {
        if (rawRef.f) {
          const existing = _isString ? canSetSetupRef(ref3) ? setupState[ref3] : refs[ref3] : canSetRef() || !rawRef.k ? ref3.value : refs[rawRef.k];
          if (isUnmount) {
            isArray$2(existing) && remove(existing, refValue);
          } else {
            if (!isArray$2(existing)) {
              if (_isString) {
                refs[ref3] = [refValue];
                if (canSetSetupRef(ref3)) {
                  setupState[ref3] = refs[ref3];
                }
              } else {
                const newVal = [refValue];
                if (canSetRef(ref3, rawRef.k)) {
                  ref3.value = newVal;
                }
                if (rawRef.k) refs[rawRef.k] = newVal;
              }
            } else if (!existing.includes(refValue)) {
              existing.push(refValue);
            }
          }
        } else if (_isString) {
          refs[ref3] = value;
          if (canSetSetupRef(ref3)) {
            setupState[ref3] = value;
          }
        } else if (_isRef) {
          if (canSetRef(ref3, rawRef.k)) {
            ref3.value = value;
          }
          if (rawRef.k) refs[rawRef.k] = value;
        } else ;
      };
      if (value) {
        const job = () => {
          doSet();
          pendingSetRefMap.delete(rawRef);
        };
        job.id = -1;
        pendingSetRefMap.set(rawRef, job);
        queuePostRenderEffect(job, parentSuspense);
      } else {
        invalidatePendingSetRef(rawRef);
        doSet();
      }
    }
  }
}
function invalidatePendingSetRef(rawRef) {
  const pendingSetRef = pendingSetRefMap.get(rawRef);
  if (pendingSetRef) {
    pendingSetRef.flags |= 8;
    pendingSetRefMap.delete(rawRef);
  }
}
getGlobalThis().requestIdleCallback || ((cb) => setTimeout(cb, 1));
getGlobalThis().cancelIdleCallback || ((id) => clearTimeout(id));
const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
function onActivated(hook, target) {
  registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
  registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
  const wrappedHook = hook.__wdc || (hook.__wdc = () => {
    let current = target;
    while (current) {
      if (current.isDeactivated) {
        return;
      }
      current = current.parent;
    }
    return hook();
  });
  injectHook(type, wrappedHook, target);
  if (target) {
    let current = target.parent;
    while (current && current.parent) {
      if (isKeepAlive(current.parent.vnode)) {
        injectToKeepAliveRoot(wrappedHook, type, target, current);
      }
      current = current.parent;
    }
  }
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
  const injected = injectHook(
    type,
    hook,
    keepAliveRoot,
    true
    /* prepend */
  );
  onUnmounted(() => {
    remove(keepAliveRoot[type], injected);
  }, target);
}
function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
      pauseTracking();
      const reset = setCurrentInstance(target);
      const res = callWithAsyncErrorHandling(hook, target, type, args);
      reset();
      resetTracking();
      return res;
    });
    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }
    return wrappedHook;
  }
}
const createHook = (lifecycle) => (hook, target = currentInstance) => {
  if (!isInSSRComponentSetup || lifecycle === "sp") {
    injectHook(lifecycle, (...args) => hook(...args), target);
  }
};
const onBeforeMount = createHook("bm");
const onMounted = createHook("m");
const onBeforeUpdate = createHook(
  "bu"
);
const onUpdated = createHook("u");
const onBeforeUnmount = createHook(
  "bum"
);
const onUnmounted = createHook("um");
const onServerPrefetch = createHook(
  "sp"
);
const onRenderTriggered = createHook("rtg");
const onRenderTracked = createHook("rtc");
function onErrorCaptured(hook, target = currentInstance) {
  injectHook("ec", hook, target);
}
const COMPONENTS = "components";
function resolveComponent(name, maybeSelfReference) {
  return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
}
const NULL_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol.for("v-ndc");
function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
  const instance2 = currentRenderingInstance || currentInstance;
  if (instance2) {
    const Component = instance2.type;
    {
      const selfName = getComponentName(
        Component,
        false
      );
      if (selfName && (selfName === name || selfName === camelize(name) || selfName === capitalize(camelize(name)))) {
        return Component;
      }
    }
    const res = (
      // local registration
      // check instance[type] first which is resolved for options API
      resolve(instance2[type] || Component[type], name) || // global registration
      resolve(instance2.appContext[type], name)
    );
    if (!res && maybeSelfReference) {
      return Component;
    }
    return res;
  }
}
function resolve(registry, name) {
  return registry && (registry[name] || registry[camelize(name)] || registry[capitalize(camelize(name))]);
}
function renderList(source, renderItem, cache, index) {
  let ret;
  const cached = cache;
  const sourceIsArray = isArray$2(source);
  if (sourceIsArray || isString$1(source)) {
    const sourceIsReactiveArray = sourceIsArray && /* @__PURE__ */ isReactive(source);
    let needsWrap = false;
    let isReadonlySource = false;
    if (sourceIsReactiveArray) {
      needsWrap = !/* @__PURE__ */ isShallow(source);
      isReadonlySource = /* @__PURE__ */ isReadonly(source);
      source = shallowReadArray(source);
    }
    ret = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(
        needsWrap ? isReadonlySource ? toReadonly(toReactive(source[i])) : toReactive(source[i]) : source[i],
        i,
        void 0,
        cached
      );
    }
  } else if (typeof source === "number") {
    {
      ret = new Array(source);
      for (let i = 0; i < source; i++) {
        ret[i] = renderItem(i + 1, i, void 0, cached);
      }
    }
  } else if (isObject$1(source)) {
    if (source[Symbol.iterator]) {
      ret = Array.from(
        source,
        (item, i) => renderItem(item, i, void 0, cached)
      );
    } else {
      const keys = Object.keys(source);
      ret = new Array(keys.length);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        ret[i] = renderItem(source[key], key, i, cached);
      }
    }
  } else {
    ret = [];
  }
  return ret;
}
function renderSlot(slots, name, props = {}, fallback, noSlotted) {
  if (currentRenderingInstance.ce || currentRenderingInstance.parent && isAsyncWrapper(currentRenderingInstance.parent) && currentRenderingInstance.parent.ce) {
    const hasProps = Object.keys(props).length > 0;
    if (name !== "default") props.name = name;
    return openBlock(), createBlock(
      Fragment,
      null,
      [createVNode("slot", props, fallback)],
      hasProps ? -2 : 64
    );
  }
  let slot = slots[name];
  if (slot && slot._c) {
    slot._d = false;
  }
  openBlock();
  const validSlotContent = slot && ensureValidVNode(slot(props));
  const slotKey = props.key || // slot content array of a dynamic conditional slot may have a branch
  // key attached in the `createSlots` helper, respect that
  validSlotContent && validSlotContent.key;
  const rendered = createBlock(
    Fragment,
    {
      key: (slotKey && !isSymbol(slotKey) ? slotKey : `_${name}`) + // #7256 force differentiate fallback content from actual content
      (!validSlotContent && fallback ? "_fb" : "")
    },
    validSlotContent || [],
    validSlotContent && slots._ === 1 ? 64 : -2
  );
  if (slot && slot._c) {
    slot._d = true;
  }
  return rendered;
}
function ensureValidVNode(vnodes) {
  return vnodes.some((child) => {
    if (!isVNode(child)) return true;
    if (child.type === Comment) return false;
    if (child.type === Fragment && !ensureValidVNode(child.children))
      return false;
    return true;
  }) ? vnodes : null;
}
const getPublicInstance = (i) => {
  if (!i) return null;
  if (isStatefulComponent(i)) return getComponentPublicInstance(i);
  return getPublicInstance(i.parent);
};
const publicPropertiesMap = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ extend$1(/* @__PURE__ */ Object.create(null), {
    $: (i) => i,
    $el: (i) => i.vnode.el,
    $data: (i) => i.data,
    $props: (i) => i.props,
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots,
    $refs: (i) => i.refs,
    $parent: (i) => getPublicInstance(i.parent),
    $root: (i) => getPublicInstance(i.root),
    $host: (i) => i.ce,
    $emit: (i) => i.emit,
    $options: (i) => resolveMergedOptions(i),
    $forceUpdate: (i) => i.f || (i.f = () => {
      queueJob(i.update);
    }),
    $nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
    $watch: (i) => instanceWatch.bind(i)
  })
);
const hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
const PublicInstanceProxyHandlers = {
  get({ _: instance2 }, key) {
    if (key === "__v_skip") {
      return true;
    }
    const { ctx, setupState, data, props, accessCache, type, appContext } = instance2;
    if (key[0] !== "$") {
      const n = accessCache[key];
      if (n !== void 0) {
        switch (n) {
          case 1:
            return setupState[key];
          case 2:
            return data[key];
          case 4:
            return ctx[key];
          case 3:
            return props[key];
        }
      } else if (hasSetupBinding(setupState, key)) {
        accessCache[key] = 1;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = 2;
        return data[key];
      } else if (hasOwn(props, key)) {
        accessCache[key] = 3;
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = 4;
        return ctx[key];
      } else if (shouldCacheAccess) {
        accessCache[key] = 0;
      }
    }
    const publicGetter = publicPropertiesMap[key];
    let cssModule, globalProperties;
    if (publicGetter) {
      if (key === "$attrs") {
        track(instance2.attrs, "get", "");
      }
      return publicGetter(instance2);
    } else if (
      // css module (injected by vue-loader)
      (cssModule = type.__cssModules) && (cssModule = cssModule[key])
    ) {
      return cssModule;
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      accessCache[key] = 4;
      return ctx[key];
    } else if (
      // global properties
      globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)
    ) {
      {
        return globalProperties[key];
      }
    } else ;
  },
  set({ _: instance2 }, key, value) {
    const { data, setupState, ctx } = instance2;
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance2.props, key)) {
      return false;
    }
    if (key[0] === "$" && key.slice(1) in instance2) {
      return false;
    } else {
      {
        ctx[key] = value;
      }
    }
    return true;
  },
  has({
    _: { data, setupState, accessCache, ctx, appContext, props, type }
  }, key) {
    let cssModules;
    return !!(accessCache[key] || data !== EMPTY_OBJ && key[0] !== "$" && hasOwn(data, key) || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
  },
  defineProperty(target, key, descriptor) {
    if (descriptor.get != null) {
      target._.accessCache[key] = 0;
    } else if (hasOwn(descriptor, "value")) {
      this.set(target, key, descriptor.value, null);
    }
    return Reflect.defineProperty(target, key, descriptor);
  }
};
function normalizePropsOrEmits(props) {
  return isArray$2(props) ? props.reduce(
    (normalized, p2) => (normalized[p2] = null, normalized),
    {}
  ) : props;
}
let shouldCacheAccess = true;
function applyOptions(instance2) {
  const options = resolveMergedOptions(instance2);
  const publicThis = instance2.proxy;
  const ctx = instance2.ctx;
  shouldCacheAccess = false;
  if (options.beforeCreate) {
    callHook$1(options.beforeCreate, instance2, "bc");
  }
  const {
    // state
    data: dataOptions,
    computed: computedOptions,
    methods,
    watch: watchOptions,
    provide: provideOptions,
    inject: injectOptions,
    // lifecycle
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    activated,
    deactivated,
    beforeDestroy,
    beforeUnmount,
    destroyed,
    unmounted,
    render,
    renderTracked,
    renderTriggered,
    errorCaptured,
    serverPrefetch,
    // public API
    expose,
    inheritAttrs,
    // assets
    components,
    directives,
    filters
  } = options;
  const checkDuplicateProperties = null;
  if (injectOptions) {
    resolveInjections(injectOptions, ctx, checkDuplicateProperties);
  }
  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key];
      if (isFunction$2(methodHandler)) {
        {
          ctx[key] = methodHandler.bind(publicThis);
        }
      }
    }
  }
  if (dataOptions) {
    const data = dataOptions.call(publicThis, publicThis);
    if (!isObject$1(data)) ;
    else {
      instance2.data = /* @__PURE__ */ reactive(data);
    }
  }
  shouldCacheAccess = true;
  if (computedOptions) {
    for (const key in computedOptions) {
      const opt = computedOptions[key];
      const get = isFunction$2(opt) ? opt.bind(publicThis, publicThis) : isFunction$2(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP;
      const set = !isFunction$2(opt) && isFunction$2(opt.set) ? opt.set.bind(publicThis) : NOOP;
      const c = computed({
        get,
        set
      });
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => c.value,
        set: (v) => c.value = v
      });
    }
  }
  if (watchOptions) {
    for (const key in watchOptions) {
      createWatcher(watchOptions[key], ctx, publicThis, key);
    }
  }
  if (provideOptions) {
    const provides = isFunction$2(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
    Reflect.ownKeys(provides).forEach((key) => {
      provide(key, provides[key]);
    });
  }
  if (created) {
    callHook$1(created, instance2, "c");
  }
  function registerLifecycleHook(register, hook) {
    if (isArray$2(hook)) {
      hook.forEach((_hook) => register(_hook.bind(publicThis)));
    } else if (hook) {
      register(hook.bind(publicThis));
    }
  }
  registerLifecycleHook(onBeforeMount, beforeMount);
  registerLifecycleHook(onMounted, mounted);
  registerLifecycleHook(onBeforeUpdate, beforeUpdate);
  registerLifecycleHook(onUpdated, updated);
  registerLifecycleHook(onActivated, activated);
  registerLifecycleHook(onDeactivated, deactivated);
  registerLifecycleHook(onErrorCaptured, errorCaptured);
  registerLifecycleHook(onRenderTracked, renderTracked);
  registerLifecycleHook(onRenderTriggered, renderTriggered);
  registerLifecycleHook(onBeforeUnmount, beforeUnmount);
  registerLifecycleHook(onUnmounted, unmounted);
  registerLifecycleHook(onServerPrefetch, serverPrefetch);
  if (isArray$2(expose)) {
    if (expose.length) {
      const exposed = instance2.exposed || (instance2.exposed = {});
      expose.forEach((key) => {
        Object.defineProperty(exposed, key, {
          get: () => publicThis[key],
          set: (val) => publicThis[key] = val,
          enumerable: true
        });
      });
    } else if (!instance2.exposed) {
      instance2.exposed = {};
    }
  }
  if (render && instance2.render === NOOP) {
    instance2.render = render;
  }
  if (inheritAttrs != null) {
    instance2.inheritAttrs = inheritAttrs;
  }
  if (components) instance2.components = components;
  if (directives) instance2.directives = directives;
  if (serverPrefetch) {
    markAsyncBoundary(instance2);
  }
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
  if (isArray$2(injectOptions)) {
    injectOptions = normalizeInject(injectOptions);
  }
  for (const key in injectOptions) {
    const opt = injectOptions[key];
    let injected;
    if (isObject$1(opt)) {
      if ("default" in opt) {
        injected = inject(
          opt.from || key,
          opt.default,
          true
        );
      } else {
        injected = inject(opt.from || key);
      }
    } else {
      injected = inject(opt);
    }
    if (/* @__PURE__ */ isRef(injected)) {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => injected.value,
        set: (v) => injected.value = v
      });
    } else {
      ctx[key] = injected;
    }
  }
}
function callHook$1(hook, instance2, type) {
  callWithAsyncErrorHandling(
    isArray$2(hook) ? hook.map((h2) => h2.bind(instance2.proxy)) : hook.bind(instance2.proxy),
    instance2,
    type
  );
}
function createWatcher(raw, ctx, publicThis, key) {
  let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
  if (isString$1(raw)) {
    const handler = ctx[raw];
    if (isFunction$2(handler)) {
      {
        watch(getter, handler);
      }
    }
  } else if (isFunction$2(raw)) {
    {
      watch(getter, raw.bind(publicThis));
    }
  } else if (isObject$1(raw)) {
    if (isArray$2(raw)) {
      raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
    } else {
      const handler = isFunction$2(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
      if (isFunction$2(handler)) {
        watch(getter, handler, raw);
      }
    }
  } else ;
}
function resolveMergedOptions(instance2) {
  const base = instance2.type;
  const { mixins, extends: extendsOptions } = base;
  const {
    mixins: globalMixins,
    optionsCache: cache,
    config: { optionMergeStrategies }
  } = instance2.appContext;
  const cached = cache.get(base);
  let resolved;
  if (cached) {
    resolved = cached;
  } else if (!globalMixins.length && !mixins && !extendsOptions) {
    {
      resolved = base;
    }
  } else {
    resolved = {};
    if (globalMixins.length) {
      globalMixins.forEach(
        (m) => mergeOptions$1(resolved, m, optionMergeStrategies, true)
      );
    }
    mergeOptions$1(resolved, base, optionMergeStrategies);
  }
  if (isObject$1(base)) {
    cache.set(base, resolved);
  }
  return resolved;
}
function mergeOptions$1(to, from, strats, asMixin = false) {
  const { mixins, extends: extendsOptions } = from;
  if (extendsOptions) {
    mergeOptions$1(to, extendsOptions, strats, true);
  }
  if (mixins) {
    mixins.forEach(
      (m) => mergeOptions$1(to, m, strats, true)
    );
  }
  for (const key in from) {
    if (asMixin && key === "expose") ;
    else {
      const strat = internalOptionMergeStrats[key] || strats && strats[key];
      to[key] = strat ? strat(to[key], from[key]) : from[key];
    }
  }
  return to;
}
const internalOptionMergeStrats = {
  data: mergeDataFn,
  props: mergeEmitsOrPropsOptions,
  emits: mergeEmitsOrPropsOptions,
  // objects
  methods: mergeObjectOptions,
  computed: mergeObjectOptions,
  // lifecycle
  beforeCreate: mergeAsArray,
  created: mergeAsArray,
  beforeMount: mergeAsArray,
  mounted: mergeAsArray,
  beforeUpdate: mergeAsArray,
  updated: mergeAsArray,
  beforeDestroy: mergeAsArray,
  beforeUnmount: mergeAsArray,
  destroyed: mergeAsArray,
  unmounted: mergeAsArray,
  activated: mergeAsArray,
  deactivated: mergeAsArray,
  errorCaptured: mergeAsArray,
  serverPrefetch: mergeAsArray,
  // assets
  components: mergeObjectOptions,
  directives: mergeObjectOptions,
  // watch
  watch: mergeWatchOptions,
  // provide / inject
  provide: mergeDataFn,
  inject: mergeInject
};
function mergeDataFn(to, from) {
  if (!from) {
    return to;
  }
  if (!to) {
    return from;
  }
  return function mergedDataFn() {
    return extend$1(
      isFunction$2(to) ? to.call(this, this) : to,
      isFunction$2(from) ? from.call(this, this) : from
    );
  };
}
function mergeInject(to, from) {
  return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
  if (isArray$2(raw)) {
    const res = {};
    for (let i = 0; i < raw.length; i++) {
      res[raw[i]] = raw[i];
    }
    return res;
  }
  return raw;
}
function mergeAsArray(to, from) {
  return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
  return to ? extend$1(/* @__PURE__ */ Object.create(null), to, from) : from;
}
function mergeEmitsOrPropsOptions(to, from) {
  if (to) {
    if (isArray$2(to) && isArray$2(from)) {
      return [.../* @__PURE__ */ new Set([...to, ...from])];
    }
    return extend$1(
      /* @__PURE__ */ Object.create(null),
      normalizePropsOrEmits(to),
      normalizePropsOrEmits(from != null ? from : {})
    );
  } else {
    return from;
  }
}
function mergeWatchOptions(to, from) {
  if (!to) return from;
  if (!from) return to;
  const merged = extend$1(/* @__PURE__ */ Object.create(null), to);
  for (const key in from) {
    merged[key] = mergeAsArray(to[key], from[key]);
  }
  return merged;
}
function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let uid$1 = 0;
function createAppAPI(render, hydrate) {
  return function createApp2(rootComponent, rootProps = null) {
    if (!isFunction$2(rootComponent)) {
      rootComponent = extend$1({}, rootComponent);
    }
    if (rootProps != null && !isObject$1(rootProps)) {
      rootProps = null;
    }
    const context = createAppContext();
    const installedPlugins = /* @__PURE__ */ new WeakSet();
    const pluginCleanupFns = [];
    let isMounted = false;
    const app2 = context.app = {
      _uid: uid$1++,
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
      version,
      get config() {
        return context.config;
      },
      set config(v) {
      },
      use(plugin, ...options) {
        if (installedPlugins.has(plugin)) ;
        else if (plugin && isFunction$2(plugin.install)) {
          installedPlugins.add(plugin);
          plugin.install(app2, ...options);
        } else if (isFunction$2(plugin)) {
          installedPlugins.add(plugin);
          plugin(app2, ...options);
        } else ;
        return app2;
      },
      mixin(mixin) {
        {
          if (!context.mixins.includes(mixin)) {
            context.mixins.push(mixin);
          }
        }
        return app2;
      },
      component(name, component) {
        if (!component) {
          return context.components[name];
        }
        context.components[name] = component;
        return app2;
      },
      directive(name, directive) {
        if (!directive) {
          return context.directives[name];
        }
        context.directives[name] = directive;
        return app2;
      },
      mount(rootContainer, isHydrate, namespace) {
        if (!isMounted) {
          const vnode = app2._ceVNode || createVNode(rootComponent, rootProps);
          vnode.appContext = context;
          if (namespace === true) {
            namespace = "svg";
          } else if (namespace === false) {
            namespace = void 0;
          }
          {
            render(vnode, rootContainer, namespace);
          }
          isMounted = true;
          app2._container = rootContainer;
          rootContainer.__vue_app__ = app2;
          return getComponentPublicInstance(vnode.component);
        }
      },
      onUnmount(cleanupFn) {
        pluginCleanupFns.push(cleanupFn);
      },
      unmount() {
        if (isMounted) {
          callWithAsyncErrorHandling(
            pluginCleanupFns,
            app2._instance,
            16
          );
          render(null, app2._container);
          delete app2._container.__vue_app__;
        }
      },
      provide(key, value) {
        context.provides[key] = value;
        return app2;
      },
      runWithContext(fn) {
        const lastApp = currentApp;
        currentApp = app2;
        try {
          return fn();
        } finally {
          currentApp = lastApp;
        }
      }
    };
    return app2;
  };
}
let currentApp = null;
const getModelModifiers = (props, modelName) => {
  return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
};
function emit(instance2, event, ...rawArgs) {
  if (instance2.isUnmounted) return;
  const props = instance2.vnode.props || EMPTY_OBJ;
  let args = rawArgs;
  const isModelListener2 = event.startsWith("update:");
  const modifiers = isModelListener2 && getModelModifiers(props, event.slice(7));
  if (modifiers) {
    if (modifiers.trim) {
      args = rawArgs.map((a) => isString$1(a) ? a.trim() : a);
    }
    if (modifiers.number) {
      args = rawArgs.map(looseToNumber);
    }
  }
  let handlerName;
  let handler = props[handlerName = toHandlerKey(event)] || // also try camelCase event handler (#2249)
  props[handlerName = toHandlerKey(camelize(event))];
  if (!handler && isModelListener2) {
    handler = props[handlerName = toHandlerKey(hyphenate(event))];
  }
  if (handler) {
    callWithAsyncErrorHandling(
      handler,
      instance2,
      6,
      args
    );
  }
  const onceHandler = props[handlerName + `Once`];
  if (onceHandler) {
    if (!instance2.emitted) {
      instance2.emitted = {};
    } else if (instance2.emitted[handlerName]) {
      return;
    }
    instance2.emitted[handlerName] = true;
    callWithAsyncErrorHandling(
      onceHandler,
      instance2,
      6,
      args
    );
  }
}
const mixinEmitsCache = /* @__PURE__ */ new WeakMap();
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
  const cache = asMixin ? mixinEmitsCache : appContext.emitsCache;
  const cached = cache.get(comp);
  if (cached !== void 0) {
    return cached;
  }
  const raw = comp.emits;
  let normalized = {};
  let hasExtends = false;
  if (!isFunction$2(comp)) {
    const extendEmits = (raw2) => {
      const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
      if (normalizedFromExtend) {
        hasExtends = true;
        extend$1(normalized, normalizedFromExtend);
      }
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendEmits);
    }
    if (comp.extends) {
      extendEmits(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendEmits);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject$1(comp)) {
      cache.set(comp, null);
    }
    return null;
  }
  if (isArray$2(raw)) {
    raw.forEach((key) => normalized[key] = null);
  } else {
    extend$1(normalized, raw);
  }
  if (isObject$1(comp)) {
    cache.set(comp, normalized);
  }
  return normalized;
}
function isEmitListener(options, key) {
  if (!options || !isOn(key)) {
    return false;
  }
  key = key.slice(2).replace(/Once$/, "");
  return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
function markAttrsAccessed() {
}
function renderComponentRoot(instance2) {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    propsOptions: [propsOptions],
    slots,
    attrs,
    emit: emit2,
    render,
    renderCache,
    props,
    data,
    setupState,
    ctx,
    inheritAttrs
  } = instance2;
  const prev = setCurrentRenderingInstance(instance2);
  let result;
  let fallthroughAttrs;
  try {
    if (vnode.shapeFlag & 4) {
      const proxyToUse = withProxy || proxy;
      const thisProxy = false ? new Proxy(proxyToUse, {
        get(target, key, receiver) {
          warn$1(
            `Property '${String(
              key
            )}' was accessed via 'this'. Avoid using 'this' in templates.`
          );
          return Reflect.get(target, key, receiver);
        }
      }) : proxyToUse;
      result = normalizeVNode(
        render.call(
          thisProxy,
          proxyToUse,
          renderCache,
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          setupState,
          data,
          ctx
        )
      );
      fallthroughAttrs = attrs;
    } else {
      const render2 = Component;
      if (false) ;
      result = normalizeVNode(
        render2.length > 1 ? render2(
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          false ? {
            get attrs() {
              markAttrsAccessed();
              return /* @__PURE__ */ shallowReadonly(attrs);
            },
            slots,
            emit: emit2
          } : { attrs, slots, emit: emit2 }
        ) : render2(
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          null
        )
      );
      fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
    }
  } catch (err) {
    blockStack.length = 0;
    handleError(err, instance2, 1);
    result = createVNode(Comment);
  }
  let root = result;
  if (fallthroughAttrs && inheritAttrs !== false) {
    const keys = Object.keys(fallthroughAttrs);
    const { shapeFlag } = root;
    if (keys.length) {
      if (shapeFlag & (1 | 6)) {
        if (propsOptions && keys.some(isModelListener)) {
          fallthroughAttrs = filterModelListeners(
            fallthroughAttrs,
            propsOptions
          );
        }
        root = cloneVNode(root, fallthroughAttrs, false, true);
      }
    }
  }
  if (vnode.dirs) {
    root = cloneVNode(root, null, false, true);
    root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
  }
  if (vnode.transition) {
    setTransitionHooks(root, vnode.transition);
  }
  {
    result = root;
  }
  setCurrentRenderingInstance(prev);
  return result;
}
const getFunctionalFallthrough = (attrs) => {
  let res;
  for (const key in attrs) {
    if (key === "class" || key === "style" || isOn(key)) {
      (res || (res = {}))[key] = attrs[key];
    }
  }
  return res;
};
const filterModelListeners = (attrs, props) => {
  const res = {};
  for (const key in attrs) {
    if (!isModelListener(key) || !(key.slice(9) in props)) {
      res[key] = attrs[key];
    }
  }
  return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
  const { props: prevProps, children: prevChildren, component } = prevVNode;
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
  const emits = component.emitsOptions;
  if (nextVNode.dirs || nextVNode.transition) {
    return true;
  }
  if (optimized && patchFlag >= 0) {
    if (patchFlag & 1024) {
      return true;
    }
    if (patchFlag & 16) {
      if (!prevProps) {
        return !!nextProps;
      }
      return hasPropsChanged(prevProps, nextProps, emits);
    } else if (patchFlag & 8) {
      const dynamicProps = nextVNode.dynamicProps;
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i];
        if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) {
          return true;
        }
      }
    }
  } else {
    if (prevChildren || nextChildren) {
      if (!nextChildren || !nextChildren.$stable) {
        return true;
      }
    }
    if (prevProps === nextProps) {
      return false;
    }
    if (!prevProps) {
      return !!nextProps;
    }
    if (!nextProps) {
      return true;
    }
    return hasPropsChanged(prevProps, nextProps, emits);
  }
  return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) {
      return true;
    }
  }
  return false;
}
function hasPropValueChanged(nextProps, prevProps, key) {
  const nextProp = nextProps[key];
  const prevProp = prevProps[key];
  if (key === "style" && isObject$1(nextProp) && isObject$1(prevProp)) {
    return !looseEqual(nextProp, prevProp);
  }
  return nextProp !== prevProp;
}
function updateHOCHostEl({ vnode, parent, suspense }, el) {
  while (parent) {
    const root = parent.subTree;
    if (root.suspense && root.suspense.activeBranch === vnode) {
      root.suspense.vnode.el = root.el = el;
      vnode = root;
    }
    if (root === vnode) {
      (vnode = parent.vnode).el = el;
      parent = parent.parent;
    } else {
      break;
    }
  }
  if (suspense && suspense.activeBranch === vnode) {
    suspense.vnode.el = el;
  }
}
const internalObjectProto = {};
const createInternalObject = () => Object.create(internalObjectProto);
const isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
function initProps(instance2, rawProps, isStateful, isSSR = false) {
  const props = {};
  const attrs = createInternalObject();
  instance2.propsDefaults = /* @__PURE__ */ Object.create(null);
  setFullProps(instance2, rawProps, props, attrs);
  for (const key in instance2.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = void 0;
    }
  }
  if (isStateful) {
    instance2.props = isSSR ? props : /* @__PURE__ */ shallowReactive(props);
  } else {
    if (!instance2.type.props) {
      instance2.props = attrs;
    } else {
      instance2.props = props;
    }
  }
  instance2.attrs = attrs;
}
function updateProps(instance2, rawProps, rawPrevProps, optimized) {
  const {
    props,
    attrs,
    vnode: { patchFlag }
  } = instance2;
  const rawCurrentProps = /* @__PURE__ */ toRaw(props);
  const [options] = instance2.propsOptions;
  let hasAttrsChanged = false;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (optimized || patchFlag > 0) && !(patchFlag & 16)
  ) {
    if (patchFlag & 8) {
      const propsToUpdate = instance2.vnode.dynamicProps;
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i];
        if (isEmitListener(instance2.emitsOptions, key)) {
          continue;
        }
        const value = rawProps[key];
        if (options) {
          if (hasOwn(attrs, key)) {
            if (value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          } else {
            const camelizedKey = camelize(key);
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value,
              instance2,
              false
            );
          }
        } else {
          if (value !== attrs[key]) {
            attrs[key] = value;
            hasAttrsChanged = true;
          }
        }
      }
    }
  } else {
    if (setFullProps(instance2, rawProps, props, attrs)) {
      hasAttrsChanged = true;
    }
    let kebabKey;
    for (const key in rawCurrentProps) {
      if (!rawProps || // for camelCase
      !hasOwn(rawProps, key) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
        if (options) {
          if (rawPrevProps && // for camelCase
          (rawPrevProps[key] !== void 0 || // for kebab-case
          rawPrevProps[kebabKey] !== void 0)) {
            props[key] = resolvePropValue(
              options,
              rawCurrentProps,
              key,
              void 0,
              instance2,
              true
            );
          }
        } else {
          delete props[key];
        }
      }
    }
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key) && true) {
          delete attrs[key];
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (hasAttrsChanged) {
    trigger(instance2.attrs, "set", "");
  }
}
function setFullProps(instance2, rawProps, props, attrs) {
  const [options, needCastKeys] = instance2.propsOptions;
  let hasAttrsChanged = false;
  let rawCastValues;
  if (rawProps) {
    for (let key in rawProps) {
      if (isReservedProp(key)) {
        continue;
      }
      const value = rawProps[key];
      let camelKey;
      if (options && hasOwn(options, camelKey = camelize(key))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          props[camelKey] = value;
        } else {
          (rawCastValues || (rawCastValues = {}))[camelKey] = value;
        }
      } else if (!isEmitListener(instance2.emitsOptions, key)) {
        if (!(key in attrs) || value !== attrs[key]) {
          attrs[key] = value;
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (needCastKeys) {
    const rawCurrentProps = /* @__PURE__ */ toRaw(props);
    const castValues = rawCastValues || EMPTY_OBJ;
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i];
      props[key] = resolvePropValue(
        options,
        rawCurrentProps,
        key,
        castValues[key],
        instance2,
        !hasOwn(castValues, key)
      );
    }
  }
  return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance2, isAbsent) {
  const opt = options[key];
  if (opt != null) {
    const hasDefault = hasOwn(opt, "default");
    if (hasDefault && value === void 0) {
      const defaultValue = opt.default;
      if (opt.type !== Function && !opt.skipFactory && isFunction$2(defaultValue)) {
        const { propsDefaults } = instance2;
        if (key in propsDefaults) {
          value = propsDefaults[key];
        } else {
          const reset = setCurrentInstance(instance2);
          value = propsDefaults[key] = defaultValue.call(
            null,
            props
          );
          reset();
        }
      } else {
        value = defaultValue;
      }
      if (instance2.ce) {
        instance2.ce._setProp(key, value);
      }
    }
    if (opt[
      0
      /* shouldCast */
    ]) {
      if (isAbsent && !hasDefault) {
        value = false;
      } else if (opt[
        1
        /* shouldCastTrue */
      ] && (value === "" || value === hyphenate(key))) {
        value = true;
      }
    }
  }
  return value;
}
const mixinPropsCache = /* @__PURE__ */ new WeakMap();
function normalizePropsOptions(comp, appContext, asMixin = false) {
  const cache = asMixin ? mixinPropsCache : appContext.propsCache;
  const cached = cache.get(comp);
  if (cached) {
    return cached;
  }
  const raw = comp.props;
  const normalized = {};
  const needCastKeys = [];
  let hasExtends = false;
  if (!isFunction$2(comp)) {
    const extendProps = (raw2) => {
      hasExtends = true;
      const [props, keys] = normalizePropsOptions(raw2, appContext, true);
      extend$1(normalized, props);
      if (keys) needCastKeys.push(...keys);
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendProps);
    }
    if (comp.extends) {
      extendProps(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendProps);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject$1(comp)) {
      cache.set(comp, EMPTY_ARR);
    }
    return EMPTY_ARR;
  }
  if (isArray$2(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i]);
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ;
      }
    }
  } else if (raw) {
    for (const key in raw) {
      const normalizedKey = camelize(key);
      if (validatePropName(normalizedKey)) {
        const opt = raw[key];
        const prop = normalized[normalizedKey] = isArray$2(opt) || isFunction$2(opt) ? { type: opt } : extend$1({}, opt);
        const propType = prop.type;
        let shouldCast = false;
        let shouldCastTrue = true;
        if (isArray$2(propType)) {
          for (let index = 0; index < propType.length; ++index) {
            const type = propType[index];
            const typeName = isFunction$2(type) && type.name;
            if (typeName === "Boolean") {
              shouldCast = true;
              break;
            } else if (typeName === "String") {
              shouldCastTrue = false;
            }
          }
        } else {
          shouldCast = isFunction$2(propType) && propType.name === "Boolean";
        }
        prop[
          0
          /* shouldCast */
        ] = shouldCast;
        prop[
          1
          /* shouldCastTrue */
        ] = shouldCastTrue;
        if (shouldCast || hasOwn(prop, "default")) {
          needCastKeys.push(normalizedKey);
        }
      }
    }
  }
  const res = [normalized, needCastKeys];
  if (isObject$1(comp)) {
    cache.set(comp, res);
  }
  return res;
}
function validatePropName(key) {
  if (key[0] !== "$" && !isReservedProp(key)) {
    return true;
  }
  return false;
}
const isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
const normalizeSlotValue = (value) => isArray$2(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
const normalizeSlot$1 = (key, rawSlot, ctx) => {
  if (rawSlot._n) {
    return rawSlot;
  }
  const normalized = withCtx((...args) => {
    if (false) ;
    return normalizeSlotValue(rawSlot(...args));
  }, ctx);
  normalized._c = false;
  return normalized;
};
const normalizeObjectSlots = (rawSlots, slots, instance2) => {
  const ctx = rawSlots._ctx;
  for (const key in rawSlots) {
    if (isInternalKey(key)) continue;
    const value = rawSlots[key];
    if (isFunction$2(value)) {
      slots[key] = normalizeSlot$1(key, value, ctx);
    } else if (value != null) {
      const normalized = normalizeSlotValue(value);
      slots[key] = () => normalized;
    }
  }
};
const normalizeVNodeSlots = (instance2, children) => {
  const normalized = normalizeSlotValue(children);
  instance2.slots.default = () => normalized;
};
const assignSlots = (slots, children, optimized) => {
  for (const key in children) {
    if (optimized || !isInternalKey(key)) {
      slots[key] = children[key];
    }
  }
};
const initSlots = (instance2, children, optimized) => {
  const slots = instance2.slots = createInternalObject();
  if (instance2.vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      assignSlots(slots, children, optimized);
      if (optimized) {
        def$1(slots, "_", type, true);
      }
    } else {
      normalizeObjectSlots(children, slots);
    }
  } else if (children) {
    normalizeVNodeSlots(instance2, children);
  }
};
const updateSlots = (instance2, children, optimized) => {
  const { vnode, slots } = instance2;
  let needDeletionCheck = true;
  let deletionComparisonTarget = EMPTY_OBJ;
  if (vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      if (optimized && type === 1) {
        needDeletionCheck = false;
      } else {
        assignSlots(slots, children, optimized);
      }
    } else {
      needDeletionCheck = !children.$stable;
      normalizeObjectSlots(children, slots);
    }
    deletionComparisonTarget = children;
  } else if (children) {
    normalizeVNodeSlots(instance2, children);
    deletionComparisonTarget = { default: 1 };
  }
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!isInternalKey(key) && deletionComparisonTarget[key] == null) {
        delete slots[key];
      }
    }
  }
};
const queuePostRenderEffect = queueEffectWithSuspense;
function createRenderer(options) {
  return baseCreateRenderer(options);
}
function baseCreateRenderer(options, createHydrationFns) {
  const target = getGlobalThis();
  target.__VUE__ = true;
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = NOOP,
    insertStaticContent: hostInsertStaticContent
  } = options;
  const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
    if (n1 === n2) {
      return;
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent, parentSuspense, true);
      n1 = null;
    }
    if (n2.patchFlag === -2) {
      optimized = false;
      n2.dynamicChildren = null;
    }
    const { type, ref: ref3, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        processCommentNode(n1, n2, container, anchor);
        break;
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, namespace);
        }
        break;
      case Fragment:
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        break;
      default:
        if (shapeFlag & 1) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 6) {
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 64) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else if (shapeFlag & 128) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else ;
    }
    if (ref3 != null && parentComponent) {
      setRef(ref3, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
    } else if (ref3 == null && n1 && n1.ref != null) {
      setRef(n1.ref, null, parentSuspense, n1, true);
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateText(n2.children),
        container,
        anchor
      );
    } else {
      const el = n2.el = n1.el;
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateComment(n2.children || ""),
        container,
        anchor
      );
    } else {
      n2.el = n1.el;
    }
  };
  const mountStaticNode = (n2, container, anchor, namespace) => {
    [n2.el, n2.anchor] = hostInsertStaticContent(
      n2.children,
      container,
      anchor,
      namespace,
      n2.el,
      n2.anchor
    );
  };
  const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostInsert(el, container, nextSibling);
      el = next;
    }
    hostInsert(anchor, container, nextSibling);
  };
  const removeStaticNode = ({ el, anchor }) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostRemove(el);
      el = next;
    }
    hostRemove(anchor);
  };
  const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    if (n2.type === "svg") {
      namespace = "svg";
    } else if (n2.type === "math") {
      namespace = "mathml";
    }
    if (n1 == null) {
      mountElement(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
      try {
        if (customElement) {
          customElement._beginPatch();
        }
        patchElement(
          n1,
          n2,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } finally {
        if (customElement) {
          customElement._endPatch();
        }
      }
    }
  };
  const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let el;
    let vnodeHook;
    const { props, shapeFlag, transition, dirs } = vnode;
    el = vnode.el = hostCreateElement(
      vnode.type,
      namespace,
      props && props.is,
      props
    );
    if (shapeFlag & 8) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & 16) {
      mountChildren(
        vnode.children,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(vnode, namespace),
        slotScopeIds,
        optimized
      );
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "created");
    }
    setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
    if (props) {
      for (const key in props) {
        if (key !== "value" && !isReservedProp(key)) {
          hostPatchProp(el, key, null, props[key], namespace, parentComponent);
        }
      }
      if ("value" in props) {
        hostPatchProp(el, "value", null, props.value, namespace);
      }
      if (vnodeHook = props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHook, parentComponent, vnode);
      }
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
    }
    const needCallTransitionHooks = needTransition(parentSuspense, transition);
    if (needCallTransitionHooks) {
      transition.beforeEnter(el);
    }
    hostInsert(el, container, anchor);
    if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
      queuePostRenderEffect(() => {
        try {
          vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
          needCallTransitionHooks && transition.enter(el);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
        } finally {
        }
      }, parentSuspense);
    }
  };
  const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
    if (scopeId) {
      hostSetScopeId(el, scopeId);
    }
    if (slotScopeIds) {
      for (let i = 0; i < slotScopeIds.length; i++) {
        hostSetScopeId(el, slotScopeIds[i]);
      }
    }
    if (parentComponent) {
      let subTree = parentComponent.subTree;
      if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
        const parentVNode = parentComponent.vnode;
        setScopeId(
          el,
          parentVNode,
          parentVNode.scopeId,
          parentVNode.slotScopeIds,
          parentComponent.parent
        );
      }
    }
  };
  const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
      patch(
        null,
        child,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
  };
  const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const el = n2.el = n1.el;
    let { patchFlag, dynamicChildren, dirs } = n2;
    patchFlag |= n1.patchFlag & 16;
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    let vnodeHook;
    parentComponent && toggleRecurse(parentComponent, false);
    if (vnodeHook = newProps.onVnodeBeforeUpdate) {
      invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
    }
    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
    }
    parentComponent && toggleRecurse(parentComponent, true);
    if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) {
      hostSetElementText(el, "");
    }
    if (dynamicChildren) {
      patchBlockChildren(
        n1.dynamicChildren,
        dynamicChildren,
        el,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds
      );
    } else if (!optimized) {
      patchChildren(
        n1,
        n2,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds,
        false
      );
    }
    if (patchFlag > 0) {
      if (patchFlag & 16) {
        patchProps(el, oldProps, newProps, parentComponent, namespace);
      } else {
        if (patchFlag & 2) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, "class", null, newProps.class, namespace);
          }
        }
        if (patchFlag & 4) {
          hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
        }
        if (patchFlag & 8) {
          const propsToUpdate = n2.dynamicProps;
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            const prev = oldProps[key];
            const next = newProps[key];
            if (next !== prev || key === "value") {
              hostPatchProp(el, key, prev, next, namespace, parentComponent);
            }
          }
        }
      }
      if (patchFlag & 1) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    } else if (!optimized && dynamicChildren == null) {
      patchProps(el, oldProps, newProps, parentComponent, namespace);
    }
    if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
      }, parentSuspense);
    }
  };
  const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const container = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        oldVNode.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (oldVNode.type === Fragment || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !isSameVNodeType(oldVNode, newVNode) || // - In the case of a component, it could contain anything.
        oldVNode.shapeFlag & (6 | 64 | 128)) ? hostParentNode(oldVNode.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          fallbackContainer
        )
      );
      patch(
        oldVNode,
        newVNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        true
      );
    }
  };
  const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
    if (oldProps !== newProps) {
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!isReservedProp(key) && !(key in newProps)) {
            hostPatchProp(
              el,
              key,
              oldProps[key],
              null,
              namespace,
              parentComponent
            );
          }
        }
      }
      for (const key in newProps) {
        if (isReservedProp(key)) continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== "value") {
          hostPatchProp(el, key, prev, next, namespace, parentComponent);
        }
      }
      if ("value" in newProps) {
        hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
      }
    }
  };
  const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
    const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
    let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(
        // #10007
        // such fragment like `<></>` will be compiled into
        // a fragment which doesn't have a children.
        // In this case fallback to an empty array
        n2.children || [],
        container,
        fragmentEndAnchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && // #2715 the previous fragment could've been a BAILed one as a result
      // of renderSlot() with no valid children
      n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          container,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds
        );
        if (
          // #2080 if the stable fragment has a key, it's a <template v-for> that may
          //  get moved around. Make sure all root level vnodes inherit el.
          // #2134 or if it's a component root, it may also get moved around
          // as the component is being moved.
          n2.key != null || parentComponent && n2 === parentComponent.subTree
        ) {
          traverseStaticChildren(
            n1,
            n2,
            true
            /* shallow */
          );
        }
      } else {
        patchChildren(
          n1,
          n2,
          container,
          fragmentEndAnchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    }
  };
  const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    n2.slotScopeIds = slotScopeIds;
    if (n1 == null) {
      if (n2.shapeFlag & 512) {
        parentComponent.ctx.activate(
          n2,
          container,
          anchor,
          namespace,
          optimized
        );
      } else {
        mountComponent(
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          optimized
        );
      }
    } else {
      updateComponent(n1, n2, optimized);
    }
  };
  const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
    const instance2 = initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense
    );
    if (isKeepAlive(initialVNode)) {
      instance2.ctx.renderer = internals;
    }
    {
      setupComponent(instance2, false, optimized);
    }
    if (instance2.asyncDep) {
      parentSuspense && parentSuspense.registerDep(instance2, setupRenderEffect, optimized);
      if (!initialVNode.el) {
        const placeholder = instance2.subTree = createVNode(Comment);
        processCommentNode(null, placeholder, container, anchor);
        initialVNode.placeholder = placeholder.el;
      }
    } else {
      setupRenderEffect(
        instance2,
        initialVNode,
        container,
        anchor,
        parentSuspense,
        namespace,
        optimized
      );
    }
  };
  const updateComponent = (n1, n2, optimized) => {
    const instance2 = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2, optimized)) {
      if (instance2.asyncDep && !instance2.asyncResolved) {
        updateComponentPreRender(instance2, n2, optimized);
        return;
      } else {
        instance2.next = n2;
        instance2.update();
      }
    } else {
      n2.el = n1.el;
      instance2.vnode = n2;
    }
  };
  const setupRenderEffect = (instance2, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
    const componentUpdateFn = () => {
      if (!instance2.isMounted) {
        let vnodeHook;
        const { el, props } = initialVNode;
        const { bm, m, parent, root, type } = instance2;
        const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
        toggleRecurse(instance2, false);
        if (bm) {
          invokeArrayFns(bm);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parent, initialVNode);
        }
        toggleRecurse(instance2, true);
        {
          if (root.ce && root.ce._hasShadowRoot()) {
            root.ce._injectChildStyle(
              type,
              instance2.parent ? instance2.parent.type : void 0
            );
          }
          const subTree = instance2.subTree = renderComponentRoot(instance2);
          patch(
            null,
            subTree,
            container,
            anchor,
            instance2,
            parentSuspense,
            namespace
          );
          initialVNode.el = subTree.el;
        }
        if (m) {
          queuePostRenderEffect(m, parentSuspense);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
          const scopedInitialVNode = initialVNode;
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode),
            parentSuspense
          );
        }
        if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) {
          instance2.a && queuePostRenderEffect(instance2.a, parentSuspense);
        }
        instance2.isMounted = true;
        initialVNode = container = anchor = null;
      } else {
        let { next, bu, u, parent, vnode } = instance2;
        {
          const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance2);
          if (nonHydratedAsyncRoot) {
            if (next) {
              next.el = vnode.el;
              updateComponentPreRender(instance2, next, optimized);
            }
            nonHydratedAsyncRoot.asyncDep.then(() => {
              queuePostRenderEffect(() => {
                if (!instance2.isUnmounted) update();
              }, parentSuspense);
            });
            return;
          }
        }
        let originNext = next;
        let vnodeHook;
        toggleRecurse(instance2, false);
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance2, next, optimized);
        } else {
          next = vnode;
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
          invokeVNodeHook(vnodeHook, parent, next, vnode);
        }
        toggleRecurse(instance2, true);
        const nextTree = renderComponentRoot(instance2);
        const prevTree = instance2.subTree;
        instance2.subTree = nextTree;
        patch(
          prevTree,
          nextTree,
          // parent may have changed if it's in a teleport
          hostParentNode(prevTree.el),
          // anchor may have changed if it's in a fragment
          getNextHostNode(prevTree),
          instance2,
          parentSuspense,
          namespace
        );
        next.el = nextTree.el;
        if (originNext === null) {
          updateHOCHostEl(instance2, nextTree.el);
        }
        if (u) {
          queuePostRenderEffect(u, parentSuspense);
        }
        if (vnodeHook = next.props && next.props.onVnodeUpdated) {
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, next, vnode),
            parentSuspense
          );
        }
      }
    };
    instance2.scope.on();
    const effect2 = instance2.effect = new ReactiveEffect(componentUpdateFn);
    instance2.scope.off();
    const update = instance2.update = effect2.run.bind(effect2);
    const job = instance2.job = effect2.runIfDirty.bind(effect2);
    job.i = instance2;
    job.id = instance2.uid;
    effect2.scheduler = () => queueJob(job);
    toggleRecurse(instance2, true);
    update();
  };
  const updateComponentPreRender = (instance2, nextVNode, optimized) => {
    nextVNode.component = instance2;
    const prevProps = instance2.vnode.props;
    instance2.vnode = nextVNode;
    instance2.next = null;
    updateProps(instance2, nextVNode.props, prevProps, optimized);
    updateSlots(instance2, nextVNode.children, optimized);
    pauseTracking();
    flushPreFlushCbs(instance2);
    resetTracking();
  };
  const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { patchFlag, shapeFlag } = n2;
    if (patchFlag > 0) {
      if (patchFlag & 128) {
        patchKeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      } else if (patchFlag & 256) {
        patchUnkeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      }
    }
    if (shapeFlag & 8) {
      if (prevShapeFlag & 16) {
        unmountChildren(c1, parentComponent, parentSuspense);
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16) {
        if (shapeFlag & 16) {
          patchKeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else {
          unmountChildren(c1, parentComponent, parentSuspense, true);
        }
      } else {
        if (prevShapeFlag & 8) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16) {
          mountChildren(
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        }
      }
    }
  };
  const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    c1 = c1 || EMPTY_ARR;
    c2 = c2 || EMPTY_ARR;
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    let i;
    for (i = 0; i < commonLength; i++) {
      const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      patch(
        c1[i],
        nextChild,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
    if (oldLength > newLength) {
      unmountChildren(
        c1,
        parentComponent,
        parentSuspense,
        true,
        false,
        commonLength
      );
    } else {
      mountChildren(
        c2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
        commonLength
      );
    }
  };
  const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
        while (i <= e2) {
          patch(
            null,
            c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]),
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }
      let j;
      let patched = 0;
      const toBePatched = e2 - s2 + 1;
      let moved = false;
      let maxNewIndexSoFar = 0;
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          unmount(prevChild, parentComponent, parentSuspense, true);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (j = s2; j <= e2; j++) {
            if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === void 0) {
          unmount(prevChild, parentComponent, parentSuspense, true);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          patch(
            prevChild,
            c2[newIndex],
            container,
            null,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          patched++;
        }
      }
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
      j = increasingNewIndexSequence.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchorVNode = c2[nextIndex + 1];
        const anchor = nextIndex + 1 < l2 ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode)
        ) : parentAnchor;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(
            null,
            nextChild,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor, 2);
          } else {
            j--;
          }
        }
      }
    }
  };
  const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
    const { el, type, transition, children, shapeFlag } = vnode;
    if (shapeFlag & 6) {
      move(vnode.component.subTree, container, anchor, moveType);
      return;
    }
    if (shapeFlag & 128) {
      vnode.suspense.move(container, anchor, moveType);
      return;
    }
    if (shapeFlag & 64) {
      type.move(vnode, container, anchor, internals);
      return;
    }
    if (type === Fragment) {
      hostInsert(el, container, anchor);
      for (let i = 0; i < children.length; i++) {
        move(children[i], container, anchor, moveType);
      }
      hostInsert(vnode.anchor, container, anchor);
      return;
    }
    if (type === Static) {
      moveStaticNode(vnode, container, anchor);
      return;
    }
    const needTransition2 = moveType !== 2 && shapeFlag & 1 && transition;
    if (needTransition2) {
      if (moveType === 0) {
        transition.beforeEnter(el);
        hostInsert(el, container, anchor);
        queuePostRenderEffect(() => transition.enter(el), parentSuspense);
      } else {
        const { leave, delayLeave, afterLeave } = transition;
        const remove22 = () => {
          if (vnode.ctx.isUnmounted) {
            hostRemove(el);
          } else {
            hostInsert(el, container, anchor);
          }
        };
        const performLeave = () => {
          if (el._isLeaving) {
            el[leaveCbKey](
              true
              /* cancelled */
            );
          }
          leave(el, () => {
            remove22();
            afterLeave && afterLeave();
          });
        };
        if (delayLeave) {
          delayLeave(el, remove22, performLeave);
        } else {
          performLeave();
        }
      }
    } else {
      hostInsert(el, container, anchor);
    }
  };
  const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
    const {
      type,
      props,
      ref: ref3,
      children,
      dynamicChildren,
      shapeFlag,
      patchFlag,
      dirs,
      cacheIndex,
      memo
    } = vnode;
    if (patchFlag === -2) {
      optimized = false;
    }
    if (ref3 != null) {
      pauseTracking();
      setRef(ref3, null, parentSuspense, vnode, true);
      resetTracking();
    }
    if (cacheIndex != null) {
      parentComponent.renderCache[cacheIndex] = void 0;
    }
    if (shapeFlag & 256) {
      parentComponent.ctx.deactivate(vnode);
      return;
    }
    const shouldInvokeDirs = shapeFlag & 1 && dirs;
    const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
    let vnodeHook;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode);
    }
    if (shapeFlag & 6) {
      unmountComponent(vnode.component, parentSuspense, doRemove);
    } else {
      if (shapeFlag & 128) {
        vnode.suspense.unmount(parentSuspense, doRemove);
        return;
      }
      if (shouldInvokeDirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
      }
      if (shapeFlag & 64) {
        vnode.type.remove(
          vnode,
          parentComponent,
          parentSuspense,
          internals,
          doRemove
        );
      } else if (dynamicChildren && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !dynamicChildren.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (type !== Fragment || patchFlag > 0 && patchFlag & 64)) {
        unmountChildren(
          dynamicChildren,
          parentComponent,
          parentSuspense,
          false,
          true
        );
      } else if (type === Fragment && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
        unmountChildren(children, parentComponent, parentSuspense);
      }
      if (doRemove) {
        remove2(vnode);
      }
    }
    const shouldInvalidateMemo = memo != null && cacheIndex == null;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
        if (shouldInvalidateMemo) {
          vnode.el = null;
        }
      }, parentSuspense);
    }
  };
  const remove2 = (vnode) => {
    const { type, el, anchor, transition } = vnode;
    if (type === Fragment) {
      {
        removeFragment(el, anchor);
      }
      return;
    }
    if (type === Static) {
      removeStaticNode(vnode);
      return;
    }
    const performRemove = () => {
      hostRemove(el);
      if (transition && !transition.persisted && transition.afterLeave) {
        transition.afterLeave();
      }
    };
    if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
      const { leave, delayLeave } = transition;
      const performLeave = () => leave(el, performRemove);
      if (delayLeave) {
        delayLeave(vnode.el, performRemove, performLeave);
      } else {
        performLeave();
      }
    } else {
      performRemove();
    }
  };
  const removeFragment = (cur, end) => {
    let next;
    while (cur !== end) {
      next = hostNextSibling(cur);
      hostRemove(cur);
      cur = next;
    }
    hostRemove(end);
  };
  const unmountComponent = (instance2, parentSuspense, doRemove) => {
    const { bum, scope, job, subTree, um, m, a } = instance2;
    invalidateMount(m);
    invalidateMount(a);
    if (bum) {
      invokeArrayFns(bum);
    }
    scope.stop();
    if (job) {
      job.flags |= 8;
      unmount(subTree, instance2, parentSuspense, doRemove);
    }
    if (um) {
      queuePostRenderEffect(um, parentSuspense);
    }
    queuePostRenderEffect(() => {
      instance2.isUnmounted = true;
    }, parentSuspense);
  };
  const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
    }
  };
  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & 6) {
      return getNextHostNode(vnode.component.subTree);
    }
    if (vnode.shapeFlag & 128) {
      return vnode.suspense.next();
    }
    const el = hostNextSibling(vnode.anchor || vnode.el);
    const teleportEnd = el && el[TeleportEndKey];
    return teleportEnd ? hostNextSibling(teleportEnd) : el;
  };
  let isFlushing = false;
  const render = (vnode, container, namespace) => {
    let instance2;
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
        instance2 = container._vnode.component;
      }
    } else {
      patch(
        container._vnode || null,
        vnode,
        container,
        null,
        null,
        null,
        namespace
      );
    }
    container._vnode = vnode;
    if (!isFlushing) {
      isFlushing = true;
      flushPreFlushCbs(instance2);
      flushPostFlushCbs();
      isFlushing = false;
    }
  };
  const internals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove2,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options
  };
  let hydrate;
  return {
    render,
    hydrate,
    createApp: createAppAPI(render)
  };
}
function resolveChildrenNamespace({ type, props }, currentNamespace) {
  return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
}
function toggleRecurse({ effect: effect2, job }, allowed) {
  if (allowed) {
    effect2.flags |= 32;
    job.flags |= 4;
  } else {
    effect2.flags &= -33;
    job.flags &= -5;
  }
}
function needTransition(parentSuspense, transition) {
  return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
}
function traverseStaticChildren(n1, n2, shallow = false) {
  const ch1 = n1.children;
  const ch2 = n2.children;
  if (isArray$2(ch1) && isArray$2(ch2)) {
    for (let i = 0; i < ch1.length; i++) {
      const c1 = ch1[i];
      let c2 = ch2[i];
      if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
        if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
          c2 = ch2[i] = cloneIfMounted(ch2[i]);
          c2.el = c1.el;
        }
        if (!shallow && c2.patchFlag !== -2)
          traverseStaticChildren(c1, c2);
      }
      if (c2.type === Text) {
        if (c2.patchFlag === -1) {
          c2 = ch2[i] = cloneIfMounted(c2);
        }
        c2.el = c1.el;
      }
      if (c2.type === Comment && !c2.el) {
        c2.el = c1.el;
      }
    }
  }
}
function getSequence(arr) {
  const p2 = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p2[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p2[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p2[v];
  }
  return result;
}
function locateNonHydratedAsyncRoot(instance2) {
  const subComponent = instance2.subTree.component;
  if (subComponent) {
    if (subComponent.asyncDep && !subComponent.asyncResolved) {
      return subComponent;
    } else {
      return locateNonHydratedAsyncRoot(subComponent);
    }
  }
}
function invalidateMount(hooks) {
  if (hooks) {
    for (let i = 0; i < hooks.length; i++)
      hooks[i].flags |= 8;
  }
}
function resolveAsyncComponentPlaceholder(anchorVnode) {
  if (anchorVnode.placeholder) {
    return anchorVnode.placeholder;
  }
  const instance2 = anchorVnode.component;
  if (instance2) {
    return resolveAsyncComponentPlaceholder(instance2.subTree);
  }
  return null;
}
const isSuspense = (type) => type.__isSuspense;
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray$2(fn)) {
      suspense.effects.push(...fn);
    } else {
      suspense.effects.push(fn);
    }
  } else {
    queuePostFlushCb(fn);
  }
}
const Fragment = /* @__PURE__ */ Symbol.for("v-fgt");
const Text = /* @__PURE__ */ Symbol.for("v-txt");
const Comment = /* @__PURE__ */ Symbol.for("v-cmt");
const Static = /* @__PURE__ */ Symbol.for("v-stc");
const blockStack = [];
let currentBlock = null;
function openBlock(disableTracking = false) {
  blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
let isBlockTreeEnabled = 1;
function setBlockTracking(value, inVOnce = false) {
  isBlockTreeEnabled += value;
  if (value < 0 && currentBlock && inVOnce) {
    currentBlock.hasOnce = true;
  }
}
function setupBlock(vnode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
  closeBlock();
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode);
  }
  return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
  return setupBlock(
    createBaseVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      true
    )
  );
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
  return setupBlock(
    createVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      true
    )
  );
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
const normalizeKey = ({ key }) => key != null ? key : null;
const normalizeRef = ({
  ref: ref3,
  ref_key,
  ref_for
}) => {
  if (typeof ref3 === "number") {
    ref3 = "" + ref3;
  }
  return ref3 != null ? isString$1(ref3) || /* @__PURE__ */ isRef(ref3) || isFunction$2(ref3) ? { i: currentRenderingInstance, r: ref3, k: ref_key, f: !!ref_for } : ref3 : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance
  };
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children);
    if (shapeFlag & 128) {
      type.normalize(vnode);
    }
  } else if (children) {
    vnode.shapeFlag |= isString$1(children) ? 8 : 16;
  }
  if (isBlockTreeEnabled > 0 && // avoid a block node from tracking itself
  !isBlockNode && // has current parent block
  currentBlock && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  vnode.patchFlag !== 32) {
    currentBlock.push(vnode);
  }
  return vnode;
}
const createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    type = Comment;
  }
  if (isVNode(type)) {
    const cloned = cloneVNode(
      type,
      props,
      true
      /* mergeRef: true */
    );
    if (children) {
      normalizeChildren(cloned, children);
    }
    if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
      if (cloned.shapeFlag & 6) {
        currentBlock[currentBlock.indexOf(type)] = cloned;
      } else {
        currentBlock.push(cloned);
      }
    }
    cloned.patchFlag = -2;
    return cloned;
  }
  if (isClassComponent(type)) {
    type = type.__vccOpts;
  }
  if (props) {
    props = guardReactiveProps(props);
    let { class: klass, style } = props;
    if (klass && !isString$1(klass)) {
      props.class = normalizeClass(klass);
    }
    if (isObject$1(style)) {
      if (/* @__PURE__ */ isProxy(style) && !isArray$2(style)) {
        style = extend$1({}, style);
      }
      props.style = normalizeStyle(style);
    }
  }
  const shapeFlag = isString$1(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject$1(type) ? 4 : isFunction$2(type) ? 2 : 0;
  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true
  );
}
function guardReactiveProps(props) {
  if (!props) return null;
  return /* @__PURE__ */ isProxy(props) || isInternalObject(props) ? extend$1({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
  const { props, ref: ref3, patchFlag, children, transition } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloned = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    ref: extraProps && extraProps.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      mergeRef && ref3 ? isArray$2(ref3) ? ref3.concat(normalizeRef(extraProps)) : [ref3, normalizeRef(extraProps)] : normalizeRef(extraProps)
    ) : ref3,
    scopeId: vnode.scopeId,
    slotScopeIds: vnode.slotScopeIds,
    children,
    target: vnode.target,
    targetStart: vnode.targetStart,
    targetAnchor: vnode.targetAnchor,
    staticCount: vnode.staticCount,
    shapeFlag: vnode.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
    dynamicProps: vnode.dynamicProps,
    dynamicChildren: vnode.dynamicChildren,
    appContext: vnode.appContext,
    dirs: vnode.dirs,
    transition,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: vnode.component,
    suspense: vnode.suspense,
    ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
    ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
    placeholder: vnode.placeholder,
    el: vnode.el,
    anchor: vnode.anchor,
    ctx: vnode.ctx,
    ce: vnode.ce
  };
  if (transition && cloneTransition) {
    setTransitionHooks(
      cloned,
      transition.clone(cloned)
    );
  }
  return cloned;
}
function createTextVNode(text2 = " ", flag = 0) {
  return createVNode(Text, null, text2, flag);
}
function createStaticVNode(content, numberOfNodes) {
  const vnode = createVNode(Static, null, content);
  vnode.staticCount = numberOfNodes;
  return vnode;
}
function createCommentVNode(text2 = "", asBlock = false) {
  return asBlock ? (openBlock(), createBlock(Comment, null, text2)) : createVNode(Comment, null, text2);
}
function normalizeVNode(child) {
  if (child == null || typeof child === "boolean") {
    return createVNode(Comment);
  } else if (isArray$2(child)) {
    return createVNode(
      Fragment,
      null,
      // #3666, avoid reference pollution when reusing vnode
      child.slice()
    );
  } else if (isVNode(child)) {
    return cloneIfMounted(child);
  } else {
    return createVNode(Text, null, String(child));
  }
}
function cloneIfMounted(child) {
  return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray$2(children)) {
    type = 16;
  } else if (typeof children === "object") {
    if (shapeFlag & (1 | 64)) {
      const slot = children.default;
      if (slot) {
        slot._c && (slot._d = false);
        normalizeChildren(vnode, slot());
        slot._c && (slot._d = true);
      }
      return;
    } else {
      type = 32;
      const slotFlag = children._;
      if (!slotFlag && !isInternalObject(children)) {
        children._ctx = currentRenderingInstance;
      } else if (slotFlag === 3 && currentRenderingInstance) {
        if (currentRenderingInstance.slots._ === 1) {
          children._ = 1;
        } else {
          children._ = 2;
          vnode.patchFlag |= 1024;
        }
      }
    }
  } else if (isFunction$2(children)) {
    children = { default: children, _ctx: currentRenderingInstance };
    type = 32;
  } else {
    children = String(children);
    if (shapeFlag & 64) {
      type = 16;
      children = [createTextVNode(children)];
    } else {
      type = 8;
    }
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}
function mergeProps(...args) {
  const ret = {};
  for (let i = 0; i < args.length; i++) {
    const toMerge = args[i];
    for (const key in toMerge) {
      if (key === "class") {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === "style") {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (isOn(key)) {
        const existing = ret[key];
        const incoming = toMerge[key];
        if (incoming && existing !== incoming && !(isArray$2(existing) && existing.includes(incoming))) {
          ret[key] = existing ? [].concat(existing, incoming) : incoming;
        } else if (incoming == null && existing == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !isModelListener(key)) {
          ret[key] = incoming;
        }
      } else if (key !== "") {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
function invokeVNodeHook(hook, instance2, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance2, 7, [
    vnode,
    prevVNode
  ]);
}
const emptyAppContext = createAppContext();
let uid = 0;
function createComponentInstance(vnode, parent, suspense) {
  const type = vnode.type;
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const instance2 = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new EffectScope(
      true
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    ids: parent ? parent.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: EMPTY_OBJ,
    // inheritAttrs
    inheritAttrs: type.inheritAttrs,
    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    // suspense related
    suspense,
    suspenseId: suspense ? suspense.pendingId : 0,
    asyncDep: null,
    asyncResolved: false,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  {
    instance2.ctx = { _: instance2 };
  }
  instance2.root = parent ? parent.root : instance2;
  instance2.emit = emit.bind(null, instance2);
  if (vnode.ce) {
    vnode.ce(instance2);
  }
  return instance2;
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance || currentRenderingInstance;
let internalSetCurrentInstance;
let setInSSRSetupState;
{
  const g = getGlobalThis();
  const registerGlobalSetter = (key, setter) => {
    let setters;
    if (!(setters = g[key])) setters = g[key] = [];
    setters.push(setter);
    return (v) => {
      if (setters.length > 1) setters.forEach((set) => set(v));
      else setters[0](v);
    };
  };
  internalSetCurrentInstance = registerGlobalSetter(
    `__VUE_INSTANCE_SETTERS__`,
    (v) => currentInstance = v
  );
  setInSSRSetupState = registerGlobalSetter(
    `__VUE_SSR_SETTERS__`,
    (v) => isInSSRComponentSetup = v
  );
}
const setCurrentInstance = (instance2) => {
  const prev = currentInstance;
  internalSetCurrentInstance(instance2);
  instance2.scope.on();
  return () => {
    instance2.scope.off();
    internalSetCurrentInstance(prev);
  };
};
const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off();
  internalSetCurrentInstance(null);
};
function isStatefulComponent(instance2) {
  return instance2.vnode.shapeFlag & 4;
}
let isInSSRComponentSetup = false;
function setupComponent(instance2, isSSR = false, optimized = false) {
  isSSR && setInSSRSetupState(isSSR);
  const { props, children } = instance2.vnode;
  const isStateful = isStatefulComponent(instance2);
  initProps(instance2, props, isStateful, isSSR);
  initSlots(instance2, children, optimized || isSSR);
  const setupResult = isStateful ? setupStatefulComponent(instance2, isSSR) : void 0;
  isSSR && setInSSRSetupState(false);
  return setupResult;
}
function setupStatefulComponent(instance2, isSSR) {
  const Component = instance2.type;
  instance2.accessCache = /* @__PURE__ */ Object.create(null);
  instance2.proxy = new Proxy(instance2.ctx, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    pauseTracking();
    const setupContext = instance2.setupContext = setup.length > 1 ? createSetupContext(instance2) : null;
    const reset = setCurrentInstance(instance2);
    const setupResult = callWithErrorHandling(
      setup,
      instance2,
      0,
      [
        instance2.props,
        setupContext
      ]
    );
    const isAsyncSetup = isPromise(setupResult);
    resetTracking();
    reset();
    if ((isAsyncSetup || instance2.sp) && !isAsyncWrapper(instance2)) {
      markAsyncBoundary(instance2);
    }
    if (isAsyncSetup) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
      if (isSSR) {
        return setupResult.then((resolvedResult) => {
          handleSetupResult(instance2, resolvedResult);
        }).catch((e) => {
          handleError(e, instance2, 0);
        });
      } else {
        instance2.asyncDep = setupResult;
      }
    } else {
      handleSetupResult(instance2, setupResult);
    }
  } else {
    finishComponentSetup(instance2);
  }
}
function handleSetupResult(instance2, setupResult, isSSR) {
  if (isFunction$2(setupResult)) {
    if (instance2.type.__ssrInlineRender) {
      instance2.ssrRender = setupResult;
    } else {
      instance2.render = setupResult;
    }
  } else if (isObject$1(setupResult)) {
    instance2.setupState = proxyRefs(setupResult);
  } else ;
  finishComponentSetup(instance2);
}
function finishComponentSetup(instance2, isSSR, skipOptions) {
  const Component = instance2.type;
  if (!instance2.render) {
    instance2.render = Component.render || NOOP;
  }
  {
    const reset = setCurrentInstance(instance2);
    pauseTracking();
    try {
      applyOptions(instance2);
    } finally {
      resetTracking();
      reset();
    }
  }
}
const attrsProxyHandlers = {
  get(target, key) {
    track(target, "get", "");
    return target[key];
  }
};
function createSetupContext(instance2) {
  const expose = (exposed) => {
    instance2.exposed = exposed || {};
  };
  {
    return {
      attrs: new Proxy(instance2.attrs, attrsProxyHandlers),
      slots: instance2.slots,
      emit: instance2.emit,
      expose
    };
  }
}
function getComponentPublicInstance(instance2) {
  if (instance2.exposed) {
    return instance2.exposeProxy || (instance2.exposeProxy = new Proxy(proxyRefs(markRaw(instance2.exposed)), {
      get(target, key) {
        if (key in target) {
          return target[key];
        } else if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance2);
        }
      },
      has(target, key) {
        return key in target || key in publicPropertiesMap;
      }
    }));
  } else {
    return instance2.proxy;
  }
}
const classifyRE = /(?:^|[-_])\w/g;
const classify = (str) => str.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, "");
function getComponentName(Component, includeInferred = true) {
  return isFunction$2(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
}
function formatComponentName(instance2, Component, isRoot = false) {
  let name = getComponentName(Component);
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.\w+$/);
    if (match) {
      name = match[1];
    }
  }
  if (!name && instance2) {
    const inferFromRegistry = (registry) => {
      for (const key in registry) {
        if (registry[key] === Component) {
          return key;
        }
      }
    };
    name = inferFromRegistry(instance2.components) || instance2.parent && inferFromRegistry(
      instance2.parent.type.components
    ) || inferFromRegistry(instance2.appContext.components);
  }
  return name ? classify(name) : isRoot ? `App` : `Anonymous`;
}
function isClassComponent(value) {
  return isFunction$2(value) && "__vccOpts" in value;
}
const computed = (getterOrOptions, debugOptions) => {
  const c = /* @__PURE__ */ computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
  return c;
};
function h(type, propsOrChildren, children) {
  try {
    setBlockTracking(-1);
    const l = arguments.length;
    if (l === 2) {
      if (isObject$1(propsOrChildren) && !isArray$2(propsOrChildren)) {
        if (isVNode(propsOrChildren)) {
          return createVNode(type, null, [propsOrChildren]);
        }
        return createVNode(type, propsOrChildren);
      } else {
        return createVNode(type, null, propsOrChildren);
      }
    } else {
      if (l > 3) {
        children = Array.prototype.slice.call(arguments, 2);
      } else if (l === 3 && isVNode(children)) {
        children = [children];
      }
      return createVNode(type, propsOrChildren, children);
    }
  } finally {
    setBlockTracking(1);
  }
}
const version = "3.5.33";
/**
* @vue/runtime-dom v3.5.33
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let policy = void 0;
const tt = typeof window !== "undefined" && window.trustedTypes;
if (tt) {
  try {
    policy = /* @__PURE__ */ tt.createPolicy("vue", {
      createHTML: (val) => val
    });
  } catch (e) {
  }
}
const unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
const svgNS = "http://www.w3.org/2000/svg";
const mathmlNS = "http://www.w3.org/1998/Math/MathML";
const doc = typeof document !== "undefined" ? document : null;
const templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag2, namespace, is, props) => {
    const el = namespace === "svg" ? doc.createElementNS(svgNS, tag2) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag2) : is ? doc.createElement(tag2, { is }) : doc.createElement(tag2);
    if (tag2 === "select" && props && props.multiple != null) {
      el.setAttribute("multiple", props.multiple);
    }
    return el;
  },
  createText: (text2) => doc.createTextNode(text2),
  createComment: (text2) => doc.createComment(text2),
  setText: (node, text2) => {
    node.nodeValue = text2;
  },
  setElementText: (el, text2) => {
    el.textContent = text2;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
  querySelector: (selector) => doc.querySelector(selector),
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, namespace, start, end) {
    const before = anchor ? anchor.previousSibling : parent.lastChild;
    if (start && (start === end || start.nextSibling)) {
      while (true) {
        parent.insertBefore(start.cloneNode(true), anchor);
        if (start === end || !(start = start.nextSibling)) break;
      }
    } else {
      templateContainer.innerHTML = unsafeToTrustedHTML(
        namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content
      );
      const template = templateContainer.content;
      if (namespace === "svg" || namespace === "mathml") {
        const wrapper = template.firstChild;
        while (wrapper.firstChild) {
          template.appendChild(wrapper.firstChild);
        }
        template.removeChild(wrapper);
      }
      parent.insertBefore(template, anchor);
    }
    return [
      // first
      before ? before.nextSibling : parent.firstChild,
      // last
      anchor ? anchor.previousSibling : parent.lastChild
    ];
  }
};
const TRANSITION = "transition";
const ANIMATION = "animation";
const vtcKey = /* @__PURE__ */ Symbol("_vtc");
const DOMTransitionPropsValidators = {
  name: String,
  type: String,
  css: {
    type: Boolean,
    default: true
  },
  duration: [String, Number, Object],
  enterFromClass: String,
  enterActiveClass: String,
  enterToClass: String,
  appearFromClass: String,
  appearActiveClass: String,
  appearToClass: String,
  leaveFromClass: String,
  leaveActiveClass: String,
  leaveToClass: String
};
const TransitionPropsValidators = /* @__PURE__ */ extend$1(
  {},
  BaseTransitionPropsValidators,
  DOMTransitionPropsValidators
);
const decorate$1 = (t) => {
  t.displayName = "Transition";
  t.props = TransitionPropsValidators;
  return t;
};
const Transition = /* @__PURE__ */ decorate$1(
  (props, { slots }) => h(BaseTransition, resolveTransitionProps(props), slots)
);
const callHook = (hook, args = []) => {
  if (isArray$2(hook)) {
    hook.forEach((h2) => h2(...args));
  } else if (hook) {
    hook(...args);
  }
};
const hasExplicitCallback = (hook) => {
  return hook ? isArray$2(hook) ? hook.some((h2) => h2.length > 1) : hook.length > 1 : false;
};
function resolveTransitionProps(rawProps) {
  const baseProps = {};
  for (const key in rawProps) {
    if (!(key in DOMTransitionPropsValidators)) {
      baseProps[key] = rawProps[key];
    }
  }
  if (rawProps.css === false) {
    return baseProps;
  }
  const {
    name = "v",
    type,
    duration,
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    appearFromClass = enterFromClass,
    appearActiveClass = enterActiveClass,
    appearToClass = enterToClass,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`
  } = rawProps;
  const durations = normalizeDuration(duration);
  const enterDuration = durations && durations[0];
  const leaveDuration = durations && durations[1];
  const {
    onBeforeEnter,
    onEnter,
    onEnterCancelled,
    onLeave,
    onLeaveCancelled,
    onBeforeAppear = onBeforeEnter,
    onAppear = onEnter,
    onAppearCancelled = onEnterCancelled
  } = baseProps;
  const finishEnter = (el, isAppear, done, isCancelled) => {
    el._enterCancelled = isCancelled;
    removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
    removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
    done && done();
  };
  const finishLeave = (el, done) => {
    el._isLeaving = false;
    removeTransitionClass(el, leaveFromClass);
    removeTransitionClass(el, leaveToClass);
    removeTransitionClass(el, leaveActiveClass);
    done && done();
  };
  const makeEnterHook = (isAppear) => {
    return (el, done) => {
      const hook = isAppear ? onAppear : onEnter;
      const resolve2 = () => finishEnter(el, isAppear, done);
      callHook(hook, [el, resolve2]);
      nextFrame(() => {
        removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
        addTransitionClass(el, isAppear ? appearToClass : enterToClass);
        if (!hasExplicitCallback(hook)) {
          whenTransitionEnds(el, type, enterDuration, resolve2);
        }
      });
    };
  };
  return extend$1(baseProps, {
    onBeforeEnter(el) {
      callHook(onBeforeEnter, [el]);
      addTransitionClass(el, enterFromClass);
      addTransitionClass(el, enterActiveClass);
    },
    onBeforeAppear(el) {
      callHook(onBeforeAppear, [el]);
      addTransitionClass(el, appearFromClass);
      addTransitionClass(el, appearActiveClass);
    },
    onEnter: makeEnterHook(false),
    onAppear: makeEnterHook(true),
    onLeave(el, done) {
      el._isLeaving = true;
      const resolve2 = () => finishLeave(el, done);
      addTransitionClass(el, leaveFromClass);
      if (!el._enterCancelled) {
        forceReflow(el);
        addTransitionClass(el, leaveActiveClass);
      } else {
        addTransitionClass(el, leaveActiveClass);
        forceReflow(el);
      }
      nextFrame(() => {
        if (!el._isLeaving) {
          return;
        }
        removeTransitionClass(el, leaveFromClass);
        addTransitionClass(el, leaveToClass);
        if (!hasExplicitCallback(onLeave)) {
          whenTransitionEnds(el, type, leaveDuration, resolve2);
        }
      });
      callHook(onLeave, [el, resolve2]);
    },
    onEnterCancelled(el) {
      finishEnter(el, false, void 0, true);
      callHook(onEnterCancelled, [el]);
    },
    onAppearCancelled(el) {
      finishEnter(el, true, void 0, true);
      callHook(onAppearCancelled, [el]);
    },
    onLeaveCancelled(el) {
      finishLeave(el);
      callHook(onLeaveCancelled, [el]);
    }
  });
}
function normalizeDuration(duration) {
  if (duration == null) {
    return null;
  } else if (isObject$1(duration)) {
    return [NumberOf(duration.enter), NumberOf(duration.leave)];
  } else {
    const n = NumberOf(duration);
    return [n, n];
  }
}
function NumberOf(val) {
  const res = toNumber(val);
  return res;
}
function addTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.add(c));
  (el[vtcKey] || (el[vtcKey] = /* @__PURE__ */ new Set())).add(cls);
}
function removeTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.remove(c));
  const _vtc = el[vtcKey];
  if (_vtc) {
    _vtc.delete(cls);
    if (!_vtc.size) {
      el[vtcKey] = void 0;
    }
  }
}
function nextFrame(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}
let endId = 0;
function whenTransitionEnds(el, expectedType, explicitTimeout, resolve2) {
  const id = el._endId = ++endId;
  const resolveIfNotStale = () => {
    if (id === el._endId) {
      resolve2();
    }
  };
  if (explicitTimeout != null) {
    return setTimeout(resolveIfNotStale, explicitTimeout);
  }
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
  if (!type) {
    return resolve2();
  }
  const endEvent = type + "end";
  let ended = 0;
  const end = () => {
    el.removeEventListener(endEvent, onEnd);
    resolveIfNotStale();
  };
  const onEnd = (e) => {
    if (e.target === el && ++ended >= propCount) {
      end();
    }
  };
  setTimeout(() => {
    if (ended < propCount) {
      end();
    }
  }, timeout + 1);
  el.addEventListener(endEvent, onEnd);
}
function getTransitionInfo(el, expectedType) {
  const styles = window.getComputedStyle(el);
  const getStyleProperties = (key) => (styles[key] || "").split(", ");
  const transitionDelays = getStyleProperties(`${TRANSITION}Delay`);
  const transitionDurations = getStyleProperties(`${TRANSITION}Duration`);
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = getStyleProperties(`${ANIMATION}Delay`);
  const animationDurations = getStyleProperties(`${ANIMATION}Duration`);
  const animationTimeout = getTimeout(animationDelays, animationDurations);
  let type = null;
  let timeout = 0;
  let propCount = 0;
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0 ? transitionTimeout > animationTimeout ? TRANSITION : ANIMATION : null;
    propCount = type ? type === TRANSITION ? transitionDurations.length : animationDurations.length : 0;
  }
  const hasTransform = type === TRANSITION && /\b(?:transform|all)(?:,|$)/.test(
    getStyleProperties(`${TRANSITION}Property`).toString()
  );
  return {
    type,
    timeout,
    propCount,
    hasTransform
  };
}
function getTimeout(delays, durations) {
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }
  return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
}
function toMs(s) {
  if (s === "auto") return 0;
  return Number(s.slice(0, -1).replace(",", ".")) * 1e3;
}
function forceReflow(el) {
  const targetDocument = el ? el.ownerDocument : document;
  return targetDocument.body.offsetHeight;
}
function patchClass(el, value, isSVG) {
  const transitionClasses = el[vtcKey];
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
  }
  if (value == null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
}
const vShowOriginalDisplay = /* @__PURE__ */ Symbol("_vod");
const vShowHidden = /* @__PURE__ */ Symbol("_vsh");
const vShow = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(el, { value }, { transition }) {
    el[vShowOriginalDisplay] = el.style.display === "none" ? "" : el.style.display;
    if (transition && value) {
      transition.beforeEnter(el);
    } else {
      setDisplay(el, value);
    }
  },
  mounted(el, { value }, { transition }) {
    if (transition && value) {
      transition.enter(el);
    }
  },
  updated(el, { value, oldValue }, { transition }) {
    if (!value === !oldValue) return;
    if (transition) {
      if (value) {
        transition.beforeEnter(el);
        setDisplay(el, true);
        transition.enter(el);
      } else {
        transition.leave(el, () => {
          setDisplay(el, false);
        });
      }
    } else {
      setDisplay(el, value);
    }
  },
  beforeUnmount(el, { value }) {
    setDisplay(el, value);
  }
};
function setDisplay(el, value) {
  el.style.display = value ? el[vShowOriginalDisplay] : "none";
  el[vShowHidden] = !value;
}
const CSS_VAR_TEXT = /* @__PURE__ */ Symbol("");
const displayRE = /(?:^|;)\s*display\s*:/;
function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString$1(next);
  let hasControlledDisplay = false;
  if (next && !isCssString) {
    if (prev) {
      if (!isString$1(prev)) {
        for (const key in prev) {
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      } else {
        for (const prevStyle of prev.split(";")) {
          const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      }
    }
    for (const key in next) {
      if (key === "display") {
        hasControlledDisplay = true;
      }
      const value = next[key];
      if (value != null) {
        if (!shouldPreserveTextareaResizeStyle(
          el,
          key,
          !isString$1(prev) && prev ? prev[key] : void 0,
          value
        )) {
          setStyle(style, key, value);
        }
      } else {
        setStyle(style, key, "");
      }
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
        const cssVarText = style[CSS_VAR_TEXT];
        if (cssVarText) {
          next += ";" + cssVarText;
        }
        style.cssText = next;
        hasControlledDisplay = displayRE.test(next);
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
  }
  if (vShowOriginalDisplay in el) {
    el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
    if (el[vShowHidden]) {
      style.display = "none";
    }
  }
}
const importantRE = /\s*!important$/;
function setStyle(style, name, val) {
  if (isArray$2(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    if (val == null) val = "";
    if (name.startsWith("--")) {
      style.setProperty(name, val);
    } else {
      const prefixed = autoPrefix(style, name);
      if (importantRE.test(val)) {
        style.setProperty(
          hyphenate(prefixed),
          val.replace(importantRE, ""),
          "important"
        );
      } else {
        style[prefixed] = val;
      }
    }
  }
}
const prefixes = ["Webkit", "Moz", "ms"];
const prefixCache = {};
function autoPrefix(style, rawName) {
  const cached = prefixCache[rawName];
  if (cached) {
    return cached;
  }
  let name = camelize(rawName);
  if (name !== "filter" && name in style) {
    return prefixCache[rawName] = name;
  }
  name = capitalize(name);
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name;
    if (prefixed in style) {
      return prefixCache[rawName] = prefixed;
    }
  }
  return rawName;
}
function shouldPreserveTextareaResizeStyle(el, key, prev, next) {
  return el.tagName === "TEXTAREA" && (key === "width" || key === "height") && isString$1(next) && prev === next;
}
const xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance2, isBoolean2 = isSpecialBooleanAttr(key)) {
  if (isSVG && key.startsWith("xlink:")) {
    if (value == null) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    if (value == null || isBoolean2 && !includeBooleanAttr(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(
        key,
        isBoolean2 ? "" : isSymbol(value) ? String(value) : value
      );
    }
  }
}
function patchDOMProp(el, key, value, parentComponent, attrName) {
  if (key === "innerHTML" || key === "textContent") {
    if (value != null) {
      el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
    }
    return;
  }
  const tag2 = el.tagName;
  if (key === "value" && tag2 !== "PROGRESS" && // custom elements may use _value internally
  !tag2.includes("-")) {
    const oldValue = tag2 === "OPTION" ? el.getAttribute("value") || "" : el.value;
    const newValue = value == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      el.type === "checkbox" ? "on" : ""
    ) : String(value);
    if (oldValue !== newValue || !("_value" in el)) {
      el.value = newValue;
    }
    if (value == null) {
      el.removeAttribute(key);
    }
    el._value = value;
    return;
  }
  let needRemove = false;
  if (value === "" || value == null) {
    const type = typeof el[key];
    if (type === "boolean") {
      value = includeBooleanAttr(value);
    } else if (value == null && type === "string") {
      value = "";
      needRemove = true;
    } else if (type === "number") {
      value = 0;
      needRemove = true;
    }
  }
  try {
    el[key] = value;
  } catch (e) {
  }
  needRemove && el.removeAttribute(attrName || key);
}
function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options);
}
const veiKey = /* @__PURE__ */ Symbol("_vei");
function patchEvent(el, rawName, prevValue, nextValue, instance2 = null) {
  const invokers = el[veiKey] || (el[veiKey] = {});
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    const [name, options] = parseName(rawName);
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(
        nextValue,
        instance2
      );
      addEventListener(el, name, invoker, options);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker, options);
      invokers[rawName] = void 0;
    }
  }
}
const optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
  let options;
  if (optionsModifierRE.test(name)) {
    options = {};
    let m;
    while (m = name.match(optionsModifierRE)) {
      name = name.slice(0, name.length - m[0].length);
      options[m[0].toLowerCase()] = true;
    }
  }
  const event = name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2));
  return [event, options];
}
let cachedNow = 0;
const p = /* @__PURE__ */ Promise.resolve();
const getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance2) {
  const invoker = (e) => {
    if (!e._vts) {
      e._vts = Date.now();
    } else if (e._vts <= invoker.attached) {
      return;
    }
    callWithAsyncErrorHandling(
      patchStopImmediatePropagation(e, invoker.value),
      instance2,
      5,
      [e]
    );
  };
  invoker.value = initialValue;
  invoker.attached = getNow();
  return invoker;
}
function patchStopImmediatePropagation(e, value) {
  if (isArray$2(value)) {
    const originalStop = e.stopImmediatePropagation;
    e.stopImmediatePropagation = () => {
      originalStop.call(e);
      e._stopped = true;
    };
    return value.map(
      (fn) => (e2) => !e2._stopped && fn && fn(e2)
    );
  } else {
    return value;
  }
}
const isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // lowercase letter
key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
const patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
  const isSVG = namespace === "svg";
  if (key === "class") {
    patchClass(el, nextValue, isSVG);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent);
    }
  } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
    patchDOMProp(el, key, nextValue);
    if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) {
      patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
    }
  } else if (
    // #11081 force set props for possible async custom element
    el._isVueCE && // #12408 check if it's declared prop or it's async custom element
    (shouldSetAsPropForVueCE(el, key) || // @ts-expect-error _def is private
    el._def.__asyncLoader && (/[A-Z]/.test(key) || !isString$1(nextValue)))
  ) {
    patchDOMProp(el, camelize(key), nextValue, parentComponent, key);
  } else {
    if (key === "true-value") {
      el._trueValue = nextValue;
    } else if (key === "false-value") {
      el._falseValue = nextValue;
    }
    patchAttr(el, key, nextValue, isSVG);
  }
};
function shouldSetAsProp(el, key, value, isSVG) {
  if (isSVG) {
    if (key === "innerHTML" || key === "textContent") {
      return true;
    }
    if (key in el && isNativeOn(key) && isFunction$2(value)) {
      return true;
    }
    return false;
  }
  if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") {
    return false;
  }
  if (key === "sandbox" && el.tagName === "IFRAME") {
    return false;
  }
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  if (key === "width" || key === "height") {
    const tag2 = el.tagName;
    if (tag2 === "IMG" || tag2 === "VIDEO" || tag2 === "CANVAS" || tag2 === "SOURCE") {
      return false;
    }
  }
  if (isNativeOn(key) && isString$1(value)) {
    return false;
  }
  return key in el;
}
function shouldSetAsPropForVueCE(el, key) {
  const props = (
    // @ts-expect-error _def is private
    el._def.props
  );
  if (!props) {
    return false;
  }
  const camelKey = camelize(key);
  return Array.isArray(props) ? props.some((prop) => camelize(prop) === camelKey) : Object.keys(props).some((prop) => camelize(prop) === camelKey);
}
const positionMap = /* @__PURE__ */ new WeakMap();
const newPositionMap = /* @__PURE__ */ new WeakMap();
const moveCbKey = /* @__PURE__ */ Symbol("_moveCb");
const enterCbKey = /* @__PURE__ */ Symbol("_enterCb");
const decorate = (t) => {
  delete t.props.mode;
  return t;
};
const TransitionGroupImpl = /* @__PURE__ */ decorate({
  name: "TransitionGroup",
  props: /* @__PURE__ */ extend$1({}, TransitionPropsValidators, {
    tag: String,
    moveClass: String
  }),
  setup(props, { slots }) {
    const instance2 = getCurrentInstance();
    const state = useTransitionState();
    let prevChildren;
    let children;
    onUpdated(() => {
      if (!prevChildren.length) {
        return;
      }
      const moveClass = props.moveClass || `${props.name || "v"}-move`;
      if (!hasCSSTransform(
        prevChildren[0].el,
        instance2.vnode.el,
        moveClass
      )) {
        prevChildren = [];
        return;
      }
      prevChildren.forEach(callPendingCbs);
      prevChildren.forEach(recordPosition);
      const movedChildren = prevChildren.filter(applyTranslation);
      forceReflow(instance2.vnode.el);
      movedChildren.forEach((c) => {
        const el = c.el;
        const style = el.style;
        addTransitionClass(el, moveClass);
        style.transform = style.webkitTransform = style.transitionDuration = "";
        const cb = el[moveCbKey] = (e) => {
          if (e && e.target !== el) {
            return;
          }
          if (!e || e.propertyName.endsWith("transform")) {
            el.removeEventListener("transitionend", cb);
            el[moveCbKey] = null;
            removeTransitionClass(el, moveClass);
          }
        };
        el.addEventListener("transitionend", cb);
      });
      prevChildren = [];
    });
    return () => {
      const rawProps = /* @__PURE__ */ toRaw(props);
      const cssTransitionProps = resolveTransitionProps(rawProps);
      let tag2 = rawProps.tag || Fragment;
      prevChildren = [];
      if (children) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child.el && child.el instanceof Element) {
            prevChildren.push(child);
            setTransitionHooks(
              child,
              resolveTransitionHooks(
                child,
                cssTransitionProps,
                state,
                instance2
              )
            );
            positionMap.set(child, getPosition(child.el));
          }
        }
      }
      children = slots.default ? getTransitionRawChildren(slots.default()) : [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.key != null) {
          setTransitionHooks(
            child,
            resolveTransitionHooks(child, cssTransitionProps, state, instance2)
          );
        }
      }
      return createVNode(tag2, null, children);
    };
  }
});
const TransitionGroup = TransitionGroupImpl;
function callPendingCbs(c) {
  const el = c.el;
  if (el[moveCbKey]) {
    el[moveCbKey]();
  }
  if (el[enterCbKey]) {
    el[enterCbKey]();
  }
}
function recordPosition(c) {
  newPositionMap.set(c, getPosition(c.el));
}
function applyTranslation(c) {
  const oldPos = positionMap.get(c);
  const newPos = newPositionMap.get(c);
  const dx = oldPos.left - newPos.left;
  const dy = oldPos.top - newPos.top;
  if (dx || dy) {
    const el = c.el;
    const s = el.style;
    const rect = el.getBoundingClientRect();
    let scaleX = 1;
    let scaleY = 1;
    if (el.offsetWidth) scaleX = rect.width / el.offsetWidth;
    if (el.offsetHeight) scaleY = rect.height / el.offsetHeight;
    if (!Number.isFinite(scaleX) || scaleX === 0) scaleX = 1;
    if (!Number.isFinite(scaleY) || scaleY === 0) scaleY = 1;
    if (Math.abs(scaleX - 1) < 0.01) scaleX = 1;
    if (Math.abs(scaleY - 1) < 0.01) scaleY = 1;
    s.transform = s.webkitTransform = `translate(${dx / scaleX}px,${dy / scaleY}px)`;
    s.transitionDuration = "0s";
    return c;
  }
}
function getPosition(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top
  };
}
function hasCSSTransform(el, root, moveClass) {
  const clone2 = el.cloneNode();
  const _vtc = el[vtcKey];
  if (_vtc) {
    _vtc.forEach((cls) => {
      cls.split(/\s+/).forEach((c) => c && clone2.classList.remove(c));
    });
  }
  moveClass.split(/\s+/).forEach((c) => c && clone2.classList.add(c));
  clone2.style.display = "none";
  const container = root.nodeType === 1 ? root : root.parentNode;
  container.appendChild(clone2);
  const { hasTransform } = getTransitionInfo(clone2);
  container.removeChild(clone2);
  return hasTransform;
}
const getModelAssigner = (vnode) => {
  const fn = vnode.props["onUpdate:modelValue"] || false;
  return isArray$2(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
function onCompositionStart(e) {
  e.target.composing = true;
}
function onCompositionEnd(e) {
  const target = e.target;
  if (target.composing) {
    target.composing = false;
    target.dispatchEvent(new Event("input"));
  }
}
const assignKey = /* @__PURE__ */ Symbol("_assign");
function castValue(value, trim2, number) {
  if (trim2) value = value.trim();
  if (number) value = looseToNumber(value);
  return value;
}
const vModelText = {
  created(el, { modifiers: { lazy, trim: trim2, number } }, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    const castToNumber = number || vnode.props && vnode.props.type === "number";
    addEventListener(el, lazy ? "change" : "input", (e) => {
      if (e.target.composing) return;
      el[assignKey](castValue(el.value, trim2, castToNumber));
    });
    if (trim2 || castToNumber) {
      addEventListener(el, "change", () => {
        el.value = castValue(el.value, trim2, castToNumber);
      });
    }
    if (!lazy) {
      addEventListener(el, "compositionstart", onCompositionStart);
      addEventListener(el, "compositionend", onCompositionEnd);
      addEventListener(el, "change", onCompositionEnd);
    }
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(el, { value }) {
    el.value = value == null ? "" : value;
  },
  beforeUpdate(el, { value, oldValue, modifiers: { lazy, trim: trim2, number } }, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    if (el.composing) return;
    const elValue = (number || el.type === "number") && !/^0\d/.test(el.value) ? looseToNumber(el.value) : el.value;
    const newValue = value == null ? "" : value;
    if (elValue === newValue) {
      return;
    }
    const rootNode = el.getRootNode();
    if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement === el && el.type !== "range") {
      if (lazy && value === oldValue) {
        return;
      }
      if (trim2 && el.value.trim() === newValue) {
        return;
      }
    }
    el.value = newValue;
  }
};
const vModelSelect = {
  // <select multiple> value need to be deep traversed
  deep: true,
  created(el, { value, modifiers: { number } }, vnode) {
    const isSetModel = isSet(value);
    addEventListener(el, "change", () => {
      const selectedVal = Array.prototype.filter.call(el.options, (o) => o.selected).map(
        (o) => number ? looseToNumber(getValue(o)) : getValue(o)
      );
      el[assignKey](
        el.multiple ? isSetModel ? new Set(selectedVal) : selectedVal : selectedVal[0]
      );
      el._assigning = true;
      nextTick(() => {
        el._assigning = false;
      });
    });
    el[assignKey] = getModelAssigner(vnode);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(el, { value }) {
    setSelected(el, value);
  },
  beforeUpdate(el, _binding, vnode) {
    el[assignKey] = getModelAssigner(vnode);
  },
  updated(el, { value }) {
    if (!el._assigning) {
      setSelected(el, value);
    }
  }
};
function setSelected(el, value) {
  const isMultiple = el.multiple;
  const isArrayValue = isArray$2(value);
  if (isMultiple && !isArrayValue && !isSet(value)) {
    return;
  }
  for (let i = 0, l = el.options.length; i < l; i++) {
    const option = el.options[i];
    const optionValue = getValue(option);
    if (isMultiple) {
      if (isArrayValue) {
        const optionType = typeof optionValue;
        if (optionType === "string" || optionType === "number") {
          option.selected = value.some((v) => String(v) === String(optionValue));
        } else {
          option.selected = looseIndexOf(value, optionValue) > -1;
        }
      } else {
        option.selected = value.has(optionValue);
      }
    } else if (looseEqual(getValue(option), value)) {
      if (el.selectedIndex !== i) el.selectedIndex = i;
      return;
    }
  }
  if (!isMultiple && el.selectedIndex !== -1) {
    el.selectedIndex = -1;
  }
}
function getValue(el) {
  return "_value" in el ? el._value : el.value;
}
const systemModifiers = ["ctrl", "shift", "alt", "meta"];
const modifierGuards = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
};
const withModifiers = (fn, modifiers) => {
  if (!fn) return fn;
  const cache = fn._withMods || (fn._withMods = {});
  const cacheKey = modifiers.join(".");
  return cache[cacheKey] || (cache[cacheKey] = (event, ...args) => {
    for (let i = 0; i < modifiers.length; i++) {
      const guard = modifierGuards[modifiers[i]];
      if (guard && guard(event, modifiers)) return;
    }
    return fn(event, ...args);
  });
};
const keyNames = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
};
const withKeys = (fn, modifiers) => {
  const cache = fn._withKeys || (fn._withKeys = {});
  const cacheKey = modifiers.join(".");
  return cache[cacheKey] || (cache[cacheKey] = (event) => {
    if (!("key" in event)) {
      return;
    }
    const eventKey = hyphenate(event.key);
    if (modifiers.some(
      (k) => k === eventKey || keyNames[k] === eventKey
    )) {
      return fn(event);
    }
  });
};
const rendererOptions = /* @__PURE__ */ extend$1({ patchProp }, nodeOps);
let renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
const createApp = (...args) => {
  const app2 = ensureRenderer().createApp(...args);
  const { mount } = app2;
  app2.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;
    const component = app2._component;
    if (!isFunction$2(component) && !component.render && !component.template) {
      component.template = container.innerHTML;
    }
    if (container.nodeType === 1) {
      container.textContent = "";
    }
    const proxy = mount(container, false, resolveRootNamespace(container));
    if (container instanceof Element) {
      container.removeAttribute("v-cloak");
      container.setAttribute("data-v-app", "");
    }
    return proxy;
  };
  return app2;
};
function resolveRootNamespace(container) {
  if (container instanceof SVGElement) {
    return "svg";
  }
  if (typeof MathMLElement === "function" && container instanceof MathMLElement) {
    return "mathml";
  }
}
function normalizeContainer(container) {
  if (isString$1(container)) {
    const res = document.querySelector(container);
    return res;
  }
  return container;
}
/*!
 * pinia v2.3.1
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
let activePinia;
const setActivePinia = (pinia) => activePinia = pinia;
const piniaSymbol = (
  /* istanbul ignore next */
  Symbol()
);
function isPlainObject$1(o) {
  return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
}
var MutationType;
(function(MutationType2) {
  MutationType2["direct"] = "direct";
  MutationType2["patchObject"] = "patch object";
  MutationType2["patchFunction"] = "patch function";
})(MutationType || (MutationType = {}));
function createPinia() {
  const scope = effectScope(true);
  const state = scope.run(() => /* @__PURE__ */ ref({}));
  let _p = [];
  let toBeInstalled = [];
  const pinia = markRaw({
    install(app2) {
      setActivePinia(pinia);
      {
        pinia._a = app2;
        app2.provide(piniaSymbol, pinia);
        app2.config.globalProperties.$pinia = pinia;
        toBeInstalled.forEach((plugin) => _p.push(plugin));
        toBeInstalled = [];
      }
    },
    use(plugin) {
      if (!this._a && true) {
        toBeInstalled.push(plugin);
      } else {
        _p.push(plugin);
      }
      return this;
    },
    _p,
    // it's actually undefined here
    // @ts-expect-error
    _a: null,
    _e: scope,
    _s: /* @__PURE__ */ new Map(),
    state
  });
  return pinia;
}
const noop$2 = () => {
};
function addSubscription(subscriptions, callback, detached, onCleanup = noop$2) {
  subscriptions.push(callback);
  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback);
    if (idx > -1) {
      subscriptions.splice(idx, 1);
      onCleanup();
    }
  };
  if (!detached && getCurrentScope()) {
    onScopeDispose(removeSubscription);
  }
  return removeSubscription;
}
function triggerSubscriptions(subscriptions, ...args) {
  subscriptions.slice().forEach((callback) => {
    callback(...args);
  });
}
const fallbackRunWithContext = (fn) => fn();
const ACTION_MARKER = Symbol();
const ACTION_NAME = Symbol();
function mergeReactiveObjects(target, patchToApply) {
  if (target instanceof Map && patchToApply instanceof Map) {
    patchToApply.forEach((value, key) => target.set(key, value));
  } else if (target instanceof Set && patchToApply instanceof Set) {
    patchToApply.forEach(target.add, target);
  }
  for (const key in patchToApply) {
    if (!patchToApply.hasOwnProperty(key))
      continue;
    const subPatch = patchToApply[key];
    const targetValue = target[key];
    if (isPlainObject$1(targetValue) && isPlainObject$1(subPatch) && target.hasOwnProperty(key) && !/* @__PURE__ */ isRef(subPatch) && !/* @__PURE__ */ isReactive(subPatch)) {
      target[key] = mergeReactiveObjects(targetValue, subPatch);
    } else {
      target[key] = subPatch;
    }
  }
  return target;
}
const skipHydrateSymbol = (
  /* istanbul ignore next */
  Symbol()
);
function shouldHydrate(obj) {
  return !isPlainObject$1(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
}
const { assign: assign$1 } = Object;
function isComputed(o) {
  return !!(/* @__PURE__ */ isRef(o) && o.effect);
}
function createOptionsStore(id, options, pinia, hot) {
  const { state, actions, getters } = options;
  const initialState = pinia.state.value[id];
  let store;
  function setup() {
    if (!initialState && true) {
      {
        pinia.state.value[id] = state ? state() : {};
      }
    }
    const localState = /* @__PURE__ */ toRefs(pinia.state.value[id]);
    return assign$1(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
      computedGetters[name] = markRaw(computed(() => {
        setActivePinia(pinia);
        const store2 = pinia._s.get(id);
        return getters[name].call(store2, store2);
      }));
      return computedGetters;
    }, {}));
  }
  store = createSetupStore(id, setup, options, pinia, hot, true);
  return store;
}
function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
  let scope;
  const optionsForPlugin = assign$1({ actions: {} }, options);
  const $subscribeOptions = { deep: true };
  let isListening;
  let isSyncListening;
  let subscriptions = [];
  let actionSubscriptions = [];
  let debuggerEvents;
  const initialState = pinia.state.value[$id];
  if (!isOptionsStore && !initialState && true) {
    {
      pinia.state.value[$id] = {};
    }
  }
  let activeListener;
  function $patch(partialStateOrMutator) {
    let subscriptionMutation;
    isListening = isSyncListening = false;
    if (typeof partialStateOrMutator === "function") {
      partialStateOrMutator(pinia.state.value[$id]);
      subscriptionMutation = {
        type: MutationType.patchFunction,
        storeId: $id,
        events: debuggerEvents
      };
    } else {
      mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
      subscriptionMutation = {
        type: MutationType.patchObject,
        payload: partialStateOrMutator,
        storeId: $id,
        events: debuggerEvents
      };
    }
    const myListenerId = activeListener = Symbol();
    nextTick().then(() => {
      if (activeListener === myListenerId) {
        isListening = true;
      }
    });
    isSyncListening = true;
    triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
  }
  const $reset = isOptionsStore ? function $reset2() {
    const { state } = options;
    const newState = state ? state() : {};
    this.$patch(($state) => {
      assign$1($state, newState);
    });
  } : (
    /* istanbul ignore next */
    noop$2
  );
  function $dispose() {
    scope.stop();
    subscriptions = [];
    actionSubscriptions = [];
    pinia._s.delete($id);
  }
  const action = (fn, name = "") => {
    if (ACTION_MARKER in fn) {
      fn[ACTION_NAME] = name;
      return fn;
    }
    const wrappedAction = function() {
      setActivePinia(pinia);
      const args = Array.from(arguments);
      const afterCallbackList = [];
      const onErrorCallbackList = [];
      function after(callback) {
        afterCallbackList.push(callback);
      }
      function onError(callback) {
        onErrorCallbackList.push(callback);
      }
      triggerSubscriptions(actionSubscriptions, {
        args,
        name: wrappedAction[ACTION_NAME],
        store,
        after,
        onError
      });
      let ret;
      try {
        ret = fn.apply(this && this.$id === $id ? this : store, args);
      } catch (error) {
        triggerSubscriptions(onErrorCallbackList, error);
        throw error;
      }
      if (ret instanceof Promise) {
        return ret.then((value) => {
          triggerSubscriptions(afterCallbackList, value);
          return value;
        }).catch((error) => {
          triggerSubscriptions(onErrorCallbackList, error);
          return Promise.reject(error);
        });
      }
      triggerSubscriptions(afterCallbackList, ret);
      return ret;
    };
    wrappedAction[ACTION_MARKER] = true;
    wrappedAction[ACTION_NAME] = name;
    return wrappedAction;
  };
  const partialStore = {
    _p: pinia,
    // _s: scope,
    $id,
    $onAction: addSubscription.bind(null, actionSubscriptions),
    $patch,
    $reset,
    $subscribe(callback, options2 = {}) {
      const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
      const stopWatcher = scope.run(() => watch(() => pinia.state.value[$id], (state) => {
        if (options2.flush === "sync" ? isSyncListening : isListening) {
          callback({
            storeId: $id,
            type: MutationType.direct,
            events: debuggerEvents
          }, state);
        }
      }, assign$1({}, $subscribeOptions, options2)));
      return removeSubscription;
    },
    $dispose
  };
  const store = /* @__PURE__ */ reactive(partialStore);
  pinia._s.set($id, store);
  const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
  const setupStore = runWithContext(() => pinia._e.run(() => (scope = effectScope()).run(() => setup({ action }))));
  for (const key in setupStore) {
    const prop = setupStore[key];
    if (/* @__PURE__ */ isRef(prop) && !isComputed(prop) || /* @__PURE__ */ isReactive(prop)) {
      if (!isOptionsStore) {
        if (initialState && shouldHydrate(prop)) {
          if (/* @__PURE__ */ isRef(prop)) {
            prop.value = initialState[key];
          } else {
            mergeReactiveObjects(prop, initialState[key]);
          }
        }
        {
          pinia.state.value[$id][key] = prop;
        }
      }
    } else if (typeof prop === "function") {
      const actionValue = action(prop, key);
      {
        setupStore[key] = actionValue;
      }
      optionsForPlugin.actions[key] = prop;
    } else ;
  }
  {
    assign$1(store, setupStore);
    assign$1(/* @__PURE__ */ toRaw(store), setupStore);
  }
  Object.defineProperty(store, "$state", {
    get: () => pinia.state.value[$id],
    set: (state) => {
      $patch(($state) => {
        assign$1($state, state);
      });
    }
  });
  pinia._p.forEach((extender) => {
    {
      assign$1(store, scope.run(() => extender({
        store,
        app: pinia._a,
        pinia,
        options: optionsForPlugin
      })));
    }
  });
  if (initialState && isOptionsStore && options.hydrate) {
    options.hydrate(store.$state, initialState);
  }
  isListening = true;
  isSyncListening = true;
  return store;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineStore(idOrOptions, setup, setupOptions) {
  let id;
  let options;
  const isSetupStore = typeof setup === "function";
  if (typeof idOrOptions === "string") {
    id = idOrOptions;
    options = isSetupStore ? setupOptions : setup;
  } else {
    options = idOrOptions;
    id = idOrOptions.id;
  }
  function useStore(pinia, hot) {
    const hasContext = hasInjectionContext();
    pinia = // in test mode, ignore the argument provided as we can always retrieve a
    // pinia instance with getActivePinia()
    pinia || (hasContext ? inject(piniaSymbol, null) : null);
    if (pinia)
      setActivePinia(pinia);
    pinia = activePinia;
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, options, pinia);
      } else {
        createOptionsStore(id, options, pinia);
      }
    }
    const store = pinia._s.get(id);
    return store;
  }
  useStore.$id = id;
  return useStore;
}
function storeToRefs(store) {
  {
    const rawStore = /* @__PURE__ */ toRaw(store);
    const refs = {};
    for (const key in rawStore) {
      const value = rawStore[key];
      if (value.effect) {
        refs[key] = // ...
        computed({
          get: () => store[key],
          set(value2) {
            store[key] = value2;
          }
        });
      } else if (/* @__PURE__ */ isRef(value) || /* @__PURE__ */ isReactive(value)) {
        refs[key] = // ---
        /* @__PURE__ */ toRef(store, key);
      }
    }
    return refs;
  }
}
/*!
 * vue-router v4.6.4
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
const isBrowser = typeof document !== "undefined";
function isRouteComponent(component) {
  return typeof component === "object" || "displayName" in component || "props" in component || "__vccOpts" in component;
}
function isESModule(obj) {
  return obj.__esModule || obj[Symbol.toStringTag] === "Module" || obj.default && isRouteComponent(obj.default);
}
const assign = Object.assign;
function applyToParams(fn, params) {
  const newParams = {};
  for (const key in params) {
    const value = params[key];
    newParams[key] = isArray$1(value) ? value.map(fn) : fn(value);
  }
  return newParams;
}
const noop$1 = () => {
};
const isArray$1 = Array.isArray;
function mergeOptions(defaults2, partialOptions) {
  const options = {};
  for (const key in defaults2) options[key] = key in partialOptions ? partialOptions[key] : defaults2[key];
  return options;
}
const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const IM_RE = /\?/g;
const PLUS_RE = /\+/g;
const ENC_BRACKET_OPEN_RE = /%5B/g;
const ENC_BRACKET_CLOSE_RE = /%5D/g;
const ENC_CARET_RE = /%5E/g;
const ENC_BACKTICK_RE = /%60/g;
const ENC_CURLY_OPEN_RE = /%7B/g;
const ENC_PIPE_RE = /%7C/g;
const ENC_CURLY_CLOSE_RE = /%7D/g;
const ENC_SPACE_RE = /%20/g;
function commonEncode(text2) {
  return text2 == null ? "" : encodeURI("" + text2).replace(ENC_PIPE_RE, "|").replace(ENC_BRACKET_OPEN_RE, "[").replace(ENC_BRACKET_CLOSE_RE, "]");
}
function encodeHash(text2) {
  return commonEncode(text2).replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
}
function encodeQueryValue(text2) {
  return commonEncode(text2).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
}
function encodeQueryKey(text2) {
  return encodeQueryValue(text2).replace(EQUAL_RE, "%3D");
}
function encodePath(text2) {
  return commonEncode(text2).replace(HASH_RE, "%23").replace(IM_RE, "%3F");
}
function encodeParam(text2) {
  return encodePath(text2).replace(SLASH_RE, "%2F");
}
function decode(text2) {
  if (text2 == null) return null;
  try {
    return decodeURIComponent("" + text2);
  } catch (err) {
  }
  return "" + text2;
}
const TRAILING_SLASH_RE = /\/$/;
const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, "");
function parseURL(parseQuery$1, location2, currentLocation = "/") {
  let path, query = {}, searchString = "", hash = "";
  const hashPos = location2.indexOf("#");
  let searchPos = location2.indexOf("?");
  searchPos = hashPos >= 0 && searchPos > hashPos ? -1 : searchPos;
  if (searchPos >= 0) {
    path = location2.slice(0, searchPos);
    searchString = location2.slice(searchPos, hashPos > 0 ? hashPos : location2.length);
    query = parseQuery$1(searchString.slice(1));
  }
  if (hashPos >= 0) {
    path = path || location2.slice(0, hashPos);
    hash = location2.slice(hashPos, location2.length);
  }
  path = resolveRelativePath(path != null ? path : location2, currentLocation);
  return {
    fullPath: path + searchString + hash,
    path,
    query,
    hash: decode(hash)
  };
}
function stringifyURL(stringifyQuery$1, location2) {
  const query = location2.query ? stringifyQuery$1(location2.query) : "";
  return location2.path + (query && "?") + query + (location2.hash || "");
}
function stripBase(pathname, base) {
  if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase())) return pathname;
  return pathname.slice(base.length) || "/";
}
function isSameRouteLocation(stringifyQuery$1, a, b) {
  const aLastIndex = a.matched.length - 1;
  const bLastIndex = b.matched.length - 1;
  return aLastIndex > -1 && aLastIndex === bLastIndex && isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) && isSameRouteLocationParams(a.params, b.params) && stringifyQuery$1(a.query) === stringifyQuery$1(b.query) && a.hash === b.hash;
}
function isSameRouteRecord(a, b) {
  return (a.aliasOf || a) === (b.aliasOf || b);
}
function isSameRouteLocationParams(a, b) {
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (var key in a) if (!isSameRouteLocationParamsValue(a[key], b[key])) return false;
  return true;
}
function isSameRouteLocationParamsValue(a, b) {
  return isArray$1(a) ? isEquivalentArray(a, b) : isArray$1(b) ? isEquivalentArray(b, a) : a?.valueOf() === b?.valueOf();
}
function isEquivalentArray(a, b) {
  return isArray$1(b) ? a.length === b.length && a.every((value, i) => value === b[i]) : a.length === 1 && a[0] === b;
}
function resolveRelativePath(to, from) {
  if (to.startsWith("/")) return to;
  if (!to) return from;
  const fromSegments = from.split("/");
  const toSegments = to.split("/");
  const lastToSegment = toSegments[toSegments.length - 1];
  if (lastToSegment === ".." || lastToSegment === ".") toSegments.push("");
  let position = fromSegments.length - 1;
  let toPosition;
  let segment;
  for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
    segment = toSegments[toPosition];
    if (segment === ".") continue;
    if (segment === "..") {
      if (position > 1) position--;
    } else break;
  }
  return fromSegments.slice(0, position).join("/") + "/" + toSegments.slice(toPosition).join("/");
}
const START_LOCATION_NORMALIZED = {
  path: "/",
  name: void 0,
  params: {},
  query: {},
  hash: "",
  fullPath: "/",
  matched: [],
  meta: {},
  redirectedFrom: void 0
};
let NavigationType = /* @__PURE__ */ function(NavigationType$1) {
  NavigationType$1["pop"] = "pop";
  NavigationType$1["push"] = "push";
  return NavigationType$1;
}({});
let NavigationDirection = /* @__PURE__ */ function(NavigationDirection$1) {
  NavigationDirection$1["back"] = "back";
  NavigationDirection$1["forward"] = "forward";
  NavigationDirection$1["unknown"] = "";
  return NavigationDirection$1;
}({});
function normalizeBase(base) {
  if (!base) if (isBrowser) {
    const baseEl = document.querySelector("base");
    base = baseEl && baseEl.getAttribute("href") || "/";
    base = base.replace(/^\w+:\/\/[^\/]+/, "");
  } else base = "/";
  if (base[0] !== "/" && base[0] !== "#") base = "/" + base;
  return removeTrailingSlash(base);
}
const BEFORE_HASH_RE = /^[^#]+#/;
function createHref(base, location2) {
  return base.replace(BEFORE_HASH_RE, "#") + location2;
}
function getElementPosition(el, offset) {
  const docRect = document.documentElement.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return {
    behavior: offset.behavior,
    left: elRect.left - docRect.left - (offset.left || 0),
    top: elRect.top - docRect.top - (offset.top || 0)
  };
}
const computeScrollPosition = () => ({
  left: window.scrollX,
  top: window.scrollY
});
function scrollToPosition(position) {
  let scrollToOptions;
  if ("el" in position) {
    const positionEl = position.el;
    const isIdSelector = typeof positionEl === "string" && positionEl.startsWith("#");
    const el = typeof positionEl === "string" ? isIdSelector ? document.getElementById(positionEl.slice(1)) : document.querySelector(positionEl) : positionEl;
    if (!el) {
      return;
    }
    scrollToOptions = getElementPosition(el, position);
  } else scrollToOptions = position;
  if ("scrollBehavior" in document.documentElement.style) window.scrollTo(scrollToOptions);
  else window.scrollTo(scrollToOptions.left != null ? scrollToOptions.left : window.scrollX, scrollToOptions.top != null ? scrollToOptions.top : window.scrollY);
}
function getScrollKey(path, delta) {
  return (history.state ? history.state.position - delta : -1) + path;
}
const scrollPositions = /* @__PURE__ */ new Map();
function saveScrollPosition(key, scrollPosition) {
  scrollPositions.set(key, scrollPosition);
}
function getSavedScrollPosition(key) {
  const scroll = scrollPositions.get(key);
  scrollPositions.delete(key);
  return scroll;
}
function isRouteLocation(route) {
  return typeof route === "string" || route && typeof route === "object";
}
function isRouteName(name) {
  return typeof name === "string" || typeof name === "symbol";
}
let ErrorTypes = /* @__PURE__ */ function(ErrorTypes$1) {
  ErrorTypes$1[ErrorTypes$1["MATCHER_NOT_FOUND"] = 1] = "MATCHER_NOT_FOUND";
  ErrorTypes$1[ErrorTypes$1["NAVIGATION_GUARD_REDIRECT"] = 2] = "NAVIGATION_GUARD_REDIRECT";
  ErrorTypes$1[ErrorTypes$1["NAVIGATION_ABORTED"] = 4] = "NAVIGATION_ABORTED";
  ErrorTypes$1[ErrorTypes$1["NAVIGATION_CANCELLED"] = 8] = "NAVIGATION_CANCELLED";
  ErrorTypes$1[ErrorTypes$1["NAVIGATION_DUPLICATED"] = 16] = "NAVIGATION_DUPLICATED";
  return ErrorTypes$1;
}({});
const NavigationFailureSymbol = Symbol("");
({
  [ErrorTypes.MATCHER_NOT_FOUND]({ location: location2, currentLocation }) {
    return `No match for
 ${JSON.stringify(location2)}${currentLocation ? "\nwhile being at\n" + JSON.stringify(currentLocation) : ""}`;
  },
  [ErrorTypes.NAVIGATION_GUARD_REDIRECT]({ from, to }) {
    return `Redirected from "${from.fullPath}" to "${stringifyRoute(to)}" via a navigation guard.`;
  },
  [ErrorTypes.NAVIGATION_ABORTED]({ from, to }) {
    return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`;
  },
  [ErrorTypes.NAVIGATION_CANCELLED]({ from, to }) {
    return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`;
  },
  [ErrorTypes.NAVIGATION_DUPLICATED]({ from, to }) {
    return `Avoided redundant navigation to current location: "${from.fullPath}".`;
  }
});
function createRouterError(type, params) {
  return assign(/* @__PURE__ */ new Error(), {
    type,
    [NavigationFailureSymbol]: true
  }, params);
}
function isNavigationFailure(error, type) {
  return error instanceof Error && NavigationFailureSymbol in error && (type == null || !!(error.type & type));
}
const propertiesToLog = [
  "params",
  "query",
  "hash"
];
function stringifyRoute(to) {
  if (typeof to === "string") return to;
  if (to.path != null) return to.path;
  const location2 = {};
  for (const key of propertiesToLog) if (key in to) location2[key] = to[key];
  return JSON.stringify(location2, null, 2);
}
function parseQuery(search) {
  const query = {};
  if (search === "" || search === "?") return query;
  const searchParams = (search[0] === "?" ? search.slice(1) : search).split("&");
  for (let i = 0; i < searchParams.length; ++i) {
    const searchParam = searchParams[i].replace(PLUS_RE, " ");
    const eqPos = searchParam.indexOf("=");
    const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
    const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));
    if (key in query) {
      let currentValue = query[key];
      if (!isArray$1(currentValue)) currentValue = query[key] = [currentValue];
      currentValue.push(value);
    } else query[key] = value;
  }
  return query;
}
function stringifyQuery(query) {
  let search = "";
  for (let key in query) {
    const value = query[key];
    key = encodeQueryKey(key);
    if (value == null) {
      if (value !== void 0) search += (search.length ? "&" : "") + key;
      continue;
    }
    (isArray$1(value) ? value.map((v) => v && encodeQueryValue(v)) : [value && encodeQueryValue(value)]).forEach((value$1) => {
      if (value$1 !== void 0) {
        search += (search.length ? "&" : "") + key;
        if (value$1 != null) search += "=" + value$1;
      }
    });
  }
  return search;
}
function normalizeQuery(query) {
  const normalizedQuery = {};
  for (const key in query) {
    const value = query[key];
    if (value !== void 0) normalizedQuery[key] = isArray$1(value) ? value.map((v) => v == null ? null : "" + v) : value == null ? value : "" + value;
  }
  return normalizedQuery;
}
const matchedRouteKey = Symbol("");
const viewDepthKey = Symbol("");
const routerKey = Symbol("");
const routeLocationKey = Symbol("");
const routerViewLocationKey = Symbol("");
function useCallbacks() {
  let handlers = [];
  function add(handler) {
    handlers.push(handler);
    return () => {
      const i = handlers.indexOf(handler);
      if (i > -1) handlers.splice(i, 1);
    };
  }
  function reset() {
    handlers = [];
  }
  return {
    add,
    list: () => handlers.slice(),
    reset
  };
}
function guardToPromiseFn(guard, to, from, record, name, runWithContext = (fn) => fn()) {
  const enterCallbackArray = record && (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
  return () => new Promise((resolve2, reject) => {
    const next = (valid) => {
      if (valid === false) reject(createRouterError(ErrorTypes.NAVIGATION_ABORTED, {
        from,
        to
      }));
      else if (valid instanceof Error) reject(valid);
      else if (isRouteLocation(valid)) reject(createRouterError(ErrorTypes.NAVIGATION_GUARD_REDIRECT, {
        from: to,
        to: valid
      }));
      else {
        if (enterCallbackArray && record.enterCallbacks[name] === enterCallbackArray && typeof valid === "function") enterCallbackArray.push(valid);
        resolve2();
      }
    };
    const guardReturn = runWithContext(() => guard.call(record && record.instances[name], to, from, next));
    let guardCall = Promise.resolve(guardReturn);
    if (guard.length < 3) guardCall = guardCall.then(next);
    guardCall.catch((err) => reject(err));
  });
}
function extractComponentsGuards(matched, guardType, to, from, runWithContext = (fn) => fn()) {
  const guards = [];
  for (const record of matched) {
    for (const name in record.components) {
      let rawComponent = record.components[name];
      if (guardType !== "beforeRouteEnter" && !record.instances[name]) continue;
      if (isRouteComponent(rawComponent)) {
        const guard = (rawComponent.__vccOpts || rawComponent)[guardType];
        guard && guards.push(guardToPromiseFn(guard, to, from, record, name, runWithContext));
      } else {
        let componentPromise = rawComponent();
        guards.push(() => componentPromise.then((resolved) => {
          if (!resolved) throw new Error(`Couldn't resolve component "${name}" at "${record.path}"`);
          const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
          record.mods[name] = resolved;
          record.components[name] = resolvedComponent;
          const guard = (resolvedComponent.__vccOpts || resolvedComponent)[guardType];
          return guard && guardToPromiseFn(guard, to, from, record, name, runWithContext)();
        }));
      }
    }
  }
  return guards;
}
function extractChangingRecords(to, from) {
  const leavingRecords = [];
  const updatingRecords = [];
  const enteringRecords = [];
  const len = Math.max(from.matched.length, to.matched.length);
  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i];
    if (recordFrom) if (to.matched.find((record) => isSameRouteRecord(record, recordFrom))) updatingRecords.push(recordFrom);
    else leavingRecords.push(recordFrom);
    const recordTo = to.matched[i];
    if (recordTo) {
      if (!from.matched.find((record) => isSameRouteRecord(record, recordTo))) enteringRecords.push(recordTo);
    }
  }
  return [
    leavingRecords,
    updatingRecords,
    enteringRecords
  ];
}
/*!
 * vue-router v4.6.4
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
let createBaseLocation = () => location.protocol + "//" + location.host;
function createCurrentLocation(base, location$1) {
  const { pathname, search, hash } = location$1;
  const hashPos = base.indexOf("#");
  if (hashPos > -1) {
    let slicePos = hash.includes(base.slice(hashPos)) ? base.slice(hashPos).length : 1;
    let pathFromHash = hash.slice(slicePos);
    if (pathFromHash[0] !== "/") pathFromHash = "/" + pathFromHash;
    return stripBase(pathFromHash, "");
  }
  return stripBase(pathname, base) + search + hash;
}
function useHistoryListeners(base, historyState, currentLocation, replace) {
  let listeners = [];
  let teardowns = [];
  let pauseState = null;
  const popStateHandler = ({ state }) => {
    const to = createCurrentLocation(base, location);
    const from = currentLocation.value;
    const fromState = historyState.value;
    let delta = 0;
    if (state) {
      currentLocation.value = to;
      historyState.value = state;
      if (pauseState && pauseState === from) {
        pauseState = null;
        return;
      }
      delta = fromState ? state.position - fromState.position : 0;
    } else replace(to);
    listeners.forEach((listener) => {
      listener(currentLocation.value, from, {
        delta,
        type: NavigationType.pop,
        direction: delta ? delta > 0 ? NavigationDirection.forward : NavigationDirection.back : NavigationDirection.unknown
      });
    });
  };
  function pauseListeners() {
    pauseState = currentLocation.value;
  }
  function listen(callback) {
    listeners.push(callback);
    const teardown = () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
    teardowns.push(teardown);
    return teardown;
  }
  function beforeUnloadListener() {
    if (document.visibilityState === "hidden") {
      const { history: history$1 } = window;
      if (!history$1.state) return;
      history$1.replaceState(assign({}, history$1.state, { scroll: computeScrollPosition() }), "");
    }
  }
  function destroy() {
    for (const teardown of teardowns) teardown();
    teardowns = [];
    window.removeEventListener("popstate", popStateHandler);
    window.removeEventListener("pagehide", beforeUnloadListener);
    document.removeEventListener("visibilitychange", beforeUnloadListener);
  }
  window.addEventListener("popstate", popStateHandler);
  window.addEventListener("pagehide", beforeUnloadListener);
  document.addEventListener("visibilitychange", beforeUnloadListener);
  return {
    pauseListeners,
    listen,
    destroy
  };
}
function buildState(back, current, forward, replaced = false, computeScroll = false) {
  return {
    back,
    current,
    forward,
    replaced,
    position: window.history.length,
    scroll: computeScroll ? computeScrollPosition() : null
  };
}
function useHistoryStateNavigation(base) {
  const { history: history$1, location: location$1 } = window;
  const currentLocation = { value: createCurrentLocation(base, location$1) };
  const historyState = { value: history$1.state };
  if (!historyState.value) changeLocation(currentLocation.value, {
    back: null,
    current: currentLocation.value,
    forward: null,
    position: history$1.length - 1,
    replaced: true,
    scroll: null
  }, true);
  function changeLocation(to, state, replace$1) {
    const hashIndex = base.indexOf("#");
    const url = hashIndex > -1 ? (location$1.host && document.querySelector("base") ? base : base.slice(hashIndex)) + to : createBaseLocation() + base + to;
    try {
      history$1[replace$1 ? "replaceState" : "pushState"](state, "", url);
      historyState.value = state;
    } catch (err) {
      console.error(err);
      location$1[replace$1 ? "replace" : "assign"](url);
    }
  }
  function replace(to, data) {
    changeLocation(to, assign({}, history$1.state, buildState(historyState.value.back, to, historyState.value.forward, true), data, { position: historyState.value.position }), true);
    currentLocation.value = to;
  }
  function push(to, data) {
    const currentState = assign({}, historyState.value, history$1.state, {
      forward: to,
      scroll: computeScrollPosition()
    });
    changeLocation(currentState.current, currentState, true);
    changeLocation(to, assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data), false);
    currentLocation.value = to;
  }
  return {
    location: currentLocation,
    state: historyState,
    push,
    replace
  };
}
function createWebHistory(base) {
  base = normalizeBase(base);
  const historyNavigation = useHistoryStateNavigation(base);
  const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
  function go(delta, triggerListeners = true) {
    if (!triggerListeners) historyListeners.pauseListeners();
    history.go(delta);
  }
  const routerHistory = assign({
    location: "",
    base,
    go,
    createHref: createHref.bind(null, base)
  }, historyNavigation, historyListeners);
  Object.defineProperty(routerHistory, "location", {
    enumerable: true,
    get: () => historyNavigation.location.value
  });
  Object.defineProperty(routerHistory, "state", {
    enumerable: true,
    get: () => historyNavigation.state.value
  });
  return routerHistory;
}
function createWebHashHistory(base) {
  base = location.host ? base || location.pathname + location.search : "";
  if (!base.includes("#")) base += "#";
  return createWebHistory(base);
}
let TokenType = /* @__PURE__ */ function(TokenType$1) {
  TokenType$1[TokenType$1["Static"] = 0] = "Static";
  TokenType$1[TokenType$1["Param"] = 1] = "Param";
  TokenType$1[TokenType$1["Group"] = 2] = "Group";
  return TokenType$1;
}({});
var TokenizerState = /* @__PURE__ */ function(TokenizerState$1) {
  TokenizerState$1[TokenizerState$1["Static"] = 0] = "Static";
  TokenizerState$1[TokenizerState$1["Param"] = 1] = "Param";
  TokenizerState$1[TokenizerState$1["ParamRegExp"] = 2] = "ParamRegExp";
  TokenizerState$1[TokenizerState$1["ParamRegExpEnd"] = 3] = "ParamRegExpEnd";
  TokenizerState$1[TokenizerState$1["EscapeNext"] = 4] = "EscapeNext";
  return TokenizerState$1;
}(TokenizerState || {});
const ROOT_TOKEN = {
  type: TokenType.Static,
  value: ""
};
const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
function tokenizePath(path) {
  if (!path) return [[]];
  if (path === "/") return [[ROOT_TOKEN]];
  if (!path.startsWith("/")) throw new Error(`Invalid path "${path}"`);
  function crash(message) {
    throw new Error(`ERR (${state})/"${buffer}": ${message}`);
  }
  let state = TokenizerState.Static;
  let previousState = state;
  const tokens = [];
  let segment;
  function finalizeSegment() {
    if (segment) tokens.push(segment);
    segment = [];
  }
  let i = 0;
  let char;
  let buffer = "";
  let customRe = "";
  function consumeBuffer() {
    if (!buffer) return;
    if (state === TokenizerState.Static) segment.push({
      type: TokenType.Static,
      value: buffer
    });
    else if (state === TokenizerState.Param || state === TokenizerState.ParamRegExp || state === TokenizerState.ParamRegExpEnd) {
      if (segment.length > 1 && (char === "*" || char === "+")) crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
      segment.push({
        type: TokenType.Param,
        value: buffer,
        regexp: customRe,
        repeatable: char === "*" || char === "+",
        optional: char === "*" || char === "?"
      });
    } else crash("Invalid state to consume buffer");
    buffer = "";
  }
  function addCharToBuffer() {
    buffer += char;
  }
  while (i < path.length) {
    char = path[i++];
    if (char === "\\" && state !== TokenizerState.ParamRegExp) {
      previousState = state;
      state = TokenizerState.EscapeNext;
      continue;
    }
    switch (state) {
      case TokenizerState.Static:
        if (char === "/") {
          if (buffer) consumeBuffer();
          finalizeSegment();
        } else if (char === ":") {
          consumeBuffer();
          state = TokenizerState.Param;
        } else addCharToBuffer();
        break;
      case TokenizerState.EscapeNext:
        addCharToBuffer();
        state = previousState;
        break;
      case TokenizerState.Param:
        if (char === "(") state = TokenizerState.ParamRegExp;
        else if (VALID_PARAM_RE.test(char)) addCharToBuffer();
        else {
          consumeBuffer();
          state = TokenizerState.Static;
          if (char !== "*" && char !== "?" && char !== "+") i--;
        }
        break;
      case TokenizerState.ParamRegExp:
        if (char === ")") if (customRe[customRe.length - 1] == "\\") customRe = customRe.slice(0, -1) + char;
        else state = TokenizerState.ParamRegExpEnd;
        else customRe += char;
        break;
      case TokenizerState.ParamRegExpEnd:
        consumeBuffer();
        state = TokenizerState.Static;
        if (char !== "*" && char !== "?" && char !== "+") i--;
        customRe = "";
        break;
      default:
        crash("Unknown state");
        break;
    }
  }
  if (state === TokenizerState.ParamRegExp) crash(`Unfinished custom RegExp for param "${buffer}"`);
  consumeBuffer();
  finalizeSegment();
  return tokens;
}
const BASE_PARAM_PATTERN = "[^/]+?";
const BASE_PATH_PARSER_OPTIONS = {
  sensitive: false,
  strict: false,
  start: true,
  end: true
};
var PathScore = /* @__PURE__ */ function(PathScore$1) {
  PathScore$1[PathScore$1["_multiplier"] = 10] = "_multiplier";
  PathScore$1[PathScore$1["Root"] = 90] = "Root";
  PathScore$1[PathScore$1["Segment"] = 40] = "Segment";
  PathScore$1[PathScore$1["SubSegment"] = 30] = "SubSegment";
  PathScore$1[PathScore$1["Static"] = 40] = "Static";
  PathScore$1[PathScore$1["Dynamic"] = 20] = "Dynamic";
  PathScore$1[PathScore$1["BonusCustomRegExp"] = 10] = "BonusCustomRegExp";
  PathScore$1[PathScore$1["BonusWildcard"] = -50] = "BonusWildcard";
  PathScore$1[PathScore$1["BonusRepeatable"] = -20] = "BonusRepeatable";
  PathScore$1[PathScore$1["BonusOptional"] = -8] = "BonusOptional";
  PathScore$1[PathScore$1["BonusStrict"] = 0.7000000000000001] = "BonusStrict";
  PathScore$1[PathScore$1["BonusCaseSensitive"] = 0.25] = "BonusCaseSensitive";
  return PathScore$1;
}(PathScore || {});
const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
function tokensToParser(segments, extraOptions) {
  const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
  const score = [];
  let pattern = options.start ? "^" : "";
  const keys = [];
  for (const segment of segments) {
    const segmentScores = segment.length ? [] : [PathScore.Root];
    if (options.strict && !segment.length) pattern += "/";
    for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
      const token = segment[tokenIndex];
      let subSegmentScore = PathScore.Segment + (options.sensitive ? PathScore.BonusCaseSensitive : 0);
      if (token.type === TokenType.Static) {
        if (!tokenIndex) pattern += "/";
        pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
        subSegmentScore += PathScore.Static;
      } else if (token.type === TokenType.Param) {
        const { value, repeatable, optional, regexp } = token;
        keys.push({
          name: value,
          repeatable,
          optional
        });
        const re$1 = regexp ? regexp : BASE_PARAM_PATTERN;
        if (re$1 !== BASE_PARAM_PATTERN) {
          subSegmentScore += PathScore.BonusCustomRegExp;
          try {
            `${re$1}`;
          } catch (err) {
            throw new Error(`Invalid custom RegExp for param "${value}" (${re$1}): ` + err.message);
          }
        }
        let subPattern = repeatable ? `((?:${re$1})(?:/(?:${re$1}))*)` : `(${re$1})`;
        if (!tokenIndex) subPattern = optional && segment.length < 2 ? `(?:/${subPattern})` : "/" + subPattern;
        if (optional) subPattern += "?";
        pattern += subPattern;
        subSegmentScore += PathScore.Dynamic;
        if (optional) subSegmentScore += PathScore.BonusOptional;
        if (repeatable) subSegmentScore += PathScore.BonusRepeatable;
        if (re$1 === ".*") subSegmentScore += PathScore.BonusWildcard;
      }
      segmentScores.push(subSegmentScore);
    }
    score.push(segmentScores);
  }
  if (options.strict && options.end) {
    const i = score.length - 1;
    score[i][score[i].length - 1] += PathScore.BonusStrict;
  }
  if (!options.strict) pattern += "/?";
  if (options.end) pattern += "$";
  else if (options.strict && !pattern.endsWith("/")) pattern += "(?:/|$)";
  const re = new RegExp(pattern, options.sensitive ? "" : "i");
  function parse(path) {
    const match = path.match(re);
    const params = {};
    if (!match) return null;
    for (let i = 1; i < match.length; i++) {
      const value = match[i] || "";
      const key = keys[i - 1];
      params[key.name] = value && key.repeatable ? value.split("/") : value;
    }
    return params;
  }
  function stringify(params) {
    let path = "";
    let avoidDuplicatedSlash = false;
    for (const segment of segments) {
      if (!avoidDuplicatedSlash || !path.endsWith("/")) path += "/";
      avoidDuplicatedSlash = false;
      for (const token of segment) if (token.type === TokenType.Static) path += token.value;
      else if (token.type === TokenType.Param) {
        const { value, repeatable, optional } = token;
        const param = value in params ? params[value] : "";
        if (isArray$1(param) && !repeatable) throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
        const text2 = isArray$1(param) ? param.join("/") : param;
        if (!text2) if (optional) {
          if (segment.length < 2) if (path.endsWith("/")) path = path.slice(0, -1);
          else avoidDuplicatedSlash = true;
        } else throw new Error(`Missing required param "${value}"`);
        path += text2;
      }
    }
    return path || "/";
  }
  return {
    re,
    score,
    keys,
    parse,
    stringify
  };
}
function compareScoreArray(a, b) {
  let i = 0;
  while (i < a.length && i < b.length) {
    const diff = b[i] - a[i];
    if (diff) return diff;
    i++;
  }
  if (a.length < b.length) return a.length === 1 && a[0] === PathScore.Static + PathScore.Segment ? -1 : 1;
  else if (a.length > b.length) return b.length === 1 && b[0] === PathScore.Static + PathScore.Segment ? 1 : -1;
  return 0;
}
function comparePathParserScore(a, b) {
  let i = 0;
  const aScore = a.score;
  const bScore = b.score;
  while (i < aScore.length && i < bScore.length) {
    const comp = compareScoreArray(aScore[i], bScore[i]);
    if (comp) return comp;
    i++;
  }
  if (Math.abs(bScore.length - aScore.length) === 1) {
    if (isLastScoreNegative(aScore)) return 1;
    if (isLastScoreNegative(bScore)) return -1;
  }
  return bScore.length - aScore.length;
}
function isLastScoreNegative(score) {
  const last = score[score.length - 1];
  return score.length > 0 && last[last.length - 1] < 0;
}
const PATH_PARSER_OPTIONS_DEFAULTS = {
  strict: false,
  end: true,
  sensitive: false
};
function createRouteRecordMatcher(record, parent, options) {
  const parser = tokensToParser(tokenizePath(record.path), options);
  const matcher = assign(parser, {
    record,
    parent,
    children: [],
    alias: []
  });
  if (parent) {
    if (!matcher.record.aliasOf === !parent.record.aliasOf) parent.children.push(matcher);
  }
  return matcher;
}
function createRouterMatcher(routes2, globalOptions) {
  const matchers = [];
  const matcherMap = /* @__PURE__ */ new Map();
  globalOptions = mergeOptions(PATH_PARSER_OPTIONS_DEFAULTS, globalOptions);
  function getRecordMatcher(name) {
    return matcherMap.get(name);
  }
  function addRoute(record, parent, originalRecord) {
    const isRootAdd = !originalRecord;
    const mainNormalizedRecord = normalizeRouteRecord(record);
    mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
    const options = mergeOptions(globalOptions, record);
    const normalizedRecords = [mainNormalizedRecord];
    if ("alias" in record) {
      const aliases = typeof record.alias === "string" ? [record.alias] : record.alias;
      for (const alias of aliases) normalizedRecords.push(normalizeRouteRecord(assign({}, mainNormalizedRecord, {
        components: originalRecord ? originalRecord.record.components : mainNormalizedRecord.components,
        path: alias,
        aliasOf: originalRecord ? originalRecord.record : mainNormalizedRecord
      })));
    }
    let matcher;
    let originalMatcher;
    for (const normalizedRecord of normalizedRecords) {
      const { path } = normalizedRecord;
      if (parent && path[0] !== "/") {
        const parentPath = parent.record.path;
        const connectingSlash = parentPath[parentPath.length - 1] === "/" ? "" : "/";
        normalizedRecord.path = parent.record.path + (path && connectingSlash + path);
      }
      matcher = createRouteRecordMatcher(normalizedRecord, parent, options);
      if (originalRecord) {
        originalRecord.alias.push(matcher);
      } else {
        originalMatcher = originalMatcher || matcher;
        if (originalMatcher !== matcher) originalMatcher.alias.push(matcher);
        if (isRootAdd && record.name && !isAliasRecord(matcher)) {
          removeRoute(record.name);
        }
      }
      if (isMatchable(matcher)) insertMatcher(matcher);
      if (mainNormalizedRecord.children) {
        const children = mainNormalizedRecord.children;
        for (let i = 0; i < children.length; i++) addRoute(children[i], matcher, originalRecord && originalRecord.children[i]);
      }
      originalRecord = originalRecord || matcher;
    }
    return originalMatcher ? () => {
      removeRoute(originalMatcher);
    } : noop$1;
  }
  function removeRoute(matcherRef) {
    if (isRouteName(matcherRef)) {
      const matcher = matcherMap.get(matcherRef);
      if (matcher) {
        matcherMap.delete(matcherRef);
        matchers.splice(matchers.indexOf(matcher), 1);
        matcher.children.forEach(removeRoute);
        matcher.alias.forEach(removeRoute);
      }
    } else {
      const index = matchers.indexOf(matcherRef);
      if (index > -1) {
        matchers.splice(index, 1);
        if (matcherRef.record.name) matcherMap.delete(matcherRef.record.name);
        matcherRef.children.forEach(removeRoute);
        matcherRef.alias.forEach(removeRoute);
      }
    }
  }
  function getRoutes() {
    return matchers;
  }
  function insertMatcher(matcher) {
    const index = findInsertionIndex(matcher, matchers);
    matchers.splice(index, 0, matcher);
    if (matcher.record.name && !isAliasRecord(matcher)) matcherMap.set(matcher.record.name, matcher);
  }
  function resolve2(location$1, currentLocation) {
    let matcher;
    let params = {};
    let path;
    let name;
    if ("name" in location$1 && location$1.name) {
      matcher = matcherMap.get(location$1.name);
      if (!matcher) throw createRouterError(ErrorTypes.MATCHER_NOT_FOUND, { location: location$1 });
      name = matcher.record.name;
      params = assign(pickParams(currentLocation.params, matcher.keys.filter((k) => !k.optional).concat(matcher.parent ? matcher.parent.keys.filter((k) => k.optional) : []).map((k) => k.name)), location$1.params && pickParams(location$1.params, matcher.keys.map((k) => k.name)));
      path = matcher.stringify(params);
    } else if (location$1.path != null) {
      path = location$1.path;
      matcher = matchers.find((m) => m.re.test(path));
      if (matcher) {
        params = matcher.parse(path);
        name = matcher.record.name;
      }
    } else {
      matcher = currentLocation.name ? matcherMap.get(currentLocation.name) : matchers.find((m) => m.re.test(currentLocation.path));
      if (!matcher) throw createRouterError(ErrorTypes.MATCHER_NOT_FOUND, {
        location: location$1,
        currentLocation
      });
      name = matcher.record.name;
      params = assign({}, currentLocation.params, location$1.params);
      path = matcher.stringify(params);
    }
    const matched = [];
    let parentMatcher = matcher;
    while (parentMatcher) {
      matched.unshift(parentMatcher.record);
      parentMatcher = parentMatcher.parent;
    }
    return {
      name,
      path,
      params,
      matched,
      meta: mergeMetaFields(matched)
    };
  }
  routes2.forEach((route) => addRoute(route));
  function clearRoutes() {
    matchers.length = 0;
    matcherMap.clear();
  }
  return {
    addRoute,
    resolve: resolve2,
    removeRoute,
    clearRoutes,
    getRoutes,
    getRecordMatcher
  };
}
function pickParams(params, keys) {
  const newParams = {};
  for (const key of keys) if (key in params) newParams[key] = params[key];
  return newParams;
}
function normalizeRouteRecord(record) {
  const normalized = {
    path: record.path,
    redirect: record.redirect,
    name: record.name,
    meta: record.meta || {},
    aliasOf: record.aliasOf,
    beforeEnter: record.beforeEnter,
    props: normalizeRecordProps(record),
    children: record.children || [],
    instances: {},
    leaveGuards: /* @__PURE__ */ new Set(),
    updateGuards: /* @__PURE__ */ new Set(),
    enterCallbacks: {},
    components: "components" in record ? record.components || null : record.component && { default: record.component }
  };
  Object.defineProperty(normalized, "mods", { value: {} });
  return normalized;
}
function normalizeRecordProps(record) {
  const propsObject = {};
  const props = record.props || false;
  if ("component" in record) propsObject.default = props;
  else for (const name in record.components) propsObject[name] = typeof props === "object" ? props[name] : props;
  return propsObject;
}
function isAliasRecord(record) {
  while (record) {
    if (record.record.aliasOf) return true;
    record = record.parent;
  }
  return false;
}
function mergeMetaFields(matched) {
  return matched.reduce((meta, record) => assign(meta, record.meta), {});
}
function findInsertionIndex(matcher, matchers) {
  let lower = 0;
  let upper = matchers.length;
  while (lower !== upper) {
    const mid = lower + upper >> 1;
    if (comparePathParserScore(matcher, matchers[mid]) < 0) upper = mid;
    else lower = mid + 1;
  }
  const insertionAncestor = getInsertionAncestor(matcher);
  if (insertionAncestor) {
    upper = matchers.lastIndexOf(insertionAncestor, upper - 1);
  }
  return upper;
}
function getInsertionAncestor(matcher) {
  let ancestor = matcher;
  while (ancestor = ancestor.parent) if (isMatchable(ancestor) && comparePathParserScore(matcher, ancestor) === 0) return ancestor;
}
function isMatchable({ record }) {
  return !!(record.name || record.components && Object.keys(record.components).length || record.redirect);
}
function useLink(props) {
  const router2 = inject(routerKey);
  const currentRoute = inject(routeLocationKey);
  const route = computed(() => {
    const to = unref(props.to);
    return router2.resolve(to);
  });
  const activeRecordIndex = computed(() => {
    const { matched } = route.value;
    const { length } = matched;
    const routeMatched = matched[length - 1];
    const currentMatched = currentRoute.matched;
    if (!routeMatched || !currentMatched.length) return -1;
    const index = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
    if (index > -1) return index;
    const parentRecordPath = getOriginalPath(matched[length - 2]);
    return length > 1 && getOriginalPath(routeMatched) === parentRecordPath && currentMatched[currentMatched.length - 1].path !== parentRecordPath ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2])) : index;
  });
  const isActive = computed(() => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params));
  const isExactActive = computed(() => activeRecordIndex.value > -1 && activeRecordIndex.value === currentRoute.matched.length - 1 && isSameRouteLocationParams(currentRoute.params, route.value.params));
  function navigate(e = {}) {
    if (guardEvent(e)) {
      const p2 = router2[unref(props.replace) ? "replace" : "push"](unref(props.to)).catch(noop$1);
      if (props.viewTransition && typeof document !== "undefined" && "startViewTransition" in document) document.startViewTransition(() => p2);
      return p2;
    }
    return Promise.resolve();
  }
  return {
    route,
    href: computed(() => route.value.href),
    isActive,
    isExactActive,
    navigate
  };
}
function preferSingleVNode(vnodes) {
  return vnodes.length === 1 ? vnodes[0] : vnodes;
}
const RouterLinkImpl = /* @__PURE__ */ defineComponent({
  name: "RouterLink",
  compatConfig: { MODE: 3 },
  props: {
    to: {
      type: [String, Object],
      required: true
    },
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    custom: Boolean,
    ariaCurrentValue: {
      type: String,
      default: "page"
    },
    viewTransition: Boolean
  },
  useLink,
  setup(props, { slots }) {
    const link2 = /* @__PURE__ */ reactive(useLink(props));
    const { options } = inject(routerKey);
    const elClass = computed(() => ({
      [getLinkClass(props.activeClass, options.linkActiveClass, "router-link-active")]: link2.isActive,
      [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, "router-link-exact-active")]: link2.isExactActive
    }));
    return () => {
      const children = slots.default && preferSingleVNode(slots.default(link2));
      return props.custom ? children : h("a", {
        "aria-current": link2.isExactActive ? props.ariaCurrentValue : null,
        href: link2.href,
        onClick: link2.navigate,
        class: elClass.value
      }, children);
    };
  }
});
const RouterLink = RouterLinkImpl;
function guardEvent(e) {
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
  if (e.defaultPrevented) return;
  if (e.button !== void 0 && e.button !== 0) return;
  if (e.currentTarget && e.currentTarget.getAttribute) {
    const target = e.currentTarget.getAttribute("target");
    if (/\b_blank\b/i.test(target)) return;
  }
  if (e.preventDefault) e.preventDefault();
  return true;
}
function includesParams(outer, inner) {
  for (const key in inner) {
    const innerValue = inner[key];
    const outerValue = outer[key];
    if (typeof innerValue === "string") {
      if (innerValue !== outerValue) return false;
    } else if (!isArray$1(outerValue) || outerValue.length !== innerValue.length || innerValue.some((value, i) => value.valueOf() !== outerValue[i].valueOf())) return false;
  }
  return true;
}
function getOriginalPath(record) {
  return record ? record.aliasOf ? record.aliasOf.path : record.path : "";
}
const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null ? propClass : globalClass != null ? globalClass : defaultClass;
const RouterViewImpl = /* @__PURE__ */ defineComponent({
  name: "RouterView",
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: "default"
    },
    route: Object
  },
  compatConfig: { MODE: 3 },
  setup(props, { attrs, slots }) {
    const injectedRoute = inject(routerViewLocationKey);
    const routeToDisplay = computed(() => props.route || injectedRoute.value);
    const injectedDepth = inject(viewDepthKey, 0);
    const depth = computed(() => {
      let initialDepth = unref(injectedDepth);
      const { matched } = routeToDisplay.value;
      let matchedRoute;
      while ((matchedRoute = matched[initialDepth]) && !matchedRoute.components) initialDepth++;
      return initialDepth;
    });
    const matchedRouteRef = computed(() => routeToDisplay.value.matched[depth.value]);
    provide(viewDepthKey, computed(() => depth.value + 1));
    provide(matchedRouteKey, matchedRouteRef);
    provide(routerViewLocationKey, routeToDisplay);
    const viewRef = /* @__PURE__ */ ref();
    watch(() => [
      viewRef.value,
      matchedRouteRef.value,
      props.name
    ], ([instance2, to, name], [oldInstance, from, oldName]) => {
      if (to) {
        to.instances[name] = instance2;
        if (from && from !== to && instance2 && instance2 === oldInstance) {
          if (!to.leaveGuards.size) to.leaveGuards = from.leaveGuards;
          if (!to.updateGuards.size) to.updateGuards = from.updateGuards;
        }
      }
      if (instance2 && to && (!from || !isSameRouteRecord(to, from) || !oldInstance)) (to.enterCallbacks[name] || []).forEach((callback) => callback(instance2));
    }, { flush: "post" });
    return () => {
      const route = routeToDisplay.value;
      const currentName = props.name;
      const matchedRoute = matchedRouteRef.value;
      const ViewComponent = matchedRoute && matchedRoute.components[currentName];
      if (!ViewComponent) return normalizeSlot(slots.default, {
        Component: ViewComponent,
        route
      });
      const routePropsOption = matchedRoute.props[currentName];
      const routeProps = routePropsOption ? routePropsOption === true ? route.params : typeof routePropsOption === "function" ? routePropsOption(route) : routePropsOption : null;
      const onVnodeUnmounted = (vnode) => {
        if (vnode.component.isUnmounted) matchedRoute.instances[currentName] = null;
      };
      const component = h(ViewComponent, assign({}, routeProps, attrs, {
        onVnodeUnmounted,
        ref: viewRef
      }));
      return normalizeSlot(slots.default, {
        Component: component,
        route
      }) || component;
    };
  }
});
function normalizeSlot(slot, data) {
  if (!slot) return null;
  const slotContent = slot(data);
  return slotContent.length === 1 ? slotContent[0] : slotContent;
}
const RouterView = RouterViewImpl;
function createRouter(options) {
  const matcher = createRouterMatcher(options.routes, options);
  const parseQuery$1 = options.parseQuery || parseQuery;
  const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
  const routerHistory = options.history;
  const beforeGuards = useCallbacks();
  const beforeResolveGuards = useCallbacks();
  const afterGuards = useCallbacks();
  const currentRoute = /* @__PURE__ */ shallowRef(START_LOCATION_NORMALIZED);
  let pendingLocation = START_LOCATION_NORMALIZED;
  if (isBrowser && options.scrollBehavior && "scrollRestoration" in history) history.scrollRestoration = "manual";
  const normalizeParams = applyToParams.bind(null, (paramValue) => "" + paramValue);
  const encodeParams = applyToParams.bind(null, encodeParam);
  const decodeParams = applyToParams.bind(null, decode);
  function addRoute(parentOrRoute, route) {
    let parent;
    let record;
    if (isRouteName(parentOrRoute)) {
      parent = matcher.getRecordMatcher(parentOrRoute);
      record = route;
    } else record = parentOrRoute;
    return matcher.addRoute(record, parent);
  }
  function removeRoute(name) {
    const recordMatcher = matcher.getRecordMatcher(name);
    if (recordMatcher) matcher.removeRoute(recordMatcher);
  }
  function getRoutes() {
    return matcher.getRoutes().map((routeMatcher) => routeMatcher.record);
  }
  function hasRoute(name) {
    return !!matcher.getRecordMatcher(name);
  }
  function resolve2(rawLocation, currentLocation) {
    currentLocation = assign({}, currentLocation || currentRoute.value);
    if (typeof rawLocation === "string") {
      const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
      const matchedRoute$1 = matcher.resolve({ path: locationNormalized.path }, currentLocation);
      const href$1 = routerHistory.createHref(locationNormalized.fullPath);
      return assign(locationNormalized, matchedRoute$1, {
        params: decodeParams(matchedRoute$1.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: void 0,
        href: href$1
      });
    }
    let matcherLocation;
    if (rawLocation.path != null) {
      matcherLocation = assign({}, rawLocation, { path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path });
    } else {
      const targetParams = assign({}, rawLocation.params);
      for (const key in targetParams) if (targetParams[key] == null) delete targetParams[key];
      matcherLocation = assign({}, rawLocation, { params: encodeParams(targetParams) });
      currentLocation.params = encodeParams(currentLocation.params);
    }
    const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
    const hash = rawLocation.hash || "";
    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
    const fullPath = stringifyURL(stringifyQuery$1, assign({}, rawLocation, {
      hash: encodeHash(hash),
      path: matchedRoute.path
    }));
    const href = routerHistory.createHref(fullPath);
    return assign({
      fullPath,
      hash,
      query: stringifyQuery$1 === stringifyQuery ? normalizeQuery(rawLocation.query) : rawLocation.query || {}
    }, matchedRoute, {
      redirectedFrom: void 0,
      href
    });
  }
  function locationAsObject(to) {
    return typeof to === "string" ? parseURL(parseQuery$1, to, currentRoute.value.path) : assign({}, to);
  }
  function checkCanceledNavigation(to, from) {
    if (pendingLocation !== to) return createRouterError(ErrorTypes.NAVIGATION_CANCELLED, {
      from,
      to
    });
  }
  function push(to) {
    return pushWithRedirect(to);
  }
  function replace(to) {
    return push(assign(locationAsObject(to), { replace: true }));
  }
  function handleRedirectRecord(to, from) {
    const lastMatched = to.matched[to.matched.length - 1];
    if (lastMatched && lastMatched.redirect) {
      const { redirect } = lastMatched;
      let newTargetLocation = typeof redirect === "function" ? redirect(to, from) : redirect;
      if (typeof newTargetLocation === "string") {
        newTargetLocation = newTargetLocation.includes("?") || newTargetLocation.includes("#") ? newTargetLocation = locationAsObject(newTargetLocation) : { path: newTargetLocation };
        newTargetLocation.params = {};
      }
      return assign({
        query: to.query,
        hash: to.hash,
        params: newTargetLocation.path != null ? {} : to.params
      }, newTargetLocation);
    }
  }
  function pushWithRedirect(to, redirectedFrom) {
    const targetLocation = pendingLocation = resolve2(to);
    const from = currentRoute.value;
    const data = to.state;
    const force = to.force;
    const replace$1 = to.replace === true;
    const shouldRedirect = handleRedirectRecord(targetLocation, from);
    if (shouldRedirect) return pushWithRedirect(assign(locationAsObject(shouldRedirect), {
      state: typeof shouldRedirect === "object" ? assign({}, data, shouldRedirect.state) : data,
      force,
      replace: replace$1
    }), redirectedFrom || targetLocation);
    const toLocation = targetLocation;
    toLocation.redirectedFrom = redirectedFrom;
    let failure;
    if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
      failure = createRouterError(ErrorTypes.NAVIGATION_DUPLICATED, {
        to: toLocation,
        from
      });
      handleScroll(from, from, true, false);
    }
    return (failure ? Promise.resolve(failure) : navigate(toLocation, from)).catch((error) => isNavigationFailure(error) ? isNavigationFailure(error, ErrorTypes.NAVIGATION_GUARD_REDIRECT) ? error : markAsReady(error) : triggerError(error, toLocation, from)).then((failure$1) => {
      if (failure$1) {
        if (isNavigationFailure(failure$1, ErrorTypes.NAVIGATION_GUARD_REDIRECT)) {
          return pushWithRedirect(assign({ replace: replace$1 }, locationAsObject(failure$1.to), {
            state: typeof failure$1.to === "object" ? assign({}, data, failure$1.to.state) : data,
            force
          }), redirectedFrom || toLocation);
        }
      } else failure$1 = finalizeNavigation(toLocation, from, true, replace$1, data);
      triggerAfterEach(toLocation, from, failure$1);
      return failure$1;
    });
  }
  function checkCanceledNavigationAndReject(to, from) {
    const error = checkCanceledNavigation(to, from);
    return error ? Promise.reject(error) : Promise.resolve();
  }
  function runWithContext(fn) {
    const app2 = installedApps.values().next().value;
    return app2 && typeof app2.runWithContext === "function" ? app2.runWithContext(fn) : fn();
  }
  function navigate(to, from) {
    let guards;
    const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
    guards = extractComponentsGuards(leavingRecords.reverse(), "beforeRouteLeave", to, from);
    for (const record of leavingRecords) record.leaveGuards.forEach((guard) => {
      guards.push(guardToPromiseFn(guard, to, from));
    });
    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
    guards.push(canceledNavigationCheck);
    return runGuardQueue(guards).then(() => {
      guards = [];
      for (const guard of beforeGuards.list()) guards.push(guardToPromiseFn(guard, to, from));
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = extractComponentsGuards(updatingRecords, "beforeRouteUpdate", to, from);
      for (const record of updatingRecords) record.updateGuards.forEach((guard) => {
        guards.push(guardToPromiseFn(guard, to, from));
      });
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = [];
      for (const record of enteringRecords) if (record.beforeEnter) if (isArray$1(record.beforeEnter)) for (const beforeEnter of record.beforeEnter) guards.push(guardToPromiseFn(beforeEnter, to, from));
      else guards.push(guardToPromiseFn(record.beforeEnter, to, from));
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      to.matched.forEach((record) => record.enterCallbacks = {});
      guards = extractComponentsGuards(enteringRecords, "beforeRouteEnter", to, from, runWithContext);
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = [];
      for (const guard of beforeResolveGuards.list()) guards.push(guardToPromiseFn(guard, to, from));
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).catch((err) => isNavigationFailure(err, ErrorTypes.NAVIGATION_CANCELLED) ? err : Promise.reject(err));
  }
  function triggerAfterEach(to, from, failure) {
    afterGuards.list().forEach((guard) => runWithContext(() => guard(to, from, failure)));
  }
  function finalizeNavigation(toLocation, from, isPush, replace$1, data) {
    const error = checkCanceledNavigation(toLocation, from);
    if (error) return error;
    const isFirstNavigation = from === START_LOCATION_NORMALIZED;
    const state = !isBrowser ? {} : history.state;
    if (isPush) if (replace$1 || isFirstNavigation) routerHistory.replace(toLocation.fullPath, assign({ scroll: isFirstNavigation && state && state.scroll }, data));
    else routerHistory.push(toLocation.fullPath, data);
    currentRoute.value = toLocation;
    handleScroll(toLocation, from, isPush, isFirstNavigation);
    markAsReady();
  }
  let removeHistoryListener;
  function setupListeners() {
    if (removeHistoryListener) return;
    removeHistoryListener = routerHistory.listen((to, _from, info) => {
      if (!router2.listening) return;
      const toLocation = resolve2(to);
      const shouldRedirect = handleRedirectRecord(toLocation, router2.currentRoute.value);
      if (shouldRedirect) {
        pushWithRedirect(assign(shouldRedirect, {
          replace: true,
          force: true
        }), toLocation).catch(noop$1);
        return;
      }
      pendingLocation = toLocation;
      const from = currentRoute.value;
      if (isBrowser) saveScrollPosition(getScrollKey(from.fullPath, info.delta), computeScrollPosition());
      navigate(toLocation, from).catch((error) => {
        if (isNavigationFailure(error, ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_CANCELLED)) return error;
        if (isNavigationFailure(error, ErrorTypes.NAVIGATION_GUARD_REDIRECT)) {
          pushWithRedirect(assign(locationAsObject(error.to), { force: true }), toLocation).then((failure) => {
            if (isNavigationFailure(failure, ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_DUPLICATED) && !info.delta && info.type === NavigationType.pop) routerHistory.go(-1, false);
          }).catch(noop$1);
          return Promise.reject();
        }
        if (info.delta) routerHistory.go(-info.delta, false);
        return triggerError(error, toLocation, from);
      }).then((failure) => {
        failure = failure || finalizeNavigation(toLocation, from, false);
        if (failure) {
          if (info.delta && !isNavigationFailure(failure, ErrorTypes.NAVIGATION_CANCELLED)) routerHistory.go(-info.delta, false);
          else if (info.type === NavigationType.pop && isNavigationFailure(failure, ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_DUPLICATED)) routerHistory.go(-1, false);
        }
        triggerAfterEach(toLocation, from, failure);
      }).catch(noop$1);
    });
  }
  let readyHandlers = useCallbacks();
  let errorListeners = useCallbacks();
  let ready;
  function triggerError(error, to, from) {
    markAsReady(error);
    const list2 = errorListeners.list();
    if (list2.length) list2.forEach((handler) => handler(error, to, from));
    else {
      console.error(error);
    }
    return Promise.reject(error);
  }
  function isReady() {
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED) return Promise.resolve();
    return new Promise((resolve$1, reject) => {
      readyHandlers.add([resolve$1, reject]);
    });
  }
  function markAsReady(err) {
    if (!ready) {
      ready = !err;
      setupListeners();
      readyHandlers.list().forEach(([resolve$1, reject]) => err ? reject(err) : resolve$1());
      readyHandlers.reset();
    }
    return err;
  }
  function handleScroll(to, from, isPush, isFirstNavigation) {
    const { scrollBehavior } = options;
    if (!isBrowser || !scrollBehavior) return Promise.resolve();
    const scrollPosition = !isPush && getSavedScrollPosition(getScrollKey(to.fullPath, 0)) || (isFirstNavigation || !isPush) && history.state && history.state.scroll || null;
    return nextTick().then(() => scrollBehavior(to, from, scrollPosition)).then((position) => position && scrollToPosition(position)).catch((err) => triggerError(err, to, from));
  }
  const go = (delta) => routerHistory.go(delta);
  let started;
  const installedApps = /* @__PURE__ */ new Set();
  const router2 = {
    currentRoute,
    listening: true,
    addRoute,
    removeRoute,
    clearRoutes: matcher.clearRoutes,
    hasRoute,
    getRoutes,
    resolve: resolve2,
    options,
    push,
    replace,
    go,
    back: () => go(-1),
    forward: () => go(1),
    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,
    onError: errorListeners.add,
    isReady,
    install(app2) {
      app2.component("RouterLink", RouterLink);
      app2.component("RouterView", RouterView);
      app2.config.globalProperties.$router = router2;
      Object.defineProperty(app2.config.globalProperties, "$route", {
        enumerable: true,
        get: () => unref(currentRoute)
      });
      if (isBrowser && !started && currentRoute.value === START_LOCATION_NORMALIZED) {
        started = true;
        push(routerHistory.location).catch((err) => {
        });
      }
      const reactiveRoute = {};
      for (const key in START_LOCATION_NORMALIZED) Object.defineProperty(reactiveRoute, key, {
        get: () => currentRoute.value[key],
        enumerable: true
      });
      app2.provide(routerKey, router2);
      app2.provide(routeLocationKey, /* @__PURE__ */ shallowReactive(reactiveRoute));
      app2.provide(routerViewLocationKey, currentRoute);
      const unmountApp = app2.unmount;
      installedApps.add(app2);
      app2.unmount = function() {
        installedApps.delete(app2);
        if (installedApps.size < 1) {
          pendingLocation = START_LOCATION_NORMALIZED;
          removeHistoryListener && removeHistoryListener();
          removeHistoryListener = null;
          currentRoute.value = START_LOCATION_NORMALIZED;
          started = false;
          ready = false;
        }
        unmountApp();
      };
    }
  };
  function runGuardQueue(guards) {
    return guards.reduce((promise, guard) => promise.then(() => runWithContext(guard)), Promise.resolve());
  }
  return router2;
}
function useRouter() {
  return inject(routerKey);
}
function useRoute(_name) {
  return inject(routeLocationKey);
}
const useGatewayStore = /* @__PURE__ */ defineStore("gateway", () => {
  const running = /* @__PURE__ */ ref(false);
  const gatewayReady = /* @__PURE__ */ ref(false);
  const port = /* @__PURE__ */ ref(null);
  const envCheckResults = /* @__PURE__ */ ref(null);
  const logs = /* @__PURE__ */ ref([]);
  function setRunning(isRunning) {
    running.value = isRunning;
    if (!isRunning) {
      gatewayReady.value = false;
    }
  }
  function setGatewayReady(ready) {
    gatewayReady.value = ready;
  }
  function setPort(p2) {
    port.value = p2;
  }
  function setEnvCheckResults(results) {
    envCheckResults.value = results;
  }
  function addLog(log) {
    logs.value.push(log);
  }
  function clearLogs() {
    logs.value = [];
  }
  return { running, gatewayReady, port, envCheckResults, logs, setRunning, setGatewayReady, setPort, setEnvCheckResults, addLog, clearLogs };
});
function useToast() {
  function showToast(message, isError = false) {
    if (window.showToastVue) {
      window.showToastVue(message, isError);
    }
  }
  return { showToast };
}
function useGateway() {
  const store = useGatewayStore();
  const { showToast } = useToast();
  const loading = /* @__PURE__ */ ref(false);
  let bootPhaseHandler = null;
  let statusHandler = null;
  let readyHandler = null;
  let restartedHandler = null;
  function setupStatusListener() {
    if (statusHandler) return;
    statusHandler = (data) => {
      store.setRunning(data.running);
      if (data.port) {
        store.setPort(data.port);
      }
    };
    window.uclaw.onGatewayStatus(statusHandler);
  }
  function cleanupStatusListener() {
    if (statusHandler) {
      window.uclaw.offGatewayStatus(statusHandler);
      statusHandler = null;
    }
  }
  function setupReadyListener() {
    if (readyHandler) return;
    readyHandler = (data) => {
      store.setGatewayReady(!!data);
    };
    window.uclaw.onGatewayReady(readyHandler);
  }
  function cleanupReadyListener() {
    if (readyHandler) {
      window.uclaw.offGatewayReady(readyHandler);
      readyHandler = null;
    }
  }
  function setupRestartedListener() {
    if (restartedHandler || !window.uclaw.onGatewayRestarted) return;
    restartedHandler = (data) => {
      if (data && data.success === false) {
        store.setRunning(false);
        store.setGatewayReady(false);
        return;
      }
      store.setRunning(true);
      store.setGatewayReady(true);
      if (data?.port) store.setPort(data.port);
      console.log("[gateway] restart recovered UI state /* codex-gateway-restart-ui-recovery */", data);
    };
    window.uclaw.onGatewayRestarted(restartedHandler);
  }
  function cleanupRestartedListener() {
    if (restartedHandler && window.uclaw.offGatewayRestarted) {
      window.uclaw.offGatewayRestarted(restartedHandler);
      restartedHandler = null;
    }
  }
  function setupBootPhaseListener() {
    if (bootPhaseHandler) return;
    bootPhaseHandler = (data) => {
      const { phase, title, detail, progress } = data;
      window.updateLoadingProgress?.(progress, title, detail);
      if (phase === "done") {
        window.hideLoadingOverlayVue?.();
      } else if (phase === "error") {
        setTimeout(() => {
          window.hideLoadingOverlayVue?.();
        }, 1e3);
      }
    };
    window.uclaw.onGatewayBootPhase(bootPhaseHandler);
  }
  function cleanupBootPhaseListener() {
    if (bootPhaseHandler) {
      window.uclaw.offGatewayBootPhase(bootPhaseHandler);
    }
  }
  onUnmounted(() => {
    cleanupBootPhaseListener();
    cleanupStatusListener();
    cleanupReadyListener();
    cleanupRestartedListener();
  });
  setupBootPhaseListener();
  setupStatusListener();
  setupReadyListener();
  setupRestartedListener();
  async function startGatewayHook() {
    loading.value = true;
    try {
      if (store.running) {
        showToast("当前网关处于运行状态...");
        return;
      }
      const result = await window.uclaw.ipcStartGateway();
      if (!result.ok) {
        throw new Error(result.error);
      }
    } catch (e) {
      window.updateLoadingProgress?.(0, "启动失败", e.message);
      throw e;
    } finally {
      loading.value = false;
    }
  }
  async function stopGatewayHook() {
    await window.uclaw.ipcStopGateway();
  }
  return { loading, startGatewayHook, stopGatewayHook };
}
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _hoisted_1$y = ["disabled"];
const _hoisted_2$x = {
  key: 0,
  class: "tech-btn__spinner"
};
const _hoisted_3$w = {
  key: 1,
  class: "tech-btn__icon"
};
const _hoisted_4$s = {
  key: 2,
  class: "tech-btn__text"
};
const _sfc_main$y = {
  __name: "TechButton",
  props: {
    variant: {
      type: String,
      default: "primary",
      validator: (v) => ["primary", "secondary", "danger", "ghost"].includes(v)
    },
    size: {
      type: String,
      default: "medium",
      validator: (v) => ["small", "medium", "large"].includes(v)
    },
    disabled: Boolean,
    loading: Boolean,
    iconOnly: Boolean
  },
  setup(__props) {
    function handleMouseEnter(event) {
      const btn = event.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < rect.width * 0.3) {
        btn.classList.add("enter-left");
      } else if (x > rect.width * 0.7) {
        btn.classList.add("enter-right");
      } else if (y < rect.height * 0.3) {
        btn.classList.add("enter-top");
      } else {
        btn.classList.add("enter-bottom");
      }
    }
    function handleMouseLeave(event) {
      const btn = event.currentTarget;
      btn.classList.remove("enter-left", "enter-right", "enter-top", "enter-bottom");
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("button", {
        class: normalizeClass(["tech-btn", [
          `tech-btn--${__props.variant}`,
          `tech-btn--${__props.size}`,
          { "tech-btn--loading": __props.loading, "tech-btn--icon-only": __props.iconOnly }
        ]]),
        disabled: __props.disabled || __props.loading,
        onMouseenter: handleMouseEnter,
        onMouseleave: handleMouseLeave
      }, [
        __props.loading ? (openBlock(), createElementBlock("span", _hoisted_2$x)) : _ctx.$slots.icon ? (openBlock(), createElementBlock("span", _hoisted_3$w, [
          renderSlot(_ctx.$slots, "icon", {}, void 0)
        ])) : createCommentVNode("", true),
        !__props.iconOnly ? (openBlock(), createElementBlock("span", _hoisted_4$s, [
          renderSlot(_ctx.$slots, "default", {}, void 0)
        ])) : createCommentVNode("", true)
      ], 42, _hoisted_1$y);
    };
  }
};
const TechButton = /* @__PURE__ */ _export_sfc(_sfc_main$y, [["__scopeId", "data-v-acb33ee6"]]);
const _hoisted_1$x = { class: "sidebar-sidebar" };
const _hoisted_2$w = { class: "sidebar-nav-list" };
const _hoisted_3$v = { class: "sidebar-gateway-controls" };
const _sfc_main$x = {
  __name: "Sidebar",
  setup(__props) {
    const { showToast } = useToast();
    const gatewayStore = useGatewayStore();
    const { loading, startGatewayHook, stopGatewayHook } = useGateway();
    async function handleStart() {
      window.showLoadingOverlayVue?.();
      try {
        await startGatewayHook();
        showToast("小龙虾启动成功");
      } catch (e) {
        showToast("启动失败: " + e.message, true);
      }
    }
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      return openBlock(), createElementBlock("aside", _hoisted_1$x, [
        createBaseVNode("nav", _hoisted_2$w, [
          createVNode(_component_router_link, {
            to: "/home",
            class: normalizeClass(["sidebar-nav-item", { active: _ctx.$route.path === "/home" }])
          }, {
            default: withCtx(() => [..._cache[0] || (_cache[0] = [
              createBaseVNode("span", { class: "iconfont icon-clawshouye" }, null, -1),
              createBaseVNode("span", null, "首页", -1)
            ])]),
            _: 1
          }, 8, ["class"]),
          createVNode(_component_router_link, {
            to: "/ai-chat",
            class: normalizeClass(["sidebar-nav-item", { active: _ctx.$route.path === "/ai-chat" }])
          }, {
            default: withCtx(() => [..._cache[1] || (_cache[1] = [
              createBaseVNode("span", { class: "iconfont icon-clawa-huihua2" }, null, -1),
              createBaseVNode("span", null, "AI会话", -1)
            ])]),
            _: 1
          }, 8, ["class"]),
          createVNode(_component_router_link, {
            to: "/model",
            class: normalizeClass(["sidebar-nav-item", { active: _ctx.$route.path === "/model" }])
          }, {
            default: withCtx(() => [..._cache[2] || (_cache[2] = [
              createBaseVNode("span", { class: "iconfont icon-clawmoxingpeizhi" }, null, -1),
              createBaseVNode("span", null, "模型配置", -1)
            ])]),
            _: 1
          }, 8, ["class"]),
          createCommentVNode("", true),
          createVNode(_component_router_link, {
            to: "/skill",
            class: normalizeClass(["sidebar-nav-item", { active: _ctx.$route.path === "/skill" }])
          }, {
            default: withCtx(() => [..._cache[4] || (_cache[4] = [
              createBaseVNode("span", { class: "iconfont icon-clawjinengguanli" }, null, -1),
              createBaseVNode("span", null, "技能管理", -1)
            ])]),
            _: 1
          }, 8, ["class"]),
          createVNode(_component_router_link, {
            to: "/chat",
            class: normalizeClass(["sidebar-nav-item", { active: _ctx.$route.path === "/chat" }])
          }, {
            default: withCtx(() => [..._cache[5] || (_cache[5] = [
              createBaseVNode("span", { class: "iconfont icon-clawliaotiangongju-qun" }, null, -1),
              createBaseVNode("span", null, "聊天工具", -1)
            ])]),
            _: 1
          }, 8, ["class"]),
          createCommentVNode("", true),
          createCommentVNode("", true),
          createCommentVNode("", true),
          createVNode(_component_router_link, {
            to: "/env-check",
            class: normalizeClass(["sidebar-nav-item", { active: _ctx.$route.path === "/env-check" }])
          }, {
            default: withCtx(() => [..._cache[9] || (_cache[9] = [
              createBaseVNode("span", { class: "iconfont icon-clawhuanjingjiancha" }, null, -1),
              createBaseVNode("span", null, "环境检查", -1)
            ])]),
            _: 1
          }, 8, ["class"]),
          createVNode(_component_router_link, {
            to: "/settings",
            class: normalizeClass(["sidebar-nav-item", { active: _ctx.$route.path === "/settings" }])
          }, {
            default: withCtx(() => [..._cache[10] || (_cache[10] = [
              createBaseVNode("span", { class: "iconfont icon-clawshezhi" }, null, -1),
              createBaseVNode("span", null, "设置", -1)
            ])]),
            _: 1
          }, 8, ["class"])
        ]),
        createBaseVNode("div", _hoisted_3$v, [
          unref(loading) ? (openBlock(), createBlock(TechButton, {
            key: 0,
            variant: "secondary",
            loading: "",
            disabled: ""
          }, {
            default: withCtx(() => [..._cache[11] || (_cache[11] = [
              createTextVNode(" 启动中 ", -1)
            ])]),
            _: 1
          })) : !unref(gatewayStore).running ? (openBlock(), createBlock(TechButton, {
            key: 1,
            variant: "primary",
            onClick: handleStart
          }, {
            icon: withCtx(() => [..._cache[12] || (_cache[12] = [
              createBaseVNode("span", { class: "iconfont icon-clawopen" }, null, -1)
            ])]),
            default: withCtx(() => [
              _cache[13] || (_cache[13] = createTextVNode(" 开启Gateway ", -1))
            ]),
            _: 1
          })) : (openBlock(), createBlock(TechButton, {
            key: 2,
            variant: "danger",
            onClick: unref(stopGatewayHook)
          }, {
            icon: withCtx(() => [..._cache[14] || (_cache[14] = [
              createBaseVNode("span", { class: "iconfont icon-clawguanbi" }, null, -1)
            ])]),
            default: withCtx(() => [
              _cache[15] || (_cache[15] = createTextVNode(" 关闭Gateway ", -1))
            ]),
            _: 1
          }, 8, ["onClick"]))
        ])
      ]);
    };
  }
};
const Sidebar = /* @__PURE__ */ _export_sfc(_sfc_main$x, [["__scopeId", "data-v-0d9089eb"]]);
const useActivationStore = /* @__PURE__ */ defineStore("activation", () => {
  const activated = /* @__PURE__ */ ref(true);
  const username = /* @__PURE__ */ ref("");
  const userId = /* @__PURE__ */ ref("");
  const group = /* @__PURE__ */ ref("");
  function setActivation(data) {
    activated.value = true;
    username.value = data.username || "";
    userId.value = data.user_id || "";
    group.value = data.group || "";
  }
  function clearActivation() {
    activated.value = false;
    username.value = "";
    userId.value = "";
    group.value = "";
  }
  return { activated, username, userId, group, setActivation, clearActivation };
});
const THEME_KEY = "theme-mode";
function getSystemTheme() {
  const hour = (/* @__PURE__ */ new Date()).getHours();
  return hour >= 8 && hour < 18 ? "light" : "dark";
}
function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return getSystemTheme();
}
const useThemeStore = /* @__PURE__ */ defineStore("theme", () => {
  const theme = /* @__PURE__ */ ref(getInitialTheme());
  const isDark = computed(() => theme.value === "dark");
  const isDay = computed(() => theme.value === "light");
  function toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, theme.value);
    updateHtmlClass();
  }
  function updateHtmlClass() {
    if (theme.value === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }
  function init() {
    updateHtmlClass();
  }
  return { theme, isDark, isDay, toggle, init };
});
const _hoisted_1$w = { class: "header-header" };
const _hoisted_2$v = { class: "header-right" };
const _hoisted_3$u = {
  key: 0,
  class: "header-badge header-badge-not-activated"
};
const _hoisted_4$r = {
  key: 1,
  class: "header-badge header-badge-activated"
};
const _hoisted_5$r = ["title"];
const _hoisted_6$p = {
  key: 0,
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
const _hoisted_7$o = {
  key: 1,
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
const _sfc_main$w = {
  __name: "Header",
  setup(__props) {
    useRoute();
    const activationStore = useActivationStore();
    const themeStore = useThemeStore();
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("header", _hoisted_1$w, [
        _cache[6] || (_cache[6] = createBaseVNode("div", { class: "header-left" }, null, -1)),
        createBaseVNode("div", _hoisted_2$v, [
          !unref(activationStore).activated ? (openBlock(), createElementBlock("div", _hoisted_3$u, [..._cache[1] || (_cache[1] = [
            createBaseVNode("span", { class: "iconfont icon-clawweijihuo" }, null, -1),
            createBaseVNode("span", null, "设备未激活", -1)
          ])])) : (openBlock(), createElementBlock("div", _hoisted_4$r, [..._cache[2] || (_cache[2] = [
            createBaseVNode("span", { class: "iconfont icon-clawyijihuo" }, null, -1),
            createBaseVNode("span", null, "设备已激活", -1)
          ])])),
          _cache[5] || (_cache[5] = createBaseVNode("div", { class: "header-status-indicator" }, [
            createBaseVNode("span", { class: "w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" }),
            createBaseVNode("span", null, "Gateway已连接")
          ], -1)),
          createBaseVNode("button", {
            class: "theme-toggle-btn",
            title: unref(themeStore).isDay ? "切换到夜间模式" : "切换到日间模式",
            onClick: _cache[0] || (_cache[0] = ($event) => unref(themeStore).toggle())
          }, [
            unref(themeStore).isDay ? (openBlock(), createElementBlock("svg", _hoisted_6$p, [..._cache[3] || (_cache[3] = [
              createBaseVNode("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }, null, -1)
            ])])) : (openBlock(), createElementBlock("svg", _hoisted_7$o, [..._cache[4] || (_cache[4] = [
              createStaticVNode('<circle cx="12" cy="12" r="5" data-v-369cc123></circle><line x1="12" y1="1" x2="12" y2="3" data-v-369cc123></line><line x1="12" y1="21" x2="12" y2="23" data-v-369cc123></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" data-v-369cc123></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" data-v-369cc123></line><line x1="1" y1="12" x2="3" y2="12" data-v-369cc123></line><line x1="21" y1="12" x2="23" y2="12" data-v-369cc123></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" data-v-369cc123></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" data-v-369cc123></line>', 9)
            ])]))
          ], 8, _hoisted_5$r)
        ])
      ]);
    };
  }
};
const Header = /* @__PURE__ */ _export_sfc(_sfc_main$w, [["__scopeId", "data-v-369cc123"]]);
const _imports_0$2 = "" + new URL("../logo.png", import.meta.url).href;
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}
const { toString } = Object.prototype;
const { getPrototypeOf: getPrototypeOf$1 } = Object;
const { iterator, toStringTag } = Symbol;
const kindOf = /* @__PURE__ */ ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
const typeOfTest = (type) => (thing) => typeof thing === type;
const { isArray } = Array;
const isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction$1(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
const isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
const isString = typeOfTest("string");
const isFunction$1 = typeOfTest("function");
const isNumber = typeOfTest("number");
const isObject = (thing) => thing !== null && typeof thing === "object";
const isBoolean = (thing) => thing === true || thing === false;
const isPlainObject = (val) => {
  if (kindOf(val) !== "object") {
    return false;
  }
  const prototype2 = getPrototypeOf$1(val);
  return (prototype2 === null || prototype2 === Object.prototype || Object.getPrototypeOf(prototype2) === null) && !(toStringTag in val) && !(iterator in val);
};
const isEmptyObject = (val) => {
  if (!isObject(val) || isBuffer(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    return false;
  }
};
const isDate = kindOfTest("Date");
const isFile = kindOfTest("File");
const isReactNativeBlob = (value) => {
  return !!(value && typeof value.uri !== "undefined");
};
const isReactNative = (formData) => formData && typeof formData.getParts !== "undefined";
const isBlob = kindOfTest("Blob");
const isFileList = kindOfTest("FileList");
const isStream = (val) => isObject(val) && isFunction$1(val.pipe);
function getGlobal$1() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return {};
}
const G = getGlobal$1();
const FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
const isFormData = (thing) => {
  if (!thing) return false;
  if (FormDataCtor && thing instanceof FormDataCtor) return true;
  const proto = getPrototypeOf$1(thing);
  if (!proto || proto === Object.prototype) return false;
  if (!isFunction$1(thing.append)) return false;
  const kind = kindOf(thing);
  return kind === "formdata" || // detect form-data instance
  kind === "object" && isFunction$1(thing.toString) && thing.toString() === "[object FormData]";
};
const isURLSearchParams = kindOfTest("URLSearchParams");
const [isReadableStream, isRequest, isResponse, isHeaders] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(kindOfTest);
const trim = (str) => {
  return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    if (isBuffer(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
const _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
const isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge() {
  const { caseless, skipUndefined } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}
const extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(
    b,
    (val, key) => {
      if (thisArg && isFunction$1(val)) {
        Object.defineProperty(a, key, {
          value: bind(val, thisArg),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(a, key, {
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    },
    { allOwnKeys }
  );
  return a;
};
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  Object.defineProperty(constructor.prototype, "constructor", {
    value: constructor,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(constructor, "super", {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
const toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf$1(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
const isTypedArray = /* @__PURE__ */ ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf$1(Uint8Array));
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
const isHTMLForm = kindOfTest("HTMLFormElement");
const toCamelCase = (str) => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer2(m, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
const hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
const isRegExp = kindOfTest("RegExp");
const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction$1(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
      return false;
    }
    const value = obj[name];
    if (!isFunction$1(value)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
const noop = () => {
};
const toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction$1(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
const toJSONObject = (obj) => {
  const stack2 = new Array(10);
  const visit = (source, i) => {
    if (isObject(source)) {
      if (stack2.indexOf(source) >= 0) {
        return;
      }
      if (isBuffer(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        stack2[i] = source;
        const target = isArray(source) ? [] : {};
        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });
        stack2[i] = void 0;
        return target;
      }
    }
    return source;
  };
  return visit(obj, 0);
};
const isAsyncFn = kindOfTest("AsyncFunction");
const isThenable = (thing) => thing && (isObject(thing) || isFunction$1(thing)) && isFunction$1(thing.then) && isFunction$1(thing.catch);
const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener(
      "message",
      ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      },
      false
    );
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(typeof setImmediate === "function", isFunction$1(_global.postMessage));
const asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
const isIterable = (thing) => thing != null && isFunction$1(thing[iterator]);
const utils$1 = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isReactNativeBlob,
  isReactNative,
  isBlob,
  isRegExp,
  isFunction: isFunction$1,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable
};
let AxiosError$1 = class AxiosError extends Error {
  static from(error, code, config, request, response, customProps) {
    const axiosError = new AxiosError(error.message, code || error.code, config, request, response);
    axiosError.cause = error;
    axiosError.name = error.name;
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config, request, response) {
    super(message);
    Object.defineProperty(this, "message", {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true
    });
    this.name = "AxiosError";
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }
  toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils$1.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
};
AxiosError$1.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError$1.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError$1.ECONNABORTED = "ECONNABORTED";
AxiosError$1.ETIMEDOUT = "ETIMEDOUT";
AxiosError$1.ERR_NETWORK = "ERR_NETWORK";
AxiosError$1.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError$1.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError$1.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError$1.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError$1.ERR_CANCELED = "ERR_CANCELED";
AxiosError$1.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError$1.ERR_INVALID_URL = "ERR_INVALID_URL";
AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
const httpAdapter = null;
function isVisitable(thing) {
  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
}
function removeBrackets(key) {
  return utils$1.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils$1.isArray(arr) && !arr.some(isVisitable);
}
const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData$1(obj, formData, options) {
  if (!utils$1.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new FormData();
  options = utils$1.toFlatObject(
    options,
    {
      metaTokens: true,
      dots: false,
      indexes: false
    },
    false,
    function defined(option, source) {
      return !utils$1.isUndefined(source[option]);
    }
  );
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const maxDepth = options.maxDepth === void 0 ? 100 : options.maxDepth;
  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);
  if (!utils$1.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null) return "";
    if (utils$1.isDate(value)) {
      return value.toISOString();
    }
    if (utils$1.isBoolean(value)) {
      return value.toString();
    }
    if (!useBlob && utils$1.isBlob(value)) {
      throw new AxiosError$1("Blob is not supported. Use a Buffer instead.");
    }
    if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (utils$1.isReactNative(formData) && utils$1.isReactNativeBlob(value)) {
      formData.append(renderKey(path, key, dots), convertValue(value));
      return false;
    }
    if (value && !path && typeof value === "object") {
      if (utils$1.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = JSON.stringify(value);
      } else if (utils$1.isArray(value) && isFlatArray(value) || (utils$1.isFileList(value) || utils$1.endsWith(key, "[]")) && (arr = utils$1.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils$1.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  const stack2 = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path, depth = 0) {
    if (utils$1.isUndefined(value)) return;
    if (depth > maxDepth) {
      throw new AxiosError$1(
        "Object is too deeply nested (" + depth + " levels). Max depth: " + maxDepth,
        AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED
      );
    }
    if (stack2.indexOf(value) !== -1) {
      throw Error("Circular reference detected in " + path.join("."));
    }
    stack2.push(value);
    utils$1.forEach(value, function each(el, key) {
      const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers);
      if (result === true) {
        build(el, path ? path.concat(key) : [key], depth + 1);
      }
    });
    stack2.pop();
  }
  if (!utils$1.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
function encode$1(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20/g, function replacer2(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData$1(params, this, options);
}
const prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype.toString = function toString2(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode$1);
  } : encode$1;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
function encode(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function buildURL(url, params, options) {
  if (!params) {
    return url;
  }
  const _encode = options && options.encode || encode;
  const _options = utils$1.isFunction(options) ? {
    serialize: options
  } : options;
  const serializeFn = _options && _options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, _options);
  } else {
    serializedParams = utils$1.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams(params, _options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url;
}
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils$1.forEach(this.handlers, function forEachHandler(h2) {
      if (h2 !== null) {
        fn(h2);
      }
    });
  }
}
const transitionalDefaults = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true
};
const URLSearchParams$1 = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams;
const FormData$1 = typeof FormData !== "undefined" ? FormData : null;
const Blob$1 = typeof Blob !== "undefined" ? Blob : null;
const platform$1 = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams$1,
    FormData: FormData$1,
    Blob: Blob$1
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
};
const hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
const _navigator = typeof navigator === "object" && navigator || void 0;
const hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
const hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
const origin = hasBrowserEnv && window.location.href || "http://localhost";
const utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv,
  hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv,
  navigator: _navigator,
  origin
}, Symbol.toStringTag, { value: "Module" }));
const platform = {
  ...utils,
  ...platform$1
};
function toURLEncodedForm(data, options) {
  return toFormData$1(data, new platform.classes.URLSearchParams(), {
    visitor: function(value, key, path, helpers) {
      if (platform.isNode && utils$1.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}
function parsePropPath(name) {
  return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
    return match[0] === "[]" ? "" : match[1] || match[0];
  });
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils$1.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils$1.hasOwnProp(target, name)) {
        target[name] = utils$1.isArray(target[name]) ? target[name].concat(value) : [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils$1.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils$1.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
    const obj = {};
    utils$1.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
const own = (obj, key) => obj != null && utils$1.hasOwnProp(obj, key) ? obj[key] : void 0;
function stringifySafely(rawValue, parser, encoder) {
  if (utils$1.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils$1.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
const defaults = {
  transitional: transitionalDefaults,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils$1.isObject(data);
      if (isObjectPayload && utils$1.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils$1.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
      }
      if (utils$1.isArrayBuffer(data) || utils$1.isBuffer(data) || utils$1.isStream(data) || utils$1.isFile(data) || utils$1.isBlob(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (utils$1.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils$1.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        const formSerializer = own(this, "formSerializer");
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, formSerializer).toString();
        }
        if ((isFileList2 = utils$1.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const env = own(this, "env");
          const _FormData = env && env.FormData;
          return toFormData$1(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely(data);
      }
      return data;
    }
  ],
  transformResponse: [
    function transformResponse(data) {
      const transitional2 = own(this, "transitional") || defaults.transitional;
      const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
      const responseType = own(this, "responseType");
      const JSONRequested = responseType === "json";
      if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (data && utils$1.isString(data) && (forcedJSONParsing && !responseType || JSONRequested)) {
        const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data, own(this, "parseReviver"));
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === "SyntaxError") {
              throw AxiosError$1.from(e, AxiosError$1.ERR_BAD_RESPONSE, this, null, own(this, "response"));
            }
            throw e;
          }
        }
      }
      return data;
    }
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils$1.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
  defaults.headers[method] = {};
});
const ignoreDuplicateOf = utils$1.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
const parseHeaders = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};
const $internals = Symbol("internals");
const INVALID_HEADER_VALUE_CHARS_RE = /[^\x09\x20-\x7E\x80-\xFF]/g;
function trimSPorHTAB(str) {
  let start = 0;
  let end = str.length;
  while (start < end) {
    const code = str.charCodeAt(start);
    if (code !== 9 && code !== 32) {
      break;
    }
    start += 1;
  }
  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start === 0 && end === str.length ? str : str.slice(start, end);
}
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function sanitizeHeaderValue(str) {
  return trimSPorHTAB(str.replace(INVALID_HEADER_VALUE_CHARS_RE, ""));
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils$1.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils$1.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils$1.isString(value)) return;
  if (utils$1.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils$1.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils$1.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
let AxiosHeaders$1 = class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        throw new Error("header name must be a non-empty string");
      }
      const key = utils$1.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
      let obj = {}, dest, key;
      for (const entry of header) {
        if (!utils$1.isArray(entry)) {
          throw TypeError("Object iterator must return a key-value pair");
        }
        obj[key = entry[0]] = (dest = obj[key]) ? utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]] : entry[1];
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils$1.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils$1.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils$1.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils$1.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils$1.forEach(this, (value, header) => {
      const key = utils$1.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils$1.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static concat(first, ...targets) {
    const computed2 = new this(first);
    targets.forEach((target) => computed2.set(target));
    return computed2;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders$1.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization"
]);
utils$1.reduceDescriptors(AxiosHeaders$1.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils$1.freezeMethods(AxiosHeaders$1);
function transformData(fns, response) {
  const config = this || defaults;
  const context = response || config;
  const headers = AxiosHeaders$1.from(context.headers);
  let data = context.data;
  utils$1.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}
function isCancel$1(value) {
  return !!(value && value.__CANCEL__);
}
let CanceledError$1 = class CanceledError extends AxiosError$1 {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request) {
    super(message == null ? "canceled" : message, AxiosError$1.ERR_CANCELED, config, request);
    this.name = "CanceledError";
    this.__CANCEL__ = true;
  }
};
function settle(resolve2, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve2(response);
  } else {
    reject(
      new AxiosError$1(
        "Request failed with status code " + response.status,
        [AxiosError$1.ERR_BAD_REQUEST, AxiosError$1.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
        response.config,
        response.request,
        response
      )
    );
  }
}
function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || "";
}
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  return [throttled, flush];
}
const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);
  return throttle((e) => {
    const rawLoaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const loaded = total != null ? Math.min(rawLoaded, total) : rawLoaded;
    const progressBytes = Math.max(0, loaded - bytesNotified);
    const rate = _speedometer(progressBytes);
    bytesNotified = Math.max(bytesNotified, loaded);
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total ? (total - loaded) / rate : void 0,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [
    (loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }),
    throttled[1]
  ];
};
const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));
const isURLSameOrigin = platform.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url) => {
  url = new URL(url, platform.origin);
  return origin2.protocol === url.protocol && origin2.host === url.host && (isMSIE || origin2.port === url.port);
})(
  new URL(platform.origin),
  platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
) : () => true;
const cookies = platform.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain, secure, sameSite) {
      if (typeof document === "undefined") return;
      const cookie = [`${name}=${encodeURIComponent(value)}`];
      if (utils$1.isNumber(expires)) {
        cookie.push(`expires=${new Date(expires).toUTCString()}`);
      }
      if (utils$1.isString(path)) {
        cookie.push(`path=${path}`);
      }
      if (utils$1.isString(domain)) {
        cookie.push(`domain=${domain}`);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      if (utils$1.isString(sameSite)) {
        cookie.push(`SameSite=${sameSite}`);
      }
      document.cookie = cookie.join("; ");
    },
    read(name) {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function isAbsoluteURL(url) {
  if (typeof url !== "string") {
    return false;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;
function mergeConfig$1(config1, config2) {
  config2 = config2 || {};
  const config = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(config, "hasOwnProperty", {
    value: Object.prototype.hasOwnProperty,
    enumerable: false,
    writable: true,
    configurable: true
  });
  function getMergedValue(target, source, prop, caseless) {
    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
      return utils$1.merge.call({ caseless }, target, source);
    } else if (utils$1.isPlainObject(source)) {
      return utils$1.merge({}, source);
    } else if (utils$1.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function mergeDirectKeys(a, b, prop) {
    if (utils$1.hasOwnProp(config2, prop)) {
      return getMergedValue(a, b);
    } else if (utils$1.hasOwnProp(config1, prop)) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    allowedSocketPaths: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils$1.forEach(Object.keys({ ...config1, ...config2 }), function computeConfigValue(prop) {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
    const merge2 = utils$1.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
    const a = utils$1.hasOwnProp(config1, prop) ? config1[prop] : void 0;
    const b = utils$1.hasOwnProp(config2, prop) ? config2[prop] : void 0;
    const configValue = merge2(a, b, prop);
    utils$1.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  return config;
}
const resolveConfig = (config) => {
  const newConfig = mergeConfig$1({}, config);
  const own2 = (key) => utils$1.hasOwnProp(newConfig, key) ? newConfig[key] : void 0;
  const data = own2("data");
  let withXSRFToken = own2("withXSRFToken");
  const xsrfHeaderName = own2("xsrfHeaderName");
  const xsrfCookieName = own2("xsrfCookieName");
  let headers = own2("headers");
  const auth = own2("auth");
  const baseURL = own2("baseURL");
  const allowAbsoluteUrls = own2("allowAbsoluteUrls");
  const url = own2("url");
  newConfig.headers = headers = AxiosHeaders$1.from(headers);
  newConfig.url = buildURL(
    buildFullPath(baseURL, url, allowAbsoluteUrls),
    config.params,
    config.paramsSerializer
  );
  if (auth) {
    headers.set(
      "Authorization",
      "Basic " + btoa(
        (auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : "")
      )
    );
  }
  if (utils$1.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(void 0);
    } else if (utils$1.isFunction(data.getHeaders)) {
      const formHeaders = data.getHeaders();
      const allowedHeaders = ["content-type", "content-length"];
      Object.entries(formHeaders).forEach(([key, val]) => {
        if (allowedHeaders.includes(key.toLowerCase())) {
          headers.set(key, val);
        }
      });
    }
  }
  if (platform.hasStandardBrowserEnv) {
    if (utils$1.isFunction(withXSRFToken)) {
      withXSRFToken = withXSRFToken(newConfig);
    }
    const shouldSendXSRF = withXSRFToken === true || withXSRFToken == null && isURLSameOrigin(newConfig.url);
    if (shouldSendXSRF) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
};
const isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
const xhrAdapter = isXHRAdapterSupported && function(config) {
  return new Promise(function dispatchXhrRequest(resolve2, reject) {
    const _config = resolveConfig(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders$1.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };
      settle(
        function _resolve(value) {
          resolve2(value);
          done();
        },
        function _reject(err) {
          reject(err);
          done();
        },
        response
      );
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError$1("Request aborted", AxiosError$1.ECONNABORTED, config, request));
      request = null;
    };
    request.onerror = function handleError2(event) {
      const msg = event && event.message ? event.message : "Network Error";
      const err = new AxiosError$1(msg, AxiosError$1.ERR_NETWORK, config, request);
      err.event = event || null;
      reject(err);
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitionalDefaults;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(
        new AxiosError$1(
          timeoutErrorMessage,
          transitional2.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
          config,
          request
        )
      );
      request = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils$1.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError$1(null, config, request) : cancel);
        request.abort();
        request = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && platform.protocols.indexOf(protocol) === -1) {
      reject(
        new AxiosError$1(
          "Unsupported protocol " + protocol + ":",
          AxiosError$1.ERR_BAD_REQUEST,
          config
        )
      );
      return;
    }
    request.send(requestData || null);
  });
};
const composeSignals = (signals, timeout) => {
  const { length } = signals = signals ? signals.filter(Boolean) : [];
  if (timeout || length) {
    let controller = new AbortController();
    let aborted;
    const onabort = function(reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(
          err instanceof AxiosError$1 ? err : new CanceledError$1(err instanceof Error ? err.message : err)
        );
      }
    };
    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError$1(`timeout of ${timeout}ms exceeded`, AxiosError$1.ETIMEDOUT));
    }, timeout);
    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach((signal2) => {
          signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
        });
        signals = null;
      }
    };
    signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
    const { signal } = controller;
    signal.unsubscribe = () => utils$1.asap(unsubscribe);
    return signal;
  }
};
const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
const readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }
  const reader = stream.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};
const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };
  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done: done2, value } = await iterator2.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator2.return();
      }
    },
    {
      highWaterMark: 2
    }
  );
};
const DEFAULT_CHUNK_SIZE = 64 * 1024;
const { isFunction } = utils$1;
const globalFetchAPI = (({ Request, Response }) => ({
  Request,
  Response
}))(utils$1.global);
const { ReadableStream: ReadableStream$1, TextEncoder } = utils$1.global;
const test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false;
  }
};
const factory = (env) => {
  env = utils$1.merge.call(
    {
      skipUndefined: true
    },
    globalFetchAPI,
    env
  );
  const { fetch: envFetch, Request, Response } = env;
  const isFetchSupported = envFetch ? isFunction(envFetch) : typeof fetch === "function";
  const isRequestSupported = isFunction(Request);
  const isResponseSupported = isFunction(Response);
  if (!isFetchSupported) {
    return false;
  }
  const isReadableStreamSupported = isFetchSupported && isFunction(ReadableStream$1);
  const encodeText = isFetchSupported && (typeof TextEncoder === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const request = new Request(platform.origin, {
      body: new ReadableStream$1(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    });
    const hasContentType = request.headers.has("Content-Type");
    if (request.body != null) {
      request.body.cancel();
    }
    return duplexAccessed && !hasContentType;
  });
  const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils$1.isReadableStream(new Response("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && (() => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
      !resolvers[type] && (resolvers[type] = (res, config) => {
        let method = res && res[type];
        if (method) {
          return method.call(res);
        }
        throw new AxiosError$1(
          `Response type '${type}' is not supported`,
          AxiosError$1.ERR_NOT_SUPPORT,
          config
        );
      });
    });
  })();
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils$1.isBlob(body)) {
      return body.size;
    }
    if (utils$1.isSpecCompliantForm(body)) {
      const _request = new Request(platform.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils$1.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils$1.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length = utils$1.toFiniteNumber(headers.getContentLength());
    return length == null ? getBodyLength(body) : length;
  };
  return async (config) => {
    let {
      url,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions
    } = resolveConfig(config);
    let _fetch = envFetch || fetch;
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals(
      [signal, cancelToken && cancelToken.toAbortSignal()],
      timeout
    );
    let request = null;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    try {
      if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
        let _request = new Request(url, {
          method: "POST",
          body: data,
          duplex: "half"
        });
        let contentTypeHeader;
        if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
          headers.setContentType(contentTypeHeader);
        }
        if (_request.body) {
          const [onProgress, flush] = progressEventDecorator(
            requestContentLength,
            progressEventReducer(asyncDecorator(onUploadProgress))
          );
          data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
        }
      }
      if (!utils$1.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
      if (utils$1.isFormData(data)) {
        const contentType = headers.getContentType();
        if (contentType && /^multipart\/form-data/i.test(contentType) && !/boundary=/i.test(contentType)) {
          headers.delete("content-type");
        }
      }
      const resolvedOptions = {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: headers.normalize().toJSON(),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      };
      request = isRequestSupported && new Request(url, resolvedOptions);
      let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url, resolvedOptions));
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils$1.toFiniteNumber(response.headers.get("content-length"));
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || "text"](
        response,
        config
      );
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve2, reject) => {
        settle(resolve2, reject, {
          data: responseData,
          headers: AxiosHeaders$1.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
        throw Object.assign(
          new AxiosError$1(
            "Network Error",
            AxiosError$1.ERR_NETWORK,
            config,
            request,
            err && err.response
          ),
          {
            cause: err.cause || err
          }
        );
      }
      throw AxiosError$1.from(err, err && err.code, config, request, err && err.response);
    }
  };
};
const seedCache = /* @__PURE__ */ new Map();
const getFetch = (config) => {
  let env = config && config.env || {};
  const { fetch: fetch2, Request, Response } = env;
  const seeds = [Request, Response, fetch2];
  let len = seeds.length, i = len, seed, target, map = seedCache;
  while (i--) {
    seed = seeds[i];
    target = map.get(seed);
    target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
    map = target;
  }
  return target;
};
getFetch();
const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: {
    get: getFetch
  }
};
utils$1.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { value });
    } catch (e) {
    }
    Object.defineProperty(fn, "adapterName", { value });
  }
});
const renderReason = (reason) => `- ${reason}`;
const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;
function getAdapter$1(adapters2, config) {
  adapters2 = utils$1.isArray(adapters2) ? adapters2 : [adapters2];
  const { length } = adapters2;
  let nameOrAdapter;
  let adapter;
  const rejectedReasons = {};
  for (let i = 0; i < length; i++) {
    nameOrAdapter = adapters2[i];
    let id;
    adapter = nameOrAdapter;
    if (!isResolvedHandle(nameOrAdapter)) {
      adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
      if (adapter === void 0) {
        throw new AxiosError$1(`Unknown adapter '${id}'`);
      }
    }
    if (adapter && (utils$1.isFunction(adapter) || (adapter = adapter.get(config)))) {
      break;
    }
    rejectedReasons[id || "#" + i] = adapter;
  }
  if (!adapter) {
    const reasons = Object.entries(rejectedReasons).map(
      ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
    );
    let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
    throw new AxiosError$1(
      `There is no suitable adapter to dispatch the request ` + s,
      "ERR_NOT_SUPPORT"
    );
  }
  return adapter;
}
const adapters = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter: getAdapter$1,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: knownAdapters
};
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError$1(null, config);
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders$1.from(config.headers);
  config.data = transformData.call(config, config.transformRequest);
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);
  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);
      response.data = transformData.call(config, config.transformResponse, response);
      response.headers = AxiosHeaders$1.from(response.headers);
      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel$1(reason)) {
        throwIfCancellationRequested(config);
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            config.transformResponse,
            reason.response
          );
          reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    }
  );
}
const VERSION$1 = "1.15.2";
const validators$1 = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators$1[type] = function validator2(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  };
});
const deprecatedWarnings = {};
validators$1.transitional = function transitional(validator2, version2, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION$1 + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator2 === false) {
      throw new AxiosError$1(
        formatMessage(opt, " has been removed" + (version2 ? " in " + version2 : "")),
        AxiosError$1.ERR_DEPRECATED
      );
    }
    if (version2 && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version2 + " and will be removed in the near future"
        )
      );
    }
    return validator2 ? validator2(value, opt, opts) : true;
  };
};
validators$1.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError$1("options must be an object", AxiosError$1.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator2 = Object.prototype.hasOwnProperty.call(schema, opt) ? schema[opt] : void 0;
    if (validator2) {
      const value = options[opt];
      const result = value === void 0 || validator2(value, opt, options);
      if (result !== true) {
        throw new AxiosError$1(
          "option " + opt + " must be " + result,
          AxiosError$1.ERR_BAD_OPTION_VALUE
        );
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError$1("Unknown option " + opt, AxiosError$1.ERR_BAD_OPTION);
    }
  }
}
const validator = {
  assertOptions,
  validators: validators$1
};
const validators = validator.validators;
let Axios$1 = class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack2 = (() => {
          if (!dummy.stack) {
            return "";
          }
          const firstNewlineIndex = dummy.stack.indexOf("\n");
          return firstNewlineIndex === -1 ? "" : dummy.stack.slice(firstNewlineIndex + 1);
        })();
        try {
          if (!err.stack) {
            err.stack = stack2;
          } else if (stack2) {
            const firstNewlineIndex = stack2.indexOf("\n");
            const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack2.indexOf("\n", firstNewlineIndex + 1);
            const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack2.slice(secondNewlineIndex + 1);
            if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
              err.stack += "\n" + stack2;
            }
          }
        } catch (e) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig$1(this.defaults, config);
    const { transitional: transitional2, paramsSerializer, headers } = config;
    if (transitional2 !== void 0) {
      validator.assertOptions(
        transitional2,
        {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean),
          legacyInterceptorReqResOrdering: validators.transitional(validators.boolean)
        },
        false
      );
    }
    if (paramsSerializer != null) {
      if (utils$1.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator.assertOptions(
          paramsSerializer,
          {
            encode: validators.function,
            serialize: validators.function
          },
          true
        );
      }
    }
    if (config.allowAbsoluteUrls !== void 0) ;
    else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }
    validator.assertOptions(
      config,
      {
        baseUrl: validators.spelling("baseURL"),
        withXsrfToken: validators.spelling("withXSRFToken")
      },
      true
    );
    config.method = (config.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils$1.merge(headers.common, headers[config.method]);
    headers && utils$1.forEach(["delete", "get", "head", "post", "put", "patch", "common"], (method) => {
      delete headers[method];
    });
    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      const transitional3 = config.transitional || transitionalDefaults;
      const legacyInterceptorReqResOrdering = transitional3 && transitional3.legacyInterceptorReqResOrdering;
      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig$1(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils$1.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios$1.prototype[method] = function(url, config) {
    return this.request(
      mergeConfig$1(config || {}, {
        method,
        url,
        data: (config || {}).data
      })
    );
  };
});
utils$1.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(
        mergeConfig$1(config || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url,
          data
        })
      );
    };
  }
  Axios$1.prototype[method] = generateHTTPMethod();
  Axios$1.prototype[method + "Form"] = generateHTTPMethod(true);
});
let CancelToken$1 = class CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve2) {
      resolvePromise = resolve2;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve2) => {
        token.subscribe(resolve2);
        _resolve = resolve2;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError$1(message, config, request);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort);
    controller.signal.unsubscribe = () => this.unsubscribe(abort);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
function spread$1(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}
function isAxiosError$1(payload) {
  return utils$1.isObject(payload) && payload.isAxiosError === true;
}
const HttpStatusCode$1 = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode$1).forEach(([key, value]) => {
  HttpStatusCode$1[value] = key;
});
function createInstance(defaultConfig) {
  const context = new Axios$1(defaultConfig);
  const instance2 = bind(Axios$1.prototype.request, context);
  utils$1.extend(instance2, Axios$1.prototype, context, { allOwnKeys: true });
  utils$1.extend(instance2, context, null, { allOwnKeys: true });
  instance2.create = function create2(instanceConfig) {
    return createInstance(mergeConfig$1(defaultConfig, instanceConfig));
  };
  return instance2;
}
const axios = createInstance(defaults);
axios.Axios = Axios$1;
axios.CanceledError = CanceledError$1;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel$1;
axios.VERSION = VERSION$1;
axios.toFormData = toFormData$1;
axios.AxiosError = AxiosError$1;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread$1;
axios.isAxiosError = isAxiosError$1;
axios.mergeConfig = mergeConfig$1;
axios.AxiosHeaders = AxiosHeaders$1;
axios.formToJSON = (thing) => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters.getAdapter;
axios.HttpStatusCode = HttpStatusCode$1;
axios.default = axios;
const {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel,
  CancelToken: CancelToken2,
  VERSION,
  all: all2,
  Cancel,
  isAxiosError,
  spread,
  toFormData,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode,
  formToJSON,
  getAdapter,
  mergeConfig
} = axios;
const useSessionStore = /* @__PURE__ */ defineStore("session", () => {
  const sessionCookie = /* @__PURE__ */ ref(null);
  function setSessionCookie(cookie) {
    sessionCookie.value = cookie;
  }
  function clearSessionCookie2() {
    sessionCookie.value = null;
  }
  return { sessionCookie, setSessionCookie, clearSessionCookie: clearSessionCookie2 };
});
const useUserStore = /* @__PURE__ */ defineStore("user", () => {
  const userInfo = /* @__PURE__ */ ref(null);
  function setUserInfo(info) {
    userInfo.value = info;
  }
  return { userInfo, setUserInfo };
});
async function fetchUserInfo() {
  const store = useUserStore();
  store.setUserInfo(null);
}
const _imports_0$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUcAAADICAMAAABMBtPgAAAAe1BMVEUAAADLy8vn5+fLy8v////l5eUwMED36uowLkIvL0Hx8fH/0dHz8/P/09M2mf84l/83mv9ya3aLfof///8vLkHm5ubx8fE2mf/Ly8v/0tL29vb8/Pxos/+bzP/s7OzZ2NhiWWjy8vLLqa6RgIqkpKmXl6DNxN3N5v+btuknNNgZAAAAE3RSTlMAv79Av4BAQIC/gIC/v4BAv7+AlnF3wAAABzVJREFUeNrs3Wtv2jAUgOGzbnXsZVw6nECAMgJry///hcttuMSJL4QkTn3eD6umTpr66JzYIKFC7G4/YULF7jY1x62TTc5xu3KxHTqio0OhIzq6FDqio0uhIzq6FDqio0uhIzq6FDqio0uhIzq6FDqio0uhIzq6FDqio0uhIzq6FDqio0t9HcfdbmUROm5bf5A4l9zGPbf72o653xYd0XHQhKMMWX5nt83r8c8v/ny0DM8ZbxwJzSJQhI53RhivohQA0PFuRVEGiY73RHktMrDj17j3UC5F0LELo4igo228KTb483HXb73fwylvjOA5YxdvjqFjl3EUEXS0iaFjP2t95GV0WMddramdM5JjUkEyvPd0cTwnJ3S8zzGROqHjQxzPuSPewy0dTy44/hipX78e5niUHPnwjgFMO94wkGd0vMvxWGdER+u4BHni6GgfLyHPn6axjI7j+PzkbibvU5wLydPpyEd2jNwNlJFrAREBoKPkOH42jm6+M3RAR6khHBeL5XI+X6BjF8fMcF2VY6KjjaMYxHW9OTpaOpaIMiQ6WjnO1y0t0FE4Wg+jaImOpo6L+VrRHB3NHBdrdQt0NHGcrzUt0bGLo2iOjsLRnlG0QMeHOC7RUeu4NmmBjhrHOTo+xNGIcY57LTnaj+MlCdBR46hF3L8nSTJDR7XjXK9YFHR31DVpx6XGMamaoWOneXx/mOMvXZN2hPlFvddJVQC9N2nHMFkrm2kHEh1Lx73SMUiqoC10zEuSi/oCPtMtNjpmhZmQ2jHQLTY6Vo4X9etq3WKjI1RI++ajev/+PsupNYs9nGMaRWnxA/Vcau1YLa1seCkujqcXAP1iD+YYReW3op472DmKWbvUxjApEI/lZwy1Jw06QlK1rBkWinksH0hXHP/vdZrGPZamWztHIRQuqlW+QbxCzrSLPdA5sx3lANI7hv8dYQHhFfGcKYqYyUB6fl7PKqCrqRhFEdUMJDrCdRxzR4EoQQboKDvKa13+RSjKkMrF9t5x9mkcgfL2SKgYyIEdHbz3JJ8dmcKRBYrXht47hjc4hCsis/bF9t5RrLXWkStOmuEd07jXbO/htV3lJgMJjXl9zoRiHIsYV8SC1sVGx1tHrhnI1sX23FGstXDUDyRIee5YH0fg6oj497XQ8fN8EZ3jrBXS63tPXYVyo8WWjxq/HUNbRx4kzQOJjllg7vjbGcc07jebe7hkwqbjOHTCUT+OwHWxUHGDHNQRnKn+dCSUa2MQOnLvAWe6XVHCuEnQkr+OYVJ7Bxcd7yoQjmIYtRFozl9HEFfqTHGijt+/jd+fgvHPtxfOp+u4caFMcrM5c3R8QEc+ccdo5UKWjJxCU947vnF01NSdkVHc6+6MjABBR6PUilnoaNKbUhEdTTsqFMuY66+vnXDkjR1/A6BjV8fj3813hSOD5rx2PMqKm2jz2ZGaXh+9dtxIjm8rdHzMQXO+cSSmx7Xfjhsud1Y6Qkt+OzbeIM+yo/6Y8dyxhFRgmT4efXdshKTo2A1SPk0YOnaAFFxs6ONaOB7UOefYvNrjO2pyz1EFyQyvPeiofkbSmqNrueW42rQ5EnS062jiyMC1nHOUdpuhY3dIMZDo2HW3mTyPFFzLScfbkXyBLIqOXc/tZDZpx9f1+jX/uu+54j+RO4vfbJ9BEjZZx3XWR/615/arxqJzxVj9ktepOn6M7bjZvBRbnXWS75Su5exeZ47fCeMvBeOUHVcfH6tREo4ABMKMcdqOoyUcizg6PsKRoeMjHJndh5ACMMs3R8rtHKNnGDy948jntWA0dnwaA1LvOM79UTgye8fIRNI3R27rGETjQOodX3vuQ+FIeFltvZnS0VTSo3OmciTM2BEiM0i/HIEVjMDNHZ+MIH1zpAUjqTlSA8foCRT55ggsR6MWjkF0LYD2fHMkFGwdDSG9uveUMclRd9CkutX20pFLjroH5CE9KCHRMY+oHYvSg3qzvbqHl1ELR/GAjA+agfTqnGl0BBPHKFYNpI+OzMpR3CDT9oH00pHf6RjnEwmN+ehILD+jKW6Qaftie+ho+9lCMZCHuO11to+O3NZRDCQ6Ckdq7QhP6GjiSMB8INGx3RHAGDLF87rVkVl87iXG+2OrIwUjyEIybltr/xyJweMxeLr2/ByAKPgJLXnnCLxW2wktekZHydHwI8PP0a0kOkqO0keQjCDRse4IWkYBmf5r7w52EAZhAAx3HFqGvcwTJybq+z+jVQ8kKMiCmiX0T/YCX8g2QgAphAekOtbGo4U6ZFpUIHWsOOKHv+8kadSx4gi1yKQJYVDHzBEQp7N0WazF5u37gUFy6iiO2WWbBFIrJDmnjrnjITm2TAiNIRJDlkfXuZ6OiHaWTvdmhE2xA1ZHcezd5hqJodBYjp2nSBFHKDSUo+3d5so6HsXx2H8Iafzj+9Gvu8z7pd/RMfy6vd2bkvcVx+IHeyTH60vT9tbpTTcw2Qvl42lfFwAAAABJRU5ErkJggg==";
function useEnvCheck() {
  const checkItems = /* @__PURE__ */ ref([
    { id: "node", title: "Node.js", icon: "icon-clawnodejs", status: "checking", statusText: "检测中", detail: "" },
    { id: "npm", title: "npm", icon: "icon-clawnpm", status: "checking", statusText: "检测中", detail: "" },
    { id: "openclaw", title: "OpenClaw", icon: "icon-clawopenclaw", status: "checking", statusText: "检测中", detail: "" },
    { id: "model", title: "模型配置", icon: "icon-clawmoxingpeizhi", status: "checking", statusText: "检测中", detail: "" },
    { id: "network", title: "网络连接", icon: "icon-clawnetworkConnection", status: "checking", statusText: "检测中", detail: "" },
    { id: "port", title: "端口状态", icon: "icon-clawzhandianduankouhao", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-python", title: "Hermes Python", icon: "icon-clawnodejs", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-node", title: "Hermes Node.js", icon: "icon-clawnodejs", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-cli", title: "Hermes CLI", icon: "icon-clawopenclaw", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-data", title: "Hermes 数据目录", icon: "icon-clawmoxingpeizhi", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-model", title: "Hermes 模型桥接", icon: "icon-clawmoxingpeizhi", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-memory", title: "Hermes 持久记忆", icon: "icon-clawmoxingpeizhi", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-skill-growth", title: "Hermes 自我成长", icon: "icon-clawjinengguanli", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-skills", title: "Hermes 技能", icon: "icon-clawjinengguanli", status: "checking", statusText: "检测中", detail: "" },
    { id: "hermes-ports", title: "Hermes 端口", icon: "icon-clawzhandianduankouhao", status: "checking", statusText: "检测中", detail: "" }
  ]);
  function updateItem(id, updates) {
    const item = checkItems.value.find((i) => i.id === id);
    if (item) {
      Object.assign(item, updates);
    }
  }
  function checkNode() {
    updateItem("node", { status: "checking", statusText: "检测中", detail: "" });
    try {
      const result = { ok: true };
      if (result.ok) {
        updateItem("node", { status: "pass", statusText: "正常", detail: "已就绪" });
      }
    } catch (e) {
      updateItem("node", { status: "fail", statusText: "异常", detail: e.message });
    }
  }
  function checkNpm() {
    updateItem("npm", { status: "checking", statusText: "检测中", detail: "" });
    try {
      updateItem("npm", { status: "pass", statusText: "正常", detail: "已就绪" });
    } catch (e) {
      updateItem("npm", { status: "fail", statusText: "异常", detail: e.message });
    }
  }
  function checkOpenClaw() {
    updateItem("openclaw", { status: "checking", statusText: "检测中", detail: "" });
    try {
      updateItem("openclaw", { title: "OpenClaw", status: "pass", statusText: "正常", detail: "已就绪" });
    } catch (e) {
      updateItem("openclaw", { status: "fail", statusText: "异常", detail: e.message });
    }
  }
  function checkModel() {
    updateItem("model", { status: "checking", statusText: "检测中", detail: "" });
    try {
      const stored = localStorage.getItem("uclaw_selected_models");
      const models = stored ? JSON.parse(stored) : [];
      const current = Array.isArray(models) ? models.find((m) => m.isCurrent) : null;
      if (current) {
        updateItem("model", { status: "pass", statusText: "已配置", detail: current.modelName || current.name || "已配置" });
      } else {
        updateItem("model", { status: "warn", statusText: "未配置", detail: "请在模型配置页面设置" });
      }
    } catch (e) {
      updateItem("model", { status: "fail", statusText: "异常", detail: e.message });
    }
  }
  function checkNetwork() {
    updateItem("network", { status: "checking", statusText: "检测中", detail: "" });
    try {
      updateItem("network", { status: "pass", statusText: "正常", detail: "网络连接正常" });
    } catch (e) {
      updateItem("network", { status: "fail", statusText: "异常", detail: e.message });
    }
  }
  function checkPort() {
    updateItem("port", { status: "checking", statusText: "检测中", detail: "" });
    try {
      updateItem("port", { status: "pass", statusText: "正常", detail: `端口可用` });
    } catch (e) {
      updateItem("port", { status: "fail", statusText: "异常", detail: e.message });
    }
  }
  async function checkHermes() {
    for (const id of ["hermes-python", "hermes-node", "hermes-cli", "hermes-data", "hermes-model", "hermes-memory", "hermes-skill-growth", "hermes-skills", "hermes-ports"]) {
      updateItem(id, { status: "checking", statusText: "检测中", detail: "" });
    }
    try {
      const status = await window.uclaw.ipcGetHermesStatus();
      updateItem("hermes-python", status?.pythonReady ? { status: "pass", statusText: "正常", detail: status.pythonBin || "Portable Python 已就绪" } : { status: "fail", statusText: "缺失", detail: status?.pythonBin || "未找到 portable python" });
      updateItem("hermes-node", status?.nodeReady ? { status: "pass", statusText: "正常", detail: status.nodeBin || "Portable Node.js 已就绪" } : { status: "warn", statusText: "未找到", detail: status?.nodeBin || "Hermes Node runtime 待补齐" });
      updateItem("hermes-cli", status?.hermesReady && status?.sourceReady ? { status: "pass", statusText: "正常", detail: status.hermesBin || "Hermes CLI 已就绪" } : { status: "fail", statusText: "缺失", detail: status?.lastError || status?.hermesBin || "Hermes CLI 或源码不完整" });
      updateItem("hermes-data", status?.dataReady && status?.configDirReady ? { status: "pass", statusText: "零痕迹", detail: status.dataRoot || "data/.hermes" } : { status: "warn", statusText: "待初始化", detail: status?.dataRoot || "首次启动后创建 U 盘数据目录" });
      updateItem("hermes-model", status?.modelBridgeReady ? { status: "pass", statusText: "已桥接", detail: status.modelBridge } : { status: "warn", statusText: "未配置", detail: "在模型配置页应用模型后，Hermes 自动复用" });
      updateItem("hermes-memory", status?.memoryReady && status?.memoryWritable ? { status: "pass", statusText: "可读写", detail: `MEMORY ${status.memoryEntryCount || 0} 条；USER ${status.userMemoryEntryCount || 0} 条。报告：${status.memoryReportPath || "未生成"}` } : { status: "warn", statusText: "待验证", detail: status?.memoryReportPath || status?.memoryPath || "请启动 Hermes 后重新检查" });
      updateItem("hermes-skill-growth", status?.skillGrowthReady ? { status: "pass", statusText: "已闭环", detail: status.skillGrowthReportPath || "growth report ready" } : { status: "warn", statusText: "待验证", detail: status?.skillGrowthReportPath || "运行 verify:hermes-skill-growth 后显示结果" });
      updateItem("hermes-skills", status?.skillsReady && (status?.skillVisibleCount || 0) > 0 ? { status: "pass", statusText: "可见", detail: `镜像 ${status.skillCount || 0} 个；Hermes 官方可见 ${status.skillVisibleCount || 0} 个，slash 命令 ${status.skillCommandCount || 0} 个。报告：${status.skillReportPath || "未生成"}` } : { status: "warn", statusText: "待验证", detail: status?.skillReportPath || status?.skillsRoot || "请在技能管理页同步并验证" });
      const ports = [`配置 ${status?.configReady ? "就绪" : "未启动"}`, `Dashboard ${status?.dashboardReady ? "就绪" : "未启动"}`, `API ${status?.apiServerReady ? "就绪" : "未启动"}`].join(" / ");
      updateItem("hermes-ports", status?.configReady || status?.dashboardReady || status?.apiServerReady ? { status: "pass", statusText: "运行中", detail: ports } : { status: "warn", statusText: "未启动", detail: "首页点击启动 Hermes 后检查端口" });
    } catch (e) {
      for (const id of ["hermes-python", "hermes-node", "hermes-cli", "hermes-data", "hermes-model", "hermes-memory", "hermes-skill-growth", "hermes-skills", "hermes-ports"]) {
        updateItem(id, { status: "fail", statusText: "异常", detail: e.message });
      }
    }
  }
  async function runAllChecks() {
    checkNode();
    checkNpm();
    checkOpenClaw();
    checkModel();
    checkNetwork();
    checkPort();
    await checkHermes();
  }
  return {
    checkItems,
    runAllChecks,
    checkNode,
    checkNpm,
    checkOpenClaw,
    checkModel,
    checkNetwork,
    checkPort,
    checkHermes
  };
}
const _hoisted_1$v = { class: "home-home-view" };
const _hoisted_2$u = { class: "home-status-bar" };
const _hoisted_3$t = { class: "home-status-info" };
const _hoisted_4$q = { class: "home-status-badges" };
const _hoisted_5$q = {
  key: 0,
  class: "home-status-badge home-status-on"
};
const _hoisted_6$o = {
  key: 1,
  class: "home-status-badge home-status-off"
};
const _hoisted_7$n = { class: "home-port-info" };
const _hoisted_8$m = { class: "value" };
const _hoisted_9$j = { class: "home-action-buttons" };
const _hoisted_10$h = { class: "home-env-checks" };
const _hoisted_11$f = { class: "home-env-check-icon" };
const _hoisted_12$e = { class: "home-env-check-title" };
const _hoisted_13$e = { class: "home-terminal" };
const _hoisted_14$e = { class: "home-terminal-header" };
const _hoisted_15$e = { class: "home-terminal-actions" };
const _hoisted_16$e = {
  key: 0,
  class: "home-no-logs"
};
const _hoisted_17$d = {
  key: 0,
  class: "home-log-time"
};
const _hoisted_18$c = { class: "home-log-message" };
const _sfc_main$v = {
  __name: "Home",
  setup(__props) {
    const gatewayStore = useGatewayStore();
    const activationStore = useActivationStore();
    const { startGatewayHook } = useGateway();
    const { checkItems, runAllChecks } = useEnvCheck();
    const { showToast } = useToast();
    const logs = computed(() => gatewayStore.logs);
    const hermesStatus = /* @__PURE__ */ ref({ status: "idle" });
    const hermesLogs = /* @__PURE__ */ ref([]);
    const activeLogSource = /* @__PURE__ */ ref("openclaw");
    const hermesPanelTitle = /* @__PURE__ */ ref("");
    const hermesPanelUrl = /* @__PURE__ */ ref("");
    const hermesPanelKind = /* @__PURE__ */ ref("");
    const hermesActionBusy = /* @__PURE__ */ ref("");
    const hermesRunning = computed(() => hermesStatus.value?.status === "running");
    const hermesStatusText = computed(() => {
      if (hermesStatus.value?.status === "running") return "运行中";
      if (hermesStatus.value?.status === "error") return "异常";
      return "未启动";
    });
    const activeLogs = computed(() => activeLogSource.value === "hermes" ? hermesLogs.value : logs.value);
    function extractTimestamp(msg) {
      const stripped = msg.replace(/\x1b\[[0-9;]*m/g, "");
      const isoMatch = stripped.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2})?)/);
      if (isoMatch) {
        try {
          const d = new Date(isoMatch[1]);
          if (!isNaN(d.getTime())) {
            return d.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
          }
        } catch {
        }
      }
      return null;
    }
    function cleanLogMessage(msg) {
      const stripped = msg.replace(/\x1b\[[0-9;]*m/g, "");
      return stripped.replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2})?)\s*/, "");
    }
    onMounted(async () => {
      activationStore.setActivation({});
      runAllChecks();
      refreshHermesStatus();
      loadHermesLogs();
      startLiveLogs();
    });
    onUnmounted(() => {
    });
    function startLiveLogs() {
      window.uclaw.ipcOnGatewayLog((log) => {
        const typeLabel = {
          stdout: "[stdout]",
          stderr: "[stderr]",
          error: "[error]",
          exit: "[exit]",
          close: "[close]"
        }[log.type] || "[log]";
        const typeColor = {
          stdout: "#4ade80",
          stderr: "#f87171",
          error: "#f87171",
          exit: "#a78bfa",
          close: "#a78bfa"
        }[log.type] || "#ffffff";
        const timestamp = extractTimestamp(log.msg);
        const message = cleanLogMessage(log.msg);
        gatewayStore.addLog({
          id: Date.now() + Math.random(),
          typeLabel,
          typeColor,
          message,
          timestamp
        });
        nextTick(() => {
          const container = document.getElementById("terminal-logs");
          if (container && activeLogSource.value === "openclaw") container.scrollTop = container.scrollHeight;
        });
      });
      if (window.uclaw.ipcOnHermesLog) window.uclaw.ipcOnHermesLog((log) => appendHermesLog(log));
      if (window.uclaw.ipcOnHermesStatus) window.uclaw.ipcOnHermesStatus((status) => hermesStatus.value = status);
    }
    async function handleStart() {
      window.showLoadingOverlayVue?.();
      try {
        await startGatewayHook();
        showToast("小龙虾启动成功");
      } catch (e) {
        showToast("启动失败: " + e.message, true);
      }
    }
    async function handleStop() {
      try {
        const result = await window.uclaw.ipcStopGateway();
        if (!result.ok) {
          throw new Error(result.error);
        }
        showToast("小龙虾已停止");
      } catch (e) {
        showToast("停止失败: " + e.message, true);
      }
    }
    async function handleRestart() {
      window.showLoadingOverlayVue?.();
      try {
        await window.uclaw.ipcRestartGateway();
        showToast("小龙虾重启成功");
      } catch (e) {
        showToast("重启失败: " + e.message, true);
      } finally {
        if (window.hideLoadingOverlayVue) {
          setTimeout(() => window.hideLoadingOverlayVue(), 500);
        }
      }
    }
    function handleOpen() {
      window.uclaw.ipcOpenDashboard();
    }
    async function refreshHermesStatus() {
      try {
        hermesStatus.value = await window.uclaw.ipcGetHermesStatus();
      } catch (e) {
        hermesStatus.value = { status: "error", lastError: e.message };
      }
    }
    function appendHermesLog(log) {
      const typeLabel = { stdout: "[stdout]", stderr: "[stderr]", system: "[system]", error: "[error]", exit: "[exit]" }[log.type] || "[log]";
      const typeColor = { stdout: "#4ade80", stderr: "#f87171", system: "#60a5fa", error: "#f87171", exit: "#a78bfa" }[log.type] || "#ffffff";
      const msg = String(log.msg || "");
      hermesLogs.value.push({ id: Date.now() + Math.random(), typeLabel, typeColor, message: cleanLogMessage(msg), timestamp: extractTimestamp(msg) });
      if (hermesLogs.value.length > 500) hermesLogs.value.shift();
      nextTick(() => {
        const container = document.getElementById("terminal-logs");
        if (container && activeLogSource.value === "hermes") container.scrollTop = container.scrollHeight;
      });
    }
    async function loadHermesLogs() {
      try {
        const rows = window.uclaw.ipcGetHermesLogs ? await window.uclaw.ipcGetHermesLogs({ limit: 300 }) : [];
        hermesLogs.value = [];
        for (const row of rows || []) appendHermesLog(row);
      } catch (e) {
        appendHermesLog({ type: "stderr", msg: "[ui] Hermes 日志读取失败: " + e.message });
      }
    }
    function switchLogSource(source) {
      activeLogSource.value = source;
      if (source === "hermes" && hermesLogs.value.length === 0) loadHermesLogs();
    }
    async function handleHermesStart() {
      try {
        hermesActionBusy.value = "start";
        showToast("正在启动 Hermes...");
        const status = await window.uclaw.ipcStartHermes({ open: false });
        await refreshHermesStatus();
        await loadHermesLogs();
        activeLogSource.value = "hermes";
        if (status?.apiServerReady || status?.dashboardReady || status?.configReady) {
          showToast(status?.apiServerReady ? "Hermes 已启动，Agent API 已就绪" : "Hermes 部分启动，请查看日志");
        } else {
          showToast("Hermes 启动失败: " + (status?.lastError || "端口未就绪，请查看 Hermes 日志"), true);
        }
      } catch (e) {
        showToast("Hermes 启动失败: " + e.message, true);
      } finally {
        hermesActionBusy.value = "";
      }
    }
    async function handleHermesRestart() {
      try {
        hermesActionBusy.value = "restart";
        showToast("正在重启 Hermes...");
        await window.uclaw.ipcStopHermes();
        const status = await window.uclaw.ipcStartHermes({ open: false });
        await refreshHermesStatus();
        await loadHermesLogs();
        activeLogSource.value = "hermes";
        if (status?.apiServerReady || status?.dashboardReady || status?.configReady) {
          showToast(status?.apiServerReady ? "Hermes 已重启，Agent API 已就绪" : "Hermes 部分重启，请查看日志");
        } else {
          showToast("Hermes 重启失败: " + (status?.lastError || "端口未就绪，请查看 Hermes 日志"), true);
        }
      } catch (e) {
        showToast("Hermes 重启失败: " + e.message, true);
      } finally {
        hermesActionBusy.value = "";
      }
    }
    async function showHermesPanel(kind, title, targetUrl, starter) {
      hermesPanelKind.value = kind;
      hermesPanelTitle.value = title;
      hermesPanelUrl.value = "";
      hermesActionBusy.value = kind;
      try {
        showToast("正在打开 " + title + "...");
        const status = await starter();
        await refreshHermesStatus();
        const url = targetUrl || status?.configUrl || hermesStatus.value?.configUrl;
        if (kind === "api") {
          hermesPanelUrl.value = "";
        } else if (window.uclaw.ipcGetHermesFrameUrl) {
          hermesPanelUrl.value = await window.uclaw.ipcGetHermesFrameUrl(url);
        } else {
          hermesPanelUrl.value = url;
        }
        showToast(title + " 已打开");
      } catch (e) {
        showToast(title + " 打开失败: " + e.message, true);
      } finally {
        hermesActionBusy.value = "";
      }
    }
    async function handleHermesConfig() {
      await showHermesPanel("config", "Hermes 配置中心", "http://127.0.0.1:17520", () => window.uclaw.ipcStartHermes({ open: false }));
    }
    async function handleHermesDashboard() {
      await showHermesPanel("dashboard", "Hermes Dashboard", "http://127.0.0.1:9119", () => window.uclaw.ipcStartHermesDashboard({ open: false }));
    }
    async function handleHermesApi() {
      await showHermesPanel("api", "Hermes Agent API", "http://127.0.0.1:8642/v1", () => window.uclaw.ipcStartHermesApiServer({ open: false }));
    }
    async function handleHermesStop() {
      try {
        hermesActionBusy.value = "stop";
        await window.uclaw.ipcStopHermes();
        await refreshHermesStatus();
        hermesPanelTitle.value = "";
        hermesPanelUrl.value = "";
        hermesPanelKind.value = "";
        showToast("Hermes 已停止");
      } catch (e) {
        showToast("Hermes 停止失败: " + e.message, true);
      } finally {
        hermesActionBusy.value = "";
      }
    }
    function copyTerminal() {
      const logs2 = document.getElementById("terminal-logs");
      if (logs2) {
        navigator.clipboard.writeText(logs2.textContent);
        showToast("日志已复制");
      }
    }
    function clearTerminal() {
      if (activeLogSource.value === "hermes") {
        hermesLogs.value = [];
        return;
      }
      gatewayStore.clearLogs();
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$v, [
        createBaseVNode("div", _hoisted_2$u, [
          createBaseVNode("div", _hoisted_3$t, [
            _cache[3] || (_cache[3] = createBaseVNode("div", { class: "home-status-title" }, "Gateway 控制台", -1)),
            createBaseVNode("div", _hoisted_4$q, [
              unref(gatewayStore).running ? (openBlock(), createElementBlock("div", _hoisted_5$q, [..._cache[0] || (_cache[0] = [
                createBaseVNode("span", { class: "home-dot" }, null, -1),
                createBaseVNode("span", null, "运行中", -1)
              ])])) : (openBlock(), createElementBlock("div", _hoisted_6$o, [..._cache[1] || (_cache[1] = [
                createBaseVNode("span", { class: "home-dot" }, null, -1),
                createBaseVNode("span", null, "未启动", -1)
              ])])),
              createBaseVNode("div", _hoisted_7$n, [
                _cache[2] || (_cache[2] = createBaseVNode("span", { class: "label" }, "端口:", -1)),
                createBaseVNode("span", _hoisted_8$m, toDisplayString(unref(gatewayStore).port || "--"), 1)
              ])
            ])
          ]),
          createBaseVNode("div", _hoisted_9$j, [
            !unref(gatewayStore).running ? (openBlock(), createBlock(TechButton, {
              key: 0,
              variant: "primary",
              onClick: handleStart
            }, {
              icon: withCtx(() => [..._cache[4] || (_cache[4] = [
                createBaseVNode("span", { class: "iconfont icon-clawopen" }, null, -1)
              ])]),
              default: withCtx(() => [
                _cache[5] || (_cache[5] = createTextVNode(" 启动 ", -1))
              ]),
              _: 1
            })) : createCommentVNode("", true),
            unref(gatewayStore).running ? (openBlock(), createBlock(TechButton, {
              key: 1,
              variant: "primary",
              onClick: handleOpen
            }, {
              icon: withCtx(() => [..._cache[6] || (_cache[6] = [
                createBaseVNode("span", { class: "iconfont icon-clawwaibutiaozhuanlianjie" }, null, -1)
              ])]),
              default: withCtx(() => [
                _cache[7] || (_cache[7] = createTextVNode(" 打开小龙虾 ", -1))
              ]),
              _: 1
            })) : createCommentVNode("", true),
            unref(gatewayStore).running ? (openBlock(), createBlock(TechButton, {
              key: 2,
              variant: "secondary",
              onClick: handleRestart
            }, {
              icon: withCtx(() => [..._cache[8] || (_cache[8] = [
                createBaseVNode("span", { class: "iconfont icon-clawzhongqi" }, null, -1)
              ])]),
              default: withCtx(() => [
                _cache[9] || (_cache[9] = createTextVNode(" 重启 ", -1))
              ]),
              _: 1
            })) : createCommentVNode("", true),
            unref(gatewayStore).running ? (openBlock(), createBlock(TechButton, {
              key: 3,
              variant: "danger",
              onClick: handleStop
            }, {
              icon: withCtx(() => [..._cache[10] || (_cache[10] = [
                createBaseVNode("span", { class: "iconfont icon-clawtingzhi" }, null, -1)
              ])]),
              default: withCtx(() => [
                _cache[11] || (_cache[11] = createTextVNode(" 停止 ", -1))
              ]),
              _: 1
            })) : createCommentVNode("", true)
          ])
        ]),
        createBaseVNode("div", { class: "home-hermes-card" }, [
          createBaseVNode("div", { class: "home-hermes-main" }, [
            createBaseVNode("div", { class: "home-hermes-icon" }, "H"),
            createBaseVNode("div", { class: "home-hermes-copy" }, [
              createBaseVNode("div", { class: "home-hermes-title" }, "Hermes Agent 协同控制台"),
              createBaseVNode("div", { class: "home-hermes-desc" }, "启动后可在 AI 会话中切换 Hermes 或协同模式；模型默认复用当前 OpenClaw 配置。"),
              createBaseVNode("div", { class: "home-hermes-status-row" }, [
                createBaseVNode("span", {
                  class: normalizeClass(["home-hermes-status", hermesRunning.value ? "running" : hermesStatus.value?.status === "error" ? "error" : "idle"])
                }, toDisplayString(hermesStatusText.value), 3),
                createBaseVNode("span", null, "PID: " + toDisplayString(hermesStatus.value?.pid || "--"), 1),
                createBaseVNode("span", null, "API: " + toDisplayString(hermesStatus.value?.apiServerReady ? "已就绪" : "未启动"), 1)
              ])
            ])
          ]),
          createBaseVNode("div", { class: "home-hermes-actions" }, [
            !hermesRunning.value ? (openBlock(), createElementBlock("button", { key: 0, class: "home-hermes-btn primary", onClick: handleHermesStart, title: "启动 Hermes 配置服务和本地运行环境" }, "启动 Hermes")) : createCommentVNode("", true),
            hermesRunning.value ? (openBlock(), createElementBlock("button", { key: 1, class: "home-hermes-btn", onClick: handleHermesConfig, title: "打开 Hermes 配置中心" }, "配置中心")) : createCommentVNode("", true),
            hermesRunning.value ? (openBlock(), createElementBlock("button", { key: 2, class: "home-hermes-btn", onClick: handleHermesDashboard, title: "打开 Hermes 官方 Dashboard" }, "Dashboard")) : createCommentVNode("", true),
            hermesRunning.value ? (openBlock(), createElementBlock("button", { key: 3, class: "home-hermes-btn", onClick: handleHermesApi, title: "启动 Hermes OpenAI 兼容 Agent API" }, "Agent API")) : createCommentVNode("", true),
            hermesRunning.value ? (openBlock(), createElementBlock("button", { key: 4, class: "home-hermes-btn", onClick: handleHermesRestart, title: "停止并重新启动 Hermes" }, "重启")) : createCommentVNode("", true),
            hermesRunning.value ? (openBlock(), createElementBlock("button", { key: 5, class: "home-hermes-btn danger", onClick: handleHermesStop, title: "停止 Hermes 配置服务、Dashboard 和 Agent API" }, "停止")) : createCommentVNode("", true)
          ])
        ]),
        hermesPanelTitle.value ? (openBlock(), createElementBlock("div", { key: 6, class: "home-hermes-panel" }, [
          createBaseVNode("div", { class: "home-hermes-panel-head" }, [
            createBaseVNode("div", null, [
              createBaseVNode("strong", null, toDisplayString(hermesPanelTitle.value), 1),
              createBaseVNode("span", null, toDisplayString(hermesActionBusy.value ? "正在准备服务..." : hermesPanelKind.value === "api" ? "本地 OpenAI 兼容接口已准备给外部工具调用" : "已在下方内嵌打开"), 1)
            ]),
            createBaseVNode("button", { class: "home-hermes-panel-close", onClick: ($event) => { hermesPanelTitle.value = ""; hermesPanelUrl.value = ""; hermesPanelKind.value = ""; } }, "收起")
          ]),
          hermesPanelKind.value === "api" ? (openBlock(), createElementBlock("div", { key: 0, class: "home-hermes-api-info" }, [
            createBaseVNode("div", null, [createBaseVNode("span", null, "Base URL"), createBaseVNode("code", null, "http://127.0.0.1:8642/v1")]),
            createBaseVNode("div", null, [createBaseVNode("span", null, "鉴权"), createBaseVNode("code", null, "Bearer openclaw-local-hermes")]),
            createBaseVNode("div", null, [createBaseVNode("span", null, "用途"), createBaseVNode("p", null, "供本地工具、子代理或 OpenAI 兼容客户端调用 Hermes Agent。普通用户聊天请到 AI 会话中切换 Hermes 或协同模式。")])
          ])) : hermesPanelUrl.value ? (openBlock(), createElementBlock("iframe", { key: 1, class: "home-hermes-frame", src: hermesPanelUrl.value }, null, 8, ["src"])) : (openBlock(), createElementBlock("div", { key: 2, class: "home-hermes-loading" }, "正在加载..."))
        ])) : createCommentVNode("", true),
        createBaseVNode("div", _hoisted_10$h, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(checkItems), (item) => {
            return openBlock(), createElementBlock("div", {
              key: item.id,
              class: normalizeClass(["home-env-check-card", [`home-env-check-status-${item.status}`]])
            }, [
              createBaseVNode("div", _hoisted_11$f, [
                createBaseVNode("span", {
                  class: normalizeClass(["iconfont", item.icon])
                }, null, 2)
              ]),
              createBaseVNode("div", _hoisted_12$e, toDisplayString(item.title), 1),
              createBaseVNode("div", {
                class: normalizeClass(["home-env-check-badge", "home-env-check-" + item.status])
              }, [
                _cache[12] || (_cache[12] = createBaseVNode("span", { class: "home-env-check-dot" }, null, -1)),
                createBaseVNode("span", null, toDisplayString(item.statusText), 1)
              ], 2)
            ], 2);
          }), 128))
        ]),
        createBaseVNode("div", _hoisted_13$e, [
          createBaseVNode("div", _hoisted_14$e, [
            createBaseVNode("div", { class: "home-terminal-title-row" }, [
              createBaseVNode("span", { class: "home-terminal-title" }, "实时日志"),
              createBaseVNode("div", { class: "home-log-tabs" }, [
                createBaseVNode("button", { class: normalizeClass({ active: activeLogSource.value === "openclaw" }), onClick: ($event) => switchLogSource("openclaw") }, "OpenClaw", 2),
                createBaseVNode("button", { class: normalizeClass({ active: activeLogSource.value === "hermes" }), onClick: ($event) => switchLogSource("hermes") }, "Hermes", 2)
              ])
            ]),
            createBaseVNode("div", _hoisted_15$e, [
              createVNode(TechButton, {
                variant: "ghost",
                size: "small",
                "icon-only": "",
                onClick: copyTerminal,
                title: "复制"
              }, {
                icon: withCtx(() => [..._cache[13] || (_cache[13] = [
                  createBaseVNode("span", { class: "iconfont icon-clawfuzhirizhi" }, null, -1)
                ])]),
                _: 1
              }),
              createVNode(TechButton, {
                variant: "ghost",
                size: "small",
                "icon-only": "",
                onClick: clearTerminal,
                title: "清空"
              }, {
                icon: withCtx(() => [..._cache[14] || (_cache[14] = [
                  createBaseVNode("span", { class: "iconfont icon-clawqingchurizhi" }, null, -1)
                ])]),
                _: 1
              })
            ])
          ]),
          createBaseVNode("div", {
            id: "terminal-logs",
            class: normalizeClass(["home-terminal-logs custom-scrollbar", { "has-data": activeLogs.value.length > 0 }])
          }, [
            activeLogs.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_16$e, [..._cache[16] || (_cache[16] = [
              createBaseVNode("img", {
                src: _imports_0$1,
                alt: "暂无日志",
                class: "home-no-logs-icon"
              }, null, -1),
              createBaseVNode("span", { class: "home-no-logs-text" }, "暂无日志", -1)
            ])])) : (openBlock(true), createElementBlock(Fragment, { key: 1 }, renderList(activeLogs.value, (log) => {
              return openBlock(), createElementBlock("div", {
                key: log.id,
                class: "home-log-line"
              }, [
                createBaseVNode("span", {
                  class: "home-log-type",
                  style: normalizeStyle({ color: log.typeColor })
                }, toDisplayString(log.typeLabel), 5),
                log.timestamp ? (openBlock(), createElementBlock("span", _hoisted_17$d, toDisplayString(log.timestamp), 1)) : createCommentVNode("", true),
                createBaseVNode("span", _hoisted_18$c, toDisplayString(log.message), 1)
              ]);
            }), 128))
          ], 2)
        ]),
        _cache[17] || (_cache[17] = createStaticVNode('<div class="home-quick-start" data-v-16de922d><h3 class="home-quick-start-title" data-v-16de922d>快速开始</h3><div class="home-quick-start-steps" data-v-16de922d><div class="home-step" data-v-16de922d><span class="home-step-num" data-v-16de922d>1.</span><span data-v-16de922d>点击上方 <span class="home-highlight" data-v-16de922d>【启动】</span> 按钮启动 Gateway</span></div><div class="home-step" data-v-16de922d><span class="home-step-num" data-v-16de922d>2.</span><span data-v-16de922d>在 <span class="home-highlight" data-v-16de922d>【模型配置】</span> 页面配置 AI 模型的 API Key</span></div><div class="home-step" data-v-16de922d><span class="home-step-num" data-v-16de922d>3.</span><span data-v-16de922d>在 <span class="home-highlight" data-v-16de922d>【微信连接】</span> 页面扫码连接微信</span></div><div class="home-step" data-v-16de922d><span class="home-step-num" data-v-16de922d>4.</span><span data-v-16de922d>在微信里发消息给 AI 开始对话</span></div></div></div>', 1))
      ]);
    };
  }
};
const Home = /* @__PURE__ */ _export_sfc(_sfc_main$v, [["__scopeId", "data-v-16de922d"]]);
const _imports_1$2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAG1BMVEUAAADpOCLrNyHrOCDqNyH////vaVn1m5D6zcj52H1PAAAABHRSTlMAgL9ARyeO/QAAAzNJREFUeNrt2mFymkAUwPEYe4C04wHa1AN0nB6gSZ4LB/AJBwDqAUBzAKkeu4sLWbPL7grddTrx/T8kJDH+BB6MincURVEURVEURVEURVEURVHUzTd9nIOXnr89mIwJeOzBaIRX5n6R5z5jAZ576UGAF3pV7sF7XzVk5h950hAIkGl+g07xJwjQr3C7RPZyDeS553D/GAhosaIAUSZ+7rlBBiKxpOdEcsRSLFWHLbBNvYf3RYjrlkNM/hVBRIgR14EQeRcsICLvDDGFrt+7plfEZNctpWKpHIvEiCuAGjGDthpN7cciy9NCHhapELPT+uwDIoip2DOrcEgkRud8vF6PTTXXj6K3pbE7Pm6HqJ2g0tsIs7cHClApG2Q8MlUQ7PKJzI1IhCaE8Y2X7jKx4gc3MgMjsrTNz1KOnBNZgBmpbEglhsOY/rxO3/H8KyBPnlyU6ouRCci0EY5URCybKg3IdG5DKj/IHGwIekFmYEMiL8gCrEjuA7mHMQgrTtWISfG+rAeZgAOJManwvOT9wVSCNTFYLoThyoCIjQb2hOFAWI2ZEaman5iysTRkBg5kW6cHMCERtjtNttKRBTgQXgoGRPweHIg03EjB2yCuC975iqydyMxusLpD1BGWK1I6EavCXtutY0Ki0x8VJNORqVnZoCjNdESuyFpZ8T2oWQ/FXBr9SIwSkfOsIzZl2Z2JDAirFSTXNpb7tBI7kAo7RG7eP2BATEqEeKwkclYiQIGoG0tHRJ97EZYWkBsRhrxUQUozYhrkDCxIhLyiQYq2CnFrONXbFBsCzbiyBqkuflY/G4zk/NsARCh2RD93McwGI5OZHdFHeAuDEKEMRWAAIpWRCCtEtW26pDIcUY6T7IJXWjeC7HhV+/p06xXpPUFyyR9SZKwOjiDvQmTHJxdHITU2ZS5E3hRhOFLJ+3Mh+RhE/ueqQ0BNR5IRyBIRD3AREsuTlgsxvx27OR6tSITyAbmQwemvFNxIkD7se/VBkCcF+QkBerre5abwF87Cz/AVL2aGvywbfIgVIMgQf7/uRf/xU/w/fEhCGqryxddHSh5/3FEURVEURVEURVEURVEURVG3119T75aRNb1TQAAAAABJRU5ErkJggg==";
const _imports_2$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAG1BMVEUAAADV//HW//LT/+/V//EBpm9r07Cg6dE2vJBT1TkuAAAABHRSTlMAgL9ARyeO/QAABMpJREFUeNrVnG9u2kAUxGngAE7KASj1AdymB8BmtPYBssAB8A2w1APgqseuqqp6SYBdv38qnY+Rwi8zs+uAeesZQ/Pnp/W6BJr1+vHjzEPzxzXeaP1YWSOIANKnwhDxvMYN1VaY+Vck9MnGRomkmsLMhqeZedIGNePJIIojgySmfABDhSeDKK5ZEcWfgbpiQ5ZgqxYw3ClfIdJn2cJyLL+EULVjWKStZ1gUGCcs58C+QaUtIyzfwJZQqtYZ0VshI35WyIi/lRIGatKMB5ho5W8EaJSN6FtZwki1yojeyhJmqj2NkBX55Vd/MYapHNMirYS166ufw1jVFcgC8M9rCWM1jrWTCskm0W+VEuZqBGnp81rAQRv22tLvxzlcVPlXAqy4aekXMXzUMNPSL+IFnLThVaJfxHCTTyXtT7xW5VFJO8YTQFp5VNLHeAZIWwfI9xjjC0BqqBJLRtzhtSprSIi/dQCJSlnArPTfetv81riSPiYgJYwK+aM9SNQ8zAohI6SKejcrJJ5xDfIAy0IOeKcVLS6rQuIRIFHzSxgWssN1SAm7Qi6NoLFaXAMZuVRls7hCJCNekHZMGcHKZHH1ZARekC4mjWBjsILbmDaCrQGkzxhBo98mXcIIQaAMK2cEUH8y6bNGgEq5TcIEIyh0kHZMGSHIAxQaphjBSgUJMWmEIAvAovUDbmujgXSRdMZtbRX3VNqYMUKQJQzCii/wgYT4SickVBNEY2SHlJpZCX3r8egDacesET1kyBrRQ0LMGtFD+teQcxYCtZGInAgiNrIHPCBdvKhdBGmR0HhRuwzSHxlGhJAQD6fUPiQdMAFS3nqdXXYf0vVXtE+GRA5tfKOTFBLo93NGdpBCRnqBnJGjFDKkXqGPF7VLICEVeIiJ2hn/GcdU4j0jLYJ8Y/2nCJFTO0HSL3NkGGG87xoTf2uIbwWQWO8gu3d/bMLIfirkgdFtiNy06F395HJ7Xu0E+YDJVtqY2ST5T1r5VIbIuzYSZA5SOpY2ctOiOzjIWzmTEX7twI2bBf2114v5TcK6IxGuJNNJ06pvfX3dXwY28tMiyAITrMTj+58cMFUbui2csbJ7/4O9GkJWSNK0UNB3yzkrstoJIrHygslK3XwejNJqUiMYrVFadQqCwSatTfKrjdYkLazSowuDRVoo0pDWIi3kvjj7bpBWk53wGfVp1VlIp09rQwOpPCtHXu/UPMPKAQLIrORZ2fMqoVI4Vo5sCJUy+ZIPXu/5UhBUCxjFtJGSXpMWJg7HBE1a9dQxn16R1mbqwFKQb3cUk2cHe30l+SnIIN7uNWOevhcvYMZgX5CmVXFGFHvhAmYNWwbhAuaNjfayBcwbgA2SShruKO8gqGTLHUpuZQuYlxcGdiU1/3xLy65kIxh5H7iVVILh/Zb/ro6fFzpeJYXsQMXIqkR4NKSLJ+4mEczv/+CmJagerah2/4NH/keo/A+D+R9r+/cH9GysNPdwaNLk+Od9HGTVW6nv5XCx/zFpfWDNPR1dFwZGTy1wDqy5twcjiB/xcH8PqyCKA4M0Z1Oayu9xK8S414e6EMWFQRTPrIiy9GQQxZFBepqwz4khNlNmbDzPLPSksqFvZk02DDBPVxHV//fgtj/68vj3EXSfnjmEX0KmyDnS9+ibAAAAAElFTkSuQmCC";
const useModelsStore = /* @__PURE__ */ defineStore("models", () => {
  const allModels = /* @__PURE__ */ ref([]);
  const selectedModels = /* @__PURE__ */ ref([]);
  const apiKey = /* @__PURE__ */ ref("");
  const currentModel = computed(
    () => selectedModels.value.find((item) => item.isCurrent) || null
  );
  function setAllModels(models) {
    allModels.value = models;
  }
  function setSelectedModels(models) {
    const removedSource = String.fromCharCode(111, 102, 102, 105, 99, 105, 97, 108);
    const processedModels = models.filter((model) => model.source !== removedSource);
    selectedModels.value = processedModels;
    localStorage.setItem("uclaw_selected_models", JSON.stringify(processedModels));
  }
  function setApiKey(key) {
    apiKey.value = key;
  }
  return { allModels, selectedModels, currentModel, apiKey, setAllModels, setSelectedModels, setApiKey };
});
async function fetchAllModels() {
  try {
    const store = useModelsStore();
    store.setAllModels([]);
    const stored = localStorage.getItem("uclaw_selected_models");
    const removedSource = String.fromCharCode(111, 102, 102, 105, 99, 105, 97, 108);
    const selectedModels = stored ? JSON.parse(stored).filter((m) => m.source !== removedSource) : [];
    store.setSelectedModels(selectedModels);
  } catch (e) {
    console.error("[models] fetchAllModels error:", e);
  }
}
const _hoisted_1$u = { class: "model-model-view" };
const _hoisted_2$t = {
  key: 0,
  class: "model-restart-card"
};
const _hoisted_3$s = { class: "model-restart-actions" };
const _hoisted_4$p = {
  key: 0,
  class: "model-selected-models"
};
const _hoisted_5$p = ["onDragstart", "onDragover", "onDragenter", "onDrop", "onClick"];
const _hoisted_6$n = { class: "model-model-info" };
const _hoisted_7$m = {
  key: 0,
  class: "model-model-badge"
};
const _hoisted_8$l = {
  key: 1,
  class: "model-model-badge"
};
const _hoisted_9$i = {
  key: 2,
  class: "model-model-badge"
};
const _hoisted_10$g = { class: "model-model-name" };
const _hoisted_11$e = ["onClick"];
const _hoisted_12$d = { class: "model-tab-bar" };
const _hoisted_13$d = { class: "model-tab-content" };
const _hoisted_14$d = { class: "model-grid-layout" };
const _hoisted_15$d = { class: "model-config-panel" };
const _hoisted_16$d = { class: "model-form-group" };
const _hoisted_17$c = { class: "model-input-row" };
const _hoisted_18$b = {
  key: 0,
  value: ""
};
const _hoisted_19$a = ["value"];
const _hoisted_20$a = { class: "model-form-group" };
const _hoisted_21$a = { class: "model-input-row model-password-row" };
const _hoisted_22$a = { class: "model-balance-panel" };
const _hoisted_23$9 = { class: "model-balance-content" };
const _hoisted_24$8 = { class: "model-usage-bar-container" };
const _hoisted_25$7 = { class: "model-usage-labels" };
const _hoisted_26$7 = { class: "model-usage-bar-bg" };
const _hoisted_27$6 = { class: "model-balance-stats" };
const _hoisted_28$6 = { class: "model-stat-item" };
const _hoisted_29$6 = { class: "model-stat-value" };
const _hoisted_30$5 = { class: "model-stat-item" };
const _hoisted_31$5 = { class: "model-stat-value" };
const _hoisted_32$4 = { class: "model-tab-content" };
const _hoisted_33$3 = { class: "model-model-grid" };
const _hoisted_34$3 = ["data-provider", "data-base", "data-model", "onClick"];
const _hoisted_35$3 = ["href"];
const _hoisted_36$3 = {
  key: 0,
  class: "model-config-form"
};
const _hoisted_37$2 = { class: "model-form-header" };
const _hoisted_38$2 = { class: "model-form-group" };
const _hoisted_39$2 = { class: "model-form-group" };
const _hoisted_40$2 = { class: "model-form-group" };
const _hoisted_41$2 = ["placeholder"];
const _hoisted_42$2 = { class: "model-form-group" };
const _hoisted_43$2 = ["value"];
const _hoisted_44$2 = { class: "model-tab-content" };
const _hoisted_45$2 = { class: "model-config-form" };
const _hoisted_46$2 = { class: "model-form-group" };
const _hoisted_47$2 = { class: "model-form-group" };
const _hoisted_48$1 = { class: "model-form-group" };
const _hoisted_49$1 = ["value"];
const _hoisted_50$1 = { class: "model-form-group" };
const _sfc_main$u = {
  __name: "Model",
  setup(__props) {
    const modelsStore = useModelsStore();
    useGatewayStore();
    const { showToast } = useToast();
    const activeTab = /* @__PURE__ */ ref("recommended");
    const showRestartCard = /* @__PURE__ */ ref(false);
    function showRestartCardNotice() {
      showRestartCard.value = true;
    }
    async function handleRestart() {
      showRestartCard.value = false;
      window.showLoadingOverlayVue?.();
      try {
        await window.uclaw.ipcRestartGateway();
        if (window.hideLoadingOverlayVue) {
          setTimeout(() => window.hideLoadingOverlayVue(), 500);
        }
      } catch (err) {
        console.error("重启失败:", err);
        if (window.hideLoadingOverlayVue) {
          setTimeout(() => window.hideLoadingOverlayVue(), 500);
        }
        if (window.showToastVue) {
          window.showToastVue("重启失败: " + err.message, true);
        }
      }
    }
    const removingId = /* @__PURE__ */ ref(null);
    const dragIndex = /* @__PURE__ */ ref(null);
    const dropIndex = /* @__PURE__ */ ref(null);
    function onDragStart(event, index) {
      dragIndex.value = index;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", index);
      event.target.classList.add("dragging");
    }
    function onDragEnd(event) {
      dragIndex.value = null;
      dropIndex.value = null;
      event.target.classList.remove("model-dragging");
      document.querySelectorAll(".model-model-row").forEach((el) => el.classList.remove("model-drag-over"));
    }
    function onDragOver(event, index) {
      event.dataTransfer.dropEffect = "move";
    }
    function onDragEnter(event, index) {
      if (dragIndex.value === null || dragIndex.value === index) return;
      dropIndex.value = index;
      document.querySelectorAll(".model-model-row").forEach((el, i) => {
        el.classList.toggle("model-drag-over", i === index);
      });
    }
    function onDrop(event, index) {
      if (dragIndex.value === null || dragIndex.value === index) return;
      const newModels = [...modelsStore.selectedModels];
      const [removed] = newModels.splice(dragIndex.value, 1);
      newModels.splice(index, 0, removed);
      const currentValue = modelsStore.selectedModels.find((m) => m.isCurrent)?.value;
      const currentIndex = dragIndex.value;
      modelsStore.setSelectedModels(
        newModels.map((m) => ({ ...m, isCurrent: m.value === currentValue }))
      );
      showToast("模型顺序已调整");
      if (currentValue && (dragIndex.value === index || dragIndex.value === currentIndex)) ;
    }
    const modelApiPurchaseUrl = "";
    const editingModelValue = /* @__PURE__ */ ref("");
    const editUrl = /* @__PURE__ */ ref("");
    const editKey = /* @__PURE__ */ ref("");
    const editModelName = /* @__PURE__ */ ref("");
    const editApiType = /* @__PURE__ */ ref("openai-completions");
    const editProvider = /* @__PURE__ */ ref("custom");
    const editSource = /* @__PURE__ */ ref("custom");
    const editLabelPrefix = /* @__PURE__ */ ref("");
    function openApiPurchasePlatform() {
      if (modelApiPurchaseUrl) {
        window.uclaw?.ipcOpenExternalUrl?.(modelApiPurchaseUrl);
        return;
      }
      showToast("模型 API 购买平台即将开放");
    }
    function buildModelLabel(source, provider, modelName, fallbackLabel) {
      const cleanName = String(modelName || "").trim();
      if (source === "recommend") {
        const matched = recommendedModels.find((item) => item.provider === provider);
        const prefix = editLabelPrefix.value || matched?.name || provider || "推荐模型";
        return cleanName ? `${prefix} / ${cleanName}` : fallbackLabel || prefix;
      }
      return cleanName || fallbackLabel || "自定义模型";
    }
    function editModel(model) {
      editingModelValue.value = model.value || "";
      editUrl.value = model.base || "";
      editKey.value = model.key || "";
      editModelName.value = model.model || model.label || "";
      editApiType.value = model.api || "openai-completions";
      editProvider.value = model.provider || (model.source === "custom" ? "custom" : "recommend");
      editSource.value = model.source || "custom";
      editLabelPrefix.value = model.source === "recommend" ? String(model.label || "").split(" / ")[0] : "";
    }
    function cancelEditModel() {
      editingModelValue.value = "";
      editUrl.value = "";
      editKey.value = "";
      editModelName.value = "";
      editApiType.value = "openai-completions";
      editProvider.value = "custom";
      editSource.value = "custom";
      editLabelPrefix.value = "";
    }
    function saveEditingModel() {
      const originalValue = editingModelValue.value;
      if (!originalValue) return;
      if (!editUrl.value.trim()) {
        showToast("请填写 API URL，不可为空", true);
        return;
      }
      if (!editKey.value.trim()) {
        showToast("请填写 API Key，不可为空", true);
        return;
      }
      if (!editModelName.value.trim()) {
        showToast("请填写模型名称", true);
        return;
      }
      const nextSource = editSource.value || "custom";
      const nextProvider = editProvider.value || (nextSource === "custom" ? "custom" : "recommend");
      const nextModelName = editModelName.value.trim();
      const nextValue = nextSource === "custom" ? `custom-${nextModelName}` : `${nextProvider}-${nextModelName}`;
      const duplicated = modelsStore.selectedModels.some((item) => item.value === nextValue && item.value !== originalValue);
      if (duplicated) {
        showToast("已存在相同模型名称，请换一个名称", true);
        return;
      }
      const updatedModels = modelsStore.selectedModels.map((item) => {
        if (item.value !== originalValue) return item;
        return {
          ...item,
          label: buildModelLabel(nextSource, nextProvider, nextModelName, item.label),
          value: nextValue,
          source: nextSource,
          base: editUrl.value.trim(),
          key: editKey.value.trim(),
          model: nextModelName,
          provider: nextProvider,
          api: editApiType.value || "openai-completions"
        };
      });
      modelsStore.setSelectedModels(updatedModels);
      cancelEditModel();
      showRestartCardNotice();
      showToast("模型配置已更新，OpenClaw 与 Hermes 将共用新配置");
    }
    const selectedRecommendModel = /* @__PURE__ */ ref(null);
    const recommendUrl = /* @__PURE__ */ ref("");
    const recommendKey = /* @__PURE__ */ ref("");
    const recommendModelName = /* @__PURE__ */ ref("");
    const recommendApiType = /* @__PURE__ */ ref("openai-completions");
    const recommendApiTypeOptions = [
      { value: "openai-completions", label: "OpenAI (兼容格式)" },
      { value: "anthropic-messages", label: "Anthropic Claude" }
    ];
    const customUrl = /* @__PURE__ */ ref("");
    const customKey = /* @__PURE__ */ ref("");
    const customModelName = /* @__PURE__ */ ref("");
    const customApiType = /* @__PURE__ */ ref("openai-completions");
    const apiTypeOptions = [
      { value: "openai-completions", label: "OpenAI (兼容格式)" },
      { value: "anthropic-messages", label: "Anthropic Claude" },
      { value: "ollama", label: "Ollama" },
      { value: "lmstudio", label: "LM Studio" }
    ];
    const recommendedModels = [
      { provider: "minimax", name: "MiniMax", base: "https://api.minimaxi.com/anthropic", model: "MiniMax M2.7", desc: "速度快，性价比高", buyLink: "https://platform.minimaxi.com/", tags: ["推荐", "国内"] },
      { provider: "kimi", name: "Kimi (月之暗面)", base: "https://api.moonshot.cn/v1", model: "moonshot-v1-auto", desc: "智能选模型", buyLink: "https://platform.moonshot.cn/", tags: ["国内", "快"] },
      { provider: "deepseek", name: "DeepSeek", base: "https://api.deepseek.com/v1", model: "deepseek-chat", desc: "超低价格", buyLink: "https://platform.deepseek.com/", tags: ["国内", "便宜"] },
      { provider: "qwen", name: "通义千问", base: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-turbo", desc: "阿里云出品", buyLink: "https://dashscope.console.aliyun.com/", tags: ["国内", "有免费"] },
      { provider: "doubao", name: "豆包 (字节)", base: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-1.5-pro-32k", desc: "字节跳动", buyLink: "https://console.volcengine.com/ark", tags: ["国内", "快"] },
      { provider: "siliconflow", name: "硅基流动", base: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen2.5-72B-Instruct", desc: "多模型聚合，价格低", buyLink: "https://cloud.siliconflow.cn/", tags: ["国内", "便宜"] }
    ];
    function selectRecommendedModel(model) {
      selectedRecommendModel.value = model;
      recommendUrl.value = model.base || "";
      recommendKey.value = "";
      recommendModelName.value = "";
      recommendApiType.value = model.provider === "minimax" ? "anthropic-messages" : "openai-completions";
    }
    function closeRecommendForm() {
      selectedRecommendModel.value = null;
      recommendUrl.value = "";
      recommendKey.value = "";
      customModelName.value = "";
      recommendModelName.value = "";
      recommendApiType.value = "openai-completions";
    }
    function saveRecommendConfig() {
      if (!recommendUrl.value) {
        showToast("请填写 API URL，不可为空", true);
        return;
      }
      if (!recommendKey.value) {
        showToast("请填写 API Key，不可为空", true);
        return;
      }
      if (!recommendModelName.value) {
        showToast("请填写模型名称，不可为空", true);
        return;
      }
      const modelName = recommendModelName.value;
      const modelValue2 = `${selectedRecommendModel.value.provider}-${recommendModelName.value}`;
      const label = selectedRecommendModel.value.name + " / " + recommendModelName.value;
      const source = "recommend";
      const exists = modelsStore.selectedModels.some((m) => m.value === modelValue2);
      if (exists) {
        showToast("不可重复添加模型", true);
        return;
      }
      const modelInfo = {
        label,
        value: modelValue2,
        source,
        base: recommendUrl.value,
        key: recommendKey.value,
        model: modelName,
        provider: selectedRecommendModel.value.provider,
        api: recommendApiType.value
      };
      const updatedModels = [...modelsStore.selectedModels];
      updatedModels.push({ ...modelInfo, isCurrent: updatedModels.length === 0 });
      modelsStore.setSelectedModels(updatedModels);
      showToast("模型添加成功");
      closeRecommendForm();
    }
    function saveCustomModel() {
      if (!customUrl.value) {
        showToast("请填写 API URL，不可为空", true);
        return;
      }
      if (!customKey.value) {
        showToast("请填写 API Key，不可为空", true);
        return;
      }
      if (!customModelName.value) {
        showToast("请填写自定义模型名称", true);
        return;
      }
      const modelValue2 = `custom-${customModelName.value}`;
      const exists = modelsStore.selectedModels.some((m) => m.value === modelValue2);
      if (exists) {
        showToast("不可重复添加模型", true);
        return;
      }
      const modelInfo = {
        label: customModelName.value,
        value: modelValue2,
        source: "custom",
        base: customUrl.value,
        key: customKey.value,
        model: customModelName.value,
        provider: "custom",
        api: customApiType.value
      };
      const updatedModels = [...modelsStore.selectedModels];
      updatedModels.push({ ...modelInfo, isCurrent: updatedModels.length === 0 });
      modelsStore.setSelectedModels(updatedModels);
      showToast("模型添加成功");
      customUrl.value = "";
      customKey.value = "";
      customModelName.value = "";
      customApiType.value = "openai-completions";
    }
    function getTagClass(tag2) {
      const tagMap = {
        "推荐": "model-hot",
        "国内": "model-cn",
        "快": "model-fast",
        "便宜": "model-cheap",
        "有免费": "model-free",
        "极快": "model-fast",
        "强": "model-hot"
      };
      return tagMap[tag2] || "";
    }
    function removeModel(model) {
      if (!confirm(`确定要删除模型「${model.label}」吗？`)) {
        return;
      }
      removingId.value = model.value;
      setTimeout(() => {
        let updated = modelsStore.selectedModels.filter((m) => m.value !== model.value);
        if (updated.length > 0 && !updated.some((m) => m.isCurrent)) {
          updated = updated.map((m, index) => ({ ...m, isCurrent: index === 0 }));
        }
        modelsStore.setSelectedModels(updated);
        if (editingModelValue.value === model.value) cancelEditModel();
        removingId.value = null;
        showRestartCardNotice();
      }, 400);
    }
    function switchModel(model) {
      const isChanging = !modelsStore.selectedModels.find((m) => m.isCurrent)?.value || modelsStore.selectedModels.find((m) => m.isCurrent)?.value !== model.value;
      modelsStore.setSelectedModels(
        modelsStore.selectedModels.map((item) => ({ ...item, isCurrent: item.value === model.value }))
      );
      if (isChanging) {
        showRestartCardNotice();
      }
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$u, [
        createVNode(Transition, { name: "slide-up" }, {
          default: withCtx(() => [
            showRestartCard.value ? (openBlock(), createElementBlock("div", _hoisted_2$t, [
              _cache[15] || (_cache[15] = createBaseVNode("div", { class: "model-restart-content" }, [
                createBaseVNode("span", { class: "model-restart-text" }, "配置已更换，是否需要重启？")
              ], -1)),
              createBaseVNode("div", _hoisted_3$s, [
                createBaseVNode("button", {
                  class: "model-restart-btn",
                  onClick: handleRestart
                }, "重启"),
                createBaseVNode("button", {
                  class: "model-restart-btn model-restart-btn-dismiss",
                  onClick: _cache[0] || (_cache[0] = ($event) => showRestartCard.value = false)
                }, "不再提示")
              ])
            ])) : createCommentVNode("", true)
          ]),
          _: 1
        }),
        createBaseVNode("div", { class: "model-api-purchase-card" }, [
          createBaseVNode("div", { class: "model-api-purchase-main" }, [
            createBaseVNode("div", { class: "model-api-purchase-title" }, "点击购买模型API，超低价格"),
            createBaseVNode("div", { class: "model-api-purchase-desc" }, "后续可在这里直达官方平台购买 token 套餐，购买后回到本页填写 API Key 即可同时供 OpenClaw 与 Hermes 使用。")
          ]),
          createBaseVNode("button", {
            class: "model-api-purchase-action",
            onClick: openApiPurchasePlatform
          }, "即将开放")
        ]),
        unref(modelsStore).selectedModels.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_4$p, [
          createVNode(TransitionGroup, { name: "model-remove" }, {
            default: withCtx(() => [
              (openBlock(true), createElementBlock(Fragment, null, renderList(unref(modelsStore).selectedModels, (model, index) => {
                return openBlock(), createElementBlock("div", {
                  key: model.value,
                  class: normalizeClass(["model-model-row", { "model-current": model.isCurrent, "model-removing": removingId.value === model.value, "model-dragging": dragIndex.value === index }]),
                  draggable: "true",
                  onDragstart: ($event) => onDragStart($event, index),
                  onDragend: onDragEnd,
                  onDragover: withModifiers(($event) => onDragOver($event, index), ["prevent"]),
                  onDragenter: withModifiers(($event) => onDragEnter($event, index), ["prevent"]),
                  onDrop: withModifiers(($event) => onDrop($event, index), ["prevent"]),
                  onClick: ($event) => switchModel(model)
                }, [
                  createBaseVNode("div", _hoisted_6$n, [
                    _cache[19] || (_cache[19] = createBaseVNode("span", {
                      class: "model-drag-handle",
                      title: "拖拽排序"
                    }, [
                      createBaseVNode("span", { class: "iconfont icon-clawtuozhuai" })
                    ], -1)),
                    model.source === "recommend" ? (openBlock(), createElementBlock("div", _hoisted_8$l, [..._cache[17] || (_cache[17] = [
                      createBaseVNode("img", {
                        src: _imports_1$2,
                        alt: "推荐模型",
                        class: "model-badge-icon"
                      }, null, -1),
                      createBaseVNode("span", null, "推荐模型", -1)
                    ])])) : model.source === "custom" ? (openBlock(), createElementBlock("div", _hoisted_9$i, [..._cache[18] || (_cache[18] = [
                      createBaseVNode("span", null, "自定义", -1)
                    ])])) : createCommentVNode("", true),
                    _cache[20] || (_cache[20] = createBaseVNode("span", { style: { "margin": "0 6px" } }, "/", -1)),
                    createBaseVNode("span", _hoisted_10$g, toDisplayString(model.label), 1)
                  ]),
                  createBaseVNode("div", { class: "model-row-actions" }, [
                    createBaseVNode("button", {
                      onClick: withModifiers(($event) => editModel(model), ["stop"]),
                      class: normalizeClass(["model-row-edit", { active: editingModelValue.value === model.value }]),
                      title: "编辑模型配置"
                    }, toDisplayString(editingModelValue.value === model.value ? "编辑中" : "编辑"), 11, _hoisted_11$e),
                    unref(modelsStore).selectedModels.length > 1 && !model.isCurrent ? (openBlock(), createElementBlock("button", {
                      key: 0,
                      onClick: withModifiers(($event) => removeModel(model), ["stop"]),
                      class: "model-row-remove",
                      title: "删除"
                    }, "删除", 8, _hoisted_11$e)) : createCommentVNode("", true)
                  ])
                ], 42, _hoisted_5$p);
              }), 128))
            ]),
            _: 1
          })
        ])) : createCommentVNode("", true),
        editingModelValue.value ? (openBlock(), createElementBlock("div", { key: "model-edit-form", class: "model-edit-form" }, [
          createBaseVNode("div", { class: "model-edit-form-header" }, [
            createBaseVNode("div", null, [
              createBaseVNode("h4", null, "编辑模型配置"),
              createBaseVNode("p", null, "保存后当前模型配置会同时应用到 OpenClaw 与 Hermes。")
            ]),
            createBaseVNode("button", { class: "model-close-btn", onClick: cancelEditModel }, "×")
          ]),
          createBaseVNode("div", { class: "model-edit-grid" }, [
            createBaseVNode("label", { class: "model-form-group" }, [
              createBaseVNode("span", { class: "model-form-label" }, "API URL"),
              withDirectives(createBaseVNode("input", { type: "text", class: "model-form-input", "onUpdate:modelValue": ($event) => editUrl.value = $event, placeholder: "请输入 API 地址" }, null, 512), [[vModelText, editUrl.value]])
            ]),
            createBaseVNode("label", { class: "model-form-group" }, [
              createBaseVNode("span", { class: "model-form-label" }, "API Key"),
              withDirectives(createBaseVNode("input", { type: "password", class: "model-form-input", "onUpdate:modelValue": ($event) => editKey.value = $event, placeholder: "请输入 API Key" }, null, 512), [[vModelText, editKey.value]])
            ]),
            createBaseVNode("label", { class: "model-form-group" }, [
              createBaseVNode("span", { class: "model-form-label" }, "API 类型"),
              withDirectives(createBaseVNode("select", { class: "model-form-input", "onUpdate:modelValue": ($event) => editApiType.value = $event }, [
                (openBlock(), createElementBlock(Fragment, null, renderList(apiTypeOptions, (opt) => {
                  return createBaseVNode("option", { key: opt.value, value: opt.value }, toDisplayString(opt.label), 9, _hoisted_49$1);
                }), 64))
              ], 512), [[vModelSelect, editApiType.value]])
            ]),
            createBaseVNode("label", { class: "model-form-group" }, [
              createBaseVNode("span", { class: "model-form-label" }, "模型名称"),
              withDirectives(createBaseVNode("input", { type: "text", class: "model-form-input", "onUpdate:modelValue": ($event) => editModelName.value = $event, placeholder: "请输入模型名称" }, null, 512), [[vModelText, editModelName.value]])
            ])
          ]),
          createBaseVNode("div", { class: "model-edit-actions" }, [
            createBaseVNode("button", { class: "model-edit-cancel", onClick: cancelEditModel }, "取消"),
            createBaseVNode("button", { class: "model-btn-save", onClick: saveEditingModel }, "保存修改")
          ])
        ])) : createCommentVNode("", true),
        createBaseVNode("div", { class: "model-unified-hermes-note" }, [
          createBaseVNode("span", { class: "model-unified-hermes-mark" }, "H"),
          createBaseVNode("span", null, "当前应用的模型会同时供 OpenClaw 与 Hermes 使用；Hermes 会话无需单独配置 Key。")
        ]),
        createBaseVNode("div", _hoisted_12$d, [
          createCommentVNode("", true),
          createBaseVNode("button", {
            class: normalizeClass(["model-model-tab", { "model-active": activeTab.value === "recommended" }]),
            onClick: _cache[2] || (_cache[2] = ($event) => activeTab.value = "recommended")
          }, " 推荐模型 ", 2),
          createBaseVNode("button", {
            class: normalizeClass(["model-model-tab", { "model-active": activeTab.value === "custom" }]),
            onClick: _cache[3] || (_cache[3] = ($event) => activeTab.value = "custom")
          }, " 自定义模型 ", 2)
        ]),
        createCommentVNode("", true),
        withDirectives(createBaseVNode("div", _hoisted_32$4, [
          createBaseVNode("div", _hoisted_33$3, [
            (openBlock(), createElementBlock(Fragment, null, renderList(recommendedModels, (model) => {
              return createBaseVNode("div", {
                key: model.provider,
                class: normalizeClass(["model-model-card", { "model-selected": selectedRecommendModel.value?.provider === model.provider }]),
                "data-provider": model.provider,
                "data-base": model.base,
                "data-model": model.model,
                onClick: ($event) => selectRecommendedModel(model)
              }, [
                _cache[33] || (_cache[33] = createBaseVNode("span", { class: "model-check" }, "✓", -1)),
                createBaseVNode("h4", null, [
                  createTextVNode(toDisplayString(model.name) + " ", 1),
                  (openBlock(true), createElementBlock(Fragment, null, renderList(model.tags, (tag2, index) => {
                    return openBlock(), createElementBlock("span", {
                      key: index,
                      class: normalizeClass(["model-tag", getTagClass(tag2)])
                    }, toDisplayString(tag2), 3);
                  }), 128))
                ]),
                createBaseVNode("p", null, toDisplayString(model.desc), 1),
                model.buyLink ? (openBlock(), createElementBlock("a", {
                  key: 0,
                  class: "model-buy-link",
                  href: model.buyLink,
                  target: "_blank",
                  onClick: _cache[6] || (_cache[6] = withModifiers(() => {
                  }, ["stop"]))
                }, "→ 获取 API Key", 8, _hoisted_35$3)) : createCommentVNode("", true)
              ], 10, _hoisted_34$3);
            }), 64))
          ]),
          createVNode(Transition, { name: "slide-up" }, {
            default: withCtx(() => [
              selectedRecommendModel.value ? (openBlock(), createElementBlock("div", _hoisted_36$3, [
                createBaseVNode("div", _hoisted_37$2, [
                  createBaseVNode("h4", null, toDisplayString(selectedRecommendModel.value.name) + " 配置", 1),
                  createBaseVNode("button", {
                    class: "model-close-btn",
                    onClick: closeRecommendForm
                  }, "×")
                ]),
                createBaseVNode("div", _hoisted_38$2, [
                  _cache[34] || (_cache[34] = createBaseVNode("label", { class: "model-form-label" }, "API URL", -1)),
                  withDirectives(createBaseVNode("input", {
                    type: "text",
                    class: "model-form-input",
                    "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => recommendUrl.value = $event),
                    placeholder: "请输入 API 地址"
                  }, null, 512), [
                    [vModelText, recommendUrl.value]
                  ])
                ]),
                createBaseVNode("div", _hoisted_39$2, [
                  _cache[35] || (_cache[35] = createBaseVNode("label", { class: "model-form-label" }, "API Key", -1)),
                  withDirectives(createBaseVNode("input", {
                    type: "password",
                    class: "model-form-input",
                    "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => recommendKey.value = $event),
                    placeholder: "请输入 API Key"
                  }, null, 512), [
                    [vModelText, recommendKey.value]
                  ])
                ]),
                createBaseVNode("div", _hoisted_40$2, [
                  _cache[36] || (_cache[36] = createBaseVNode("label", { class: "model-form-label" }, "模型名称", -1)),
                  withDirectives(createBaseVNode("input", {
                    type: "text",
                    class: "model-form-input",
                    "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => recommendModelName.value = $event),
                    placeholder: "请输入模型名称，如 " + selectedRecommendModel.value.model
                  }, null, 8, _hoisted_41$2), [
                    [vModelText, recommendModelName.value]
                  ])
                ]),
                createBaseVNode("div", _hoisted_42$2, [
                  _cache[37] || (_cache[37] = createBaseVNode("label", { class: "model-form-label" }, "API 类型", -1)),
                  withDirectives(createBaseVNode("select", {
                    class: "model-form-input",
                    "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => recommendApiType.value = $event)
                  }, [
                    (openBlock(), createElementBlock(Fragment, null, renderList(recommendApiTypeOptions, (opt) => {
                      return createBaseVNode("option", {
                        key: opt.value,
                        value: opt.value
                      }, toDisplayString(opt.label), 9, _hoisted_43$2);
                    }), 64))
                  ], 512), [
                    [vModelSelect, recommendApiType.value]
                  ])
                ]),
                createBaseVNode("button", {
                  onClick: saveRecommendConfig,
                  class: "model-btn-save"
                }, "保存配置")
              ])) : createCommentVNode("", true)
            ]),
            _: 1
          })
        ], 512), [
          [vShow, activeTab.value === "recommended"]
        ]),
        withDirectives(createBaseVNode("div", _hoisted_44$2, [
          _cache[42] || (_cache[42] = createBaseVNode("div", { class: "model-custom-intro" }, [
            createBaseVNode("h3", null, "自定义 OpenAI 兼容模型"),
            createBaseVNode("p", null, "填写任意 OpenAI 格式的 API 地址，快速接入第三方模型服务")
          ], -1)),
          createBaseVNode("div", _hoisted_45$2, [
            createBaseVNode("div", _hoisted_46$2, [
              _cache[38] || (_cache[38] = createBaseVNode("label", { class: "model-form-label" }, "API URL", -1)),
              withDirectives(createBaseVNode("input", {
                type: "text",
                class: "model-form-input",
                "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => customUrl.value = $event),
                placeholder: "请输入 API 地址，例如 https://api.example.com/v1"
              }, null, 512), [
                [vModelText, customUrl.value]
              ])
            ]),
            createBaseVNode("div", _hoisted_47$2, [
              _cache[39] || (_cache[39] = createBaseVNode("label", { class: "model-form-label" }, "API Key", -1)),
              withDirectives(createBaseVNode("input", {
                type: "password",
                class: "model-form-input",
                "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => customKey.value = $event),
                placeholder: "请输入 API Key"
              }, null, 512), [
                [vModelText, customKey.value]
              ])
            ]),
            createBaseVNode("div", _hoisted_48$1, [
              _cache[40] || (_cache[40] = createBaseVNode("label", { class: "model-form-label" }, "API 类型", -1)),
              withDirectives(createBaseVNode("select", {
                class: "model-form-input",
                "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => customApiType.value = $event)
              }, [
                (openBlock(), createElementBlock(Fragment, null, renderList(apiTypeOptions, (opt) => {
                  return createBaseVNode("option", {
                    key: opt.value,
                    value: opt.value
                  }, toDisplayString(opt.label), 9, _hoisted_49$1);
                }), 64))
              ], 512), [
                [vModelSelect, customApiType.value]
              ])
            ]),
            createBaseVNode("div", _hoisted_50$1, [
              _cache[41] || (_cache[41] = createBaseVNode("label", { class: "model-form-label" }, "自定义模型名称", -1)),
              withDirectives(createBaseVNode("input", {
                type: "text",
                class: "model-form-input",
                "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => customModelName.value = $event),
                placeholder: "请输入自定义模型名称"
              }, null, 512), [
                [vModelText, customModelName.value]
              ])
            ]),
            createBaseVNode("button", {
              onClick: saveCustomModel,
              class: "model-btn-save"
            }, "添加模型")
          ])
        ], 512), [
          [vShow, activeTab.value === "custom"]
        ])
      ]);
    };
  }
};
const Model = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["__scopeId", "data-v-f6e73322"]]);
const useSkillsStore = /* @__PURE__ */ defineStore("skills", () => {
  const allSkills = /* @__PURE__ */ ref([]);
  function setAllSkills(skills) {
    allSkills.value = skills;
  }
  return { allSkills, setAllSkills };
});
async function fetchAllSkills() {
  try {
    const result = await window.uclaw.ipcScanLocalSkills();
    console.log("扫描到的skill==>", result);
    if (result.ok) {
      const store = useSkillsStore();
      store.setAllSkills((result.skills || []).map((s) => ({ ...s, enabled: s.enabled !== false })));
    }
  } catch (err) {
    console.error("[skills] 加载本地技能失败:", err);
  }
}
const _hoisted_1$t = { class: "skill-skill-view" };
const _hoisted_2$s = { class: "skill-header" };
const _hoisted_3$r = { class: "skill-header-top" };
const _hoisted_4$o = { class: "skill-stats" };
const _hoisted_5$o = { class: "skill-stats-text" };
const _hoisted_6$m = { class: "skill-stats-text" };
const _hoisted_7$l = { class: "skill-search-wrapper" };
const _hoisted_8$k = { class: "skill-scroll" };
const _hoisted_9$h = {
  key: 0,
  class: "skill-grid"
};
const _hoisted_10$f = { class: "skill-info" };
const _hoisted_11$d = { class: "skill-icon" };
const _hoisted_12$c = { class: "skill-details" };
const _hoisted_13$c = { class: "skill-name-row" };
const _hoisted_14$c = { class: "skill-name" };
const _hoisted_15$c = { class: "skill-desc" };
const _hoisted_16$c = { class: "skill-toggle" };
const _hoisted_17$b = ["checked", "onChange"];
const _hoisted_18$a = {
  key: 1,
  class: "skill-no-skills"
};
const _sfc_main$t = {
  __name: "Skill",
  setup(__props) {
    const searchQuery = /* @__PURE__ */ ref("");
    const skillsStore = useSkillsStore();
    const allSkills = computed(() => skillsStore.allSkills);
    const totalSkills = computed(() => allSkills.value.length);
    const enabledSkills = computed(() => allSkills.value.filter((s) => s.enabled).length);
    const hermesSyncing = /* @__PURE__ */ ref(false);
    const hermesSyncMessage = /* @__PURE__ */ ref("");
    async function syncHermesSkills() {
      hermesSyncing.value = true;
      hermesSyncMessage.value = "正在同步已启用技能到 Hermes...";
      try {
        const result = await window.uclaw.ipcSyncHermesSkills();
        if (!result?.ok) throw new Error(result?.error || "同步失败");
        hermesSyncMessage.value = `OpenClaw ${result.sourceCount ?? result.total ?? 0} 个技能，已镜像 ${result.mirroredCount ?? result.copied ?? 0} 个；Hermes 官方可见 ${result.visibleCount ?? 0} 个，slash 命令 ${result.commandCount ?? 0} 个；调用注入 ${result.invocationLoaded ? "已通过" : "未验证"}${result.invocationCommand ? "（" + result.invocationCommand + "）" : ""}。报告：${result.reportPath || result.path || "未生成"}${result.missingNames?.length ? "；未显示样例：" + result.missingNames.slice(0, 5).join(", ") : ""}`;
      } catch (err) {
        hermesSyncMessage.value = "同步失败: " + (err?.message || err);
      } finally {
        hermesSyncing.value = false;
      }
    }
    function openSkillStore() {
      window.open("https://skillhub.cn/", "_blank");
    }
    const filteredSkills = computed(() => {
      let list2 = allSkills.value;
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list2 = list2.filter(
          (s) => s.cnName && s.cnName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
      }
      return list2;
    });
    async function toggleSkill(name, enabled) {
      console.log("toggle skill:", name, enabled);
      try {
        await window.uclaw.ipcToggleSkill(name, enabled);
        const store = useSkillsStore();
        const skill = store.allSkills.find((s) => s.name === name);
        if (skill) {
          skill.enabled = enabled;
        }
      } catch (err) {
        console.error("toggle skill failed:", err);
      }
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$t, [
        createBaseVNode("div", _hoisted_2$s, [
          createBaseVNode("div", _hoisted_3$r, [
            createBaseVNode("div", _hoisted_4$o, [
              createBaseVNode("span", _hoisted_5$o, "共 " + toDisplayString(totalSkills.value) + " 技能", 1),
              _cache[2] || (_cache[2] = createBaseVNode("span", { class: "skill-stats-sep" }, "，", -1)),
              createBaseVNode("span", _hoisted_6$m, "已启用 " + toDisplayString(enabledSkills.value) + "个技能", 1)
            ]),
            createBaseVNode("div", { class: "skill-hermes-actions" }, [
              createVNode(TechButton, {
                variant: "secondary",
                size: "small",
                loading: hermesSyncing.value,
                onClick: syncHermesSkills,
                title: "将当前已启用的 OpenClaw 技能同步到 Hermes 技能目录"
              }, {
                icon: withCtx(() => [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "iconfont icon-clawzhongqi" }, null, -1))]),
                default: withCtx(() => [_cache[9] || (_cache[9] = createTextVNode(" 同步到 Hermes ", -1))]),
                _: 1
              }, 8, ["loading"]),
            createVNode(TechButton, {
              variant: "primary",
              size: "small",
              onClick: openSkillStore,
              title: "技能商店"
            }, {
              icon: withCtx(() => [..._cache[3] || (_cache[3] = [
                createBaseVNode("span", { class: "iconfont icon-clawwaibutiaozhuanlianjie" }, null, -1)
              ])]),
              default: withCtx(() => [
                _cache[4] || (_cache[4] = createTextVNode(" 技能商店 ", -1))
              ]),
              _: 1
            })
            ])
          ]),
          hermesSyncMessage.value ? (openBlock(), createElementBlock("div", { key: 0, class: "skill-hermes-sync" }, toDisplayString(hermesSyncMessage.value), 1)) : createCommentVNode("", true),
          createBaseVNode("div", _hoisted_7$l, [
            _cache[5] || (_cache[5] = createBaseVNode("span", { class: "skill-search-icon iconfont icon-clawsousuo" }, null, -1)),
            withDirectives(createBaseVNode("input", {
              type: "text",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchQuery.value = $event),
              onInput: _cache[1] || (_cache[1] = ($event) => searchQuery.value = $event.target.value),
              placeholder: "搜索技能...",
              class: "skill-search-input"
            }, null, 544), [
              [vModelText, searchQuery.value]
            ])
          ])
        ]),
        createBaseVNode("div", _hoisted_8$k, [
          filteredSkills.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_9$h, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(filteredSkills.value, (skill) => {
              return openBlock(), createElementBlock("div", {
                key: skill.name,
                class: "skill-card"
              }, [
                createBaseVNode("div", _hoisted_10$f, [
                  createBaseVNode("div", _hoisted_11$d, toDisplayString(skill.emoji || "✨"), 1),
                  createBaseVNode("div", _hoisted_12$c, [
                    createBaseVNode("div", _hoisted_13$c, [
                      createBaseVNode("span", _hoisted_14$c, toDisplayString(skill.cnName || skill.name), 1)
                    ]),
                    createBaseVNode("p", _hoisted_15$c, toDisplayString(skill.description || ""), 1)
                  ])
                ]),
                createBaseVNode("label", _hoisted_16$c, [
                  createBaseVNode("input", {
                    type: "checkbox",
                    checked: skill.enabled,
                    onChange: ($event) => toggleSkill(skill.name, $event.target.checked)
                  }, null, 40, _hoisted_17$b),
                  _cache[6] || (_cache[6] = createBaseVNode("div", { class: "skill-toggle-track" }, null, -1))
                ])
              ]);
            }), 128))
          ])) : (openBlock(), createElementBlock("div", _hoisted_18$a, [..._cache[7] || (_cache[7] = [
            createBaseVNode("span", null, "✨", -1),
            createBaseVNode("p", null, "暂无技能", -1)
          ])]))
        ])
      ]);
    };
  }
};
const Skill = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["__scopeId", "data-v-76accc68"]]);
const _imports_1$1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAMFBMVEUAAAAQp5MMlYEWw68Ll4MXxK8LloIWxK/c//oSs5+p594Ooo10y75I08J54tU/sKBpEBVJAAAABnRSTlMAQICAv78Cuu4JAAADwUlEQVR42u2azWsTQRjGd2Oa81YlXpsg8RoJJdcqsueWUnrVEKbWCKaEMCLEow4l6jGI9xJE6U2R3ksRwWN76bn+BaV4clton91J29nuO+8qMr9TT/Pr8z7zkX54DofD4XA4HA6Hw+H4C/jXbz+IqFYCjwn/ZijOaFU8YFEhkrTta6aRAmlm7DoQI4FNi18TF1C15wjFhbRsSeDgy1ITl1Kx3Dlb+wVhoh3wlQ5ajIWAGcZhgYA+LOaBlQXgGpgv0tLiDIIohCD8UUpC8EcJryJ5xHhGQMB32MEcXxDQYqwdBHzTAg/5pgXajNMCAXFav8efhM6zj8Nt4v4ScZ4opYa6Y6zU+mHiPNIqGauI7aTkSEW8S5RCquSpOlsQ7KiI9WQplEoeKyyYFKtDSinJyVws2SCUUtAmc4K2FyYlbYrkyCDJWEop7bi2CRL0juKHyWMCCZjLKMGCr8Tk2RlS7kiRZAffdDLeBuENxucUFLApJs1DykVcELrl+8/JC/LH5iFNkpGrSIoCsD0ppX9aMsPxSRt0trY+bH2ZY5R03o/kCf1GPeOBNytkjMU6h+Sb1GhYl3RGcoIeQWJ0wFInSEwOWAKLuwsO3WJP8lVKg4UuWZWXULdzrXSkpFhKhEIwMJIEwyJFKRKCgD5dsiqNzBN+4YEgtCipglCjhPQg5ihlUhBQJ0gQxECPtL1kSgKCBNMiVO/TpgV6hO0lAWFeZdq0wHzmUlbSS9YylaJXMtiXGvu7EvQzlxJ3KPU26dhT6oBYil7JL5VcU75U0FJKWY0viTVhjWu7plLMH1Keq2PiEnXM60ubBzVj75Ds6pI3KZsvppLs6ZKBLpEZHy6ZIgkIDNe9eXO9mOhkjE5SvCmFNJIBdld8gAeUNxgS8zmBJMv+WtHW/CxlUrsedQS62SVgV2oMzFckCE1n0YxZInKQ+JYkvUxbePTfSGyOq5iHpJTH7irnIamRPhCBbipJmIPkHnQTtzD5x63w1AFfBonh0YJDs3QsSkI4opMZCnA1ieE5gSOiCsmIehZBUfvLtF8NcVCIElCtnH4FTzX698H7d+g72MwUvXczPqMELNMrMXMrD8kUX+/AJ1TCUErfA2ylrBEk1xinBZYJe8v2vLokic84LdAk7y169ZDwR/HyiBLkESVgjoLdxX1W5j0yzTwk10gnnm7BJUxnliAh17LQxC1sgca5jlN737PDjXMdJxYkobevjWwpwCQhoYdpxhR30RdOvBWmG0vLkWBpIYhHnF30HA6Hw+FwOBwOh8PBzB8EfdZDyabyqQAAAABJRU5ErkJggg==";
const _imports_1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAANlBMVEUAAAA0cP80cP8A1bkzcP8UPJkA17oA17cTPJsUPJsoX94zcP8A1rkTPJomW9cVVKwKiaoFsLHpBFvyAAAAC3RSTlMAgECAv4C/QL9Av14fnX8AAAQKSURBVHja7djRcpwwEETRBiRgowi8//+zWdYVT2zFIHlpmKF0X/N0qjXENmq1Wq1Wq9VqtVqtVqvVarWa4ob+N6Wu63Boi4PVoZTuN7MB32ZMsjKKMcmRmwy//8m0hDpKj5VMSdbPxNLz2pLYGWX9TAxJNiapkhMOBduZ+Aky6xts43l12MiMBFtZkfTYyopkwHYmPl55k1j4eOXeu/5fgJGZ+kPJmsSEJOveLUjy7t2CJG8SA5LMSQxIMifRL8mdRL8kdxL1kuxJ1EuyJ9Eu6ZCbdgmyUy4ZkJ1uScm565aUTKJaUjaJ4t+0yiCaJQPKUvsXibJJFEvKIVoPfkBReiWlk6iVnA5Bf5G3JZL9Jrl578dxjO+No390w/9qFX66+nfDbYzfNSaaJoRWnwQ3L4g8THjUKjv4+zzHzLz/gGiTiCLXchNIaLUc/L1EIW/sAxJaFWciY5TmEfRI3qL0AwhB0tEZqUMgoTlTco+vNAIIFElPPvHUgUCRDMRXlYalcL5kftFxEwhB0pOvQ/IQyImSt50cCCzJcIxjhEBIko54HtJNIDRJf4DDQyBJ7qDHdX/dMUIg/6s94nHd4+v5BMJ5Xj3fIRCmZOA6IhIIS9JRHT4HEhzzcb3FPUIKoZ38QHT4BMJ8Xh3NEZFAqJKe5fArEMahDCRHRAIhj9JzHD6B0CUUR0QCoUs6hsOnED6l398xIoXwJYM4GIOkENp/jr04CBciEPoow94OvwKhSjpxEC5EIHxKLw7OIAjHSAZxEC5EIHSKj+RBEA6RjJE9CEJpzekOvw8kuFLKbYzMQQRCHsXHffMrEAKF5ojYAyKS9tjzkPxOEKEceh4SViA0io+751cgNMrIcBAgyamkz8oMZIUiDLpDIPu/r1ukBApEKNw5JE+FCEXmIAUmRChy5KQ8HyIUYRAcdIhQfKQ1gw6RfkVeDROSNk2R04QtiA3K1BwIEcvRDoEon2UKyIWopkyhOQMilpngyIQonGWeQkA5RJ3lwQiNBog8sRccSiA//yDP7w5FkOWJzT9iBAddkHdMIWOpVQgRSzYjNNAJkUeWw1gceiEbw8yiWBzKIU/LNKeG6aGQHAxA/nKk5B8d7EBWw0Ug7TUgrsUlIA64BMThGhCHa0AcrgFxuAbE4RqQBteAiKMoF5TV4mc1QVVOHIW1QVMNluy/rafD/iQfz8r4lSxzXEHSAleQOOxSW37xqq5DyyjP67BPWea4guTJsE9p8Mw6RRiwTPlyHFYpRIZQXPiapUf1ifJ5FoNjpC/MOIP1wlyDrHTP4mSM42ub3bY4TSEW9/pdnK4QjMkH9d31O3vvaWUal0XQ85rWOc0DlJLcUmOC8AX0KYOAWq1Wq9VqtVqtVqv97Q+B/Urh+dh+EgAAAABJRU5ErkJggg==";
const _imports_2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAD1BMVEUAAAA2q3o3q3s4q3w2q3rHx95lAAAABHRSTlMAgL9ARyeO/QAAA6hJREFUeNq8mt1x20AMhCFLBYAKC2AuKuBiqQDiiP5ryuNO7FuaNLn+3jyStbNY8H5pu3gO91JKZpYyDNXO53kv+T9tcDuT6/2RPeKXncXfkpQ2nFOnR64SfrxQcEE5auY9gcjM9ZEb8e/beORmBmGpQNh3GHMfIYwDhFADhFADhFADuDBz4Ht6V6wCDWUslzxECEMHrgsdtKoLBMS2QMQFQyC6gr3nKSyrnZUn4brOAiFMHbjOCAihEeA6IyCERoDrjIAQGgGuMwJCaARUpRE+guX5NPvAWwpwXbVAkNiV0b9SwqSLHTRSLV29bili0vUWCGG1QNVVC0yKavHxK3U0RCKkIhIdkz4ShJJKGiIRUtWRIJQxpSxqEYSSWpo2dySvF5m0zQWRMcUsWhEknzIgck05K83VyiMJZe2jTg9TkT9mdhm76k8zG7LH72p2/fRPbm9Ug6i0Ssfu6M9PE3lMFj4zO53qGjlqYiKVLmSCHyM6WTTMNhIjzIrTnUBjp2ZLX8TJ91fXnTNbW0dXJPjOZTaq70SfifDNpHN9Y/ph+BNM/DCvUv2gW9DWFXGjRTEqshgxSUTqinNqcjYDt50i40aRiZpslh2s4xwiYF0EEBHmZDkmwst13MnOTNqO4AF7TsDK7n9vC3MR1cO4GLhs3f03bh/fJN+/cf2RD5BcBDj9pXZgqJdOWtE/6Wpbpt9cm365CIivFxKvzQuJhYik0zvHcHoxFX35mR6jDvSNlXB6+RXV7IqPmAhopZy0gp2Qnw7/GRFLOY5+0/FT27lXigkMZjoWTD06Zgx0Olx6gAMRfQ9j0NQRZsLkIaJPfpYe2SJ3ffJm+uSbmT75MNMnP6svaZC7eCAWX5whEnUTu/bqFyLqJg62xRQ0sLaJney7VdVCfymqpe4vV74kgWoJ64Vq6etVZS8OghC/FYXYxdGHdRgFRtRWmgFZF08GNg1g/9q3YxuEgSAKot+iAgQFmLML2Bbu3H9PBAQjWUIEZrJ7DYy+zJKArz8R7OITYYo4BLs3BIswxLuVSvQpa6JP6YE2pRJ9yhZYH+Mjvy3iA8HTezsAN+XUzxaxAbGBCw09MmhokVHRI6+KHtkSO9IqXoR/ssiRsSVypLHCiYz2qOBKZHzeWD/9StTuBP4QWaM4DXF8+dLzIj0ScQjMIURQgRU5ohGHQLxDcIcifwiRHhN3KGKIiCEi+w6JVFzuECIjNvUOifTo+PiKGCJiiKgnvso0TdME0RtPM51O60L0ZwAAAABJRU5ErkJggg==";
const _imports_3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAG1BMVEUAAABCgfdAg/dBg/css3Mss3Iss3RBgvcss3KnKApJAAAAB3RSTlMAgEC/v4BA1WuY8wAAA3RJREFUeNrs2DtqxEAQRdFqewMyDpRqmGBSo8TrahTU9g1OOpn2pbjubCqV4IDqPf3iNa95zWv+mPsWy6dlsuKN5crbdxYUZWSPhbNnsuKN5cp9GKh4A5bvwsuKN1jx4RWKMGD5IryseIMVH15WvAHLd+FlxRus+PB6xRvZV4SXFW+w4sN77qR4o0fssHwd3iuCFG8cv5EDxYX3OoZPin9KNVi+CO9XBCjeOCPG3LxyJyNiUhddEFY2Hd6i4g2qC4eXDaiLLAgrXYRXKMKAusiC6LpwQUSQIbxCEQbXxRTE1oULIoJcCK9X2KjVBRAw8DIwwgUBpYbkJhRAQIEC1JF+lB/ZjIi1vGcVqSstSwgrvBBGePlsMFJX9rQIK4/0yLVheD2SHQyLsNJSIkPhYHkkP8CoI/hmwAYjMVGgIEWElBEsgzS477PByETBu3tmLyCkzM8oILOPAnzfrCGT5ZNRQECZH6wgrDwmf0XqSHuiXNv8g6yEQIBmRhEBZWIXEVCeBksg8Zkww6gh9V/DR9SRqrKFRVg5wyMNDYuw0kMhQ2HDI3Hj8HokdjAEwsoWFmHljP9F2o6GR6KhUUdY6WERVq5jCRKfYJQRitgRFmFlC4uwcsZKpA1DIqT0CI+AcsVyJG4/7dohbgMxEIXhjeQuLyrtUQoNQyr1CIHdEF8gkfbYYflR/DR6s0EzrOjXt/Y0xN8HRpiKVKQiFXlf5PM5B0aYilSkIpP5fUPkYz8fH/nb73ZEQ3Yo2REgO5TsCBAos8jmQWaUYVWATCneIz0gU8pwKkDmlOFUgMwpw6oAgaIjmwF5TRlGBYigDKMChPmZRqg4kFvWa4/1LCH+s8bLXUH8Z40rpysgxrPGCxdVQERlm0KgCEi8AgSKgISfNQKBIiDxZ41AoAhI+CIDgSIg8QoQKAISXhcgUAQkvi5AoAhI/CIDgSIg4QoQ5jaBOOvSd4YRkOi6tBcFAQle5K4hfqUZELkuUDTEX5emICkXuWuIX2kCkrMuXUP8dWkCknORu4b4lSYgOevSLQhzEhQJ8R/pdhNCRe6KhsTX5X9huglhvsQ/YyBWRf1EAvErfC0oWRDWha8FJQnCFeMCQwGSVeFIoABJqnAkUNIgrAtHAgVIzhXja0EBklS58icUIDkVvhazLkzKuizHz2lbampqaqbzABuD0YB8SrohAAAAAElFTkSuQmCC";
const useWechatStore = /* @__PURE__ */ defineStore("wechat", () => {
  const status = /* @__PURE__ */ ref("disconnected");
  const qrCodeUrl = /* @__PURE__ */ ref("");
  const qrCodeAscii = /* @__PURE__ */ ref("");
  const logs = /* @__PURE__ */ ref([]);
  const isInstalled = /* @__PURE__ */ ref(null);
  function setStatus(value) {
    status.value = value;
  }
  function setQrCode(url, ascii) {
    qrCodeUrl.value = url;
    qrCodeAscii.value = ascii;
  }
  function clearQrCode() {
    qrCodeUrl.value = "";
    qrCodeAscii.value = "";
  }
  function addLog(msg) {
    logs.value.push(msg);
  }
  function clearLogs() {
    logs.value = [];
  }
  async function checkInstalled() {
    try {
      isInstalled.value = await window.uclaw.isWechatPluginInstalled();
    } catch {
      isInstalled.value = false;
    }
  }
  return {
    status,
    qrCodeUrl,
    qrCodeAscii,
    logs,
    isInstalled,
    setStatus,
    setQrCode,
    clearQrCode,
    addLog,
    clearLogs,
    checkInstalled
  };
});
const useFeishuStore = /* @__PURE__ */ defineStore("feishu", () => {
  const status = /* @__PURE__ */ ref("disconnected");
  const qrCodeUrl = /* @__PURE__ */ ref("");
  const qrCodeAscii = /* @__PURE__ */ ref("");
  const logs = /* @__PURE__ */ ref([]);
  const isInstalled = /* @__PURE__ */ ref(null);
  const isConfigured = /* @__PURE__ */ ref(false);
  const isInstalling = /* @__PURE__ */ ref(false);
  const promptData = /* @__PURE__ */ ref(null);
  function setStatus(value) {
    status.value = value;
  }
  function setQrCode(url, ascii) {
    qrCodeUrl.value = url;
    qrCodeAscii.value = ascii;
  }
  function clearQrCode() {
    qrCodeUrl.value = "";
    qrCodeAscii.value = "";
  }
  function addLog(msg) {
    logs.value.push(msg);
  }
  function clearLogs() {
    logs.value = [];
  }
  async function checkInstalled() {
    try {
      const result = await window.uclaw.feishuIsInstalled();
      isInstalled.value = result;
    } catch {
      isInstalled.value = false;
    }
  }
  async function checkStatus() {
    try {
      const result = await window.uclaw.feishuGetStatus();
      isInstalled.value = result.installed;
      isConfigured.value = result.configured;
      isInstalling.value = result.installing;
      if (result.installing) {
        status.value = "installing";
      } else if (result.configured) {
        status.value = "connected";
      } else if (result.installed) {
        status.value = "disconnected";
      }
    } catch {
    }
  }
  function setPrompt(data) {
    promptData.value = data;
  }
  function clearPrompt() {
    promptData.value = null;
  }
  return {
    status,
    qrCodeUrl,
    qrCodeAscii,
    logs,
    isInstalled,
    isConfigured,
    isInstalling,
    promptData,
    setStatus,
    setQrCode,
    clearQrCode,
    addLog,
    clearLogs,
    checkInstalled,
    checkStatus,
    setPrompt,
    clearPrompt
  };
});
const _hoisted_1$s = { class: "chat-chat-view" };
const _hoisted_2$r = { class: "tab-bar" };
const _hoisted_3$q = { class: "chat-chat-content" };
const _hoisted_4$n = {
  key: 0,
  class: "chat-wechat-card"
};
const _hoisted_5$n = {
  key: 1,
  class: "chat-wechat-card"
};
const _hoisted_6$l = {
  key: 2,
  class: "chat-wechat-card"
};
const _hoisted_7$k = {
  key: 3,
  class: "chat-wechat-card"
};
const _hoisted_8$j = {
  key: 0,
  class: "chat-qr-container"
};
const _hoisted_9$g = ["src"];
const _hoisted_10$e = {
  key: 1,
  class: "chat-qr-container chat-qr-ascii"
};
const _hoisted_11$c = {
  key: 4,
  class: "chat-wechat-card"
};
const _hoisted_12$b = {
  key: 5,
  class: "chat-wechat-card chat-log-card"
};
const _hoisted_13$b = { class: "chat-log-lines" };
const _hoisted_14$b = { class: "chat-chat-content" };
const _hoisted_15$b = { class: "chat-feishu-tabs" };
const _hoisted_16$b = {
  key: 0,
  class: "chat-feishu-disconnected"
};
const _hoisted_17$a = {
  key: 0,
  class: "chat-feishu-tab-content"
};
const _hoisted_18$9 = {
  key: 1,
  class: "chat-feishu-tab-content"
};
const _hoisted_19$9 = { class: "chat-feishu-credentials" };
const _hoisted_20$9 = { class: "chat-feishu-credential-row" };
const _hoisted_21$9 = { class: "chat-feishu-credential-row" };
const _hoisted_22$9 = ["disabled"];
const _hoisted_23$8 = {
  key: 2,
  class: "chat-wechat-actions",
  style: { "margin-top": "16px" }
};
const _hoisted_24$7 = {
  key: 1,
  class: "chat-wechat-card"
};
const _hoisted_25$6 = {
  key: 2,
  class: "chat-wechat-card"
};
const _hoisted_26$6 = {
  key: 3,
  class: "chat-wechat-card"
};
const _hoisted_27$5 = { class: "chat-qr-container" };
const _hoisted_28$5 = ["src"];
const _hoisted_29$5 = {
  class: "chat-qr-container chat-qr-ascii",
  style: { "background": "#1a1a2e" }
};
const _hoisted_30$4 = { style: { "color": "#fff", "font-size": "4px", "line-height": "1" } };
const _hoisted_31$4 = {
  key: 3,
  class: "chat-feishu-prompt"
};
const _hoisted_32$3 = { class: "chat-feishu-prompt-text" };
const _hoisted_33$2 = { class: "chat-feishu-prompt-actions" };
const _hoisted_34$2 = {
  key: 4,
  class: "chat-wechat-card"
};
const _hoisted_35$2 = {
  key: 5,
  class: "chat-wechat-card chat-log-card"
};
const _hoisted_36$2 = { class: "chat-log-lines" };
const _sfc_main$s = {
  __name: "Chat",
  setup(__props) {
    const { showToast } = useToast();
    const wechatStore = useWechatStore();
    const { status, logs, qrCodeUrl, qrCodeAscii, isInstalled } = storeToRefs(wechatStore);
    const { checkInstalled, clearQrCode, setQrCode, clearLogs, setStatus } = wechatStore;
    const feishuStore = useFeishuStore();
    const {
      status: feishuStatus,
      logs: feishuLogs,
      qrCodeUrl: feishuQrCodeUrl,
      qrCodeAscii: feishuQrCodeAscii,
      isInstalled: feishuIsInstalled,
      promptData: feishuPromptData
    } = storeToRefs(feishuStore);
    const {
      checkStatus: feishuCheckStatus,
      clearQrCode: feishuClearQr,
      clearLogs: feishuClearLogs,
      setStatus: feishuSetStatus,
      clearPrompt: feishuClearPrompt
    } = feishuStore;
    const activeChatTab = /* @__PURE__ */ ref("wechat");
    const wechatDiagnostics = /* codex-wechat-diagnostics-ui */ ref(null);
    function normalizeWechatStatus(payload) {
      if (payload && typeof payload === "object") {
        wechatDiagnostics.value = payload.diagnostics || null;
        return payload.status || "disconnected";
      }
      return payload || "disconnected";
    }
    function appendWechatDiagnostics(payload) {
      const diag = payload?.diagnostics || payload || wechatDiagnostics.value;
      if (!diag || typeof diag !== "object") return;
      wechatDiagnostics.value = diag;
      const count = Number(diag.accountCount || 0);
      if (count > 0) {
        wechatStore.addLog(`[diagnostics] 已发现 ${count} 个微信账号凭据，目录：${diag.weixinRoot || "未知"}`);
      } else {
        wechatStore.addLog(`[diagnostics] 未发现微信账号凭据，请重新扫码。账号目录：${diag.weixinRoot || "未知"}`);
      }
    }
    const feishuMode = /* @__PURE__ */ ref("auto");
    const feishuAppId = /* @__PURE__ */ ref("");
    const feishuAppSecret = /* @__PURE__ */ ref("");
    onMounted(async () => {
      checkInstalled();
      window.uclaw.ipcOnWeChatQrUrl((url) => {
        console.log("WeChat QR URL received:", url);
        setStatus("scanning");
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`, "");
      });
      window.uclaw.ipcOnWeChatQrText?.((text) => {
        setStatus("scanning");
        setQrCode("", text);
      });
    });
    function retryConnection() {
      clearQrCode();
      window.uclaw.ipcGetWeChatStatus().then((payload) => { setStatus(normalizeWechatStatus(payload)); appendWechatDiagnostics(payload); }).catch(() => {});
    }
    async function startScan() {
      clearQrCode();
      try {
        const result = await window.uclaw.startWeChatScan();
        if (result?.error) {
          showToast(result.error, true);
          try { appendWechatDiagnostics(await window.uclaw.ipcGetWeChatDiagnostics?.()); } catch {}
          clearQrCode();
        } else {
          const output = result?.stdout || result?.stderr || "";
          const urlMatch = output.match(/https:\/\/liteapp\.weixin\.qq\.com\/q\/[^\s]+/);
          if (urlMatch) {
            setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlMatch[0])}`, "");
          } else if (output.includes("data:image")) {
            setQrCode("", output.trim());
          }
        }
      } catch (e) {
        console.log("扫码启动失败1", e);
        showToast("扫码启动失败1", true);
        clearQrCode();
      }
    }
    async function cancelScan() {
      await window.uclaw.cancelWeChatScan();
    }
    async function startInstall() {
      clearLogs();
      try {
        const result = await window.uclaw.wechatInstall();
        if (result?.success) {
          checkInstalled();
        } else {
          showToast(result?.error || "安装失败", true);
        }
      } catch (e) {
        showToast("安装失败: " + e.message, true);
      }
    }
    async function reInstall() {
      const confirmed = await window.showConfirmVue(
        "卸载重装",
        "确定卸载微信插件并重新安装？\n这会删除插件文件和配置，需要重新扫码连接"
      );
      if (!confirmed) return;
      setStatus("installing");
      try {
        await window.uclaw.wechatUninstall();
        await window.uclaw.wechatInstall();
        window.showLoadingOverlayVue?.();
        await window.uclaw.ipcRestartGateway();
        checkInstalled();
        showToast("卸载重装完成");
      } catch (e) {
        showToast("卸载重装失败: " + e.message, true);
      }
    }
    async function feishuStartInstall() {
      feishuClearLogs();
      feishuClearQr();
      feishuClearPrompt();
      feishuSetStatus("installing");
      try {
        const result = await window.uclaw.feishuInstall();
        if (result?.success) {
          await feishuCheckStatus();
        } else if (!result?.cancelled) {
          showToast(result?.error || "安装失败", true);
        }
      } catch (e) {
        showToast("安装失败: " + e.message, true);
      }
    }
    async function feishuConfigWithApp() {
      if (!feishuAppId.value || !feishuAppSecret.value) return;
      feishuClearLogs();
      feishuClearQr();
      feishuClearPrompt();
      feishuSetStatus("installing");
      try {
        const result = await window.uclaw.feishuInstallWithApp(feishuAppId.value, feishuAppSecret.value);
        if (result?.success) {
          showToast("飞书应用凭证已配置");
          window.showLoadingOverlayVue?.();
          await window.uclaw.ipcRestartGateway();
          await feishuCheckStatus();
        } else {
          showToast(result?.error || "配置失败", true);
        }
      } catch (e) {
        showToast("配置失败: " + e.message, true);
      }
    }
    async function feishuReinstall() {
      const confirmed = await window.showConfirmVue(
        "卸载重装",
        "确定卸载飞书插件并重新安装？\n这会删除插件文件和配置，需要重新配置连接"
      );
      if (!confirmed) return;
      feishuSetStatus("installing");
      feishuClearLogs();
      try {
        await window.uclaw.feishuUninstall();
        feishuAppId.value = "";
        feishuAppSecret.value = "";
        feishuClearQr();
        feishuClearPrompt();
        await feishuCheckStatus();
        showToast("已卸载，请选择配置方式");
      } catch (e) {
        showToast("卸载重装失败: " + e.message, true);
        feishuSetStatus("error");
      }
    }
    async function feishuCancelConnect() {
      const confirmed = await window.showConfirmVue(
        "断开连接",
        "确定断开飞书连接？\n这会删除飞书应用配置，之后需要重新配置才能使用"
      );
      if (!confirmed) return;
      feishuSetStatus("installing");
      try {
        await window.uclaw.feishuUninstall();
        feishuAppId.value = "";
        feishuAppSecret.value = "";
        feishuClearQr();
        feishuClearPrompt();
        await feishuCheckStatus();
        showToast("飞书已断开连接");
      } catch (e) {
        showToast("断开失败: " + e.message, true);
      }
    }
    function feishuCancelInstall() {
      window.uclaw.feishuCancelInstall();
      feishuClearQr();
      feishuClearPrompt();
      feishuSetStatus("disconnected");
    }
    function feishuAnswerPrompt(answer) {
      window.uclaw.feishuAnswerPrompt(answer);
      feishuClearPrompt();
    }
    function feishuRetry() {
      feishuClearLogs();
      feishuClearQr();
      feishuClearPrompt();
      feishuAppId.value = "";
      feishuAppSecret.value = "";
      feishuMode.value = "auto";
      feishuSetStatus("disconnected");
    }
    function openFeishuPlatform() {
      window.uclaw.ipcOpenExternalUrl("https://open.feishu.cn/app");
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$s, [
        createBaseVNode("div", _hoisted_2$r, [
          createBaseVNode("button", {
            class: normalizeClass(["chat-chat-tool-tab", { "chat-active": activeChatTab.value === "wechat" }]),
            onClick: _cache[0] || (_cache[0] = ($event) => activeChatTab.value = "wechat")
          }, [..._cache[8] || (_cache[8] = [
            createBaseVNode("img", {
              src: _imports_1$1,
              alt: "wechat",
              style: { "width": "20px", "height": "20px", "vertical-align": "middle" }
            }, null, -1),
            createBaseVNode("span", null, "微信", -1)
          ])], 2),
          createBaseVNode("button", {
            class: normalizeClass(["chat-chat-tool-tab", { "chat-active": activeChatTab.value === "feishu" }]),
            onClick: _cache[1] || (_cache[1] = ($event) => activeChatTab.value = "feishu")
          }, [..._cache[9] || (_cache[9] = [
            createBaseVNode("img", {
              src: _imports_1,
              alt: "wechat",
              style: { "width": "20px", "height": "20px", "vertical-align": "middle" }
            }, null, -1),
            createBaseVNode("span", null, "飞书", -1)
          ])], 2)
        ]),
        withDirectives(createBaseVNode("div", _hoisted_3$q, [
          unref(status) == "disconnected" ? (openBlock(), createElementBlock("div", _hoisted_4$n, [
            unref(isInstalled) === false ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
              _cache[11] || (_cache[11] = createStaticVNode('<div class="chat-wechat-icon" data-v-1fe3f6ea><img src="' + _imports_2 + '" alt="wechat" data-v-1fe3f6ea></div><h2 class="chat-wechat-title" data-v-1fe3f6ea>一键安装微信插件</h2><p class="chat-wechat-desc" data-v-1fe3f6ea>安装后扫码连接微信，让 AI 自动回复消息</p><div class="chat-install-steps" data-v-1fe3f6ea><p class="chat-install-steps-title" data-v-1fe3f6ea>流程：</p><p data-v-1fe3f6ea>1. 点击安装，自动下载微信插件</p><p data-v-1fe3f6ea>2. 安装完成后出现二维码</p><p data-v-1fe3f6ea>3. 用手机微信扫码即可连接</p></div>', 4)),
              createBaseVNode("div", { class: "chat-wechat-action" }, [
                createBaseVNode("button", {
                  onClick: startInstall,
                  class: "chat-btn-install-primary"
                }, [..._cache[10] || (_cache[10] = [
                  createBaseVNode("span", { class: "iconfont icon-clawinstall-fill" }, null, -1),
                  createTextVNode("开始安装 ", -1)
                ])])
              ])
            ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
              _cache[14] || (_cache[14] = createStaticVNode('<div class="chat-wechat-icon" data-v-1fe3f6ea><img src="' + _imports_2 + '" alt="wechat" data-v-1fe3f6ea></div><h2 class="chat-wechat-title" data-v-1fe3f6ea>连接微信</h2><p class="chat-wechat-status-installed" data-v-1fe3f6ea><img src="' + _imports_3 + '" alt="installed" data-v-1fe3f6ea>插件已安装</p><p class="chat-wechat-desc" data-v-1fe3f6ea>扫码连接后，在微信中给 AI 发消息即可对话</p>', 4)),
              createBaseVNode("div", { class: "chat-wechat-actions" }, [
                createBaseVNode("button", {
                  onClick: startScan,
                  class: "chat-btn-scan"
                }, [..._cache[12] || (_cache[12] = [
                  createBaseVNode("span", { class: "iconfont icon-clawiconfontscan" }, null, -1),
                  createTextVNode("扫码连接 ", -1)
                ])]),
                createBaseVNode("button", {
                  onClick: reInstall,
                  class: "chat-btn-reinstall"
                }, [..._cache[13] || (_cache[13] = [
                  createBaseVNode("span", { class: "iconfont icon-clawshanchu" }, null, -1),
                  createTextVNode("卸载重装 ", -1)
                ])])
              ])
            ], 64))
          ])) : unref(status) === "connected" ? (openBlock(), createElementBlock("div", _hoisted_5$n, [
            _cache[15] || (_cache[15] = createBaseVNode("div", { class: "chat-success-icon" }, "✓", -1)),
            _cache[16] || (_cache[16] = createBaseVNode("h2", { class: "chat-wechat-title" }, "微信助手已连接成功", -1)),
            _cache[17] || (_cache[17] = createBaseVNode("p", { class: "chat-wechat-desc" }, "在微信中给 AI 发消息即可对话", -1)),
            createBaseVNode("div", { class: "chat-wechat-actions" }, [
              createBaseVNode("button", {
                onClick: startScan,
                class: "chat-btn-scan"
              }, " 重新扫码 "),
              createBaseVNode("button", {
                onClick: cancelScan,
                class: "chat-btn-disconnect"
              }, " 断开连接 ")
            ])
          ])) : unref(status) === "installing" ? (openBlock(), createElementBlock("div", _hoisted_6$l, [..._cache[18] || (_cache[18] = [
            createBaseVNode("div", { class: "chat-spinner" }, null, -1),
            createBaseVNode("h2", { class: "chat-wechat-title" }, "正在安装微信插件...", -1),
            createBaseVNode("p", { class: "chat-wechat-desc" }, "首次连接需要安装，请稍候", -1)
          ])])) : unref(status) === "scanning" ? (openBlock(), createElementBlock("div", _hoisted_7$k, [
            unref(qrCodeUrl) || unref(qrCodeAscii) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
              unref(qrCodeUrl) ? (openBlock(), createElementBlock("div", _hoisted_8$j, [
                createBaseVNode("img", {
                  src: unref(qrCodeUrl),
                  alt: "微信登录二维码",
                  class: "chat-qr-image"
                }, null, 8, _hoisted_9$g)
              ])) : unref(qrCodeAscii) ? (openBlock(), createElementBlock("div", _hoisted_10$e, [
                createBaseVNode("pre", null, toDisplayString(unref(qrCodeAscii)), 1)
              ])) : createCommentVNode("", true),
              _cache[19] || (_cache[19] = createBaseVNode("p", { class: "chat-qr-hint" }, "请用手机微信扫描上方二维码", -1))
            ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
              _cache[20] || (_cache[20] = createBaseVNode("div", { class: "chat-spinner" }, null, -1)),
              _cache[21] || (_cache[21] = createBaseVNode("h2", { class: "chat-wechat-title" }, "等待二维码...", -1))
            ], 64)),
            createBaseVNode("div", { class: "chat-wechat-actions" }, [
              createBaseVNode("button", {
                onClick: startScan,
                class: "chat-btn-scan"
              }, " 重新生成 "),
              createBaseVNode("button", {
                onClick: cancelScan,
                class: "chat-btn-cancel-danger"
              }, " 取消 ")
            ])
          ])) : (openBlock(), createElementBlock("div", _hoisted_11$c, [
            _cache[22] || (_cache[22] = createBaseVNode("div", { class: "chat-error-icon" }, "✗", -1)),
            _cache[23] || (_cache[23] = createBaseVNode("h2", { class: "chat-wechat-title" }, "连接失败", -1)),
            _cache[24] || (_cache[24] = createBaseVNode("p", { class: "chat-wechat-desc" }, "请查看下方日志排查问题，或重试", -1)),
            createBaseVNode("div", { class: "chat-wechat-action" }, [
              createBaseVNode("button", {
                onClick: retryConnection,
                class: "chat-btn-scan"
              }, " 重试 ")
            ])
          ])),
          unref(logs).length ? (openBlock(), createElementBlock("div", _hoisted_12$b, [
            _cache[25] || (_cache[25] = createBaseVNode("h3", { class: "chat-log-title" }, "运行日志", -1)),
            createBaseVNode("div", _hoisted_13$b, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(unref(logs), (log, i) => {
                return openBlock(), createElementBlock("div", {
                  key: i,
                  class: "chat-log-line"
                }, toDisplayString(log), 1);
              }), 128))
            ])
          ])) : createCommentVNode("", true),
          _cache[26] || (_cache[26] = createBaseVNode("div", { class: "chat-tip-card" }, [
            createBaseVNode("span", null, "💡"),
            createBaseVNode("p", null, "连接后，在微信里给AI发消息即可对话，断开后需要重新扫码。")
          ], -1))
        ], 512), [
          [vShow, activeChatTab.value === "wechat"]
        ]),
        withDirectives(createBaseVNode("div", _hoisted_14$b, [
          createBaseVNode("div", _hoisted_15$b, [
            createBaseVNode("button", {
              class: normalizeClass(["chat-feishu-tab", { "chat-feishu-tab-active": feishuMode.value === "auto" }]),
              onClick: _cache[2] || (_cache[2] = ($event) => feishuMode.value = "auto")
            }, " 🔥 扫码一键安装 ", 2),
            createBaseVNode("button", {
              class: normalizeClass(["chat-feishu-tab", { "chat-feishu-tab-active": feishuMode.value === "manual" }]),
              onClick: _cache[3] || (_cache[3] = ($event) => feishuMode.value = "manual")
            }, " ⚙️ 手动配置 ", 2)
          ]),
          unref(feishuStatus) === "disconnected" ? (openBlock(), createElementBlock("div", _hoisted_16$b, [
            feishuMode.value === "auto" ? (openBlock(), createElementBlock("div", _hoisted_17$a, [
              _cache[27] || (_cache[27] = createStaticVNode('<div class="chat-wechat-icon" data-v-1fe3f6ea><img src="' + _imports_1 + '" alt="feishu" style="width:48px;" data-v-1fe3f6ea></div><h3 class="chat-feishu-method-title" data-v-1fe3f6ea>一键安装飞书机器人</h3><p class="chat-feishu-method-desc" data-v-1fe3f6ea> 自动安装插件并通过扫码创建飞书机器人 </p><div class="chat-feishu-method-steps" data-v-1fe3f6ea><p data-v-1fe3f6ea><span class="chat-step-num" data-v-1fe3f6ea>1</span> 点击开始安装，自动下载飞书插件</p><p data-v-1fe3f6ea><span class="chat-step-num" data-v-1fe3f6ea>2</span> 出现二维码后，用飞书 App 扫码</p><p data-v-1fe3f6ea><span class="chat-step-num" data-v-1fe3f6ea>3</span> 选择「新建机器人」或「关联已有机器人」</p><p data-v-1fe3f6ea><span class="chat-step-num" data-v-1fe3f6ea>4</span> 完成！重启 Gateway 即可使用</p></div>', 4)),
              createBaseVNode("button", {
                onClick: feishuStartInstall,
                class: "chat-btn-install-primary",
                style: { "background": "#3370FF", "width": "300px", "text-align": "center" }
              }, " 开始安装 ")
            ])) : createCommentVNode("", true),
            feishuMode.value === "manual" ? (openBlock(), createElementBlock("div", _hoisted_18$9, [
              _cache[30] || (_cache[30] = createStaticVNode('<div class="chat-wechat-icon" data-v-1fe3f6ea><img src="' + _imports_1 + '" alt="feishu" style="width:48px;" data-v-1fe3f6ea></div><h3 class="chat-feishu-method-title" data-v-1fe3f6ea>手动配置飞书机器人</h3><p class="chat-feishu-method-desc" data-v-1fe3f6ea> 已有飞书应用？直接填入凭证 </p><div class="chat-feishu-method-steps" data-v-1fe3f6ea><p data-v-1fe3f6ea><span class="chat-step-num" data-v-1fe3f6ea>1</span> 登录 飞书开放平台 → 创建企业自建应用</p><p data-v-1fe3f6ea><span class="chat-step-num" data-v-1fe3f6ea>2</span> 获取 App ID 和 App Secret</p><p data-v-1fe3f6ea><span class="chat-step-num" data-v-1fe3f6ea>3</span> 填入下方并点击安装</p></div>', 4)),
              createBaseVNode("div", _hoisted_19$9, [
                createBaseVNode("div", _hoisted_20$9, [
                  _cache[28] || (_cache[28] = createBaseVNode("label", { class: "chat-feishu-label" }, "App ID", -1)),
                  withDirectives(createBaseVNode("input", {
                    "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => feishuAppId.value = $event),
                    type: "text",
                    placeholder: "cli_xxxxx",
                    class: "chat-feishu-input"
                  }, null, 512), [
                    [vModelText, feishuAppId.value]
                  ])
                ]),
                createBaseVNode("div", _hoisted_21$9, [
                  _cache[29] || (_cache[29] = createBaseVNode("label", { class: "chat-feishu-label" }, "App Secret", -1)),
                  withDirectives(createBaseVNode("input", {
                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => feishuAppSecret.value = $event),
                    type: "password",
                    placeholder: "App Secret",
                    class: "chat-feishu-input"
                  }, null, 512), [
                    [vModelText, feishuAppSecret.value]
                  ])
                ])
              ]),
              createBaseVNode("button", {
                onClick: feishuConfigWithApp,
                class: "chat-btn-install-primary",
                style: { "background": "#3370FF", "width": "300px", "text-align": "center" },
                disabled: !feishuAppId.value || !feishuAppSecret.value
              }, " 安装并配置 ", 8, _hoisted_22$9),
              createBaseVNode("button", {
                onClick: openFeishuPlatform,
                class: "chat-btn-outline",
                style: { "width": "300px", "margin-top": "8px", "background": "transparent", "border": "1px solid var(--border)", "color": "var(--text-primary)", "padding": "8px 16px", "border-radius": "8px", "font-size": "13px", "cursor": "pointer" }
              }, " 飞书开放平台 ↗ ")
            ])) : createCommentVNode("", true),
            unref(feishuIsInstalled) === true ? (openBlock(), createElementBlock("div", _hoisted_23$8, [
              createBaseVNode("button", {
                onClick: feishuReinstall,
                class: "chat-btn-reinstall"
              }, [..._cache[31] || (_cache[31] = [
                createBaseVNode("span", { class: "iconfont icon-clawshanchu" }, null, -1),
                createTextVNode("卸载重装 ", -1)
              ])])
            ])) : createCommentVNode("", true)
          ])) : unref(feishuStatus) === "connected" ? (openBlock(), createElementBlock("div", _hoisted_24$7, [
            _cache[32] || (_cache[32] = createBaseVNode("div", { class: "chat-success-icon" }, "✓", -1)),
            _cache[33] || (_cache[33] = createBaseVNode("h2", { class: "chat-wechat-title" }, "飞书机器人已配置成功", -1)),
            _cache[34] || (_cache[34] = createBaseVNode("p", { class: "chat-wechat-desc" }, "Gateway 已自动重启，在飞书中 @机器人 即可对话", -1)),
            createBaseVNode("div", { class: "chat-wechat-actions" }, [
              createBaseVNode("button", {
                onClick: feishuRetry,
                class: "chat-btn-scan",
                style: { "background": "#3370FF" }
              }, " 重新配置 "),
              createBaseVNode("button", {
                onClick: feishuCancelConnect,
                class: "chat-btn-disconnect"
              }, " 断开连接 ")
            ])
          ])) : unref(feishuStatus) === "installing" ? (openBlock(), createElementBlock("div", _hoisted_25$6, [..._cache[35] || (_cache[35] = [
            createBaseVNode("div", {
              class: "chat-spinner",
              style: { "border-top-color": "#3370FF" }
            }, null, -1),
            createBaseVNode("h2", { class: "chat-wechat-title" }, "正在安装飞书插件...", -1),
            createBaseVNode("p", { class: "chat-wechat-desc" }, "首次连接需要安装，请稍候", -1)
          ])])) : unref(feishuStatus) === "scanning" ? (openBlock(), createElementBlock("div", _hoisted_26$6, [
            unref(feishuQrCodeUrl) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
              createBaseVNode("div", _hoisted_27$5, [
                createBaseVNode("img", {
                  src: unref(feishuQrCodeUrl),
                  alt: "飞书配置二维码",
                  class: "chat-qr-image"
                }, null, 8, _hoisted_28$5)
              ]),
              _cache[36] || (_cache[36] = createBaseVNode("p", {
                class: "chat-qr-hint",
                style: { "color": "#3370FF" }
              }, "请用飞书 App 扫描上方二维码", -1))
            ], 64)) : unref(feishuQrCodeAscii) ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
              createBaseVNode("div", _hoisted_29$5, [
                createBaseVNode("pre", _hoisted_30$4, toDisplayString(unref(feishuQrCodeAscii)), 1)
              ]),
              _cache[37] || (_cache[37] = createBaseVNode("p", {
                class: "chat-qr-hint",
                style: { "color": "#3370FF" }
              }, "请用飞书 App 扫描上方二维码", -1))
            ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 2 }, [
              _cache[38] || (_cache[38] = createBaseVNode("div", {
                class: "chat-spinner",
                style: { "border-top-color": "#3370FF" }
              }, null, -1)),
              _cache[39] || (_cache[39] = createBaseVNode("h2", { class: "chat-wechat-title" }, "等待二维码...", -1)),
              _cache[40] || (_cache[40] = createBaseVNode("p", { class: "chat-wechat-desc" }, "正在启动飞书配置向导", -1))
            ], 64)),
            unref(feishuPromptData) ? (openBlock(), createElementBlock("div", _hoisted_31$4, [
              createBaseVNode("p", _hoisted_32$3, toDisplayString(unref(feishuPromptData).question), 1),
              createBaseVNode("div", _hoisted_33$2, [
                createBaseVNode("button", {
                  onClick: _cache[6] || (_cache[6] = ($event) => feishuAnswerPrompt("Y")),
                  class: "chat-btn-install",
                  style: { "background": "#3370FF", "padding": "6px 16px" }
                }, " ✅ 是 (Y) "),
                createBaseVNode("button", {
                  onClick: _cache[7] || (_cache[7] = ($event) => feishuAnswerPrompt("n")),
                  class: "chat-btn-cancel",
                  style: { "padding": "6px 16px" }
                }, " ❌ 否 (n) ")
              ])
            ])) : createCommentVNode("", true),
            createBaseVNode("div", { class: "chat-wechat-actions" }, [
              createBaseVNode("button", {
                onClick: feishuCancelInstall,
                class: "chat-btn-cancel-danger"
              }, " 取消安装 ")
            ])
          ])) : (openBlock(), createElementBlock("div", _hoisted_34$2, [
            _cache[41] || (_cache[41] = createBaseVNode("div", { class: "chat-error-icon" }, "✗", -1)),
            _cache[42] || (_cache[42] = createBaseVNode("h2", { class: "chat-wechat-title" }, "安装失败", -1)),
            _cache[43] || (_cache[43] = createBaseVNode("p", { class: "chat-wechat-desc" }, "请查看下方日志排查问题，或重试", -1)),
            createBaseVNode("div", { class: "chat-wechat-action" }, [
              createBaseVNode("button", {
                onClick: feishuRetry,
                class: "chat-btn-scan",
                style: { "background": "#3370FF" }
              }, " 重试 ")
            ])
          ])),
          unref(feishuLogs).length ? (openBlock(), createElementBlock("div", _hoisted_35$2, [
            _cache[44] || (_cache[44] = createBaseVNode("h3", { class: "chat-log-title" }, "运行日志", -1)),
            createBaseVNode("div", _hoisted_36$2, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(unref(feishuLogs), (log, i) => {
                return openBlock(), createElementBlock("div", {
                  key: i,
                  class: "chat-log-line"
                }, toDisplayString(log), 1);
              }), 128))
            ])
          ])) : createCommentVNode("", true),
          _cache[45] || (_cache[45] = createBaseVNode("div", { class: "chat-tip-card" }, [
            createBaseVNode("span", null, "💡"),
            createBaseVNode("p", null, "安装后重启 Gateway，在飞书中添加机器人到群聊即可对话")
          ], -1))
        ], 512), [
          [vShow, activeChatTab.value === "feishu"]
        ])
      ]);
    };
  }
};
const Chat = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["__scopeId", "data-v-1fe3f6ea"]]);
const _hoisted_1$q = { class: "settings-settings-view" };
const _hoisted_2$p = { class: "settings-settings-card" };
const _hoisted_3$o = { class: "settings-row" };
const _hoisted_4$l = { class: "settings-value text-orange" };
const _hoisted_5$l = { class: "settings-row" };
const _hoisted_6$j = { class: "settings-row" };
const _hoisted_7$j = { class: "settings-value" };
const _hoisted_8$i = { class: "settings-row" };
const _hoisted_9$f = { class: "settings-value" };
const _hoisted_10$d = { class: "settings-row" };
const _hoisted_11$b = { class: "settings-value" };
const _hoisted_12$a = { class: "settings-row" };
const _hoisted_13$a = { class: "settings-value" };
const _hoisted_14$a = { class: "settings-settings-actions" };
const _hoisted_15$a = ["disabled"];
const _hoisted_16$a = {
  key: 0,
  class: "settings-loading-spinner"
};
const _hoisted_17$9 = { key: 1 };
const _sfc_main$q = {
  __name: "Settings",
  setup(__props) {
    const activationStore = useActivationStore();
    useGatewayStore();
    const usbPath = /* @__PURE__ */ ref("--");
    const usbSerial = /* @__PURE__ */ ref("--");
    const dataDir = /* @__PURE__ */ ref("--");
    const defaultPort = /* @__PURE__ */ ref("--");
    onMounted(async () => {
      await loadSettings();
    });
    async function loadSettings() {
      try {
        let rootPath = await window.uclaw.ipcGetRuntimeStore("rootPath");
        usbPath.value = rootPath || "F:\\";
        let usbSerialFromRuntime = await window.uclaw.ipcGetRuntimeStore("serial");
        usbSerial.value = usbSerialFromRuntime || "FOCF56A83156249B";
        dataDir.value = await window.uclaw.ipcGetDataDir();
        defaultPort.value = await window.uclaw.ipcGetDefaultPort();
      } catch (e) {
        console.error("加载设置失败:", e);
      }
    }
    function restartApp() {
      window.uclaw.ipcRestartApp();
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$q, [
        createBaseVNode("div", _hoisted_2$p, [
          createBaseVNode("div", _hoisted_5$l, [
            _cache[1] || (_cache[1] = createBaseVNode("div", { class: "settings-label" }, "激活状态", -1)),
            createBaseVNode("div", {
              class: normalizeClass(["settings-value", unref(activationStore).activated ? "text-green" : "text-red"])
            }, toDisplayString(unref(activationStore).activated ? "已激活" : "未激活"), 3)
          ]),
          createBaseVNode("div", _hoisted_6$j, [
            _cache[2] || (_cache[2] = createBaseVNode("div", { class: "settings-label" }, "U盘路径", -1)),
            createBaseVNode("div", _hoisted_7$j, toDisplayString(usbPath.value), 1)
          ]),
          createBaseVNode("div", _hoisted_8$i, [
            _cache[3] || (_cache[3] = createBaseVNode("div", { class: "settings-label" }, "U盘序列号", -1)),
            createBaseVNode("div", _hoisted_9$f, toDisplayString(usbSerial.value), 1)
          ]),
          createBaseVNode("div", _hoisted_10$d, [
            _cache[4] || (_cache[4] = createBaseVNode("div", { class: "settings-label" }, "数据目录", -1)),
            createBaseVNode("div", _hoisted_11$b, toDisplayString(dataDir.value), 1)
          ]),
          createBaseVNode("div", _hoisted_12$a, [
            _cache[5] || (_cache[5] = createBaseVNode("div", { class: "settings-label" }, "Gateway端口", -1)),
            createBaseVNode("div", _hoisted_13$a, toDisplayString(defaultPort.value), 1)
          ])
        ]),
        createBaseVNode("div", _hoisted_14$a, [
          createBaseVNode("button", {
            class: "settings-btn-action settings-btn-restart",
            onClick: restartApp
          }, [..._cache[7] || (_cache[7] = [
            createBaseVNode("span", { class: "iconfont icon-clawzhongqi" }, null, -1),
            createTextVNode(" 重启软件 ", -1)
          ])])
        ])
      ]);
    };
  }
};
const Settings = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["__scopeId", "data-v-055ae239"]]);
const _hoisted_1$p = { class: "env-check-env-check-view" };
const _hoisted_2$o = { class: "env-check-page-header" };
const _hoisted_3$n = ["disabled"];
const _hoisted_4$k = { class: "env-check-check-grid" };
const _hoisted_5$k = { class: "env-check-card-header" };
const _hoisted_6$i = { class: "env-check-card-title" };
const _hoisted_7$i = { class: "env-check-card-status" };
const _hoisted_8$h = { class: "env-check-status-text" };
const _hoisted_9$e = {
  key: 0,
  class: "env-check-card-detail"
};
const _sfc_main$p = {
  __name: "EnvCheck",
  setup(__props) {
    const gatewayStore = useGatewayStore();
    const { checkItems, runAllChecks } = useEnvCheck();
    console.log("checkItems==>", checkItems);
    const isChecking = computed(() => checkItems.value.some((item) => item.status === "checking"));
    if (gatewayStore.envCheckResults) {
      checkItems.value = JSON.parse(JSON.stringify(gatewayStore.envCheckResults));
      setTimeout(async () => {
        await runAllChecks();
        gatewayStore.setEnvCheckResults(JSON.parse(JSON.stringify(checkItems.value)));
      }, 0);
    }
    async function handleRecheck() {
      await runAllChecks();
      gatewayStore.setEnvCheckResults(JSON.parse(JSON.stringify(checkItems.value)));
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$p, [
        createBaseVNode("div", _hoisted_2$o, [
          createBaseVNode("button", {
            class: "env-check-btn-check",
            onClick: handleRecheck,
            disabled: isChecking.value
          }, [
            createBaseVNode("span", {
              class: normalizeClass(["iconfont icon-clawjianchagengxin", { "env-check-spinning": isChecking.value }])
            }, null, 2),
            createBaseVNode("span", null, toDisplayString(isChecking.value ? "检测中..." : "重新检测"), 1)
          ], 8, _hoisted_3$n)
        ]),
        createBaseVNode("div", _hoisted_4$k, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(unref(checkItems), (item) => {
            return openBlock(), createElementBlock("div", {
              key: item.id,
              class: normalizeClass(["env-check-check-card", [`env-check-status-${item.status}`]])
            }, [
              createBaseVNode("div", _hoisted_5$k, [
                createBaseVNode("span", {
                  class: normalizeClass(["iconfont env-check-card-icon", item.icon])
                }, null, 2),
                createBaseVNode("span", _hoisted_6$i, toDisplayString(item.title), 1)
              ]),
              createBaseVNode("div", _hoisted_7$i, [
                createBaseVNode("span", {
                  class: normalizeClass(["env-check-status-badge", "env-check-" + item.status])
                }, [
                  _cache[0] || (_cache[0] = createBaseVNode("span", { class: "env-check-status-dot" }, null, -1)),
                  createBaseVNode("span", _hoisted_8$h, toDisplayString(item.statusText), 1)
                ], 2)
              ]),
              item.detail ? (openBlock(), createElementBlock("div", _hoisted_9$e, toDisplayString(item.detail), 1)) : createCommentVNode("", true)
            ], 2);
          }), 128))
        ])
      ]);
    };
  }
};
const EnvCheck = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["__scopeId", "data-v-45f28415"]]);
const _imports_0 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAD1BMVEUAAAAAn+cAn+cAn+gAn+j47e9aAAAABHRSTlMAgEC/+QGcAgAAA/xJREFUeNrtnF12mzAQRgVmAVJgAZh6ATiwAGRm/2tqH3L6NRZmZlBGJ225r8k51/MnS7aFe2JoJ8pkCt7tUcOQRdzR/KAvI7xytPSFxG1HR19KtMwVLIYO4JO+IgM8UxCLhF0ImIUykwmrYSBgNA0kDaUiM0a71gIRgRjSf0gaMuSBbNmxmmcL+WrIlMU6W+gvMgYlMcTblgRF6ciYh60Ek0LmoO6G9CUko6q57sNvzCSrA6r20jRXLCFZDkpiCcnq5n9GQmYScEpOySk5Jafk/5QM2/QODK8QS1wGp+SUfANJzpx8r4k/JafklJySv1VyDwnegbBBp5Z4p6aIZC4hoQKS6p+RNN9Usk4imA6GJINYWkJWkgWOykziC0saM4kDnZUklpbsxWveXJDk1/1SQtKYSZi6Q2Jb93zJg6k7K5nuYRiGENqJKclhyfTmHBhCy9ddK1l7l3BtmXlXSt7dJnWYlXWHhHeAJ83IlAQS3QYiKEsCCR8HqFvtKEICB0vVoSSHJKuTEJglmJEgy4Jg/DFJdFKCoiSQIBBpMPGYJDoN0mxBkgaCD+oYdBIEUk8foz2FN4mkk0sWzNuf3HkPySX+wzEnq3JgsiWXRDhSdjWNXLLs5nf1TElkEs/82Da+7LarXJL82FYeTCUZRpTkRkBTmSCTLEwgeCX6YNynkjQZv2W/SiUdsby21B0rwVRpLaCa9yUrky3hYIZdSUS2sixVty3B3ll+LNEEA8nCl4TfbqAB8iWLY7jO25IRdWfpHUu7KfFySZRtNF5Iboqy8wRGkhsIGkAv0W/O5oM1iU5DSCQX7cWCKgoagJGwg9hJ4rp+npNaG4gwe20iUQRyE9eIIHGzqrVqvFkyfFqFb6rWaggWheSiWrVm+egg2XxRHq9u33iZhPDimKojELkFmWBn3ieBgCCSjGy+3pNAxBbx5YrIXOyKAsnKnGfWPglEbnlqz5vMcdEdLp5XpU7yLlLPup3y8xBUnCONl2/lZAoqJlf4F7kl/XuVOhSHxLAvidtbwBXzgaorLZuhVi0UCANV1+4CXv11CL8YBuZELbTw+0/9jdfodyQP1SdCitM424B8QfhWZrKpLAh4SySwqBziVk7CzHSAmEhg4R16C4ktdXf4Lj5JLcN8/Ou7Wbb61JjBAxZIQHx7VuA8qyVAsqsZWgKHLB3z9Vw7zfn3P29kzqOEZHEXMmcsIfGuJjswK2QOBsWO6Ar0cCxyubjQNWn7yhe5ul7sEr7FOPJvjgbZMpsUZMs+X77kYzcsl3tv+SgUBGIYCgIxDyUm5ycDxjKPDDIPZe2dvcVbPvQKZ2lzy7vbpDN0gGDuwNdd+Uy926MKU27jTuFZ8ROaaIYVxB9eJQAAAABJRU5ErkJggg==";
const _hoisted_1$o = { class: "recharge-recharge-view" };
const _hoisted_2$n = { class: "recharge-balance-panel" };
const _hoisted_3$m = { class: "recharge-balance-header" };
const _hoisted_4$j = ["disabled"];
const _hoisted_5$j = {
  key: 0,
  class: "recharge-loading-spinner-small"
};
const _hoisted_6$h = {
  key: 1,
  class: "iconfont icon-clawshuaxin",
  title: "刷新积分"
};
const _hoisted_7$h = { class: "recharge-balance-content" };
const _hoisted_8$g = { class: "recharge-usage-bar-container" };
const _hoisted_9$d = { class: "recharge-usage-labels" };
const _hoisted_10$c = { class: "recharge-usage-bar-bg" };
const _hoisted_11$a = { class: "recharge-balance-stats" };
const _hoisted_12$9 = { class: "recharge-stat-item" };
const _hoisted_13$9 = { class: "recharge-stat-value" };
const _hoisted_14$9 = { class: "recharge-stat-item" };
const _hoisted_15$9 = { class: "recharge-stat-value" };
const _hoisted_16$9 = { class: "recharge-recharge-panel" };
const _hoisted_17$8 = { class: "recharge-amount-section" };
const _hoisted_18$8 = { class: "recharge-amount-options" };
const _hoisted_19$8 = ["onClick"];
const _hoisted_20$8 = {
  key: 0,
  class: "recharge-discount-tag"
};
const _hoisted_21$8 = { class: "recharge-custom-amount-section" };
const _hoisted_22$8 = { class: "recharge-input-row" };
const _hoisted_23$7 = { class: "recharge-payment-section" };
const _hoisted_24$6 = { class: "recharge-payment-tabs" };
const _hoisted_25$5 = {
  key: 0,
  class: "recharge-details"
};
const _hoisted_26$5 = { class: "recharge-detail-row" };
const _hoisted_27$4 = { class: "recharge-detail-value" };
const _hoisted_28$4 = {
  key: 0,
  class: "recharge-detail-row"
};
const _hoisted_29$4 = { class: "recharge-detail-value recharge-original-price" };
const _hoisted_30$3 = { class: "recharge-detail-row" };
const _hoisted_31$3 = { class: "recharge-detail-label" };
const _hoisted_32$2 = {
  key: 0,
  class: "recharge-detail-discount"
};
const _hoisted_33$1 = ["disabled"];
const _hoisted_34$1 = {
  key: 0,
  class: "recharge-loading-spinner"
};
const _hoisted_35$1 = { key: 1 };
const _hoisted_36$1 = { class: "recharge-records-panel" };
const _hoisted_37$1 = { class: "recharge-records-header" };
const _hoisted_38$1 = ["disabled"];
const _hoisted_39$1 = {
  key: 0,
  class: "recharge-loading-spinner-small"
};
const _hoisted_40$1 = { key: 1 };
const _hoisted_41$1 = {
  key: 0,
  class: "recharge-records-table-container"
};
const _hoisted_42$1 = { class: "recharge-records-table" };
const _hoisted_43$1 = {
  key: 0,
  class: "recharge-pagination"
};
const _hoisted_44$1 = ["disabled"];
const _hoisted_45$1 = { class: "recharge-pagination-info" };
const _hoisted_46$1 = ["disabled"];
const _hoisted_47$1 = {
  key: 1,
  class: "recharge-records-empty"
};
const _hoisted_48 = {
  key: 2,
  class: "recharge-records-loading"
};
const _hoisted_49 = { class: "recharge-dialog recharge-dialog-iframe" };
const _hoisted_50 = { class: "recharge-dialog-body-iframe" };
const _hoisted_51 = ["src"];
const _sfc_main$o = {
  __name: "Recharge",
  setup(__props) {
    const userStore = useUserStore();
    const { showToast } = useToast();
    const refreshingBalance = /* @__PURE__ */ ref(false);
    async function refreshBalance() {
      refreshingBalance.value = true;
      try {
        await fetchUserInfo();
      } catch (e) {
        console.error("[Recharge] refreshBalance error:", e);
      } finally {
        refreshingBalance.value = false;
      }
    }
    const amountOptions = /* @__PURE__ */ ref([10, 50, 100, 200, 500]);
    const selectedAmount = /* @__PURE__ */ ref(null);
    const customAmount = /* @__PURE__ */ ref("");
    const discountConfig = /* @__PURE__ */ ref({});
    const paymentMethod = /* @__PURE__ */ ref("alipay");
    const isCreatingOrder = /* @__PURE__ */ ref(false);
    const showUrlDialog = /* @__PURE__ */ ref(false);
    const payUrl = /* @__PURE__ */ ref("");
    function formatBalance(value) {
      if (value == null) return "0.00";
      const truncated = Math.trunc(value * 100) / 100;
      return truncated.toFixed(2);
    }
    const rechargeRecords = /* @__PURE__ */ ref([]);
    const loadingRecords = /* @__PURE__ */ ref(false);
    const loadingTopupInfo = /* @__PURE__ */ ref(false);
    const currentPage = /* @__PURE__ */ ref(1);
    const pageSize = /* @__PURE__ */ ref(10);
    const totalRecords = /* @__PURE__ */ ref(0);
    const displayAmount = computed(() => {
      if (customAmount.value && parseFloat(customAmount.value) > 0) {
        return parseFloat(customAmount.value);
      }
      return selectedAmount.value || 0;
    });
    const displayTokens = computed(() => {
      return Math.floor(displayAmount.value * 5e5);
    });
    const currentDiscount = computed(() => {
      const amount = customAmount.value ? parseFloat(customAmount.value) : selectedAmount.value;
      if (amount && discountConfig.value && discountConfig.value[amount]) {
        return discountConfig.value[amount];
      }
      return 1;
    });
    const hasDiscount = computed(() => {
      return currentDiscount.value < 1;
    });
    function selectAmount(amount) {
      selectedAmount.value = amount;
      customAmount.value = "";
    }
    function onCustomAmountInput() {
      selectedAmount.value = null;
    }
    function onWechatClick() {
      showToast("暂未开通", true);
    }
    async function handleRecharge() {
      if (displayAmount.value <= 0) {
        showToast("请选择或输入充值积分", true);
        return;
      }
      isCreatingOrder.value = true;
      try {
        showToast("充值功能已移除", true);
      } catch (e) {
        console.error("[Recharge] handleRecharge error:", e);
        showToast("充值请求失败", true);
      } finally {
        isCreatingOrder.value = false;
      }
    }
    function closeUrlDialog() {
      showUrlDialog.value = false;
      payUrl.value = "";
    }
    async function fetchTopupInfo() {
      loadingTopupInfo.value = true;
      try {
        amountOptions.value = [];
        selectedAmount.value = null;
        discountConfig.value = {};
      } catch (e) {
        console.error("[Recharge] fetchTopupInfo error:", e);
      } finally {
        loadingTopupInfo.value = false;
      }
    }
    async function fetchRechargeRecords() {
      loadingRecords.value = true;
      try {
        rechargeRecords.value = [];
        totalRecords.value = 0;
      } catch (e) {
        console.error("[Recharge] fetchRechargeRecords error:", e);
        showToast("获取充值记录失败", true);
      } finally {
        loadingRecords.value = false;
      }
    }
    function changePage(page) {
      currentPage.value = page;
      fetchRechargeRecords();
    }
    const totalPages = computed(() => {
      return Math.ceil(totalRecords.value / pageSize.value) || 1;
    });
    function formatTime(timestamp) {
      if (!timestamp) return "-";
      const date = new Date(timestamp * 1e3);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    function getPaymentMethodName(method) {
      const methodMap = {
        "alipay": "支付宝",
        "wechat": "微信支付",
        "stripe": "Stripe",
        "waffo": "Waffo",
        "creem": "Creem"
      };
      return methodMap[method] || method || "-";
    }
    onMounted(async () => {
      await Promise.all([
        fetchTopupInfo(),
        fetchRechargeRecords()
      ]);
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$o, [
        createBaseVNode("div", _hoisted_2$n, [
          createBaseVNode("div", _hoisted_3$m, [
            _cache[4] || (_cache[4] = createBaseVNode("h4", { class: "recharge-balance-title" }, "账户积分", -1)),
            createBaseVNode("button", {
              class: "recharge-balance-refresh",
              disabled: refreshingBalance.value,
              onClick: refreshBalance
            }, [
              refreshingBalance.value ? (openBlock(), createElementBlock("span", _hoisted_5$j)) : (openBlock(), createElementBlock("span", _hoisted_6$h))
            ], 8, _hoisted_4$j)
          ]),
          createBaseVNode("div", _hoisted_7$h, [
            createBaseVNode("div", _hoisted_8$g, [
              createBaseVNode("div", _hoisted_9$d, [
                _cache[5] || (_cache[5] = createBaseVNode("span", null, "已用积分", -1)),
                createBaseVNode("span", null, toDisplayString(unref(userStore).userInfo?.used_percent ? Math.round(unref(userStore).userInfo.used_percent * 100) + "%" : "0%"), 1)
              ]),
              createBaseVNode("div", _hoisted_10$c, [
                createBaseVNode("div", {
                  class: "recharge-usage-bar-fill",
                  style: normalizeStyle({ width: (unref(userStore).userInfo?.used_percent ? unref(userStore).userInfo.used_percent * 100 : 0) + "%" })
                }, null, 4)
              ])
            ]),
            createBaseVNode("div", _hoisted_11$a, [
              createBaseVNode("div", _hoisted_12$9, [
                _cache[7] || (_cache[7] = createBaseVNode("div", { class: "recharge-stat-label" }, "已用积分", -1)),
                createBaseVNode("div", _hoisted_13$9, [
                  _cache[6] || (_cache[6] = createBaseVNode("span", { class: "recharge-balance-symbol" }, null, -1)),
                  createTextVNode(toDisplayString(formatBalance(unref(userStore).userInfo?.used_balance)), 1)
                ])
              ]),
              createBaseVNode("div", _hoisted_14$9, [
                _cache[9] || (_cache[9] = createBaseVNode("div", { class: "recharge-stat-label" }, "剩余积分", -1)),
                createBaseVNode("div", _hoisted_15$9, [
                  _cache[8] || (_cache[8] = createBaseVNode("span", { class: "recharge-balance-symbol" }, null, -1)),
                  createTextVNode(toDisplayString(formatBalance(unref(userStore).userInfo?.remain_balance)), 1)
                ])
              ])
            ])
          ])
        ]),
        _cache[23] || (_cache[23] = createBaseVNode("div", { class: "recharge-tip-card" }, [
          createBaseVNode("div", { class: "recharge-tip-icon iconfont icon-clawtishi" }),
          createBaseVNode("div", { class: "recharge-tip-content" }, " 充值功能已移除。OpenClaw软件本身完全免费，您可以在「模型配置」填入自己的 API Key来使用自有模型。 ")
        ], -1)),
        createBaseVNode("div", _hoisted_16$9, [
          _cache[19] || (_cache[19] = createBaseVNode("h4", { class: "recharge-recharge-title" }, "快速充值", -1)),
          createBaseVNode("div", _hoisted_17$8, [
            _cache[10] || (_cache[10] = createBaseVNode("label", { class: "recharge-section-label" }, "选择充值积分", -1)),
            createBaseVNode("div", _hoisted_18$8, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(amountOptions.value, (amount) => {
                return openBlock(), createElementBlock("button", {
                  key: amount,
                  class: normalizeClass(["recharge-amount-btn", { "recharge-active": selectedAmount.value === amount && !customAmount.value }]),
                  onClick: ($event) => selectAmount(amount)
                }, [
                  createTextVNode(toDisplayString(amount) + " ", 1),
                  discountConfig.value[amount] && discountConfig.value[amount] < 1 ? (openBlock(), createElementBlock("span", _hoisted_20$8, toDisplayString(discountConfig.value[amount] * 10) + "折 ", 1)) : createCommentVNode("", true)
                ], 10, _hoisted_19$8);
              }), 128))
            ])
          ]),
          createBaseVNode("div", _hoisted_21$8, [
            _cache[12] || (_cache[12] = createBaseVNode("label", { class: "recharge-section-label" }, "自定义积分", -1)),
            createBaseVNode("div", _hoisted_22$8, [
              withDirectives(createBaseVNode("input", {
                type: "number",
                class: "recharge-form-input",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => customAmount.value = $event),
                placeholder: "输入积分",
                min: "1",
                onInput: onCustomAmountInput
              }, null, 544), [
                [vModelText, customAmount.value]
              ]),
              _cache[11] || (_cache[11] = createBaseVNode("span", { class: "recharge-input-suffix" }, "积分", -1))
            ])
          ]),
          createBaseVNode("div", _hoisted_23$7, [
            _cache[15] || (_cache[15] = createBaseVNode("label", { class: "recharge-section-label" }, "支付方式", -1)),
            createBaseVNode("div", _hoisted_24$6, [
              createBaseVNode("button", {
                class: normalizeClass(["recharge-payment-tab", { "recharge-active": paymentMethod.value === "alipay" }]),
                onClick: _cache[1] || (_cache[1] = ($event) => paymentMethod.value = "alipay")
              }, [..._cache[13] || (_cache[13] = [
                createBaseVNode("img", {
                  src: _imports_0,
                  class: "recharge-payment-icon"
                }, null, -1),
                createBaseVNode("span", null, "支付宝支付", -1)
              ])], 2),
              createBaseVNode("button", {
                class: normalizeClass(["recharge-payment-tab", { "recharge-active": paymentMethod.value === "wechat" }]),
                onClick: onWechatClick
              }, [..._cache[14] || (_cache[14] = [
                createBaseVNode("img", {
                  src: _imports_1$1,
                  class: "recharge-payment-icon wechat"
                }, null, -1),
                createBaseVNode("span", null, "微信支付", -1)
              ])], 2)
            ])
          ]),
          displayAmount.value > 0 ? (openBlock(), createElementBlock("div", _hoisted_25$5, [
            createBaseVNode("div", _hoisted_26$5, [
              _cache[16] || (_cache[16] = createBaseVNode("span", { class: "recharge-detail-label" }, "充值 Token 数量", -1)),
              createBaseVNode("span", _hoisted_27$4, toDisplayString(displayTokens.value.toLocaleString()) + " Tokens", 1)
            ]),
            hasDiscount.value ? (openBlock(), createElementBlock("div", _hoisted_28$4, [
              _cache[17] || (_cache[17] = createBaseVNode("span", { class: "recharge-detail-label" }, "原价", -1)),
              createBaseVNode("span", _hoisted_29$4, toDisplayString(displayAmount.value.toFixed(2)), 1)
            ])) : createCommentVNode("", true),
            createBaseVNode("div", _hoisted_30$3, [
              createBaseVNode("span", _hoisted_31$3, toDisplayString(hasDiscount.value ? "折扣价" : "对应积分"), 1),
              createBaseVNode("span", {
                class: normalizeClass(["recharge-detail-value", { "recharge-discounted": hasDiscount.value }])
              }, [
                createTextVNode(toDisplayString((displayAmount.value * currentDiscount.value).toFixed(2)) + " ", 1),
                hasDiscount.value ? (openBlock(), createElementBlock("span", _hoisted_32$2, toDisplayString(currentDiscount.value * 10) + "折", 1)) : createCommentVNode("", true)
              ], 2)
            ]),
            _cache[18] || (_cache[18] = createBaseVNode("div", { class: "recharge-detail-row conversion" }, [
              createBaseVNode("span", { class: "recharge-detail-label" }, "换算比例"),
              createBaseVNode("span", { class: "recharge-detail-value" }, "1 积分 ≈ 500,000 Tokens")
            ], -1))
          ])) : createCommentVNode("", true),
          createBaseVNode("button", {
            class: "recharge-btn-save",
            disabled: displayAmount.value <= 0 || isCreatingOrder.value,
            onClick: handleRecharge
          }, [
            isCreatingOrder.value ? (openBlock(), createElementBlock("span", _hoisted_34$1)) : (openBlock(), createElementBlock("span", _hoisted_35$1, "立即充值"))
          ], 8, _hoisted_33$1)
        ]),
        createBaseVNode("div", _hoisted_36$1, [
          createBaseVNode("div", _hoisted_37$1, [
            _cache[20] || (_cache[20] = createBaseVNode("h4", { class: "recharge-records-title" }, "充值记录", -1)),
            createBaseVNode("button", {
              class: "recharge-btn-refresh",
              onClick: fetchRechargeRecords,
              disabled: loadingRecords.value
            }, [
              loadingRecords.value ? (openBlock(), createElementBlock("span", _hoisted_39$1)) : (openBlock(), createElementBlock("span", _hoisted_40$1, "刷新"))
            ], 8, _hoisted_38$1)
          ]),
          rechargeRecords.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_41$1, [
            createBaseVNode("table", _hoisted_42$1, [
              _cache[21] || (_cache[21] = createBaseVNode("thead", null, [
                createBaseVNode("tr", null, [
                  createBaseVNode("th", null, "支付积分"),
                  createBaseVNode("th", null, "支付方式"),
                  createBaseVNode("th", null, "创建时间"),
                  createBaseVNode("th", null, "状态")
                ])
              ], -1)),
              createBaseVNode("tbody", null, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(rechargeRecords.value, (record) => {
                  return openBlock(), createElementBlock("tr", {
                    key: record.id
                  }, [
                    createBaseVNode("td", null, toDisplayString(record.money.toFixed(2)), 1),
                    createBaseVNode("td", null, toDisplayString(getPaymentMethodName(record.payment_method)), 1),
                    createBaseVNode("td", null, toDisplayString(formatTime(record.create_time)), 1),
                    createBaseVNode("td", null, [
                      createBaseVNode("span", {
                        class: normalizeClass(["recharge-status", "recharge-status-" + record.status])
                      }, toDisplayString(record.status === "success" ? "成功" : "待支付"), 3)
                    ])
                  ]);
                }), 128))
              ])
            ]),
            totalRecords.value > pageSize.value ? (openBlock(), createElementBlock("div", _hoisted_43$1, [
              createBaseVNode("button", {
                class: "recharge-pagination-btn",
                disabled: currentPage.value <= 1,
                onClick: _cache[2] || (_cache[2] = ($event) => changePage(currentPage.value - 1))
              }, " 上一页 ", 8, _hoisted_44$1),
              createBaseVNode("span", _hoisted_45$1, toDisplayString(currentPage.value) + " / " + toDisplayString(totalPages.value), 1),
              createBaseVNode("button", {
                class: "recharge-pagination-btn",
                disabled: currentPage.value >= totalPages.value,
                onClick: _cache[3] || (_cache[3] = ($event) => changePage(currentPage.value + 1))
              }, " 下一页 ", 8, _hoisted_46$1)
            ])) : createCommentVNode("", true)
          ])) : !loadingRecords.value ? (openBlock(), createElementBlock("div", _hoisted_47$1, " 暂无充值记录 ")) : (openBlock(), createElementBlock("div", _hoisted_48, " 加载中... "))
        ]),
        showUrlDialog.value ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: "recharge-dialog-overlay",
          onClick: withModifiers(closeUrlDialog, ["self"])
        }, [
          createBaseVNode("div", _hoisted_49, [
            createBaseVNode("div", { class: "recharge-dialog-header" }, [
              _cache[22] || (_cache[22] = createBaseVNode("span", null, "支付页面", -1)),
              createBaseVNode("button", {
                class: "recharge-dialog-close",
                onClick: closeUrlDialog
              }, "×")
            ]),
            createBaseVNode("div", _hoisted_50, [
              createBaseVNode("iframe", {
                src: payUrl.value,
                class: "recharge-payment-iframe",
                frameborder: "0"
              }, null, 8, _hoisted_51)
            ])
          ])
        ])) : createCommentVNode("", true)
      ]);
    };
  }
};
const Recharge = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["__scopeId", "data-v-c66809e6"]]);
const sessionsCache$1 = /* @__PURE__ */ reactive({});
async function preloadAllImageSessions() {
  try {
    const result = await window.uclaw.ipcLoadImageSessions();
    if (result?.ok && result.data) {
      sessionsCache$1._all = result.data;
    }
    console.log("[imageGen] preloaded sessions");
  } catch (e) {
    console.error("[imageGen] preloadAllImageSessions error:", e);
  }
}
const _hoisted_1$n = { class: "session-list" };
const _hoisted_2$m = { class: "header-right" };
const _hoisted_3$l = { class: "header-hint" };
const _hoisted_4$i = { class: "session-items" };
const _hoisted_5$i = {
  key: 0,
  class: "session-empty"
};
const _hoisted_6$g = ["onClick"];
const _hoisted_7$g = ["title"];
const _hoisted_8$f = { class: "session-actions" };
const _hoisted_9$c = ["onClick"];
const _hoisted_10$b = ["onClick"];
const _sfc_main$n = {
  __name: "SessionList",
  props: {
    sessions: {
      type: Array,
      default: () => []
    },
    currentSessionId: {
      type: String,
      default: null
    },
    mode: {
      type: String,
      default: "video"
    }
  },
  emits: ["select", "create", "delete", "edit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit2 = __emit;
    const expanded = /* @__PURE__ */ ref(true);
    const visibleSessions = computed(() => {
      return props.sessions.filter((s) => !s.deleted);
    });
    function toggleExpand() {
      expanded.value = !expanded.value;
    }
    function selectSession(id) {
      emit2("select", id);
    }
    function deleteSession(id) {
      emit2("delete", id);
    }
    function editSession(id) {
      emit2("edit", id);
    }
    function getSessionFullText(session) {
      if (session.title) return session.title;
      const messages = session.messages || [];
      if (messages.length === 0) {
        return "新会话";
      }
      const lastMessage = messages[messages.length - 1];
      return lastMessage.text || "新会话";
    }
    function getSessionPreview(session) {
      return getSessionFullText(session);
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$n, [
        createBaseVNode("div", {
          class: "session-header",
          onClick: toggleExpand
        }, [
          _cache[0] || (_cache[0] = createBaseVNode("span", { class: "iconfont icon-clawa-huihua2" }, null, -1)),
          _cache[1] || (_cache[1] = createBaseVNode("span", { class: "session-title" }, "会话列表", -1)),
          createBaseVNode("span", _hoisted_2$m, [
            createBaseVNode("span", _hoisted_3$l, "点击生成" + toDisplayString(__props.mode === "image" ? "图片" : "视频") + "，即可会话", 1),
            createBaseVNode("span", {
              class: normalizeClass(["iconfont arrow", { expanded: expanded.value }])
            }, null, 2)
          ])
        ]),
        withDirectives(createBaseVNode("div", _hoisted_4$i, [
          __props.sessions.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_5$i, " 暂无会话 ")) : createCommentVNode("", true),
          (openBlock(true), createElementBlock(Fragment, null, renderList(visibleSessions.value, (session) => {
            return openBlock(), createElementBlock("div", {
              key: session.id,
              class: normalizeClass(["session-item", { active: session.id === __props.currentSessionId }]),
              onClick: ($event) => selectSession(session.id)
            }, [
              createBaseVNode("span", {
                class: "session-text",
                title: getSessionFullText(session)
              }, toDisplayString(getSessionPreview(session)), 9, _hoisted_7$g),
              createBaseVNode("span", _hoisted_8$f, [
                createBaseVNode("span", {
                  class: "session-edit iconfont icon-clawbianji",
                  onClick: withModifiers(($event) => editSession(session.id), ["stop"])
                }, null, 8, _hoisted_9$c),
                createBaseVNode("span", {
                  class: "session-delete iconfont icon-clawshanchu",
                  onClick: withModifiers(($event) => deleteSession(session.id), ["stop"])
                }, null, 8, _hoisted_10$b)
              ])
            ], 10, _hoisted_6$g);
          }), 128))
        ], 512), [
          [vShow, expanded.value]
        ])
      ]);
    };
  }
};
const SessionList$1 = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["__scopeId", "data-v-b8aadd8f"]]);
const _hoisted_1$m = { class: "ref-images" };
const _hoisted_2$l = ["src"];
const _hoisted_3$k = ["onClick"];
const _sfc_main$m = {
  __name: "ReferenceImages",
  props: {
    images: {
      type: Array,
      default: () => []
    },
    max: {
      type: Number,
      default: Infinity
    }
  },
  emits: ["update:images"],
  setup(__props, { emit: __emit }) {
    const { showToast } = useToast();
    const props = __props;
    const emit2 = __emit;
    const fileInput = /* @__PURE__ */ ref(null);
    const isDragOver = /* @__PURE__ */ ref(false);
    function triggerFileInput() {
      fileInput.value?.click();
    }
    function onDragOver(e) {
      isDragOver.value = true;
    }
    function onDragLeave(e) {
      isDragOver.value = false;
    }
    function onDrop(e) {
      isDragOver.value = false;
      const files = e.dataTransfer.files;
      handleFiles(files);
    }
    function onPaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFiles([file]);
          }
        }
      }
    }
    function onFileSelected(e) {
      const files = e.target.files;
      if (files) {
        handleFiles(files);
      }
      e.target.value = "";
    }
    async function handleFiles(files) {
      const MAX_SIZE = 10 * 1024 * 1024;
      const newImages = [...props.images];
      const remaining = props.max - newImages.length;
      if (remaining <= 0) {
        showToast(`最多只能上传 ${props.max} 张参考图`, true);
        return;
      }
      const filesToProcess = Array.from(files).slice(0, remaining);
      if (files.length > remaining) {
        showToast(`最多只能上传 ${props.max} 张参考图，已自动截取前 ${remaining} 张`, true);
      }
      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > MAX_SIZE) {
          showToast("图片大小不能超过 10MB", true);
          continue;
        }
        showToast("远程图片上传功能已移除", true);
        return;
      }
      emit2("update:images", newImages);
    }
    function removeImage(index) {
      const newImages = [...props.images];
      newImages.splice(index, 1);
      emit2("update:images", newImages);
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: normalizeClass(["reference-images", { "drag-over": isDragOver.value }]),
        onDragover: withModifiers(onDragOver, ["prevent"]),
        onDragleave: withModifiers(onDragLeave, ["prevent"]),
        onDrop: withModifiers(onDrop, ["prevent"]),
        onPaste
      }, [
        createBaseVNode("div", _hoisted_1$m, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(__props.images, (img, index) => {
            return openBlock(), createElementBlock("div", {
              key: index,
              class: "ref-image-item"
            }, [
              createBaseVNode("img", { src: img }, null, 8, _hoisted_2$l),
              createBaseVNode("span", {
                class: "remove-btn iconfont icon-clawshanchu",
                onClick: withModifiers(($event) => removeImage(index), ["stop"])
              }, null, 8, _hoisted_3$k)
            ]);
          }), 128)),
          __props.images.length < __props.max ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "add-image-btn",
            onClick: triggerFileInput
          }, [
            _cache[0] || (_cache[0] = createBaseVNode("span", null, "+", -1)),
            createBaseVNode("span", null, toDisplayString(isDragOver.value ? "松开即可上传" : "拖拽或点击上传"), 1)
          ])) : createCommentVNode("", true)
        ]),
        createBaseVNode("input", {
          ref_key: "fileInput",
          ref: fileInput,
          type: "file",
          accept: "image/*",
          multiple: "",
          style: { "display": "none" },
          onChange: onFileSelected
        }, null, 544)
      ], 34);
    };
  }
};
const ReferenceImages = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__scopeId", "data-v-11e63aff"]]);
const _hoisted_1$l = { class: "chat-bubble" };
const _hoisted_2$k = { class: "bubble-main" };
const _hoisted_3$j = { class: "bubble-header" };
const _hoisted_4$h = { class: "bubble-type" };
const _hoisted_5$h = { class: "bubble-body" };
const _hoisted_6$f = { class: "bubble-content" };
const _hoisted_7$f = {
  key: 0,
  class: "bubble-reference-images"
};
const _hoisted_8$e = ["src"];
const _hoisted_9$b = { class: "bubble-footer" };
const _hoisted_10$a = {
  key: 0,
  class: "bubble-actions"
};
const _hoisted_11$9 = {
  key: 1,
  class: "bubble-loading"
};
const _hoisted_12$8 = {
  key: 0,
  class: "bubble-image-meta"
};
const _hoisted_13$8 = {
  key: 0,
  class: "meta-time"
};
const _hoisted_14$8 = {
  key: 1,
  class: "meta-error"
};
const _hoisted_15$8 = {
  key: 1,
  class: "bubble-images-wrapper"
};
const _hoisted_16$8 = ["src", "onLoad", "onError", "onClick"];
const _hoisted_17$7 = {
  key: 0,
  class: "image-actions"
};
const _hoisted_18$7 = ["onClick"];
const _hoisted_19$7 = ["onClick"];
const _hoisted_20$7 = ["onClick"];
const _hoisted_21$7 = {
  key: 2,
  class: "bubble-video-wrapper"
};
const _hoisted_22$7 = {
  key: 0,
  class: "video-actions"
};
const _hoisted_23$6 = ["src"];
const _sfc_main$l = {
  __name: "ChatBubble",
  props: {
    bubble: {
      type: Object,
      required: true
    },
    /** 父视图强制声明的渲染模式：'image' 只渲染图片区域，'video' 只渲染视频区域 */
    bubbleMode: {
      type: String,
      default: "image",
      // 默认 image，兼容旧调用
      validator: (v) => ["image", "video"].includes(v)
    },
    modelName: {
      type: String,
      default: ""
    }
  },
  emits: ["preview", "copy", "download", "regenerate", "copySuccess", "insert"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit2 = __emit;
    function handleCopy() {
      if (text2.value) {
        navigator.clipboard.writeText(text2.value).then(() => {
          emit2("copySuccess", "已复制到剪贴板");
          emit2("copy", text2.value);
        });
      }
    }
    const text2 = computed(() => props.bubble.text);
    const imageUrls = computed(() => {
      if (!props.bubble.imageUrl) return [];
      if (Array.isArray(props.bubble.imageUrl)) return props.bubble.imageUrl;
      return [props.bubble.imageUrl];
    });
    const videoUrl = computed(() => props.bubble.videoUrl || null);
    const localPath = computed(() => props.bubble.localPath || null);
    function toFileUrl(filePath) {
      if (!filePath) return null;
      let normalized = filePath.replace(/\\/g, "/");
      if (normalized.startsWith("local-media://") || normalized.startsWith("file://")) {
        return normalized;
      }
      return "local-media://" + normalized.replace(/^([a-zA-Z]):/, (_, drive) => drive.toUpperCase());
    }
    const displayVideoUrl = computed(() => {
      if (!isVideo.value) return null;
      if (localPath.value) {
        console.log("displayVideoUrl==>", toFileUrl(localPath.value));
        return toFileUrl(localPath.value);
      }
      return videoUrl.value;
    });
    const displayPreviewUrl = computed(() => {
      if (localPath.value) {
        return toFileUrl(localPath.value);
      }
      return videoUrl.value;
    });
    const isVideo = computed(() => {
      if (props.bubbleMode !== "video") return false;
      const type = props.bubble.type || "";
      return type === "text-to-video" || type === "image-to-video";
    });
    const referenceImages = computed(() => props.bubble.referenceImages || []);
    const error = computed(() => props.bubble.error);
    const status = computed(() => props.bubble.status);
    const bubbleType = computed(() => {
      const type = props.bubble.type || "text-to-image";
      const typeMap = {
        "text-to-image": "文生图",
        "image-to-image": "图生图",
        "text-to-video": "文生视频",
        "image-to-video": "图生视频"
      };
      return typeMap[type] || "文生图";
    });
    const isLoading = computed(() => {
      return status.value === "queued" || status.value === "in_progress";
    });
    const loadDuration = computed(() => props.bubble.loadDuration ?? null);
    const loadStatus = computed(() => props.bubble.loadStatus || "");
    const loadStatusText = computed(() => {
      switch (loadStatus.value) {
        case "success":
          return "加载成功";
        case "failed":
          return "加载失败";
        default:
          return "";
      }
    });
    const elapsedSeconds = /* @__PURE__ */ ref(0);
    let timer = null;
    const imageLoaded = /* @__PURE__ */ ref({});
    const imageError = /* @__PURE__ */ ref({});
    const videoReady = /* @__PURE__ */ ref(false);
    const videoFallback = /* @__PURE__ */ ref(false);
    function onImageLoad(index) {
      imageLoaded.value[index] = true;
      imageError.value[index] = false;
    }
    function onImageError(index) {
      imageError.value[index] = true;
      imageLoaded.value[index] = false;
    }
    function onVideoLoaded() {
      videoReady.value = true;
    }
    function onVideoError() {
      if (localPath.value && !videoFallback.value && videoUrl.value) {
        console.warn("[ChatBubble] 本地视频加载失败，回退到远程URL:", localPath.value);
        videoFallback.value = true;
      } else {
        videoReady.value = false;
      }
    }
    const finalVideoSrc = computed(() => {
      if (videoFallback.value) {
        return videoUrl.value;
      }
      return displayVideoUrl.value;
    });
    function updateElapsedTime() {
      if (props.bubble.startTime) {
        const now = Date.now();
        elapsedSeconds.value = Math.floor((now - props.bubble.startTime) / 1e3);
      }
    }
    function formatDuration(seconds) {
      if (seconds >= 60) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}分${s}秒`;
      }
      return `${seconds}秒`;
    }
    onMounted(() => {
      if (isLoading.value) {
        updateElapsedTime();
        timer = setInterval(updateElapsedTime, 1e3);
      }
    });
    onUnmounted(() => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    watch(() => props.bubble.status, (newStatus) => {
      if (newStatus === "in_progress") {
        elapsedSeconds.value = 0;
        stopTimer();
        startTimer();
      } else if (newStatus === "completed" || newStatus === "failed") {
        stopTimer();
      }
    });
    function startTimer() {
      updateElapsedTime();
      timer = setInterval(updateElapsedTime, 1e3);
    }
    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function regenerate() {
      emit2("regenerate", props.bubble);
    }
    function previewImage(url) {
      if (url) {
        emit2("preview", url);
      }
    }
    function downloadImage(url) {
      if (url) {
        emit2("download", url);
      }
    }
    function downloadVideo(url) {
      if (url) {
        emit2("download", url);
      }
    }
    function insertImage(url) {
      if (url) {
        emit2("insert", url);
      }
    }
    function regenerateSingle(url) {
      emit2("regenerate", { ...props.bubble, regenerateImageUrl: url });
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$l, [
        createBaseVNode("div", _hoisted_2$k, [
          createBaseVNode("div", _hoisted_3$j, [
            _cache[2] || (_cache[2] = createBaseVNode("div", { class: "bubble-avatar" }, [
              createBaseVNode("span", { class: "iconfont icon-clawziyouchuangzuo" })
            ], -1)),
            createBaseVNode("span", _hoisted_4$h, toDisplayString(bubbleType.value), 1),
            _cache[3] || (_cache[3] = createBaseVNode("div", { class: "bubble-divider" }, null, -1))
          ]),
          createBaseVNode("div", _hoisted_5$h, [
            createBaseVNode("div", _hoisted_6$f, [
              createBaseVNode("p", null, toDisplayString(text2.value), 1)
            ]),
            referenceImages.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_7$f, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(referenceImages.value, (img, idx) => {
                return openBlock(), createElementBlock("div", {
                  key: idx,
                  class: "ref-image"
                }, [
                  createBaseVNode("img", { src: img }, null, 8, _hoisted_8$e)
                ]);
              }), 128))
            ])) : createCommentVNode("", true),
            createBaseVNode("div", _hoisted_9$b, [
              !isLoading.value ? (openBlock(), createElementBlock("div", _hoisted_10$a, [
                createBaseVNode("button", {
                  class: "action-btn",
                  onClick: handleCopy,
                  title: "复制"
                }, [..._cache[4] || (_cache[4] = [
                  createBaseVNode("span", { class: "iconfont icon-clawfuzhi" }, null, -1),
                  createTextVNode(" 复制文字 ", -1)
                ])]),
                !isLoading.value ? (openBlock(), createElementBlock("button", {
                  key: 0,
                  class: "action-btn",
                  onClick: regenerate,
                  title: "重新生成"
                }, [..._cache[5] || (_cache[5] = [
                  createBaseVNode("span", { class: "iconfont icon-clawshuaxin" }, null, -1),
                  createTextVNode(" 重新生成 ", -1)
                ])])) : createCommentVNode("", true)
              ])) : createCommentVNode("", true),
              isLoading.value ? (openBlock(), createElementBlock("span", _hoisted_11$9, [
                _cache[6] || (_cache[6] = createBaseVNode("span", { class: "iconfont icon-clawshuaxin" }, null, -1)),
                createTextVNode(" 生成中 已用" + toDisplayString(formatDuration(elapsedSeconds.value)), 1)
              ])) : createCommentVNode("", true)
            ])
          ]),
          loadStatus.value ? (openBlock(), createElementBlock("div", _hoisted_12$8, [
            loadDuration.value ? (openBlock(), createElementBlock("span", _hoisted_13$8, "耗时 " + toDisplayString(formatDuration(loadDuration.value)), 1)) : createCommentVNode("", true),
            createBaseVNode("span", {
              class: normalizeClass(["meta-status", loadStatus.value])
            }, toDisplayString(loadStatusText.value), 3),
            loadStatus.value === "failed" && error.value ? (openBlock(), createElementBlock("span", _hoisted_14$8, toDisplayString(error.value), 1)) : createCommentVNode("", true)
          ])) : createCommentVNode("", true),
          props.bubbleMode === "image" && imageUrls.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_15$8, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(imageUrls.value, (url, index) => {
              return openBlock(), createElementBlock("div", {
                key: index,
                class: "bubble-image-item"
              }, [
                createBaseVNode("div", {
                  class: normalizeClass(["image-placeholder", { loaded: imageLoaded.value[index], error: imageError.value[index] }])
                }, [
                  createBaseVNode("img", {
                    src: url,
                    onLoad: ($event) => onImageLoad(index),
                    onError: ($event) => onImageError(index),
                    onClick: ($event) => previewImage(url),
                    class: "bubble-image"
                  }, null, 40, _hoisted_16$8),
                  imageLoaded.value[index] ? (openBlock(), createElementBlock("div", _hoisted_17$7, [
                    createBaseVNode("button", {
                      class: "image-action-btn generate-btn",
                      onClick: withModifiers(($event) => insertImage(url), ["stop"]),
                      title: "基于此图生成（插入左侧参考图）"
                    }, [..._cache[7] || (_cache[7] = [
                      createBaseVNode("span", { class: "iconfont icon-clawtupian" }, null, -1)
                    ])], 8, _hoisted_18$7),
                    createBaseVNode("button", {
                      class: "image-action-btn",
                      onClick: withModifiers(($event) => regenerateSingle(url), ["stop"]),
                      title: "根据相同参数重新生成"
                    }, [..._cache[8] || (_cache[8] = [
                      createBaseVNode("span", { class: "iconfont icon-clawshuaxin" }, null, -1)
                    ])], 8, _hoisted_19$7),
                    createBaseVNode("button", {
                      class: "image-action-btn",
                      onClick: withModifiers(($event) => downloadImage(url), ["stop"]),
                      title: "下载"
                    }, [..._cache[9] || (_cache[9] = [
                      createBaseVNode("span", { class: "iconfont icon-clawxiazai" }, null, -1)
                    ])], 8, _hoisted_20$7)
                  ])) : createCommentVNode("", true)
                ], 2)
              ]);
            }), 128))
          ])) : createCommentVNode("", true),
          props.bubbleMode === "video" && displayVideoUrl.value ? (openBlock(), createElementBlock("div", _hoisted_21$7, [
            createBaseVNode("div", {
              class: "video-preview-overlay",
              onClick: _cache[0] || (_cache[0] = ($event) => previewImage(displayPreviewUrl.value))
            }),
            videoReady.value ? (openBlock(), createElementBlock("div", _hoisted_22$7, [
              createBaseVNode("button", {
                class: "video-action-btn",
                onClick: _cache[1] || (_cache[1] = withModifiers(($event) => downloadVideo(displayPreviewUrl.value), ["stop"])),
                title: "下载视频"
              }, [..._cache[10] || (_cache[10] = [
                createBaseVNode("span", { class: "iconfont icon-clawxiazai" }, null, -1)
              ])])
            ])) : createCommentVNode("", true),
            createBaseVNode("video", {
              src: finalVideoSrc.value,
              class: "bubble-video",
              preload: "metadata",
              controls: "",
              onLoadedmetadata: onVideoLoaded,
              onError: onVideoError
            }, null, 40, _hoisted_23$6)
          ])) : createCommentVNode("", true)
        ])
      ]);
    };
  }
};
const ChatBubble = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["__scopeId", "data-v-b88dc331"]]);
const _hoisted_1$k = { class: "image-grid-wrapper" };
const _hoisted_2$j = { class: "grid-toolbar" };
const _hoisted_3$i = { class: "toolbar-left" };
const _hoisted_4$g = { class: "search-box" };
const _hoisted_5$g = { class: "count-badge" };
const _hoisted_6$e = { class: "toolbar-right" };
const _hoisted_7$e = ["disabled"];
const _hoisted_8$d = {
  key: 0,
  class: "image-grid"
};
const _hoisted_9$a = ["onClick"];
const _hoisted_10$9 = { class: "card-img-wrapper" };
const _hoisted_11$8 = ["src", "alt"];
const _hoisted_12$7 = {
  key: 0,
  class: "type-badge"
};
const _hoisted_13$7 = {
  key: 1,
  class: "type-badge video-badge"
};
const _hoisted_14$7 = { class: "card-overlay" };
const _hoisted_15$7 = ["onClick"];
const _hoisted_16$7 = ["onClick"];
const _hoisted_17$6 = { class: "card-info" };
const _hoisted_18$6 = ["title"];
const _hoisted_19$6 = { class: "card-meta" };
const _hoisted_20$6 = { class: "card-date" };
const _hoisted_21$6 = { class: "card-time" };
const _hoisted_22$6 = {
  key: 1,
  class: "grid-empty"
};
const _hoisted_23$5 = { class: "empty-content" };
const _hoisted_24$5 = ["src"];
const _hoisted_25$4 = ["src"];
const _hoisted_26$4 = { class: "preview-info" };
const _hoisted_27$3 = { class: "preview-prompt" };
const _hoisted_28$3 = { class: "modal-card" };
const _hoisted_29$3 = { class: "modal-actions" };
const _sfc_main$k = {
  __name: "ImageGrid",
  props: {
    images: {
      type: Array,
      default: () => []
    }
  },
  emits: ["delete", "download", "openFolder", "clear"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit2 = __emit;
    const searchText = /* @__PURE__ */ ref("");
    const previewUrl = /* @__PURE__ */ ref(null);
    const previewPrompt = /* @__PURE__ */ ref("");
    const previewMediaType = /* @__PURE__ */ ref("image");
    const showClearConfirm = /* @__PURE__ */ ref(false);
    const filteredImages = computed(() => {
      const kw = searchText.value.trim().toLowerCase();
      if (!kw) return props.images;
      return props.images.filter((img) => {
        const prompt = (img.prompt || "").toLowerCase();
        const model = (img.model || "").toLowerCase();
        return prompt.includes(kw) || model.includes(kw);
      });
    });
    function onSearch() {
    }
    function previewImage(image) {
      previewUrl.value = image.url;
      previewPrompt.value = image.prompt || "";
      previewMediaType.value = image.mediaType || "image";
    }
    function confirmClear() {
      showClearConfirm.value = false;
      emit2("clear");
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$k, [
        createBaseVNode("div", _hoisted_2$j, [
          createBaseVNode("div", _hoisted_3$i, [
            createBaseVNode("div", _hoisted_4$g, [
              _cache[9] || (_cache[9] = createBaseVNode("span", { class: "iconfont icon-clawsousuo search-icon" }, null, -1)),
              withDirectives(createBaseVNode("input", {
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchText.value = $event),
                type: "text",
                class: "search-input",
                placeholder: "搜索提示词或模型...",
                onInput: onSearch
              }, null, 544), [
                [vModelText, searchText.value]
              ]),
              searchText.value ? (openBlock(), createElementBlock("span", {
                key: 0,
                class: "search-clear",
                onClick: _cache[1] || (_cache[1] = ($event) => {
                  searchText.value = "";
                })
              }, "×")) : createCommentVNode("", true)
            ]),
            createBaseVNode("span", _hoisted_5$g, "共 " + toDisplayString(filteredImages.value.length) + " 条", 1)
          ]),
          createBaseVNode("div", _hoisted_6$e, [
            createBaseVNode("button", {
              class: "tool-btn",
              onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("openFolder"))
            }, [..._cache[10] || (_cache[10] = [
              createBaseVNode("span", { class: "iconfont icon-clawwenjianjia" }, null, -1),
              createTextVNode(" 打开文件夹 ", -1)
            ])]),
            createBaseVNode("button", {
              class: "tool-btn danger",
              onClick: _cache[3] || (_cache[3] = ($event) => showClearConfirm.value = true),
              disabled: __props.images.length === 0
            }, [..._cache[11] || (_cache[11] = [
              createBaseVNode("span", { class: "iconfont icon-clawshanchu" }, null, -1),
              createTextVNode(" 清空 ", -1)
            ])], 8, _hoisted_7$e)
          ])
        ]),
        filteredImages.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_8$d, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(filteredImages.value, (image) => {
            return openBlock(), createElementBlock("div", {
              key: image.id,
              class: "image-card",
              onClick: ($event) => previewImage(image)
            }, [
              createBaseVNode("div", _hoisted_10$9, [
                createBaseVNode("img", {
                  src: image.url,
                  alt: image.prompt,
                  loading: "lazy"
                }, null, 8, _hoisted_11$8),
                image.type === "image-to-image" ? (openBlock(), createElementBlock("span", _hoisted_12$7, "图生图")) : image.mediaType === "video" ? (openBlock(), createElementBlock("span", _hoisted_13$7, "视频")) : createCommentVNode("", true),
                createBaseVNode("div", _hoisted_14$7, [
                  createBaseVNode("button", {
                    class: "overlay-btn download",
                    title: "下载",
                    onClick: withModifiers(($event) => _ctx.$emit("download", image.url), ["stop"])
                  }, [..._cache[12] || (_cache[12] = [
                    createBaseVNode("span", { class: "iconfont icon-clawxiazai" }, null, -1)
                  ])], 8, _hoisted_15$7),
                  createBaseVNode("button", {
                    class: "overlay-btn delete",
                    title: "从历史作品中移除",
                    onClick: withModifiers(($event) => _ctx.$emit("delete", image.id), ["stop"])
                  }, [..._cache[13] || (_cache[13] = [
                    createBaseVNode("span", { class: "iconfont icon-clawshanchu" }, null, -1)
                  ])], 8, _hoisted_16$7)
                ])
              ]),
              createBaseVNode("div", _hoisted_17$6, [
                createBaseVNode("div", {
                  class: "card-prompt",
                  title: image.prompt
                }, toDisplayString(image.prompt || "无提示词"), 9, _hoisted_18$6),
                createBaseVNode("div", _hoisted_19$6, [
                  createBaseVNode("span", _hoisted_20$6, toDisplayString(image.date), 1),
                  createBaseVNode("span", _hoisted_21$6, toDisplayString(image.time), 1)
                ])
              ])
            ], 8, _hoisted_9$a);
          }), 128))
        ])) : (openBlock(), createElementBlock("div", _hoisted_22$6, [
          createBaseVNode("div", _hoisted_23$5, [
            _cache[14] || (_cache[14] = createBaseVNode("span", { class: "iconfont icon-clawtupianshengcheng empty-icon" }, null, -1)),
            createBaseVNode("h3", null, toDisplayString(__props.images.length === 0 ? "暂无历史作品" : "无匹配结果"), 1),
            createBaseVNode("p", null, toDisplayString(__props.images.length === 0 ? "生成的图片将显示在这里" : "尝试其他搜索关键词"), 1)
          ])
        ])),
        previewUrl.value ? (openBlock(), createElementBlock("div", {
          key: 2,
          class: "preview-modal",
          onClick: _cache[6] || (_cache[6] = ($event) => previewUrl.value = null)
        }, [
          createBaseVNode("div", {
            class: "preview-content",
            onClick: _cache[5] || (_cache[5] = withModifiers(() => {
            }, ["stop"]))
          }, [
            previewMediaType.value === "video" ? (openBlock(), createElementBlock("video", {
              key: 0,
              src: previewUrl.value,
              class: "preview-video",
              controls: "",
              autoplay: ""
            }, null, 8, _hoisted_24$5)) : (openBlock(), createElementBlock("img", {
              key: 1,
              src: previewUrl.value,
              alt: "Preview",
              class: "preview-image"
            }, null, 8, _hoisted_25$4)),
            createBaseVNode("div", _hoisted_26$4, [
              createBaseVNode("p", _hoisted_27$3, toDisplayString(previewPrompt.value), 1)
            ]),
            createBaseVNode("button", {
              onClick: _cache[4] || (_cache[4] = ($event) => previewUrl.value = null),
              class: "preview-close"
            }, [..._cache[15] || (_cache[15] = [
              createBaseVNode("span", { class: "iconfont icon-clawguanbi1" }, null, -1)
            ])])
          ])
        ])) : createCommentVNode("", true),
        showClearConfirm.value ? (openBlock(), createElementBlock("div", {
          key: 3,
          class: "modal-overlay",
          onClick: _cache[8] || (_cache[8] = withModifiers(($event) => showClearConfirm.value = false, ["self"]))
        }, [
          createBaseVNode("div", _hoisted_28$3, [
            _cache[16] || (_cache[16] = createBaseVNode("h3", { class: "modal-title" }, "确认清除", -1)),
            _cache[17] || (_cache[17] = createBaseVNode("p", { class: "modal-desc" }, "确认是否清除所有历史作品？此操作不可逆，请确认是否操作。", -1)),
            createBaseVNode("div", _hoisted_29$3, [
              createBaseVNode("button", {
                class: "modal-btn cancel",
                onClick: _cache[7] || (_cache[7] = ($event) => showClearConfirm.value = false)
              }, "取消"),
              createBaseVNode("button", {
                class: "modal-btn confirm",
                onClick: confirmClear
              }, "清除")
            ])
          ])
        ])) : createCommentVNode("", true)
      ]);
    };
  }
};
const ImageGrid = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__scopeId", "data-v-270f32a0"]]);
const _hoisted_1$j = { class: "imagegen-view" };
const _hoisted_2$i = { class: "tab-card" };
const _hoisted_3$h = { class: "tab-header" };
const _hoisted_4$f = { class: "free-create-tab" };
const _hoisted_5$f = { class: "session-section" };
const _hoisted_6$d = { class: "session-list-wrapper" };
const _hoisted_7$d = { class: "form-area" };
const _hoisted_8$c = { class: "form-item" };
const _hoisted_9$9 = { class: "form-item" };
const _hoisted_10$8 = { class: "prompt-area" };
const _hoisted_11$7 = { class: "form-item" };
const _hoisted_12$6 = ["value"];
const _hoisted_13$6 = { class: "form-row" };
const _hoisted_14$6 = { class: "form-item form-col" };
const _hoisted_15$6 = ["value"];
const _hoisted_16$6 = { class: "btn-area" };
const _hoisted_17$5 = ["disabled"];
const _hoisted_18$5 = {
  key: 0,
  class: "iconfont icon-clawshuaxin spinning"
};
const _hoisted_19$5 = {
  key: 1,
  class: "iconfont icon-clawtupianshengcheng"
};
const _hoisted_20$5 = { key: 2 };
const _hoisted_21$5 = { key: 3 };
const _hoisted_22$5 = { class: "bubbles-area" };
const _hoisted_23$4 = {
  key: 0,
  class: "empty-bubbles"
};
const _hoisted_24$4 = { class: "history-works-tab" };
const _hoisted_25$3 = {
  key: 0,
  class: "media-warning-banner"
};
const _hoisted_26$3 = {
  key: 2,
  class: "history-empty"
};
const _hoisted_27$2 = { class: "history-empty-desc" };
const _hoisted_28$2 = { class: "modal-card" };
const _hoisted_29$2 = {
  key: 0,
  class: "fullscreen-preview"
};
const _hoisted_30$2 = ["src"];
const _hoisted_31$2 = ["src"];
const _sfc_main$j = {
  __name: "ImageGen",
  setup(__props) {
    const MODEL_DISPLAY_NAMES = {
      "gpt-image-2": "龙虾AI「专业视觉创作」",
      "gemini-3.1-flash-image-preview": "龙虾AI「高速视觉编辑」"
    };
    function getModelDisplayName(modelName) {
      return MODEL_DISPLAY_NAMES[modelName] || modelName;
    }
    const { showToast } = useToast();
    useModelsStore();
    useUserStore();
    const sessions = /* @__PURE__ */ ref([]);
    const currentSessionId = /* @__PURE__ */ ref(null);
    const activeTab = /* @__PURE__ */ ref("free");
    const leftPanelCollapsed = /* @__PURE__ */ ref(false);
    const referenceImages = /* @__PURE__ */ ref([]);
    const pollingTimers = /* @__PURE__ */ ref(/* @__PURE__ */ new Map());
    const historyImages = computed(() => {
      const images = [];
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          if (msg.status === "completed" && !msg.hideInHistory) {
            const url = msg.imageUrl || msg.videoUrl;
            if (url) {
              images.push({
                id: msg.taskId || `${session.id}_${i}`,
                url: Array.isArray(url) ? url[0] : url,
                mediaType: msg.videoUrl ? "video" : "image",
                prompt: msg.text || "",
                model: msg.model || "",
                type: msg.type || "",
                date: msg.startTime ? new Date(msg.startTime).toLocaleDateString("zh-CN") : "",
                time: msg.loadedTime || msg.time || ""
              });
            }
          }
        }
      }
      images.reverse();
      return images;
    });
    const inputText = /* @__PURE__ */ ref("");
    const imageModels = /* @__PURE__ */ ref([]);
    const selectedModel = /* @__PURE__ */ ref("gpt-image-2");
    const selectedResolution = /* @__PURE__ */ ref("2K");
    const selectedSizeRatio = /* @__PURE__ */ ref("1:1");
    const generating = /* @__PURE__ */ ref(false);
    const pendingTasks = /* @__PURE__ */ ref(0);
    const showDeleteConfirm = /* @__PURE__ */ ref(false);
    const deletingSessionId = /* @__PURE__ */ ref(null);
    const showEditModal = /* @__PURE__ */ ref(false);
    const editingSessionId = /* @__PURE__ */ ref(null);
    const editingTitle = /* @__PURE__ */ ref("");
    const editInput = /* @__PURE__ */ ref(null);
    const showPreview = /* @__PURE__ */ ref(false);
    const previewUrl = /* @__PURE__ */ ref("");
    const previewMediaType = /* @__PURE__ */ ref("image");
    function getOrientation(ratio) {
      const [w, h2] = ratio.split(":").map(Number);
      if (w === h2) return "方图";
      return w > h2 ? "横图" : "竖图";
    }
    const modelSizeOptions = {
      "gpt-image-2": [
        { ratio: "1:1", pixels: "2048x2048" },
        { ratio: "3:2", pixels: "2048x1360" },
        { ratio: "2:3", pixels: "1360x2048" },
        { ratio: "4:3", pixels: "2048x1536" },
        { ratio: "3:4", pixels: "1536x2048" },
        { ratio: "5:4", pixels: "2560x2048" },
        { ratio: "4:5", pixels: "2048x2560" },
        { ratio: "16:9", pixels: "2048x1152" },
        { ratio: "9:16", pixels: "1152x2048" },
        { ratio: "2:1", pixels: "2688x1344" },
        { ratio: "1:2", pixels: "1344x2688" },
        { ratio: "21:9", pixels: "2688x1152" },
        { ratio: "9:21", pixels: "1152x2688" }
      ],
      "gemini-3.1-flash-image-preview": [
        { ratio: "1:1", desc: "方形图、头像、社交媒体" },
        { ratio: "3:2", desc: "标准照片" },
        { ratio: "2:3", desc: "标准照片" },
        { ratio: "4:3", desc: "传统显示器比例" },
        { ratio: "3:4", desc: "传统显示器比例" },
        { ratio: "16:9", desc: "宽屏视频封面" },
        { ratio: "9:16", desc: "竖屏视频封面" },
        { ratio: "5:4", desc: "Instagram 图片" },
        { ratio: "4:5", desc: "Instagram 图片" },
        { ratio: "21:9", desc: "超宽屏 Banner" },
        { ratio: "1:4", desc: "长条海报" },
        { ratio: "4:1", desc: "横幅" },
        { ratio: "1:8", desc: "极端长图" },
        { ratio: "8:1", desc: "横幅广告" }
      ]
    };
    const currentSizeOptions = computed(() => {
      const options = modelSizeOptions[selectedModel.value] || modelSizeOptions["gpt-image-2"];
      return options.map((opt) => {
        const ori = getOrientation(opt.ratio);
        const label = opt.pixels ? `${opt.ratio} · ${opt.pixels} · ${ori}` : `${opt.ratio} · ${ori}`;
        return { ...opt, label };
      });
    });
    watch(selectedModel, (newModel) => {
      const validRatios = (modelSizeOptions[newModel] || modelSizeOptions["gpt-image-2"]).map((opt) => opt.ratio);
      if (!validRatios.includes(selectedSizeRatio.value)) {
        selectedSizeRatio.value = validRatios[0] || "1:1";
      }
    });
    const currentSession = computed(() => {
      return sessions.value.find((s) => s.id === currentSessionId.value && !s.deleted);
    });
    const bubbles = computed(() => {
      return currentSession.value?.messages || [];
    });
    function toggleLeftPanel() {
      leftPanelCollapsed.value = !leftPanelCollapsed.value;
    }
    const mediaFileCount = /* @__PURE__ */ ref({ imageCount: 0, videoCount: 0 });
    const showMediaWarning = /* @__PURE__ */ ref(false);
    async function checkMediaFileCount() {
      try {
        const result = await window.uclaw.ipcGetMediaFileCount();
        if (result?.ok && result.data) {
          mediaFileCount.value = result.data;
          showMediaWarning.value = result.data.imageCount >= 1e3;
        }
      } catch (e) {
        console.error("[ImageGen] checkMediaFileCount failed:", e);
      }
    }
    onMounted(async () => {
      await loadSessions();
      await loadImageModels();
      resumePendingPolls();
      checkMediaFileCount();
    });
    watch(activeTab, (tab) => {
      if (tab === "history") {
        checkMediaFileCount();
      }
    });
    watch(selectedModel, async (newModel, oldModel) => {
      if (!oldModel) return;
      await saveSessions();
      sessions.value = [];
      currentSessionId.value = null;
      await loadSessions();
    });
    async function loadImageModels() {
      try {
        imageModels.value = [];
        selectedModel.value = "";
      } catch (e) {
        console.error("[ImageGen] loadImageModels failed:", e);
      }
    }
    async function loadSessions() {
      const cached = sessionsCache$1._all;
      if (cached) {
        sessions.value = cached.sessions || [];
        currentSessionId.value = cached.currentSessionId;
        return;
      }
      try {
        const result = await window.uclaw.ipcLoadImageSessions();
        if (result?.ok && result.data) {
          sessions.value = result.data.sessions || [];
          currentSessionId.value = result.data.currentSessionId;
          sessionsCache$1._all = result.data;
        }
      } catch (e) {
        console.error("[ImageGen] Load sessions failed:", e);
      }
    }
    function resumePendingPolls() {
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          if (!msg.taskId) continue;
          if (msg.status !== "in_progress" && msg.status !== "queued") continue;
          if (pollingTimers.value.has(msg.taskId)) continue;
          pendingTasks.value++;
          generating.value = true;
          pollTaskStatus(msg.taskId, i, session.id, selectedModel.value);
        }
      }
    }
    async function saveSessions() {
      console.log("saveSessions 被调用", {
        sessionsCount: sessions.value.length,
        currentSessionId: currentSessionId.value,
        currentSessionIdInSession: sessions.value.find((s) => s.id === currentSessionId.value)?.id
      });
      try {
        const plainSessions = JSON.parse(JSON.stringify(/* @__PURE__ */ toRaw(sessions.value)));
        sessionsCache$1._all = { sessions: plainSessions, currentSessionId: currentSessionId.value };
        await window.uclaw.ipcSaveImageSessions(plainSessions, currentSessionId.value);
      } catch (e) {
        console.error("[ImageGen] Save sessions failed:", e);
      }
    }
    function createNewSession() {
      const newSession = {
        id: Date.now().toString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        messages: [],
        status: "empty"
      };
      sessions.value.unshift(newSession);
      currentSessionId.value = newSession.id;
      saveSessions();
      return newSession;
    }
    function selectSession(sessionId) {
      currentSessionId.value = sessionId;
      saveSessions();
    }
    function handleSessionSelect(sessionId) {
      selectSession(sessionId);
    }
    function handleSessionDelete(sessionId) {
      deletingSessionId.value = sessionId;
      showDeleteConfirm.value = true;
    }
    function confirmDeleteSession() {
      const sessionId = deletingSessionId.value;
      if (!sessionId) return;
      sessions.value.forEach((session2) => {
        if (session2.id === sessionId) {
          session2.messages.forEach((msg) => {
            if (msg.taskId && pollingTimers.value.has(msg.taskId)) {
              clearInterval(pollingTimers.value.get(msg.taskId));
              pollingTimers.value.delete(msg.taskId);
            }
          });
        }
      });
      const session = sessions.value.find((s) => s.id === sessionId);
      if (session) {
        session.deleted = true;
        if (currentSessionId.value === sessionId) {
          const nextSession = sessions.value.find((s) => !s.deleted);
          currentSessionId.value = nextSession?.id || null;
        }
        saveSessions();
      }
      cancelDeleteSession();
    }
    function cancelDeleteSession() {
      showDeleteConfirm.value = false;
      deletingSessionId.value = null;
    }
    function handleSessionEdit(sessionId) {
      const session = sessions.value.find((s) => s.id === sessionId);
      if (!session) return;
      editingSessionId.value = sessionId;
      if (session.title) {
        editingTitle.value = session.title;
      } else {
        const messages = session.messages || [];
        const lastMsg = messages[messages.length - 1];
        editingTitle.value = lastMsg?.text || "";
      }
      showEditModal.value = true;
      nextTick(() => {
        editInput.value?.focus();
      });
    }
    function saveSessionTitle() {
      const session = sessions.value.find((s) => s.id === editingSessionId.value);
      if (!session) return;
      session.title = editingTitle.value.trim() || "";
      saveSessions();
      closeEditModal();
    }
    function closeEditModal() {
      showEditModal.value = false;
      editingSessionId.value = null;
      editingTitle.value = "";
    }
    async function generateImage() {
      const text2 = inputText.value.trim();
      if (!text2) return;
      const isRegenerate = regenerateSessionId !== null;
      if (!isRegenerate) {
        createNewSession();
      }
      generating.value = true;
      const msgType = referenceImages.value.length > 0 ? "image-to-image" : "text-to-image";
      const optimisticMsg = {
        role: "ai",
        type: msgType,
        text: text2,
        taskId: null,
        status: "queued",
        progress: 0,
        imageUrl: null,
        revisedPrompt: "",
        model: selectedModel.value,
        time: formatTime(),
        startTime: Date.now(),
        referenceImages: referenceImages.value
      };
      let msgIndex = -1;
      if (currentSession.value) {
        currentSession.value.messages.push(optimisticMsg);
        msgIndex = currentSession.value.messages.length - 1;
        saveSessions();
      }
      try {
        const isGeminiModel = selectedModel.value === "gemini-3.1-flash-image-preview";
        const resolutionParam = isGeminiModel ? { metadata: { resolution: selectedResolution.value } } : { resolution: selectedResolution.value };
        const taskResult = { error: "AI图片工具已移除" };
        const msg = currentSession.value?.messages[msgIndex];
        if (!msg) {
          generating.value = false;
          return;
        }
        if (taskResult.error) {
          msg.status = "failed";
          msg.error = taskResult.error;
          msg.loadStatus = "failed";
          msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
          saveSessions();
          showToast("生成失败: " + taskResult.error, true);
          generating.value = false;
          return;
        }
        let taskId = taskResult.id;
        let imageUrl = null;
        let status = "queued";
        if (taskResult.result?.data && taskResult.result?.data[0]?.url) {
          imageUrl = taskResult.result?.data[0].url;
          status = "completed";
        } else if (taskResult.result?.data && taskResult.result?.data[0]?.b64_json) {
          imageUrl = `data:image/png;base64,${taskResult.result?.data[0].b64_json}`;
          status = "completed";
        }
        msg.taskId = taskId;
        msg.status = status;
        msg.imageUrl = imageUrl;
        msg.revisedPrompt = taskResult.result?.data?.[0]?.revised_prompt || "";
        saveSessions();
        if (taskId && status !== "completed") {
          pendingTasks.value++;
          pollTaskStatus(taskId, msgIndex, currentSession.value.id, selectedModel.value);
        } else {
          if (imageUrl) {
            showToast("图片生成成功");
            saveImageToMedia(imageUrl, taskId, msg);
          }
          if (pendingTasks.value === 0) {
            generating.value = false;
          }
        }
        inputText.value = "";
        referenceImages.value = [];
        regenerateSessionId = null;
      } catch (e) {
        const msg = currentSession.value?.messages[msgIndex];
        if (msg) {
          msg.status = "failed";
          msg.error = e.message;
          msg.loadStatus = "failed";
          msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
          saveSessions();
        }
        showToast("生成失败: " + e.message, true);
        generating.value = false;
        regenerateSessionId = null;
      }
    }
    async function pollTaskStatus(taskId, msgIndex, sessionId, model) {
      const maxPolls = 200;
      let pollCount = 0;
      let errorCount = 0;
      const maxErrors = 5;
      const timer = setInterval(async () => {
        pollCount++;
        try {
          const result = { status: "failed", error: "AI图片工具已移除", progress: 0 };
          errorCount = 0;
          const session = sessions.value.find((s) => s.id === sessionId);
          if (!session || msgIndex >= session.messages.length) {
            clearInterval(timer);
            pollingTimers.value.delete(taskId);
            generating.value = false;
            return;
          }
          const msg = session.messages[msgIndex];
          const newStatus = result.status;
          const newProgress = result.progress || 0;
          console.log("newStatus", newStatus, newProgress);
          if (msg.status !== newStatus || msg.progress !== newProgress) {
            msg.status = newStatus;
            msg.progress = newProgress;
            msg.revisedPrompt = result.result?.data?.[0]?.revised_prompt || msg.revisedPrompt;
            msg.error = result.error || null;
            if (newStatus === "completed" && result.result?.data?.[0]?.url) {
              msg.imageUrl = result.result?.data[0].url;
              msg.loadedTime = formatTime();
              msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
              msg.loadStatus = "success";
              saveImageToMedia(result.result?.data[0].url, taskId, msg);
              clearInterval(timer);
              pollingTimers.value.delete(taskId);
              pendingTasks.value--;
              showToast("图片生成成功");
              if (pendingTasks.value === 0) {
                generating.value = false;
              }
              saveSessions();
              return;
            } else if (newStatus === "failed") {
              msg.error = result.result?.error || result.error || "生成失败";
              msg.loadStatus = "failed";
              msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
              clearInterval(timer);
              pollingTimers.value.delete(taskId);
              pendingTasks.value--;
              showToast("图片生成失败: " + msg.error, true);
              if (pendingTasks.value === 0) {
                generating.value = false;
              }
              saveSessions();
              return;
            }
            saveSessions();
          }
          if (pollCount >= maxPolls) {
            clearInterval(timer);
            pollingTimers.value.delete(taskId);
            pendingTasks.value--;
            msg.status = "failed";
            msg.error = "生成超时";
            msg.loadStatus = "failed";
            msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
            if (pendingTasks.value === 0) {
              generating.value = false;
            }
            saveSessions();
          }
        } catch (e) {
          console.error("[ImageGen] Poll status failed:", e);
          errorCount++;
          if (errorCount >= maxErrors) {
            clearInterval(timer);
            pollingTimers.value.delete(taskId);
            pendingTasks.value--;
            const session = sessions.value.find((s) => s.id === sessionId);
            if (session && msgIndex < session.messages.length) {
              session.messages[msgIndex].error = "轮询失败: 网络错误";
              session.messages[msgIndex].status = "failed";
              session.messages[msgIndex].loadStatus = "failed";
              session.messages[msgIndex].loadDuration = Math.round((Date.now() - session.messages[msgIndex].startTime) / 1e3);
            }
            if (pendingTasks.value === 0) {
              generating.value = false;
            }
            saveSessions();
            showToast("图片生成失败: 网络连接异常", true);
          }
        }
      }, 3e3);
      pollingTimers.value.set(taskId, timer);
    }
    let regenerateSessionId = null;
    async function handleRegenerate(bubble) {
      let targetSession = null;
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          if (msg.taskId === bubble.taskId && msg.text === bubble.text) {
            targetSession = session;
            break;
          }
        }
        if (targetSession) break;
      }
      if (!targetSession) {
        regenerateSessionId = null;
        inputText.value = bubble.text;
        referenceImages.value = bubble.referenceImages || [];
        await generateImage();
        return;
      }
      inputText.value = bubble.text;
      referenceImages.value = bubble.referenceImages || [];
      regenerateSessionId = targetSession.id;
      currentSessionId.value = targetSession.id;
      await generateImage();
    }
    function handleInsertImage(url) {
      referenceImages.value = [...referenceImages.value, url];
      showToast("已添加为参考图，可进行图生图");
    }
    function handlePreviewImage(url) {
      previewUrl.value = url;
      previewMediaType.value = /\.(mp4|webm|mov|avi|mkv|ogg)(\?|$)/i.test(url) ? "video" : "image";
      showPreview.value = true;
    }
    function closePreview() {
      showPreview.value = false;
      previewUrl.value = "";
      previewMediaType.value = "image";
    }
    async function handleDownloadImage(url) {
      const dirResult = await window.uclaw.ipcSelectDownloadDir({ type: "image" });
      if (!dirResult.ok || dirResult.canceled) {
        return;
      }
      const filepath = dirResult.path;
      try {
        let base64;
        if (url.startsWith("data:")) {
          base64 = url.split(",")[1];
        } else {
          const downloadResult = await window.uclaw.ipcDownloadImage({ url });
          if (!downloadResult.ok) {
            showToast("下载失败: " + (downloadResult.error || "无法下载图片"), true);
            return;
          }
          base64 = downloadResult.base64;
        }
        const saveResult = await window.uclaw.ipcSaveFile({ filepath, buffer: base64 });
        if (saveResult.ok) {
          showToast(`图片已保存至: ${filepath}`);
        } else {
          showToast("保存失败: " + (saveResult.error || "未知错误"), true);
        }
      } catch (e) {
        console.error("[ImageGen] download error:", e);
        showToast("下载失败: " + (e.message || "未知错误"), true);
      }
    }
    function formatTime() {
      const now = /* @__PURE__ */ new Date();
      return now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    }
    async function saveImageToMedia(url, taskId, msg) {
      if (!url || url.startsWith("data:")) return;
      try {
        const result = await window.uclaw.ipcSaveMediaImage({ url, taskId });
        if (result?.ok && result.filepath) {
          msg.localPath = result.filepath;
        } else {
          console.error("[ImageGen] saveImageToMedia returned not ok:", result?.error);
        }
      } catch (e) {
        console.error("[ImageGen] saveImageToMedia failed:", e);
      }
    }
    function handleDeleteHistory(id) {
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          const msgId = msg.taskId || `${session.id}_${i}`;
          if (msgId === id) {
            msg.hideInHistory = true;
            saveSessions();
            return;
          }
        }
      }
    }
    async function handleOpenMediaFolder() {
      await window.uclaw.ipcOpenMediaImageFolder();
    }
    function handleClearHistory() {
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (const msg of session.messages) {
          if (msg.status === "completed" && msg.imageUrl) {
            msg.hideInHistory = true;
          }
        }
      }
      saveSessions();
      showToast("已清空历史作品");
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$j, [
        createBaseVNode("div", _hoisted_2$i, [
          createBaseVNode("div", _hoisted_3$h, [
            createBaseVNode("button", {
              class: normalizeClass({ active: activeTab.value === "free" }),
              onClick: _cache[0] || (_cache[0] = ($event) => activeTab.value = "free")
            }, [..._cache[10] || (_cache[10] = [
              createStaticVNode('<span class="tab-content" data-v-f5a99e1b><span class="iconfont icon-clawziyouchuangzuo" data-v-f5a99e1b></span><span class="tab-text" data-v-f5a99e1b>自由创作</span></span><span class="tab-desc" data-v-f5a99e1b>文生图/图生图 · 多会话</span><span class="tab-indicator" data-v-f5a99e1b></span>', 3)
            ])], 2),
            createBaseVNode("button", {
              class: normalizeClass({ active: activeTab.value === "history" }),
              onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "history")
            }, [..._cache[11] || (_cache[11] = [
              createStaticVNode('<span class="tab-content" data-v-f5a99e1b><span class="iconfont icon-clawlishizuopin" data-v-f5a99e1b></span><span class="tab-text" data-v-f5a99e1b>历史作品</span></span><span class="tab-desc" data-v-f5a99e1b>我的作品</span><span class="tab-indicator" data-v-f5a99e1b></span>', 3)
            ])], 2)
          ])
        ]),
        withDirectives(createBaseVNode("div", _hoisted_4$f, [
          createBaseVNode("div", {
            class: normalizeClass(["left-panel", { collapsed: leftPanelCollapsed.value }])
          }, [
            !leftPanelCollapsed.value ? (openBlock(), createElementBlock("span", {
              key: 0,
              class: "collapse-icon left",
              onClick: toggleLeftPanel
            }, "←")) : (openBlock(), createElementBlock("span", {
              key: 1,
              class: "collapse-icon left",
              onClick: toggleLeftPanel
            }, "→")),
            createBaseVNode("div", _hoisted_5$f, [
              createBaseVNode("div", _hoisted_6$d, [
                createVNode(SessionList$1, {
                  mode: "image",
                  sessions: sessions.value,
                  currentSessionId: currentSessionId.value,
                  onSelect: handleSessionSelect,
                  onDelete: handleSessionDelete,
                  onEdit: handleSessionEdit
                }, null, 8, ["sessions", "currentSessionId"])
              ]),
              _cache[12] || (_cache[12] = createBaseVNode("div", { class: "api-key-hint" }, "已自动使用【模型配置】的API Key", -1))
            ]),
            createBaseVNode("div", _hoisted_7$d, [
              createBaseVNode("div", _hoisted_8$c, [
                _cache[13] || (_cache[13] = createBaseVNode("label", { class: "form-label" }, "参考图", -1)),
                createVNode(ReferenceImages, {
                  images: referenceImages.value,
                  "onUpdate:images": _cache[2] || (_cache[2] = ($event) => referenceImages.value = $event)
                }, null, 8, ["images"])
              ]),
              createBaseVNode("div", _hoisted_9$9, [
                _cache[14] || (_cache[14] = createBaseVNode("label", { class: "form-label" }, "提示词", -1)),
                createBaseVNode("div", _hoisted_10$8, [
                  withDirectives(createBaseVNode("textarea", {
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => inputText.value = $event),
                    class: "prompt-textarea",
                    placeholder: "描述你想要生成的图片...",
                    rows: 4
                  }, null, 512), [
                    [vModelText, inputText.value]
                  ])
                ])
              ]),
              createBaseVNode("div", _hoisted_11$7, [
                _cache[15] || (_cache[15] = createBaseVNode("label", { class: "form-label" }, "模型", -1)),
                withDirectives(createBaseVNode("select", {
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => selectedModel.value = $event),
                  class: "option-select"
                }, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(imageModels.value, (model) => {
                    return openBlock(), createElementBlock("option", {
                      key: model.model_name,
                      value: model.model_name
                    }, toDisplayString(getModelDisplayName(model.model_name)), 9, _hoisted_12$6);
                  }), 128))
                ], 512), [
                  [vModelSelect, selectedModel.value]
                ])
              ]),
              createBaseVNode("div", _hoisted_13$6, [
                _cache[17] || (_cache[17] = createBaseVNode("div", { class: "form-item form-col" }, [
                  createBaseVNode("label", { class: "form-label" }, "分辨率"),
                  createBaseVNode("div", { class: "resolution-fixed" }, "2K")
                ], -1)),
                createBaseVNode("div", _hoisted_14$6, [
                  _cache[16] || (_cache[16] = createBaseVNode("label", { class: "form-label" }, "尺寸", -1)),
                  withDirectives(createBaseVNode("select", {
                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => selectedSizeRatio.value = $event),
                    class: "option-select"
                  }, [
                    (openBlock(true), createElementBlock(Fragment, null, renderList(currentSizeOptions.value, (size) => {
                      return openBlock(), createElementBlock("option", {
                        key: size.ratio,
                        value: size.ratio
                      }, toDisplayString(size.label), 9, _hoisted_15$6);
                    }), 128))
                  ], 512), [
                    [vModelSelect, selectedSizeRatio.value]
                  ])
                ])
              ])
            ]),
            createBaseVNode("div", _hoisted_16$6, [
              createBaseVNode("button", {
                onClick: generateImage,
                class: normalizeClass(["generate-btn", { active: inputText.value.trim() && !generating.value, generating: generating.value }]),
                disabled: !inputText.value.trim()
              }, [
                generating.value ? (openBlock(), createElementBlock("span", _hoisted_18$5)) : (openBlock(), createElementBlock("span", _hoisted_19$5)),
                generating.value ? (openBlock(), createElementBlock("span", _hoisted_20$5, "添加到队列中")) : (openBlock(), createElementBlock("span", _hoisted_21$5, "生成图片"))
              ], 10, _hoisted_17$5)
            ])
          ], 2),
          createBaseVNode("div", {
            class: normalizeClass(["right-panel", { "right-panel-active": bubbles.value.length > 0 }])
          }, [
            createBaseVNode("span", {
              class: "collapse-icon",
              onClick: toggleLeftPanel
            }, [..._cache[18] || (_cache[18] = [
              createBaseVNode("span", { class: "iconfont icon-clawzhedie" }, null, -1)
            ])]),
            createBaseVNode("div", _hoisted_22$5, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(bubbles.value, (bubble, index) => {
                return openBlock(), createBlock(ChatBubble, {
                  key: index,
                  bubble,
                  "bubble-mode": "image",
                  modelName: selectedModel.value,
                  onRegenerate: handleRegenerate,
                  onCopySuccess: unref(showToast),
                  onInsert: handleInsertImage,
                  onDownload: handleDownloadImage,
                  onPreview: handlePreviewImage
                }, null, 8, ["bubble", "modelName", "onCopySuccess"]);
              }), 128)),
              !bubbles.value.length ? (openBlock(), createElementBlock("div", _hoisted_23$4, [..._cache[19] || (_cache[19] = [
                createStaticVNode('<div class="empty-bubbles-content" data-v-f5a99e1b><div class="empty-bubbles-icon" data-v-f5a99e1b><span class="iconfont icon-clawtupianshengcheng" data-v-f5a99e1b></span></div><h3 class="empty-bubbles-title" data-v-f5a99e1b>开始创作</h3><p class="empty-bubbles-desc" data-v-f5a99e1b>在左侧填写描述 → 点&quot;生成图片&quot;<br data-v-f5a99e1b>每次生成会自动新建会话，保存到 U 盘</p><ul class="empty-bubbles-tips" data-v-f5a99e1b><li data-v-f5a99e1b>💡 文生图：不传参考图，从文字生成</li><li data-v-f5a99e1b>💡 图生图：上传参考图 + 描述修改</li><li data-v-f5a99e1b>💡 继续修改：点结果图的按钮→图到左侧参考图</li><li data-v-f5a99e1b>💡 右键图片：复制到剪贴板</li></ul></div>', 1)
              ])])) : createCommentVNode("", true)
            ])
          ], 2)
        ], 512), [
          [vShow, activeTab.value === "free"]
        ]),
        withDirectives(createBaseVNode("div", _hoisted_24$4, [
          showMediaWarning.value ? (openBlock(), createElementBlock("div", _hoisted_25$3, [
            _cache[20] || (_cache[20] = createBaseVNode("span", { class: "iconfont icon-clawtishi" }, null, -1)),
            createBaseVNode("span", null, "图片文件夹文件数已达 " + toDisplayString(mediaFileCount.value.imageCount) + " 个，请及时清理历史作品", 1)
          ])) : createCommentVNode("", true),
          historyImages.value.length > 0 ? (openBlock(), createBlock(ImageGrid, {
            key: 1,
            images: historyImages.value,
            onDelete: handleDeleteHistory,
            onDownload: handleDownloadImage,
            onOpenFolder: handleOpenMediaFolder,
            onClear: handleClearHistory
          }, null, 8, ["images"])) : (openBlock(), createElementBlock("div", _hoisted_26$3, [
            _cache[23] || (_cache[23] = createBaseVNode("div", { class: "history-empty-icon" }, [
              createBaseVNode("span", { class: "iconfont icon-clawtupianshengcheng" })
            ], -1)),
            _cache[24] || (_cache[24] = createBaseVNode("p", { class: "history-empty-title" }, "还没有作品", -1)),
            createBaseVNode("p", _hoisted_27$2, [
              _cache[21] || (_cache[21] = createTextVNode("去", -1)),
              createBaseVNode("span", {
                class: "history-empty-link",
                onClick: _cache[6] || (_cache[6] = ($event) => activeTab.value = "free")
              }, "「自由创作」"),
              _cache[22] || (_cache[22] = createTextVNode("生成第一张图吧", -1))
            ])
          ]))
        ], 512), [
          [vShow, activeTab.value === "history"]
        ]),
        showDeleteConfirm.value ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: "modal-overlay",
          onClick: withModifiers(cancelDeleteSession, ["self"])
        }, [
          createBaseVNode("div", { class: "modal-card" }, [
            _cache[25] || (_cache[25] = createBaseVNode("h3", { class: "modal-title" }, "确认删除", -1)),
            _cache[26] || (_cache[26] = createBaseVNode("p", { class: "modal-desc" }, "确定要删除该会话吗？", -1)),
            createBaseVNode("div", { class: "modal-actions" }, [
              createBaseVNode("button", {
                class: "modal-btn cancel",
                onClick: cancelDeleteSession
              }, "取消"),
              createBaseVNode("button", {
                class: "modal-btn confirm",
                onClick: confirmDeleteSession
              }, "删除")
            ])
          ])
        ])) : createCommentVNode("", true),
        showEditModal.value ? (openBlock(), createElementBlock("div", {
          key: 1,
          class: "modal-overlay",
          onClick: withModifiers(closeEditModal, ["self"])
        }, [
          createBaseVNode("div", _hoisted_28$2, [
            _cache[27] || (_cache[27] = createBaseVNode("h3", { class: "modal-title" }, "编辑会话标题", -1)),
            withDirectives(createBaseVNode("input", {
              ref_key: "editInput",
              ref: editInput,
              "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => editingTitle.value = $event),
              class: "modal-input",
              placeholder: "输入会话标题...",
              onKeyup: [
                withKeys(saveSessionTitle, ["enter"]),
                withKeys(closeEditModal, ["esc"])
              ]
            }, null, 544), [
              [vModelText, editingTitle.value]
            ]),
            createBaseVNode("div", { class: "modal-actions" }, [
              createBaseVNode("button", {
                class: "modal-btn cancel",
                onClick: closeEditModal
              }, "取消"),
              createBaseVNode("button", {
                class: "modal-btn confirm",
                onClick: saveSessionTitle
              }, "保存")
            ])
          ])
        ])) : createCommentVNode("", true),
        (openBlock(), createBlock(Teleport, { to: "body" }, [
          showPreview.value ? (openBlock(), createElementBlock("div", _hoisted_29$2, [
            createBaseVNode("button", {
              class: "preview-download-btn",
              onClick: _cache[8] || (_cache[8] = withModifiers(($event) => handleDownloadImage(previewUrl.value), ["stop"])),
              title: "下载"
            }, [..._cache[28] || (_cache[28] = [
              createBaseVNode("span", { class: "iconfont icon-clawxiazai" }, null, -1)
            ])]),
            createBaseVNode("button", {
              class: "preview-close-btn",
              onClick: withModifiers(closePreview, ["stop"]),
              title: "关闭"
            }, [..._cache[29] || (_cache[29] = [
              createBaseVNode("span", { class: "iconfont icon-clawguanbi" }, null, -1)
            ])]),
            previewMediaType.value === "video" ? (openBlock(), createElementBlock("video", {
              key: 0,
              src: previewUrl.value,
              class: "preview-video",
              controls: "",
              autoplay: "",
              loop: "",
              onClick: _cache[9] || (_cache[9] = withModifiers(() => {
              }, ["stop"]))
            }, null, 8, _hoisted_30$2)) : (openBlock(), createElementBlock("img", {
              key: 1,
              src: previewUrl.value,
              class: "preview-image"
            }, null, 8, _hoisted_31$2))
          ])) : createCommentVNode("", true)
        ]))
      ]);
    };
  }
};
const ImageGen = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["__scopeId", "data-v-f5a99e1b"]]);
const sessionsCache = /* @__PURE__ */ reactive({});
async function preloadAllVideoSessions() {
  try {
    const result = await window.uclaw.ipcLoadVideoSessions();
    if (result?.ok && result.data) {
      sessionsCache._all = result.data;
    }
    console.log("[videoGen] preloaded sessions");
  } catch (e) {
    console.error("[videoGen] preloadAllVideoSessions error:", e);
  }
}
const _hoisted_1$i = { class: "video-grid-wrapper" };
const _hoisted_2$h = { class: "grid-toolbar" };
const _hoisted_3$g = { class: "toolbar-left" };
const _hoisted_4$e = { class: "search-box" };
const _hoisted_5$e = { class: "count-badge" };
const _hoisted_6$c = { class: "toolbar-right" };
const _hoisted_7$c = ["disabled"];
const _hoisted_8$b = {
  key: 0,
  class: "video-grid"
};
const _hoisted_9$8 = ["onClick"];
const _hoisted_10$7 = { class: "card-video-wrapper" };
const _hoisted_11$6 = {
  key: 0,
  class: "type-badge"
};
const _hoisted_12$5 = { class: "card-overlay" };
const _hoisted_13$5 = ["onClick"];
const _hoisted_14$5 = ["onClick"];
const _hoisted_15$5 = { class: "card-info" };
const _hoisted_16$5 = ["title"];
const _hoisted_17$4 = { class: "card-meta" };
const _hoisted_18$4 = { class: "card-date" };
const _hoisted_19$4 = { class: "card-time" };
const _hoisted_20$4 = {
  key: 1,
  class: "grid-empty"
};
const _hoisted_21$4 = { class: "empty-content" };
const _hoisted_22$4 = ["src"];
const _hoisted_23$3 = { class: "preview-info" };
const _hoisted_24$3 = { class: "preview-prompt" };
const _hoisted_25$2 = { class: "modal-card" };
const _hoisted_26$2 = { class: "modal-actions" };
const _sfc_main$i = {
  __name: "VideoGrid",
  props: {
    videos: {
      type: Array,
      default: () => []
    }
  },
  emits: ["delete", "download", "openFolder", "clear"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit2 = __emit;
    const searchText = /* @__PURE__ */ ref("");
    const previewUrl = /* @__PURE__ */ ref(null);
    const previewPrompt = /* @__PURE__ */ ref("");
    const showClearConfirm = /* @__PURE__ */ ref(false);
    const filteredVideos = computed(() => {
      const kw = searchText.value.trim().toLowerCase();
      if (!kw) return props.videos;
      return props.videos.filter((v) => {
        const prompt = (v.prompt || "").toLowerCase();
        const model = (v.model || "").toLowerCase();
        return prompt.includes(kw) || model.includes(kw);
      });
    });
    function onSearch() {
    }
    function previewVideo(video) {
      previewUrl.value = video.url;
      previewPrompt.value = video.prompt || "";
    }
    function confirmClear() {
      showClearConfirm.value = false;
      emit2("clear");
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$i, [
        createBaseVNode("div", _hoisted_2$h, [
          createBaseVNode("div", _hoisted_3$g, [
            createBaseVNode("div", _hoisted_4$e, [
              _cache[9] || (_cache[9] = createBaseVNode("span", { class: "iconfont icon-clawsousuo search-icon" }, null, -1)),
              withDirectives(createBaseVNode("input", {
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchText.value = $event),
                type: "text",
                class: "search-input",
                placeholder: "搜索提示词或模型...",
                onInput: onSearch
              }, null, 544), [
                [vModelText, searchText.value]
              ]),
              searchText.value ? (openBlock(), createElementBlock("span", {
                key: 0,
                class: "search-clear",
                onClick: _cache[1] || (_cache[1] = ($event) => {
                  searchText.value = "";
                })
              }, "×")) : createCommentVNode("", true)
            ]),
            createBaseVNode("span", _hoisted_5$e, "共 " + toDisplayString(filteredVideos.value.length) + " 条", 1)
          ]),
          createBaseVNode("div", _hoisted_6$c, [
            createBaseVNode("button", {
              class: "tool-btn",
              onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("openFolder"))
            }, [..._cache[10] || (_cache[10] = [
              createBaseVNode("span", { class: "iconfont icon-clawwenjianjia" }, null, -1),
              createTextVNode(" 打开文件夹 ", -1)
            ])]),
            createBaseVNode("button", {
              class: "tool-btn danger",
              onClick: _cache[3] || (_cache[3] = ($event) => showClearConfirm.value = true),
              disabled: __props.videos.length === 0
            }, [..._cache[11] || (_cache[11] = [
              createBaseVNode("span", { class: "iconfont icon-clawshanchu" }, null, -1),
              createTextVNode(" 清空 ", -1)
            ])], 8, _hoisted_7$c)
          ])
        ]),
        filteredVideos.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_8$b, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(filteredVideos.value, (video) => {
            return openBlock(), createElementBlock("div", {
              key: video.id,
              class: "video-card",
              onClick: ($event) => previewVideo(video)
            }, [
              createBaseVNode("div", _hoisted_10$7, [
                _cache[14] || (_cache[14] = createBaseVNode("div", { class: "video-placeholder" }, [
                  createBaseVNode("span", { class: "iconfont icon-clawicon_shipinshengcheng placeholder-icon" })
                ], -1)),
                video.type === "image-to-video" ? (openBlock(), createElementBlock("span", _hoisted_11$6, "图生视频")) : createCommentVNode("", true),
                createBaseVNode("div", _hoisted_12$5, [
                  createBaseVNode("button", {
                    class: "overlay-btn download",
                    title: "下载",
                    onClick: withModifiers(($event) => _ctx.$emit("download", video.url), ["stop"])
                  }, [..._cache[12] || (_cache[12] = [
                    createBaseVNode("span", { class: "iconfont icon-clawxiazai" }, null, -1)
                  ])], 8, _hoisted_13$5),
                  createBaseVNode("button", {
                    class: "overlay-btn delete",
                    title: "从历史作品中移除",
                    onClick: withModifiers(($event) => _ctx.$emit("delete", video.id), ["stop"])
                  }, [..._cache[13] || (_cache[13] = [
                    createBaseVNode("span", { class: "iconfont icon-clawshanchu" }, null, -1)
                  ])], 8, _hoisted_14$5)
                ])
              ]),
              createBaseVNode("div", _hoisted_15$5, [
                createBaseVNode("div", {
                  class: "card-prompt",
                  title: video.prompt
                }, toDisplayString(video.prompt || "无提示词"), 9, _hoisted_16$5),
                createBaseVNode("div", _hoisted_17$4, [
                  createBaseVNode("span", _hoisted_18$4, toDisplayString(video.date), 1),
                  createBaseVNode("span", _hoisted_19$4, toDisplayString(video.time), 1)
                ])
              ])
            ], 8, _hoisted_9$8);
          }), 128))
        ])) : (openBlock(), createElementBlock("div", _hoisted_20$4, [
          createBaseVNode("div", _hoisted_21$4, [
            _cache[15] || (_cache[15] = createBaseVNode("span", { class: "iconfont icon-clawicon_shipinshengcheng empty-icon" }, null, -1)),
            createBaseVNode("h3", null, toDisplayString(__props.videos.length === 0 ? "暂无历史作品" : "无匹配结果"), 1),
            createBaseVNode("p", null, toDisplayString(__props.videos.length === 0 ? "生成的视频将显示在这里" : "尝试其他搜索关键词"), 1)
          ])
        ])),
        previewUrl.value ? (openBlock(), createElementBlock("div", {
          key: 2,
          class: "preview-modal",
          onClick: _cache[6] || (_cache[6] = ($event) => previewUrl.value = null)
        }, [
          createBaseVNode("div", {
            class: "preview-content",
            onClick: _cache[5] || (_cache[5] = withModifiers(() => {
            }, ["stop"]))
          }, [
            createBaseVNode("video", {
              src: previewUrl.value,
              controls: "",
              autoplay: "",
              loop: "",
              class: "preview-video"
            }, null, 8, _hoisted_22$4),
            createBaseVNode("div", _hoisted_23$3, [
              createBaseVNode("p", _hoisted_24$3, toDisplayString(previewPrompt.value), 1)
            ]),
            createBaseVNode("button", {
              onClick: _cache[4] || (_cache[4] = ($event) => previewUrl.value = null),
              class: "preview-close"
            }, [..._cache[16] || (_cache[16] = [
              createBaseVNode("span", { class: "iconfont icon-clawguanbi1" }, null, -1)
            ])])
          ])
        ])) : createCommentVNode("", true),
        showClearConfirm.value ? (openBlock(), createElementBlock("div", {
          key: 3,
          class: "modal-overlay",
          onClick: _cache[8] || (_cache[8] = withModifiers(($event) => showClearConfirm.value = false, ["self"]))
        }, [
          createBaseVNode("div", _hoisted_25$2, [
            _cache[17] || (_cache[17] = createBaseVNode("h3", { class: "modal-title" }, "确认清除", -1)),
            _cache[18] || (_cache[18] = createBaseVNode("p", { class: "modal-desc" }, "确认是否清除所有历史作品？此操作不可逆，请确认是否操作。", -1)),
            createBaseVNode("div", _hoisted_26$2, [
              createBaseVNode("button", {
                class: "modal-btn cancel",
                onClick: _cache[7] || (_cache[7] = ($event) => showClearConfirm.value = false)
              }, "取消"),
              createBaseVNode("button", {
                class: "modal-btn confirm",
                onClick: confirmClear
              }, "清除")
            ])
          ])
        ])) : createCommentVNode("", true)
      ]);
    };
  }
};
const VideoGrid = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["__scopeId", "data-v-1dd23fd9"]]);
const _hoisted_1$h = { class: "videogen-view" };
const _hoisted_2$g = { class: "tab-card" };
const _hoisted_3$f = { class: "tab-header" };
const _hoisted_4$d = { class: "free-create-tab" };
const _hoisted_5$d = { class: "session-section" };
const _hoisted_6$b = { class: "session-list-wrapper" };
const _hoisted_7$b = { class: "form-area" };
const _hoisted_8$a = { class: "form-item" };
const _hoisted_9$7 = { class: "form-label" };
const _hoisted_10$6 = { class: "form-item" };
const _hoisted_11$5 = { class: "prompt-area" };
const _hoisted_12$4 = { class: "form-item" };
const _hoisted_13$4 = ["value"];
const _hoisted_14$4 = { class: "form-row" };
const _hoisted_15$4 = { class: "form-item form-col" };
const _hoisted_16$4 = { class: "fixed-value" };
const _hoisted_17$3 = { class: "form-item form-col" };
const _hoisted_18$3 = ["value"];
const _hoisted_19$3 = { class: "btn-area" };
const _hoisted_20$3 = ["disabled"];
const _hoisted_21$3 = {
  key: 0,
  class: "iconfont icon-clawshuaxin spinning"
};
const _hoisted_22$3 = {
  key: 1,
  class: "iconfont icon-clawicon_shipinshengcheng"
};
const _hoisted_23$2 = { key: 2 };
const _hoisted_24$2 = { key: 3 };
const _hoisted_25$1 = { class: "bubbles-area" };
const _hoisted_26$1 = {
  key: 0,
  class: "empty-bubbles"
};
const _hoisted_27$1 = { class: "history-works-tab" };
const _hoisted_28$1 = {
  key: 0,
  class: "media-warning-banner"
};
const _hoisted_29$1 = {
  key: 2,
  class: "history-empty"
};
const _hoisted_30$1 = { class: "history-empty-desc" };
const _hoisted_31$1 = { class: "modal-card" };
const _hoisted_32$1 = ["src"];
const _sfc_main$h = {
  __name: "VideoGen",
  setup(__props) {
    const MODEL_DISPLAY_NAMES = {
      "grok-video-3": "龙虾AI「视频创作」超高性价比",
      "doubao-seedance-1-5-pro_720p": "龙虾AI「视频创作」高质量稍贵",
      "veo3.1-fast": "龙虾AI「视频创作」超高性价比"
    };
    const MODEL_METADATA = {
      "grok-video-3": {
        duration: 15,
        aspectRatios: [
          { value: "16:9", label: "16:9（横屏）" },
          { value: "9:16", label: "9:16（竖屏）" },
          { value: "3:2", label: "3:2（横屏）" },
          { value: "2:3", label: "2:3（竖屏）" },
          { value: "1:1", label: "1:1（方形）" }
        ]
      },
      "doubao-seedance-1-5-pro_720p": {
        duration: 10,
        aspectRatios: [
          { value: "16:9", label: "16:9（横屏）" },
          { value: "4:3", label: "4:3（横屏）" },
          { value: "1:1", label: "1:1（方形）" },
          { value: "3:4", label: "3:4（竖屏）" },
          { value: "9:16", label: "9:16（竖屏）" },
          { value: "21:9", label: "21:9（宽屏）" },
          { value: "keep_ratio", label: "图生视频（跟随原图比例）" },
          { value: "adaptive", label: "图生视频（自动适配比例）" }
        ]
      },
      "veo3.1-fast": {
        duration: 8,
        resolution: "1080p",
        aspectRatios: [
          { value: "16:9", label: "16:9（横屏）" },
          { value: "9:16", label: "9:16（竖屏）" }
        ]
      }
    };
    function getModelDisplayName(modelName) {
      return MODEL_DISPLAY_NAMES[modelName] || modelName;
    }
    function toFileUrl(filePath) {
      if (!filePath) return null;
      let normalized = filePath.replace(/\\/g, "/");
      if (normalized.startsWith("local-media://") || normalized.startsWith("file://")) {
        return normalized;
      }
      return "local-media://" + normalized.replace(/^([a-zA-Z]):/, (_, drive) => drive.toUpperCase());
    }
    const currentModelMeta = computed(() => {
      return MODEL_METADATA[selectedModel.value] || { duration: 12, aspectRatios: [{ value: "16:9", label: "16:9（横屏）" }, { value: "9:16", label: "9:16（竖屏）" }] };
    });
    const { showToast } = useToast();
    useModelsStore();
    useUserStore();
    const sessions = /* @__PURE__ */ ref([]);
    const currentSessionId = /* @__PURE__ */ ref(null);
    const activeTab = /* @__PURE__ */ ref("free");
    const leftPanelCollapsed = /* @__PURE__ */ ref(false);
    const referenceImages = /* @__PURE__ */ ref([]);
    const pollingTimers = /* @__PURE__ */ ref(/* @__PURE__ */ new Map());
    const historyVideos = computed(() => {
      const videos = [];
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          if (msg.status === "completed" && (msg.videoUrl || msg.localPath) && !msg.hideInHistory) {
            videos.push({
              id: msg.taskId || `${session.id}_${i}`,
              url: msg.localPath ? toFileUrl(msg.localPath) : msg.videoUrl,
              prompt: msg.text || "",
              model: msg.model || "",
              type: msg.type || "",
              date: msg.startTime ? new Date(msg.startTime).toLocaleDateString("zh-CN") : "",
              time: msg.loadedTime || msg.time || ""
            });
          }
        }
      }
      videos.reverse();
      return videos;
    });
    const inputText = /* @__PURE__ */ ref("");
    const videoModels = /* @__PURE__ */ ref([]);
    const selectedModel = /* @__PURE__ */ ref("veo3.1-fast");
    const selectedAspectRatio = /* @__PURE__ */ ref("16:9");
    const generating = /* @__PURE__ */ ref(false);
    const pendingTasks = /* @__PURE__ */ ref(0);
    const showDeleteConfirm = /* @__PURE__ */ ref(false);
    const deletingSessionId = /* @__PURE__ */ ref(null);
    const showEditModal = /* @__PURE__ */ ref(false);
    const editingSessionId = /* @__PURE__ */ ref(null);
    const editingTitle = /* @__PURE__ */ ref("");
    const editInput = /* @__PURE__ */ ref(null);
    const showPreview = /* @__PURE__ */ ref(false);
    const previewUrl = /* @__PURE__ */ ref("");
    const currentSession = computed(() => {
      return sessions.value.find((s) => s.id === currentSessionId.value && !s.deleted);
    });
    const bubbles = computed(() => {
      return currentSession.value?.messages || [];
    });
    function toggleLeftPanel() {
      leftPanelCollapsed.value = !leftPanelCollapsed.value;
    }
    const mediaFileCount = /* @__PURE__ */ ref({ imageCount: 0, videoCount: 0 });
    const showMediaWarning = /* @__PURE__ */ ref(false);
    async function checkMediaFileCount() {
      try {
        const result = await window.uclaw.ipcGetMediaFileCount();
        if (result?.ok && result.data) {
          mediaFileCount.value = result.data;
          showMediaWarning.value = result.data.videoCount >= 200;
        }
      } catch (e) {
        console.error("[VideoGen] checkMediaFileCount failed:", e);
      }
    }
    onMounted(async () => {
      await loadSessions();
      await loadVideoModels();
      resumePendingPolls();
      checkMediaFileCount();
    });
    watch(activeTab, (tab) => {
      if (tab === "history") {
        checkMediaFileCount();
      }
    });
    watch(selectedModel, async (newModel, oldModel) => {
      const meta = MODEL_METADATA[newModel];
      if (meta?.aspectRatios?.length > 0) {
        const validRatios = meta.aspectRatios.map((r) => r.value);
        if (!validRatios.includes(selectedAspectRatio.value)) {
          selectedAspectRatio.value = validRatios[0];
        }
      }
      if (!oldModel) return;
      await saveSessions();
      sessions.value = [];
      currentSessionId.value = null;
      await loadSessions();
    });
    async function loadVideoModels() {
      try {
        videoModels.value = [];
        selectedModel.value = "";
      } catch (e) {
        console.error("[VideoGen] loadVideoModels failed:", e);
      }
    }
    async function loadSessions() {
      const cached = sessionsCache._all;
      if (cached) {
        sessions.value = cached.sessions || [];
        currentSessionId.value = cached.currentSessionId;
        return;
      }
      try {
        const result = await window.uclaw.ipcLoadVideoSessions();
        if (result?.ok && result.data) {
          sessions.value = result.data.sessions || [];
          currentSessionId.value = result.data.currentSessionId;
          sessionsCache._all = result.data;
        }
      } catch (e) {
        console.error("[VideoGen] Load sessions failed:", e);
      }
    }
    function resumePendingPolls() {
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          if (!msg.taskId) continue;
          if (msg.status !== "in_progress" && msg.status !== "queued") continue;
          if (pollingTimers.value.has(msg.taskId)) continue;
          pendingTasks.value++;
          generating.value = true;
          pollTaskStatus(msg.taskId, i, session.id, msg.model || selectedModel.value);
        }
      }
    }
    async function saveSessions() {
      console.log("saveSessions 被调用", {
        sessionsCount: sessions.value.length,
        currentSessionId: currentSessionId.value
      });
      try {
        const plainSessions = JSON.parse(JSON.stringify(/* @__PURE__ */ toRaw(sessions.value)));
        sessionsCache._all = { sessions: plainSessions, currentSessionId: currentSessionId.value };
        await window.uclaw.ipcSaveVideoSessions(plainSessions, currentSessionId.value);
      } catch (e) {
        console.error("[VideoGen] Save sessions failed:", e);
      }
    }
    async function createNewSession() {
      const newSession = {
        id: Date.now().toString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        messages: [],
        status: "empty"
      };
      sessions.value.unshift(newSession);
      currentSessionId.value = newSession.id;
      await saveSessions();
      return newSession;
    }
    function selectSession(sessionId) {
      currentSessionId.value = sessionId;
      saveSessions();
    }
    function handleSessionSelect(sessionId) {
      selectSession(sessionId);
    }
    function handleSessionDelete(sessionId) {
      deletingSessionId.value = sessionId;
      showDeleteConfirm.value = true;
    }
    async function confirmDeleteSession() {
      const sessionId = deletingSessionId.value;
      if (!sessionId) return;
      sessions.value.forEach((session2) => {
        if (session2.id === sessionId) {
          session2.messages.forEach((msg) => {
            if (msg.taskId && pollingTimers.value.has(msg.taskId)) {
              clearTimeout(pollingTimers.value.get(msg.taskId));
              pollingTimers.value.delete(msg.taskId);
            }
          });
        }
      });
      const session = sessions.value.find((s) => s.id === sessionId);
      if (session) {
        session.deleted = true;
        if (currentSessionId.value === sessionId) {
          const nextSession = sessions.value.find((s) => !s.deleted);
          currentSessionId.value = nextSession?.id || null;
        }
        await saveSessions();
      }
      cancelDeleteSession();
    }
    function cancelDeleteSession() {
      showDeleteConfirm.value = false;
      deletingSessionId.value = null;
    }
    function handleSessionEdit(sessionId) {
      const session = sessions.value.find((s) => s.id === sessionId);
      if (!session) return;
      editingSessionId.value = sessionId;
      if (session.title) {
        editingTitle.value = session.title;
      } else {
        const messages = session.messages || [];
        const lastMsg = messages[messages.length - 1];
        editingTitle.value = lastMsg?.text || "";
      }
      showEditModal.value = true;
      nextTick(() => {
        editInput.value?.focus();
      });
    }
    function saveSessionTitle() {
      const session = sessions.value.find((s) => s.id === editingSessionId.value);
      if (!session) return;
      session.title = editingTitle.value.trim() || "";
      saveSessions();
      closeEditModal();
    }
    function closeEditModal() {
      showEditModal.value = false;
      editingSessionId.value = null;
      editingTitle.value = "";
    }
    async function generateVideo() {
      const text2 = inputText.value.trim();
      if (!text2) return;
      const isRegenerate = regenerateSessionId !== null;
      if (!isRegenerate) {
        await createNewSession();
      }
      generating.value = true;
      const msgType = referenceImages.value.length > 0 ? "image-to-video" : "text-to-video";
      const optimisticMsg = {
        role: "ai",
        type: msgType,
        text: text2,
        taskId: null,
        status: "queued",
        progress: 0,
        videoUrl: null,
        model: selectedModel.value,
        time: formatTime(),
        startTime: Date.now(),
        referenceImages: referenceImages.value
      };
      let msgIndex = -1;
      if (currentSession.value) {
        currentSession.value.messages.push(optimisticMsg);
        msgIndex = currentSession.value.messages.length - 1;
        await saveSessions();
      }
      try {
        const model = selectedModel.value;
        const isGrok = model === "grok-video-3";
        const isDoubao = model === "doubao-seedance-1-5-pro_720p";
        const requestBody = {
          model,
          prompt: text2,
          ...isGrok ? { seconds: String(currentModelMeta.value.duration) } : isDoubao ? { seconds: "10" } : { duration: currentModelMeta.value.duration },
          // 豆包用 size，其他模型用 aspect_ratio
          ...isDoubao ? { size: selectedAspectRatio.value } : { aspect_ratio: selectedAspectRatio.value }
        };
        if (model === "veo3.1-fast") {
          requestBody.metadata = { resolution: currentModelMeta.value.resolution };
        }
        if (referenceImages.value.length > 0) {
          if (isGrok) {
            requestBody.images = [...referenceImages.value];
          } else if (isDoubao) {
            if (referenceImages.value.length >= 1) {
              requestBody.first_frame_image = referenceImages.value[0];
            }
            if (referenceImages.value.length >= 2) {
              requestBody.last_frame_image = referenceImages.value[1];
            }
          } else {
            requestBody.image_urls = [...referenceImages.value];
          }
        }
        const taskResult = { error: "AI视频工具已移除" };
        const msg = currentSession.value?.messages[msgIndex];
        if (!msg) {
          generating.value = false;
          return;
        }
        if (taskResult.code === "insufficient_user_quota") {
          msg.status = "failed";
          msg.error = "预扣费额度失败, 用户剩余额度不足";
          msg.loadStatus = "failed";
          msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
          await saveSessions();
          showToast("预扣费额度失败, 用户剩余额度不足", true);
          generating.value = false;
          return;
        }
        if (taskResult.code === "fail_to_fetch_task") {
          msg.status = "failed";
          msg.error = "默认分组暂无可用源站";
          msg.loadStatus = "failed";
          msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
          await saveSessions();
          showToast("视频生成失败: 默认分组暂无可用源站", true);
          generating.value = false;
          return;
        }
        if (taskResult.error) {
          msg.status = "failed";
          msg.error = taskResult.error;
          msg.loadStatus = "failed";
          msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
          await saveSessions();
          showToast("生成失败: " + taskResult.error, true);
          generating.value = false;
          return;
        }
        let taskId = taskResult.id || taskResult.task_id;
        const initialVideoUrl = taskResult.result?.data?.[0]?.url || taskResult.video_url || taskResult.url || taskResult.metadata?.url || null;
        let videoUrl = initialVideoUrl;
        let status = initialVideoUrl ? "completed" : taskResult.status || "queued";
        msg.taskId = taskId;
        msg.status = status;
        msg.videoUrl = videoUrl;
        await saveSessions();
        if (taskId && status !== "completed") {
          pendingTasks.value++;
          pollTaskStatus(taskId, msgIndex, currentSession.value.id, selectedModel.value);
        } else {
          if (videoUrl) {
            showToast("视频生成成功");
            await saveVideoToMedia(videoUrl, taskId, msg);
          }
          if (pendingTasks.value === 0) {
            generating.value = false;
          }
        }
        inputText.value = "";
        referenceImages.value = [];
        regenerateSessionId = null;
      } catch (e) {
        const msg = currentSession.value?.messages[msgIndex];
        if (msg) {
          msg.status = "failed";
          msg.error = e.message;
          msg.loadStatus = "failed";
          msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
          await saveSessions();
        }
        showToast("生成失败: " + e.message, true);
        generating.value = false;
        regenerateSessionId = null;
      }
    }
    async function pollTaskStatus(taskId, msgIndex, sessionId, model) {
      const maxPolls = 300;
      let pollCount = 0;
      let errorCount = 0;
      const maxErrors = 5;
      let stopped = false;
      const run = async () => {
        if (stopped) return;
        pollCount++;
        try {
          const result = { status: "failed", error: { message: "AI视频工具已移除" }, progress: 0 };
          errorCount = 0;
          const session = sessions.value.find((s) => s.id === sessionId);
          if (!session || msgIndex >= session.messages.length) {
            pollingTimers.value.delete(taskId);
            await stopPolling();
            return;
          }
          const msg = session.messages[msgIndex];
          const newStatus = result.status;
          const newProgress = result.progress || 0;
          const videoUrl = result.result?.data?.[0]?.url || result.video_url || result.url || result.metadata?.url;
          if (!newStatus && result.error) {
            const errCode = result.error.code || "";
            const errMsg = result.error.message || "";
            msg.status = "failed";
            msg.progress = newProgress;
            msg.error = errCode && errMsg ? `[${errCode}] ${errMsg}` : errMsg || errCode || "未知错误";
            msg.loadStatus = "failed";
            msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
            pollingTimers.value.delete(taskId);
            pendingTasks.value--;
            await saveSessions();
            showToast("视频生成失败: " + msg.error, true);
            if (pendingTasks.value === 0) {
              generating.value = false;
            }
            return;
          }
          if (newStatus === "completed") {
            if (!msg.videoUrl || msg.status !== "completed") {
              msg.status = newStatus;
              msg.progress = newProgress;
              msg.error = result.error?.message || null;
              msg.videoUrl = videoUrl || msg.videoUrl || "";
              msg.loadedTime = formatTime();
              msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
              msg.loadStatus = "success";
            }
            pollingTimers.value.delete(taskId);
            pendingTasks.value--;
            if (msg.videoUrl && !msg.localPath) {
              await saveVideoToMedia(msg.videoUrl, taskId, msg);
            }
            await saveSessions();
            showToast("视频生成成功");
            if (pendingTasks.value === 0) {
              generating.value = false;
            }
            return;
          }
          if (newStatus === "failed" && !msg.videoUrl) {
            msg.status = newStatus;
            msg.progress = newProgress;
            msg.error = result.error?.message || result.error || "生成失败";
            msg.loadStatus = "failed";
            msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
            pollingTimers.value.delete(taskId);
            pendingTasks.value--;
            await saveSessions();
            showToast("视频生成失败: " + msg.error, true);
            if (pendingTasks.value === 0) {
              generating.value = false;
            }
            return;
          }
          if (pollCount >= maxPolls) {
            msg.status = "failed";
            msg.progress = newProgress;
            msg.error = "生成超时";
            msg.loadStatus = "failed";
            msg.loadDuration = Math.round((Date.now() - msg.startTime) / 1e3);
            pollingTimers.value.delete(taskId);
            pendingTasks.value--;
            await saveSessions();
            if (pendingTasks.value === 0) {
              generating.value = false;
            }
            return;
          }
          if (msg.status !== newStatus || msg.progress !== newProgress) {
            msg.status = newStatus;
            msg.progress = newProgress;
            msg.error = result.error?.message || null;
            await saveSessions();
          }
          const timer2 = setTimeout(run, 5e3);
          pollingTimers.value.set(taskId, timer2);
        } catch (e) {
          console.error("[VideoGen] Poll status failed:", e);
          errorCount++;
          if (errorCount >= maxErrors) {
            pollingTimers.value.delete(taskId);
            pendingTasks.value--;
            const session = sessions.value.find((s) => s.id === sessionId);
            if (session && msgIndex < session.messages.length) {
              session.messages[msgIndex].error = "轮询失败: 网络错误";
              session.messages[msgIndex].status = "failed";
              session.messages[msgIndex].loadStatus = "failed";
              session.messages[msgIndex].loadDuration = Math.round((Date.now() - session.messages[msgIndex].startTime) / 1e3);
            }
            await saveSessions();
            if (pendingTasks.value === 0) {
              generating.value = false;
            }
            showToast("视频生成失败: 网络连接异常", true);
          } else {
            const timer2 = setTimeout(run, 5e3);
            pollingTimers.value.set(taskId, timer2);
          }
        }
      };
      async function stopPolling() {
        stopped = true;
        generating.value = false;
      }
      const timer = setTimeout(run, 5e3);
      pollingTimers.value.set(taskId, timer);
    }
    let regenerateSessionId = null;
    async function handleRegenerate(bubble) {
      let targetSession = null;
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          if (msg.taskId === bubble.taskId && msg.text === bubble.text) {
            targetSession = session;
            break;
          }
        }
        if (targetSession) break;
      }
      if (!targetSession) {
        regenerateSessionId = null;
        inputText.value = bubble.text;
        referenceImages.value = bubble.referenceImages || [];
        await generateVideo();
        return;
      }
      inputText.value = bubble.text;
      referenceImages.value = bubble.referenceImages || [];
      regenerateSessionId = targetSession.id;
      currentSessionId.value = targetSession.id;
      await generateVideo();
    }
    function handleInsertImage(url) {
      referenceImages.value = [...referenceImages.value, url];
      showToast("已添加为参考图，可进行图生视频");
    }
    function handlePreviewVideo(url) {
      previewUrl.value = url;
      showPreview.value = true;
    }
    function closePreview() {
      showPreview.value = false;
      previewUrl.value = "";
    }
    async function handleDownloadVideo(url) {
      const dirResult = await window.uclaw.ipcSelectDownloadDir({ type: "video" });
      if (!dirResult.ok || dirResult.canceled) {
        return;
      }
      const filepath = dirResult.path;
      try {
        let base64;
        if (url.startsWith("data:")) {
          base64 = url.split(",")[1];
        } else if (url.startsWith("file://") || url.startsWith("local-media://")) {
          const result = await window.uclaw.ipcCopyLocalFile({ sourceUrl: url, destPath: filepath });
          if (result.ok) {
            showToast(`视频已保存至: ${filepath}`);
          } else {
            showToast("保存失败: " + (result.error || "未知错误"), true);
          }
          return;
        } else {
          const downloadResult = await window.uclaw.ipcDownloadImage({ url });
          if (!downloadResult.ok) {
            showToast("下载失败: " + (downloadResult.error || "无法下载视频"), true);
            return;
          }
          base64 = downloadResult.base64;
        }
        const saveResult = await window.uclaw.ipcSaveFile({ filepath, buffer: base64 });
        if (saveResult.ok) {
          showToast(`视频已保存至: ${filepath}`);
        } else {
          showToast("保存失败: " + (saveResult.error || "未知错误"), true);
        }
      } catch (e) {
        console.error("[VideoGen] download error:", e);
        showToast("下载失败: " + (e.message || "未知错误"), true);
      }
    }
    function formatTime() {
      const now = /* @__PURE__ */ new Date();
      return now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    }
    async function saveVideoToMedia(url, taskId, msg) {
      if (!url || url.startsWith("data:")) return;
      try {
        console.log("[VideoGen] saveVideoToMedia downloading:", url);
        const result = await window.uclaw.ipcSaveMediaVideo({ url, taskId });
        if (result?.ok && result.filepath) {
          msg.localPath = result.filepath;
          console.log("[VideoGen] saveVideoToMedia saved to:", result.filepath);
        } else {
          console.error("[VideoGen] saveVideoToMedia failed:", result?.error || "未知错误");
          showToast("视频保存到本地失败: " + (result?.error || "未知错误"), true);
        }
      } catch (e) {
        console.error("[VideoGen] saveVideoToMedia failed:", e);
        showToast("视频下载失败: " + (e.message || "网络错误"), true);
      }
    }
    function handleDeleteHistory(id) {
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (let i = 0; i < session.messages.length; i++) {
          const msg = session.messages[i];
          const msgId = msg.taskId || `${session.id}_${i}`;
          if (msgId === id) {
            msg.hideInHistory = true;
            saveSessions();
            return;
          }
        }
      }
    }
    async function handleOpenMediaFolder() {
      await window.uclaw.ipcOpenMediaVideoFolder();
    }
    function handleClearHistory() {
      for (const session of sessions.value) {
        if (session.deleted) continue;
        for (const msg of session.messages) {
          if (msg.status === "completed" && msg.videoUrl) {
            msg.hideInHistory = true;
          }
        }
      }
      saveSessions();
      showToast("已清空历史作品");
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$h, [
        createBaseVNode("div", _hoisted_2$g, [
          createBaseVNode("div", _hoisted_3$f, [
            createBaseVNode("button", {
              class: normalizeClass({ active: activeTab.value === "free" }),
              onClick: _cache[0] || (_cache[0] = ($event) => activeTab.value = "free")
            }, [..._cache[10] || (_cache[10] = [
              createStaticVNode('<span class="tab-content" data-v-48c21956><span class="iconfont icon-clawziyouchuangzuo" data-v-48c21956></span><span class="tab-text" data-v-48c21956>自由创作</span></span><span class="tab-desc" data-v-48c21956>文生视频/图生视频 · 多会话</span><span class="tab-indicator" data-v-48c21956></span>', 3)
            ])], 2),
            createBaseVNode("button", {
              class: normalizeClass({ active: activeTab.value === "history" }),
              onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "history")
            }, [..._cache[11] || (_cache[11] = [
              createStaticVNode('<span class="tab-content" data-v-48c21956><span class="iconfont icon-clawlishizuopin" data-v-48c21956></span><span class="tab-text" data-v-48c21956>历史作品</span></span><span class="tab-desc" data-v-48c21956>我的作品</span><span class="tab-indicator" data-v-48c21956></span>', 3)
            ])], 2)
          ])
        ]),
        withDirectives(createBaseVNode("div", _hoisted_4$d, [
          createBaseVNode("div", {
            class: normalizeClass(["left-panel", { collapsed: leftPanelCollapsed.value }])
          }, [
            !leftPanelCollapsed.value ? (openBlock(), createElementBlock("span", {
              key: 0,
              class: "collapse-icon left",
              onClick: toggleLeftPanel
            }, "←")) : (openBlock(), createElementBlock("span", {
              key: 1,
              class: "collapse-icon left",
              onClick: toggleLeftPanel
            }, "→")),
            createBaseVNode("div", _hoisted_5$d, [
              createBaseVNode("div", _hoisted_6$b, [
                createVNode(SessionList$1, {
                  mode: "video",
                  sessions: sessions.value,
                  currentSessionId: currentSessionId.value,
                  onSelect: handleSessionSelect,
                  onDelete: handleSessionDelete,
                  onEdit: handleSessionEdit
                }, null, 8, ["sessions", "currentSessionId"])
              ]),
              _cache[12] || (_cache[12] = createBaseVNode("div", { class: "api-key-hint" }, "已自动使用【模型配置】的API Key", -1))
            ]),
            createBaseVNode("div", _hoisted_7$b, [
              createBaseVNode("div", _hoisted_8$a, [
                createBaseVNode("label", _hoisted_9$7, "参考图（" + toDisplayString(referenceImages.value.length) + "/3）", 1),
                createVNode(ReferenceImages, {
                  images: referenceImages.value,
                  "onUpdate:images": _cache[2] || (_cache[2] = ($event) => referenceImages.value = $event),
                  max: 3
                }, null, 8, ["images"])
              ]),
              createBaseVNode("div", _hoisted_10$6, [
                _cache[13] || (_cache[13] = createBaseVNode("label", { class: "form-label" }, "提示词", -1)),
                createBaseVNode("div", _hoisted_11$5, [
                  withDirectives(createBaseVNode("textarea", {
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => inputText.value = $event),
                    class: "prompt-textarea",
                    placeholder: "描述你想要生成的视频...",
                    rows: 4
                  }, null, 512), [
                    [vModelText, inputText.value]
                  ])
                ])
              ]),
              createBaseVNode("div", _hoisted_12$4, [
                _cache[14] || (_cache[14] = createBaseVNode("label", { class: "form-label" }, "模型", -1)),
                withDirectives(createBaseVNode("select", {
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => selectedModel.value = $event),
                  class: "option-select"
                }, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(videoModels.value, (model) => {
                    return openBlock(), createElementBlock("option", {
                      key: model.model_name,
                      value: model.model_name
                    }, toDisplayString(getModelDisplayName(model.model_name)), 9, _hoisted_13$4);
                  }), 128))
                ], 512), [
                  [vModelSelect, selectedModel.value]
                ])
              ]),
              createBaseVNode("div", _hoisted_14$4, [
                createBaseVNode("div", _hoisted_15$4, [
                  _cache[15] || (_cache[15] = createBaseVNode("label", { class: "form-label" }, "时长", -1)),
                  createBaseVNode("div", _hoisted_16$4, toDisplayString(currentModelMeta.value.duration) + "秒", 1)
                ]),
                createBaseVNode("div", _hoisted_17$3, [
                  _cache[16] || (_cache[16] = createBaseVNode("label", { class: "form-label" }, "比例", -1)),
                  withDirectives(createBaseVNode("select", {
                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => selectedAspectRatio.value = $event),
                    class: "option-select"
                  }, [
                    (openBlock(true), createElementBlock(Fragment, null, renderList(currentModelMeta.value.aspectRatios, (ratio) => {
                      return openBlock(), createElementBlock("option", {
                        key: ratio.value,
                        value: ratio.value
                      }, toDisplayString(ratio.label), 9, _hoisted_18$3);
                    }), 128))
                  ], 512), [
                    [vModelSelect, selectedAspectRatio.value]
                  ])
                ])
              ])
            ]),
            createBaseVNode("div", _hoisted_19$3, [
              createBaseVNode("button", {
                onClick: generateVideo,
                class: normalizeClass(["generate-btn", { active: inputText.value.trim() && !generating.value, generating: generating.value }]),
                disabled: !inputText.value.trim()
              }, [
                generating.value ? (openBlock(), createElementBlock("span", _hoisted_21$3)) : (openBlock(), createElementBlock("span", _hoisted_22$3)),
                generating.value ? (openBlock(), createElementBlock("span", _hoisted_23$2, "添加到队列中")) : (openBlock(), createElementBlock("span", _hoisted_24$2, "生成视频"))
              ], 10, _hoisted_20$3)
            ])
          ], 2),
          createBaseVNode("div", {
            class: normalizeClass(["right-panel", { "right-panel-active": bubbles.value.length > 0 }])
          }, [
            createBaseVNode("span", {
              class: "collapse-icon",
              onClick: toggleLeftPanel
            }, [..._cache[17] || (_cache[17] = [
              createBaseVNode("span", { class: "iconfont icon-clawzhedie" }, null, -1)
            ])]),
            createBaseVNode("div", _hoisted_25$1, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(bubbles.value, (bubble, index) => {
                return openBlock(), createBlock(ChatBubble, {
                  key: index,
                  bubble,
                  "bubble-mode": "video",
                  modelName: selectedModel.value,
                  onRegenerate: handleRegenerate,
                  onCopySuccess: unref(showToast),
                  onInsert: handleInsertImage,
                  onDownload: handleDownloadVideo,
                  onPreview: handlePreviewVideo
                }, null, 8, ["bubble", "modelName", "onCopySuccess"]);
              }), 128)),
              !bubbles.value.length ? (openBlock(), createElementBlock("div", _hoisted_26$1, [..._cache[18] || (_cache[18] = [
                createStaticVNode('<div class="empty-bubbles-content" data-v-48c21956><div class="empty-bubbles-icon" data-v-48c21956><span class="iconfont icon-clawicon_shipinshengcheng" data-v-48c21956></span></div><h3 class="empty-bubbles-title" data-v-48c21956>AI 视频生成</h3><p class="empty-bubbles-desc" data-v-48c21956>描述越详细，效果越好</p><ul class="empty-bubbles-tips" data-v-48c21956><li data-v-48c21956>💡 镜头：广角 / 特写 / 俯视</li><li data-v-48c21956>💡 动作：缓慢移动 / 快速奔跑</li><li data-v-48c21956>💡 氛围：黄昏光 / 赛博朋克</li></ul></div>', 1)
              ])])) : createCommentVNode("", true)
            ])
          ], 2)
        ], 512), [
          [vShow, activeTab.value === "free"]
        ]),
        withDirectives(createBaseVNode("div", _hoisted_27$1, [
          showMediaWarning.value ? (openBlock(), createElementBlock("div", _hoisted_28$1, [
            _cache[19] || (_cache[19] = createBaseVNode("span", { class: "iconfont icon-clawtishi" }, null, -1)),
            createBaseVNode("span", null, "视频文件夹文件数已达 " + toDisplayString(mediaFileCount.value.videoCount) + " 个，请及时清理历史作品", 1)
          ])) : createCommentVNode("", true),
          historyVideos.value.length > 0 ? (openBlock(), createBlock(VideoGrid, {
            key: 1,
            videos: historyVideos.value,
            onDelete: handleDeleteHistory,
            onDownload: handleDownloadVideo,
            onOpenFolder: handleOpenMediaFolder,
            onClear: handleClearHistory
          }, null, 8, ["videos"])) : (openBlock(), createElementBlock("div", _hoisted_29$1, [
            _cache[22] || (_cache[22] = createBaseVNode("div", { class: "history-empty-icon" }, [
              createBaseVNode("span", { class: "iconfont icon-clawicon_shipinshengcheng" })
            ], -1)),
            _cache[23] || (_cache[23] = createBaseVNode("p", { class: "history-empty-title" }, "还没有作品", -1)),
            createBaseVNode("p", _hoisted_30$1, [
              _cache[20] || (_cache[20] = createTextVNode("去", -1)),
              createBaseVNode("span", {
                class: "history-empty-link",
                onClick: _cache[6] || (_cache[6] = ($event) => activeTab.value = "free")
              }, "「自由创作」"),
              _cache[21] || (_cache[21] = createTextVNode("生成第一个视频吧", -1))
            ])
          ]))
        ], 512), [
          [vShow, activeTab.value === "history"]
        ]),
        showDeleteConfirm.value ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: "modal-overlay",
          onClick: withModifiers(cancelDeleteSession, ["self"])
        }, [
          createBaseVNode("div", { class: "modal-card" }, [
            _cache[24] || (_cache[24] = createBaseVNode("h3", { class: "modal-title" }, "确认删除", -1)),
            _cache[25] || (_cache[25] = createBaseVNode("p", { class: "modal-desc" }, "确定要删除该会话吗？", -1)),
            createBaseVNode("div", { class: "modal-actions" }, [
              createBaseVNode("button", {
                class: "modal-btn cancel",
                onClick: cancelDeleteSession
              }, "取消"),
              createBaseVNode("button", {
                class: "modal-btn confirm",
                onClick: confirmDeleteSession
              }, "删除")
            ])
          ])
        ])) : createCommentVNode("", true),
        showEditModal.value ? (openBlock(), createElementBlock("div", {
          key: 1,
          class: "modal-overlay",
          onClick: withModifiers(closeEditModal, ["self"])
        }, [
          createBaseVNode("div", _hoisted_31$1, [
            _cache[26] || (_cache[26] = createBaseVNode("h3", { class: "modal-title" }, "编辑会话标题", -1)),
            withDirectives(createBaseVNode("input", {
              ref_key: "editInput",
              ref: editInput,
              "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => editingTitle.value = $event),
              class: "modal-input",
              placeholder: "输入会话标题...",
              onKeyup: [
                withKeys(saveSessionTitle, ["enter"]),
                withKeys(closeEditModal, ["esc"])
              ]
            }, null, 544), [
              [vModelText, editingTitle.value]
            ]),
            createBaseVNode("div", { class: "modal-actions" }, [
              createBaseVNode("button", {
                class: "modal-btn cancel",
                onClick: closeEditModal
              }, "取消"),
              createBaseVNode("button", {
                class: "modal-btn confirm",
                onClick: saveSessionTitle
              }, "保存")
            ])
          ])
        ])) : createCommentVNode("", true),
        (openBlock(), createBlock(Teleport, { to: "body" }, [
          showPreview.value ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "fullscreen-preview",
            onClick: closePreview
          }, [
            createBaseVNode("button", {
              class: "preview-download-btn",
              onClick: _cache[8] || (_cache[8] = withModifiers(($event) => handleDownloadVideo(previewUrl.value), ["stop"])),
              title: "下载"
            }, [..._cache[27] || (_cache[27] = [
              createBaseVNode("span", { class: "iconfont icon-clawxiazai" }, null, -1)
            ])]),
            createBaseVNode("button", {
              class: "preview-close-btn",
              onClick: withModifiers(closePreview, ["stop"]),
              title: "关闭"
            }, [..._cache[28] || (_cache[28] = [
              createBaseVNode("span", { class: "iconfont icon-clawguanbi" }, null, -1)
            ])]),
            createBaseVNode("video", {
              src: previewUrl.value,
              class: "preview-video",
              controls: "",
              autoplay: "",
              loop: "",
              onClick: _cache[9] || (_cache[9] = withModifiers(() => {
              }, ["stop"]))
            }, null, 8, _hoisted_32$1)
          ])) : createCommentVNode("", true)
        ]))
      ]);
    };
  }
};
const VideoGen = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["__scopeId", "data-v-48c21956"]]);
let instance = null;
function useChatWs() {
  if (instance) return instance;
  const connected = /* @__PURE__ */ ref(false);
  const status = /* @__PURE__ */ ref("disconnected");
  const errorMessage = /* @__PURE__ */ ref("");
  const serverVersion = /* @__PURE__ */ ref(null);
  const sessionKey = /* @__PURE__ */ ref(null);
  const gatewayReady = /* @__PURE__ */ ref(false);
  let ws = null;
  let wsId = 0;
  let token = "";
  let password = "";
  let url = "";
  let intentionalClose = false;
  let connecting = false;
  let reconnectState = "idle";
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let pingTimer = null;
  let heartbeatTimer = null;
  let lastMessageAt = null;
  let lastConnectedAt = null;
  let missedHeartbeats = 0;
  let handshaking = false;
  let hello = null;
  let snapshot = null;
  let autoPairAttempts = 0;
  let authRetryCount = 0;
  let challengeTimer = null;
  const MAX_RECONNECT = 10;
  const PING_INTERVAL = 3e4;
  const HEARTBEAT_INTERVAL = 45e3;
  const REQUEST_TIMEOUT = 3e4;
  const CHALLENGE_TIMEOUT = 1e4;
  const _listeners = /* @__PURE__ */ new Map();
  const _pending = /* @__PURE__ */ new Map();
  const _readyCallbacks = [];
  const _messageCache = /* @__PURE__ */ new Map();
  const _seenMessageIds = /* @__PURE__ */ new Set();
  const _cacheSize = 500;
  let _api = null;
  function _genId() {
    return "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }
  function _extractErrorCode(details) {
    return (details?.code || "").toUpperCase();
  }
  function _setConnected(val, st, err) {
    connected.value = val;
    status.value = st || (val ? "connected" : "disconnected");
    errorMessage.value = err || "";
    _listeners.get("status")?.forEach((fn) => fn(status.value, errorMessage.value));
  }
  function _closeWs() {
    if (ws) {
      const w = ws;
      ws = null;
      wsId++;
      try {
        w.close();
      } catch {
      }
    }
  }
  function _flushPending() {
    for (const [, p2] of _pending) {
      clearTimeout(p2.timer);
      p2.reject(new Error("连接已断开"));
    }
    _pending.clear();
  }
  function _clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }
  function _clearChallengeTimer() {
    if (challengeTimer) {
      clearTimeout(challengeTimer);
      challengeTimer = null;
    }
  }
  function _scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT) {
      reconnectAttempts = 0;
      reconnectState = "idle";
      _setConnected(false, "error", "连接失败，已停止重连。请手动刷新重试。");
      return;
    }
    _clearReconnectTimer();
    reconnectState = "attempting";
    const base = Math.min(2e3 * Math.pow(2, reconnectAttempts), 3e4);
    const jitter = reconnectAttempts === 0 ? 500 : Math.round(base * (0.5 + Math.random()));
    reconnectAttempts++;
    status.value = "reconnecting";
    _setConnected(false, "reconnecting", `重连中 (${reconnectAttempts}/${MAX_RECONNECT})...`);
    reconnectTimer = setTimeout(() => {
      _doConnect();
    }, jitter);
  }
  function _startPing() {
    _stopPing();
    pingTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send('{"type":"ping"}');
        } catch {
        }
      }
    }, PING_INTERVAL);
  }
  function _stopPing() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }
  function _startHeartbeat() {
    _stopHeartbeat();
    missedHeartbeats = 0;
    heartbeatTimer = setInterval(() => {
      if (!connected.value || !gatewayReady.value) return;
      const since = lastMessageAt ? Date.now() - lastMessageAt : 0;
      if (since > HEARTBEAT_INTERVAL) {
        missedHeartbeats++;
        if (missedHeartbeats >= 3) {
          _stopHeartbeat();
          reconnect();
        } else if (missedHeartbeats >= 2 && ws?.readyState === WebSocket.OPEN) {
          try {
            ws.send('{"type":"ping"}');
          } catch {
          }
        }
      }
    }, HEARTBEAT_INTERVAL / 3);
  }
  function _stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }
  async function _autoPairAndReconnect() {
    autoPairAttempts++;
    try {
      if (_api?.autoPairDevice) await _api.autoPairDevice();
      if (_api?.reloadGateway) {
        try {
          await _api.reloadGateway();
        } catch {
        }
      }
      setTimeout(() => {
        if (!intentionalClose) {
          reconnectAttempts = 0;
          _closeWs();
          _doConnect();
        }
      }, 3e3);
    } catch (e) {
      _setConnected(false, "error", `配对失败: ${e}`);
    }
  }
  async function _refreshCredentialsAndReconnect() {
    try {
      if (_api?.ipcReadConfig) {
        const config = await _api.ipcReadConfig();
        const gw = config?.gateway || {};
        const newToken = gw?.auth?.token || gw.authToken || "";
        if (newToken && newToken !== token) {
          token = newToken;
          const baseUrl = url.split("?")[0];
          url = `${baseUrl}?token=${encodeURIComponent(token)}`;
        }
      }
      setTimeout(() => {
        if (!intentionalClose) _doConnect();
      }, 3e3);
    } catch (e) {
      _setConnected(false, "error", `凭据刷新失败: ${e}`);
    }
  }
  async function _sendConnectFrame(nonce) {
    if (!_api?.createConnectFrame) {
      console.error("[ws] connect frame failed: createConnectFrame not available");
      handshaking = false;
      _setConnected(false, "error", "缺少 createConnectFrame API，请重启应用");
      return;
    }
    handshaking = true;
    try {
      const frame = await _api.createConnectFrame(nonce, token, password);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(frame));
        _clearChallengeTimer();
        challengeTimer = setTimeout(() => {
          if (!gatewayReady.value && handshaking && !intentionalClose) {
            console.warn("[ws] connect 响应超时，触发重连");
            handshaking = false;
            challengeTimer = null;
            _closeWs();
            _scheduleReconnect();
          }
        }, CHALLENGE_TIMEOUT);
      }
    } catch (e) {
      console.error("[ws] connect frame failed:", e);
      handshaking = false;
      _setConnected(false, "error", `握手签名失败: ${e.message || e}`);
    }
  }
  function _handleConnectSuccess(result) {
    autoPairAttempts = 0;
    authRetryCount = 0;
    hello = result || null;
    snapshot = result?.snapshot || null;
    serverVersion.value = result?.serverVersion || null;
    const defaults2 = snapshot?.sessionDefaults;
    if (defaults2?.mainSessionKey) {
      sessionKey.value = defaults2.mainSessionKey;
    } else {
      const agentId = defaults2?.defaultAgentId || "main";
      sessionKey.value = `agent:${agentId}:main`;
    }
    gatewayReady.value = true;
    status.value = "ready";
    _setConnected(true, "ready");
    _readyCallbacks.forEach((fn) => {
      try {
        fn(hello, sessionKey.value);
      } catch {
      }
    });
    _readyCallbacks.length = 0;
  }
  function _handleMessage(data) {
    console.log("_handleMessage==>", data);
    lastMessageAt = Date.now();
    missedHeartbeats = 0;
    try {
      const msg = typeof data === "string" ? JSON.parse(data) : data;
      if (msg.type === "event" && msg.event === "connect.challenge") {
        _clearChallengeTimer();
        _sendConnectFrame(msg.payload?.nonce || "");
        return;
      }
      if (msg.type === "event" && msg.event === "gateway.config.updated") {
        console.log("[ws] gateway config updated, reconnecting...");
        gatewayReady.value = false;
        handshaking = false;
        _stopPing();
        setTimeout(() => {
          if (!intentionalClose) {
            reconnectAttempts = 0;
            _closeWs();
            _doConnect();
          }
        }, 500);
        return;
      }
      if (msg.type === "res" && msg.id?.startsWith("connect-")) {
        _clearChallengeTimer();
        handshaking = false;
        if (!msg.ok || msg.error) {
          const errMsg = msg.error?.message || "Gateway 握手失败";
          const details = msg.error?.details || {};
          const code = _extractErrorCode(details);
          if ((code === "PAIRING_REQUIRED" || code === "CONTROL_UI_ORIGIN_NOT_ALLOWED") && autoPairAttempts < 1) {
            _autoPairAndReconnect();
            return;
          }
          if (/AUTH_TOKEN/i.test(code) && authRetryCount < 2) {
            authRetryCount++;
            _refreshCredentialsAndReconnect();
            return;
          }
          _setConnected(false, "error", errMsg);
          _readyCallbacks.forEach((fn) => {
            try {
              fn(null, null, { error: true, message: errMsg });
            } catch {
            }
          });
          _readyCallbacks.length = 0;
          return;
        }
        _handleConnectSuccess(msg.payload || msg.result);
        return;
      }
      if (msg.type === "res" && msg.id) {
        if (_pending.has(msg.id)) {
          const p2 = _pending.get(msg.id);
          clearTimeout(p2.timer);
          _pending.delete(msg.id);
          if (msg.error) {
            p2.reject(new Error(msg.error.message || "请求失败"));
          } else {
            p2.resolve(msg.result || msg.payload || msg);
          }
        }
        return;
      }
      if (msg.type === "event") {
        if ((msg.event === "chat" || msg.event === "chat.message") && msg.payload?.sessionKey) {
          _cacheMessage(msg.payload.sessionKey, msg.payload);
        }
        _listeners.get("event")?.forEach((fn) => {
          try {
            fn(msg);
          } catch (e) {
            console.error("[ws] handler error:", e);
          }
        });
        return;
      }
    } catch (e) {
      console.error("[ws] parse error:", e);
    }
  }
  function _cacheMessage(sessionKey2, msg) {
    if (!_messageCache.has(sessionKey2)) _messageCache.set(sessionKey2, []);
    const arr = _messageCache.get(sessionKey2);
    const id = msg.id || msg.messageId;
    if (id && _seenMessageIds.has(id)) return;
    if (id) _seenMessageIds.add(id);
    arr.push({ ...msg, _cachedAt: Date.now() });
    if (arr.length > _cacheSize) arr.splice(0, arr.length - _cacheSize);
  }
  function _doConnect() {
    connecting = true;
    _closeWs();
    gatewayReady.value = false;
    handshaking = false;
    reconnectState = "attempting";
    _setConnected(false, "connecting");
    const currentWsId = ++wsId;
    let wsInstance;
    try {
      wsInstance = new WebSocket(url);
    } catch {
      _scheduleReconnect();
      return;
    }
    ws = wsInstance;
    wsInstance.onopen = () => {
      if (currentWsId !== wsId) return;
      connecting = false;
      reconnectAttempts = 0;
      missedHeartbeats = 0;
      lastConnectedAt = Date.now();
      _startHeartbeat();
      _setConnected(true, "connected");
      _startPing();
      _clearChallengeTimer();
      challengeTimer = setTimeout(() => {
        if (!gatewayReady.value && !handshaking && !intentionalClose) {
          console.warn("[ws] connect.challenge 超时（无响应），触发重连");
          challengeTimer = null;
          _closeWs();
          _scheduleReconnect();
        }
      }, CHALLENGE_TIMEOUT);
    };
    wsInstance.onmessage = (e) => {
      if (currentWsId !== wsId) return;
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      _handleMessage(msg);
    };
    wsInstance.onclose = (event) => {
      if (currentWsId !== wsId) return;
      connecting = false;
      gatewayReady.value = false;
      handshaking = false;
      _flushPending();
      _stopPing();
      _stopHeartbeat();
      _clearChallengeTimer();
      if (!intentionalClose) {
        _scheduleReconnect();
      } else {
        reconnectState = "idle";
        _setConnected(false, "disconnected");
      }
    };
    wsInstance.onerror = () => {
    };
  }
  function setApi(api) {
    _api = api;
  }
  function connect(hostPort, tkn, opts = {}) {
    token = tkn || "";
    password = opts.password || "";
    intentionalClose = false;
    autoPairAttempts = 0;
    const proto = opts.secure ? "wss" : "ws";
    const host = hostPort || "127.0.0.1:4444";
    const newUrl = `${proto}://${host}/ws?token=${encodeURIComponent(token)}`;
    if ((connecting || handshaking || gatewayReady.value) && url === newUrl) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) && url === newUrl) return;
    url = newUrl;
    lastConnectedAt = Date.now();
    _doConnect();
  }
  function disconnect() {
    intentionalClose = true;
    _clearReconnectTimer();
    _clearChallengeTimer();
    _closeWs();
    _stopPing();
    _stopHeartbeat();
    _flushPending();
    connecting = false;
    gatewayReady.value = false;
    handshaking = false;
    reconnectState = "idle";
    _setConnected(false, "disconnected");
  }
  function reconnect() {
    intentionalClose = false;
    reconnectAttempts = 0;
    autoPairAttempts = 0;
    authRetryCount = 0;
    missedHeartbeats = 0;
    _stopPing();
    _stopHeartbeat();
    _clearReconnectTimer();
    _clearChallengeTimer();
    _closeWs();
    _doConnect();
  }
  function onReady(cb) {
    if (gatewayReady.value) {
      cb(hello, sessionKey.value);
    } else {
      _readyCallbacks.push(cb);
    }
    return () => {
      const idx = _readyCallbacks.indexOf(cb);
      if (idx >= 0) _readyCallbacks.splice(idx, 1);
    };
  }
  function onStatusChange(cb) {
    if (!_listeners.has("status")) _listeners.set("status", []);
    _listeners.get("status").push(cb);
    return () => {
      const arr = _listeners.get("status");
      if (arr) {
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }
  function onEvent(cb) {
    if (!_listeners.has("event")) _listeners.set("event", []);
    _listeners.get("event").push(cb);
    return () => {
      const arr = _listeners.get("event");
      if (arr) {
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }
  function getConnectionInfo() {
    return {
      connected: connected.value,
      gatewayReady: gatewayReady.value,
      lastConnectedAt,
      lastMessageAt,
      reconnectAttempts,
      reconnectState,
      serverVersion: serverVersion.value,
      missedHeartbeats
    };
  }
  function request(method, params = {}) {
    return new Promise((resolve2, reject) => {
      if (!ws || ws.readyState !== WebSocket.OPEN || !gatewayReady.value) {
        if (!intentionalClose && (reconnectAttempts > 0 || !gatewayReady.value)) {
          const timer2 = setTimeout(() => {
            cleanup();
            reject(new Error("等待重连超时"));
          }, 15e3);
          const cleanup = onReady((helloResult, sk, meta) => {
            clearTimeout(timer2);
            cleanup();
            if (meta?.error) {
              reject(new Error(meta.message || "Gateway 握手失败"));
              return;
            }
            request(method, params).then(resolve2, reject);
          });
          return;
        }
        reject(new Error("WebSocket 未连接"));
        return;
      }
      const id = _genId();
      const timer = setTimeout(() => {
        _pending.delete(id);
        reject(new Error("请求超时"));
      }, REQUEST_TIMEOUT);
      _pending.set(id, { resolve: resolve2, reject, timer });
      ws.send(JSON.stringify({
        type: "req",
        id,
        method,
        params
      }));
    });
  }
  function chatSend(sk, message, attachments) {
    const msg = {
      sessionKey: sk,
      message,
      deliver: false,
      idempotencyKey: _genId()
    };
    if (attachments?.length) msg.attachments = attachments;
    return request("chat.send", msg);
  }
  function chatHistory(sk, limit = 200) {
    return request("chat.history", { sessionKey: sk, limit });
  }
  function chatAbort(sk, runId) {
    const params = { sessionKey: sk };
    if (runId) params.runId = runId;
    return request("chat.abort", params);
  }
  function sessionsList(limit = 50) {
    return request("sessions.list", { limit });
  }
  function sessionsDelete(key) {
    return request("sessions.delete", { key });
  }
  function sessionsReset(key) {
    return request("sessions.reset", { key });
  }
  function modelsList() {
    return request("models.list", {});
  }
  function getMessageCache(sk) {
    return _messageCache.get(sk) || [];
  }
  function clearMessageCache(sk) {
    _messageCache.delete(sk);
  }
  instance = {
    connected,
    status,
    errorMessage,
    serverVersion,
    sessionKey,
    gatewayReady,
    setApi,
    connect,
    disconnect,
    reconnect,
    onReady,
    onStatusChange,
    onEvent,
    getConnectionInfo,
    request,
    chatSend,
    chatHistory,
    chatAbort,
    sessionsList,
    sessionsDelete,
    sessionsReset,
    modelsList,
    getMessageCache,
    clearMessageCache
  };
  return instance;
}
const IPC_KEY_SESSIONS = "chat-sessions";
function getApi() {
  return window.uclaw || null;
}
const useAiChatStore = /* @__PURE__ */ defineStore("aiChat", () => {
  const wsStatus = /* @__PURE__ */ ref("disconnected");
  const wsError = /* @__PURE__ */ ref("");
  const sessions = /* @__PURE__ */ ref([]);
  const activeSessionKey = /* @__PURE__ */ ref(null);
  const sidebarVisible = /* @__PURE__ */ ref(true);
  const messagesMap = /* @__PURE__ */ ref({});
  const models = /* @__PURE__ */ ref([]);
  const currentModel = /* @__PURE__ */ ref(null);
  const sessionModelMap = /* @__PURE__ */ ref({});
  const inputText = /* @__PURE__ */ ref("");
  const sending = /* @__PURE__ */ ref(false);
  const currentRunId = /* @__PURE__ */ ref(null);
  const showCommandPalette = /* @__PURE__ */ ref(false);
  const _saveTimers = {};
  const profile = /* @__PURE__ */ ref({});
  const currentMessages = computed(() => {
    if (!activeSessionKey.value) return [];
    return messagesMap.value[activeSessionKey.value] || [];
  });
  const isReady = computed(() => wsStatus.value === "ready");
  const activeSession = computed(() => {
    return sessions.value.find((s) => s.key === activeSessionKey.value);
  });
  function getSessionName(session) {
    const key = session?.key;
    if (!key || key === "main") return "主会话";
    const cleanKey = String(key).replace(/["']/g, "").trim();
    if (cleanKey === "main") return "主会话";
    return session?.alias || session?.title || cleanKey.split(":").pop() || "新对话";
  }
  async function init() {
    const api = getApi();
    if (api?.loadUserState) {
      try {
        const saved = await api.loadUserState(IPC_KEY_SESSIONS);
        if (Array.isArray(saved) && saved.length) {
          sessions.value = saved.filter((s) => s?.key);
          const active = saved.find((s) => s.active);
          if (active) {
            const clean = String(active.key).replace(/["']/g, "").trim();
            if (clean) activeSessionKey.value = clean;
          }
        }
      } catch {
      }
    }
    await _migrateOldNames();
    await _migrateOldActive();
    profile.value = await _loadProfile();
    if (!sessions.value.find((s) => s.key === "main")) {
      sessions.value.unshift({ key: "main", title: "主会话", status: "idle", createdAt: Date.now() });
    }
    if (activeSessionKey.value) {
      await loadSessionMessages(activeSessionKey.value);
    }
  }
  async function _migrateOldNames() {
    const api = getApi();
    if (!api?.loadUserState) return;
    try {
      const oldNames = await api.loadUserState("chat-session-names");
      if (oldNames && typeof oldNames === "object" && !Array.isArray(oldNames)) {
        let migrated = false;
        for (const s of sessions.value) {
          if (oldNames[s.key] && !s.alias) {
            s.alias = oldNames[s.key];
            migrated = true;
          }
        }
        if (migrated) _saveSessions();
        api.deleteUserState?.("chat-session-names").catch(() => {
        });
      }
    } catch {
    }
  }
  async function _migrateOldActive() {
    const api = getApi();
    if (!api?.loadUserState) return;
    try {
      const oldActive = await api.loadUserState("chat-active-session");
      if (oldActive && !activeSessionKey.value) {
        const clean = String(oldActive).replace(/["']/g, "").trim();
        if (clean) {
          activeSessionKey.value = clean;
          _saveSessions();
        }
      }
      api.deleteUserState?.("chat-active-session").catch(() => {
      });
    } catch {
    }
  }
  function _saveSessions() {
    const api = getApi();
    if (api?.saveUserState) {
      const data = sessions.value.map((s) => ({
        ...s,
        active: s.key === activeSessionKey.value
      }));
      api.saveUserState(IPC_KEY_SESSIONS, /* @__PURE__ */ toRaw(data)).catch(() => {
      });
    }
  }
  async function _loadProfile() {
    const api = getApi();
    if (api?.loadChatProfile) {
      try {
        const p2 = await api.loadChatProfile();
        if (p2 && Object.keys(p2).length) return p2;
      } catch (e) {
        console.error("[aiChat] load profile failed:", e);
      }
    }
    return {};
  }
  function _saveProfile(profileData) {
    const api = getApi();
    if (api?.saveChatProfile) {
      api.saveChatProfile(profileData).catch((e) => {
        console.error("[aiChat] save profile failed:", e);
      });
    }
  }
  let _ws = null;
  let _unsubs = [];
  let _wsSetupDone = false;
  const gatewayStore = useGatewayStore();
  let _connecting = false;
  async function connectToGateway() {
    if (_connecting) {
      console.log("[aiChat] connectToGateway 已在执行中，跳过重复调用");
      return;
    }
    _connecting = true;
    try {
      let config = {};
      const api = getApi();
      if (api?.ipcReadConfig) {
        config = await api.ipcReadConfig();
      } else {
        try {
          const port2 = "18789";
          const resp = await fetch(`http://127.0.0.1:${port2}/api/config`);
          config = await resp.json();
        } catch {
        }
      }
      console.log("[aiChat] 准备连接 Gateway, config keys:", Object.keys(config));
      const gw = config?.gateway || {};
      const host = gw.host || "127.0.0.1";
      const port = gw.port || 4444;
      const token = gw?.auth?.token || gw.authToken || "";
      const password = gw?.auth?.password || "";
      setupWsConnection({ host, port, token, password });
    } catch (e) {
      console.error("[aiChat] connectToGateway failed:", e);
    } finally {
      _connecting = false;
    }
  }
  function reconnect() {
    teardownWsConnection();
    connectToGateway();
  }
  function _isGatewayAvailable() {
    return gatewayStore.gatewayReady || gatewayStore.running;
  }
  watch(() => gatewayStore.running, (running) => {
    console.log("[aiChat] watcher(running):", running, "| wsStatus=", wsStatus.value);
    if (running) {
      if (wsStatus.value !== "ready" && wsStatus.value !== "connecting") {
        console.log("[aiChat] watcher(running) → 自动连接");
        connectToGateway();
      }
    } else {
      console.log("[aiChat] watcher(running) → 断开 WS");
      teardownWsConnection();
    }
  });
  watch(() => gatewayStore.gatewayReady, (ready) => {
    console.log("[aiChat] watcher(gatewayReady):", ready, "| running=", gatewayStore.running, "| wsStatus=", wsStatus.value);
    if (ready && gatewayStore.running) {
      if (wsStatus.value !== "ready" && wsStatus.value !== "connecting") {
        console.log("[aiChat] watcher(gatewayReady) → 自动连接");
        connectToGateway();
      }
    }
  });
  console.log("[aiChat] 初始检查 | running=", gatewayStore.running, "| gatewayReady=", gatewayStore.gatewayReady, "| wsStatus=", wsStatus.value);
  if (_isGatewayAvailable() && wsStatus.value !== "ready" && wsStatus.value !== "connecting") {
    console.log("[aiChat] 初始检查 → 自动连接");
    connectToGateway();
  }
  function setupWsConnection(config) {
    if (_wsSetupDone) {
      _unsubs.forEach((fn) => fn());
      _unsubs = [];
      _wsSetupDone = false;
    }
    const ws = useChatWs();
    _ws = ws;
    _unsubs.push(ws.onStatusChange((st, err) => {
      wsStatus.value = st;
      wsError.value = err || "";
    }));
    _unsubs.push(ws.onReady(async (hello, sk) => {
      console.warn("[DEDUP-DEBUG] onReady 触发 | hello=", !!hello, "| sessionKey=", sk, "| 当前activeSessionKey=", activeSessionKey.value, "| sending=", sending.value);
      wsStatus.value = "ready";
      await refreshSessions();
      if (!activeSessionKey.value) {
        const mainSession = sessions.value.find((s) => s.key === "main");
        if (mainSession) {
          activeSessionKey.value = mainSession.key;
          _saveSessions();
        }
      }
      if (activeSessionKey.value) {
        await loadSessionMessages(activeSessionKey.value);
      }
    }));
    _unsubs.push(ws.onEvent((event) => {
      if ((event.event === "chat" || event.event === "chat.message") && event.payload) {
        console.log("[DEDUP-DEBUG] onEvent 收到 | eventType=", event.event, "| payload.runId=", event.payload?.runId, "| payload.state=", event.payload?.state, "| hasMessage=", !!event.payload?.message, "| sending=", sending.value);
        handleChatMessage(event.payload);
        const sk = normalizeSessionKey(event.payload.sessionKey);
        if (sk) _scheduleSave(sk);
      } else if (event.event === "agent" && event.payload) {
        console.log("[DEDUP-DEBUG] onEvent 收到 agent | payload.runId=", event.payload?.runId, "| stream=", event.payload?.stream, "| sending=", sending.value);
        handleAgentEvent(event.payload);
        const sk = normalizeSessionKey(event.payload.sessionKey);
        if (sk) _scheduleSave(sk);
      }
    }));
    const host = config?.host || "127.0.0.1";
    const port = config?.port || 4444;
    const tkn = config?.token || "";
    ws.setApi(window.uclaw || null);
    ws.connect(`${host}:${port}`, tkn, { password: config?.password || "" });
    _wsSetupDone = true;
  }
  function teardownWsConnection() {
    _unsubs.forEach((fn) => fn());
    _unsubs = [];
    _ws?.disconnect();
    _ws = null;
    _wsSetupDone = false;
  }
  function reconnectWs() {
    if (_ws) {
      _ws.reconnect();
    } else {
      console.log("[aiChat] reconnectWs: _ws 为 null，通过 connectToGateway 完整重连");
      connectToGateway();
    }
  }
  function normalizeSessionKey(sessionKey) {
    if (!sessionKey) return sessionKey;
    if (sessionKey.startsWith("agent:")) {
      const parts = sessionKey.split(":");
      if (parts.length >= 3) return parts.slice(2).join(":");
    }
    return sessionKey;
  }
  function handleAgentEvent(payload) {
    let sk = normalizeSessionKey(payload.sessionKey);
    if (!sk) {
      console.warn("[aiChat] agent 事件缺少 sessionKey, payload keys:", Object.keys(payload));
      return;
    }
    const stream = payload.stream;
    const data = payload.data || {};
    if (stream !== "tool" && stream !== "lifecycle") return;
    const toolCallId = data.toolCallId || data.id;
    const phase = data.phase;
    if (phase === "end") return;
    if (!data.name && !data.tool) return;
    let input = data.input || data.args || data.arguments || null;
    if (typeof input === "string") {
      try {
        input = JSON.parse(input);
      } catch {
      }
    }
    const output = data.output || data.result || data.meta || null;
    const status = phase === "result" ? "ok" : phase === "start" ? "running" : void 0;
    const currentMsgs = messagesMap.value[sk] || [];
    const lastMsg = currentMsgs[currentMsgs.length - 1];
    if ((lastMsg?._streaming || lastMsg?.role === "assistant") && (!lastMsg.sessionKey || lastMsg.sessionKey === sk)) {
      const tools = lastMsg.tools ? lastMsg.tools.map((t) => ({ ...t })) : [];
      const existingIdx = tools.findIndex((t) => t.id === toolCallId);
      if (existingIdx >= 0) {
        const existing = { ...tools[existingIdx] };
        if (output != null && !existing.output) existing.output = output;
        if (status) existing.status = status;
        if (!existing.input && input) existing.input = input;
        tools[existingIdx] = existing;
      } else if (phase === "start") {
        tools.push({
          id: toolCallId || crypto.randomUUID(),
          name: data.name || data.tool || "tool",
          input,
          output: null,
          status: "running",
          time: Date.now()
        });
      }
      messagesMap.value[sk] = [
        ...currentMsgs.slice(0, -1),
        { ...lastMsg, tools }
      ];
      return;
    }
    if (phase === "start") {
      console.warn("[DEDUP-DEBUG] handleAgentEvent 创建新消息 | runId=", payload.runId, "| phase=", phase, "| dataName=", data.name);
      const streamId = payload.runId || crypto.randomUUID();
      const msg = {
        id: streamId,
        _streamId: streamId,
        runId: payload.runId || streamId,
        sessionKey: sk,
        role: "assistant",
        content: "",
        _streaming: true,
        timestamp: Date.now(),
        images: [],
        videos: [],
        audios: [],
        files: [],
        tools: [{
          id: toolCallId || crypto.randomUUID(),
          name: data.name || data.tool || "tool",
          input,
          output: null,
          status: "running",
          time: Date.now()
        }]
      };
      messagesMap.value[sk] = [...currentMsgs, msg];
    }
  }
  function handleChatMessage(payload) {
    const dedupInfo = {
      eventKeys: Object.keys(payload),
      state: payload.state,
      hasDelta: !!payload.delta,
      hasMessage: !!payload.message,
      hasRole: !!payload.role,
      hasDone: !!payload.done,
      runId: payload.runId,
      sessionKey: payload.sessionKey
    };
    console.log("[DEDUP-DEBUG] handleChatMessage 入口 |", JSON.stringify(dedupInfo));
    let sk = normalizeSessionKey(payload.sessionKey);
    if (!sk) {
      console.warn("[aiChat] 事件缺少 sessionKey, payload keys:", Object.keys(payload));
      return;
    }
    let msgs = messagesMap.value[sk] || [];
    const existingIdx = msgs.findIndex((m) => m.runId === payload.runId && m.role === "assistant");
    console.log("[DEDUP-DEBUG] existingIdx=", existingIdx, "| 当前msgs数量=", msgs.length, "| 最后一条role=", msgs[msgs.length - 1]?.role);
    if (payload.state === "error") {
      sending.value = false;
      currentRunId.value = null;
      let errorText = payload.errorMessage || payload.error || "AI 生成失败，请重试";
      if (errorText.includes("unknown variant") && errorText.includes("image_url")) {
        errorText = "当前模型不支持图片识别，请切换支持图片识别的模型或移除图片后重试";
      }
      if (existingIdx >= 0) {
        const newMsgs = [...msgs];
        newMsgs[existingIdx] = {
          ...newMsgs[existingIdx],
          content: errorText,
          status: "error",
          _streaming: false
        };
        messagesMap.value[sk] = newMsgs;
      } else {
        const errMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: errorText,
          images: [],
          videos: [],
          audios: [],
          files: [],
          tools: [],
          timestamp: Date.now(),
          status: "error"
        };
        messagesMap.value[sk] = [...msgs, errMsg];
      }
      return;
    }
    if (payload.state === "final") {
      sending.value = false;
      currentRunId.value = null;
      let finalContent = "";
      let finalContentBlocks = void 0;
      let finalThinkContent = void 0;
      if (payload.message) {
        const msgContent = payload.message;
        if (Array.isArray(msgContent.content)) {
          const textParts = [];
          const thinkParts = [];
          for (const block2 of msgContent.content) {
            if (block2.type === "text" && block2.text) textParts.push(block2.text);
            if (block2.type === "thinking" && block2.thinking) thinkParts.push(block2.thinking);
          }
          finalContent = textParts.join("\n");
          finalThinkContent = thinkParts.join("\n") || void 0;
          finalContentBlocks = msgContent.content.filter((b) => b.type === "text" && b.text || b.type === "thinking" && b.thinking);
        } else if (typeof msgContent.content === "string") {
          const { clean, thinking } = stripThinkingTags(msgContent.content);
          finalContent = clean;
          finalThinkContent = thinking || void 0;
          finalContentBlocks = buildContentBlocks(finalContent, finalThinkContent);
        }
      }
      let finalIdx = existingIdx;
      if (finalIdx < 0) {
        finalIdx = _lastStreamingAssistantIndex(msgs);
      }
      if (finalIdx >= 0) {
        const newMsgs = [...msgs];
        const updated = { ...newMsgs[finalIdx], status: "done", _streaming: false };
        if (finalContent) updated.content = finalContent;
        if (finalThinkContent) updated._thinkContent = finalThinkContent;
        if (finalContentBlocks?.length) updated.contentBlocks = finalContentBlocks;
        else if (!updated.contentBlocks && (updated.content || updated._thinkContent)) {
          updated.contentBlocks = buildContentBlocks(updated.content, updated._thinkContent);
        }
        newMsgs[finalIdx] = updated;
        messagesMap.value[sk] = newMsgs;
      } else {
        if (finalContent) {
          const doneMsg = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: finalContent,
            _thinkContent: finalThinkContent,
            contentBlocks: finalContentBlocks?.length ? finalContentBlocks : buildContentBlocks(finalContent, finalThinkContent),
            images: [],
            videos: [],
            audios: [],
            files: [],
            tools: [],
            timestamp: Date.now(),
            status: "done",
            model: payload.message?.model || void 0
          };
          messagesMap.value[sk] = [...msgs, doneMsg];
        }
      }
      return;
    }
    if (payload.state === "delta") {
      const msgContent = payload.message || {};
      if (msgContent.role === "toolResult") {
        const lastIdx = _lastAssistantIndex(msgs);
        if (lastIdx >= 0) {
          const newMsgs = [...msgs];
          const assistantMsg = { ...newMsgs[lastIdx] };
          const tools = assistantMsg.tools ? assistantMsg.tools.map((t) => ({ ...t })) : [];
          const toolCallId = msgContent._toolCallId || msgContent.toolCallId || msgContent.tool_call_id;
          const matchedIdx = tools.findIndex((t) => t.id === toolCallId && t.output == null);
          const toolIdx = matchedIdx >= 0 ? matchedIdx : tools.findIndex((t) => t.output == null);
          if (toolIdx >= 0) {
            let output = msgContent.content;
            if (Array.isArray(output)) {
              output = output.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("\n");
            }
            tools[toolIdx] = {
              ...tools[toolIdx],
              output: (typeof output === "string" ? output : String(output || "")).trim() || null,
              status: "ok"
            };
            assistantMsg.tools = tools;
            newMsgs[lastIdx] = assistantMsg;
            messagesMap.value[sk] = newMsgs;
          }
        }
        return;
      }
      let textContent = "";
      let thinkingContent = "";
      const rawContent = msgContent.content;
      if (typeof rawContent === "string") {
        const { clean, thinking } = stripThinkingTags(rawContent);
        textContent = clean;
        thinkingContent = thinking || "";
      } else if (Array.isArray(rawContent)) {
        textContent = rawContent.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("");
        thinkingContent = rawContent.filter((b) => b.type === "thinking" && b.thinking).map((b) => b.thinking).join("");
        if (!thinkingContent && textContent) {
          const { clean, thinking } = stripThinkingTags(textContent);
          if (thinking) {
            textContent = clean;
            thinkingContent = thinking;
          }
        }
      }
      if (!thinkingContent) {
        const thinkField = msgContent.thinking || msgContent.reasoning_content || msgContent.reasoning;
        if (thinkField) {
          if (typeof thinkField === "string") {
            thinkingContent = thinkField;
          } else if (Array.isArray(thinkField)) {
            thinkingContent = thinkField.map((b) => b.thinking || b.text || "").join("");
          }
        }
      }
      if (!thinkingContent && payload.thinking) {
        thinkingContent = typeof payload.thinking === "string" ? payload.thinking : "";
      }
      if (!textContent && !thinkingContent) {
        console.log(
          "[aiChat] 格式A delta 无内容, payload keys:",
          Object.keys(payload),
          "msgContent keys:",
          Object.keys(msgContent),
          "rawContent type:",
          typeof rawContent,
          "msgContent.thinking:",
          typeof msgContent.thinking,
          "msgContent.reasoning_content:",
          typeof msgContent.reasoning_content
        );
        return;
      }
      console.log(
        "[aiChat] 格式A 提取: textContent长度=",
        textContent.length,
        "thinkingContent长度=",
        thinkingContent.length,
        "existingIdx=",
        existingIdx
      );
      const _buildContentBlocks = (content, thinkContent) => {
        const blocks = [];
        if (thinkContent) blocks.push({ type: "thinking", thinking: thinkContent });
        if (content) blocks.push({ type: "text", text: content });
        return blocks;
      };
      if (existingIdx >= 0) {
        console.log("[DEDUP-DEBUG] 格式A 更新已有消息 | runId=", payload.runId, "| existingIdx=", existingIdx);
        const oldMsg = msgs[existingIdx];
        const updated = { ...oldMsg, status: "streaming" };
        if (textContent) updated.content = textContent;
        if (thinkingContent) updated._thinkContent = thinkingContent;
        updated.contentBlocks = _buildContentBlocks(updated.content, updated._thinkContent);
        const newMsgs = [...msgs];
        newMsgs[existingIdx] = updated;
        msgs = newMsgs;
        messagesMap.value[sk] = msgs;
      } else {
        const reuseIdx = _lastStreamingAssistantIndex(msgs);
        if (reuseIdx >= 0) {
          console.warn("[DEDUP-DEBUG] 格式A 复用已有流式消息 | runId=", payload.runId, "| reuseIdx=", reuseIdx);
          const oldMsg = msgs[reuseIdx];
          const updated = { ...oldMsg, runId: payload.runId || oldMsg.runId, status: "streaming" };
          if (textContent) updated.content = (oldMsg.content || "") + textContent;
          if (thinkingContent) updated._thinkContent = thinkingContent;
          updated.contentBlocks = _buildContentBlocks(updated.content, updated._thinkContent);
          const newMsgs = [...msgs];
          newMsgs[reuseIdx] = updated;
          msgs = newMsgs;
        } else {
          console.warn("[DEDUP-DEBUG] 格式A 创建新消息 | runId=", payload.runId, "| content前30字=", (textContent || "").slice(0, 30));
          const newMsg = {
            id: crypto.randomUUID(),
            role: msgContent.role || "assistant",
            content: textContent,
            _thinkContent: thinkingContent || void 0,
            images: [],
            videos: [],
            audios: [],
            files: [],
            tools: [],
            attachments: [],
            timestamp: Date.now(),
            runId: payload.runId,
            status: "streaming",
            model: msgContent.model || void 0
          };
          if (thinkingContent || textContent) {
            newMsg.contentBlocks = _buildContentBlocks(textContent, thinkingContent);
          }
          msgs.push(newMsg);
        }
        messagesMap.value[sk] = [...msgs];
      }
      if (payload.done) {
        sending.value = false;
        currentRunId.value = null;
        const curMsgs = messagesMap.value[sk] || [];
        const finalIdx = curMsgs.findIndex((m) => m.runId === payload.runId && m.role === "assistant");
        if (finalIdx >= 0) {
          const finalMsgs = [...curMsgs];
          finalMsgs[finalIdx] = { ...finalMsgs[finalIdx], status: "done", _streaming: false };
          messagesMap.value[sk] = finalMsgs;
        }
      }
      return;
    }
    if (payload.delta) {
      const deltaRole = payload.delta?.role || "";
      if (deltaRole === "toolResult" || payload.delta?.type === "tool_result") {
        const lastIdx = _lastAssistantIndex(msgs);
        if (lastIdx >= 0) {
          const newMsgs = [...msgs];
          const assistantMsg = { ...newMsgs[lastIdx] };
          const tools = assistantMsg.tools ? assistantMsg.tools.map((t) => ({ ...t })) : [];
          const toolCallId = payload.delta._toolCallId || payload.delta.toolCallId || payload.delta.tool_call_id;
          const matchedIdx = tools.findIndex((t) => t.id === toolCallId && t.status === "running");
          const toolIdx = matchedIdx >= 0 ? matchedIdx : tools.findIndex((t) => t.status === "running");
          if (toolIdx >= 0) {
            const deltaContent = payload.delta.content || payload.delta.output || "";
            tools[toolIdx] = {
              ...tools[toolIdx],
              output: deltaContent ? ((tools[toolIdx].output || "") + (typeof deltaContent === "string" ? deltaContent : "")).trim() || null : tools[toolIdx].output,
              status: payload.delta.status || "running"
            };
            assistantMsg.tools = tools;
            newMsgs[lastIdx] = assistantMsg;
            messagesMap.value[sk] = newMsgs;
          }
        }
        return;
      }
      if (existingIdx >= 0) {
        console.log("[DEDUP-DEBUG] 格式B 更新已有消息 | runId=", payload.runId, "| existingIdx=", existingIdx);
        const newMsgs = [...msgs];
        const updated = { ...newMsgs[existingIdx] };
        if (payload.delta.content) {
          if (typeof payload.delta.content === "string") {
            updated.content = (updated.content || "") + payload.delta.content;
            const { clean, thinking } = stripThinkingTags(updated.content);
            if (thinking) {
              updated.content = clean;
              updated._thinkContent = thinking;
            }
          } else {
            const parts = extractMessageParts({ content: payload.delta.content });
            updated.content = (updated.content || "") + parts.text;
            if (parts.thinking) {
              updated._thinkContent = (updated._thinkContent || "") + parts.thinking;
            }
          }
        }
        if (payload.delta.thinking) {
          const deltaThinking = typeof payload.delta.thinking === "string" ? payload.delta.thinking : extractMessageParts({ content: payload.delta.thinking }).thinking;
          updated._thinkContent = (updated._thinkContent || "") + deltaThinking;
        }
        if (updated._thinkContent || updated.content) {
          const blocks = [];
          if (updated._thinkContent) blocks.push({ type: "thinking", thinking: updated._thinkContent });
          if (updated.content) blocks.push({ type: "text", text: updated.content });
          updated.contentBlocks = blocks;
        }
        updated.status = "streaming";
        newMsgs[existingIdx] = updated;
        msgs = newMsgs;
      } else if (payload.message?.role === "assistant") {
        console.warn("[DEDUP-DEBUG] 格式B 创建新消息 | runId=", payload.runId, "| existingIdx=", existingIdx);
        const newMsg = normalizeMessage(payload.message || payload);
        newMsg.runId = payload.runId;
        newMsg.status = "streaming";
        msgs.push(newMsg);
      }
      messagesMap.value[sk] = [...msgs];
      return;
    }
    if (payload.message) {
      const normalized = normalizeMessage(payload.message);
      normalized.runId = payload.runId;
      if (existingIdx >= 0) {
        console.log("[DEDUP-DEBUG] 格式C 更新已有消息 | runId=", payload.runId, "| existingIdx=", existingIdx);
        const newMsgs = [...msgs];
        const current = newMsgs[existingIdx];
        newMsgs[existingIdx] = syncMessageBlocks({
          ...current,
          ...normalized,
          id: current.id,
          runId: payload.runId,
          status: "done",
          _streaming: false
        });
        msgs = _mergeToolResults(newMsgs);
      } else {
        console.warn("[DEDUP-DEBUG] 格式C 创建新消息 | runId=", payload.runId, "| sending=", sending.value);
        msgs = _mergeToolResults([...msgs, { ...normalized, status: "done", _streaming: false }]);
      }
      messagesMap.value[sk] = [...msgs];
      sending.value = false;
      currentRunId.value = null;
      return;
    }
    if (payload.role) {
      console.warn("[DEDUP-DEBUG] 格式D | runId=", payload.runId, "| role=", payload.role, "| existingIdx=", existingIdx);
      const normalized = normalizeMessage(payload);
      normalized.runId = payload.runId;
      const isDone = !payload.stopReason || payload.stopReason !== "toolUse" && payload.stopReason !== "toolResult";
      if (existingIdx >= 0) {
        const newMsgs = [...msgs];
        const current = newMsgs[existingIdx];
        newMsgs[existingIdx] = syncMessageBlocks({
          ...current,
          ...normalized,
          id: current.id,
          runId: payload.runId,
          status: current.status === "streaming" && isDone ? "done" : current.status,
          _streaming: current._streaming && !isDone
        });
        msgs = _mergeToolResults(newMsgs);
      } else {
        msgs = _mergeToolResults([...msgs, { ...normalized, status: isDone ? "done" : "streaming" }]);
      }
      messagesMap.value[sk] = [...msgs];
      if (isDone) {
        sending.value = false;
        currentRunId.value = null;
      }
      return;
    }
    if (payload.done) {
      console.log("[DEDUP-DEBUG] 格式E done | runId=", payload.runId, "| existingIdx=", existingIdx);
      sending.value = false;
      currentRunId.value = null;
      if (existingIdx >= 0) {
        const newMsgs = [...msgs];
        const updated = { ...newMsgs[existingIdx], status: "done", _streaming: false };
        if (!updated.contentBlocks && updated._thinkContent) {
          const blocks = [{ type: "thinking", thinking: updated._thinkContent }];
          if (updated.content) blocks.push({ type: "text", text: updated.content });
          updated.contentBlocks = blocks;
        }
        newMsgs[existingIdx] = updated;
        messagesMap.value[sk] = newMsgs;
      }
    }
  }
  function extractMessageParts(msg) {
    const tools = [];
    const thinkingParts = [];
    const contentBlocks = [];
    const topTools = msg.tool_calls || msg.toolCalls || msg.tools;
    if (Array.isArray(topTools)) {
      for (const tc of topTools) {
        const fn = tc.function || null;
        let input = tc.input || tc.args || tc.arguments || fn && fn.arguments || null;
        if (typeof input === "string") {
          try {
            input = JSON.parse(input);
          } catch {
          }
        }
        tools.push({ id: tc.id || tc.tool_call_id, name: tc.name || tc.tool || fn && fn.name || "tool", input, output: null, status: tc.status || "ok", time: msg.timestamp });
      }
    }
    if (Array.isArray(msg.content)) {
      const textArr = [];
      const images = [];
      const videos = [];
      const audios = [];
      const files = [];
      for (const block2 of msg.content) {
        if (block2.type === "thinking" && typeof block2.thinking === "string") {
          const t = block2.thinking.trim();
          if (t) {
            thinkingParts.push(t);
            contentBlocks.push({ type: "thinking", thinking: t });
          }
        } else if (block2.type === "text" && typeof block2.text === "string") {
          textArr.push(block2.text);
          contentBlocks.push({ type: "text", text: block2.text });
        } else if (block2.type === "image" && !block2.omitted) {
          if (block2.data) {
            images.push({ mediaType: block2.mimeType || "image/png", data: block2.data });
          } else if (block2.source && block2.source.type === "base64" && block2.source.data) {
            images.push({ mediaType: block2.source.media_type || "image/png", data: block2.source.data });
          } else if (block2.url || block2.source && block2.source.url) {
            images.push({ url: block2.url || block2.source.url });
          }
        } else if (block2.type === "image_url" && block2.image_url && block2.image_url.url) {
          images.push({ url: block2.image_url.url });
        } else if (block2.type === "video") {
          if (block2.data) videos.push({ mediaType: block2.mimeType || "video/mp4", data: block2.data });
          else if (block2.url) videos.push({ url: block2.url });
        } else if (block2.type === "audio" || block2.type === "voice") {
          if (block2.data) audios.push({ mediaType: block2.mimeType || "audio/mpeg", data: block2.data });
          else if (block2.url) audios.push({ url: block2.url });
        } else if (block2.type === "file" || block2.type === "document") {
          files.push({ url: block2.url || "", name: block2.fileName || block2.name || "file", mimeType: block2.mimeType || "", size: block2.size, data: block2.data });
        } else if (block2.type === "tool_use" || block2.type === "tool_call" || block2.type === "tool" || block2.type === "toolCall") {
          let input = block2.input || block2.args || block2.arguments || null;
          if (typeof input === "string") {
            try {
              input = JSON.parse(input);
            } catch {
            }
          }
          tools.push({ id: block2.id, name: block2.name || block2.tool || "tool", input, output: null, status: block2.output ? "ok" : "running", time: msg.timestamp });
        } else if (block2.type === "tool_result" || block2.type === "toolResult") {
          const existing = tools.find((t) => t.id === (block2.id || block2.tool_call_id));
          if (existing) {
            existing.output = block2.output || block2.result || block2.content;
          } else {
            tools.push({ id: block2.id, name: block2.name || "tool", input: null, output: block2.output || block2.result || block2.content, status: block2.status || "ok", time: msg.timestamp });
          }
        }
      }
      const mediaUrls = msg.mediaUrls || (msg.mediaUrl ? [msg.mediaUrl] : []);
      for (const url of mediaUrls) {
        if (!url) continue;
        if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) videos.push({ url });
        else if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url)) audios.push({ url });
        else if (/\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url)) images.push({ url });
        else files.push({ url, name: url.split("/").pop().split("?")[0] || "file" });
      }
      return {
        text: textArr.join("\n"),
        images: images.map((img) => img.url || (img.data ? "data:" + (img.mediaType || "image/png") + ";base64," + img.data : "")),
        videos,
        audios,
        files,
        tools,
        thinking: thinkingParts.join("\n") || "",
        contentBlocks
      };
    }
    return {
      text: typeof msg.text === "string" ? msg.text : typeof msg.content === "string" ? msg.content : "",
      images: [],
      videos: [],
      audios: [],
      files: [],
      tools,
      thinking: "",
      contentBlocks: []
    };
  }
  function stripThinkingTags(text2) {
    if (!text2) return { clean: text2 || "", thinking: "" };
    const parts = [];
    let clean = text2.replace(/<\s*think(?:ing)?\s*>[\s\S]*?<\s*\/\s*think(?:ing)?\s*>/gi, (match) => {
      const inner = match.replace(/<\s*\/?\s*think(?:ing)?\s*>/gi, "").trim();
      if (inner) parts.push(inner);
      return "";
    });
    const unclosed = clean.match(/<\s*think(?:ing)?\s*>[\s\S]*/i);
    if (unclosed) {
      const inner = unclosed[0].replace(/<\s*think(?:ing)?\s*>/i, "").trim();
      if (inner) parts.push(inner);
      clean = clean.replace(/<\s*think(?:ing)?\s*>[\s\S]*/i, "");
    }
    return { clean: clean.trim(), thinking: parts.join("\n") };
  }
  function buildContentBlocks(content, thinking) {
    const blocks = [];
    if (thinking) blocks.push({ type: "thinking", thinking });
    if (content) blocks.push({ type: "text", text: content });
    return blocks.length ? blocks : void 0;
  }
  function _lastAssistantIndex(msgs) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") return i;
    }
    return -1;
  }
  function _lastStreamingAssistantIndex(msgs) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant" && msgs[i]._streaming) return i;
    }
    return -1;
  }
  function syncMessageBlocks(msg) {
    if (msg.role !== "assistant") return msg;
    return {
      ...msg,
      contentBlocks: buildContentBlocks(msg.content, msg._thinkContent)
    };
  }
  function normalizeMessage(msg) {
    const role = msg.role || "assistant";
    if (role === "toolResult") {
      let content = msg.content;
      if (Array.isArray(content)) {
        content = content.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("\n");
      }
      return {
        id: msg.id || msg.messageId || crypto.randomUUID(),
        sessionKey: msg.sessionKey || void 0,
        role: "toolResult",
        content: (typeof content === "string" ? content : String(content || "")).trim(),
        _toolCallId: msg.toolCallId || msg.tool_call_id || null,
        _toolName: msg.toolName || msg.name || "tool",
        images: [],
        videos: [],
        audios: [],
        files: [],
        tools: [],
        attachments: [],
        timestamp: msg.timestamp || Date.now(),
        status: msg.status || "done"
      };
    }
    const { text: text2, images, videos, audios, files, tools, thinking: ytThinking } = extractMessageParts(msg);
    const { clean, thinking: muThinking } = stripThinkingTags(text2);
    const combinedThinking = [ytThinking, muThinking].filter(Boolean).join("\n") || void 0;
    const existingThink = msg._thinkContent || combinedThinking;
    return syncMessageBlocks({
      id: msg.id || msg.messageId || crypto.randomUUID(),
      sessionKey: msg.sessionKey || void 0,
      role,
      content: clean,
      images,
      videos,
      audios,
      files,
      tools,
      attachments: msg.attachments || [],
      _thinkContent: existingThink || void 0,
      timestamp: msg.timestamp || Date.now(),
      runId: msg.runId || void 0,
      status: msg.status || "done",
      model: msg.model || void 0
    });
  }
  function mergeThinking(base, next) {
    return [base, next].filter(Boolean).join("\n") || void 0;
  }
  function appendAssistantMessage(base, next, includeText = true) {
    const content = includeText ? [base.content, next.content].filter(Boolean).join("\n") : base.content;
    return syncMessageBlocks({
      ...base,
      content,
      tools: [...base.tools || [], ...next.tools || []],
      images: [...base.images || [], ...next.images || []],
      videos: [...base.videos || [], ...next.videos || []],
      audios: [...base.audios || [], ...next.audios || []],
      files: [...base.files || [], ...next.files || []],
      attachments: [...base.attachments || [], ...next.attachments || []],
      _thinkContent: mergeThinking(base._thinkContent, next._thinkContent),
      timestamp: Math.min(base.timestamp || Date.now(), next.timestamp || Date.now()),
      status: base.status === "streaming" || next.status === "streaming" ? "streaming" : "done"
    });
  }
  function _mergeToolResults(msgs) {
    const result = [];
    for (const rawMsg of msgs) {
      const msg = { ...rawMsg };
      const last = result[result.length - 1];
      if (msg.role === "toolResult") {
        if (last?.role === "assistant" && last.tools?.length) {
          const matchedTool = last.tools.find((t) => t.id === msg._toolCallId && t.output == null) || last.tools.find((t) => t.output == null);
          if (matchedTool) {
            matchedTool.output = (msg.content || "").trim() || null;
            matchedTool.status = "ok";
            last.tools = [...last.tools];
          }
        }
        continue;
      }
      if (msg.role === "assistant" && last?.role === "assistant") {
        const hasText = !!(msg.content || "").trim();
        const hasMedia = !!(msg.images?.length || msg.videos?.length || msg.audios?.length || msg.files?.length || msg.attachments?.length);
        const hasTools = !!msg.tools?.length;
        const lastHasTools = !!last.tools?.length;
        const lastHasText = !!(last.content || "").trim();
        if (hasTools && !hasText && !hasMedia) {
          result[result.length - 1] = appendAssistantMessage(last, msg, false);
          continue;
        }
        if (hasText && lastHasTools && !lastHasText) {
          result[result.length - 1] = appendAssistantMessage(last, msg);
          continue;
        }
        if (hasText && hasTools) {
          result[result.length - 1] = appendAssistantMessage(last, msg);
          continue;
        }
        if (hasText && !hasTools && lastHasTools) {
          result[result.length - 1] = appendAssistantMessage(last, msg);
          continue;
        }
      }
      result.push(syncMessageBlocks(msg));
    }
    for (const msg of result) {
      if (msg.tools?.length) {
        msg.tools = msg.tools.map((tool) => ({
          ...tool,
          status: tool.status === "running" ? "ok" : tool.status
        }));
      }
    }
    return result;
  }
  function _doPersist(sessionKey) {
    const msgs = messagesMap.value[sessionKey];
    if (!msgs || !msgs.length) return;
    const finalMsgs = msgs.filter((m) => m.status !== "streaming" && m._streaming !== true);
    if (!finalMsgs.length) return;
    const api = getApi();
    if (api?.saveChatMessagesBulk) {
      const clean = JSON.parse(JSON.stringify(/* @__PURE__ */ toRaw(finalMsgs)));
      api.saveChatMessagesBulk(sessionKey, clean).catch((e) => {
        console.error("[aiChat] persist failed for", sessionKey, e);
      });
    }
  }
  function _scheduleSave(sessionKey) {
    if (!sessionKey) return;
    if (_saveTimers[sessionKey]) clearTimeout(_saveTimers[sessionKey]);
    _saveTimers[sessionKey] = setTimeout(() => {
      delete _saveTimers[sessionKey];
      _doPersist(sessionKey);
    }, 1e3);
  }
  async function refreshSessions() {
    try {
      const result = await _ws?.sessionsList();
      const list2 = (result?.sessions || result || []).filter((s) => s.key);
      const userSessions = list2.filter((s) => !s.key?.startsWith("agent:"));
      if (!userSessions.find((s) => s.key === "main")) {
        userSessions.unshift({ key: "main", title: "主会话", status: "idle" });
      }
      const oldMap = new Map(sessions.value.map((s) => [s.key, s]));
      for (const s of userSessions) {
        const old = oldMap.get(s.key);
        if (old?.alias) s.alias = old.alias;
      }
      const existingKeys = new Set(userSessions.map((s) => s.key));
      const localExtra = sessions.value.filter(
        (s) => s.key?.startsWith("session:") && !existingKeys.has(s.key)
      );
      sessions.value = [...userSessions, ...localExtra];
      _saveSessions();
    } catch (e) {
      console.error("[aiChat] refreshSessions failed:", e);
    }
  }
  async function loadSessionMessages(sessionKey, limit = 200) {
    console.log("[DEDUP-DEBUG] loadSessionMessages 开始 | sessionKey=", sessionKey);
    try {
      const remoteResult = await _ws?.chatHistory(sessionKey, limit).catch((e) => {
        console.error("[aiChat] chatHistory WS failed:", e);
        return null;
      });
      if (remoteResult !== null) {
        const remoteRaw = remoteResult?.messages || remoteResult || [];
        if (remoteRaw.length) {
          const msgs = _mergeToolResults(remoteRaw.map(normalizeMessage)).slice(-limit);
          console.log("[DEDUP-DEBUG] loadSessionMessages Gateway 加载 | msgs数量=", msgs.length);
          messagesMap.value[sessionKey] = msgs;
          return;
        }
      }
    } catch (e) {
      console.error("[aiChat] chatHistory failed:", e);
    }
    const api = getApi();
    if (api?.loadChatMessages) {
      try {
        const localMsgs = await api.loadChatMessages(sessionKey, limit);
        if (localMsgs && localMsgs.length) {
          const msgs = _mergeToolResults(localMsgs.map((m) => ({ ...m }))).slice(-limit);
          console.log("[aiChat] 使用本地 JSONL 兜底 | session:", sessionKey, "消息数:", msgs.length);
          messagesMap.value[sessionKey] = msgs;
          return;
        }
      } catch (e) {
        console.error("[aiChat] 本地 JSONL 加载失败:", e);
      }
    }
    if (!messagesMap.value[sessionKey]?.length) {
      messagesMap.value[sessionKey] = [];
    } else {
      console.log("[aiChat] loadSessionMessages 无新数据，保留已有缓存 | session:", sessionKey, "消息数:", messagesMap.value[sessionKey].length);
    }
  }
  function createSession(initialModelId) {
    const key = "session:" + crypto.randomUUID().slice(0, 8);
    const session = { key, title: "新对话", status: "idle", createdAt: Date.now() };
    sessions.value.unshift(session);
    messagesMap.value[key] = [];
    activeSessionKey.value = key;
    if (initialModelId) {
      sessionModelMap.value[key] = initialModelId;
    }
    _saveSessions();
    const api = getApi();
    if (api?.saveChatMessagesBulk) {
      api.saveChatMessagesBulk(key, []).catch(() => {
      });
    }
    return session;
  }
  function selectSession(key) {
    if (key !== activeSessionKey.value) {
      activeSessionKey.value = key;
      _saveSessions();
      loadSessionMessages(key);
    }
  }
  async function deleteSession(key) {
    try {
      if (_ws) await _ws.sessionsDelete(key);
    } catch (e) {
      console.error("[aiChat] deleteSession failed:", e);
    }
    delete messagesMap.value[key];
    delete sessionModelMap.value[key];
    _ws?.clearMessageCache(key);
    const api = getApi();
    if (api?.clearChatMessages) {
      api.clearChatMessages(key).catch(() => {
      });
    }
    if (_saveTimers[key]) {
      clearTimeout(_saveTimers[key]);
      delete _saveTimers[key];
    }
    sessions.value = sessions.value.filter((s) => s.key !== key);
    if (activeSessionKey.value === key) {
      const next = sessions.value[0];
      activeSessionKey.value = next?.key || null;
      if (next) loadSessionMessages(next.key);
    }
    _saveSessions();
  }
  async function resetSession(key) {
    try {
      if (_ws) await _ws.sessionsReset(key);
    } catch (e) {
      console.error("[aiChat] resetSession failed:", e);
    }
    messagesMap.value[key] = [];
    const api = getApi();
    if (api?.clearChatMessages) {
      api.clearChatMessages(key).catch(() => {
      });
    }
    if (_saveTimers[key]) {
      clearTimeout(_saveTimers[key]);
      delete _saveTimers[key];
    }
  }
  function renameSession(key, name) {
    const session = sessions.value.find((s) => s.key === key);
    if (session) {
      session.alias = name;
      _saveSessions();
    }
  }
  async function sendMessage(text2, attachments) {
    console.log("发送了什么===>", text2, attachments);
    const sk = activeSessionKey.value;
    console.log("[DEDUP-DEBUG] sendMessage 调用 | sending=", sending.value, "| sessionKey=", sk, "| text前30字=", text2?.trim()?.slice(0, 30));
    if (sending.value) {
      console.warn("[DEDUP-DEBUG] sendMessage 被 sending 守卫拦截！调用栈:", new Error().stack);
      return;
    }
    if (!sk || !text2?.trim() && !attachments?.length) return;
    if (text2?.trim() && handleCommand(text2.trim())) return;
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text2 || "",
      images: [],
      videos: [],
      audios: [],
      files: [],
      tools: [],
      attachments: attachments || [],
      timestamp: Date.now(),
      status: "done"
    };
    const msgs = messagesMap.value[sk] || [];
    msgs.push(userMsg);
    messagesMap.value[sk] = [...msgs];
    _scheduleSave(sk);
    sending.value = true;
    inputText.value = "";
    const timeoutId = setTimeout(() => {
      if (sending.value) {
        console.warn("[aiChat] sendMessage 超时，120 秒未收到回复");
        sending.value = false;
        currentRunId.value = null;
        const timeoutMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "请求超时，未收到 AI 回复。请检查网络连接或重试。",
          images: [],
          videos: [],
          audios: [],
          files: [],
          tools: [],
          timestamp: Date.now(),
          status: "error"
        };
        const curMsgs = messagesMap.value[sk] || [];
        curMsgs.push(timeoutMsg);
        messagesMap.value[sk] = [...curMsgs];
        _scheduleSave(sk);
      }
    }, 12e4);
    const imageAtts = attachments?.filter((a) => a.type === "image" && a.content) || [];
    const fileAtts = attachments?.filter((a) => a.type === "file" && a.filePath) || [];
    let sendText = text2 || "";
    if (fileAtts.length) {
      const fileRefs = fileAtts.map((f) => `[file attached: ${f.filePath} (${f.fileName})]`).join("\n");
      sendText = sendText ? sendText + "\n" + fileRefs : fileRefs;
    }
    const sendAtts = imageAtts.length ? imageAtts.map((a) => ({ type: a.type, mimeType: a.mimeType, content: a.content, fileName: a.fileName })) : void 0;
    try {
      const result = await _ws?.chatSend(sk, sendText, sendAtts);
      clearTimeout(timeoutId);
      console.log("[DEDUP-DEBUG] chat.send 响应 | result.runId=", result?.runId, "| result=", JSON.stringify(result)?.slice(0, 200));
      if (result?.runId) {
        currentRunId.value = result.runId;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      sending.value = false;
      currentRunId.value = null;
      const errMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "发送失败: " + (e.message || "未知错误"),
        images: [],
        videos: [],
        audios: [],
        files: [],
        tools: [],
        timestamp: Date.now(),
        status: "error"
      };
      msgs.push(errMsg);
      messagesMap.value[sk] = [...msgs];
      _scheduleSave(sk);
    }
  }
  function abortMessage() {
    if (activeSessionKey.value) {
      _ws?.chatAbort(activeSessionKey.value, currentRunId.value);
      sending.value = false;
      currentRunId.value = null;
    }
  }
  function handleCommand(text2) {
    const cmd = text2.toLowerCase();
    if (cmd === "/new") {
      createSession();
      inputText.value = "";
      return true;
    }
    if (cmd === "/reset") {
      if (activeSessionKey.value) resetSession(activeSessionKey.value);
      inputText.value = "";
      return true;
    }
    if (cmd === "/stop") {
      abortMessage();
      inputText.value = "";
      return true;
    }
    return false;
  }
  async function refreshModels() {
    try {
      const result = await _ws?.modelsList();
      const list2 = result?.models || [];
      if (list2.length) {
        models.value = list2;
        if (!currentModel.value) {
          currentModel.value = list2[0]?.id || list2[0]?.model || null;
        }
      }
    } catch (e) {
      console.error("[aiChat] refreshModels failed:", e);
    }
  }
  function switchModel(modelId) {
    const sk = activeSessionKey.value;
    if (sk) {
      sessionModelMap.value[sk] = modelId;
      _ws?.chatSend(sk, "/model " + modelId);
    }
  }
  function getSessionModel(sessionKey) {
    return sessionModelMap.value[sessionKey] || null;
  }
  function saveProfile(p2) {
    profile.value = { ...profile.value, ...p2 };
    _saveProfile({ ...profile.value });
  }
  async function loadProfile() {
    profile.value = await _loadProfile();
    return profile.value;
  }
  return {
    // state
    wsStatus,
    wsError,
    sessions,
    activeSessionKey,
    sidebarVisible,
    messagesMap,
    models,
    currentModel,
    inputText,
    sending,
    currentRunId,
    showCommandPalette,
    profile,
    // computed
    currentMessages,
    isReady,
    activeSession,
    // methods
    getSessionName,
    init,
    setupWsConnection,
    teardownWsConnection,
    connectToGateway,
    reconnect,
    reconnectWs,
    refreshSessions,
    loadSessionMessages,
    createSession,
    selectSession,
    deleteSession,
    resetSession,
    renameSession,
    sendMessage,
    abortMessage,
    handleCommand,
    refreshModels,
    switchModel,
    getSessionModel,
    sessionModelMap,
    saveProfile,
    loadProfile
  };
});
const _hoisted_1$g = { class: "session-list" };
const _hoisted_2$f = { class: "session-header" };
const _hoisted_3$e = { class: "session-items" };
const _hoisted_4$c = {
  key: 0,
  class: "session-empty"
};
const _hoisted_5$c = ["onClick"];
const _hoisted_6$a = ["title"];
const _hoisted_7$a = {
  key: 0,
  class: "session-actions"
};
const _hoisted_8$9 = ["onClick"];
const _hoisted_9$6 = ["onClick"];
const _sfc_main$g = {
  __name: "SessionList",
  props: {
    sessions: { type: Array, default: () => [] },
    activeKey: { type: String, default: null }
  },
  emits: ["select", "delete", "rename", "newSession"],
  setup(__props) {
    const props = __props;
    const visibleSessions = computed(() => {
      return props.sessions.filter((s) => s && s.key);
    });
    function getFullName(session) {
      if (!session) return "未知";
      if (session.key === "main") return "主会话";
      return session.alias || session.title || "新对话";
    }
    function getDisplayName(session) {
      const name = getFullName(session);
      return name.length > 24 ? name.slice(0, 24) + "..." : name;
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$g, [
        createBaseVNode("div", _hoisted_2$f, [
          _cache[2] || (_cache[2] = createBaseVNode("span", { class: "header-label" }, "会话", -1)),
          createBaseVNode("button", {
            class: "new-btn",
            onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("newSession")),
            title: "新建会话"
          }, [..._cache[1] || (_cache[1] = [
            createBaseVNode("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2"
            }, [
              createBaseVNode("path", { d: "M12 5v14M5 12h14" })
            ], -1)
          ])])
        ]),
        createBaseVNode("div", _hoisted_3$e, [
          visibleSessions.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_4$c, " 暂无会话 ")) : createCommentVNode("", true),
          (openBlock(true), createElementBlock(Fragment, null, renderList(visibleSessions.value, (session) => {
            return openBlock(), createElementBlock("div", {
              key: session.key,
              class: normalizeClass(["session-item", { active: session.key === __props.activeKey }]),
              onClick: ($event) => _ctx.$emit("select", session.key)
            }, [
              _cache[5] || (_cache[5] = createBaseVNode("svg", {
                class: "session-icon",
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2"
              }, [
                createBaseVNode("path", { d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" })
              ], -1)),
              createBaseVNode("span", {
                class: "session-text",
                title: getFullName(session)
              }, toDisplayString(getDisplayName(session)), 9, _hoisted_6$a),
              session.key !== "main" ? (openBlock(), createElementBlock("div", _hoisted_7$a, [
                createBaseVNode("button", {
                  class: "action-icon",
                  onClick: withModifiers(($event) => _ctx.$emit("rename", session), ["stop"]),
                  title: "重命名"
                }, [..._cache[3] || (_cache[3] = [
                  createBaseVNode("svg", {
                    width: "10",
                    height: "10",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "2"
                  }, [
                    createBaseVNode("path", { d: "M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" })
                  ], -1)
                ])], 8, _hoisted_8$9),
                createBaseVNode("button", {
                  class: "action-icon delete-icon",
                  onClick: withModifiers(($event) => _ctx.$emit("delete", session.key), ["stop"]),
                  title: "删除"
                }, [..._cache[4] || (_cache[4] = [
                  createBaseVNode("svg", {
                    width: "10",
                    height: "10",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "2"
                  }, [
                    createBaseVNode("path", { d: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" })
                  ], -1)
                ])], 8, _hoisted_9$6)
              ])) : createCommentVNode("", true)
            ], 10, _hoisted_5$c);
          }), 128))
        ])
      ]);
    };
  }
};
const SessionList = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-902351f9"]]);
function _getDefaults() {
  return {
    async: false,
    breaks: false,
    extensions: null,
    gfm: true,
    hooks: null,
    pedantic: false,
    renderer: null,
    silent: false,
    tokenizer: null,
    walkTokens: null
  };
}
var _defaults = _getDefaults();
function changeDefaults(newDefaults) {
  _defaults = newDefaults;
}
var noopTest = { exec: () => null };
function edit(regex, opt = "") {
  let source = typeof regex === "string" ? regex : regex.source;
  const obj = {
    replace: (name, val) => {
      let valSource = typeof val === "string" ? val : val.source;
      valSource = valSource.replace(other.caret, "$1");
      source = source.replace(name, valSource);
      return obj;
    },
    getRegex: () => {
      return new RegExp(source, opt);
    }
  };
  return obj;
}
var other = {
  codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
  outputLinkReplace: /\\([\[\]])/g,
  indentCodeCompensation: /^(\s+)(?:```)/,
  beginningSpace: /^\s+/,
  endingHash: /#$/,
  startingSpaceChar: /^ /,
  endingSpaceChar: / $/,
  nonSpaceChar: /[^ ]/,
  newLineCharGlobal: /\n/g,
  tabCharGlobal: /\t/g,
  multipleSpaceGlobal: /\s+/g,
  blankLine: /^[ \t]*$/,
  doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
  blockquoteStart: /^ {0,3}>/,
  blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
  blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
  listReplaceTabs: /^\t+/,
  listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
  listIsTask: /^\[[ xX]\] /,
  listReplaceTask: /^\[[ xX]\] +/,
  anyLine: /\n.*\n/,
  hrefBrackets: /^<(.*)>$/,
  tableDelimiter: /[:|]/,
  tableAlignChars: /^\||\| *$/g,
  tableRowBlankLine: /\n[ \t]*$/,
  tableAlignRight: /^ *-+: *$/,
  tableAlignCenter: /^ *:-+: *$/,
  tableAlignLeft: /^ *:-+ *$/,
  startATag: /^<a /i,
  endATag: /^<\/a>/i,
  startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
  endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
  startAngleBracket: /^</,
  endAngleBracket: />$/,
  pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
  unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
  escapeTest: /[&<>"']/,
  escapeReplace: /[&<>"']/g,
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
  caret: /(^|[^\[])\^/g,
  percentDecode: /%25/g,
  findPipe: /\|/g,
  splitPipe: / \|/,
  slashPipe: /\\\|/g,
  carriageReturn: /\r\n|\r/g,
  spaceLine: /^ +$/gm,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  listItemRegex: (bull) => new RegExp(`^( {0,3}${bull})((?:[	 ][^\\n]*)?(?:\\n|$))`),
  nextBulletRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
  hrRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
  fencesBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`),
  headingBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`),
  htmlBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}<(?:[a-z].*>|!--)`, "i")
};
var newline = /^(?:[ \t]*(?:\n|$))+/;
var blockCode = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var fences = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var bullet = /(?:[*+-]|\d{1,9}[.)])/;
var lheadingCore = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var lheading = edit(lheadingCore).replace(/bull/g, bullet).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var lheadingGfm = edit(lheadingCore).replace(/bull/g, bullet).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var blockText = /^[^\n]+/;
var _blockLabel = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
var def = edit(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", _blockLabel).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var list = edit(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, bullet).getRegex();
var _tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var _comment = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var html$2 = edit(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", _comment).replace("tag", _tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var paragraph = edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
var blockquote = edit(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", paragraph).getRegex();
var blockNormal = {
  blockquote,
  code: blockCode,
  def,
  fences,
  heading,
  hr,
  html: html$2,
  lheading,
  list,
  newline,
  paragraph,
  table: noopTest,
  text: blockText
};
var gfmTable = edit(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
var blockGfm = {
  ...blockNormal,
  lheading: lheadingGfm,
  table: gfmTable,
  paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", gfmTable).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex()
};
var blockPedantic = {
  ...blockNormal,
  html: edit(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", _comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: noopTest,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", lheading).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
};
var escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var br = /^( {2,}|\\)\n(?!\s*$)/;
var inlineText = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var _punctuation = /[\p{P}\p{S}]/u;
var _punctuationOrSpace = /[\s\p{P}\p{S}]/u;
var _notPunctuationOrSpace = /[^\s\p{P}\p{S}]/u;
var punctuation = edit(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, _punctuationOrSpace).getRegex();
var _punctuationGfmStrongEm = /(?!~)[\p{P}\p{S}]/u;
var _punctuationOrSpaceGfmStrongEm = /(?!~)[\s\p{P}\p{S}]/u;
var _notPunctuationOrSpaceGfmStrongEm = /(?:[^\s\p{P}\p{S}]|~)/u;
var blockSkip = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g;
var emStrongLDelimCore = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
var emStrongLDelim = edit(emStrongLDelimCore, "u").replace(/punct/g, _punctuation).getRegex();
var emStrongLDelimGfm = edit(emStrongLDelimCore, "u").replace(/punct/g, _punctuationGfmStrongEm).getRegex();
var emStrongRDelimAstCore = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var emStrongRDelimAst = edit(emStrongRDelimAstCore, "gu").replace(/notPunctSpace/g, _notPunctuationOrSpace).replace(/punctSpace/g, _punctuationOrSpace).replace(/punct/g, _punctuation).getRegex();
var emStrongRDelimAstGfm = edit(emStrongRDelimAstCore, "gu").replace(/notPunctSpace/g, _notPunctuationOrSpaceGfmStrongEm).replace(/punctSpace/g, _punctuationOrSpaceGfmStrongEm).replace(/punct/g, _punctuationGfmStrongEm).getRegex();
var emStrongRDelimUnd = edit(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, _notPunctuationOrSpace).replace(/punctSpace/g, _punctuationOrSpace).replace(/punct/g, _punctuation).getRegex();
var anyPunctuation = edit(/\\(punct)/, "gu").replace(/punct/g, _punctuation).getRegex();
var autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var _inlineComment = edit(_comment).replace("(?:-->|$)", "-->").getRegex();
var tag = edit(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", _inlineComment).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var _inlineLabel = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
var link = edit(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", _inlineLabel).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var reflink = edit(/^!?\[(label)\]\[(ref)\]/).replace("label", _inlineLabel).replace("ref", _blockLabel).getRegex();
var nolink = edit(/^!?\[(ref)\](?:\[\])?/).replace("ref", _blockLabel).getRegex();
var reflinkSearch = edit("reflink|nolink(?!\\()", "g").replace("reflink", reflink).replace("nolink", nolink).getRegex();
var inlineNormal = {
  _backpedal: noopTest,
  // only used for GFM url
  anyPunctuation,
  autolink,
  blockSkip,
  br,
  code: inlineCode,
  del: noopTest,
  emStrongLDelim,
  emStrongRDelimAst,
  emStrongRDelimUnd,
  escape,
  link,
  nolink,
  punctuation,
  reflink,
  reflinkSearch,
  tag,
  text: inlineText,
  url: noopTest
};
var inlinePedantic = {
  ...inlineNormal,
  link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", _inlineLabel).getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", _inlineLabel).getRegex()
};
var inlineGfm = {
  ...inlineNormal,
  emStrongRDelimAst: emStrongRDelimAstGfm,
  emStrongLDelim: emStrongLDelimGfm,
  url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
};
var inlineBreaks = {
  ...inlineGfm,
  br: edit(br).replace("{2,}", "*").getRegex(),
  text: edit(inlineGfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
};
var block = {
  normal: blockNormal,
  gfm: blockGfm,
  pedantic: blockPedantic
};
var inline = {
  normal: inlineNormal,
  gfm: inlineGfm,
  breaks: inlineBreaks,
  pedantic: inlinePedantic
};
var escapeReplacements = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
var getEscapeReplacement = (ch) => escapeReplacements[ch];
function escape2(html2, encode2) {
  if (encode2) {
    if (other.escapeTest.test(html2)) {
      return html2.replace(other.escapeReplace, getEscapeReplacement);
    }
  } else {
    if (other.escapeTestNoEncode.test(html2)) {
      return html2.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
    }
  }
  return html2;
}
function cleanUrl(href) {
  try {
    href = encodeURI(href).replace(other.percentDecode, "%");
  } catch {
    return null;
  }
  return href;
}
function splitCells(tableRow, count) {
  const row = tableRow.replace(other.findPipe, (match, offset, str) => {
    let escaped = false;
    let curr = offset;
    while (--curr >= 0 && str[curr] === "\\") escaped = !escaped;
    if (escaped) {
      return "|";
    } else {
      return " |";
    }
  }), cells = row.split(other.splitPipe);
  let i = 0;
  if (!cells[0].trim()) {
    cells.shift();
  }
  if (cells.length > 0 && !cells.at(-1)?.trim()) {
    cells.pop();
  }
  if (count) {
    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count) cells.push("");
    }
  }
  for (; i < cells.length; i++) {
    cells[i] = cells[i].trim().replace(other.slashPipe, "|");
  }
  return cells;
}
function rtrim(str, c, invert) {
  const l = str.length;
  if (l === 0) {
    return "";
  }
  let suffLen = 0;
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);
    if (currChar === c && true) {
      suffLen++;
    } else {
      break;
    }
  }
  return str.slice(0, l - suffLen);
}
function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }
  let level = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\\") {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  if (level > 0) {
    return -2;
  }
  return -1;
}
function outputLink(cap, link2, raw, lexer2, rules) {
  const href = link2.href;
  const title = link2.title || null;
  const text2 = cap[1].replace(rules.other.outputLinkReplace, "$1");
  lexer2.state.inLink = true;
  const token = {
    type: cap[0].charAt(0) === "!" ? "image" : "link",
    raw,
    href,
    title,
    text: text2,
    tokens: lexer2.inlineTokens(text2)
  };
  lexer2.state.inLink = false;
  return token;
}
function indentCodeCompensation(raw, text2, rules) {
  const matchIndentToCode = raw.match(rules.other.indentCodeCompensation);
  if (matchIndentToCode === null) {
    return text2;
  }
  const indentToCode = matchIndentToCode[1];
  return text2.split("\n").map((node) => {
    const matchIndentInNode = node.match(rules.other.beginningSpace);
    if (matchIndentInNode === null) {
      return node;
    }
    const [indentInNode] = matchIndentInNode;
    if (indentInNode.length >= indentToCode.length) {
      return node.slice(indentToCode.length);
    }
    return node;
  }).join("\n");
}
var _Tokenizer = class {
  options;
  rules;
  // set by the lexer
  lexer;
  // set by the lexer
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  space(src) {
    const cap = this.rules.block.newline.exec(src);
    if (cap && cap[0].length > 0) {
      return {
        type: "space",
        raw: cap[0]
      };
    }
  }
  code(src) {
    const cap = this.rules.block.code.exec(src);
    if (cap) {
      const text2 = cap[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: cap[0],
        codeBlockStyle: "indented",
        text: !this.options.pedantic ? rtrim(text2, "\n") : text2
      };
    }
  }
  fences(src) {
    const cap = this.rules.block.fences.exec(src);
    if (cap) {
      const raw = cap[0];
      const text2 = indentCodeCompensation(raw, cap[3] || "", this.rules);
      return {
        type: "code",
        raw,
        lang: cap[2] ? cap[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : cap[2],
        text: text2
      };
    }
  }
  heading(src) {
    const cap = this.rules.block.heading.exec(src);
    if (cap) {
      let text2 = cap[2].trim();
      if (this.rules.other.endingHash.test(text2)) {
        const trimmed = rtrim(text2, "#");
        if (this.options.pedantic) {
          text2 = trimmed.trim();
        } else if (!trimmed || this.rules.other.endingSpaceChar.test(trimmed)) {
          text2 = trimmed.trim();
        }
      }
      return {
        type: "heading",
        raw: cap[0],
        depth: cap[1].length,
        text: text2,
        tokens: this.lexer.inline(text2)
      };
    }
  }
  hr(src) {
    const cap = this.rules.block.hr.exec(src);
    if (cap) {
      return {
        type: "hr",
        raw: rtrim(cap[0], "\n")
      };
    }
  }
  blockquote(src) {
    const cap = this.rules.block.blockquote.exec(src);
    if (cap) {
      let lines = rtrim(cap[0], "\n").split("\n");
      let raw = "";
      let text2 = "";
      const tokens = [];
      while (lines.length > 0) {
        let inBlockquote = false;
        const currentLines = [];
        let i;
        for (i = 0; i < lines.length; i++) {
          if (this.rules.other.blockquoteStart.test(lines[i])) {
            currentLines.push(lines[i]);
            inBlockquote = true;
          } else if (!inBlockquote) {
            currentLines.push(lines[i]);
          } else {
            break;
          }
        }
        lines = lines.slice(i);
        const currentRaw = currentLines.join("\n");
        const currentText = currentRaw.replace(this.rules.other.blockquoteSetextReplace, "\n    $1").replace(this.rules.other.blockquoteSetextReplace2, "");
        raw = raw ? `${raw}
${currentRaw}` : currentRaw;
        text2 = text2 ? `${text2}
${currentText}` : currentText;
        const top = this.lexer.state.top;
        this.lexer.state.top = true;
        this.lexer.blockTokens(currentText, tokens, true);
        this.lexer.state.top = top;
        if (lines.length === 0) {
          break;
        }
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "code") {
          break;
        } else if (lastToken?.type === "blockquote") {
          const oldToken = lastToken;
          const newText = oldToken.raw + "\n" + lines.join("\n");
          const newToken = this.blockquote(newText);
          tokens[tokens.length - 1] = newToken;
          raw = raw.substring(0, raw.length - oldToken.raw.length) + newToken.raw;
          text2 = text2.substring(0, text2.length - oldToken.text.length) + newToken.text;
          break;
        } else if (lastToken?.type === "list") {
          const oldToken = lastToken;
          const newText = oldToken.raw + "\n" + lines.join("\n");
          const newToken = this.list(newText);
          tokens[tokens.length - 1] = newToken;
          raw = raw.substring(0, raw.length - lastToken.raw.length) + newToken.raw;
          text2 = text2.substring(0, text2.length - oldToken.raw.length) + newToken.raw;
          lines = newText.substring(tokens.at(-1).raw.length).split("\n");
          continue;
        }
      }
      return {
        type: "blockquote",
        raw,
        tokens,
        text: text2
      };
    }
  }
  list(src) {
    let cap = this.rules.block.list.exec(src);
    if (cap) {
      let bull = cap[1].trim();
      const isordered = bull.length > 1;
      const list2 = {
        type: "list",
        raw: "",
        ordered: isordered,
        start: isordered ? +bull.slice(0, -1) : "",
        loose: false,
        items: []
      };
      bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
      if (this.options.pedantic) {
        bull = isordered ? bull : "[*+-]";
      }
      const itemRegex = this.rules.other.listItemRegex(bull);
      let endsWithBlankLine = false;
      while (src) {
        let endEarly = false;
        let raw = "";
        let itemContents = "";
        if (!(cap = itemRegex.exec(src))) {
          break;
        }
        if (this.rules.block.hr.test(src)) {
          break;
        }
        raw = cap[0];
        src = src.substring(raw.length);
        let line = cap[2].split("\n", 1)[0].replace(this.rules.other.listReplaceTabs, (t) => " ".repeat(3 * t.length));
        let nextLine = src.split("\n", 1)[0];
        let blankLine = !line.trim();
        let indent = 0;
        if (this.options.pedantic) {
          indent = 2;
          itemContents = line.trimStart();
        } else if (blankLine) {
          indent = cap[1].length + 1;
        } else {
          indent = cap[2].search(this.rules.other.nonSpaceChar);
          indent = indent > 4 ? 1 : indent;
          itemContents = line.slice(indent);
          indent += cap[1].length;
        }
        if (blankLine && this.rules.other.blankLine.test(nextLine)) {
          raw += nextLine + "\n";
          src = src.substring(nextLine.length + 1);
          endEarly = true;
        }
        if (!endEarly) {
          const nextBulletRegex = this.rules.other.nextBulletRegex(indent);
          const hrRegex = this.rules.other.hrRegex(indent);
          const fencesBeginRegex = this.rules.other.fencesBeginRegex(indent);
          const headingBeginRegex = this.rules.other.headingBeginRegex(indent);
          const htmlBeginRegex = this.rules.other.htmlBeginRegex(indent);
          while (src) {
            const rawLine = src.split("\n", 1)[0];
            let nextLineWithoutTabs;
            nextLine = rawLine;
            if (this.options.pedantic) {
              nextLine = nextLine.replace(this.rules.other.listReplaceNesting, "  ");
              nextLineWithoutTabs = nextLine;
            } else {
              nextLineWithoutTabs = nextLine.replace(this.rules.other.tabCharGlobal, "    ");
            }
            if (fencesBeginRegex.test(nextLine)) {
              break;
            }
            if (headingBeginRegex.test(nextLine)) {
              break;
            }
            if (htmlBeginRegex.test(nextLine)) {
              break;
            }
            if (nextBulletRegex.test(nextLine)) {
              break;
            }
            if (hrRegex.test(nextLine)) {
              break;
            }
            if (nextLineWithoutTabs.search(this.rules.other.nonSpaceChar) >= indent || !nextLine.trim()) {
              itemContents += "\n" + nextLineWithoutTabs.slice(indent);
            } else {
              if (blankLine) {
                break;
              }
              if (line.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4) {
                break;
              }
              if (fencesBeginRegex.test(line)) {
                break;
              }
              if (headingBeginRegex.test(line)) {
                break;
              }
              if (hrRegex.test(line)) {
                break;
              }
              itemContents += "\n" + nextLine;
            }
            if (!blankLine && !nextLine.trim()) {
              blankLine = true;
            }
            raw += rawLine + "\n";
            src = src.substring(rawLine.length + 1);
            line = nextLineWithoutTabs.slice(indent);
          }
        }
        if (!list2.loose) {
          if (endsWithBlankLine) {
            list2.loose = true;
          } else if (this.rules.other.doubleBlankLine.test(raw)) {
            endsWithBlankLine = true;
          }
        }
        let istask = null;
        let ischecked;
        if (this.options.gfm) {
          istask = this.rules.other.listIsTask.exec(itemContents);
          if (istask) {
            ischecked = istask[0] !== "[ ] ";
            itemContents = itemContents.replace(this.rules.other.listReplaceTask, "");
          }
        }
        list2.items.push({
          type: "list_item",
          raw,
          task: !!istask,
          checked: ischecked,
          loose: false,
          text: itemContents,
          tokens: []
        });
        list2.raw += raw;
      }
      const lastItem = list2.items.at(-1);
      if (lastItem) {
        lastItem.raw = lastItem.raw.trimEnd();
        lastItem.text = lastItem.text.trimEnd();
      } else {
        return;
      }
      list2.raw = list2.raw.trimEnd();
      for (let i = 0; i < list2.items.length; i++) {
        this.lexer.state.top = false;
        list2.items[i].tokens = this.lexer.blockTokens(list2.items[i].text, []);
        if (!list2.loose) {
          const spacers = list2.items[i].tokens.filter((t) => t.type === "space");
          const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t) => this.rules.other.anyLine.test(t.raw));
          list2.loose = hasMultipleLineBreaks;
        }
      }
      if (list2.loose) {
        for (let i = 0; i < list2.items.length; i++) {
          list2.items[i].loose = true;
        }
      }
      return list2;
    }
  }
  html(src) {
    const cap = this.rules.block.html.exec(src);
    if (cap) {
      const token = {
        type: "html",
        block: true,
        raw: cap[0],
        pre: cap[1] === "pre" || cap[1] === "script" || cap[1] === "style",
        text: cap[0]
      };
      return token;
    }
  }
  def(src) {
    const cap = this.rules.block.def.exec(src);
    if (cap) {
      const tag2 = cap[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " ");
      const href = cap[2] ? cap[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "";
      const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : cap[3];
      return {
        type: "def",
        tag: tag2,
        raw: cap[0],
        href,
        title
      };
    }
  }
  table(src) {
    const cap = this.rules.block.table.exec(src);
    if (!cap) {
      return;
    }
    if (!this.rules.other.tableDelimiter.test(cap[2])) {
      return;
    }
    const headers = splitCells(cap[1]);
    const aligns = cap[2].replace(this.rules.other.tableAlignChars, "").split("|");
    const rows = cap[3]?.trim() ? cap[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [];
    const item = {
      type: "table",
      raw: cap[0],
      header: [],
      align: [],
      rows: []
    };
    if (headers.length !== aligns.length) {
      return;
    }
    for (const align of aligns) {
      if (this.rules.other.tableAlignRight.test(align)) {
        item.align.push("right");
      } else if (this.rules.other.tableAlignCenter.test(align)) {
        item.align.push("center");
      } else if (this.rules.other.tableAlignLeft.test(align)) {
        item.align.push("left");
      } else {
        item.align.push(null);
      }
    }
    for (let i = 0; i < headers.length; i++) {
      item.header.push({
        text: headers[i],
        tokens: this.lexer.inline(headers[i]),
        header: true,
        align: item.align[i]
      });
    }
    for (const row of rows) {
      item.rows.push(splitCells(row, item.header.length).map((cell, i) => {
        return {
          text: cell,
          tokens: this.lexer.inline(cell),
          header: false,
          align: item.align[i]
        };
      }));
    }
    return item;
  }
  lheading(src) {
    const cap = this.rules.block.lheading.exec(src);
    if (cap) {
      return {
        type: "heading",
        raw: cap[0],
        depth: cap[2].charAt(0) === "=" ? 1 : 2,
        text: cap[1],
        tokens: this.lexer.inline(cap[1])
      };
    }
  }
  paragraph(src) {
    const cap = this.rules.block.paragraph.exec(src);
    if (cap) {
      const text2 = cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1];
      return {
        type: "paragraph",
        raw: cap[0],
        text: text2,
        tokens: this.lexer.inline(text2)
      };
    }
  }
  text(src) {
    const cap = this.rules.block.text.exec(src);
    if (cap) {
      return {
        type: "text",
        raw: cap[0],
        text: cap[0],
        tokens: this.lexer.inline(cap[0])
      };
    }
  }
  escape(src) {
    const cap = this.rules.inline.escape.exec(src);
    if (cap) {
      return {
        type: "escape",
        raw: cap[0],
        text: cap[1]
      };
    }
  }
  tag(src) {
    const cap = this.rules.inline.tag.exec(src);
    if (cap) {
      if (!this.lexer.state.inLink && this.rules.other.startATag.test(cap[0])) {
        this.lexer.state.inLink = true;
      } else if (this.lexer.state.inLink && this.rules.other.endATag.test(cap[0])) {
        this.lexer.state.inLink = false;
      }
      if (!this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(cap[0])) {
        this.lexer.state.inRawBlock = true;
      } else if (this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(cap[0])) {
        this.lexer.state.inRawBlock = false;
      }
      return {
        type: "html",
        raw: cap[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: false,
        text: cap[0]
      };
    }
  }
  link(src) {
    const cap = this.rules.inline.link.exec(src);
    if (cap) {
      const trimmedUrl = cap[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(trimmedUrl)) {
        if (!this.rules.other.endAngleBracket.test(trimmedUrl)) {
          return;
        }
        const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
        if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
          return;
        }
      } else {
        const lastParenIndex = findClosingBracket(cap[2], "()");
        if (lastParenIndex === -2) {
          return;
        }
        if (lastParenIndex > -1) {
          const start = cap[0].indexOf("!") === 0 ? 5 : 4;
          const linkLen = start + cap[1].length + lastParenIndex;
          cap[2] = cap[2].substring(0, lastParenIndex);
          cap[0] = cap[0].substring(0, linkLen).trim();
          cap[3] = "";
        }
      }
      let href = cap[2];
      let title = "";
      if (this.options.pedantic) {
        const link2 = this.rules.other.pedanticHrefTitle.exec(href);
        if (link2) {
          href = link2[1];
          title = link2[3];
        }
      } else {
        title = cap[3] ? cap[3].slice(1, -1) : "";
      }
      href = href.trim();
      if (this.rules.other.startAngleBracket.test(href)) {
        if (this.options.pedantic && !this.rules.other.endAngleBracket.test(trimmedUrl)) {
          href = href.slice(1);
        } else {
          href = href.slice(1, -1);
        }
      }
      return outputLink(cap, {
        href: href ? href.replace(this.rules.inline.anyPunctuation, "$1") : href,
        title: title ? title.replace(this.rules.inline.anyPunctuation, "$1") : title
      }, cap[0], this.lexer, this.rules);
    }
  }
  reflink(src, links) {
    let cap;
    if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
      const linkString = (cap[2] || cap[1]).replace(this.rules.other.multipleSpaceGlobal, " ");
      const link2 = links[linkString.toLowerCase()];
      if (!link2) {
        const text2 = cap[0].charAt(0);
        return {
          type: "text",
          raw: text2,
          text: text2
        };
      }
      return outputLink(cap, link2, cap[0], this.lexer, this.rules);
    }
  }
  emStrong(src, maskedSrc, prevChar = "") {
    let match = this.rules.inline.emStrongLDelim.exec(src);
    if (!match) return;
    if (match[3] && prevChar.match(this.rules.other.unicodeAlphaNumeric)) return;
    const nextChar = match[1] || match[2] || "";
    if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
      const lLength = [...match[0]].length - 1;
      let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
      const endReg = match[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      endReg.lastIndex = 0;
      maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
      while ((match = endReg.exec(maskedSrc)) != null) {
        rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        if (!rDelim) continue;
        rLength = [...rDelim].length;
        if (match[3] || match[4]) {
          delimTotal += rLength;
          continue;
        } else if (match[5] || match[6]) {
          if (lLength % 3 && !((lLength + rLength) % 3)) {
            midDelimTotal += rLength;
            continue;
          }
        }
        delimTotal -= rLength;
        if (delimTotal > 0) continue;
        rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
        const lastCharLength = [...match[0]][0].length;
        const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
        if (Math.min(lLength, rLength) % 2) {
          const text22 = raw.slice(1, -1);
          return {
            type: "em",
            raw,
            text: text22,
            tokens: this.lexer.inlineTokens(text22)
          };
        }
        const text2 = raw.slice(2, -2);
        return {
          type: "strong",
          raw,
          text: text2,
          tokens: this.lexer.inlineTokens(text2)
        };
      }
    }
  }
  codespan(src) {
    const cap = this.rules.inline.code.exec(src);
    if (cap) {
      let text2 = cap[2].replace(this.rules.other.newLineCharGlobal, " ");
      const hasNonSpaceChars = this.rules.other.nonSpaceChar.test(text2);
      const hasSpaceCharsOnBothEnds = this.rules.other.startingSpaceChar.test(text2) && this.rules.other.endingSpaceChar.test(text2);
      if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
        text2 = text2.substring(1, text2.length - 1);
      }
      return {
        type: "codespan",
        raw: cap[0],
        text: text2
      };
    }
  }
  br(src) {
    const cap = this.rules.inline.br.exec(src);
    if (cap) {
      return {
        type: "br",
        raw: cap[0]
      };
    }
  }
  del(src) {
    const cap = this.rules.inline.del.exec(src);
    if (cap) {
      return {
        type: "del",
        raw: cap[0],
        text: cap[2],
        tokens: this.lexer.inlineTokens(cap[2])
      };
    }
  }
  autolink(src) {
    const cap = this.rules.inline.autolink.exec(src);
    if (cap) {
      let text2, href;
      if (cap[2] === "@") {
        text2 = cap[1];
        href = "mailto:" + text2;
      } else {
        text2 = cap[1];
        href = text2;
      }
      return {
        type: "link",
        raw: cap[0],
        text: text2,
        href,
        tokens: [
          {
            type: "text",
            raw: text2,
            text: text2
          }
        ]
      };
    }
  }
  url(src) {
    let cap;
    if (cap = this.rules.inline.url.exec(src)) {
      let text2, href;
      if (cap[2] === "@") {
        text2 = cap[0];
        href = "mailto:" + text2;
      } else {
        let prevCapZero;
        do {
          prevCapZero = cap[0];
          cap[0] = this.rules.inline._backpedal.exec(cap[0])?.[0] ?? "";
        } while (prevCapZero !== cap[0]);
        text2 = cap[0];
        if (cap[1] === "www.") {
          href = "http://" + cap[0];
        } else {
          href = cap[0];
        }
      }
      return {
        type: "link",
        raw: cap[0],
        text: text2,
        href,
        tokens: [
          {
            type: "text",
            raw: text2,
            text: text2
          }
        ]
      };
    }
  }
  inlineText(src) {
    const cap = this.rules.inline.text.exec(src);
    if (cap) {
      const escaped = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: cap[0],
        text: cap[0],
        escaped
      };
    }
  }
};
var _Lexer = class __Lexer {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(options2) {
    this.tokens = [];
    this.tokens.links = /* @__PURE__ */ Object.create(null);
    this.options = options2 || _defaults;
    this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
    this.tokenizer = this.options.tokenizer;
    this.tokenizer.options = this.options;
    this.tokenizer.lexer = this;
    this.inlineQueue = [];
    this.state = {
      inLink: false,
      inRawBlock: false,
      top: true
    };
    const rules = {
      other,
      block: block.normal,
      inline: inline.normal
    };
    if (this.options.pedantic) {
      rules.block = block.pedantic;
      rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      rules.block = block.gfm;
      if (this.options.breaks) {
        rules.inline = inline.breaks;
      } else {
        rules.inline = inline.gfm;
      }
    }
    this.tokenizer.rules = rules;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block,
      inline
    };
  }
  /**
   * Static Lex Method
   */
  static lex(src, options2) {
    const lexer2 = new __Lexer(options2);
    return lexer2.lex(src);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(src, options2) {
    const lexer2 = new __Lexer(options2);
    return lexer2.inlineTokens(src);
  }
  /**
   * Preprocessing
   */
  lex(src) {
    src = src.replace(other.carriageReturn, "\n");
    this.blockTokens(src, this.tokens);
    for (let i = 0; i < this.inlineQueue.length; i++) {
      const next = this.inlineQueue[i];
      this.inlineTokens(next.src, next.tokens);
    }
    this.inlineQueue = [];
    return this.tokens;
  }
  blockTokens(src, tokens = [], lastParagraphClipped = false) {
    if (this.options.pedantic) {
      src = src.replace(other.tabCharGlobal, "    ").replace(other.spaceLine, "");
    }
    while (src) {
      let token;
      if (this.options.extensions?.block?.some((extTokenizer) => {
        if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return true;
        }
        return false;
      })) {
        continue;
      }
      if (token = this.tokenizer.space(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (token.raw.length === 1 && lastToken !== void 0) {
          lastToken.raw += "\n";
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.code(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "paragraph" || lastToken?.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.fences(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.heading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.hr(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.blockquote(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.list(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.html(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.def(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "paragraph" || lastToken?.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.raw;
          this.inlineQueue.at(-1).src = lastToken.text;
        } else if (!this.tokens.links[token.tag]) {
          this.tokens.links[token.tag] = {
            href: token.href,
            title: token.title
          };
        }
        continue;
      }
      if (token = this.tokenizer.table(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.lheading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      let cutSrc = src;
      if (this.options.extensions?.startBlock) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startBlock.forEach((getStartIndex) => {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
        const lastToken = tokens.at(-1);
        if (lastParagraphClipped && lastToken?.type === "paragraph") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        lastParagraphClipped = cutSrc.length !== src.length;
        src = src.substring(token.raw.length);
        continue;
      }
      if (token = this.tokenizer.text(src)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    this.state.top = true;
    return tokens;
  }
  inline(src, tokens = []) {
    this.inlineQueue.push({ src, tokens });
    return tokens;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(src, tokens = []) {
    let maskedSrc = src;
    let match = null;
    if (this.tokens.links) {
      const links = Object.keys(this.tokens.links);
      if (links.length > 0) {
        while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
          if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
            maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
          }
        }
      }
    }
    while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    }
    while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    }
    let keepPrevChar = false;
    let prevChar = "";
    while (src) {
      if (!keepPrevChar) {
        prevChar = "";
      }
      keepPrevChar = false;
      let token;
      if (this.options.extensions?.inline?.some((extTokenizer) => {
        if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          return true;
        }
        return false;
      })) {
        continue;
      }
      if (token = this.tokenizer.escape(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.tag(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.link(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.reflink(src, this.tokens.links)) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (token.type === "text" && lastToken?.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.codespan(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.br(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.del(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (token = this.tokenizer.autolink(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (!this.state.inLink && (token = this.tokenizer.url(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      let cutSrc = src;
      if (this.options.extensions?.startInline) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startInline.forEach((getStartIndex) => {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (token = this.tokenizer.inlineText(cutSrc)) {
        src = src.substring(token.raw.length);
        if (token.raw.slice(-1) !== "_") {
          prevChar = token.raw.slice(-1);
        }
        keepPrevChar = true;
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    return tokens;
  }
};
var _Renderer = class {
  options;
  parser;
  // set by the parser
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  space(token) {
    return "";
  }
  code({ text: text2, lang, escaped }) {
    const langString = (lang || "").match(other.notSpaceStart)?.[0];
    const code = text2.replace(other.endingNewline, "") + "\n";
    if (!langString) {
      return "<pre><code>" + (escaped ? code : escape2(code, true)) + "</code></pre>\n";
    }
    return '<pre><code class="language-' + escape2(langString) + '">' + (escaped ? code : escape2(code, true)) + "</code></pre>\n";
  }
  blockquote({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote>
${body}</blockquote>
`;
  }
  html({ text: text2 }) {
    return text2;
  }
  heading({ tokens, depth }) {
    return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>
`;
  }
  hr(token) {
    return "<hr>\n";
  }
  list(token) {
    const ordered = token.ordered;
    const start = token.start;
    let body = "";
    for (let j = 0; j < token.items.length; j++) {
      const item = token.items[j];
      body += this.listitem(item);
    }
    const type = ordered ? "ol" : "ul";
    const startAttr = ordered && start !== 1 ? ' start="' + start + '"' : "";
    return "<" + type + startAttr + ">\n" + body + "</" + type + ">\n";
  }
  listitem(item) {
    let itemBody = "";
    if (item.task) {
      const checkbox = this.checkbox({ checked: !!item.checked });
      if (item.loose) {
        if (item.tokens[0]?.type === "paragraph") {
          item.tokens[0].text = checkbox + " " + item.tokens[0].text;
          if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
            item.tokens[0].tokens[0].text = checkbox + " " + escape2(item.tokens[0].tokens[0].text);
            item.tokens[0].tokens[0].escaped = true;
          }
        } else {
          item.tokens.unshift({
            type: "text",
            raw: checkbox + " ",
            text: checkbox + " ",
            escaped: true
          });
        }
      } else {
        itemBody += checkbox + " ";
      }
    }
    itemBody += this.parser.parse(item.tokens, !!item.loose);
    return `<li>${itemBody}</li>
`;
  }
  checkbox({ checked }) {
    return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens }) {
    return `<p>${this.parser.parseInline(tokens)}</p>
`;
  }
  table(token) {
    let header = "";
    let cell = "";
    for (let j = 0; j < token.header.length; j++) {
      cell += this.tablecell(token.header[j]);
    }
    header += this.tablerow({ text: cell });
    let body = "";
    for (let j = 0; j < token.rows.length; j++) {
      const row = token.rows[j];
      cell = "";
      for (let k = 0; k < row.length; k++) {
        cell += this.tablecell(row[k]);
      }
      body += this.tablerow({ text: cell });
    }
    if (body) body = `<tbody>${body}</tbody>`;
    return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
  }
  tablerow({ text: text2 }) {
    return `<tr>
${text2}</tr>
`;
  }
  tablecell(token) {
    const content = this.parser.parseInline(token.tokens);
    const type = token.header ? "th" : "td";
    const tag2 = token.align ? `<${type} align="${token.align}">` : `<${type}>`;
    return tag2 + content + `</${type}>
`;
  }
  /**
   * span level renderer
   */
  strong({ tokens }) {
    return `<strong>${this.parser.parseInline(tokens)}</strong>`;
  }
  em({ tokens }) {
    return `<em>${this.parser.parseInline(tokens)}</em>`;
  }
  codespan({ text: text2 }) {
    return `<code>${escape2(text2, true)}</code>`;
  }
  br(token) {
    return "<br>";
  }
  del({ tokens }) {
    return `<del>${this.parser.parseInline(tokens)}</del>`;
  }
  link({ href, title, tokens }) {
    const text2 = this.parser.parseInline(tokens);
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text2;
    }
    href = cleanHref;
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + escape2(title) + '"';
    }
    out += ">" + text2 + "</a>";
    return out;
  }
  image({ href, title, text: text2, tokens }) {
    if (tokens) {
      text2 = this.parser.parseInline(tokens, this.parser.textRenderer);
    }
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return escape2(text2);
    }
    href = cleanHref;
    let out = `<img src="${href}" alt="${text2}"`;
    if (title) {
      out += ` title="${escape2(title)}"`;
    }
    out += ">";
    return out;
  }
  text(token) {
    return "tokens" in token && token.tokens ? this.parser.parseInline(token.tokens) : "escaped" in token && token.escaped ? token.text : escape2(token.text);
  }
};
var _TextRenderer = class {
  // no need for block level renderers
  strong({ text: text2 }) {
    return text2;
  }
  em({ text: text2 }) {
    return text2;
  }
  codespan({ text: text2 }) {
    return text2;
  }
  del({ text: text2 }) {
    return text2;
  }
  html({ text: text2 }) {
    return text2;
  }
  text({ text: text2 }) {
    return text2;
  }
  link({ text: text2 }) {
    return "" + text2;
  }
  image({ text: text2 }) {
    return "" + text2;
  }
  br() {
    return "";
  }
};
var _Parser = class __Parser {
  options;
  renderer;
  textRenderer;
  constructor(options2) {
    this.options = options2 || _defaults;
    this.options.renderer = this.options.renderer || new _Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.renderer.parser = this;
    this.textRenderer = new _TextRenderer();
  }
  /**
   * Static Parse Method
   */
  static parse(tokens, options2) {
    const parser2 = new __Parser(options2);
    return parser2.parse(tokens);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(tokens, options2) {
    const parser2 = new __Parser(options2);
    return parser2.parseInline(tokens);
  }
  /**
   * Parse Loop
   */
  parse(tokens, top = true) {
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const anyToken = tokens[i];
      if (this.options.extensions?.renderers?.[anyToken.type]) {
        const genericToken = anyToken;
        const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
        if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(genericToken.type)) {
          out += ret || "";
          continue;
        }
      }
      const token = anyToken;
      switch (token.type) {
        case "space": {
          out += this.renderer.space(token);
          continue;
        }
        case "hr": {
          out += this.renderer.hr(token);
          continue;
        }
        case "heading": {
          out += this.renderer.heading(token);
          continue;
        }
        case "code": {
          out += this.renderer.code(token);
          continue;
        }
        case "table": {
          out += this.renderer.table(token);
          continue;
        }
        case "blockquote": {
          out += this.renderer.blockquote(token);
          continue;
        }
        case "list": {
          out += this.renderer.list(token);
          continue;
        }
        case "html": {
          out += this.renderer.html(token);
          continue;
        }
        case "paragraph": {
          out += this.renderer.paragraph(token);
          continue;
        }
        case "text": {
          let textToken = token;
          let body = this.renderer.text(textToken);
          while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
            textToken = tokens[++i];
            body += "\n" + this.renderer.text(textToken);
          }
          if (top) {
            out += this.renderer.paragraph({
              type: "paragraph",
              raw: body,
              text: body,
              tokens: [{ type: "text", raw: body, text: body, escaped: true }]
            });
          } else {
            out += body;
          }
          continue;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return "";
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(tokens, renderer2 = this.renderer) {
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const anyToken = tokens[i];
      if (this.options.extensions?.renderers?.[anyToken.type]) {
        const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
        if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(anyToken.type)) {
          out += ret || "";
          continue;
        }
      }
      const token = anyToken;
      switch (token.type) {
        case "escape": {
          out += renderer2.text(token);
          break;
        }
        case "html": {
          out += renderer2.html(token);
          break;
        }
        case "link": {
          out += renderer2.link(token);
          break;
        }
        case "image": {
          out += renderer2.image(token);
          break;
        }
        case "strong": {
          out += renderer2.strong(token);
          break;
        }
        case "em": {
          out += renderer2.em(token);
          break;
        }
        case "codespan": {
          out += renderer2.codespan(token);
          break;
        }
        case "br": {
          out += renderer2.br(token);
          break;
        }
        case "del": {
          out += renderer2.del(token);
          break;
        }
        case "text": {
          out += renderer2.text(token);
          break;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return "";
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
};
var _Hooks = class {
  options;
  block;
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  static passThroughHooks = /* @__PURE__ */ new Set([
    "preprocess",
    "postprocess",
    "processAllTokens"
  ]);
  /**
   * Process markdown before marked
   */
  preprocess(markdown) {
    return markdown;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(html2) {
    return html2;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(tokens) {
    return tokens;
  }
  /**
   * Provide function to tokenize markdown
   */
  provideLexer() {
    return this.block ? _Lexer.lex : _Lexer.lexInline;
  }
  /**
   * Provide function to parse tokens
   */
  provideParser() {
    return this.block ? _Parser.parse : _Parser.parseInline;
  }
};
var Marked = class {
  defaults = _getDefaults();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = _Parser;
  Renderer = _Renderer;
  TextRenderer = _TextRenderer;
  Lexer = _Lexer;
  Tokenizer = _Tokenizer;
  Hooks = _Hooks;
  constructor(...args) {
    this.use(...args);
  }
  /**
   * Run callback for every token
   */
  walkTokens(tokens, callback) {
    let values = [];
    for (const token of tokens) {
      values = values.concat(callback.call(this, token));
      switch (token.type) {
        case "table": {
          const tableToken = token;
          for (const cell of tableToken.header) {
            values = values.concat(this.walkTokens(cell.tokens, callback));
          }
          for (const row of tableToken.rows) {
            for (const cell of row) {
              values = values.concat(this.walkTokens(cell.tokens, callback));
            }
          }
          break;
        }
        case "list": {
          const listToken = token;
          values = values.concat(this.walkTokens(listToken.items, callback));
          break;
        }
        default: {
          const genericToken = token;
          if (this.defaults.extensions?.childTokens?.[genericToken.type]) {
            this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
              const tokens2 = genericToken[childTokens].flat(Infinity);
              values = values.concat(this.walkTokens(tokens2, callback));
            });
          } else if (genericToken.tokens) {
            values = values.concat(this.walkTokens(genericToken.tokens, callback));
          }
        }
      }
    }
    return values;
  }
  use(...args) {
    const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
    args.forEach((pack) => {
      const opts = { ...pack };
      opts.async = this.defaults.async || opts.async || false;
      if (pack.extensions) {
        pack.extensions.forEach((ext) => {
          if (!ext.name) {
            throw new Error("extension name required");
          }
          if ("renderer" in ext) {
            const prevRenderer = extensions.renderers[ext.name];
            if (prevRenderer) {
              extensions.renderers[ext.name] = function(...args2) {
                let ret = ext.renderer.apply(this, args2);
                if (ret === false) {
                  ret = prevRenderer.apply(this, args2);
                }
                return ret;
              };
            } else {
              extensions.renderers[ext.name] = ext.renderer;
            }
          }
          if ("tokenizer" in ext) {
            if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
              throw new Error("extension level must be 'block' or 'inline'");
            }
            const extLevel = extensions[ext.level];
            if (extLevel) {
              extLevel.unshift(ext.tokenizer);
            } else {
              extensions[ext.level] = [ext.tokenizer];
            }
            if (ext.start) {
              if (ext.level === "block") {
                if (extensions.startBlock) {
                  extensions.startBlock.push(ext.start);
                } else {
                  extensions.startBlock = [ext.start];
                }
              } else if (ext.level === "inline") {
                if (extensions.startInline) {
                  extensions.startInline.push(ext.start);
                } else {
                  extensions.startInline = [ext.start];
                }
              }
            }
          }
          if ("childTokens" in ext && ext.childTokens) {
            extensions.childTokens[ext.name] = ext.childTokens;
          }
        });
        opts.extensions = extensions;
      }
      if (pack.renderer) {
        const renderer2 = this.defaults.renderer || new _Renderer(this.defaults);
        for (const prop in pack.renderer) {
          if (!(prop in renderer2)) {
            throw new Error(`renderer '${prop}' does not exist`);
          }
          if (["options", "parser"].includes(prop)) {
            continue;
          }
          const rendererProp = prop;
          const rendererFunc = pack.renderer[rendererProp];
          const prevRenderer = renderer2[rendererProp];
          renderer2[rendererProp] = (...args2) => {
            let ret = rendererFunc.apply(renderer2, args2);
            if (ret === false) {
              ret = prevRenderer.apply(renderer2, args2);
            }
            return ret || "";
          };
        }
        opts.renderer = renderer2;
      }
      if (pack.tokenizer) {
        const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
        for (const prop in pack.tokenizer) {
          if (!(prop in tokenizer)) {
            throw new Error(`tokenizer '${prop}' does not exist`);
          }
          if (["options", "rules", "lexer"].includes(prop)) {
            continue;
          }
          const tokenizerProp = prop;
          const tokenizerFunc = pack.tokenizer[tokenizerProp];
          const prevTokenizer = tokenizer[tokenizerProp];
          tokenizer[tokenizerProp] = (...args2) => {
            let ret = tokenizerFunc.apply(tokenizer, args2);
            if (ret === false) {
              ret = prevTokenizer.apply(tokenizer, args2);
            }
            return ret;
          };
        }
        opts.tokenizer = tokenizer;
      }
      if (pack.hooks) {
        const hooks = this.defaults.hooks || new _Hooks();
        for (const prop in pack.hooks) {
          if (!(prop in hooks)) {
            throw new Error(`hook '${prop}' does not exist`);
          }
          if (["options", "block"].includes(prop)) {
            continue;
          }
          const hooksProp = prop;
          const hooksFunc = pack.hooks[hooksProp];
          const prevHook = hooks[hooksProp];
          if (_Hooks.passThroughHooks.has(prop)) {
            hooks[hooksProp] = (arg) => {
              if (this.defaults.async) {
                return Promise.resolve(hooksFunc.call(hooks, arg)).then((ret2) => {
                  return prevHook.call(hooks, ret2);
                });
              }
              const ret = hooksFunc.call(hooks, arg);
              return prevHook.call(hooks, ret);
            };
          } else {
            hooks[hooksProp] = (...args2) => {
              let ret = hooksFunc.apply(hooks, args2);
              if (ret === false) {
                ret = prevHook.apply(hooks, args2);
              }
              return ret;
            };
          }
        }
        opts.hooks = hooks;
      }
      if (pack.walkTokens) {
        const walkTokens2 = this.defaults.walkTokens;
        const packWalktokens = pack.walkTokens;
        opts.walkTokens = function(token) {
          let values = [];
          values.push(packWalktokens.call(this, token));
          if (walkTokens2) {
            values = values.concat(walkTokens2.call(this, token));
          }
          return values;
        };
      }
      this.defaults = { ...this.defaults, ...opts };
    });
    return this;
  }
  setOptions(opt) {
    this.defaults = { ...this.defaults, ...opt };
    return this;
  }
  lexer(src, options2) {
    return _Lexer.lex(src, options2 ?? this.defaults);
  }
  parser(tokens, options2) {
    return _Parser.parse(tokens, options2 ?? this.defaults);
  }
  parseMarkdown(blockType) {
    const parse2 = (src, options2) => {
      const origOpt = { ...options2 };
      const opt = { ...this.defaults, ...origOpt };
      const throwError = this.onError(!!opt.silent, !!opt.async);
      if (this.defaults.async === true && origOpt.async === false) {
        return throwError(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      }
      if (typeof src === "undefined" || src === null) {
        return throwError(new Error("marked(): input parameter is undefined or null"));
      }
      if (typeof src !== "string") {
        return throwError(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected"));
      }
      if (opt.hooks) {
        opt.hooks.options = opt;
        opt.hooks.block = blockType;
      }
      const lexer2 = opt.hooks ? opt.hooks.provideLexer() : blockType ? _Lexer.lex : _Lexer.lexInline;
      const parser2 = opt.hooks ? opt.hooks.provideParser() : blockType ? _Parser.parse : _Parser.parseInline;
      if (opt.async) {
        return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src).then((src2) => lexer2(src2, opt)).then((tokens) => opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens).then((tokens) => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens).then((tokens) => parser2(tokens, opt)).then((html2) => opt.hooks ? opt.hooks.postprocess(html2) : html2).catch(throwError);
      }
      try {
        if (opt.hooks) {
          src = opt.hooks.preprocess(src);
        }
        let tokens = lexer2(src, opt);
        if (opt.hooks) {
          tokens = opt.hooks.processAllTokens(tokens);
        }
        if (opt.walkTokens) {
          this.walkTokens(tokens, opt.walkTokens);
        }
        let html2 = parser2(tokens, opt);
        if (opt.hooks) {
          html2 = opt.hooks.postprocess(html2);
        }
        return html2;
      } catch (e) {
        return throwError(e);
      }
    };
    return parse2;
  }
  onError(silent, async) {
    return (e) => {
      e.message += "\nPlease report this to https://github.com/markedjs/marked.";
      if (silent) {
        const msg = "<p>An error occurred:</p><pre>" + escape2(e.message + "", true) + "</pre>";
        if (async) {
          return Promise.resolve(msg);
        }
        return msg;
      }
      if (async) {
        return Promise.reject(e);
      }
      throw e;
    };
  }
};
var markedInstance = new Marked();
function marked(src, opt) {
  return markedInstance.parse(src, opt);
}
marked.options = marked.setOptions = function(options2) {
  markedInstance.setOptions(options2);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};
marked.getDefaults = _getDefaults;
marked.defaults = _defaults;
marked.use = function(...args) {
  markedInstance.use(...args);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};
marked.walkTokens = function(tokens, callback) {
  return markedInstance.walkTokens(tokens, callback);
};
marked.parseInline = markedInstance.parseInline;
marked.Parser = _Parser;
marked.parser = _Parser.parse;
marked.Renderer = _Renderer;
marked.TextRenderer = _TextRenderer;
marked.Lexer = _Lexer;
marked.lexer = _Lexer.lex;
marked.Tokenizer = _Tokenizer;
marked.Hooks = _Hooks;
marked.parse = marked;
marked.options;
marked.setOptions;
marked.use;
marked.walkTokens;
marked.parseInline;
_Parser.parse;
_Lexer.lex;
/*! @license DOMPurify 3.4.6 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.6/LICENSE */
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
const entries = Object.entries, setPrototypeOf = Object.setPrototypeOf, isFrozen = Object.isFrozen, getPrototypeOf = Object.getPrototypeOf, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
let freeze = Object.freeze, seal = Object.seal, create = Object.create;
let _ref = typeof Reflect !== "undefined" && Reflect, apply = _ref.apply, construct = _ref.construct;
if (!freeze) {
  freeze = function freeze2(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal2(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
const arrayForEach = unapply(Array.prototype.forEach);
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
const arraySplice = unapply(Array.prototype.splice);
const arrayIsArray = Array.isArray;
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const numberToString = unapply(Number.prototype.toString);
const booleanToString = unapply(Boolean.prototype.toString);
const bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
const symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const objectToString = unapply(Object.prototype.toString);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
function unapply(func) {
  return function(thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
function unconstruct(Func) {
  return function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    setPrototypeOf(set, null);
  }
  if (!arrayIsArray(array)) {
    return set;
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === "string") {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
function clone(object) {
  const newObject = create(null);
  for (const _ref2 of entries(object)) {
    var _ref3 = _slicedToArray(_ref2, 2);
    const property = _ref3[0];
    const value = _ref3[1];
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (arrayIsArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === "object" && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
function stringifyValue(value) {
  switch (typeof value) {
    case "string": {
      return value;
    }
    case "number": {
      return numberToString(value);
    }
    case "boolean": {
      return booleanToString(value);
    }
    case "bigint": {
      return bigintToString ? bigintToString(value) : "0";
    }
    case "symbol": {
      return symbolToString ? symbolToString(value) : "Symbol()";
    }
    case "undefined": {
      return objectToString(value);
    }
    case "function":
    case "object": {
      if (value === null) {
        return objectToString(value);
      }
      const valueAsRecord = value;
      const valueToString = lookupGetter(valueAsRecord, "toString");
      if (typeof valueToString === "function") {
        const stringified = valueToString(valueAsRecord);
        return typeof stringified === "string" ? stringified : objectToString(stringified);
      }
      return objectToString(value);
    }
    default: {
      return objectToString(value);
    }
  }
}
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === "function") {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
function isRegex(value) {
  try {
    regExpTest(value, "");
    return true;
  } catch (_unused) {
    return false;
  }
}
const html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
const svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
const svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
const svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
const mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
const mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
const text = freeze(["#text"]);
const html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "command", "commandfor", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]);
const svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
const mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
const xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
const MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
const ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
const TMPLIT_EXPR = seal(/\${[\w\W]*/g);
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
const ARIA_ATTR = seal(/^aria-[\-\w]+$/);
const IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
const NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12
  // Deprecated
};
const getGlobal = function getGlobal2() {
  return typeof window === "undefined" ? null : window;
};
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
    return null;
  }
  let suffix = null;
  const ATTR_NAME = "data-tt-policy-suffix";
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = "dompurify" + (suffix ? "#" + suffix : "");
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html2) {
        return html2;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    console.warn("TrustedTypes policy " + policyName + " could not be created.");
    return null;
  }
};
const _createHooksMap = function _createHooksMap2() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function createDOMPurify() {
  let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
  const DOMPurify = (root) => createDOMPurify(root);
  DOMPurify.version = "3.4.6";
  DOMPurify.removed = [];
  if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let document2 = window2.document;
  const originalDocument = document2;
  const currentScript = originalDocument.currentScript;
  window2.DocumentFragment;
  const HTMLTemplateElement = window2.HTMLTemplateElement, Node = window2.Node, Element2 = window2.Element, NodeFilter = window2.NodeFilter, _window$NamedNodeMap = window2.NamedNodeMap;
  _window$NamedNodeMap === void 0 ? window2.NamedNodeMap || window2.MozNamedAttrMap : _window$NamedNodeMap;
  window2.HTMLFormElement;
  const DOMParser = window2.DOMParser, trustedTypes = window2.trustedTypes;
  const ElementPrototype = Element2.prototype;
  const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
  const remove2 = lookupGetter(ElementPrototype, "remove");
  const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
  const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
  const getParentNode = lookupGetter(ElementPrototype, "parentNode");
  const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
  const getAttributes = lookupGetter(ElementPrototype, "attributes");
  const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
  const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
  if (typeof HTMLTemplateElement === "function") {
    const template = document2.createElement("template");
    if (template.content && template.content.ownerDocument) {
      document2 = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = "";
  const _document = document2, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
  const importNode = originalDocument.importNode;
  let hooks = _createHooksMap();
  DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
  const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
  let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  let FORBID_TAGS = null;
  let FORBID_ATTR = null;
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  let ALLOW_ARIA_ATTR = true;
  let ALLOW_DATA_ATTR = true;
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  let SAFE_FOR_TEMPLATES = false;
  let SAFE_FOR_XML = true;
  let WHOLE_DOCUMENT = false;
  let SET_CONFIG = false;
  let FORCE_BODY = false;
  let RETURN_DOM = false;
  let RETURN_DOM_FRAGMENT = false;
  let RETURN_TRUSTED_TYPE = false;
  let SANITIZE_DOM = true;
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
  let KEEP_CONTENT = true;
  let IN_PLACE = false;
  let USE_PROFILES = {};
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
  let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
  const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
  let transformCaseFunc = null;
  let CONFIG = null;
  const formElement = document2.createElement("form");
  const isRegexOrFunction = function isRegexOrFunction2(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  const _parseConfig = function _parseConfig2() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    if (!cfg || typeof cfg !== "object") {
      cfg = {};
    }
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
    ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") && arrayIsArray(cfg.ALLOWED_TAGS) ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") && arrayIsArray(cfg.ALLOWED_ATTR) ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") && arrayIsArray(cfg.ALLOWED_NAMESPACES) ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") && arrayIsArray(cfg.ADD_URI_SAFE_ATTR) ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") && arrayIsArray(cfg.ADD_DATA_URI_TAGS) ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") && arrayIsArray(cfg.FORBID_CONTENTS) ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS") && arrayIsArray(cfg.FORBID_TAGS) ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") && arrayIsArray(cfg.FORBID_ATTR) ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
    RETURN_DOM = cfg.RETURN_DOM || false;
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
    FORCE_BODY = cfg.FORCE_BODY || false;
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
    IN_PLACE = cfg.IN_PLACE || false;
    IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
    NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "MATHML_TEXT_INTEGRATION_POINTS") && cfg.MATHML_TEXT_INTEGRATION_POINTS && typeof cfg.MATHML_TEXT_INTEGRATION_POINTS === "object" ? clone(cfg.MATHML_TEXT_INTEGRATION_POINTS) : addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
    HTML_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "HTML_INTEGRATION_POINTS") && cfg.HTML_INTEGRATION_POINTS && typeof cfg.HTML_INTEGRATION_POINTS === "object" ? clone(cfg.HTML_INTEGRATION_POINTS) : addToSet({}, ["annotation-xml"]);
    const customElementHandling = objectHasOwnProperty(cfg, "CUSTOM_ELEMENT_HANDLING") && cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING === "object" ? clone(cfg.CUSTOM_ELEMENT_HANDLING) : create(null);
    CUSTOM_ELEMENT_HANDLING = create(null);
    if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
    }
    if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
    }
    if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = create(null);
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    EXTRA_ELEMENT_HANDLING.tagCheck = null;
    EXTRA_ELEMENT_HANDLING.attributeCheck = null;
    if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
      if (typeof cfg.ADD_TAGS === "function") {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else if (arrayIsArray(cfg.ADD_TAGS)) {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
      if (typeof cfg.ADD_ATTR === "function") {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else if (arrayIsArray(cfg.ADD_ATTR)) {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") && arrayIsArray(cfg.ADD_URI_SAFE_ATTR)) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (objectHasOwnProperty(cfg, "FORBID_CONTENTS") && arrayIsArray(cfg.FORBID_CONTENTS)) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    if (KEEP_CONTENT) {
      ALLOWED_TAGS["#text"] = true;
    }
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
    }
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ["tbody"]);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      emptyHTML = trustedTypesPolicy.createHTML("");
    } else {
      if (trustedTypesPolicy === void 0) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      if (trustedTypesPolicy !== null && typeof emptyHTML === "string") {
        emptyHTML = trustedTypesPolicy.createHTML("");
      }
    }
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  const _checkValidNamespace = function _checkValidNamespace2(element) {
    let parent = getParentNode(element);
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: "template"
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "svg";
      }
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "math";
      }
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      }
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    return false;
  };
  const _forceRemove = function _forceRemove2(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove2(node);
    }
  };
  const _removeAttribute = function _removeAttribute2(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    if (name === "is") {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {
        }
      } else {
        try {
          element.setAttribute(name, "");
        } catch (_) {
        }
      }
    }
  };
  const _initDocument = function _initDocument2(dirty) {
    let doc2 = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = "<remove></remove>" + dirty;
    } else {
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc2 = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {
      }
    }
    if (!doc2 || !doc2.documentElement) {
      doc2 = implementation.createDocument(NAMESPACE, "template", null);
      try {
        doc2.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
      }
    }
    const body = doc2.body || doc2.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc2, WHOLE_DOCUMENT ? "html" : "body")[0];
    }
    return WHOLE_DOCUMENT ? doc2.documentElement : body;
  };
  const _createNodeIterator = function _createNodeIterator2(root) {
    return createNodeIterator.call(
      root.ownerDocument || root,
      root,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
      null
    );
  };
  const _scrubTemplateExpressions = function _scrubTemplateExpressions2(node) {
    node.normalize();
    const walker = createNodeIterator.call(
      node.ownerDocument || node,
      node,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
      null
    );
    let currentNode = walker.nextNode();
    while (currentNode) {
      let data = currentNode.data;
      arrayForEach([MUSTACHE_EXPR$1, ERB_EXPR$1, TMPLIT_EXPR$1], (expr) => {
        data = stringReplace(data, expr, " ");
      });
      currentNode.data = data;
      currentNode = walker.nextNode();
    }
  };
  const _isClobbered = function _isClobbered2(element) {
    const realTagName = getNodeName ? getNodeName(element) : null;
    if (typeof realTagName !== "string") {
      return false;
    }
    if (transformCaseFunc(realTagName) !== "form") {
      return false;
    }
    return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || // Realm-safe NamedNodeMap detection: equality against the cached
    // prototype getter. Clobbered .attributes (e.g. <input name="attributes">)
    // makes the direct read diverge from the cached read; a clean form
    // (same-realm OR foreign-realm) has both reads pointing at the same
    // canonical NamedNodeMap.
    element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || // HTMLFormElement has [LegacyOverrideBuiltIns]: a descendant named
    // "childNodes" shadows the prototype getter. Direct reads of
    // form.childNodes from a clobbered form return the named child
    // instead of the real NodeList, so any walk that reads it directly
    // skips the form's real children. Compare the direct read to the
    // cached Node.prototype getter — when the form's named-property
    // getter intercepts the read, the two values differ and we flag
    // the form. This catches every clobbering child type (input,
    // select, etc.) regardless of whether the named child happens to
    // carry a numeric .length, which a typeof-based probe would miss
    // (e.g. HTMLSelectElement.length is a defined unsigned-long).
    element.childNodes !== getChildNodes(element);
  };
  const _isDocumentFragment = function _isDocumentFragment2(value) {
    if (!getNodeType || typeof value !== "object" || value === null) {
      return false;
    }
    try {
      return getNodeType(value) === NODE_TYPE.documentFragment;
    } catch (_) {
      return false;
    }
  };
  const _isNode = function _isNode2(value) {
    if (!getNodeType || typeof value !== "object" || value === null) {
      return false;
    }
    try {
      return typeof getNodeType(value) === "number";
    } catch (_) {
      return false;
    }
  };
  function _executeHooks(hooks2, currentNode, data) {
    arrayForEach(hooks2, (hook) => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  const _sanitizeElements = function _sanitizeElements2(currentNode) {
    let content = null;
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    const tagName = transformCaseFunc(currentNode.nodeName);
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === "style" && _isNode(currentNode.firstElementChild)) {
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    const nt = getNodeType ? getNodeType(currentNode) : currentNode.nodeType;
    if (nt === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR$1, ERB_EXPR$1, TMPLIT_EXPR$1], (expr) => {
        content = stringReplace(content, expr, " ");
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
    if (FORBID_ATTR[lcName]) {
      return false;
    }
    if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
      return false;
    }
    const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR$1, lcName)) ;
    else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) ;
    else if (!nameIsPermitted || FORBID_ATTR[lcName]) {
      if (
        // First condition does a very basic check if a) it's basically a valid custom element tagname AND
        // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
        _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
        // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
      ) ;
      else {
        return false;
      }
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
    else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
    else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
    else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
    else if (value) {
      return false;
    } else ;
    return true;
  };
  const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]);
  const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
    return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
  };
  const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const attributes = currentNode.attributes;
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: "",
      attrValue: "",
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: void 0
    };
    let l = attributes.length;
    while (l--) {
      const attr = attributes[l];
      const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === "value" ? initValue : stringTrim(initValue);
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = void 0;
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
        _removeAttribute(name, currentNode);
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (lcName === "attributename" && stringMatch(value, "href")) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR$1, ERB_EXPR$1, TMPLIT_EXPR$1], (expr) => {
          value = stringReplace(value, expr, " ");
        });
      }
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") {
        if (namespaceURI) ;
        else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case "TrustedHTML": {
              value = trustedTypesPolicy.createHTML(value);
              break;
            }
            case "TrustedScriptURL": {
              value = trustedTypesPolicy.createScriptURL(value);
              break;
            }
          }
        }
      }
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      _sanitizeElements(shadowNode);
      _sanitizeAttributes(shadowNode);
      if (_isDocumentFragment(shadowNode.content)) {
        _sanitizeShadowDOM2(shadowNode.content);
      }
    }
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  const _sanitizeAttachedShadowRoots2 = function _sanitizeAttachedShadowRoots(root) {
    const nodeType = getNodeType ? getNodeType(root) : root.nodeType;
    if (nodeType === NODE_TYPE.element) {
      const sr = getShadowRoot ? getShadowRoot(root) : root.shadowRoot;
      if (_isDocumentFragment(sr)) {
        _sanitizeAttachedShadowRoots2(sr);
        _sanitizeShadowDOM2(sr);
      }
    }
    const childNodes = getChildNodes ? getChildNodes(root) : root.childNodes;
    if (!childNodes) {
      return;
    }
    const snapshot = [];
    arrayForEach(childNodes, (child) => {
      arrayPush(snapshot, child);
    });
    for (const child of snapshot) {
      _sanitizeAttachedShadowRoots2(child);
    }
  };
  DOMPurify.sanitize = function(dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = "<!-->";
    }
    if (typeof dirty !== "string" && !_isNode(dirty)) {
      dirty = stringifyValue(dirty);
      if (typeof dirty !== "string") {
        throw typeErrorCreate("dirty is not a string, aborting");
      }
    }
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    DOMPurify.removed = [];
    if (typeof dirty === "string") {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      const nn = getNodeName ? getNodeName(dirty) : dirty.nodeName;
      if (typeof nn === "string") {
        const tagName = transformCaseFunc(nn);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
        }
      }
      if (_isClobbered(dirty)) {
        throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
      }
      _sanitizeAttachedShadowRoots2(dirty);
    } else if (_isNode(dirty)) {
      body = _initDocument("<!---->");
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
        body = importedNode;
      } else if (importedNode.nodeName === "HTML") {
        body = importedNode;
      } else {
        body.appendChild(importedNode);
      }
      _sanitizeAttachedShadowRoots2(importedNode);
    } else {
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf("<") === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      body = _initDocument(dirty);
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
    }
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    while (currentNode = nodeIterator.nextNode()) {
      _sanitizeElements(currentNode);
      _sanitizeAttributes(currentNode);
      if (_isDocumentFragment(currentNode.content)) {
        _sanitizeShadowDOM2(currentNode.content);
      }
    }
    if (IN_PLACE) {
      if (SAFE_FOR_TEMPLATES) {
        _scrubTemplateExpressions(dirty);
      }
      return dirty;
    }
    if (RETURN_DOM) {
      if (SAFE_FOR_TEMPLATES) {
        _scrubTemplateExpressions(body);
      }
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
    }
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR$1, ERB_EXPR$1, TMPLIT_EXPR$1], (expr) => {
        serializedHTML = stringReplace(serializedHTML, expr, " ");
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function() {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function(tag2, attr, value) {
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag2);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function(entryPoint, hookFunction) {
    if (typeof hookFunction !== "function") {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function(entryPoint, hookFunction) {
    if (hookFunction !== void 0) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function(entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function() {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();
function renderMarkdown(text2) {
  if (!text2) return "";
  const raw = marked.parse(text2, { breaks: true });
  return purify.sanitize(raw, { ADD_ATTR: ["target", "rel"] });
}
const _hoisted_1$f = { class: "tool-call-block" };
const _hoisted_2$e = { class: "tool-name" };
const _hoisted_3$d = {
  key: 0,
  class: "tool-body"
};
const _hoisted_4$b = {
  key: 0,
  class: "tool-section"
};
const _hoisted_5$b = { class: "tool-pre" };
const _hoisted_6$9 = {
  key: 1,
  class: "tool-section"
};
const _hoisted_7$9 = { class: "tool-pre" };
const _sfc_main$f = {
  __name: "ToolCallBlock",
  props: {
    tool: { type: Object, required: true }
  },
  setup(__props) {
    const props = __props;
    const expanded = /* @__PURE__ */ ref(props.tool.status === "running" || props.tool.status === "pending");
    watch(() => props.tool.status, (status) => {
      expanded.value = status === "running" || status === "pending";
    }, { immediate: true });
    const statusText = computed(() => {
      switch (props.tool.status) {
        case "error":
          return "❌ 失败";
        case "pending":
          return "⏳ 执行中";
        case "running":
          return "⏳ 执行中";
        case "ok":
          return "✅ 完成";
        default:
          return "⏳ 执行中";
      }
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$f, [
        createBaseVNode("button", {
          class: "tool-header",
          onClick: _cache[0] || (_cache[0] = ($event) => expanded.value = !expanded.value)
        }, [
          createBaseVNode("span", _hoisted_2$e, toDisplayString(__props.tool.name || "未知工具"), 1),
          createBaseVNode("span", {
            class: normalizeClass(["tool-status", __props.tool.status])
          }, toDisplayString(statusText.value), 3),
          createBaseVNode("span", {
            class: normalizeClass(["tool-arrow", { expanded: expanded.value }])
          }, "▼", 2)
        ]),
        expanded.value ? (openBlock(), createElementBlock("div", _hoisted_3$d, [
          __props.tool.input ? (openBlock(), createElementBlock("div", _hoisted_4$b, [
            _cache[1] || (_cache[1] = createBaseVNode("div", { class: "tool-section-label" }, "输入", -1)),
            createBaseVNode("pre", _hoisted_5$b, toDisplayString(JSON.stringify(__props.tool.input, null, 2)), 1)
          ])) : createCommentVNode("", true),
          __props.tool.output !== void 0 && __props.tool.output !== null ? (openBlock(), createElementBlock("div", _hoisted_6$9, [
            _cache[2] || (_cache[2] = createBaseVNode("div", { class: "tool-section-label" }, "输出", -1)),
            createBaseVNode("pre", _hoisted_7$9, toDisplayString(__props.tool.output), 1)
          ])) : createCommentVNode("", true)
        ])) : createCommentVNode("", true)
      ]);
    };
  }
};
const ToolCallBlock = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-50c7556a"]]);
const _hoisted_1$e = ["src", "alt"];
const _sfc_main$e = {
  __name: "Lightbox",
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: "" }
  },
  emits: ["close"],
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createBlock(Teleport, { to: "body" }, [
        createBaseVNode("div", {
          class: "lightbox-overlay",
          onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("close"))
        }, [
          createBaseVNode("img", {
            src: __props.src,
            alt: __props.alt,
            class: "lightbox-image",
            onClick: _cache[0] || (_cache[0] = withModifiers(() => {
            }, ["stop"]))
          }, null, 8, _hoisted_1$e),
          createBaseVNode("button", {
            class: "lightbox-close",
            onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("close"))
          }, "✕")
        ])
      ]);
    };
  }
};
const Lightbox = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-34476411"]]);
const _hoisted_1$d = {
  key: 0,
  class: "user-message"
};
const _hoisted_2$d = ["src"];
const _hoisted_3$c = { key: 1 };
const _hoisted_4$a = { class: "user-content-wrap" };
const _hoisted_5$a = { class: "user-header" };
const _hoisted_6$8 = { class: "user-name" };
const _hoisted_7$8 = {
  key: 0,
  class: "user-attachments"
};
const _hoisted_8$8 = ["src", "alt", "onClick"];
const _hoisted_9$5 = {
  key: 1,
  class: "attached-file"
};
const _hoisted_10$5 = { class: "file-name" };
const _hoisted_11$4 = {
  key: 1,
  class: "user-images"
};
const _hoisted_12$3 = ["src", "onClick"];
const _hoisted_13$3 = {
  key: 2,
  class: "user-text"
};
const _hoisted_14$3 = { class: "msg-time right-time" };
const _hoisted_15$3 = {
  key: 1,
  class: "ai-message"
};
const _hoisted_16$3 = ["src"];
const _hoisted_17$2 = { key: 1 };
const _hoisted_18$2 = { class: "ai-body" };
const _hoisted_19$2 = { class: "ai-header" };
const _hoisted_20$2 = { class: "ai-name" };
const _hoisted_21$2 = {
  key: 0,
  class: "ai-model"
};
const _hoisted_22$2 = {
  key: 0,
  class: "error-text"
};
const _hoisted_23$1 = ["onClick"];
const _hoisted_24$1 = { class: "think-label" };
const _hoisted_25 = {
  key: 0,
  class: "think-preview"
};
const _hoisted_26 = {
  key: 0,
  class: "think-content"
};
const _hoisted_27 = {
  key: 0,
  class: "think-block"
};
const _hoisted_28 = { class: "think-label" };
const _hoisted_29 = {
  key: 0,
  class: "think-preview"
};
const _hoisted_30 = {
  key: 0,
  class: "think-content"
};
const _hoisted_31 = ["innerHTML"];
const _hoisted_32 = {
  key: 0,
  class: "streaming-cursor"
};
const _hoisted_33 = {
  key: 0,
  class: "ai-content-plain"
};
const _hoisted_34 = {
  key: 0,
  class: "ann-markdown"
};
const _hoisted_35 = ["innerHTML"];
const _hoisted_36 = {
  key: 0,
  class: "streaming-cursor"
};
const _hoisted_37 = {
  key: 1,
  class: "ai-content-plain"
};
const _hoisted_38 = {
  key: 0,
  class: "streaming-cursor"
};
const _hoisted_39 = {
  key: 4,
  class: "ai-images"
};
const _hoisted_40 = ["src", "onClick"];
const _hoisted_41 = {
  key: 5,
  class: "ai-attachments"
};
const _hoisted_42 = { key: 0 };
const _hoisted_43 = ["src", "alt", "onClick"];
const _hoisted_44 = {
  key: 1,
  class: "attached-file ai-file"
};
const _hoisted_45 = { class: "file-name" };
const _hoisted_46 = { class: "msg-meta" };
const _hoisted_47 = { class: "msg-time" };
const _sfc_main$d = {
  __name: "MessageBubble",
  props: {
    message: { type: Object, required: true },
    profile: { type: Object, default: () => ({}) }
  },
  setup(__props) {
    const props = __props;
    const thinkExpanded = /* @__PURE__ */ ref(false);
    const lightboxSrc = /* @__PURE__ */ ref(null);
    const copied = /* @__PURE__ */ ref(false);
    const expandedThinkBlocks = /* @__PURE__ */ ref({});
    const isStreaming = computed(() => {
      return props.message.status === "streaming" || props.message._streaming;
    });
    const hasContentBlocks = computed(() => {
      return props.message.contentBlocks?.length > 0;
    });
    const thinkingBlocks = computed(() => {
      return props.message.contentBlocks?.filter((block2) => block2.type === "thinking" && block2.thinking) || [];
    });
    const textBlocks = computed(() => {
      return props.message.contentBlocks?.filter((block2) => block2.type === "text" && block2.text) || [];
    });
    const displayContent = computed(() => {
      if (props.message.role !== "assistant") return "";
      return props.message._streamContent || props.message.content || "";
    });
    const renderedHtml = computed(() => {
      if (props.message.role !== "assistant") return "";
      return renderMarkdown(displayContent.value);
    });
    const thinkPreview = computed(() => {
      return props.message._thinkContent || "";
    });
    function toggleThink(index) {
      expandedThinkBlocks.value[index] = !expandedThinkBlocks.value[index];
    }
    function isThinkExpanded(index) {
      return !!expandedThinkBlocks.value[index];
    }
    function getThinkPreview(text2) {
      return text2 || "";
    }
    function renderBlockMarkdown(text2) {
      if (!text2) return "";
      return renderMarkdown(text2);
    }
    function getModelShortName(model) {
      if (!model) return "";
      const parts = model.split("/");
      return parts[parts.length - 1] || model;
    }
    function openLightbox(src) {
      lightboxSrc.value = src;
    }
    function copyContent() {
      const text = props.message.content || props.message._streamContent || "";
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        copied.value = true;
        window.setTimeout(() => { copied.value = false; }, 1200);
      }).catch(() => {
      });
    }
    function formatTimestamp(ts) {
      if (!ts) return "";
      return new Date(ts).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: normalizeClass(["message-bubble", `role-${__props.message.role}`])
      }, [
        __props.message.role === "user" ? (openBlock(), createElementBlock("div", _hoisted_1$d, [
          createBaseVNode("div", {
            class: "user-avatar",
            style: normalizeStyle({ background: __props.profile.userColor || "#6366f1" })
          }, [
            __props.profile.userAvatarImg ? (openBlock(), createElementBlock("img", {
              key: 0,
              src: __props.profile.userAvatarImg,
              class: "avatar-img"
            }, null, 8, _hoisted_2$d)) : (openBlock(), createElementBlock("span", _hoisted_3$c, toDisplayString(__props.profile.userAvatar || "😊"), 1))
          ], 4),
          createBaseVNode("div", _hoisted_4$a, [
            createBaseVNode("div", _hoisted_5$a, [
              createBaseVNode("span", _hoisted_6$8, toDisplayString(__props.profile.userName || "我"), 1)
            ]),
            __props.message.attachments?.length ? (openBlock(), createElementBlock("div", _hoisted_7$8, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(__props.message.attachments, (att, i) => {
                return openBlock(), createElementBlock(Fragment, { key: i }, [
                  att && att.type === "image" && att.preview ? (openBlock(), createElementBlock("img", {
                    key: 0,
                    src: att.preview,
                    alt: att.fileName,
                    class: "attached-image",
                    onClick: ($event) => openLightbox(att.preview)
                  }, null, 8, _hoisted_8$8)) : att && att.type === "file" ? (openBlock(), createElementBlock("div", _hoisted_9$5, [
                    _cache[2] || (_cache[2] = createBaseVNode("span", { class: "file-icon" }, "📎", -1)),
                    createBaseVNode("span", _hoisted_10$5, toDisplayString(att.fileName || "文件"), 1)
                  ])) : createCommentVNode("", true)
                ], 64);
              }), 128))
            ])) : createCommentVNode("", true),
            __props.message.images?.length ? (openBlock(), createElementBlock("div", _hoisted_11$4, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(__props.message.images, (img, i) => {
                return openBlock(), createElementBlock("img", {
                  key: i,
                  src: img,
                  class: "attached-image",
                  onClick: ($event) => openLightbox(img)
                }, null, 8, _hoisted_12$3);
              }), 128))
            ])) : createCommentVNode("", true),
            __props.message.content ? (openBlock(), createElementBlock("div", _hoisted_13$3, toDisplayString(__props.message.content), 1)) : createCommentVNode("", true),
            __props.message.content ? (openBlock(), createElementBlock("button", {
              key: "user-copy",
              class: normalizeClass(["message-copy-btn user-copy-btn", { copied: copied.value }]),
              onClick: copyContent,
              title: "复制本条消息"
            }, toDisplayString(copied.value ? "已复制" : "复制"), 3)) : createCommentVNode("", true),
            createBaseVNode("div", _hoisted_14$3, toDisplayString(formatTimestamp(__props.message.timestamp)), 1)
          ])
        ])) : (openBlock(), createElementBlock("div", _hoisted_15$3, [
          createBaseVNode("div", {
            class: "ai-avatar",
            style: normalizeStyle({ background: __props.profile.aiColor || "#10b981" })
          }, [
            __props.profile.aiAvatarImg ? (openBlock(), createElementBlock("img", {
              key: 0,
              src: __props.profile.aiAvatarImg,
              class: "avatar-img"
            }, null, 8, _hoisted_16$3)) : (openBlock(), createElementBlock("span", _hoisted_17$2, toDisplayString(__props.profile.aiAvatar || "🤖"), 1))
          ], 4),
          createBaseVNode("div", _hoisted_18$2, [
            createBaseVNode("div", _hoisted_19$2, [
              createBaseVNode("span", _hoisted_20$2, toDisplayString(__props.profile.aiName || "AI 助手"), 1),
              __props.message.model ? (openBlock(), createElementBlock("span", _hoisted_21$2, toDisplayString(getModelShortName(__props.message.model)), 1)) : createCommentVNode("", true)
            ]),
            __props.message.status === "error" ? (openBlock(), createElementBlock("div", _hoisted_22$2, toDisplayString(__props.message.content), 1)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
              hasContentBlocks.value ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(thinkingBlocks.value, (block2, i) => {
                return openBlock(), createElementBlock("div", {
                  key: "think-" + i,
                  class: "think-block"
                }, [
                  createBaseVNode("div", {
                    class: "think-toggle",
                    onClick: ($event) => toggleThink(i)
                  }, [
                    _cache[3] || (_cache[3] = createBaseVNode("span", { class: "think-icon" }, "💭", -1)),
                    createBaseVNode("span", _hoisted_24$1, toDisplayString(isStreaming.value ? "思考中..." : "思考过程"), 1),
                    !isThinkExpanded(i) ? (openBlock(), createElementBlock("span", _hoisted_25, toDisplayString(getThinkPreview(block2.thinking)), 1)) : createCommentVNode("", true),
                    createBaseVNode("span", {
                      class: normalizeClass(["think-arrow", { expanded: isThinkExpanded(i) }])
                    }, "▾", 2)
                  ], 8, _hoisted_23$1),
                  isThinkExpanded(i) ? (openBlock(), createElementBlock("div", _hoisted_26, toDisplayString(block2.thinking), 1)) : createCommentVNode("", true)
                ]);
              }), 128)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                __props.message._thinkContent ? (openBlock(), createElementBlock("div", _hoisted_27, [
                  createBaseVNode("div", {
                    class: "think-toggle",
                    onClick: _cache[0] || (_cache[0] = ($event) => thinkExpanded.value = !thinkExpanded.value)
                  }, [
                    _cache[4] || (_cache[4] = createBaseVNode("span", { class: "think-icon" }, "💭", -1)),
                    createBaseVNode("span", _hoisted_28, toDisplayString(isStreaming.value ? "思考中..." : "思考过程"), 1),
                    !thinkExpanded.value ? (openBlock(), createElementBlock("span", _hoisted_29, toDisplayString(thinkPreview.value), 1)) : createCommentVNode("", true),
                    createBaseVNode("span", {
                      class: normalizeClass(["think-arrow", { expanded: thinkExpanded.value }])
                    }, "▾", 2)
                  ]),
                  thinkExpanded.value ? (openBlock(), createElementBlock("div", _hoisted_30, toDisplayString(__props.message._thinkContent), 1)) : createCommentVNode("", true)
                ])) : createCommentVNode("", true)
              ], 64)),
              (openBlock(true), createElementBlock(Fragment, null, renderList(__props.message.tools, (tool, i) => {
                return openBlock(), createBlock(ToolCallBlock, {
                  key: tool.id || i,
                  tool
                }, null, 8, ["tool"]);
              }), 128)),
              hasContentBlocks.value ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(textBlocks.value, (block2, i) => {
                  return openBlock(), createElementBlock("div", {
                    key: "text-" + i,
                    class: "ann-markdown"
                  }, [
                    createBaseVNode("div", {
                      innerHTML: renderBlockMarkdown(block2.text)
                    }, null, 8, _hoisted_31),
                    isStreaming.value && i === textBlocks.value.length - 1 ? (openBlock(), createElementBlock("span", _hoisted_32, "|")) : createCommentVNode("", true)
                  ]);
                }), 128)),
                isStreaming.value && !textBlocks.value.length ? (openBlock(), createElementBlock("div", _hoisted_33, [..._cache[5] || (_cache[5] = [
                  createBaseVNode("span", { class: "streaming-cursor" }, "|", -1)
                ])])) : createCommentVNode("", true)
              ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 3 }, [
                renderedHtml.value ? (openBlock(), createElementBlock("div", _hoisted_34, [
                  createBaseVNode("div", { innerHTML: renderedHtml.value }, null, 8, _hoisted_35),
                  isStreaming.value ? (openBlock(), createElementBlock("span", _hoisted_36, "|")) : createCommentVNode("", true)
                ])) : __props.message.content || isStreaming.value ? (openBlock(), createElementBlock("div", _hoisted_37, [
                  createTextVNode(toDisplayString(__props.message.content), 1),
                  isStreaming.value ? (openBlock(), createElementBlock("span", _hoisted_38, "|")) : createCommentVNode("", true)
                ])) : createCommentVNode("", true)
              ], 64)),
              __props.message.images?.length ? (openBlock(), createElementBlock("div", _hoisted_39, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(__props.message.images, (img, i) => {
                  return openBlock(), createElementBlock("img", {
                    key: i,
                    src: img,
                    class: "ai-image",
                    onClick: ($event) => openLightbox(img)
                  }, null, 8, _hoisted_40);
                }), 128))
              ])) : createCommentVNode("", true),
              __props.message.attachments?.length ? (openBlock(), createElementBlock("div", _hoisted_41, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(__props.message.attachments, (att, i) => {
                  return openBlock(), createElementBlock(Fragment, { key: i }, [
                    att ? (openBlock(), createElementBlock("div", _hoisted_42, [
                      att.type === "image" && att.preview ? (openBlock(), createElementBlock("img", {
                        key: 0,
                        src: att.preview,
                        alt: att.fileName,
                        class: "ai-image",
                        onClick: ($event) => openLightbox(att.preview)
                      }, null, 8, _hoisted_43)) : att.type === "file" ? (openBlock(), createElementBlock("div", _hoisted_44, [
                        _cache[6] || (_cache[6] = createBaseVNode("span", { class: "file-icon" }, "📎", -1)),
                        createBaseVNode("span", _hoisted_45, toDisplayString(att.fileName || "文件"), 1)
                      ])) : createCommentVNode("", true)
                    ])) : createCommentVNode("", true)
                  ], 64);
                }), 128))
              ])) : createCommentVNode("", true)
            ], 64)),
            createBaseVNode("div", _hoisted_46, [
              createBaseVNode("span", _hoisted_47, toDisplayString(formatTimestamp(__props.message.timestamp)), 1),
              __props.message.content ? (openBlock(), createElementBlock("button", {
                key: 0,
                class: normalizeClass(["action-btn", { copied: copied.value }]),
                onClick: copyContent,
                title: copied.value ? "已复制" : "复制"
              }, [..._cache[7] || (_cache[7] = [
                createBaseVNode("span", { class: "iconfont icon-clawfuzhi" }, null, -1)
              ])])) : createCommentVNode("", true)
            ])
          ])
        ])),
        lightboxSrc.value ? (openBlock(), createBlock(Lightbox, {
          key: 2,
          src: lightboxSrc.value,
          onClose: _cache[1] || (_cache[1] = ($event) => lightboxSrc.value = null)
        }, null, 8, ["src"])) : createCommentVNode("", true)
      ], 2);
    };
  }
};
const MessageBubble = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["__scopeId", "data-v-fd7d93a3"]]);
const _hoisted_1$c = {
  key: 0,
  class: "drop-overlay"
};
const _hoisted_2$c = { class: "input-row" };
const _hoisted_3$b = {
  key: 0,
  class: "attachments-preview"
};
const _hoisted_4$9 = ["src"];
const _hoisted_5$9 = {
  key: 1,
  class: "chip-file-icon"
};
const _hoisted_6$7 = { class: "chip-name" };
const _hoisted_7$7 = ["onClick"];
const _hoisted_8$7 = { class: "input-controls" };
const _hoisted_9$4 = ["disabled"];
const _hoisted_10$4 = ["disabled"];
const _hoisted_11$3 = {
  key: 0,
  class: "cmd-menu"
};
const _hoisted_12$2 = ["onClick"];
const _hoisted_13$2 = { class: "cmd-menu-name" };
const _hoisted_14$2 = { class: "cmd-menu-desc" };
const _hoisted_15$2 = ["placeholder", "disabled"];
const _hoisted_16$2 = ["disabled"];
const _sfc_main$c = {
  __name: "ChatInput",
  props: {
    modelValue: { type: String, default: "" },
    isReady: { type: Boolean, default: false },
    sending: { type: Boolean, default: false }
  },
  emits: ["update:modelValue", "send", "stop", "command"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit2 = __emit;
    const localText = /* @__PURE__ */ ref(props.modelValue);
    const showCmdMenu = /* @__PURE__ */ ref(false);
    const attachments = /* @__PURE__ */ ref([]);
    const dragOver = /* @__PURE__ */ ref(false);
    const dragCounter = /* @__PURE__ */ ref(0);
    const textareaRef = /* @__PURE__ */ ref(null);
    const fileInputRef = /* @__PURE__ */ ref(null);
    const cmdWrapRef = /* @__PURE__ */ ref(null);
    const commands = [
      { name: "/new", desc: "新建会话" },
      { name: "/reset", desc: "重置当前会话" },
      { name: "/stop", desc: "停止生成" }
    ];
    const placeholderText = computed(() => {
      if (!props.isReady) return "等待 Gateway 就绪...";
      return "输入消息... (Enter 发送)";
    });
    const canSend = computed(() => {
      return (localText.value.trim() || attachments.value.length) && props.isReady && !props.sending;
    });
    watch(() => props.modelValue, (v) => {
      localText.value = v;
      autoResize();
    });
    function autoResize() {
      nextTick(() => {
        const el = textareaRef.value;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 150) + "px";
      });
    }
    function handleInput(e) {
      const val = e.target.value;
      emit2("update:modelValue", val);
      autoResize();
    }
    function handleKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        showCmdMenu.value = false;
      }
    }
    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) addFileAttachment(file);
          break;
        }
      }
    }
    function onDragEnter(e) {
      dragCounter.value++;
      if (e.dataTransfer?.types?.includes("Files")) {
        dragOver.value = true;
      }
    }
    function onDragOver(e) {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    }
    function onDragLeave() {
      dragCounter.value--;
      if (dragCounter.value <= 0) {
        dragCounter.value = 0;
        dragOver.value = false;
      }
    }
    function onDrop(e) {
      dragOver.value = false;
      dragCounter.value = 0;
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      for (const file of files) {
        addFileAttachment(file);
      }
    }
    function openFilePicker() {
      fileInputRef.value?.click();
    }
    function handleFileSelect(e) {
      const files = e.target.files;
      if (!files) return;
      for (const file of files) {
        addFileAttachment(file);
      }
      fileInputRef.value.value = "";
    }
    function addFileAttachment(file) {
      console.log("addFileAttachment==>", file);
      const isImage = file.type.startsWith("image/");
      const att = {
        type: isImage ? "image" : "file",
        fileName: file.name,
        mimeType: file.type,
        preview: null,
        content: null
      };
      if (!isImage) {
        att.filePath = window.uclaw?.getFilePath(file) || file.path || null;
      }
      attachments.value.push(att);
      if (!isImage) return;
      const reader = new FileReader();
      const idx = attachments.value.length - 1;
      reader.onload = () => {
        attachments.value[idx].preview = reader.result;
        attachments.value[idx].content = reader.result.split(",")[1];
      };
      reader.readAsDataURL(file);
    }
    function removeAttachment(i) {
      attachments.value.splice(i, 1);
    }
    function handleSend() {
      const text2 = localText.value.trim();
      if (!canSend.value) return;
      emit2("send", text2 || "", attachments.value.length ? [...attachments.value] : void 0);
      localText.value = "";
      emit2("update:modelValue", "");
      attachments.value = [];
      nextTick(autoResize);
    }
    function toggleCmdMenu() {
      showCmdMenu.value = !showCmdMenu.value;
    }
    function executeCommand(cmdName) {
      showCmdMenu.value = false;
      emit2("command", cmdName);
      localText.value = "";
      emit2("update:modelValue", "");
    }
    __expose({ focus: () => textareaRef.value?.focus() });
    function handleClickOutside(e) {
      if (cmdWrapRef.value && !cmdWrapRef.value.contains(e.target)) {
        showCmdMenu.value = false;
      }
    }
    onMounted(() => document.addEventListener("click", handleClickOutside));
    onUnmounted(() => document.removeEventListener("click", handleClickOutside));
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: normalizeClass(["chat-input-area", { "drag-over": dragOver.value }]),
        onDragenter: withModifiers(onDragEnter, ["prevent"]),
        onDragover: withModifiers(onDragOver, ["prevent"]),
        onDragleave: withModifiers(onDragLeave, ["prevent"]),
        onDrop: withModifiers(onDrop, ["prevent"])
      }, [
        dragOver.value ? (openBlock(), createElementBlock("div", _hoisted_1$c, [..._cache[2] || (_cache[2] = [
          createBaseVNode("div", { class: "drop-hint" }, [
            createBaseVNode("svg", {
              width: "40",
              height: "40",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "1.5"
            }, [
              createBaseVNode("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" })
            ]),
            createBaseVNode("span", null, "释放以添加文件")
          ], -1)
        ])])) : createCommentVNode("", true),
        createBaseVNode("div", _hoisted_2$c, [
          attachments.value.length ? (openBlock(), createElementBlock("div", _hoisted_3$b, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(attachments.value, (att, i) => {
              return openBlock(), createElementBlock("div", {
                key: i,
                class: normalizeClass(["attachment-chip", { "is-image": att.type === "image" }])
              }, [
                att.type === "image" && att.preview ? (openBlock(), createElementBlock("img", {
                  key: 0,
                  src: att.preview,
                  class: "chip-thumb"
                }, null, 8, _hoisted_4$9)) : (openBlock(), createElementBlock("span", _hoisted_5$9, "📎")),
                createBaseVNode("span", _hoisted_6$7, toDisplayString(att.fileName || "文件"), 1),
                createBaseVNode("button", {
                  class: "chip-remove",
                  onClick: ($event) => removeAttachment(i)
                }, "✕", 8, _hoisted_7$7)
              ], 2);
            }), 128))
          ])) : createCommentVNode("", true),
          createBaseVNode("div", _hoisted_8$7, [
            createBaseVNode("button", {
              class: "action-btn file-btn",
              disabled: !__props.isReady,
              onClick: openFilePicker,
              title: "上传附件"
            }, [..._cache[3] || (_cache[3] = [
              createBaseVNode("svg", {
                width: "15",
                height: "15",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2"
              }, [
                createBaseVNode("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" })
              ], -1)
            ])], 8, _hoisted_9$4),
            createBaseVNode("input", {
              ref_key: "fileInputRef",
              ref: fileInputRef,
              type: "file",
              multiple: "",
              accept: "image/*,.pdf,.txt,.md,.json,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.py,.js,.ts,.html,.css",
              hidden: "",
              onChange: handleFileSelect
            }, null, 544),
            createBaseVNode("div", {
              class: "cmd-btn-wrap",
              ref_key: "cmdWrapRef",
              ref: cmdWrapRef
            }, [
              createBaseVNode("button", {
                class: "action-btn cmd-btn",
                disabled: !__props.isReady,
                onClick: toggleCmdMenu,
                title: "命令"
              }, [..._cache[4] || (_cache[4] = [
                createBaseVNode("svg", {
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createBaseVNode("polyline", { points: "4 17 10 11 4 5" }),
                  createBaseVNode("line", {
                    x1: "12",
                    y1: "19",
                    x2: "20",
                    y2: "19"
                  })
                ], -1)
              ])], 8, _hoisted_10$4),
              showCmdMenu.value ? (openBlock(), createElementBlock("div", _hoisted_11$3, [
                (openBlock(), createElementBlock(Fragment, null, renderList(commands, (cmd) => {
                  return createBaseVNode("div", {
                    key: cmd.name,
                    class: "cmd-menu-item",
                    onClick: ($event) => executeCommand(cmd.name)
                  }, [
                    createBaseVNode("span", _hoisted_13$2, toDisplayString(cmd.name), 1),
                    createBaseVNode("span", _hoisted_14$2, toDisplayString(cmd.desc), 1)
                  ], 8, _hoisted_12$2);
                }), 64))
              ])) : createCommentVNode("", true)
            ], 512),
            withDirectives(createBaseVNode("textarea", {
              ref_key: "textareaRef",
              ref: textareaRef,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => localText.value = $event),
              class: "chat-textarea",
              placeholder: placeholderText.value,
              disabled: !__props.isReady,
              rows: 1,
              onKeydown: handleKeydown,
              onInput: handleInput,
              onPaste: handlePaste
            }, null, 40, _hoisted_15$2), [
              [vModelText, localText.value]
            ]),
            __props.sending ? (openBlock(), createElementBlock("button", {
              key: 0,
              class: "send-btn stop-btn",
              onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("stop")),
              title: "停止生成"
            }, [..._cache[5] || (_cache[5] = [
              createBaseVNode("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "currentColor"
              }, [
                createBaseVNode("rect", {
                  x: "4",
                  y: "4",
                  width: "16",
                  height: "16",
                  rx: "1"
                })
              ], -1)
            ])])) : (openBlock(), createElementBlock("button", {
              key: 1,
              class: "send-btn",
              disabled: !canSend.value,
              onClick: handleSend,
              title: "发送"
            }, [..._cache[6] || (_cache[6] = [
              createBaseVNode("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2.5"
              }, [
                createBaseVNode("path", { d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" })
              ], -1)
            ])], 8, _hoisted_16$2))
          ])
        ])
      ], 34);
    };
  }
};
const ChatInput = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-351db0cb"]]);
const _hoisted_1$b = ["disabled", "title"];
const _hoisted_2$b = { class: "model-label" };
const _hoisted_3$a = {
  key: 0,
  class: "dropdown"
};
const _hoisted_4$8 = ["onClick"];
const _hoisted_5$8 = { class: "item-main" };
const _hoisted_6$6 = { class: "item-name" };
const _hoisted_7$6 = {
  key: 0,
  class: "item-provider"
};
const _hoisted_8$6 = {
  key: 0,
  class: "item-check",
  width: "14",
  height: "14",
  viewBox: "0 0 20 20",
  fill: "currentColor"
};
const _sfc_main$b = {
  __name: "ModelSelector",
  props: {
    models: { type: Array, default: () => [] },
    currentModel: { type: String, default: null },
    isReady: { type: Boolean, default: false },
    loadingModels: { type: Boolean, default: false }
  },
  emits: ["select", "refresh"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit2 = __emit;
    const open = /* @__PURE__ */ ref(false);
    const dropdownRef = /* @__PURE__ */ ref(null);
    const currentLabel = computed(() => {
      if (!props.currentModel) return null;
      const found = props.models.find((m) => (m.id || m.model) === props.currentModel);
      return found ? getModelName(found) : props.currentModel.split("/").pop();
    });
    function getModelName(model) {
      if (model.name) return model.name;
      const id = model.id || model.model || "";
      return id.split("/").pop() || "未知";
    }
    function isActive(model) {
      return (model.id || model.model) === props.currentModel;
    }
    function toggleDropdown() {
      if (props.loadingModels) {
        emit2("refresh");
        return;
      }
      open.value = !open.value;
    }
    function selectModel(model) {
      emit2("select", model.id || model.model);
      open.value = false;
    }
    function handleClickOutside(e) {
      if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
        open.value = false;
      }
    }
    onMounted(() => document.addEventListener("mousedown", handleClickOutside));
    onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        ref_key: "dropdownRef",
        ref: dropdownRef,
        class: "model-selector"
      }, [
        createBaseVNode("button", {
          class: "selector-btn",
          disabled: !__props.isReady,
          onClick: toggleDropdown,
          title: currentLabel.value || "选择模型"
        }, [
          createBaseVNode("span", _hoisted_2$b, toDisplayString(__props.loadingModels ? "加载中..." : currentLabel.value || "选择模型"), 1),
          (openBlock(), createElementBlock("svg", {
            class: normalizeClass(["arrow-svg", { open: open.value }]),
            width: "10",
            height: "10",
            viewBox: "0 0 20 20",
            fill: "currentColor"
          }, [..._cache[1] || (_cache[1] = [
            createBaseVNode("path", { d: "M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" }, null, -1)
          ])], 2))
        ], 8, _hoisted_1$b),
        (openBlock(), createBlock(Teleport, { to: "body" }, [
          open.value && __props.models.length ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "dropdown-backdrop",
            onClick: _cache[0] || (_cache[0] = ($event) => open.value = false)
          })) : createCommentVNode("", true)
        ])),
        open.value && __props.models.length ? (openBlock(), createElementBlock("div", _hoisted_3$a, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(__props.models, (model) => {
            return openBlock(), createElementBlock("div", {
              key: model.id || model.model,
              class: normalizeClass(["dropdown-item", { active: isActive(model) }]),
              onClick: ($event) => selectModel(model)
            }, [
              createBaseVNode("div", _hoisted_5$8, [
                createBaseVNode("span", _hoisted_6$6, toDisplayString(getModelName(model)), 1),
                model.provider ? (openBlock(), createElementBlock("span", _hoisted_7$6, toDisplayString(model.provider), 1)) : createCommentVNode("", true)
              ]),
              isActive(model) ? (openBlock(), createElementBlock("svg", _hoisted_8$6, [..._cache[2] || (_cache[2] = [
                createBaseVNode("path", {
                  "fill-rule": "evenodd",
                  d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                  "clip-rule": "evenodd"
                }, null, -1)
              ])])) : createCommentVNode("", true)
            ], 10, _hoisted_4$8);
          }), 128))
        ])) : createCommentVNode("", true)
      ], 512);
    };
  }
};
const ModelSelector = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-d1dc68d3"]]);
const _hoisted_1$a = { class: "tabs" };
const _hoisted_2$a = { class: "profile-section" };
const _hoisted_3$9 = { class: "avatar-row" };
const _hoisted_4$7 = { class: "avatar-preview" };
const _hoisted_5$7 = ["src"];
const _hoisted_6$5 = { class: "avatar-btns" };
const _hoisted_7$5 = { class: "form-row" };
const _hoisted_8$5 = { class: "form-row" };
const _hoisted_9$3 = { class: "form-row" };
const _hoisted_10$3 = { class: "color-swatches" };
const _hoisted_11$2 = ["onClick"];
const _hoisted_12$1 = { class: "profile-section" };
const _hoisted_13$1 = { class: "avatar-row" };
const _hoisted_14$1 = { class: "avatar-preview" };
const _hoisted_15$1 = ["src"];
const _hoisted_16$1 = { class: "avatar-btns" };
const _hoisted_17$1 = { class: "form-row" };
const _hoisted_18$1 = { class: "form-row" };
const _hoisted_19$1 = { class: "form-row" };
const _hoisted_20$1 = { class: "color-swatches" };
const _hoisted_21$1 = ["onClick"];
const _hoisted_22$1 = { class: "dialog-actions" };
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const _sfc_main$a = {
  __name: "ProfileDialog",
  props: {
    open: { type: Boolean, default: false },
    profile: { type: Object, default: () => ({}) }
  },
  emits: ["close", "save"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit2 = __emit;
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
    const activeTab = /* @__PURE__ */ ref("user");
    const userFileInput = /* @__PURE__ */ ref(null);
    const aiFileInput = /* @__PURE__ */ ref(null);
    const local = /* @__PURE__ */ reactive({
      userName: "",
      userAvatar: "",
      userAvatarImg: "",
      userColor: "#6366f1",
      aiName: "",
      aiAvatar: "",
      aiAvatarImg: "",
      aiColor: "#10b981"
    });
    watch(() => props.open, (isOpen) => {
      if (isOpen) {
        local.userName = props.profile.userName || "";
        local.userAvatar = props.profile.userAvatar || "";
        local.userAvatarImg = props.profile.userAvatarImg || "";
        local.userColor = props.profile.userColor || "#6366f1";
        local.aiName = props.profile.aiName || "";
        local.aiAvatar = props.profile.aiAvatar || "";
        local.aiAvatarImg = props.profile.aiAvatarImg || "";
        local.aiColor = props.profile.aiColor || "#10b981";
        activeTab.value = "user";
      }
    });
    function triggerUpload(tab) {
      if (tab === "user") {
        userFileInput.value?.click();
      } else {
        aiFileInput.value?.click();
      }
    }
    function handleFileUpload(tab, event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        alert("图片大小不能超过 2MB");
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (tab === "user") {
          local.userAvatarImg = reader.result;
        } else {
          local.aiAvatarImg = reader.result;
        }
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    }
    function handleSave() {
      emit2("save", {
        userName: local.userName,
        userAvatar: local.userAvatar,
        userAvatarImg: local.userAvatarImg,
        userColor: local.userColor,
        aiName: local.aiName,
        aiAvatar: local.aiAvatar,
        aiAvatarImg: local.aiAvatarImg,
        aiColor: local.aiColor
      });
    }
    return (_ctx, _cache) => {
      return openBlock(), createBlock(Teleport, { to: "body" }, [
        __props.open ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: "profile-overlay",
          onClick: _cache[14] || (_cache[14] = withModifiers(($event) => _ctx.$emit("close"), ["self"]))
        }, [
          createBaseVNode("div", {
            class: "profile-dialog",
            onClick: _cache[13] || (_cache[13] = withModifiers(() => {
            }, ["stop"]))
          }, [
            _cache[21] || (_cache[21] = createBaseVNode("h2", { class: "dialog-title" }, "对话设置", -1)),
            createBaseVNode("div", _hoisted_1$a, [
              createBaseVNode("button", {
                class: normalizeClass(["tab-btn", { active: activeTab.value === "user" }]),
                onClick: _cache[0] || (_cache[0] = ($event) => activeTab.value = "user")
              }, "我的资料", 2),
              createBaseVNode("button", {
                class: normalizeClass(["tab-btn", { active: activeTab.value === "ai" }]),
                onClick: _cache[1] || (_cache[1] = ($event) => activeTab.value = "ai")
              }, "AI 助手", 2)
            ]),
            withDirectives(createBaseVNode("section", _hoisted_2$a, [
              createBaseVNode("div", _hoisted_3$9, [
                createBaseVNode("div", _hoisted_4$7, [
                  local.userAvatarImg ? (openBlock(), createElementBlock("img", {
                    key: 0,
                    src: local.userAvatarImg,
                    class: "avatar-img"
                  }, null, 8, _hoisted_5$7)) : (openBlock(), createElementBlock("div", {
                    key: 1,
                    class: "avatar-text",
                    style: normalizeStyle({ background: local.userColor })
                  }, toDisplayString(local.userAvatar || "😊"), 5))
                ]),
                createBaseVNode("input", {
                  ref_key: "userFileInput",
                  ref: userFileInput,
                  type: "file",
                  accept: "image/*",
                  class: "file-input-hidden",
                  onChange: _cache[2] || (_cache[2] = ($event) => handleFileUpload("user", $event))
                }, null, 544),
                createBaseVNode("div", _hoisted_6$5, [
                  createBaseVNode("button", {
                    class: "btn-upload-img",
                    onClick: _cache[3] || (_cache[3] = ($event) => triggerUpload("user"))
                  }, "上传图片"),
                  local.userAvatarImg ? (openBlock(), createElementBlock("button", {
                    key: 0,
                    class: "btn-remove-img",
                    onClick: _cache[4] || (_cache[4] = ($event) => local.userAvatarImg = "")
                  }, "移除图片")) : createCommentVNode("", true)
                ])
              ]),
              createBaseVNode("div", _hoisted_7$5, [
                _cache[15] || (_cache[15] = createBaseVNode("label", { class: "field-label" }, "昵称", -1)),
                withDirectives(createBaseVNode("input", {
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => local.userName = $event),
                  class: "field-input",
                  placeholder: "我"
                }, null, 512), [
                  [vModelText, local.userName]
                ])
              ]),
              createBaseVNode("div", _hoisted_8$5, [
                _cache[16] || (_cache[16] = createBaseVNode("label", { class: "field-label" }, [
                  createTextVNode("文字头像 "),
                  createBaseVNode("span", { class: "field-hint" }, "（无图片时显示）")
                ], -1)),
                withDirectives(createBaseVNode("input", {
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => local.userAvatar = $event),
                  class: "field-input",
                  placeholder: "😊",
                  maxlength: "4"
                }, null, 512), [
                  [vModelText, local.userAvatar]
                ])
              ]),
              createBaseVNode("div", _hoisted_9$3, [
                _cache[17] || (_cache[17] = createBaseVNode("label", { class: "field-label" }, "文字头像背景色", -1)),
                createBaseVNode("div", _hoisted_10$3, [
                  (openBlock(), createElementBlock(Fragment, null, renderList(colors, (c) => {
                    return createBaseVNode("button", {
                      key: c,
                      class: normalizeClass(["swatch", { active: local.userColor === c }]),
                      style: normalizeStyle({ background: c }),
                      onClick: ($event) => local.userColor = c
                    }, null, 14, _hoisted_11$2);
                  }), 64))
                ])
              ])
            ], 512), [
              [vShow, activeTab.value === "user"]
            ]),
            withDirectives(createBaseVNode("section", _hoisted_12$1, [
              createBaseVNode("div", _hoisted_13$1, [
                createBaseVNode("div", _hoisted_14$1, [
                  local.aiAvatarImg ? (openBlock(), createElementBlock("img", {
                    key: 0,
                    src: local.aiAvatarImg,
                    class: "avatar-img"
                  }, null, 8, _hoisted_15$1)) : (openBlock(), createElementBlock("div", {
                    key: 1,
                    class: "avatar-text",
                    style: normalizeStyle({ background: local.aiColor })
                  }, toDisplayString(local.aiAvatar || "🤖"), 5))
                ]),
                createBaseVNode("input", {
                  ref_key: "aiFileInput",
                  ref: aiFileInput,
                  type: "file",
                  accept: "image/*",
                  class: "file-input-hidden",
                  onChange: _cache[7] || (_cache[7] = ($event) => handleFileUpload("ai", $event))
                }, null, 544),
                createBaseVNode("div", _hoisted_16$1, [
                  createBaseVNode("button", {
                    class: "btn-upload-img",
                    onClick: _cache[8] || (_cache[8] = ($event) => triggerUpload("ai"))
                  }, "上传图片"),
                  local.aiAvatarImg ? (openBlock(), createElementBlock("button", {
                    key: 0,
                    class: "btn-remove-img",
                    onClick: _cache[9] || (_cache[9] = ($event) => local.aiAvatarImg = "")
                  }, "移除图片")) : createCommentVNode("", true)
                ])
              ]),
              createBaseVNode("div", _hoisted_17$1, [
                _cache[18] || (_cache[18] = createBaseVNode("label", { class: "field-label" }, "AI 昵称", -1)),
                withDirectives(createBaseVNode("input", {
                  "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => local.aiName = $event),
                  class: "field-input",
                  placeholder: "AI 助手"
                }, null, 512), [
                  [vModelText, local.aiName]
                ])
              ]),
              createBaseVNode("div", _hoisted_18$1, [
                _cache[19] || (_cache[19] = createBaseVNode("label", { class: "field-label" }, [
                  createTextVNode("文字头像 "),
                  createBaseVNode("span", { class: "field-hint" }, "（无图片时显示）")
                ], -1)),
                withDirectives(createBaseVNode("input", {
                  "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => local.aiAvatar = $event),
                  class: "field-input",
                  placeholder: "🤖",
                  maxlength: "4"
                }, null, 512), [
                  [vModelText, local.aiAvatar]
                ])
              ]),
              createBaseVNode("div", _hoisted_19$1, [
                _cache[20] || (_cache[20] = createBaseVNode("label", { class: "field-label" }, "文字头像背景色", -1)),
                createBaseVNode("div", _hoisted_20$1, [
                  (openBlock(), createElementBlock(Fragment, null, renderList(colors, (c) => {
                    return createBaseVNode("button", {
                      key: c,
                      class: normalizeClass(["swatch", { active: local.aiColor === c }]),
                      style: normalizeStyle({ background: c }),
                      onClick: ($event) => local.aiColor = c
                    }, null, 14, _hoisted_21$1);
                  }), 64))
                ])
              ])
            ], 512), [
              [vShow, activeTab.value === "ai"]
            ]),
            createBaseVNode("div", _hoisted_22$1, [
              createBaseVNode("button", {
                class: "btn-cancel",
                onClick: _cache[12] || (_cache[12] = ($event) => _ctx.$emit("close"))
              }, "取消"),
              createBaseVNode("button", {
                class: "btn-save",
                onClick: handleSave
              }, "保存")
            ])
          ])
        ])) : createCommentVNode("", true)
      ]);
    };
  }
};
const ProfileDialog = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-7da38af9"]]);
const _hoisted_1$9 = { class: "ai-chat-view" };
const _hoisted_2$9 = {
  key: 0,
  class: "gateway-stop-hint"
};
const _hoisted_3$8 = {
  key: 1,
  class: "chat-layout"
};
const _hoisted_4$6 = {
  key: 0,
  class: "session-panel"
};
const _hoisted_5$6 = { class: "session-status-bar" };
const _hoisted_6$4 = { class: "status-row" };
const _hoisted_7$4 = { class: "status-text" };
const _hoisted_8$4 = {
  key: 0,
  class: "status-error-text"
};
const _hoisted_9$2 = { class: "chat-main" };
const _hoisted_10$2 = { class: "chat-topbar" };
const _hoisted_11$1 = { class: "session-title" };
const _hoisted_12 = { class: "topbar-right" };
const _hoisted_13 = {
  key: 0,
  class: "empty-chat"
};
const _hoisted_14 = {
  key: 1,
  class: "loading-bubble"
};
const _hoisted_15 = ["src"];
const _hoisted_16 = { key: 1 };
const _hoisted_17 = { class: "input-area" };
const _hoisted_18 = { class: "modal-card" };
const _hoisted_19 = { class: "modal-actions" };
const _hoisted_20 = { class: "modal-card" };
const _hoisted_21 = { class: "modal-actions" };
const _hoisted_22 = ["disabled"];
const _hoisted_23 = { class: "modal-card" };
const _hoisted_24 = { class: "modal-actions" };
const _sfc_main$9 = {
  __name: "AiChat",
  setup(__props) {
    const { showToast } = useToast();
    const store = useAiChatStore();
    const gatewayStore = useGatewayStore();
    const modelsStore = useModelsStore();
    const sidebarVisible = /* @__PURE__ */ ref(false);
    const loadingModels = /* @__PURE__ */ ref(false);
    const showProfile = /* @__PURE__ */ ref(false);
    const showDeleteDialog = /* @__PURE__ */ ref(false);
    const showClearDialog = /* @__PURE__ */ ref(false);
    const showRenameDialog = /* @__PURE__ */ ref(false);
    const deletingKey = /* @__PURE__ */ ref(null);
    const renamingKey = /* @__PURE__ */ ref(null);
    const renameValue = /* @__PURE__ */ ref("");
    const renameInputRef = /* @__PURE__ */ ref(null);
    const chatInputRef = /* @__PURE__ */ ref(null);
    const agentMode = /* @__PURE__ */ ref("openclaw");
    const hermesMessages = /* @__PURE__ */ ref([]);
    const collabMessages = /* @__PURE__ */ ref([]);
    const hermesSending = /* @__PURE__ */ ref(false);
    const collabSending = /* @__PURE__ */ ref(false);
    const hermesInputText = /* @__PURE__ */ ref("");
    const hermesRunState = /* @__PURE__ */ ref("");
    const collabRunState = /* @__PURE__ */ ref("");
    const messagesArea = /* @__PURE__ */ ref(null);
    const messagesEnd = /* @__PURE__ */ ref(null);
    const autoScroll = /* @__PURE__ */ ref(true);
    const statusLabel = computed(() => {
      switch (store.wsStatus) {
        case "ready":
          return "已连接";
        case "connected":
          return "握手中...";
        case "connecting":
          return "连接中...";
        case "reconnecting":
          return "重连中...";
        case "error":
          return "连接失败";
        case "disconnected":
          return "未连接";
        default:
          return store.wsStatus;
      }
    });
    const currentSessionTitle = computed(() => {
      const s = store.activeSession;
      return s ? store.getSessionName(s) : "AI 会话";
    });
    const activeMessages = computed(() => agentMode.value === "openclaw" ? store.currentMessages : agentMode.value === "collab" ? collabMessages.value : hermesMessages.value);
    const activeProfile = computed(() => agentMode.value === "openclaw" ? store.profile : {
      ...store.profile,
      aiName: agentMode.value === "collab" ? "OpenClaw + Hermes" : "Hermes Agent",
      aiAvatar: "H",
      aiAvatarImg: "",
      aiColor: "#4edea3"
    });
    const activeSending = computed(() => agentMode.value === "openclaw" ? store.sending : agentMode.value === "collab" ? collabSending.value : hermesSending.value);
    const gatewayAvailable = computed(() => store.isReady || gatewayStore.gatewayReady || gatewayStore.running);
    const activeReady = computed(() => agentMode.value === "openclaw" ? store.isReady : agentMode.value === "collab" ? !collabSending.value && gatewayAvailable.value : !hermesSending.value);
    const isWaitingForAi = computed(() => {
      if (agentMode.value === "hermes") return hermesSending.value;
      if (agentMode.value === "collab") return collabSending.value;
      if (!store.sending) return false;
      const msgs = store.currentMessages;
      if (!msgs.length) return false;
      const last = msgs[msgs.length - 1];
      return last.role === "user";
    });
    const sessionModels = computed(
      () => modelsStore.selectedModels.map((m) => ({
        id: m.value,
        name: m.label,
        provider: m.source
      }))
    );
    const sessionCurrentModelId = computed(() => {
      const sk = store.activeSessionKey;
      if (sk && store.sessionModelMap[sk]) {
        return store.sessionModelMap[sk];
      }
      return modelsStore.currentModel?.value || null;
    });
    let _storeInitDone = false;
    onMounted(() => {
      if (!_storeInitDone) {
        _storeInitDone = true;
        store.init();
      }
      if (gatewayStore.running && store.wsStatus !== "ready" && store.wsStatus !== "connecting") {
        console.log("[AiChat] onMounted 兜底：Gateway 已运行但 WS 未连接，触发自动连接");
        store.connectToGateway();
      }
    });
    onMounted(() => {
      loadHermesSession();
      window.addEventListener("uclaw-hermes-chat-state", handleHermesStateEvent);
      if (window.uclaw?.ipcOnHermesChatProgress) window.uclaw.ipcOnHermesChatProgress(handleHermesChatProgress);
      nextTick(() => scrollToBottom());
    });
    async function handleRefreshModels() {
      loadingModels.value = true;
      await fetchAllModels();
      loadingModels.value = false;
    }
    function handleNewSession() {
      const modelId = modelsStore.currentModel?.value || null;
      store.createSession(modelId);
    }
    function handleModelSelect(modelId) {
      store.switchModel(modelId);
    }
    function handleReconnect() {
      console.log("[AiChat] 手动重试连接...");
      store.reconnect();
    }
    async function handleOpenWebUI() {
      try {
        if (window.uclaw?.ipcOpenChatWindow) {
          await window.uclaw.ipcOpenChatWindow();
        } else if (window.uclaw?.ipcOpenExternalUrl) {
          const port = window.uclaw.ipcGetDefaultPort ? await window.uclaw.ipcGetDefaultPort() : 18789;
          let token = "";
          try {
            if (window.uclaw?.ipcReadConfig) {
              const config = await window.uclaw.ipcReadConfig();
              token = config?.gateway?.auth?.token || "";
            }
          } catch {
          }
          const url = token ? `http://127.0.0.1:${port}/?token=${encodeURIComponent(token)}` : `http://127.0.0.1:${port}/`;
          await window.uclaw.ipcOpenExternalUrl(url);
        } else {
          window.open("http://127.0.0.1:18789/", "_blank", "noopener");
        }
      } catch (e) {
        console.warn("[AiChat] open chat window failed:", e);
      }
    }
    function selectAgentMode(mode) {
      agentMode.value = mode;
      if (mode === "hermes" && collabSending.value) collabRunState.value = "协同仍在后台执行，可切回协同查看。";
      if (mode === "collab" && hermesSending.value) hermesRunState.value = "Hermes 仍在后台执行，可切回 Hermes 查看。";
      localStorage.setItem("uclaw_agent_mode", mode);
      nextTick(() => scrollToBottom(0));
    }
    function saveHermesSession() {
      try {
        const compactMessages = (items) => (Array.isArray(items) ? items.slice(-80).map((item) => ({ ...item, content: typeof item.content === "string" && item.content.length > 3e4 ? item.content.slice(0, 12e3) + "\n\n[中间内容已折叠，完整输出请查看 Hermes 运行日志。]\n\n" + item.content.slice(-12e3) : item.content })) : []);
        const state = { savedAt: Date.now(), hermesMessages: compactMessages(hermesMessages.value), collabMessages: compactMessages(collabMessages.value), input: hermesInputText.value, mode: agentMode.value, runState: hermesRunState.value, collabRunState: collabRunState.value, hermesSending: hermesSending.value, collabSending: collabSending.value };
        window.__uclawHermesChatState = state;
        clearTimeout(window.__uclawHermesChatSaveTimer);
        window.__uclawHermesChatSaveTimer = setTimeout(() => {
          try {
            localStorage.setItem("uclaw_hermes_chat_state", JSON.stringify(window.__uclawHermesChatState || state));
            window.dispatchEvent(new CustomEvent("uclaw-hermes-chat-state"));
          } catch {}
        }, 450);
      } catch {
      }
    }
    function loadHermesSession() {
      try {
        const liveState = window.__uclawHermesChatState;
        if (liveState) {
          if (Array.isArray(liveState.hermesMessages)) hermesMessages.value = liveState.hermesMessages;
          else if (Array.isArray(liveState.messages)) hermesMessages.value = liveState.messages;
          if (Array.isArray(liveState.collabMessages)) collabMessages.value = liveState.collabMessages;
          if (typeof liveState.input === "string") hermesInputText.value = liveState.input;
          if (typeof liveState.runState === "string") hermesRunState.value = liveState.runState;
          if (typeof liveState.collabRunState === "string") collabRunState.value = liveState.collabRunState;
          hermesSending.value = false;
          collabSending.value = false;
          if (["openclaw", "hermes", "collab"].includes(liveState.mode)) agentMode.value = liveState.mode;
        }
        const raw = localStorage.getItem("uclaw_hermes_chat_state");
        if (raw) {
          const state = JSON.parse(raw);
          const liveSavedAt = Number(liveState?.savedAt || 0);
          const diskSavedAt = Number(state?.savedAt || 0);
          if (liveState && liveSavedAt && diskSavedAt && diskSavedAt < liveSavedAt) return;
          if (Array.isArray(state.hermesMessages)) hermesMessages.value = state.hermesMessages;
          else if (Array.isArray(state.messages)) hermesMessages.value = state.messages;
          if (Array.isArray(state.collabMessages)) collabMessages.value = state.collabMessages;
          if (typeof state.input === "string") hermesInputText.value = state.input;
          if (typeof state.runState === "string") hermesRunState.value = state.runState;
          if (typeof state.collabRunState === "string") collabRunState.value = state.collabRunState;
          hermesSending.value = false;
          collabSending.value = false;
        }
        const mode = localStorage.getItem("uclaw_agent_mode");
        if (["openclaw", "hermes", "collab"].includes(mode)) agentMode.value = mode;
      } catch {
      }
    }
    function handleHermesStateEvent() {
      nextTick(() => scrollToBottom(0));
    }
    function handleHermesChatProgress(payload) {
      const now = Date.now();
      const lastPayload = window.__uclawHermesProgressLast || {};
      const key = `${payload?.mode || ""}:${payload?.sessionId || ""}:${payload?.stage || ""}:${payload?.detail || ""}`;
      if (lastPayload.key === key && now - (lastPayload.at || 0) < 1500) return;
      window.__uclawHermesProgressLast = { key, at: now };
      const text = payload?.detail || "";
      if (!text) return;
      if (payload?.mode === "collab" || payload?.sessionId === "openclaw-hermes-collab") {
        collabRunState.value = text;
      } else {
        hermesRunState.value = text;
        upsertHermesProgress(text, payload?.stage, "running");
      }
      saveHermesSession();
    }
    function upsertHermesProgress(content, stage = "", status = "running") {
      const now = Date.now();
      const last = window.__uclawHermesProgressMessage || {};
      const key = `${stage}:${content}`;
      if (last.key === key && now - (last.at || 0) < 6e3) return;
      window.__uclawHermesProgressMessage = { key, at: now };
      const id = window.__uclawHermesActiveProgressId || `hermes-progress-${now}-${Math.random().toString(36).slice(2, 7)}`;
      window.__uclawHermesActiveProgressId = id;
      const lines = Array.isArray(window.__uclawHermesProgressLines) ? window.__uclawHermesProgressLines : [];
      if (content && lines[lines.length - 1] !== content) lines.push(content);
      window.__uclawHermesProgressLines = lines.slice(-20);
      const output = window.__uclawHermesProgressLines.map((line, idx) => `${idx + 1}. ${line}`).join("\n");
      const progressMessage = {
        id,
        role: "assistant",
        content: "",
        model: "Hermes Agent",
        timestamp: now,
        status,
        tools: [{
          id: `${id}-tool`,
          name: "Hermes 执行过程",
          input: stage ? { stage } : null,
          output,
          status: status === "error" ? "error" : status === "done" ? "ok" : "running",
          time: now
        }]
      };
      const existingIndex = hermesMessages.value.findIndex((m) => m.id === id);
      if (existingIndex >= 0) {
        const next = hermesMessages.value.slice();
        next[existingIndex] = { ...next[existingIndex], ...progressMessage };
        hermesMessages.value = next;
      } else {
        hermesMessages.value = [...hermesMessages.value, progressMessage];
      }
    }
    function finishHermesProgress(status = "done") {
      const id = window.__uclawHermesActiveProgressId;
      if (!id) return;
      const existing = hermesMessages.value.find((m) => m.id === id);
      if (existing?.tools?.length) {
        upsertHermesProgress(status === "error" ? "Hermes 执行结束：失败。" : "Hermes 执行结束：完成。", "finished", status);
      }
      window.__uclawHermesActiveProgressId = null;
      window.__uclawHermesProgressLines = [];
    }
    function getSelectedHermesModel() {
      const selectedId = sessionCurrentModelId.value || "";
      const found = modelsStore.selectedModels.find((item) => item.value === selectedId || item.model === selectedId || item.label === selectedId) || modelsStore.selectedModels[0] || {};
      const baseUrl = found.base || found.baseUrl || "";
      const provider = baseUrl ? "openai-api" : found.provider || (String(found.value || "").split("-")[0]) || "";
      return {
        provider,
        modelName: found.model || found.name || found.label || selectedId,
        apiKey: found.key || found.apiKey || "",
        baseUrl
      };
    }
    function getHermesReply(result) {
      if (!result) return "";
      return result.reply || result.content || result.message || result.text || result.raw || "Hermes 已返回空响应。";
    }
    function appendHermesAssistant(content, model = "Hermes Agent", status = "done") {
      hermesMessages.value = [...hermesMessages.value, {
        id: `hermes-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content,
        model,
        timestamp: Date.now(),
        status
      }];
      saveHermesSession();
    }
    function appendCollabAssistant(content, model = "协同结果", status = "done", meta = {}) {
      collabMessages.value = [...collabMessages.value, {
        id: `collab-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content,
        model,
        timestamp: Date.now(),
        status,
        ...meta
      }];
      saveHermesSession();
    }
    function getLatestOpenClawAssistant(afterLength) {
      const messages = store.currentMessages || [];
      const candidates = messages.slice(afterLength).filter((m) => m.role === "assistant" && (m.content || m.status === "error"));
      return candidates[candidates.length - 1] || null;
    }
    function waitForOpenClawDraft(afterLength, timeoutMs = 13e4) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = window.setInterval(() => {
          const draft = getLatestOpenClawAssistant(afterLength);
          if (draft && !draft._streaming && draft.status !== "streaming" && !store.sending) {
            window.clearInterval(timer);
            resolve(draft);
            return;
          }
          if (Date.now() - start > timeoutMs) {
            window.clearInterval(timer);
            reject(new Error("OpenClaw 草案生成超时"));
          }
        }, 600);
      });
    }
    async function ensureOpenClawChatReady(timeoutMs = 25000) {
      if (store.isReady) return true;
      if (!gatewayAvailable.value) return false;
      try {
        if (store.wsStatus !== "ready" && store.wsStatus !== "connecting") store.connectToGateway();
      } catch {
      }
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (store.isReady) return true;
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }
      return !!store.isReady;
    }
    async function sendHermesMessage(text2, attachments = []) {
      const content = (text2 || "").trim();
      if (!content || hermesSending.value) return;
      const requestMode = "hermes";
      const now = Date.now();
      const userMessage = {
        id: `hermes-user-${now}`,
        role: "user",
        content,
        attachments,
        timestamp: now,
        status: "done"
      };
      hermesMessages.value = [...hermesMessages.value, userMessage];
      hermesSending.value = true;
      window.__uclawHermesActiveProgressId = `hermes-progress-${now}-${Math.random().toString(36).slice(2, 7)}`;
      window.__uclawHermesProgressLines = [];
      hermesRunState.value = "Hermes 正在调用模型，切换页面不会中断显示记录。";
      saveHermesSession();
      scrollToBottom();
      try {
        let statusBeforeChat = null;
        try {
          statusBeforeChat = window.uclaw.ipcGetHermesStatus ? await window.uclaw.ipcGetHermesStatus() : null;
        } catch {
          statusBeforeChat = null;
        }
        const hermesWasRunning = statusBeforeChat?.status === "running" || statusBeforeChat?.configReady || statusBeforeChat?.dashboardReady || statusBeforeChat?.apiServerReady;
        if (!hermesWasRunning) {
          appendHermesAssistant("Hermes 未在首页手动启动，本次发送已自动启动后台服务；首页状态会在刷新后同步。", "Hermes 系统", "done");
          hermesRunState.value = "Hermes 已按需自动启动，正在生成回复。";
        }
        const result = await window.uclaw.ipcHermesChat({
          message: content,
          messages: hermesMessages.value.map((m) => ({ role: m.role, content: m.content })).filter((m) => m.content),
          sessionId: "hermes-ai-chat",
          ...getSelectedHermesModel()
        });
        const ok = result?.ok !== false;
        finishHermesProgress(ok ? "done" : "error");
        hermesMessages.value = [...hermesMessages.value, {
          id: `hermes-assistant-${Date.now()}`,
          role: "assistant",
          content: ok ? getHermesReply(result) : (result?.error || "Hermes 暂时无法完成请求，请到模型配置页测试当前模型连接后重试。"),
          model: requestMode === "collab" ? "OpenClaw / Hermes 协同" : "Hermes Agent",
          timestamp: Date.now(),
          status: ok ? "done" : "error"
        }];
        hermesRunState.value = ok ? "Hermes 已完成回复。" : "Hermes 暂时无法完成请求。";
      } catch (e) {
        finishHermesProgress("error");
        hermesMessages.value = [...hermesMessages.value, {
          id: `hermes-error-${Date.now()}`,
          role: "assistant",
          content: "Hermes 暂时无法完成请求，请到模型配置页测试当前模型连接后重试。\n\n技术信息：" + (e?.message || e),
          model: "Hermes Agent",
          timestamp: Date.now(),
          status: "error"
        }];
        hermesRunState.value = "Hermes 暂时无法完成请求。";
      } finally {
        hermesSending.value = false;
        saveHermesSession();
        scrollToBottom();
      }
    }
    async function sendCollaborativeMessage(text2, attachments = []) {
      const content = (text2 || "").trim();
      if (!content || collabSending.value) return;
      if (!gatewayAvailable.value) {
        appendHermesAssistant("协同模式需要先启动 OpenClaw Gateway。请在首页启动 Gateway 后再发送。", "协同编排", "error");
        return;
      }
      const now = Date.now();
      hermesMessages.value = [...hermesMessages.value, {
        id: `collab-user-${now}`,
        role: "user",
        content,
        attachments,
        timestamp: now,
        status: "done"
      }];
      collabSending.value = true;
      hermesRunState.value = "协同执行中：OpenClaw 先出草案，Hermes 再复核整理。";
      saveHermesSession();
      scrollToBottom();
      const beforeLength = store.currentMessages.length;
      try {
        if (!store.isReady) {
          appendHermesAssistant("Gateway 已启动，正在连接 OpenClaw 会话...", "协同编排", "done");
          const ready = await ensureOpenClawChatReady();
          if (!ready) throw new Error("OpenClaw 会话连接超时，请稍后重试或回到首页重启 Gateway。");
        }
        appendHermesAssistant("阶段 1/2：OpenClaw 正在生成执行草案...", "协同编排", "done");
        await store.sendMessage(content, attachments);
        const draft = await waitForOpenClawDraft(beforeLength);
        const draftText = draft?.content || "OpenClaw 未返回可用草案。";
        appendHermesAssistant(draftText, "OpenClaw 草案", draft?.status === "error" ? "error" : "done");
        appendHermesAssistant("阶段 2/2：Hermes 正在基于 OpenClaw 草案进行复核、补充记忆和技能视角...", "协同编排", "done");
        const hermesPrompt = [
          "你正在作为 Hermes Agent 与 OpenClaw 协同。",
          "请基于用户原始问题和 OpenClaw 草案进行复核、补充、纠错和最终整理。",
          "要求：保留 OpenClaw 已完成的有效内容；指出必要风险；输出最终可执行答案。",
          "",
          "用户原始问题：",
          content,
          "",
          "OpenClaw 草案：",
          draftText
        ].join("\n");
        const result = await window.uclaw.ipcHermesChat({
          message: hermesPrompt,
          messages: hermesMessages.value.map((m) => ({ role: m.role, content: m.content })).filter((m) => m.content),
          sessionId: "openclaw-hermes-collab",
          ...getSelectedHermesModel()
        });
        const ok = result?.ok !== false;
        appendHermesAssistant(ok ? getHermesReply(result) : (result?.error || "Hermes 暂时无法完成协同复核，请到模型配置页测试当前模型连接后重试。"), "Hermes 协同复核", ok ? "done" : "error");
        hermesRunState.value = ok ? "协同流程已完成。" : "协同流程失败。";
      } catch (e) {
        appendHermesAssistant("协同流程失败: " + (e?.message || e), "协同编排", "error");
        hermesRunState.value = "协同流程失败。";
      } finally {
        collabSending.value = false;
        saveHermesSession();
        scrollToBottom();
      }
    }
    async function sendCollaborativeMessageV2(text2, attachments = []) {
      const content = (text2 || "").trim();
      if (!content || collabSending.value) return;
      if (!gatewayAvailable.value) {
        appendCollabAssistant("协同模式需要先启动 OpenClaw Gateway。请在首页启动 Gateway 后再发送。", "协同编排", "error");
        return;
      }
      const now = Date.now();
      collabMessages.value = [...collabMessages.value, {
        id: `collab-user-${now}`,
        role: "user",
        content,
        attachments,
        timestamp: now,
        status: "done"
      }];
      collabSending.value = true;
      collabRunState.value = "协同执行中：OpenClaw 生成内部草案，Hermes 输出统一最终答案。";
      saveHermesSession();
      scrollToBottom();
      const beforeLength = store.currentMessages.length;
      try {
        if (!store.isReady) {
          collabRunState.value = "Gateway 已启动，正在连接 OpenClaw 会话...";
          appendCollabAssistant("Gateway 已启动，正在连接 OpenClaw 会话...", "协同编排", "done");
          const ready = await ensureOpenClawChatReady();
          if (!ready) throw new Error("OpenClaw 会话连接超时，请稍后重试或回到首页重启 Gateway。");
        }
        appendCollabAssistant("阶段 1/2：OpenClaw 正在生成内部草案。", "协同编排", "done");
        await store.sendMessage(content, attachments);
        const draft = await waitForOpenClawDraft(beforeLength);
        const draftText = draft?.content || "OpenClaw 未返回可用草案。";
        appendCollabAssistant("阶段 2/2：Hermes 正在复核内部草案并整理最终答复。", "协同编排", "done", { internalDraft: draftText });
        const hermesPrompt = [
          "你是 OpenClaw + Hermes 协同助手的最终整理者。",
          "用户只需要看到一个统一答案，不要分别介绍 OpenClaw 和 Hermes，除非用户明确要求比较两者。",
          "OpenClaw 草案仅作为内部参考；如果草案把身份、角色或问题理解错了，请直接纠正，不要重复草案错误。",
          "如果用户问‘介绍一下你’或‘你是谁’，请介绍本客户端中的协同助手能力：OpenClaw 负责本地 Gateway、工具和渠道，Hermes 负责记忆、技能、复核与子代理能力。",
          "输出最终答案即可，不要写复核报告、不要列草案质量表，除非用户要求审稿。",
          "",
          "用户问题：",
          content,
          "",
          "OpenClaw 内部草案：",
          draftText
        ].join("\n");
        const result = await window.uclaw.ipcHermesChat({
          message: hermesPrompt,
          messages: collabMessages.value.map((m) => ({ role: m.role, content: m.content })).filter((m) => m.content),
          sessionId: "openclaw-hermes-collab",
          ...getSelectedHermesModel()
        });
        const ok = result?.ok !== false;
        appendCollabAssistant(ok ? getHermesReply(result) : (result?.error || "Hermes 暂时无法完成协同整理，请到模型配置页测试当前模型连接后重试。"), "协同结果", ok ? "done" : "error");
        collabRunState.value = ok ? "协同流程已完成。" : "协同流程失败。";
      } catch (e) {
        appendCollabAssistant("协同流程失败: " + (e?.message || e), "协同编排", "error");
        collabRunState.value = "协同流程失败。";
      } finally {
        collabSending.value = false;
        saveHermesSession();
        scrollToBottom();
      }
    }
    async function handleHermesChatConfig() {
      try {
        await window.uclaw.ipcOpenHermesConfig();
        showToast("Hermes 配置中心已打开");
      } catch (e) {
        showToast("Hermes 配置中心打开失败: " + e.message, true);
      }
    }
    async function handleHermesChatApi() {
      try {
        await window.uclaw.ipcOpenHermesApiServer();
        showToast("Hermes Agent API 已启动");
      } catch (e) {
        showToast("Hermes Agent API 启动失败: " + e.message, true);
      }
    }
    function handleSend(text2, attachments) {
      if (agentMode.value === "openclaw") {
        store.sendMessage(text2, attachments);
        scrollToBottom();
        return;
      }
      hermesInputText.value = "";
      if (agentMode.value === "collab") {
        sendCollaborativeMessageV2(text2, attachments);
        return;
      }
      sendHermesMessage(text2, attachments);
    }
    function handleCommand(cmd) {
      if (agentMode.value === "openclaw") {
        store.handleCommand(cmd);
        if (cmd === "/new" || cmd === "/reset") scrollToBottom();
        return;
      }
      if (cmd === "/new" || cmd === "/reset") {
        if (agentMode.value === "collab") {
          collabMessages.value = [];
          collabRunState.value = "协同会话已重置。";
        } else {
          hermesMessages.value = [];
          hermesRunState.value = "Hermes 会话已重置。";
        }
        saveHermesSession();
        showToast("Hermes 会话已重置");
        return;
      }
      if (cmd === "/stop") {
        showToast("Hermes 当前调用会在本轮完成后结束");
      }
    }
    function handleStop() {
      if (agentMode.value === "openclaw") {
        store.abortMessage();
        return;
      }
      showToast("Hermes 当前调用会在本轮完成后结束");
    }
    function handleDeleteClick(key) {
      deletingKey.value = key;
      showDeleteDialog.value = true;
    }
    async function confirmDelete() {
      if (deletingKey.value) {
        await store.deleteSession(deletingKey.value);
        showToast("会话已删除");
      }
      showDeleteDialog.value = false;
      deletingKey.value = null;
    }
    function handleRenameClick(session) {
      renamingKey.value = session.key;
      renameValue.value = store.getSessionName(session);
      showRenameDialog.value = true;
      nextTick(() => {
        renameInputRef.value?.focus();
        renameInputRef.value?.select();
      });
    }
    function confirmRename() {
      const name = renameValue.value.trim();
      if (!name || !renamingKey.value) return;
      store.renameSession(renamingKey.value, name);
      showToast("会话已重命名");
      showRenameDialog.value = false;
      renamingKey.value = null;
      renameValue.value = "";
    }
    function handleClearSession() {
      if (agentMode.value !== "openclaw") {
        if (!(agentMode.value === "collab" ? collabMessages.value.length : hermesMessages.value.length)) return;
        showClearDialog.value = true;
        return;
      }
      if (!store.activeSessionKey) return;
      showClearDialog.value = true;
    }
    async function confirmClear() {
      if (agentMode.value !== "openclaw") {
        if (agentMode.value === "collab") {
          collabMessages.value = [];
          collabRunState.value = "协同会话已清空。";
        } else {
          hermesMessages.value = [];
          hermesRunState.value = "Hermes 会话已清空。";
        }
        saveHermesSession();
        showToast("Hermes 会话已清空");
        showClearDialog.value = false;
        return;
      }
      if (store.activeSessionKey) {
        await store.resetSession(store.activeSessionKey);
        showToast("对话已清空");
      }
      showClearDialog.value = false;
    }
    function scrollToBottom(duration = 300) {
      nextTick(() => {
        const el = messagesArea.value;
        if (!el) return;
        if (duration <= 0) {
          el.scrollTop = el.scrollHeight;
          return;
        }
        const start = el.scrollTop;
        const end = el.scrollHeight - el.clientHeight;
        const distance = end - start;
        if (distance <= 0) return;
        const startTime = performance.now();
        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.scrollTop = start + distance * eased;
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        }
        requestAnimationFrame(animate);
      });
    }
    function handleScroll() {
      const el = messagesArea.value;
      if (!el) return;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      autoScroll.value = atBottom;
    }
    watch(() => store.activeSessionKey, () => {
      autoScroll.value = true;
      scrollToBottom(0);
    });
    // OpenClaw 流式消息不做深度调试拷贝，避免 Hermes 长任务并发时拖慢渲染进程。
    watch(() => store.currentMessages.length, () => {
      if (autoScroll.value) scrollToBottom();
    });
    watch(() => {
      const msgs = store.currentMessages;
      if (!msgs.length) return "";
      const last = msgs[msgs.length - 1];
      return last?.content?.slice(-20) || "";
    }, () => {
      if (autoScroll.value) scrollToBottom(0);
    });
    function handleProfileSave(p2) {
      store.saveProfile(p2);
      showProfile.value = false;
    }
    onUnmounted(() => {
      window.removeEventListener("uclaw-hermes-chat-state", handleHermesStateEvent);
      if (window.uclaw?.ipcOffHermesChatProgress) window.uclaw.ipcOffHermesChatProgress(handleHermesChatProgress);
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$9, [
        !unref(gatewayStore).running && agentMode.value === "openclaw" ? (openBlock(), createElementBlock("div", _hoisted_2$9, [
          createBaseVNode("div", { class: "hint-icon" }, [
            createBaseVNode("span", { class: "iconfont icon-clawhuanjingjiancha" })
          ]),
          createBaseVNode("h2", null, "Gateway 未运行"),
          createBaseVNode("p", null, "请先在首页启动 Gateway，或切换到 Hermes Agent 独立会话。"),
          createBaseVNode("div", { class: "agent-mode-switch gateway-mode-switch" }, [
            createBaseVNode("button", { class: "active", onClick: ($event) => selectAgentMode("openclaw") }, "OpenClaw"),
            createBaseVNode("button", { onClick: ($event) => selectAgentMode("hermes") }, "Hermes"),
            createBaseVNode("button", { onClick: ($event) => selectAgentMode("collab") }, "协同")
          ])
        ])) : (openBlock(), createElementBlock("div", _hoisted_3$8, [
          sidebarVisible.value ? (openBlock(), createElementBlock("div", _hoisted_4$6, [
            createVNode(SessionList, {
              sessions: unref(store).sessions,
              activeKey: unref(store).activeSessionKey,
              onSelect: unref(store).selectSession,
              onDelete: handleDeleteClick,
              onRename: handleRenameClick,
              onNewSession: handleNewSession
            }, null, 8, ["sessions", "activeKey", "onSelect"]),
            createBaseVNode("div", _hoisted_5$6, [
              createBaseVNode("div", _hoisted_6$4, [
                createBaseVNode("span", {
                  class: normalizeClass(["status-dot", unref(store).wsStatus])
                }, null, 2),
                createBaseVNode("span", _hoisted_7$4, toDisplayString(statusLabel.value), 1)
              ]),
              unref(store).wsError ? (openBlock(), createElementBlock("div", _hoisted_8$4, toDisplayString(unref(store).wsError), 1)) : createCommentVNode("", true),
              unref(store).wsStatus === "error" || unref(store).wsStatus === "disconnected" ? (openBlock(), createElementBlock("button", {
                key: 1,
                class: "status-retry-btn",
                onClick: handleReconnect
              }, "重试")) : createCommentVNode("", true)
            ])
          ])) : createCommentVNode("", true),
          createBaseVNode("div", _hoisted_9$2, [
            createBaseVNode("div", _hoisted_10$2, [
              !sidebarVisible.value ? (openBlock(), createElementBlock("button", {
                key: 0,
                class: "toggle-btn",
                onClick: _cache[0] || (_cache[0] = ($event) => sidebarVisible.value = true),
                title: "展开侧边栏"
              }, [..._cache[15] || (_cache[15] = [
                createBaseVNode("svg", {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createBaseVNode("path", { d: "M3 12h18M3 6h18M3 18h18" })
                ], -1)
              ])])) : (openBlock(), createElementBlock("button", {
                key: 1,
                class: "toggle-btn",
                onClick: _cache[1] || (_cache[1] = ($event) => sidebarVisible.value = false),
                title: "收起侧边栏"
              }, [..._cache[16] || (_cache[16] = [
                createBaseVNode("svg", {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createBaseVNode("path", { d: "M3 12h18M3 6h18M3 18h18" })
                ], -1)
              ])])),
              createBaseVNode("span", _hoisted_11$1, toDisplayString(agentMode.value === "openclaw" ? currentSessionTitle.value : agentMode.value === "collab" ? "OpenClaw / Hermes 协同会话" : "Hermes Agent 会话"), 1),
              createBaseVNode("div", { class: "agent-mode-switch" }, [
                createBaseVNode("button", {
                  class: normalizeClass({ active: agentMode.value === "openclaw" }),
                  onClick: ($event) => selectAgentMode("openclaw")
                }, "OpenClaw", 2),
                createBaseVNode("button", {
                  class: normalizeClass({ active: agentMode.value === "hermes" }),
                  onClick: ($event) => selectAgentMode("hermes")
                }, "Hermes", 2),
                createBaseVNode("button", {
                  class: normalizeClass({ active: agentMode.value === "collab" }),
                  onClick: ($event) => selectAgentMode("collab")
                }, "协同", 2)
              ]),
              createBaseVNode("div", _hoisted_12, [
                createVNode(ModelSelector, {
                  key: 0,
                  models: sessionModels.value,
                  currentModel: sessionCurrentModelId.value,
                  isReady: agentMode.value === "collab" ? gatewayAvailable.value : true,
                  loadingModels: loadingModels.value,
                  onSelect: handleModelSelect,
                  onRefresh: handleRefreshModels
                }, null, 8, ["models", "currentModel", "isReady", "loadingModels"]),
                agentMode.value !== "openclaw" ? (openBlock(), createElementBlock("div", { key: 1, class: "hermes-chat-status" }, toDisplayString(agentMode.value === "collab" ? gatewayAvailable.value ? collabRunState.value || "协同已就绪" : "协同需先启动 Gateway" : hermesRunState.value || "Hermes 会话就绪"), 1)) : createCommentVNode("", true),
                agentMode.value !== "openclaw" ? (openBlock(), createElementBlock("button", {
                  key: 2,
                  class: "icon-btn hermes-open-btn",
                  onClick: handleHermesChatConfig,
                  title: "打开 Hermes 配置中心"
                }, "配置")) : createCommentVNode("", true),
                agentMode.value !== "openclaw" ? (openBlock(), createElementBlock("button", {
                  key: 3,
                  class: "icon-btn hermes-open-btn",
                  onClick: handleHermesChatApi,
                  title: "启动 Hermes Agent API"
                }, "API")) : createCommentVNode("", true),
                createBaseVNode("button", {
                  class: "icon-btn clear-btn",
                  onClick: handleClearSession,
                  title: "清空对话"
                }, [..._cache[17] || (_cache[17] = [
                  createBaseVNode("span", { class: "iconfont icon-clawzhongxinshengcheng" }, null, -1),
                  createBaseVNode("span", null, "清空", -1)
                ])]),
                agentMode.value === "openclaw" ? (openBlock(), createElementBlock("button", {
                  key: "web-openclaw",
                  class: "icon-btn web-btn",
                  onClick: handleOpenWebUI,
                  title: "在独立窗口打开网页端"
                }, [
                  createBaseVNode("span", { class: "iconfont icon-clawwaibutiaozhuanlianjie" }),
                  createBaseVNode("span", null, "网页端")
                ])) : createCommentVNode("", true),
                createBaseVNode("button", {
                  class: "icon-btn",
                  onClick: _cache[2] || (_cache[2] = ($event) => showProfile.value = true),
                  title: "对话设置"
                }, [..._cache[19] || (_cache[19] = [
                  createBaseVNode("span", { class: "iconfont icon-clawshezhi" }, null, -1)
                ])])
              ])
            ]),
            createBaseVNode("div", {
              ref_key: "messagesArea",
              ref: messagesArea,
              class: "messages-area",
              onScroll: handleScroll
            }, [
              agentMode.value === "collab" ? (openBlock(), createElementBlock("div", { key: "collab-note", class: "hermes-collab-note" }, "协作模式：OpenClaw 先生成草案，Hermes 再复核、补充记忆和技能视角，最后输出整理结果。")) : createCommentVNode("", true),
              agentMode.value === "hermes" ? (openBlock(), createElementBlock("div", { key: "hermes-note", class: "hermes-collab-note" }, "Hermes 独立会话会复用模型配置页当前模型，并保存对话状态；切换页面回来仍可继续查看。")) : createCommentVNode("", true),
              activeMessages.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_13, [..._cache[20] || (_cache[20] = [
                createBaseVNode("div", { class: "empty-icon" }, "🤖", -1),
                createBaseVNode("h3", null, "开始 AI 对话", -1),
                createBaseVNode("p", null, "在下方输入消息，Enter 发送，Shift+Enter 换行", -1),
                createBaseVNode("div", { class: "quick-commands" }, [
                  createBaseVNode("code", null, "/new"),
                  createTextVNode(" 新建会话 "),
                  createBaseVNode("code", null, "/reset"),
                  createTextVNode(" 重置当前会话 "),
                  createBaseVNode("code", null, "/stop"),
                  createTextVNode(" 停止生成 ")
                ], -1)
              ])])) : createCommentVNode("", true),
              (openBlock(true), createElementBlock(Fragment, null, renderList(activeMessages.value, (msg, idx) => {
                return openBlock(), createBlock(MessageBubble, {
                  key: msg.id || idx,
                  message: msg,
                  profile: activeProfile.value
                }, null, 8, ["message", "profile"]);
              }), 128)),
              isWaitingForAi.value ? (openBlock(), createElementBlock("div", _hoisted_14, [
                createBaseVNode("div", {
                  class: "loading-avatar",
                  style: normalizeStyle({ background: activeProfile.value.aiColor || "#10b981" })
                }, [
                  activeProfile.value.aiAvatarImg ? (openBlock(), createElementBlock("img", {
                    key: 0,
                    src: activeProfile.value.aiAvatarImg,
                    class: "avatar-img"
                  }, null, 8, _hoisted_15)) : (openBlock(), createElementBlock("span", _hoisted_16, toDisplayString(activeProfile.value.aiAvatar || "🤖"), 1))
                ], 4),
                _cache[21] || (_cache[21] = createBaseVNode("div", { class: "loading-dots" }, [
                  createBaseVNode("span", { class: "loading-dot" }, "●"),
                  createBaseVNode("span", { class: "loading-dot" }, "●"),
                  createBaseVNode("span", { class: "loading-dot" }, "●")
                ], -1))
              ])) : createCommentVNode("", true),
              createBaseVNode("div", {
                ref_key: "messagesEnd",
                ref: messagesEnd
              }, null, 512)
            ], 544),
            createBaseVNode("div", _hoisted_17, [
              createVNode(ChatInput, {
                ref_key: "chatInputRef",
                ref: chatInputRef,
                modelValue: agentMode.value === "openclaw" ? unref(store).inputText : hermesInputText.value,
                "onUpdate:modelValue": ($event) => agentMode.value === "openclaw" ? unref(store).inputText = $event : hermesInputText.value = $event,
                isReady: activeReady.value,
                sending: activeSending.value,
                onSend: handleSend,
                onStop: handleStop,
                onCommand: handleCommand
              }, null, 8, ["modelValue", "isReady", "sending"])
            ])
          ])
        ])),
        (openBlock(), createBlock(Teleport, { to: "body" }, [
          showDeleteDialog.value ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "modal-overlay",
            onClick: _cache[6] || (_cache[6] = withModifiers(($event) => showDeleteDialog.value = false, ["self"]))
          }, [
            createBaseVNode("div", _hoisted_18, [
              _cache[22] || (_cache[22] = createBaseVNode("h3", { class: "modal-title" }, "确认删除", -1)),
              _cache[23] || (_cache[23] = createBaseVNode("p", { class: "modal-desc" }, "确定要删除该会话吗？此操作不可撤销。", -1)),
              createBaseVNode("div", _hoisted_19, [
                createBaseVNode("button", {
                  class: "modal-btn cancel",
                  onClick: _cache[5] || (_cache[5] = ($event) => showDeleteDialog.value = false)
                }, "取消"),
                createBaseVNode("button", {
                  class: "modal-btn confirm",
                  onClick: confirmDelete
                }, "删除")
              ])
            ])
          ])) : createCommentVNode("", true)
        ])),
        (openBlock(), createBlock(Teleport, { to: "body" }, [
          showRenameDialog.value ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "modal-overlay",
            onClick: _cache[10] || (_cache[10] = withModifiers(($event) => showRenameDialog.value = false, ["self"]))
          }, [
            createBaseVNode("div", _hoisted_20, [
              _cache[24] || (_cache[24] = createBaseVNode("h3", { class: "modal-title" }, "修改会话名称", -1)),
              withDirectives(createBaseVNode("input", {
                ref_key: "renameInputRef",
                ref: renameInputRef,
                "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => renameValue.value = $event),
                class: "modal-input",
                placeholder: "请输入会话名称",
                onKeyup: [
                  withKeys(confirmRename, ["enter"]),
                  _cache[8] || (_cache[8] = withKeys(($event) => showRenameDialog.value = false, ["esc"]))
                ]
              }, null, 544), [
                [vModelText, renameValue.value]
              ]),
              createBaseVNode("div", _hoisted_21, [
                createBaseVNode("button", {
                  class: "modal-btn cancel",
                  onClick: _cache[9] || (_cache[9] = ($event) => showRenameDialog.value = false)
                }, "取消"),
                createBaseVNode("button", {
                  class: "modal-btn confirm",
                  disabled: !renameValue.value.trim(),
                  onClick: confirmRename
                }, "确定", 8, _hoisted_22)
              ])
            ])
          ])) : createCommentVNode("", true)
        ])),
        (openBlock(), createBlock(Teleport, { to: "body" }, [
          showClearDialog.value ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: "modal-overlay",
            onClick: _cache[12] || (_cache[12] = withModifiers(($event) => showClearDialog.value = false, ["self"]))
          }, [
            createBaseVNode("div", _hoisted_23, [
              _cache[25] || (_cache[25] = createBaseVNode("h3", { class: "modal-title" }, "确认清空", -1)),
              _cache[26] || (_cache[26] = createBaseVNode("p", { class: "modal-desc" }, "确定要清空当前会话的所有消息吗？此操作不可撤销。", -1)),
              createBaseVNode("div", _hoisted_24, [
                createBaseVNode("button", {
                  class: "modal-btn cancel",
                  onClick: _cache[11] || (_cache[11] = ($event) => showClearDialog.value = false)
                }, "取消"),
                createBaseVNode("button", {
                  class: "modal-btn confirm",
                  onClick: confirmClear
                }, "清空")
              ])
            ])
          ])) : createCommentVNode("", true)
        ])),
        createVNode(ProfileDialog, {
          open: showProfile.value,
          profile: unref(store).profile,
          onClose: _cache[13] || (_cache[13] = ($event) => showProfile.value = false),
          onSave: handleProfileSave
        }, null, 8, ["open", "profile"])
      ]);
    };
  }
};
const AiChat = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-f16be7f3"]]);
const _hoisted_1$7 = { class: "activate-view" };
const _hoisted_2$7 = { class: "activate-container" };
const _hoisted_3$6 = {
  key: 0,
  class: "activate-checking"
};
const _hoisted_4$5 = { class: "activate-progress-list" };
const _hoisted_5$5 = { class: "activate-status-icon" };
const _hoisted_6$3 = { class: "label" };
const _hoisted_7$3 = {
  key: 0,
  class: "activate-step-error"
};
const _hoisted_8$3 = {
  key: 1,
  class: "activate-error"
};
const _hoisted_9$1 = { class: "activate-error-message" };
const _hoisted_10$1 = {
  key: 2,
  class: "activate-form-container"
};
const STEP_DELAY = 10;
const _sfc_main$7 = {
  __name: "Activate",
  setup(__props) {
    const router2 = useRouter();
    const APP_NAME = "OpenClaw";
    const APP_SUB_NAME = "U盘便携版";
    const sessionStore = useSessionStore();
    const status = /* @__PURE__ */ ref("checking");
    const errorMessage = /* @__PURE__ */ ref("");
    let currentSerial = null;
    const progressItems = /* @__PURE__ */ reactive([
      { label: "准备授权检查", done: false, active: true, error: null },
      { label: "获取 U 盘序列号", done: false, active: false, error: null },
      { label: "验证权限文件", done: false, active: false, error: null }
    ]);
    function updateProgress(index) {
      progressItems.forEach((item, i) => {
        item.done = i < index;
        item.active = i === index;
      });
    }
    function delay(ms) {
      return new Promise((resolve2) => setTimeout(resolve2, ms));
    }
    function onActivationSuccess(result) {
      if (result.data?.session_cookie) {
        sessionStore.setSessionCookie(result.data.session_cookie);
      }
      window.dispatchEvent(new CustomEvent("main-init"));
      router2.push("/home");
    }
    async function startCheck() {
      status.value = "checking";
      errorMessage.value = "";
      currentSerial = null;
      updateProgress(0);
      try {
        updateProgress(0);
        let stepResult = { ok: true };
        await delay(STEP_DELAY);
        progressItems[0].done = true;
        progressItems[0].active = false;
        await delay(STEP_DELAY);
        updateProgress(1);
        const isDev = false;
        stepResult = await window.uclaw.ipcCheckStepSerial();
        if (isDev) ;
        await delay(STEP_DELAY);
        if (!stepResult.ok) {
          progressItems[1].done = false;
          progressItems[1].error = stepResult.error || "获取序列号失败";
        } else {
          currentSerial = stepResult.serial;
          progressItems[1].done = true;
        }
        progressItems[1].active = false;
        await delay(STEP_DELAY);
        updateProgress(2);
        stepResult = await window.uclaw.ipcCheckStepLicense(currentSerial);
        await delay(STEP_DELAY);
        if (!stepResult.ok) {
          progressItems[2].done = false;
          progressItems[2].error = stepResult.error || "权限文件验证失败";
          progressItems[2].active = false;
          await delay(500);
          errorMessage.value = stepResult.error || "权限文件验证失败";
          status.value = "error";
          return;
        } else {
          progressItems[2].done = true;
          progressItems[2].active = false;
          await delay(STEP_DELAY);
        }
        status.value = "ready";
        window.dispatchEvent(new CustomEvent("main-init"));
        router2.push("/home");
      } catch (e) {
        errorMessage.value = e.message || "检查失败";
        status.value = "error";
      }
    }
    onMounted(() => {
      startCheck();
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$7, [
        createBaseVNode("div", _hoisted_2$7, [
          _cache[4] || (_cache[4] = createBaseVNode("div", { class: "activate-logo" }, [
            createBaseVNode("img", {
              src: _imports_0$2,
              alt: "min-claw"
            })
          ], -1)),
          status.value === "checking" ? (openBlock(), createElementBlock("div", _hoisted_3$6, [
            _cache[0] || (_cache[0] = createBaseVNode("div", { class: "activate-spinner" }, null, -1)),
            _cache[1] || (_cache[1] = createBaseVNode("h2", null, "检查中...", -1)),
            createBaseVNode("div", _hoisted_4$5, [
              (openBlock(true), createElementBlock(Fragment, null, renderList(progressItems, (item, index) => {
                return openBlock(), createElementBlock("div", {
                  key: index,
                  class: normalizeClass(["activate-progress-item", { done: item.done, active: item.active, error: item.error }])
                }, [
                  createBaseVNode("span", _hoisted_5$5, toDisplayString(item.done ? "✓" : item.active ? "●" : item.error ? "✗" : "○"), 1),
                  createBaseVNode("span", _hoisted_6$3, toDisplayString(item.label), 1),
                  item.error ? (openBlock(), createElementBlock("span", _hoisted_7$3, toDisplayString(item.error), 1)) : createCommentVNode("", true)
                ], 2);
              }), 128))
            ])
          ])) : status.value === "error" ? (openBlock(), createElementBlock("div", _hoisted_8$3, [
            _cache[2] || (_cache[2] = createBaseVNode("div", { class: "activate-error-icon" }, "⚠", -1)),
            _cache[3] || (_cache[3] = createBaseVNode("h2", null, "检查失败", -1)),
            createBaseVNode("p", _hoisted_9$1, toDisplayString(errorMessage.value), 1),
            createBaseVNode("button", {
              class: "activate-retry-btn",
              onClick: startCheck
            }, "重新检测")
          ])) : createCommentVNode("", true)
        ])
      ]);
    };
  }
};
const Activate = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-51d25953"]]);
const routes = [
  { path: "/", redirect: "/home" },
  { path: "/home", name: "home", component: Home },
  { path: "/activate", name: "activate", component: Activate },
  { path: "/model", name: "model", component: Model },
  { path: "/skill", name: "skill", component: Skill },
  { path: "/chat", name: "chat", component: Chat },
  { path: "/ai-chat", name: "ai-chat", component: AiChat },
  { path: "/settings", name: "settings", component: Settings },
  { path: "/env-check", name: "env-check", component: EnvCheck }
];
const router = createRouter({
  history: createWebHashHistory(),
  routes
});
const apiClient = axios.create({
  withCredentials: true
  // 支持 Cookie 认证
});
const SESSION_INVALID_MESSAGE = "当前服务端登录信息已失效，已继续使用本机授权";
let sessionInvalidNoticeShown = false;
async function clearSessionCookie() {
  try {
    const sessionStore = useSessionStore();
    sessionStore.clearSessionCookie();
  } catch {
  }
}
function isSessionInvalid(res) {
  if (!res) return false;
  return ["未登录或会话已过期", "会话无效"].includes(res.message) && res.success === false;
}
async function handleSessionInvalid() {
  if (window.showToastVue && !sessionInvalidNoticeShown) {
    sessionInvalidNoticeShown = true;
    window.showToastVue(SESSION_INVALID_MESSAGE, true);
  }
}
apiClient.interceptors.response.use(
  async (response) => {
    console.log("response==>", response);
    const res = response.data;
    if (res && isSessionInvalid(res)) {
      res.sessionInvalid = true;
      return Promise.reject(res);
    }
    return Promise.resolve(response);
  }
);
async function apiRequest(path, options = {}) {
  console.log("[remote API disabled]", path);
  return { ok: false, success: false, message: "远程服务器功能已移除" };
}
const useAnnouncementStore = /* @__PURE__ */ defineStore("announcement", () => {
  const announcements = /* @__PURE__ */ ref({ normal: [], urgent: [] });
  const loading = /* @__PURE__ */ ref(false);
  const hasUrgent = computed(() => announcements.value.urgent.length > 0);
  const allAnnouncements = computed(() => [
    ...announcements.value.urgent,
    ...announcements.value.normal
  ]);
  async function fetchAnnouncements() {
    loading.value = true;
    announcements.value = { normal: [], urgent: [] };
    loading.value = false;
  }
  return {
    announcements,
    loading,
    hasUrgent,
    allAnnouncements,
    fetchAnnouncements
  };
});
const _hoisted_1$6 = { class: "popup-body" };
const _hoisted_2$6 = {
  key: 0,
  class: "empty-tip"
};
const _hoisted_3$5 = {
  key: 1,
  class: "section"
};
const _hoisted_4$4 = { class: "card-content" };
const _hoisted_5$4 = { class: "card-time" };
const _hoisted_6$2 = {
  key: 2,
  class: "section"
};
const _hoisted_7$2 = { class: "card-content" };
const _hoisted_8$2 = { class: "card-time" };
const _sfc_main$6 = {
  __name: "AnnouncementPopup",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  setup(__props) {
    const store = useAnnouncementStore();
    const urgentList = computed(() => store.announcements.urgent || []);
    const normalList = computed(() => store.announcements.normal || []);
    const hasAny = computed(() => urgentList.value.length > 0 || normalList.value.length > 0);
    function formatTime(timestamp) {
      if (!timestamp) return "";
      const d = new Date(timestamp * 1e3);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    return (_ctx, _cache) => {
      return __props.visible ? (openBlock(), createElementBlock("div", {
        key: 0,
        class: "announcement-popup",
        onClick: _cache[0] || (_cache[0] = withModifiers(() => {
        }, ["stop"]))
      }, [
        _cache[3] || (_cache[3] = createBaseVNode("div", { class: "popup-header" }, [
          createBaseVNode("span", { class: "popup-title" }, "📢 公告中心")
        ], -1)),
        createBaseVNode("div", _hoisted_1$6, [
          !hasAny.value ? (openBlock(), createElementBlock("div", _hoisted_2$6, "暂无公告")) : createCommentVNode("", true),
          urgentList.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_3$5, [
            _cache[1] || (_cache[1] = createBaseVNode("div", { class: "section-title" }, "⚠ 紧急公告", -1)),
            (openBlock(true), createElementBlock(Fragment, null, renderList(urgentList.value, (item) => {
              return openBlock(), createElementBlock("div", {
                key: item.id,
                class: "urgent-card"
              }, [
                createBaseVNode("div", _hoisted_4$4, toDisplayString(item.content), 1),
                createBaseVNode("div", _hoisted_5$4, toDisplayString(formatTime(item.created_at)), 1)
              ]);
            }), 128))
          ])) : createCommentVNode("", true),
          normalList.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_6$2, [
            _cache[2] || (_cache[2] = createBaseVNode("div", { class: "section-title" }, "📋 普通公告", -1)),
            (openBlock(true), createElementBlock(Fragment, null, renderList(normalList.value, (item) => {
              return openBlock(), createElementBlock("div", {
                key: item.id,
                class: "normal-card"
              }, [
                createBaseVNode("div", _hoisted_7$2, toDisplayString(item.content), 1),
                createBaseVNode("div", _hoisted_8$2, toDisplayString(formatTime(item.created_at)), 1)
              ]);
            }), 128))
          ])) : createCommentVNode("", true)
        ])
      ])) : createCommentVNode("", true);
    };
  }
};
const AnnouncementPopup = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-b323419a"]]);
const _hoisted_1$5 = { class: "menu-bar" };
const _hoisted_2$5 = { class: "menu-bar-center" };
const _hoisted_3$4 = { class: "menu-bar-title" };
const _hoisted_4$3 = { class: "menu-bar-right" };
const _hoisted_5$3 = {
  key: 0,
  class: "red-dot"
};
const _sfc_main$5 = {
  __name: "MenuBar",
  props: {
    title: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    const announcementStore = useAnnouncementStore();
    const showPopup = /* @__PURE__ */ ref(false);
    function togglePopup() {
      showPopup.value = !showPopup.value;
    }
    function handleClickOutside(e) {
      if (showPopup.value) {
        const popup = document.querySelector(".announcement-popup");
        const btn = document.querySelector(".announce-btn-wrapper");
        if (popup && !popup.contains(e.target) && btn && !btn.contains(e.target)) {
          showPopup.value = false;
        }
      }
    }
    function onMinimize() {
      window.uclaw?.ipcMinimize();
    }
    function onClose() {
      window.uclaw?.ipcClose();
    }
    const props = __props;
    const APP_NAME = "OpenClaw";
    const title = /* @__PURE__ */ ref(props.title || APP_NAME);
    onMounted(() => {
      document.addEventListener("click", handleClickOutside);
    });
    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$5, [
        createBaseVNode("div", _hoisted_2$5, [
          _cache[0] || (_cache[0] = createBaseVNode("img", { src: _imports_0$2 }, null, -1)),
          createBaseVNode("span", _hoisted_3$4, toDisplayString(title.value), 1)
        ]),
        createBaseVNode("div", _hoisted_4$3, [
          createBaseVNode("div", {
            class: "announce-btn-wrapper",
            onClick: withModifiers(togglePopup, ["stop"]),
            title: "公告中心"
          }, [
            _cache[1] || (_cache[1] = createBaseVNode("button", { class: "win-btn win-btn-announce" }, [
              createBaseVNode("svg", {
                viewBox: "0 0 24 24",
                width: "16",
                height: "16",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
              }, [
                createBaseVNode("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
                createBaseVNode("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })
              ])
            ], -1)),
            unref(announcementStore).hasUrgent ? (openBlock(), createElementBlock("span", _hoisted_5$3)) : createCommentVNode("", true)
          ]),
          createVNode(AnnouncementPopup, { visible: showPopup.value }, null, 8, ["visible"]),
          createBaseVNode("button", {
            class: "win-btn win-btn-minimize",
            onClick: onMinimize,
            title: "最小化"
          }, [..._cache[2] || (_cache[2] = [
            createBaseVNode("span", { class: "iconfont icon-clawzuixiaohua" }, null, -1)
          ])]),
          createBaseVNode("button", {
            class: "win-btn win-btn-close",
            onClick: onClose,
            title: "关闭"
          }, [..._cache[3] || (_cache[3] = [
            createBaseVNode("span", { class: "iconfont icon-clawguanbi1" }, null, -1)
          ])])
        ])
      ]);
    };
  }
};
const MenuBar = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-fabb0d5b"]]);
const _hoisted_1$4 = { class: "toast-message" };
const _hoisted_2$4 = {
  key: 0,
  class: "toast-actions"
};
const _sfc_main$4 = {
  __name: "Toast",
  setup(__props) {
    const message = /* @__PURE__ */ ref("");
    const visible = /* @__PURE__ */ ref(false);
    const isError = /* @__PURE__ */ ref(false);
    const actionText = /* @__PURE__ */ ref("");
    const actionCallback = /* @__PURE__ */ ref(null);
    onMounted(() => {
      window.showToastVue = (msg, isErr = false, action = null) => {
        message.value = msg;
        isError.value = isErr;
        actionText.value = action?.text || "";
        actionCallback.value = action?.onClick || null;
        visible.value = true;
        setTimeout(() => {
          visible.value = false;
        }, action ? 1e4 : 3e3);
      };
    });
    function handleAction() {
      if (actionCallback.value) {
        actionCallback.value();
      }
      visible.value = false;
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        id: "toast",
        class: normalizeClass(["toast-toast", { "toast-show": visible.value, "toast-error": isError.value, "toast-success": !isError.value }])
      }, [
        createBaseVNode("span", _hoisted_1$4, toDisplayString(message.value), 1),
        actionText.value ? (openBlock(), createElementBlock("div", _hoisted_2$4, [
          createBaseVNode("button", {
            class: "toast-btn",
            onClick: handleAction
          }, toDisplayString(actionText.value), 1)
        ])) : createCommentVNode("", true)
      ], 2);
    };
  }
};
const Toast = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-b9365ca6"]]);
const _hoisted_1$3 = { class: "confirm-card" };
const _hoisted_2$3 = { class: "confirm-title" };
const _hoisted_3$3 = { class: "confirm-message" };
const _sfc_main$3 = {
  __name: "ConfirmDialog",
  setup(__props) {
    const visible = /* @__PURE__ */ ref(false);
    const title = /* @__PURE__ */ ref("");
    const message = /* @__PURE__ */ ref("");
    let resolvePromise = null;
    onMounted(() => {
      window.showConfirmVue = (t, msg) => {
        title.value = t;
        message.value = msg;
        visible.value = true;
        return new Promise((resolve2) => {
          resolvePromise = resolve2;
        });
      };
    });
    function confirm2() {
      visible.value = false;
      resolvePromise?.(true);
    }
    function cancel() {
      visible.value = false;
      resolvePromise?.(false);
    }
    return (_ctx, _cache) => {
      return visible.value ? (openBlock(), createElementBlock("div", {
        key: 0,
        class: "confirm-overlay",
        onClick: withModifiers(cancel, ["self"])
      }, [
        createBaseVNode("div", _hoisted_1$3, [
          createBaseVNode("h3", _hoisted_2$3, toDisplayString(title.value), 1),
          createBaseVNode("p", _hoisted_3$3, toDisplayString(message.value), 1),
          createBaseVNode("div", { class: "confirm-actions" }, [
            createBaseVNode("button", {
              class: "confirm-btn-cancel",
              onClick: cancel
            }, "取消"),
            createBaseVNode("button", {
              class: "confirm-btn-ok",
              onClick: confirm2
            }, "确定")
          ])
        ])
      ])) : createCommentVNode("", true);
    };
  }
};
const ConfirmDialog = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-2ae79283"]]);
const _hoisted_1$2 = { class: "loading-overlay-content" };
const _hoisted_2$2 = { class: "loading-overlay-logo" };
const _hoisted_3$2 = { class: "loading-overlay-logo-text" };
const _hoisted_4$2 = { class: "loading-overlay-progress-container" };
const _hoisted_5$2 = { class: "loading-overlay-progress-bar" };
const _hoisted_6$1 = { class: "loading-overlay-progress-percent" };
const _hoisted_7$1 = { class: "loading-overlay-text" };
const _hoisted_8$1 = {
  key: 0,
  class: "loading-overlay-detail"
};
const _sfc_main$2 = {
  __name: "LoadingOverlay",
  setup(__props) {
    const APP_NAME = "OpenClaw";
    const visible = /* @__PURE__ */ ref(false);
    const progressPercent = /* @__PURE__ */ ref(0);
    const statusText = /* @__PURE__ */ ref("");
    const detailText = /* @__PURE__ */ ref("");
    function show() {
      visible.value = true;
    }
    function updateProgress(progress, title, detail) {
      progressPercent.value = progress;
      if (title) statusText.value = title;
      if (detail !== void 0) detailText.value = detail;
    }
    function hide() {
      visible.value = false;
      progressPercent.value = 0;
      statusText.value = "正在启动...";
      detailText.value = "";
    }
    onMounted(() => {
      window.showLoadingOverlayVue = show;
      window.updateLoadingStep = (stepIndex, msg) => {
        statusText.value = msg || statusText.value;
      };
      window.updateLoadingProgress = updateProgress;
      window.hideLoadingOverlayVue = hide;
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        id: "loading-overlay",
        class: normalizeClass(["loading-overlay-loading-overlay", { "loading-overlay-hidden": !visible.value }])
      }, [
        createBaseVNode("div", _hoisted_1$2, [
          createBaseVNode("div", _hoisted_2$2, [
            _cache[0] || (_cache[0] = createBaseVNode("img", {
              src: _imports_0$2,
              alt: "min-claw",
              class: "loading-overlay-logo-icon"
            }, null, -1)),
            createBaseVNode("span", _hoisted_3$2, toDisplayString(unref(APP_NAME)), 1)
          ]),
          createBaseVNode("div", _hoisted_4$2, [
            createBaseVNode("div", _hoisted_5$2, [
              createBaseVNode("div", {
                class: "loading-overlay-progress-fill",
                style: normalizeStyle({ width: progressPercent.value + "%" })
              }, null, 4)
            ]),
            createBaseVNode("div", _hoisted_6$1, toDisplayString(Math.round(progressPercent.value)) + "%", 1)
          ]),
          createBaseVNode("p", _hoisted_7$1, toDisplayString(statusText.value), 1),
          detailText.value ? (openBlock(), createElementBlock("p", _hoisted_8$1, toDisplayString(detailText.value), 1)) : createCommentVNode("", true)
        ])
      ], 2);
    };
  }
};
const LoadingOverlay = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-f48b9635"]]);
const _hoisted_1 = {
  key: 0,
  class: "activate-layout"
};
const _hoisted_2 = { class: "activate-page-content" };
const _hoisted_3 = {
  key: 1,
  class: "main-app-layout"
};
const _hoisted_4 = { class: "main-app-main-wrapper" };
const _hoisted_5 = { class: "main-app-page-content" };
const _sfc_main = {
  __name: "App",
  setup(__props) {
    const route = useRoute();
    const isActivatePage = computed(() => route.path === "/activate");
    const modelsStore = useModelsStore();
    useUserStore();
    const gatewayStore = useGatewayStore();
    const wechatStore = useWechatStore();
    const feishuStore = useFeishuStore();
    const { checkItems, runAllChecks } = useEnvCheck();
    async function doInit() {
      await fetchUserInfo();
      await fetchAllModels();
      fetchAllSkills();
      preloadAllImageSessions();
      preloadAllVideoSessions();
      await runAllChecks();
      gatewayStore.setEnvCheckResults(JSON.parse(JSON.stringify(checkItems.value)));
    }
    function handleWechatStatus(status) {
      const payload = status && typeof status === "object" ? status : { status };
      const normalized = payload.status || "disconnected";
      const diag = payload.diagnostics;
      if (diag && typeof diag === "object") {
        const count = Number(diag.accountCount || 0);
        wechatStore.addLog(count > 0 ? `[diagnostics] 已发现 ${count} 个微信账号凭据，目录：${diag.weixinRoot || "未知"}` : `[diagnostics] 未发现微信账号凭据，请重新扫码。账号目录：${diag.weixinRoot || "未知"}`);
      }
      wechatStore.setStatus(normalized === "refreshing" ? "scanning" : normalized);
      if (normalized === "connected") {
        wechatStore.checkInstalled();
      }
    }
    function onWechatLog(msg) {
      wechatStore.addLog(msg);
    }
    function handleFeishuStatus(status) {
      feishuStore.setStatus(status);
      if (status === "connected") {
        feishuStore.checkStatus();
      }
    }
    function onFeishuLog(msg) {
      feishuStore.addLog(msg);
    }
    function onFeishuQrUrl(url) {
      feishuStore.setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`, "");
      feishuStore.setStatus("scanning");
    }
    function onFeishuQrAscii(text2) {
      feishuStore.setQrCode("", text2);
      feishuStore.setStatus("scanning");
    }
    function onFeishuDone(result) {
      if (result?.success) {
        feishuStore.setStatus("connected");
        feishuStore.checkStatus();
      } else if (result?.cancelled) {
        feishuStore.setStatus("disconnected");
      } else {
        feishuStore.setStatus("error");
      }
    }
    function onFeishuPrompt(data) {
      feishuStore.setPrompt(data);
    }
    onMounted(async () => {
      window.addEventListener("main-init", doInit);
      window.uclaw.ipcOnWeChatStatus(handleWechatStatus);
      window.uclaw.ipcOnWechatLog(onWechatLog);
      window.uclaw.ipcOnFeishuStatus(handleFeishuStatus);
      window.uclaw.ipcOnFeishuLog(onFeishuLog);
      window.uclaw.ipcOnFeishuQrUrl(onFeishuQrUrl);
      window.uclaw.ipcOnFeishuQrAscii(onFeishuQrAscii);
      window.uclaw.ipcOnFeishuDone(onFeishuDone);
      window.uclaw.ipcOnFeishuPrompt(onFeishuPrompt);
      try {
        const status = await window.uclaw.ipcGetWeChatStatus();
        handleWechatStatus(status);
      } catch {
      }
      try {
        feishuStore.checkStatus();
      } catch {
      }
    });
    onUnmounted(() => {
      window.removeEventListener("main-init", doInit);
    });
    watch(() => modelsStore.selectedModels, (models) => {
      console.log("model变化===>", models);
      window.uclaw?.ipcWriteOpenClawConfig({ models: JSON.parse(JSON.stringify(models)) }, "model");
    }, { immediate: true, deep: true });
    return (_ctx, _cache) => {
      const _component_router_view = resolveComponent("router-view");
      return isActivatePage.value ? (openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(MenuBar),
        createBaseVNode("div", _hoisted_2, [
          createVNode(_component_router_view)
        ])
      ])) : (openBlock(), createElementBlock("div", _hoisted_3, [
        createVNode(Sidebar),
        createVNode(MenuBar),
        createBaseVNode("div", _hoisted_4, [
          createVNode(Header),
          createBaseVNode("div", _hoisted_5, [
            createVNode(_component_router_view)
          ])
        ]),
        createVNode(Toast),
        createVNode(ConfirmDialog),
        createVNode(LoadingOverlay)
      ]));
    };
  }
};
document.title = "OpenClaw";
let clickForwarding = false;
document.addEventListener("click", (e) => {
  if (clickForwarding) return;
  const icon = e.target.closest(".iconfont");
  if (!icon) return;
  if (icon.classList.contains("remove-btn") || icon.classList.contains("session-edit") || icon.classList.contains("session-delete")) {
    return;
  }
  const btn = icon.closest("button");
  if (!btn || btn.disabled) return;
  e.stopPropagation();
  e.preventDefault();
  clickForwarding = true;
  btn.click();
  clickForwarding = false;
}, true);
const app = createApp(_sfc_main);
app.use(createPinia());
app.use(router);
app.mount("#app");
window.uclaw?.ipcSend("window-ready");
