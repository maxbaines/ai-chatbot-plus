'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { VisibilityType } from './visibility-selector';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { PromptHeader } from './prompt-header';
import { PromptTabs } from './prompt-tabs';
import { deletePromptAction, duplicatePromptAction } from '@/app/(prompt)/actions';
import type { Prompt as DBPrompt } from '@/lib/db/schema';

// Client-side interface that matches what the UI components expect
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

// Transform database prompt to client prompt
const transformPrompt = (dbPrompt: DBPrompt): Prompt => ({
  id: dbPrompt.id,
  name: dbPrompt.name,
  description: dbPrompt.description,
  content: dbPrompt.content,
  type: dbPrompt.type,
  isDefault: dbPrompt.isDefault,
  createdAt: dbPrompt.createdAt.toISOString().split('T')[0],
  updatedAt: dbPrompt.updatedAt.toISOString().split('T')[0],
  usageCount: dbPrompt.usageCount,
});

export function Prompt({
  session,
  initialPrompts = [],
}: {
  session: Session;
  initialPrompts?: DBPrompt[];
}) {
  const { mutate } = useSWRConfig();

  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [prompts, setPrompts] = useState<Prompt[]>(() =>
    initialPrompts.map(transformPrompt)
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const result = await deletePromptAction(promptId);
      if (result.success) {
        setPrompts((prev) => prev.filter((p) => p.id !== promptId));
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  }

  const handleDuplicatePrompt = async (prompt: Prompt) => {
    try {
      const newName = `${prompt.name} (Copy)`;
      const result = await duplicatePromptAction(prompt.id, newName);
      if (result.success && result.prompt) {
        // Add the new prompt to the current list (optimistic update)
        const newPrompt = { ...prompt, id: result.prompt.id, name: newName };
        setPrompts((prev) => [...prev, newPrompt]);
      }
    } catch (error) {
      console.error('Failed to duplicate prompt:', error);
    }
  }

  // Filter prompts based on search term first
  const searchFilteredPrompts = prompts.filter(
    (prompt) =>
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Then apply tab filtering
  const getTabFilteredPrompts = () => {
    switch (activeTab) {
      case "defaults":
        return searchFilteredPrompts.filter((p) => p.isDefault)
      case "custom":
        return searchFilteredPrompts.filter((p) => !p.isDefault)
      case "all":
      default:
        return searchFilteredPrompts
    }
  }

  const finalFilteredPrompts = getTabFilteredPrompts()

  // Calculate prompt counts based on search-filtered prompts (not tab-filtered)
  const promptCounts = {
    custom: searchFilteredPrompts.filter((p) => !p.isDefault).length,
    defaults: searchFilteredPrompts.filter((p) => p.isDefault).length,
    all: searchFilteredPrompts.length,
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background relative">
      <PromptHeader
        session={session}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        promptCounts={promptCounts}
      />
      <PromptTabs
        prompts={finalFilteredPrompts}
        activeTab={activeTab}
        onDelete={handleDeletePrompt}
        onDuplicate={handleDuplicatePrompt}
      />
    </div>
  );
}
