/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Search, Filter, ShieldCheck, ShieldX, CheckCircle, ShieldAlert, Thermometer, Wind, AlertTriangle, Eye, ArrowUpDown } from "lucide-react";
import { FireLog, EventClassification } from "../types";

interface FireLogTableProps {
  logs: FireLog[];
  onSelectLog: (log: FireLog) => void;
}

type SortField = "timestamp" | "temperature" | "smoke" | "id";
type SortOrder = "asc" | "desc";

export default function FireLogTable({ logs, onSelectLog }: FireLogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Get unique locations for dropdown filter
  const locations = Array.from(new Set(logs.map((log) => log.location)));

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.falseAlarmReason && log.falseAlarmReason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClass = classFilter === "ALL" || log.classification === classFilter;
    const matchesLocation = locationFilter === "ALL" || log.location === locationFilter;

    return matchesSearch && matchesClass && matchesLocation;
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valueA: any = a[sortField];
    let valueB: any = b[sortField];

    // Handle nested sensor fields
    if (sortField === "temperature") {
      valueA = a.sensorData.temperature;
      valueB = b.sensorData.temperature;
    } else if (sortField === "smoke") {
      valueA = a.sensorData.smoke;
      valueB = b.sensorData.smoke;
    }

    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h2 className="text-md font-sans font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" /> System Activity & Suppression Logs
          </h2>
          <span className="text-2xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">
            Showing {sortedLogs.length} of {logs.length} logged incidents
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Search logs, zones, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs text-slate-800 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-rose-500 placeholder-slate-400 shadow-sm transition"
            />
          </div>

          {/* Classification Filter */}
          <div>
            <select
              id="class-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs text-slate-800 px-3 py-2.5 rounded-xl focus:outline-none focus:border-rose-500 cursor-pointer shadow-sm transition"
            >
              <option value="ALL">All Event Types</option>
              <option value="SUPPRESSED">Suppressed Acoustically</option>
              <option value="FALSE_ALARM">False Alarms Avoided</option>
              <option value="ESCALATED">Escalated Thermal Trips</option>
              <option value="NORMAL">Diagnostics & Ambient Logs</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs text-slate-800 px-3 py-2.5 rounded-xl focus:outline-none focus:border-rose-500 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap shadow-sm transition"
            >
              <option value="ALL">All Physical Zones</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Field */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="sort-by-time"
              onClick={() => toggleSort("timestamp")}
              className={`px-3 py-2 rounded-xl text-xs font-sans flex items-center justify-center gap-1.5 border cursor-pointer transition shadow-sm ${
                sortField === "timestamp"
                  ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Date {sortField === "timestamp" && (sortOrder === "desc" ? "▼" : "▲")}
            </button>
            <button
              id="sort-by-temp"
              onClick={() => toggleSort("temperature")}
              className={`px-3 py-2 rounded-xl text-xs font-sans flex items-center justify-center gap-1.5 border cursor-pointer transition shadow-sm ${
                sortField === "temperature"
                  ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Temp {sortField === "temperature" && (sortOrder === "desc" ? "▼" : "▲")}
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs font-mono text-slate-500 uppercase tracking-wider font-bold">
              <th className="py-3.5 px-4">Event ID</th>
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Physical Zone / Location</th>
              <th className="py-3.5 px-4 text-center">Status / Classification</th>
              <th className="py-3.5 px-4">Sensors (Max)</th>
              <th className="py-3.5 px-4">Acoustic Driver Response</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs font-medium">
                  No fire suppression logs match the selected search criteria or filters.
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => {
                // Determine classification styling
                let badgeClass = "";
                let statusIcon = null;
                let statusLabel = "";

                switch (log.classification) {
                  case "NORMAL":
                    badgeClass = "bg-slate-50 border-slate-200 text-slate-600 shadow-sm";
                    statusIcon = <ShieldCheck className="w-3 h-3 text-slate-500" />;
                    statusLabel = "Baseline Normal";
                    break;
                  case "FALSE_ALARM":
                    badgeClass = "bg-purple-50 border-purple-200 text-purple-700 shadow-sm";
                    statusIcon = <ShieldX className="w-3 h-3 text-purple-600" />;
                    statusLabel = "False Alarm Avoided";
                    break;
                  case "SUPPRESSED":
                    badgeClass = "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-bold";
                    statusIcon = <CheckCircle className="w-3 h-3 text-emerald-600" />;
                    statusLabel = "Acoustically Extinguished";
                    break;
                  case "ESCALATED":
                    badgeClass = "bg-rose-50 border-rose-200 text-rose-700 animate-pulse shadow-sm font-bold";
                    statusIcon = <ShieldAlert className="w-3 h-3 text-rose-600" />;
                    statusLabel = "Relay Tripped (Thermal)";
                    break;
                }

                return (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/50 transition group"
                  >
                    {/* Log ID */}
                    <td className="py-4 px-4 font-mono text-xs font-bold text-slate-900">
                      {log.id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 text-2xs text-slate-500 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-xs font-sans text-slate-800 font-medium max-w-[200px] truncate">
                      {log.location}
                    </td>

                    {/* Badge Classification */}
                    <td className="py-4 px-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-mono font-bold border ${badgeClass}`}>
                        {statusIcon}
                        {statusLabel}
                      </div>
                    </td>

                    {/* Sensors */}
                    <td className="py-4 px-4 font-mono text-3xs text-slate-600">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-semibold">{log.sensorData.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5 text-slate-400" />
                          <span>S: {log.sensorData.smoke}%</span>
                        </div>
                        {log.sensorData.combustibleGas > 50 && (
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-bold text-4xs w-fit">
                            Gas: {log.sensorData.combustibleGas} ppm
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Acoustic Response */}
                    <td className="py-4 px-4 text-xs font-mono text-slate-600">
                      {log.acousticDetails ? (
                        <div className="text-2xs text-slate-700">
                          <span className="text-amber-600 font-extrabold">{log.acousticDetails.frequency}Hz</span> @ {log.acousticDetails.amplitudeDb}dB 
                          <span className="block text-4xs text-slate-400 mt-0.5">Duration: {log.acousticDetails.durationSeconds}s ({log.acousticDetails.waveForm})</span>
                        </div>
                      ) : (
                        <span className="text-3xs text-slate-400 italic font-medium">No sound deployed</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-4 text-right">
                      <button
                        id={`view-details-${log.id}`}
                        onClick={() => onSelectLog(log)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 cursor-pointer transition flex items-center justify-center gap-1 text-3xs font-mono font-bold float-right shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        INSPECT
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
