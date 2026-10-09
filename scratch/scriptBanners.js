const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('transformBannerResponse')) return; // already processed
  
  content = content.replace(/import { buildPaginatedResponse, getPaginationParams } from "\.\.\/utils\/pagination\.js";/, 'import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination.js";\nimport { transformBannerResponse } from "../utils/urlResolver.js";');
  
  content = content.replace(/data: banners/g, 'data: banners.map(transformBannerResponse)');
  content = content.replace(/buildPaginatedResponse\(banners/g, 'buildPaginatedResponse(banners.map(transformBannerResponse)');
  content = content.replace(/data: banner \}/g, 'data: transformBannerResponse(banner) }');
  
  fs.writeFileSync(file, content);
}

processFile('backend/legacy/controllers/heroBannerController.js');
processFile('backend/legacy/controllers/offerBannerController.js');
