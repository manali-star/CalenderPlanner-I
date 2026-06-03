import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import toast from "react-hot-toast";

import { supabase }
  from "../../lib/supabase";

function CollegeManagementPage() {

  const [
    colleges,
    setColleges,
  ] = useState([]);

  const [
  profiles,
  setProfiles,
] = useState([]);

const [
  tasks,
  setTasks,
] = useState([]);

const [
  teams,
  setTeams,
] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    newCollege,
    setNewCollege,
  ] = useState({

    name: "",
    code: "",
    city: "",

  });

  useEffect(() => {

    fetchColleges();

  }, []);

  const fetchColleges =
    async () => {

      const {
        data,
        error,
      } = await supabase

        .from("colleges")

        .select("*")

        .order("name");

      if (error) {

        toast.error(error.message);

        return;

      }

      setColleges(data || []);

// FETCH PROFILES

const {
  data: profilesData,
} = await supabase

  .from("profiles")

  .select("*");

setProfiles(
  profilesData || []
);

// FETCH TASKS

const {
  data: tasksData,
} = await supabase

  .from("tasks")

  .select("*");

setTasks(tasksData || []);

// FETCH TEAMS

const {
  data: teamsData,
} = await supabase

  .from("teams")

  .select("*");

setTeams(
  teamsData || []
);

setLoading(false);

    };

  const createCollege =
    async () => {

      if (
        !newCollege.name ||
        !newCollege.code
      ) {

        toast.error(
          "Fill all fields"
        );

        return;

      }

      // DUPLICATE CHECK

      const {
        data: existing,
      } = await supabase

        .from("colleges")

        .select("id")

        .or(
          `name.eq.${newCollege.name},code.eq.${newCollege.code}`
        )

        .maybeSingle();

      if (existing) {

        toast.error(
          "College already exists"
        );

        return;

      }

      const {
        error,
      } = await supabase

        .from("colleges")

        .insert({

          name:
            newCollege.name,

          code:
            newCollege.code,

          city:
            newCollege.city,

          active: true,

        });

      if (error) {

        toast.error(error.message);

        return;

      }

      toast.success(
        "College Added"
      );

      setNewCollege({

        name: "",
        code: "",
        city: "",

      });

      fetchColleges();

    };

  const filteredColleges =
  colleges

    .filter((college) =>
      college.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    )

    .sort((a, b) => {

      const aTasks =
        tasks.filter(
          (task) =>
            task.assigned_college_id ===
            a.id
        );

      const bTasks =
        tasks.filter(
          (task) =>
            task.assigned_college_id ===
            b.id
        );

      const aCompleted =
        aTasks.filter(
          (task) =>
            task.status ===
              "completed" ||
            task.status ===
              "approved"
        ).length;

      const bCompleted =
        bTasks.filter(
          (task) =>
            task.status ===
              "completed" ||
            task.status ===
              "approved"
        ).length;

      const aRate =
        aTasks.length === 0
          ? 0
          : aCompleted /
            aTasks.length;

      const bRate =
        bTasks.length === 0
          ? 0
          : bCompleted /
            bTasks.length;

      return bRate - aRate;

    });

  if (loading) {

    return (

      <div className="
        p-10
        text-white
      ">
        Loading Colleges...
      </div>

    );

  }

  return (

    <div className="
      p-6
      text-white
      space-y-8
    ">

      {/* HEADER */}

      <div>

        <h1 className="
          text-5xl
          font-black
        ">
          College Management
        </h1>

        <p className="
          text-gray-400
          mt-2
        ">
          Manage all campus
          chapters across
          the platform.
        </p>

      </div>

      {/* ADD COLLEGE */}

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
  border-cyan-500/20
  bg-cyan-500/5
  p-6
"
      >

        <input

          type="text"

          placeholder="College Name"

          value={newCollege.name}

          onChange={(e) =>
            setNewCollege({
              ...newCollege,
              name: e.target.value,
            })
          }

          className="
            rounded-xl
            bg-black/20
            border
            border-white/10
            px-4
            py-3
            outline-none
          "
        />

        <input

          type="text"

          placeholder="College Code"

          value={newCollege.code}

          onChange={(e) =>
            setNewCollege({
              ...newCollege,
              code: e.target.value,
            })
          }

          className="
            rounded-xl
            bg-black/20
            border
            border-white/10
            px-4
            py-3
            outline-none
          "
        />

        <input

          type="text"

          placeholder="City"

          value={newCollege.city}

          onChange={(e) =>
            setNewCollege({
              ...newCollege,
              city: e.target.value,
            })
          }

          className="
            rounded-xl
            bg-black/20
            border
            border-white/10
            px-4
            py-3
            outline-none
          "
        />

        <button

          onClick={createCollege}

          className="
            rounded-xl
            bg-cyan-500
            hover:bg-cyan-400
            text-black
            font-black
            px-4
            py-3
          "
        >
          Add College
        </button>

      </motion.div>

      {/* SEARCH */}

      <input

        type="text"

        placeholder="Search colleges..."

        value={search}

        onChange={(e) =>
          setSearch(e.target.value)
        }

        className="
          w-full
          rounded-2xl
          bg-white/5
          border
          border-white/10
          px-5
          py-4
          outline-none
        "
      />

      {/* COLLEGES */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-3
        gap-6
      ">

        {filteredColleges.map(
  (college) => {

    const collegeWarriors =
      profiles.filter(
        (p) =>
          p.college_id ===
            college.id &&
          p.role === "warrior"
      );

    const collegeTeams =
      teams.filter(
        (team) =>
          team.college_id ===
          college.id
      );

    const collegeTasks =
      tasks.filter(
        (task) =>
          task.assigned_college_id ===
          college.id
      );

    const completedTasks =
      collegeTasks.filter(
        (task) =>
          task.status ===
            "completed" ||
          task.status ===
            "approved"
      );

          const completionRate =
      collegeTasks.length === 0
        ? 0
        : Math.round(
            (
              completedTasks.length /
              collegeTasks.length
            ) * 100
          );

    const studentsReached =
      collegeTasks.reduce(
        (sum, task) =>
          sum +
          (task.audience_count || 0),
        0
      );



    const coordinator =
      profiles.find(
        (p) =>
          p.college_id ===
            college.id &&
          p.role ===
            "college_coordinator"
      );

    return (

            <motion.div

              key={college.id}

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
                p-6
              "
            >

              <div className="
                flex
                items-center
                justify-between
              ">

                <div>

                  <h2 className="
                    text-2xl
                    font-black
                  ">
                    {college.name}
                  </h2>

                  <p className="
                    text-gray-400
                    mt-1
                  ">
                    {college.city}
                  </p>

                </div>

                <div className="
  flex
  flex-col
  items-end
  gap-2
">

  <div className="
    px-3
    py-1
    rounded-full
    bg-cyan-500/20
    text-cyan-400
    text-xs
    font-bold
  ">
    {college.code}
  </div>

  <div className={`
    px-3
    py-1
    rounded-full
    text-[10px]
    font-black

    ${
      completionRate >= 80
        ? "bg-green-500/20 text-green-400"
        : completionRate >= 50
        ? "bg-cyan-500/20 text-cyan-400"
        : "bg-red-500/20 text-red-400"
    }
  `}>

    {
      completionRate >= 80
        ? "TOP COLLEGE"
        : completionRate >= 50
        ? "STRONG"
        : "NEEDS IMPROVEMENT"
    }

  </div>

</div>

              </div>

              <div className="
  mt-6
  grid
  grid-cols-2
  gap-4
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
      Warriors
    </p>

    <h3 className="
      text-2xl
      font-black
      mt-1
    ">
      {collegeWarriors.length}
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
      Teams
    </p>

    <h3 className="
      text-2xl
      font-black
      mt-1
    ">
      {collegeTeams.length}
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
      Tasks Completed
    </p>

    <h3 className="
      text-2xl
      font-black
      mt-1
    ">
      {completedTasks.length}
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
      mt-1
      text-cyan-400
    ">
      {completionRate}%
    </h3>
  </div>

</div>

<div className="
  mt-4
  rounded-2xl
  bg-cyan-500/10
  border
  border-cyan-500/20
  p-4
">

  <p className="
    text-xs
    text-cyan-300
  ">
    Coordinator
  </p>

  <h3 className="
    text-lg
    font-black
    mt-1
  ">
    {
      coordinator?.full_name ||
      "Not Assigned"
    }
  </h3>

  <p className="
    text-sm
    text-gray-400
    mt-2
  ">
    Students Reached:
    {" "}
    {studentsReached}
  </p>

</div>

              <div className="
                mt-6
                flex
                items-center
                justify-between
              ">

                <div>

                  <p className="
                    text-gray-500
                    text-sm
                  ">
                    Status
                  </p>

                  <p className={`
                    font-bold
                    ${
                      college.active
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  `}>
                    {
                      college.active
                        ? "Active"
                        : "Inactive"
                    }
                  </p>

                </div>

                <button

                  onClick={async () => {

                    await supabase

                      .from("colleges")

                      .update({
                        active:
                          !college.active,
                      })

                      .eq(
                        "id",
                        college.id
                      );

                    fetchColleges();

                  }}

                  className="
                    px-4
                    py-2
                    rounded-xl
                    bg-white/10
                    hover:bg-white/20
                    text-sm
                    font-bold
                  "
                >
                  Toggle
                </button>

              </div>

            </motion.div>

                    );

        })}

      </div>

    </div>

  );

}

export default CollegeManagementPage;