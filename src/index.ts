import { config } from "./config";
import { connectDB, disconnectDB } from "./db/connection";
import { createDNSServer } from "./dns/server";
import { createAPIServer } from "./api/routes";

async function main() {
  // Connect to MongoDB
  await connectDB();

  // Start DNS server
  const dnsServer = createDNSServer(config.DNS_PORT);

  // Start API server
  const apiServer = createAPIServer();
  apiServer.listen(config.API_PORT, () => {
    console.log(`API Server running on port ${config.API_PORT}`);
  });

  // Handle shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down servers...");
    dnsServer.close();
    await disconnectDB();
    process.exit();
  });
}

main().catch(console.error);
