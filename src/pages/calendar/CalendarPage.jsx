import { useEffect, useState } from "react";

import OperationsCalendar from "../dashboard/OperationsCalendar";

import { supabase } from "../../lib/supabase";

function CalendarPage() {
const [activities, setActivities] = useState([]);
  useEffect(() => {

    fetchActivities();

  }, []);

  const fetchActivities = async () => {

const { data, error } = await supabase
  .from("tasks")
  .select("*")
  .order("activity_date", {
    ascending: true,
  });

const { data: teamsData } = await supabase
  .from("teams")
  .select("*"); 
    if (!error && data) {

      console.log("TASKS:", data);

      const formattedTasks = data.map((task) => {

  console.table(Object.keys(task));

  return {
        id: task.id,
        title: task.title,
        description: task.description,
        venue: task.venue,
        activity_date: task.activity_date,
        priority: task.priority || "medium",
        status:
          task.activity_status ||
          task.status ||
          "pending",

        assigned_team:
          teamsData?.find(
            (team) => team.id === task.assigned_team_id
          )?.team_name || "Unknown Team",

        progress: task.progress || 0,
      }
    });

      setActivities(formattedTasks);

    }

  };

  return (

    <div className="w-full min-h-screen bg-[#030712] px-8 py-10 min-w-0">

      <OperationsCalendar
        activities={activities}
      />

    </div>

  );

}

export default CalendarPage;