const fs = require('fs');
const path = require('path');

function processCategoryController(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('transformCategoryResponse')) return;
  
  content = content.replace(/import { buildPaginatedResponse, getPaginationParams } from "\.\.\/\.\.\/legacy\/utils\/pagination\.js";/, 'import { buildPaginatedResponse, getPaginationParams } from "../../legacy/utils/pagination.js";\nimport { transformCategoryResponse } from "../../legacy/utils/urlResolver.js";');
  if (!content.includes('transformCategoryResponse')) {
     content = content.replace(/import Category from "\.\/models\/Category\.js";/, 'import Category from "./models/Category.js";\nimport { transformCategoryResponse } from "../../legacy/utils/urlResolver.js";');
  }
  
  const varNameMatches = content.match(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*([a-zA-Z0-9_]+)\s*\}\);/g);
  if (varNameMatches) {
    for (const match of varNameMatches) {
        const varName = match.match(/data:\s*([a-zA-Z0-9_]+)/)[1];
        if (varName === 'categories' || varName === 'all' || varName === 'existing') {
          content = content.replace(match, 'res.status(200).json({ success: true, data: ' + varName + '.map(transformCategoryResponse) });');
        } else {
          content = content.replace(match, 'res.status(200).json({ success: true, data: transformCategoryResponse(' + varName + ') });');
        }
    }
  }

  content = content.replace(/buildPaginatedResponse\(([a-zA-Z0-9_]+),\s*total,\s*page,\s*limit\)/g, 'buildPaginatedResponse($1.map(transformCategoryResponse), total, page, limit)');
  
  fs.writeFileSync(file, content);
}

processCategoryController('backend/product-service/src/controllers/categoryController.js');

