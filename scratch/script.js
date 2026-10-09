const fs = require('fs');
const file = 'backend/legacy/controllers/productController.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/import Product from \"\.\.\/models\/Product\.js\";/, 'import Product from "../models/Product.js";\nimport { transformProductResponse } from "../utils/urlResolver.js";');
content = content.replace(/\.\.\.item\.toObject\(\)/g, '...transformProductResponse(item)');
content = content.replace(/\.\.\.product\.toObject\(\)/g, '...transformProductResponse(product)');
fs.writeFileSync(file, content);
