import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const { publicId, folder, resource_type = "image" } = await req.json();

    if (!publicId || !folder) {
      return new Response(
        JSON.stringify({ error: "Public ID and folder required" }),
        { status: 400 }
      );
    }

    await cloudinary.uploader.destroy(`${folder}/${publicId}`, { resource_type });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Delete error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
