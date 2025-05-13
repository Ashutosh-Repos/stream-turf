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
    username: string | undefined;
    email: string;
    verified: boolean;
    avatar?: string | undefined;
  }

  interface JWT {
    id: string;
    username: string | undefined;
    email: string;
    verified: boolean;
    avatar?: string | undefined;
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
      authorize: async (
        credentials: Partial<Record<"identifier" | "password", unknown>>
      ) => {
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
            verified: user.verified as boolean,
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
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    async redirect({ baseUrl }) {
      return baseUrl; // ✅ this is correct
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.verified = token.verified as boolean;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as User).id;
        token.username = (user as User).username;
        token.email = (user as User).email;
        token.verified = (user as User).verified;
      }
      return token;
    },

    async signIn({ user, account }) {
      if (!account) return false;

      if (account.provider === "credentials") {
        // Skip registration logic for credentials
        return true;
      }

      // OAuth logic (Google, GitHub, etc.)
      await connectToDatabase();

      const existingUser = await userModel.findOne({ email: user.email });

      if (!existingUser) {
        const newUser = await userModel.create({
          email: user.email,
          username: null,
          password: null,
          verified: true,
          // optionally set avatar or other fields here
        });
        if (!newUser) return false;

        user.email = newUser.email;
        user.id = newUser.id;
        user.username = newUser.username;
        user.verified = newUser.verified;
        user.avatar = newUser.avatar;

        return true;
      }

      user.email = existingUser.email;
      user.id = existingUser.id;
      user.username = existingUser.username;
      user.verified = existingUser.verified;
      user.avatar = existingUser.avatar;

      console.log(user);

      return true;
    },
    // authorized: async ({ auth }) => {
    //   return !!auth;
    // },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 24,
  },

  secret: process.env.AUTH_SECRET,
});
