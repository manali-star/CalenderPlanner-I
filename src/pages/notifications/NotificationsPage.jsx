import {
  useEffect,
  useState,
} from "react";

import { supabase }
  from "../../lib/supabase";

function NotificationsPage() {

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const fetchNotifications =
    async () => {

      const {
        data: { user },
      } = await supabase.auth
        .getUser();

      if (!user) return;

      const {
        data,
      } = await supabase

        .from("notifications")

        .select("*")

        .eq(
          "user_id",
          user.id
        )

        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      setNotifications(
        data || []
      );

    };

  useEffect(() => {

    fetchNotifications();

  }, []);

  const markAsRead =
    async (id) => {

      await supabase

        .from("notifications")

        .update({
          is_read: true,
        })

        .eq("id", id)
.eq(
  "user_id",
  (
    await supabase.auth
      .getUser()
  ).data.user.id
);

      fetchNotifications();

    };

  return (

    <div className="
      min-h-screen
      bg-[#020617]
      text-white
      p-8
    ">

      <div className="mb-8">

        <h1 className="
          text-4xl
          font-black
        ">
          Notifications
        </h1>

        <p className="
          text-gray-400
          mt-2
        ">
          Stay updated with
          approvals, tasks,
          and workflow events.
        </p>

      </div>

      <div className="
        space-y-4
      ">

        {notifications.length === 0 && (

          <div className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
            text-center
          ">

            <h2 className="
              text-2xl
              font-bold
            ">
              No Notifications
            </h2>

          </div>

        )}

        {notifications.map(
          (notification) => (

            <div

              key={notification.id}

              className={`
                rounded-3xl
                border
                p-6
                transition-all

                ${
                  notification.is_read

                    ? `
                      border-white/10
                      bg-white/5
                    `

                    : `
                      border-cyan-500/30
                      bg-cyan-500/10
                    `
                }
              `}
            >

              <div className="
                flex
                items-start
                justify-between
                gap-6
              ">

                <div>

                  <h2 className="
                    text-xl
                    font-black
                  ">
                    {notification.title}
                  </h2>

                  <p className="
                    text-gray-300
                    mt-2
                  ">
                    {
                      notification.message
                    }
                  </p>

                </div>

                {!notification.is_read && (

                  <button

                    onClick={() =>
                      markAsRead(
                        notification.id
                      )
                    }

                    className="
                      px-4
                      py-2
                      rounded-xl
                      bg-cyan-500
                      text-black
                      font-bold
                    "
                  >
                    Mark Read
                  </button>

                )}

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );

}

export default NotificationsPage;