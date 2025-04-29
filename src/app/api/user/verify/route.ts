import { NextRequest, NextResponse } from "next/server";
import { userModel } from "@/db/models/user";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import { connectToDatabase } from "@/db/connection/dbconnect";

export const GET = async (req: NextRequest) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const verifyCode = searchParams.get("verifyCode");
    const isValid = await userModel
      .findOneAndUpdate(
        { verifyCode: verifyCode },
        {
          $set: {
            verified: true,
          },
        }
      )
      .select("_id");
    if (!isValid)
      return NextResponse.json(
        {
          success: false,
          error:
            "invalid verification link or link had expired or server error",
        },
        { status: 402 }
      );

    return NextResponse.json(
      {
        success: true,
        message: "user is verified succesfully",
        data: { id: isValid._id },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
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
