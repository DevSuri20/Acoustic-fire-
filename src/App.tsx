/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Flame, 
  Database, 
  Settings, 
  HelpCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Cpu,
  Info,
  ShieldCheck,
  BatteryCharging,
  Zap,
  Volume2
} from "lucide-react";

import { FireLog } from "./types";
import { initialLogs } from "./initialLogs";
import DashboardStats from "./components/DashboardStats";
import SuppressionSimulator from "./components/SuppressionSimulator";
import FireLogTable from "./components/FireLogTable";
import LogDetailModal from "./components/LogDetailModal";

export default function App() {
  // Load initial logs from localStorage or fallback
  const [logs, setLogs] = useState<FireLog[]>(() => {
    const saved = localStorage.getItem("acoustic_fire_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved logs", e);
      }
    }
    return initialLogs;
  });

  const [selectedLog, setSelectedLog] = useState<FireLog | null>(null);
  const [systemBattery, setSystemBattery] = useState(100);
  const [relayState, setRelayState] = useState<"NORMAL" | "TRIPPED">("NORMAL");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Save logs to localStorage on changes
  useEffect(() => {
    localStorage.setItem("acoustic_fire_logs", JSON.stringify(logs));
  }, [logs]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle new log generation from the simulator
  const handleLogGenerated = (newLog: FireLog) => {
    setLogs((prev) => [newLog, ...prev]);
    
    // Slightly degrade battery during active suppression to represent physical discharge, then recharge
    if (newLog.fireOccurred) {
      setSystemBattery((prev) => Math.max(prev - 4, 10));
    }
  };

  // Recharge battery slowly back to 100%
  useEffect(() => {
    if (systemBattery < 100) {
      const interval = setInterval(() => {
        setSystemBattery((prev) => Math.min(prev + 1, 100));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [systemBattery]);

  // Reset log database to original defaults
  const handleResetLogs = () => {
    if (window.confirm("Are you sure you want to reset the logs back to factory defaults? Any simulated logs will be cleared.")) {
      setLogs(initialLogs);
      setRelayState("NORMAL");
      setSystemBattery(100);
    }
  };

  const activeAlarms = logs.filter(
    (l) => l.classification === "SUPPRESSED" || l.classification === "ESCALATED"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans selection:bg-rose-500 selection:text-white pb-16 relative overflow-hidden">
      {/* Visual background subtle grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_0.5px,transparent_0.5px),linear-gradient(to_bottom,#cbd5e1_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Primary Header - Premium dark toolbar for striking balance */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-950 px-4 sm:px-6 lg:px-8 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-500 rounded-xl shadow-inner animate-pulse">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 border border-slate-950">
                <Volume2 className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <h1 className="text-sm sm:text-md font-sans font-bold tracking-tight text-white flex items-center gap-1.5">
                Acoustic Fire Suppression Log & Monitor
              </h1>
              <p className="text-3xs font-mono text-slate-400">
                STATION_NODE: 9192-FS • MULTI-SENSOR FUSION LOGGING SYSTEM
              </p>
            </div>
          </div>

          {/* Clock & Status Panel */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-750 font-mono text-3xs text-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
              </span>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-mono text-3xs text-emerald-300">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span>STATION_SECURE_ONLINE</span>
            </div>

            {/* Reset Logs Action */}
            <button
              id="reset-logs-btn"
              onClick={handleResetLogs}
              title="Reset Database to defaults"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-750 cursor-pointer transition flex items-center gap-1 text-3xs font-mono font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              RESET
            </button>
          </div>

        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        
        {/* Core Description Alert Banner explaining the hardware solution */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-slate-900">How low-frequency sound wave extinguishment works:</h2>
              <p className="text-2xs text-slate-600 leading-relaxed max-w-4xl mt-0.5 font-medium">
                Our Acoustic Fire Suppression System continuously monitors smoke, temperature, and gas. Once a fire is confirmed via multi-sensor fusion, it triggers high-power low-frequency sound waves (30Hz–60Hz). These waves generate severe acoustic velocity fluctuations, pushing away the localized oxygen/fuel boundary layer, starving the combustion process, and safely extinguishing localized fires with <strong>zero chemical residues or equipment damage</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-4xs font-mono text-slate-400 uppercase block font-bold">BACKUP BATTERY</span>
              <span className="text-xs font-mono text-slate-800 font-extrabold flex items-center gap-1 justify-end">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                {systemBattery}% {systemBattery < 100 && "(Charging)"}
              </span>
            </div>
            <div className="text-right border-l border-slate-200 pl-4">
              <span className="text-4xs font-mono text-slate-400 uppercase block font-bold">GRID POWER RELAY</span>
              <span className={`text-xs font-mono font-bold ${relayState === "NORMAL" ? "text-emerald-600" : "text-rose-600"}`}>
                {relayState === "NORMAL" ? "NORMAL" : "TRIPPED"}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Metric Counters */}
        <DashboardStats 
          logs={logs} 
          batteryLevel={systemBattery} 
          relayState={relayState} 
        />

        {/* 2. Interactive Simulator Panel (The Simulated IoT Device) */}
        <SuppressionSimulator 
          onLogGenerated={handleLogGenerated}
          systemBattery={systemBattery}
          relayState={relayState}
          setRelayState={setRelayState}
        />

        {/* 3. History logs table */}
        <FireLogTable 
          logs={logs} 
          onSelectLog={(log) => setSelectedLog(log)} 
        />

        {/* 4. Troubleshooting & Diagnostic section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Engineering Specifications Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <h3 className="text-xs font-sans font-extrabold text-slate-900 mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-500" /> Acoustic Suppression Parameters
            </h3>
            <div className="space-y-3 font-mono text-2xs text-slate-600 font-medium">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>Optimized Wave Range</span>
                <span className="text-slate-800 font-bold">35 Hz - 55 Hz</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>Minimum Decibel Level</span>
                <span className="text-slate-800 font-bold">112 dB SPL</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>Combustion Shear Force</span>
                <span className="text-slate-800 font-bold">6.8 N/m²</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span>Disruption Window Max</span>
                <span className="text-slate-800 font-bold">15 seconds</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Automatic Gas Isolation Relay</span>
                <span className="text-emerald-600 font-bold">Fail-Safe Active</span>
              </div>
            </div>
          </div>

          {/* Fusion Classification Logic Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <h3 className="text-xs font-sans font-extrabold text-slate-900 mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-slate-500" /> Fusion Classification Logic
            </h3>
            <div className="space-y-2 font-sans text-2xs text-slate-600 font-medium leading-relaxed">
              <p>
                To avoid acoustic alerts during cooking steam, compressed-air dusting, or transient water vapor, our device uses an ABAC-like multi-sensor fusion logic gate:
              </p>
              <ul className="list-disc pl-4 space-y-2 mt-2 font-mono text-3xs text-slate-700">
                <li>
                  <span className="text-purple-600 font-bold">False Alarm:</span> High smoke %, but ambient thermal index & gas ppm remain steady (no optical flame). No sound.
                </li>
                <li>
                  <span className="text-emerald-600 font-bold">Acoustic suppression:</span> High smoke + thermal rise (&gt;60°C) + flame. Deploys tuned 35-50Hz sound waves.
                </li>
                <li>
                  <span className="text-rose-600 font-bold">Grid Relay Trip:</span> Extreme thermal state (&gt;110°C). Deploys sound waves, cuts regional electrical relay grid immediately.
                </li>
              </ul>
            </div>
          </div>

          {/* Self-Diagnostic Reports Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <h3 className="text-xs font-sans font-extrabold text-slate-900 mb-3.5 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" /> Built-In Self-Diagnostics
            </h3>
            <div className="space-y-3 font-mono text-2xs text-slate-600 font-medium">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Speaker Driver Impedance</span>
                <span className="text-emerald-600 font-bold">4.2 Ω (OK)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Optical Flame Poller Sensor</span>
                <span className="text-emerald-600 font-bold">100% (OK)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Gas Calibration (CO/H2)</span>
                <span className="text-emerald-600 font-bold">Calibrated</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>Solid State Backup Battery Charge</span>
                <span className="text-emerald-600 font-bold">Healthy (Stable)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Grid Isolator Relay Resistance</span>
                <span className="text-emerald-600 font-bold">0.05 mΩ (OK)</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Forensic Audit Detail Modal */}
      {selectedLog && (
        <LogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}
