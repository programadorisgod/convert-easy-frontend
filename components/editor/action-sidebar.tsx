"use client"

import { ChevronRight, Download, Info, AlertCircle, Sparkles } from "lucide-react"
import { sileo } from "sileo"

import { cn } from "@/lib/utils"
import { getActionsForCategory, getConversionOptions } from "@/lib/file-actions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { FileCategory, ConversionOption } from "@/types/file"
import { useState } from "react"

interface ActionSidebarProps {
  category: FileCategory
  fileName: string
  fileSize: number
  onActionSelect?: (actionId: string, options?: Record<string, unknown>) => void
  className?: string
}

export function ActionSidebar({
  category,
  fileName,
  fileSize,
  onActionSelect,
  className,
}: ActionSidebarProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<string>("")

  const actions = getActionsForCategory(category)
  const conversionOptions = getConversionOptions(category)

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId)

    if (actionId === "convert") {
      setShowConvertDialog(true)
      return
    }

    // For other actions, just show a toast for now (placeholder)
    sileo.info({
      title: `${actionId.charAt(0).toUpperCase() + actionId.slice(1)} selected`,
      description: "This feature will be available soon.",
      icon: <Info className="size-3.5" />,
      roundness: 16,
      autopilot: {
        expand: 200,
        collapse: 2500,
      },
      duration: 3500,
    })

    if (onActionSelect) {
      onActionSelect(actionId)
    }
  }

  const handleConvert = () => {
    if (!selectedFormat) {
      sileo.error({
        title: "Select a format",
        description: "Please select a target format for conversion.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 200,
          collapse: 2500,
        },
        duration: 3500,
      })
      return
    }

    const isLargeFile = fileSize > 10 * 1024 * 1024 // 10MB
    
    sileo.success({
      title: "Conversion started",
      description: isLargeFile
        ? `Converting ${fileName} to ${selectedFormat.toUpperCase()}... • This may take a while, you can continue using the app`
        : `Converting ${fileName} to ${selectedFormat.toUpperCase()}...`,
      icon: <Sparkles className="size-3.5" />,
      roundness: 16,
      autopilot: {
        expand: 200,
        collapse: isLargeFile ? 4000 : 3000,
      },
      duration: isLargeFile ? 6000 : 4000,
    })

    setShowConvertDialog(false)

    if (onActionSelect) {
      onActionSelect("convert", { targetFormat: selectedFormat })
    }
  }

  return (
    <>
      <aside
        className={cn(
          "flex w-64 flex-col border-r bg-card",
          className
        )}
      >
        <div className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Actions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose what to do with your file
          </p>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  selectedAction === action.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <action.icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{action.label}</div>
                  <div
                    className={cn(
                      "text-xs truncate",
                      selectedAction === action.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {action.description}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <Button variant="outline" className="w-full gap-2" disabled>
            <Download className="h-4 w-4" />
            Download Result
          </Button>
        </div>
      </aside>

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to</DialogTitle>
            <DialogDescription>
              Select the target format for your file.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={selectedFormat}
            onValueChange={setSelectedFormat}
            className="mt-4 grid gap-2"
          >
            {conversionOptions.map((option: ConversionOption) => (
              <div key={option.id} className="flex items-center space-x-3">
                <RadioGroupItem value={option.extension} id={option.id} />
                <Label
                  htmlFor={option.id}
                  className="flex flex-1 cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    .{option.extension}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConvertDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConvert}>Convert</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
