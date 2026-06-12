import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { supabase } from "./lib/supabase";

import MainLayout from "./layouts/MainLayout";

import AdminDashboard from "./pages/dashboard/AdminDashboard";

import CoordinatorDashboard from "./pages/dashboard/CoordinatorDashboard"

import WarriorDashboard from "./pages/dashboard/WarriorDashboard";

import TasksPage from "./pages/activities/TasksPage";

import TeamsPage from "./pages/activities/TeamsPage";

import PlannerPage from "./pages/admin/PlannerPage";

import AnalyticsPage from "./pages/analytics/AnalyticsPage";

import ReportsPage from "./pages/reports/ReportsPage";

import WarriorApprovalsPage from "./pages/approvals/WarriorApprovalsPage";

import SettingsPage from "./pages/settings/SettingsPage";

import NotificationsPage from "./pages/notifications/NotificationsPage";

import AuthPage from "./pages/auth/AuthPage";

import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";

import CalendarPage from "./pages/calendar/CalendarPage";

import ResetPassword from "./pages/ResetPassword";

import VerifyEmail from "./pages/VerifyEmail";

import CollegeManagementPage from "./pages/admin/CollegeManagementPage";
import { ensureUserProfile } from "./utils/authProfile";


function App() {

  const [session, setSession] = useState(undefined);

  const [profile, setProfile] = useState(null);

  // =========================
  // FETCH PROFILE
  // =========================

const fetchProfile = async (user) => {

  try {

    if (!user?.id) return;

    const data = await ensureUserProfile(user);

    if (!data) {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      return;
    }

    setProfile(data);

  } catch (err) {

    console.log("FETCH PROFILE ERROR:", err);
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);

  }

};

  // =========================
  // AUTH SESSION
  // =========================

  useEffect(() => {

    supabase.auth
      .getSession()
      .then(({ data }) => {

        setSession(data?.session || null);

        if (data.session?.user) {

          fetchProfile(
            data.session?.user
          );

        }

      });

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(

      (_event, session) => {

        setSession(session || null);
        setProfile(null);

        if (session?.user) {

          fetchProfile(
            session?.user
          );

        }

      }

    );

    return () => {

      authListener.subscription.unsubscribe();

    };

  }, []);

  // =========================
  // NOT LOGGED IN
  // =========================

if (session === undefined) {

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

if (session === null) {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="*"
          element={<AuthPage />}
        />

      </Routes>

    </BrowserRouter>

  );

}

  if (!profile) {

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
const hash =
  window.location.hash;

const isRecovery =
  hash.includes("type=recovery");

const currentPath =
  window.location.pathname;

const isVerificationPage =
  currentPath === "/verify-email";

if (

  !isRecovery &&

  !isVerificationPage &&

  (

    profile?.approval_status !==
      "approved"

    ||

    !profile?.account_active

  )

) {

  return (

    <div className="
      min-h-screen
      bg-[#020617]
      flex
      items-center
      justify-center
      px-6
    ">

      <div className="
        max-w-md
        w-full
        rounded-3xl
        border
        border-yellow-500/20
        bg-white/5
        p-8
        text-center
      ">

        <h1 className="
          text-3xl
          font-black
          text-white
          mb-4
        ">
          Account Pending Approval
        </h1>

        <p className="
          text-gray-400
          mb-6
        ">
          Your account is waiting
          for administrator approval.
        </p>

        <button

          onClick={async () => {

            await supabase.auth.signOut();

            window.location.reload();

          }}

          className="
            px-6
            py-3
            rounded-2xl
            bg-red-500
            text-white
            font-bold
          "
        >
          Logout
        </button>

      </div>

    </div>

  );

}

  // =========================
  // APP
  // =========================

  return (

    <BrowserRouter>

      <MainLayout>

        <Routes>

          {/* ================= ADMIN PLANNERS ================= */}

          <Route
            path="/admin/planners"
            element={

              <ProtectedRoute
                profile={profile}
                allowedRoles={["admin"]}
              >

                <PlannerPage />

              </ProtectedRoute>

            }
          />

          {/* ================= UNAUTHORIZED ================= */}

          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />

          {/* ================= DASHBOARD ================= */}

          <Route
            path="/dashboard"
            element={

              profile?.role === "admin"

                ? <AdminDashboard />

                : profile?.role === "college_coordinator" ||
                  profile?.role === "officer"

                ? <CoordinatorDashboard />

                : <WarriorDashboard />

            }
          />

          {/* DEFAULT REDIRECT */}

          <Route
            path="/"
            element={<Navigate to="/dashboard" />}
          />

          {/* ================= TASKS ================= */}

          <Route
            path="/activities"
            element={

              <ProtectedRoute
                profile={profile}
                allowedRoles={[
                  "college_coordinator",
                  "officer",
                  "president",
                  "warrior",
                  "admin"
                ]}
              >

                <TasksPage />

              </ProtectedRoute>

            }
          />

          {/* ================= TEAM MANAGEMENT ================= */}

          <Route
            path="/team-management"
            element={
              <TeamsPage profile={profile} />
            }
          />

          {/* ================= WARRIOR APPROVALS ================= */}

          <Route
            path="/warrior-approvals"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={["admin", "college_coordinator", "officer"]}
              >
                <WarriorApprovalsPage />
              </ProtectedRoute>
            }
          />

          {/* ================= ANALYTICS ================= */}

          <Route
            path="/analytics"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={["admin", "college_coordinator", "officer", "warrior"]}
              >
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* ================= REPORTS ================= */}

          <Route
            path="/reports"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={["admin", "college_coordinator", "officer", "warrior"]}
              >
                <ReportsPage profile={profile} />
              </ProtectedRoute>
            }
          />

          {/* ================= SETTINGS ================= */}

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          <Route
            path="/notifications"
            element={
              <NotificationsPage />
            }
          />

          <Route
            path="/calendar"
            element={<CalendarPage />}
          />

          {/* ================= FALLBACK ================= */}

          <Route
            path="*"
            element={<Navigate to="/dashboard" />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/verify-email"
            element={<VerifyEmail />}
          />

          <Route
            path="/college-management"
            element={
              <CollegeManagementPage />
            }
          />

        </Routes>

      </MainLayout>

    </BrowserRouter>

  );

}

export default App;
