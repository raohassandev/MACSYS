import { connectToDatabase } from "../server/db";
import { Device, RealtimeData, HistoricalData } from "../server/models";

async function seedCircutorData() {
  try {
    console.log("Starting Circutor device data seeding...");

    // Connect to MongoDB
    await connectToDatabase();

    // Find the circutor device
    const device = await Device.findOne({ name: "circutor" });
    
    if (!device) {
      console.error("Circutor device not found, please create it first");
      return;
    }

    console.log(`Found device: ${device.name} with ID: ${device._id}`);

    // Create realtime data
    const realtimeData = {
      device: device._id.toString(),
      timestamp: new Date(),
      data: {
        "temperature": 27.5,
        "humidity": 65.2,
        "power": 1450.75,
        "energy": 15780.5,
        "Setpoint": 30.0
      },
      status: true,
      control: 'central'
    };

    // Save realtime data
    const realtime = new RealtimeData(realtimeData);
    await realtime.save();
    console.log("Created realtime data for Circutor device");

    // Create historical data (last 24 hours)
    console.log("Creating historical data for Circutor device...");
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      
      // Create some variation in the data
      const hourOfDay = timestamp.getHours();
      // Temperature fluctuates throughout the day
      const tempBase = 25;
      const tempVariation = Math.sin((hourOfDay - 12) * Math.PI / 12) * 5;
      
      const histData = {
        "temperature": parseFloat((tempBase + tempVariation).toFixed(1)),
        "humidity": parseFloat((60 + Math.random() * 10).toFixed(1)),
        "power": parseFloat((1200 + Math.random() * 500).toFixed(2)),
        "energy": parseFloat((15000 + i * 50 + Math.random() * 30).toFixed(2)),
        "Setpoint": 30.0
      };
      
      const historical = new HistoricalData({
        device: device._id.toString(),
        timestamp: timestamp,
        data: histData
      });
      
      await historical.save();
    }
    
    console.log("Circutor device data seeding completed!");
  } catch (error) {
    console.error("Error seeding Circutor device data:", error);
  }
}

// Execute the seed function
seedCircutorData().then(() => {
  console.log("Circutor seed process completed");
}).catch(err => {
  console.error("Circutor seed process error:", err);
});