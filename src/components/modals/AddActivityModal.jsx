import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, MapPin, Users, FileText } from "lucide-react";

// ── CHANGE: removed `priority` and `description` from initial state 
const initialState = {
  id: "",
  title: "",
  start_date: "",
  end_date: "",
  participants: "",
  location: "",
  assignment_type: "individual",
  assigned_to: "",
  assigned_team_id: "",
};

function AddActivityModal({ isOpen, onClose, onCreateActivity, editingActivity }) {
  const [formData, setFormData] = useState(initialState);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showWarriorDropdown, setShowWarriorDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const warriorDropdownRef = useRef(null);
  const teamDropdownRef = useRef(null);

  // Sync form with editingActivity or Reset
  useEffect(() => {
    if (isOpen) {
      if (editingActivity) {
        setFormData({
          id: editingActivity.id || "",
          title: editingActivity.title || "",
          start_date: editingActivity.start_date || "",
          end_date: editingActivity.end_date || "",
          participants: editingActivity.audience_count || "",
          location: editingActivity.venue || "",
          assignment_type: editingActivity.assignment_type || "individual",
          assigned_to: editingActivity.assigned_to || "",
          assigned_team_id: editingActivity.assigned_team_id || "",
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [editingActivity, isOpen]);

  // Fetch Warriors for assignment
  useEffect(() => {
    const fetchData = async () => {
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "warrior");

      if (usersData) setUsers(usersData);

      const { data: teamsData } = await supabase
        .from("teams")
        .select("*");

      if (teamsData) setTeams(teamsData);
    };

    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (warriorDropdownRef.current && !warriorDropdownRef.current.contains(event.target)) {
        setShowWarriorDropdown(false);
      }
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target)) {
        setShowTeamDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.start_date || !formData.end_date || !formData.location) {
      alert("Please fill all required fields");
      return;
    }

    const assignedUser = users.find((u) => u.id === formData.assigned_to);

    onCreateActivity({
      ...formData,
      assigned_user_name: assignedUser?.full_name || "",
      category: "Technical",
      status: "planned",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] to-[#1e293b] p-8 shadow-2xl custom-scrollbar"
      >
        {/* Aesthetic Red Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div>
            <h2 className="text-5xl font-black text-white mb-3 tracking-tight">
              {editingActivity ? "Edit Activity" : "Add Activity"}
            </h2>
            <p className="text-gray-400 text-lg">
              {editingActivity ? "Update your activity details." : "Create and manage new campus events."}
            </p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Form Grid */}
        <div className="col-span-2">
          <h3 className="text-xl font-black text-white mb-1">Basic Information</h3>
          <p className="text-sm text-gray-500 mb-4">Core activity details and event information.</p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ACTIVITY NAME */}
          <FormField label="Activity Name" icon={<FileText className="text-red-400" />} colSpan="col-span-2">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter activity name..."
              data-testid="activity-name-input"
              className="bg-transparent outline-none text-white w-full"
            />
          </FormField>

          {/* SCHEDULE SECTION */}
          <div className="col-span-2 pt-4 border-t border-white/5">
            <h3 className="text-xl font-black text-white mb-1">Schedule</h3>
            <p className="text-sm text-gray-500 mb-4">Define the activity duration.</p>
          </div>

          <FormField label="Start Date" icon={<CalendarDays className="text-red-400" />}>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="bg-transparent outline-none text-white w-full"
            />
          </FormField>

          <FormField label="End Date" icon={<CalendarDays className="text-red-400" />}>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="bg-transparent outline-none text-white w-full"
            />
          </FormField>

          {/* ACTIVITY SETTINGS SECTION */}
          {/* ── CHANGE: section header updated — no more "priority settings" mention */}
          <div className="col-span-2 pt-4 border-t border-white/5">
            <h3 className="text-xl font-black text-white mb-1">Activity Settings</h3>
            <p className="text-sm text-gray-500 mb-4">Configure participation details.</p>
          </div>

          {/* PARTICIPANTS — now takes full width since priority is removed */}
          <FormField label="Participants" icon={<Users className="text-red-400" />} colSpan="col-span-2">
            <input
              type="number"
              name="participants"
              value={formData.participants}
              onChange={handleChange}
              placeholder="No. of participants"
              data-testid="participants-input"
              className="bg-transparent outline-none text-white w-full"
            />
          </FormField>

          {/* ASSIGNMENT SECTION */}
          <div className="col-span-2 pt-4 border-t border-white/5">
            <h3 className="text-xl font-black text-white mb-1">Assignment</h3>
            <p className="text-sm text-gray-500 mb-4">Choose whether this task is for an individual or an entire team.</p>
          </div>

          <div className="col-span-2 space-y-5">
            <label className="text-gray-300 block">Assignment Type</label>

            {/* TOGGLE */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignment_type: "individual" })}
                className={`px-5 py-3 rounded-2xl font-bold transition-all ${
                  formData.assignment_type === "individual" ? "bg-red-500 text-white" : "bg-black/20 text-gray-400"
                }`}
              >
                Individual
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, assignment_type: "team" })}
                className={`px-5 py-3 rounded-2xl font-bold transition-all ${
                  formData.assignment_type === "team" ? "bg-red-500 text-white" : "bg-black/20 text-gray-400"
                }`}
              >
                Team
              </button>
            </div>

            {/* INDIVIDUAL */}
            {formData.assignment_type === "individual" && (
              <div className="space-y-3">
                <label className="text-gray-300 block">Assign Warrior</label>
                <div className="relative" ref={warriorDropdownRef}>
                  <button
                    type="button"
                    data-testid="assign-warrior-select"
                    onClick={() => {
                      setShowTeamDropdown(false);
                      setShowWarriorDropdown(!showWarriorDropdown);
                    }}
                    className="w-full bg-[#0B1220] border border-white/10 rounded-2xl px-5 py-4 text-white flex items-center justify-between hover:border-pink-500/30 transition-all"
                  >
                    <span>{users.find(u => u.id === formData.assigned_to)?.full_name || "Select Warrior"}</span>
                    <span className="text-gray-500">▼</span>
                  </button>

                  {showWarriorDropdown && (
                    <div className="absolute z-50 mt-3 w-full rounded-2xl border border-white/10 bg-[#0B1220] backdrop-blur-xl shadow-2xl overflow-hidden">
                      {users.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, assigned_to: u.id });
                            setShowWarriorDropdown(false);
                          }}
                          className="w-full px-5 py-4 text-left hover:bg-pink-500/10 transition-all border-b border-white/5 last:border-none"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{u.full_name}</p>
                              <p className="text-xs text-gray-500">Warrior</p>
                            </div>
                            <div className="text-pink-400">⚔</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TEAM */}
            {formData.assignment_type === "team" && (
              <div className="space-y-3">
                <label className="text-gray-300 block">Assign Team</label>
                <div className="relative" ref={teamDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWarriorDropdown(false);
                      setShowTeamDropdown(!showTeamDropdown);
                    }}
                    className="w-full bg-[#0B1220] border border-white/10 rounded-2xl px-5 py-4 text-white flex items-center justify-between hover:border-pink-500/30 transition-all"
                  >
                    <span>{teams.find(team => team.id === formData.assigned_team_id)?.team_name || "Select Team"}</span>
                    <span className="text-gray-500">▼</span>
                  </button>

                  {showTeamDropdown && (
                    <div className="absolute z-50 mt-3 w-full rounded-2xl border border-white/10 bg-[#0B1220] backdrop-blur-xl shadow-2xl overflow-hidden">
                      {teams.map(team => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, assigned_team_id: team.id });
                            setShowTeamDropdown(false);
                          }}
                          className="w-full px-5 py-4 text-left hover:bg-pink-500/10 transition-all border-b border-white/5 last:border-none"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{team.team_name}</p>
                              <p className="text-xs text-gray-500">Team</p>
                            </div>
                            <div className="text-pink-400">👥</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* LOCATION */}
          <FormField label="Location" icon={<MapPin className="text-red-400" />} colSpan="col-span-2">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter event location..."
              data-testid="location-input"
              className="bg-transparent outline-none text-white w-full"
            />
          </FormField>

        </div>

        {/* Actions */}
        <div className="relative z-10 flex justify-end gap-4 mt-10">
          <button onClick={onClose} className="px-6 py-4 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition">
            Cancel
          </button>
          <motion.button
            data-testid="create-activity-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg shadow-red-500/20"
          >
            {editingActivity ? "Update Activity" : "Create Activity"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// Sub-component for form fields
const FormField = ({ label, icon, children, colSpan = "" }) => (
  <div className={`${colSpan} space-y-3`}>
    <label className="block text-gray-300">{label}</label>
    <div className="flex items-center gap-3 bg-black/20 border border-white/10 rounded-2xl px-5 py-4 transition-focus focus-within:border-red-500/50">
      {icon}
      {children}
    </div>
  </div>
);

export default AddActivityModal;
