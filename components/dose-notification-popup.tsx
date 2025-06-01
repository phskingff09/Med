"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Check, Clock, Star, Bell, AlertTriangle } from "lucide-react"

// Add this after imports
const pulseStyle = `
  @keyframes pulse-shadow {
    0% {
      box-shadow: 0 0 5px 2px rgba(59, 130, 246, 0.5);
    }
    100% {
      box-shadow: 0 0 20px 10px rgba(59, 130, 246, 0.8);
    }
  }
`

interface DoseNotificationPopupProps {
  onLogDose: (medicationId: string, status: "taken" | "missed") => void
  medications: any[]
  doseLogs: any[]
}

export default function DoseNotificationPopup({ onLogDose, medications, doseLogs }: DoseNotificationPopupProps) {
  const [activeDoses, setActiveDoses] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Check if user can still log more doses for a medication today
  const canLogMoreDoses = (medicationId: string) => {
    const medication = medications.find((med) => med.id === medicationId)
    if (!medication) return false

    const today = new Date().toDateString()
    const todayLogs = doseLogs.filter(
      (log) =>
        log.medicationId === medicationId && new Date(log.timestamp).toDateString() === today && log.status === "taken",
    )

    return todayLogs.length < medication.frequency
  }

  useEffect(() => {
    const handleDoseDue = (event: CustomEvent) => {
      const { dose } = event.detail

      // Only show popup if user can still log more doses and hasn't dismissed this dose
      if (canLogMoreDoses(dose.medicationId) && !dismissed.has(dose.medicationId)) {
        setActiveDoses((prev) => {
          // Avoid duplicates
          if (prev.some((d) => d.medicationId === dose.medicationId)) {
            return prev
          }
          return [...prev, dose]
        })
      }
    }

    window.addEventListener("medtrack-dose-due", handleDoseDue as EventListener)

    return () => {
      window.removeEventListener("medtrack-dose-due", handleDoseDue as EventListener)
    }
  }, [dismissed, doseLogs, medications])

  const handleTaken = (dose: any) => {
    if (canLogMoreDoses(dose.medicationId)) {
      onLogDose(dose.medicationId, "taken")
      setActiveDoses((prev) => prev.filter((d) => d.medicationId !== dose.medicationId))
      setDismissed((prev) => new Set(prev).add(dose.medicationId))
    }
  }

  const handleMissed = (dose: any) => {
    onLogDose(dose.medicationId, "missed")
    setActiveDoses((prev) => prev.filter((d) => d.medicationId !== dose.medicationId))
    setDismissed((prev) => new Set(prev).add(dose.medicationId))
  }

  const handleDismiss = (dose: any) => {
    setActiveDoses((prev) => prev.filter((d) => d.medicationId !== dose.medicationId))
    setDismissed((prev) => new Set(prev).add(dose.medicationId))

    // Set reminder for 5 minutes
    setTimeout(
      () => {
        if (canLogMoreDoses(dose.medicationId)) {
          setDismissed((prev) => {
            const newSet = new Set(prev)
            newSet.delete(dose.medicationId)
            return newSet
          })
          setActiveDoses((prev) => [...prev, dose])
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes
  }

  const handleSnooze = (dose: any) => {
    setActiveDoses((prev) => prev.filter((d) => d.medicationId !== dose.medicationId))

    // Set reminder for 5 minutes
    setTimeout(
      () => {
        if (canLogMoreDoses(dose.medicationId)) {
          setActiveDoses((prev) => [...prev, dose])
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes
  }

  // Add this before the return statement
  useEffect(() => {
    // Add the animation style to the document
    const styleElement = document.createElement("style")
    styleElement.innerHTML = pulseStyle
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  if (activeDoses.length === 0) return null

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />

      {/* Centered popup */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="space-y-4 max-w-md w-full">
          {activeDoses.map((dose) => {
            const medication = medications.find((med) => med.id === dose.medicationId)
            const canLog = canLogMoreDoses(dose.medicationId)

            return (
              <Card
                key={dose.medicationId}
                className="border-4 border-blue-500 shadow-2xl bg-white"
                style={{
                  animation: "pulse-shadow 1s infinite alternate",
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                        <Bell className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-blue-900">💊 Dose Time!</CardTitle>
                        <CardDescription className="text-blue-700">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(dose)}
                      className="h-8 w-8 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg text-blue-900">{dose.medicationName}</h3>
                    <p className="text-blue-800 font-medium">{dose.dosage}</p>
                    {medication && (
                      <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700">
                        {medication.category}
                      </Badge>
                    )}
                  </div>

                  {!canLog && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-800 text-sm font-medium">All doses for today have been completed</p>
                    </div>
                  )}

                  {canLog && (
                    <>
                      <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <Star className="w-5 h-5" />
                        <span className="font-medium">Earn 15 points for on-time logging!</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleTaken(dose)}
                          className="flex items-center gap-2 text-lg py-6 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Check className="w-5 h-5" />
                          Taken
                        </Button>
                        <Button
                          onClick={() => handleSnooze(dose)}
                          variant="outline"
                          className="flex items-center gap-2 text-lg py-6 border-2"
                          size="lg"
                        >
                          <Clock className="w-5 h-5" />5 min
                        </Button>
                      </div>

                      <Button
                        onClick={() => handleMissed(dose)}
                        variant="destructive"
                        size="lg"
                        className="w-full text-lg py-6"
                      >
                        Mark as Missed
                      </Button>
                    </>
                  )}

                  {!canLog && (
                    <Button
                      onClick={() => handleDismiss(dose)}
                      variant="outline"
                      size="lg"
                      className="w-full text-lg py-6"
                    >
                      Dismiss
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}
