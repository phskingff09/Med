"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Trophy, Zap, Award } from "lucide-react"

interface RewardsCenterProps {
  rewards: any
  onClose: () => void
  doseLogs: any[]
}

const achievements = {
  "first-log": {
    title: "First Steps",
    description: "Logged your first dose",
    icon: "🎯",
    points: 50,
  },
  "week-streak": {
    title: "Week Warrior",
    description: "7 days in a row",
    icon: "🔥",
    points: 50,
  },
  "month-streak": {
    title: "Monthly Master",
    description: "30 days in a row",
    icon: "🏆",
    points: 100,
  },
  "points-500": {
    title: "Point Collector",
    description: "Earned 500 points",
    icon: "💎",
    points: 0,
  },
  "perfect-week": {
    title: "Perfect Week",
    description: "100% adherence for 7 days",
    icon: "⭐",
    points: 75,
  },
  "early-bird": {
    title: "Early Bird",
    description: "10 on-time doses",
    icon: "🌅",
    points: 25,
  },
}

export default function RewardsCenter({ rewards, onClose, doseLogs }: RewardsCenterProps) {
  const progressToNextLevel = rewards.points % 100
  const pointsNeeded = 100 - progressToNextLevel

  const recentLogs = doseLogs.slice(-10).reverse()
  const onTimeDoses = doseLogs.filter((log) => log.status === "taken" && !log.isLate).length
  const totalTakenDoses = doseLogs.filter((log) => log.status === "taken").length

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-600"
    if (streak >= 14) return "text-blue-600"
    if (streak >= 7) return "text-green-600"
    return "text-gray-600"
  }

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { color: "bg-purple-500", title: "Master" }
    if (level >= 5) return { color: "bg-blue-500", title: "Expert" }
    if (level >= 3) return { color: "bg-green-500", title: "Advanced" }
    return { color: "bg-gray-500", title: "Beginner" }
  }

  const levelBadge = getLevelBadge(rewards.level)

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Rewards Center
          </CardTitle>
          <CardDescription>Track your progress and achievements</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Progress */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 ${levelBadge.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                >
                  {rewards.level}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Level {rewards.level}</h3>
                  <p className="text-sm text-gray-600">{levelBadge.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{rewards.points}</p>
                <p className="text-sm text-gray-600">total points</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {rewards.level + 1}</span>
                <span>{progressToNextLevel}/100</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
              <p className="text-xs text-gray-500 text-center">{pointsNeeded} more points to level up!</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${getStreakColor(rewards.streak)}`}>{rewards.streak}</div>
              <p className="text-xs text-gray-600">Day Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{totalTakenDoses}</div>
              <p className="text-xs text-gray-600">Doses Taken</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{onTimeDoses}</div>
              <p className="text-xs text-gray-600">On-Time Doses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{rewards.achievements.length}</div>
              <p className="text-xs text-gray-600">Achievements</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(achievements).map(([key, achievement]) => {
                const isUnlocked = rewards.achievements.includes(key)
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border ${
                      isUnlocked ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                        {achievement.points > 0 && (
                          <p className="text-xs text-yellow-600">+{achievement.points} points</p>
                        )}
                      </div>
                      {isUnlocked && (
                        <Badge variant="default" className="text-xs">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${log.status === "taken" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <span className="text-sm">{log.status === "taken" ? "Dose taken" : "Dose missed"}</span>
                      {log.isLate && (
                        <Badge variant="outline" className="text-xs">
                          Late
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                      {log.status === "taken" && (
                        <span className="text-xs text-yellow-600">+{log.isLate ? "10" : "15"}pts</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Motivation */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-green-800 mb-2">Keep Going! 🌟</h3>
            <p className="text-sm text-green-700">
              {rewards.streak >= 7
                ? `Amazing ${rewards.streak}-day streak! You're building a great habit.`
                : rewards.streak >= 3
                  ? `Great job! ${rewards.streak} days in a row. Keep it up!`
                  : "Every dose counts. Start building your streak today!"}
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
