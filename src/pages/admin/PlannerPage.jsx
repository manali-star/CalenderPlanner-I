import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

export default function PlannerPage() {

  const [planners, setPlanners] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [warriors, setWarriors] = useState([]);
  const [pendingCoordinators, setPendingCoordinators] = useState([]);
  const chartData = [

  {
    name: "Planned",
    value: allTasks.filter(
      t => t.status === "planned"
    ).length
  },

  {
    name: "Pending",
    value: allTasks.filter(
      t => t.status === "pending_officer_review"
    ).length
  },

  {
    name: "Approved",
    value: allTasks.filter(
      t => t.status === "officers_approved"
    ).length
  },

  {
    name: "Completed",
    value: allTasks.filter(
      t => t.status === "completed"
    ).length
  },

  {
    name: "Revision",
    value: allTasks.filter(
      t => t.status === "revision_requested"
    ).length
  }

];

const COLORS = [
  "#3B82F6",
  "#FACC15",
  "#06B6D4",
  "#22C55E",
  "#EF4444"
];

const teamPerformance = teams.map((team) => {

  const teamTasks = allTasks.filter(
    t => t.assigned_team_id === team.id
  );

  const completed = teamTasks.filter(
    t => t.status === "completed"
  ).length;

  const total = teamTasks.length;

  const score =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  return {

    id: team.id,

    name: team.team_name,

    completed,

    total,

    score

  };

}).sort((a, b) => b.score - a.score);

const warriorLeaderboard = warriors.map((warrior) => {

  const warriorTasks = allTasks.filter(
    t => t.assigned_to === warrior.id
  );

  const completed = warriorTasks.filter(
    t => t.status === "completed"
  ).length;

  const total = warriorTasks.length;

  const score =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  return {

    id: warrior.id,

    name:
      warrior.full_name ||
      warrior.username ||
      "Warrior",

    completed,

    total,

    score

  };

}).sort((a, b) => b.score - a.score);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [deadline, setDeadline] = useState("");

  const fetchPlanners = async () => {

    const { data, error } = await supabase
      .from("task_planners")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPlanners(data || []);
    }

  };

  const fetchAllTasks = async () => {

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (!error) {

    setAllTasks(data || []);

  }

};

const fetchTeams = async () => {

  const { data, error } = await supabase
    .from("teams")
    .select("*");

  if (!error) {

    setTeams(data || []);

  }

};

const fetchWarriors = async () => {

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "warrior");

  if (!error) {

    setWarriors(data || []);

  }

};

const exportOperationalReport = () => {

  // WORKBOOK
  const workbook = XLSX.utils.book_new();

  // =========================
  // SHEET 1 — MISSION SUMMARY
  // =========================

  const missionSummary = allTasks.map((task) => ({

    Title: task.title,

    Status: task.status,

    Priority: task.priority,

    Venue: task.venue,

    Date: task.activity_date,

    Assigned_To:
      task.assigned_user_name || "Team",

  }));

  const missionSheet =
    XLSX.utils.json_to_sheet(
      missionSummary
    );

  XLSX.utils.book_append_sheet(
    workbook,
    missionSheet,
    "Mission Summary"
  );

  // =========================
  // SHEET 2 — TEAM PERFORMANCE
  // =========================

  const teamSheet =
    XLSX.utils.json_to_sheet(
      teamPerformance
    );

  XLSX.utils.book_append_sheet(
    workbook,
    teamSheet,
    "Team Performance"
  );

  // =========================
  // SHEET 3 — WARRIOR RANKINGS
  // =========================

  const warriorSheet =
    XLSX.utils.json_to_sheet(
      warriorLeaderboard
    );

  XLSX.utils.book_append_sheet(
    workbook,
    warriorSheet,
    "Warrior Rankings"
  );

  // =========================
  // EXPORT FILE
  // =========================

  const excelBuffer =
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

  const fileData = new Blob(
    [excelBuffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
    }
  );

  saveAs(
    fileData,
    `CampusFlow_Report_${Date.now()}.xlsx`
  );

};

const approveCoordinator = async (id) => {

  console.log("APPROVE CLICKED");

  const { error } = await supabase
    .from("profiles")
    .update({

      approval_status: "approved",

      account_active: true

    })
    .eq("id", id);

  console.log("SUPABASE ERROR:", error);

  if (error) {

    alert(error.message);

    return;
  }

  alert("Coordinator Approved");

  fetchPendingCoordinators();

};

const rejectCoordinator = async (id) => {

  console.log("REJECT CLICKED");

  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "rejected",
      account_active: false
    })
    .eq("id", id);

  console.log("SUPABASE ERROR:", error);

  if (error) {

    alert(error.message);

    return;
  }

  alert("Coordinator Rejected");

  fetchPendingCoordinators();

};
const fetchPendingCoordinators = async () => {

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "college_coordinator");

  if (!error) {

    setPendingCoordinators(data || []);

  }

};

