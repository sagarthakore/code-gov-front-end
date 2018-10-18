/* global history */
/* global URLSearchParams */

import React from 'react'
import { Redirect } from 'react-router'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import history from 'browser-history'
import Roadmap from 'components/roadmap'
import Home from 'components/home'
import BrowseProjects from 'components/browse-projects'
import SearchPage from 'components/search-page'
import Menu from 'components/menu'
import Footer from 'components/footer'
import PrivacyPolicy from 'components/privacy-policy'
import { refreshView, normalize } from 'utils'


import siteConfig from '../../../config/site/site.json'


export default class AppComponent extends React.Component {

  loadParamsFromURL() {
    const location = this.props.location
    const pathname = location.pathname
    const params = new URLSearchParams(location.search)

    const agencies = params.has('agencies') ? normalize(params.get('agencies').split(',')) : null
    const languages = params.has('languages') ? normalize(params.get('languages').split(',')) : null
    const licenses = params.has('licenses') ? normalize(params.get('licenses').split(',')) : null

    if (pathname.includes('browse-projects')) {
      if (languages) { this.props.updateBrowseFilters('languages', languages) }
      if (agencies) { this.props.updateBrowseFilters('agencies', agencies) }
      if (licenses) { this.props.updateBrowseFilters('licenses', licenses) }
    } if (pathname.includes('search')) {
      const query = params.get('query')
      if (query) { this.props.loadInitialSearch(query) }
      if (languages) { this.props.updateSearchFilters('languages', languages) }
      if (agencies) { this.props.updateSearchFilters('agencies', agencies) }
      if (licenses) { this.props.updateSearchFilters('licenses', licenses) }
    }
  }

  componentDidMount() {
    refreshView()
    this.props.saveSiteConfig(siteConfig)
    this.loadParamsFromURL()
  }

  render() {
    return (
      <ConnectedRouter history={history}>
        <div className='App'>
          <Menu />
          <Switch>
            <Route exact path='/' component={Home}/>
            <Route path='/browse-projects' component={BrowseProjects}/>
            <Route path='/privacy-policy' component={PrivacyPolicy}/>
            <Route path='/roadmap' component={Roadmap}/>
            <Route path='/search' component={SearchPage}/>
            <Redirect to='/' />
          </Switch>
          <Footer />
        </div>
      </ConnectedRouter>
    )
  }
}
