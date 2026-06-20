import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, CalendarDays, MapPin, Users, FileText } from "lucide-react";

import { supabase } from "../../lib/supabase";

const initialState = {
  id: "",
  title: "",
  start_date: "",
  end_date: "",
  participants: "",
  location: "",
  assignment_type: "team",
  assigned_team_id: "",
};

function AddActivityModal({
  isOpen,
  onClose,
  onCreateActivity,
  editingActivity,
}) {
  const [formData, setFormData] = useState(initialState);
  const [teams, setTeams] = useState([]);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const teamDropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const nextState = editingActivity
      ? {
        id: editingActivity.id || "",
        title: editingActivity.title || "",
        start_date:
          editingActivity.start_date ||
          editingActivity.activity_date ||
          "",
        end_date:
          editingActivity.end_date ||
          editingActivity.due_date ||
          "",
        participants: editingActivity.audience_count || "",
        location: editingActivity.venue || "",
        assignment_type: "team",
        assigned_team_id: editingActivity.assigned_team_id || "",
      }
      : initialState;

    const timer = window.setTimeout(() => {
      setFormData(nextState);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [editingActivity, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTeams = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("college_id, role")
        .eq("id", user.id)
        .maybeSingle();

      let query = supabase
        .from("teams")
        .select("*")
        .order("team_name", { ascending: true });

      if (
        profileData?.college_id &&
        profileData?.role?.toLowerCase() !== "admin"
      ) {
        query = query.eq("college_id", profileData.college_id);
      }

      const { data: teamsData } = await query;
      setTeams(teamsData || []);
    };

    fetchTeams();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        teamDropdownRef.current &&
        !teamDropdownRef.current.contains(event.target)
      ) {
        setShowTeamDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (
      !formData.title ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.location
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (!formData.assigned_team_id) {
      alert("Please select a team");
      return;
    }

    onCreateActivity({
      ...formData,
      assignment_type: "team",
      activity_type: editingActivity?.activity_type || "Technical",
      status: "planned",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] to-[#1e293b] p-8 shadow-2xl custom-scrollbar"
      >
        <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative z-10 mb-8 flex items-center justify-between">
          <div>
            <h2 className="mb-3 text-5xl font-black tracking-tight text-white">
              {editingActivity ? "Edit Activity" : "Add Activity"}
            </h2>
            <p className="text-lg text-gray-400">
              {editingActivity
                ? "Update your activity details."
                : "Create and manage new campus events."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 transition hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="col-span-2">
          <h3 className="mb-1 text-xl font-black text-white">
            Basic Information
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Core activity details and event information.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            label="Activity Name"
            icon={<FileText className="text-red-400" />}
            colSpan="col-span-2"
          >
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter activity name..."
              data-testid="activity-name-input"
              className="w-full bg-transparent text-white outline-none"
            />
          </FormField>

          <div className="col-span-2 border-t border-white/5 pt-4">
            <h3 className="mb-1 text-xl font-black text-white">Schedule</h3>
            <p className="mb-4 text-sm text-gray-500">
              Define the activity duration.
            </p>
          </div>

          <FormField
            label="Start Date"
            icon={<CalendarDays className="text-red-400" />}
          >
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full bg-transparent text-white outline-none"
            />
          </FormField>

          <FormField
            label="End Date"
            icon={<CalendarDays className="text-red-400" />}
          >
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full bg-transparent text-white outline-none"
            />
          </FormField>

          <div className="col-span-2 border-t border-white/5 pt-4">
            <h3 className="mb-1 text-xl font-black text-white">
              Activity Settings
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Configure participation details.
            </p>
          </div>

          <FormField
            label="Participants"
            icon={<Users className="text-red-400" />}
            colSpan="col-span-2"
          >
            <input
              type="number"
              name="participants"
              value={formData.participants}
              onChange={handleChange}
              placeholder="No. of participants"
              data-testid="participants-input"
              className="w-full bg-transparent text-white outline-none"
            />
          </FormField>

          <div className="col-span-2 border-t border-white/5 pt-4">
            <h3 className="mb-1 text-xl font-black text-white">Assignment</h3>
            <p className="mb-4 text-sm text-gray-500">
              Activities can only be assigned to teams.
            </p>
          </div>

          <div className="col-span-2 space-y-3">
            <label className="block text-gray-300">Assign Team</label>
            <div className="relative" ref={teamDropdownRef}>
              <button
                type="button"
                onClick={() => setShowTeamDropdown((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0B1220] px-5 py-4 text-white transition-all hover:border-pink-500/30"
              >
                <span>
                  {teams.find(
                    (team) => team.id === formData.assigned_team_id
                  )?.team_name || "Select Team"}
                </span>
                <span className="text-gray-500">▼</span>
              </button>

              {showTeamDropdown && (
                <div className="absolute z-50 mt-3 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] shadow-2xl backdrop-blur-xl">
                  {teams.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-gray-400">
                      No teams available.
                    </div>
                  ) : (
                    teams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            assigned_team_id: team.id,
                          }));
                          setShowTeamDropdown(false);
                        }}
                        className="w-full border-b border-white/5 px-5 py-4 text-left transition-all last:border-none hover:bg-pink-500/10"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {team.team_name}
                            </p>
                            <p className="text-xs text-gray-500">Team</p>
                          </div>
                          <div className="text-sm text-pink-400">Team</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <FormField
            label="Location"
            icon={<MapPin className="text-red-400" />}
            colSpan="col-span-2"
          >
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter event location..."
              data-testid="location-input"
              className="w-full bg-transparent text-white outline-none"
            />
          </FormField>
        </div>

        <div className="relative z-10 mt-10 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-6 py-4 text-gray-300 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <motion.button
            data-testid="create-activity-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-8 py-4 font-bold text-white shadow-lg shadow-red-500/20"
          >
            {editingActivity ? "Update Activity" : "Create Activity"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

const FormField = ({ label, icon, children, colSpan = "" }) => (
  <div className={`${colSpan} space-y-3`}>
    <label className="block text-gray-300">{label}</label>
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 focus-within:border-red-500/50">
      {icon}
      {children}
    </div>
  </div>
);

export default AddActivityModal;
