"use client"

import { useState, useEffect, useRef, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Share2, Users, Eye, Edit3, ArrowLeft, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { DiagramView } from "@/components/diagram-view"
import { HierarchicalEditor } from "@/components/hierarchical-editor"

interface ListItem {
  id: string
  text: string
  level: number
  children: ListItem[]
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<any>(null)
  const [sessionName, setSessionName] = useState("Untitled Diagram")
  const [activeTab, setActiveTab] = useState("edit")
  const [textContent, setTextContent] = useState("")
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Unwrap the params Promise
  const { id } = use(params)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))

    // Load session data
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]")
    const session = sessions.find((s: any) => s.id === id)
    if (session) {
      setSessionName(session.name)
      const savedContent = localStorage.getItem(`session-${id}`)
      if (savedContent) {
        setTextContent(savedContent)
        parseTextToList(savedContent)
      }
    }
  }, [id, router])

  const parseTextToList = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    const items: ListItem[] = []
    const stack: ListItem[] = []

    lines.forEach((line, index) => {
      const level = line.match(/^\t*/)?.[0]?.length || 0
      const text = line.replace(/^\t*/, "").trim()

      if (!text) return

      const item: ListItem = {
        id: `item-${index}`,
        text,
        level,
        children: [],
      }

      // Remove items from stack that are at same or deeper level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop()
      }

      if (stack.length === 0) {
        items.push(item)
      } else {
        stack[stack.length - 1].children.push(item)
      }

      stack.push(item)
    })

    setListItems(items)
  }

  const handleTextChange = (value: string) => {
    setTextContent(value)
    parseTextToList(value)
    localStorage.setItem(`session-${id}`, value)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{sessionName}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>1 collaborator</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Live
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="edit" className="flex items-center">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Notes
            </TabsTrigger>
            <TabsTrigger value="diagram" className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              View Diagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-800 flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3"></div>
                      Hierarchical Notes
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Create your mind map structure</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <HierarchicalEditor
                  sessionName={sessionName}
                  textContent={textContent}
                  onContentChange={handleTextChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagram" className="space-y-6">
            <DiagramView items={listItems} sessionName={sessionName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
