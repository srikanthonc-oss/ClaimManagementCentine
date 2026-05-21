import { create } from 'zustand'
import type { Platform, Classification } from '@/types'

/**
 * UI State Store Interface
 */
interface UIState {
  // File Intake State
  activeTab: string | null
  setActiveTab: (tab: string | null) => void

  // Pend Processing State
  expandedGroups: Set<Classification>
  toggleGroup: (classification: Classification) => void
  expandAllGroups: () => void
  collapseAllGroups: () => void
  isGroupExpanded: (classification: Classification) => boolean

  // Platform Filter State
  selectedPlatforms: Platform[]
  togglePlatform: (platform: Platform) => void
  setSelectedPlatforms: (platforms: Platform[]) => void
  clearPlatformFilters: () => void
  selectAllPlatforms: () => void

  // Search State
  searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearchQuery: () => void

  // Reset Actions
  resetFileIntakeState: () => void
  resetPendProcessingState: () => void
  resetAllState: () => void
}

/**
 * Zustand store for managing UI state across the application
 * 
 * Provides centralized state management for:
 * - Active tab in File Intake page
 * - Expanded classification groups in Pend Processing page
 * - Selected platform filters in Pend Processing page
 * - Search queries for claims tables
 */
export const useUIStore = create<UIState>()(
    (set, get) => ({
      // File Intake State
      activeTab: null,

      /**
       * Set the active tab in File Intake page
       * @param tab - The classification tab to activate, or null to clear
       */
      setActiveTab: (tab: string | null) => {
        set({ activeTab: tab })
      },

      // Pend Processing State
      expandedGroups: new Set<Classification>(),

      /**
       * Toggle the expanded state of a classification group
       * @param classification - The classification group to toggle
       */
      toggleGroup: (classification: Classification) => {
        set((state) => {
          const newExpandedGroups = new Set(state.expandedGroups)
          if (newExpandedGroups.has(classification)) {
            newExpandedGroups.delete(classification)
          } else {
            newExpandedGroups.add(classification)
          }
          return { expandedGroups: newExpandedGroups }
        })
      },

      /**
       * Expand all classification groups
       */
      expandAllGroups: () => {
        const allClassifications: Classification[] = [
          'DUAL',
          'Duplicate',
          'COB',
          'Pricing',
          'Auth',
          'Corrected Claims',
          'High Dollar',
          'Other Pend',
        ]
        set({ expandedGroups: new Set(allClassifications) })
      },

      /**
       * Collapse all classification groups
       */
      collapseAllGroups: () => {
        set({ expandedGroups: new Set() })
      },

      /**
       * Check if a classification group is expanded
       * @param classification - The classification to check
       * @returns True if the group is expanded, false otherwise
       */
      isGroupExpanded: (classification: Classification) => {
        return get().expandedGroups.has(classification)
      },

      // Platform Filter State
      selectedPlatforms: [],

      /**
       * Toggle a platform in the filter selection
       * @param platform - The platform to toggle
       */
      togglePlatform: (platform: Platform) => {
        set((state) => {
          const isSelected = state.selectedPlatforms.includes(platform)
          if (isSelected) {
            return {
              selectedPlatforms: state.selectedPlatforms.filter((p) => p !== platform),
            }
          } else {
            return {
              selectedPlatforms: [...state.selectedPlatforms, platform],
            }
          }
        })
      },

      /**
       * Set the selected platforms directly
       * @param platforms - Array of platforms to select
       */
      setSelectedPlatforms: (platforms: Platform[]) => {
        set({ selectedPlatforms: platforms })
      },

      /**
       * Clear all platform filters (deselect all)
       */
      clearPlatformFilters: () => {
        set({ selectedPlatforms: [] })
      },

      /**
       * Select all platforms
       */
      selectAllPlatforms: () => {
        const allPlatforms: Platform[] = ['Facet', 'Amisys', 'Xcelys']
        set({ selectedPlatforms: allPlatforms })
      },

      // Search State
      searchQuery: '',

      /**
       * Set the search query for claims filtering
       * @param query - The search query string
       */
      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      },

      /**
       * Clear the search query
       */
      clearSearchQuery: () => {
        set({ searchQuery: '' })
      },

      // Reset Actions
      /**
       * Reset File Intake page state to defaults
       */
      resetFileIntakeState: () => {
        set({
          activeTab: null,
          searchQuery: '',
        })
      },

      /**
       * Reset Pend Processing page state to defaults
       */
      resetPendProcessingState: () => {
        set({
          expandedGroups: new Set(),
          selectedPlatforms: [],
          searchQuery: '',
        })
      },

      /**
       * Reset all UI state to defaults
       */
      resetAllState: () => {
        set({
          activeTab: null,
          expandedGroups: new Set(),
          selectedPlatforms: [],
          searchQuery: '',
        })
      },
    })
)
