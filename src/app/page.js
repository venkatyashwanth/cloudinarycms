import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Home</h1>

      {/* Button / Link to Admin Dashboard */}
      <Link href="/admindashboard">
        <button
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Go to Admin Dashboard
        </button>
      </Link>
    </div>
  );
}
