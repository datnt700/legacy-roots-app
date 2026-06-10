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
const GENERATION_NAMES = [
  "FIRST GENERATION",
  "SECOND GENERATION",
  "THIRD GENERATION",
  "FOURTH GENERATION",
  "FIFTH GENERATION",
  "SIXTH GENERATION",
  "SEVENTH GENERATION",
  "EIGHTH GENERATION",
  "NINTH GENERATION",
  "TENTH GENERATION",
];
const ADMIN_ROLES = new Set(["admin", "super_admin"]);

type PersonRow = {
  id: string;
  full_name: string;
  title: string | null;
  generation: number | null;
  avatar_url: string | null;
};

type ExistingPersonImageRow = {
  avatar_url: string | null;
};

type RelationshipRow = {
  person_id: string;
  related_person_id: string;
  relation_type: string;
};

type RelationshipInsertRow = {
  family_id: string;
  person_id: string;
  related_person_id: string;
  relation_type: NonNullable<FamilyMember["relationType"]>;
};

type UserRoleRow = {
  role: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function generationLabel(index: number) {
  return GENERATION_NAMES[index] ?? `GENERATION ${index + 1}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
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

  const role = String(((userProfile as UserRoleRow | null)?.role ?? "")).toLowerCase();

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
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingFamily?.id) {
    return existingFamily.id as string;
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
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdFamily.id as string;
}

function toFamilyTree(
  persons: PersonRow[],
  relationships: RelationshipRow[],
): FamilyTreeData {
  if (!persons.length) {
    return defaultFamilyTree;
  }

  const relationshipByPersonId = new Map(
    relationships.map((relationship) => [relationship.person_id, relationship]),
  );
  const generationNumbers = [
    ...new Set(persons.map((person) => person.generation ?? 1)),
  ].sort((a, b) => a - b);

  return {
    generations: generationNumbers.map((generationNumber, index) => ({
      id: `generation-${generationNumber}`,
      label: generationLabel(index),
      members: persons
        .filter((person) => (person.generation ?? 1) === generationNumber)
        .map((person) => {
          const relationship = relationshipByPersonId.get(person.id);
          const label = person.title || "Member";

          return {
            id: person.id,
            name: person.full_name,
            role: label,
            relationship: label,
            relationType: relationship?.relation_type as FamilyMember["relationType"],
            relatedMemberId: relationship?.related_person_id,
            image: person.avatar_url || undefined,
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
    const familyId = await getOrCreateFamily();

    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("id,full_name,title,generation,avatar_url")
      .eq("family_id", familyId)
      .order("generation", { ascending: true })
      .order("created_at", { ascending: true });

    if (personsError) {
      return NextResponse.json({ error: personsError.message }, { status: 500 });
    }

    const { data: relationships, error: relationshipsError } = await supabase
      .from("relationships")
      .select("person_id,related_person_id,relation_type")
      .eq("family_id", familyId);

    if (relationshipsError) {
      return NextResponse.json(
        { error: relationshipsError.message },
        { status: 500 },
      );
    }

    const tree = toFamilyTree(
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
    const familyId = await getOrCreateFamily();
    const body = (await request.json()) as { data?: FamilyTreeData };
    const tree = body.data;

    if (!tree || !Array.isArray(tree.generations)) {
      return NextResponse.json({ error: "Invalid family tree." }, { status: 400 });
    }

    const idMap = new Map<string, string>();
    const { data: existingPersons, error: existingPersonsError } = await supabase
      .from("persons")
      .select("avatar_url")
      .eq("family_id", familyId);

    if (existingPersonsError) {
      return NextResponse.json(
        { error: existingPersonsError.message },
        { status: 500 },
      );
    }

    const personRows = tree.generations.flatMap((generation, generationIndex) =>
      generation.members.map((member) => {
        const id = isUuid(member.id) ? member.id : crypto.randomUUID();
        idMap.set(member.id, id);

        return {
          id,
          family_id: familyId,
          full_name: member.name.trim() || "Unnamed Member",
          title: (member.relationship || member.role || "Member").trim(),
          generation: generationIndex + 1,
          avatar_url: getCanonicalImageUrl(supabase, member.image),
          slug: slugify(`${member.name}-${id}`) || id,
        };
      }),
    );

    const relationshipRows = tree.generations.flatMap((generation) =>
      generation.members
        .map((member) => {
          const personId = idMap.get(member.id);
          const relatedPersonId = member.relatedMemberId
            ? idMap.get(member.relatedMemberId) ?? member.relatedMemberId
            : null;

          if (!personId || !relatedPersonId || !isUuid(relatedPersonId)) {
            return null;
          }

          return {
            family_id: familyId,
            person_id: personId,
            related_person_id: relatedPersonId,
            relation_type: member.relationType || "relative",
          };
        })
        .filter(isRelationshipInsertRow),
    );

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

    const { error: deleteRelationshipsError } = await supabase
      .from("relationships")
      .delete()
      .eq("family_id", familyId);

    if (deleteRelationshipsError) {
      return NextResponse.json(
        { error: deleteRelationshipsError.message },
        { status: 500 },
      );
    }

    const { error: deletePersonsError } = await supabase
      .from("persons")
      .delete()
      .eq("family_id", familyId);

    if (deletePersonsError) {
      return NextResponse.json(
        { error: deletePersonsError.message },
        { status: 500 },
      );
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

    const normalizedTree: FamilyTreeData = {
      generations: tree.generations.map((generation, generationIndex) => ({
        id: `generation-${generationIndex + 1}`,
        label: generationLabel(generationIndex),
        members: generation.members.map((member) => ({
          ...member,
          id: idMap.get(member.id) ?? member.id,
          role: member.relationship || member.role || "Member",
          relationship: member.relationship || member.role || "Member",
          relatedMemberId: member.relatedMemberId
            ? idMap.get(member.relatedMemberId) ?? member.relatedMemberId
            : undefined,
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
