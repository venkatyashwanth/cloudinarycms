import cloudinary from "@/lib/cloudinary";

export async function GET(req) {
  const folder = req.nextUrl.searchParams.get("folder") || "netflix-clone";

  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}/*`)
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    // Map results to include format & resource_type
    const resources = (result.resources || []).map(res => ({
      ...res,
      resource_type: res.resource_type || "image", // fallback
    }));

    return new Response(JSON.stringify({ resources }), { status: 200 });
  } catch (err) {
    console.error("List error:", err);
    return new Response(JSON.stringify({ resources: [], error: err.message }), { status: 500 });
  }
}
