import { computeDye } from "./dye";
import type { RenderRequest, RenderResponse } from "../shared/types";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<RenderRequest>) => void) | null;
  postMessage(message: RenderResponse, transfer?: Transferable[]): void;
};
scope.onmessage = ({ data }) => {
  try {
    const pixels = computeDye(data.params, data.size);
    scope.postMessage(
      { ok: true, requestId: data.requestId, size: data.size, pixels },
      [pixels.buffer],
    );
  } catch (error) {
    scope.postMessage({
      ok: false,
      requestId: data.requestId,
      message: error instanceof Error ? error.message : "染色计算失败。",
    });
  }
};
