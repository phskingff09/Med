"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Edit, Trash2 } from "lucide-react"

interface ProfileManagerProps {
  profiles: any[]
  activeProfile: string
  onProfileChange: (profileId: string) => void
  onProfilesUpdate: (profiles: any[]) => void
}

export default function ProfileManager({
  profiles,
  activeProfile,
  onProfileChange,
  onProfilesUpdate,
}: ProfileManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    dateOfBirth: "",
  })

  const relationships = [
    "Self",
    "Spouse/Partner",
    "Child",
    "Parent",
    "Sibling",
    "Grandparent",
    "Grandchild",
    "Other Family",
    "Caregiver",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.relationship) {
      alert("Please fill in all required fields")
      return
    }

    if (editingProfile) {
      // Update existing profile
      const updatedProfiles = profiles.map((profile) =>
        profile.id === editingProfile ? { ...profile, ...formData } : profile,
      )
      onProfilesUpdate(updatedProfiles)
      setEditingProfile(null)
    } else {
      // Add new profile
      const newProfile = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
      }
      onProfilesUpdate([...profiles, newProfile])
    }

    setFormData({ name: "", relationship: "", dateOfBirth: "" })
    setShowForm(false)
  }

  const handleEdit = (profile: any) => {
    setFormData({
      name: profile.name,
      relationship: profile.relationship,
      dateOfBirth: profile.dateOfBirth || "",
    })
    setEditingProfile(profile.id)
    setShowForm(true)
  }

  const handleDelete = (profileId: string) => {
    if (profileId === "default") {
      alert("Cannot delete the default profile")
      return
    }

    if (profileId === activeProfile) {
      alert("Cannot delete the currently active profile")
      return
    }

    if (confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
      const updatedProfiles = profiles.filter((profile) => profile.id !== profileId)
      onProfilesUpdate(updatedProfiles)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profile Management</CardTitle>
            <CardDescription>Manage medication profiles for family members</CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Profile
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => {
              const age = calculateAge(profile.dateOfBirth)
              return (
                <Card
                  key={profile.id}
                  className={`cursor-pointer transition-all ${
                    profile.id === activeProfile ? "ring-2 ring-blue-500 border-blue-500" : "hover:shadow-md"
                  }`}
                  onClick={() => onProfileChange(profile.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold">{profile.name}</h3>
                      </div>
                      {profile.id === activeProfile && <Badge variant="default">Active</Badge>}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Relationship:</strong> {profile.relationship}
                      </p>
                      {age && (
                        <p>
                          <strong>Age:</strong> {age} years old
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(profile)
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {profile.id !== "default" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(profile.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingProfile ? "Edit Profile" : "Add New Profile"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((relationship) => (
                        <SelectItem key={relationship} value={relationship}>
                          {relationship}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingProfile ? "Update Profile" : "Add Profile"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingProfile(null)
                      setFormData({ name: "", relationship: "", dateOfBirth: "" })
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
