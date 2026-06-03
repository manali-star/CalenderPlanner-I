import { Navigate } from "react-router-dom";

function ProtectedRoute({

  children,
  profile,
  allowedRoles,
  loading = false,

}) {

  // =========================
  // LOADING STATE
  // =========================

  if (loading) {

    return (

      <div className="
        min-h-screen
        bg-[#020617]
        flex
        items-center
        justify-center
        text-white
        text-2xl
        font-bold
      ">
        Loading...
      </div>

    );

  }

  // =========================
  // NO PROFILE
  // =========================

  if (!profile) {

    return <Navigate to="/" replace />;

  }

  // =========================
  // ACCOUNT STATUS CHECK
  // =========================

// if (

//   profile?.approval_status !== "rejected" ||

//   profile?.account_active !== true

// ) {

//   return <Navigate to="/unauthorized" replace />;

// }

  // =========================
  // ROLE CHECK
  // =========================

  if (

    allowedRoles &&

    !allowedRoles.includes(
      profile?.role?.toLowerCase()
    )

  ) {

    return <Navigate to="/unauthorized" replace />;

  }

  // =========================
  // ALLOWED
  // =========================

  return children;

}

export default ProtectedRoute;