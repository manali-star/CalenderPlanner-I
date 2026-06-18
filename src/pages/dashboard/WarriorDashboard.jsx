import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Clock,
  AlertTriangle,
  Target,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";

const PROOF_GUIDELINES = [
  "Clear event or task evidence",
  "Date or venue visibility when possible",
  "Supporting notes, links, or screenshots",
  "Final student reach or impact count",
].join(", ");

// ── CHANGE 4: Format ISO timestamp into readable local date/time ──
function formatSubmissionDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function WarriorDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [proofFiles, setProofFiles] = useState({});
  const [proofNotes, setProofNotes] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: memberTeams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

      const teamIds = memberTeams?.map((team) => team.team_id) || [];

      const { data: personalTasks, error: personalError } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", user.id);

      let teamTasks = [];
      if (teamIds.length > 0) {
        const { data: fetchedTeamTasks, error: teamError } = await supabase
          .from("tasks")
          .select("*")
          .in("assigned_team_id", teamIds);

        if (teamError) {
          console.error(teamError);
        } else {
          teamTasks = fetchedTeamTasks || [];
        }
      }

      if (personalError) {
        console.error("WARRIOR FETCH ERROR:", personalError);
        toast.error("Failed to load tasks");
        setLoading(false);
        return;
      }

      const uniqueTasks = Array.from(
        new Map([...(personalTasks || []), ...teamTasks].map((task) => [task.id, task])).values()
      );

      setTasks(uniqueTasks);
      setLoading(false);
    };

    fetchTasks();
  }, []);

  const handleSubmitProof = async (task) => {
    const proofFile = proofFiles[task.id];
    if (!proofFile) {
      toast.error("Please upload a proof file");
      return;
    }

    try {
      setUploadingTaskId(task.id);

      const cleanName = proofFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const fileExt = cleanName.split(".").pop();
      const filePath = `proofs/${task.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("activity-proofs")
        .upload(filePath, proofFile);

      if (uploadError) {
        toast.error(uploadError.message);
        setUploadingTaskId(null);
        return;
      }

      const { data } = supabase.storage
        .from("activity-proofs")
        .getPublicUrl(filePath);

      const proofText = proofNotes[task.id] || "";

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          status: "pending_officer_review",
          proof_url: data?.publicUrl || "",
          proof_text: proofText,
          remarks: proofText,
          completion_date: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (updateError) {
        toast.error(updateError.message);
        setUploadingTaskId(null);
        return;
      }

      toast.success("Task submitted for approval!");

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? {
              ...item,
              status: "pending_officer_review",
              proof_url: data?.publicUrl || "",
              proof_text: proofText,
              remarks: proofText,
              // ── CHANGE 4: reflect timestamp in local state immediately ──
              completion_date: new Date().toISOString(),
            }
            : item
        )
      );

      setProofFiles((prev) => ({ ...prev, [task.id]: null }));
      setProofNotes((prev) => ({ ...prev, [task.id]: "" }));
      setUploadingTaskId(null);
    } catch (error) {
      console.error(error);
      toast.error("Submission failed");
      setUploadingTaskId(null);
    }
  };

  const completedTasks = tasks.filter(
    (item) => item.status === "approved" || item.status === "completed"
  ).length;
  const pendingTasks = tasks.filter(
    (item) => item.status !== "approved" && item.status !== "completed" && item.status !== "rejected"
  ).length;
  const overdueTasks = tasks.filter(
    (item) =>
      item.due_date &&
      new Date(item.due_date) < new Date() &&
      item.status !== "approved" &&
      item.status !== "completed"
  ).length;

  const overallProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const focusTask =
    tasks.find((task) => task.status !== "approved" && task.status !== "completed" && task.priority === "high") ||
    tasks.find((task) => task.status !== "approved" && task.status !== "completed");

  const upcomingDeadlines = tasks
    .filter((task) => task.status !== "approved" && task.status !== "completed" && task.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3)
    .map((task) => ({
      ...task,
      daysLeft: Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)),
    }));

  const finalChartData = useMemo(() => {
    const monthlyData = [
      { week: "Week 1", value: 0, count: 0 },
      { week: "Week 2", value: 0, count: 0 },
      { week: "Week 3", value: 0, count: 0 },
      { week: "Week 4", value: 0, count: 0 },
    ];

    tasks.forEach((task, index) => {
      const idx = index % 4;
      monthlyData[idx].count += 1;

      if (
        task.status === "approved" ||
        task.status === "completed" ||
        task.status === "verified" ||
        task.status === "pending_officer_review"
      ) {
        monthlyData[idx].value += 1;
      }
    });

    return monthlyData.map((item) => ({
      week: item.week,
      value: item.value * 25,
    }));
  }, [tasks]);

  if (loading) {
    return <div className="p-10 text-white">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-7">
      <Toaster position="bottom-right" />

      <div className="relative overflow-hidden rounded-[2rem] border border-pink-500/10 bg-gradient-to-br from-[#111827] via-[#1e1b4b] to-[#0f172a] p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 font-semibold text-pink-400">{currentDate}</p>
            <h1 className="mb-5 text-5xl font-black leading-tight text-white lg:text-6xl">
              Welcome Back, Warrior
            </h1>
            <p className="max-w-2xl text-lg text-gray-300">
              {overallProgress >= 70
                ? "You're dominating your productivity goals. Keep the momentum alive."
                : "Focus on completing high-impact tasks today to reach your goals."}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative flex h-52 w-52 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="90"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="90"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={2 * Math.PI * 90 * (1 - overallProgress / 100)}
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
                <div className="text-6xl font-black text-pink-400">{overallProgress}%</div>
                <p className="mt-2 text-gray-400">Productivity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tasks" value={tasks.length} icon={<Target className="text-pink-400" />} />
        <StatCard title="Completed" value={completedTasks} icon={<CheckCircle2 className="text-green-400" />} color="text-green-400" />
        <StatCard title="Pending" value={pendingTasks} icon={<Clock3 className="text-yellow-400" />} color="text-yellow-400" />
        <StatCard title="Overdue" value={overdueTasks} icon={<AlertTriangle className="text-red-400" />} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {focusTask && (
          <div className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-r from-[#111827] to-[#1e293b] p-8 xl:col-span-2">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-pink-500/10 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="mb-2 font-semibold text-pink-400">TODAY&apos;S FOCUS</p>
                  <h2 className="text-4xl font-black text-white">{focusTask.title}</h2>
                </div>
              </div>
              <p className="mb-6 max-w-3xl text-gray-300">
                {focusTask.description || "Stay focused and complete this task efficiently."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge label="Priority" value={focusTask.priority || "medium"} color="red" />
                <Badge label="Status" value={focusTask.status} color="yellow" />
                <Badge label="Students" value={focusTask.target_students || 0} color="pink" />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl xl:col-span-1">
          <h2 className="mb-6 text-3xl font-black text-white">Deadlines</h2>
          <div className="space-y-4">
            {upcomingDeadlines.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-all hover:border-pink-500/20"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-xl font-bold text-white">{task.title}</h3>
                  <span className="rounded bg-red-500/20 px-2 py-1 text-xs font-bold text-red-300">
                    {task.priority || "medium"}
                  </span>
                </div>
                <p className={`font-bold ${task.daysLeft <= 1 ? "text-red-400" : "text-green-400"}`}>
                  {task.daysLeft < 0 ? "Overdue" : task.daysLeft === 0 ? "Due Today" : `${task.daysLeft} Days Left`}
                </p>
              </div>
            ))}
            {upcomingDeadlines.length === 0 && (
              <div className="py-10 text-center text-gray-400">No upcoming deadlines</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-white">Weekly Productivity</h2>
            <p className="text-gray-400">Performance overview for this month</p>
          </div>
        </div>

        <div className="flex h-80 items-end justify-between gap-4">
          {finalChartData.map((item, index) => (
            <div key={item.week} className="flex h-52 flex-1 flex-col items-center justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(item.value * 1.8, item.value > 0 ? 24 : 8)}px` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className={`w-full rounded-t-2xl shadow-2xl ${item.value >= 75
                    ? "bg-gradient-to-t from-green-500 to-emerald-400"
                    : item.value >= 40
                      ? "bg-gradient-to-t from-yellow-500 to-orange-400"
                      : "bg-gradient-to-t from-red-500 to-pink-500"
                  }`}
                style={{ minHeight: item.value > 0 ? "24px" : "8px" }}
              />

              <div className="mt-4 text-sm font-medium text-gray-400">{item.week}</div>
              <div className="text-xs font-bold text-white">{item.value}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {tasks
          .filter(
            (task) =>
              !task.proof_url &&
              task.status !== "approved" &&
              task.status !== "completed" &&
              task.activity_type !== "Mass Activity"
          )
          .map((task) => (
            <div
              key={task.id}
              className="rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-cyan-500/5 p-6"
            >
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-pink-400">
                Mission Submission
              </p>
              <h3 className="mb-2 text-2xl font-black text-white">{task.title}</h3>
              <p className="mb-4 text-sm text-gray-400">
                Include: {PROOF_GUIDELINES}
              </p>

              <textarea
                value={proofNotes[task.id] || ""}
                onChange={(e) =>
                  setProofNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                }
                placeholder="Describe what is included in the proof, key outcomes, links, and student reach."
                className="mb-4 min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#111827] p-3 text-sm text-white outline-none focus:border-pink-500/30"
              />

              <label className="mb-4 block cursor-pointer">
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    setProofFiles((prev) => ({
                      ...prev,
                      [task.id]: e.target.files?.[0] || null,
                    }))
                  }
                />
                <div className="rounded-2xl border border-dashed border-pink-500/20 bg-[#0f172a] p-4 text-center transition-all hover:border-pink-500/50">
                  <p className="mb-1 text-lg font-bold">
                    {proofFiles[task.id]?.name || "Click to Upload Proof"}
                  </p>
                  <p className="text-sm text-gray-500">PDF, images, and documents are supported</p>
                </div>
              </label>

              <button
                onClick={() => handleSubmitProof(task)}
                disabled={uploadingTaskId === task.id}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-red-500 py-3 text-sm font-black transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingTaskId === task.id ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          ))}
        {/* ── CHANGE 4: Cards for tasks that already have proof submitted ── */}
        {tasks
          .filter(
            (task) =>
              task.proof_url &&
              task.status !== "completed" &&
              task.activity_type !== "Mass Activity"
          )
          .map((task) => (
            <div
              key={task.id}
              className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-6"
            >
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                Proof Submitted — Under Review
              </p>
              <h3 className="mb-4 text-2xl font-black text-white">{task.title}</h3>

              {/* Submission timestamp */}
              {task.completion_date && (
                <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-2xl bg-black/20 border border-cyan-500/10">
                  <Clock size={14} className="text-cyan-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">
                      Submitted On
                    </p>
                    <p className="text-cyan-300 text-sm font-semibold">
                      {formatSubmissionDate(task.completion_date)}
                    </p>
                  </div>
                </div>
              )}

              <a
                href={task.proof_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold hover:bg-cyan-500/20 transition-all"
              >
                View Submitted Proof →
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color = "text-white" }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all hover:border-pink-500/20">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className={`mt-2 text-4xl font-black ${color}`}>{value}</h2>
      </div>
      {icon}
    </div>
  </div>
);

const Badge = ({ label, value, color }) => {
  const colors = {
    red: "border-red-500/20 bg-red-500/10 text-red-300",
    yellow: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    pink: "border-pink-500/20 bg-pink-500/10 text-pink-300",
  };

  return <div className={`rounded-2xl border px-5 py-3 ${colors[color]}`}>{label}: {value}</div>;
};

export default WarriorDashboard;
