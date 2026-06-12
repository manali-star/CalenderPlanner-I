import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search,
  CalendarDays,
  MapPin,
  Users,
  LayoutDashboard,
  CheckSquare,
  AlertCircle,
  ListTodo,
} from "lucide-react";

import AddActivityModal from "../../components/modals/AddActivityModal";
import { supabase } from "../../lib/supabase";

const OFFICER_PASSWORDS = {
  secretary: "secretary123",
  activity: "activity123",
  media: "media123",
  president: "president123",
};

const PROOF_REQUIREMENTS_TEXT =
  "Include clear event proof, visible date or venue details when possible, supporting notes or links, and the final student reach or impact summary.";

function TasksPage() {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role,
        college_id,
        team_id
      `)
      .eq("id", user.id)
      .maybeSingle();

    setProfile(profileData);

    fetchActivities(profileData);
  };

const fetchActivities = async (userProfile) => {

  const activeProfile =
    userProfile || profile;
  
  if (!activeProfile) return;

  let query = supabase
  .from("tasks")
  .select(`
    id,
    title,
    description,
    status,
    assigned_to,
    assigned_team_id,
    assigned_college_id,
    proof_url,
    proof_submitted,
    created_at,
    due_date,
    rejection_reason,
    activity_type,
    activity_date,
    venue,
    target_students,
    audience_count,
    assignment_type,
    remarks,
    secretary_status,
    activity_status,
    media_status,
    secretary_approved,
    activity_approved,
    media_approved,
    president_approved,
    coordinator_approved,
    proof_text
  `)

  if (
    activeProfile?.role?.toLowerCase() !== "admin"
  ) {

    query = query.eq(
      "assigned_college_id",
      activeProfile.college_id
    );

  }

if (activeProfile?.role?.toLowerCase() === "warrior") {

  // FIND WARRIOR TEAM
  const { data: warriorTeam } =
    await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", activeProfile.id)
      .maybeSingle();

  if (warriorTeam) {

    query = query.eq(
      "assigned_team_id",
      warriorTeam.team_id
    );

  } else {

    query = query.is(
      "assigned_team_id",
      null
    );

  }

}

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {

    toast.error(error.message);

    return;

  }

  // FETCH TEAM NAMES
  const updatedTasks = await Promise.all(
    (data || []).map(async (task) => {
      if (!task.assigned_team_id) {
        return task;
      }

      const { data: teamData } =
        await supabase
          .from("teams")
          .select("team_name")
          .eq(
            "id",
            task.assigned_team_id
          )
          .maybeSingle();
      return {
        ...task,
        assigned_team_name: teamData?.team_name || "Unknown Team",
      };
    })
  );

const currentRole =
  activeProfile?.role?.toLowerCase() || "";

const allowedRoles = [
  "officer",
  "college_coordinator",
  "president",
  "admin",
  "warrior",
];

if (allowedRoles.includes(currentRole)) {

  const uniqueMassActivities = [];
  const normalActivities = [];

updatedTasks.forEach((task) => {

  if (
    task.activity_type ===
    "Mass Activity"
  ) {

    uniqueMassActivities.push({

      ...task,

      assigned_team_name:
        "All Teams",

    });

  } else {

    normalActivities.push(task);

  }

  if (
    task.status ===
    "pending_officer_review"
  ) {

    task.needs_review = true;

  }

});

  setTasks([
    ...uniqueMassActivities,
    ...normalActivities,
  ]);

} else {

  setTasks(updatedTasks);

}
};

  const filteredActivities = tasks.filter((activity) =>
    activity?.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: tasks.length,

    completed: tasks.filter(
      (a) => a.status === "completed"
    ).length,

    pending: tasks.filter(
      (a) =>
        a.status === "pending_officer_review" ||
        a.status === "awaiting_coordinator"
    ).length,

    running: tasks.filter(
      (a) =>
        a.status === "planned" ||
        a.status === "revision_requested"
    ).length,
  };

  const role = profile?.role?.toLowerCase();
  const canCreateActivities = [
    "admin",
    "college_coordinator",
    "officer",
  ].includes(role);

  return (
    <div className="h-screen overflow-y-auto bg-[#060b16] text-white p-4 overflow-x-hidden w-full min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          
          <h1 className="text-2xl font-black">Activities</h1>

          <p className="text-gray-500 text-sm">
            Manage campus operations and missions
          </p>
        </div>

        {canCreateActivities && (
          <button
            data-testid="assign-task-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition-all font-bold text-sm"
          >
            + Create Activity
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatBox
          label="Total"
          value={stats.total}
          icon={<LayoutDashboard size={16} />}
          color="blue"
        />

        <StatBox
          label="Completed"
          value={stats.completed}
          icon={<CheckSquare size={16} />}
          color="green"
        />

        <StatBox
          label="Pending"
          value={stats.pending}
          icon={<AlertCircle size={16} />}
          color="yellow"
        />

        <StatBox
          label="Running"
          value={stats.running}
          icon={<ListTodo size={16} />}
          color="pink"
        />
      </div>

      <div className="relative mb-5 max-w-md">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />

        <input
          type="text"
          placeholder="Search missions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#101826] border border-white/5 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-cyan-500 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredActivities.map((activity, index) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            index={index}
            profile={profile}
            refresh={fetchActivities}
            fetchActivities={fetchActivities}
            setTasks={setTasks}
          />
        ))}
      </div>

      <AddActivityModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onCreateActivity={async (newActivity) => {
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  toast.error("Please log in again");
  return;
}

const activities = Array.isArray(newActivity) ? newActivity : [newActivity];

const resolveCollegeId = async (activity) => {
  if (profile?.college_id) {
    return profile.college_id;
  }

  if (activity.assignment_type === "team" && activity.assigned_team_id) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("college_id")
      .eq("id", activity.assigned_team_id)
      .maybeSingle();

    return teamData?.college_id || null;
  }

  return null;
};

const activityPayload = await Promise.all(
  activities.map(async (activity) => {
    const resolvedCollegeId = await resolveCollegeId(activity);

    return {
      title: activity.title,
      activity_type: activity.activity_type,
      activity_date: activity.start_date,
      due_date: activity.end_date || activity.start_date,
      venue: activity.location,
      audience_count: Number(activity.participants) || 0,
      target_students: Number(activity.target_students) || 0,
      description: activity.description,
      priority: activity.priority || "medium",
      assignment_type: "team",
      assigned_to: null,
      assigned_team_id:
        activity.assigned_team_id || null,
      assigned_college_id: resolvedCollegeId,
      created_by: user.id,
      status: "planned",
      secretary_status: "pending",
      activity_status: "pending",
      media_status: "pending",
      coordinator_approved: false,
      president_approved: false,
      secretary_approved: false,
      activity_approved: false,
      media_approved: false,
      proof_text: "",
      remarks: "",
    };
  })
);

if (activityPayload.some((activity) => !activity.assigned_college_id)) {
  toast.error("Unable to determine a college for this activity");
  return;
}

const { error: insertError } = await supabase
  .from("tasks")
  .insert(activityPayload);

    if (insertError) {
      console.log(insertError);
      toast.error(insertError.message);
      return;
    }

    toast.success("Activity Created");

    await fetchActivities(profile);

    setIsModalOpen(false);
  }}
/>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  const colors = {
    blue: "text-cyan-400 border-cyan-500/10 bg-cyan-500/5",

    green:
      "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",

    yellow:
      "text-yellow-400 border-yellow-500/10 bg-yellow-500/5",

    pink: "text-pink-400 border-pink-500/10 bg-pink-500/5",
  };

  return (
    <div
      className={`rounded-xl border p-3 ${colors[color]} bg-[#101826]`}
    >
      <div className="mb-2">{icon}</div>

      <p className="text-[10px] uppercase tracking-[0.25em] opacity-70 font-bold">
        {label}
      </p>

      <h2 className="text-2xl font-black mt-1">{value}</h2>
    </div>
  );
}

