"use client";
import { useEffect, useRef, useState } from "react";

export default function UploadMovie() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("netflix-clone");
  const [loading, setLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [copied, setCopied] = useState("");
  const [deleting, setDeleting] = useState(new Set());

  const fileInputRef = useRef(null);

  const folders = ["netflix-clone", "movies", "posters", "thumbnails"];

  // Fetch images from selected folder
  const fetchImages = async () => {
    setGalleryLoading(true);
    setImages([]);
    try {
      const res = await fetch(`../api/list?folder=${folder}`);
      if (!res.ok) {
        console.error("Failed to fetch images", res.status);
        setImages([]);
        return;
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : { resources: [] };
      setImages(data.resources || []);
    } catch (err) {
      console.error("Failed to fetch images", err);
      setImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [folder]);

  // Upload image
  const handleUpload = async () => {
    if (!file || !name) {
      setError("Please select a file and enter a name");
      return;
    }

    setLoading(true);
    setError("");
    setUrl("");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const res = await fetch("../api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: reader.result,
            publicId: name,
            folder: folder, // send selected folder
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Upload failed");
        } else {
          setUrl(data.url);
          setFile(null);
          setName("");
          if (fileInputRef.current) fileInputRef.current.value = "";
          fetchImages();
        }
      } catch (err) {
        setError("Upload failed. Try again.");
      } finally {
        setLoading(false);
      }
    };
  };

  // Delete image
  const handleDelete = async (shortId) => {
    if (!confirm(`Delete ${shortId}?`)) return;

    setDeleting((prev) => new Set(prev).add(shortId));

    try {
      const res = await fetch("../api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: shortId, folder: folder }),
      });

      const data = await res.json();

      if (res.ok) {
        fetchImages();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      alert("Delete failed. Try again.");
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shortId);
        return newSet;
      });
    }
  };

  // Copy URL
  const handleCopy = (url, publicId) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(publicId);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  return (
    <div>
      <h1>🎬 Upload Media Files</h1>

      {/* Folder Dropdown */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Select Folder:{" "}
          <select value={folder} onChange={(e) => setFolder(e.target.value)}>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Upload Form */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) {
              setFile(selectedFile);
              // Always overwrite name with new file name (without extension)
              setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
            }
          }}
        />

        <input
          type="text"
          placeholder="Enter image name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {url && <p>Uploaded! ✅ {url}</p>}

      {/* Gallery */}
      <h2>📂 Gallery ({folder})</h2>
      {galleryLoading ? (
        <p>Loading images...</p>
      ) : images.length === 0 ? (
        <p>No images found in this folder.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          {images.map((img) => {
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
  );
}
