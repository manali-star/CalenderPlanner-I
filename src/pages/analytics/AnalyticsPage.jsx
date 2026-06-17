import { useEffect, useMemo, useState } from "react";
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
  const [colleges, setColleges] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState("all");

  // =========================
  // FETCH ANALYTICS
  // =========================

  const fetchAnalytics = async () => {

    const { data: { user } } =
      await supabase.auth.getUser();

    if (!user) return;
    // WARRIORS

const {
  data: fetchedProfile,
} = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

setActiveProfile(fetchedProfile);

    // TASKS
    let taskQuery = supabase
  .from("tasks")
.select("*");



if (
  fetchedProfile?.role !== "admin"
) {

  taskQuery = taskQuery.eq(
    "assigned_college_id",
    fetchedProfile?.college_id
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
  fetchedProfile?.role !== "admin"
) {

  warriorQuery =
    warriorQuery.eq(
      "college_id",
      fetchedProfile?.college_id
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
  fetchedProfile?.role !== "admin"
) {

  teamQuery =
    teamQuery.eq(
      "college_id",
      fetchedProfile?.college_id
    );

}

const {
  data: teamsData,
} = await teamQuery;

if (teamsData) {

  setTeams(teamsData);

}

const {
  data: collegesData,
} = await supabase
    .from("colleges")
  .select("*")
  .order("name");

if (collegesData) {
  setColleges(
    fetchedProfile?.role === "admin"
      ? collegesData
      : collegesData.filter(
          (college) =>
            college.id ===
            fetchedProfile?.college_id
        )
  );
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
    const collegeFilteredActivities =
      activeProfile?.role === "admin" &&
      selectedCollege !== "all"
        ? activities.filter(
            (activity) =>
              activity.assigned_college_id ===
              selectedCollege
          )
        : activities;

    const collegeFilteredWarriors =
      activeProfile?.role === "admin" &&
      selectedCollege !== "all"
        ? warriors.filter(
            (warrior) =>
              warrior.college_id ===
              selectedCollege
          )
        : warriors;

    const collegeFilteredTeams =
      activeProfile?.role === "admin" &&
      selectedCollege !== "all"
        ? teams.filter(
            (team) =>
              team.college_id ===
              selectedCollege
          )
        : teams;

    const total = collegeFilteredActivities.length;

    const completed =
      collegeFilteredActivities.filter(
        (a) =>
          a.status === "approved" ||
          a.status === "completed"
      ).length;

    const planned =
      collegeFilteredActivities.filter(
        (a) => a.status === "planned"
      ).length;

    const achievedStudents =
      collegeFilteredActivities.reduce(
        (sum, a) =>
          sum + (a.audience_count || 0),
        0
      );

    const targetStudents =
      collegeFilteredActivities.reduce(
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
        collegeFilteredWarriors.length,

      totalTeams:
        collegeFilteredTeams.length,

    };

  }, [
    activities,
    activeProfile?.role,
    selectedCollege,
    teams,
    warriors,
  ]);

  const collegeWiseAnalytics = useMemo(() => {
    const analyticsSource =
      activeProfile?.role === "admin" &&
      selectedCollege !== "all"
        ? activities.filter(
            (activity) =>
              activity.assigned_college_id ===
              selectedCollege
          )
        : activities;

    const visibleColleges =
      activeProfile?.role === "admin" &&
      selectedCollege !== "all"
        ? colleges.filter(
            (college) =>
              college.id === selectedCollege
          )
        : colleges;

    return visibleColleges.map((college) => {
      const collegeTasks = analyticsSource.filter(
        (activity) =>
          activity.assigned_college_id ===
          college.id
      );

      const completed = collegeTasks.filter(
        (activity) =>
          activity.status === "approved" ||
          activity.status === "completed"
      ).length;

      const outreach = collegeTasks.reduce(
        (sum, activity) =>
          sum + (activity.audience_count || 0),
        0
      );

      return {
        id: college.id,
        name: college.name,
        total: collegeTasks.length,
        completed,
        outreach,
        completionRate:
          collegeTasks.length === 0
            ? 0
            : Math.round(
                (completed /
                  collegeTasks.length) *
                  100
              ),
      };
    });
  }, [
    activities,
    activeProfile?.role,
    colleges,
    selectedCollege,
  ]);

  // =========================
  // PIE CHART
  // =========================

  const monthlyActivityData = [
  {
    month: "May",
    activities: metrics.total,
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
  if (
    activeProfile?.role === "admin" &&
    selectedCollege !== "all" &&
    activity.assigned_college_id !==
      selectedCollege
  ) {
    return;
  }

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

      {activeProfile?.role === "admin" && (
        <div className="flex justify-end">
          <select
            value={selectedCollege}
            onChange={(e) =>
              setSelectedCollege(
                e.target.value
              )
            }
            className="min-w-[240px] rounded-2xl border border-cyan-500/40 bg-[#0B1120] px-5 py-3 text-white outline-none transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="all">
              All Colleges
            </option>

            {colleges.map((college) => (
              <option
                key={college.id}
                value={college.id}
              >
                {college.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              College-wise Analytics
            </h2>
            <p className="text-gray-400 text-sm">
              Overall totals with per-college performance breakdown.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {collegeWiseAnalytics.map((college) => (
            <div
              key={college.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-black text-white">
                    {college.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {college.completed} completed of {college.total} tasks
                  </p>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                  {college.completionRate}% complete
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
                    Total
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {college.total}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
                    Done
                  </p>
                  <p className="mt-2 text-2xl font-black text-emerald-400">
                    {college.completed}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
                    Reach
                  </p>
                  <p className="mt-2 text-2xl font-black text-cyan-400">
                    {college.outreach}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
