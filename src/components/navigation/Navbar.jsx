import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  };

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10"
    >
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome Back 👋
        </h1>

        <p className="text-gray-400 mt-1">
          Monitor activities and AI insights.
        </p>
      </div>

      {/* Right Side */}
      <div className="flex flex-wrap items-center gap-5 w-full md:w-auto">

        {/* Search */}
        <div className="flex items-center gap-3 bg-[#111827] border border-red-500/10 focus-within:border-red-500/40 px-4 py-3 rounded-2xl w-full md:w-80 transition-all">
          <Search size={18} className="text-gray-400" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search activities..."
            className="bg-transparent outline-none text-white placeholder:text-gray-500 w-full"
          />
        </div>

        {/* Bell */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-2xl bg-[#111827] border border-red-500/10 flex items-center justify-center cursor-pointer hover:bg-[#1f2937] transition-colors"
        >
          <Bell size={20} className="text-red-500" />
        </motion.div>

        {/* Profile */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 bg-[#111827] border border-red-500/10 px-4 py-2.5 rounded-2xl cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-pink-500 shadow-lg shadow-red-500/20" />

          <div className="hidden sm:block">
            <h3 className="text-white font-semibold text-sm leading-tight">
              {profile?.full_name || "User"}
            </h3>

            <p className="text-gray-400 text-xs mt-0.5">
              {profile?.department || "Department"}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Navbar;