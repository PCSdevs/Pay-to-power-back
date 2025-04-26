import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define an interface for strongly-typed configuration
interface ConfigData {
  port: number;
  accessTokenSecretKey: string;
  refreshTokenSecretKey: string;
  forgotPasswordTokenSecretKey: string;
  verificationTokenSecretKey:string
}

// Destructure and parse environment variables with type safety
const {
  PORT,
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
  FORGOT_PASSWORD_TOKEN_SECRET_KEY,
  VERIFY_TOKEN_SECRET_KEY
} = process.env;

// Validate required environment variables
if (
  !ACCESS_TOKEN_SECRET_KEY ||
  !REFRESH_TOKEN_SECRET_KEY ||
  !FORGOT_PASSWORD_TOKEN_SECRET_KEY ||
  !VERIFY_TOKEN_SECRET_KEY
) {
  throw new Error(
    "Missing required environment variables. Please check your .env file.",
  );
}

// Export the configuration object
export const configData: ConfigData = {
  port: parseInt(PORT as string, 10),
  accessTokenSecretKey: ACCESS_TOKEN_SECRET_KEY,
  refreshTokenSecretKey: REFRESH_TOKEN_SECRET_KEY,
  forgotPasswordTokenSecretKey: FORGOT_PASSWORD_TOKEN_SECRET_KEY,
  verificationTokenSecretKey:VERIFY_TOKEN_SECRET_KEY,
};
