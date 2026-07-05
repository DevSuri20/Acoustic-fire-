/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Flame, ShieldCheck, Activity, Zap, ShieldAlert, CheckCircle2 } from "lucide-react";
import { FireLog } from "../types";

interface DashboardStatsProps {
  logs: FireLog[];
  batteryLevel: number;
  relayState: "NORMAL" | "TRIPPED";
}

export default function DashboardStats({ logs, batteryLevel, relayState }: DashboardStatsProps) {
  const totalEvents = logs.length;
  const fireCount = logs.filter((l) => l.fireOccurred).length;
  const suppressedCount = logs.filter((l) => l.classification === "SUPPRESSED").length;
  const falseAlarmCount = logs.filter((l) => l.classification === "FALSE_ALARM").length;

  const successRate = fireCount > 0 ? Math.round((suppressedCount / (suppressedCount + logs.filter(l => l.classification === "ESCALATED").length)) * 100) : 100;

  const stats = [
    {
      id: "stat-scans",
      title: "Total Monitored Logs",
      value: totalEvents,
      subtext: "Continuous environmental polling",
      icon: Activity,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      id: "stat-fires",
      title: "Fire Occurrences",
      value: fireCount,
      subtext: `${suppressedCount} suppressed by sound waves`,
      icon: Flame,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      id: "stat-suppressed",
      title: "Acoustic Success Rate",
      value: `${successRate}%`,
      subtext: "Wave interference extinguishments",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      id: "stat-false-alarms",
      title: "False Alarms Avoided",
      value: falseAlarmCount,
      subtext: "Prevented via multi-sensor fusion",
      icon: ShieldCheck,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08 }}
          className="flex flex-col p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 opacity-40 blur-2xl rounded-full" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
              {stat.title}
            </span>
            <div className={`p-2 rounded-xl border ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-sans font-extrabold tracking-tight text-slate-900">
              {stat.value}
            </span>
          </div>
          
          <p className="text-xs text-slate-500 mt-2 font-sans font-medium">
            {stat.subtext}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
