import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("polling");
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="polling">Polling</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="polling">
          <Card>
            <CardHeader>
              <CardTitle>Polling Configuration</CardTitle>
              <CardDescription>
                Configure how frequently the system polls devices for data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="realtimeInterval">Realtime Polling Interval (seconds)</Label>
                  <Input id="realtimeInterval" type="number" min="1" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="historicalInterval">Historical Data Interval (minutes)</Label>
                  <Input id="historicalInterval" type="number" min="1" defaultValue="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Connection Timeout (ms)</Label>
                  <Input id="timeout" type="number" min="100" defaultValue="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retries">Connection Retries</Label>
                  <Input id="retries" type="number" min="0" defaultValue="3" />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoReconnect">Auto Reconnect</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically attempt to reconnect to devices when connection is lost
                  </p>
                </div>
                <Switch id="autoReconnect" defaultChecked />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>
                Configure database connection and data retention policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dbUrl">Database URL</Label>
                  <Input id="dbUrl" defaultValue="mongodb://localhost:27017/modbus" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Data Retention Period (days)</Label>
                  <Input id="retention" type="number" min="1" defaultValue="30" />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compressData">Compress Historical Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply compression to older historical data to save space
                  </p>
                </div>
                <Switch id="compressData" defaultChecked />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2">Test Connection</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch id="emailNotifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via SMS
                  </p>
                </div>
                <Switch id="smsNotifications" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="webhookNotifications">Webhook Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send alerts to a webhook endpoint
                  </p>
                </div>
                <Switch id="webhookNotifications" />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="emailRecipients">Email Recipients</Label>
                <Input id="emailRecipients" placeholder="admin@example.com, alerts@example.com" />
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="mr-2">Test Notifications</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                General system configuration and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logLevel">Log Level</Label>
                  <select
                    id="logLevel"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    defaultValue="info"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    defaultValue="UTC"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Button variant="outline" className="w-full">Download System Logs</Button>
                <Button variant="outline" className="w-full">Backup Configuration</Button>
                <Button variant="outline" className="w-full">Restore Configuration</Button>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <Button variant="destructive">Reset to Defaults</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
