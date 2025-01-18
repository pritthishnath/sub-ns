export const config = {
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/dns-server",
  DNS_PORT: parseInt(process.env.DNS_PORT || "53"),
  API_PORT: parseInt(process.env.API_PORT || "3000"),
};
