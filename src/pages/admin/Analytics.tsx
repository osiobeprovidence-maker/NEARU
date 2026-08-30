import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  Flame, 
  Download, 
  ShieldCheck, 
  Clock,
  AlertCircle
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

const PIE_COLORS = ['#10B981', '#4F46E5', '#F43F5E', '#F59E0B', '#8B5CF6', '#14B8A6', '#F97316', '#6366F1', '#EF4444', '#0EA5E9'];

export default function AdminAnalytics() {
  const { metrics, analytics, loading, showToast } = useAdmin();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const series = useMemo(
    () =>
      analytics || {
        usersOverTime: [],
        ralliesOverTime: [],
        verifiedOverTime: [],
        rallyTypes: [],
        ralliesByCity: [],
        accountsByCity: [],
        retentionSupported: false,
      },
    [analytics]
  );

  const growthChartData = useMemo(() => {
    const base = series.usersOverTime.map((u, i) => ({
      name: u.label,
      users: u.count,
      rallies: series.ralliesOverTime[i]?.count ?? 0,
      verified: series.verifiedOverTime[i]?.count ?? 0,
    }));
    return timeRange === '7d' ? base.slice(-7) : base;
  }, [series, timeRange]);

  const rallyVolumeData = useMemo(() => {
    const base = series.ralliesOverTime.map((r) => ({ name: r.label, count: r.count }));
    return timeRange === '7d' ? base.slice(-7) : base;
  }, [series, timeRange]);

  const pieTotal = series.rallyTypes.reduce((sum, t) => sum + t.count, 0);
  const pieData = series.rallyTypes.map((t, i) => ({
    name: t.name,
    value: t.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
    pct: pieTotal > 0 ? Math.round((t.count / pieTotal) * 100) : 0,
  }));

  const topCities = series.ralliesByCity.slice(0, 6);
  const topAccountCities = series.accountsByCity.slice(0, 6);

  const verifAdoption =
    metrics.totalUsers > 0 ? ((metrics.verifiedProfiles / metrics.totalUsers) * 100).toFixed(1) : '0';

  const handleExportReport = () => {
    try {
      const rows: Record<string, string | number>[] = [];
      for (const p of series.rallyTypes) {
        rows.push({ Category: p.name, 'Total Posts': p.count });
      }
      for (const c of series.ralliesByCity) {
        rows.push({ City: c.city, 'Active RALLYS': c.count });
      }
      for (let i = 0; i < series.usersOverTime.length; i++) {
        rows.push({
          Period: series.usersOverTime[i]?.label ?? '',
          'New Users': series.usersOverTime[i]?.count ?? 0,
          'RALLYS Created': series.ralliesOverTime[i]?.count ?? 0,
          'New Verified': series.verifiedOverTime[i]?.count ?? 0,
        });
      }
      const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      const csv = [
        keys.join(','),
        ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? '')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Platform Analytics report exported to CSV.', 'success');
    } catch {
      showToast('Could not export the analytics report.', 'danger');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Analytics & Intelligence</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
            Live platform growth, category performance, and geographic density.
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
          label="TOTAL USERS"
          value={metrics.totalUsers.toLocaleString()}
          icon={Users}
          color="text-indigo-600"
          bg="bg-indigo-50"
          subtitle={`${metrics.newUsersToday} new today`}
        />

        <AdminStatsCard
          label="TOTAL RALLYS"
          value={metrics.totalRallies.toLocaleString()}
          icon={Zap}
          color="text-amber-600"
          bg="bg-amber-50"
          subtitle={`${metrics.activeRallies} currently active`}
        />

        <AdminStatsCard
          label="NIN VERIFICATION ADOPTION"
          value={`${verifAdoption}%`}
          icon={ShieldCheck}
          color="text-emerald-600"
          bg="bg-emerald-50"
          subtitle={`${metrics.verifiedProfiles.toLocaleString()} verified accounts`}
        />

        <AdminStatsCard
          label="OPEN SAFETY REPORTS"
          value={metrics.pendingReports.toLocaleString()}
          icon={BarChart3}
          color="text-rose-600"
          bg="bg-rose-50"
          subtitle={`${metrics.resolvedReports.toLocaleString()} resolved so far`}
        />
      </div>

      {/* Growth Trend & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Trend */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900">Growth Trend</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">New users, RALLYS, and verified profiles per period</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading && growthChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Loading analytics...
              </div>
            ) : growthChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                <AlertCircle className="w-5 h-5 mr-2" />
                No activity recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gRallies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
                  <Area type="monotone" dataKey="users" name="New Users" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gUsers)" />
                  <Area type="monotone" dataKey="rallies" name="RALLYS Created" stroke="#10B981" strokeWidth={2.5} fill="url(#gRallies)" />
                  <Area type="monotone" dataKey="verified" name="New Verified" stroke="#F59E0B" strokeWidth={2.5} fill="url(#gVerified)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-zinc-900">Category Distribution</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Share of live RALLY types</p>

            {pieData.length > 0 ? (
              <>
                <div className="h-52 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} posts`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-zinc-700 truncate">{item.name}</span>
                      </div>
                      <span className="text-zinc-900">{item.pct}% · {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-52 flex items-center justify-center text-zinc-400 text-xs font-medium">
                <AlertCircle className="w-5 h-5 mr-2" />
                No RALLYS recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RALLY Volume Bar Chart & Geographic Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rally Volume by Period */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900">RALLY Creation Volume</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Posts created per period</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading && rallyVolumeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Loading analytics...
              </div>
            ) : rallyVolumeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                <AlertCircle className="w-5 h-5 mr-2" />
                No RALLYS recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rallyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
                  <Bar dataKey="count" name="RALLYS Created" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Geographic Rankings */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-zinc-900">Geographic Nodes</h3>
          </div>
          <p className="text-xs text-zinc-500 font-medium mb-6">Top performing city hubs</p>

          {loading && topCities.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 text-xs font-medium">
              <Clock className="w-6 h-6 text-zinc-300 mx-auto mb-2 animate-spin" />
              Loading locations...
            </div>
          ) : topCities.length > 0 ? (
            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">By RALLY Count</div>
              {topCities.map((loc, idx) => (
                <div key={`r-${loc.city}`} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-black text-zinc-900">{loc.city}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-zinc-900 block">{loc.count}</span>
                    <span className="text-[10px] font-bold text-zinc-400">RALLYS</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-zinc-400 text-xs font-medium">
              <AlertCircle className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
              No location data yet.
            </div>
          )}

          {topAccountCities.length > 0 && (
            <div className="space-y-3 mt-5 pt-5 border-t border-zinc-100">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">By Account Count</div>
              {topAccountCities.map((loc, idx) => (
                <div key={`a-${loc.city}`} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-black text-zinc-900">{loc.city}</h4>
                  </div>
                  <span className="text-xs font-black text-zinc-900">{loc.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}