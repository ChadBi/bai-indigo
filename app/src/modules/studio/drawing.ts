import type { DyeParams, StudioPhase } from "../../shared/types";
import { effectiveKnots } from "../../engine/dye";

function white(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = "#f8f9f1";
  ctx.fillRect(0, 0, size, size);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "rgba(137,144,120,.105)";
  ctx.beginPath();
  for (let i = 0; i < size; i += 3) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
  }
  ctx.stroke();
}
export function drawStudio(
  canvas: HTMLCanvasElement,
  params: DyeParams,
  selectedId: string | null,
  phase: StudioPhase,
  progress: number,
  image: CanvasImageSource | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  white(ctx, size);
  if (phase === "edit" || phase === "preparing" || !image) {
    if (params.fold !== "none") {
      ctx.save();
      ctx.setLineDash([5, 7]);
      ctx.strokeStyle = "#8ca4b470";
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      if (params.fold === "quarter") {
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
      }
      ctx.stroke();
      ctx.restore();
    }
    for (const p of effectiveKnots(params)) {
      const ghost = p.fx || p.fy,
        x = p.x * size,
        y = p.y * size,
        r = p.radius * size;
      ctx.save();
      ctx.strokeStyle = ghost ? "#8babb4" : "#496b83";
      ctx.lineWidth = selectedId === p.id ? 1.8 : 1.1;
      ctx.setLineDash(ghost ? [4, 5] : []);
      ctx.beginPath();
      if (params.style === "stripe") {
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
      } else {
        for (let j = 0; j <= 100; j++) {
          const angle = (j / 100) * Math.PI * 2,
            rr = r * (1 + 0.032 * Math.sin(angle * 11 + p.index)),
            xx = x + Math.cos(angle) * rr,
            yy = y + Math.sin(angle) * rr;
          if (j) ctx.lineTo(xx, yy);
          else ctx.moveTo(xx, yy);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (params.style !== "stripe") {
        ctx.strokeStyle = ghost ? "#c0cbd0" : "#a8b5b9";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.58, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = ghost ? "#a1b7c0" : "#315f7e";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (selectedId === p.id) {
        ctx.strokeStyle = "#315f7e";
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (!params.knots.length) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#647f8d";
      ctx.font = "24px SimSun, serif";
      ctx.fillText("第一束线，扎在哪里？", size / 2, size / 2 - 4);
      ctx.fillStyle = "#718b99";
      ctx.font = "14px Microsoft YaHei, sans-serif";
      ctx.fillText("点击布面，或使用添加扎结按钮", size / 2, size / 2 + 30);
    }
    return;
  }
  if (phase === "dye" || phase === "oxidize") {
    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 1.2);
    ctx.drawImage(image, 0, 0, size, size);
    ctx.restore();
    const band = ctx.createLinearGradient(
      0,
      size * progress - 75,
      0,
      size * progress + 75,
    );
    band.addColorStop(0, "rgba(241,246,235,0)");
    band.addColorStop(0.5, "rgba(223,237,220,.28)");
    band.addColorStop(1, "rgba(241,246,235,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, size, size);
    return;
  }
  if (phase === "tied" || phase === "unfold") {
    const ease = phase === "tied" ? 0 : 1 - Math.pow(1 - progress, 3),
      scale = 0.56 + 0.44 * ease;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-0.08 * (1 - ease));
    ctx.drawImage(
      image,
      (-size * scale) / 2,
      (-size * scale) / 2,
      size * scale,
      size * scale,
    );
    ctx.globalAlpha = 1 - ease;
    ctx.strokeStyle = "#e8dec0";
    ctx.lineWidth = 3;
    for (const off of [-0.12, 0, 0.12]) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.29, size * off);
      ctx.lineTo(size * 0.29, size * off + 0.03 * size);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.3);
    ctx.lineTo(0, size * 0.3);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.drawImage(image, 0, 0, size, size);
}
