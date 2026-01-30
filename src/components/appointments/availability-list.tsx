"use client";

import { deleteAvailability } from "@/actions/availability";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface AvailabilitySlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  day: string;
  dayOfWeek: number;
  slots: AvailabilitySlot[];
}

interface AvailabilityListProps {
  availabilityByDay: DayAvailability[];
}

export function AvailabilityList({ availabilityByDay }: AvailabilityListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteAvailability(id);
    });
  };

  const hasAnyAvailability = availabilityByDay.some((d) => d.slots.length > 0);

  if (!hasAnyAvailability) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No availability set</p>
        <p className="text-sm mt-1">Add your available times using the form</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {availabilityByDay.map((day) => {
        if (day.slots.length === 0) return null;

        return (
          <div key={day.dayOfWeek} className="border rounded-lg p-3">
            <h4 className="font-medium text-sm text-gray-900 mb-2">{day.day}</h4>
            <div className="space-y-2">
              {day.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                >
                  <Badge variant="secondary">
                    {slot.startTime} - {slot.endTime}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slot.id)}
                    disabled={isPending}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
