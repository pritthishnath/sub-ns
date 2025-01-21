import { Elysia } from "elysia";
import { UserModel } from "../models/User";
import { DNSRecordModel } from "../models/DNSRecord";

export function createAPIServer() {
  const app = new Elysia();

  // Middleware
  const validateSubdomain = (subdomain: string): boolean => {
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(subdomain);
  };

  // Routes
  app.post("/api/records", async ({ body }) => {
    const { userId, subdomain, type, value, ttl } = body as any;

    if (!validateSubdomain(subdomain)) {
      throw new Error("Invalid subdomain format");
    }

    const user = await UserModel.findById(userId);
    // if (!user || !user.subdomains.includes(subdomain)) {
    //   throw new Error("Unauthorized to manage this subdomain");
    // }

    const record = new DNSRecordModel({ subdomain, type, value, ttl, userId });
    return await record.save();
  });

  app.get("/api/records/:subdomain", async ({ params }) => {
    return await DNSRecordModel.find({ subdomain: params.subdomain }).exec();
  });

  app.delete("/api/records/:id", async ({ params }) => {
    const result = await DNSRecordModel.deleteOne({ _id: params.id });
    return { success: result.deletedCount > 0 };
  });

  app.put("/api/records/:id", async ({ params, body }) => {
    const { type, value, ttl } = body as any;
    return await DNSRecordModel.findByIdAndUpdate(
      params.id,
      { type, value, ttl },
      { new: true }
    );
  });

  return app;
}
