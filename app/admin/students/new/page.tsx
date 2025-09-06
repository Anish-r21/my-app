"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, UserPlus, Save, X, Copy, Eye, EyeOff, Mail } from "lucide-react"
import type { ApiResponse, User } from "@/types/database"

export default function CreateStudentPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{ user: User; tempPassword?: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [generatePassword, setGeneratePassword] = useState(true)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(null)

    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        setError("Name and email are required")
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address")
        return
      }

      const requestBody = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(generatePassword ? {} : { password: formData.password })
      }

      const response = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      const result: ApiResponse<{ user: User; tempPassword?: string }> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create student")
      }

      setSuccess(result.data!)
    } catch (err) {
      console.error("Create student error:", err)
      setError(err instanceof Error ? err.message : "Failed to create student")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleCreateAnother = () => {
    setFormData({ name: "", email: "", password: "" })
    setSuccess(null)
    setError("")
  }

  const isFormValid =
    formData.name.trim() && formData.email.trim() && (generatePassword || formData.password)

  if (success) {
    const studentEmail = success.user.email
    const tempPassword = success.tempPassword

    // Email subject & body
    const subject = `Registration on LearnHub`
    const body = `Hello ${success.user.name},

You have been successfully registered on LearnHub.

Here are your login credentials:

Email: ${studentEmail}
Password: ${tempPassword}

Please login and start exploring the courses.

Best regards,
LearnHub Team`

    const mailtoLink = `mailto:${studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <header className="bg-white border-b border-[var(--ui-card-border)] shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Student Created Successfully</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Student Account Created</CardTitle>
              <CardDescription>
                Share these login credentials with the student.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="font-medium">{success.user.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="font-medium">{success.user.email}</p>
              </div>
              {success.tempPassword && (
                <div>
                  <Label>Temporary Password</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono">{success.tempPassword}</p>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(success.tempPassword!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-4">
                <Button onClick={handleCreateAnother}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Another
                </Button>
                <Button variant="outline" onClick={() => router.push("/admin")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
                {success.tempPassword && (
                  <a href={mailtoLink}>
                    <Button variant="secondary">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="bg-white border-b border-[var(--ui-card-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Create New Student</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Student Account</CardTitle>
            <CardDescription>Fill in the details to create a new student.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              {!generatePassword && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => handleInputChange("password", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!isFormValid || isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Creating..." : "Create Student"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGeneratePassword(p => !p)}
                >
                  {generatePassword ? (
                    <>
                      <X className="mr-2 h-4 w-4" /> Use Custom Password
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Generate Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
