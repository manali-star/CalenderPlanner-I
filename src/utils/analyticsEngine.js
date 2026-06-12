export const generateAnalytics = ({
  tasks = [],
  teams = [],
  profiles = [],
  colleges = [],
}) => {

  // =========================
  // BASIC KPIs
  // =========================

  const totalTasks =
    tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
          "completed" ||
        task.status ===
          "approved"
    );

  const totalCompleted =
    completedTasks.length;

  const totalOutreach =
    completedTasks.reduce(
      (sum, task) =>
        sum +
        (
          task.audience_count ||
          0
        ),
      0
    );

  const presentations =
    completedTasks.filter(
      (task) =>
        task.activity_type
          ?.toLowerCase() ===
        "presentation"
    );

  const impactActivities =
    completedTasks.filter(
      (task) =>
        task.activity_type
          ?.toLowerCase() ===
        "impact activity"
    );

  // =========================
  // WEEKLY ANALYTICS
  // =========================

  const getWeekRange = (
    dateString
  ) => {

    const date =
      new Date(dateString);

    const start =
      new Date(date);

    start.setDate(
      date.getDate() -
      date.getDay() + 1
    );

    const end =
      new Date(start);

    end.setDate(
      start.getDate() + 6
    );

    return {

      start,

      end,

      label: `${start.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      )} - ${end.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
        }
      )}`,

    };

  };

  const groupedWeeks = {};

  completedTasks.forEach(
    (task) => {

      if (
        !task.activity_date
      ) return;

      const range =
        getWeekRange(
          task.activity_date
        );

      const key =
        range.label;

      if (
        !groupedWeeks[key]
      ) {

        groupedWeeks[key] = {

  week: `Week ${
    Object.keys(
      groupedWeeks
    ).length + 1
  }`,

  dateRange:
    range.label,

  // PRESENTATIONS

  presentationsDone: 0,

  presentationsTarget: 0,

  // STUDENTS

  studentsDone: 0,

  studentsTarget: 0,

  studentsSurplus: 0,

  // IMPACT

  impactDone: 0,

  impactTarget: 0,

  impactSurplus: 0,

  // OUTREACH

  outreachDone: 0,

  outreachTarget: 0,

  outreachSurplus: 0,

  // GENERAL

  completed: 0,

};

      }

      groupedWeeks[
  key
].completed += 1;

// STUDENTS

groupedWeeks[
  key
].studentsDone +=
  task.audience_count ||
  0;

// DYNAMIC TARGETS

groupedWeeks[
  key
].studentsTarget +=
  Math.max(
    task.target_audience ||
    0,

    task.audience_count ||
    0
  );

// PRESENTATIONS

if (
  task.activity_type
    ?.toLowerCase() ===
  "presentation"
) {

  groupedWeeks[
    key
  ].presentationsDone += 1;

  groupedWeeks[
    key
  ].presentationsTarget += 1;

}

// IMPACT ACTIVITIES

if (
  task.activity_type
    ?.toLowerCase() ===
  "impact activity"
) {

  groupedWeeks[
    key
  ].impactDone += 1;

  groupedWeeks[
    key
  ].impactTarget += 1;

}

// OUTREACH

groupedWeeks[
  key
].outreachDone +=
  task.audience_count ||
  0;

groupedWeeks[
  key
].outreachTarget +=
  Math.max(
    task.target_audience ||
    0,

    task.audience_count ||
    0
  );

// SURPLUS

groupedWeeks[
  key
].studentsSurplus =

  groupedWeeks[key]
    .studentsDone -

  groupedWeeks[key]
    .studentsTarget;

groupedWeeks[
  key
].impactSurplus =

  groupedWeeks[key]
    .impactDone -

  groupedWeeks[key]
    .impactTarget;

groupedWeeks[
  key
].outreachSurplus =

  groupedWeeks[key]
    .outreachDone -

  groupedWeeks[key]
    .outreachTarget;

    }
  );

  const weeklyData =
    Object.values(
      groupedWeeks
    );

  // =========================
  // TEAM ANALYTICS
  // =========================

  const teamAnalytics =
    teams.map((team) => {

      const teamTasks =
        completedTasks.filter(
          (task) =>
            task.assigned_team_id ===
            team.id
        );

      const outreach =
        teamTasks.reduce(
          (sum, task) =>
            sum +
            (
              task.audience_count ||
              0
            ),
          0
        );

      const presentations =
        teamTasks.filter(
          (task) =>
            task.activity_type
              ?.toLowerCase() ===
            "presentation"
        ).length;

      const impact =
        teamTasks.filter(
          (task) =>
            task.activity_type
              ?.toLowerCase() ===
            "impact activity"
        ).length;

      return {

        ...team,

        completed:
          teamTasks.length,

        outreach,

        presentations,

        impact,

      };

    });

  // =========================
  // COLLEGE ANALYTICS
  // =========================

  const collegeAnalytics =
    colleges.map(
      (college) => {

        const collegeTasks =
          tasks.filter(
            (task) =>
              task.assigned_college_id ===
              college.id
          );

        const completedCollegeTasks =
          collegeTasks.filter(
            (task) =>
              task.status === "completed" ||
              task.status === "approved"
          );

        const outreach =
          completedCollegeTasks.reduce(
            (sum, task) =>
              sum +
              (
                task.audience_count ||
                0
              ),
            0
          );

        return {

          ...college,

          completed:
            completedCollegeTasks.length,

          totalTasks:
            collegeTasks.length,

          outreach,

          presentations:
            completedCollegeTasks.filter(
              (task) =>
                task.activity_type
                  ?.toLowerCase() ===
                "presentation"
            ).length,

          impact:
            completedCollegeTasks.filter(
              (task) =>
                task.activity_type
                  ?.toLowerCase() ===
                "impact activity"
            ).length,

          completionRate:
            collegeTasks.length === 0
              ? 0
              : Math.round(
                  (completedCollegeTasks.length /
                    collegeTasks.length) *
                    100
                ),

        };

      }
    );

  // =========================
  // RETURN EVERYTHING
  // =========================

  return {

    totalTasks,

    totalCompleted,

    totalOutreach,

    totalPresentations:
      presentations.length,

    totalImpactActivities:
      impactActivities.length,

    weeklyData,

    teamAnalytics,

    collegeAnalytics,

  };

};
