import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const body = await req.json();
    const { file, publicId, folder } = body;

    if (!file || !publicId || !folder) {
      return new Response(
        JSON.stringify({ error: "File, publicId, and folder are required" }),
        { status: 400 }
      );
    }

    // Check if image exists
    try {
      await cloudinary.api.resource(`${folder}/${publicId}`);
      return new Response(
        JSON.stringify({ error: "File name already exists ❌" }),
        { status: 400 }
      );
    } catch {
      // Not found → safe to continue
    }

    const uploadRes = await cloudinary.uploader.upload(file, {
      folder: folder,
      public_id: publicId,
      overwrite: false,
      unique_filename: false,
    });

    return new Response(JSON.stringify({ url: uploadRes.secure_url }), {
      status: 200,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
