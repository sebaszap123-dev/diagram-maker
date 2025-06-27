"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Plus, X, GripVertical } from "lucide-react"

interface HierarchicalItem {
  id: string
  text: string
  level: number
}

interface HierarchicalEditorProps {
  sessionName: string
  textContent: string
  onContentChange: (content: string) => void
}

export function HierarchicalEditor({ sessionName, textContent, onContentChange }: HierarchicalEditorProps) {
  const [items, setItems] = useState<HierarchicalItem[]>([])
  const [newItemText, setNewItemText] = useState("")

  useEffect(() => {
    // Parse text content into items, with session name as root
    const lines = textContent.split("\n").filter((line) => line.trim())
    const parsedItems: HierarchicalItem[] = []

    // Add session name as root item if we have content
    if (lines.length > 0) {
      parsedItems.push({
        id: "root",
        text: sessionName,
        level: 0,
      })
    }

    lines.forEach((line, index) => {
      const level = line.match(/^\t*/)?.[0]?.length || 0
      const text = line.replace(/^\t*/, "").trim()

      if (text) {
        parsedItems.push({
          id: `item-${index}`,
          text,
          level: level + 1, // Add 1 because session name is level 0
        })
      }
    })

    setItems(parsedItems)
  }, [textContent, sessionName])

  const updateTextContent = (newItems: HierarchicalItem[]) => {
    // Convert items back to text content (excluding root)
    const contentItems = newItems.filter((item) => item.id !== "root")
    const textLines = contentItems.map((item) => {
      const tabs = "\t".repeat(Math.max(0, item.level - 1))
      return tabs + item.text
    })
    onContentChange(textLines.join("\n"))
  }

  const updateItemText = (id: string, newText: string) => {
    const newItems = items.map((item) => (item.id === id ? { ...item, text: newText } : item))
    setItems(newItems)
    updateTextContent(newItems)
  }

  const changeItemLevel = (id: string, levelChange: number) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        const newLevel = Math.max(1, Math.min(5, item.level + levelChange)) // Min level 1 (children of root), max level 5
        return { ...item, level: newLevel }
      }
      return item
    })
    setItems(newItems)
    updateTextContent(newItems)
  }

  const addNewItem = () => {
    if (!newItemText.trim()) return

    const newItem: HierarchicalItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      level: 1, // Start as child of root
    }

    const newItems = [...items, newItem]
    setItems(newItems)
    updateTextContent(newItems)
    setNewItemText("")
  }

  const deleteItem = (id: string) => {
    if (id === "root") return // Can't delete root
    const newItems = items.filter((item) => item.id !== id)
    setItems(newItems)
    updateTextContent(newItems)
  }

  const getIndentColor = (level: number) => {
    const colors = [
      "bg-blue-500", // Level 0 (root)
      "bg-indigo-400", // Level 1
      "bg-violet-400", // Level 2
      "bg-cyan-400", // Level 3
      "bg-emerald-400", // Level 4
      "bg-amber-400", // Level 5
    ]
    return colors[level] || colors[colors.length - 1]
  }

  const getIndentIcon = (level: number) => {
    if (level === 0) return "▣" // Root
    if (level === 1) return "■" // Level 1
    return "●" // Level 2+
  }

  const moveItemUp = (id: string) => {
    const itemIndex = items.findIndex((item) => item.id === id)
    if (itemIndex <= 1) return // Can't move root or first item up

    const newItems = [...items]
    const [movedItem] = newItems.splice(itemIndex, 1)
    newItems.splice(itemIndex - 1, 0, movedItem)

    setItems(newItems)
    updateTextContent(newItems)
  }

  const moveItemDown = (id: string) => {
    const itemIndex = items.findIndex((item) => item.id === id)
    if (itemIndex === -1 || itemIndex >= items.length - 1 || itemIndex === 0) return // Can't move root or last item down

    const newItems = [...items]
    const [movedItem] = newItems.splice(itemIndex, 1)
    newItems.splice(itemIndex + 1, 0, movedItem)

    setItems(newItems)
    updateTextContent(newItems)
  }

  const addChildToItem = (parentId: string) => {
    const parentItem = items.find((item) => item.id === parentId)
    if (!parentItem) return

    const newItem: HierarchicalItem = {
      id: `item-${Date.now()}`,
      text: "New child item",
      level: parentItem.level + 1,
    }

    // Find the position to insert the new child
    const parentIndex = items.findIndex((item) => item.id === parentId)
    const newItems = [...items]
    newItems.splice(parentIndex + 1, 0, newItem)

    setItems(newItems)
    updateTextContent(newItems)
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center group hover:bg-blue-50 rounded-lg p-3 transition-colors border border-transparent hover:border-blue-200"
        >
          {/* Indentation indicators */}
          <div className="flex items-center mr-3" style={{ marginLeft: `${item.level * 20}px` }}>
            {item.level > 0 && (
              <div className="flex items-center mr-3">
                {Array.from({ length: item.level }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    {i === item.level - 1 ? (
                      <div className={`w-3 h-3 rounded-sm ${getIndentColor(i)} mr-2 flex-shrink-0`}>
                        <span className="text-white text-xs font-bold flex items-center justify-center w-full h-full">
                          {getIndentIcon(i)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-px h-6 bg-blue-200 mr-5"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {item.level === 0 && (
              <div
                className={`w-4 h-4 rounded-lg ${getIndentColor(0)} mr-3 flex-shrink-0 flex items-center justify-center`}
              >
                <span className="text-white text-xs font-bold">{getIndentIcon(0)}</span>
              </div>
            )}
          </div>

          {/* Drag handle */}
          <GripVertical className="w-4 h-4 text-gray-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

          {/* Text input */}
          <Input
            value={item.text}
            onChange={(e) => updateItemText(item.id, e.target.value)}
            className="flex-1 border-none bg-transparent focus:bg-white focus:border-blue-300 font-medium text-gray-800"
            placeholder="Enter text..."
            disabled={item.id === "root"} // Root item (session name) is not editable here
          />

          {/* Controls */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.id !== "root" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItemUp(item.id)}
                  disabled={index <= 1}
                  title="Move up"
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItemDown(item.id)}
                  disabled={index >= items.length - 1}
                  title="Move down"
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addChildToItem(item.id)}
                  title="Add child"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeItemLevel(item.id, -1)}
                  disabled={item.level <= 1}
                  title="Decrease indentation"
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeItemLevel(item.id, 1)}
                  disabled={item.level >= 5}
                  title="Increase indentation"
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteItem(item.id)}
                  title="Delete item"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Add new item */}
      <div className="flex items-center p-3 border-2 border-dashed border-blue-200 rounded-lg hover:border-blue-300 transition-colors">
        <div className="flex items-center mr-3 ml-5">
          <div className="w-3 h-3 rounded-sm bg-indigo-400 mr-2 flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">■</span>
          </div>
        </div>
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              addNewItem()
            }
          }}
          placeholder="Add new item..."
          className="flex-1 border-none bg-transparent focus:bg-white focus:border-blue-300"
        />
        <Button
          onClick={addNewItem}
          disabled={!newItemText.trim()}
          size="sm"
          className="ml-2 bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Updated Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="font-semibold text-gray-800 mb-2">Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Click on any text to edit it directly</li>
          <li>Use ↑ ↓ buttons to reorder items</li>
          <li>Use + button to add children to any item</li>
          <li>Use ← → buttons to change indentation</li>
          <li>
            Use <X className="inline w-3 h-3" /> button to delete items
          </li>
          <li>Press Enter in the "Add new item" field to quickly add items</li>
          <li>Your session name appears as the root node in the diagram</li>
          <li>Switch to "View Diagram" to see the visual representation</li>
        </ul>
      </div>
    </div>
  )
}
