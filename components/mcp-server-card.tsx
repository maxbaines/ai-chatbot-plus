"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { Edit, Trash2, Copy, MoreHorizontal, Play, Square, AlertCircle, CheckCircle, Clock, Wifi, Terminal, Power } from "lucide-react"
import { useRouter } from "next/navigation"

interface ClientMCPServer {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: Array<{ key: string; value: string }>;
  headers?: Array<{ key: string; value: string }>;
  status?: 'connected' | 'disconnected' | 'connecting' | 'error';
  errorMessage?: string;
  sandboxUrl?: string;
  enabled?: boolean;
  streaming?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MCPServerCardProps {
  server: ClientMCPServer
  onDelete: (id: string) => void
  onDuplicate: (server: ClientMCPServer) => void
  onTestConnection: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
}

export function MCPServerCard({ server, onDelete, onDuplicate, onTestConnection, onToggleEnabled }: MCPServerCardProps) {
  const router = useRouter()

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="size-3 text-green-500" />
      case 'connecting':
        return <Clock className="size-3 text-yellow-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="size-3 text-red-500" />
      default:
        return <Square className="size-3 text-gray-400" />
    }
  }

  const getStatusBadgeVariant = (status?: string, enabled?: boolean) => {
    if (enabled === false) return "outline"
    switch (status) {
      case 'connected':
        return "default"
      case 'connecting':
        return "secondary"
      case 'error':
        return "destructive"
      default:
        return "outline"
    }
  }

  const getDisplayStatus = (status?: string, enabled?: boolean) => {
    if (enabled === false) return 'disabled'
    return status || 'disconnected'
  }

  const getTypeBadgeVariant = (type: 'sse' | 'stdio') => {
    switch (type) {
      case 'sse':
        return "default"
      case 'stdio':
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: 'sse' | 'stdio') => {
    switch (type) {
      case 'sse':
        return <Wifi className="size-3" />
      case 'stdio':
        return <Terminal className="size-3" />
      default:
        return null
    }
  }

  const handleEdit = () => {
    router.push(`/mcp-client/${server.id}`)
  }

  const handleTestConnection = () => {
    onTestConnection(server.id)
  }

  return (
    <Card className="group hover:shadow-sm transition-all duration-200 border-border/50 hover:border-border flex flex-col h-full">
      <CardHeader className="p-3">
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium truncate">{server.name}</CardTitle>
              {getStatusIcon(server.status)}
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleTestConnection}>
                <Play className="size-4 mr-2" />
                Test Connection
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center justify-between"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-center">
                  <Power className="size-4 mr-2" />
                  Enabled
                </div>
                <Switch
                  checked={server.enabled ?? false}
                  onCheckedChange={(checked) => onToggleEnabled(server.id, checked)}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(server)}>
                <Copy className="size-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
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
                    <AlertDialogTitle>Delete Server</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {server.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(server.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status and type badges */}
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(server.status, server.enabled)} className="text-xs px-1.5 py-0 h-5 capitalize">
            {getDisplayStatus(server.status, server.enabled)}
          </Badge>
          <Badge variant={getTypeBadgeVariant(server.type)} className="text-xs px-1.5 py-0 h-5 capitalize flex items-center gap-1">
            {getTypeIcon(server.type)}
            {server.type}
          </Badge>
        </div>

        {/* Description */}
        <CardDescription className="text-sm leading-relaxed line-clamp-2">
          {server.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 p-3 flex-1">
        <div className="bg-muted/30 rounded border p-3 space-y-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium">URL:</p>
            <p className="text-xs font-mono truncate">{server.url}</p>
          </div>
          {server.type === 'stdio' && server.command && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">Command:</p>
              <p className="text-xs font-mono truncate">{server.command}</p>
            </div>
          )}
          {server.sandboxUrl && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">Sandbox:</p>
              <p className="text-xs font-mono truncate">{server.sandboxUrl}</p>
            </div>
          )}
          {server.errorMessage && (
            <div>
              <p className="text-xs text-red-500 font-medium">Error:</p>
              <p className="text-xs text-red-500 line-clamp-2">{server.errorMessage}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t mt-auto">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <span>Updated {server.updatedAt}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleTestConnection}
            disabled={server.status === 'connecting'}
          >
            {server.status === 'connecting' ? 'Testing...' : 'Test'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
