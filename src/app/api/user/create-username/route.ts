import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import { userValidation } from "@/zod/commonValidations";
import { userModel } from "@/db/models/user";
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { username, id } = await req.json();
    const zodRes = userValidation.safeParse(username);

    if (!zodRes.success) {
      return NextResponse.json(
        { success: false, error: "invalid username" },
        { status: 409 }
      );
    }

    const validusername = zodRes.data;

    if (!validusername)
      return NextResponse.json(
        { success: false, error: "invalid username" },
        { status: 409 }
      );

    const dbres = await userModel.findByIdAndUpdate(id, { username: username });
    if (!dbres)
      return NextResponse.json(
        {
          success: false,
          error: "some-thing went wrong",
        },
        { status: 500 }
      );

    return NextResponse.json(
      { success: true, message: "username is created successfully" },
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
