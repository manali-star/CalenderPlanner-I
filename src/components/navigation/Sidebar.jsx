import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Settings,
  Activity,
  LogOut,
  UserCircle2,
  Crown,
  Bell,
  Users,
  CalendarDays,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";


const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["admin", "college_coordinator", "officer", "warrior"] },
  {
  title: "Calendar",
  icon: CalendarDays,
  path: "/calendar",
  roles: [
    "admin",
    "college_coordinator",
    "officer",
    "warrior"
  ]
},
  // WARRIOR ONLY
  { title: "My Tasks", icon: Activity,path: "/activities",roles: ["warrior"] },
  // PRESIDENT + ADMIN
  { title: "Task Management", icon: Activity, path: "/activities", roles: ["admin", "college_coordinator", "officer"] },
  { title: "Team Management", icon: Users, path: "/team-management", roles: ["college_coordinator"] },
  { title: "Warrior Approvals", icon: Users, path: "/warrior-approvals", roles: ["college_coordinator"] },
  { title: "College Management", icon: Building2, path: "/college-management", roles: ["admin"] },
  { title: "Analytics", icon: BarChart3, path: "/analytics", roles: ["admin", "college_coordinator", "officer", "warrior"] },
  { title: "Reports", icon: FileText, path: "/reports", roles: ["admin", "college_coordinator", "officer", "warrior"] },
  {
  title: "Admin Panel",
  icon: Crown,
  path: "/admin",
  roles: ["admin", "college_coordinator", "officer"]
},
{
  title: "Planner System",
  icon: Crown,
  path: "/admin/planners",
  roles: ["admin"]
},
  {
  title: "Settings",
  icon: Settings,
  path: "/settings",
  roles: [
    "admin",
    "college_coordinator",
    "officer",
    "warrior"
  ]
},
];

function Sidebar() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  setNotifications(data || []);
};

const fetchProfile = async () => {

  const { data: { user } } =
    await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  setProfile(data);
  setLoading(false);

};

  useEffect(() => {
    fetchProfile();
    fetchNotifications();

        const notificationChannel = supabase
        .channel("notification-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications"
          },
          fetchNotifications
        )
        .subscribe();

          return () => {
            supabase.removeChannel(notificationChannel);
      };
        }, []);



  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Logout failed");
    else toast.success("Logged out successfully");
  };

// Filter items based on user role - added a check to prevent errors if profile is missing
  const filteredItems = useMemo(() => {
    if (!profile?.role) return [];
    return menuItems.filter(item => 
      item.roles.includes(profile.role.toLowerCase())
    );
  }, [profile]);

return (
  <>

    {/* MOBILE TOPBAR */}

    <div className="xl:hidden fixed top-0 left-0 right-0 z-[100] bg-[#0B1120] border-b border-white/10 p-4 flex items-center justify-between">

      <h1 className="text-white font-black text-xl">
        CampusFlow AI
      </h1>

      <button
        onClick={() =>
          setMobileOpen(!mobileOpen)
        }
        className="w-12 h-12 rounded-2xl bg-pink-500 flex items-center justify-center text-white text-2xl font-black"
      >

        ☰

      </button>

    </div>

    <motion.div
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`w-72 h-screen fixed top-0 left-0 bg-[#0b1120] border-r border-white/5 z-[99] isolation-isolate flex flex-col justify-between overflow-y-auto transition-all duration-300 ${
  mobileOpen
    ? "translate-x-0"
    : "-translate-x-full xl:translate-x-0"
}`}
    >
      {/* Background Aesthetic Glow */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="p-6 relative z-10">
        {/* Branding */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">CampusFlow AI</h1>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Academic Intelligence</p>
        </div>

        {/* User Card */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 blur-2xl rounded-full" />
          <div className="relative z-10 flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <UserCircle2 size={24} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-white font-bold truncate">{loading ? "Connecting..." : profile?.full_name}</h2>
              <p className="text-gray-500 text-xs truncate">@{profile?.username || "warrior"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold uppercase">{profile?.department || "MCA"}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
              profile?.role === 'admin' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {profile?.role?.toUpperCase() || "..."}
            </span>
          </div>
        </div>

        {/* NOTIFICATIONS */}
{profile?.role !== "warrior" && (
<div className="mb-6 relative">

  <button
    onClick={() =>
      setShowNotifications(!showNotifications)
    }
    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/20 transition-all"
  >

    <div className="flex items-center gap-3">
      <Bell size={20} className="text-red-400" />
      <span className="text-white font-medium">
        Notifications
      </span>
    </div>

    {notifications.filter(n => !n.is_read).length > 0 && (
      <span className="px-2 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
        {notifications.filter(n => !n.is_read).length}
      </span>
    )}
  </button>

  {showNotifications && (
    <div className="mt-3 rounded-2xl bg-[#111827] border border-white/10 overflow-hidden max-h-96 overflow-y-auto">

      {notifications.length === 0 ? (
        <p className="p-4 text-gray-500 text-sm">
          No notifications
        </p>
      ) : (
        notifications.map((notification) => (
          <div

  key={notification.id}

  onClick={async () => {

    await supabase

      .from("notifications")

      .update({
        is_read: true,
      })

      .eq(
        "id",
        notification.id
      )

      .eq(
        "user_id",
        profile?.id
      );

    fetchNotifications();

    window.location.href =
      "/notifications";

  }}

  className="
    p-4
    border-b
    border-white/5
    hover:bg-white/5
    transition-all
    cursor-pointer
  "
>

            <p className="text-sm text-white">
              {notification.message}
            </p>

            <p className="text-[10px] text-gray-500 mt-1">
              {new Date(notification.created_at).toLocaleString()}
            </p>

          </div>
        ))
      )}

    </div>
  )}
</div>
)}

        {/* Nav Links */}
        <nav className="space-y-2">

  {filteredItems.map((item) => (

    <div
      key={item.path}
      onClick={() => setMobileOpen(false)}
    >

      <NavItem
        item={item}
        isActive={
          location.pathname === item.path
        }
      />

    </div>

  ))}

</nav>
      </div>

      {/* Logout Action */}
      <div className="p-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg shadow-red-500/20 transition-all"
        >
          <LogOut size={20} />
          Logout
        </motion.button>
      </div>
        </motion.div>

  </>
);
}

// NavItem Component for cleaner code
const NavItem = ({ item, isActive }) => {
  const Icon = item.icon;
  return (
    <Link to={item.path}>
      <motion.div
        whileHover={{ x: 5 }}
        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border ${
          isActive 
            ? "bg-red-500/10 border-red-500/20 text-white shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
            : "border-transparent text-gray-400 hover:text-white hover:bg-[#111827]"
        }`}
      >
        <Icon size={20} className={isActive ? "text-red-500" : "inherit"} />
        <span className="font-medium">{item.title}</span>
        {isActive && (
          <motion.div layoutId="activeGlow" className="absolute left-0 w-1 h-6 bg-red-500 rounded-r-full" />
        )}
      </motion.div>
    </Link>
  );
};

export default Sidebar;
