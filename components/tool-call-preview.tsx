"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ToolCallPreviewProps {
  className?: string
  protocol?: string // Protocol identifier to display and inject
  protocolColor?: "blue" | "emerald" | "violet" | "amber" | "rose" // Color theme
  type?: "loading" | "done" // Component state
  result?: any // JSON result data (used when type="done")
  toolName?: string // Tool name to display when type="done"
}

export default function ToolCallPreview({ className, protocol = "MCP", protocolColor = "blue", type = "loading", result, toolName }: ToolCallPreviewProps) {
  // Binary stream animation state
  const [binaryStream1, setBinaryStream1] = useState<string[]>([])
  const [binaryStream2, setBinaryStream2] = useState<string[]>([])
  // JSON expansion state
  const [isExpanded, setIsExpanded] = useState(false)

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
  if (type === "done" && result) {
    return (
      <div 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:opacity-80",
          isExpanded ? "flex flex-col gap-3" : "flex flex-col gap-2",
          className
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header with Protocol Badge and Complete */}
        <div className="flex items-center gap-3">
          <div className={cn("inline-flex items-center px-2 py-1 rounded-md border text-xs font-mono font-medium")}>
            {protocol}
          </div>
          <div className="text-xs text-muted-foreground font-mono">✓ Complete</div>
        </div>
        
        {/* Tool Name on separate line */}
        {toolName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-0">
            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            <span className="font-mono">{toolName}</span>
          </div>
        )}

        {/* JSON Result Display - only show when expanded */}
        {isExpanded && (
          <div className={cn("border rounded-md font-mono text-xs")}>
            <pre className="whitespace-pre-wrap overflow-hidden p-3 m-0 max-h-60 overflow-y-auto">
              {formatFullJson(result)}
            </pre>
          </div>
        )}
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
