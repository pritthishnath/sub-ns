/**
 * Generates a hash of the input data using the specified algorithm.
 * @param data - The data to hash (string or Buffer)
 * @param algorithm - Hash algorithm to use (default: 'sha256')
 * @returns Promise<string> - The generated hash as a hex string
 */
async function generateHash(
  data: string | Buffer,
  algorithm: "sha256" | "sha512" | "md5" = "sha256"
): Promise<string> {
  // Convert string input to Buffer if needed
  const buffer = typeof data === "string" ? Buffer.from(data) : data;

  // Create hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest(
    algorithm.toUpperCase(),
    buffer
  );

  // Convert hash buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * Compares a plain text input against a stored hash.
 * @param input - The plain text input to verify
 * @param storedHash - The previously generated hash to compare against
 * @param algorithm - Hash algorithm to use (default: 'sha256')
 * @returns Promise<boolean> - True if hashes match, false otherwise
 */
async function compareHash(
  input: string | Buffer,
  storedHash: string,
  algorithm: "sha256" | "sha512" | "md5" = "sha256"
): Promise<boolean> {
  const inputHash = await generateHash(input, algorithm);
  return inputHash === storedHash.toLowerCase();
}

// Example usage:
async function example() {
  const text = "Hello, World!";

  // Generate a hash
  const hash = await generateHash(text);
  console.log("Generated hash:", hash);

  // Compare hash (should return true)
  const isMatch = await compareHash(text, hash);
  console.log("Hash matches:", isMatch);

  // Compare with different text (should return false)
  const noMatch = await compareHash("Different text", hash);
  console.log("Different text matches:", noMatch);
}

export { generateHash, compareHash };
