import { Buffer } from "node:buffer";

export interface DNSQuery {
  header: {
    id: number;
    flags: number;
    qdcount: number;
    ancount: number;
    nscount: number;
    arcount: number;
  };
  questions: Array<{
    name: string;
    type: number;
    class: number;
    length: number;
  }>;
}

export function parseQuery(msg: Buffer): DNSQuery {
  const header = {
    id: msg.readUInt16BE(0),
    flags: msg.readUInt16BE(2),
    qdcount: msg.readUInt16BE(4),
    ancount: msg.readUInt16BE(6),
    nscount: msg.readUInt16BE(8),
    arcount: msg.readUInt16BE(10),
  };

  let offset = 12;
  const questions = [];

  for (let i = 0; i < header.qdcount; i++) {
    const question = parseDNSQuestion(msg, offset);
    questions.push(question);
    offset += question.length;
  }

  return { header, questions };
}

export function parseDNSQuestion(msg: Buffer, offset: number) {
  const labels = [];
  let length = msg[offset];
  const startOffset = offset;

  while (length !== 0) {
    offset++;
    labels.push(msg.slice(offset, offset + length).toString());
    offset += length;
    length = msg[offset];
  }

  const name = labels.join(".");
  const type = msg.readUInt16BE(offset + 1);
  const cls = msg.readUInt16BE(offset + 3);

  return {
    name,
    type,
    class: cls,
    length: offset + 5 - startOffset,
  };
}
