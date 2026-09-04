import React from 'react';
import { 
  Search, 
  Thermometer, 
  Droplets, 
  Activity as ActivityIcon, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Truck,
  MapPin,
  Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Shipment } from '../types';

interface LogisticsTelemetryProps {
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  setSelectedShipment: (s: Shipment | null) => void;
  simTemp: number;
  setSimTemp: (temp: number) => void;
  simHumidity: number;
  setSimHumidity: (humid: number) => void;
  simGForce: number;
  setSimGForce: (g: number) => void;
  submitTelemetry: () => void;
  telemetrySubmitting: boolean;
  currentUser: any;
  setPresetNormal: () => void;
  setPresetColdChainViolation: () => void;
  setPresetImpactViolation: () => void;
  shipmentsSearch: string;
  setShipmentsSearch: (search: string) => void;
}

export const LogisticsTelemetry: React.FC<LogisticsTelemetryProps> = ({
  shipments,
  selectedShipment,
  setSelectedShipment,
  simTemp,
  setSimTemp,
  simHumidity,
  setSimHumidity,
  simGForce,
  setSimGForce,
  submitTelemetry,
  telemetrySubmitting,
  currentUser,
  setPresetNormal,
  setPresetColdChainViolation,
  setPresetImpactViolation,
  shipmentsSearch,
  setShipmentsSearch
}) => {

  // Filter shipments
  const filteredShipments = shipments.filter(ship => {
    if (!shipmentsSearch) return true;
    const query = shipmentsSearch.toLowerCase();
    return (
      ship.shipmentNumber.toLowerCase().includes(query) ||
      ship.orderNumber.toLowerCase().includes(query) ||
      ship.carrier.toLowerCase().includes(query) ||
      ship.trackingNumber.toLowerCase().includes(query) ||
      ship.origin.toLowerCase().includes(query) ||
      ship.destination.toLowerCase().includes(query)
    );
  });

  const canBroadcast = currentUser?.role === 'ADMIN' || 
                       currentUser?.role === 'WAREHOUSE_MANAGER';

  return (
    <div className="space-y-6" id="shipments-view">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Shipment Cards list */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Active Cargo Shipments Index</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">Select an active consignment to broadcast IoT sensor updates.</p>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search active cargos by code, origin, carrier, tracking ID..."
              value={shipmentsSearch}
              onChange={(e) => setShipmentsSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredShipments.map((ship) => {
              const isSelected = selectedShipment?.id === ship.id;
              const hasBreach = ship.currentTemp > 25.0 || ship.currentGForce > 1.8;

              return (
                <div
                  key={ship.id}
                  onClick={() => {
                    setSelectedShipment(ship);
                    setSimTemp(ship.currentTemp);
                    setSimHumidity(ship.currentHumidity);
                    setSimGForce(ship.currentGForce);
                  }}
                  className={`p-4 rounded-2xl border text-xs transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white/80 dark:bg-slate-900/60 border-blue-500 shadow-md shadow-blue-500/5' 
                      : 'bg-white/40 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-blue-400 font-bold tracking-wide">{ship.shipmentNumber}</p>
                      <p className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter mt-0.5">
                        {ship.orderType} ORDER #{ship.orderNumber}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 font-mono text-[9px] uppercase font-black border rounded-full ${
                      ship.status === 'Delivered' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : ship.status === 'Delayed'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {ship.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-500 dark:text-slate-600 text-[9px] block uppercase font-bold tracking-wider mb-0.5">Origin Node</span>
                      <span className="truncate block max-w-[180px]" title={ship.origin}>{ship.origin}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-600 text-[9px] block uppercase font-bold tracking-wider mb-0.5">Destination Node</span>
                      <span className="truncate block max-w-[180px]" title={ship.destination}>{ship.destination}</span>
                    </div>
                  </div>

                  {/* Telemetry quick bar */}
                  <div className="border-t border-slate-200 dark:border-slate-900 pt-2.5 flex flex-wrap gap-4 text-[11px] font-mono justify-between text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className={`w-3.5 h-3.5 ${ship.currentTemp > 25.0 ? 'text-red-400' : 'text-slate-500'}`} />
                      <span className={ship.currentTemp > 25.0 ? 'text-red-400 font-bold' : ''}>
                        {ship.currentTemp.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      <span>{ship.currentHumidity.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ActivityIcon className={`w-3.5 h-3.5 ${ship.currentGForce > 1.8 ? 'text-red-400' : 'text-slate-500'}`} />
                      <span className={ship.currentGForce > 1.8 ? 'text-red-400 font-bold' : ''}>
                        {ship.currentGForce.toFixed(2)}G
                      </span>
                    </div>
                  </div>

                  {hasBreach && (
                    <div className="mt-2.5 text-[9px] bg-red-500/5 border border-red-500/15 text-red-400 p-2 rounded-xl flex items-center gap-1.5 font-mono uppercase tracking-wide">
                      <AlertTriangle className="w-3.5 h-3.5 animate-bounce text-red-500" />
                      <span>Cryo threshold or impact alarm violation detected!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Sensor Broadcaster Terminal */}
        <div className="lg:col-span-5 bg-white/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono">IoT Telemetry Node Simulator</h3>
          
          {selectedShipment ? (
            <div className="space-y-5 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Active Device Node Gateway</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedShipment.shipmentNumber}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1 font-sans">Carrier: {selectedShipment.carrier} (Ref: {selectedShipment.trackingNumber})</p>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col items-center gap-2">
                <QRCodeSVG value={`SHIPMENT:${selectedShipment.id}`} size={90} />
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Verify Cryptographic ID</span>
              </div>

              {selectedShipment.status === 'Delivered' ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-2xl text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold uppercase text-[10px] tracking-widest">Gateway Offlined</p>
                  <p className="text-[10px] text-slate-500 font-sans mt-1">Cargo marked as Delivered. Sensors decommissioned.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 pt-1">
                    {/* Temp slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-550 dark:text-slate-400">Cargo Temperature</span>
                        <span className={`font-bold ${simTemp > 25.0 ? 'text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {simTemp.toFixed(1)} °C
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="0.5"
                        value={simTemp}
                        onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-900 rounded cursor-pointer"
                      />
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 block">Threshold alert sets at &gt; 25.0°C</span>
                    </div>

                    {/* Humidity Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-550 dark:text-slate-400">Relative Humidity</span>
                        <span className="text-slate-800 dark:text-slate-200">{simHumidity.toFixed(1)} %</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="0.5"
                        value={simHumidity}
                        onChange={(e) => setSimHumidity(parseFloat(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-slate-200 dark:bg-slate-900 rounded cursor-pointer"
                      />
                    </div>

                    {/* Impact Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-550 dark:text-slate-400">Shock Impact G-Force</span>
                        <span className={`font-bold ${simGForce > 1.8 ? 'text-red-400 animate-pulse' : 'text-slate-800 dark:text-slate-200'}`}>
                          {simGForce.toFixed(2)} G
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.5"
                        step="0.05"
                        value={simGForce}
                        onChange={(e) => setSimGForce(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-200 dark:bg-slate-900 rounded cursor-pointer"
                      />
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 block">Dangerous impact alert Sets at &gt; 1.8G</span>
                    </div>
                  </div>

                  {/* Preset Quick Actions */}
                  <div className="space-y-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Trigger Alarm Preset Simulation</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={setPresetNormal}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider font-bold transition cursor-pointer"
                      >
                        Pristine
                      </button>
                      <button
                        type="button"
                        onClick={setPresetColdChainViolation}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider font-bold transition cursor-pointer animate-pulse"
                      >
                        Cryo Breach
                      </button>
                      <button
                        type="button"
                        onClick={setPresetImpactViolation}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider font-bold transition cursor-pointer"
                      >
                        Drop Impact
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitTelemetry}
                    disabled={telemetrySubmitting || !canBroadcast}
                    className={`w-full mt-4 py-3 rounded-xl font-mono font-bold tracking-widest text-[10px] uppercase cursor-pointer flex items-center justify-center gap-1.5 transition ${
                      canBroadcast
                        ? 'btn-gradient'
                        : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {telemetrySubmitting && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                    Broadcast Telemetry To Ledger
                  </button>
                </>
              )}

              {/* History trail */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-900 space-y-2">
                <p className="text-[9px] text-slate-500 uppercase font-black">Sensor Stream Logs (Latest 3 Broadcasts)</p>
                <div className="space-y-1 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                  {selectedShipment.sensorHistory.slice().reverse().slice(0, 3).map((hist, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-900/60">
                      <span className="text-slate-500">{new Date(hist.timestamp).toLocaleTimeString()}</span>
                      <span className={hist.temp > 25.0 ? 'text-red-400 font-bold' : ''}>{hist.temp}°C</span>
                      <span>{hist.humidity}%</span>
                      <span className={hist.gForce > 1.8 ? 'text-red-400 font-bold' : ''}>{hist.gForce}G</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-float" />
              <p className="text-[10px] font-mono uppercase tracking-widest">No Cargo Target Selected</p>
              <p className="text-[11px] text-slate-600 font-sans mt-1">Select an active shipment card from the index to establish telemetry connections.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
