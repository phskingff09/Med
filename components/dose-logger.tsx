"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, X, MessageSquare, Clock, AlertTriangle, Star } from "lucide-react"

interface DoseLoggerProps {
  medications: any[]
  onLogDose: (log: any) => void
  doseLogs: any[]
  rewards: any
}

export default function DoseLogger({ medications, onLogDose, doseLogs, rewards }: DoseLoggerProps) {
  const [selectedMedication, setSelectedMedication] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const isTimeForDose = (medication: any) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    return medication.times.some((time: string) => {
      const [hours, minutes] = time.split(":").map(Number)
      const doseTimeInMinutes = hours * 60 + minutes

      // Allow logging 15 minutes before scheduled time and up to 4 hours after
      const windowStart = doseTimeInMinutes - 15
      const windowEnd = doseTimeInMinutes + 4 * 60 // 4 hours late

      return currentTimeInMinutes >= windowStart && currentTimeInMinutes <= windowEnd
    })
  }

  const getDoseStatus = (medication: any) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number)
      const doseTimeInMinutes = hours * 60 + minutes

      const windowStart = doseTimeInMinutes - 15
      const windowEnd = doseTimeInMinutes + 4 * 60

      if (currentTimeInMinutes >= windowStart && currentTimeInMinutes <= windowEnd) {
        if (currentTimeInMinutes <= doseTimeInMinutes + 15) {
          return { canLog: true, isLate: false, status: "on-time", time }
        } else {
          const minutesLate = currentTimeInMinutes - doseTimeInMinutes
          return {
            canLog: true,
            isLate: true,
            status: "late",
            time,
            minutesLate,
            hoursLate: Math.floor(minutesLate / 60),
          }
        }
      }
    }

    return { canLog: false, isLate: false, status: "not-time", time: null }
  }

  const logDose = (medicationId: string, status: "taken" | "missed" | "skipped") => {
    const medication = medications.find((med) => med.id === medicationId)
    if (!medication) return

    const doseStatus = getDoseStatus(medication)
    const now = new Date()

    const log = {
      medicationId,
      scheduledTime: now.toISOString(),
      actualTime: status === "taken" ? now.toISOString() : undefined,
      status,
      notes: notes.trim() || undefined,
      isLate: doseStatus.isLate,
      minutesLate: doseStatus.minutesLate || 0,
    }

    onLogDose(log)
    setNotes("")
    setShowNotes(false)
    setSelectedMedication("")

    // Show success message with points earned
    if (status === "taken") {
      const pointsEarned = doseStatus.isLate ? 10 : 15
      setTimeout(() => {
        alert(`✅ Dose logged! +${pointsEarned} points earned`)
      }, 100)
    }
  }

  const getTodaysLogs = () => {
    const today = new Date().toDateString()
    return doseLogs.filter((log) => new Date(log.timestamp).toDateString() === today)
  }

  const getMedicationLogs = (medicationId: string) => {
    const today = new Date().toDateString()
    return doseLogs.filter(
      (log) => log.medicationId === medicationId && new Date(log.timestamp).toDateString() === today,
    )
  }

  const getNextDoseTime = (medication: any) => {
    const now = new Date()
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes()

    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number)
      const doseTimeInMinutes = hours * 60 + minutes

      if (doseTimeInMinutes > currentTimeInMinutes) {
        return time
      }
    }

    // If no more doses today, return first dose of tomorrow
    return medication.times[0]
  }

  const getTodaysDoseStatus = (medication: any) => {
    const today = new Date().toDateString()
    const todayLogs = doseLogs.filter(
      (log) => log.medicationId === medication.id && new Date(log.timestamp).toDateString() === today,
    )

    const takenCount = todayLogs.filter((log) => log.status === "taken").length
    const expectedCount = medication.frequency

    return {
      takenCount,
      expectedCount,
      canLogMore: takenCount < expectedCount,
      logs: todayLogs,
    }
  }

  const todaysLogs = getTodaysLogs()

  return (
    <div className="space-y-6">
      {/* Enhanced Rewards Banner */}
      <Card className="card-3d border-0 mb-6">
        <CardContent className="p-0">
          <div className="gradient-warning rounded-2xl p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Star className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Level {rewards.level}</p>
                  <p className="text-yellow-100">
                    {rewards.points} points • {rewards.streak} day streak
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-yellow-100 text-sm">Next level in</p>
                <p className="text-2xl font-bold">{100 - (rewards.points % 100)} points</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Log Section */}
      <Card>
        <CardHeader>
          <CardTitle>Log Dose</CardTitle>
          <CardDescription>Record your medication intake at scheduled times</CardDescription>
        </CardHeader>
        <CardContent>
          {medications.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medications.map((medication) => {
                  const doseStatus = getDoseStatus(medication)
                  const todayStatus = getTodaysDoseStatus(medication)
                  const nextDoseTime = getNextDoseTime(medication)

                  return (
                    <Card
                      key={medication.id}
                      className={`card-3d border-0 hover:scale-105 transition-all duration-300 ${
                        doseStatus.canLog
                          ? doseStatus.isLate
                            ? "gradient-secondary"
                            : "gradient-success"
                          : "glass-effect"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{medication.name}</h3>
                            <p className="text-sm text-gray-600">{medication.dosage}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary">{medication.category}</Badge>
                            {doseStatus.canLog && (
                              <Badge variant={doseStatus.isLate ? "destructive" : "default"} className="text-xs">
                                {doseStatus.isLate ? "Late" : "On Time"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Dose Status Display */}
                        <div className="mb-3">
                          <p className="text-sm">
                            <strong>Today's Progress:</strong> {todayStatus.takenCount}/{todayStatus.expectedCount}{" "}
                            doses
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(todayStatus.takenCount / todayStatus.expectedCount) * 100}%` }}
                            />
                          </div>
                          {!todayStatus.canLogMore && (
                            <p className="text-xs text-green-600 mt-1">✅ All doses completed for today</p>
                          )}
                        </div>

                        {/* Late Warning */}
                        {doseStatus.canLog && doseStatus.isLate && (
                          <Alert className="mb-3 border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800 text-sm">
                              This dose is {doseStatus.hoursLate}h {doseStatus.minutesLate % 60}m late. Log it now for
                              accurate tracking.
                            </AlertDescription>
                          </Alert>
                        )}

                        {!doseStatus.canLog && (
                          <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Next dose at {nextDoseTime}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => logDose(medication.id, "taken")}
                            className={`flex-1 btn-3d ${
                              !todayStatus.canLogMore
                                ? "bg-gray-300 text-gray-500"
                                : doseStatus.canLog
                                  ? "gradient-primary text-white border-0"
                                  : "bg-gray-200 text-gray-500"
                            }`}
                            disabled={!doseStatus.canLog || !todayStatus.canLogMore}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {!todayStatus.canLogMore ? "Complete" : doseStatus.canLog ? "Mark Taken" : "Not Time"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => logDose(medication.id, "missed")}
                            disabled={!doseStatus.canLog}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMedication(medication.id)
                              setShowNotes(true)
                            }}
                            disabled={!doseStatus.canLog || !todayStatus.canLogMore}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Points Preview */}
                        {doseStatus.canLog && (
                          <div className="mt-2 text-xs text-center text-gray-600">
                            Earn {doseStatus.isLate ? "10" : "15"} points for logging this dose
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Notes Modal */}
              {showNotes && selectedMedication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle>Add Notes</CardTitle>
                      <CardDescription>
                        {medications.find((med) => med.id === selectedMedication)?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any notes about this dose..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => logDose(selectedMedication, "taken")} className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          Taken
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => logDose(selectedMedication, "missed")}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Missed
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNotes(false)
                          setSelectedMedication("")
                          setNotes("")
                        }}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No medications to log. Add medications first.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
          <CardDescription>All dose logs for today</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysLogs.length > 0 ? (
            <div className="space-y-3">
              {todaysLogs.map((log) => {
                const medication = medications.find((med) => med.id === log.medicationId)
                return (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          log.status === "taken"
                            ? "bg-green-500"
                            : log.status === "missed"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{medication?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {log.isLate && (
                            <Badge variant="outline" className="text-xs">
                              {Math.floor(log.minutesLate / 60)}h {log.minutesLate % 60}m late
                            </Badge>
                          )}
                        </div>
                        {log.notes && <p className="text-xs text-gray-500 mt-1">{log.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          log.status === "taken" ? "default" : log.status === "missed" ? "destructive" : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                      {log.status === "taken" && (
                        <span className="text-xs text-yellow-600">+{log.isLate ? "10" : "15"}pts</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No doses logged today</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
