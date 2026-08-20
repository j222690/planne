/**
 * PLANNE — utilitário compartilhado: rasteriza um <svg> já renderizado no DOM
 * em PNG data-URI. Extraído de app.ia-projetos.tsx (onde já era usado pra
 * mandar o layout 2D como imagem-guia do render) pra ser reaproveitado
 * também no book técnico (planta baixa + vista de elevação).
 */
export async function svgParaPngDataUri(svg: SVGSVGElement, maxW = 1000): Promise<string | null> {
  try {
    const xml = new XMLSerializer().serializeToString(svg);
    const vb = svg.viewBox.baseVal;
    const w = vb?.width || svg.clientWidth || 800;
    const h = vb?.height || svg.clientHeight || 600;
    const scale = Math.min(1.5, maxW / w);
    const src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
