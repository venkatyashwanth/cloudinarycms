"use client";

import { useActionState, useState, useEffect } from "react";
import { contactAction } from "./actions";
import { useFormStatus } from "react-dom";

export default function FormPage() {
  const [state, formAction] = useActionState(contactAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ maxWidth: "400px", margin: "auto" }}>
        <h2 style={{ background: "#eee", height: "1.5rem", width: "40%" }}></h2>
        <div style={{ marginTop: "10px" }}>
          <div style={{ background: "#ddd", height: "2rem", marginBottom: "10px", borderRadius: "5px" }}></div>
          <div style={{ background: "#ddd", height: "2rem", marginBottom: "10px", borderRadius: "5px" }}></div>
          <div style={{ background: "#ccc", height: "2.5rem", width: "100px", borderRadius: "5px" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>User Form</h2>
      <form action={formAction}>
        {/* Email */}
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {state?.errors?.email && (
            <p className="text-red-500">{state.errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div style={{ marginTop: "10px" }}>
          <label htmlFor="password">Password:</label>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              minLength={8}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-describedby="passwordHelp"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ padding: "4px 8px", cursor: "pointer" }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <small id="passwordHelp">Minimum 8 characters.</small>
          {state?.errors?.password && (
            <p className="text-red-500">{state.errors.password}</p>
          )}
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} type="submit">
      {pending ? "Submitting..." : "Login"}
    </button>
  );
}
