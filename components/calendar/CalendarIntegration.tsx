"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  participants: string[];
  meetingLink?: string;
}

interface CalendarIntegrationProps {
  conversationId: string;
  participants?: string[];
  className?: string;
}

export default function CalendarIntegration({
  conversationId,
  participants = [],
  className,
}: CalendarIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [eventData, setEventData] = useState<CalendarEvent>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    participants: participants,
  });

  const handleCreateEvent = async () => {
    if (!eventData.title || !eventData.startTime || !eventData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      // Create calendar event
      // This would integrate with Google Calendar API or other calendar services

      // For now, create a .ics file that can be downloaded
      const icsContent = generateICSFile(eventData);
      downloadICSFile(icsContent, `${eventData.title}.ics`);

      toast.success("Calendar event created! Check your downloads.");
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Calendar event creation error:", error);
      toast.error("Failed to create calendar event");
    } finally {
      setIsCreating(false);
    }
  };

  const generateICSFile = (event: CalendarEvent): string => {
    const now = new Date();
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    const formatDate = (date: Date): string => {
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Converse Chat//Calendar Integration//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${now.getTime()}@converse.chat`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}${event.meetingLink ? `\\n\\nMeeting Link: ${event.meetingLink}` : ""}`,
      `LOCATION:${event.meetingLink || ""}`,
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      `BEGIN:VALARM`,
      `TRIGGER:-PT15M`,
      `ACTION:DISPLAY`,
      `DESCRIPTION:Reminder: ${event.title}`,
      `END:VALARM`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return icsContent;
  };

  const downloadICSFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setEventData({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      participants: participants,
    });
  };

  const generateMeetingLink = () => {
    // In production, integrate with your video calling system
    const meetingLink = `${window.location.origin}/rooms/${conversationId}`;
    setEventData((prev) => ({ ...prev, meetingLink }));
    toast.success("Meeting link added");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <CalendarIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Schedule Meeting</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule a Meeting
          </DialogTitle>
          <DialogDescription>
            Create a calendar event for this conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="Team Standup"
              value={eventData.title}
              onChange={(e) =>
                setEventData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Discuss project updates..."
              value={eventData.description}
              onChange={(e) =>
                setEventData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={eventData.startTime}
                onChange={(e) =>
                  setEventData((prev) => ({ ...prev, startTime: e.target.value }))
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                End Time *
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={eventData.endTime}
                onChange={(e) =>
                  setEventData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="meetingLink" className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              Video Meeting Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="meetingLink"
                placeholder="https://meet.example.com/..."
                value={eventData.meetingLink || ""}
                onChange={(e) =>
                  setEventData((prev) => ({ ...prev, meetingLink: e.target.value }))
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateMeetingLink}
              >
                Generate
              </Button>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Participants ({participants.length})
            </Label>
            <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md bg-muted/30 min-h-[40px]">
              {participants.length > 0 ? (
                participants.map((participant, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {participant}
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Conversation participants will be invited
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateEvent}
            disabled={isCreating || !eventData.title || !eventData.startTime || !eventData.endTime}
            className="w-full sm:w-auto"
          >
            {isCreating ? "Creating..." : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
