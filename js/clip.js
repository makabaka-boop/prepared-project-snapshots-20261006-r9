(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./dxf-core.js"));
  else root.DxfClip = factory(root.DxfCore);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";
  function point(p, u) {
    if (p.type === "line")
      return { x: p.a.x + (p.b.x - p.a.x) * u, y: p.a.y + (p.b.y - p.a.y) * u };
    return C.matrix.apply(
      p.matrix,
      C.arcPointLocal(p.arc, p.arc.a0 + p.arc.sweep * u),
    );
  }
  function fragment(p, start, end) {
    const arc =
      p.type === "arc"
        ? {
            ...p.arc,
            a0: p.arc.a0 + p.arc.sweep * start,
            sweep: p.arc.sweep * (end - start),
          }
        : null;
    const a = point(p, start),
      b = point(p, end);
    const bounds = arc
      ? C.arcWorldBounds(arc, p.matrix)
      : {
          xmin: Math.min(a.x, b.x),
          xmax: Math.max(a.x, b.x),
          ymin: Math.min(a.y, b.y),
          ymax: Math.max(a.y, b.y),
        };
    return {
      ownerId: p.owner.id,
      path: p.owner.path.slice(),
      entityLine: p.entityLine,
      segment: p.seg ?? null,
      closing: !!p.closing,
      type: p.type,
      start,
      end,
      a,
      b,
      bounds: {
        xmin: bounds.xmin,
        xmax: bounds.xmax,
        ymin: bounds.ymin,
        ymax: bounds.ymax,
      },
      arc,
      matrix: arc ? p.matrix.slice() : null,
      worldCCW: p.worldCCW ?? null,
    };
  }
  function clipModel(model, box) {
    return model.primitives
      .filter(
        (p) =>
          p.bounds.xmax >= box.xmin &&
          p.bounds.xmin <= box.xmax &&
          p.bounds.ymax >= box.ymin &&
          p.bounds.ymin <= box.ymax,
      )
      .map((p) => fragment(p, 0, 1));
  }
  return { clipModel, point };
});