function ActivityCard({
  activity,
  index,
  profile,
  refresh,
  fetchActivities,
  setTasks,
}) {
  const isOfficer = [
    "officer",
    "president",
    "college_coordinator",
  ].includes(profile?.role?.toLowerCase());

  const isWarrior =
    profile?.role?.toLowerCase() === "warrior";

    const [proofText, setProofText] =
      useState("");

    const [uploading, setUploading] =
      useState(false);

    const [proofFile, setProofFile] =
      useState(null);

    const [massRemarks, setMassRemarks] =
      useState(activity.remarks || "");

    const [massAudienceCount, setMassAudienceCount] =
      useState(activity.audience_count || "");

const handleApprove = async (role) => {
  const expectedPassword =
    OFFICER_PASSWORDS[role];

  if (expectedPassword) {
    const enteredPassword = prompt(
      `Enter ${role[0].toUpperCase()}${role.slice(1)} Password`
    );

    if (enteredPassword !== expectedPassword) {
      toast.error("Wrong Password");
      return;
    }
  }

  let updates = {};

  // Secretary
  if (role === "secretary") {

    updates = {
      secretary_approved: true,
      secretary_status: "approved",
    };

  }

  // Activity Director
  if (role === "activity") {

    updates = {
      activity_approved: true,
      activity_status: "approved",
    };

  }

  // Media Director
  if (role === "media") {

    updates = {
      media_approved: true,
      media_status: "approved",
    };

  }

  // President
  if (role === "president") {

    updates = {
      president_approved: true,
      status: "awaiting_coordinator",
    };

  }

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", activity.id);

  if (error) {

    toast.error(error.message);
    return;

  }

  toast.success(`${role} approval completed`);

  fetchActivities();

};

const handleReject = async (
  role,
  reason = "Rejected"
) => {

  const { error } = await supabase
    .from("tasks")
    .update({

      status: "rejected_by_officer",

      rejection_reason: reason,

      rejected_by: role,

      secretary_approved: false,
      secretary_status: "pending",

      activity_approved: false,
      activity_status: "pending",

      media_approved: false,
      media_status: "pending",

      president_approved: false,

      proof_url: null,

    })
    .eq("id", activity.id);

  if (error) {

    toast.error(error.message);
    return;

  }

  toast.success("Task Rejected");

  fetchActivities();

};

  const workflow = [
    {
      label: "Secretary",
      value: activity.secretary_approved
        ? "approved"
        : "pending",
    },

    {
      label: "Activity",
      value: activity.activity_approved
        ? "approved"
        : "pending",
    },

    {
      label: "Media",
      value: activity.media_approved
        ? "approved"
        : "pending",
    },

    {
  label: "President",

  value:
    activity.president_approved
      ? "approved"
      : activity.secretary_approved &&
        activity.activity_approved &&
        activity.media_approved
      ? "ready"
      : "locked",
},
  ];

  const daysLeft = activity.activity_date
  ? Math.ceil(
      (new Date(activity.activity_date) - new Date()) /
      (1000 * 60 * 60 * 24)
    )
  : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-[#111827] to-[#0b1220] p-3 shadow-xl hover:border-cyan-500/20 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[9px] uppercase tracking-[0.25em] font-black">
              {activity.activity_type || "Technical"}
            </span>

            <h2 className="text-xl font-black mt-4 leading-tight">
              {activity.title}
            </h2>
          </div>

          <div className="text-[9px] text-gray-500 font-mono bg-black/30 px-2 py-1 rounded-lg border border-white/5">
            #{activity.id?.slice(0, 5)}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-black mb-2">
            Mission Status
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>

            {activity.status || "Assigned"}
          </div>
        </div>

    

        <div className="bg-black/20 border border-white/5 rounded-xl p-3 mb-4">
          <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400 font-black mb-4">
            Workflow Progress
          </p>

          <div className="space-y-2">
            {workflow.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span>{step.label}</span>

                {step.value === "approved" && (
                  <span className="text-emerald-400 font-bold">
                    ✓ Approved
                  </span>
                )}

                {step.value === "pending" && (
                  <span className="text-yellow-400 font-bold">
                    ⏳ Pending
                  </span>
                )}

                {step.value === "ready" && (
                  <span className="text-yellow-400 font-bold">
                    🔐 Ready
                  </span>
                )}

                {step.value === "locked" && (
                  <span className="text-gray-500">
                    🔒 Locked
                  </span>
                )}
              </div>
            ))}
          </div>


        </div>

        <div className="space-y-2 text-sm mb-4 text-gray-300">
          <div className="flex items-center gap-2">
            <CalendarDays
              size={15}
              className="text-gray-500"
            />

            <span>{activity.activity_date}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-gray-500" />

            <span>{activity.venue}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users size={15} className="text-gray-500" />

            <span>
              {activity.target_students} target participants
            </span>
          </div>
        </div>

         <div className="pt-2 border-t border-white/5 flex justify-between items-center">
            <span className="text-red-400/80 font-medium">
              Assigned: {
                activity.assignment_type === "team"
                  ? activity.assigned_team_name || "Unknown Team"
                  : activity.assigned_user_name || "Warrior"
              }
            </span>

            {daysLeft !== null && (
              <span
                className={`font-bold ${
                  daysLeft < 0
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {daysLeft < 0
                  ? "Overdue"
                  : `${daysLeft}d left`}
              </span>
            )}
          </div>  

{isOfficer && (

  activity.status ===
    "pending_officer_review"

  ||

  activity.status ===
    "returned_by_coordinator"

) && (

  <div className="mt-6 rounded-3xl border border-yellow-500/20 bg-white/5 p-5">

    <p className="text-xs tracking-[0.3em] text-yellow-400 font-bold uppercase">
      Officer Review Panel
    </p>

    <h3 className="text-2xl font-black text-white mt-2 mb-5">
      Multi-level Verification
    </h3>

    {/* Proof */}
    <a
      href={activity.proof_url}
      target="_blank"
      rel="noreferrer"
      className="
        inline-flex
        items-center
        justify-center
        px-5
        py-3
        rounded-2xl
        bg-blue-500/20
        border
        border-blue-500/30
        text-blue-300
        font-bold
        mb-5
      "
    >
      View Proof
    </a>


    {!(
  activity.secretary_approved &&
  activity.activity_approved &&
  activity.media_approved
) && (
  <>

    {/* Secretary */}
    <div className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/5 p-4 mb-4">

  <div>
    <p className="text-white font-bold">
      Secretary Approval
    </p>

    <p className="text-sm text-zinc-400">
      Status: {
        activity.secretary_approved
          ? "approved"
          : "pending"
      }
    </p>
  </div>

  {activity.secretary_approved ? (

    <div className="
      px-4
      py-2
      rounded-xl
      bg-emerald-500/20
      border
      border-emerald-500/30
      text-emerald-400
      font-bold
    ">
      ✓ Approved
    </div>

  ) : (

    <div className="flex gap-3">

      <button
        onClick={() => handleApprove("secretary")}
        className="
          px-5
          py-2
          rounded-xl
          bg-emerald-500/20
          border
          border-emerald-500/30
          text-emerald-400
          font-bold
        "
      >
        Approve
      </button>

      <button

  onClick={() => {

  const reason = prompt(
    "Enter rejection reason"
  );

  if (!reason) return;

  handleReject(
    "secretary",
    reason
  );

}}

  className="
    px-5
    py-2
    rounded-xl
    bg-red-500/20
    border
    border-red-500/30
    text-red-400
    font-bold
  "
>
  Reject
</button>

    </div>

  )}

</div>

    {/* Activity Director */}
<div className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/5 p-4 mb-4">

  <div>
    <p className="text-white font-bold">
      Activity Approval
    </p>

    <p className="text-sm text-zinc-400">
      Status: {
        activity.activity_approved
          ? "approved"
          : "pending"
      }
    </p>
  </div>

  {activity.activity_approved ? (

    <div className="
      px-4
      py-2
      rounded-xl
      bg-emerald-500/20
      border
      border-emerald-500/30
      text-emerald-400
      font-bold
    ">
      ✓ Approved
    </div>

  ) : (

    <div className="flex gap-3">

      <button
        onClick={() => handleApprove("activity")}
        className="
          px-5
          py-2
          rounded-xl
          bg-emerald-500/20
          border
          border-emerald-500/30
          text-emerald-400
          font-bold
        "
      >
        Approve
      </button>

      <button
        onClick={() => {

  const reason = prompt(
    "Enter rejection reason"
  );

  if (!reason) return;

  handleReject(
    "activity",
    reason
  );

}}
        className="
          px-5
          py-2
          rounded-xl
          bg-red-500/20
          border
          border-red-500/30
          text-red-400
          font-bold
        "
      >
        Reject
      </button>

    </div>

  )}

</div>

    {/* Media Director */}
<div className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/5 p-4 mb-4">

  <div>
    <p className="text-white font-bold">
      Media Approval
    </p>

    <p className="text-sm text-zinc-400">
      Status: {
        activity.media_approved
          ? "approved"
          : "pending"
      }
    </p>
  </div>

  {activity.media_approved ? (

    <div className="
      px-4
      py-2
      rounded-xl
      bg-emerald-500/20
      border
      border-emerald-500/30
      text-emerald-400
      font-bold
    ">
      ✓ Approved
    </div>

  ) : (

    <div className="flex gap-3">

      <button
        onClick={() => handleApprove("media")}
        className="
          px-5
          py-2
          rounded-xl
          bg-emerald-500/20
          border
          border-emerald-500/30
          text-emerald-400
          font-bold
        "
      >
        Approve
      </button>

      <button
        onClick={() => {

  const reason = prompt(
    "Enter rejection reason"
  );

  if (!reason) return;

  handleReject(
    "media",
    reason
  );

}}
        className="
          px-5
          py-2
          rounded-xl
          bg-red-500/20
          border
          border-red-500/30
          text-red-400
          font-bold
        "
      >
        Reject
      </button>

    </div>

  )}

</div>
  </>
)}
    {/* PRESIDENT PANEL */}
    {activity.secretary_approved &&
      activity.activity_approved &&
      activity.media_approved && (

      <div className="flex items-center justify-between rounded-2xl bg-black/20 border border-emerald-500/20 p-4">

        <div>
          <p className="text-white font-bold">
            President Final Approval
          </p>

          <p className="text-sm text-zinc-400">
            All 3 Officers approved
          </p>
        </div>

        <div className="flex gap-3">

      <button
            onClick={() => handleApprove("president")}
            className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold"
          >
            Approve
          </button>

          <button
            className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold"
          >
            Reject
          </button>

        </div>

      </div>

    )}

  </div>

)}

{/* COORDINATOR PANEL */}

{activity.status ===
  "awaiting_coordinator" && (

  <div className="
    mt-6
    rounded-3xl
    border
    border-cyan-500/20
    bg-cyan-500/5
    p-6
  ">

    <p className="
      text-xs
      tracking-[0.3em]
      text-cyan-400
      font-bold
      uppercase
      mb-2
    ">
      Coordinator Review
    </p>

    <h3 className="
      text-2xl
      font-black
      text-white
      mb-6
    ">
      Final College Verification
    </h3>

    <div className="flex gap-4">

      {/* APPROVE */}

      <button

        onClick={async () => {

          const { error } =
            await supabase
              .from("tasks")
              .update({

                status: "completed",

                coordinator_approved: true,

              })
              .eq("id", activity.id);

          if (error) {

            toast.error(error.message);
            return;

          }

          toast.success(
            "Task Approved"
          );

          fetchActivities();

        }}

        className="
          px-6
          py-3
          rounded-2xl
          bg-emerald-500/20
          border
          border-emerald-500/30
          text-emerald-400
          font-bold
        "
      >
        Final Approve
      </button>

      {/* REJECT */}

      <button

        onClick={async () => {
          const reason = prompt(
  "Enter rejection reason"
);

if (!reason) return;

          const { error } =
            await supabase
              .from("tasks")
              .update({

                status:
                  "returned_by_coordinator",

                  coordinator_feedback: reason,

                  secretary_approved: false,
                  secretary_status: "pending",

                  activity_approved: false,
                  activity_status: "pending",

                  media_approved: false,
                  media_status: "pending",

                  president_approved: false,

              })
              .eq("id", activity.id);

          if (error) {

            toast.error(error.message);
            return;

          }

          toast.success(
            "Returned To Officers"
          );

          fetchActivities();

        }}

        className="
          px-6
          py-3
          rounded-2xl
          bg-red-500/20
          border
          border-red-500/30
          text-red-400
          font-bold
        "
      >
        Reject
      </button>

    </div>

  </div>

)}

           {isWarrior &&
            !activity.proof_url &&
            activity.status !== "completed" &&
            activity.activity_type !==
              "Mass Activity" && (
          <div className="bg-gradient-to-br from-pink-500/5 to-cyan-500/5 border border-pink-500/20 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-[0.3em] text-pink-400 font-black mb-3">
              Mission Submission
            </p>

            <h3 className="text-lg font-black mb-3">
              Upload Completion Proof
            </h3>

            <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300 font-black mb-2">
                Proof Requirements
              </p>
              <p className="text-sm text-gray-300">
                {PROOF_REQUIREMENTS_TEXT}
              </p>
            </div>

            <label className="block cursor-pointer">

              <input
                type="file"
                hidden
                onChange={(e) =>
                  setProofFile(e.target.files[0])
                }
              />

              <div className="bg-[#0f172a] border border-dashed border-pink-500/20 rounded-xl p-4 text-center mb-4 hover:border-pink-500/50 transition-all">

                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                  📄
                </div>

                <p className="text-lg font-bold mb-1">
                  {
                    proofFile
                      ? proofFile.name
                      : "Click to Upload Proof"
                  }
                </p>

                <p className="text-gray-500 text-sm">
                  PDF, Images, Docs
                </p>

              </div>

            </label>

            <input
              type="number"
              placeholder="Enter Students Reached"

              defaultValue={
                activity.audience_count || ""
              }

              onChange={(e) => {

                const updatedValue =
                  e.target.value;

                setTasks((prev) =>
                  prev.map((item) =>

                    item.id === activity.id
                      ? {
                          ...item,
                          audience_count:
                            updatedValue,
                        }
                      : item

                  )
                );

              }}

              className="
                w-full
                bg-black/20
                border
                border-cyan-500/20
                rounded-xl
                p-3
                text-white
                mb-4
              "
            />

            <textarea
            value={proofText}
              onChange={(e) =>
                setProofText(e.target.value)
              }
              placeholder="Describe your work, add links, notes..."
              className="w-full bg-[#111827] border border-white/5 rounded-xl p-3 text-white outline-none focus:border-pink-500/30 min-h-[90px] mb-4 text-sm"
            />

            <button

  onClick={async () => {

    if (!proofFile) {

      toast.error(
        "Please select proof file"
      );

      return;

    }

    const cleanName =
  proofFile.name.replace(
    /[^a-zA-Z0-9.]/g,
    "_"
  );

const fileExt =
  cleanName.split(".").pop();

const fileName =
  `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;

const filePath =
  `proofs/${fileName}`;

// UPLOAD FILE
const { error: uploadError } =
  await supabase.storage
    .from("activity-proofs")
    .upload(filePath, proofFile);

    if (uploadError) {

      toast.error("Upload failed");

      return;

    }

    // GET PUBLIC URL
    const { data } =
      supabase.storage
        .from("activity-proofs")
        .getPublicUrl(filePath);

    // UPDATE TASK
    const { error } =
      await supabase
        .from("tasks")
        .update({

          proof_url:
            data?.publicUrl || "",

          proof_text:
            proofText,

          status:
            "pending_officer_review",

        })
        .eq("id", activity.id);

    if (error) {

      toast.error(
        "Failed to submit proof"
      );

      return;

    }

    toast.success(
      "Proof Submitted"
    );

    await refresh(profile);

  }}

  

  className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 font-black text-sm hover:scale-[1.01] transition-all"
>
  Submit Proof →
</button>
          </div>
        )}

        {activity.activity_type ===
  "Mass Activity" && (

  <div
    className="
      mt-4
      rounded-xl
      border
      border-cyan-500/20
      bg-cyan-500/10
      p-4
      text-cyan-300
    "
  >

    <h3 className="font-bold mb-2">
      Officer Managed Activity
    </h3>

    <p className="text-sm">
      Final proof and outreach
      will be uploaded centrally
      by officers after campaign
      completion.
    </p>

  </div>

)}

