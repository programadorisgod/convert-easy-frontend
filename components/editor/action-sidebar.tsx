"use client";

import {
  ChevronRight,
  Download,
  Info,
  AlertCircle,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { sileo } from "sileo";

import { cn } from "@/lib/utils";
import {
  getActionsForCategory,
  getConversionOptions,
} from "@/lib/file-actions";
import { getFile } from "@/lib/file-store";
import {
  convertFile,
  downloadResult,
  cancelJob,
  pollJobStatus,
} from "@/lib/api-service";
import type { JobStatus } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { FileCategory, ConversionOption } from "@/types/file";
import { useState } from "react";

interface ActionSidebarProps {
  category: FileCategory;
  fileName: string;
  fileSize: number;
  fileId: string;
  inputFormat: string;
  onActionSelect?: (
    actionId: string,
    options?: Record<string, unknown>,
  ) => void;
  className?: string;
}

export function ActionSidebar({
  category,
  fileName,
  fileSize,
  fileId,
  inputFormat,
  onActionSelect,
  className,
}: ActionSidebarProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("");

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState<JobStatus | null>(
    null,
  );
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string | null>(
    null,
  );

  const actions = getActionsForCategory(category);
  const conversionOptions = getConversionOptions(category);

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId);

    if (actionId === "convert") {
      setShowConvertDialog(true);
      return;
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
    });

    if (onActionSelect) {
      onActionSelect(actionId);
    }
  };

  const handleConvert = async () => {
    if (!selectedFormat) {
      sileo.error({
        title: "Select a format",
        description: "Please select a target format for the conversion.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 200,
          collapse: 2500,
        },
        duration: 3500,
      });
      return;
    }

    // Get file from store
    const file = getFile(fileId);
    if (!file) {
      sileo.error({
        title: "File not found",
        description:
          "Could not find the file in memory. Please try uploading it again.",
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
      return;
    }

    setShowConvertDialog(false);
    const isLargeFile = fileSize > 10 * 1024 * 1024; // 10MB

    // Para archivos pequeños: proceso simple y directo
    if (!isLargeFile) {
      sileo.info({
        title: "Converting file",
        description: `Processing ${fileName}... This will only take a moment.`,
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 0,
          collapse: 2500,
        },
        duration: 3000,
      });

      setIsConverting(true);
      setConversionStatus("processing");

      try {
        const jobId = await convertFile(
          file,
          inputFormat,
          [selectedFormat],
          () => {}, // No progress callback for small files
        );

        setCurrentJobId(jobId);

        // Poll for status updates (silently for small files)
        await pollJobStatus(
          jobId,
          (status) => {
            setConversionStatus(status.status);

            if (status.status === "completed") {
              sileo.success({
                title: "✅ Ready to download!",
                description: `${fileName} → ${selectedFormat.toUpperCase()}`,
                icon: <Download className="size-3.5" />,
                roundness: 16,
                autopilot: {
                  expand: 0,
                  collapse: 4000,
                },
                duration: 8000,
              });
            } else if (status.status === "failed") {
              sileo.error({
                title: "❌ Conversion failed",
                description:
                  status.error_message ||
                  "An error occurred while processing your file. Please try again.",
                icon: <AlertCircle className="size-3.5" />,
                roundness: 16,
                autopilot: {
                  expand: 0,
                  collapse: 3000,
                },
                duration: 6000,
              });
            }
          },
          1000, // Poll every second
          300, // Max 5 minutes
        );
      } catch (error) {
        console.error("Conversion error:", error);

        let errorMessage = "Could not convert the file";

        if (error instanceof Error) {
          if (
            error.message.includes("NetworkError") ||
            error.message.includes("fetch")
          ) {
            errorMessage =
              "Could not connect to the server. Please check your internet connection or try again later.";
          } else {
            errorMessage = error.message;
          }
        }

        sileo.error({
          title: "🚨 Conversion error",
          description: errorMessage,
          icon: <AlertCircle className="size-3.5" />,
          roundness: 16,
          autopilot: {
            expand: 0,
            collapse: 4000,
          },
          duration: 8000,
        });
        setIsConverting(false);
        setConversionStatus(null);
        setCurrentJobId(null);
      }

      if (onActionSelect) {
        onActionSelect("convert", { targetFormat: selectedFormat });
      }
      return;
    }

    // Para archivos grandes: mostrar progreso completo
    setIsConverting(true);
    setUploadProgress(0);
    setConversionStatus("pending");

    try {
      sileo.info({
        title: "Starting conversion",
        description: `Uploading ${fileName} in chunks... You can continue using the app while your file is being processed.`,
        icon: <Sparkles className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 0,
          collapse: 4000,
        },
        duration: 5000,
      });

      // Start conversion (upload + trigger)
      const jobId = await convertFile(
        file,
        inputFormat,
        [selectedFormat],
        (stage, progress) => {
          if (stage === "uploading") {
            setUploadProgress(progress);
            setConversionStatus("uploading");
          } else if (stage === "converting") {
            setUploadProgress(100);
            setConversionStatus("processing");
          }
        },
      );

      setCurrentJobId(jobId);

      // Poll for status updates
      await pollJobStatus(
        jobId,
        (status) => {
          setConversionStatus(status.status);

          if (status.status === "completed") {
            sileo.success({
              title: "✅ Conversion completed",
              description: `${fileName} → ${selectedFormat.toUpperCase()}`,
              icon: <Download className="size-3.5" />,
              roundness: 16,
              autopilot: {
                expand: 0,
                collapse: 3000,
              },
              duration: 5000,
            });
          } else if (status.status === "failed") {
            sileo.error({
              title: "❌ Conversion failed",
              description:
                status.error_message || "An error occurred while processing your file. Please try again.",
              icon: <AlertCircle className="size-3.5" />,
              roundness: 16,
              autopilot: {
                expand: 0,
                collapse: 3000,
              },
              duration: 6000,
            });
          }
        },
        1000, // Poll every second
        300, // Max 5 minutes
      );
    } catch (error) {
      console.error("Conversion error:", error);

      // User-friendly error messages
      let errorMessage = "Could not convert the file";
      
      if (error instanceof Error) {
        // Check if it's a network error
        if (error.message.includes("NetworkError") || error.message.includes("fetch")) {
          errorMessage = "Could not connect to the server. Please check your internet connection or try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      sileo.error({
        title: "🚨 Conversion error",
        description: errorMessage,
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 0,
          collapse: 4000,
        },
        duration: 8000,
        
      });
      setIsConverting(false);
      setConversionStatus(null);
      setCurrentJobId(null);
      setUploadProgress(0);
    }

    if (onActionSelect) {
      onActionSelect("convert", { targetFormat: selectedFormat });
    }
  };

  const handleCancelConversion = async () => {
    if (!currentJobId) return;

    try {
      await cancelJob(currentJobId, { reason: "User cancelled" });

      sileo.info({
        title: "Conversion cancelled",
        description: "The conversion has been cancelled.",
        icon: <X className="size-3.5" />,
        roundness: 16,
        duration: 3000,
      });

      setIsConverting(false);
      setConversionStatus(null);
      setCurrentJobId(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Cancel error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not cancel the conversion";

      sileo.error({
        title: "Cancel error",
        description: errorMessage,
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        duration: 4000,
      });
    }
  };

  const handleDownload = async () => {
    if (!currentJobId || !selectedFormat) return;

    try {
      const blob = await downloadResult(currentJobId, selectedFormat);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.split(".")[0]}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      sileo.success({
        title: "Download started",
        description: `Downloading ${fileName.split(".")[0]}.${selectedFormat}`,
        icon: <Download className="size-3.5" />,
        roundness: 16,
        duration: 3000,
      });

      // Reset state after download
      setTimeout(() => {
        if (url) URL.revokeObjectURL(url);
        setIsConverting(false);
        setConversionStatus(null);
        setCurrentJobId(null);
        setUploadProgress(0);
        setDownloadUrl(null);
        setSelectedFormat("");
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not download the file";

      sileo.error({
        title: "Download error",
        description: errorMessage,
        icon: <AlertCircle className="size-3.5" />,
        roundness: 16,
        autopilot: {
          expand: 0,
          collapse: 3000,
        },
        duration: 6000,
      });
    }
  };

  const getStatusText = () => {
    if (!conversionStatus) return "";

    switch (conversionStatus) {
      case "pending":
        return "Preparing...";
      case "uploading":
        return `Uploading... ${uploadProgress}%`;
      case "queued":
        return "Queued...";
      case "processing":
        return "Converting...";
      case "completed":
        return "Completed!";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return "";
    }
  };

  const isDownloadReady = conversionStatus === "completed" && currentJobId;

  return (
    <>
      <aside className={cn("flex w-64 flex-col border-r bg-card", className)}>
        <div className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Actions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose what to do with your file
          </p>
        </div>

        <Separator />

        {/* Progress indicator when converting */}
        {isConverting && (
          <>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {getStatusText()}
                </span>
                {conversionStatus === "uploading" && (
                  <span className="text-xs text-muted-foreground">
                    {uploadProgress}%
                  </span>
                )}
              </div>

              {(conversionStatus === "uploading" ||
                conversionStatus === "pending") && (
                <Progress value={uploadProgress} className="h-2" />
              )}

              {(conversionStatus === "processing" ||
                conversionStatus === "queued") && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing your file...</span>
                </div>
              )}

              {conversionStatus &&
                !["completed", "failed", "cancelled"].includes(
                  conversionStatus,
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelConversion}
                    className="w-full gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
            </div>
            <Separator />
          </>
        )}

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                disabled={isConverting}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  selectedAction === action.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  isConverting && "opacity-50 cursor-not-allowed",
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
                        : "text-muted-foreground",
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
          <Button
            variant={isDownloadReady ? "default" : "outline"}
            className="w-full gap-2"
            disabled={!isDownloadReady}
            onClick={handleDownload}
          >
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
  );
}
