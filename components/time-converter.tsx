"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Volume2, VolumeX, AlarmClockCheck } from "lucide-react";

interface TimeConverterProps {
  fromZone: string;
  toZone: string;
  offset: number;
}

interface Reminder {
  time: number;
  message: string;
  timeoutId: NodeJS.Timeout | null;
}

export function TimeConverter({ fromZone, toZone, offset }: TimeConverterProps) {
  const [fromTime, setFromTime] = useState("");
  const [toTime24, setToTime24] = useState("");
  const [toTime12, setToTime12] = useState("");
  const [currentFromTime, setCurrentFromTime] = useState("");
  const [reminderSet, setReminderSet] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const { toast } = useToast();
  const alarmClockIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check" height="24" width="24">
  <circle cx="12" cy="13" r="8"></circle>
  <path d="M5 3 2 6"></path>
  <path d="m22 6-3-3"></path>
  <path d="M6 19l-2 2"></path>
  <path d="M18 19l2 2"></path>
  <path d="m9 13 2 2 4-4"></path>
</svg>
`;

  const alarmClockIconDataUrl = `data:image/svg+xml;base64,${btoa(alarmClockIconSvg)}`;

  // Initialize audio context on user interaction
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (!audioBufferRef.current) {
        const response = await fetch("/notification.wav");
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      }

      setAudioEnabled(true);
      toast({
        title: "Audio Enabled",
        description: "Notification sounds are now enabled",
      });
    } catch (error) {
      setAudioEnabled(false);
      toast({
        title: "Audio Error",
        description: "Could not enable audio notifications",
        variant: "destructive",
      });
    }
  };

  const playNotificationSound = async () => {
    if (!audioEnabled || !audioContextRef.current || !audioBufferRef.current) {
      return;
    }

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      await audioContextRef.current.resume();
      source.start(0);
      source.onended = () => {};
    } catch (error) {}
  };

  // Get the current time in the specified timezone
  const getCurrentTimeInZone = (timezone: string) => {
    const now = new Date();
    if (timezone === "CET") {
      // Convert to CET
      const cetOffset = 1; // CET is UTC+1
      const localOffset = -now.getTimezoneOffset() / 60;
      const diffHours = cetOffset - localOffset;
      return new Date(now.getTime() + diffHours * 60 * 60 * 1000);
    } else if (timezone === "Cairo") {
      // Convert to Cairo time (EET - Eastern European Time)
      const cairoOffset = 2; // Cairo is UTC+2
      const localOffset = -now.getTimezoneOffset() / 60;
      const diffHours = cairoOffset - localOffset;
      return new Date(now.getTime() + diffHours * 60 * 60 * 1000);
    }
    return now;
  };

  // Check reminders against current time
  const checkReminders = (now: Date) => {
    if (!reminders.length) return;

    const currentTime = now.getTime();
    reminders.forEach((reminder) => {
      if (currentTime >= reminder.time) {
        triggerReminder(reminder);
      }
    });
  };

  // Update current time and check reminders
  useEffect(() => {
    const updateTime = () => {
      const zoneTime = getCurrentTimeInZone(fromZone);
      setCurrentFromTime(formatTime(zoneTime));
      checkReminders(zoneTime);
    };

    // Update immediately and then every second
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(timeInterval);
      clearAllReminders();
    };
  }, [fromZone]);

  const triggerReminder = async (reminder: Reminder) => {
    await showNotification(reminder.message);
    if (reminder.timeoutId !== null) {
      clearTimeout(reminder.timeoutId);
    }

    setReminders((prev) => prev.filter((r) => r.time !== reminder.time));

    setReminderSet(false);
    localStorage.removeItem("reminders");
  };

  const showNotification = async (message: string) => {
    if (audioEnabled) {
      await playNotificationSound();
    }

    if (Notification.permission === "granted") {
      new Notification("Time Reminder", {
        body: message,
        icon: alarmClockIconDataUrl, // Use the SVG data URL here
      });
    }

    toast({
      title: "Time Reminder",
      description: message,
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const convertTime = (time: string) => {
    if (!time) return;

    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      setToTime24("");
      setToTime12("");
      return;
    }

    // Get current date in source timezone
    const sourceDate = getCurrentTimeInZone(fromZone);
    sourceDate.setHours(hours);
    sourceDate.setMinutes(minutes);
    sourceDate.setSeconds(0);
    sourceDate.setMilliseconds(0);

    // Convert to target timezone
    const targetOffset = toZone === "CET" ? 1 : 2;
    const sourceOffset = fromZone === "CET" ? 1 : 2;
    const diffHours = targetOffset - sourceOffset;

    const targetDate = new Date(sourceDate.getTime() + diffHours * 60 * 60 * 1000);

    setToTime24(formatTime(targetDate));
    setToTime12(
      targetDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const setReminder = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({
          title: "Permission denied",
          description: "We need permission to send notifications.",
          variant: "destructive",
        });
        return;
      }
    }

    const [hours, minutes] = fromTime.split(":").map(Number);
    const now = getCurrentTimeInZone(fromZone);
    const reminderDate = getCurrentTimeInZone(fromZone);
    reminderDate.setHours(hours, minutes, 0, 0);

    clearAllReminders();

    let reminderTime = reminderDate.getTime();
    if (reminderTime <= now.getTime()) {
      reminderTime += 24 * 60 * 60 * 1000;
    }

    const newReminder: Reminder = {
      time: reminderTime,
      message: `It's now ${fromTime} ${fromZone} time!`,
      timeoutId: null,
    };

    const timeoutId = setTimeout(() => {
      triggerReminder(newReminder);
    }, reminderTime - now.getTime());

    newReminder.timeoutId = timeoutId;

    setReminders([newReminder]);
    setReminderSet(true);
    localStorage.setItem("reminders", JSON.stringify([newReminder]));

    toast({
      title: "Reminder Set",
      description: `Reminder set for ${fromTime} ${fromZone}`,
    });
  };

  const clearAllReminders = () => {
    reminders.forEach((reminder) => {
      if (reminder.timeoutId !== null) {
        clearTimeout(reminder.timeoutId);
      }
    });
    setReminders([]);
    setReminderSet(false);
    localStorage.removeItem("reminders");
  };

  useEffect(() => {
    const zoneTime = getCurrentTimeInZone(fromZone);
    setCurrentFromTime(formatTime(zoneTime));
    setFromTime(formatTime(zoneTime));
    loadReminders();
  }, [fromZone]);

  useEffect(() => {
    if (fromTime) {
      convertTime(fromTime);
    }
  }, [fromTime, offset, fromZone, toZone]);

  const loadReminders = () => {
    const storedReminders = localStorage.getItem("reminders");
    if (storedReminders) {
      const savedReminders: Reminder[] = JSON.parse(storedReminders);
      const now = getCurrentTimeInZone(fromZone).getTime();

      const activeReminders = savedReminders
        .filter((reminder) => reminder.time > now)
        .map((reminder) => ({
          ...reminder,
          timeoutId: setTimeout(() => triggerReminder(reminder), reminder.time - now),
        }));

      if (activeReminders.length > 0) {
        setReminders(activeReminders);
        setReminderSet(true);
      } else {
        clearAllReminders();
      }
    }
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = getCurrentTimeInZone(fromZone);
      const currentTime = now.getTime();

      reminders.forEach((reminder) => {
        if (currentTime >= reminder.time) {
          triggerReminder(reminder);
        }
      });
    };

    const intervalId = setInterval(checkReminders, 1000);

    return () => clearInterval(intervalId);
  }, [reminders, fromZone]);

  return (
    <div className="grid w-full items-center gap-4">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="fromTime">{fromZone} Time (24h format)</Label>
        <Input
          id="fromTime"
          value={fromTime}
          onChange={(e) => {
            setFromTime(e.target.value);
            if (reminderSet) {
              clearAllReminders();
            }
          }}
          placeholder={currentFromTime || "Enter time (e.g., 14:30)"}
          pattern="[0-9]{2}:[0-9]{2}"
        />
      </div>
      <div className="flex flex-col space-y-1.5">
        <Label>{toZone} Time (24h format)</Label>
        <div className="text-2xl font-bold">{toTime24 || "---"}</div>
      </div>
      <div className="flex flex-col space-y-1.5">
        <Label>{toZone} Time (12h format)</Label>
        <div className="text-2xl font-bold">{toTime12 || "---"}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            if (!audioEnabled) {
              await initializeAudio();
            } else {
              setAudioEnabled(false);
            }
          }}
          className="w-10 h-10">
          {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <span className="text-sm text-muted-foreground">
          {audioEnabled ? "Audio notifications enabled" : "Click to enable audio notifications"}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={reminderSet ? clearAllReminders : setReminder}
          className="flex-1"
          variant={reminderSet ? "destructive" : "default"}>
          {reminderSet ? (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              Clear Reminder
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Set Reminder
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
