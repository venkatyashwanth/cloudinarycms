import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const { files, folder } = await req.json();

    if (!files?.length || !folder) {
      return new Response(
        JSON.stringify({ error: "Files array and folder are required" }),
        { status: 400 }
      );
    }

    const uploadedResults = [];
    const skippedFiles = [];
    const failedFiles = [];

    for (const { file, publicId } of files) {
      if (!file || !publicId) continue;

      try {
        // Check if file already exists
        await cloudinary.api.resource(`${folder}/${publicId}`);
        skippedFiles.push(publicId);
        continue; // skip upload
      } catch {
        // File not found → proceed to upload
      }

      try {
        // Determine resource_type from Base64 prefix
        let resource_type = "image"; // default
        if (file.startsWith("data:video/")) resource_type = "video";

        const uploadRes = await cloudinary.uploader.upload(file, {
          folder,
          public_id: publicId,
          overwrite: false,
          unique_filename: false,
          resource_type, // ✅ important for videos
        });

        uploadedResults.push({
          url: uploadRes.secure_url,
          publicId,
          format: uploadRes.format, // ✅ send format for frontend
        });
      } catch (err) {
        console.error(`Failed to upload ${publicId}:`, err.message);
        failedFiles.push({ publicId, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        uploaded: uploadedResults,
        skipped: skippedFiles,
        failed: failedFiles,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
