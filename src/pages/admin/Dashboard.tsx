import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Zap, 
  Flag, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  BadgeCheck,
  ChevronRight,
  Send,
  UserPlus,
  Filter,
  Eye,
  Check,
  ShieldAlert,
  Flame
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

const growthData7Days = [
  { name: 'Mon', activeUsers: 8420, ralliesCreated: 310, connections: 185 },
  { name: 'Tue', activeUsers: 9120, ralliesCreated: 380, connections: 240 },
  { name: 'Wed', activeUsers: 9850, ralliesCreated: 420, connections: 290 },
  { name: 'Thu', activeUsers: 10400, ralliesCreated: 490, connections: 340 },
  { name: 'Fri', activeUsers: 11650, ralliesCreated: 620, connections: 460 },
  { name: 'Sat', activeUsers: 12482, ralliesCreated: 780, connections: 590 },
  { name: 'Sun', activeUsers: 12100, ralliesCreated: 710, connections: 520 },
];

const growthData30Days = [
  { name: 'Week 1', activeUsers: 7200, ralliesCreated: 1450, connections: 890 },
  { name: 'Week 2', activeUsers: 8900, ralliesCreated: 1820, connections: 1140 },
  { name: 'Week 3', activeUsers: 10600, ralliesCreated: 2190, connections: 1490 },
  { name: 'Week 4', activeUsers: 12482, ralliesCreated: 2680, connections: 1980 },
];

const growthData90Days = [
  { name: 'Month 1', activeUsers: 4500, ralliesCreated: 3200, connections: 2100 },
  { name: 'Month 2', activeUsers: 8400, ralliesCreated: 6100, connections: 4400 },
  { name: 'Month 3', activeUsers: 12482, ralliesCreated: 9840, connections: 7320 },
];

const buzzingLocations = [
  { city: 'Lagos', activeRallies: '1,842', growth: '+18%', trendingRank: 1, topCategory: 'HELP (Auto & Errands)' },
  { city: 'Abuja', activeRallies: '934', growth: '+12%', trendingRank: 2, topCategory: 'JOIN (Sports & Carpool)' },
  { city: 'Port Harcourt', activeRallies: '621', growth: '+9%', trendingRank: 3, topCategory: 'JOIN (Fitness & Meetups)' },
  { city: 'Ibadan', activeRallies: '342', growth: '+14%', trendingRank: 4, topCategory: 'ASK (Mentorship)' },
];

export default function AdminDashboard() {
  const { metrics, reports, resolveReport, dismissReport } = useAdmin();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [activeMetric, setActiveMetric] = useState<'activeUsers' | 'ralliesCreated' | 'connections'>('activeUsers');
  const navigate = useNavigate();

  const chartData = timeRange === '7d' ? growthData7Days : timeRange === '30d' ? growthData30Days : growthData90Days;

  // Filter high priority pending reports
  const priorityReports = reports
    .filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW')
    .slice(0, 4);

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

      {/* 4 Core Statistics Cards matching reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStatsCard
          label="TOTAL USERS"
          value={metrics.totalUsers.toLocaleString()}
          change="+14.2%"
          trend="up"
          icon={Users}
          color="text-indigo-600"
          bg="bg-indigo-50"
          subtitle="Platform registered members"
        />

        <AdminStatsCard
          label="ACTIVE RALLYS"
          value={metrics.activeRallies.toLocaleString()}
          change="+8.1%"
          trend="up"
          icon={Zap}
          color="text-amber-600"
          bg="bg-amber-50"
          subtitle="Currently live nearby posts"
        />

        <AdminStatsCard
          label="VERIFIED PROFILES"
          value={metrics.verifiedProfiles.toLocaleString()}
          change="+22.4%"
          trend="up"
          icon={ShieldCheck}
          color="text-emerald-600"
          bg="bg-emerald-50"
          subtitle="NIN verified accounts"
        />

        <AdminStatsCard
          label="REPORTS PENDING"
          value={metrics.pendingReports.toLocaleString()}
          change="-5.3%"
          trend="down"
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
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-black text-[10px] rounded-full border border-emerald-100">
                    +18.4% WoW
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Activity trends and user engagement trajectories.
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center bg-zinc-100 p-1 rounded-2xl self-start">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    timeRange === '7d' ? "bg-white text-zinc-900 shadow-2xs font-black" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    timeRange === '30d' ? "bg-white text-zinc-900 shadow-2xs font-black" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => setTimeRange('90d')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    timeRange === '90d' ? "bg-white text-zinc-900 shadow-2xs font-black" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  Last 90 days
                </button>
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
                <span>Active Users</span>
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
                <span>Connections</span>
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full pt-2">
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
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
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
                  dataKey={activeMetric} 
                  stroke={activeMetric === 'activeUsers' ? '#4F46E5' : activeMetric === 'ralliesCreated' ? '#10B981' : '#F59E0B'} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill={activeMetric === 'activeUsers' ? 'url(#indigoGrowth)' : activeMetric === 'ralliesCreated' ? 'url(#emeraldGrowth)' : 'url(#amberGrowth)'} 
                />
              </AreaChart>
            </ResponsiveContainer>
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
              {priorityReports.length > 0 ? (
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
                        {report.priority}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">{report.createdAt}</span>
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
                        <button
                          onClick={() => navigate('/admin/reports')}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[10px] font-bold transition-colors shadow-2xs"
                        >
                          Investigate
                        </button>
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

      {/* Buzzing Locations & Quick Actions Grid */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {buzzingLocations.map((loc) => (
              <div
                key={loc.city}
                className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">
                      #{loc.trendingRank}
                    </span>
                    <h4 className="text-sm font-black text-zinc-900">{loc.city}</h4>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    <strong className="text-zinc-900">{loc.activeRallies}</strong> active RALLYS
                  </p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{loc.topCategory}</p>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full">
                    {loc.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health & Operations Status */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">System Status</h3>
            <p className="text-xs text-zinc-500 font-medium mb-4">Core platform infrastructure</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-800">Discovery Engine</span>
                </div>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  100% HEALTHY
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-zinc-800">NIN Verification API</span>
                </div>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  99.8% ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-zinc-800">Direct Chat & WebSockets</span>
                </div>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  OPERATIONAL
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-zinc-800">Spam Filter AI Model</span>
                </div>
                <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  ACTIVE
                </span>
              </div>
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
