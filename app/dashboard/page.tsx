"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Users, Share2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface Session {
  id: string
  name: string
  collaborators: number
  lastModified: string
  preview: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [newSessionName, setNewSessionName] = useState("")
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))

    // Load existing sessions from localStorage
    const savedSessions = localStorage.getItem("sessions")
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions))
    }
  }, [router])

  const createSession = () => {
    if (!newSessionName.trim()) return

    const newSession: Session = {
      id: Date.now().toString(),
      name: newSessionName,
      collaborators: 1,
      lastModified: new Date().toLocaleDateString(),
      preview: "New diagram",
    }

    const updatedSessions = [...sessions, newSession]
    setSessions(updatedSessions)
    localStorage.setItem("sessions", JSON.stringify(updatedSessions))
    setNewSessionName("")

    // Navigate to the editor
    router.push(`/editor/${newSession.id}`)
  }

  const openSession = (sessionId: string) => {
    router.push(`/editor/${sessionId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              DiagramFlow
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Create New Session */}
        <Card className="mb-8 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">Create New Diagram</CardTitle>
            <CardDescription>Start a new collaborative diagram session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter diagram name..."
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createSession()}
                className="border-blue-200 focus:border-blue-400"
              />
              <Button
                onClick={createSession}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Diagrams</h2>
          {sessions.length === 0 ? (
            <Card className="border-blue-200">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">No diagrams yet</h3>
                <p className="text-gray-600 mb-4">Create your first diagram to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => openSession(session.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">{session.name}</CardTitle>
                    <CardDescription>{session.preview}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {session.collaborators} collaborator{session.collaborators !== 1 ? "s" : ""}
                      </div>
                      <span>{session.lastModified}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
