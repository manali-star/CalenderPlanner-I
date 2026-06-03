import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

function VerifyEmail() {
  const fallbackSignupData = useMemo(() => {
    const rawValue = localStorage.getItem("signupData");
    return rawValue ? JSON.parse(rawValue) : null;
  }, []);

  const [email, setEmail] = useState(
    new URLSearchParams(window.location.search).get("email") ||
      fallbackSignupData?.email ||
      ""
  );
  const [sending, setSending] = useState(false);

  const resendVerification = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Verification email sent");
    } catch (error) {
      toast.error(error.message || "Unable to resend verification email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#020617] text-white px-6 text-center">
      <h1 className="text-3xl font-bold">Verify Your Email</h1>

      <p className="max-w-lg text-gray-400 leading-7">
        Your account has been created. Open the verification email from Supabase,
        click the confirmation link, and then return here to log in.
      </p>

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-[320px] max-w-full p-4 rounded-xl bg-black/30 border border-white/10"
      />

      <button
        type="button"
        onClick={resendVerification}
        disabled={sending}
        className="px-6 py-3 rounded-xl bg-blue-500 disabled:opacity-60"
      >
        {sending ? "Sending..." : "Resend Verification Email"}
      </button>

      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("signupData");
          window.location.href = "/";
        }}
        className="px-6 py-3 rounded-xl bg-white/10"
      >
        Back to Login
      </button>
    </div>
  );
}

export default VerifyEmail;
