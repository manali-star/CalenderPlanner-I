import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import {
  sendNotification,
} from "../../utils/sendNotification";

function WarriorApprovalsPage() {

  const [pendingWarriors, setPendingWarriors] = useState([]);
  const [profile, setProfile] = useState(null);

  // =========================
  // FETCH CURRENT USER PROFILE
  // =========================

  const fetchProfile = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(data);

  };

  // =========================
  // FETCH PENDING WARRIORS
  // =========================

  const fetchPendingWarriors = async (collegeId) => {

    if (!collegeId) return;

    let query = supabase

  .from("profiles")

  .select("*")

  .eq(
    "approval_status",
    "pending"
  );


// ADMIN

if (
  profile?.role === "admin"
) {

  query = query.eq(
    "role",
    "college_coordinator"
  );

}

// COORDINATOR

else {

  query = query

    .eq(
      "role",
      "warrior"
    )

    .eq(
      "college_id",
      collegeId
    );

}

const {
  data,
  error,
} = await query;

    if (error) {

      toast.error("Failed to fetch warriors");
      return;

    }

    setPendingWarriors(data || []);

  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {

    const loadData = async () => {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(data);

      if (data?.college_id) {

        fetchPendingWarriors(data.college_id);

      }

    };

    loadData();

  }, []);

  // =========================
  // APPROVE WARRIOR
  // =========================

  const approveWarrior = async (id) => {

    const { error } = await supabase
      .from("profiles")
      .update({

  approval_status:
    "approved",

  account_active: true,

})
      .eq("id", id);

    if (error) {

      toast.error("Approval failed");
      return;

    }
    await sendNotification({

  userId: id,

  title:
    "Account Approved",

  message:
    "Your account has been approved. You can now login.",

  type: "approval",

});
    toast.success("Warrior approved");

    fetchPendingWarriors(profile.college_id);

  };

  // =========================
  // REJECT WARRIOR
  // =========================

const rejectWarrior = async (
  id
) => {

  const confirmed =
    window.confirm(

      "Reject and delete this account?"

    );

  if (!confirmed) return;

  await sendNotification({

  userId: id,

  title:
    "Account Rejected",

  message:
    "Your signup request was rejected. You may signup again.",

  type: "rejection",

});

  // DELETE AUTH USER

  const response = await fetch(

    "https://dousktulqahtntrjcyod.supabase.co/functions/v1/delete-user",

    {

      method: "POST",

      headers: {

        "Content-Type":
          "application/json",

        apikey:
          import.meta.env
            .VITE_SUPABASE_ANON_KEY,

        Authorization:
          `Bearer ${
            import.meta.env
              .VITE_SUPABASE_ANON_KEY
          }`,

      },

      body: JSON.stringify({

        userId: id,

      }),

    }

  );

  const result =
    await response.json();

  if (!response.ok) {

    toast.error(
      result.error ||
      "Failed to delete user"
    );

    return;

  }

  // DELETE PROFILE

  const {
    error,
  } = await supabase

    .from("profiles")

    .delete()

    .eq("id", id);

  if (error) {

    toast.error(
      "Profile deletion failed"
    );

    return;

  }

  toast.success(
    "User rejected"
  );

  fetchPendingWarriors(
    profile.college_id
  );

};  

  return (

    <div className="min-h-screen bg-[#030712] text-white p-8">

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-4xl font-black">
          Warrior Approvals
        </h1>

        <p className="text-gray-400 mt-2">
          Approve legitimate warriors for your college
        </p>

      </div>

      {/* EMPTY STATE */}

      {pendingWarriors.length === 0 && (

        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">

          <h2 className="text-2xl font-bold text-white">
            No Pending Warriors
          </h2>

          <p className="text-gray-500 mt-3">
            All warrior requests are reviewed.
          </p>

        </div>

      )}

      {/* WARRIOR LIST */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {pendingWarriors.map((warrior) => (

          <div
            key={warrior.id}
            className="
              rounded-3xl
              border border-cyan-500/10
              bg-[#111827]
              p-6
            "
          >

            <h2 className="text-2xl font-black text-white">
              {warrior.full_name}
            </h2>

            <div className="space-y-2 mt-4 text-sm">

              <p className="text-gray-400">
                Username:
                <span className="text-white ml-2">
                  {warrior.username}
                </span>
              </p>

              <p className="text-gray-400">
                Department:
                <span className="text-white ml-2">
                  {warrior.department}
                </span>
              </p>

              <p className="text-gray-400">
                Status:
                <span className="text-yellow-400 ml-2">
                  Pending
                </span>
              </p>

            </div>

            {/* ACTIONS */}

            <div className="flex gap-4 mt-6">

              <button
                onClick={() =>
                  approveWarrior(warrior.id)
                }
                className="
                  flex-1
                  py-3
                  rounded-2xl
                  bg-green-600
                  hover:bg-green-500
                  font-bold
                  transition-all
                "
              >
                Approve
              </button>

              <button
                onClick={() =>
                  rejectWarrior(warrior.id)
                }
                className="
                  flex-1
                  py-3
                  rounded-2xl
                  bg-red-600
                  hover:bg-red-500
                  font-bold
                  transition-all
                "
              >
                Reject
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

export default WarriorApprovalsPage;