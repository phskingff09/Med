"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CalendarHeatmapProps {
  doseLogs: any[]
  medications: any[]
}

export default function CalendarHeatmap({ doseLogs, medications }: CalendarHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1) // 3 months ago
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0) // End of current month

    const data = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toDateString()
      const dayLogs = doseLogs.filter((log) => new Date(log.timestamp).toDateString() === dateStr)
      const takenLogs = dayLogs.filter((log) => log.status === "taken")
      const missedLogs = dayLogs.filter((log) => log.status === "missed")
      const expectedDoses = medications.reduce((sum, med) => sum + med.frequency, 0)

      const adherenceRate = expectedDoses > 0 ? (takenLogs.length / expectedDoses) * 100 : 0

      data.push({
        date: new Date(currentDate),
        dateStr,
        taken: takenLogs.length,
        missed: missedLogs.length,
        expected: expectedDoses,
        adherenceRate: Math.round(adherenceRate),
        intensity: Math.min(Math.round(adherenceRate / 25), 4), // 0-4 intensity levels
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return data
  }, [doseLogs, medications])

  const getIntensityColor = (intensity: number, missed: number) => {
    if (missed > 0) {
      return "bg-red-200" // Red for days with missed doses
    }

    switch (intensity) {
      case 0:
        return "bg-gray-100"
      case 1:
        return "bg-green-100"
      case 2:
        return "bg-green-200"
      case 3:
        return "bg-green-300"
      case 4:
        return "bg-green-400"
      default:
        return "bg-gray-100"
    }
  }

  const weeks = []
  let currentWeek = []

  heatmapData.forEach((day, index) => {
    if (index === 0) {
      // Add empty cells for days before the start of the week
      const startDayOfWeek = day.date.getDay()
      for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push(null)
      }
    }

    currentWeek.push(day)

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  if (currentWeek.length > 0) {
    // Fill the last week with empty cells
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adherence Calendar</CardTitle>
        <CardDescription>Daily medication adherence over the last 3 months</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
              </div>
              <span className="text-gray-600">More</span>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-3 h-3 bg-red-200 rounded-sm"></div>
                <span className="text-gray-600">Missed doses</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Month labels */}
                <div className="flex mb-2">
                  <div className="w-8"></div> {/* Space for day labels */}
                  {weeks.map((week, weekIndex) => {
                    const firstDay = week.find((day) => day !== null)
                    if (!firstDay || weekIndex === 0) return <div key={weekIndex} className="w-4"></div>

                    const isFirstWeekOfMonth = firstDay.date.getDate() <= 7
                    return (
                      <div key={weekIndex} className="w-4 text-xs text-gray-600">
                        {isFirstWeekOfMonth ? monthNames[firstDay.date.getMonth()] : ""}
                      </div>
                    )
                  })}
                </div>

                {/* Day labels and calendar */}
                {dayNames.map((dayName, dayIndex) => (
                  <div key={dayName} className="flex items-center mb-1">
                    <div className="w-8 text-xs text-gray-600 text-right pr-2">{dayIndex % 2 === 0 ? dayName : ""}</div>
                    {weeks.map((week, weekIndex) => {
                      const day = week[dayIndex]
                      return (
                        <div key={weekIndex} className="w-4 h-4 mr-1">
                          {day ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-3 h-3 rounded-sm cursor-pointer ${getIntensityColor(day.intensity, day.missed)}`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">{day.date.toLocaleDateString()}</p>
                                  <p>
                                    Taken: {day.taken}/{day.expected}
                                  </p>
                                  <p>Missed: {day.missed}</p>
                                  <p>Adherence: {day.adherenceRate}%</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="w-3 h-3"></div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {heatmapData.filter((day) => day.adherenceRate === 100).length}
                </p>
                <p className="text-sm text-gray-600">Perfect Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(heatmapData.reduce((sum, day) => sum + day.adherenceRate, 0) / heatmapData.length)}%
                </p>
                <p className="text-sm text-gray-600">Avg Adherence</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {heatmapData.filter((day) => day.missed > 0).length}
                </p>
                <p className="text-sm text-gray-600">Days with Misses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {heatmapData.reduce((sum, day) => sum + day.taken, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Doses</p>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
