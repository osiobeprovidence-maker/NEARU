import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  HelpingHand, 
  Flag, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  BadgeCheck,
  ChevronRight,
  Send,
  Flame,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminStatsCard } from '../../components/admin/AdminStatsCard';
import { cn } from '../../lib/utils';

type MetricKey = 'activeUsers' | 'ralliesCreated' | 'connections';

export default function AdminDashboard() {
  const { metrics, reports, resolveReport, analytics, loading } = useAdmin();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [activeMetric, setActiveMetric] = useState<MetricKey>('activeUsers');

  const seriesFor = (key: MetricKey) =>
    key === 'activeUsers'
      ? analytics?.usersOverTime || []
      : key === 'ralliesCreated'
      ? analytics?.ralliesOverTime || []
      : analytics?.verifiedOverTime || [];

  const chartData = useMemo(() => {
    const series = seriesFor(activeMetric);
    const slice = timeRange === '7d' ? series.slice(-7) : series;
    return slice.map((p) => ({ name: p.label, value: p.count }));
  }, [analytics, activeMetric, timeRange]);

  const growthPct = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    if (first === 0) return null;
    return ((last - first) / first) * 100;
  }, [chartData]);

  const totalSeriesValue = chartData.reduce((sum, p) => sum + p.value, 0);

  const growthLabel =
    growthPct == null
      ? null
      : `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}% vs start`;

  const topLocations = (analytics?.ralliesByCity || []).slice(0, 6);

  // Filter pending reports for the priority queue
  const priorityReports = reports
    .filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW')
    .slice(0, 4);

  const formatShort = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const snapshot = [
    { label: 'New Users Today', value: metrics.newUsersToday },
    { label: 'New RALLYS Today', value: metrics.newRalliesToday },
    { label: 'Verified Today', value: metrics.todayApprovedVerifications },
    { label: 'Total RALLYS', value: metrics.totalRallies },
    { label: 'Total Posts', value: metrics.totalPosts },
    { label: 'Active Ads', value: metrics.activeAds },
    { label: 'Organizations', value: metrics.organizations },
    { label: 'Businesses', value: metrics.businesses },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Quick Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Platform Overview</h2>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">Real-time statistics and system health monitoring.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/verification"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-2xl transition-all shadow-2xs"
          >
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
            <span>Verification Queue</span>
          </Link>

          <Link
            to="/admin/notifications"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Alert</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Statistics Cards */}
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
          label="ACTIVE RALLYS"
          value={metrics.activeRallies.toLocaleString()}
          icon={HelpingHand}
          color="text-amber-600"
          bg="bg-amber-50"
          subtitle={`${metrics.newRalliesToday} created today`}
        />

        <AdminStatsCard
          label="VERIFIED PROFILES"
          value={metrics.verifiedProfiles.toLocaleString()}
          icon={ShieldCheck}
          color="text-emerald-600"
          bg="bg-emerald-50"
          subtitle={`${metrics.todayApprovedVerifications} verified today`}
        />

        <AdminStatsCard
          label="REPORTS PENDING"
          value={metrics.pendingReports.toLocaleString()}
          change={metrics.pendingReports > 0 ? `${metrics.pendingReports} to triage` : 'All clear'}
          trend={metrics.pendingReports > 0 ? 'down' : 'up'}
          isUrgent={metrics.pendingReports > 0}
          icon={Flag}
          color="text-rose-600"
          bg="bg-rose-50"
          subtitle="Safety flags awaiting triage"
        />
      </div>

      {/* Main Analytics & Priority Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Platform Growth Card */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">Platform Growth</h3>
                  {growthLabel && (
                    <span className={cn(
                      "px-2 py-0.5 font-black text-[10px] rounded-full border",
                      growthPct! >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {growthLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  {analytics ? `${totalSeriesValue} events across ${chartData.length} period${chartData.length === 1 ? '' : 's'}` : 'Loading activity metrics...'}
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center bg-zinc-100 p-1 rounded-2xl self-start">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                      timeRange === range ? "bg-white text-zinc-900 shadow-2xs font-black" : "text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    Last {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Pills */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveMetric('activeUsers')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5",
                  activeMetric === 'activeUsers'
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>New Users</span>
              </button>
              <button
                onClick={() => setActiveMetric('ralliesCreated')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5",
                  activeMetric === 'ralliesCreated'
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>RALLYS Created</span>
              </button>
              <button
                onClick={() => setActiveMetric('connections')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5",
                  activeMetric === 'connections'
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>Verified Today</span>
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full pt-2">
            {loading && chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Loading analytics...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                <AlertCircle className="w-5 h-5 mr-2" />
                No activity recorded for this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="indigoGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="emeraldGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="amberGrowth" x1="0" y1="0" x2="0" y2="1">
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
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name={activeMetric === 'activeUsers' ? 'New Users' : activeMetric === 'ralliesCreated' ? 'RALLYS Created' : 'Verified Today'}
                    stroke={activeMetric === 'activeUsers' ? '#4F46E5' : activeMetric === 'ralliesCreated' ? '#10B981' : '#F59E0B'} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={activeMetric === 'activeUsers' ? 'url(#indigoGrowth)' : activeMetric === 'ralliesCreated' ? 'url(#emeraldGrowth)' : 'url(#amberGrowth)'} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Reports Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">Priority Reports</h3>
                <p className="text-xs text-zinc-500 font-medium">Requiring immediate moderation</p>
              </div>
              <Link 
                to="/admin/reports"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>VIEW ALL</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {loading && reports.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs font-medium">
                  <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2 animate-spin" />
                  Loading reports...
                </div>
              ) : priorityReports.length > 0 ? (
                priorityReports.map((report) => (
                  <div 
                    key={report.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                        report.priority === 'URGENT' 
                          ? "bg-rose-100 text-rose-700 border border-rose-200" 
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      )}>
                        {report.priority || 'MEDIUM'}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">{formatShort(report.createdAt)}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-zinc-900">{report.type}</p>
                        <span className="text-zinc-300">·</span>
                        <p className="text-xs text-zinc-600 font-medium truncate">Against {report.reportedUserName}</p>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium line-clamp-1 mt-0.5">{report.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                      <span className="text-[10px] font-bold text-zinc-500">By {report.reporterName}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resolveReport(report.id, 'Quick resolved from dashboard')}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors shadow-2xs"
                        >
                          Resolve
                        </button>
                        <Link
                          to="/admin/reports"
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[10px] font-bold transition-colors shadow-2xs"
                        >
                          Investigate
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs font-medium">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All reports are currently resolved.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-100 text-center">
            <Link
              to="/admin/reports"
              className="text-xs font-bold text-zinc-700 hover:text-indigo-600 inline-flex items-center gap-1"
            >
              <span>Manage all {metrics.pendingReports} pending safety flags</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Buzzing Locations & Today's Pulse Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Buzzing Locations Ranking */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">Buzzing Locations</h3>
                <p className="text-xs text-zinc-500 font-medium">Top active neighborhood nodes across Nigeria</p>
              </div>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading && topLocations.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-medium">
              <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2 animate-spin" />
              Loading locations...
            </div>
          ) : topLocations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topLocations.map((loc, idx) => (
                <div
                  key={loc.city}
                  className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-zinc-900">{loc.city}</h4>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium mt-1">
                      <strong className="text-zinc-900">{loc.count.toLocaleString()}</strong> active RALLYS
                    </p>
                  </div>

                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full">
                    {loc.count.toLocaleString()} posts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400 text-xs font-medium">
              <AlertCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              No rally activity recorded yet.
            </div>
          )}
        </div>

        {/* Today's Pulse - real platform snapshot */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">Platform Snapshot</h3>
            <p className="text-xs text-zinc-500 font-medium mb-4">Current record counts across LALOA</p>

            <div className="space-y-3">
              {snapshot.map((row) => (
                <div key={row.label} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <span className="text-xs font-bold text-zinc-800">{row.label}</span>
                  <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {row.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
                Overall activity is derived live from the LALOA database — no cached or simulated figures.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <Link
              to="/admin/settings"
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 block text-center"
            >
              Manage Server & Database Settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}