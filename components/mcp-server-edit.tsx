"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Plus, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { MCPEditHeader } from "./mcp-edit-header"
import type { Session } from "next-auth"
import { createMCPServerAction, updateMCPServerAction } from "@/app/(mcp-client)/actions"
import type { MCPServer } from "@/lib/db/schema"

interface MCPServerEditProps {
  server?: MCPServer
  mode: "create" | "edit"
  session: Session
}

export function MCPServerEdit({ server, mode, session }: MCPServerEditProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: server?.name || "",
    description: server?.description || "",
    url: server?.url || "",
    type: (server?.type || "sse") as "sse" | "stdio",
    command: server?.command || "",
    args: (server?.args as string[]) || [],
    env: (server?.env as Array<{ key: string; value: string }>) || [],
    headers: (server?.headers as Array<{ key: string; value: string }>) || [],
    sandboxUrl: server?.sandboxUrl || "",
    streaming: server?.streaming || false,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('description', formData.description)
      formDataObj.append('url', formData.url)
      formDataObj.append('type', formData.type)
      formDataObj.append('command', formData.command)
      formDataObj.append('args', JSON.stringify(formData.args))
      formDataObj.append('env', JSON.stringify(formData.env))
      formDataObj.append('headers', JSON.stringify(formData.headers))
      formDataObj.append('sandboxUrl', formData.sandboxUrl)
      formDataObj.append('streaming', formData.streaming.toString())

      let result
      if (mode === "edit" && server) {
        result = await updateMCPServerAction(server.id, formDataObj)
      } else {
        result = await createMCPServerAction(formDataObj)
      }

      if (result.success) {
        router.push("/mcp-client")
      } else {
        console.error('Failed to save server:', result.error)
      }
    } catch (error) {
      console.error('Failed to save server:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/mcp-client")
  }

  const addKeyValuePair = (type: 'env' | 'headers') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { key: '', value: '' }]
    }))
  }

  const updateKeyValuePair = (type: 'env' | 'headers', index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeKeyValuePair = (type: 'env' | 'headers', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const addArg = () => {
    setFormData(prev => ({
      ...prev,
      args: [...prev.args, '']
    }))
  }

  const updateArg = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      args: prev.args.map((arg, i) => i === index ? value : arg)
    }))
  }

  const removeArg = (index: number) => {
    setFormData(prev => ({
      ...prev,
      args: prev.args.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background relative">
      <MCPEditHeader session={session} onBack={handleBack} />
      <div className="p-2">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit" ? "Edit MCP Server" : "Create MCP Server"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "edit"
              ? "Modify the server configuration below."
              : "Configure a new MCP server connection."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="My MCP Server"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Connection Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "sse" | "stdio") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sse">Server-Sent Events (SSE)</SelectItem>
                    <SelectItem value="stdio">Standard I/O (Stdio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this server"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Server URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/mcp or ws://localhost:3000"
                required
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="streaming">Use Streaming Transport</Label>
                <p className="text-sm text-muted-foreground">
                  Enable StreamableHTTPClientTransport for better streaming performance
                </p>
              </div>
              <Switch
                id="streaming"
                checked={formData.streaming}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, streaming: checked }))}
              />
            </div>
            {formData.sandboxUrl && (
              <div className="space-y-2">
                <Label htmlFor="sandboxUrl">Sandbox URL (Optional)</Label>
                <Input
                  id="sandboxUrl"
                  type="url"
                  value={formData.sandboxUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sandboxUrl: e.target.value }))}
                  placeholder="https://sandbox.example.com"
                />
              </div>
            )}
          </div>

          {/* Stdio Configuration */}
          {formData.type === 'stdio' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="command">Command</Label>
                <Input
                  id="command"
                  value={formData.command}
                  onChange={(e) => setFormData((prev) => ({ ...prev, command: e.target.value }))}
                  placeholder="node server.js"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Arguments</Label>
                  <Button type="button" variant="outline" size="sm" className="h-9 min-h-9 max-h-9 px-2" onClick={addArg}>
                    <Plus className="size-3 mr-1" />
                    Add Argument
                  </Button>
                </div>
                {formData.args.map((arg, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={arg}
                      onChange={(e) => updateArg(index, e.target.value)}
                      placeholder="--port 3000"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 min-h-9 max-h-9 px-2"
                      onClick={() => removeArg(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environment Variables */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Environment Variables</Label>
              <Button type="button" variant="outline" size="sm" className="h-9 min-h-9 max-h-9 px-2" onClick={() => addKeyValuePair('env')}>
                <Plus className="size-3 mr-1" />
                Add Variable
              </Button>
            </div>
            {formData.env.map((envVar, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={envVar.key}
                  onChange={(e) => updateKeyValuePair('env', index, 'key', e.target.value)}
                  placeholder="VARIABLE_NAME"
                />
                <Input
                  value={envVar.value}
                  onChange={(e) => updateKeyValuePair('env', index, 'value', e.target.value)}
                  placeholder="variable_value"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 min-h-9 max-h-9 px-2"
                  onClick={() => removeKeyValuePair('env', index)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Headers (for SSE) */}
          {formData.type === 'sse' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>HTTP Headers</Label>
                <Button type="button" variant="outline" size="sm" className="h-9 min-h-9 max-h-9 px-2" onClick={() => addKeyValuePair('headers')}>
                  <Plus className="size-3 mr-1" />
                  Add Header
                </Button>
              </div>
              {formData.headers.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={header.key}
                    onChange={(e) => updateKeyValuePair('headers', index, 'key', e.target.value)}
                    placeholder="Authorization"
                  />
                  <Input
                    value={header.value}
                    onChange={(e) => updateKeyValuePair('headers', index, 'value', e.target.value)}
                    placeholder="Bearer token123"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 min-h-9 max-h-9 px-2"
                    onClick={() => removeKeyValuePair('headers', index)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" className="h-9 min-h-9 max-h-9 px-2" onClick={handleBack}>
              Cancel
            </Button>
            <Button type="submit" className="h-9 min-h-9 max-h-9 px-2 gap-2" disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : mode === "edit" ? "Update Server" : "Create Server"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
