"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { PromptEditHeader } from "./prompt-edit-header"
import type { Session } from "next-auth"
import { createPromptAction, updatePromptAction } from "@/app/(prompt)/actions"

interface Prompt {
  id: string
  name: string
  description: string
  content: string
  type: "chat" | "code" | "name" | "custom"
  isDefault: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
}

interface PromptFormProps {
  prompt?: Prompt
  isEditing?: boolean
  session: Session
}

export function PromptEdit({ prompt, isEditing = false, session }: PromptFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: prompt?.name || "",
    description: prompt?.description || "",
    content: prompt?.content || "",
    type: (prompt?.type || "custom") as "chat" | "code" | "name" | "custom",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('description', formData.description)
      formDataObj.append('content', formData.content)
      formDataObj.append('type', formData.type)

      let result
      if (isEditing && prompt) {
        result = await updatePromptAction(prompt.id, formDataObj)
      } else {
        result = await createPromptAction(formDataObj)
      }

      if (result.success) {
        router.push("/prompt")
      } else {
        console.error('Failed to save prompt:', result.error)
      }
    } catch (error) {
      console.error('Failed to save prompt:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/prompt")
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background relative">
      <PromptEditHeader session={session} onBack={handleBack} />
      <div className="p-2">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{isEditing ? "Edit Prompt" : "Create New Prompt"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing
              ? "Modify the prompt details and content below."
              : "Create a new system prompt for your AI chat application."}
          </p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter prompt name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "chat" | "code" | "name" | "custom") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                  disabled={prompt?.isDefault}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the prompt"
                required
              />
            </div>
          </div>
       

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the system prompt content..."
                className="min-h-[300px] resize-none font-mono text-sm"
                required
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Use clear, specific instructions for best results</span>
                <span>{formData.content.length} characters</span>
              </div>
            </div>
        

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" className="h-9 min-h-9 max-h-9 px-2" onClick={handleBack}>
            Cancel
          </Button>
          <Button type="submit" className="h-9 min-h-9 max-h-9 px-2 gap-2">
            <Save className="h-4 w-4" />
            {isEditing ? "Update Prompt" : "Create Prompt"}
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}
