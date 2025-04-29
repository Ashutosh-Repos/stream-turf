import { NextRequest, NextResponse } from "next/server";
import { Video } from "@/db/models/video";
import { Playlist } from "@/db/models/playlist";
import { connectToDatabase } from "@/db/connection/dbconnect";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import { z } from "zod";
import mongoose from "mongoose";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    await connectToDatabase();
    const parameters = request.nextUrl.searchParams;
    const id = parameters.get("id") || null;
    console.log(id);
    if (!id || id.trim() === "") throw new Error("owner required");
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
    const filter: Record<string, any> = {
      owner: new mongoose.Types.ObjectId(id),
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

// const playlistSchema = z.object({
//   title: z.string().min(1, "Title is required"),
//   description: z.string().min(1, "Description is required"),
//   owner: z.string().min(1, "Owner ID is required"),
//   videos: z
//     .array(z.string().min(1, "Video ID is required"))
//     .min(1, "At least one video is required"),
//   public: z.boolean(),
// });
// export const POST = async (request: NextRequest) => {
//   try {
//     await dbConnect();

//     const body = await request.json();
//     const validated = playlistSchema.parse(body);

//     const playlist = await Playlist.create(validated);

//     if (!playlist) {
//       return NextResponse.json(
//         { success: false, error: "Playlist not found or invalid ID" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Playlist updated successfully",
//         data: playlist,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     const errorResponse = (msg: string, status = 500, details?: any) =>
//       NextResponse.json({ success: false, error: msg, details }, { status });

//     if (error instanceof ZodError) {
//       const details = error.errors.map((err) => ({
//         field: err.path.join("."),
//         message: err.message,
//       }));
//       return errorResponse("Invalid data format", 400, details);
//     }

//     if (error instanceof MongoError) {
//       return errorResponse("Database error", 500, error.message);
//     }

//     if (error instanceof Error) {
//       return errorResponse(error.message, 500);
//     }

//     return errorResponse("An unexpected error occurred", 500);
//   }
// };

const playlistSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  owner: z.string().min(1, "Owner ID is required"),
  videos: z
    .array(z.string().min(1, "Video ID is required"))
    .min(1, "At least one video is required"),
  public: z.boolean(),
});

export const POST = async (request: NextRequest) => {
  try {
    await connectToDatabase();

    const body = await request.json();
    const validated = playlistSchema.parse(body);

    const validVideoIds = validated.videos.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const allVideos = await Video.find({
      _id: { $in: validVideoIds.map((id) => new mongoose.Types.ObjectId(id)) },
    }).select("_id public");

    const existingVideoIds = allVideos.map((v) => v._id.toString());

    const invalidOrNonExistent = validated.videos.filter(
      (id) => !existingVideoIds.includes(id)
    );

    let finalVideos = existingVideoIds;
    const nonPublicVideos: string[] = [];

    if (validated.public) {
      finalVideos = allVideos
        .filter((v) => v.public)
        .map((v) => v._id.toString());

      nonPublicVideos.push(
        ...allVideos.filter((v) => !v.public).map((v) => v._id.toString())
      );
    }

    const playlist = await Playlist.create({
      ...validated,
      videos: finalVideos,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Playlist created successfully",
        data: playlist,
        ...(invalidOrNonExistent.length > 0 && {
          note_invalid:
            "Some videos were excluded because they are invalid or not found",
          excludedVideos: invalidOrNonExistent,
        }),
        ...(nonPublicVideos.length > 0 &&
          validated.public && {
            note_nonPublic:
              "Some videos were excluded because they are not public",
            nonPublicVideos,
          }),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorResponse = (msg: string, status = 500, details?: any) =>
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
