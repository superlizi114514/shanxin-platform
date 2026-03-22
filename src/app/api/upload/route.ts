import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (only images)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `uploads/${timestamp}-${randomString}.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try Vercel Blob first, fall back to local storage
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken && blobToken !== "vercel_blob_your-blob-token" && blobToken !== "your-blob-read-write-token") {
      try {
        // Upload to Vercel Blob
        const blob = await put(filename, buffer, {
          access: "public",
          contentType: file.type,
        });

        return NextResponse.json({
          url: blob.url,
          filename: blob.pathname,
        });
      } catch (blobError) {
        console.warn("Vercel Blob upload failed, falling back to local storage:", blobError);
        // Fall through to local storage
      }
    }

    // Fall back to local storage
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadDir, filename);

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write file to disk
    await writeFile(filepath, buffer);

    // Return local URL
    const baseUrl = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const localUrl = `${protocol}://${baseUrl}/${filename}`;

    return NextResponse.json({
      url: localUrl,
      filename: filename,
      local: true,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
