import { NextResponse } from "next/server";
import { getSupabase, getSupabaseStorageBucket } from "@/lib/supabase";
import { getStoragePathFromUrl } from "@/lib/supabase/storage";
import {
  defaultFamilyTree,
  type FamilyMember,
  type FamilyTreeData,
} from "@/lib/family-tree-data";

export const dynamic = "force-dynamic";

const DEFAULT_FAMILY_SLUG = "legacy-roots";
const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const VALID_RELATION_TYPES = new Set([
  "parent",
  "child",
  "spouse",
  "sibling",
  "relative",
]);
const VALID_GENDERS = new Set(["male", "female", "other"]);

type FamilyRow = {
  id: string;
  root_person_id: string | null;
};

type GenerationRow = {
  id: string;
  label: string;
  sort_order: number | null;
};

type PersonRow = {
  id: string;
  generation_id: string | null;
  full_name: string;
  display_title: string | null;
  gender: string | null;
  avatar_url: string | null;
  sort_order: number | null;
};

type ExistingPersonImageRow = {
  avatar_url: string | null;
};

type RelationshipRow = {
  from_person_id: string;
  to_person_id: string;
  relation_type: string;
};

type RelationshipInsertRow = {
  family_id: string;
  from_person_id: string;
  to_person_id: string;
  relation_type: NonNullable<FamilyMember["relationType"]>;
};

type UserRoleRow = {
  role: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value,
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeRelationType(value: unknown): NonNullable<FamilyMember["relationType"]> {
  const relationType = typeof value === "string" ? value.toLowerCase() : "";
  return VALID_RELATION_TYPES.has(relationType)
    ? (relationType as NonNullable<FamilyMember["relationType"]>)
    : "relative";
}

function normalizeGender(value: unknown): FamilyMember["gender"] {
  const gender = typeof value === "string" ? value.toLowerCase() : "";
  return VALID_GENDERS.has(gender) ? (gender as NonNullable<FamilyMember["gender"]>) : null;
}

function isRelationshipInsertRow(
  row: RelationshipInsertRow | null,
): row is RelationshipInsertRow {
  return row !== null;
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

async function requireAdmin(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 },
      ),
    };
  }

  const supabase = getSupabase();
  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 },
      ),
    };
  }

  const { data: userProfile, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (roleError) {
    return {
      error: NextResponse.json({ error: roleError.message }, { status: 500 }),
    };
  }

  const role = String(
    ((userProfile as UserRoleRow | null)?.role ?? ""),
  ).toLowerCase();

  if (!ADMIN_ROLES.has(role)) {
    return {
      error: NextResponse.json(
        { error: "Admin role is required." },
        { status: 403 },
      ),
    };
  }

  return { userId: authData.user.id };
}

async function getOrCreateFamily() {
  const supabase = getSupabase();
  const slug = process.env.SUPABASE_FAMILY_SLUG ?? DEFAULT_FAMILY_SLUG;

  const { data: existingFamily, error: existingError } = await supabase
    .from("families")
    .select("id,root_person_id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingFamily?.id) {
    return existingFamily as FamilyRow;
  }

  const { data: owner, error: ownerError } = await supabase
    .from("users")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (ownerError) {
    throw new Error(ownerError.message);
  }

  if (!owner?.id) {
    throw new Error("No user found to own the default family.");
  }

  const { data: createdFamily, error: createError } = await supabase
    .from("families")
    .insert({
      owner_id: owner.id,
      name: "Legacy Roots",
      slug,
      is_public: true,
    })
    .select("id,root_person_id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdFamily as FamilyRow;
}

function fallbackRootPersonId(
  family: FamilyRow,
  generations: GenerationRow[],
  persons: PersonRow[],
) {
  if (family.root_person_id && persons.some((person) => person.id === family.root_person_id)) {
    return family.root_person_id;
  }

  const generationOrder = new Map(
    generations.map((generation, index) => [
      generation.id,
      generation.sort_order ?? index + 1,
    ]),
  );

  return (
    [...persons].sort((a, b) => {
      const generationDiff =
        (generationOrder.get(a.generation_id ?? "") ?? Number.MAX_SAFE_INTEGER) -
        (generationOrder.get(b.generation_id ?? "") ?? Number.MAX_SAFE_INTEGER);

      if (generationDiff !== 0) {
        return generationDiff;
      }

      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })[0]?.id ?? null
  );
}

function toFamilyTree(
  family: FamilyRow,
  generations: GenerationRow[],
  persons: PersonRow[],
  relationships: RelationshipRow[],
): FamilyTreeData {
  if (!persons.length) {
    return defaultFamilyTree;
  }

  const relationshipByPersonId = new Map(
    relationships.map((relationship) => [
      relationship.from_person_id,
      relationship,
    ]),
  );
  const sortedGenerations = [...generations].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const rootPersonId = fallbackRootPersonId(family, sortedGenerations, persons);

  return {
    rootPersonId,
    generations: sortedGenerations.map((generation, generationIndex) => ({
      id: generation.id,
      label: generation.label,
      sortOrder: generation.sort_order ?? generationIndex + 1,
      members: persons
        .filter((person) => person.generation_id === generation.id)
        .sort((a, b) => {
          if (a.id === rootPersonId) {
            return -1;
          }

          if (b.id === rootPersonId) {
            return 1;
          }

          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        })
        .map((person, personIndex) => {
          const relationship = relationshipByPersonId.get(person.id);
          const displayTitle = person.display_title || "Member";

          return {
            id: person.id,
            name: person.full_name,
            role: displayTitle,
            gender: normalizeGender(person.gender),
            relationship: displayTitle,
            relationType: relationship
              ? normalizeRelationType(relationship.relation_type)
              : undefined,
            relatedMemberId: relationship?.to_person_id,
            image: person.avatar_url || undefined,
            sortOrder: person.sort_order ?? personIndex + 1,
          };
        }),
    })),
  };
}

async function getDisplayImageUrl(
  supabase: ReturnType<typeof getSupabase>,
  imageUrl: string | null | undefined,
) {
  if (!imageUrl) {
    return undefined;
  }

  const storagePath = getStoragePathFromUrl(imageUrl);
  if (!storagePath) {
    return imageUrl;
  }

  const { data, error } = await supabase.storage
    .from(getSupabaseStorageBucket())
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return imageUrl;
  }

  return data.signedUrl;
}

