import { NextRequest, NextResponse } from "next/server";
import { Video } from "@/db/models/video";
import { connectToDatabase } from "@/db/connection/dbconnect";
import { ZodError } from "zod";
import { MongoError } from "mongodb";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const page = Number(params.get("page")) || 1;
    const limit = Number(params.get("limit")) || 10;
    const query = params.get("query") || null;
    //const sortBy = params.get("sortBy") || "createdAt";
    const sortOrder =
      (params.get("sortType")?.toLowerCase() === "asc" ? 1 : -1) || -1;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }
    const videos = await Video.aggregate([
      {
        $match: {
          ...filter,
        },
      },
      {
        $sort: {
          createdAt: sortOrder,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { success: false, error: "No videos found" },
        { status: 203 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        message: "Success",
        data: videos,
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
        { success: false, error: "Invalid data format", details: fieldErrors },
        { status: 400 }
      );
    }

    if (error instanceof MongoError) {
      return NextResponse.json(
        { success: false, error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
};
