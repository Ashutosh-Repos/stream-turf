import { NextRequest, NextResponse } from "next/server";
import { userModel } from "@/db/models/user";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import { userValidation } from "@/zod/commonValidations";
import { connectToDatabase } from "@/db/connection/dbconnect";

// use unique-names-generator instead of unique-username-generator
import { uniqueUsernameGenerator, Config } from "unique-username-generator";
const usernameSuggestion = (username: string) => {
  const suggestions = new Set<string>();
  const config: Config = {
    dictionaries: [[username]],
    separator: "",
    randomDigits: 5,
    length: 10,
  };
  for (let i = 0; i < 3; i++) {
    const suggestion = uniqueUsernameGenerator(config);
    suggestions.add(suggestion);
  }

  return Array.from(suggestions);
};

export const GET = async (req: NextRequest) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const valid_username = userValidation.parse(username);
    console.log(valid_username);
    const isExists = await userModel
      .findOne({ username: valid_username })
      .select("username");

    if (isExists) {
      const suggestions = usernameSuggestion(valid_username);
      return NextResponse.json({
        success: false,
        message: "username is not available",
        suggestions: suggestions,
      });
    }
    return NextResponse.json({
      success: true,
      message: "username is valid",
      data: { username: valid_username },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.log(error);
      const fieldErrors = error.errors?.[0].message;
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data format",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof MongoError) {
      return NextResponse.json(
        {
          success: false,
          error: "Database error",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
};

//http://localhost:3000/auth/create-username/67d3ef4db5cfaa3f9575460f
