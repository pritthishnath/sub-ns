declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "staging";
      DNS_PORT: string;
      API_PORT: string;
      MONGODB_URI: string;
      JWT_SECRET: string;
      ADMIN_PASSWORD: string;
    }
  }
}

export {};
