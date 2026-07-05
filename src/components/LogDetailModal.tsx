/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { X, Activity, Thermometer, Wind, AlertTriangle, Cpu, Volume2, ShieldAlert, CheckCircle, Zap, ShieldCheck } from "lucide-react";
import { FireLog } from "../types";

interface LogDetailModalProps {
  log: FireLog | null;
  onClose: () => void;
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!log || !log.acousticDetails) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;
    const frequency = log.acousticDetails.frequency;

    // Adjust wave length based on physical low-frequency (lower Hz = longer wave)
    const waveLengthFactor = 200 / frequency; 

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Draw center baseline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw mathematical acoustic sound pressure wave
      ctx.beginPath();
      ctx.strokeStyle = log.classification === "ESCALATED" ? "#f43f5e" : "#fbbf24";
      ctx.lineWidth = 2.5;
      
      // Shadow glow for the sound wave
      ctx.shadowBlur = 8;
      ctx.shadowColor = log.classification === "ESCALATED" ? "rgba(244, 63, 94, 0.5)" : "rgba(251, 191, 36, 0.5)";

      for (let x = 0; x < canvas.width; x++) {
        // y = A * sin(B * x + phase) + verticalCenter
        const amplitude = (canvas.height / 3.2) * (log.acousticDetails!.amplitudeDb / 120);
        const y = canvas.height / 2 + Math.sin(x * (0.04 * waveLengthFactor) + offset) * amplitude;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Animate phase offset based on frequency (higher Hz moves slightly faster)
      offset += (frequency / 250);
      animationFrameId = requestAnimationFrame(render);
    };

    // Responsive Canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = 100;

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [log]);

  if (!log) return null;

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Percentages for metrics gauges
  const tempPercent = Math.min((log.sensorData.temperature / 160) * 100, 100);
  const smokePercent = log.sensorData.smoke;
  const gasPercent = Math.min((log.sensorData.combustibleGas / 1000) * 100, 100);
  const flamePercent = log.sensorData.opticalFlame * 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        id="log-detail-modal"
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-sm">
              {log.id}
            </span>
            <h2 className="text-sm font-sans font-bold text-slate-900">Incident Forensic Audit</h2>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Header Metadata */}
          <div className="bg-slate-50 p-5 border border-slate-200/60 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-3xs font-mono text-slate-400 uppercase tracking-wider block font-bold">TIMELOG STATION RECORD</span>
              <div className="flex items-center gap-2">
                {log.classification === "NORMAL" && (
                  <span className="px-2.5 py-1 rounded-lg text-4xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 shadow-3xs">
                    🟢 AMBIENT REPORT
                  </span>
                )}
                {log.classification === "FALSE_ALARM" && (
                  <span className="px-2.5 py-1 rounded-lg text-4xs font-mono font-bold bg-purple-100 border border-purple-200 text-purple-700 shadow-3xs">
                    🔍 PREVENTED (FALSE ALARM)
                  </span>
                )}
                {log.classification === "SUPPRESSED" && (
                  <span className="px-2.5 py-1 rounded-lg text-4xs font-mono font-bold bg-emerald-100 border border-emerald-200 text-emerald-700 shadow-3xs">
                    ⚡ ACOUSTICALLY EXTINGUISHED
                  </span>
                )}
                {log.classification === "ESCALATED" && (
                  <span className="px-2.5 py-1 rounded-lg text-4xs font-mono font-bold bg-rose-100 border border-rose-200 text-rose-700 shadow-3xs">
                    🚨 ESCALATED (RELAY TRIPPED)
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-slate-900 font-sans font-extrabold">{log.location}</div>
            <div className="text-3xs text-slate-500 font-mono font-medium">{formatTimestamp(log.timestamp)}</div>
          </div>

          {/* Sensor Telemetry Section */}
          <div className="space-y-3.5">
            <h3 className="text-2xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Activity className="w-3.5 h-3.5 text-slate-400" /> Sensor Telemetry at Trigger Time
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-2xs text-slate-600 font-sans flex items-center gap-1 font-semibold">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Temperature
                  </span>
                  <span className="text-2xs font-mono font-extrabold text-slate-900">{log.sensorData.temperature}°C</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${log.sensorData.temperature >= 80 ? "bg-rose-500" : log.sensorData.temperature >= 45 ? "bg-amber-500" : "bg-emerald-500"}`} 
                    style={{ width: `${tempPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-4xs font-mono text-slate-400 mt-1">
                  <span>Ambient</span>
                  <span>45°C Limit</span>
                  <span>Critical (80°C+)</span>
                </div>
              </div>

              {/* Smoke */}
              <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-2xs text-slate-600 font-sans flex items-center gap-1 font-semibold">
                    <Wind className="w-3.5 h-3.5 text-sky-500" /> Smoke Obstruction
                  </span>
                  <span className="text-2xs font-mono font-extrabold text-slate-900">{log.sensorData.smoke}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${log.sensorData.smoke >= 60 ? "bg-rose-500" : log.sensorData.smoke >= 30 ? "bg-amber-500" : "bg-emerald-500"}`} 
                    style={{ width: `${smokePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-4xs font-mono text-slate-400 mt-1">
                  <span>Clean</span>
                  <span>Dust Threshold</span>
                  <span>Thick Fire Smoke</span>
                </div>
              </div>

              {/* Gas */}
              <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-2xs text-slate-600 font-sans flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Combustible Gas
                  </span>
                  <span className="text-2xs font-mono font-extrabold text-slate-900">{log.sensorData.combustibleGas} ppm</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${log.sensorData.combustibleGas >= 350 ? "bg-rose-500" : log.sensorData.combustibleGas >= 100 ? "bg-amber-500" : "bg-emerald-500"}`} 
                    style={{ width: `${gasPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-4xs font-mono text-slate-400 mt-1">
                  <span>Clean</span>
                  <span>100 ppm Leak</span>
                  <span>Explosive Limit</span>
                </div>
              </div>

              {/* Flame */}
              <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-2xs text-slate-600 font-sans flex items-center gap-1 font-semibold">
                    <Activity className="w-3.5 h-3.5 text-rose-500" /> Flame Intensity
                  </span>
                  <span className="text-2xs font-mono font-extrabold text-slate-900">{log.sensorData.opticalFlame} / 10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${log.sensorData.opticalFlame >= 6 ? "bg-rose-500" : log.sensorData.opticalFlame >= 2 ? "bg-amber-500" : "bg-emerald-500"}`} 
                    style={{ width: `${flamePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-4xs font-mono text-slate-400 mt-1">
                  <span>None</span>
                  <span>Spark</span>
                  <span>Intense Flame</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acoustic Driver Response Section */}
          <div className="space-y-3.5">
            <h3 className="text-2xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Volume2 className="w-3.5 h-3.5 text-slate-500" /> Acoustic Suppression Driver Signal
            </h3>

            {log.acousticDetails ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 grid grid-cols-3 gap-4 border-b border-slate-100 text-center bg-slate-50/50">
                  <div className="border-r border-slate-200">
                    <span className="text-4xs font-mono text-slate-400 uppercase font-bold">TUNED FREQUENCY</span>
                    <span className="block text-md font-extrabold font-mono text-amber-600">{log.acousticDetails.frequency} Hz</span>
                    <span className="text-4xs text-slate-500">Low-Freq disruptor</span>
                  </div>
                  <div className="border-r border-slate-200">
                    <span className="text-4xs font-mono text-slate-400 uppercase font-bold">DRIVER INTENSITY</span>
                    <span className="block text-md font-extrabold font-mono text-slate-800">{log.acousticDetails.amplitudeDb} dB</span>
                    <span className="text-4xs text-slate-500">High pressure flux</span>
                  </div>
                  <div>
                    <span className="text-4xs font-mono text-slate-400 uppercase font-bold">BURST DURATION</span>
                    <span className="block text-md font-extrabold font-mono text-sky-600">{log.acousticDetails.durationSeconds} s</span>
                    <span className="text-4xs text-slate-500">Continuous spray</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800">
                  <span className="text-4xs font-mono text-slate-400 uppercase block mb-1.5 font-bold">LIVE WAVE MODEL GENERATION</span>
                  <canvas ref={canvasRef} className="w-full bg-slate-950 border border-slate-800 rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl text-center text-slate-500 text-2xs italic font-medium">
                Acoustic waves were NOT deployed for this log. The environment remained normal or multi-sensor fusion classified the smoke event as a harmless false alarm.
              </div>
            )}
          </div>

          {/* Hardened Relay and Safeguard Checklist */}
          <div className="space-y-3.5">
            <h3 className="text-2xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Cpu className="w-3.5 h-3.5 text-slate-400" /> Automated Safe-Fail Actions Tripped
            </h3>

            <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-3.5 font-mono text-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 text-3xs font-bold">✓</div>
                  <span className="text-slate-700 font-semibold">Continuous Multi-Sensor Fusion Polling</span>
                </div>
                <span className="text-emerald-700 font-extrabold">ENGAGED (ACTIVE)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${log.fireOccurred ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-400"} flex items-center justify-center text-3xs font-bold`}>
                    {log.fireOccurred ? "✓" : "-"}
                  </div>
                  <span className={`font-semibold ${log.fireOccurred ? "text-slate-700" : "text-slate-400"}`}>Acoustic Driver Low-Freq Disruption</span>
                </div>
                <span className={log.fireOccurred ? "text-amber-600 font-extrabold" : "text-slate-400 font-bold"}>
                  {log.fireOccurred ? "DEPLOYED WAVE" : "STANDBY"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${log.classification === "ESCALATED" ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-400"} flex items-center justify-center text-3xs font-bold`}>
                    {log.classification === "ESCALATED" ? "✓" : "-"}
                  </div>
                  <span className={`font-semibold ${log.classification === "ESCALATED" ? "text-slate-700" : "text-slate-400"}`}>Automatic Safety Relay Circuit Isolation</span>
                </div>
                <span className={log.classification === "ESCALATED" ? "text-rose-600 font-extrabold animate-pulse" : "text-slate-400 font-bold"}>
                  {log.classification === "ESCALATED" ? "TRIPPED (POWER ISOLATED)" : "NORMAL (POWER GRID)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${log.classification === "FALSE_ALARM" ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-400"} flex items-center justify-center text-3xs font-bold`}>
                    {log.classification === "FALSE_ALARM" ? "✓" : "-"}
                  </div>
                  <span className={`font-semibold ${log.classification === "FALSE_ALARM" ? "text-slate-700" : "text-slate-400"}`}>Harmless False-Alarm Alarm Bypass</span>
                </div>
                <span className={log.classification === "FALSE_ALARM" ? "text-purple-600 font-extrabold" : "text-slate-400 font-bold"}>
                  {log.classification === "FALSE_ALARM" ? "STANDBY HARMLESS" : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Incident Notes & Diagnosis Summary */}
          <div className="space-y-3.5">
            <h3 className="text-2xs font-mono text-slate-500 uppercase tracking-wider block font-bold">
              Forensic Narrative & System Remarks
            </h3>
            <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-2 shadow-sm">
              {log.falseAlarmReason && (
                <div className="text-2xs text-purple-700 font-mono bg-purple-50 border border-purple-200 px-3 py-2 rounded-xl mb-2">
                  <span className="font-extrabold uppercase block text-3xs mb-0.5">FALSE ALARM EXPLAINER:</span>
                  {log.falseAlarmReason}
                </div>
              )}
              <p className="text-xs text-slate-700 font-sans leading-relaxed font-medium">
                {log.notes}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-3xs text-slate-500 font-semibold">
            <span>BATT_CAP: {log.batteryLevel}%</span>
            <span>•</span>
            <span>RELAY_STATUS: {log.relayStatus}</span>
          </div>
          <button
            id="close-modal-bottom-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-sans font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 cursor-pointer shadow-sm transition"
          >
            Acknowledge Incident
          </button>
        </div>
      </div>
    </div>
  );
}
