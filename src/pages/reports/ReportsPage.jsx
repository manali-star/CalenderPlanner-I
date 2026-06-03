import { useEffect, useState } from "react";
import XLSX from "xlsx-js-style";
import { supabase } from "../../lib/supabase";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { generateAnalytics } from "../../utils/analyticsEngine";

function ReportsPage({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("all");
const filteredTasks =
  profile?.role ===
  "college_coordinator"

    ? tasks.filter(
        (task) =>
          task.assigned_college_id ===
          profile?.college_id
      )

    : selectedCollege ===
      "all"

    ? tasks

    : tasks.filter(
        (task) =>
          task.assigned_college_id ===
          selectedCollege
      );
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    // FETCH TASKS
    let taskQuery =
  supabase
    .from("tasks")
    .select("*");

if (
  profile?.role !== "admin"
) {

  taskQuery =
    taskQuery.eq(
      "assigned_college_id",
      profile?.college_id
    );

}

const {
  data: taskData,
  error: taskError,
} = await taskQuery;

    // FETCH TEAMS
    let teamQuery =
  supabase
    .from("teams")
    .select("*");

if (
  profile?.role !== "admin"
) {

  teamQuery =
    teamQuery.eq(
      "college_id",
      profile?.college_id
    );

}

const {
  data: teamData,
  error: teamError,
} = await teamQuery;

    if (taskError) {
      console.log("TASK ERROR:", taskError);
    }

    if (teamError) {
      console.log("TEAM ERROR:", teamError);
    }

    setTasks(taskData || []);
    console.log("TASK DATA:", taskData);
    const {
  data: collegeData,
} = await supabase
  .from("colleges")
  .select("*");

setColleges(
  collegeData || []
);
    setTeams(teamData || []);
  };

  const analytics =
  generateAnalytics({

    tasks: filteredTasks,

    teams,

  });

const totalActivities =
  analytics.totalTasks;

const completedActivities =
  analytics.totalCompleted;

const pendingActivities =
  totalActivities -
  completedActivities;

const totalAchieved =
  analytics.totalOutreach;

const presentationCount =
  analytics.totalPresentations;

const impactCount =
  analytics.totalImpactActivities;

const weeklyData =
  analytics.weeklyData;

const teamAnalytics =
  analytics.teamAnalytics;

const exportToExcel = () => {

  const data = [

    [
      "WEEK",
      "PRESENTATIONS",
      "",
      "",
      "STUDENTS SENSITIZED",
      "",
      "",
      "IMPACT ACTIVITIES",
      "",
      "",
      "OUTREACH",
      "",
      "",
    ],

    [
      "",
      "TARGET",
      "DONE",
      "+/-",

      "TARGET",
      "DONE",
      "+/-",

      "TARGET",
      "DONE",
      "+/-",

      "TARGET",
      "DONE",
      "+/-",
    ],

  ];

weeklyData.forEach(
  (week) => {

    data.push([

      `${week.week}
(${week.dateRange})`,

      // PRESENTATIONS

      week.presentationsTarget,

      week.presentationsDone,

      week.presentationsDone -
      week.presentationsTarget,

      // STUDENTS

      week.studentsTarget,

      week.studentsDone,

      week.studentsSurplus,

      // IMPACT

      week.impactTarget,

      week.impactDone,

      week.impactSurplus,

      // OUTREACH

      week.outreachTarget,

      week.outreachDone,

      week.outreachSurplus,

    ]);

  }
);

  const worksheet =
    XLSX.utils.aoa_to_sheet(
      data
    );

  worksheet["!merges"] = [

    { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
    { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } },
    { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } },
    { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },

  ];

  worksheet["!cols"] = [

    { wch: 14 },

    { wch: 12 },
    { wch: 12 },
    { wch: 10 },

    { wch: 16 },
    { wch: 16 },
    { wch: 12 },

    { wch: 16 },
    { wch: 12 },
    { wch: 12 },

    { wch: 14 },
    { wch: 12 },
    { wch: 12 },

  ];

  const range =
    XLSX.utils.decode_range(
      worksheet["!ref"]
    );

  for (
    let R = range.s.r;
    R <= range.e.r;
    ++R
  ) {

    for (
      let C = range.s.c;
      C <= range.e.c;
      ++C
    ) {

      const cell =
        worksheet[
          XLSX.utils.encode_cell({
            r: R,
            c: C,
          })
        ];

      if (!cell) continue;

      cell.s = {

        font: {
          bold: R <= 1,
          color: {
            rgb:
              R <= 1
                ? "FFFFFF"
                : "000000",
          },
        },

        fill: {
          fgColor: {
            rgb:
              R <= 1
                ? "0F172A"
                : "FFFFFF",
          },
        },

        alignment: {
          horizontal:
            "center",
          vertical:
            "center",
        },

        border: {
          top: {
            style: "thin",
          },
          bottom: {
            style: "thin",
          },
          left: {
            style: "thin",
          },
          right: {
            style: "thin",
          },
        },

      };

    }

  }

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "College Report"
  );

  XLSX.writeFile(
    workbook,
    "College_Report.xlsx"
  );

};

  return (

  <div className="p-6 text-white">

    {/* TOP BAR */}

    <div className="flex justify-between items-center mb-8">

      <h1 className="text-4xl font-black">
        College Reports
      </h1>

      {profile?.role === "admin" && (
        <div className="mt-4 relative">
          <select
            value={selectedCollege}
            onChange={(e) =>
              setSelectedCollege(e.target.value)
            }
            className="
              bg-[#0B1120]
              border
              border-cyan-500/40
              text-white
              px-5
              py-3
              rounded-2xl
              outline-none
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-500/20
              transition-all
              min-w-[240px]
              shadow-lg
              shadow-cyan-500/10
            "
          >
            <option value="all">All Colleges</option>

            {colleges.map(
  (college) => (

    <option
      key={college.id}
      value={college.id}
    >
      {college.name}
    </option>

  )
)}
          </select>
          <div className="
            pointer-events-none
            absolute
            right-5
            top-1/2
            -translate-y-1/2
            text-cyan-400
          ">
          </div>
        </div>
      )}

      <button
        onClick={exportToExcel}
        className="
          px-5
          py-3
          rounded-xl
          bg-cyan-500
          hover:bg-cyan-400
          text-white
          font-bold
        "
      >
        Export Excel
      </button>

    </div>

    {/* KPI CARDS */}

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-gray-400">
          Total Activities
        </p>

        <h2 className="text-4xl font-black mt-2">
          {totalActivities}
        </h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-gray-400">
          Completed
        </p>

        <h2 className="text-4xl font-black text-green-400 mt-2">
          {completedActivities}
        </h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-gray-400">
          Pending
        </p>

        <h2 className="text-4xl font-black text-yellow-400 mt-2">
          {pendingActivities}
        </h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-gray-400">
          Students Reached
        </p>

        <h2 className="text-4xl font-black text-cyan-400 mt-2">
          {totalAchieved}
        </h2>
      </div>

    </div>

    {/* CATEGORY ANALYTICS */}

<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6">

    <p className="text-cyan-300">
      Presentations
    </p>

    <h2 className="text-4xl font-black text-cyan-400 mt-2">
      {presentationCount}
    </h2>

  </div>

  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">

    <p className="text-green-300">
      Outreach
    </p>

    <h2 className="text-4xl font-black text-green-400 mt-2">
      {totalAchieved}
    </h2>

  </div>

  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">

    <p className="text-yellow-300">
      Impact Activities
    </p>

    <h2 className="text-4xl font-black text-yellow-400 mt-2">
      {impactCount}
    </h2>

  </div>

</div>

    {/* WEEKLY CHART */}

<div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">

  <h2 className="text-2xl font-black mb-6">
    Weekly Analytics Chart
  </h2>

  <div className="h-[400px]">

    <ResponsiveContainer width="100%" height="100%">

      <BarChart data={weeklyData}>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1f2937"
        />

        <XAxis
          dataKey="week"
          stroke="#9ca3af"
        />

        <YAxis
          stroke="#9ca3af"
        />

        <Tooltip />

        <Bar
          dataKey="outreachDone"
          fill="#06b6d4"
          radius={[6, 6, 0, 0]}
        />

        <Bar
          dataKey="studentsDone"
          fill="#22c55e"
          radius={[6, 6, 0, 0]}
        />

      </BarChart>

    </ResponsiveContainer>

  </div>

</div>

{/* WEEKLY REPORT TABLE */}

<div className="
  bg-white/5
  border
  border-white/10
  rounded-2xl
  p-6
  mb-10
">

  <h2 className="
    text-2xl
    font-black
    mb-6
  ">
    Weekly Executive Report
  </h2>

  <div className="
    overflow-x-auto
  ">

    <table className="
      w-full
      text-sm
    ">

      <thead>

        <tr className="
          border-b
          border-white/10
        ">

          <th className="
            py-4
            text-left
          ">
            Week
          </th>

          <th>
            Presentations
          </th>

          <th>
            Students
          </th>

          <th>
            Impact Activities
          </th>

          <th>
            Outreach
          </th>

        </tr>

      </thead>

      <tbody>

        {weeklyData.map(
          (week, index) => (

            <tr

              key={index}

              className="
                border-b
                border-white/5
              "
            >

              <td className="
                py-5
              ">

                <div className="
                  font-bold
                  text-cyan-400
                ">
                  {week.week}
                </div>

                <div className="
                  text-xs
                  text-gray-400
                  mt-1
                ">
                  {
                    week.dateRange
                  }
                </div>

              </td>

              <td className="
                text-center
              ">

                {
                  week.presentationsDone
                }

                /

                {
                  week.presentationsTarget
                }

              </td>

              <td className="
                text-center
              ">

                {
                  week.studentsDone
                }

                /

                {
                  week.studentsTarget
                }

                <div className={`
                  text-xs
                  mt-1

                  ${
                    week.studentsSurplus >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                `}>

                  {
                    week.studentsSurplus >= 0
                      ? "+"
                      : ""
                  }

                  {
                    week.studentsSurplus
                  }

                </div>

              </td>

              <td className="
                text-center
              ">

                {
                  week.impactDone
                }

                /

                {
                  week.impactTarget
                }

              </td>

              <td className="
                text-center
              ">

                {
                  week.outreachDone
                }

                /

                {
                  week.outreachTarget
                }

              </td>

            </tr>

          )
        )}

      </tbody>

    </table>

  </div>

</div>

    {/* TEAM PERFORMANCE */}

    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

      <h2 className="text-2xl font-black mb-6">
        Group-wise Performance
      </h2>

      <div className="space-y-4">

{teamAnalytics.map(
  (team) => (

    <div
      key={team.id}
      className="
        bg-black/20
        rounded-xl
        p-5
        mb-4
        flex
        justify-between
        items-center
      "
    >

      <div>

        <h3 className="
          text-white
          font-bold
          text-lg
        ">
          {team.team_name}
        </h3>

        <p className="
          text-gray-400
          text-sm
        ">
          {
            team.completed
          }
          {" "}
          Activities Completed
        </p>

        <p className="
          text-cyan-400
          text-sm
        ">
          {
            team.outreach
          }
          {" "}
          Students Reached
        </p>

      </div>

      <div className="
        text-green-400
        font-bold
      ">
        Active
      </div>

    </div>

  )
)}

</div>

    </div>

  </div>

);

}

export default ReportsPage;