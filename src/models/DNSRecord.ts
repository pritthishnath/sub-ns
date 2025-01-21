import mongoose, { Schema } from "mongoose";

export type RecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SOA";

export const DNS_TYPES: { [key: number]: string } = {
  1: "A", // IPv4 address
  2: "NS", // Nameserver
  5: "CNAME", // Canonical name
  6: "SOA", // Start of Authority
  15: "MX", // Mail exchange
  16: "TXT", // Text records
  28: "AAAA", // IPv6 address
  // Add other types as needed
};

export interface DNSRecordDoc {
  subdomain: string;
  type: RecordType;
  value: string;
  ttl: number;
  priority?: number;
  mname?: string; // Primary nameserver
  rname?: string; // Admin email
  serial?: number; // Serial number
  refresh?: number; // Refresh interval
  retry?: number; // Retry interval
  expire?: number; // Expire time
  minimum?: number; // Minimum TTL
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DNSRecordSchema = new Schema<DNSRecordDoc>(
  {
    subdomain: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(DNS_TYPES),
      required: true,
    },
    value: { type: String, required: true },
    ttl: { type: Number, default: 3600 },
    priority: { type: Number },
    mname: { type: String },
    rname: { type: String },
    serial: { type: Number },
    refresh: { type: Number },
    retry: { type: Number },
    expire: { type: Number },
    minimum: { type: Number },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

DNSRecordSchema.index({ subdomain: 1, type: 1 });

export const DNSRecordModel = mongoose.model<DNSRecordDoc>(
  "dnsrecord",
  DNSRecordSchema
);
