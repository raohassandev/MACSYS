import { useState, useEffect } from "react";
import { Device, Register } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditDeviceModalProps {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedDevice: Device) => Promise<boolean>;
}

export default function EditDeviceModal({ 
  device, 
  open, 
  onOpenChange,
  onSave 
}: EditDeviceModalProps) {
  console.log("EditDeviceModal rendered with open state:", open);
  // Clone the device for editing
  const [editedDevice, setEditedDevice] = useState<Device>({ ...device });
  const [isPending, setIsPending] = useState(false);
  
  // Reset form when device changes
  useEffect(() => {
    setEditedDevice({ ...device });
  }, [device]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedDevice({ ...editedDevice, [name]: value });
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedDevice({ ...editedDevice, [name]: parseInt(value, 10) });
  };

  // Handle switch toggle
  const handleSwitchChange = (checked: boolean) => {
    setEditedDevice({ ...editedDevice, enabled: checked });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    
    try {
      // Validate inputs
      if (!editedDevice.name || !editedDevice.ipAddress) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        setIsPending(false);
        return;
      }
      
      // Call the onSave function with the edited device
      const success = await onSave(editedDevice);
      
      if (success) {
        toast({
          title: "Device Updated",
          description: `${editedDevice.name} has been updated successfully.`,
        });
        
        // Close the modal on success
        onOpenChange(false);
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update the device. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating device:", error);
      toast({
        title: "Update Error",
        description: `An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Device
          </DialogTitle>
          <DialogDescription>
            Update the device information and configuration.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input 
                  id="name"
                  name="name"
                  value={editedDevice.name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter device name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type</Label>
                <Input 
                  id="deviceType"
                  name="deviceType"
                  value={editedDevice.deviceType || ''}
                  onChange={handleInputChange}
                  placeholder="Modbus TCP, RTU, etc."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description"
                name="description"
                value={editedDevice.description || ''}
                onChange={handleInputChange}
                placeholder="Enter device description"
                rows={2}
              />
            </div>
          </div>
          
          {/* Connection Settings */}
          <div className="space-y-4 border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium">Connection Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input 
                  id="ipAddress"
                  name="ipAddress"
                  value={editedDevice.ipAddress || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 192.168.1.100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input 
                  id="port"
                  name="port"
                  type="number"
                  value={editedDevice.port || 502}
                  onChange={handleNumberChange}
                  placeholder="e.g., 502"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slaveId">Slave ID</Label>
                <Input 
                  id="slaveId"
                  name="slaveId"
                  type="number"
                  value={editedDevice.slaveId || 1}
                  onChange={handleNumberChange}
                  placeholder="e.g., 1"
                  required
                />
              </div>
              <div className="flex items-center space-x-2 pt-7">
                <Switch 
                  id="enabled"
                  checked={editedDevice.enabled}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="enabled">Device Enabled</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}