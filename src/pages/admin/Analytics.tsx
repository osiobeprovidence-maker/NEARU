import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  MapPin, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  Flame, 
  PieChart as PieIcon, 
  ShieldCheck, 
  Clock,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminStatsCard } from '../../components/admin/AdminStatsCard';
import { cn } from '../../lib/utils';

const userRetentionData = [
  { name: 'Day 1', retention: 78, benchmark: 65 },
  { name: 'Day 3', retention: 64, benchmark: 50 },
  { name: 'Day 7', retention: 52, benchmark: 38 },
  { name: 'Day 14', retention: 44, benchmark: 29 },
  { name: 'Day 30', retention: 39, benchmark: 22 },
];

const categoryDistribution = [
  { name: 'HELP (Auto & Errands)', value: 42, color: '#10B981' },
  { name: 'JOIN (Sports, Carpool, Events)', value: 34, color: '#4F46E5' },
  { name: 'ASK (Advice, Mentorship, Recs)', value: 16, color: '#F43F5E' },
  { name: 'PAID Services & Exchange', value: 8, color: '#F59E0B' },
];

const locationMetrics = [
  { rank: 1, city: 'Lagos', neighborhood: 'Lekki Phase 1 / Victoria Island', rallies: 1842, growth: '+18%', activeUsers: 6420 },
  { rank: 2, city: 'Abuja', neighborhood: 'Maitama / Wuse 2', rallies: 934, growth: '+12%', activeUsers: 3100 },
  { rank: 3, city: 'Port Harcourt', neighborhood: 'GRA Phase 2 / Peter Odili', rallies: 621, growth: '+9%', activeUsers: 1850 },
  { rank: 4, city: 'Ibadan', neighborhood: 'Bodija / Jericho', rallies: 342, growth: '+14%', activeUsers: 980 },
  { rank: 5, city: 'Enugu', neighborhood: 'Independence Layout', rallies: 198, growth: '+21%', activeUsers: 620 },
];

const dailyRallyVolume = [
  { day: 'Mon', HELP: 140, JOIN: 110, ASK: 60, PAID: 25 },
  { day: 'Tue', HELP: 165, JOIN: 125, ASK: 70, PAID: 30 },
  { day: 'Wed', HELP: 180, JOIN: 140, ASK: 85, PAID: 35 },
  { day: 'Thu', HELP: 210, JOIN: 160, ASK: 95, PAID: 40 },
  { day: 'Fri', HELP: 260, JOIN: 220, ASK: 110, PAID: 55 },
  { day: 'Sat', HELP: 340, JOIN: 310, ASK: 140, PAID: 75 },
  { day: 'Sun', HELP: 290, JOIN: 280, ASK: 120, PAID: 60 },
];

export default function AdminAnalytics() {
  const { metrics, showToast } = useAdmin();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const handleExportReport = () => {
    showToast('Platform Analytics report exported to CSV successfully.', 'success');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Analytics & Intelligence</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
            Deep insights into user cohort retention, neighborhood density, and category performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-zinc-200 p-1 rounded-2xl shadow-2xs">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  timeRange === range
                    ? "bg-zinc-900 text-white shadow-2xs font-black"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStatsCard
          label="AVG TIME TO FIRST RESPONSE"
          value="4.2 mins"
          change="-32% faster"
          trend="up"
          icon={Clock}
          color="text-emerald-600"
          bg="bg-emerald-50"
          subtitle="Speed of neighborhood connections"
        />

        <AdminStatsCard
          label="DAY 30 RETENTION"
          value="39.2%"
          change="+6.8% vs benchmark"
          trend="up"
          icon={TrendingUp}
          color="text-indigo-600"
          bg="bg-indigo-50"
          subtitle="Cohort stickiness"
        />

        <AdminStatsCard
          label="RALLY COMPLETION RATE"
          value="87.4%"
          change="+4.1%"
          trend="up"
          icon={ShieldCheck}
          color="text-amber-600"
          bg="bg-amber-50"
          subtitle="Posts successfully fulfilled"
        />

        <AdminStatsCard
          label="NIN VERIFICATION ADOPTION"
          value="66.4%"
          change="+18.2%"
          trend="up"
          icon={Users}
          color="text-indigo-600"
          bg="bg-indigo-50"
          subtitle="Of all active platform users"
        />
      </div>

      {/* Retention Curve & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Retention Curve */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900">Cohort Retention Curve</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">RALLY users retention vs social benchmark</p>
            </div>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Top 5% Quartile
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRetentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderRadius: '1rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="retention" name="RALLY User Retention %" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                <Bar dataKey="benchmark" name="Industry Benchmark %" fill="#E4E4E7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-zinc-900">Category Distribution</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Share of live RALLY types</p>

            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4">
              {categoryDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-700 truncate">{item.name}</span>
                  </div>
                  <span className="text-zinc-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RALLY Creation Stacked Bar Chart & Top Neighborhood Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Volume by Type */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900">Daily RALLY Creation by Category</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Categorical post velocity during the week</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRallyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="day" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderRadius: '1rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="HELP" stackId="a" fill="#10B981" />
                <Bar dataKey="JOIN" stackId="a" fill="#4F46E5" />
                <Bar dataKey="ASK" stackId="a" fill="#F43F5E" />
                <Bar dataKey="PAID" stackId="a" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Active Neighborhoods Ranking */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-zinc-900">Geographic Nodes</h3>
          </div>
          <p className="text-xs text-zinc-500 font-medium mb-6">Top performing city hubs</p>

          <div className="space-y-3">
            {locationMetrics.map((loc) => (
              <div key={loc.city} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] font-black flex items-center justify-center">
                      {loc.rank}
                    </span>
                    <h4 className="text-xs font-black text-zinc-900">{loc.city}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5 truncate max-w-[150px]">{loc.neighborhood}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-zinc-900 block">{loc.rallies} RALLYS</span>
                  <span className="text-[10px] font-black text-emerald-600">{loc.growth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
