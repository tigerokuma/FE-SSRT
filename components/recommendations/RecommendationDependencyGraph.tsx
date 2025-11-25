"use client"

interface RecommendationDependencyGraphProps {
    projectName: string;
    packageName: string;
    separateCount: number;
    sharedCount: number;
    changeSeparate?: number;
    changeShared?: number;
}

export function RecommendationDependencyGraph({
    projectName,
    packageName,
    separateCount,
    sharedCount,
    changeSeparate,
    changeShared,
}: RecommendationDependencyGraphProps) {
    // Calculate positions (left to right: Project → Packages → Dependencies)
    const projectX = 50;
    const packagesX = 180;
    const depsX = 320;
    const centerY = 100;
    
    // Font sizes
    const projectFontSize = 11;
    const packageFontSize = 10;
    
    // Calculate text width (approximate: 1 character ≈ 6.5px at fontSize 11, 6px at fontSize 10)
    const getTextWidth = (text: string, fontSize: number) => {
        const charWidth = fontSize === 11 ? 6.5 : 6;
        return text.length * charWidth;
    };
    
    // Node dimensions
    const nodeHeight = 36;
    const nodePadding = 14;
    const nodeRadius = 6;
    
    // Calculate node widths based on text
    const projectWidth = Math.max(80, getTextWidth(projectName, projectFontSize) + nodePadding * 2);
    const packageWidth = Math.max(100, getTextWidth(packageName, packageFontSize) + nodePadding * 2);
    const otherWidth = Math.max(100, getTextWidth("Other Packages", packageFontSize) + nodePadding * 2);
    
    // Update viewBox to accommodate wider nodes
    const viewBoxWidth = Math.max(400, depsX + 50);
    
    return (
        <div className="relative w-full" style={{ height: '240px', minHeight: '240px' }}>
            <svg className="w-full h-full" viewBox={`0 0 ${viewBoxWidth} 220`} preserveAspectRatio="xMidYMid meet">
                {/* Arrow marker definitions */}
                <defs>
                    <marker 
                        id="arrowhead-gray" 
                        markerWidth="10" 
                        markerHeight="10" 
                        refX="9" 
                        refY="3" 
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                    </marker>
                    <marker 
                        id="arrowhead-green" 
                        markerWidth="10" 
                        markerHeight="10" 
                        refX="9" 
                        refY="3" 
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
                    </marker>
                    <marker 
                        id="arrowhead-yellow" 
                        markerWidth="10" 
                        markerHeight="10" 
                        refX="9" 
                        refY="3" 
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <polygon points="0 0, 10 3, 0 6" fill="#eab308" />
                    </marker>
                </defs>
                
                {/* Edges: Project → Upgrade Package */}
                <line 
                    x1={projectX + projectWidth / 2} 
                    y1={centerY - nodeHeight / 2} 
                    x2={packagesX - packageWidth / 2} 
                    y2={centerY - 40 - nodeHeight / 2} 
                    stroke="#6b7280" 
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead-gray)" 
                />
                
                {/* Edges: Project → Other Packages */}
                <line 
                    x1={projectX + projectWidth / 2} 
                    y1={centerY + nodeHeight / 2} 
                    x2={packagesX - otherWidth / 2} 
                    y2={centerY + 40 + nodeHeight / 2} 
                    stroke="#6b7280" 
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead-gray)" 
                />
                
                {/* Edges: Upgrade Package → Separate Dependencies */}
                <line 
                    x1={packagesX + packageWidth / 2} 
                    y1={centerY - 40} 
                    x2={depsX - 18} 
                    y2={centerY - 60} 
                    stroke="#10b981" 
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead-green)" 
                />
                
                {/* Edges: Upgrade Package → Shared Dependencies */}
                <line 
                    x1={packagesX + packageWidth / 2} 
                    y1={centerY - 40 + nodeHeight / 2} 
                    x2={depsX - 18} 
                    y2={centerY + 50} 
                    stroke="#eab308" 
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead-yellow)" 
                />
                
                {/* Edges: Other Packages → Shared Dependencies */}
                <line 
                    x1={packagesX + otherWidth / 2} 
                    y1={centerY + 40} 
                    x2={depsX - 18} 
                    y2={centerY + 50} 
                    stroke="#eab308" 
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead-yellow)" 
                />
                
                {/* Project Node (Left) - Just project name */}
                <g>
                    <rect 
                        x={projectX - projectWidth / 2} 
                        y={centerY - nodeHeight / 2} 
                        width={projectWidth} 
                        height={nodeHeight} 
                        rx={nodeRadius} 
                        ry={nodeRadius}
                        fill="#3b82f6" 
                        stroke="#1e40af" 
                        strokeWidth="2" 
                    />
                    <text 
                        x={projectX} 
                        y={centerY} 
                        textAnchor="middle" 
                        fontSize={projectFontSize} 
                        fill="white" 
                        fontWeight="500"
                        style={{ dominantBaseline: 'middle' }}
                    >
                        {projectName}
                    </text>
                </g>
                
                {/* Upgrade Package Node (Middle) - Just package name */}
                <g>
                    <rect 
                        x={packagesX - packageWidth / 2} 
                        y={centerY - 40 - nodeHeight / 2} 
                        width={packageWidth} 
                        height={nodeHeight} 
                        rx={nodeRadius} 
                        ry={nodeRadius}
                        fill="#a855f7" 
                        stroke="#7c3aed" 
                        strokeWidth="2" 
                    />
                    <text 
                        x={packagesX} 
                        y={centerY - 40} 
                        textAnchor="middle" 
                        fontSize={packageFontSize} 
                        fill="white" 
                        fontWeight="500"
                        style={{ dominantBaseline: 'middle' }}
                    >
                        {packageName}
                    </text>
                </g>
                
                {/* Other Packages Node (Middle) - Just "Other Packages" */}
                <g>
                    <rect 
                        x={packagesX - otherWidth / 2} 
                        y={centerY + 40 - nodeHeight / 2} 
                        width={otherWidth} 
                        height={nodeHeight} 
                        rx={nodeRadius} 
                        ry={nodeRadius}
                        fill="#6b7280" 
                        stroke="#4b5563" 
                        strokeWidth="2" 
                    />
                    <text 
                        x={packagesX} 
                        y={centerY + 40} 
                        textAnchor="middle" 
                        fontSize={packageFontSize} 
                        fill="white" 
                        fontWeight="500"
                        style={{ dominantBaseline: 'middle' }}
                    >
                        Other Packages
                    </text>
                </g>
                
                {/* Separate Dependencies Node (Right) - Label above, number in node */}
                <g>
                    <text 
                        x={depsX} 
                        y={centerY - 80} 
                        textAnchor="middle" 
                        fontSize="10" 
                        fill="#9ca3af" 
                        fontWeight="500"
                    >
                        Separate
                    </text>
                    <circle cx={depsX} cy={centerY - 60} r="18" fill="#10b981" stroke="#059669" strokeWidth="2" />
                    <text 
                        x={depsX} 
                        y={centerY - 57} 
                        textAnchor="middle" 
                        fontSize="13" 
                        fill="white" 
                        fontWeight="700"
                        style={{ dominantBaseline: 'middle' }}
                    >
                        {separateCount}
                    </text>
                </g>
                
                {/* Shared Dependencies Node (Right) - Label above, number in node */}
                <g>
                    <text 
                        x={depsX} 
                        y={centerY + 30} 
                        textAnchor="middle" 
                        fontSize="10" 
                        fill="#9ca3af" 
                        fontWeight="500"
                    >
                        Shared
                    </text>
                    <circle cx={depsX} cy={centerY + 50} r="18" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                    <text 
                        x={depsX} 
                        y={centerY + 53} 
                        textAnchor="middle" 
                        fontSize="13" 
                        fill="white" 
                        fontWeight="700"
                        style={{ dominantBaseline: 'middle' }}
                    >
                        {sharedCount}
                    </text>
                </g>
            </svg>
        </div>
    );
}

