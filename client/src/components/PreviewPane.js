// client/src/components/PreviewPane.jsx
import React, { useEffect, useRef } from "react";

function PreviewPane({ files, visible = true }) {
  const iframeRef = useRef(null);

  const src = React.useMemo(() => {
    if (!files.length) return "<html><body><em>No files</em></body></html>";

    const htmlFile = files.find((f) => f.path.endsWith(".html")) || {
      code: "<body><em>No .html file</em></body>",
    };

    // Inline CSS
    const css = files
      .filter((f) => f.path.endsWith(".css"))
      .map((f) => `<style>${f.code}</style>`)
      .join("");

    // Inline JS
    const js = files
      .filter((f) => f.path.endsWith(".js"))
      .map((f) => `<script>${f.code}<\/script>`)
      .join("");

    // Remove any <link> tags that might produce MIME errors
    let doc = htmlFile.code.replace(/<link\s[^>]*>/gi, "");
    if (!/<html/i.test(doc)) {
      doc = `<html><head></head><body>${doc}</body></html>`;
    }
    // Inject CSS just before </head>
    doc = doc.replace(/<\/head>/i, css + "</head>");
    // Inject JS just before </body>
    doc = doc.replace(/<\/body>/i, js + "</body>");

    // Ensure a viewport meta tag for responsiveness
    if (!/<meta\s[^>]*viewport/i.test(doc)) {
      doc = doc.replace(
        /<head>/i,
        `<head><meta name="viewport" content="width=device-width, initial-scale=1">`
      );
    }

    return doc;
  }, [files]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = src;
    }
  }, [src]);

  if (!visible) return null;
  return (
    <div style={{ flex: 1, borderTop: "1px solid #ccc" }}>
      <iframe
        ref={iframeRef}
        title="preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}

export default PreviewPane;