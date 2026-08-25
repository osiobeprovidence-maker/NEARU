import React, { useState } from 'react';
import { 
  Send, 
  Bell, 
  Users, 
  MapPin, 
  Smartphone, 
  Mail, 
  ShieldAlert, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Sparkles, 
  Radio, 
  Copy, 
  Trash2,
  Info,
  Flame,
  Wrench
} from 'lucide-react';
import { useAdmin, AdminNotification } from '../../contexts/AdminContext';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { cn } from '../../lib/utils';

export default function AdminNotifications() {
  const { notifications, sendBroadcast } = useAdmin();

  // Form State for Composing Broadcast
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'ALL' | 'VERIFIED' | 'PLUS' | 'LOCATION'>('ALL');
  const [locationCity, setLocationCity] = useState('Lagos');
  const [type, setType] = useState<'SYSTEM' | 'MARKETING' | 'SAFETY' | 'UPDATE'>('SYSTEM');
  const [channels, setChannels] = useState({ inApp: true, push: true, email: false });
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Selected Notification for viewing metrics
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);

  const handleDispatchBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    sendBroadcast({
      title,
      message,
      audience: audience === 'LOCATION' ? `Location: ${locationCity}` : audience,
      type,
    });

    // Reset Form
    setTitle('');
    setMessage('');
    setAudience('ALL');
  };

  const columns: Column<AdminNotification>[] = [
    {
      key: 'title',
      header: 'Broadcast Campaign',
      sortable: true,
      render: (n) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 text-xs">{n.title}</span>
            <span className={cn(
              "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
              n.type === 'SAFETY' ? "bg-rose-100 text-rose-800" :
              n.type === 'UPDATE' ? "bg-indigo-100 text-indigo-800" :
              n.type === 'MARKETING' ? "bg-amber-100 text-amber-800" :
              "bg-zinc-100 text-zinc-700"
            )}>
              {n.type}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{n.message}</p>
        </div>
      ),
    },
    {
      key: 'audience',
      header: 'Audience Target',
      sortable: true,
      render: (n) => (
        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold">
          {n.audience}
        </span>
      ),
    },
    {
      key: 'sentCount',
      header: 'Delivery Volume',
      sortable: true,
      render: (n) => (
        <div className="text-xs font-medium">
          <strong className="text-zinc-900">{n.sentCount.toLocaleString()}</strong> dispatched
        </div>
      ),
    },
    {
      key: 'openRate',
      header: 'Open / Read Rate',
      sortable: true,
      render: (n) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full" 
              style={{ width: `${n.openRate}%` }} 
            />
          </div>
          <span className="text-xs font-black text-zinc-800">{n.openRate}%</span>
        </div>
      ),
    },
    {
      key: 'sentAt',
      header: 'Dispatched Date',
      sortable: true,
      render: (n) => (
        <span className="text-xs text-zinc-500 font-medium">{n.sentAt}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (n) => (
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          {n.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (n) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNotification(n);
          }}
          className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          title="View Campaign Stats"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Broadcast & Notifications</h2>
        <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">
          Compose in-app announcements, emergency safety broadcasts, and feature updates.
        </p>
      </div>

      {/* Main Broadcast Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose Form */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900">Compose Broadcast</h3>
              <p className="text-xs text-zinc-500 font-medium">Send real-time alerts across channels</p>
            </div>
          </div>

          <form onSubmit={handleDispatchBroadcast} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Broadcast Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Safety Alert: Heavy Rains in Lekki & VI"
                className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Message Body *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the notification copy here. Keep it concise, friendly, and clear..."
                className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
                >
                  <option value="ALL">All Registered Users (12,482)</option>
                  <option value="VERIFIED">NIN Verified Users Only (8,291)</option>
                  <option value="PLUS">RALLY+ Subscribers Only (1,420)</option>
                  <option value="LOCATION">Target by Geographic City</option>
                </select>
              </div>

              {audience === 'LOCATION' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Target City
                  </label>
                  <select
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
                  >
                    <option value="Lagos">Lagos Neighborhoods</option>
                    <option value="Abuja">Abuja Federal Capital</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Ibadan">Ibadan</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Notification Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-bold"
                  >
                    <option value="SYSTEM">System Announcement</option>
                    <option value="SAFETY">Safety Alert (Urgent)</option>
                    <option value="UPDATE">Product & Feature Update</option>
                    <option value="MARKETING">Community Spotlight</option>
                  </select>
                </div>
              )}
            </div>

            {/* Delivery Channels */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Delivery Channels
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={channels.inApp}
                    onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-zinc-800">In-App Notification Tray</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={channels.push}
                    onChange={(e) => setChannels({ ...channels, push: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-zinc-800">Mobile Push Notification</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-zinc-800">Email Digest</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={!title.trim() || !message.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Send Broadcast Now</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live In-App Mobile Notification Preview Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-zinc-900 mb-1">Mobile Live Preview</h3>
            <p className="text-xs text-zinc-500 font-medium mb-6">How this notice appears on user lock screens & apps</p>

            <div className="p-4 rounded-3xl bg-zinc-900 text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-[10px] text-white">
                    R
                  </div>
                  <span className="text-[11px] font-bold tracking-wider text-zinc-300">RALLY · NOW</span>
                </div>
                <span className="text-[10px] text-zinc-500">Just now</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {title || 'Safety Alert: Community Notice'}
                </h4>
                <p className="text-[11px] text-zinc-400 font-medium line-clamp-3 mt-1 leading-relaxed">
                  {message || 'Your broadcast message preview will dynamically update here in real-time as you compose...'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 mt-6">
            <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Smart Delivery AI</span>
            </div>
            <p className="text-[11px] text-indigo-700 font-medium mt-1">
              Broadcasts are throttled to ensure user phones are not spammed with duplicate alerts within a 15-minute window.
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-zinc-900">Broadcast Campaign History</h3>
        <AdminDataTable
          data={notifications}
          columns={columns}
          keyExtractor={(n) => n.id}
          searchPlaceholder="Search broadcast titles or messages..."
          searchFields={['title', 'message', 'audience']}
          exportFileName="broadcast-history"
        />
      </div>

      {/* STATS MODAL FOR BROADCAST */}
      {selectedNotification && (
        <AdminModal
          isOpen={Boolean(selectedNotification)}
          onClose={() => setSelectedNotification(null)}
          title={`Campaign: ${selectedNotification.title}`}
          subtitle={`Sent on ${selectedNotification.sentAt} to ${selectedNotification.audience}`}
        >
          <div className="space-y-6">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs font-medium text-zinc-800">
              {selectedNotification.message}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3.5 bg-white border border-zinc-200 rounded-2xl">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Dispatched</span>
                <p className="text-xl font-black text-zinc-900 mt-0.5">{selectedNotification.sentCount.toLocaleString()}</p>
              </div>
              <div className="p-3.5 bg-white border border-zinc-200 rounded-2xl">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Delivered</span>
                <p className="text-xl font-black text-emerald-600 mt-0.5">99.4%</p>
              </div>
              <div className="p-3.5 bg-white border border-zinc-200 rounded-2xl">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Open Rate</span>
                <p className="text-xl font-black text-indigo-600 mt-0.5">{selectedNotification.openRate}%</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
