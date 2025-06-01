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
  Star,
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
    hasFirstLog: false,
  })
  const [showRewards, setShowRewards] = useState(false)
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [showExportManager, setShowExportManager] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showFirstLogCelebration, setShowFirstLogCelebration] = useState(false)

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
    const medication = medications.find((med) => med.id === log.medicationId)
    if (!medication) return

    const today = new Date().toDateString()
    const todayTakenLogs = doseLogs.filter(
      (existingLog) =>
        existingLog.medicationId === log.medicationId &&
        new Date(existingLog.timestamp).toDateString() === today &&
        existingLog.status === "taken",
    )

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
      const isFirstLog = !prev.hasFirstLog

      // First log bonus
      if (isFirstLog) {
        newPoints += 50
        newAchievements.push("first-log")
        setShowFirstLogCelebration(true)
        setTimeout(() => setShowFirstLogCelebration(false), 3000)
      }

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
        hasFirstLog: true,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary-light rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Loading MedTrack...</h2>
          <p className="text-gray-600 mt-2">Preparing your medication dashboard</p>
        </div>
      </div>
    )
  }

  const activeMedications = medications.filter((med) => med.profileId === activeProfile)
  const activeProfile_obj = profiles.find((p) => p.id === activeProfile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50">
      {/* First Log Celebration */}
      {showFirstLogCelebration && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-3d p-8 max-w-md mx-4 text-center first-log-celebration">
            <div className="w-20 h-20 mx-auto mb-4 gradient-success-solid rounded-full flex items-center justify-center">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 First Log Bonus!</h2>
            <p className="text-gray-600 mb-4">Congratulations on your first dose log! You've earned 50 bonus points.</p>
            <div className="gradient-primary-light p-3 rounded-lg">
              <p className="text-blue-700 font-semibold">+50 Points Earned!</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Refined Header */}
        <div className="mb-8 fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                MedTrack
              </h1>
              <p className="text-lg text-gray-600 font-medium">Medication Adherence Platform</p>
              {user && (
                <p className="text-sm text-gray-500 gradient-primary-light px-3 py-1 rounded-full inline-block">
                  Welcome back, {user.user_metadata?.name || user.email}! ✨
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter upcomingDoses={upcomingDoses} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="btn-primary px-6">
                    <User className="w-4 h-4 mr-2" />
                    <span>{activeProfile_obj?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="card-3d border-0 p-2">
                  <DropdownMenuLabel className="text-gray-700">Profile Management</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem
                    onClick={() => setShowProfileManager(true)}
                    className="rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    Manage Profiles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowRewards(true)}
                    className="rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Trophy className="w-4 h-4 mr-2 text-blue-500" />
                    View Rewards
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Refined Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-3d p-6 group hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Medications</p>
                  <p className="text-3xl font-bold text-gray-800">{activeMedications.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Ready to track</p>
                </div>
                <div className="w-14 h-14 gradient-primary-solid rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Pill className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="card-3d p-6 group hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Today's Doses</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {activeMedications.reduce((sum, med) => sum + med.frequency, 0)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Scheduled</p>
                </div>
                <div className="w-14 h-14 gradient-success-solid rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ListChecks className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="card-3d p-6 group hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Logged Doses</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {doseLogs.filter((log) => log.profileId === activeProfile).length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Total recorded</p>
                </div>
                <div className="w-14 h-14 gradient-primary-light rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-blue-200">
                  <Activity className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div
              className="card-3d p-6 group hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => setShowRewards(true)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Rewards Level</p>
                  <p className="text-3xl font-bold text-gray-800">{rewards.level}</p>
                  <p className="text-xs text-yellow-600 mt-1">{rewards.points} points</p>
                </div>
                <div className="w-14 h-14 gradient-warning-solid rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refined Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 card-3d p-2 bg-white/80 h-12">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all h-8 flex items-center justify-center"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="medications"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all h-8 flex items-center justify-center"
            >
              Medications
            </TabsTrigger>
            <TabsTrigger
              value="logger"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all h-8 flex items-center justify-center"
            >
              Log Doses
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all h-8 flex items-center justify-center"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 scale-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Doses */}
              <Card className="card-3d border-0">
                <CardHeader className="gradient-primary-solid text-white rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    Upcoming Doses
                  </CardTitle>
                  <CardDescription className="text-blue-100">Next scheduled medications</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {upcomingDoses.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingDoses.map((dose, index) => (
                        <div
                          key={index}
                          className="gradient-primary-light p-4 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 gradient-primary-solid rounded-full flex items-center justify-center">
                                <Pill className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{dose.medicationName}</p>
                                <p className="text-sm text-gray-600">{dose.dosage}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-600">
                                {new Date(dose.scheduledTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-xs text-gray-500">
                                in {Math.round(dose.timeUntil / (1000 * 60 * 60))}h{" "}
                                {Math.round((dose.timeUntil % (1000 * 60 * 60)) / (1000 * 60))}m
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 gradient-neutral-light rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                        <Bell className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No upcoming doses scheduled</p>
                      <p className="text-sm text-gray-400">You're all caught up! 🎉</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="card-3d border-0">
                <CardHeader className="gradient-success-solid text-white rounded-t-2xl">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-green-100">Latest dose logs</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {doseLogs
                    .filter((log) => log.profileId === activeProfile)
                    .slice(-5)
                    .reverse().length > 0 ? (
                    <div className="space-y-4">
                      {doseLogs
                        .filter((log) => log.profileId === activeProfile)
                        .slice(-5)
                        .reverse()
                        .map((log) => {
                          const medication = medications.find((med) => med.id === log.medicationId)
                          return (
                            <div
                              key={log.id}
                              className="gradient-success-light p-4 rounded-xl border border-green-200 hover:bg-green-100 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between">
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
                                    <p className="font-semibold text-gray-800">{medication?.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(log.timestamp).toLocaleDateString()} at{" "}
                                      {new Date(log.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className={`${
                                    log.status === "taken"
                                      ? "bg-green-500 text-white border-0"
                                      : log.status === "missed"
                                        ? "bg-red-500 text-white border-0"
                                        : "bg-yellow-500 text-white border-0"
                                  }`}
                                >
                                  {log.status}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 gradient-neutral-light rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                        <Activity className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No dose logs yet</p>
                      <p className="text-sm text-gray-400">Start logging to see your activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="card-3d border-0">
              <CardHeader className="gradient-primary-light rounded-t-2xl border-b border-blue-200">
                <CardTitle className="text-blue-800">Quick Actions</CardTitle>
                <CardDescription className="text-blue-600">Get started with these common tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button
                    onClick={() => setShowMedicationForm(true)}
                    className="h-24 btn-primary flex flex-col gap-3 group"
                  >
                    <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Add Medication</span>
                  </Button>
                  <Button onClick={() => setActiveTab("logger")} className="h-24 btn-light flex flex-col gap-3 group">
                    <Calendar className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Log Dose</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("analytics")}
                    className="h-24 btn-light flex flex-col gap-3 group"
                  >
                    <BarChart3 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="scale-in">
            <Card className="card-3d border-0">
              <CardHeader className="gradient-primary-solid text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Pill className="w-5 h-5" />
                      </div>
                      Medications
                    </CardTitle>
                    <CardDescription className="text-blue-100">Manage your medication regimen</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowMedicationForm(true)}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activeMedications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeMedications.map((medication) => (
                      <Card
                        key={medication.id}
                        className="card-3d border-l-4 border-l-blue-500 hover:scale-105 transition-transform duration-300"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-800">{medication.name}</h3>
                            <Badge className="bg-blue-500 text-white border-0">{medication.category}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3 font-medium">{medication.dosage}</p>
                          <p className="text-sm mb-3">
                            <strong className="text-gray-700">Frequency:</strong> {medication.frequency}x daily
                          </p>
                          <div className="text-sm mb-4">
                            <strong className="text-gray-700">Times:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {medication.times.map((time, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-blue-200 text-blue-600">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {medication.instructions && (
                            <p className="text-xs text-gray-500 gradient-neutral-light p-2 rounded-lg border border-gray-200">
                              {medication.instructions}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 gradient-neutral-light rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                      <Pill className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4 text-lg font-medium">No medications added yet</p>
                    <p className="text-gray-400 mb-6">Start by adding your first medication to begin tracking</p>
                    <Button onClick={() => setShowMedicationForm(true)} className="btn-primary px-8 py-3">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Your First Medication
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logger" className="scale-in">
            <DoseLogger
              medications={activeMedications}
              onLogDose={logDose}
              doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
              rewards={rewards}
            />
          </TabsContent>

          <TabsContent value="analytics" className="scale-in">
            <AnalyticsDashboard
              medications={activeMedications}
              doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
            />

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setShowExportManager(true)} className="btn-primary px-6 py-3">
                <Download className="w-5 h-5 mr-2" />
                Export Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Modals */}
        {showRewards && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card-3d max-w-2xl w-full max-h-[90vh] overflow-y-auto border-0 scale-in">
              <RewardsCenter
                rewards={rewards}
                onClose={() => setShowRewards(false)}
                doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
              />
            </div>
          </div>
        )}

        {showProfileManager && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card-3d max-w-4xl w-full max-h-[90vh] overflow-y-auto border-0 scale-in">
              <ProfileManager
                profiles={profiles}
                activeProfile={activeProfile}
                onProfileChange={(id) => {
                  setActiveProfile(id)
                  setShowProfileManager(false)
                }}
                onProfilesUpdate={setProfiles}
              />
              <div className="p-6 flex justify-end border-t border-gray-200">
                <Button onClick={() => setShowProfileManager(false)} className="btn-light">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showExportManager && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card-3d max-w-4xl w-full max-h-[90vh] overflow-y-auto border-0 scale-in">
              <ExportManager
                medications={activeMedications}
                doseLogs={doseLogs.filter((log) => log.profileId === activeProfile)}
                profileName={activeProfile_obj?.name || "Unknown"}
              />
              <div className="p-6 flex justify-end border-t border-gray-200">
                <Button onClick={() => setShowExportManager(false)} className="btn-light">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showMedicationForm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card-3d max-w-2xl w-full max-h-[90vh] overflow-y-auto border-0 scale-in">
              <MedicationForm onSubmit={addMedication} onCancel={() => setShowMedicationForm(false)} />
            </div>
          </div>
        )}

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
