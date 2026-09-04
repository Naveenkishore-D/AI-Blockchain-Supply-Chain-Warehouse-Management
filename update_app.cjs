const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Update the state for Warehouse Filter
appCode = appCode.replace(
  "  const [chatLoading, setChatLoading] = useState(false);",
  `  const [chatLoading, setChatLoading] = useState(false);
  
  const [warehouseStateFilter, setWarehouseStateFilter] = useState('All');
  const [warehouseCityFilter, setWarehouseCityFilter] = useState('All');`
);

// 2. Update the Warehouse Creation Initial State
appCode = appCode.replace(
  "  const [newWarehouse, setNewWarehouse] = useState<Partial<Warehouse>>({ status: 'Active' });",
  "  const [newWarehouse, setNewWarehouse] = useState<Partial<Warehouse>>({ status: 'Active', country: 'India' });"
);

// 3. Apply the filter logic and update the Directory View
const warehouseViewStr = `                {/* Warehouse Hubs */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Central Hubs Storage Capacity</h3>
                      <p className="text-xs text-slate-400">Active storage sites and real-time volumetric capacity utilization.</p>
                    </div>`;

const newWarehouseViewStr = `                {/* Warehouse Hubs */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Central Hubs Storage Capacity</h3>
                      <p className="text-xs text-slate-400">Active storage sites and real-time volumetric capacity utilization.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={warehouseStateFilter}
                        onChange={e => { setWarehouseStateFilter(e.target.value); setWarehouseCityFilter('All'); }}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1"
                      >
                        <option value="All">All States</option>
                        {Array.from(new Set(warehouses.map(w => w.state).filter(Boolean))).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <select
                        value={warehouseCityFilter}
                        onChange={e => setWarehouseCityFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1"
                      >
                        <option value="All">All Cities</option>
                        {Array.from(new Set(warehouses.filter(w => warehouseStateFilter === 'All' || w.state === warehouseStateFilter).map(w => w.city).filter(Boolean))).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setIsWarehouseModalOpen(true)}`;

appCode = appCode.replace(
  /\{\/\* Warehouse Hubs \*\/\}[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setIsWarehouseModalOpen\(true\)\}/,
  newWarehouseViewStr
);

// 4. Update the map logic
appCode = appCode.replace(
  "{warehouses.map((wh) => {",
  `{warehouses.filter(wh => (warehouseStateFilter === 'All' || wh.state === warehouseStateFilter) && (warehouseCityFilter === 'All' || wh.city === warehouseCityFilter)).map((wh) => {`
);

// 5. Update the warehouse display to show the new fields
appCode = appCode.replace(
  "<p className=\"font-mono text-[10px] text-slate-500 uppercase\">{wh.location} | Manager: {wh.managerName}</p>",
  "<p className=\"font-mono text-[10px] text-slate-500 uppercase\">{wh.city ? `${wh.city}, ${wh.state}, ${wh.country} - ${wh.pincode}` : wh.location} | Manager: {wh.managerName}</p>"
);

// 6. Update the Warehouse Creation Modal
const oldModalStr = `<div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Location</label>
                <input
                  type="text"
                  required
                  value={newWarehouse.location}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
                  placeholder="Seattle, WA"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>`;

const newModalStr = `<div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">City</label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.city || ''}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, city: e.target.value, location: \`\${e.target.value}, \${newWarehouse.state || ''}, \${newWarehouse.country || ''}\` })}
                    placeholder="Chennai"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">State</label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.state || ''}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, state: e.target.value, location: \`\${newWarehouse.city || ''}, \${e.target.value}, \${newWarehouse.country || ''}\` })}
                    placeholder="Tamil Nadu"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Country</label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.country || ''}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, country: e.target.value, location: \`\${newWarehouse.city || ''}, \${newWarehouse.state || ''}, \${e.target.value}\` })}
                    placeholder="India"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Pincode</label>
                  <input
                    type="text"
                    required
                    value={newWarehouse.pincode || ''}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, pincode: e.target.value })}
                    placeholder="600001"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>`;

appCode = appCode.replace(oldModalStr, newModalStr);

fs.writeFileSync('src/App.tsx', appCode);
console.log("App patched.");
