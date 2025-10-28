const BASE_URL = "/api/backend";

export async function checkJiraLink(user_watchlist_id: string) {
  const res = await fetch(`${BASE_URL}/jira/check-link/${user_watchlist_id}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function createJiraIssue(
  user_watchlist_id: string,
  packageName: string,
  alertTitle: string,
  description: string
) {
  const res = await fetch(`${BASE_URL}/jira/create-issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_watchlist_id,
      summary: `Alert in ${packageName}: ${alertTitle}`,
      description,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  return res.json();
}
