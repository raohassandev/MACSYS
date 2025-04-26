import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

async function deleteDevice(deviceId: string) {
  const response = await fetch(`/api/devices/${deviceId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete device');
  }
  
  return response.json();
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      // Invalidate the devices cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      
      toast({
        title: "Device deleted",
        description: "The device has been successfully removed",
      });
    },
    onError: (error) => {
      console.error('Error deleting device:', error);
      
      toast({
        title: "Failed to delete device",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    },
  });
  
  return {
    deleteDevice: mutation.mutate,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}