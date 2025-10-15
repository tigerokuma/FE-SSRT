export default function TrustRow() {
  const items = ["Github", "npm", "Slack", "Jira", "Clerk"];
  return (
    <div className="w-full bg-[#F2F2F2]">
      <div className="container flex items-center gap-6 py-6">
        {items.map((txt) => (
          <div
            key={txt}
            className="flex h-10 w-[92px] items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <span className="text-base text-black">{txt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
