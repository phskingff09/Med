"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Calendar,
  BarChart3,
  Bell,
  User,
  LogOut,
  Download,
  Loader2,
  Pill,
  ListChecks,
  Activity,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MedicationForm from "@/components/medication-form"
import DoseLogger from "@/components/dose-logger"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import ProfileManager from "@/components/profile-manager"
import ExportManager from "@/components/export-manager"
import NotificationCenter from "@/components/notification-center"
import RewardsCenter from "@/components/rewards-center"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
// Add these imports at the top
import DoseNotificationPopup from "@/components/dose-notification-popup"

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: number
  times: string[]
  category: string
  profileId: string
  startDate: string
  endDate?: string
  instructions?: string
}

interface DoseLog {
  id: string
  medicationId: string
  profileId: string
  scheduledTime: string
  actualTime?: string
  status: "taken" | "missed" | "skipped"
  notes?: string
  timestamp: string
  isLate?: boolean
  minutesLate?: number
}

interface Profile {
  id: string
  name: string
  relationship: string
  dateOfBirth?: string
  isActive: boolean
}

export default function MedTrackDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [medications, setMedications] = useState<Medication[]>([])
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([
    { id: "default", name: "My Profile", relationship: "Self", isActive: true },
  ])
  const [activeProfile, setActiveProfile] = useState("default")
  const [showMedicationForm, setShowMedicationForm] = useState(false)
  const [upcomingDoses, setUpcomingDoses] = useState<any[]>([])
  const [rewards, setRewards] = useState({
    points: 0,
    streak: 0,
    level: 1,
    achievements: [],
    lastLogDate: null,
  })
  const [showRewards, setShowRewards] = useState(false)
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [showExportManager, setShowExportManager] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/")
          return
        }
        setUser(session.user)

        // Update default profile with user's name
        if (session.user.user_metadata?.name) {
          setProfiles((prev) =>
            prev.map((profile) =>
              profile.id === "default" ? { ...profile, name: session.user.user_metadata.name } : profile,
            ),
          )
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/")
        return
      }
      setUser(session.user)
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Load data from localStorage on mount
  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    const savedMedications = localStorage.getItem(`medtrack-medications-${userId}`)
    const savedDoseLogs = localStorage.getItem(`medtrack-dose-logs-${userId}`)
    const savedProfiles = localStorage.getItem(`medtrack-profiles-${userId}`)
    const savedRewards = localStorage.getItem(`medtrack-rewards-${userId}`)

    if (savedMedications) {
      setMedications(JSON.parse(savedMedications))
    }
    if (savedDoseLogs) {
      setDoseLogs(JSON.parse(savedDoseLogs))
    }
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles))
    }
    if (savedRewards) {
      setRewards(JSON.parse(savedRewards))
    }
  }, [user])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    localStorage.setItem(`medtrack-medications-${userId}`, JSON.stringify(medications))
  }, [medications, user])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    localStorage.setItem(`medtrack-dose-logs-${userId}`, JSON.stringify(doseLogs))
  }, [doseLogs, user])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    localStorage.setItem(`medtrack-profiles-${userId}`, JSON.stringify(profiles))
  }, [profiles, user])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    localStorage.setItem(`medtrack-rewards-${userId}`, JSON.stringify(rewards))
  }, [rewards, user])

  // Calculate upcoming doses
  useEffect(() => {
    const now = new Date()
    const upcoming = medications
      .filter((med) => med.profileId === activeProfile)
      .flatMap((med) => {
        return med.times.map((time) => {
          const [hours, minutes] = time.split(":").map(Number)
          const doseTime = new Date()
          doseTime.setHours(hours, minutes, 0, 0)

          // If time has passed today, schedule for tomorrow
          if (doseTime <= now) {
            doseTime.setDate(doseTime.getDate() + 1)
          }

          return {
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: doseTime.toISOString(),
            timeUntil: doseTime.getTime() - now.getTime(),
          }
        })
      })
      .sort((a, b) => a.timeUntil - b.timeUntil)
      .slice(0, 5)

    setUpcomingDoses(upcoming)
  }, [medications, activeProfile])

  const addMedication = (medication: Omit<Medication, "id">) => {
    const newMedication = {
      ...medication,
      id: Date.now().toString(),
      profileId: activeProfile,
    }
    setMedications((prev) => [...prev, newMedication])
    setShowMedicationForm(false)
  }

  const logDose = (log: Omit<DoseLog, "id" | "timestamp">) => {
    // Check if user can still log more doses for this medication today
    const medication = medications.find((med) => med.id === log.medicationId)
    if (!medication) return

    const today = new Date().toDateString()
    const todayTakenLogs = doseLogs.filter(
      (existingLog) =>
        existingLog.medicationId === log.medicationId &&
        new Date(existingLog.timestamp).toDateString() === today &&
        existingLog.status === "taken",
    )

    // Prevent logging more "taken" doses than scheduled
    if (log.status === "taken" && todayTakenLogs.length >= medication.frequency) {
      alert(`You've already logged all ${medication.frequency} doses for ${medication.name} today.`)
      return
    }

    const newLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      profileId: activeProfile,
    }
    setDoseLogs((prev) => [...prev, newLog])

    // Calculate rewards for taken doses
    if (log.status === "taken") {
      calculateRewards(newLog)
    }
  }

  const calculateRewards = (log: DoseLog) => {
    setRewards((prev) => {
      const today = new Date().toDateString()
      const logDate = new Date(log.timestamp).toDateString()

      let newPoints = prev.points
      let newStreak = prev.streak
      const newAchievements = [...prev.achievements]

      // Base points for taking medication
      newPoints += 10

      // Bonus points for on-time doses
      if (!log.isLate) {
        newPoints += 5
      }

      // Streak calculation
      if (prev.lastLogDate !== logDate) {
        if (prev.lastLogDate === new Date(Date.now() - 86400000).toDateString()) {
          newStreak += 1
        } else {
          newStreak = 1
        }
      }

      // Streak bonus points
      if (newStreak >= 7) newPoints += 20
      if (newStreak >= 30) newPoints += 50

      // Level calculation
      const newLevel = Math.floor(newPoints / 100) + 1

      // Achievement checks
      if (newStreak === 7 && !newAchievements.includes("week-streak")) {
        newAchievements.push("week-streak")
        newPoints += 50
      }
      if (newStreak === 30 && !newAchievements.includes("month-streak")) {
        newAchievements.push("month-streak")
        newPoints += 100
      }
      if (newPoints >= 500 && !newAchievements.includes("points-500")) {
        newAchievements.push("points-500")
      }

      return {
        points: newPoints,
        streak: newStreak,
        level: newLevel,
        achievements: newAchievements,
        lastLogDate: logDate,
      }
    })
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800">Loading MedTrack...</h2>
          <p className="text-gray-600 mt-2">Preparing your medication dashboard</p>
        </div>
      </div>
    )
  }

  const activeMedications = medications.filter((med) => med.profileId === activeProfile)
  const activeProfile_obj = profiles.find((p) => p.id === activeProfile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">MedTrack</h1>
              <p className="text-gray-600">Medication Adherence & Analytics Platform</p>
              {user && (
                <p className="text-sm text-gray-500 mt-1">Welcome back, {user.user_metadata?.name || user.email}!</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter upcomingDoses={upcomingDoses} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{activeProfile_obj?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Profile Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileManager(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Manage Profiles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRewards(true)}>
                    <span className="mr-2">🏆</span>
                    View Rewards
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Medications</p>
                    <p className="text-2xl font-bold">{activeMedications.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
                    <Pill className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Doses</p>
                    <p className="text-2xl font-bold">
                      {activeMedications.reduce((sum, med) => sum + med.frequency, 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                    <ListChecks className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Logged Doses</p>
                    <p className="text-2xl font-bold">
                      {doseLogs.filter((log) => log.profileId === activeProfile).length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shadow-inner">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => setShowRewards(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rewards Level</p>
                    <p className="text-2xl font-bold">{rewards.level}</p>
                    <p className="text-xs text-gray-500">{rewards.points} points</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shadow-inner">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="logger">Log Doses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Doses */}
              <Card className="shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Upcoming Doses
                  </CardTitle>
                  <CardDescription>Next scheduled medications</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingDoses.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingDoses.map((dose, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{dose.medicationName}</p>
                            <p className="text-sm text-gray-600">{dose.dosage}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {new Date(dose.scheduledTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round(dose.timeUntil / (1000 * 60 * 60))}h{" "}
                              {Math.round((dose.timeUntil % (1000 * 60 * 60)) / (1000 * 60))}m
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No upcoming doses scheduled</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest dose logs</CardDescription>
                </CardHeader>
                <CardContent>
                  {doseLogs
                    .filter((log) => log.profileId === activeProfile)
                    .slice(-5)
                    .reverse().length > 0 ? (
                    <div className="space-y-3">
                      {doseLogs
                        .filter((log) => log.profileId === activeProfile)
                        .slice(-5)
                        .reverse()
                        .map((log) => {
                          const medication = medications.find((med) => med.id === log.medicationId)
                          return (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{medication?.name}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(log.timestamp).toLocaleDateString()} at{" "}
                                  {new Date(log.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  log.status === "taken"
                                    ? "default"
                                    : log.status === "missed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {log.status}
                              </Badge>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No dose logs yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => setShowMedicationForm(true)} className="h-20 flex flex-col gap-2">
                    <Plus className="w-6 h-6" />
                    Add Medication
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("logger")} className="h-20 flex flex-col gap-2">
                    <Calendar className="w-6 h-6" />
                    Log Dose
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("analytics")}
                    className="h-20 flex flex-col gap-2"
                  >
                    <BarChart3 className="w-6 h-6" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications">
            <Card className="shadow-md border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Medications</CardTitle>
                  <CardDescription>Manage your medication regimen</CardDescription>
                </div>
                <Button onClick={() => setShowMedicationForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </CardHeader>
              <CardContent>
                {activeMedications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeMedications.map((medication) => (
                      <Card key={medication.id} className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{medication.name}</h3>
                            <Badge variant="secondary">{medication.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{medication.dosage}</p>
                          <p className="text-sm mb-2">
                            <strong>Frequency:</strong> {medication.frequency}x daily
                          </p>
                          <div className="text-sm">
                            <strong>Times:</strong> {medication.times.join(", ")}
                          </div>
                          {medication.instructions && (
                            <p className="text-xs text-gray-500 mt-2">{medication.instructions}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No medications added yet</p>
                    <Button onClick={() => setShowMedicationForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Medication
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logger">
            <DoseLogger
              medications={activeMedications}
              onLogDose={logDose}
              doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
              rewards={rewards}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard
              medications={activeMedications}
              doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
            />

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowExportManager(true)} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showRewards && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200">
              <RewardsCenter
                rewards={rewards}
                onClose={() => setShowRewards(false)}
                doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
              />
            </div>
          </div>
        )}

        {showProfileManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200">
              <ProfileManager
                profiles={profiles}
                activeProfile={activeProfile}
                onProfileChange={(id) => {
                  setActiveProfile(id)
                  setShowProfileManager(false)
                }}
                onProfilesUpdate={setProfiles}
              />
              <div className="p-4 flex justify-end">
                <Button variant="outline" onClick={() => setShowProfileManager(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showExportManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200">
              <ExportManager
                medications={activeMedications}
                doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
                profileName={activeProfile_obj?.name || "Unknown"}
              />
              <div className="p-4 flex justify-end">
                <Button variant="outline" onClick={() => setShowExportManager(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showMedicationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200">
              <MedicationForm onSubmit={addMedication} onCancel={() => setShowMedicationForm(false)} />
            </div>
          </div>
        )}

        {/* Dose Notification Popup */}
        <DoseNotificationPopup
          onLogDose={(medicationId, status) => {
            const medication = medications.find((med) => med.id === medicationId)
            if (medication) {
              logDose({
                medicationId,
                scheduledTime: new Date().toISOString(),
                actualTime: status === "taken" ? new Date().toISOString() : undefined,
                status,
                isLate: false,
                minutesLate: 0,
              })
            }
          }}
          medications={medications}
          doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
        />
      </div>
    </div>
  )
}
