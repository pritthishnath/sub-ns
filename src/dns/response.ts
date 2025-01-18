import { DNSRecordDoc } from "../models/DNSRecord";
import { DNSQuery } from "./parser";

export function buildResponse(
  query: DNSQuery,
  originalMsg: Buffer,
  records: DNSRecordDoc[]
): Buffer {
  // Create response as Uint8Array instead of Buffer
  const response = new Uint8Array(512);

  // Copy ID from query (first 2 bytes)
  response.set(new Uint8Array(originalMsg.buffer, 0, 2), 0);

  // Set response flags
  response[2] = 0x81; // First byte of flags
  response[3] = 0x80; // Second byte of flags

  // Copy question count (bytes 4-5)
  response.set(new Uint8Array(originalMsg.buffer, 4, 2), 4);

  // Set answer count (bytes 6-7)
  response[6] = 0x00;
  response[7] = records.length;

  // Set authority and additional counts to 0
  response[8] = 0x00;
  response[9] = 0x00;
  response[10] = 0x00;
  response[11] = 0x00;

  // Copy question section
  let offset = 12;
  response.set(
    new Uint8Array(originalMsg.buffer, offset, query.questions[0].length),
    offset
  );
  offset += query.questions[0].length;

  // Add answers
  for (const record of records) {
    offset = addAnswerToResponse(response, offset, record);
  }

  // Convert back to Buffer and return only the used portion
  return Buffer.from(response.buffer, 0, offset);
}

function addAnswerToResponse(
  response: Buffer,
  offset: number,
  record: DNSRecordDoc
): number {
  // Name pointer to question
  response.writeUInt16BE(0xc00c, offset);
  offset += 2;

  // Type A record
  response.writeUInt16BE(1, offset);
  offset += 2;

  // Class IN
  response.writeUInt16BE(1, offset);
  offset += 2;

  // TTL
  response.writeUInt32BE(record.ttl, offset);
  offset += 4;

  const ip = record.value.split(".");

  // Length of IP address
  response.writeUInt16BE(4, offset);
  offset += 2;

  // IP address
  ip.forEach((octet) => {
    response.writeUInt8(parseInt(octet), offset++);
  });

  return offset;
}