async function withDisplayImageUrls(
  supabase: ReturnType<typeof getSupabase>,
  tree: FamilyTreeData,
) {
  return {
    ...tree,
    generations: await Promise.all(
      tree.generations.map(async (generation) => ({
        ...generation,
        members: await Promise.all(
          generation.members.map(async (member) => ({
            ...member,
            image: await getDisplayImageUrl(supabase, member.image),
          })),
        ),
      })),
    ),
  };
}

function getCanonicalImageUrl(
  supabase: ReturnType<typeof getSupabase>,
  imageUrl: string | undefined,
) {
  if (!imageUrl) {
    return null;
  }

  const storagePath = getStoragePathFromUrl(imageUrl);
  if (!storagePath) {
    return imageUrl;
  }

  const { data } = supabase.storage
    .from(getSupabaseStorageBucket())
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

function uniqueStoragePaths(urls: Array<string | null | undefined>) {
  return [
    ...new Set(
      urls
        .map((url) => (url ? getStoragePathFromUrl(url) : null))
        .filter((path): path is string => Boolean(path)),
    ),
  ];
}

async function removeUnusedStorageImages(
  supabase: ReturnType<typeof getSupabase>,
  oldImageUrls: Array<string | null | undefined>,
  nextImageUrls: Array<string | null | undefined>,
) {
  const nextPaths = new Set(uniqueStoragePaths(nextImageUrls));
  const pathsToDelete = uniqueStoragePaths(oldImageUrls).filter(
    (path) => !nextPaths.has(path),
  );

  if (!pathsToDelete.length) {
    return null;
  }

  const { error } = await supabase.storage
    .from(getSupabaseStorageBucket())
    .remove(pathsToDelete);

  return error;
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const family = await getOrCreateFamily();

    const { data: generations, error: generationsError } = await supabase
      .from("generations")
      .select("id,label,sort_order")
      .eq("family_id", family.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (generationsError) {
      return NextResponse.json(
        { error: generationsError.message },
        { status: 500 },
      );
    }

    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("id,generation_id,full_name,display_title,gender,avatar_url,sort_order")
      .eq("family_id", family.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (personsError) {
      return NextResponse.json({ error: personsError.message }, { status: 500 });
    }

    const { data: relationships, error: relationshipsError } = await supabase
      .from("relationships")
      .select("from_person_id,to_person_id,relation_type")
      .eq("family_id", family.id);

    if (relationshipsError) {
      return NextResponse.json(
        { error: relationshipsError.message },
        { status: 500 },
      );
    }

    const tree = toFamilyTree(
      family,
      (generations ?? []) as GenerationRow[],
      (persons ?? []) as PersonRow[],
      (relationships ?? []) as RelationshipRow[],
    );

    return NextResponse.json({
      data: await withDisplayImageUrls(supabase, tree),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load family tree.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if ("error" in admin) {
      return admin.error;
    }

    const supabase = getSupabase();
    const family = await getOrCreateFamily();
    const body = (await request.json()) as { data?: FamilyTreeData };
    const tree = body.data;

    if (!tree || !Array.isArray(tree.generations)) {
      return NextResponse.json({ error: "Invalid family tree." }, { status: 400 });
    }

    const { data: existingPersons, error: existingPersonsError } = await supabase
      .from("persons")
      .select("avatar_url")
      .eq("family_id", family.id);

    if (existingPersonsError) {
      return NextResponse.json(
        { error: existingPersonsError.message },
        { status: 500 },
      );
    }

    const generationIdMap = new Map<string, string>();
    const personIdMap = new Map<string, string>();
    const generationRows = tree.generations.map((generation, generationIndex) => {
      const id = isUuid(generation.id) ? generation.id : crypto.randomUUID();
      generationIdMap.set(generation.id, id);

      return {
        id,
        family_id: family.id,
        label: generation.label.trim() || `Generation ${generationIndex + 1}`,
        sort_order: generation.sortOrder ?? generationIndex + 1,
      };
    });

    const personRows = tree.generations.flatMap((generation, generationIndex) =>
      generation.members.map((member, memberIndex) => {
        const id = isUuid(member.id) ? member.id : crypto.randomUUID();
        personIdMap.set(member.id, id);

        return {
          id,
          family_id: family.id,
          generation_id: generationIdMap.get(generation.id) ?? null,
          full_name: member.name.trim() || "Unnamed Member",
          display_title: (member.relationship || member.role || "Member").trim(),
          gender: normalizeGender(member.gender),
          avatar_url: getCanonicalImageUrl(supabase, member.image),
          sort_order: member.sortOrder ?? memberIndex + 1,
          slug: slugify(`${member.name}-${id}`) || id,
        };
      }),
    );

    const relationshipRows = tree.generations.flatMap((generation) =>
      generation.members
        .map((member) => {
          const fromPersonId = personIdMap.get(member.id);
          const toPersonId = member.relatedMemberId
            ? personIdMap.get(member.relatedMemberId) ?? member.relatedMemberId
            : null;

          if (!fromPersonId || !toPersonId || !isUuid(toPersonId)) {
            return null;
          }

          return {
            family_id: family.id,
            from_person_id: fromPersonId,
            to_person_id: toPersonId,
            relation_type: normalizeRelationType(member.relationType),
          };
        })
        .filter(isRelationshipInsertRow),
    );

    const rootPersonId = tree.rootPersonId
      ? personIdMap.get(tree.rootPersonId) ?? tree.rootPersonId
      : personRows[0]?.id ?? null;

    const cleanupError = await removeUnusedStorageImages(
      supabase,
      ((existingPersons ?? []) as ExistingPersonImageRow[]).map(
        (person) => person.avatar_url,
      ),
      personRows.map((person) => person.avatar_url),
    );

    if (cleanupError) {
      return NextResponse.json(
        { error: `Could not delete old storage image: ${cleanupError.message}` },
        { status: 500 },
      );
    }

    await supabase.from("families").update({ root_person_id: null }).eq("id", family.id);

    const { error: deleteRelationshipsError } = await supabase
      .from("relationships")
      .delete()
      .eq("family_id", family.id);

    if (deleteRelationshipsError) {
      return NextResponse.json(
        { error: deleteRelationshipsError.message },
        { status: 500 },
      );
    }

    const { error: deletePersonsError } = await supabase
      .from("persons")
      .delete()
      .eq("family_id", family.id);

    if (deletePersonsError) {
      return NextResponse.json(
        { error: deletePersonsError.message },
        { status: 500 },
      );
    }

    const { error: deleteGenerationsError } = await supabase
      .from("generations")
      .delete()
      .eq("family_id", family.id);

    if (deleteGenerationsError) {
      return NextResponse.json(
        { error: deleteGenerationsError.message },
        { status: 500 },
      );
    }

    if (generationRows.length) {
      const { error: insertGenerationsError } = await supabase
        .from("generations")
        .insert(generationRows);

      if (insertGenerationsError) {
        return NextResponse.json(
          { error: insertGenerationsError.message },
          { status: 500 },
        );
      }
    }

    if (personRows.length) {
      const { error: insertPersonsError } = await supabase
        .from("persons")
        .insert(personRows);

      if (insertPersonsError) {
        return NextResponse.json(
          { error: insertPersonsError.message },
          { status: 500 },
        );
      }
    }

    if (relationshipRows.length) {
      const { error: insertRelationshipsError } = await supabase
        .from("relationships")
        .insert(relationshipRows);

      if (insertRelationshipsError) {
        return NextResponse.json(
          { error: insertRelationshipsError.message },
          { status: 500 },
        );
      }
    }

    if (rootPersonId && isUuid(rootPersonId)) {
      const { error: rootError } = await supabase
        .from("families")
        .update({ root_person_id: rootPersonId })
        .eq("id", family.id);

      if (rootError) {
        return NextResponse.json({ error: rootError.message }, { status: 500 });
      }
    }

    const normalizedTree: FamilyTreeData = {
      rootPersonId,
      generations: tree.generations.map((generation, generationIndex) => ({
        id: generationIdMap.get(generation.id) ?? generation.id,
        label: generation.label,
        sortOrder: generation.sortOrder ?? generationIndex + 1,
        members: generation.members.map((member, memberIndex) => ({
          ...member,
          id: personIdMap.get(member.id) ?? member.id,
          role: member.relationship || member.role || "Member",
          gender: normalizeGender(member.gender),
          relationship: member.relationship || member.role || "Member",
          relatedMemberId: member.relatedMemberId
            ? personIdMap.get(member.relatedMemberId) ?? member.relatedMemberId
            : undefined,
          relationType: member.relatedMemberId
            ? normalizeRelationType(member.relationType)
            : undefined,
          sortOrder: member.sortOrder ?? memberIndex + 1,
        })),
      })),
    };

    return NextResponse.json({
      data: await withDisplayImageUrls(supabase, normalizedTree),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save family tree.",
      },
      { status: 500 },
    );
  }
}
