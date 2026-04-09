'use strict'

const fs = require('fs')
const path = require('path')

module.exports.register = function ({ config = {} }) {
  const logger = this.getLogger('lunr-search-extension')
  const outputDir = path.resolve(process.cwd(), config.build_dir || 'build/site')
  const indexFile = config.index_file || 'search-index.json'
  const indexPath = path.join(outputDir, indexFile)

  function normalizeUrl(root, filePath) {
    return `/${path.relative(root, filePath).replace(/\\/g, '/')}`
  }

  function extractText(html) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''
    let bodyHtml = bodyMatch ? bodyMatch[1] : html
    
    // Remove common Antora UI elements
    bodyHtml = bodyHtml
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, ' ')
      .replace(/class="(navbar|toc|breadcrumb|edit-this-page)"[^>]*>[\s\S]*?<\/[^>]*>/gi, ' ')
      .replace(/<[^>]*class="(nav|sidebar|breadcrumb)"[^>]*>[\s\S]*?<\/[^>]*>/gi, ' ')
    
    const bodyText = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return { title, body: bodyText }
  }

  function walk(dir, callback) {
    if (!fs.existsSync(dir)) return
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, name.name)
      if (name.isDirectory()) {
        walk(fullPath, callback)
      } else if (name.isFile() && fullPath.endsWith('.html')) {
        callback(fullPath)
      }
    }
  }

  function buildIndex() {
    if (!fs.existsSync(outputDir)) {
      logger.warn(`Lunr search index skipped because output directory does not exist: ${outputDir}`)
      return
    }

    const docs = []
    walk(outputDir, (file) => {
      try {
        const html = fs.readFileSync(file, 'utf8')
        const { title, body } = extractText(html)
        if (!body) return
        docs.push({
          id: docs.length.toString(),
          title: title || path.basename(file, '.html'),
          body,
          url: normalizeUrl(outputDir, file),
        })
      } catch (err) {
        logger.warn(`Failed to index page ${file}: ${err.message}`)
      }
    })

    fs.writeFileSync(indexPath, JSON.stringify({ docs }, null, 2), 'utf8')
    logger.info(`Wrote Lunr search index to ${indexPath} (${docs.length} pages indexed)`)
  }

  this.once('contentAggregated', buildIndex)
  this.once('site:generated', buildIndex)
  this.once('site:assembled', buildIndex)
  this.once('beforeProcess', buildIndex)
}
