import { supabase } from "../lib/supabase";

function toProfilePayload(user, fallback = null) {
  const metadata = user?.user_metadata || {};
  const signupData = fallback || {};
  const role = metadata.role || signupData.role || "warrior";
  const collegeId = metadata.college_id || metadata.college || signupData.college || null;

  const fullName =
    metadata.full_name ||
    metadata.fullName ||
    signupData.fullName ||
    user?.email?.split("@")[0] ||
    "User";

  const username =
    metadata.username ||
    signupData.username ||
    user?.email?.split("@")[0] ||
    `user-${user?.id?.slice(0, 8)}`;

  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    full_name: fullName,
    username,
    college_id: collegeId,
    role,
    approval_status: role === "college_coordinator" ? "pending" : "approved",
    account_active: role === "college_coordinator" ? false : true,
  };
}

export async function ensureUserProfile(user, fallback = null) {
  if (!user?.id) {
    return null;
  }

  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const payload = toProfilePayload(user, fallback);
  if (!payload) {
    return null;
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert([payload])
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return createdProfile;
}
