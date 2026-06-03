import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";

export default function TeamsPage({ profile }) {

  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedWarrior, setSelectedWarrior] = useState("");
  const [warriors, setWarriors] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  if (profile?.role !== "college_coordinator") {
  return <Navigate to="/dashboard"/>;
}
  const topTeam = teams.reduce((best, team) => {

  const currentEfficiency =
    teamStats[team.id]?.efficiency || 0;

  const bestEfficiency =
    teamStats[best?.id]?.efficiency || 0;

  return currentEfficiency > bestEfficiency
    ? team
    : best;

}, null);

const leaderboardTeams = [...teams].sort((a, b) => {

  const aEfficiency =
    teamStats[a.id]?.efficiency || 0;

  const bEfficiency =
    teamStats[b.id]?.efficiency || 0;

  return bEfficiency - aEfficiency;

});
  const fetchData = async () => {
const { data: teamsData } = await supabase
  .from("teams")
  .select("*")
  .eq("college_id", profile?.college_id);
  console.log("ALL TEAMS:", teamsData);

if (teamsData) {
  setTeams(teamsData);
}

const { data: warriorsData } = await supabase
  .from("profiles")
  .select("*")
  .ilike("role", "warrior")
  .eq("college_id", profile?.college_id);

if (warriorsData) {

  console.log("WARRIORS:", warriorsData);

  setWarriors(warriorsData);

}

const { data: membersData } = await supabase
  .from("team_members")
  .select(`
    id,
    team_id,
    user_id,
    profiles (
      full_name
    )
  `);

if (membersData) {
  setTeamMembers(membersData);
}

const { data: tasksData } = await supabase
  .from("tasks")
  .select("*")
  .eq("assigned_college_id", profile?.college_id);

if (tasksData) {

  const stats = {};

  teamsData?.forEach((team) => {

    const teamTasks = tasksData.filter(
      (task) => task.assigned_team_id === team.id
    );

    const completed = teamTasks.filter(
      (task) => task.status === "approved"
    ).length;

    const pending = teamTasks.filter(
      (task) =>
        task.status === "pending" ||
        task.status === "submitted"
    ).length;

    const total = teamTasks.length;

    const efficiency =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    stats[team.id] = {
      completed,
      pending,
      total,
      efficiency
    };

  });

  setTeamStats(stats);

}

  };

