import puter from '@heyputer/puter.js'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))
const formatJSON = (data: Record<string, unknown>) => JSON.stringify(data, null, 2)
const extractText = (response: unknown): string => {
  if (!response || typeof response !== 'object') return 'No response received.'
  const maybe = response as { message?: { content?: unknown } }
  const content = maybe.message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    const first = content.find(part => typeof part === 'string')
    if (typeof first === 'string') return first
  }
  return JSON.stringify(content ?? response, null, 2)
}

const getDemoPath = () => {
  if (puter.appDataPath && puter.path?.join) {
    return puter.path.join(puter.appDataPath, 'puterjs-demo.txt')
  } 
  return 'puterjs-demo.txt'
}

const initTabs = () => {
  const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'))
  const tabSections = Array.from(document.querySelectorAll<HTMLElement>('.tab-content'))

  const setActiveTab = (tabId: string) => {
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId))
    tabSections.forEach(section => {
      section.toggleAttribute('hidden', section.dataset.content !== tabId)
    })
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab || 'kv'))
  })

  setActiveTab('kv')
}

const initKv = () => {
  const kvValueEl = document.querySelector<HTMLElement>('[data-kv-value]')
  const incrBtn = document.querySelector<HTMLButtonElement>('[data-kv-action="incr"]')
  const decrBtn = document.querySelector<HTMLButtonElement>('[data-kv-action="decr"]')
  if (!kvValueEl || !incrBtn || !decrBtn) return
  let kvLocal = 0

  const updateKvUi = () => {
    kvValueEl.textContent = kvLocal.toString()
    incrBtn.disabled = false
    decrBtn.disabled = false
  }

  const loadKv = async () => {
    incrBtn.disabled = true
    decrBtn.disabled = true
    kvValueEl.textContent = 'loading...'
    try {
      const counter = await puter.kv.get<number>('testCounter')
      kvLocal = counter || 0
    } catch (error) {
      kvLocal = 0
      console.error('KV load failed', error)
    }
    updateKvUi()
  }

  incrBtn.addEventListener('click', async () => {
    kvLocal += 1
    updateKvUi()
    await puter.kv.incr('testCounter', 1)
  })

  decrBtn.addEventListener('click', async () => {
    kvLocal -= 1
    updateKvUi()
    await puter.kv.decr('testCounter', 1)
  })

  loadKv()
}

const initFs = () => {
  const fsStatus = document.querySelector<HTMLElement>('[data-fs-status]')
  const fsContents = document.querySelector<HTMLElement>('[data-fs-contents]')
  const fsCallout = document.querySelector<HTMLElement>('[data-fs-callout]')
  const demoPathEl = document.querySelector<HTMLElement>('[data-demo-path]')
  const writeBtn = document.querySelector<HTMLButtonElement>('[data-fs-action="write"]')
  const readBtn = document.querySelector<HTMLButtonElement>('[data-fs-action="read"]')
  if (!fsStatus || !fsContents || !fsCallout || !demoPathEl || !writeBtn || !readBtn) return

  const demoPath = getDemoPath()
  demoPathEl.textContent = demoPath

  writeBtn.addEventListener('click', async () => {
    fsStatus.textContent = 'Status: Writing sample file...'
    try {
      await puter.fs.write(demoPath, `Hello from Puter.js at ${new Date().toISOString()}`)
      fsStatus.textContent = `Status: Wrote sample text to ${demoPath}`
    } catch (error) {
      fsStatus.textContent = `Status: Write failed: ${getErrorMessage(error)}`
    }
  })

  readBtn.addEventListener('click', async () => {
    fsStatus.textContent = 'Status: Reading file...'
    try {
      const blob = await puter.fs.read(demoPath)
      const text = await blob.text()
      fsContents.textContent = text
      fsCallout.hidden = false
      fsStatus.textContent = 'Status: Read succeeded'
    } catch (error) {
      fsStatus.textContent = `Status: Read failed: ${getErrorMessage(error)}`
    }
  })
}

