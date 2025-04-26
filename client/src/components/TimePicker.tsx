import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  
  const [currentHour, setCurrentHour] = useState(parseInt(value.split(':')[0]));
  const [currentMinute, setCurrentMinute] = useState(parseInt(value.split(':')[1]));
  
  const handleHourChange = (hour: number) => {
    setCurrentHour(hour);
    onChange(`${hour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
  };
  
  const handleMinuteChange = (minute: number) => {
    setCurrentMinute(minute);
    onChange(`${currentHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  };
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label>Hour</Label>
        <Select value={currentHour.toString()} onValueChange={(val) => handleHourChange(parseInt(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Minute</Label>
        <Select value={currentMinute.toString()} onValueChange={(val) => handleMinuteChange(parseInt(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute.toString()}>
                {minute.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}