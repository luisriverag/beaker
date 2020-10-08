/* globals customElements */
import { LitElement, html, css } from '../vendor/lit-element/lit-element'
import { repeat } from '../vendor/lit-element/lit-html/directives/repeat'
import * as bg from './bg-process-rpc'
import commonCSS from './common.css'

class BrowserMenu extends LitElement {
  static get properties () {
    return {
      submenu: {type: String}
    }
  }

  constructor () {
    super()
    this.submenu = ''
    this.isDarwin = false
    this.windowMenuItems = undefined
  }

  reset () {
    this.submenu = ''
    this.daemonStatus = undefined
  }

  async init () {
    await this.requestUpdate()
    let [browserInfo, menuItems] = await Promise.all([
      bg.beakerBrowser.getInfo(),
      bg.shellMenus.getWindowMenu()
    ])
    this.browserInfo = browserInfo
    this.isDarwin = browserInfo.platform === 'darwin'
    this.windowMenuItems = menuItems
    await this.requestUpdate()
    this.daemonStatus = await bg.beakerBrowser.getDaemonStatus()
    this.requestUpdate()
  }

  render () {
    if (this.submenu === 'apps') {
      return this.renderApps()
    } else if (this.submenu) {
      return this.renderWindowMenu(this.submenu)
    }

    // auto-updater
    var autoUpdaterEl = html``
    if (this.browserInfo && this.browserInfo.updater.isBrowserUpdatesSupported && this.browserInfo.updater.state === 'downloaded') {
      autoUpdaterEl = html`
        <div class="section auto-updater">
          <div class="menu-item auto-updater" @click=${this.onClickRestart}>
            <i class="fa fa-arrow-circle-up"></i>
            <span class="label">Restart to update Beaker</span>
          </div>
        </div>
      `
    }

    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="wrapper">
        ${autoUpdaterEl}

        <div class="section">
          <div class="menu-item" @click=${e => this.onNewHyperdrive()}>
            <i class="fas fa-plus"></i>
            <span class="label">New Site...</span>
          </div>

          <div class="menu-item" @click=${e => this.onNewHyperdriveFromFolder(e)}>
            <i class="fas fa-file-upload"></i>
            <span class="label">New Site From Folder...</span>
          </div>
        </div>

        <div class="section">
          <div class="menu-item" @click=${e => this.onShowSubmenu('apps')}>
            <i class="fas fa-th"></i>
            <span class="label">Apps</span>
            <span class="more"><span class="fas fa-caret-right"></span></span>
          </div>

          <div class="menu-item" @click=${e => this.onOpenPage(e, 'beaker://library')}>
            <img class="favicon" src="asset:favicon:beaker://library/">
            <span class="label">My Library</span>
          </div>

          <div class="menu-item" @click=${e => this.onOpenPage(e, 'beaker://history')}>
            <img class="favicon" src="asset:favicon:beaker://history/">
            <span class="label">History</span>
          </div>

          <div class="menu-item" @click=${e => this.onOpenPage(e, 'beaker://settings')}>
            <img class="favicon" src="asset:favicon:beaker://settings/">
            <span class="label">Settings</span>
          </div>
        </div>

        <div class="section">
          <div class="menu-item" @click=${e => this.onPrint()}>
            <i class="fas fa-print"></i>
            <span class="label">Print</span>
          </div>

          <div class="menu-item" @click=${e => this.onShowSubmenu('Help')}>
            <i class="far fa-life-ring"></i>
            <span class="label">Help</span>
            <span class="more"><span class="fas fa-caret-right"></span></span>
          </div>
        </div>

        ${this.daemonStatus ? html`
          <div class="network-status">
            <div class="network-status-title">Network Status</div>
            <div class="network-status-line">
              <span class="fa-fw fas fa-network-wired"></span>
              ${this.daemonStatus.remoteAddress || 'Unknown'}
            </div>
            <div class="network-status-line">
              ${this.daemonStatus.holepunchable
                ? html`<span class="fa-fw fas fa-check"></span> Hole-punchable`
                : html`<span class="fa-fw fas fa-exclamation-triangle"></span> Not hole-punchable`
              }
            </div>
            ${!this.daemonStatus.holepunchable ? html`
              <div class="help">
                <a @click=${e => this.onOpenPage(e, 'https://docs.beakerbrowser.com/help/hole-punchability')}>
                  <span class="far fa-fw fa-question-circle"></span> What does this mean?
                </a>
            </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  renderApps () {
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="wrapper">
        <div class="header">
          <button class="btn" @click=${e => this.onShowSubmenu('')} title="Go back">
            <i class="fa fa-angle-left"></i>
          </button>
          <h2>Apps</h2>
        </div>
        <div class="section">
          <div class="menu-item" @click=${e => this.onOpenPage(e, 'beaker://social')}>
            <img class="favicon" src="asset:favicon:beaker://social/">
            <span class="label">Beaker Social</span>
          </div>

          <div class="menu-item" @click=${e => this.onOpenPage(e, 'beaker://uplink')}>
            <img class="favicon" src="asset:favicon:beaker://uplink/">
            <span class="label">Beaker Uplink</span>
          </div>

          <div class="menu-item" @click=${e => this.onOpenPage(e, 'beaker://reader')}>
            <img class="favicon" src="asset:favicon:beaker://reader/">
            <span class="label">Beaker Reader</span>
          </div>
        </div>
      </div>`
  }


  renderWindowMenu (menu) {
    var items = this.windowMenuItems[menu]
    if (!items) return html``
    return html`
      <link rel="stylesheet" href="beaker://assets/font-awesome.css">
      <div class="wrapper">
        <div class="header">
          <button class="btn" @click=${e => this.onShowSubmenu('')} title="Go back">
            <i class="fa fa-angle-left"></i>
          </button>
          <h2>${menu}</h2>
        </div>
        <div class="section">
          ${repeat(items, (item, i) => item.id || i, item => item.separator
            ? html`<hr>`
            : html`
              <div class="menu-item" @click=${this.onClickMenuItem(menu, item.id)} ?disabled=${!item.enabled}>
                <span class="label">${item.label}</span>
                ${item.accelerator ? html`<span class="shortcut">${this.renderAccelerator(item.accelerator)}</span>` : ''}
              </div>
            `
          )}
        </div>
      </div>`
  }

  renderAccelerator (accel) {
    if (!accel) return
    const command = '⌘'
    const control = '^'
    const commandOrControl = this.isDarwin ? command : control
    return accel
      .replace(/\+/g, '')
      .replace('CmdOrCtrl', commandOrControl)
      .replace('Alt', '⌥')
      .replace('Cmd', command)
      .replace('Ctrl', control)
      .replace('Shift', '⇧')
      .replace('Plus', '+')
      .replace('Left', '←')
      .replace('Right', '→')
      .replace('`', '~')
  }

  // events
  // =

  updated () {
    // adjust dimensions based on rendering
    var width = this.shadowRoot.querySelector('div').clientWidth|0
    var height = this.shadowRoot.querySelector('div').clientHeight|0
    bg.shellMenus.resizeSelf({width, height})
  }

  onShowSubmenu (v) {
    this.submenu = v
  }

  onOpenNewTab () {
    bg.shellMenus.createTab()
    bg.shellMenus.close()
  }

  onClickMenuItem (menu, id) {
    return async (e) => {
      bg.shellMenus.triggerWindowMenuItemById(menu, id)
      bg.shellMenus.close()
    }
  }

  async onNewHyperdrive () {
    bg.shellMenus.close()
    const url = await bg.hyperdrive.createDrive()
    bg.beakerBrowser.openUrl(url, {setActive: true, addedPaneUrls: ['beaker://editor/']})
  }

  async onNewHyperdriveFromFolder (e) {
    bg.shellMenus.close()

    var folder = await bg.beakerBrowser.showOpenDialog({
      title: 'Select folder',
      buttonLabel: 'Use folder',
      properties: ['openDirectory']
    })
    if (!folder || !folder.length) return

    var url = await bg.hyperdrive.createDrive({
      title: folder[0].split('/').pop(),
      prompt: false
    })
    await bg.hyperdrive.importFromFilesystem({src: folder[0], dst: url})
    
    bg.beakerBrowser.openUrl(url, {setActive: true})
  }

  onPrint (e) {
    bg.views.print('active')
  }

  onOpenPage (e, url) {
    bg.shellMenus.createTab(url)
    bg.shellMenus.close()
  }

  onClickRestart () {
    bg.shellMenus.close()
    bg.beakerBrowser.restartBrowser()
  }
}
BrowserMenu.styles = [commonCSS, css`
.wrapper {
  width: 220px;
}

.wrapper::-webkit-scrollbar {
  display: none;
}

.section:last-child {
  border-bottom: 0;
}

.section.auto-updater {
  padding-bottom: 0;
  border-bottom: 0;
}

.section.gray {
  padding: 2px 0;
  background: #f5f5fa;
}

.section.gray .menu-item:hover {
  background: #e5e5ee;
}

.section.scrollable {
  max-height: 400px;
  overflow-y: auto;
}

.menu-item-group {
  display: flex;
  padding: 0 2px;
}

.menu-item-group > .menu-item:first-child {
  padding-right: 8px;
}

.menu-item-group > .menu-item:last-child {
  padding-left: 8px;
}

.menu-item-group > .menu-item .shortcut {
  padding-left: 10px;
}

.menu-item {
  height: 32px;
}

.menu-item[disabled] {
  color: #99a;
}

.menu-item[disabled]:hover {
  background: none;
}

.menu-item.auto-updater {
  height: 35px;
  background: #DCEDC8;
  border-top: 1px solid #c5e1a5;
  border-bottom: 1px solid #c5e1a5;
  color: #000;
}

.menu-item.auto-updater i {
  color: #7CB342;
}

.menu-item.auto-updater:hover {
  background: #d0e7b5;
}

.menu-item i.more {
  margin-left: auto;
  padding-right: 0;
  text-align: right;
}

.menu-item i {
  color: var(--text-color--menu-item-icon--light);
}

.menu-item .more,
.menu-item .shortcut {
  color: var(--text-color--menu-item-icon--light);
  margin-left: auto;
}

.menu-item .shortcut {
  font-size: 12px;
  -webkit-font-smoothing: antialiased;
}

.network-status {
  padding: 8px;
  background: #fafafd;
}

.network-status-title {
 font-size: 11px;
 font-weight: bold;
 padding: 0 3px 3px;
}

.network-status-line {
  font-size: 12px;
  white-space: nowrap;
  color: inherit;
  margin: 5px 2px 0;
}

.network-status-line .fa-fw,
.network-status .help .fa-fw {
  margin: 0 5px;
}

.network-status .fa-exclamation-triangle {
  color: #FF8F00;
}

.network-status .help {
  margin: 5px 2px 0;
}

.network-status .help a {
  text-decoration: none;
  color: inherit;
}

.network-status .help a:hover {
  text-decoration: underline;
}
`]

customElements.define('browser-menu', BrowserMenu)