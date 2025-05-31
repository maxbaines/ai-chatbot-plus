"use client"

import { PromptCard } from "./prompt-card"

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

interface PromptTabsProps {
  prompts: Prompt[]
  activeTab: string
  onDelete: (id: string) => void
  onDuplicate: (prompt: Prompt) => void
}

export function PromptTabs({ prompts, activeTab, onDelete, onDuplicate }: PromptTabsProps) {
  return (
    <div className="px-2 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} onDelete={onDelete} onDuplicate={onDuplicate} />
        ))}
      </div>
    </div>
  )
}
