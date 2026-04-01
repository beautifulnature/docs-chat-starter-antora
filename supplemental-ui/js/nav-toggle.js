document.addEventListener('DOMContentLoaded', () => {
  const body = document.body
  const leftBtn = document.querySelector('[data-toggle="left-nav"]')
  const rightBtn = document.querySelector('[data-toggle="right-nav"]')

  function setButtonState() {
    if (leftBtn) {
      leftBtn.classList.toggle('nav-toggle-active', body.classList.contains('hide-nav-left'))
    }
    if (rightBtn) {
      rightBtn.classList.toggle('nav-toggle-active', body.classList.contains('hide-nav-right'))
    }
  }

  function toggleLeft() {
    body.classList.toggle('hide-nav-left')
    setButtonState()
  }

  function toggleRight() {
    body.classList.toggle('hide-nav-right')
    setButtonState()
  }

  if (leftBtn) leftBtn.addEventListener('click', toggleLeft)
  if (rightBtn) rightBtn.addEventListener('click', toggleRight)

  let sequenceState = ''
  let sequenceTimer = null

  function resetSequence() {
    sequenceState = ''
    if (sequenceTimer) {
      clearTimeout(sequenceTimer)
      sequenceTimer = null
    }
  }

  document.addEventListener('keydown', (event) => {
    const tag = (event.target.tagName || '').toLowerCase()
    const isTypingTarget =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      event.target.isContentEditable

    if (isTypingTarget) return

    const key = event.key.toLowerCase()

    if (sequenceState === '') {
      if (key === 't') {
        sequenceState = 't'
        sequenceTimer = setTimeout(resetSequence, 1200)
      }
      return
    }

    if (sequenceState === 't') {
      if (key === 'l') {
        event.preventDefault()
        toggleLeft()
        resetSequence()
        return
      }

      if (key === 'r') {
        event.preventDefault()
        toggleRight()
        resetSequence()
        return
      }

      resetSequence()
    }
  })

  setButtonState()
})