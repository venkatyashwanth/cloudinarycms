"use client";
import { useEffect, useRef, useState } from "react";
import { logout } from "../login/actions";

export default function UploadMovie() {
  const [files, setFiles] = useState([]); // Array of { file: File, name: string }
  const [url, setUrl] = useState("");
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState(""); // 👈 added

  const [loading, setLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [copied, setCopied] = useState("");
  const [deleting, setDeleting] = useState(new Set());
  const fileInputRef = useRef(null);

  // ✅ Fetch folders list from Cloudinary
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch("/api/folders");
        const data = await res.json();
        if (res.ok) {
          setFolders(data.folders);
          if (data.folders.length > 0) {
            setFolder(data.folders[0]); // default to first folder
          }
        } else {
          console.error("Failed to fetch folders:", data.error);
        }
      } catch (err) {
        console.error("Error fetching folders:", err);
      }
    };
    fetchFolders();
  }, []);

  // ✅ Fetch images for selected folder
  const fetchImages = async () => {
    if (!folder) return;
    setGalleryLoading(true);
    setImages([]);
    try {
      const res = await fetch(`/api/list?folder=${folder}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.resources || []);
    } catch (err) {
      console.error("Failed to fetch images:", err);
      setImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [folder]);

  // ✅ Upload multiple files
  const handleUpload = async () => {
    if (!files.length) return setError("Please select at least one file");
    if (!folder) return setError("Please select a folder");

    setLoading(true);
    setError("");
    setUrl("");

    try {
      // Convert files to Base64
      const filePromises = files.map(
        ({ file, name }) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => resolve({ file: reader.result, publicId: name });
            reader.onerror = reject;
          })
      );

      const filesData = await Promise.all(filePromises);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesData, folder }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        let msg = `✅ Uploaded: ${data.uploaded.length} file(s)`;
        if (data.skipped?.length) msg += `, Skipped: ${data.skipped.length}`;
        if (data.failed?.length) msg += `, Failed: ${data.failed.length}`;
        setUrl(msg);

        if (data.failed?.length) {
          alert(
            "Some files failed to upload:\n" +
            data.failed.map(f => `${f.publicId}: ${f.error}`).join("\n")
          );
        }

        // Add uploaded files to gallery instantly
        setImages(prev => [
          ...data.uploaded.map(f => ({ secure_url: f.url, public_id: `${folder}/${f.publicId}` })),
          ...prev,
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("Upload failed. Try again.");
    } finally {
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLoading(false);
    }
  };

  // ✅ Delete image
  const handleDelete = async shortId => {
    if (!confirm(`Delete ${shortId}?`)) return;
    setDeleting(prev => new Set(prev).add(shortId));

    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: shortId, folder }),
      });
      const data = await res.json();
      if (res.ok) fetchImages();
      else alert(data.error || "Delete failed");
    } catch {
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(shortId);
        return newSet;
      });
    }
  };

  // ✅ Copy URL
  const handleCopy = (url, publicId) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(publicId);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  return (
    <>
      <div>
        <h1>🎬 Upload Media Files</h1>

        {/* Folder Dropdown */}
        <div style={{ marginBottom: "10px" }}>
          <label>
            Select Folder:{" "}
            <select value={folder} onChange={e => setFolder(e.target.value)} style={{ minWidth: "200px" }}>
              {folders.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Upload Form */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={e => {
              const MAX_SIZE_MB = 5;
              const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

              const selectedFiles = Array.from(e.target.files)
                .filter(file => {
                  if (file.size > MAX_SIZE_BYTES) {
                    alert(`${file.name} is too large (max ${MAX_SIZE_MB}MB)`);
                    return false;
                  }
                  return true;
                })
                .map(file => ({ file, name: file.name.replace(/\.[^/.]+$/, "") }));

              setFiles(selectedFiles);
            }}
          />
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* Editable names + thumbnails */}
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ textAlign: "center", width: "120px", position: "relative" }}>
                <img
                  src={URL.createObjectURL(f.file)}
                  alt={f.name}
                  style={{ width: "100%", borderRadius: "5px" }}
                />
                <input
                  type="text"
                  value={f.name}
                  onChange={(e) => {
                    const newFiles = [...files];
                    newFiles[i].name = e.target.value;
                    setFiles(newFiles);
                  }}
                  style={{
                    width: "100%",          // 👈 makes it full width
                    minWidth: "100px",      // 👈 ensures it never collapses
                    marginTop: "5px",
                    boxSizing: "border-box" // 👈 prevents overflow
                  }}
                />
                <button
                  onClick={() => {
                    const newFiles = files.filter((_, index) => index !== i);
                    setFiles(newFiles);
                  }}
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    lineHeight: "18px",
                    padding: 0,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        {url && <p>{url}</p>}

        {/* Gallery */}
        <h2>📂 Gallery ({folder})</h2>
        {galleryLoading ? (
          <p>Loading images...</p>
        ) : images.length === 0 ? (
          <p>No images found in this folder.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
            {images.map(img => {
              const shortId = img.public_id.replace(`${folder}/`, "");
              const isDeleting = deleting.has(shortId);

              return (
                <div
                  key={img.public_id}
                  style={{
                    width: "150px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "5px",
                  }}
                >
                  <img
                    src={img.secure_url}
                    alt={img.public_id}
                    style={{ width: "100%", borderRadius: "8px", cursor: "pointer" }}
                    onClick={() => handleCopy(img.secure_url, img.public_id)}
                  />
                  <p style={{ fontSize: "12px", wordBreak: "break-word" }}>{shortId}</p>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(img.secure_url, img.public_id)}
                    style={{
                      marginTop: "5px",
                      background: copied === img.public_id ? "green" : "#007bff",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderRadius: "5px",
                    }}
                  >
                    {copied === img.public_id ? "Copied!" : "Copy URL"}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(shortId)}
                    style={{
                      marginTop: "5px",
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      borderRadius: "5px",
                      display: "block",
                      width: "100%",
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

        <button onClick={() => logout()}>Logout</button>
    </>
  );
}
