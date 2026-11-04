import { describe, expect, it } from "vitest";
import {
  createFreshMapId,
  createImportedMap,
  getMapExportFilename,
  MAX_MAP_FILE_SIZE_BYTES,
  parseAndValidateMapJson,
  validateMapData,
  validateMapFile,
} from "./export-import";
import type { LearningMap } from "@/types/map";

const sampleValidMap: LearningMap = {
  id: "original-map-123",
  title: "Ceramic Painting",
  description: "A guide to glazing and firing pottery.",
  category: "Creative practice",
  accent: "lavender",
  bibbles: [
    {
      id: "b-start",
      title: "Clay basics",
      description: "Pick your clay body",
      status: "completed",
      progress: 100,
      position: { x: 50, y: 100 },
      resources: [{ id: "r-1", label: "Guide", url: "https://pottery.org" }],
      notes: "Earthenware vs stoneware",
    },
    {
      id: "b-glaze",
      title: "Underglaze techniques",
      description: "Painting fine lines",
      status: "learning",
      progress: 50,
      position: { x: 250, y: 100 },
      resources: [],
      notes: "Two coats minimum",
    },
    {
      id: "b-fire",
      title: "Kiln firing",
      description: "Cone 6 firing cycle",
      status: "not-started",
      progress: 0,
      position: { x: 450, y: 100 },
      resources: [],
      notes: "",
    },
  ],
  edges: [
    { id: "e-1", source: "b-start", target: "b-glaze" },
    { id: "e-2", source: "b-glaze", target: "b-fire" },
  ],
};

describe("getMapExportFilename", () => {
  it("formats title as lowercased slug with .bibble.json extension", () => {
    expect(getMapExportFilename("Ceramic Painting")).toBe("ceramic-painting.bibble.json");
    expect(getMapExportFilename("Learn TypeScript & React")).toBe("learn-typescript-react.bibble.json");
  });

  it("handles empty or special character titles safely", () => {
    expect(getMapExportFilename("")).toBe("map.bibble.json");
    expect(getMapExportFilename("   ")).toBe("map.bibble.json");
    expect(getMapExportFilename("???///:::")).toBe("map.bibble.json");
  });
});

describe("validateMapFile", () => {
  it("approves valid JSON files under the size limit", () => {
    expect(validateMapFile({ name: "my-map.bibble.json", size: 1024 })).toEqual({ valid: true });
    expect(validateMapFile({ name: "export.json", size: 50000 })).toEqual({ valid: true });
  });

  it("rejects empty files", () => {
    const result = validateMapFile({ name: "empty.json", size: 0 });
    expect(result.valid).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("rejects oversized files exceeding 1 MB limit", () => {
    const result = validateMapFile({ name: "huge.json", size: MAX_MAP_FILE_SIZE_BYTES + 1 });
    expect(result.valid).toBe(false);
    expect(result).toHaveProperty("error", expect.stringContaining("too large"));
  });

  it("rejects non-JSON extensions with a friendly message", () => {
    const result = validateMapFile({ name: "picture.png", size: 500 });
    expect(result.valid).toBe(false);
    expect(result).toHaveProperty("error", expect.stringContaining(".json"));
  });
});

describe("validateMapData", () => {
  it("accepts valid map objects conforming to Map, Bibble, and MapEdge types", () => {
    const result = validateMapData(sampleValidMap);
    expect(result.success).toBe(true);
  });

  it("rejects non-objects such as arrays or primitives", () => {
    expect(validateMapData(null).success).toBe(false);
    expect(validateMapData([]).success).toBe(false);
    expect(validateMapData("string").success).toBe(false);
    expect(validateMapData(123).success).toBe(false);
  });

  it("rejects objects missing a title", () => {
    const invalid = { ...sampleValidMap, title: "" };
    const result = validateMapData(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects objects missing bibbles or with invalid bibbles", () => {
    expect(validateMapData({ title: "No bibbles", edges: [] }).success).toBe(false);

    // Invalid bibble status
    const invalidStatus = {
      ...sampleValidMap,
      bibbles: [{ ...sampleValidMap.bibbles[0], status: "invalid-status" }],
    };
    expect(validateMapData(invalidStatus).success).toBe(false);

    // Invalid bibble position
    const invalidPos = {
      ...sampleValidMap,
      bibbles: [{ ...sampleValidMap.bibbles[0], position: { x: "not-a-number" } }],
    };
    expect(validateMapData(invalidPos).success).toBe(false);
  });

  it("rejects objects missing edges or with invalid edge objects", () => {
    expect(validateMapData({ title: "No edges", bibbles: [] }).success).toBe(false);

    const invalidEdge = {
      ...sampleValidMap,
      edges: [{ id: "e-1", source: "" }],
    };
    expect(validateMapData(invalidEdge).success).toBe(false);
  });
});

describe("createImportedMap", () => {
  it("creates the map with a fresh id different from the original", () => {
    const imported = createImportedMap(sampleValidMap, [sampleValidMap.id]);
    expect(imported.id).not.toBe(sampleValidMap.id);
    expect(imported.title).toBe(sampleValidMap.title);
    expect(imported.description).toBe(sampleValidMap.description);
    expect(imported.category).toBe(sampleValidMap.category);
    expect(imported.accent).toBe(sampleValidMap.accent);
  });

  it("avoids collision with existing map IDs", () => {
    const id1 = createFreshMapId("test", []);
    const id2 = createFreshMapId("test", [id1]);
    expect(id1).not.toBe(id2);
  });

  it("drops edges whose source or target is missing from the bibbles array", () => {
    const mapWithDanglingEdges = {
      ...sampleValidMap,
      edges: [
        { id: "e-good", source: "b-start", target: "b-glaze" },
        { id: "e-missing-target", source: "b-start", target: "ghost-target" },
        { id: "e-missing-source", source: "ghost-source", target: "b-glaze" },
        { id: "e-missing-both", source: "ghost-1", target: "ghost-2" },
      ],
    };

    const imported = createImportedMap(mapWithDanglingEdges);
    expect(imported.edges).toHaveLength(1);
    expect(imported.edges[0]).toEqual({ id: "e-good", source: "b-start", target: "b-glaze" });
  });

  it("re-imports an exported map to an identical structure", () => {
    const exportedJson = JSON.stringify(sampleValidMap);
    const parsed = parseAndValidateMapJson(exportedJson);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const importedMap = parsed.map;
    // Map content identical
    expect(importedMap.title).toBe(sampleValidMap.title);
    expect(importedMap.description).toBe(sampleValidMap.description);
    expect(importedMap.category).toBe(sampleValidMap.category);
    expect(importedMap.accent).toBe(sampleValidMap.accent);

    // Bibbles identical
    expect(importedMap.bibbles).toEqual(sampleValidMap.bibbles);

    // Edges identical
    expect(importedMap.edges).toEqual(sampleValidMap.edges);
  });
});

describe("parseAndValidateMapJson", () => {
  it("returns error for invalid JSON text", () => {
    const result = parseAndValidateMapJson("{ not valid json");
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error", expect.stringContaining("not valid JSON"));
  });

  it("returns error for unknown non-map JSON text", () => {
    const result = parseAndValidateMapJson(JSON.stringify({ someKey: "someValue" }));
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
  });
});

