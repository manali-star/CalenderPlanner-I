import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Target,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";

function WarriorDashboard() {
    const [activities, setActivities] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingTaskId, setUploadingTaskId] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;


// GET ALL TEAM IDS
const { data: memberTeams } = await supabase
  .from("team_members")
  .select("team_id")
  .eq("user_id", user.id);

const teamIds =
  memberTeams?.map(team => team.team_id) || [];

// FETCH INDIVIDUAL TASKS
const { data: personalTasks, error: personalError } =
  await supabase
    .from("tasks")
    .select("*")
    .eq("assigned_to", user.id);

// FETCH TEAM TASKS
let teamTasks = [];

if (teamIds.length > 0) {

  const {
    data: fetchedTeamTasks,
    error: teamError
  } = await supabase
    .from("tasks")
    .select("*")
    .in("assigned_team_id", teamIds);

  if (teamError) {
    console.error(teamError);
  } else {
    teamTasks = fetchedTeamTasks || [];
  }

}

// MERGE TASKS
const mergedTasks = [
  ...(personalTasks || []),
  ...teamTasks
];

// REMOVE DUPLICATES
const uniqueTasks = Array.from(
  new Map(
    mergedTasks.map(task => [task.id, task])
  ).values()
);

const data = uniqueTasks;