useEffect(() => {

  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchPlanners();
  fetchAllTasks();
  fetchTeams();
  fetchWarriors();
  fetchPendingCoordinators();
}, []);

  const createPlanner = async () => {

    if (!title) {

      alert("Planner title required");

      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("task_planners")
      .insert([{

        title,
        description,
        objective,
        deadline,
        created_by: user.id

      }]);

    console.log("INSERT DATA:", data);
    console.log("INSERT ERROR:", error);

    if (error) {

      console.error(error);

      alert("Failed to create planner");

      return;
    }

    alert("Planner created");
    fetchPlanners();

    setTitle("");
    setDescription("");
    setObjective("");
    setDeadline("");

    fetchAllTasks();
    fetchTeams();
    fetchWarriors();

  };

  return (

    <div className="min-h-screen bg-[#030014] text-white p-8">

<div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-10">

  <div>

    <h1 className="text-5xl font-black mb-2">
      Admin Planner System
    </h1>

    <p className="text-gray-400">
      Create and manage master task planners.
    </p>

  </div>

  <button
    onClick={exportOperationalReport}
    className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-green-500 hover:bg-green-400 transition-all text-white font-black shadow-lg shadow-green-500/20"
  >

    Export Operational Report

  </button>

</div>

      {/* ADMIN CONTROL DASHBOARD */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

  {/* TOTAL PLANNERS */}

  <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">

    <p className="text-cyan-400 text-xs font-black tracking-[0.25em] uppercase mb-3">
      Total Planners
    </p>

    <h2 className="text-4xl font-black text-white">
      {planners.length}
    </h2>

  </div>

  {/* ACTIVE */}

  <div className="rounded-3xl border border-green-500/20 bg-green-500/[0.04] p-6">

    <p className="text-green-400 text-xs font-black tracking-[0.25em] uppercase mb-3">
      Active Operations
    </p>

    <h2 className="text-4xl font-black text-white">
      {
        planners.filter(
          p => p.status !== "completed"
        ).length
      }
    </h2>

  </div>

  {/* COMPLETED */}

  <div className="rounded-3xl border border-pink-500/20 bg-pink-500/[0.04] p-6">

    <p className="text-pink-400 text-xs font-black tracking-[0.25em] uppercase mb-3">
      Completed Operations
    </p>

    <h2 className="text-4xl font-black text-white">
      {
        planners.filter(
          p => p.status === "completed"
        ).length
      }
    </h2>

  </div>

  {/* SYSTEM */}

  <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.04] p-6">

    <p className="text-yellow-400 text-xs font-black tracking-[0.25em] uppercase mb-3">
      System Status
    </p>

    <h2 className="text-2xl font-black text-green-400">
      LIVE
    </h2>

  </div>

</div>

      {/* CREATE FORM */}

      <div className="mb-10 p-6 rounded-3xl border border-white/10 bg-white/[0.03]">

        <h2 className="text-2xl font-bold mb-6">
          Create Planner
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Planner Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none"
          />

          <textarea
            placeholder="Objectives"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none"
          />

          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-white/10 outline-none"
          />

          <button
            onClick={createPlanner}
            className="px-6 py-3 rounded-2xl bg-pink-500 text-white font-bold"
          >
            Create Planner
          </button>

        </div>

      </div>

      {/* PLANNERS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {planners.map((planner) => (

          <div
            key={planner.id}
            className="p-6 rounded-3xl border border-white/10 bg-white/[0.03]"
          >

            <h3 className="text-2xl font-bold mb-3">
              {planner.title}
            </h3>

            <p className="text-gray-400 mb-4">
              {planner.description}
            </p>

            <div className="space-y-2 text-sm">

              <p>
                <span className="text-gray-500">
                  Objective:
                </span>{" "}
                {planner.objective}
              </p>

              <p>
                <span className="text-gray-500">
                  Deadline:
                </span>{" "}
                {planner.deadline}
              </p>

            </div>

          </div>

        ))}

        {planners.length === 0 && (

  <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.03] p-16 text-center">

    <div className="text-6xl mb-6">
      📋
    </div>

    <h2 className="text-3xl font-black text-white mb-3">
      No Planners Yet
    </h2>

    <p className="text-gray-400">
      Create your first operational planner.
    </p>

  </div>

)}

      </div>

      {/* ANALYTICS VISUALIZATION */}

<div className="mt-14 mb-14">

  <div className="mb-6">

    <p className="text-pink-400 text-xs font-black tracking-[0.25em] uppercase mb-2">
      Analytics Visualization
    </p>

    <h2 className="text-3xl font-black text-white">
      Mission Status Distribution
    </h2>

  </div>

  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">

    <div className="h-[400px]">

      <ResponsiveContainer width="100%" height="100%">

        <PieChart>

          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={140}
            label
          >

            {chartData.map((entry, index) => (

              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />

            ))}

          </Pie>

          <Tooltip />

        </PieChart>

      </ResponsiveContainer>

    </div>

  </div>

</div>

{/* TEAM PERFORMANCE */}

<div className="mt-14 mb-14">

  <div className="mb-6">

    <p className="text-green-400 text-xs font-black tracking-[0.25em] uppercase mb-2">
      Operational Intelligence
    </p>

    <h2 className="text-3xl font-black text-white">
      Top Performing Teams
    </h2>

  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

    {teamPerformance.slice(0, 6).map((team) => (

      <div
        key={team.id}
        className="rounded-3xl border border-green-500/20 bg-green-500/[0.04] p-6"
      >

        <div className="flex items-center justify-between mb-5">

          <div>

            <p className="text-white text-2xl font-black">
              {team.team_name}
            </p>

            <p className="text-gray-400 text-sm mt-1">
              {team.completed} / {team.total} Missions
            </p>

          </div>

          <div className="w-16 h-16 rounded-full border-4 border-green-400 flex items-center justify-center text-green-400 font-black text-xl">

            {team.score}%

          </div>

        </div>

        <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden">

          <div
            className="h-full bg-green-400 rounded-full"
            style={{
              width: `${team.score}%`
            }}
          />

        </div>

      </div>

    ))}

  </div>

</div>

{/* TOP WARRIORS */}

<div className="mt-14 mb-14">

  <div className="mb-6">

    <p className="text-yellow-400 text-xs font-black tracking-[0.25em] uppercase mb-2">
      Warrior Intelligence
    </p>

    <h2 className="text-3xl font-black text-white">
      Top Warriors
    </h2>

  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

    {warriorLeaderboard.slice(0, 6).map((warrior, index) => (

      <div
        key={warrior.id}
        className="rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.04] p-6"
      >

        <div className="flex items-center justify-between mb-5">

          <div>

            <p className="text-white text-2xl font-black">
              #{index + 1} {warrior.name}
            </p>

            <p className="text-gray-400 text-sm mt-1">
              {warrior.completed} / {warrior.total} Missions
            </p>

          </div>

          <div className="w-16 h-16 rounded-full border-4 border-yellow-400 flex items-center justify-center text-yellow-400 font-black text-xl">

            {warrior.score}%

          </div>

        </div>

        <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden">

          <div
            className="h-full bg-yellow-400 rounded-full"
            style={{
              width: `${warrior.score}%`
            }}
          />

        </div>

      </div>

    ))}

  </div>

</div>


      {/* GLOBAL OPERATIONS FEED */}

<div className="mt-14">

  <div className="mb-6">

    <p className="text-cyan-400 text-xs font-black tracking-[0.25em] uppercase mb-2">
      Global Operations Feed
    </p>

    <h2 className="text-3xl font-black text-white">
      Live Mission Monitoring
    </h2>

  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

    {allTasks.slice(0, 6).map((task) => (

      <div
        key={task.id}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
      >

        <div className="flex items-center justify-between mb-4">

          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
            {task.status}
          </span>

        </div>

        <h3 className="text-2xl font-bold text-white mb-3">
          {task.title}
        </h3>

        <p className="text-gray-400 mb-5">
          {task.description}
        </p>

        <div className="flex items-center justify-between text-sm">

          <span className="text-gray-500">
            Priority: {task.priority}
          </span>

          <span className="text-pink-400 font-bold">
            LIVE
          </span>

        </div>

      </div>

    ))}

  </div>
  <div className="bg-[#0B1120] border border-cyan-500/20 rounded-3xl p-6 mt-10">

  <h2 className="text-3xl font-black text-white mb-6">
    Pending Coordinator Approvals
  </h2>

  {pendingCoordinators.map((coordinator) => (

  <div
    key={coordinator.id}
    className="bg-[#111827] border border-pink-500/20 rounded-2xl p-5 mb-4"
  >

    <h3 className="text-white font-bold text-lg">
      {coordinator.full_name}
    </h3>

    <p className="text-gray-400">
      {coordinator.email}
    </p>

    <p className="text-cyan-400 text-sm">
      {coordinator.college_name}
    </p>

    {coordinator.approval_status === "pending" && (

  <>

    <button
      onClick={() =>
        approveCoordinator(coordinator.id)
      }
      className="
        mt-4
        px-5
        py-2
        rounded-xl
        bg-green-500
        text-white
        font-bold
      "
    >
      Approve
    </button>

    <button
      onClick={() =>
        rejectCoordinator(coordinator.id)
      }
      className="
        mt-4
        ml-3
        px-5
        py-2
        rounded-xl
        bg-red-500
        text-white
        font-bold
      "
    >
      Reject
    </button>

  </>

)}

{coordinator.approval_status === "approved" && (

  <button
    className="
      mt-4
      px-5
      py-2
      rounded-xl
      bg-cyan-500
      text-white
      font-bold
    "
  >
    Approved
  </button>

)}

{coordinator.approval_status === "rejected" && (

  <button
    className="
      mt-4
      px-5
      py-2
      rounded-xl
      bg-gray-500
      text-white
      font-bold
    "
  >
    Rejected
  </button>

)}

  </div>

))}

</div>

</div>

    </div>
    

  );

}
