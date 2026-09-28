/**
 * Entity-level diff between two JSON API responses.
 *
 * Arrays whose items all carry a stable id become per-entity ops
 * (`upsert` / `remove` / `order`); other changed fields become `set`.
 * The client applies the same ops to its cached copy (see applyOps), so
 * `applyOps(prev, diff(prev, next))` must deep-equal `next`.
 */

const ID_FIELDS = [
  "_id",
  "id",
  "inspectionId",
  "pickupId",
  "requestNumber",
  "orderId",
  "farmerId",
  "batchId",
  "sku",
];

const ENTITY_ALIASES = {
  data: "item",
  items: "item",
  rows: "item",
  riders: "rider",
  orders: "order",
  pickups: "pickup",
  farmers: "farmer",
  requests: "inventory_request",
  inventory: "inventory_item",
  suggestions: "route_suggestion",
  openWindowOrders: "order",
  transactions: "transaction",
  earnings: "earning",
  products: "product",
  shifts: "shift",
  gigs: "gig",
  stores: "store",
};

export function idOf(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  for (const field of ID_FIELDS) {
    const value = item[field];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return null;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isKeyedList(list) {
  if (!Array.isArray(list)) return false;
  const seen = new Set();
  for (const item of list) {
    const id = idOf(item);
    if (id === null || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function entityFor(path, fallback) {
  const field = path.length ? path[path.length - 1] : "";
  if (!field) return fallback || "item";
  if (ENTITY_ALIASES[field]) return ENTITY_ALIASES[field];
  return field.endsWith("s") ? field.slice(0, -1) : field;
}

function getAt(root, path) {
  return path.reduce((node, key) => (node == null ? undefined : node[key]), root);
}

function setAt(root, path, value) {
  if (!path.length) return value;
  const next = Array.isArray(root) ? [...root] : { ...(root || {}) };
  const [head, ...rest] = path;
  next[head] = rest.length ? setAt(next[head], rest, value) : value;
  if (value === undefined && !rest.length) delete next[head];
  return next;
}

function applyListOps(list, ops) {
  const out = Array.isArray(list) ? [...list] : [];
  for (const op of ops) {
    if (op.op === "remove") {
      const at = out.findIndex((item) => idOf(item) === op.id);
      if (at >= 0) out.splice(at, 1);
    } else if (op.op === "upsert") {
      const at = out.findIndex((item) => idOf(item) === op.id);
      if (at >= 0) out[at] = op.data;
      else out.splice(Math.min(Math.max(op.index ?? out.length, 0), out.length), 0, op.data);
    } else if (op.op === "order") {
      const byId = new Map(out.map((item) => [idOf(item), item]));
      return op.ids.map((id) => byId.get(id)).filter(Boolean);
    }
  }
  return out;
}

export function applyOps(data, ops = []) {
  let root = data;
  const listGroups = new Map();
  const flushList = (key) => {
    const group = listGroups.get(key);
    if (!group) return;
    root = setAt(root, group.path, applyListOps(getAt(root, group.path), group.ops));
    listGroups.delete(key);
  };

  for (const op of ops) {
    if (op.op === "replace") {
      listGroups.clear();
      root = op.data;
    } else if (op.op === "set") {
      listGroups.forEach((_group, key) => flushList(key));
      root = setAt(root, op.path, op.data);
    } else {
      const key = JSON.stringify(op.path || []);
      if (!listGroups.has(key)) listGroups.set(key, { path: op.path || [], ops: [] });
      listGroups.get(key).ops.push(op);
    }
  }
  listGroups.forEach((_group, key) => flushList(key));
  return root;
}

function diffList(prev, next, path, ops, entityName) {
  const entity = entityFor(path, entityName);
  const prevById = new Map(prev.map((item) => [idOf(item), item]));
  const nextIds = new Set();
  const listOps = [];

  next.forEach((item, index) => {
    const id = idOf(item);
    nextIds.add(id);
    const before = prevById.get(id);
    if (!before) {
      listOps.push({ op: "upsert", path, id, index, entity, type: `${entity}_created`, data: item });
    } else if (!same(before, item)) {
      listOps.push({ op: "upsert", path, id, index, entity, type: `${entity}_updated`, data: item });
    }
  });
  prev.forEach((item) => {
    const id = idOf(item);
    if (!nextIds.has(id)) listOps.push({ op: "remove", path, id, entity, type: `${entity}_deleted` });
  });

  const simulated = applyListOps(prev, listOps);
  const orderMatches =
    simulated.length === next.length && simulated.every((item, i) => idOf(item) === idOf(next[i]));
  if (!orderMatches) listOps.push({ op: "order", path, ids: next.map(idOf) });

  ops.push(...listOps);
}

function diffValue(prev, next, path, ops, entityName) {
  if (same(prev, next)) return;

  if (Array.isArray(prev) && Array.isArray(next) && isKeyedList(prev) && isKeyedList(next)) {
    diffList(prev, next, path, ops, entityName);
    return;
  }

  if (path.length === 0 && isPlainObject(prev) && isPlainObject(next)) {
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    keys.forEach((key) => {
      if (!(key in next)) ops.push({ op: "set", path: [key], data: undefined });
      else diffValue(prev[key], next[key], [key], ops, entityName);
    });
    return;
  }

  if (path.length === 0) ops.push({ op: "replace", data: next });
  else ops.push({ op: "set", path, data: next });
}

export function diff(prev, next, { entity } = {}) {
  if (prev === undefined) return [{ op: "replace", data: next }];
  const ops = [];
  diffValue(prev, next, [], ops, entity);
  return ops;
}
