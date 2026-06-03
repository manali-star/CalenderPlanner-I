import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, UserCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    department: "",
  });

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        full_name: data.full_name || "",
        username: data.username || "",
        department: data.department || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Authentication expired. Please login again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username,
        department: profile.department,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to sync neural profile");
    } else {
      toast.success("Profile updated successfully 🔥");
      // Optional: Refresh local data without reloading the whole browser
      fetchProfile(); 
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-white font-black animate-pulse">ACCESSING ENCRYPTED PROFILE...</div>;

  return (
  <div className="relative space-y-8 pb-12 w-full min-w-0">
      {/* Background Aesthetic Glows */}
      <div className="fixed top-0 left-1/3 w-[450px] h-[450px] bg-indigo-500/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[350px] h-[350px] bg-purple-500/10 blur-[160px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-black text-white mb-3">
          Settings
        </motion.h1>
        <p className="text-gray-400 text-lg">Manage your secure identity and intelligence parameters.</p>
      </div>

      {/* Main Settings Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-10 max-w-3xl shadow-2xl">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
        
        <div className="relative z-10">
          {/* Section Header */}
          <div className="flex items-center gap-5 mb-10">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Settings size={30} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Profile Configuration</h2>
              <p className="text-gray-400">Update your core personal metadata</p>
            </div>
          </div>

          {/* User Visual Identity */}
          <div className="flex items-center gap-6 mb-12 p-6 rounded-3xl bg-black/20 border border-white/5">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
              <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center border border-white/10">
                <UserCircle2 size={50} className="text-white/90" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white leading-tight">{profile.full_name || "New Operative"}</h3>
              <p className="text-indigo-400 font-mono text-sm mt-1 uppercase tracking-widest">@{profile.username || "username"}</p>
            </div>
          </div>

          {/* Input Grid */}
          <div className="space-y-6">
            <SettingField label="Full Identity Name" name="full_name" value={profile.full_name} onChange={handleChange} placeholder="John Doe" />
            <SettingField label="User Handle" name="username" value={profile.username} onChange={handleChange} placeholder="warrior_01" />
            <SettingField label="Academic Department" name="department" value={profile.department} onChange={handleChange} placeholder="MCA Department" />

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
              {saving ? "Syncing Data..." : "Commit Changes"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Reusable input component to keep the main layout clean
const SettingField = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="block text-gray-400 text-sm font-bold uppercase tracking-widest ml-1">{label}</label>
    <input
      {...props}
      type="text"
      className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all placeholder:text-gray-700"
    />
  </div>
);

export default SettingsPage;