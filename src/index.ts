import { config } from "./config";
import { connectDB, disconnectDB } from "./db/connection";
import { createDNSServer } from "./dns/server";
import { createAPIServer } from "./api/routes";
import { UserModel } from "./models/User";
import { DNSRecordModel } from "./models/DNSRecord";

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

  // const user = await UserModel.create({
  //   email: "abcd@example.com",
  // });

  // await DNSRecordModel.create({
  //   subdomain: "first4",
  //   type: "CNAME",
  //   value: "4.pnath.in",
  //   userId: user._id,
  // });

  // Handle shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down servers...");
    dnsServer.close();
    await disconnectDB();
    process.exit();
  });
}

main().catch(console.error);
