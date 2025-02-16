import { createSocket } from "dgram";
import { parseQuery } from "./parser";
import { buildResponse } from "./response";
import { DNS_TYPES, DNSRecordModel } from "../models/DNSRecord";

export function createDNSServer(port: number) {
  const socket = createSocket("udp4");

  socket.on("error", (err) => {
    console.error("DNS Server error:", err);
  });

  socket.on("message", async (msg: Buffer, rinfo) => {
    console.log(`Received DNS query from ${rinfo.address}:${rinfo.port}`);
    try {
      // Use msg directly as it's already a Buffer
      const query = parseQuery(msg);

      console.log("Query:", {
        domain: query.questions[0].name,
        type: DNS_TYPES[query.questions[0].type],
        flags: query.header.flags.toString(16),
      });
      const domain = query.questions[0].name.toLowerCase();
      const queryTypeNum = query.questions[0].type;
      const queryType = DNS_TYPES[queryTypeNum];

      const records = await DNSRecordModel.find({
        subdomain: domain,
        type: queryType,
      }).exec();

      console.log(`Found ${records.length} records`);

      // Build response directly as Buffer
      const response = buildResponse(query, msg, records);

      socket.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) console.error("Error sending response:", err);
      });
    } catch (err) {
      console.error("Error handling DNS query:", err);
    }
  });

  socket.on("listening", () => {
    const address = socket.address();
    console.log(`DNS Server listening on ${address.address}:${address.port}`);
  });

  socket.bind(port);

  return socket;
}
