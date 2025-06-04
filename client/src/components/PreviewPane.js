/* =================================================================== */
/* === 1 | client/src/components/PreviewPane.jsx  (NEW) ============== */
/* =================================================================== */
import React, { useEffect, useRef } from "react";

/**
 * props:
 *  - files   : [{ path, code }]
 *  - visible : boolean
 *  - height  : number (px)
 */
function PreviewPane({ files, visible = true, height = 300 }) {
  const iframeRef = useRef(null);

  /* build srcdoc */
  const htmlText = React.useMemo(() => {
    if (!files.length) return "<html><body><em>No files</em></body></html>";

    const htmlFiles = files.filter(f => f.path.endsWith(".html"));
    if (!htmlFiles.length)
      return "<html><body><em>No .html file found</em></body></html>";

    const cssBlock = files
      .filter(f => f.path.endsWith(".css"))
      .map(f => `<style>${f.code}</style>`)
      .join("\n");

    const jsBlock = files
      .filter(f => f.path.endsWith(".js"))
      .map(f => `<script>${f.code}</script>`)
      .join("\n");

    let doc = htmlFiles[0].code;
    if (!/<html[\s>]/i.test(doc)) doc = `<html><body>${doc}</body></html>`;

    doc = doc.replace(/<\/head>/i, `${cssBlock}\n</head>`);
    doc = doc.replace(/<\/body>/i, `${jsBlock}\n</body>`);

    return doc;
  }, [files]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlText;
    }
  }, [htmlText]);

  if (!visible) return null;
  return (
    <div style={{ borderTop: "1px solid #aaa", height }}>
      <iframe
        ref={iframeRef}
        title="preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
export default PreviewPane;