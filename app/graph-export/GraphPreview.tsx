// app/components/GraphPreview.tsx
import React, { useEffect, useRef } from "react";
import cytoscape, { ElementDefinition } from "cytoscape";

interface GraphPreviewProps {
  elements: ElementDefinition[];
}

export function GraphPreview({ elements }: GraphPreviewProps) {
  const cyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cyRef.current || !elements.length) return;
    let cy = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#0074D9"
          }
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle"
          }
        }
      ],
      layout: { name: "cose" }
    });
    return () => cy.destroy();
  }, [elements]);

  return (
    <div
      ref={cyRef}
      style={{
        width: "100%",
        height: "500px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        background: "#fff"
      }}
    />
  );
}
