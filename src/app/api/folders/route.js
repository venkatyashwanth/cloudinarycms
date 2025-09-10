import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    let allFolders = [];

    // Fetch root folders
    const rootFolders = await cloudinary.api.root_folders();
    allFolders.push(...rootFolders.folders.map(f => f.name));

    // Fetch subfolders for each root folder
    for (const f of rootFolders.folders) {
      try {
        const subFolders = await cloudinary.api.sub_folders(f.path);
        allFolders.push(...subFolders.folders.map(sf => `${f.name}/${sf.name}`));
      } catch (err) {
        console.warn(`No subfolders in ${f.name}`, err.message);
      }
    }

    return new Response(JSON.stringify({ folders: allFolders }), { status: 200 });
  } catch (err) {
    console.error("Error fetching folders:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