{isOfficer && activity.activity_type === "Mass Activity" && (

  activity.status !== "completed" ? (

    <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-xl p-3 mt-3">

      <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400 font-black mb-3">
        Centralized Mass Activity
      </p>

      <h3 className="text-lg font-black mb-3">
        Officer Final Submission
      </h3>

      <label
        className="
          border
          border-cyan-500/20
          rounded-2xl
          p-6
          flex
          flex-col
          items-center
          justify-center
          cursor-pointer
          bg-black/20
          hover:bg-cyan-500/5
          transition-all
          mb-4
        "
      >

        <div className="text-4xl mb-3">
          📄
        </div>

        <p className="font-bold text-white">
          Click to Upload Final Proof
        </p>

        <p className="text-sm text-gray-400 mt-1">
          PDF, Images, Docs
        </p>

        {proofFile && (
          <p className="mt-3 text-cyan-400 text-sm font-bold">
            {proofFile.name}
          </p>
        )}

        <input
          type="file"
          hidden
          onChange={(e) =>
            setProofFile(e.target.files[0])
          }
        />

      </label>

      <textarea
        placeholder="Enter Final Campaign Notes"

        value={massRemarks}
        onChange={(e) => {
          setMassRemarks(e.target.value);
        }}

        className="
          w-full
          bg-black/20
          border
          border-cyan-500/20
          rounded-xl
          p-3
          text-white
          mb-4
          h-28
        "
      />

      <input
        type="number"
        placeholder="Enter Final Outreach"

        value={massAudienceCount}
        onChange={(e) => {
          setMassAudienceCount(
            e.target.value
          );
        }}

        className="
          w-full
          bg-black/20
          border
          border-cyan-500/20
          rounded-xl
          p-3
          text-white
          mb-4
        "
      />

      <button

        onClick={async () => {

          let proofUrl = "";

          if (proofFile) {

            const fileName =
              `${Date.now()}-${proofFile.name}`;

            const { error: uploadError } =
              await supabase.storage
                .from("activity-proofs")
                .upload(
                  fileName,
                  proofFile
                );

            if (uploadError) {

              toast.error(
                "Proof upload failed"
              );

              return;

            }

            const { data } =
             supabase.storage
            .from("activity-proofs")
            .getPublicUrl(fileName);

        proofUrl = data?.publicUrl || "";

          }

          const { error } =
            await supabase
              .from("tasks")
              .update({

                status: "completed",

                proof_url:
                  proofUrl || null,

                audience_count:
                  Number(
                    massAudienceCount
                  ) || 0,

                remarks:
                  massRemarks || "",

                coordinator_approved:
                  true,

              })

          .eq("id", activity.id);

          if (error) {

            toast.error(
              "Submission failed"
            );

            return;

          }

          toast.success(
            "Mass Activity Completed"
          );

          await fetchActivities(profile);

        }}

        className="
          w-full
          py-3
          rounded-xl
          bg-cyan-500/20
          border
          border-cyan-500/30
          text-cyan-400
          font-black
        "
      >

        Finalize Mass Activity

      </button>

    </div>

  ) : (

    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mt-3">

      <p className="text-emerald-400 font-black text-lg">
        ✅ Mass Activity Completed
      </p>

      <p className="text-gray-400 text-sm mt-2">
        Final proof and outreach have already been submitted.
      </p>

    </div>

  )

)}
      </div>
    </motion.div>
  );
}

export default TasksPage;
