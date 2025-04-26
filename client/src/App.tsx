import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import Dashboard from "@/pages/Dashboard";
import Devices from "@/pages/Devices";
import DeviceDetails from "@/pages/DeviceDetails";
import History from "@/pages/History";
import Reports from "@/pages/Reports";
import Schedules from "@/pages/Schedules";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/components/DashboardLayout";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/devices" component={Devices} />
          <Route path="/devices/:id" component={DeviceDetails} />
          <Route path="/history" component={History} />
          <Route path="/reports" component={Reports} />
          <Route path="/schedules" component={Schedules} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
      <Toaster />
    </QueryClientProvider>
  );
}
