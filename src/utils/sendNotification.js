import { supabase } from "../lib/supabase";

export const sendNotification =
  async ({

    userId,
    title,
    message,
    type = "general",

  }) => {

    const { error } =
      await supabase

        .from("notifications")

        .insert([{

          user_id: userId,

          title,

          message,

          type,

          is_read: false,

        }]);

    if (error) {

      console.error(
        "Notification Error:",
        error.message
      );

    }

};