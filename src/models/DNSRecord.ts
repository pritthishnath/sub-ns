import mongoose, { Schema } from "mongoose";

export type RecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

export interface DNSRecordDoc {
  subdomain: string;
  type: RecordType;
  value: string;
  ttl: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DNSRecordSchema = new Schema<DNSRecordDoc>(
  {
    subdomain: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS"],
      required: true,
    },
    value: { type: String, required: true },
    ttl: { type: Number, default: 3600 },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

DNSRecordSchema.index({ subdomain: 1, type: 1 });

export const DNSRecordModel = mongoose.model<DNSRecordDoc>(
  "dnsrecord",
  DNSRecordSchema
);
