import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/hooks/useDevice";
import { useRegisterData } from "@/hooks/useRegisterData";
import { Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import WriteRegisterModal from "./WriteRegisterModal";

interface RegisterTableProps {
  deviceId: number;
}

export default function RegisterTable({ deviceId }: RegisterTableProps) {
  const { data: device, isLoading: isDeviceLoading } = useDevice(deviceId);
  const { data: latestData, isLoading: isDataLoading } = useRegisterData(deviceId);
  const [selectedRegister, setSelectedRegister] = useState<{
    name: string;
    value: any;
    address: number;
  } | null>(null);
  
  if (isDeviceLoading || isDataLoading) {
    return <RegisterTableSkeleton />;
  }
  
  // Example registers for now (would be provided by API in a real implementation)
  const registers = [
    { name: "Temperature", address: 40001, type: "Float", value: "24.5°C", lastUpdate: "2 seconds ago", readOnly: false },
    { name: "Pressure", address: 40003, type: "Float", value: "3.2 bar", lastUpdate: "2 seconds ago", readOnly: false },
    { name: "Valve Position", address: 40005, type: "Integer", value: "75%", lastUpdate: "2 seconds ago", readOnly: false },
    { name: "Pump Status", address: 1, type: "Coil", value: "ON", lastUpdate: "2 seconds ago", readOnly: false },
    { name: "Alarm Status", address: 10001, type: "Discrete Input", value: "OFF", lastUpdate: "2 seconds ago", readOnly: true },
  ];
  
  const handleWriteRegister = (name: string, value: any, address: number) => {
    setSelectedRegister({ name, value, address });
  };
  
  const handleCloseModal = () => {
    setSelectedRegister(null);
  };
  
  return (
    <div>
      <h4 className="text-lg font-bold mb-3">Modbus Registers</h4>
      <div className="bg-secondary rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Address</th>
              <th className="py-2 px-3 text-left">Type</th>
              <th className="py-2 px-3 text-left">Value</th>
              <th className="py-2 px-3 text-left">Last Update</th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {registers.map((register) => (
              <tr key={register.address} className="hover:bg-muted">
                <td className="py-2 px-3">{register.name}</td>
                <td className="py-2 px-3 font-mono">{register.address}</td>
                <td className="py-2 px-3">{register.type}</td>
                <td className="py-2 px-3 font-bold">{register.value}</td>
                <td className="py-2 px-3 text-xs">{register.lastUpdate}</td>
                <td className="py-2 px-3">
                  {register.readOnly ? (
                    <Button variant="ghost" size="icon" disabled>
                      <Pencil className="h-4 w-4 text-gray-400" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleWriteRegister(register.name, register.value, register.address)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Write Register Modal */}
      {selectedRegister && (
        <WriteRegisterModal
          device={device!}
          register={selectedRegister.name}
          address={selectedRegister.address}
          currentValue={selectedRegister.value}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

function RegisterTableSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-40 mb-3" />
      <div className="bg-secondary rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-muted">
            <tr>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <th key={i} className="py-2 px-3">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <td key={`${row}-${col}`} className="py-2 px-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
