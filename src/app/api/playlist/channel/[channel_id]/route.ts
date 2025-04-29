import { NextRequest, NextResponse } from "next/server";
import { Playlist } from "@/db/models/playlist";
import { connectToDatabase } from "@/db/connection/dbconnect";
import { ZodError } from "zod";
import { MongoError } from "mongodb";

export const GET = async (
  request: NextRequest,
  { params }: { params: { channel_id: string } }
): Promise<NextResponse> => {
  try {
    await connectToDatabase();
    const { channel_id } = params;
    if (!channel_id || channel_id.trim() === "")
      throw new Error("owner required");
    const parameters = request.nextUrl.searchParams;

    const id = parameters.get("id") || null;

    if (!id || id.trim() === "") throw new Error("please login...");

    const page = Math.max(1, parseInt(parameters.get("page") || "1", 10) || 1);

    const limit = Math.max(
      10,
      parseInt(parameters.get("limit") || "10", 10) || 10
    );

    const query = parameters.get("query") || null;
    const sortBy = parameters.get("sortBy") || "createdAt";
    const sortOrder =
      parameters.get("sortType")?.toLowerCase() === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = { owner: id, public: true };
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    const playlists = await Playlist.aggregate([
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

    if (!playlists || playlists.length === 0) {
      return NextResponse.json(
        { success: false, error: "No playlists found" },
        { status: 203 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        message: "Success",
        data: playlists,
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
