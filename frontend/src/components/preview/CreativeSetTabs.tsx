/**
 * CreativeSetTabs Component
 * User Story 3 (P3) - Tab navigation for creative sets
 *
 * Features:
 * - Tab UI for switching between creative sets (A/B/C, Version-1/2, etc.)
 * - Keyboard navigation (Tab, Arrow keys, Enter/Space)
 * - ARIA compliance for screen readers
 * - Asset count badges per set
 */

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'

/**
 * Creative set information
 */
export interface CreativeSet {
  /** Set identifier (e.g., "Set-A", "Version-1") */
  id: string

  /** Display name */
  name: string

  /** Number of assets in this set */
  assetCount: number

  /** Optional icon or badge */
  badge?: string
}

/**
 * Props for CreativeSetTabs component
 */
export interface CreativeSetTabsProps {
  /** List of creative sets */
  sets: CreativeSet[]

  /** Initially selected set ID */
  initialSetId?: string

  /** Callback when set selection changes */
  onSetChange: (setId: string) => void

  /** Optional class name for styling */
  className?: string
}

/**
 * CreativeSetTabs component
 * Renders tab navigation for switching between creative sets
 */
export function CreativeSetTabs({
  sets,
  initialSetId,
  onSetChange,
  className = ''
}: CreativeSetTabsProps) {
  const [selectedSetId, setSelectedSetId] = useState<string>(
    initialSetId || sets[0]?.id || ''
  )

  const tabsRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    // Set initial selection if not already set
    if (!selectedSetId && sets.length > 0) {
      setSelectedSetId(sets[0].id)
      onSetChange(sets[0].id)
    }
  }, [sets, selectedSetId, onSetChange])

  /**
   * Handles tab selection
   */
  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId)
    onSetChange(setId)
  }

  /**
   * Handles keyboard navigation
   * Arrow Left/Right: Move between tabs
   * Home/End: Jump to first/last tab
   * Enter/Space: Select focused tab
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, setId: string) => {
    const currentIndex = sets.findIndex(set => set.id === setId)

    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : sets.length - 1
        break

      case 'ArrowRight':
        event.preventDefault()
        nextIndex = currentIndex < sets.length - 1 ? currentIndex + 1 : 0
        break

      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break

      case 'End':
        event.preventDefault()
        nextIndex = sets.length - 1
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        handleSelectSet(setId)
        return

      default:
        return
    }

    // Focus next tab
    const nextSet = sets[nextIndex]
    const nextTabElement = tabRefs.current.get(nextSet.id)
    nextTabElement?.focus()
  }

  // If no sets or only one set, don't render tabs
  if (sets.length === 0) {
    return null
  }

  if (sets.length === 1) {
    // Single set: no tabs needed, but show set name as header
    return (
      <div className={`creative-set-header ${className}`}>
        <h2 className="text-lg font-semibold">
          {sets[0].name}
          <span className="ml-2 text-sm text-gray-500">
            {sets[0].assetCount} {sets[0].assetCount === 1 ? 'asset' : 'assets'}
          </span>
        </h2>
      </div>
    )
  }

  return (
    <div
      className={`creative-set-tabs ${className}`}
      ref={tabsRef}
      data-testid="creative-set-tabs"
      role="tablist"
      aria-label="Creative sets"
    >
      {sets.map((set, index) => {
        const isSelected = set.id === selectedSetId
        const tabIndex = isSelected ? 0 : -1

        return (
          <button
            key={set.id}
            ref={(el) => {
              if (el) {
                tabRefs.current.set(set.id, el)
              } else {
                tabRefs.current.delete(set.id)
              }
            }}
            role="tab"
            aria-selected={isSelected}
            aria-controls={`set-panel-${set.id}`}
            id={`set-tab-${set.id}`}
            tabIndex={tabIndex}
            data-testid={`set-tab-${set.name}`}
            className={`
              tab
              ${isSelected ? 'tab-selected' : 'tab-unselected'}
              px-4 py-2 rounded-t-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isSelected
                ? 'bg-white border-b-2 border-blue-500 text-blue-600 font-semibold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            onClick={() => handleSelectSet(set.id)}
            onKeyDown={(e) => handleKeyDown(e, set.id)}
          >
            <span className="flex items-center gap-2">
              {/* Set name */}
              <span>{set.name}</span>

              {/* Asset count badge */}
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${isSelected
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-700'
                  }
                `}
                aria-label={`${set.assetCount} assets`}
              >
                {set.assetCount}
              </span>

              {/* Optional badge (e.g., "HTML5") */}
              {set.badge && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700"
                  aria-label={set.badge}
                >
                  {set.badge}
                </span>
              )}
            </span>
          </button>
        )
      })}

      {/* Screen reader announcement */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedSetId && `Selected: ${sets.find(s => s.id === selectedSetId)?.name}`}
      </div>
    </div>
  )
}

/**
 * Hook for managing creative set state
 * Simplifies usage in parent components
 */
export function useCreativeSetSelection(sets: CreativeSet[], initialSetId?: string) {
  const [selectedSetId, setSelectedSetId] = useState<string>(
    initialSetId || sets[0]?.id || ''
  )

  const selectedSet = sets.find(set => set.id === selectedSetId)

  const selectSet = (setId: string) => {
    setSelectedSetId(setId)
  }

  const selectNextSet = () => {
    const currentIndex = sets.findIndex(set => set.id === selectedSetId)
    const nextIndex = (currentIndex + 1) % sets.length
    setSelectedSetId(sets[nextIndex].id)
  }

  const selectPreviousSet = () => {
    const currentIndex = sets.findIndex(set => set.id === selectedSetId)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : sets.length - 1
    setSelectedSetId(sets[prevIndex].id)
  }

  return {
    selectedSetId,
    selectedSet,
    selectSet,
    selectNextSet,
    selectPreviousSet
  }
}
