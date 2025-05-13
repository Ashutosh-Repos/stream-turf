import { NextRequest, NextResponse } from "next/server";
import { Playlist } from "@/db/models/playlist";
import { connectToDatabase } from "@/db/connection/dbconnect";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import mongoose from "mongoose";

export const GET = async ({
  params,
}: {
  params: { id: string };
}): Promise<NextResponse> => {
  try {
    await connectToDatabase();
    const { id } = params;
    if (!id || id.trim() === "") throw new Error("playlist id is required");

    const playlists = await Playlist.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
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
          },
        },
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
        message: "success",
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

export const PATCH = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connectToDatabase();

    const { id } = params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Playlist ID is required" },
        { status: 400 }
      );
    }

    const { title, description, videos, isPublic } = await request.json();

    const update: Partial<{
      title: string;
      description: string;
      videos: string[];
      public: boolean;
    }> = {};

    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (videos !== undefined) update.videos = videos;
    if (isPublic !== undefined) update.public = isPublic;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    const playlist = await Playlist.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: "Playlist not found or invalid ID" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Playlist updated successfully",
        data: playlist,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorResponse = (msg: string, status = 500, details?: unknown) =>
      NextResponse.json({ success: false, error: msg, details }, { status });

    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return errorResponse("Invalid data format", 400, details);
    }

    if (error instanceof MongoError) {
      return errorResponse("Database error", 500, error.message);
    }

    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }

    return errorResponse("An unexpected error occurred", 500);
  }
};