const initOs = () => {
  const osStatus = document.querySelector<HTMLElement>('[data-os-status]')
  const osUserWrap = document.querySelector<HTMLElement>('[data-os-user]')
  const osUserPre = document.querySelector<HTMLElement>('[data-os-user-pre]')
  const osVersionWrap = document.querySelector<HTMLElement>('[data-os-version]')
  const osVersionPre = document.querySelector<HTMLElement>('[data-os-version-pre]')
  const userBtn = document.querySelector<HTMLButtonElement>('[data-os-action="user"]')
  const versionBtn = document.querySelector<HTMLButtonElement>('[data-os-action="version"]')
  if (!osStatus || !osUserWrap || !osUserPre || !osVersionWrap || !osVersionPre || !userBtn || !versionBtn) return

  userBtn.addEventListener('click', async () => {
    osStatus.textContent = 'Status: Fetching user...'
    try {
      const user = await puter.os.user()
      osUserPre.textContent = formatJSON(user)
      osUserWrap.hidden = false
      osStatus.textContent = 'Status: User info loaded'
    } catch (error) {
      osStatus.textContent = `Status: User lookup failed: ${getErrorMessage(error)}`
    }
  })

  versionBtn.addEventListener('click', async () => {
    osStatus.textContent = 'Status: Fetching version...'
    try {
      const version = await puter.os.version()
      osVersionPre.textContent = formatJSON(version)
      osVersionWrap.hidden = false
      osStatus.textContent = 'Status: Version loaded'
    } catch (error) {
      osStatus.textContent = `Status: Version lookup failed: ${getErrorMessage(error)}`
    }
  })
}

const initUi = () => {
  const uiResult = document.querySelector<HTMLElement>('[data-ui-result]')
  const openBtn = document.querySelector<HTMLButtonElement>('[data-ui-open]')
  if (!uiResult || !openBtn) return

  openBtn.addEventListener('click', async () => {
    try {
      const result = await puter.ui.showOpenFilePicker({ multiple: false })
      const file = Array.isArray(result) ? result[0] : result
      uiResult.textContent = file ? `Selected file: ${file.name || file.path || 'unknown'}` : 'No file selected'
    } catch (error) {
      uiResult.textContent = `File picker failed: ${getErrorMessage(error)}`
    }
  })
}

const initAi = () => {
  const aiInput = document.querySelector<HTMLTextAreaElement>('[data-ai-input]')
  const aiSend = document.querySelector<HTMLButtonElement>('[data-ai-send]')
  const aiStatus = document.querySelector<HTMLElement>('[data-ai-status]')
  const aiHistoryWrap = document.querySelector<HTMLElement>('[data-ai-history]')
  const aiHistoryList = document.querySelector<HTMLElement>('[data-ai-history-list]')
  if (!aiInput || !aiSend || !aiStatus || !aiHistoryWrap || !aiHistoryList) return

  let isAiLoading = false

  aiSend.addEventListener('click', async () => {
    const value = aiInput.value.trim()
    if (!value || isAiLoading) return
    isAiLoading = true
    aiStatus.textContent = 'Status: Sending to Puter AI...'
    aiSend.disabled = true
    try {
      const response = await puter.ai.chat(value)
      const text = extractText(response)
      const turn = document.createElement('div')
      turn.className = 'chat-turn'
      turn.innerHTML = `
        <div class="chat-label">You</div>
        <div class="chat-bubble"></div>
        <div class="chat-label">Puter AI</div>
        <div class="chat-bubble alt"></div>
      `
      const bubbles = turn.querySelectorAll<HTMLElement>('.chat-bubble')
      bubbles[0].textContent = value
      bubbles[1].textContent = text
      aiHistoryList.appendChild(turn)
      aiHistoryWrap.hidden = false
      aiInput.value = ''
      aiStatus.textContent = 'Status: Reply received'
    } catch (error) {
      aiStatus.textContent = `Status: Error: ${getErrorMessage(error)}`
    } finally {
      isAiLoading = false
      aiSend.disabled = false
    }
  })
}

const init = () => {
  initTabs()
  initKv()
  initFs()
  initOs()
  initUi()
  initAi()
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init()
} else {
  document.addEventListener('DOMContentLoaded', init)
}
