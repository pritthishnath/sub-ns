import { DNS_TYPES, DNSRecordDoc } from "../models/DNSRecord";
import { DNSQuery } from "./parser";

const DNS_TYPES_NUMBER = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
};

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
    switch (record.type) {
      case "A":
        offset = addARecordToResponse(response, offset, record);
        break;
      case "NS":
        offset = addNSRecordToResponse(response, offset, record);
        break;
      case "SOA":
        offset = addSOARecordToResponse(response, offset, record);
        break;
      case "CNAME":
        offset = addCNAMERecordToResponse(response, offset, record);
        break;
      case "MX":
        offset = addMXRecordToResponse(response, offset, record);
        break;
      case "TXT":
        offset = addTXTRecordToResponse(response, offset, record);
        break;
        break;
      default:
        console.error(`Unsupported record type: ${record.type}`);
    }
  }

  return response.subarray(0, offset);
}

export function addARecordToResponse(
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
  response[offset + 1] = DNS_TYPES_NUMBER["A"];
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

function addNSRecordToResponse(
  response: Uint8Array,
  offset: number,
  record: DNSRecordDoc
): number {
  response[offset] = 0xc0;
  response[offset + 1] = 0x0c;
  offset += 2;

  // Type NS record
  response[offset] = 0x00;
  response[offset + 1] = DNS_TYPES_NUMBER["NS"];
  offset += 2;

  // Class IN
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // TTL
  const ttl = record.ttl || 3600;
  response[offset] = (ttl >> 24) & 0xff;
  response[offset + 1] = (ttl >> 16) & 0xff;
  response[offset + 2] = (ttl >> 8) & 0xff;
  response[offset + 3] = ttl & 0xff;
  offset += 4;

  // Add nameserver domain name
  const labels = record.value.split(".");
  const startOffset = offset + 2;
  let totalLength = 0;

  for (const label of labels) {
    response[offset++] = label.length;
    for (let i = 0; i < label.length; i++) {
      response[offset++] = label.charCodeAt(i);
    }
    totalLength += label.length + 1;
  }
  response[offset++] = 0; // null terminator
  totalLength += 1;

  // Write length
  response[startOffset - 2] = (totalLength >> 8) & 0xff;
  response[startOffset - 1] = totalLength & 0xff;

  return offset;
}

function addSOARecordToResponse(
  response: Uint8Array,
  offset: number,
  record: DNSRecordDoc
): number {
  response[offset] = 0xc0;
  response[offset + 1] = 0x0c;
  offset += 2;

  // Type SOA record
  response[offset] = 0x00;
  response[offset + 1] = DNS_TYPES_NUMBER["SOA"];
  offset += 2;

  // Class IN
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // TTL
  const ttl = record.ttl || 3600;
  response[offset] = (ttl >> 24) & 0xff;
  response[offset + 1] = (ttl >> 16) & 0xff;
  response[offset + 2] = (ttl >> 8) & 0xff;
  response[offset + 3] = ttl & 0xff;
  offset += 4;

  // Add SOA specific data

  // Start calculating length
  let startOffset = offset;
  offset += 2; // Reserve space for length

  // Add primary nameserver
  offset = writeDomainName(response, offset, record.mname || "ns1.subns.xyz");

  // Add admin email
  offset = writeDomainName(response, offset, record.rname || "admin.subns.xyz");

  // Add SOA numbers with defaults
  const serial = record.serial || Math.floor(Date.now() / 1000);
  const refresh = record.refresh || 7200; // 2 hours
  const retry = record.retry || 3600; // 1 hour
  const expire = record.expire || 1209600; // 2 weeks
  const minimum = record.minimum || 3600; // 1 hour

  // Write the numbers
  offset = writeUint32(response, offset, serial);
  offset = writeUint32(response, offset, refresh);
  offset = writeUint32(response, offset, retry);
  offset = writeUint32(response, offset, expire);
  offset = writeUint32(response, offset, minimum);

  // Write total length
  const totalLength = offset - startOffset - 2;
  response[startOffset] = (totalLength >> 8) & 0xff;
  response[startOffset + 1] = totalLength & 0xff;

  return offset;
}

function writeDomainName(
  response: Uint8Array,
  offset: number,
  domain: string
): number {
  const labels = domain.split(".");
  for (const label of labels) {
    response[offset++] = label.length;
    for (let i = 0; i < label.length; i++) {
      response[offset++] = label.charCodeAt(i);
    }
  }
  response[offset++] = 0; // null terminator
  return offset;
}

function writeUint32(
  response: Uint8Array,
  offset: number,
  value: number
): number {
  response[offset++] = (value >> 24) & 0xff;
  response[offset++] = (value >> 16) & 0xff;
  response[offset++] = (value >> 8) & 0xff;
  response[offset++] = value & 0xff;
  return offset;
}

function addAAAARecordToResponse(
  response: Uint8Array,
  offset: number,
  record: DNSRecordDoc
): number {
  response[offset] = 0xc0;
  response[offset + 1] = 0x0c;
  offset += 2;

  // Type AAAA
  response[offset] = 0x00;
  response[offset + 1] = DNS_TYPES_NUMBER["AAAA"];
  offset += 2;

  // Class IN
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // TTL
  offset = writeTTL(response, offset, record.ttl || 3600);

  // IPv6 address length (16 bytes)
  response[offset] = 0x00;
  response[offset + 1] = 0x10;
  offset += 2;

  // IPv6 address
  const parts = record.value.split(":");
  for (const part of parts) {
    const value = parseInt(part, 16);
    response[offset++] = (value >> 8) & 0xff;
    response[offset++] = value & 0xff;
  }

  return offset;
}

function addMXRecordToResponse(
  response: Uint8Array,
  offset: number,
  record: DNSRecordDoc
): number {
  response[offset] = 0xc0;
  response[offset + 1] = 0x0c;
  offset += 2;

  // Type MX
  response[offset] = 0x00;
  response[offset + 1] = DNS_TYPES_NUMBER["MX"];
  offset += 2;

  // Class IN
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // TTL
  offset = writeTTL(response, offset, record.ttl || 3600);

  // Reserve space for length
  const lengthOffset = offset;
  offset += 2;

  // Preference
  response[offset++] = 0x00;
  response[offset++] = record.priority || 10;

  // Exchange
  const startOffset = offset;
  offset = writeDomainName(response, offset, record.value);

  // Write total length
  const totalLength = offset - startOffset + 2; // +2 for preference
  response[lengthOffset] = (totalLength >> 8) & 0xff;
  response[lengthOffset + 1] = totalLength & 0xff;

  return offset;
}

function addTXTRecordToResponse(
  response: Uint8Array,
  offset: number,
  record: DNSRecordDoc
): number {
  response[offset] = 0xc0;
  response[offset + 1] = 0x0c;
  offset += 2;

  // Type TXT
  response[offset] = 0x00;
  response[offset + 1] = DNS_TYPES_NUMBER["TXT"];
  offset += 2;

  // Class IN
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // TTL
  offset = writeTTL(response, offset, record.ttl || 3600);

  // Text strings
  const txt = record.value.toString();
  const txtLength = txt.length;

  // Total length (including the length byte)
  response[offset++] = 0x00;
  response[offset++] = txtLength + 1;

  // String length
  response[offset++] = txtLength;

  // String data
  for (let i = 0; i < txtLength; i++) {
    response[offset++] = txt.charCodeAt(i);
  }

  return offset;
}

function addCNAMERecordToResponse(
  response: Uint8Array,
  offset: number,
  record: DNSRecordDoc
): number {
  response[offset] = 0xc0;
  response[offset + 1] = 0x0c;
  offset += 2;

  // Type CNAME
  response[offset] = 0x00;
  response[offset + 1] = DNS_TYPES_NUMBER["CNAME"];
  offset += 2;

  // Class IN
  response[offset] = 0x00;
  response[offset + 1] = 0x01;
  offset += 2;

  // TTL
  offset = writeTTL(response, offset, record.ttl || 3600);

  // Reserve space for length
  const lengthOffset = offset;
  offset += 2;

  // Write domain name
  const startOffset = offset;
  offset = writeDomainName(response, offset, record.value);

  // Write length
  const length = offset - startOffset;
  response[lengthOffset] = (length >> 8) & 0xff;
  response[lengthOffset + 1] = length & 0xff;

  return offset;
}

// Helper function for TTL
function writeTTL(response: Uint8Array, offset: number, ttl: number): number {
  response[offset] = (ttl >> 24) & 0xff;
  response[offset + 1] = (ttl >> 16) & 0xff;
  response[offset + 2] = (ttl >> 8) & 0xff;
  response[offset + 3] = ttl & 0xff;
  return offset + 4;
}