useEffect(() => {

  fetchData();

  const interval = setInterval(() => {
    fetchData();
  }, 3000);

  return () => clearInterval(interval);

}, []);

  const createTeam = async () => {

    if (!teamName.trim()) {
      toast.error("Enter team name");
      return;
    }

    const { error } = await supabase
      .from("teams")
      .insert([
        {
          team_name: teamName,
          college_id: profile?.college_id
        }
      ]);

    if (error) {

      toast.error(error.message);

    } else {

      toast.success("Team created!");

      setTeamName("");

      fetchData();

    }

  };

 const addWarriorToTeam = async () => {

  if (!selectedTeam || !selectedWarrior) {
    toast.error("Select both team and warrior");
    return;
  }

  // GET CURRENT TEAM MEMBERS
  const currentTeamMembers = teamMembers.filter(
    (member) => member.team_id === selectedTeam
  );

  // MAX 2 WARRIORS RULE
  if (currentTeamMembers.length >= 2) {
    toast.error("A team can only contain 2 warriors");
    return;
  }

  // CHECK DUPLICATE IN SAME TEAM
  const alreadyInThisTeam = currentTeamMembers.some(
    (member) => member.user_id === selectedWarrior
  );

  if (alreadyInThisTeam) {
    toast.error("Warrior already exists in this team");
    return;
  }

  // CHECK IF WARRIOR IS IN ANOTHER TEAM
  const alreadyAssigned = teamMembers.some(
    (member) => member.user_id === selectedWarrior
  );

  if (alreadyAssigned) {
    toast.error("Warrior is already assigned to another team");
    return;
  }

  // INSERT MEMBER
  const { error } = await supabase
    .from("team_members")
    .insert([
      {
        team_id: selectedTeam,
        user_id: selectedWarrior
      }
    ]);

  if (error) {

    toast.error(error.message);

  } else {

    toast.success("Warrior added!");

    setSelectedWarrior("");
    setSelectedTeam("");

    fetchData();

  }

};
  return (

    <div className="w-full min-w-0">

      {/* HEADER */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

        <h1 className="text-4xl font-black text-white mb-2">
          Team Management
        </h1>

        <p className="text-gray-400">
          Create teams and assign warriors.
        </p>

      </div>

      {/* TOP TEAM */}
{topTeam && (

  <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.05] p-8 backdrop-blur-xl">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.25em]">
          Top Performing Team
        </p>

        <h2 className="text-4xl font-black text-white mt-3">
          🏆 {topTeam.team_name}
        </h2>

        <div className="flex items-center gap-6 mt-5">

          <div>

            <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
              Efficiency
            </p>

            <h3 className="text-3xl font-black text-yellow-400 mt-1">
              {teamStats[topTeam.id]?.efficiency || 0}%
            </h3>

          </div>

          <div>

            <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
              Completed
            </p>

            <h3 className="text-3xl font-black text-green-400 mt-1">
              {teamStats[topTeam.id]?.completed || 0}
            </h3>

          </div>

        </div>

      </div>

      <div className="text-7xl">
        🏆
      </div>

    </div>

  </div>

)}

{/* TEAM LEADERBOARD */}
<div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

  {/* HEADER */}
  <div className="flex items-center justify-between mb-8">

    <div>

      <p className="text-pink-400 text-xs font-black uppercase tracking-[0.25em]">
        Team Rankings
      </p>

      <h2 className="text-4xl font-black text-white mt-2">
        Performance Leaderboard
      </h2>

    </div>

    <div className="text-5xl">
      🥇
    </div>

  </div>

  {/* RANKINGS */}
  <div className="space-y-4">

    {leaderboardTeams.map((team, index) => (

      <div
        key={team.id}
        className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-5"
      >

        {/* LEFT */}
        <div className="flex items-center gap-5">

          {/* RANK */}
          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black
              ${
                index === 0
                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  : index === 1
                  ? "bg-gray-500/10 text-gray-300 border border-gray-500/20"
                  : index === 2
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : "bg-white/5 text-gray-400 border border-white/5"
              }
            `}
          >
            #{index + 1}
          </div>

          {/* TEAM INFO */}
          <div>

            <h3 className="text-xl font-black text-white">
              {team.team_name}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {teamStats[team.id]?.completed || 0} Completed Tasks
            </p>

          </div>

        </div>

        {/* EFFICIENCY */}
        <div className="text-right">

          <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
            Efficiency
          </p>

          <h3 className="text-3xl font-black text-pink-400 mt-1">
            {teamStats[team.id]?.efficiency || 0}%
          </h3>

        </div>

      </div>

    ))}

  </div>

</div>
      {/* CREATE TEAM */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

        <h2 className="text-2xl font-black text-white mb-6">
          Create Team
        </h2>

        <div className="flex gap-4">

          <input
            type="text"
            placeholder="Team name..."
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="flex-1 bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none"
          />

          <button
            onClick={createTeam}
            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold"
          >
            Create Team
          </button>

        </div>

      </div>

      {/* ADD WARRIOR */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

        <h2 className="text-2xl font-black text-white mb-6">
          Add Warrior To Team
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 text-white"
          >

            <option value="">Select Team</option>

            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.team_name}
              </option>
            ))}

          </select>

          <select
            value={selectedWarrior}
            onChange={(e) => setSelectedWarrior(e.target.value)}
            className="bg-[#0f172a] border border-white/10 rounded-2xl px-5 py-4 text-white"
          >

            <option value="">Select Warrior</option>

            {warriors.map((warrior) => (
              <option key={warrior.id} value={warrior.id}>
                {warrior.full_name}
              </option>
            ))}

          </select>

          <button
            onClick={addWarriorToTeam}
            className="rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold"
          >
            Add Warrior
          </button>

        </div>

      </div>

 {/* TEAMS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {teams.map((team) => {

    const members = teamMembers.filter(
      (member) => member.team_id === team.id
    );

    return (

      <div
        key={team.id}
        className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
      >

        {/* TEAM HEADER */}
        <div className="flex items-center justify-between mb-6">

          <div>

            <h3 className="text-2xl font-black text-white">
              {team.team_name}
            </h3>

<div className="mt-2 space-y-3">

  {/* MEMBER COUNT */}
  <p className="text-gray-400 text-sm">
    {members.length}/2 Warriors Assigned
  </p>

  {/* STATUS BAR */}
  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">

    <div
      className={`
        h-full transition-all duration-500
        ${
          members.length === 2
            ? "bg-green-500"
            : members.length === 1
            ? "bg-yellow-500"
            : "bg-red-500"
        }
      `}
      style={{
        width: `${(members.length / 2) * 100}%`
      }}
    />

  </div>

  {/* STATUS BADGE */}
  <div>

    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]
        ${
          members.length === 2
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : members.length === 1
            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }
      `}
    >

      {
        members.length === 2
          ? "FULL"
          : members.length === 1
          ? "RECRUITING"
          : "EMPTY"
      }

    </span>

  </div>

</div>

          </div>

<div className="flex items-center gap-3">

  {/* EDIT */}
  <button
    onClick={async () => {

      const newName = prompt(
        "Enter new team name",
        team.team_name
      );

      if (!newName?.trim()) return;

      const { error } = await supabase
        .from("teams")
        .update({
          team_name: newName
        })
        .eq("id", team.id);

      if (error) {

        toast.error(error.message);

      } else {

        toast.success("Team updated!");

        fetchData();

      }

    }}
    className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all"
  >
    ✏
  </button>

  {/* DELETE */}
  <button
    onClick={async () => {

      if (members.length > 0) {
        toast.error("Remove warriors before deleting team");
        return;
      }

      const confirmDelete = window.confirm(
        "Delete this team?"
      );

      if (!confirmDelete) return;

      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", team.id);

      if (error) {

        toast.error(error.message);

      } else {

        toast.success("Team deleted!");

        fetchData();

      }

    }}
    className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
  >
    🗑
  </button>

</div>

        </div>

        {/* TEAM PERFORMANCE */}
<div className="mb-6 grid grid-cols-2 gap-3">

  <div className="rounded-2xl bg-black/20 border border-white/5 p-4">

    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
      Completed
    </p>

    <h3 className="text-2xl font-black text-green-400 mt-2">
      {teamStats[team.id]?.completed || 0}
    </h3>

  </div>

  <div className="rounded-2xl bg-black/20 border border-white/5 p-4">

    <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
      Efficiency
    </p>

    <h3 className="text-2xl font-black text-pink-400 mt-2">
      {teamStats[team.id]?.efficiency || 0}%
    </h3>

  </div>

</div>

        {/* MEMBERS */}
        <div className="space-y-3">

          {members.length === 0 ? (

            <p className="text-gray-500 text-sm">
              No warriors assigned yet.
            </p>

          ) : (

            members.map((member) => (

              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/5 px-4 py-3"
              >

                <div>

                  <p className="text-white font-medium">
                    {member.profiles?.full_name}
                  </p>

                  <p className="text-xs text-gray-500">
                    Warrior
                  </p>

                </div>

                <button
  onClick={async () => {

    // AVAILABLE TEAMS EXCEPT CURRENT
    const availableTeams = teams.filter(
      (t) => t.id !== team.id
    );

    if (availableTeams.length === 0) {
      toast.error("No other teams available");
      return;
    }

    // TEAM NAME INPUT
    const targetTeamName = prompt(
      `Transfer to which team?\n\nAvailable:\n${availableTeams
        .map((t) => t.team_name)
        .join("\n")}`
    );

    if (!targetTeamName) return;

    // FIND TEAM
    const targetTeam = availableTeams.find(
      (t) =>
        t.team_name.toLowerCase() ===
        targetTeamName.toLowerCase()
    );

    if (!targetTeam) {
      toast.error("Team not found");
      return;
    }

    // CHECK TARGET TEAM SIZE
    const targetMembers = teamMembers.filter(
      (m) => m.team_id === targetTeam.id
    );

    if (targetMembers.length >= 2) {
      toast.error("Target team already full");
      return;
    }

    // UPDATE TEAM
    console.log(member);
    const { error } = await supabase
      .from("team_members")
      .update({
        team_id: targetTeam.id
      })
      .eq("id", member.team_member_id);

    if (error) {

      toast.error(error.message);

    } else {

      toast.success("Warrior transferred!");

      fetchData();

    }

  }}
  className="w-10 h-10 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center justify-center text-blue-400"
>
  🔄
</button>

<button
  onClick={async () => {

    const confirmDelete = window.confirm(
      "Remove warrior from this team?"
    );

    if (!confirmDelete) return;
    console.log("MEMBER:", member);
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", member.id);

    if (error) {

      toast.error(error.message);

    } else {

      toast.success("Warrior removed!");

      fetchData();

    }

  }}
  className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all flex items-center justify-center text-red-400"
>
  ✖
</button>

              </div>

            ))

          )}

        </div>

      </div>

    );

  })}

</div>

    </div>

  );

}