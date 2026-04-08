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

  function renderResults(results) {
    resultsPanel.innerHTML = ''
    if (!results || !results.length) {
      const empty = document.createElement('div')
      empty.className = 'search-empty'
      empty.textContent = 'No results found.'
      resultsPanel.appendChild(empty)
      return
    }

    const list = document.createElement('div')
    list.className = 'search-result-list'
    results.forEach(({ ref, score }) => {
      const doc = docs.find((item) => item.id === ref)
      if (!doc) return
      const item = document.createElement('a')
      item.href = doc.url
      item.className = 'search-result-item'
      item.innerHTML = `<strong>${doc.title}</strong><div class="search-summary">${doc.body.slice(0, 180)}...</div>`
      list.appendChild(item)
    })
    resultsPanel.appendChild(list)
  }

  function doSearch(query) {
    if (!index || !query.trim()) {
      renderResults([])
      resultsPanel.style.display = query.trim() ? 'block' : 'none'
      return
    }
    const normalized = query
      .trim()
      .split(/\s+/)
      .map((term) => `${term}*`)
      .join(' ')
    const results = index.search(normalized)
    renderResults(results)
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
