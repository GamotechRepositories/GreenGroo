const fs = require('fs');
const file = 'backend/legacy/controllers/categoryController.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/import Category from "\.\.\/models\/Category\.js";/, 'import Category from "../models/Category.js";\nimport { transformCategoryResponse } from "../utils/urlResolver.js";');

content = content.replace(/const categoryObj = category\.toObject\(\);/g, 'const categoryObj = transformCategoryResponse(category);');
content = content.replace(/res\.status\(200\)\.json\(buildPaginatedResponse\(categories/g, 'res.status(200).json(buildPaginatedResponse(categories.map(transformCategoryResponse)');
content = content.replace(/res\.status\(200\)\.json\(\{ success: true, data: category \}\);/g, 'res.status(200).json({ success: true, data: transformCategoryResponse(category) });');
fs.writeFileSync(file, content);
