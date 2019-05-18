import { connect } from 'react-redux'
import { includes , some } from '@code.gov/cautious'
import get from 'lodash.get'
import { getFilterTags, getFilterValuesFromParamsByCategory, normalize } from 'utils/other'
import saveFilterOptions from 'actions/save-filter-options'
import updateBrowseFilters from 'actions/update-browse-filters'
import updateBrowseParams from 'actions/update-browse-params'
import { sortByBestMatch, sortByDataQuality, sortByDate, sortByName } from 'utils/repo-sorting'
import BrowseProjectsComponent from './browse-projects.component'


export const mapStateToProps = ({ browseParams, browseResults, filters }) => {
  const categories = ['agencies', 'languages', 'licenses', 'usageTypes']

  const selections = categories.reduce((accumulator, key) => {
    accumulator[key] = getFilterValuesFromParamsByCategory(browseParams, key)
    return accumulator
  }, {})

  const selectedSorting = browseParams.sort
  const selectedPage = browseParams.page
  const selectedPageSize = browseParams.size

  let boxes = {}
  if (filters) {
    boxes = categories.reduce((accumulator, key) => {
      accumulator[key] = filters[key].map(({ name, value }) => ({ name, value, checked: includes(selections[key], normalize(value)) }))
      return accumulator
    }, {})
  }

  const total = get(browseResults, 'total') || 0
  const repos = get(browseResults, 'repos')

  let searchResults
  if (repos) {
    searchResults = repos
      .sort((a, b) => {
        if (selectedSorting === 'best_match') {
          return sortByBestMatch(a, b)
        } if (selectedSorting === 'data_quality') {
          return sortByDataQuality(a, b)
        } if (selectedSorting === 'a-z') {
          return sortByName(a, b)
        } if (selectedSorting === 'last_updated') {
          return sortByDate(a, b)
        }
      })
      .filter(repo => {
        if (filters) {
          if (
            some(selections.agencies) &&
            !selections.agencies.includes(normalize(repo.agency.acronym))
          ) {
            return false
          }

          if (
            some(selections.languages) &&
            !overlaps(normalize(repo.languages), selections.languages)
          ) {
            return false
          }

          if (some(selections.licenses)) {
            // no licenses assigned on the repo
            if (hasLicense(repo) === false) {
              return false
            }

            const repoLicenses = repo.permissions.licenses.map(license => normalize(license.name))
            if (!overlaps(repoLicenses, selections.licenses)) {
              return false
            }
          }

          const normalizedRepoUsageType = normalize(repo.permissions.usageType)
          if (
            some(selections.usageTypes) &&
            !selections.usageTypes.includes(normalizedRepoUsageType)
          ) {
            return false
          }

          // don't want to visualize exempt repos
          if (normalizedRepoUsageType.includes('exempt')) {
            return false
          }

          return true
        }

        return false
      })

    searchResults = searchResults.slice(
      (selectedPage - 1) * selectedPageSize,
      selectedPage * selectedPageSize
    )
  }

  const sortOptions = [
    {
      label: 'Data Quality',
      value: 'data_quality',
      selected: selectedSorting === 'data_quality'
    },
    {
      label: 'A-Z',
      value: 'a-z',
      selected: selectedSorting === 'a-z'
    },
    {
      label: 'Last Updated',
      value: 'last_updated',
      selected: selectedSorting === 'last_updated'
    }
  ]

  const filterTags = getFilterTags(browseParams, filters)

  const result = {
    boxes,
    browseParams,
    searchResults,
    filterTags,
    selectedSorting,
    repos,
    selectedPage,
    selectedPageSize,
    sortOptions,
    total
  }

  return result
}

export const mapDispatchToProps = dispatch => ({
    onFilterBoxChange: (category, change) => {
      dispatch(updateBrowseFilters(category, change.value, change.type))
    },
    onFilterTagClick: (category, value) => {
      dispatch(updateBrowseFilters(category, value, 'remove'))
    },
    onSortChange: value => {
      dispatch(updateBrowseParams({ page: 1, sort: value }))
    },
    saveFilterData: () => dispatch(saveFilterOptions()),
    updatePage: newPage => {
      dispatch(updateBrowseParams({ page: newPage }))
    }
  })

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrowseProjectsComponent)
