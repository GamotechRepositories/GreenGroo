const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);
const form = new FormData();
form.append("files", new Blob([png], { type: "image/png" }), "unit.png");
form.append("folder", "products");
const res = await fetch("http://localhost:5001/api/upload", { method: "POST", body: form });
console.log(res.status, (await res.text()).slice(0, 400));
