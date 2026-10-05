import { DashboardSection } from "@/components/admin-dashboard/dashboard-components";

const weeklyActivity = [
  { day: "Mon", value: 35 },
  { day: "Tue", value: 55 },
  { day: "Wed", value: 80, highlight: true },
  { day: "Thu", value: 45 },
  { day: "Fri", value: 65 },
  { day: "Sat", value: 30 },
  { day: "Sun", value: 20 },
];

export function ContentActivity() {
  return (
    <DashboardSection
      title="Content Activity"
      description="Posts created this week"
      contentClassName="p-5 sm:p-6"
    >
      <div
        role="img"
        aria-label="Posts created this week: Monday 35 percent, Tuesday 55 percent, Wednesday 80 percent, Thursday 45 percent, Friday 65 percent, Saturday 30 percent, Sunday 20 percent"
        className="flex h-48 items-end justify-between gap-2 sm:gap-3"
      >
        {weeklyActivity.map(({ day, value, highlight }) => (
          <div
            key={day}
            aria-hidden="true"
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex h-full w-full items-end">
              <div
                className={`w-full rounded-t-md ${
                  highlight ? "bg-[#02a95c]" : "bg-[#e8f2f4]"
                }`}
                style={{ height: `${value}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{day}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between border-t border-gray-100 pt-5">
        <div>
          <p className="text-2xl font-bold text-[#444444]">18</p>
          <p className="text-xs text-gray-500">Posts this week</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#02a95c]">+12%</p>
          <p className="text-xs text-gray-500">vs last week</p>
        </div>
      </div>
    </DashboardSection>
  );
}
