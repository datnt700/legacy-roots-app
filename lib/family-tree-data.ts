export type FamilyMember = {
  id: string;
  name: string;
  role: string;
  relationship?: string;
  relationType?: "parent" | "child" | "spouse" | "sibling" | "relative";
  relatedMemberId?: string;
  image?: string;
};

export type FamilyGeneration = {
  id: string;
  label: string;
  members: FamilyMember[];
};

export type FamilyTreeData = {
  generations: FamilyGeneration[];
};

export const FAMILY_TREE_STORAGE_KEY = "legacy_roots_family_tree";
export const FAMILY_TREE_UPDATED_EVENT = "legacy-roots-family-tree-updated";

export const defaultFamilyTree: FamilyTreeData = {
  generations: [
    {
      id: "first-generation",
      label: "FIRST GENERATION",
      members: [
        {
          id: "gf",
          name: "Mohan Sharma",
          role: "Grandfather",
          relationship: "Grandfather",
          image: "/portraits/grandfather.png",
        },
        {
          id: "gm",
          name: "Savitri Sharma",
          role: "Grandmother",
          relationship: "Grandmother",
          relationType: "spouse",
          relatedMemberId: "gf",
          image: "/portraits/grandmother.png",
        },
      ],
    },
    {
      id: "second-generation",
      label: "SECOND GENERATION",
      members: [
        {
          id: "fa",
          name: "Rajesh Sharma",
          role: "Father",
          relationship: "Father",
          relationType: "child",
          relatedMemberId: "gf",
          image: "/portraits/father.png",
        },
        {
          id: "mo",
          name: "Anita Sharma",
          role: "Mother",
          relationship: "Mother",
          relationType: "spouse",
          relatedMemberId: "fa",
          image: "/portraits/mother.png",
        },
      ],
    },
    {
      id: "third-generation",
      label: "THIRD GENERATION",
      members: [
        {
          id: "so",
          name: "Aarav Sharma",
          role: "Son",
          relationship: "Son",
          relationType: "child",
          relatedMemberId: "fa",
          image: "/portraits/son.png",
        },
        {
          id: "da",
          name: "Diya Sharma",
          role: "Daughter",
          relationship: "Daughter",
          relationType: "sibling",
          relatedMemberId: "so",
          image: "/portraits/daughter.png",
        },
        {
          id: "add",
          name: "Add Member",
          role: "Member",
          relationship: "Member",
        },
      ],
    },
  ],
};

export function createFamilyId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseFamilyTree(rawValue: string | null): FamilyTreeData {
  if (!rawValue) {
    return defaultFamilyTree;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<FamilyTreeData>;
    if (!Array.isArray(parsed.generations)) {
      return defaultFamilyTree;
    }

    return {
      generations: parsed.generations.map((generation, generationIndex) => ({
        id: generation.id || createFamilyId(`generation-${generationIndex}`),
        label: generation.label || `GENERATION ${generationIndex + 1}`,
        members: Array.isArray(generation.members)
          ? generation.members.map((member, memberIndex) => ({
              id: member.id || createFamilyId(`member-${memberIndex}`),
              name: member.name || "Unnamed Member",
              role: member.role || "Member",
              relationship: member.relationship || member.role || "Member",
              relationType: member.relationType,
              relatedMemberId: member.relatedMemberId,
              image: member.image,
            }))
          : [],
      })),
    };
  } catch {
    return defaultFamilyTree;
  }
}

export async function fetchFamilyTree() {
  const response = await fetch("/api/family-tree", {
    cache: "no-store",
  });
  const result = (await response.json()) as {
    data?: FamilyTreeData;
    error?: string;
  };

  if (!response.ok || !result.data) {
    throw new Error(result.error || "Could not load family tree.");
  }

  return result.data;
}

export async function saveFamilyTree(tree: FamilyTreeData, accessToken: string) {
  const response = await fetch("/api/family-tree", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: tree }),
  });
  const result = (await response.json()) as {
    data?: FamilyTreeData;
    error?: string;
  };

  if (!response.ok || !result.data) {
    throw new Error(result.error || "Could not save family tree.");
  }

  return result.data;
}
