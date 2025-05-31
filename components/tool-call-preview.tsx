"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ToolCallPreviewProps {
  className?: string
  protocol?: string // Protocol identifier to display and inject
  protocolColor?: "blue" | "emerald" | "violet" | "amber" | "rose" // Color theme
  type?: "loading" | "done" // Component state
  result?: any // JSON result data (used when type="done")
}

export default function ToolCallPreview({ className, protocol = "MCP", protocolColor = "blue", type = "loading", result }: ToolCallPreviewProps) {
  // Binary stream animation state
  const [binaryStream1, setBinaryStream1] = useState<string[]>([])
  const [binaryStream2, setBinaryStream2] = useState<string[]>([])
  // JSON expansion state
  const [isExpanded, setIsExpanded] = useState(false)

  // Format and truncate JSON for preview
  const formatJsonPreview = (data: any) => {
    if (!data) return ""
    try {
      const jsonString = typeof data === "string" ? data : JSON.stringify(data, null, 2)
      const lines = jsonString.split("\n")
      if (lines.length <= 3) return jsonString
      return lines.slice(0, 3).join("\n") + "\n..."
    } catch {
      return "Invalid JSON"
    }
  }

  const formatFullJson = (data: any) => {
    if (!data) return ""
    try {
      return typeof data === "string" ? data : JSON.stringify(data, null, 2)
    } catch {
      return "Invalid JSON"
    }
  }

  // Generate and update binary streams (only in loading mode)
  useEffect(() => {
    if (type !== "loading") return
    // Generate random binary digit
    const generateBinary = () => (Math.random() > 0.5 ? "1" : "0")

    // Protocol letter injection logic
    const protocolChars = protocol.split("")
    const protocolVariants = [...protocolChars, protocol.substring(0, 2), protocol].filter(
      (v, i, a) => a.indexOf(v) === i && v.length > 0,
    ) // Unique values only

    let nextProtocolTime = Date.now() + Math.random() * 8000 + 2000 // 2-10 seconds

    const shouldInjectProtocol = () => {
      if (Date.now() >= nextProtocolTime) {
        nextProtocolTime = Date.now() + Math.random() * 8000 + 2000 // Reset timer
        return protocolVariants[Math.floor(Math.random() * protocolVariants.length)]
      }
      return null
    }

    // Update first binary stream
    const interval1 = setInterval(() => {
      setBinaryStream1((prev) => {
        const newStream = [...prev]
        if (newStream.length > 5) newStream.shift()

        const protocolToInject = shouldInjectProtocol()
        if (protocolToInject && Math.random() > 0.5) {
          // Inject protocol variant into outgoing stream
          newStream.push(protocolToInject)
        } else {
          newStream.push(generateBinary())
        }

        return newStream
      })
    }, 300)

    // Update second binary stream with delay
    const interval2 = setInterval(() => {
      setBinaryStream2((prev) => {
        const newStream = [...prev]
        if (newStream.length > 4) newStream.shift()

        const protocolToInject = shouldInjectProtocol()
        if (protocolToInject && Math.random() > 0.3) {
          // Inject protocol variant into incoming stream
          newStream.push(protocolToInject)
        } else {
          newStream.push(generateBinary())
        }

        return newStream
      })
    }, 350)

    // Initialize streams
    setBinaryStream1(Array(6).fill("").map(generateBinary))
    setBinaryStream2(Array(5).fill("").map(generateBinary))

    return () => {
      clearInterval(interval1)
      clearInterval(interval2)
    }
  }, [protocol, type])

  const renderStreamItem = (item: string, index: number, isOutgoing: boolean) => {
    const isProtocolChar = protocol.includes(item) || item.length > 1
    const baseColor = isOutgoing ? protocolColor : "emerald"

    if (isProtocolChar) {
      return (
        <span
          key={`${isOutgoing ? "out" : "in"}-${index}`}
          className={`text-xs font-medium text-${baseColor}-500 font-mono`}
          style={{
            opacity: 0.9,
            transform: `scale(1.1)`,
          }}
        >
          {item}
        </span>
      )
    }

    return (
      <span
        key={`${isOutgoing ? "out" : "in"}-${index}`}
        className={cn(
          "text-xs font-mono transition-all duration-300",
          item === "1" ? `text-${baseColor}-500` : `text-${baseColor}-400/70`,
        )}
        style={{
          opacity: 0.4 + index * 0.1,
          transform: `scale(${0.8 + index * 0.05})`,
        }}
      >
        {item}
      </span>
    )
  }

  // Get color classes based on protocol color
  const getColorClasses = () => {
    switch (protocolColor) {
      case "violet":
        return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800"
      case "amber":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
      case "rose":
        return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
      case "emerald":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
      default:
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
    }
  }

  if (type === "done" && result) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {/* Header with Protocol Badge */}
        <div className="flex items-center gap-3">
          <div className={cn("inline-flex items-center px-2 py-1 rounded-md border text-xs font-mono font-medium")}>
            {protocol}
          </div>
          <div className="text-xs text-muted-foreground font-mono">✓ Complete</div>
        </div>

        {/* JSON Result Display */}
        <div 
          className={cn(
            "cursor-pointer transition-all duration-200 hover:opacity-80",
            "border rounded-md font-mono text-xs"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <pre className="whitespace-pre-wrap overflow-hidden p-1 m-0">
            {isExpanded ? formatFullJson(result) : formatJsonPreview(result)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Protocol Badge */}
      <div className={cn("inline-flex items-center px-2 py-1 rounded-md border text-xs font-mono font-medium")}>
        {protocol}
      </div>

      {/* Binary Data Flow Animation */}
      <div className="flex items-center">
        {/* Outgoing binary stream */}
        <div className="flex">{binaryStream1.map((item, index) => renderStreamItem(item, index, true))}</div>

        {/* Connection indicator */}
        <div className="mx-1.5 w-3 h-px bg-gradient-to-r from-blue-400/50 via-foreground/20 to-emerald-400/50"></div>

        {/* Incoming binary stream */}
        <div className="flex">{binaryStream2.map((item, index) => renderStreamItem(item, index, false))}</div>
      </div>
    </div>
  )
}
