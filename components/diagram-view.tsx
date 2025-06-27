"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZoomIn, ZoomOut, RotateCcw, Palette, Settings } from "lucide-react"

interface ListItem {
  id: string
  text: string
  level: number
  children: ListItem[]
}

interface DiagramNode {
  id: string
  text: string
  x: number
  y: number
  level: number
  children: string[]
  parent?: string
}

interface DiagramViewProps {
  items: ListItem[]
  sessionName: string
}

export function DiagramView({ items, sessionName }: DiagramViewProps) {
  const [nodes, setNodes] = useState<DiagramNode[]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [connectionStyle, setConnectionStyle] = useState<"normal" | "brackets">("brackets")
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal")
  const svgRef = useRef<SVGSVGElement>(null)

  const colors = [
    "#3B82F6", // blue-500
    "#6366F1", // indigo-500
    "#8B5CF6", // violet-500
    "#06B6D4", // cyan-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
  ]

  useEffect(() => {
    if (items.length === 0) {
      setNodes([])
      return
    }

    const newNodes: DiagramNode[] = []
    const isHorizontal = orientation === "horizontal"

    // Recursive function to count total nodes in a tree
    const countTotalNodes = (items: ListItem[]): number => {
      let count = items.length
      items.forEach((item) => {
        count += countTotalNodes(item.children)
      })
      return count
    }

    // Recursive function to process items at any depth
    const processItemsRecursively = (
      items: ListItem[],
      level: number,
      startX: number,
      startY: number,
      parentId?: string,
    ) => {
      if (items.length === 0) return startY

      const levelSpacing = (isHorizontal ? 280 : 200)
      const maxDescendants = Math.max(...items.map(item => countTotalNodes(item.children)), 1)
      const nodeSpacing = Math.max(80, 80 * maxDescendants)
      

      let currentY = startY
      const totalHeight = (items.length - 1) * nodeSpacing
      currentY = startY - totalHeight / 2

      items.forEach((item, index) => {
        const nodeId = `${item.id}-${level}-${index}`

        const node: DiagramNode = {
          id: nodeId,
          text: item.text,
          x: isHorizontal ? startX + level * levelSpacing : currentY,
          y: isHorizontal ? currentY : startX + level * levelSpacing,
          level,
          children: [],
          parent: parentId,
        }

        newNodes.push(node)

        // Add to parent's children
        if (parentId) {
          const parentNode = newNodes.find((n) => n.id === parentId)
          if (parentNode) {
            parentNode.children.push(nodeId)
          }
        }

        // Process children recursively
        if (item.children.length > 0) {
          const childrenHeight = item.children.length * nodeSpacing
          const childStartY = currentY
          processItemsRecursively(item.children, level + 1, isHorizontal ? startX : startX, childStartY, nodeId)
        }

        currentY += nodeSpacing
      })

      return currentY
    }

    // Add root node and process all items
    if (items.length > 0 && sessionName) {
      const rootNode: DiagramNode = {
        id: "root",
        text: sessionName,
        x: 0,
        y: 0,
        level: 0,
        children: [],
      }
      newNodes.push(rootNode)

      // Process all items as children of root
      items.forEach((item, index) => {
        const nodeId = `${item.id}-1-${index}`

        const totalChildren = countTotalNodes(item.children)
        const spacing = Math.max(100, 100 * totalChildren)

        const totalHeight = (items.length - 1) * spacing
        const startY = -totalHeight / 2 + index * spacing

        const node: DiagramNode = {
          id: nodeId,
          text: item.text,
          x: isHorizontal ? 280 : startY,
          y: isHorizontal ? startY : 280,
          level: 1,
          children: [],
          parent: "root",
        }

        newNodes.push(node)
        rootNode.children.push(nodeId)

        // Process children recursively
        if (item.children.length > 0) {
          processItemsRecursively(item.children, 2, isHorizontal ? 0 : 0, startY, nodeId)
        }
      })
    }

    setNodes(newNodes)
  }, [items, sessionName, orientation])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.3))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const getNodeColor = (level: number) => {
    return colors[level % colors.length]
  }

  const renderBracketConnections = () => {
    return nodes.flatMap((node) =>
      node.children.map((childId) => {
        const childNode = nodes.find((n) => n.id === childId)
        if (!childNode) return null

        const isHorizontal = orientation === "horizontal"
        const nodeWidth = Math.max(120, node.text.length * 8 + 40)
        const nodeHeight = 60

        if (isHorizontal) {
          const startX = node.x + nodeWidth
          const startY = node.y + nodeHeight / 2
          const endX = childNode.x
          const endY = childNode.y + nodeHeight / 2
          const midX = startX + (endX - startX) / 2

          // Create bracket-style connection
          const pathData = `M ${startX} ${startY} 
                         L ${midX} ${startY}
                         L ${midX} ${endY}
                         L ${endX} ${endY}`

          return (
            <g key={`${node.id}-${childId}`}>
              <path
                d={pathData}
                stroke={getNodeColor(node.level)}
                strokeWidth="2"
                fill="none"
                opacity="0.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={startX} cy={startY} r="2" fill={getNodeColor(node.level)} />
              <circle cx={endX} cy={endY} r="2" fill={getNodeColor(node.level)} />
            </g>
          )
        } else {
          // Vertical orientation
          const startX = node.x + nodeWidth / 2
          const startY = node.y + nodeHeight
          const endX = childNode.x + nodeWidth / 2
          const endY = childNode.y
          const midY = startY + (endY - startY) / 2

          const pathData = `M ${startX} ${startY} 
                         L ${startX} ${midY}
                         L ${endX} ${midY}
                         L ${endX} ${endY}`

          return (
            <g key={`${node.id}-${childId}`}>
              <path
                d={pathData}
                stroke={getNodeColor(node.level)}
                strokeWidth="2"
                fill="none"
                opacity="0.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={startX} cy={startY} r="2" fill={getNodeColor(node.level)} />
              <circle cx={endX} cy={endY} r="2" fill={getNodeColor(node.level)} />
            </g>
          )
        }
      }),
    )
  }

  const renderNormalConnections = () => {
    return nodes.flatMap((node) =>
      node.children.map((childId) => {
        const childNode = nodes.find((n) => n.id === childId)
        if (!childNode) return null

        const nodeWidth = Math.max(120, node.text.length * 8 + 40)
        const nodeHeight = 60

        const startX = node.x + nodeWidth
        const startY = node.y + nodeHeight / 2
        const endX = childNode.x
        const endY = childNode.y + nodeHeight / 2

        // Create curved path
        const controlX1 = startX + 50
        const controlX2 = endX - 50

        const pathData = `M ${startX} ${startY} 
                         C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`

        return (
          <g key={`${node.id}-${childId}`}>
            <path
              d={pathData}
              stroke={getNodeColor(node.level)}
              strokeWidth="2.5"
              fill="none"
              opacity="0.8"
              strokeLinecap="round"
            />
            <circle cx={endX} cy={endY} r="3" fill={getNodeColor(node.level)} opacity="0.6" />
          </g>
        )
      }),
    )
  }

  const renderNodes = () => {
    return nodes.map((node) => {
      const nodeWidth = Math.max(120, node.text.length * 8 + 40)
      const nodeHeight = 60

      return (
        <g key={node.id} className="cursor-pointer">
          {/* Node shadow */}
          <rect x={node.x + 2} y={node.y + 2} width={nodeWidth} height={nodeHeight} rx="16" fill="rgba(0,0,0,0.1)" />

          {/* Main node */}
          <rect
            x={node.x}
            y={node.y}
            width={nodeWidth}
            height={nodeHeight}
            rx="16"
            fill={`url(#gradient-${node.level})`}
            stroke={getNodeColor(node.level)}
            strokeWidth="2"
            className="hover:stroke-4 transition-all duration-200"
          />

          {/* Node text */}
          <text
            x={node.x + nodeWidth / 2}
            y={node.y + nodeHeight / 2 + 5}
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="600"
          >
            {node.text.length > 15 ? `${node.text.substring(0, 15)}...` : node.text}
          </text>

          {/* Level indicator */}
          <circle cx={node.x + 15} cy={node.y + 15} r="6" fill="white" opacity="0.9" />
          <text
            x={node.x + 15}
            y={node.y + 19}
            textAnchor="middle"
            fill={getNodeColor(node.level)}
            fontSize="10"
            fontWeight="bold"
          >
            {node.level + 1}
          </text>
        </g>
      )
    })
  }

  if (items.length === 0) {
    return (
      <Card className="border-blue-200">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">No diagram to display</h3>
          <p className="text-gray-600">Switch to "Edit Notes" and start typing to see your diagram here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-gray-800">Visual Diagram</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {nodes.length} nodes
              </Badge>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                {Math.max(...nodes.map((n) => n.level)) + 1} levels
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Style and Orientation Controls */}
            <div className="flex items-center space-x-2 mr-4">
              <Settings className="w-4 h-4 text-gray-600" />
              <Select
                value={connectionStyle}
                onValueChange={(value: "normal" | "brackets") => setConnectionStyle(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="brackets">Brackets</SelectItem>
                </SelectContent>
              </Select>
              <Select value={orientation} onValueChange={(value: "horizontal" | "vertical") => setOrientation(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zoom Controls */}
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border border-blue-200 rounded-lg overflow-hidden bg-white">
          <svg
            ref={svgRef}
            width="100%"
            height="500"
            viewBox={`${-400 + pan.x / zoom} ${-250 + pan.y / zoom} ${800 / zoom} ${500 / zoom}`}
            className="cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="#e5e7eb" opacity="0.3" />
              </pattern>

              {colors.map((color, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                </linearGradient>
              ))}
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {connectionStyle === "brackets" ? renderBracketConnections() : renderNormalConnections()}
            {renderNodes()}
          </svg>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Diagram Controls:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Use the dropdown menus to change connection style and orientation</li>
            <li>Click and drag to pan around the diagram</li>
            <li>Use zoom controls to get a better view</li>
            <li>Brackets style creates synoptic chart-like connections</li>
            <li>Each indentation level gets a different color</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
