import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function ResetPassword() {

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleReset = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

console.log("Updating password...");

const { error } =
  await supabase.auth.updateUser({

    password: password,

  });

console.log(error);

      if (error) throw error;

      toast.success("Password updated successfully 🔥");

      navigate("/");

    } catch (err) {

      toast.error(err.message);

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-[#020617]
      text-white
      px-6
    ">

      <div className="
        w-full
        max-w-md
        bg-white/5
        border
        border-white/10
        p-8
        rounded-2xl
        backdrop-blur-xl
      ">

        <h1 className="
          text-3xl
          font-black
          mb-6
          text-center
        ">
          Change Password
        </h1>

        <form
          onSubmit={handleReset}
          className="space-y-4"
        >

          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="
              w-full
              p-4
              rounded-xl
              bg-black/30
              border
              border-white/10
              text-white
            "
            required
          />

          <button
            disabled={loading}
            className="
              w-full
              py-3
              rounded-xl
              bg-gradient-to-r
              from-red-500
              to-pink-500
              font-bold
            "
          >

            {loading
              ? "Updating..."
              : "Update Password"}

          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="
              w-full
              py-3
              rounded-xl
              bg-white/10
              font-bold
            "
          >
            Skip
          </button>

        </form>

      </div>

    </div>
  );
}

export default ResetPassword;

