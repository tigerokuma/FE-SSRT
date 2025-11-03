"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

type User = {
  id: string;
  name?: string;
  email?: string;
  // add any other user fields your backend returns
};

export default function JiraOAuthPage() {
  // always go through our Next.js proxy (adds Clerk JWT)
  const apiBase = "/api/backend";

  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const user_id = 'user-123';

  useEffect(() => {
    const code = String(searchParams.get("code"));
    if (!code) {
      setError("No code provided.");
      setLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const encodedCode = encodeURIComponent(code);

        const res = await fetch(`${apiBase}/jira/oAuth/${encodeURIComponent(user_id)}?code=${encodedCode}`);
        if (!res.ok) {
          // If status 410 or others, handle appropriately
          const text = await res.text();
          setError(`Error: ${text || res.statusText}`);
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (data && data.id) {
          setUser(data);
        } else {
          setError("User not found or invalid response.");
        }
      } catch (err) {
        setError("Network or server error.",);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [searchParams]);

  if (loading) return <p>Loading...</p>;

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <PageHeader title="Jira Connection" />
      <div className="w-[60vw] ml-8 pt-6">
        <Card>
          <div className="font-sans p-8">
            <h1 className="font-bold underline text-2xl mb-6">Jira OAuth Result</h1>
            {user ? (
              <>
                <p className="font-bold text-green-600 mb-4 text-lg">Successfully connected:</p>
                <p className="font-semibold text-gray-700">Feel free to close this window.</p>
              </>
            ) : (
              <p className="text-red-600 font-semibold">Failed to connect user.</p>
            )}
          </div>
        </Card>
      </div>
    </div>

  );
}
