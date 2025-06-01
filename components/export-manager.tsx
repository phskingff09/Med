"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileText, Table } from "lucide-react"
import { useState } from "react"

interface ExportManagerProps {
  medications: any[]
  doseLogs: any[]
  profileName: string
}

export default function ExportManager({ medications, doseLogs, profileName }: ExportManagerProps) {
  const [exportType, setExportType] = useState("all")
  const [dateRange, setDateRange] = useState("30")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const getFilteredData = () => {
    let filteredLogs = [...doseLogs]

    // Filter by date range
    if (dateRange === "custom" && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      filteredLogs = filteredLogs.filter((log) => {
        const logDate = new Date(log.timestamp)
        return logDate >= start && logDate <= end
      })
    } else if (dateRange !== "all") {
      const days = Number.parseInt(dateRange)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) >= cutoffDate)
    }

    return filteredLogs
  }

  const exportToPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import("jspdf")).default

      const doc = new jsPDF()
      const filteredLogs = getFilteredData()

      // Header
      doc.setFontSize(20)
      doc.text("MedTrack - Medication Report", 20, 20)

      doc.setFontSize(12)
      doc.text(`Profile: ${profileName}`, 20, 35)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45)
      doc.text(
        `Period: ${dateRange === "all" ? "All time" : dateRange === "custom" ? `${startDate} to ${endDate}` : `Last ${dateRange} days`}`,
        20,
        55,
      )

      // Summary Statistics
      doc.setFontSize(16)
      doc.text("Summary", 20, 75)

      const totalLogs = filteredLogs.length
      const takenLogs = filteredLogs.filter((log) => log.status === "taken").length
      const missedLogs = filteredLogs.filter((log) => log.status === "missed").length
      const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0

      doc.setFontSize(12)
      doc.text(`Total Medications: ${medications.length}`, 20, 90)
      doc.text(`Total Dose Logs: ${totalLogs}`, 20, 100)
      doc.text(`Doses Taken: ${takenLogs}`, 20, 110)
      doc.text(`Doses Missed: ${missedLogs}`, 20, 120)
      doc.text(`Adherence Rate: ${adherenceRate}%`, 20, 130)

      // Medications List
      doc.setFontSize(16)
      doc.text("Active Medications", 20, 150)

      let yPos = 165
      doc.setFontSize(10)
      medications.forEach((med, index) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(`${index + 1}. ${med.name} - ${med.dosage} (${med.frequency}x daily)`, 20, yPos)
        doc.text(`   Category: ${med.category}`, 25, yPos + 8)
        doc.text(`   Times: ${med.times.join(", ")}`, 25, yPos + 16)
        yPos += 25
      })

      // Recent Logs
      if (filteredLogs.length > 0) {
        doc.addPage()
        doc.setFontSize(16)
        doc.text("Recent Dose Logs", 20, 20)

        yPos = 35
        doc.setFontSize(10)

        filteredLogs.slice(-20).forEach((log) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          const medication = medications.find((med) => med.id === log.medicationId)
          const logDate = new Date(log.timestamp)

          doc.text(`${logDate.toLocaleDateString()} ${logDate.toLocaleTimeString()}`, 20, yPos)
          doc.text(`${medication?.name || "Unknown"} - ${log.status.toUpperCase()}`, 20, yPos + 8)
          if (log.notes) {
            doc.text(`Notes: ${log.notes}`, 25, yPos + 16)
            yPos += 24
          } else {
            yPos += 16
          }
        })
      }

      doc.save(`medtrack-report-${profileName}-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    }
  }

  const exportToCSV = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const Papa = (await import("papaparse")).default

      const filteredLogs = getFilteredData()

      // Prepare CSV data
      const csvData = filteredLogs.map((log) => {
        const medication = medications.find((med) => med.id === log.medicationId)
        return {
          Date: new Date(log.timestamp).toLocaleDateString(),
          Time: new Date(log.timestamp).toLocaleTimeString(),
          Medication: medication?.name || "Unknown",
          Dosage: medication?.dosage || "",
          Category: medication?.category || "",
          Status: log.status,
          "Scheduled Time": log.scheduledTime ? new Date(log.scheduledTime).toLocaleTimeString() : "",
          "Actual Time": log.actualTime ? new Date(log.actualTime).toLocaleTimeString() : "",
          Notes: log.notes || "",
        }
      })

      // Add summary row
      const totalLogs = filteredLogs.length
      const takenLogs = filteredLogs.filter((log) => log.status === "taken").length
      const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0

      csvData.unshift({
        Date: "SUMMARY",
        Time: "",
        Medication: `Total Medications: ${medications.length}`,
        Dosage: `Total Logs: ${totalLogs}`,
        Category: `Taken: ${takenLogs}`,
        Status: `Adherence: ${adherenceRate}%`,
        "Scheduled Time": "",
        "Actual Time": "",
        Notes: `Profile: ${profileName}`,
      })

      csvData.unshift({
        Date: "",
        Time: "",
        Medication: "",
        Dosage: "",
        Category: "",
        Status: "",
        "Scheduled Time": "",
        "Actual Time": "",
        Notes: "",
      })

      const csv = Papa.unparse(csvData)

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `medtrack-data-${profileName}-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error generating CSV:", error)
      alert("Error generating CSV. Please try again.")
    }
  }

  const filteredLogs = getFilteredData()
  const totalLogs = filteredLogs.length
  const takenLogs = filteredLogs.filter((log) => log.status === "taken").length
  const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Export your medication data and adherence reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exportType">Export Type</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select export type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="logs">Dose Logs Only</SelectItem>
                  <SelectItem value="medications">Medications Only</SelectItem>
                  <SelectItem value="summary">Summary Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Preview Stats */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Export Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Medications</p>
                  <p className="font-semibold">{medications.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dose Logs</p>
                  <p className="font-semibold">{totalLogs}</p>
                </div>
                <div>
                  <p className="text-gray-600">Doses Taken</p>
                  <p className="font-semibold">{takenLogs}</p>
                </div>
                <div>
                  <p className="text-gray-600">Adherence Rate</p>
                  <p className="font-semibold">{adherenceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={exportToPDF} className="h-auto py-6 flex flex-col items-center justify-center">
              <FileText className="w-6 h-6 mb-2" />
              <span className="text-base font-medium">Export as PDF</span>
              <span className="text-xs opacity-75 mt-1">Comprehensive report with charts</span>
            </Button>

            <Button
              onClick={exportToCSV}
              variant="outline"
              className="h-auto py-6 flex flex-col items-center justify-center"
            >
              <Table className="w-6 h-6 mb-2" />
              <span className="text-base font-medium">Export as CSV</span>
              <span className="text-xs opacity-75 mt-1">Raw data for analysis</span>
            </Button>
          </div>

          {/* Export Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Export Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • <strong>PDF:</strong> Includes summary statistics, medication list, and recent dose logs
                </li>
                <li>
                  • <strong>CSV:</strong> Raw data that can be opened in Excel or other spreadsheet applications
                </li>
                <li>
                  • <strong>Healthcare Sharing:</strong> Both formats are suitable for sharing with healthcare providers
                </li>
                <li>
                  • <strong>Data Privacy:</strong> All exports are generated locally and never sent to external servers
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
