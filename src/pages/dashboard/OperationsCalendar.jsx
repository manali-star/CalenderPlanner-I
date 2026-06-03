import { useState } from "react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  Sparkles,
} from "lucide-react";

function OperationsCalendar({ activities = [] }) {
const [expandedTask, setExpandedTask] = useState(null);

const [selectedDate, setSelectedDate] = useState("");

const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());

  const startDay = currentMonth.clone().startOf("month").startOf("week");
  const endDay = currentMonth.clone().endOf("month").endOf("week");

  const calendarDays = [];

  let day = startDay.clone();

  while (day.isBefore(endDay, "day") || day.isSame(endDay, "day")) {
    calendarDays.push(day.clone());
    day.add(1, "day");
  }

  const totalTasks = activities.length;

const completedTasks = activities.filter(
  (task) => task.status === "approved"
).length;

const ongoingTasks = activities.filter(
  (task) =>
    task.status !== "approved" &&
    task.status !== "planned"
).length;

const overdueTasks = activities.filter((task) => {

  if (!task.activity_date) return false;

  return (
    moment(task.activity_date).isBefore(moment(), "day") &&
    task.status !== "approved"
  );

}).length;

const completionRate =
  totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

const todayTasks = activities.filter((task) => {
  const taskDate =
    task.activity_date ||
    task.due_date ||
    task.date;

  return (
    taskDate &&
    moment(taskDate).isSame(moment(), "day")
  );
}).length;

const todayTaskList = activities.filter((task) => {
  const taskDate =
    task.activity_date ||
    task.due_date ||
    task.date;

  return (
    taskDate &&
    moment(taskDate).isSame(moment(), "day")
  );
});
  
