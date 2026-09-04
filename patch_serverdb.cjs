const fs = require('fs');

let serverDbCode = fs.readFileSync('server-db.ts', 'utf-8');

serverDbCode = serverDbCode.replace(
  /const DEFAULT_WAREHOUSES: Warehouse\[\] = \[([\s\S]*?)\];/,
  `const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    name: 'Chennai Central Warehouse',
    location: 'Chennai, Tamil Nadu, India',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    pincode: '600001',
    capacity: 50000,
    usedCapacity: 14200,
    managerName: 'Arun Kumar',
    status: 'Active'
  },
  {
    id: 'wh-2',
    name: 'Coimbatore Logistics Hub',
    location: 'Coimbatore, Tamil Nadu, India',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    pincode: '641001',
    capacity: 35000,
    usedCapacity: 6100,
    managerName: 'Priya Rajan',
    status: 'Active'
  },
  {
    id: 'wh-3',
    name: 'Bangalore Tech Warehouse',
    location: 'Bangalore, Karnataka, India',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    capacity: 60000,
    usedCapacity: 45000,
    managerName: 'Ramesh Reddy',
    status: 'Active'
  },
  {
    id: 'wh-4',
    name: 'Mumbai Port Storage',
    location: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    capacity: 100000,
    usedCapacity: 85000,
    managerName: 'Vikram Singh',
    status: 'Active'
  },
  {
    id: 'wh-5',
    name: 'Hyderabad Central Hub',
    location: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500001',
    capacity: 45000,
    usedCapacity: 20000,
    managerName: 'Suresh Babu',
    status: 'Active'
  }
];`
);

fs.writeFileSync('server-db.ts', serverDbCode);
console.log("Server-db patched.");
