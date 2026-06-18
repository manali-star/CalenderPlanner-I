import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  FileText,
  Building2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ── FORMAT DATE ──────────────────────────────────────────────────────────────
function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS = {
  completed:               { label: "Completed",             color: "bg-green-500/10 border-green-500/20 text-green-400" },
  pending_officer_review:  { label: "Pending Review",        color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  awaiting_coordinator:    { label: "Awaiting Coordinator",  color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
  returned_by_coordinator: { label: "Returned for Revision", color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  revision_requested:      { label: "Revision Requested",    color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  rejected_by_officer:     { label: "Rejected",              color: "bg-red-500/10 border-red-500/20 text-red-400" },
  planned:                 { label: "Assigned",              color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
};

function getStatusCfg(status) {
  return STATUS[status] || STATUS.planned;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CollegeReportPage() {
  const { collegeId } = useParams();
  const navigate = useNavigate();

  const [college, setCollege] = useState(null);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState({});   // { team_id: [profile, ...] }
  const [loading, setLoading] = useState(true);

  // which team rows are expanded
  const [expandedTeam, setExpandedTeam] = useState(null);
  // which task rows inside a team are expanded
  const [expandedTask, setExpandedTask] = useState(null);

  // active filter: "all" | "completed" | "pending" | "proof"
  const [filter, setFilter] = useState("all");

  // ── LOAD DATA ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!collegeId) return;

    const load = async () => {
      setLoading(true);

      // 1. College info
      const { data: collegeData } = await supabase
        .from("colleges")
        .select("*")
        .eq("id", collegeId)
        .maybeSingle();

      setCollege(collegeData);

      // 2. Teams of this college
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .eq("college_id", collegeId)
        .order("created_at", { ascending: true });

      const teamsArr = teamsData || [];
      setTeams(teamsArr);

      // 3. All tasks for this college
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_college_id", collegeId)
        .order("created_at", { ascending: false });

      setTasks(tasksData || []);

      // 4. Team members
      if (teamsArr.length > 0) {
        const teamIds = teamsArr.map((t) => t.id);
        const { data: tmData } = await supabase
          .from("team_members")
          .select("team_id, user_id")
          .in("team_id", teamIds);

        if (tmData && tmData.length > 0) {
          const userIds = [...new Set(tmData.map((m) => m.user_id))];
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, username, role")
            .in("id", userIds);

          const profileMap = {};
          (profileData || []).forEach((p) => { profileMap[p.id] = p; });

          const grouped = {};
          tmData.forEach((m) => {
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
  }, [collegeId]);

  // ── COMPUTED HEADER STATS ──────────────────────────────────────────────────
  const totalTasks     = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const proofCount     = tasks.filter((t) => t.proof_url).length;
  const pendingCount   = tasks.filter(
    (t) => t.status === "pending_officer_review" || t.status === "awaiting_coordinator"
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b16] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-yellow-500/40 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading college report...</p>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-[#060b16] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-2xl font-black mb-4">College not found</p>
          <button
            onClick={() => navigate("/college-management")}
            className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b16] text-white">

      {/* ── PAGE HEADER ── */}
      <div className="sticky top-0 z-50 bg-[#060b16]/95 backdrop-blur-sm border-b border-white/5">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/college-management")}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl shrink-0">
              🏛️
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight truncate">{college.name}</h1>
              <p className="text-gray-500 text-xs">
                {college.code} · {college.city || "Campus Chapter"} ·{" "}
                <span className={college.active ? "text-green-400" : "text-red-400"}>
                  {college.active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>

          {/* completion badge */}
          <div className="shrink-0 text-right">
            <p className="text-3xl font-black text-yellow-400">{completionRate}%</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Completion</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8 max-w-7xl mx-auto">

        {/* ── SUMMARY STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={<Users size={18} className="text-blue-400" />} label="Teams" value={teams.length} color="text-blue-400" />
          <SummaryCard icon={<FileText size={18} className="text-yellow-400" />} label="Total Tasks" value={totalTasks} color="text-yellow-400" />
          <SummaryCard icon={<CheckCircle2 size={18} className="text-green-400" />} label="Completed" value={completedCount} color="text-green-400" />
          <SummaryCard icon={<Building2 size={18} className="text-purple-400" />} label="Proofs Filed" value={proofCount} color="text-purple-400" />
        </div>

        {/* ── FILTER BAR ── */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all",       label: `All Tasks (${totalTasks})` },
            { key: "completed", label: `Completed (${completedCount})` },
            { key: "pending",   label: `In Review (${pendingCount})` },
            { key: "proof",     label: `Has Proof (${proofCount})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                filter === f.key
                  ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── TEAMS LIST ── */}
        {teams.length === 0 ? (
          <EmptyState icon="👥" message="No teams registered for this college yet." />
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
              {teams.length} Team{teams.length !== 1 ? "s" : ""} — click any team to expand
            </p>

            {teams.map((team, teamIdx) => {
              const teamMembers  = members[team.id] || [];
              const allTeamTasks = tasks.filter((t) => t.assigned_team_id === team.id);

              // apply filter
              const filteredTeamTasks = allTeamTasks.filter((t) => {
                if (filter === "completed") return t.status === "completed";
                if (filter === "pending")   return t.status === "pending_officer_review" || t.status === "awaiting_coordinator";
                if (filter === "proof")     return !!t.proof_url;
                return true;
              });

              const teamCompleted = allTeamTasks.filter((t) => t.status === "completed").length;
              const teamProofs    = allTeamTasks.filter((t) => t.proof_url).length;
              const teamRate      = allTeamTasks.length > 0
                ? Math.round((teamCompleted / allTeamTasks.length) * 100)
                : 0;

              const isTeamExpanded = expandedTeam === team.id;

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: teamIdx * 0.04 }}
                  className="rounded-2xl border border-white/10 bg-[#0d1424] overflow-hidden"
                >
                  {/* ── TEAM HEADER ── */}
                  <button
                    onClick={() => setExpandedTeam(isTeamExpanded ? null : team.id)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      {/* Team badge */}
                      <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-black text-sm shrink-0">
                        T{teamIdx + 1}
                      </div>

                      <div>
                        <p className="text-white font-bold text-lg leading-tight">
                          {team.team_name || team.name}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {teamMembers.length} members ·{" "}
                          {allTeamTasks.length} tasks ·{" "}
                          {teamCompleted} completed ·{" "}
                          {teamProofs} proof{teamProofs !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* mini progress bar */}
                      <div className="hidden md:flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-yellow-500 transition-all duration-700"
                            style={{ width: `${teamRate}%` }}
                          />
                        </div>
                        <span className="text-yellow-400 font-bold text-sm w-10 text-right">
                          {teamRate}%
                        </span>
                      </div>

                      {isTeamExpanded
                        ? <ChevronDown size={18} className="text-gray-400" />
                        : <ChevronRight size={18} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* ── EXPANDED CONTENT ── */}
                  <AnimatePresence>
                    {isTeamExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/5 overflow-hidden"
                      >
                        <div className="px-6 pt-5 pb-2">

                          {/* MEMBERS */}
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                            Team Members
                          </p>
                          {teamMembers.length === 0 ? (
                            <p className="text-gray-600 text-sm mb-5">No members assigned yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2 mb-5">
                              {teamMembers.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-white/5"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-black">
                                    {m.full_name?.[0]?.toUpperCase() || "?"}
                                  </div>
                                  <span className="text-white text-sm font-medium">{m.full_name}</span>
                                  <span className="text-gray-500 text-xs">@{m.username}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* TASKS */}
                        <div className="px-6 pb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                            {filteredTeamTasks.length} Task{filteredTeamTasks.length !== 1 ? "s" : ""}
                            {filter !== "all" ? ` (filtered: ${filter})` : ""}
                          </p>

                          {filteredTeamTasks.length === 0 ? (
                            <EmptyState icon="📋" message="No tasks match the current filter for this team." />
                          ) : (
                            <div className="space-y-3">
                              {filteredTeamTasks.map((task, taskIdx) => {
                                const cfg = getStatusCfg(task.status);
                                const taskKey = `${team.id}-${task.id}`;
                                const isTaskExpanded = expandedTask === taskKey;

                                return (
                                  <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: taskIdx * 0.03 }}
                                    className="rounded-xl border border-white/5 bg-black/20 overflow-hidden"
                                  >
                                    {/* TASK SUMMARY ROW */}
                                    <button
                                      onClick={() =>
                                        setExpandedTask(isTaskExpanded ? null : taskKey)
                                      }
                                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-all text-left"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="text-gray-500 text-xs font-mono w-4 shrink-0">
                                          {taskIdx + 1}
                                        </span>
                                        <span className="text-white text-sm font-semibold truncate">
                                          {task.title}
                                        </span>
                                        {task.proof_url && (
                                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black">
                                            📄 PROOF
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <span
                                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border hidden sm:inline ${cfg.color}`}
                                        >
                                          {cfg.label}
                                        </span>
                                        {isTaskExpanded
                                          ? <ChevronDown size={14} className="text-gray-500" />
                                          : <ChevronRight size={14} className="text-gray-500" />}
                                      </div>
                                    </button>

                                    {/* TASK DETAIL PANEL */}
                                    <AnimatePresence>
                                      {isTaskExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.18 }}
                                          className="border-t border-white/5 overflow-hidden"
                                        >
                                          <div className="p-4 space-y-4">

                                            {/* STATUS BADGE (mobile) */}
                                            <span className={`sm:hidden inline-block px-3 py-1 rounded-full text-[10px] font-black border ${cfg.color}`}>
                                              {cfg.label}
                                            </span>

                                            {/* META GRID */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                              <MetaCell
                                                label="Activity Type"
                                                value={task.activity_type || "Technical"}
                                              />
                                              <MetaCell
                                                label="Activity Date"
                                                value={task.activity_date ? fmt(task.activity_date) : "—"}
                                              />
                                              <MetaCell
                                                label="Due Date"
                                                value={task.due_date ? fmt(task.due_date) : "No due date"}
                                              />
                                              <MetaCell
                                                label="Venue"
                                                value={task.venue || "—"}
                                              />
                                              <MetaCell
                                                label="Target Students"
                                                value={task.target_students ?? "—"}
                                              />
                                              <MetaCell
                                                label="Students Reached"
                                                value={task.audience_count ?? "—"}
                                              />
                                            </div>

                                            {/* ── CHANGE 1 INTEGRATION: Submission timestamp ── */}
                                            {task.completion_date && (
                                              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                                <Clock size={16} className="text-yellow-400 shrink-0" />
                                                <div>
                                                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">
                                                    Proof Submitted On
                                                  </p>
                                                  <p className="text-yellow-300 font-semibold text-sm">
                                                    {fmt(task.completion_date)}
                                                  </p>
                                                </div>
                                              </div>
                                            )}

                                            {/* NOTES & REMARKS */}
                                            {task.proof_text && (
                                              <div className="rounded-xl bg-black/30 border border-white/5 px-4 py-3">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                                                  Warrior Notes
                                                </p>
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                  {task.proof_text}
                                                </p>
                                              </div>
                                            )}

                                            {task.remarks && (
                                              <div className="rounded-xl bg-black/30 border border-white/5 px-4 py-3">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                                                  Remarks
                                                </p>
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                  {task.remarks}
                                                </p>
                                              </div>
                                            )}

                                            {task.rejection_reason && (
                                              <div className="rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3">
                                                <p className="text-[10px] uppercase tracking-widest text-red-500 mb-1">
                                                  Rejection Reason
                                                </p>
                                                <p className="text-red-300 text-sm leading-relaxed">
                                                  {task.rejection_reason}
                                                </p>
                                              </div>
                                            )}

                                            {/* APPROVAL CHECKLIST */}
                                            <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3">
                                              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">
                                                Approval Chain
                                              </p>
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {[
                                                  { label: "Secretary",    approved: task.secretary_approved },
                                                  { label: "Activity Dir", approved: task.activity_approved },
                                                  { label: "Media Dir",    approved: task.media_approved },
                                                  { label: "President",    approved: task.president_approved },
                                                ].map((step) => (
                                                  <div
                                                    key={step.label}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
                                                      step.approved
                                                        ? "bg-green-500/5 border-green-500/20 text-green-400"
                                                        : "bg-white/5 border-white/5 text-gray-500"
                                                    }`}
                                                  >
                                                    <span>{step.approved ? "✓" : "○"}</span>
                                                    <span>{step.label}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>

                                            {/* ── PROOF DOCUMENT LINK ── */}
                                            {task.proof_url ? (
                                              <a
                                                href={task.proof_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-sm hover:bg-yellow-500/20 transition-all"
                                              >
                                                <ExternalLink size={14} />
                                                Open Proof Document
                                              </a>
                                            ) : (
                                              <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/5 text-gray-600 text-sm">
                                                No proof submitted yet
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── HELPER COMPONENTS ────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
