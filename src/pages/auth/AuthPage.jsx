import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { ensureUserProfile } from "../../utils/authProfile";

const initialFormState = {
  fullName: "",
  username: "",
  college: "",
  role: "warrior",
  email: "",
  password: "",
  confirmPassword: "",
};

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    const fetchColleges = async () => {
      const { data, error } = await supabase.from("colleges").select("*");
      if (!error) {
        setColleges(data || []);
      }
    };

    fetchColleges();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error("Enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset email sent");
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      throw error;
    }

    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error("Please verify your email first");
    }

    const profileData = await ensureUserProfile(data.user);
    if (!profileData) {
      await supabase.auth.signOut();
      throw new Error("Unable to load your profile. Please try again.");
    }

    if (!profileData.account_active) {
      await supabase.auth.signOut();
      throw new Error("Account pending approval");
    }

    toast.success("Welcome back");

    const nextPath =
      profileData.role === "officer" || profileData.role === "warrior"
        ? "/activities"
        : "/dashboard";

    window.location.href = nextPath;
  };

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (formData.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (!formData.college) {
      throw new Error("Please select your college");
    }

    if (formData.role === "college_coordinator") {
      const { data: existingCoordinator } = await supabase
        .from("profiles")
        .select("id")
        .eq("college_id", formData.college)
        .eq("role", "college_coordinator")
        .maybeSingle();

      if (existingCoordinator) {
        throw new Error("Coordinator already exists for this college");
      }
    }

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", formData.username)
      .maybeSingle();

    if (existingUsername) {
      throw new Error("Username already taken");
    }

    localStorage.setItem("signupData", JSON.stringify(formData));

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: formData.fullName,
          username: formData.username,
          college_id: formData.college,
          role: formData.role,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await ensureUserProfile(data.user, formData);
    }

    toast.success("Account created. Check your email to verify it.");
    window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`;
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative px-6 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/20 blur-[130px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 blur-[130px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white">CampusFlow AI</h1>
          <p className="text-gray-400">
            {isLogin ? "Login to your workspace" : "Join the network"}
          </p>
        </div>

        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8">
          {["Login", "Sign Up"].map((tab) => {
            const active = (tab === "Login") === isLogin;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setIsLogin(tab === "Login")}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  active
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                    : "text-gray-500"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence>
            {!isLogin && (
              <motion.div className="space-y-4">
                <AuthInput
                  icon={<User size={20} />}
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                />

                <AuthInput
                  icon={<User size={20} />}
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />

                <select
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-[#12071f] border border-white/10 text-white outline-none appearance-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-[#12071f] text-white">
                    Select College
                  </option>
                  {colleges.map((college) => (
                    <option
                      key={college.id}
                      value={college.id}
                      className="bg-[#12071f] text-white"
                    >
                      {college.name}
                    </option>
                  ))}
                </select>

                <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-gray-300 mb-4 tracking-wide">
                    SIGN UP AS
                  </p>

                  <div className="flex gap-8">
                    <label className="flex items-center gap-3 text-white cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="warrior"
                        checked={formData.role === "warrior"}
                        onChange={handleChange}
                      />
                      Warrior
                    </label>

                    <label className="flex items-center gap-3 text-white cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="college_coordinator"
                        checked={formData.role === "college_coordinator"}
                        onChange={handleChange}
                      />
                      Coordinator
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AuthInput
            icon={<Mail size={20} />}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <AuthInput
            icon={<Lock size={20} />}
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            isPassword
            showPassword={showPassword}
            togglePassword={() => setShowPassword(!showPassword)}
          />

          {!isLogin && (
            <AuthInput
              icon={<Lock size={20} />}
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          )}

          {isLogin && (
            <div
              onClick={handleForgotPassword}
              className="text-right text-sm text-red-400 cursor-pointer hover:text-red-300"
            >
              Forgot Password?
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-black"
          >
            {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const AuthInput = ({ icon, isPassword, showPassword, togglePassword, ...props }) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>

    <input
      {...props}
      className="w-full pl-12 pr-12 py-4 rounded-2xl bg-black/30 border border-white/10 text-white"
      required
    />

    {isPassword && (
      <button
        type="button"
        onClick={togglePassword}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
      >
        {showPassword ? <EyeOff /> : <Eye />}
      </button>
    )}
  </div>
);

export default AuthPage;
