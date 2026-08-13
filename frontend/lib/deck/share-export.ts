export type ShareCardPayload = {
  title: string;
  body: string;
  footer?: string;
  brandLabel?: string;
};

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

export function renderShareImageDataUrl(payload: ShareCardPayload): string {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create a share image.");
  }

  context.fillStyle = "#F2F1EC";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#FFFFFF";
  context.strokeStyle = "#D8D5CC";
  context.lineWidth = 2;
  roundRect(context, 80, 120, width - 160, height - 240, 28);
  context.fill();
  context.stroke();

  context.fillStyle = "#202B26";
  context.font = "600 42px Georgia, 'Times New Roman', serif";
  context.fillText(payload.title, 120, 200);

  context.fillStyle = "#33473D";
  context.font = "500 52px Georgia, 'Times New Roman', serif";
  const bodyLines = wrapText(context, payload.body, width - 240);
  let y = 320;
  for (const line of bodyLines.slice(0, 12)) {
    context.fillText(line, 120, y);
    y += 64;
  }

  if (payload.footer) {
    context.fillStyle = "#5A6560";
    context.font = "400 32px Arial, sans-serif";
    const footerLines = wrapText(context, payload.footer, width - 240);
    y = height - 220;
    for (const line of footerLines.slice(0, 3)) {
      context.fillText(line, 120, y);
      y += 42;
    }
  }

  context.fillStyle = "#4B6B5E";
  context.font = "600 28px Arial, sans-serif";
  context.fillText(payload.brandLabel ?? "Is it normal?", 120, height - 96);

  return canvas.toDataURL("image/png");
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

export async function shareDeckItem(options: {
  url: string;
  title: string;
  text: string;
  imageDataUrl?: string;
}): Promise<"shared" | "copied" | "downloaded"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "copied";
      }
    }
  }

  if (options.imageDataUrl) {
    const link = document.createElement("a");
    link.href = options.imageDataUrl;
    link.download = "daily-content.png";
    link.click();
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(options.url);
    return "copied";
  }

  return "downloaded";
}
