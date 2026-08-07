import StoreInventory from "../models/StoreInventory.js";
import StoreOrder from "../models/StoreOrder.js";
import {
  buildInventoryDocs,
  pickRandomItems,
} from "../data/storeProductCatalog.js";

export async function seedManagerStore(manager) {
  const existing = await StoreInventory.countDocuments({
    managerId: manager._id,
  });
  if (existing > 0) {
    return { inventoryCreated: 0, ordersCreated: 0 };
  }

  const docs = buildInventoryDocs(manager._id);
  await StoreInventory.insertMany(docs);

  const sampleCustomers = [
    {
      name: "Rahul Sharma",
      phone: "9876500001",
      address: `12 Park Lane, ${manager.area}, ${manager.city}`,
    },
    {
      name: "Priya Patel",
      phone: "9876500002",
      address: `45 Green Avenue, ${manager.area}, ${manager.city}`,
    },
    {
      name: "Amit Kumar",
      phone: "9876500003",
      address: `78 Market Road, ${manager.area}, ${manager.city}`,
    },
    {
      name: "Sneha Reddy",
      phone: "9876500004",
      address: `22 Lake View, ${manager.area}, ${manager.city}`,
    },
  ];

  const orders = sampleCustomers.map((customer, i) => ({
    orderNumber: `GR${Date.now().toString().slice(-6)}${i}${Math.floor(
      Math.random() * 90 + 10
    )}`,
    managerId: manager._id,
    city: manager.city,
    cityId: manager.cityId,
    area: manager.area,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    items: pickRandomItems(docs, 2 + (i % 3)),
    status: "incoming",
  }));

  await StoreOrder.insertMany(orders);

  return { inventoryCreated: docs.length, ordersCreated: orders.length };
}
