const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

appCode = appCode.replace(
  "authFetch('/api/suppliers').then(r => r.json()),",
  "authFetch('/api/suppliers?limit=100').then(r => r.json()).then(d => d.data || d),"
);

appCode = appCode.replace(
  "authFetch('/api/inventory').then(r => r.json()),",
  "authFetch('/api/inventory?limit=100').then(r => r.json()).then(d => d.data || d),"
);

fs.writeFileSync('src/App.tsx', appCode);
console.log("Patched src/App.tsx");
