import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Activity, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";

function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks]= useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [presidents, setPresidents] = useState([]);
  const [pendingCoordinators, setPendingCoordinators] = useState([]);

  const fetchAdminData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Security Check
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (
      !["admin", "college_coordinator", "officer"].includes(profile?.role)
    ) {
      toast.error("Access denied");
      setLoading(false);
      return;
    }

    setIsAuthorized(true);
    setLoading(false);

const [usersRes, activitiesRes, collegesRes, presidentsRes] = await Promise.all([

  supabase
    .from("profiles")
    .select("*")
    .order("full_name"),

  supabase
    .from("tasks")
    .select("*"),

  supabase
    .from("colleges")
    .select("*")
    .order("name"),

supabase
  .from("profiles")
  .select("*")
  .eq("role", "college_coordinator")
  .eq("approval_status", "approved")

]);

    setProfiles(usersRes.data || []);
    setTasks(activitiesRes.data || []);
    setColleges(collegesRes.data || []);
    setPresidents(presidentsRes.data || []);

console.log(
  "COLLEGES DATA:",
  collegesRes.data
);

await fetchPendingCoordinators();

setLoading(false);
  };

useEffect(() => {

  fetchAdminData();

  fetchPendingCoordinators();

}, []);

  const fetchPendingCoordinators =
  async () => {

    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "role",
          "college_coordinator"
        )
        .eq(
          "approval_status",
          "pending"
        );

    if (!error) {

      console.log(
  "PENDING COORDINATORS:",
  data
);
      setPendingCoordinators(
        data || []
      );

    }

};

  const toggleRole = async (targetProfile) => {
    const newRole = targetProfile.role === "admin" ? "warrior" : "admin";
    
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetProfile.id);

    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success(`Role updated to ${newRole}`);
      setProfiles(prev => prev.map(p => p.id === targetProfile.id ? { ...p, role: newRole } : p));
    }
  };

  // Memoized Metrics
  const metrics = useMemo(() => {
    const totalParticipants = activities.reduce((sum, act) => sum + (act.audience_count || 0), 0);
    const adminCount = profiles.filter(p => p.role === "admin").length;
    return [
      { title: "Platform Users", value: profiles.length, icon: Users },
      { title: "Total Activities", value: activities.length, icon: Activity },
      { title: "Total Reach", value: totalParticipants, icon: Shield },
      { title: "Admin Count", value: adminCount, icon: Crown },
    ];
  }, [profiles, activities]);

  if (loading) return <div className="p-10 text-white">Accessing Secure Feed...</div>;
  if (!isAuthorized) return <div className="p-10 text-red-400">Unauthorized Access.</div>;

  return (
    <div className="relative space-y-8 pb-12 p-6">
      {/* Aesthetic Background Glow */}
      <div className="fixed top-0 left-1/3 w-[450px] h-[450px] bg-yellow-500/10 blur-[160px] rounded-full pointer-events-none" />

      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-black text-white mb-2">
          Admin Panel
        </motion.h1>
        <p className="text-gray-400 text-lg">Manage platform roles and monitor event intelligence.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((card, i) => (
          <StatCard key={i} card={card} index={i} />
        ))}
      </div>

      {/* User Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-8">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="pb-4 font-medium">Name</th>
                <th className="pb-4 font-medium">Handle</th>
                <th className="pb-4 font-medium">Department</th>
                <th className="pb-4 font-medium">Role</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profiles.map((p) => (
                <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 text-white font-medium">{p.full_name}</td>
                  <td className="py-5 text-gray-500">@{p.username}</td>
                  <td className="py-5 text-gray-400">{p.department || "MCA"}</td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      p.role === 'admin' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {p.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-5 text-right">
                    <button onClick={() => toggleRole(p)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold hover:scale-105 transition-all">
                      Toggle Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* COLLEGE MANAGEMENT */}

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8"
>

  <h2 className="text-3xl font-bold text-white mb-8">
    College Chapters
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

    {colleges.map((college) => {

      const warriors = profiles.filter(
        (p) =>
          p.college_id === college.id &&
          p.role === "warrior"
      );

      const president = profiles.find(
        (p) =>
          p.college_id === college.id &&
          p.role === "college_coordinator"
      );

      return (

        <div
          key={college.id}
          className="rounded-3xl border border-yellow-500/10 bg-black/20 p-6"
        >

          <h3 className="text-2xl font-black text-white mb-4">
            {college.name}
          </h3>

          <div className="space-y-3">

            <select

  className="w-full mt-4 rounded-xl bg-[#0a1022] border border-white/10 px-4 py-3 text-white"

  value={college.president_id || ""}

  onChange={async (e) => {

    const presidentId = e.target.value;

    const { error } = await supabase
      .from("colleges")
      .update({
        president_id: presidentId
      })
      .eq("id", college.id);

    if (error) {

      console.log("PRESIDENT ASSIGN ERROR:", error);

      alert(error.message);

      return;
    }

    setColleges((prev) =>
      prev.map((c) =>
        c.id === college.id
          ? { ...c, president_id: presidentId }
          : c
      )
    );

    console.log("PRESIDENT ASSIGNED");
  }}

>

  <option value="">
    Assign President
  </option>

  {presidents

  .filter(
    (president) =>
      president.college_id ===
      college.id
  )

  .map((president) => (

    <option
      key={president.id}
      value={president.id}
    >
      {president.full_name}
    </option>

  ))}

</select>

            <div>
              <p className="text-gray-500 text-sm">
                President
              </p>

              <p className="text-white font-bold">
                {president?.full_name || "Not Assigned"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Warriors
              </p>

              <p className="text-yellow-400 font-bold text-xl">
                {warriors.length}
              </p>
            </div>

          </div>

        </div>

      );
    })}

  </div>

</motion.div>
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="
    relative 
    z-50
    rounded-3xl
    border
    border-white/10
    bg-white/5
    backdrop-blur-2xl
    p-8
  "
>

  <h2 className="
    text-3xl
    font-bold
    text-white
    mb-8
  ">
    Pending Coordinator Approvals
  </h2>

  <div className="space-y-4">

    {pendingCoordinators.map((user) => {

  const college =
    colleges.find(
      (c) =>
        c.id ===
        user.college_id
    );

  return (

      <div
        key={user.id}
        className="
          rounded-2xl
          border
          border-white/10
          bg-black/20
          p-5
          flex
          items-center
          justify-between
        "
      >

        <div>

          <h3 className="
            text-xl
            font-black
            text-white
          ">
            {user.full_name}
          </h3>

          <p className="text-gray-400">
            @{user.username}
          </p>

          <p className="
  text-sm
  text-cyan-400
  mt-1
">
  {user.email}
</p>

<p className="
  text-sm
  text-yellow-400
  mt-1
">
  {
    college?.name ||
    "Unknown College"
  }
</p>

        </div>
        <div className="
  px-3
  py-1
  rounded-full
  bg-yellow-500/20
  border
  border-yellow-500/30
  text-yellow-400
  text-xs
  font-black
">
  PENDING
</div>

<div className="flex gap-3">

  <button

    onClick={async () => {

      console.log(
        "APPROVE CLICKED"
      );

      const { error } =
        await supabase
          .from("profiles")
          .update({

            approval_status:
              "approved",

            account_active:
              true,

          })
          .eq("id", user.id);

      console.log(
        "APPROVE ERROR:",
        error
      );

      if (error) {

        toast.error(
          "Approval failed"
        );

        return;

      }

      toast.success(
        "Coordinator Approved"
      );

      await fetchPendingCoordinators();

    }}

    className="
      px-5
      py-3
      rounded-xl
      bg-emerald-500/20
      border
      border-emerald-500/30
      text-emerald-400
      font-black
    "
  >

    App

  </button>

  <button

    onClick={async () => {

      console.log(
        "REJECT CLICKED"
      );

      const { error } =
        await supabase
          .from("profiles")
          .update({

            approval_status:
              "rejected",

            account_active:
              false,

          })
          .eq("id", user.id);

      console.log(
        "REJECT ERROR:",
        error
      );

      if (error) {

        toast.error(
          "Rejection failed"
        );

        return;

      }

      toast.success(
        "Coordinator Rejected"
      );

      await fetchPendingCoordinators();

    }}

    className="
      px-5
      py-3
      rounded-xl
      bg-red-500/20
      border
      border-red-500/30
      text-red-400
      font-black
    "
  >

    Reject

  </button>

</div>

      </div>

  );    
    }
)}

  </div>

</motion.div>
    </div>
  );
}

// Sub-component for Stats to keep code DRY
const StatCard = ({ card, index }) => {
  const Icon = card.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className="rounded-3xl border border-yellow-500/10 bg-white/5 backdrop-blur-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-all" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
          <Icon size={24} className="text-white" />
        </div>
        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">{card.title}</p>
        <h2 className="text-4xl font-black text-white">{card.value}</h2>
      </div>
    </motion.div>
  );
};



export default AdminPage;
