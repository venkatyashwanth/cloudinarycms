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
        const uploadRes = await cloudinary.uploader.upload(file, {
          folder,
          public_id: publicId,
          overwrite: false,
          unique_filename: false,
        });
        uploadedResults.push({ url: uploadRes.secure_url, publicId });
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
