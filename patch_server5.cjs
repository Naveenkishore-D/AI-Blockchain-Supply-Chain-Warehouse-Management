const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

serverCode = serverCode.replace(
  "const { name, location, capacity, managerName } = req.body;",
  "const { name, location, capacity, managerName, city, state, country, pincode } = req.body;"
);

serverCode = serverCode.replace(
  /const newWarehouse: Warehouse = \{\n\s+id: 'wh-' \+ Math.random\(\).toString\(36\).substring\(2, 9\),\n\s+name,\n\s+location,\n\s+capacity: Number\(capacity\),\n\s+usedCapacity: 0,\n\s+managerName,\n\s+status: 'Active'\n\s+\};/g,
  `const newWarehouse: Warehouse = {
      id: 'wh-' + Math.random().toString(36).substring(2, 9),
      name,
      location,
      city,
      state,
      country,
      pincode,
      capacity: Number(capacity),
      usedCapacity: 0,
      managerName,
      status: 'Active'
    };`
);

fs.writeFileSync('server.ts', serverCode);
console.log("Patched server.ts with Warehouse additional fields correctly");
