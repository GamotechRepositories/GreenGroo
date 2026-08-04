export const adminQueryKeys = {
  categories: {
    all: ["admin", "categories"],
    list: (params) => ["admin", "categories", "list", params],
    options: ["admin", "categories", "options"],
  },
  brands: {
    all: ["admin", "brands"],
    list: (params) => ["admin", "brands", "list", params],
    options: ["admin", "brands", "options"],
  },
  products: {
    all: ["admin", "products"],
    list: (params) => ["admin", "products", "list", params],
  },
  orders: {
    all: ["admin", "orders"],
    list: (params) => ["admin", "orders", "list", params],
  },
};
