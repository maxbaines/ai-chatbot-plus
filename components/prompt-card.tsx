"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Copy, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

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

interface PromptCardProps {
  prompt: Prompt
  onDelete: (id: string) => void
  onDuplicate: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onDelete, onDuplicate }: PromptCardProps) {
  const router = useRouter()

  const getTypeBadgeVariant = (type: Prompt["type"]) => {
    switch (type) {
      case "chat":
        return "default"
      case "code":
        return "secondary"
      case "name":
        return "outline"
      default:
        return "default"
    }
  }

  const handleEdit = () => {
    router.push(`/prompt/${prompt.id}`)
  }

  return (
    <Card className="group hover:shadow-sm transition-all duration-200 border-border/50 hover:border-border flex flex-col h-full">
      <CardHeader className="">
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium truncate">{prompt.name}</CardTitle>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(prompt)}>
                <Copy className="size-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {!prompt.isDefault && (
                <>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {prompt.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(prompt.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Type badge on its own line */}
        <div>
          {prompt.isDefault && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-muted-foreground border-muted-foreground/30 mr-2">
              Default
            </Badge>
          )}
           {!prompt.isDefault && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-muted-foreground border-muted-foreground/30 mr-2">
              User
            </Badge>
          )}
          <Badge variant={getTypeBadgeVariant(prompt.type)} className="text-xs px-1.5 py-0 h-5 capitalize">
            {prompt.type}
          </Badge>
        </div>

        {/* Description */}
        <CardDescription className="text-sm leading-relaxed line-clamp-2">{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <div className="bg-muted/30 rounded border p-3">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 font-mono">{prompt.content}</p>
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t mt-auto">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <span>Updated {prompt.updatedAt}</span>
          <span>{prompt.content.length} chars</span>
        </div>
      </CardFooter>
    </Card>
  )
}
