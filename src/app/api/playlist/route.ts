import { NextRequest, NextResponse } from "next/server";
import { Playlist } from "@/db/models/playlist";
import { connectToDatabase } from "@/db/connection/dbconnect";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import mongoose from "mongoose";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const id = params.get("id") || null;
    if (!id || id.trim() === "") throw new Error("owner required");
    const page = Number(params.get("page")) || 1;
    const limit = Number(params.get("limit")) || 10;
    const query = params.get("query") || null;
    const sortBy = params.get("sortBy") || "createdAt";
    const sortOrder = params.get("sortType")?.toLowerCase() === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {
      owner: new mongoose.Types.ObjectId(id),
      public: true,
    };
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
        $lookup: {
          from: "users", // use pluralized form
          localField: "owner",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $unwind: {
          path: "$creator",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          pipeline: [
            { $limit: 4 },
            {
              $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                _id: 1,
              },
            },
          ],
          as: "videos",
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          public: 1,
          createdAt: 1,
          videos: 1,
          creator: {
            _id: "$creator._id",
            username: "$creator.username",
            avatar: "$creator.avatar",
            name: "$creator.fullname",
          },
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
