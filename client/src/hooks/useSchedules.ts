import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Schedule {
  _id: string;
  deviceId: string;
  registerName: string;
  value: number;
  time: string;
  days: string[];
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Create new schedule
async function createSchedule(scheduleData: Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scheduleData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create schedule');
  }
  
  return response.json();
}

// Get all schedules
async function fetchSchedules() {
  const response = await fetch('/api/schedules');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch schedules');
  }
  
  return response.json();
}

// Get schedules for a specific device
async function fetchDeviceSchedules(deviceId: string) {
  const response = await fetch(`/api/devices/${deviceId}/schedules`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch device schedules');
  }
  
  return response.json();
}

// Delete a schedule
async function deleteSchedule(scheduleId: string) {
  const response = await fetch(`/api/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete schedule');
  }
  
  return response.json();
}

// Toggle schedule enabled status
async function toggleSchedule(scheduleId: string) {
  const response = await fetch(`/api/schedules/${scheduleId}/toggle`, {
    method: 'PATCH',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to toggle schedule');
  }
  
  return response.json();
}

// Update a schedule
async function updateSchedule(scheduleId: string, updateData: Partial<Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>>) {
  const response = await fetch(`/api/schedules/${scheduleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update schedule');
  }
  
  return response.json();
}

export function useSchedules() {
  const queryClient = useQueryClient();
  
  // Query for fetching all schedules
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: fetchSchedules,
  });
  
  // Mutation for creating a new schedule
  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
  
  // Mutation for deleting a schedule
  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
  
  // Mutation for toggling schedule enabled status
  const toggleMutation = useMutation({
    mutationFn: toggleSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
  
  // Mutation for updating a schedule
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>> }) => 
      updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
  
  return {
    schedules,
    isLoading,
    error,
    createSchedule: createMutation.mutate,
    deleteSchedule: deleteMutation.mutate,
    toggleSchedule: toggleMutation.mutate,
    updateSchedule: (id: string, data: Partial<Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>>) => 
      updateMutation.mutate({ id, data }),
    isPending: createMutation.isPending || deleteMutation.isPending || toggleMutation.isPending || updateMutation.isPending,
  };
}

export function useDeviceSchedules(deviceId: string) {
  const queryClient = useQueryClient();
  
  // Query for fetching schedules for a specific device
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['schedules', deviceId],
    queryFn: () => fetchDeviceSchedules(deviceId),
    enabled: !!deviceId,
  });
  
  return {
    schedules,
    isLoading,
    error,
  };
}

export type { Schedule };