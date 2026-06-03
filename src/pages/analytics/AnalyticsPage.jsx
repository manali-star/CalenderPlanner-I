import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

import { supabase } from "../../lib/supabase";

function AnalyticsPage() {

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [warriors, setWarriors] = useState([]);
  const [teams, setTeams] = useState([]);

  // =========================
  // FETCH ANALYTICS
  // =========================

  const fetchAnalytics = async () => {

    const { data: { user } } =
      await supabase.auth.getUser();

    if (!user) return;
    // WARRIORS

const {
  data: activeProfile,
} = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

    // TASKS
    let taskQuery = supabase
  .from("tasks")
.select("*");



if (
  activeProfile?.role !== "admin"
) {

  taskQuery = taskQuery.eq(
    "assigned_college_id",
    activeProfile?.college_id
  );

}

const {
  data,
  error,
} = await taskQuery;

    if (!error) {

      setActivities(data || []);

    }


let warriorQuery =
  supabase
    .from("profiles")
    .select("*")
    .eq("role", "warrior")
    .eq(
      "approval_status",
      "approved"
    );

if (
  activeProfile?.role !== "admin"
) {

  warriorQuery =
    warriorQuery.eq(
      "college_id",
      activeProfile?.college_id
    );

}

const {
  data: warriorData,
} = await warriorQuery;

if (warriorData) {

  setWarriors(warriorData);

}

// TEAMS

let teamQuery =
  supabase
    .from("teams")
    .select("*");

if (
  activeProfile?.role !== "admin"
) {

  teamQuery =
    teamQuery.eq(
      "college_id",
      activeProfile?.college_id
    );

}

const {
  data: teamsData,
} = await teamQuery;

if (teamsData) {

  setTeams(teamsData);

}

setLoading(false);

  };

  // =========================
  // REALTIME
  // =========================

  useEffect(() => {

    fetchAnalytics();

    const channel =
      supabase
        .channel("analytics-live")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks"
          },
          fetchAnalytics
        )
        .subscribe();

    return () => {

      supabase.removeChannel(channel);

    };

  }, []);

  // =========================
  // METRICS
  // =========================

  const metrics = useMemo(() => {

    const total = activities.length;

    const completed =
      activities.filter(
        (a) =>
          a.status === "approved" ||
          a.status === "completed"
      ).length;

    const planned =
      activities.filter(
        (a) => a.status === "planned"
      ).length;

    const achievedStudents =
      activities.reduce(
        (sum, a) =>
          sum + (a.audience_count || 0),
        0
      );

    const targetStudents =
      activities.reduce(
        (sum, a) =>
          sum + (a.target_students || 0),
        0
      );

    const surplusDeficit =
      achievedStudents - targetStudents;

    const completionRate =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
          );

    return {

      total,
      completed,
      planned,

      achievedStudents,
      targetStudents,
      surplusDeficit,
      completionRate,

      totalWarriors:
        warriors.length,

      totalTeams:
        teams.length,

    };

  }, [activities, warriors, teams]);

  // =========================
  // PIE CHART
  // =========================

  const monthlyActivityData = [
  {
    month: "May",
    activities: activities.length,
  },
];

const participationData = [
  {
    month: "May",
    participants:
      metrics.achievedStudents,
  },
];

  const pieData = [

    {
      name: "Completed",
      value: metrics.completed
    },

    {
      name: "Planned",
      value: metrics.planned
    },

  ];

  const COLORS = [
    "#ef4444",
    "#8b5cf6"
  ];

const weeklyReport = [
  {
    week: "Week 1",
    date: "May 4 - May 10",
    target: 0,
    achieved: 0,
    surplusDeficit: 0,
    completion: 0,
  },

  {
    week: "Week 2",
    date: "May 11 - May 17",
    target: 0,
    achieved: 0,
    surplusDeficit: 0,
    completion: 0,
  },

  {
    week: "Week 3",
    date: "May 18 - May 24",
    target: 0,
    achieved: 0,
    surplusDeficit: 0,
    completion: 0,
  },

  {
    week: "Week 4",
    date: "May 25 - May 31",
    target: 0,
    achieved: 0,
    surplusDeficit: 0,
    completion: 0,
  },
];

activities.forEach((activity) => {

  const createdDate =
    new Date(activity.created_at);

  const day =
    createdDate.getDate();

  let weekIndex = 0;

  if (day >= 4 && day <= 10)
    weekIndex = 0;

  else if (day >= 11 && day <= 17)
    weekIndex = 1;

  else if (day >= 18 && day <= 24)
    weekIndex = 2;

  else if (day >= 25 && day <= 31)
    weekIndex = 3;

  const target =
    activity.target_students || 0;

  const achieved =
    activity.audience_count || 0;

  weeklyReport[weekIndex].target +=
    target;

  weeklyReport[weekIndex].achieved +=
    achieved;

});

