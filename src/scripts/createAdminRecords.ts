import { connectDB, disconnectDB } from "../db/connection";
import { generateHash } from "../lib/hash-utils";
import { DNSRecordModel } from "../models/DNSRecord";
import { UserModel } from "../models/User";

// Create admin user
const createAdminAndRecords = async () => {
  try {
    await connectDB();
    // 1. Create admin user
    const password = await generateHash(process.env.ADMIN_PASSWORD);
    const adminUser = await UserModel.create({
      email: "admin@subns.xyz",
      name: "DNS Admin",
      role: "admin",
      password, // In practice, use bcrypt to hash the password
    });

    // 2. Create SOA record
    await DNSRecordModel.create({
      subdomain: "subns.xyz",
      type: "SOA",
      value: "ns1.subns.xyz",
      mname: "ns1.subns.xyz",
      rname: "hostmaster.subns.xyz",
      serial: Math.floor(Date.now() / 1000), // Current timestamp as serial
      refresh: 7200, // 2 hours
      retry: 3600, // 1 hour
      expire: 1209600, // 2 weeks
      minimum: 3600, // 1 hour
      ttl: 3600,
      userId: adminUser._id,
    });

    // 3. Create NS records
    await DNSRecordModel.create([
      {
        subdomain: "subns.xyz",
        type: "NS",
        value: "ns1.subns.xyz",
        ttl: 3600,
        userId: adminUser._id,
      },
      {
        subdomain: "subns.xyz",
        type: "NS",
        value: "ns2.subns.xyz",
        ttl: 3600,
        userId: adminUser._id,
      },
    ]);

    // 4. Create A records for nameservers
    await DNSRecordModel.create([
      {
        subdomain: "ns1.subns.xyz",
        type: "A",
        value: "64.227.145.83",
        ttl: 300,
        userId: adminUser._id,
      },
      {
        subdomain: "ns2.subns.xyz",
        type: "A",
        value: "64.227.145.83",
        ttl: 300,
        userId: adminUser._id,
      },
    ]);

    console.log("Admin user and DNS records created successfully");
  } catch (error) {
    console.error("Error creating admin and records:", error);
  } finally {
    await disconnectDB();
    process.exit();
  }
};

createAdminAndRecords();
