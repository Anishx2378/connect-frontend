"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { useStore } from "@/store/useStore"
import api from "@/lib/api"
import { Loader2, CheckCircle2 } from "lucide-react"

export default function SettingsPage() {
  const { user, setUser } = useStore()

  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [designation, setDesignation] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Populate form fields from logged-in user on mount / when user changes
  React.useEffect(() => {
    if (!user) return
    const parts = user.name?.split(" ") || []
    setFirstName(parts[0] || "")
    setLastName(parts.slice(1).join(" ") || "")
    setEmail(user.email || "")
    setDesignation(user.designation || "")
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB")
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError("")
    }
  }

  const handleSave = async () => {
    if (!user) return
    setError("")
    setSaved(false)
    setSaving(true)
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")
      
      const formData = new FormData()
      formData.append("name", fullName)
      formData.append("email", email.trim())
      formData.append("designation", designation.trim())
      if (selectedFile) {
        formData.append("avatar", selectedFile)
      }

      const res = await api.patch(`/users/${user.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      const updated = res.data.data
      setUser({ ...user, name: updated.name ?? fullName, email: updated.email ?? email, designation: updated.designation ?? designation, avatar: updated.avatar })
      setSaved(true)
      setSelectedFile(null)
      setPreviewUrl(null)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=random&size=128`
  const initials = (user?.name || "U").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and profile.</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your photo and personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Row */}
          <div className="flex items-center gap-6">
            <Avatar size="lg" fallback={initials} src={previewUrl || avatarSrc} className="h-20 w-20 text-2xl" />
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Change Photo
              </Button>
              <p className="text-xs text-slate-500">JPG, GIF or PNG. 2MB max.</p>
            </div>
          </div>

          {/* Name + Email Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">First Name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Last Name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Designation / Job Title</label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
          </div>

          {/* Role badge */}
          {user?.role && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Role:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {user.role === "ADMIN" ? "Admin" : "Member"}
              </span>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">{error}</p>
          )}
          {saved && (
            <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2">
              <CheckCircle2 size={16} /> Profile updated successfully!
            </p>
          )}
        </CardContent>

        <CardFooter className="flex justify-end border-t border-slate-100 mt-2 pt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin mr-2" />Saving…</> : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
