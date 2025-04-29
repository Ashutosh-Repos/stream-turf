// import NextAuth, { CredentialsSignin } from "next-auth";
import NextAuth, { type User, type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt-edge";
import { userModel } from "./db/models/user";
import { Iuser } from "./db/models/user";
import { connectToDatabase } from "./db/connection/dbconnect";
import {
  userValidation,
  emailValidation,
  passwordValidation,
} from "@/zod/commonValidations";
import { ZodError } from "zod";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      email: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    email: string;
  }
}
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Google,
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          if (
            typeof credentials?.identifier !== "string" ||
            typeof credentials?.password !== "string"
          ) {
            throw new Error("Invalid credentials format");
          }
          await connectToDatabase();
          console.log("1");
          if (!credentials) throw new Error("unable to get credentials");
          console.log(credentials);

          const parseResult =
            passwordValidation.safeParse(credentials.password).success &&
            (userValidation.safeParse(credentials.identifier).success ||
              emailValidation.safeParse(credentials.identifier).success);

          if (!parseResult) {
            throw new Error("invalid username or email");
          }
          console.log(credentials);
          console.log(3);
          const { identifier, password } = credentials;

          console.log(4);

          const user = await userModel.findOne<Iuser>({
            $or: [{ username: identifier }, { email: identifier }],
            $and: [{ verified: true }],
          });
          console.log(user);
          if (!user) throw new Error("not registered");
          if (!user?.password) throw new Error("password less, use oAuths");

          const isValidPassword = bcrypt.compareSync(password, user.password);
          console.log(isValidPassword);
          if (!isValidPassword) throw new Error("invalid credentials");

          console.log("7");
          const userData: User = {
            email: user.email as string,
            username: user.username as string,
            id: user._id.toString() as string,
          };

          console.log("8");
          return userData;
        } catch (error: unknown) {
          if (error instanceof ZodError) {
            console.error("Validation error:", error.errors);
          } else if (error instanceof Error) {
            console.error("Authorization error:", error.message);
          } else {
            console.error("Unknown error during authorization");
          }
          return null;
        }
      },
    }),
  ],
  // pages: {
  //   signIn: "/login",
  //   signOut: "/login",
  // },
  callbacks: {
    async redirect({ baseUrl }) {
      return baseUrl; // ✅ this is correct
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as User).id;
        token.username = (user as User).username;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60,
  },
  secret: process.env.AUTH_SECRET,
});
