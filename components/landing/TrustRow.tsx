export default function TrustRow() {
  const items = ["GitHub", "Slack", "Jira", "Discord"];
  return (
    <div className="w-full border-t border-gray-800/50" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
      <div className="container flex items-center justify-center gap-8 py-12">
        <div className="text-sm font-medium text-gray-500">Integrated with</div>
        <div className="flex items-center gap-8">
          {items.map((txt) => (
            <div
              key={txt}
              className="flex h-8 items-center justify-center rounded-lg px-4 transition-all duration-200 hover:bg-gray-900/50"
            >
              <span className="text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors duration-200">{txt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
