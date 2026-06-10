'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Crown, ImagePlus } from 'lucide-react'
import {
  FAMILY_TREE_UPDATED_EVENT,
  FAMILY_TREE_STORAGE_KEY,
  defaultFamilyTree,
  fetchFamilyTree,
  parseFamilyTree,
  type FamilyMember,
} from '@/lib/family-tree-data'

type MemberPosition = {
  x: number
  y: number
}

type RelationshipLine = {
  id: string
  type: NonNullable<FamilyMember['relationType']>
  from: MemberPosition
  to: MemberPosition
  label: string
}

function getRelationshipLabel(type: FamilyMember['relationType']) {
  switch (type) {
    case 'parent':
      return 'parent'
    case 'child':
      return 'child'
    case 'spouse':
      return 'spouse'
    case 'sibling':
      return 'sibling'
    default:
      return 'relative'
  }
}

function getRelationshipPath(line: RelationshipLine) {
  const { from, to } = line

  if (Math.abs(from.y - to.y) < 18) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }

  const midY = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`
}

function TreeNodeCard({
  member,
  size,
  setMemberElement,
}: {
  member: FamilyMember
  size: 'lg' | 'md'
  setMemberElement: (id: string, element: HTMLDivElement | null) => void
}) {
  const [hasImageError, setHasImageError] = useState(false)

  const dim =
    size === 'lg'
      ? 'h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40'
      : 'h-20 w-20 sm:h-28 sm:w-28 lg:h-36 lg:w-36'

  useEffect(() => {
    setHasImageError(false)
  }, [member.image])

  return (
    <div
      ref={(element) => setMemberElement(member.id, element)}
      className="relative z-10 flex flex-col items-center gap-1.5"
    >
      <div
        className={`relative ${dim} overflow-hidden rounded-full border-2 border-gold/60 bg-card shadow-[0_0_24px_rgba(212,175,55,0.25)]`}
        aria-label={member.image ? `Photo of ${member.name}` : `No photo for ${member.name}`}
      >
        {member.image && !hasImageError ? (
          <img
            src={member.image || "/placeholder.svg"}
            alt={`Portrait of ${member.name}`}
            onError={() => setHasImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-card/70">
            <ImagePlus className="h-6 w-6 text-gold" />
            <span className="text-[9px] tracking-wider text-gold/80">NO PHOTO</span>
          </span>
        )}
        {/* gold inner ring */}
        <span aria-hidden className="pointer-events-none absolute inset-1 rounded-full ring-1 ring-gold/30" />
      </div>

      <div className="text-center">
        <p className="font-serif text-[12px] font-medium leading-tight text-foreground sm:text-sm lg:text-base">
          {member.name}
        </p>
        <p className="text-[9px] tracking-[0.18em] text-gold/80 sm:text-[10px] lg:text-xs">
          {(member.relationship || member.role).toUpperCase()}
        </p>
      </div>
    </div>
  )
}

export function FamilyTreeShowcase() {
  const [tree, setTree] = useState(defaultFamilyTree)
  const treeAreaRef = useRef<HTMLDivElement>(null)
  const memberElementsRef = useRef(new Map<string, HTMLDivElement>())
  const [relationshipLines, setRelationshipLines] = useState<RelationshipLine[]>([])

  const setMemberElement = useCallback(
    (id: string, element: HTMLDivElement | null) => {
      if (element) {
        memberElementsRef.current.set(id, element)
        return
      }

      memberElementsRef.current.delete(id)
    },
    [],
  )

  const measureRelationships = useCallback(() => {
    const treeArea = treeAreaRef.current
    if (!treeArea) {
      setRelationshipLines([])
      return
    }

    const treeRect = treeArea.getBoundingClientRect()
    const positions = new Map<string, MemberPosition>()

    memberElementsRef.current.forEach((element, memberId) => {
      const avatar = element.querySelector('button')
      const rect = (avatar ?? element).getBoundingClientRect()

      positions.set(memberId, {
        x: rect.left - treeRect.left + rect.width / 2,
        y: rect.top - treeRect.top + rect.height / 2,
      })
    })

    const nextLines = tree.generations.flatMap((generation) =>
      generation.members
        .map((member) => {
          if (!member.relatedMemberId || !member.relationType) {
            return null
          }

          const memberPosition = positions.get(member.id)
          const relatedPosition = positions.get(member.relatedMemberId)
          if (!memberPosition || !relatedPosition) {
            return null
          }

          const isParentRelation = member.relationType === 'parent'

          return {
            id: `${member.id}-${member.relatedMemberId}-${member.relationType}`,
            type: member.relationType,
            from: isParentRelation ? memberPosition : relatedPosition,
            to: isParentRelation ? relatedPosition : memberPosition,
            label: getRelationshipLabel(member.relationType),
          } satisfies RelationshipLine
        })
        .filter((line): line is RelationshipLine => line !== null),
    )

    setRelationshipLines(nextLines)
  }, [tree])

  useEffect(() => {
    setTree(parseFamilyTree(window.localStorage.getItem(FAMILY_TREE_STORAGE_KEY)))
    fetchFamilyTree()
      .then((data) => {
        setTree(data)
        window.localStorage.setItem(FAMILY_TREE_STORAGE_KEY, JSON.stringify(data))
      })
      .catch(() => {
        setTree(parseFamilyTree(window.localStorage.getItem(FAMILY_TREE_STORAGE_KEY)))
      })

    function handleStorage(event: StorageEvent) {
      if (event.key === FAMILY_TREE_STORAGE_KEY) {
        setTree(parseFamilyTree(event.newValue))
      }
    }

    function handleLocalUpdate() {
      fetchFamilyTree()
        .then((data) => {
          setTree(data)
          window.localStorage.setItem(FAMILY_TREE_STORAGE_KEY, JSON.stringify(data))
        })
        .catch(() => {
          setTree(parseFamilyTree(window.localStorage.getItem(FAMILY_TREE_STORAGE_KEY)))
        })
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(FAMILY_TREE_UPDATED_EVENT, handleLocalUpdate)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(FAMILY_TREE_UPDATED_EVENT, handleLocalUpdate)
    }
  }, [])

  useLayoutEffect(() => {
    measureRelationships()
  }, [measureRelationships])

  useEffect(() => {
    const treeArea = treeAreaRef.current
    if (!treeArea) {
      return
    }

    const observer = new ResizeObserver(() => measureRelationships())
    observer.observe(treeArea)
    memberElementsRef.current.forEach((element) => observer.observe(element))
    window.addEventListener('resize', measureRelationships)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureRelationships)
    }
  }, [measureRelationships, tree])

  return (
    <section className="relative mx-auto mt-4 w-full max-w-md px-4 sm:max-w-2xl lg:max-w-4xl">
      {/* heading */}
      <div className="mb-6 flex items-center justify-center gap-2 sm:mb-8">
        <Crown className="h-4 w-4 text-gold sm:h-5 sm:w-5" />
        <h2 className="font-serif text-lg tracking-wide text-foreground sm:text-2xl lg:text-3xl">
          Family Tree
        </h2>
      </div>

      <div ref={treeAreaRef} className="relative flex flex-col items-center">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="family-relationship-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(212,175,55,0.05)" />
              <stop offset="50%" stopColor="rgba(212,175,55,0.72)" />
              <stop offset="100%" stopColor="rgba(212,175,55,0.05)" />
            </linearGradient>
          </defs>
          {relationshipLines.map((line) => {
            const midX = (line.from.x + line.to.x) / 2
            const midY = (line.from.y + line.to.y) / 2
            const isPeer = line.type === 'spouse' || line.type === 'sibling'

            return (
              <g key={line.id}>
                <path
                  d={getRelationshipPath(line)}
                  fill="none"
                  stroke="url(#family-relationship-line)"
                  strokeDasharray={isPeer ? undefined : '5 7'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isPeer ? 1.7 : 1.35}
                />
                <circle cx={line.from.x} cy={line.from.y} r="3" fill="rgba(212,175,55,0.72)" />
                <circle cx={line.to.x} cy={line.to.y} r="3" fill="rgba(212,175,55,0.72)" />
                <text
                  x={midX}
                  y={midY - 7}
                  fill="rgba(212,175,55,0.78)"
                  fontSize="9"
                  letterSpacing="1.4"
                  textAnchor="middle"
                  className="uppercase"
                >
                  {line.label}
                </text>
              </g>
            )
          })}
        </svg>

        {tree.generations.map((generation, gi) => (
          <div key={generation.id} className="relative z-10 flex w-full flex-col items-center">
            <p className="mb-3 font-serif text-[9px] tracking-[0.28em] text-gold/70 sm:text-[11px] lg:text-xs">
              {generation.label}
            </p>

            <span
              aria-hidden
              className="mb-3 h-px w-[78%] bg-gradient-to-r from-transparent via-gold/20 to-transparent sm:mb-5"
            />

            <div className="mb-12 flex flex-wrap items-start justify-center gap-x-6 gap-y-7 sm:mb-16 sm:gap-x-10 lg:gap-x-16">
              {generation.members.map((member) => (
                <TreeNodeCard
                  key={member.id}
                  member={member}
                  size={gi === 0 ? 'lg' : 'md'}
                  setMemberElement={setMemberElement}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center font-serif text-[13px] italic tracking-wide text-gold sm:mt-12 sm:text-base lg:text-lg">
        Our Roots. Our Story. Our Legacy.
      </p>
    </section>
  )
}
