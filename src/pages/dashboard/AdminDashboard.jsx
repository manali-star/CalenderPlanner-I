import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { supabase } from "../../lib/supabase";
import { Activity, CalendarDays, Users, BarChart3, ShieldAlert, School, Swords, UserCheck } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from "recharts";

function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, profilesRes] = await Promise.all([
        supabase.from("tasks").select("*"),
        supabase.from("profiles").select("*")
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    } catch (error) {
      console.error("DASHBOARD FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase.channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchDashboardData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Memoized Metrics & Chart Data
  const dataStore = useMemo(() => {
    // Analytics Metrics
    const totalParticipants = tasks.reduce((sum, act) => sum + (act.audience_count || 0), 0);
    const planned = tasks.filter(t => t.status === "planned").length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed").length;
    const colleges = new Set(tasks.map(t => t.assigned_college_id)).size;
    const warriors = profiles.filter(p => p.role === "warrior").length;
    const presidents = profiles.filter(p => p.role === "president").length;

    // Monthly Growth Transformation
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = tasks.reduce((acc, curr) => {
      const m = months[new Date(curr.activity_date).getMonth()];
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    const chartData = months.filter(m => monthlyMap[m]).map(m => ({ month: m, activities: monthlyMap[m] }));

    // Bar Data for Top Activities
    const barData = tasks.slice(0, 8).map(t => ({
      name: t.title?.length > 12 ? t.title.slice(0, 12) + "..." : t.title,
      participants: t.audience_count || 0
    }));

    return { totalParticipants, planned, completed, overdue, colleges, warriors, presidents, chartData, barData };
  }, [tasks, profiles]);

  const COLORS = ["#facc15", "#22c55e"];
  const chartStyle = { contentStyle: { backgroundColor: '#0b1120', border: '1px solid #1e293b', borderRadius: '16px' }, itemStyle: { color: '#fff' } };

  if (loading) return <div className="p-10 text-white font-black tracking-widest animate-pulse">DECRYPTING SYSTEM INTEL...</div>;

  return (
    <div className="relative space-y-10 pb-20 p-6">
      {/* Dynamic Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-red-500/10 blur-[150px] rounded-full animate-pulse pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[150px] rounded-full animate-pulse pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-6xl font-black text-white tracking-tighter mb-2">Dashboard</motion.h1>
        <p className="text-gray-400 text-lg">AI-powered centralized activity intelligence.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
        <DashboardStat title="Total Activities" value={tasks.length} icon={Activity} />
        <DashboardStat title="Planned" value={dataStore.planned} icon={CalendarDays} />
        <DashboardStat title="Completed" value={dataStore.completed} icon={BarChart3} />
        <DashboardStat title="Total Reach" value={dataStore.totalParticipants} icon={Users} />
        <DashboardStat title="Colleges" value={dataStore.colleges} icon={School} />
        <DashboardStat title="Overdue Risk" value={dataStore.overdue} icon={ShieldAlert} color="text-red-500" />
        <DashboardStat title="Warriors" value={dataStore.warriors} icon={Swords} />
        <DashboardStat title="Active Admins" value={dataStore.presidents} icon={UserCheck} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10">
        {/* Growth Line Chart */}
        <div className="xl:col-span-2">
          <ChartWrapper title="Activity Velocity" subtitle="Monthly engagement and growth trends">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dataStore.chartData}>
                <XAxis dataKey="month" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip {...chartStyle} />
                <Line type="monotone" dataKey="activities" stroke="#ff4d4d" strokeWidth={5} dot={{ r: 6, fill: "#ff4d4d", strokeWidth: 0 }} activeDot={{ r: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* AI Insight Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <div className="rounded-3xl p-8 bg-[#0b1120]/90 border border-white/5 backdrop-blur-3xl h-full relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full" />
             <h2 className="text-2xl font-bold text-white mb-6">Neural Insights</h2>
             <div className="space-y-4">
                <InsightItem title="Workload Risk" content={`AI detected ${dataStore.overdue} overdue tasks. Recommend restructuring deadlines.`} color="border-red-500/20" />
                <InsightItem title="Engagement" content={`Average reach is ${tasks.length > 0 ? Math.floor(dataStore.totalParticipants / tasks.length) : 0} per event.`} color="border-purple-500/20" />
                <InsightItem title="Velocity" content={`${dataStore.completed} completed out of ${tasks.length}. Team is maintaining steady momentum.` } color="border-green-500/20" />
             </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
        <ChartWrapper title="Activity Status Distribution">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={[{ name: "Planned", value: dataStore.planned }, { name: "Completed", value: dataStore.completed }]} dataKey="value" innerRadius={80} outerRadius={120} paddingAngle={5}>
                {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
              </Pie>
              <Tooltip {...chartStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Top Participation Feed">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dataStore.barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip {...chartStyle} />
              <Bar dataKey="participants" fill="#ff4d4d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>
    </div>
  );
}

// Reusable Stat Component
const DashboardStat = ({ title, value, icon: Icon, color = "text-red-400" }) => (
  <Tilt scale={1.05} transitionSpeed={2500} glareEnable glareMaxOpacity={0.1}>
    <div className="relative p-[1px] rounded-3xl bg-gradient-to-br from-red-500/30 via-transparent to-purple-500/20 group">
      <div className="bg-[#0b1120]/90 backdrop-blur-2xl rounded-[23px] p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:border-red-500/50 transition-colors">
          <Icon size={28} className={color} />
        </div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className="text-5xl font-black text-white">{value}</p>
      </div>
    </div>
  </Tilt>
);

const ChartWrapper = ({ title, subtitle, children }) => (
  <div className="p-[1px] rounded-[32px] bg-gradient-to-br from-white/10 to-transparent">
    <div className="bg-[#0b1120]/90 backdrop-blur-3xl rounded-[31px] p-8 border border-white/5">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>
);

const InsightItem = ({ title, content, color }) => (
  <div className={`p-5 rounded-2xl bg-[#0f172a]/50 border ${color} backdrop-blur-xl`}>
    <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
    <p className="text-gray-400 text-xs leading-relaxed">{content}</p>
  </div>
);

export default AdminDashboard;