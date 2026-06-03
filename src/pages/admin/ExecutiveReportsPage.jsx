import { useEffect, useState } from "react";

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

  import { generateAnalytics, } from "../../utils/analyticsEngine";

function ExecutiveReportsPage({
  profile,
}) {

  const [
    tasks,
    setTasks,
  ] = useState([]);

  const [
    teams,
    setTeams,
  ] = useState([]);

  const [
    colleges,
    setColleges,
  ] = useState([]);

  const [
    selectedCollege,
    setSelectedCollege,
  ] = useState("all");

  const [
    activeTab,
    setActiveTab,
  ] = useState("execution");

  useEffect(() => {

    fetchData();

  }, []);

  const fetchData =
    async () => {
      // TASKS

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
      } = await taskQuery;

      // TEAMS

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
      } = await teamQuery;

      // COLLEGES

      const {
        data: collegeData,
      } = await supabase

        .from("colleges")

        .select("*")

        .order("name");

      setTasks(taskData || []);

      setTeams(teamData || []);

      setColleges(
        collegeData || []
      );

    };

  // FILTERED TASKS

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

  // KPI DATAconst analytics =
  generateAnalytics({

    tasks: filteredTasks,

    teams,

    colleges,

  });

const totalActivities =
  analytics.totalTasks;

const completedActivities =
  analytics.totalCompleted;

const totalStudents =
  analytics.totalOutreach;

const presentationCount =
  analytics.totalPresentations;

const impactActivities =
  analytics.totalImpactActivities;

const weeklyData =
  analytics.weeklyData;

const teamAnalytics =
  analytics.teamAnalytics;

const collegeAnalytics =
  analytics.collegeAnalytics;

