import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Pencil, Trash2, BarChart2, X, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";

function CollegeManagementPage() {
  const navigate = useNavigate();

  const [colleges, setColleges] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [newCollege, setNewCollege] = useState({ name: "", code: "", city: "" });

  // ── CHANGE 2A: edit state ──
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", city: "" });

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    const { data, error } = await supabase.from("colleges").select("*").order("name");

    if (error) {
      toast.error(error.message);
      return;
    }

    setColleges(data || []);

    const { data: profilesData } = await supabase.from("profiles").select("*");
    setProfiles(profilesData || []);

    const { data: tasksData } = await supabase.from("tasks").select("*");
    setTasks(tasksData || []);

    const { data: teamsData } = await supabase.from("teams").select("*");
    setTeams(teamsData || []);

    setLoading(false);
  };

  // ── ADD COLLEGE ──
  const createCollege = async () => {
    if (!newCollege.name || !newCollege.code) {
      toast.error("Fill all fields");
      return;
    }

    const { data: existing } = await supabase
      .from("colleges")
      .select("id")
      .or(`name.eq.${newCollege.name},code.eq.${newCollege.code}`)
      .maybeSingle();

    if (existing) {
      toast.error("College already exists");
      return;
    }

    const { error } = await supabase.from("colleges").insert({
      name: newCollege.name,
      code: newCollege.code,
      city: newCollege.city,
      active: true,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("College Added");
    setNewCollege({ name: "", code: "", city: "" });
    fetchColleges();
  };

  // ── CHANGE 2A: SAVE EDIT ──
  const saveEdit = async (id) => {
    if (!editForm.name || !editForm.code) {
      toast.error("Name and code are required");
      return;
    }

    const { error } = await supabase
      .from("colleges")
      .update({ name: editForm.name, code: editForm.code, city: editForm.city })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("College updated");
    setEditingId(null);
    fetchColleges();
  };

  // ── CHANGE 2A: DELETE COLLEGE ──
  const deleteCollege = async (id, name) => {
    const confirmed = window.confirm(
      `Delete "${name}"? This cannot be undone. All associated teams and tasks will lose their college reference.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("colleges").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("College removed");
    fetchColleges();
  };

  const filteredColleges = colleges
    .filter((college) =>
      college.name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aTasks = tasks.filter((t) => t.assigned_college_id === a.id);
      const bTasks = tasks.filter((t) => t.assigned_college_id === b.id);
      const aRate =
        aTasks.length === 0
          ? 0
          : aTasks.filter((t) => t.status === "completed" || t.status === "approved").length /
            aTasks.length;
      const bRate =
        bTasks.length === 0
          ? 0
          : bTasks.filter((t) => t.status === "completed" || t.status === "approved").length /
            bTasks.length;
      return bRate - aRate;
    });

  if (loading) {
    return <div className="p-10 text-white">Loading Colleges...</div>;
  }

  return (
    <div className="p-6 text-white space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-5xl font-black">College Management</h1>
        <p className="text-gray-400 mt-2">
          Manage all campus chapters across the platform.
        </p>
      </div>

      {/* ADD COLLEGE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 flex flex-wrap gap-3"
      >
        <input
          type="text"
          placeholder="College Name"
          value={newCollege.name}
          onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
          className="rounded-xl bg-black/20 border border-white/10 px-4 py-3 outline-none flex-1 min-w-[180px]"
        />
        <input
          type="text"
          placeholder="College Code"
          value={newCollege.code}
          onChange={(e) => setNewCollege({ ...newCollege, code: e.target.value })}
          className="rounded-xl bg-black/20 border border-white/10 px-4 py-3 outline-none w-40"
        />
        <input
          type="text"
          placeholder="City"
          value={newCollege.city}
          onChange={(e) => setNewCollege({ ...newCollege, city: e.target.value })}
          className="rounded-xl bg-black/20 border border-white/10 px-4 py-3 outline-none w-40"
        />
        <button
          onClick={createCollege}
          className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black px-6 py-3"
        >
          Add College
        </button>
      </motion.div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search colleges..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 outline-none"
      />

      {/* COLLEGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredColleges.map((college) => {
          const collegeWarriors = profiles.filter(
            (p) => p.college_id === college.id && p.role === "warrior"
          );
          const collegeTeams = teams.filter((t) => t.college_id === college.id);
          const collegeTasks = tasks.filter(
            (t) => t.assigned_college_id === college.id
          );
          const completedTasks = collegeTasks.filter(
            (t) => t.status === "completed" || t.status === "approved"
          );
          const completionRate =
            collegeTasks.length === 0
              ? 0
              : Math.round((completedTasks.length / collegeTasks.length) * 100);
          const studentsReached = collegeTasks.reduce(
            (sum, t) => sum + (t.audience_count || 0),
            0
          );
          const coordinator = profiles.find(
            (p) => p.college_id === college.id && p.role === "college_coordinator"
          );
          const isEditing = editingId === college.id;

          return (
            <motion.div
              key={college.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4"
            >
              {/* TOP: name / code / performance badge */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full rounded-xl bg-black/30 border border-cyan-500/30 px-3 py-2 text-white text-lg font-black outline-none"
                        placeholder="College Name"
                      />
                      <div className="flex gap-2">
                        <input
                          value={editForm.code}
                          onChange={(e) =>
                            setEditForm({ ...editForm, code: e.target.value })
                          }
                          className="w-24 rounded-xl bg-black/30 border border-cyan-500/30 px-3 py-2 text-white text-sm outline-none"
                          placeholder="Code"
                        />
                        <input
                          value={editForm.city}
                          onChange={(e) =>
                            setEditForm({ ...editForm, city: e.target.value })
                          }
                          className="flex-1 rounded-xl bg-black/30 border border-cyan-500/30 px-3 py-2 text-white text-sm outline-none"
                          placeholder="City"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-black">{college.name}</h2>
                      <p className="text-gray-400 mt-1 text-sm">{college.city}</p>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                    {college.code}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-[10px] font-black ${
                      completionRate >= 80
                        ? "bg-green-500/20 text-green-400"
                        : completionRate >= 50
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {completionRate >= 80
                      ? "TOP COLLEGE"
                      : completionRate >= 50
                      ? "STRONG"
                      : "NEEDS IMPROVEMENT"}
                  </div>
                </div>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 gap-3">
                <StatMini label="Warriors" value={collegeWarriors.length} />
                <StatMini label="Teams" value={collegeTeams.length} />
                <StatMini label="Tasks Done" value={completedTasks.length} />
                <StatMini label="Completion" value={`${completionRate}%`} accent />
              </div>

              {/* COORDINATOR STRIP */}
              <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-3">
                <p className="text-xs text-cyan-300">Coordinator</p>
                <h3 className="text-base font-black mt-0.5">
                  {coordinator?.full_name || "Not Assigned"}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Students Reached: {studentsReached}
                </p>
              </div>

              {/* STATUS ROW */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Status</p>
                  <p
                    className={`font-bold text-sm ${
                      college.active ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {college.active ? "Active" : "Inactive"}
                  </p>
                </div>

                {/* ── CHANGE 2A: Toggle active status ── */}
                <button
                  onClick={async () => {
                    await supabase
                      .from("colleges")
                      .update({ active: !college.active })
                      .eq("id", college.id);
                    fetchColleges();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
                >
                  {college.active ? "Deactivate" : "Activate"}
                </button>
              </div>

              {/* ── CHANGE 2A + 2B: Action buttons row ── */}
              <div className="flex gap-2 pt-2 border-t border-white/5">
                {/* CHANGE 2B: View Report */}
                <button
                  onClick={() =>
                    navigate(`/college-report/${college.id}`)
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold hover:bg-yellow-500/20 transition-all"
                >
                  <BarChart2 size={14} />
                  Report
                </button>

                {/* CHANGE 2A: Edit */}
                {isEditing ? (
                  <>
                    <button
                      onClick={() => saveEdit(college.id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all"
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/10 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(college.id);
                      setEditForm({
                        name: college.name || "",
                        code: college.code || "",
                        city: college.city || "",
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition-all"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}

                {/* CHANGE 2A: Delete */}
                <button
                  onClick={() => deleteCollege(college.id, college.name)}
                  className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatMini({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-black/20 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <h3
        className={`text-2xl font-black mt-1 ${
          accent ? "text-cyan-400" : "text-white"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

export default CollegeManagementPage;