const updateTaskStatus = (taskId, status) => {
  const updatedTasks = activities.map((task) =>
    task.id === taskId
      ? { ...task, status }
      : task
  );

  setSelectedDateTasks((prev) =>
    prev.map((task) =>
      task.id === taskId
        ? { ...task, status }
        : task
    )
  );
};
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "high":
        return "border-pink-500/40 bg-pink-500/10 hover:border-pink-400";
      case "medium":
        return "border-orange-500/40 bg-orange-500/10 hover:border-orange-400";
      default:
        return "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-400";
    }
  };

  return (
    <div className="w-full text-white font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Sparkles className="text-cyan-400" size={20} />
            </div>

            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Operations Calendar
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                AI-powered academic operations dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setCurrentMonth(moment())}
            className="px-5 py-3 rounded-2xl border border-white/10 bg-[#111827]/70 hover:bg-white/10 transition-all text-sm font-bold"
          >
            Today
          </button>

          <div className="flex items-center bg-[#111827]/70 border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() =>
                setCurrentMonth(currentMonth.clone().subtract(1, "month"))
              }
              className="p-3 hover:bg-white/10 transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="px-6 font-bold tracking-wide">
              {currentMonth.format("MMMM YYYY")}
            </div>

            <button
              onClick={() =>
                setCurrentMonth(currentMonth.clone().add(1, "month"))
              }
              className="p-3 hover:bg-white/10 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 overflow-hidden">
      {/* CALENDAR */}
      <div className="rounded-[32px] overflow-hidden border border-cyan-500/10 bg-[#020617]/90 shadow-[0_0_80px_rgba(0,255,255,0.05)] backdrop-blur-2xl">
        {/* WEEK DAYS */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (d) => (
              <div
                key={d}
                className="py-5 text-center text-cyan-400 text-xs font-black uppercase tracking-[0.3em]"
              >
                {d}
              </div>
            )
          )}
        </div>

        {/* DAY CELLS */}
        <motion.div layout className="grid grid-cols-7">
          {calendarDays.map((date, idx) => {
            const isToday = date.isSame(moment(), "day");
            const isCurrentMonth =
              date.month() === currentMonth.month();

            activities.forEach((task) => {
              console.table(task);
            });
              const dayTasks = activities.filter((a) => {
              const taskDate =
                a.activity_date ||
                a.due_date ||
                a.date;

              return taskDate && moment(taskDate).isSame(date, "day");
            });
            const hasOverdue = dayTasks.some(
              (task) => task.status === "overdue"
            );
            const taskIntensity =
              dayTasks.length >= 5
                ? "heavy"
                : dayTasks.length >= 3
                ? "medium"
                : dayTasks.length >= 1
                ? "light"
                : "none";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.01 }}
                  onClick={() => {

                    if (dayTasks.length === 0) return;

                    setSelectedDate(
                      date.format("YYYY-MM-DD")
                    );

                    setSelectedDateTasks([...dayTasks]);

                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 25px rgba(34,211,238,0.15)",
                  }}
                className={`
                  min-h-[160px]
                  border-r border-b border-white/[0.03]
                  p-3
                  relative
                  transition-all duration-500
                  ${
                    isCurrentMonth
                    ? hasOverdue
                      ? "bg-red-950/20 border-red-500/20"
                      : taskIntensity === "heavy"
                      ? "bg-cyan-900/20 border-cyan-400/20"
                      : taskIntensity === "medium"
                      ? "bg-cyan-950/20"
                      : taskIntensity === "light"
                      ? "bg-[#07111f]/60"
                      : "bg-[#07111f]/30"
                    : "bg-black/30 opacity-30"
                  }
                `}
              >
                {/* DATE */}
                <div className="flex justify-between items-center mb-4">
                  <div
                    className={`
                      w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black
                      ${
                        isToday
                          ? "bg-cyan-400 text-black shadow-[0_0_40px_rgba(34,211,238,0.9)] ring-4 ring-cyan-400/20"
                          : "text-white/40 bg-white/[0.03]"
                      }
                    `}
                  >
                    {date.date()}
                  </div>

                  {dayTasks.length > 0 && (
                    <div className="flex items-center gap-2">

                      {/* COMPLETED */}
                      {dayTasks.some((t) => t.status === "completed") && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                      )}

                      {/* ONGOING */}
                      {dayTasks.some((t) => t.status === "ongoing") && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                      )}

                      {/* OVERDUE */}
                      {dayTasks.some((t) => t.status === "overdue") && (
                        <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
                      )}

                      {/* PENDING */}
                      {dayTasks.some((t) => !t.status || t.status === "pending") && (
                        <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]" />
                      )}

                      <div className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                        {dayTasks.length}
                      </div>
                    </div>
                  )}
                </div>

                {/* EVENTS */}
               <div className="flex flex-col gap-2 mt-3 relative z-10">
                  {dayTasks.length === 0 && (
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-white/5" />
                  )}
                  {dayTasks.length > 0 && (
  <>
    {[dayTasks[0]].map((task) => (
      <motion.button
        key={task.id}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {

          e.stopPropagation();

          setSelectedDate(
            date.format("YYYY-MM-DD")
          );

          setSelectedDateTasks([...dayTasks]);

        }}
        className={`
          w-full
          p-3.5
          rounded-2xl
          border
          text-left
          transition-all
          ${getPriorityStyle(task.priority)}
        `}
      >

        <p className="font-bold text-xs">
          {task.title}
        </p>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
          <MapPin size={12} />
          {task.venue || "Campus"}
        </div>

      </motion.button>
    ))}

    {dayTasks.length > 1 && (
      <button
        onClick={(e) => {

          e.stopPropagation();

          setSelectedDate(
            date.format("YYYY-MM-DD")
          );

          setSelectedDateTasks([...dayTasks]);

        }}
        className="text-xs text-cyan-400 font-bold mt-1"
      >
        +{dayTasks.length - 1} more
      </button>
    )}
  </>
)}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      {/* ANALYTICS SIDEBAR */}
<div className="space-y-5">

  {/* OVERVIEW */}
  <div className="rounded-[32px] border border-cyan-500/10 bg-[#081120]/80 backdrop-blur-2xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.05)]">
    
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Sparkles className="text-cyan-400" size={20} />
      </div>

      <div>
        <h3 className="text-xl font-black">
          Operations Analytics
        </h3>

        <p className="text-slate-400 text-sm">
          Live operational insights
        </p>
      </div>
    </div>

    {/* STATS */}
    <div className="space-y-4">

      <AnalyticsCard
        title="Total Activities"
        value={totalTasks}
        color="cyan"
      />

      <AnalyticsCard
        title="Completed"
        value={completedTasks}
        color="emerald"
      />

      <AnalyticsCard
        title="Ongoing"
        value={ongoingTasks}
        color="blue"
      />

      <AnalyticsCard
        title="Overdue"
        value={overdueTasks}
        color="red"
      />

      <AnalyticsCard
        title="Today's Load"
        value={todayTasks}
        color="orange"
      />

    </div>
  </div>

  {/* PRODUCTIVITY */}
  <div className="rounded-[32px] border border-emerald-500/10 bg-[#081120]/80 backdrop-blur-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.05)]">

    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-xl font-black">
          Productivity
        </h3>

        <p className="text-slate-400 text-sm mt-1">
          Operational completion rate
        </p>
      </div>

      <div className="text-3xl font-black text-emerald-400">
        {completionRate}%
      </div>
    </div>

    <div className="w-full h-4 rounded-full bg-black/30 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${completionRate}%` }}
        transition={{ duration: 1 }}
        className="h-full rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.7)]"
      />
    </div>
  </div>
