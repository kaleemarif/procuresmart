"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEMO_OPERATOR_ID = "operator";
const DEMO_OPERATOR_PASSWORD = "procure123";

export default function OperatorLoginPage() {
  const router = useRouter();

  const [operatorId, setOperatorId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!operatorId.trim() || !password) {
      setError("Please enter your Operator ID and password.");
      return;
    }

    setLoading(true);

    if (
      operatorId.trim().toLowerCase() === DEMO_OPERATOR_ID &&
      password === DEMO_OPERATOR_PASSWORD
    ) {
      sessionStorage.setItem(
        "procuresmart_operator_authenticated",
        "true"
      );

      sessionStorage.setItem(
        "procuresmart_operator_id",
        operatorId.trim()
      );

      router.push("/operator");
      return;
    }

    setLoading(false);
    setError("Invalid Operator ID or password.");
  }

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#26362e]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-8 lg:px-8">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#244b3a] text-2xl font-bold text-white">
              P
            </div>

            <h1 className="mt-5 text-2xl font-bold">
              ProcureSmart
            </h1>

            <p className="mt-1 text-sm text-[#778079]">
              Operator Portal
            </p>
          </div>

          {/* Login card */}
          <div className="rounded-3xl border border-[#d9d4c8] bg-white p-6 shadow-[0_15px_50px_rgba(48,59,52,0.08)] sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#708077]">
                Secure Access
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Operator Login
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6b756e]">
                Sign in to monitor and manage procurement centre operations.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Operator ID */}
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#46544c]">
                  Operator ID
                </span>

                <input
                  type="text"
                  value={operatorId}
                  onChange={(event) =>
                    setOperatorId(event.target.value)
                  }
                  placeholder="Enter Operator ID"
                  autoComplete="username"
                  className="w-full rounded-xl border border-[#d8d2c5] bg-[#fcfbf8] px-4 py-3 text-sm text-[#26362e] outline-none transition placeholder:text-[#a1a69f] focus:border-[#66836f] focus:bg-white focus:ring-2 focus:ring-[#dce7df]"
                />
              </label>

              {/* Password */}
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-[#46544c]">
                  Password
                </span>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[#d8d2c5] bg-[#fcfbf8] px-4 py-3 pr-20 text-sm text-[#26362e] outline-none transition placeholder:text-[#a1a69f] focus:border-[#66836f] focus:bg-white focus:ring-2 focus:ring-[#dce7df]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-[#617067] hover:bg-[#f0eee7]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {/* Error */}
              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-[#244b3a] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#193b2c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login to Dashboard"}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 rounded-2xl border border-[#e0d5b6] bg-[#fffaf0] px-4 py-4">
              <p className="text-xs font-bold text-[#62542f]">
                Demo credentials
              </p>

              <div className="mt-2 space-y-1 font-mono text-xs text-[#766b4d]">
                <p>
                  ID: <span className="font-bold">operator</span>
                </p>

                <p>
                  Password:{" "}
                  <span className="font-bold">procure123</span>
                </p>
              </div>

              <p className="mt-2 text-[11px] leading-4 text-[#8a7d5d]">
                Prototype authentication only. Production authentication
                should use Supabase Auth.
              </p>
            </div>
          </div>

          {/* Back */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-semibold text-[#53645a] hover:text-[#244b3a]"
            >
              ← Back to role selection
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
