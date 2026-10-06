(() => {
  const $ = (id) => document.getElementById(id);
  let model = null,
    result = null;
  function load(text) {
    try {
      model = DxfCore.buildModel(DxfCore.parseDxf(text));
      result = null;
      $("evidence").textContent = "";
      $("status").textContent = "图纸已载入";
    } catch (e) {
      $("status").textContent = "拒绝：" + e.message;
    }
  }
  $("file").onchange = async () => {
    if ($("file").files[0]) load(await $("file").files[0].text());
  };
  $("sample").onclick = () => load(window.buildSampleDxf());
  $("clip").onclick = () => {
    try {
      if (!model) throw Error("先载入图纸");
      const box = Object.fromEntries(
        ["xmin", "xmax", "ymin", "ymax"].map((k) => [k, Number($(k).value)]),
      );
      const fragments = DxfClip.clipModel(model, box);
      result = { box, fragments };
      $("evidence").textContent = JSON.stringify(result, null, 2);
      $("status").textContent = fragments.length + " 个连续片段";
      const svg = $("view");
      svg.innerHTML = "";
      svg.setAttribute(
        "viewBox",
        `${box.xmin} ${-box.ymax} ${box.xmax - box.xmin} ${box.ymax - box.ymin}`,
      );
      for (const f of fragments) {
        const points = f.arc
          ? DxfCore.tessellateArc(f.arc, f.matrix)
          : [f.a, f.b];
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        path.setAttribute(
          "d",
          points.map((p, i) => (i ? "L" : "M") + p.x + " " + -p.y).join(" "),
        );
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "blue");
        path.setAttribute("stroke-width", "0.15");
        path.dataset.owner = f.ownerId;
        svg.append(path);
      }
    } catch (e) {
      result = null;
      $("status").textContent = "拒绝：" + e.message;
      $("evidence").textContent = "";
      $("view").innerHTML = "";
    }
  };
  $("download").onclick = () => {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "clipped-instances.json";
    link.click();
    URL.revokeObjectURL(url);
  };
})();
