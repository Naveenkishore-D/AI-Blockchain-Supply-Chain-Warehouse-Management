const fs = require('fs');

let typesCode = fs.readFileSync('src/types.ts', 'utf-8');

typesCode = typesCode.replace(
  "export interface Warehouse {",
  `export interface Warehouse {
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;`
);

fs.writeFileSync('src/types.ts', typesCode);
console.log("Types patched.");
