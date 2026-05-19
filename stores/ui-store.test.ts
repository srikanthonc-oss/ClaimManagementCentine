import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './ui-store'
import type { Platform, Classification } from '@/types'

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.getState().resetAllState()
  })

  describe('Active Tab State', () => {
    it('should initialize with null active tab', () => {
      const { activeTab } = useUIStore.getState()
      expect(activeTab).toBeNull()
    })

    it('should set active tab', () => {
      const { setActiveTab } = useUIStore.getState()
      setActiveTab('DUAL')
      
      const { activeTab } = useUIStore.getState()
      expect(activeTab).toBe('DUAL')
    })

    it('should clear active tab by setting to null', () => {
      const { setActiveTab } = useUIStore.getState()
      setActiveTab('DUAL')
      setActiveTab(null)
      
      const { activeTab } = useUIStore.getState()
      expect(activeTab).toBeNull()
    })

    it('should update active tab when changed', () => {
      const { setActiveTab } = useUIStore.getState()
      setActiveTab('DUAL')
      setActiveTab('Pricing')
      
      const { activeTab } = useUIStore.getState()
      expect(activeTab).toBe('Pricing')
    })
  })

  describe('Expanded Groups State', () => {
    it('should initialize with no expanded groups', () => {
      const { expandedGroups } = useUIStore.getState()
      expect(expandedGroups.size).toBe(0)
    })

    it('should toggle group to expanded', () => {
      const { toggleGroup, isGroupExpanded } = useUIStore.getState()
      const classification: Classification = 'DUAL'
      
      toggleGroup(classification)
      
      expect(isGroupExpanded(classification)).toBe(true)
    })

    it('should toggle group to collapsed', () => {
      const { toggleGroup, isGroupExpanded } = useUIStore.getState()
      const classification: Classification = 'DUAL'
      
      toggleGroup(classification)
      toggleGroup(classification)
      
      expect(isGroupExpanded(classification)).toBe(false)
    })

    it('should expand multiple groups independently', () => {
      const { toggleGroup, isGroupExpanded } = useUIStore.getState()
      
      toggleGroup('DUAL')
      toggleGroup('Pricing')
      
      expect(isGroupExpanded('DUAL')).toBe(true)
      expect(isGroupExpanded('Pricing')).toBe(true)
      expect(isGroupExpanded('COB')).toBe(false)
    })

    it('should expand all groups', () => {
      const { expandAllGroups, isGroupExpanded } = useUIStore.getState()
      
      expandAllGroups()
      
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
      
      allClassifications.forEach((classification) => {
        expect(isGroupExpanded(classification)).toBe(true)
      })
    })

    it('should collapse all groups', () => {
      const { expandAllGroups, collapseAllGroups, expandedGroups } = useUIStore.getState()
      
      expandAllGroups()
      collapseAllGroups()
      
      expect(expandedGroups.size).toBe(0)
    })

    it('should maintain other expanded groups when toggling one', () => {
      const { toggleGroup, isGroupExpanded } = useUIStore.getState()
      
      toggleGroup('DUAL')
      toggleGroup('Pricing')
      toggleGroup('DUAL')
      
      expect(isGroupExpanded('DUAL')).toBe(false)
      expect(isGroupExpanded('Pricing')).toBe(true)
    })
  })

  describe('Platform Filter State', () => {
    it('should initialize with no selected platforms', () => {
      const { selectedPlatforms } = useUIStore.getState()
      expect(selectedPlatforms).toEqual([])
    })

    it('should toggle platform to selected', () => {
      const { togglePlatform, selectedPlatforms } = useUIStore.getState()
      const platform: Platform = 'Facet'
      
      togglePlatform(platform)
      
      expect(useUIStore.getState().selectedPlatforms).toContain(platform)
    })

    it('should toggle platform to deselected', () => {
      const { togglePlatform } = useUIStore.getState()
      const platform: Platform = 'Facet'
      
      togglePlatform(platform)
      togglePlatform(platform)
      
      expect(useUIStore.getState().selectedPlatforms).not.toContain(platform)
    })

    it('should select multiple platforms', () => {
      const { togglePlatform, selectedPlatforms } = useUIStore.getState()
      
      togglePlatform('Facet')
      togglePlatform('Amisys')
      
      const platforms = useUIStore.getState().selectedPlatforms
      expect(platforms).toContain('Facet')
      expect(platforms).toContain('Amisys')
      expect(platforms.length).toBe(2)
    })

    it('should set selected platforms directly', () => {
      const { setSelectedPlatforms } = useUIStore.getState()
      const platforms: Platform[] = ['Facet', 'Xcelys']
      
      setSelectedPlatforms(platforms)
      
      expect(useUIStore.getState().selectedPlatforms).toEqual(platforms)
    })

    it('should clear all platform filters', () => {
      const { togglePlatform, clearPlatformFilters } = useUIStore.getState()
      
      togglePlatform('Facet')
      togglePlatform('Amisys')
      clearPlatformFilters()
      
      expect(useUIStore.getState().selectedPlatforms).toEqual([])
    })

    it('should select all platforms', () => {
      const { selectAllPlatforms } = useUIStore.getState()
      
      selectAllPlatforms()
      
      const platforms = useUIStore.getState().selectedPlatforms
      expect(platforms).toContain('Facet')
      expect(platforms).toContain('Amisys')
      expect(platforms).toContain('Xcelys')
      expect(platforms.length).toBe(3)
    })

    it('should replace platforms when setting directly', () => {
      const { setSelectedPlatforms } = useUIStore.getState()
      
      setSelectedPlatforms(['Facet', 'Amisys'])
      setSelectedPlatforms(['Xcelys'])
      
      const platforms = useUIStore.getState().selectedPlatforms
      expect(platforms).toEqual(['Xcelys'])
    })
  })

  describe('Search Query State', () => {
    it('should initialize with empty search query', () => {
      const { searchQuery } = useUIStore.getState()
      expect(searchQuery).toBe('')
    })

    it('should set search query', () => {
      const { setSearchQuery } = useUIStore.getState()
      const query = 'CLM-12345'
      
      setSearchQuery(query)
      
      expect(useUIStore.getState().searchQuery).toBe(query)
    })

    it('should update search query', () => {
      const { setSearchQuery } = useUIStore.getState()
      
      setSearchQuery('first query')
      setSearchQuery('second query')
      
      expect(useUIStore.getState().searchQuery).toBe('second query')
    })

    it('should clear search query', () => {
      const { setSearchQuery, clearSearchQuery } = useUIStore.getState()
      
      setSearchQuery('test query')
      clearSearchQuery()
      
      expect(useUIStore.getState().searchQuery).toBe('')
    })

    it('should handle empty string as search query', () => {
      const { setSearchQuery } = useUIStore.getState()
      
      setSearchQuery('test')
      setSearchQuery('')
      
      expect(useUIStore.getState().searchQuery).toBe('')
    })
  })

  describe('Reset Actions', () => {
    it('should reset file intake state', () => {
      const { setActiveTab, setSearchQuery, resetFileIntakeState } = useUIStore.getState()
      
      setActiveTab('DUAL')
      setSearchQuery('test query')
      resetFileIntakeState()
      
      const state = useUIStore.getState()
      expect(state.activeTab).toBeNull()
      expect(state.searchQuery).toBe('')
    })

    it('should reset pend processing state', () => {
      const { toggleGroup, togglePlatform, setSearchQuery, resetPendProcessingState } = useUIStore.getState()
      
      toggleGroup('DUAL')
      togglePlatform('Facet')
      setSearchQuery('test query')
      resetPendProcessingState()
      
      const state = useUIStore.getState()
      expect(state.expandedGroups.size).toBe(0)
      expect(state.selectedPlatforms).toEqual([])
      expect(state.searchQuery).toBe('')
    })

    it('should reset all state', () => {
      const {
        setActiveTab,
        toggleGroup,
        togglePlatform,
        setSearchQuery,
        resetAllState,
      } = useUIStore.getState()
      
      setActiveTab('DUAL')
      toggleGroup('Pricing')
      togglePlatform('Facet')
      setSearchQuery('test query')
      resetAllState()
      
      const state = useUIStore.getState()
      expect(state.activeTab).toBeNull()
      expect(state.expandedGroups.size).toBe(0)
      expect(state.selectedPlatforms).toEqual([])
      expect(state.searchQuery).toBe('')
    })

    it('should not affect other state when resetting file intake', () => {
      const {
        setActiveTab,
        togglePlatform,
        resetFileIntakeState,
      } = useUIStore.getState()
      
      setActiveTab('DUAL')
      togglePlatform('Facet')
      resetFileIntakeState()
      
      const state = useUIStore.getState()
      expect(state.activeTab).toBeNull()
      expect(state.selectedPlatforms).toContain('Facet')
    })

    it('should not affect other state when resetting pend processing', () => {
      const {
        setActiveTab,
        togglePlatform,
        resetPendProcessingState,
      } = useUIStore.getState()
      
      setActiveTab('DUAL')
      togglePlatform('Facet')
      resetPendProcessingState()
      
      const state = useUIStore.getState()
      expect(state.activeTab).toBe('DUAL')
      expect(state.selectedPlatforms).toEqual([])
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple state changes in sequence', () => {
      const {
        setActiveTab,
        toggleGroup,
        togglePlatform,
        setSearchQuery,
      } = useUIStore.getState()
      
      setActiveTab('DUAL')
      toggleGroup('DUAL')
      toggleGroup('Pricing')
      togglePlatform('Facet')
      togglePlatform('Amisys')
      setSearchQuery('test')
      
      const state = useUIStore.getState()
      expect(state.activeTab).toBe('DUAL')
      expect(state.isGroupExpanded('DUAL')).toBe(true)
      expect(state.isGroupExpanded('Pricing')).toBe(true)
      expect(state.selectedPlatforms).toEqual(['Facet', 'Amisys'])
      expect(state.searchQuery).toBe('test')
    })

    it('should maintain state consistency across operations', () => {
      const {
        expandAllGroups,
        selectAllPlatforms,
        toggleGroup,
        togglePlatform,
      } = useUIStore.getState()
      
      expandAllGroups()
      selectAllPlatforms()
      toggleGroup('DUAL')
      togglePlatform('Facet')
      
      const state = useUIStore.getState()
      expect(state.isGroupExpanded('DUAL')).toBe(false)
      expect(state.isGroupExpanded('Pricing')).toBe(true)
      expect(state.selectedPlatforms).toEqual(['Amisys', 'Xcelys'])
    })

    it('should handle rapid state changes', () => {
      const { togglePlatform } = useUIStore.getState()
      
      togglePlatform('Facet')
      togglePlatform('Facet')
      togglePlatform('Facet')
      togglePlatform('Facet')
      
      const state = useUIStore.getState()
      expect(state.selectedPlatforms).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    it('should handle toggling non-existent group', () => {
      const { toggleGroup, isGroupExpanded } = useUIStore.getState()
      
      toggleGroup('DUAL')
      
      expect(isGroupExpanded('DUAL')).toBe(true)
    })

    it('should handle checking non-expanded group', () => {
      const { isGroupExpanded } = useUIStore.getState()
      
      expect(isGroupExpanded('DUAL')).toBe(false)
    })

    it('should handle empty platform array', () => {
      const { setSelectedPlatforms } = useUIStore.getState()
      
      setSelectedPlatforms([])
      
      expect(useUIStore.getState().selectedPlatforms).toEqual([])
    })

    it('should handle duplicate platforms in setSelectedPlatforms', () => {
      const { setSelectedPlatforms } = useUIStore.getState()
      
      // This shouldn't happen in normal usage, but test the behavior
      setSelectedPlatforms(['Facet', 'Facet'] as Platform[])
      
      const platforms = useUIStore.getState().selectedPlatforms
      expect(platforms.length).toBe(2)
    })
  })
})
