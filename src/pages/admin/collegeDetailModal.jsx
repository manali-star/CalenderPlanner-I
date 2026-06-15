import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, CheckCircle2, Clock3, ExternalLink, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─── FORMAT DATE HELPER ───────────────────────────────────────────────────────
function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── STATUS CONFIG — aligned with the multi-officer workflow ─────────────────
const STATUS = {
  completed:               { label: "Completed",             color: "bg-green-500/10 border-green-500/20 text-green-400" },
  pending_officer_review:  { label: "Pending Officer Review", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  awaiting_coordinator:    { label: "Awaiting Coordinator",   color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
  returned_by_coordinator: { label: "Returned for Revision",  color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  revision_requested:      { label: "Revision Requested",     color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  rejected_by_officer:     { label: "Rejected",               color: "bg-red-500/10 border-red-500/20 text-red-400" },
  planned:                 { label: "Assigned",               color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
};

const TABS = ["Overview", "Teams", "Task Records", "Proof Vault"];

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export default function CollegeDetailModal({ college, onClose }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState({});       // { team_id: [profile,...] }
  const [warriors, setWarriors] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── FETCH ALL DATA FOR THIS COLLEGE ──────────────────────────────────────
  useEffect(() => {
    if (!college) return;

    const load = async () => {
      setLoading(true);

      // 1. Teams
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .eq("college_id", college.id)
        .order("created_at", { ascending: true });

      const teamsArr = teamsData || [];
      setTeams(teamsArr);

      // 2. Warriors (profiles) of this college
      const { data: warriorsData } = await supabase
        .from("profiles")
        .select("id, full_name, username, role")
        .eq("college_id", college.id);

      setWarriors(warriorsData || []);

      // 3. All tasks assigned to this college
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_college_id", college.id)
        .order("created_at", { ascending: false });

      setTasks(tasksData || []);

      // 4. Team members for each team
      if (teamsArr.length > 0) {
        const teamIds = teamsArr.map(t => t.id);
        const { data: tmData } = await supabase
          .from("team_members")
          .select("team_id, user_id")
          .in("team_id", teamIds);

        if (tmData && tmData.length > 0) {
          const userIds = [...new Set(tmData.map(m => m.user_id))];
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, username, role")
            .in("id", userIds);

          const profileMap = {};
          (profileData || []).forEach(p => { profileMap[p.id] = p; });

          const grouped = {};
          tmData.forEach(m => {
            if (!grouped[m.team_id]) grouped[m.team_id] = [];
            const profile = profileMap[m.user_id];
            if (profile) grouped[m.team_id].push(profile);
          });
          setMembers(grouped);
        }
      }

      setLoading(false);
    };

    load();
  }, [college]);

  if (!college) return null;

  // ── HELPER: resolve a human-readable "assigned to" label for a task ──────
  const getAssignedLabel = (task) => {
    if (task.activity_type === "Mass Activity") {
      return "All Teams (Mass Activity)";
    }
    if (task.assignment_type === "team") {
      const team = teams.find(t => t.id === task.assigned_team_id);
      return team?.team_name || "Unknown Team";
    }
    return task.assigned_user_name || "Warrior";
  };

  // ── COMPUTED STATS ────────────────────────────────────────────────────────
  const completed             = tasks.filter(t => t.status === "completed").length;
  const pendingOfficerReview  = tasks.filter(t => t.status === "pending_officer_review").length;
  const awaitingCoordinator   = tasks.filter(t => t.status === "awaiting_coordinator").length;
  const returnedForRevision   = tasks.filter(t => t.status === "returned_by_coordinator" || t.status === "revision_requested").length;
  const rejected              = tasks.filter(t => t.status === "rejected_by_officer").length;
  const planned               = tasks.filter(t => t.status === "planned").length;
  const proofs                = tasks.filter(t => t.proof_url);

  return (
    <AnimatePresence>
      {/* BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
      />

      {/* PANEL */}
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-4xl bg-[#060d1a] border-l border-white/10 z-[300] flex flex-col overflow-hidden"
      >
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between p-8 border-b border-white/10 bg-gradient-to-r from-[#0d1a2e] to-[#060d1a] shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">
                🏛️
              </div>
              <span className="text-[10px] font-black tracking-[0.3em] text-yellow-400 uppercase">College Intelligence</span>
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">{college.name}</h2>
            <p className="text-gray-400 mt-1">{college.location || "Campus Chapter"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 px-8 pt-5 pb-0 border-b border-white/10 shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab
                  ? "text-yellow-400 border-yellow-400 bg-yellow-500/5"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {tab}
              {tab === "Proof Vault" && proofs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px]">
                  {proofs.length}
                </span>
              )}
              {tab === "Teams" && teams.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">
                  {teams.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-yellow-500/40 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4" />
                Loading college intelligence...
              </div>
            </div>
          ) : (
            <>
              {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
              {activeTab === "Overview" && (
                <div className="space-y-6">
                  {/* STAT ROW */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatTile icon={<Users size={18} className="text-blue-400" />} label="Teams" value={teams.length} color="text-blue-400" />
                    <StatTile icon={<Users size={18} className="text-purple-400" />} label="Warriors" value={warriors.filter(w => w.role === "warrior").length} color="text-purple-400" />
                    <StatTile icon={<CheckCircle2 size={18} className="text-green-400" />} label="Completed" value={completed} color="text-green-400" />
                    <StatTile icon={<Shield size={18} className="text-yellow-400" />} label="Total Tasks" value={tasks.length} color="text-yellow-400" />
                  </div>

                  {/* TASK STATUS BREAKDOWN */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-lg font-black text-white mb-5">Task Status Breakdown</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Completed",              count: completed,            total: tasks.length, color: "bg-green-500" },
                        { label: "Pending Officer Review", count: pendingOfficerReview, total: tasks.length, color: "bg-yellow-500" },
                        { label: "Awaiting Coordinator",   count: awaitingCoordinator,  total: tasks.length, color: "bg-purple-500" },
                        { label: "Returned for Revision",  count: returnedForRevision,  total: tasks.length, color: "bg-orange-500" },
                        { label: "Rejected",               count: rejected,             total: tasks.length, color: "bg-red-500" },
                        { label: "Assigned",               count: planned,              total: tasks.length, color: "bg-blue-500" },
                      ].map(row => (
                        <div key={row.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">{row.label}</span>
                            <span className="text-white font-bold">{row.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.color} transition-all duration-700`}
                              style={{ width: row.total > 0 ? `${Math.round((row.count / row.total) * 100)}%` : "0%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROOFS QUICK STAT */}
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.04] p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">Proof Submissions</p>
                      <p className="text-4xl font-black text-white">{proofs.length}</p>
                      <p className="text-gray-400 text-sm mt-1">proof documents on record</p>
                    </div>
                    <div className="text-5xl">📁</div>
                  </div>
                </div>
              )}

              {/* ════════════════════ TEAMS TAB ════════════════════ */}
              {activeTab === "Teams" && (
                <div className="space-y-4">
                  {teams.length === 0 ? (
                    <EmptyState icon="👥" message="No teams found for this college." />
                  ) : (
                    teams.map((team, idx) => {
                      const teamMembers = members[team.id] || [];
                      const isExpanded = expandedTeam === team.id;
                      const teamTasks = tasks.filter(t => t.assigned_team_id === team.id);
                      const teamCompleted = teamTasks.filter(t => t.status === "completed").length;

                      return (
                        <motion.div
                          key={team.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                        >
                          {/* TEAM HEADER ROW — clickable */}
                          <button
                            onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-all text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm">
                                T{idx + 1}
                              </div>
                              <div>
                                <p className="text-white font-bold text-lg">{team.team_name || team.name}</p>
                                <p className="text-gray-500 text-sm">{teamMembers.length} members · {teamTasks.length} tasks · {teamCompleted} completed</p>
                              </div>
                            </div>
                            {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                          </button>

                          {/* EXPANDED: MEMBER LIST */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-white/10 overflow-hidden"
                              >
                                <div className="p-5 space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Team Members</p>
                                  {teamMembers.length === 0 ? (
                                    <p className="text-gray-600 text-sm">No members assigned yet.</p>
                                  ) : (
                                    teamMembers.map(m => (
                                      <div key={m.id} className="flex items-center justify-between py-2 px-4 rounded-xl bg-black/20 border border-white/5">
                                        <div className="flex items-center gap-3">
                                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-black">
                                            {m.full_name?.[0]?.toUpperCase() || "?"}
                                          </div>
                                          <span className="text-white text-sm font-medium">{m.full_name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">@{m.username}</span>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* TEAM'S TASKS MINI-LIST */}
                                {teamTasks.length > 0 && (
                                  <div className="px-5 pb-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Team Tasks</p>
                                    <div className="space-y-2">
                                      {teamTasks.map(t => {
                                        const cfg = STATUS[t.status] || STATUS.planned;
                                        return (
                                          <div key={t.id} className="flex items-center justify-between py-2 px-4 rounded-xl bg-black/20 border border-white/5">
                                            <span className="text-white text-sm font-medium truncate max-w-[60%]">{t.title}</span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${cfg.color}`}>{cfg.label}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ════════════════════ TASK RECORDS TAB ════════════════════ */}
              {activeTab === "Task Records" && (
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <EmptyState icon="📋" message="No tasks found for this college." />
                  ) : (
                    tasks.map((task, idx) => {
                      const cfg = STATUS[task.status] || STATUS.planned;

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="rounded-2xl border border-white/10 bg-white/5 p-5"
                        >
                          {/* TOP ROW */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-base leading-snug truncate">{task.title}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {task.activity_type || "Technical"} · Created {fmt(task.created_at)}
                              </p>
                            </div>
                            <span className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>

                          {/* META GRID */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <MetaCell label="Assigned To" value={getAssignedLabel(task)} />
                            <MetaCell label="Due Date" value={task.due_date ? fmt(task.due_date) : "No due date"} />
                            <MetaCell label="Activity Type" value={task.activity_type || "Technical"} />
                            {task.completion_date && (
                              <MetaCell label="Submitted On" value={fmt(task.completion_date)} highlight />
                            )}
                            {task.proof_text && (
                              <div className="col-span-2 md:col-span-3 rounded-xl bg-black/20 border border-white/5 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Warrior Notes</p>
                                <p className="text-gray-300 text-sm leading-relaxed">{task.proof_text}</p>
                              </div>
                            )}
                            {task.remarks && (
                              <div className="col-span-2 md:col-span-3 rounded-xl bg-black/20 border border-white/5 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Remarks</p>
                                <p className="text-gray-300 text-sm leading-relaxed">{task.remarks}</p>
                              </div>
                            )}
                            {task.rejection_reason && (
                              <div className="col-span-2 md:col-span-3 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-red-500 mb-1">Rejection Reason</p>
                                <p className="text-red-300 text-sm leading-relaxed">{task.rejection_reason}</p>
                              </div>
                            )}
                            {task.coordinator_feedback && (
                              <div className="col-span-2 md:col-span-3 rounded-xl bg-orange-500/5 border border-orange-500/20 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-orange-400 mb-1">Coordinator Feedback</p>
                                <p className="text-orange-300 text-sm leading-relaxed">{task.coordinator_feedback}</p>
                              </div>
                            )}
                          </div>

                          {/* PROOF LINK INLINE */}
                          {task.proof_url && (
                            
                              href={task.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-all"
                            >
                              <ExternalLink size={12} /> View Proof
                            </a>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ════════════════════ PROOF VAULT TAB ════════════════════ */}
              {activeTab === "Proof Vault" && (
                <div className="space-y-4">
                  {proofs.length === 0 ? (
                    <EmptyState icon="📂" message="No proof submissions on record for this college." />
                  ) : (
                    <>
                      <p className="text-gray-500 text-sm">{proofs.length} proof document{proofs.length !== 1 ? "s" : ""} submitted by warriors of {college.name}.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proofs.map((task, idx) => {
                          const cfg = STATUS[task.status] || STATUS.planned;
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.04 }}
                              className="rounded-2xl border border-yellow-500/10 bg-black/30 p-5 hover:border-yellow-500/30 transition-all group"
                            >
                              {/* ICON + TITLE */}
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-2xl shrink-0">
                                  📄
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-bold leading-snug truncate">{task.title}</p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    {task.activity_type || "Technical"} · {getAssignedLabel(task)}
                                  </p>
                                </div>
                                <span className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-black border ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                              </div>

                              {/* DATES */}
                              <div className="space-y-1.5 mb-4 text-xs">
                                {task.completion_date && (
                                  <div className="flex items-center gap-2 text-yellow-300/80">
                                    <Clock3 size={11} />
                                    <span>Submitted: {fmt(task.completion_date)}</span>
                                  </div>
                                )}
                                {task.due_date && (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <Clock3 size={11} />
                                    <span>Due: {fmt(task.due_date)}</span>
                                  </div>
                                )}
                              </div>

                              {/* NOTES SNIPPET */}
                              {(task.proof_text || task.remarks) && (
                                <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2 italic">
                                  "{task.proof_text || task.remarks}"
                                </p>
                              )}

                              {/* OPEN PROOF BUTTON */}
                              
                                href={task.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-sm hover:bg-yellow-500/20 group-hover:shadow-lg group-hover:shadow-yellow-500/10 transition-all"
                              >
                                <ExternalLink size={14} />
                                Open Proof Document
                              </a>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── TINY HELPER COMPONENTS ───────────────────────────────────────────────────
function StatTile({ icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span></div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function MetaCell({ label, value, highlight }) {
  return (
    <div className={`rounded-xl px-4 py-3 border ${highlight ? "bg-yellow-500/5 border-yellow-500/10" : "bg-black/20 border-white/5"}`}>
      <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-yellow-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
