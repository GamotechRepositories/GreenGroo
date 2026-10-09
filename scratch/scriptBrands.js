const fs = require('fs');

function processFile(file, transformFuncName) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(transformFuncName)) return;
  
  content = content.replace(/import { buildPaginatedResponse, getPaginationParams } from "\.\.\/utils\/pagination\.js";/, 'import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination.js";\nimport { ' + transformFuncName + ' } from "../utils/urlResolver.js";');
  
  const varNameMatches = content.match(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*([a-zA-Z0-9_]+)\s*\}\);/g);
  if (varNameMatches) {
    for (const match of varNameMatches) {
        const varName = match.match(/data:\s*([a-zA-Z0-9_]+)/)[1];
        if (varName === 'banners') {
          content = content.replace(match, 'res.status(200).json({ success: true, data: banners.map(' + transformFuncName + ') });');
        } else if (varName === 'brands') {
          content = content.replace(match, 'res.status(200).json({ success: true, data: brands.map(' + transformFuncName + ') });');
        } else {
          content = content.replace(match, 'res.status(200).json({ success: true, data: ' + transformFuncName + '(' + varName + ') });');
        }
    }
  }

  content = content.replace(/buildPaginatedResponse\(([a-zA-Z0-9_]+),\s*total,\s*page,\s*limit\)/g, 'buildPaginatedResponse($1.map(' + transformFuncName + '), total, page, limit)');
  
  fs.writeFileSync(file, content);
}

processFile('backend/legacy/controllers/brandController.js', 'transformBrandResponse');