weeklyReport.forEach((week) => {

  week.surplusDeficit =
    week.achieved - week.target;

  week.completion =
    week.target === 0
      ? 0
      : Math.round(
          (week.achieved /
            week.target) *
            100
        );

});
  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (
      <div className="p-10 text-white font-black">
        Loading Analytics...
      </div>
    );

  }

  // =========================
  // UI
  // =========================

  return (

    <div className="relative space-y-8 pb-20 p-6 w-full min-w-0">

      {/* HEADER */}

      <div>

        <motion.h1
          initial={{
            opacity: 0,
            y: -20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="text-5xl font-black text-white mb-2"
        >
          Analytics
        </motion.h1>

        <p className="text-gray-400 text-lg">
          Realtime activity intelligence dashboard.
        </p>

      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <AnalyticsStatCard
          title="Total Warriors"
          value={metrics.totalWarriors}
          icon={Users}
        />

        <AnalyticsStatCard
          title="Total Teams"
          value={metrics.totalTeams}
          icon={Users}
        />

        <AnalyticsStatCard
          title="Total Tasks"
          value={metrics.total}
          icon={Activity}
        />

        <AnalyticsStatCard
          title="Completed Tasks"
          value={metrics.completed}
          icon={CheckCircle2}
        />

        <AnalyticsStatCard
          title="Target Students"
          value={metrics.targetStudents}
          icon={Clock3}
        />

        <AnalyticsStatCard
          title="Achieved Students"
          value={metrics.achievedStudents}
          icon={Users}
        />

        <AnalyticsStatCard
          title="Surplus / Deficit"
          value={metrics.surplusDeficit}
          icon={Activity}
        />

        <AnalyticsStatCard
          title="Completion %"
          value={`${metrics.completionRate}%`}
          icon={CheckCircle2}
        />

      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* PIE */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8"
        >

          <h2 className="text-2xl font-bold text-white mb-8">
            Status Distribution
          </h2>

          <div className="h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >

                  {pieData.map((_, i) => (

                    <Cell
                      key={i}
                      fill={
                        COLORS[
                          i % COLORS.length
                        ]
                      }
                    />

                  ))}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </motion.div>

        {/* BAR CHART */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8"
        >

          <h2 className="text-2xl font-bold text-white mb-8">
            Activity Flow
          </h2>

          <div className="h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={monthlyActivityData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="activities"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </motion.div>

      </div>

      {/* LINE CHART */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8"
      >

        <h2 className="text-2xl font-bold text-white mb-8">
          Participation Velocity
        </h2>

        <div className="h-[350px]">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={participationData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="participants"
                stroke="#8b5cf6"
                strokeWidth={4}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </motion.div>

      {/* WEEKLY REPORT TABLE */}

<motion.div
  initial={{
    opacity: 0,
    y: 20
  }}
  animate={{
    opacity: 1,
    y: 0
  }}
  className="
    rounded-3xl
    border
    border-white/10
    bg-white/5
    backdrop-blur-2xl
    p-8
    overflow-x-auto
  "
>

  <h2 className="text-2xl font-bold text-white mb-6">
    Weekly Performance Report
  </h2>

  <table className="w-full text-left">

    <thead>

      <tr className="border-b border-white/10 text-gray-400 text-sm">

        <th className="pb-4">
          Week
        </th>

        <th className="pb-4">
          Target
        </th>

        <th className="pb-4">
          Achieved
        </th>

        <th className="pb-4">
          Surplus / Deficit
        </th>

        <th className="pb-4">
          Completion %
        </th>

      </tr>

    </thead>

    <tbody>

      {weeklyReport.map((row, index) => (

        <tr
          key={index}
          className="border-b border-white/5"
        >

          <td className="py-4 text-white font-bold">
            {row.week}

            <div className="text-xs text-gray-400 mt-1">
              {row.date}
            </div>
          </td>

          <td className="py-4 text-gray-300">
            {row.target}
          </td>

          <td className="py-4 text-gray-300">
            {row.achieved}
          </td>

          <td
            className={`py-4 font-bold ${
              row.surplusDeficit >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {row.surplusDeficit}
          </td>

          <td className="py-4 text-cyan-400 font-bold">
            {row.completion}%
          </td>

        </tr>

      ))}

    </tbody>

  </table>

</motion.div>

    </div>

  );

}

// =========================
// KPI CARD
// =========================

const AnalyticsStatCard = ({
  title,
  value,
  icon: Icon
}) => (

  <div className="relative overflow-hidden rounded-3xl border border-red-500/10 bg-white/5 backdrop-blur-2xl p-6">

    <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/5 blur-3xl rounded-full" />

    <div className="flex items-center gap-4">

      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">

        <Icon
          size={24}
          className="text-white"
        />

      </div>

      <div>

        <p className="text-gray-400 text-xs uppercase tracking-widest">
          {title}
        </p>

        <h2 className="text-3xl font-black text-white">
          {value}
        </h2>

      </div>

    </div>

  </div>

);
export default AnalyticsPage;