const weeklyData =
  weeks.map((week) => {

    const weekTasks =
      filteredTasks.filter(
        (task) => {

          if (
            task.status !==
            "completed"
          ) {
            return false;
          }

          if (
            !task.activity_date
          ) {
            return false;
          }

          return (

            task.activity_date >=
              week.start &&

            task.activity_date <=
              week.end

          );

        }
      );

    const presentations =
      weekTasks.filter(
        (task) =>
          task.activity_type
            ?.toLowerCase() ===
          "presentation"
      );

    const impact =
      weekTasks.filter(
        (task) =>
          task.activity_type
            ?.toLowerCase() ===
          "impact activity"
      );

    const outreach =
      weekTasks.reduce(
        (sum, task) =>
          sum +
          (
            task.audience_count ||
            0
          ),
        0
      );

    return {

      week: week.name,

      presentations:
        presentations.length,

      impact:
        impact.length,

      outreach,

      completed:
        weekTasks.length,

    };

  });

  return (

    <div className="
      min-h-screen
      bg-[#081120]
      text-white
      p-6
    ">

      {/* HEADER */}

      <div className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-between
        gap-6
        mb-10
      ">

        <div>

          <h1 className="
            text-5xl
            font-black
          ">
            Executive Reports
          </h1>

          <p className="
            text-gray-400
            mt-2
          ">
            Cyber Shiksha for
            Cyber Suraksha
          </p>

        </div>

        {/* FILTERS */}

        <div className="
          flex
          items-center
          gap-4
        ">

          {profile?.role ===
            "admin" && (

            <select

              value={
                selectedCollege
              }

              onChange={(e) =>
                setSelectedCollege(
                  e.target.value
                )
              }

              className="
                px-5
                py-3
                rounded-2xl
                bg-white/5
                border
                border-cyan-500/20
                outline-none
              "
            >

              <option value="all">
                All Colleges
              </option>

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

          )}

        </div>

      </div>

      {/* TABS */}

      <div className="
        flex
        gap-4
        mb-8
        overflow-x-auto
      ">

        {[
          "execution",
          "weekly",
          "groups",
        ].map((tab) => (

          <button

            key={tab}

            onClick={() =>
              setActiveTab(tab)
            }

            className={`
              px-5
              py-3
              rounded-2xl
              font-bold
              whitespace-nowrap

              ${
                activeTab === tab
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5"
              }
            `}
          >

            {tab.toUpperCase()}

          </button>

        ))}

      </div>

      {/* KPI CARDS */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-6
        mb-10
      ">

        <div className="
          rounded-3xl
          bg-cyan-500/10
          border
          border-cyan-500/20
          p-6
        ">

          <p className="
            text-cyan-300
          ">
            Total Activities
          </p>

          <h2 className="
            text-5xl
            font-black
            mt-2
          ">
            {totalActivities}
          </h2>

        </div>

        <div className="
          rounded-3xl
          bg-green-500/10
          border
          border-green-500/20
          p-6
        ">

          <p className="
            text-green-300
          ">
            Completed
          </p>

          <h2 className="
            text-5xl
            font-black
            mt-2
          ">
            {
              completedActivities
            }
          </h2>

        </div>

        <div className="
          rounded-3xl
          bg-yellow-500/10
          border
          border-yellow-500/20
          p-6
        ">

          <p className="
            text-yellow-300
          ">
            Presentations
          </p>

          <h2 className="
            text-5xl
            font-black
            mt-2
          ">
            {
              presentationCount
            }
          </h2>

        </div>

        <div className="
          rounded-3xl
          bg-pink-500/10
          border
          border-pink-500/20
          p-6
        ">

          <p className="
            text-pink-300
          ">
            Students Reached
          </p>

          <h2 className="
            text-5xl
            font-black
            mt-2
          ">
            {totalStudents}
          </h2>

        </div>

      </div>

      {/* EXECUTION TAB */}

      {activeTab ===
        "execution" && (

        <div className="
          rounded-3xl
          bg-white/5
          border
          border-white/10
          p-6
        ">

          <h2 className="
            text-3xl
            font-black
            mb-6
          ">
            Execution Overview
          </h2>

          <div className="
            h-[450px]
          ">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={[
                  {
                    name:
                      "Activities",

                    total:
                      totalActivities,

                    completed:
                      completedActivities,
                  },

                  {
                    name:
                      "Impact",

                    total:
                      impactActivities,

                    completed:
                      impactActivities,
                  },

                  {
                    name:
                      "Presentations",

                    total:
                      presentationCount,

                    completed:
                      presentationCount,
                  },
                ]}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                />

                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                />

                <YAxis
                  stroke="#9ca3af"
                />

                <Tooltip />

                <Bar
                  dataKey="total"
                  fill="#06b6d4"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />

                <Bar
                  dataKey="completed"
                  fill="#22c55e"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

                  </div>

      )}

      {/* WEEKLY TAB */}

{activeTab ===
  "weekly" && (

  <div className="
    rounded-3xl
    bg-white/5
    border
    border-white/10
    p-6
  ">

    <h2 className="
      text-3xl
      font-black
      mb-8
    ">
      Weekly Intelligence Report
    </h2>

    <div className="
      overflow-x-auto
    ">

      <table className="
        w-full
      ">

        <thead>

          <tr className="
            border-b
            border-white/10
            text-left
          ">

            <th className="pb-4">
              Week
            </th>

            <th className="pb-4">
              Presentations
            </th>

            <th className="pb-4">
              Impact Activities
            </th>

            <th className="pb-4">
              Outreach
            </th>

            <th className="pb-4">
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {weeklyData.map(
            (week) => (

              <tr

                key={week.week}

                className="
                  border-b
                  border-white/5
                "
              >

                <td className="
                  py-5
                  font-bold
                  text-cyan-400
                ">
                  {week.week}
                </td>

                <td className="
                  py-5
                ">
                  {
                    week.presentations
                  }
                </td>

                <td className="
                  py-5
                ">
                  {week.impact}
                </td>

                <td className="
                  py-5
                ">
                  {week.outreach}
                </td>

                <td className="
                  py-5
                ">

                  <span className={`
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-bold

                    ${
                      week.completed >= 5
                        ? "bg-green-500/20 text-green-400"
                        : week.completed >= 2
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  `}>

                    {
                      week.completed >= 5
                        ? "STRONG"
                        : week.completed >= 2
                        ? "AVERAGE"
                        : "LOW"
                    }

                  </span>

                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  </div>

)}

{/* GROUPS TAB */}

{activeTab ===
  "groups" && (

  <div className="
    rounded-3xl
    bg-white/5
    border
    border-white/10
    p-6
  ">

    <h2 className="
      text-3xl
      font-black
      mb-8
    ">
      Group Performance Intelligence
    </h2>

    <div className="
      space-y-5
    ">

      {teams

        .filter((team) =>
          filteredTasks.some(
            (task) =>
              task.team_id ===
              team.id
          )
        )

        .map((team) => {

          const teamTasks =
            filteredTasks.filter(
              (task) =>
                task.team_id ===
                team.id
            );

          const completed =
            teamTasks.filter(
              (task) =>
                task.status ===
                "completed"
            ).length;

          const presentations =
            teamTasks.filter(
              (task) =>
                task.activity_type
                  ?.toLowerCase() ===
                  "presentation" &&
                task.status ===
                  "completed"
            ).length;

          const impact =
            teamTasks.filter(
              (task) =>
                task.activity_type
                  ?.toLowerCase() ===
                  "impact activity" &&
                task.status ===
                  "completed"
            ).length;

          const outreach =
            teamTasks.reduce(
              (sum, task) =>
                sum +
                (
                  task.audience_count ||
                  0
                ),
              0
            );

          return (

            <div

              key={team.id}

              className={`
                rounded-3xl
                p-6
                border

                ${
                  completed >= 8
                    ? "border-green-500/30 bg-green-500/5"
                    : completed >= 4
                    ? "border-cyan-500/30 bg-cyan-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }
              `}
            >

              <div className="
                flex
                flex-col
                lg:flex-row
                lg:items-center
                lg:justify-between
                gap-6
              ">

                <div>

                  <h3 className="
                    text-2xl
                    font-black
                  ">
                    {team.team_name}
                  </h3>

                  <p className="
                    text-gray-400
                    mt-2
                  ">
                    {
                      completed
                    }
                    {" "}
                    completed activities
                  </p>

                </div>

                <div className={`
                  px-4
                  py-2
                  rounded-full
                  text-sm
                  font-black

                  ${
                    completed >= 8
                      ? "bg-green-500/20 text-green-400"
                      : completed >= 4
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-red-500/20 text-red-400"
                  }
                `}>

                  {
                    completed >= 8
                      ? "TOP TEAM"
                      : completed >= 4
                      ? "STRONG"
                      : "NEEDS IMPROVEMENT"
                  }

                </div>

              </div>

              <div className="
                grid
                grid-cols-2
                md:grid-cols-4
                gap-4
                mt-6
              ">

                <div className="
                  rounded-2xl
                  bg-black/20
                  p-4
                ">

                  <p className="
                    text-xs
                    text-gray-500
                  ">
                    Presentations
                  </p>

                  <h3 className="
                    text-2xl
                    font-black
                    mt-2
                    text-cyan-400
                  ">
                    {
                      presentations
                    }
                  </h3>

                </div>

                <div className="
                  rounded-2xl
                  bg-black/20
                  p-4
                ">

                  <p className="
                    text-xs
                    text-gray-500
                  ">
                    Impact Activities
                  </p>

                  <h3 className="
                    text-2xl
                    font-black
                    mt-2
                    text-pink-400
                  ">
                    {impact}
                  </h3>

                </div>

                <div className="
                  rounded-2xl
                  bg-black/20
                  p-4
                ">

                  <p className="
                    text-xs
                    text-gray-500
                  ">
                    Outreach
                  </p>

                  <h3 className="
                    text-2xl
                    font-black
                    mt-2
                    text-green-400
                  ">
                    {outreach}
                  </h3>

                </div>

                <div className="
                  rounded-2xl
                  bg-black/20
                  p-4
                ">

                  <p className="
                    text-xs
                    text-gray-500
                  ">
                    Completion
                  </p>

                  <h3 className="
                    text-2xl
                    font-black
                    mt-2
                    text-yellow-400
                  ">
                    {completed}
                  </h3>

                </div>

              </div>

            </div>

          );

        })}

    </div>

  </div>

)}

{/* WEEKLY SNAPSHOTS */}

<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  xl:grid-cols-4
  gap-6
  mt-10
">

  {weeklyData.map((week) => (

    <div

      key={week.week}

      className="
        rounded-3xl
        bg-white/5
        border
        border-white/10
        p-5
      "
    >

      <div className="
        flex
        items-center
        justify-between
        mb-4
      ">

        <h3 className="
          text-xl
          font-black
          text-cyan-400
        ">
          {week.week}
        </h3>

        <div className={`
          px-3
          py-1
          rounded-full
          text-xs
          font-bold

          ${
            week.completed >= 5
              ? "bg-green-500/20 text-green-400"
              : week.completed >= 2
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          }
        `}>

          {
            week.completed >= 5
              ? "STRONG"
              : week.completed >= 2
              ? "AVERAGE"
              : "LOW"
          }

        </div>

      </div>

      <div className="
        space-y-4
      ">

        <div>

          <div className="
            flex
            justify-between
            text-sm
            mb-1
          ">

            <span>
              Presentations
            </span>

            <span className="
              text-cyan-400
            ">
              {
                week.presentations
              }
            </span>

          </div>

          <div className="
            h-2
            rounded-full
            bg-white/10
            overflow-hidden
          ">

            <div
              className="
                h-full
                bg-cyan-400
              "
              style={{
                width: `${
                  Math.min(
                    week.presentations * 10,
                    100
                  )
                }%`
              }}
            />

          </div>

        </div>

        <div>

          <div className="
            flex
            justify-between
            text-sm
            mb-1
          ">

            <span>
              Impact Activities
            </span>

            <span className="
              text-pink-400
            ">
              {week.impact}
            </span>

          </div>

          <div className="
            h-2
            rounded-full
            bg-white/10
            overflow-hidden
          ">

            <div
              className="
                h-full
                bg-pink-400
              "
              style={{
                width: `${
                  Math.min(
                    week.impact * 10,
                    100
                  )
                }%`
              }}
            />

          </div>

        </div>

        <div>

          <div className="
            flex
            justify-between
            text-sm
            mb-1
          ">

            <span>
              Outreach
            </span>

            <span className="
              text-green-400
            ">
              {week.outreach}
            </span>

          </div>

        </div>

      </div>

    </div>

  ))}

</div>

      )

    </div>

  );

}

export default ExecutiveReportsPage;