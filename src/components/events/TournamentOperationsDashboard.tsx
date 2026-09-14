import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  UserX,
  Megaphone,
  History,
  FileText,
  UserCheck,
  Calendar,
  Eye,
  Award,
} from 'lucide-react';

interface Props {
  eventId: Id<"events">;
  currentUserId: Id<"users">;
  onClose?: () => void;
}

export default function TournamentOperationsDashboard({ eventId, currentUserId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<
    'matches' | 'results' | 'disputes' | 'disqualifications' | 'announcements' | 'audit'
  >('matches');

  const liveOverview = useQuery(api.operations.getLiveEventOverview, { eventId });
  const eventDisputes = useQuery(api.operations.getEventDisputes, { eventId });
  const eventAnnouncements = useQuery(api.operations.getEventAnnouncements, { eventId });
  const auditLogs = useQuery(api.operations.getEventAuditLogs, { eventId });
  const competitions = useQuery(api.competitions.getCompetition, { eventId });

  // Mutations
  const updateStatus = useMutation(api.operations.updateMatchStatus);
  const updateSchedule = useMutation(api.operations.updateMatchSchedule);
  const confirmResult = useMutation(api.operations.confirmMatchResult);
  const resolveDispute = useMutation(api.operations.resolveDispute);
  const disqualify = useMutation(api.operations.disqualifyTeamOrPlayer);
  const createAnnouncement = useMutation(api.operations.createAnnouncement);

  // Local state for modals & forms
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'Normal' | 'Important' | 'Emergency'>('Normal');

  const [disqualifyTeamId, setDisqualifyTeamId] = useState('');
  const [disqualifyReason, setDisqualifyReason] = useState('');

  const [rescheduleMatchId, setRescheduleMatchId] = useState<Id<"matches"> | null>(null);
  const [newScheduleTime, setNewScheduleTime] = useState('');

  const [pauseMatchId, setPauseMatchId] = useState<Id<"matches"> | null>(null);
  const [pauseReasonText, setPauseReasonText] = useState('');

  if (!liveOverview) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-zinc-200 animate-pulse space-y-4">
        <div className="h-8 bg-zinc-200 rounded w-1/3"></div>
        <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
      </div>
    );
  }

  const { event, liveMatches, upcomingMatches, completedMatches, totalMatches, completedMatchesCount, champion, runnerUp } = liveOverview;

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;
    try {
      await createAnnouncement({
        eventId,
        title: announcementTitle,
        content: announcementContent,
        priority: announcementPriority,
        authorId: currentUserId,
      });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      alert('Announcement published and sent to participants!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisqualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disqualifyTeamId || !disqualifyReason) return;
    if (!confirm('Are you sure you want to disqualify this team? Pending matches will be forfeited.')) return;
    try {
      await disqualify({
        eventId,
        teamId: disqualifyTeamId as Id<"teams">,
        reason: disqualifyReason,
        adminId: currentUserId,
      });
      setDisqualifyTeamId('');
      setDisqualifyReason('');
      alert('Team disqualified successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleMatchId || !newScheduleTime) return;
    try {
      await updateSchedule({
        matchId: rescheduleMatchId,
        scheduledTime: newScheduleTime,
        adminId: currentUserId,
      });
      setRescheduleMatchId(null);
      setNewScheduleTime('');
      alert('Match rescheduled.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePauseMatch = async () => {
    if (!pauseMatchId) return;
    try {
      await updateStatus({
        matchId: pauseMatchId,
        status: 'Live',
        pauseReason: pauseReasonText || 'Match paused by referee',
        adminId: currentUserId,
      });
      setPauseMatchId(null);
      setPauseReasonText('');
      alert('Match paused.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveDisputeAction = async (disputeId: Id<"disputes">, resolution: string) => {
    try {
      await resolveDispute({
        disputeId,
        resolution,
        adminId: currentUserId,
        eventId,
      });
      alert(`Dispute resolved with action: ${resolution}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden mb-8">
      {/* Header Bar */}
      <div className="p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Tournament Ops Desk
            </span>
            <h2 className="text-xl font-black">{event.name}</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Status: <span className="text-emerald-400 font-bold">{event.status}</span> &bull; {completedMatchesCount}/{totalMatches} Matches Completed
          </p>
        </div>

        {champion && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Champion</div>
              <div className="text-sm font-bold text-amber-200">{champion.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/60 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-5 py-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Play className="w-4 h-4" /> Match Operations ({liveMatches.length} Live)
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-5 py-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'disputes'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Disputes Desk ({eventDisputes?.filter(d => d.status === 'Open').length || 0})
        </button>

        <button
          onClick={() => setActiveTab('disqualifications')}
          className={`px-5 py-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'disqualifications'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <UserX className="w-4 h-4" /> Disqualify
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-5 py-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" /> Broadcast Updates
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        {/* MATCHES CONSOLE */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Live Matches */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Live Games ({liveMatches.length})
              </h3>
              {liveMatches.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 text-center text-zinc-500 text-sm">
                  No games currently live.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveMatches.map((m) => (
                    <div key={m._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>{m.roundName}</span>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full font-bold">LIVE</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg">
                        <div className="flex items-center gap-2">
                          <span>{m.teamA?.name || 'TBD'}</span>
                          <span className="text-indigo-400 font-black">{m.teamAScore ?? 0}</span>
                        </div>
                        <span className="text-zinc-600 text-sm">VS</span>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-black">{m.teamBScore ?? 0}</span>
                          <span>{m.teamB?.name || 'TBD'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
                        <button
                          onClick={() => setPauseMatchId(m._id)}
                          className="flex-1 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl font-bold text-xs"
                        >
                          Pause Game
                        </button>
                        <button
                          onClick={() => updateStatus({ matchId: m._id, status: 'Completed', adminId: currentUserId })}
                          className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl font-bold text-xs"
                        >
                          Complete Game
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Matches */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Upcoming Matches
              </h3>
              {upcomingMatches.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 text-center text-zinc-500 text-sm">
                  No upcoming matches scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMatches.map((m) => (
                    <div key={m._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-zinc-400">{m.roundName} &bull; {m.scheduledTime || 'Time TBD'}</div>
                        <div className="font-bold text-sm mt-1">
                          {m.teamA?.name || 'TBD'} <span className="text-zinc-500 font-normal">vs</span> {m.teamB?.name || 'TBD'}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => updateStatus({ matchId: m._id, status: 'Live', adminId: currentUserId })}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" /> Start Match
                        </button>
                        <button
                          onClick={() => setRescheduleMatchId(m._id)}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DISPUTES DESK */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Reported Match Disputes
            </h3>
            {!eventDisputes || eventDisputes.length === 0 ? (
              <div className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800 text-center text-zinc-500 text-sm">
                No active disputes filed for this tournament.
              </div>
            ) : (
              <div className="space-y-4">
                {eventDisputes.map((d) => (
                  <div key={d._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          d.status === 'Open' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {d.status}
                        </span>
                        <h4 className="font-bold text-base mt-2">{d.reason}</h4>
                        <p className="text-xs text-zinc-400 mt-1">Reported by: <span className="text-white font-semibold">{d.reportingTeam?.name}</span></p>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        {d.match ? `${d.teamA?.name || 'Team A'} vs ${d.teamB?.name || 'Team B'}` : 'Match TBD'}
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-xl text-xs text-zinc-300 border border-zinc-800">
                      <strong>Description:</strong> {d.description}
                      {d.evidenceUrl && (
                        <div className="mt-2">
                          <a href={d.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-bold flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> View Submitted Evidence Image
                          </a>
                        </div>
                      )}
                    </div>

                    {d.status === 'Open' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                        <button
                          onClick={() => handleResolveDisputeAction(d._id, 'Confirm Team A')}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold"
                        >
                          Award Win to {d.teamA?.name || 'Team A'}
                        </button>
                        <button
                          onClick={() => handleResolveDisputeAction(d._id, 'Confirm Team B')}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold"
                        >
                          Award Win to {d.teamB?.name || 'Team B'}
                        </button>
                        <button
                          onClick={() => handleResolveDisputeAction(d._id, 'Replay Match')}
                          className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold"
                        >
                          Order Replay
                        </button>
                        <button
                          onClick={() => handleResolveDisputeAction(d._id, 'Reject Dispute')}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
                        >
                          Reject Dispute
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DISQUALIFICATIONS */}
        {activeTab === 'disqualifications' && (
          <div className="space-y-6">
            <form onSubmit={handleDisqualify} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4 max-w-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <UserX className="w-4 h-4" /> Disqualify Team / Player
              </h3>
              <p className="text-xs text-zinc-400">
                Disqualifying a team will forfeit their pending matches and advance their opponents automatically.
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Select Team ID</label>
                <input
                  type="text"
                  value={disqualifyTeamId}
                  onChange={(e) => setDisqualifyTeamId(e.target.value)}
                  placeholder="Enter Team ID..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Reason for Disqualification</label>
                <textarea
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                  placeholder="e.g. Unsportsmanlike conduct / Rule 4.2 violation..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs"
              >
                Confirm Disqualification
              </button>
            </form>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateAnnouncement} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4 max-w-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> Publish Event Broadcast
              </h3>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Round 2 Schedule Change..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Priority</label>
                <select
                  value={announcementPriority}
                  onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                >
                  <option value="Normal">Normal Broadcast</option>
                  <option value="Important">Important Update</option>
                  <option value="Emergency">Emergency Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Message Content</label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Broadcast message to all players..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 h-28"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
              >
                Send Announcement to Participants
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Previous Announcements</h4>
              {eventAnnouncements?.map((a) => (
                <div key={a._id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>{a.title}</span>
                    <span className="text-zinc-500 font-normal">{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-400">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <History className="w-4 h-4" /> Administrative Audit Trail
            </h3>
            {auditLogs?.length === 0 ? (
              <div className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800 text-center text-zinc-500 text-sm">
                No administrative actions logged yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs?.map((log) => (
                  <div key={log._id} className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 text-xs flex justify-between items-center gap-4">
                    <div>
                      <span className="font-bold text-indigo-400">{log.action}:</span>{' '}
                      <span className="text-zinc-300">{log.details}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 whitespace-nowrap">
                      {log.userName} &bull; {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleMatchId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Reschedule Match</h3>
            <input
              type="datetime-local"
              value={newScheduleTime}
              onChange={(e) => setNewScheduleTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
            />
            <div className="flex gap-2">
              <button onClick={() => setRescheduleMatchId(null)} className="flex-1 py-2 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-xs">
                Cancel
              </button>
              <button onClick={handleReschedule} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {pauseMatchId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Pause Match</h3>
            <input
              type="text"
              placeholder="Reason for pause (e.g. Technical pause)..."
              value={pauseReasonText}
              onChange={(e) => setPauseReasonText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
            />
            <div className="flex gap-2">
              <button onClick={() => setPauseMatchId(null)} className="flex-1 py-2 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-xs">
                Cancel
              </button>
              <button onClick={handlePauseMatch} className="flex-1 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs">
                Pause Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
