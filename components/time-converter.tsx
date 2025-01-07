"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";

interface TimeConverterProps {
  timeZones: { [key: string]: number };
}

interface Reminder {
  time: number;
  message: string;
  timeoutId: NodeJS.Timeout | null;
}

export function TimeConverter({ timeZones }: TimeConverterProps) {
  const [fromTime, setFromTime] = useState("");
  const [toTime24, setToTime24] = useState("");
  const [toTime12, setToTime12] = useState("");
  const [currentFromTime, setCurrentFromTime] = useState("");
  const [reminderSet, setReminderSet] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [fromZone, setFromZone] = useState(Object.keys(timeZones)[0]);
  const [toZone, setToZone] = useState("Cairo");
  const [timeFormat, setTimeFormat] = useState<"24h" | "12h">("24h");
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");
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
    const offset = timeZones[timezone];
    const localOffset = -now.getTimezoneOffset() / 60;
    const diffHours = offset - localOffset;
    return new Date(now.getTime() + diffHours * 60 * 60 * 1000);
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
        icon: alarmClockIconDataUrl,
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
    const targetOffset = timeZones[toZone];
    const sourceOffset = timeZones[fromZone];
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
  }, [fromTime, fromZone, toZone]);

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

  // Convert 12h to 24h format
  const convert12to24 = (time: string, meridiem: "AM" | "PM"): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "";

    let hours24 = hours;
    if (meridiem === "PM" && hours !== 12) hours24 += 12;
    if (meridiem === "AM" && hours === 12) hours24 = 0;

    return `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Convert 24h to 12h format
  const convert24to12 = (time: string): { time: string; meridiem: "AM" | "PM" } => {
    if (!time) return { time: "", meridiem: "AM" };
    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return { time: "", meridiem: "AM" };

    const meridiem = hours >= 12 ? "PM" : "AM";
    let hours12 = hours % 12;
    hours12 = hours12 === 0 ? 12 : hours12;

    return {
      time: `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
      meridiem,
    };
  };

  // Handle time input change
  const handleTimeChange = (value: string) => {
    if (timeFormat === "24h") {
      setFromTime(value);
      const { time, meridiem: newMeridiem } = convert24to12(value);
      setMeridiem(newMeridiem);
    } else {
      setFromTime(value);
      const time24 = convert12to24(value, meridiem);
      convertTime(time24);
    }
  };

  // Handle meridiem change
  const handleMeridiemChange = (newMeridiem: "AM" | "PM") => {
    setMeridiem(newMeridiem);
    if (timeFormat === "12h" && fromTime) {
      const time24 = convert12to24(fromTime, newMeridiem);
      convertTime(time24);
    }
  };

  // Handle format change
  const handleFormatChange = (newFormat: "24h" | "12h") => {
    setTimeFormat(newFormat);
    if (fromTime) {
      if (newFormat === "12h") {
        const { time, meridiem: newMeridiem } = convert24to12(fromTime);
        setFromTime(time);
        setMeridiem(newMeridiem);
      } else {
        const time24 = convert12to24(fromTime, meridiem);
        setFromTime(time24);
      }
    }
  };

  return (
    <div className="grid w-full items-center gap-4">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="fromZone">From Time Zone</Label>
        <Select value={fromZone} onValueChange={setFromZone}>
          <SelectTrigger id="fromZone">
            <SelectValue>{fromZone}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.keys(timeZones).map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Tabs
          value={timeFormat}
          onValueChange={(value) => handleFormatChange(value as "24h" | "12h")}
          className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="24h">24-hour</TabsTrigger>
            <TabsTrigger value="12h">12-hour</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="fromTime">
              {fromZone} Time ({timeFormat})
            </Label>
            <Input
              id="fromTime"
              value={fromTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              placeholder={currentFromTime || `Enter time (e.g., ${timeFormat === "24h" ? "14:30" : "02:30"})`}
              pattern="[0-9]{2}:[0-9]{2}"
              className="mt-1.5"
            />
          </div>
          {timeFormat === "12h" && (
            <div className="flex flex-col justify-end">
              <Select value={meridiem} onValueChange={handleMeridiemChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue>{meridiem}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="toZone">To Time Zone</Label>
        <Select value={toZone} onValueChange={setToZone}>
          <SelectTrigger id="toZone">
            <SelectValue>{toZone}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.keys(timeZones).map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
