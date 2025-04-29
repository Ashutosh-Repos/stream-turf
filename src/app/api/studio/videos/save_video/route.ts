import { NextRequest, NextResponse } from "next/server";
import { videoSaveParser } from "@/zod/zodParsingSchemas/videoSave";
import { userModel } from "@/db/models/user";
import { Video } from "@/db/models/video";
import { connectToDatabase } from "@/db/connection/dbconnect";
import { ZodError } from "zod";
import { MongoError } from "mongodb";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    await connectToDatabase();
    console.log("after db");
    const body = await request.json();
    console.log("after json");
    console.log(body);

    const {
      id,
      title,
      description,
      thumbnail,
      video,
      age_restriction,
      visibility,
    } = await videoSaveParser.parseAsync(body);
    console.log("parse success");
    const existingUser = await userModel.findById(id);
    if (existingUser?.verified) {
      return NextResponse.json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const newVideo = await Video.create({
      owner: existingUser?.id,
      thumbnail: thumbnail,
      video: video,
      title: title,
      description: description,
      age_restriction: age_restriction,
      public: visibility,
    });
    console.log("6");
    if (!newVideo) throw new Error("unable to create new user server error");

    console.log("8");
    return NextResponse.json(
      {
        success: true,
        message: "video saved",
        data: {
          url: newVideo?.video,
        },
      },
      { status: 201 }
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
