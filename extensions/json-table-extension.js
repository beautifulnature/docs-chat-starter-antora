'use strict'

const fs = require('fs')
const path = require('path')

module.exports.register = function ({ config = {} }) {
  const logger = this.getLogger('json-table-extension')

  this.once('beforeProcess', () => {
    const cwd = process.cwd()
    const dataDir = path.resolve(cwd, config.data_dir || 'data')
    const tableDefs = Array.isArray(config.tables) ? config.tables : []

    tableDefs.forEach((def) => {
      const jsonPath = path.join(dataDir, def.file)
      const source = fs.readFileSync(jsonPath, 'utf8')
      const rows = JSON.parse(source)

      if (!Array.isArray(rows)) {
        throw new Error(`Expected array in JSON file: ${jsonPath}`)
      }

      const columns = Array.isArray(def.columns) && def.columns.length
        ? def.columns
        : inferColumns(rows)

      const adoc = renderTable(rows, columns, def.title)

      const outFile = path.join(
        cwd,
        'docs',
        'modules',
        def.module || 'ROOT',
        'partials',
        def.partial
      )

      fs.mkdirSync(path.dirname(outFile), { recursive: true })
      fs.writeFileSync(outFile, adoc, 'utf8')

      logger.info(`Generated partial ${outFile} from ${jsonPath}`)
    })
  })
}

function inferColumns(rows) {
  const first = rows[0] || {}
  return Object.keys(first).map((key) => ({ key, header: key }))
}

function escapeCell(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
}

function renderTable(rows, columns, title) {
  const colSpec = columns.map(() => '1').join(',')
  const lines = []

  if (title) lines.push(`.${title}`)
  lines.push(`[cols="${colSpec}",options="header"]`)
  lines.push('|===')

  for (const col of columns) lines.push(`|${escapeCell(col.header)}`)

  for (const row of rows) {
    for (const col of columns) {
      lines.push(`|${escapeCell(readValue(row, col.key))}`)
    }
  }

  lines.push('|===')
  lines.push('')
  return lines.join('\n')
}

function readValue(obj, key) {
  if (!key.includes('.')) return obj[key]
  return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj)
}