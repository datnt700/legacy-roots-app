"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Crown,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { FamilyTreeShowcase } from "@/components/family-tree-showcase";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  FAMILY_TREE_UPDATED_EVENT,
  FAMILY_TREE_STORAGE_KEY,
  createFamilyId,
  defaultFamilyTree,
  fetchFamilyTree,
  parseFamilyTree,
  saveFamilyTree,
  type FamilyMember,
  type FamilyTreeData,
} from "@/lib/family-tree-data";

type NewMemberForm = {
  name: string;
  relationship: string;
  gender: NonNullable<FamilyMember["gender"]> | "";
  image: string;
  generationId: string;
  relationType: NonNullable<FamilyMember["relationType"]>;
  relatedMemberId: string;
};

const emptyNewMemberForm: NewMemberForm = {
  name: "",
  relationship: "",
  gender: "",
  image: "",
  generationId: "",
  relationType: "relative",
  relatedMemberId: "",
};

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

function withSortOrder<T extends { sortOrder?: number }>(items: T[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
}

function countRelationships(tree: FamilyTreeData) {
  return tree.generations.reduce(
    (total, generation) =>
      total +
      generation.members.filter((member) => member.relatedMemberId).length,
    0,
  );
}

export default function FamilyTreeAdmin() {
  const router = useRouter();
  const [tree, setTree] = useState<FamilyTreeData>(defaultFamilyTree);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isTreeLoaded, setIsTreeLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newMember, setNewMember] = useState<NewMemberForm>(emptyNewMemberForm);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const memberCount = useMemo(
    () =>
      tree.generations.reduce(
        (total, generation) => total + generation.members.length,
        0,
      ),
    [tree],
  );
  const allMembers = useMemo(
    () =>
      tree.generations.flatMap((generation) =>
        generation.members.map((member) => ({
          ...member,
          generationLabel: generation.label,
        })),
      ),
    [tree],
  );

  useEffect(() => {
    let isMounted = true;

    getBrowserSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (isMounted && !data.session) {
          router.replace("/login?redirectTo=/admin");
          return;
        }

        return fetchFamilyTree()
          .then((data) => {
            if (!isMounted) {
              return;
            }

            setTree(data);
            window.localStorage.setItem(
              FAMILY_TREE_STORAGE_KEY,
              JSON.stringify(data),
            );
            setMessage("Loaded from Supabase.");
          })
          .catch((error) => {
            if (!isMounted) {
              return;
            }

            setTree(
              parseFamilyTree(
                window.localStorage.getItem(FAMILY_TREE_STORAGE_KEY),
              ),
            );
            setMessage(
              error instanceof Error
                ? `Using local cache: ${error.message}`
                : "Using local cache.",
            );
          })
          .finally(() => {
            if (isMounted) {
              setIsTreeLoaded(true);
            }
          });
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    setNewMember((current) => {
      if (
        current.generationId &&
        tree.generations.some(
          (generation) => generation.id === current.generationId,
        )
      ) {
        return current;
      }

      return {
        ...current,
        generationId: tree.generations[0]?.id ?? "",
      };
    });
  }, [tree.generations]);

  function updateTree(updater: (current: FamilyTreeData) => FamilyTreeData) {
    setTree((current) => updater(current));
    setIsDirty(true);
    setMessage("Unsaved changes. Click Save changes to persist.");
  }

  async function handleSaveChanges() {
    if (!isTreeLoaded || !isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage("Saving to Supabase...");

    try {
      const { data } = await getBrowserSupabase().auth.getSession();
      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error("Admin session expired. Please sign in again.");
      }

      const savedTree = await saveFamilyTree(tree, accessToken);
      setTree(savedTree);
      window.localStorage.setItem(
        FAMILY_TREE_STORAGE_KEY,
        JSON.stringify(savedTree),
      );
      setIsDirty(false);
      window.dispatchEvent(new Event(FAMILY_TREE_UPDATED_EVENT));
      const relationshipCount = countRelationships(savedTree);
      setMessage(
        relationshipCount
          ? `Saved to Supabase. ${relationshipCount} relationships saved.`
          : "Saved to Supabase. No relationships saved because no Related to value is selected.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not save to Supabase: ${error.message}`
          : "Could not save to Supabase.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDiscardChanges() {
    setMessage("Reloading from Supabase...");

    try {
      const data = await fetchFamilyTree();
      setTree(data);
      window.localStorage.setItem(
        FAMILY_TREE_STORAGE_KEY,
        JSON.stringify(data),
      );
      setIsDirty(false);
      setMessage("Changes discarded.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not reload from Supabase: ${error.message}`
          : "Could not reload from Supabase.",
      );
    }
  }

  function updateGeneration(generationId: string, label: string) {
    updateTree((current) => ({
      ...current,
      generations: current.generations.map((generation) =>
        generation.id === generationId ? { ...generation, label } : generation,
      ),
    }));
  }

  function addGeneration() {
    updateTree((current) => ({
      ...current,
      generations: withSortOrder([
        ...current.generations,
        {
          id: createFamilyId("generation"),
          label: `GENERATION ${current.generations.length + 1}`,
          members: [],
        },
      ]),
    }));
  }

  function removeGeneration(generationId: string) {
    updateTree((current) => ({
      ...current,
      rootPersonId: current.generations
        .find((generation) => generation.id === generationId)
        ?.members.some((member) => member.id === current.rootPersonId)
        ? null
        : current.rootPersonId,
      generations: withSortOrder(
        current.generations.filter(
          (generation) => generation.id !== generationId,
        ),
      ),
    }));
  }

  function moveGeneration(index: number, direction: -1 | 1) {
    updateTree((current) => ({
      ...current,
      generations: withSortOrder(
        moveItem(current.generations, index, direction),
      ),
    }));
  }

  function addMember(generationId: string) {
    updateTree((current) => ({
      ...current,
      generations: current.generations.map((generation) =>
        generation.id === generationId
          ? {
              ...generation,
              members: [
                ...generation.members,
                {
                  id: createFamilyId("member"),
                  name: "New Member",
                  role: "Member",
                  gender: null,
                  relationship: "Member",
                  sortOrder: generation.members.length + 1,
                },
              ],
            }
          : generation,
      ),
    }));
  }

  function createMemberFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newMember.name.trim();
    const relationship = newMember.relationship.trim();

    if (!name || !relationship || !newMember.generationId) {
      setMessage("Name, relationship, and generation are required.");
      return;
    }

    updateTree((current) => ({
      ...current,
      generations: current.generations.map((generation) =>
        generation.id === newMember.generationId
          ? {
              ...generation,
              members: [
                ...generation.members,
                {
                  id: createFamilyId("member"),
                  name,
                  role: relationship,
                  gender: newMember.gender || null,
                  relationship,
                  relationType: newMember.relationType,
                  relatedMemberId: newMember.relatedMemberId || undefined,
                  image: newMember.image.trim() || undefined,
                  sortOrder: generation.members.length + 1,
                },
              ],
            }
          : generation,
      ),
    }));
    setNewMember({
      ...emptyNewMemberForm,
      generationId: newMember.generationId,
    });
  }

  function updateMember(
    generationId: string,
    memberId: string,
    patch: Partial<FamilyMember>,
  ) {
    updateTree((current) => ({
      ...current,
      generations: current.generations.map((generation) =>
        generation.id === generationId
          ? {
              ...generation,
              members: generation.members.map((member) =>
                member.id === memberId ? { ...member, ...patch } : member,
              ),
            }
          : generation,
      ),
    }));
  }

  function updateRootPerson(rootPersonId: string) {
    updateTree((current) => ({
      ...current,
      rootPersonId: rootPersonId || null,
    }));
  }

  function removeMember(generationId: string, memberId: string) {
    updateTree((current) => ({
      ...current,
      rootPersonId:
        current.rootPersonId === memberId ? null : current.rootPersonId,
      generations: current.generations.map((generation) =>
        generation.id === generationId
          ? {
              ...generation,
              members: withSortOrder(
                generation.members.filter((member) => member.id !== memberId),
              ),
            }
          : generation,
      ),
    }));
  }

  function moveMember(
    generationId: string,
    memberIndex: number,
    direction: -1 | 1,
  ) {
    updateTree((current) => ({
      ...current,
      generations: current.generations.map((generation) =>
        generation.id === generationId
          ? {
              ...generation,
              members: withSortOrder(
                moveItem(generation.members, memberIndex, direction),
              ),
            }
          : generation,
      ),
    }));
  }

  function changeMemberGeneration(
    sourceGenerationId: string,
    memberId: string,
    targetGenerationId: string,
  ) {
    if (sourceGenerationId === targetGenerationId) {
      return;
    }

    updateTree((current) => {
      const sourceGeneration = current.generations.find(
        (generation) => generation.id === sourceGenerationId,
      );
      const member = sourceGeneration?.members.find(
        (item) => item.id === memberId,
      );

      if (!member) {
        return current;
      }

      return {
        ...current,
        generations: current.generations.map((generation) => {
          if (generation.id === sourceGenerationId) {
            return {
              ...generation,
              members: withSortOrder(
                generation.members.filter((item) => item.id !== memberId),
              ),
            };
          }

          if (generation.id === targetGenerationId) {
            return {
              ...generation,
              members: withSortOrder([...generation.members, member]),
            };
          }

          return generation;
        }),
      };
    });
  }

  async function uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json()) as {
      data?: { file_url?: string };
      error?: string;
    };

    if (!response.ok || !result.data?.file_url) {
      throw new Error(result.error || "Could not upload photo.");
    }

    return result.data.file_url;
  }

  async function uploadNewMemberPhoto(file: File | undefined) {
    if (!file) {
      return;
    }

    setIsUploadingPhoto(true);
    setMessage("Uploading photo...");

    try {
      const fileUrl = await uploadPhoto(file);
      setNewMember((current) => ({ ...current, image: fileUrl }));
      setMessage("Photo uploaded.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Photo upload failed.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function uploadExistingMemberPhoto(
    generationId: string,
    memberId: string,
    file: File | undefined,
  ) {
    if (!file) {
      return;
    }

    setMessage("Uploading photo...");

    try {
      const fileUrl = await uploadPhoto(file);
      updateMember(generationId, memberId, { image: fileUrl });
      setMessage("Photo uploaded.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Photo upload failed.",
      );
    }
  }

  async function handleSignOut() {
    await getBrowserSupabase().auth.signOut();
    router.replace("/login");
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-muted-foreground">
        Checking admin session...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-gold" />
            <div>
              <p className="font-serif text-xl font-semibold text-gold">
                Admin Editor
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {tree.generations.length} generations / {memberCount} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition-colors hover:text-gold"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl text-foreground">
                Family tree content
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Create, edit, delete, and connect family relationships.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={!isDirty || isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={!isDirty || isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={addGeneration}
                disabled={isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Generation
              </button>
              <button
                type="button"
                onClick={() => updateTree(() => defaultFamilyTree)}
                disabled={isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset draft
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-[8px] border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold">
              <Save className="mr-2 inline h-4 w-4" />
              {message}
              {isDirty && !isSaving ? " Changes are not saved yet." : ""}
            </div>
          )}

          <label className="block rounded-[8px] border border-border bg-card/70 p-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Root person
            <select
              value={tree.rootPersonId ?? ""}
              onChange={(event) => updateRootPerson(event.target.value)}
              className="mt-2 h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
            >
              <option value="">Auto: first person by generation order</option>
              {allMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.generationLabel}
                </option>
              ))}
            </select>
          </label>

          <form
            onSubmit={createMemberFromForm}
            className="rounded-[8px] border border-gold/25 bg-card/80 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl text-foreground">
                  Create new member
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the photo, name, relationship label, and how this person
                  connects to another member.
                </p>
              </div>
              <button
                type="submit"
                className="hidden h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-background sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Name
                <input
                  value={newMember.name}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Maya Sharma"
                  className="mt-1 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Relationship label
                <input
                  value={newMember.relationship}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      relationship: event.target.value,
                    }))
                  }
                  placeholder="Daughter, Uncle, Grandmother..."
                  className="mt-1 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Generation
                <select
                  value={newMember.generationId}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      generationId: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                >
                  {tree.generations.map((generation) => (
                    <option key={generation.id} value={generation.id}>
                      {generation.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Gender
                <select
                  value={newMember.gender}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      gender: event.target.value as NewMemberForm["gender"],
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Photo URL
                <input
                  value={newMember.image}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      image: event.target.value,
                    }))
                  }
                  placeholder="/portraits/member.png"
                  className="mt-1 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingPhoto}
                  onChange={(event) =>
                    uploadNewMemberPhoto(event.target.files?.[0])
                  }
                  className="mt-1 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-background"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Relation type
                <select
                  value={
                    newMember.relatedMemberId ? newMember.relationType : ""
                  }
                  disabled={!newMember.relatedMemberId}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      relationType: event.target
                        .value as NewMemberForm["relationType"],
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select related person first</option>
                  <option value="relative">Relative of</option>
                  <option value="parent">Parent of</option>
                  <option value="child">Child of</option>
                  <option value="spouse">Spouse of</option>
                  <option value="sibling">Sibling of</option>
                </select>
              </label>

              <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Related to
                <select
                  value={newMember.relatedMemberId}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      relatedMemberId: event.target.value,
                      relationType: event.target.value
                        ? current.relationType || "relative"
                        : "relative",
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-[6px] border border-border bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                >
                  <option value="">No related member selected</option>
                  {allMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.generationLabel}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-background sm:hidden"
            >
              <Plus className="h-4 w-4" />
              Create member
            </button>
          </form>

          <div className="space-y-5">
            {tree.generations.map((generation, generationIndex) => (
              <article
                key={generation.id}
                className="rounded-[8px] border border-border bg-card/70 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={generation.label}
                    onChange={(event) =>
                      updateGeneration(generation.id, event.target.value)
                    }
                    className="min-w-0 flex-1 rounded-[6px] border border-border bg-background px-3 py-2 font-serif text-lg text-foreground outline-none focus:border-gold"
                    aria-label="Generation label"
                  />
                  <button
                    type="button"
                    onClick={() => moveGeneration(generationIndex, -1)}
                    className="h-10 w-10 rounded-full border border-border bg-background text-muted-foreground hover:text-gold disabled:opacity-35"
                    disabled={generationIndex === 0}
                    aria-label="Move generation up"
                  >
                    <ArrowUp className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGeneration(generationIndex, 1)}
                    className="h-10 w-10 rounded-full border border-border bg-background text-muted-foreground hover:text-gold disabled:opacity-35"
                    disabled={generationIndex === tree.generations.length - 1}
                    aria-label="Move generation down"
                  >
                    <ArrowDown className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addMember(generation.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm text-muted-foreground hover:text-gold"
                  >
                    <Plus className="h-4 w-4" />
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGeneration(generation.id)}
                    className="h-10 w-10 rounded-full border border-red-500/30 bg-red-950/20 text-red-200 hover:bg-red-950/40"
                    aria-label="Delete generation"
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {generation.members.map((member, memberIndex) => (
                    <div
                      key={member.id}
                      className="grid gap-3 rounded-[8px] border border-border bg-background/70 p-3
                      grid-cols-1
                      md:grid-cols-[3fr_2fr_120px]
                "
                    >
                      <label className="xl:col-span-3  block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Name
                        <input
                          value={member.name}
                          onChange={(event) =>
                            updateMember(generation.id, member.id, {
                              name: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-[6px] border border-border bg-card px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                        />
                      </label>
                      <label className="xl:col-span-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Relationship
                        <input
                          value={member.relationship || member.role}
                          onChange={(event) =>
                            updateMember(generation.id, member.id, {
                              role: event.target.value,
                              relationship: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-[6px] border border-border bg-card px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                        />
                      </label>
                      <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Gender
                        <select
                          value={member.gender ?? ""}
                          onChange={(event) =>
                            updateMember(generation.id, member.id, {
                              gender:
                                (event.target
                                  .value as FamilyMember["gender"]) || null,
                            })
                          }
                          className="mt-1 h-10 w-full rounded-[6px] border border-border bg-card px-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                        >
                          <option value="">Not specified</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label className="xl:col-span-3 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Photo URL
                        <input
                          value={member.image ?? ""}
                          onChange={(event) =>
                            updateMember(generation.id, member.id, {
                              image: event.target.value || undefined,
                            })
                          }
                          placeholder="/portraits/name.png"
                          className="mt-1 w-full rounded-[6px] border border-border bg-card px-3 py-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                        />
                      </label>

                      <label className="md:col-span-3 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Upload
                        <span className="mt-1 flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              uploadExistingMemberPhoto(
                                generation.id,
                                member.id,
                                event.target.files?.[0],
                              )
                            }
                            className="min-w-0 flex-1 rounded-[6px] border border-border bg-card px-2 py-2 text-xs normal-case tracking-normal text-foreground file:mr-2 file:rounded-full file:border-0 file:bg-gold file:px-2 file:py-1 file:text-xs file:font-semibold file:text-background"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateMember(generation.id, member.id, {
                                image: undefined,
                              })
                            }
                            disabled={!member.image}
                            className="rounded-[6px] border border-border bg-card px-2 text-xs normal-case tracking-normal text-muted-foreground hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </span>
                      </label>

                      <label className="md:col-span-1 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Relation type
                        <select
                          value={
                            member.relatedMemberId
                              ? member.relationType || "relative"
                              : ""
                          }
                          disabled={!member.relatedMemberId}
                          onChange={(event) =>
                            updateMember(generation.id, member.id, {
                              relationType: event.target
                                .value as FamilyMember["relationType"],
                            })
                          }
                          className="mt-1 h-10 w-full rounded-[6px] border border-border bg-card px-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select related person first</option>
                          <option value="relative">Relative of</option>
                          <option value="parent">Parent of</option>
                          <option value="child">Child of</option>
                          <option value="spouse">Spouse of</option>
                          <option value="sibling">Sibling of</option>
                        </select>
                      </label>

                      <label className="md:col-span-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Related to
                        <select
                          value={member.relatedMemberId || ""}
                          onChange={(event) =>
                            updateMember(generation.id, member.id, {
                              relatedMemberId: event.target.value || undefined,
                              relationType: event.target.value
                                ? member.relationType || "relative"
                                : undefined,
                            })
                          }
                          className="mt-1 h-10 w-full rounded-[6px] border border-border bg-card px-2 text-sm normal-case tracking-normal text-foreground outline-none focus:border-gold"
                        >
                          <option value="">None</option>
                          {allMembers
                            .filter((candidate) => candidate.id !== member.id)
                            .map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.name} - {candidate.generationLabel}
                              </option>
                            ))}
                        </select>
                      </label>

                      <div className="md:col-span-2 flex flex-wrap items-end gap-2">
                        <select
                          value={generation.id}
                          onChange={(event) =>
                            changeMemberGeneration(
                              generation.id,
                              member.id,
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-[6px] border border-border bg-card px-2 text-sm text-foreground outline-none"
                          aria-label="Move member to generation"
                        >
                          {tree.generations.map((targetGeneration) => (
                            <option
                              key={targetGeneration.id}
                              value={targetGeneration.id}
                            >
                              {targetGeneration.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            moveMember(generation.id, memberIndex, -1)
                          }
                          className="h-10 w-10 rounded-full border border-border bg-card text-muted-foreground hover:text-gold disabled:opacity-35"
                          disabled={memberIndex === 0}
                          aria-label="Move member left"
                        >
                          <ArrowUp className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            moveMember(generation.id, memberIndex, 1)
                          }
                          className="h-10 w-10 rounded-full border border-border bg-card text-muted-foreground hover:text-gold disabled:opacity-35"
                          disabled={
                            memberIndex === generation.members.length - 1
                          }
                          aria-label="Move member right"
                        >
                          <ArrowDown className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMember(generation.id, member.id)}
                          className="h-10 w-10 rounded-full border border-red-500/30 bg-red-950/20 text-red-200 hover:bg-red-950/40"
                          aria-label="Delete member"
                        >
                          <Trash2 className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[8px] border border-border bg-card/60 pb-8 pt-4">
            <p className="px-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Live preview
            </p>
            <FamilyTreeShowcase />
          </div>
        </aside>
      </div>
    </main>
  );
}