</div>
</div>
{/* TODAY FOCUS */}
<div className="rounded-[32px] border border-cyan-500/10 bg-[#081120]/80 backdrop-blur-2xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.05)]">

  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-xl font-black">
        Today's Focus
      </h3>

      <p className="text-slate-400 text-sm mt-1">
        Active operational tasks
      </p>
    </div>

    <div className="px-3 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-black">
      {todayTaskList.length}
    </div>
  </div>

  {/* EMPTY */}
  {todayTaskList.length === 0 && (
    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-400">
      No active tasks today
    </div>
  )}

  {/* TASKS */}
  <div className="space-y-3">

    {todayTaskList.slice(0, 5).map((task) => (
      <motion.div
        key={task.id}
        whileHover={{ scale: 1.02 }}
        className={`
          rounded-2xl
          border
          p-4
          transition-all
          cursor-pointer
          ${
            task.status === "completed"
              ? "border-emerald-500/20 bg-emerald-500/10"
              : task.status === "ongoing"
              ? "border-cyan-500/20 bg-cyan-500/10"
              : task.status === "overdue"
              ? "border-red-500/20 bg-red-500/10"
              : "border-orange-500/20 bg-orange-500/10"
          }
        `}
      >

        <div className="flex items-start justify-between gap-3">

          <div className="flex-1">
            <h4 className="font-bold text-sm">
              {task.title}
            </h4>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <MapPin size={12} />
              {task.venue || "Campus"}
            </div>
          </div>

          <div
            className={`
              w-3 h-3 rounded-full mt-1
              ${
                task.status === "completed"
                  ? "bg-emerald-400"
                  : task.status === "ongoing"
                  ? "bg-cyan-400"
                  : task.status === "overdue"
                  ? "bg-red-400"
                  : "bg-orange-400"
              }
            `}
          />
        </div>

      </motion.div>
    ))}

  </div>
</div>


{/* DAY TASKS MODAL */}
<AnimatePresence>
  {selectedDate && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setSelectedDate(null)}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex justify-end"
    >
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        transition={{ duration: 0.25 }}
        className="absolute right-0 top-0 h-full w-[420px] max-w-full rounded-l-[36px] bg-[#081120] border border-cyan-500/20 p-6 overflow-y-auto shadow-[0_0_80px_rgba(0,0,0,0.8)]"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black">
              {moment(selectedDate).format("DD MMMM YYYY")}
            </h2>

            <p className="text-slate-400 mt-1">
              Operational Activities
            </p>
            <div className="flex flex-wrap gap-3 mt-4">

              <div className="px-3 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-black">
                {selectedDateTasks.length} Tasks
              </div>

              <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-black">
                {
                  selectedDateTasks.filter(
                    (task) => task.status === "completed"
                  ).length
                } Completed
              </div>

              <div className="px-3 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-black">
                {
                  selectedDateTasks.filter(
                    (task) => task.status === "overdue"
                  ).length
                } Overdue
              </div>

            </div>
                      </div>

          <button
            onClick={() => setSelectedDate(null)}
            className="w-12 h-12 rounded-2xl bg-white/[0.05] hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* EMPTY STATE */}
        {selectedDateTasks.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-slate-400 text-lg">
              No activities scheduled
            </p>
          </div>
        )}

       {/* TASKS */}

<div className="space-y-3 max-h-[75vh] pr-2">

  {selectedDateTasks.map((task) => (

    <div
      key={task.id}
      className="rounded-2xl border border-cyan-500/10 bg-[#0b1220] p-4"
    >

      {/* ACTIVITY NAME */}
      <p className="text-lg font-black text-white">
        {task.title}
      </p>

      {/* TEAM */}
      <p className="text-sm text-cyan-400 mt-2">
        Team: {task.assigned_team}
      </p>

      {/* LOCATION */}
      <p className="text-sm text-slate-400 mt-1">
        📍 {task.venue || "Campus"}
      </p>

    </div>

  ))}

</div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}

function AnalyticsCard({ title, value, color }) {

  const colorMap = {
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    red: "border-red-500/20 bg-red-500/10 text-red-300",
    orange: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  };

  return (
    <div
      className={`
        rounded-2xl
        border
        p-4
        flex items-center justify-between
        ${colorMap[color]}
      `}
    >
      <span className="font-semibold">
        {title}
      </span>

      <span className="text-2xl font-black">
        {value}
      </span>
    </div>
  );
}

export default OperationsCalendar;