import { createSocket } from "dgram";
import { parseQuery } from "./parser";
import { buildResponse } from "./response";
import { DNSRecordModel } from "../models/DNSRecord";

export function createDNSServer(port: number) {
  const socket = createSocket("udp4");

  socket.on("message", async (msg: Buffer, rinfo) => {
    try {
      // Use msg directly as it's already a Buffer
      const query = parseQuery(msg);
      const domain = query.questions[0].name;

      const records = await DNSRecordModel.find({ subdomain: domain }).exec();

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
