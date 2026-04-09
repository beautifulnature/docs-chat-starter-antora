document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input')
  if (!searchInput || typeof lunr === 'undefined') return

  const resultsPanel = document.createElement('div')
  resultsPanel.id = 'search-results'
  resultsPanel.className = 'search-results'
  resultsPanel.style.display = 'none'
  searchInput.parentNode.appendChild(resultsPanel)

  let index = null
  let docs = []
  const loading = document.createElement('div')
  loading.className = 'search-loading'
  loading.textContent = 'Loading search index...'
  resultsPanel.appendChild(loading)

  function buildIndex(data) {
    docs = Array.isArray(data.docs) ? data.docs : []
    index = lunr(function () {
      this.ref('id')
      this.field('title', { boost: 10 })
      this.field('body')
      docs.forEach((doc) => this.add(doc))
    })
    loading.remove()
  }

  function highlightText(text, query) {
    if (!query || !text) return text
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
    if (terms.length === 0) return text
    
    let highlighted = text
    terms.forEach(term => {
      // Escape special regex characters
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match whole words or partial words
      const regex = new RegExp(`\\b${escapedTerm}\\b|${escapedTerm}`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$&</mark>')
    })
    return highlighted
  }

  function extractRelevantExcerpt(text, query) {
    if (!text || !query) {
      const fallback = text ? text.slice(0, 150).replace(/\s+/g, ' ').trim() : ''
      return fallback || 'No preview available'
    }
    
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
    if (terms.length === 0) {
      const fallback = text.slice(0, 150).replace(/\s+/g, ' ').trim()
      return fallback || 'No preview available'
    }
    
    // Clean up common navigation patterns and noise
    let cleanText = text
      .replace(/UMCD Manual.*?(?=Details|Description|fold over|^$|\d{1,3}\s|Low|Medium|High|Carbon|Steel|Alloy|History|Standardization|Codification)/gi, '')
      .replace(/Left Nav Right Nav/gi, '')
      .replace(/Left Navigation Right Navigation/gi, '')
      .replace(/Fold over.*?(?=[a-zA-Z0-9])/gi, '')
      .replace(/This page was built.*$/gi, '')
      .trim()
    
    // Fallback to original text if cleaning removed too much
    if (!cleanText || cleanText.length < 30) {
      cleanText = text
    }
    
    // Try to find matches with variations (singular, plural, word-boundary matches)
    const matches = []
    terms.forEach(term => {
      const lowerClean = cleanText.toLowerCase()
      
      // Try exact match first
      let index = 0
      while ((index = lowerClean.indexOf(term, index)) !== -1) {
        matches.push({ index, term, length: term.length })
        index += term.length
      }
      
      // Try plural variation if not found
      if (matches.length === 0) {
        const pluralTerm = term + 's'
        index = 0
        while ((index = lowerClean.indexOf(pluralTerm, index)) !== -1) {
          matches.push({ index, term: pluralTerm, length: pluralTerm.length })
          index += pluralTerm.length
        }
      }
    })
    
    // Sort by position and use first match
    matches.sort((a, b) => a.index - b.index)
    
    if (matches.length > 0) {
      const bestMatch = matches[0]
      const startBuffer = 70
      const endBuffer = 90
      const start = Math.max(0, bestMatch.index - startBuffer)
      const end = Math.min(cleanText.length, bestMatch.index + bestMatch.length + endBuffer)
      
      let excerpt = cleanText.slice(start, end).replace(/\s+/g, ' ').trim()
      
      // Ensure we have content
      if (!excerpt) {
        excerpt = cleanText.slice(0, 150).replace(/\s+/g, ' ').trim()
      }
      
      // Add ellipsis if truncated
      if (start > 0) excerpt = '…' + excerpt
      if (end < cleanText.length) excerpt = excerpt + '…'
      
      return excerpt || 'No preview available'
    }
    
    // If no exact match found in body, search original text with any of the query words
    const originalLower = text.toLowerCase()
    const allMatches = []
    
    // Find ANY occurrence of any term in the original text
    terms.forEach(term => {
      let index = 0
      while ((index = originalLower.indexOf(term, index)) !== -1) {
        allMatches.push({ index, term, length: term.length })
        index += term.length
      }
    })
    
    if (allMatches.length > 0) {
      allMatches.sort((a, b) => a.index - b.index)
      const bestMatch = allMatches[0]
      const start = Math.max(0, bestMatch.index - 70)
      const end = Math.min(text.length, bestMatch.index + bestMatch.length + 90)
      let excerpt = text.slice(start, end).replace(/\s+/g, ' ').trim()
      if (start > 0) excerpt = '…' + excerpt
      if (end < text.length) excerpt = excerpt + '…'
      return excerpt || 'No preview available'
    }
    
    // Final fallback: return first meaningful chunk
    const fallback = cleanText.slice(0, 200).replace(/\s+/g, ' ').trim() || 
                     text.slice(0, 200).replace(/\s+/g, ' ').trim()
    return fallback + (text.length > 200 ? '…' : '')
  }

  function renderResults(results, query) {
    resultsPanel.innerHTML = ''
    
    // Display search query
    const queryDisplay = document.createElement('div')
    queryDisplay.className = 'search-query-display'
    queryDisplay.innerHTML = `Search: <strong>"${query}"</strong>`
    resultsPanel.appendChild(queryDisplay)
    
    if (!results || !results.length) {
      const empty = document.createElement('div')
      empty.className = 'search-empty'
      empty.textContent = 'No results found.'
      resultsPanel.appendChild(empty)
      return
    }

    const header = document.createElement('div')
    header.className = 'search-result-header'
    header.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`
    resultsPanel.appendChild(header)

    const list = document.createElement('div')
    list.className = 'search-result-list'
    results.forEach(({ ref, score }) => {
      const doc = docs.find((item) => item.id === ref)
      if (!doc) return
      const item = document.createElement('a')
      item.href = doc.url
      item.className = 'search-result-item'
      
      // Extract relevant excerpt showing context where search terms appear
      const summary = extractRelevantExcerpt(doc.body, query)
      const highlightedTitle = highlightText(doc.title, query)
      const highlightedSummary = highlightText(summary, query)
      
      item.innerHTML = `
        <div class="search-result-title">${highlightedTitle}</div>
        <div class="search-summary">${highlightedSummary}</div>
      `
      list.appendChild(item)
    })
    resultsPanel.appendChild(list)
  }

  function doSearch(query) {
    if (!index || !query.trim()) {
      renderResults([], '')
      resultsPanel.style.display = query.trim() ? 'block' : 'none'
      return
    }
    // Require ALL search terms with + prefix (AND logic instead of OR)
    const normalized = query
      .trim()
      .split(/\s+/)
      .map((term) => `+${term}*`)
      .join(' ')
    const results = index.search(normalized)
    renderResults(results, query)
    resultsPanel.style.display = 'block'
  }

  const searchShortcut = (event) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isShortcut = isMac ? event.metaKey && event.key.toLowerCase() === 'k' : event.ctrlKey && event.key.toLowerCase() === 'k'
    if (!isShortcut) return
    event.preventDefault()
    searchInput.focus()
    searchInput.select()
    resultsPanel.style.display = searchInput.value.trim() ? 'block' : 'none'
  }

  let timeout = null
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value
    clearTimeout(timeout)
    timeout = setTimeout(() => doSearch(query), 200)
  })

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      resultsPanel.style.display = 'none'
      searchInput.blur()
    }
  })

  document.addEventListener('keydown', searchShortcut)
  document.addEventListener('click', (event) => {
    if (!resultsPanel.contains(event.target) && event.target !== searchInput) {
      resultsPanel.style.display = 'none'
    }
  })

  function getSearchIndexUrl() {
    const { origin, pathname } = window.location
    const docsIndex = pathname.includes('/docs/')
      ? pathname.slice(0, pathname.indexOf('/docs/') + 6)
      : '/'
    return new URL('search-index.json', `${origin}${docsIndex}`).href
  }

  fetch(getSearchIndexUrl(), { cache: 'no-store' })
    .then((response) => response.json())
    .then(buildIndex)
    .catch(() => {
      loading.textContent = 'Search index unavailable.'
    })
})
