import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Device } from "@/types";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import RegisterForm from "./RegisterForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface RegistersPanelProps {
  device: Device;
}

interface Register {
  name: string;
  address: number;
  length: number;
  scaleFactor?: number;
  decimalPoint?: number;
  dataType?: string;
  byteOrder?: string;
}

export default function RegistersPanel({ device }: RegistersPanelProps) {
  const [isAddRegisterOpen, setIsAddRegisterOpen] = useState(false);
  const [isEditRegisterOpen, setIsEditRegisterOpen] = useState(false);
  const [isDeleteRegisterOpen, setIsDeleteRegisterOpen] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);
  const { toast } = useToast();
  
  const { data: registers, isLoading } = useQuery({
    queryKey: [`/api/devices/${device.id}/registers`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/devices/${device.id}/registers`);
      return response as Register[];
    },
  });
  
  const handleEditRegister = (register: Register) => {
    setSelectedRegister(register);
    setIsEditRegisterOpen(true);
  };
  
  const handleDeleteRegister = (register: Register) => {
    // Don't allow deleting the Setpoint register
    if (register.name.toLowerCase() === "setpoint") {
      toast({
        title: "Cannot Delete Setpoint",
        description: "The Setpoint register is required and cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedRegister(register);
    setIsDeleteRegisterOpen(true);
  };
  
  const confirmDeleteRegister = async () => {
    if (!selectedRegister) return;
    
    try {
      await apiRequest("DELETE", `/api/devices/${device.id}/registers/${selectedRegister.name}`);
      
      toast({
        title: "Register Deleted",
        description: `${selectedRegister.name} has been deleted.`,
      });
      
      // Invalidate queries to refresh device list and register list
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: [`/api/devices/${device.id}/registers`] });
      
      setIsDeleteRegisterOpen(false);
      setSelectedRegister(null);
    } catch (error) {
      console.error("Error deleting register:", error);
      toast({
        title: "Error",
        description: "Failed to delete the register.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Registers</CardTitle>
        <Button onClick={() => setIsAddRegisterOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Register
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : registers && registers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Scale Factor</TableHead>
                <TableHead>Decimal Point</TableHead>
                <TableHead>Byte Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.map((register) => (
                <TableRow key={register.name}>
                  <TableCell className="font-medium">{register.name}</TableCell>
                  <TableCell>{register.address}</TableCell>
                  <TableCell>{register.length}</TableCell>
                  <TableCell>{register.scaleFactor || 1}</TableCell>
                  <TableCell>{register.decimalPoint || 0}</TableCell>
                  <TableCell>{register.byteOrder || "AB CD"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEditRegister(register)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Register</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className={register.name.toLowerCase() === "setpoint" ? "opacity-50 cursor-not-allowed" : ""}
                              onClick={() => handleDeleteRegister(register)}
                              disabled={register.name.toLowerCase() === "setpoint"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {register.name.toLowerCase() === "setpoint" 
                              ? "Setpoint register cannot be deleted" 
                              : "Delete Register"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No registers found</p>
            <p className="text-gray-400 text-sm">
              Add registers to configure what data this device will read and write
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Add Register Modal */}
      <RegisterForm
        open={isAddRegisterOpen}
        onClose={() => setIsAddRegisterOpen(false)}
        deviceId={device.id}
      />
      
      {/* Edit Register Modal */}
      {selectedRegister && (
        <RegisterForm
          open={isEditRegisterOpen}
          onClose={() => {
            setIsEditRegisterOpen(false);
            setSelectedRegister(null);
          }}
          deviceId={device.id}
          existingRegister={selectedRegister}
          isEdit={true}
        />
      )}
      
      {/* Delete Register Confirmation */}
      <AlertDialog open={isDeleteRegisterOpen} onOpenChange={setIsDeleteRegisterOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Register</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRegister?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRegister(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRegister}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}