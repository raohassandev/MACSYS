import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/hooks/useDevice";
import { useRegisterData } from "@/hooks/useRegisterData";
import { Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import WriteRegisterModal from "./WriteRegisterModal";

interface RegisterTableProps {
  deviceId: string;
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
  
  // Use actual registers from the device
  const deviceRegisters = device?.registers || [];
  const registerValues = latestData?.data || {};
  
  // Format the register data for display
  const registers = deviceRegisters.map(register => {
    const value = registerValues[register.name] !== undefined 
      ? registerValues[register.name] 
      : 'N/A';
      
    const formattedValue = typeof value === 'number' 
      ? value.toFixed(register.decimalPoint || 2)
      : value;
      
    return {
      name: register.name,
      address: register.address,
      type: register.dataType || 'Float',
      value: formattedValue,
      byteOrder: register.byteOrder || 'big', // Display byte order
      scaleFactor: register.scaleFactor || 1,
      decimalPoint: register.decimalPoint || 2,
      lastUpdate: latestData?.timestamp 
        ? new Date(latestData.timestamp).toLocaleTimeString()
        : 'N/A',
      readOnly: register.name.toLowerCase() !== 'setpoint'
    };
  });
  
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
              <th className="py-2 px-3 text-left">Byte Order</th>
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
                <td className="py-2 px-3">
                  <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs font-mono">
                    {register.byteOrder || "AB CD"}
                  </span>
                </td>
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
              {[1, 2, 3, 4, 5, 6, 7].map((i) => ( // Added one more for byte order column
                <th key={i} className="py-2 px-3">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6, 7].map((col) => ( // Added one more for byte order column
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