const error = personalError;

      if (error) {
        console.error("WARRIOR FETCH ERROR:", error);
        toast.error("Failed to load tasks");
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    };

    fetchActivities();
  }, []);

  const handleSubmitProof = async (activityId) => {
  if (!proofFile) {
    toast.error("Please upload a proof file");
    return;
  }

  try {
    setUploadingTaskId(activityId);

    const fileExt = proofFile.name.split(".").pop();
    const fileName = `${activityId}-${Date.now()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("activity-proofs")
      .upload(fileName, proofFile);

    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("activity-proofs")
      .getPublicUrl(fileName);

    const proofUrl = data.publicUrl;

    // Update task
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: "submitted",
        proof_url: proofUrl,
        remarks: remarks,
      })
      .eq("id", activityId);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Task submitted for approval!");

    setTasks((prev) =>
      prev.map((task) =>
        task.id === activityId
          ? {
              ...task,
              status: "submitted",
              proof_url: proofUrl,
              remarks,
            }
          : task
      )
    );

    setProofFile(null);
    setRemarks("");
    setUploadingTaskId(null);

  } catch (err) {
    console.error(err);
    toast.error("Submission failed");
  }
};

  // Stats Calculations
  const completedTasks = activities.filter((item) => item.status === "approved").length;
  const pendingTasks = activities.filter((item) => item.status !== "approved" && item.status !== "rejected").length;
  const overdueTasks = activities.filter(
    (item) => item.deadline && new Date(item.deadline) < new Date() && item.status !== "approved"
  ).length;

const overallProgress =
  activities.length > 0
    ? Math.round((completedTasks / activities.length) * 100)
    : 0;

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const focusTask = activities.find((t) => t.status !== "approved" && t.priority === "high") || 
                    activities.find((t) => t.status !== "completed");

  const upcomingDeadlines = activities
    .filter((task) => task.status !== "approved" && task.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3)
    .map((task) => {
      const diff = new Date(task.deadline) - new Date();
      return {
        ...task,
        daysLeft: Math.ceil(diff / (1000 * 60 * 60 * 24)),
      };
    });

  // Chart Data Calculation
const monthlyData = [
  { week: "Week 1", value: 0, count: 0 },
  { week: "Week 2", value: 0, count: 0 },
  { week: "Week 3", value: 0, count: 0 },
  { week: "Week 4", value: 0, count: 0 },
];

activities.forEach((task, index) => {

  // DISTRIBUTE TASKS ACROSS 4 WEEKS
  const idx = index % 4;

// COUNT TOTAL TASKS
monthlyData[idx].count += 1;

// COUNT PRODUCTIVE TASKS
if (
  task.status === "approved" ||
  task.status === "completed" ||
  task.status === "verified" ||
  task.status === "submitted"
) {
  monthlyData[idx].value += 1;
}

});

  const finalChartData = monthlyData.map(d => ({
    week: d.week,
    value: d.value * 25
  }));

  if (loading) return <div className="p-10 text-white">Loading Dashboard...</div>;

  return (
    <div className="space-y-7">
      <Toaster
        position="bottom-right"
      />
      
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-[2rem] border border-pink-500/10 bg-gradient-to-br from-[#111827] via-[#1e1b4b] to-[#0f172a] p-10">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/20 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div>
            <p className="text-pink-400 font-semibold mb-3">{currentDate}</p>
            <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
              Welcome Back, Warrior ⚔️
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              {overallProgress >= 70 
                ? "You're dominating your productivity goals. Keep the momentum alive." 
                : "Focus on completing high-impact tasks today to reach your goals."}
            </p>
          </div>
<div className="flex items-center justify-center">

  <div className="relative w-52 h-52 flex items-center justify-center">

    <svg className="absolute w-full h-full -rotate-90">

      {/* Background Circle */}
      <circle
        cx="104"
        cy="104"
        r="90"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="12"
        fill="transparent"
      />

      {/* Progress Circle */}
      <circle
        cx="104"
        cy="104"
        r="90"
        stroke="url(#gradient)"
        strokeWidth="12"
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * 90}
        strokeDashoffset={
          2 * Math.PI * 90 *
          (1 - overallProgress / 100)
        }
        className="transition-all duration-700"
      />

      <defs>
        <linearGradient id="gradient">
          <stop offset="0%" stopColor="#ff0080" />
          <stop offset="100%" stopColor="#7928ca" />
        </linearGradient>
      </defs>

    </svg>

    <div className="z-10 text-center">
      <div className="text-6xl font-black text-pink-400">
        {overallProgress}%
      </div>

      <p className="text-gray-400 mt-2">
        Productivity
      </p>
    </div>

  </div>

</div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Tasks" value={activities.length} icon={<Target className="text-pink-400" />} />
        <StatCard title="Completed" value={completedTasks} icon={<CheckCircle2 className="text-green-400" />} color="text-green-400" />
        <StatCard title="Pending" value={pendingTasks} icon={<Clock3 className="text-yellow-400" />} color="text-yellow-400" />
        <StatCard title="Overdue" value={overdueTasks} icon={<AlertTriangle className="text-red-400" />} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* TODAY'S FOCUS */}
        {focusTask && (
          <div className="xl:col-span-2 rounded-3xl border border-pink-500/20 bg-gradient-to-r from-[#111827] to-[#1e293b] p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-pink-500/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-pink-400 font-semibold mb-2">TODAY'S FOCUS</p>
                  <h2 className="text-4xl font-black text-white">{focusTask.title}</h2>
                </div>
                <div className="text-6xl">🎯</div>
              </div>
              <p className="text-gray-300 mb-6 max-w-3xl">{focusTask.description || "Stay focused and complete this task efficiently."}</p>
              <div className="flex flex-wrap gap-4">
                <Badge label="Priority" value={focusTask.priority} color="red" />
                <Badge label="Status" value={focusTask.status} color="yellow" />
                <Badge label="Progress" value={`${focusTask.progress || 0}%`} color="pink" />
              </div>
            </div>
          </div>
        )}

        {/* UPCOMING DEADLINES */}
        <div className="xl:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <h2 className="text-3xl font-black text-white mb-6">Deadlines</h2>
          <div className="space-y-4">
            {upcomingDeadlines.map((activity) => (
              <div key={activity.id} className="bg-black/20 border border-white/10 rounded-2xl p-5 hover:border-pink-500/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{activity.title}</h3>
                  <span className="text-xs font-bold text-red-300 bg-red-500/20 px-2 py-1 rounded">{activity.priority}</span>
                </div>
                <p className={`font-bold ${activity.daysLeft <= 1 ? 'text-red-400' : 'text-green-400'}`}>
                  {activity.daysLeft < 0 ? "🔴 Overdue" : activity.daysLeft === 0 ? "🟠 Due Today" : `🟢 ${activity.daysLeft} Days Left`}
                </p>
              </div>
            ))}
            {upcomingDeadlines.length === 0 && (

  <div className="text-center text-gray-400 py-10">

    🎉 No upcoming deadlines

  </div>

)}
          </div>
        </div>
      </div>

      {/* WEEKLY PRODUCTIVITY CHART */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Weekly Productivity</h2>
            <p className="text-gray-400">Performance overview for this month</p>
          </div>
          <div className="text-5xl">📊</div>
        </div>
        
<div className="flex items-end justify-between gap-4 h-80">

  {finalChartData.map((item, index) => (

    <div
      key={item.week}
      className="flex flex-col justify-end items-center flex-1 h-52"
    >

      <motion.div
        initial={{ height: 0 }}
        animate={{
          height: `${Math.max(item.value * 1.8, item.value > 0 ? 24 : 8)}px`
        }}
        transition={{
          duration: 1,
          delay: index * 0.1
        }}
        className={`w-full rounded-t-2xl shadow-2xl ${
          item.value >= 75
            ? "bg-gradient-to-t from-green-500 to-emerald-400"
            : item.value >= 40
            ? "bg-gradient-to-t from-yellow-500 to-orange-400"
            : "bg-gradient-to-t from-red-500 to-pink-500"
        }`}
        style={{
          minHeight: item.value > 0 ? "24px" : "8px"
        }}
      />

      <div className="mt-4 text-gray-400 text-sm font-medium">
        {item.week}
      </div>

      <div className="text-white text-xs font-bold">
        {item.value}%
      </div>

    </div>

  ))}

</div>
      </div>
    </div>
  );
}

// Helper Components
const StatCard = ({ title, value, icon, color = "text-white" }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl hover:border-pink-500/20 transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <h2 className={`text-4xl font-black mt-2 ${color}`}>{value}</h2>
      </div>
      {icon}
    </div>
  </div>
);

const Badge = ({ label, value, color }) => {
  const colors = {
    red: "bg-red-500/10 border-red-500/20 text-red-300",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    pink: "bg-pink-500/10 border-pink-500/20 text-pink-300",
  };
  return (
    <div className={`px-5 py-3 rounded-2xl border ${colors[color]}`}>
      {label}: {value}
    </div>
  );
};

export default WarriorDashboard;