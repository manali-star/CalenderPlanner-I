import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Users, CheckCircle2, Clock3, Target, TrendingUp } from "lucide-react";

function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
  });
  const [warriors, setWarriors] = useState([]);
  const [submittedTasks, setSubmittedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', assignment_type: 'team', assigned_team_id: '', assigned_to: '', deadline: '', priority: 'medium' });
  const [teamName, setTeamName] = useState("");
  const [selectedWarrior, setSelectedWarrior] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("id,full_name,role,college_id").eq("id", user.id).maybeSingle();
      if (!profile) return;

const [tasksRes, warriorsRes, teamsRes] = await Promise.all([
  supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      assigned_team_id,
      assigned_to,
      assigned_college_id,
      proof_url,
      created_at,
      due_date
    `)
    .eq("assigned_college_id", profile.college_id), 

  supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      username,
      role,
      team_id,
      college_id
    `)
    .eq("college_id", profile.college_id)
    .eq("role", "warrior"),

  supabase
    .from("teams")
    .select(`
      id,
      team_name,
      college_id
    `)
    .eq("college_id", profile.college_id)
]);

      setTeams(teamsRes.data || []); // This saves the teams into our 'teams' storage

      const tasks = tasksRes.data || [];
      const pendingApprovals = tasks.filter(
          task => task.status === "submitted"
        );

setSubmittedTasks(pendingApprovals);
      const warriorsData = warriorsRes.data || [];

      // Calculate Stats
const completed = tasks.filter(
  t => t.status === "approved"
).length;
      const total = tasks.length;

      setStats({
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: total - completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });

