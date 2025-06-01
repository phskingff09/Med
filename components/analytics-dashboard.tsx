"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import CalendarHeatmap from "@/components/calendar-heatmap"

interface AnalyticsDashboardProps {
  medications: any[]
  doseLogs: any[]
}

export default function AnalyticsDashboard({ medications, doseLogs }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    // Weekly adherence data
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()

      const dayLogs = doseLogs.filter((log) => new Date(log.timestamp).toDateString() === dateStr)
      const takenLogs = dayLogs.filter((log) => log.status === "taken")
      const expectedDoses = medications.reduce((sum, med) => sum + med.frequency, 0)

      weeklyData.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.toLocaleDateString(),
        adherence: expectedDoses > 0 ? Math.round((takenLogs.length / expectedDoses) * 100) : 0,
        taken: takenLogs.length,
        expected: expectedDoses,
      })
    }

    // Medication adherence breakdown
    const medicationStats = medications.map((med) => {
      const medLogs = doseLogs.filter((log) => log.medicationId === med.id)
      const takenLogs = medLogs.filter((log) => log.status === "taken")
      const missedLogs = medLogs.filter((log) => log.status === "missed")

      return {
        name: med.name,
        category: med.category,
        taken: takenLogs.length,
        missed: missedLogs.length,
        adherence: medLogs.length > 0 ? Math.round((takenLogs.length / medLogs.length) * 100) : 0,
      }
    })

    // Overall stats
    const totalLogs = doseLogs.length
    const takenLogs = doseLogs.filter((log) => log.status === "taken").length
    const missedLogs = doseLogs.filter((log) => log.status === "missed").length
    const overallAdherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0

    // Category breakdown
    const categoryStats = medications.reduce(
      (acc, med) => {
        if (!acc[med.category]) {
          acc[med.category] = { count: 0, taken: 0, total: 0 }
        }
        acc[med.category].count++

        const medLogs = doseLogs.filter((log) => log.medicationId === med.id)
        acc[med.category].taken += medLogs.filter((log) => log.status === "taken").length
        acc[med.category].total += medLogs.length

        return acc
      },
      {} as Record<string, any>,
    )

    const categoryData = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      adherence: stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0,
    }))

    // Late dose analysis
    const lateDoses = doseLogs.filter((log) => log.isLate && log.status === "taken")
    const onTimeDoses = doseLogs.filter((log) => !log.isLate && log.status === "taken")
    const averageLateness =
      lateDoses.length > 0
        ? Math.round(lateDoses.reduce((sum, log) => sum + (log.minutesLate || 0), 0) / lateDoses.length)
        : 0

    return {
      weeklyData,
      medicationStats,
      overallAdherence,
      totalLogs,
      takenLogs,
      missedLogs,
      categoryData,
      lateDoses: lateDoses.length,
      onTimeDoses: onTimeDoses.length,
      averageLateness,
    }
  }, [medications, doseLogs])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.overallAdherence}%</p>
              <p className="text-sm text-gray-600">Overall Adherence</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.takenLogs}</p>
              <p className="text-sm text-gray-600">Doses Taken</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{analytics.missedLogs}</p>
              <p className="text-sm text-gray-600">Doses Missed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{analytics.totalLogs}</p>
              <p className="text-sm text-gray-600">Total Logs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Adherence Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Adherence Trend</CardTitle>
          <CardDescription>Daily adherence percentage over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              adherence: {
                label: "Adherence %",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(value, payload) => {
                    const data = payload?.[0]?.payload
                    return data ? `${data.day} - ${data.date}` : value
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="var(--color-adherence)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-adherence)", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medication Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Medication Adherence</CardTitle>
            <CardDescription>Individual medication performance</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.medicationStats.length > 0 ? (
              <div className="space-y-4">
                {analytics.medicationStats.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-gray-600">
                        {med.taken} taken, {med.missed} missed
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={med.adherence >= 80 ? "default" : med.adherence >= 60 ? "secondary" : "destructive"}
                      >
                        {med.adherence}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No medication data available</p>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Adherence by medication category</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.categoryData.length > 0 ? (
              <div className="space-y-4">
                <ChartContainer
                  config={{
                    adherence: {
                      label: "Adherence %",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="adherence" fill="var(--color-adherence)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <div className="space-y-2">
                  {analytics.categoryData.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{cat.category}</span>
                      <span className="font-medium">
                        {cat.count} medication{cat.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Heatmap */}
      <CalendarHeatmap doseLogs={doseLogs} medications={medications} />

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.overallAdherence >= 90 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  🎉 Excellent adherence! You're maintaining a {analytics.overallAdherence}% adherence rate.
                </p>
              </div>
            )}

            {analytics.overallAdherence < 70 && analytics.totalLogs > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  ⚠️ Your adherence rate is {analytics.overallAdherence}%. Consider setting more reminders or discussing
                  with your healthcare provider.
                </p>
              </div>
            )}

            {analytics.medicationStats.some((med) => med.missed > med.taken) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">🔴 Medications with more missed than taken doses:</p>
                <div className="space-y-1">
                  {analytics.medicationStats
                    .filter((med) => med.missed > med.taken)
                    .map((med, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                        <span className="font-medium">{med.name}</span> ({med.category}) -{med.taken} taken,{" "}
                        {med.missed} missed
                      </div>
                    ))}
                </div>
                <p className="text-red-700 text-sm mt-2">
                  Consider adjusting dose times or setting additional reminders for these medications.
                </p>
              </div>
            )}

            {analytics.totalLogs === 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">
                  📊 Start logging your doses to see detailed analytics and track your adherence patterns.
                </p>
              </div>
            )}

            {analytics.lateDoses > analytics.onTimeDoses && analytics.totalLogs > 10 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800">
                  ⏰ You have more late doses ({analytics.lateDoses}) than on-time doses ({analytics.onTimeDoses}).
                  Consider adjusting your medication schedule or setting earlier reminders.
                </p>
              </div>
            )}

            {analytics.averageLateness > 60 && analytics.lateDoses > 5 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                  🚨 Your average lateness is {Math.floor(analytics.averageLateness / 60)}h{" "}
                  {analytics.averageLateness % 60}m. This may impact medication effectiveness. Consider setting multiple
                  reminders.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
