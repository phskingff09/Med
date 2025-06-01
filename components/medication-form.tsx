"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Minus } from "lucide-react"

interface MedicationFormProps {
  onSubmit: (medication: any) => void
  onCancel: () => void
}

const categories = ["Prescription", "Over-the-Counter", "Vitamin/Supplement", "Herbal", "Emergency", "As Needed"]

export default function MedicationForm({ onSubmit, onCancel }: MedicationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: 1,
    times: ["08:00"],
    category: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    instructions: "",
  })

  const handleFrequencyChange = (newFrequency: number) => {
    const currentTimes = [...formData.times]

    if (newFrequency > currentTimes.length) {
      // Add more times
      const defaultTimes = ["08:00", "12:00", "18:00", "22:00"]
      while (currentTimes.length < newFrequency) {
        currentTimes.push(defaultTimes[currentTimes.length] || "08:00")
      }
    } else if (newFrequency < currentTimes.length) {
      // Remove excess times
      currentTimes.splice(newFrequency)
    }

    setFormData((prev) => ({
      ...prev,
      frequency: newFrequency,
      times: currentTimes,
    }))
  }

  const updateTime = (index: number, time: string) => {
    const newTimes = [...formData.times]
    newTimes[index] = time
    setFormData((prev) => ({ ...prev, times: newTimes }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.dosage || !formData.category) {
      alert("Please fill in all required fields")
      return
    }
    onSubmit(formData)
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add New Medication</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lisinopril"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData((prev) => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 10mg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Daily Frequency</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleFrequencyChange(Math.max(1, formData.frequency - 1))}
                  disabled={formData.frequency <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{formData.frequency}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleFrequencyChange(Math.min(4, formData.frequency + 1))}
                  disabled={formData.frequency >= 4}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dose Times</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {formData.times.map((time, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs">Dose {index + 1}</Label>
                  <Input type="time" value={time} onChange={(e) => updateTime(index, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
              placeholder="e.g., Take with food, Avoid alcohol"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Add Medication
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