const formattedWarriors = warriorsData.map((w) => {

  const warriorTasks = tasks.filter(
    (t) => t.assigned_to === w.id
  );

  const totalAssigned = warriorTasks.length;

  const approvedTasks = warriorTasks.filter(
    (t) => t.status === "approved"
  ).length;

  const submittedTasks = warriorTasks.filter(
    (t) => t.status === "submitted"
  ).length;

  const rejectedTasks = warriorTasks.filter(
    (t) => t.status === "rejected"
  ).length;

  const approvalRate =
    totalAssigned > 0
      ? Math.round((approvedTasks / totalAssigned) * 100)
      : 0;

  return {
    id: w.id,
    name: w.full_name,
    totalAssigned,
    approvedTasks,
    submittedTasks,
    rejectedTasks,
    approvalRate,
  };

}).sort((a, b) => b.approvalRate - a.approvalRate);

      setWarriors(formattedWarriors);
    } catch (error) {
      console.error("COLLEGE CO-ORDINATOR DASHBOARD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime Sync: Refresh data whenever tasks change
    const channel = supabase.channel("president-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const createTeam = async () => {

  if (!teamName.trim()) {
    alert("Enter team name");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("college_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("teams")
    .insert([
      {
        team_name: teamName,
        college_id: profile.college_id
      }
    ]);

  if (!error) {

    alert("Team created!");

    setTeamName("");

    const { data } = await supabase
    .from("teams")
    .select(`
      id,
      team_name,
      college_id
    `)
    .eq("college_id", profile.college_id);

    setTeams(data || []);

  } else {

    alert(error.message);

  }
};

const addWarriorToTeam = async () => {

  if (!selectedTeam || !selectedWarrior) {
    alert("Select team and warrior");
    return;
  }

  const { error } = await supabase
    .from("team_members")
    .insert([
      {
        team_id: selectedTeam,
        user_id: selectedWarrior
      }
    ]);

  if (!error) {

    alert("Warrior added to team!");

  } else {

    alert(error.message);

  }
};

  const handleAssignTask = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
  .from("profiles")
  .select("college_id")
  .eq("id", user.id)
  .maybeSingle();

const payload = {
  title: newTask.title,
  deadline: newTask.deadline,
  priority: newTask.priority,
  assignment_type: newTask.assignment_type,
  assigned_team_id:
    newTask.assignment_type === "team"
      ? newTask.assigned_team_id
      : null,

  assigned_to:
    newTask.assignment_type === "individual"
      ? newTask.assigned_to
      : null,

  assigned_college_id: profile.college_id,
  created_by: user.id,
  status: "pending"
};

const { error } = await supabase
  .from("tasks")
  .insert([payload]);

    if (!error) {
      alert("Task successfully assigned to the team!");
      setNewTask({ title: '', assigned_team_id: '', deadline: '', priority: 'medium' });
      fetchData(); // This reloads the stats on your screen
    } else {
      alert("Error: " + error.message);
    }
  };

const handleReviewTask = async (taskId, newStatus) => {

  let rejectionReason = "";

  // Ask reason only when rejecting
  if (newStatus === "rejected") {
    rejectionReason = prompt(
      "Enter reason for rejection:"
    );

    if (!rejectionReason) {
      alert("Rejection reason is required.");
      return;
    }
  }

  const updateData = {
    status: newStatus,
  };

  // Save rejection feedback
  if (newStatus === "rejected") {
    updateData.rejection_reason = rejectionReason;
  }

  // Clear old rejection message on approval
  if (newStatus === "approved") {
    updateData.rejection_reason = null;
  }

  const { data: taskData } = await supabase
  .from("tasks")
  .select(`
    id,
    title,
    assigned_to,
    assigned_team_id,
    status,
    proof_url,
    assigned_college_id
  `)
  .eq("id", taskId)
  .maybeSingle();

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (!error) {

    alert(
      newStatus === "approved"
        ? "Task Approved!"
        : "Task Rejected with Feedback"
    );
const { data: assignedProfile } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", taskData.assigned_to)
  .maybeSingle();

if (assignedProfile?.user_id) {

  await supabase.from("notifications").insert([
    {
      user_id: assignedProfile.user_id,
      message:
        newStatus === "approved"
          ? `Your task "${taskData.title}" was approved`
          : `Your task "${taskData.title}" was rejected`,
      type:
        newStatus === "approved"
          ? "task_approved"
          : "task_rejected"
    }
  ]);

}
    fetchData();

  } else {
    alert("Error: " + error.message);
  }
};

  if (loading) return <div className="p10 text-white animate-pulse font-black">SCANNING TEAM DATA...</div>;

  return (
    <div className="space-y-8 p-6">
      {/* Background Glow */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-5xl font-black text-white mb-2">
          College Co-ordinator Dashboard
        </motion.h1>
        <p className="text-gray-400 text-lg">Central command for team metrics and warrior productivity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <PresidentStat title="Total Tasks" value={stats.totalTasks} icon={Target} color="text-white" />
        <PresidentStat title="Completed" value={stats.completedTasks} icon={CheckCircle2} color="text-green-400" />
        <PresidentStat title="Pending" value={stats.pendingTasks} icon={Clock3} color="text-yellow-400" />
        <PresidentStat title="Completion" value={`${stats.completionRate}%`} icon={TrendingUp} color="text-red-400" />
      </div>

      {/* Performance List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 mt-10">
        <h2 className="text-3xl font-black text-white mb-8">Warrior Ranking</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {warriors.map((warrior, index) => (
            <div key={warrior.id} className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-red-500/30 transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-red-400 font-bold border border-white/10 group-hover:bg-red-500 group-hover:text-white transition-all">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{warrior.name}</h3>
                  <p className="text-gray-500 text-sm">{warrior.approvedTasks} Approved • {warrior.submittedTasks} Pending • {warrior.rejectedTasks} Rejected</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
<div className="flex items-center gap-4 min-w-[260px] justify-end">

  <p className="text-xs text-gray-400 font-bold whitespace-nowrap">
    {warrior.approvalRate}% Success Rate
  </p>

  <div className="hidden md:block w-32 h-2 bg-white/5 rounded-full overflow-hidden">

    <div
      className="h-full bg-red-500"
      style={{ width: `${Math.min(100, warrior.approvalRate)}%` }}
    />

  </div>

</div>
<span
  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
    warrior.approvalRate >= 80
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : warrior.approvalRate >= 50
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20"
  }`}
>
  {warrior.approvalRate >= 80
    ? "Elite"
    : warrior.approvalRate >= 50
    ? "Active"
    : "Needs Attention"}
</span>
              </div>
            </div>
          ))}
        </div>

        <div
  onClick={() => navigate("/activities")}
  className="
    mt-8
    cursor-pointer
    rounded-3xl
    border
    border-yellow-500/20
    bg-yellow-500/10
    p-6
    transition-all
    hover:bg-yellow-500/15
    hover:border-yellow-500/40
  "
>

  <div className="flex items-center justify-between">

    <div>

      <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.2em]">
        Pending Activity Alerts
      </p>

      <h2 className="text-3xl font-black text-white mt-2">
        {submittedTasks.length} Activities Await Review
      </h2>

      <p className="text-gray-400 mt-2 text-sm">
        Click to review submissions, verify proofs, and approve/reject activities.
      </p>

    </div>

    <div className="text-5xl">
      ⚠️
    </div>

  </div>

</div>

      </motion.div>

    </div>
  );
}

// Sub-component for consistent stat cards
const PresidentStat = ({ title, value, icon: Icon, color }) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 group hover:border-red-500/20 transition-all">
    <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/5 blur-3xl rounded-full" />
    <div className="relative z-10 flex flex-col">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
        <Icon size={24} className="text-red-500" />
      </div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <h2 className={`text-4xl font-black ${color}`}>{value}</h2>
    </div>
  </div>
);

export default CoordinatorDashboard;