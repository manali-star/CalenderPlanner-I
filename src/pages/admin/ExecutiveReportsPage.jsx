import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "../../lib/supabase";
import { generateAnalytics } from "../../utils/analyticsEngine";

function ExecutiveReportsPage({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("all");
  const [activeTab, setActiveTab] = useState("execution");

  useEffect(() => {
    const fetchData = async () => {
      let taskQuery = supabase.from("tasks").select("*");
      let teamQuery = supabase.from("teams").select("*");

      if (profile?.role !== "admin") {
        taskQuery = taskQuery.eq("assigned_college_id", profile?.college_id);
        teamQuery = teamQuery.eq("college_id", profile?.college_id);
      }

      const [{ data: taskData }, { data: teamData }, { data: collegeData }] =
        await Promise.all([
          taskQuery,
          teamQuery,
          supabase.from("colleges").select("*").order("name"),
        ]);

      setTasks(taskData || []);
      setTeams(teamData || []);
      setColleges(collegeData || []);
    };

    fetchData();
  }, [profile?.college_id, profile?.role]);

  const filteredTasks = useMemo(() => {
    if (profile?.role === "college_coordinator") {
      return tasks.filter(
        (task) => task.assigned_college_id === profile?.college_id
      );
    }

    if (selectedCollege === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.assigned_college_id === selectedCollege);
  }, [profile?.college_id, profile?.role, selectedCollege, tasks]);

  const filteredTeams = useMemo(() => {
    if (profile?.role === "college_coordinator") {
      return teams.filter((team) => team.college_id === profile?.college_id);
    }

    if (selectedCollege === "all") {
      return teams;
    }

    return teams.filter((team) => team.college_id === selectedCollege);
  }, [profile?.college_id, profile?.role, selectedCollege, teams]);

  const filteredColleges = useMemo(() => {
    if (profile?.role === "college_coordinator") {
      return colleges.filter((college) => college.id === profile?.college_id);
    }

    if (selectedCollege === "all") {
      return colleges;
    }

    return colleges.filter((college) => college.id === selectedCollege);
  }, [colleges, profile?.college_id, profile?.role, selectedCollege]);

  const analytics = useMemo(
    () =>
      generateAnalytics({
        tasks: filteredTasks,
        teams: filteredTeams,
        colleges: filteredColleges,
      }),
    [filteredColleges, filteredTasks, filteredTeams]
  );

  const executionChartData = [
    {
      name: "Activities",
      total: analytics.totalTasks,
      completed: analytics.totalCompleted,
    },
    {
      name: "Impact",
      total: analytics.totalImpactActivities,
      completed: analytics.totalImpactActivities,
    },
    {
      name: "Presentations",
      total: analytics.totalPresentations,
      completed: analytics.totalPresentations,
    },
  ];

  return (
    <div className="min-h-screen bg-[#081120] p-6 text-white">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-5xl font-black">Executive Reports</h1>
          <p className="mt-2 text-gray-400">Cyber Shiksha for Cyber Suraksha</p>
        </div>

        {profile?.role === "admin" && (
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="rounded-2xl border border-cyan-500/20 bg-white/5 px-5 py-3 outline-none"
          >
            <option value="all">All Colleges</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-8 flex gap-4 overflow-x-auto">
        {["execution", "weekly", "groups", "colleges"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-2xl px-5 py-3 font-bold ${
              activeTab === tab ? "bg-cyan-500 text-black" : "bg-white/5"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Activities" value={analytics.totalTasks} tone="cyan" />
        <MetricCard label="Completed" value={analytics.totalCompleted} tone="green" />
        <MetricCard
          label="Presentations"
          value={analytics.totalPresentations}
          tone="yellow"
        />
        <MetricCard
          label="Students Reached"
          value={analytics.totalOutreach}
          tone="pink"
        />
      </div>

      {activeTab === "execution" && (
        <ReportPanel title="Execution Overview">
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executionChartData}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="total" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completed" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>
      )}

      {activeTab === "weekly" && (
        <ReportPanel title="Weekly Intelligence Report">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-4">Week</th>
                  <th className="pb-4">Students</th>
                  <th className="pb-4">Outreach</th>
                  <th className="pb-4">Presentations</th>
                  <th className="pb-4">Impact</th>
                </tr>
              </thead>
              <tbody>
                {analytics.weeklyData.map((week) => (
                  <tr key={`${week.week}-${week.dateRange}`} className="border-b border-white/5">
                    <td className="py-5 font-bold text-cyan-400">
                      {week.week}
                      <div className="mt-1 text-xs text-gray-400">{week.dateRange}</div>
                    </td>
                    <td className="py-5">{week.studentsDone}</td>
                    <td className="py-5">{week.outreachDone}</td>
                    <td className="py-5">{week.presentationsDone}</td>
                    <td className="py-5">{week.impactDone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPanel>
      )}

      {activeTab === "groups" && (
        <ReportPanel title="Group Performance Intelligence">
          <div className="space-y-5">
            {analytics.teamAnalytics.map((team) => (
              <div
                key={team.id}
                className="rounded-3xl border border-cyan-500/20 bg-black/20 p-6"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">{team.team_name}</h3>
                    <p className="mt-2 text-gray-400">{team.completed} completed activities</p>
                  </div>
                  <div className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm font-black text-cyan-300">
                    {team.outreach} students reached
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MiniStat label="Completed" value={team.completed} color="text-cyan-400" />
                  <MiniStat
                    label="Presentations"
                    value={team.presentations}
                    color="text-yellow-400"
                  />
                  <MiniStat label="Impact" value={team.impact} color="text-pink-400" />
                  <MiniStat label="Outreach" value={team.outreach} color="text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </ReportPanel>
      )}

      {activeTab === "colleges" && (
        <ReportPanel title="College-Wise Analytics">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {analytics.collegeAnalytics.map((college) => (
              <div
                key={college.id}
                className="rounded-3xl border border-white/10 bg-black/20 p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black">{college.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {college.completed} completed of {college.totalTasks} total activities
                    </p>
                  </div>
                  <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                    {college.completionRate}% completion
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <MiniStat label="Completed" value={college.completed} color="text-green-400" />
                  <MiniStat label="Outreach" value={college.outreach} color="text-cyan-400" />
                  <MiniStat
                    label="Presentations"
                    value={college.presentations}
                    color="text-yellow-400"
                  />
                  <MiniStat label="Impact" value={college.impact} color="text-pink-400" />
                </div>
              </div>
            ))}
          </div>
        </ReportPanel>
      )}
    </div>
  );
}

function ReportPanel({ title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-6 text-3xl font-black">{title}</h2>
      {children}
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
    green: "bg-green-500/10 border-green-500/20 text-green-300",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    pink: "bg-pink-500/10 border-pink-500/20 text-pink-300",
  };

  return (
    <div className={`rounded-3xl border p-6 ${tones[tone]}`}>
      <p>{label}</p>
      <h2 className="mt-2 text-5xl font-black text-white">{value}</h2>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <h3 className={`mt-2 text-2xl font-black ${color}`}>{value}</h3>
    </div>
  );
}

export default ExecutiveReportsPage;
