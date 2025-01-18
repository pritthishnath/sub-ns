import { DNSRecordDoc } from "../models/DNSRecord";
import { DNSQuery } from "./parser";

export function buildResponse(
  query: DNSQuery,
  originalMsg: Buffer,
  records: DNSRecordDoc[]
): Uint8Array {
  const response = new Uint8Array(512);

  // Copy ID from query
  response.set(originalMsg.subarray(0, 2), 0);

  // Set flags
  response[2] = 0x81;
  response[3] = 0x80;

  // Copy question count
  response.set(originalMsg.subarray(4, 6), 4);

  // Set answer count
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
    originalMsg.subarray(offset, offset + query.questions[0].length),
    offset
  );
  offset += query.questions[0].length;

  // Add answers
  for (const record of records) {
    offset = addAnswerToResponse(response, offset, record);
  }

  return response.subarray(0, offset);
}

export function addAnswerToResponse(
  response: Uint8Array,
  offset: number,
  record: DNSRecordDoc
): number {
  // Name pointer to question
  response[offset] = 0xc0;
  response[offset + 1] = 0x0c;
  offset += 2;

  // Type A record
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // Class IN
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // TTL (32 bits)
  const ttl = record.ttl || 3600;
  response[offset] = (ttl >> 24) & 0xff;
  response[offset + 1] = (ttl >> 16) & 0xff;
  response[offset + 2] = (ttl >> 8) & 0xff;
  response[offset + 3] = ttl & 0xff;
  offset += 4;

  // IP address length (4 bytes for IPv4)
  response[offset] = 0x00;
  response[offset + 1] = 0x04;
  offset += 2;

  // IP address
  const ip = record.value.split(".");
  ip.forEach((octet) => {
    response[offset++] = parseInt(octet);
  });

  return offset;
}
