# Architecture Improvements Guide

This document details improvements for:
1. **Standardized Module Pattern** (Point 2)
2. **Removing Global State** (Point 3)
3. **Component Lifecycle Management** (Point 6)
4. **Vanilla Templating Alternatives**

---

## 1. Standardized Module Pattern

### Current Problems

- **Inconsistent structure**: Each module implements things differently
- **No cleanup**: Event listeners and subscriptions persist after navigation
- **Manual DOM queries**: Repeated `querySelector` calls scattered throughout
- **No lifecycle hooks**: Can't easily initialize/cleanup resources
- **Hard to test**: Tightly coupled to DOM structure

### Proposed Solution: Module Base Class

Create a base `Module` class that provides:
- Lifecycle hooks (`init`, `mount`, `unmount`, `destroy`)
- Automatic cleanup of event listeners
- Subscription management
- DOM element caching
- Consistent structure

### Implementation

**`src/libs/module.js`** - Base Module Class:

```javascript
/**
 * Base Module class providing lifecycle management and cleanup
 */
export class Module {
  constructor(name, containerSelector = 'main .modules') {
    this.name = name;
    this.containerSelector = containerSelector;
    this.moduleElement = null;
    this.elements = {};
    this.eventListeners = [];
    this.subscriptions = [];
    this.timers = [];
    this.initialized = false;
  }

  /**
   * Initialize the module - called once when module is first loaded
   */
  async init() {
    if (this.initialized) return;
    
    // Insert module HTML
    const html = await this.getTemplate();
    const container = document.querySelector(this.containerSelector);
    if (container) {
      container.insertAdjacentHTML('beforeend', html);
      this.moduleElement = document.querySelector(`#${this.name}`);
      this.cacheElements();
    }
    
    this.initialized = true;
  }

  /**
   * Mount the module - called when navigating to this module
   */
  mount() {
    if (!this.initialized) {
      this.init();
    }
    
    this.setupEventListeners();
    this.setupSubscriptions();
    this.onMount();
  }

  /**
   * Unmount the module - called when navigating away
   */
  unmount() {
    this.cleanupEventListeners();
    this.cleanupSubscriptions();
    this.cleanupTimers();
    this.onUnmount();
  }

  /**
   * Destroy the module - called when module should be completely removed
   */
  destroy() {
    this.unmount();
    if (this.moduleElement) {
      this.moduleElement.remove();
      this.moduleElement = null;
    }
    this.onDestroy();
  }

  // Lifecycle hooks - override in subclasses
  async getTemplate() {
    throw new Error('getTemplate() must be implemented');
  }

  cacheElements() {
    // Override to cache DOM elements
    // Example: this.elements.searchInput = this.moduleElement.querySelector('.search');
  }

  setupEventListeners() {
    // Override to set up event listeners using this.addEventListener()
  }

  setupSubscriptions() {
    // Override to set up store subscriptions
  }

  onMount() {
    // Override for mount logic
  }

  onUnmount() {
    // Override for unmount logic
  }

  onDestroy() {
    // Override for destroy logic
  }

  // Helper methods
  addEventListener(element, event, handler, options = {}) {
    if (!element) return;
    
    element.addEventListener(event, handler, options);
    this.eventListeners.push({ element, event, handler, options });
  }

  subscribe(store, properties, callback) {
    const unsubscribe = store.subscribeToProperties(properties, callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  setTimer(callback, delay) {
    const id = setTimeout(callback, delay);
    this.timers.push(id);
    return id;
  }

  setInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.timers.push(id);
    return id;
  }

  cleanupEventListeners() {
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];
  }

  cleanupSubscriptions() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }

  cleanupTimers() {
    this.timers.forEach(id => clearTimeout(id));
    this.timers.forEach(id => clearInterval(id));
    this.timers = [];
  }

  query(selector) {
    return this.moduleElement?.querySelector(selector);
  }

  queryAll(selector) {
    return this.moduleElement?.querySelectorAll(selector) || [];
  }
}
```

### Example: Refactored Bookmarks Module

**`src/modules/bookmarks/index.js`**:

```javascript
import { Module } from 'libs/module';
import modulePartial from 'modules/bookmarks/partials/index.html';
import bookmarkPartial from 'modules/bookmarks/partials/bookmark.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';

class BookmarksModule extends Module {
  constructor() {
    super('bookmarks');
    this.searchValue = '';
    this.tableOrder = { field: 'title', direction: 'asc' };
    this.searchTimer = null;
  }

  async getTemplate() {
    return modulePartial;
  }

  cacheElements() {
    this.elements.loading = this.query('.loading');
    this.elements.container = this.query('.container-fluid');
    this.elements.searchInput = this.query('.search');
    this.elements.table = this.query('.table');
    this.elements.tbody = this.query('tbody');
    this.elements.thead = this.query('thead');
  }

  setupEventListeners() {
    this.addEventListener(this.elements.searchInput, 'input', (e) => this.handleSearch(e));
    this.addEventListener(this.elements.thead, 'click', (e) => this.handleOrder(e));
  }

  setupSubscriptions() {
    this.subscribe(
      bookmarkService,
      ['bookmarks', 'jobs'],
      (state) => this.render(state)
    );
  }

  handleSearch(event) {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = this.setTimer(() => {
      this.searchValue = event.target.value;
      const bookmarks = bookmarkService.getBookmarks();
      this.render({ bookmarks, jobs: bookmarkService.getJobs() });
    }, 300);
  }

  handleOrder(event) {
    const cell = event.target.closest('.orderable');
    if (!cell) return;

    this.tableOrder.field = cell.dataset.field;
    this.tableOrder.direction = cell.classList.contains('asc') ? 'desc' : 'asc';
    
    this.queryAll('thead th').forEach(cell => {
      cell.classList.remove('asc', 'desc');
    });
    cell.classList.add(this.tableOrder.direction);
    
    const bookmarks = bookmarkService.getBookmarks();
    this.render({ bookmarks, jobs: bookmarkService.getJobs() });
  }

  render(state) {
    if (!state.bookmarks) return;

    // Filter and sort logic...
    const filtered = this.filterBookmarks(state.bookmarks);
    const sorted = this.sortBookmarks(filtered);
    
    // Render using template (see templating section)
    const html = sorted.map(bookmark => 
      this.renderBookmark(bookmark, state.jobs)
    ).join('');
    
    morphdom(this.elements.tbody, `<tbody>${html}</tbody>`, { childrenOnly: true });
    
    this.elements.loading.classList.add('d-none');
    this.elements.container.classList.remove('d-none');
  }

  filterBookmarks(bookmarks) {
    const searchTerms = this.searchValue.toLowerCase().split(/\s+/);
    return _.filter(bookmarks, (bookmark) => {
      const text = `${bookmark.title || ''}`.toLowerCase();
      return _.every(searchTerms, (term) => text.includes(term));
    });
  }

  sortBookmarks(bookmarks) {
    return _.orderBy(bookmarks, 
      [(bookmark) => {
        const value = _.get(bookmark, this.tableOrder.field);
        return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
      }],
      [this.tableOrder.direction]
    );
  }

  renderBookmark(bookmark, jobs) {
    // Use your templating solution here
    return bookmarkTemplate({ bookmark, jobs, prettyBytes });
  }

  onUnmount() {
    // Clear search when leaving
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.searchValue = '';
  }
}

// Export singleton instance
const bookmarksModule = new BookmarksModule();
export default bookmarksModule;
```

### Module Registry

**`src/modules/registry.js`**:

```javascript
import bookmarksModule from 'modules/bookmarks';
import appsModule from 'modules/apps';
// ... other modules

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.currentModule = null;
  }

  register(name, module) {
    this.modules.set(name, module);
  }

  async show(name) {
    // Unmount current module
    if (this.currentModule) {
      this.currentModule.unmount();
    }

    // Mount new module
    const module = this.modules.get(name);
    if (module) {
      await module.mount();
      this.currentModule = module;
    }
  }

  init() {
    // Register all modules
    this.register('bookmarks', bookmarksModule);
    this.register('apps', appsModule);
    // ... register others
  }
}

export default new ModuleRegistry();
```

---

## 2. Removing Global State

### Current Problems

- `window.account`, `window.isAuthenticated`, `window.isAdmin` pollute global scope
- Hard to test (global dependencies)
- No single source of truth
- Can't easily track state changes
- Race conditions possible

### Proposed Solution: Auth Store

Create a dedicated store for authentication state.

### Implementation

**`src/stores/auth.js`**:

```javascript
import Store from 'stores/store';

class AuthStore extends Store {
  constructor() {
    const initialState = {
      account: null,
      isAuthenticated: false,
      isAdmin: false
    };
    
    super({
      namespace: 'auth'
    });
    
    this.setState(initialState, 'init');
    this.loadFromCookie();
  }

  loadFromCookie() {
    try {
      const encodedAccount = document.cookie
        .match('(^|;)\\s*account\\s*=\\s*([^;]+)')?.pop();
      
      if (encodedAccount) {
        const decodedAccountJson = atob(encodedAccount);
        const account = JSON.parse(decodedAccountJson);
        this.setAccount(account);
      }
    } catch (error) {
      console.error('Failed to load account from cookie:', error);
      this.setAccount(null);
    }
  }

  setAccount(account) {
    const isAuthenticated = !_.isEmpty(account);
    const isAdmin = isAuthenticated && _.includes(account.groups, 'admins');
    
    this.setState({
      account,
      isAuthenticated,
      isAdmin
    }, 'set_account');
  }

  getAccount() {
    return this.getStateProperty('account');
  }

  getIsAuthenticated() {
    return this.getStateProperty('isAuthenticated');
  }

  getIsAdmin() {
    return this.getStateProperty('isAdmin');
  }

  logout() {
    // Clear cookie
    document.cookie = 'account=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    this.setAccount(null);
  }
}

export default new AuthStore();
```

### Update Navigation to Use Store

**`src/shell/navigation.js`** (updated):

```javascript
import page from 'page';
import authStore from 'stores/auth';
import moduleRegistry from 'modules/registry';

const showPage = (ctx) => {
  const module = ctx.params.module || 'dashboard';
  
  // Update navigation
  _.each(container.querySelectorAll('.nav-link.active'), (element) => { 
    element.classList.remove('active'); 
  });
  _.each(container.querySelectorAll(`.nav-link[href="/${module}"]`), (element) => { 
    element.classList.add('active'); 
  });

  // Hide all modules
  _.each(document.querySelectorAll('.modules > div'), (element) => { 
    element.classList.add('d-none'); 
  });
  
  // Show selected module via registry
  moduleRegistry.show(module);
};

const requireAuth = (ctx, next) => {
  if (!authStore.getIsAuthenticated()) {
    page.redirect('/');
    return;
  }
  next();
};

const requiresAdmin = (ctx, next) => {
  if (!authStore.getIsAdmin()) {
    page.redirect('/');
    return;
  }
  next();
};

// ... rest of navigation code
```

### Update Modules to Use Auth Store

**Example in `src/modules/users/index.js`**:

```javascript
import authStore from 'stores/auth';

// Instead of: const isSameAsLoggedIn = (user.username === account?.user);
const isSameAsLoggedIn = (user.username === authStore.getAccount()?.user);
```

### Update Index.js

**`src/index.js`** (updated):

```javascript
import 'assets/scss/index.scss';
import 'libs/lodash';
import 'libs/bootstrap';
import 'libs/dialog';
import 'libs/components';
import * as bootstrapService from 'shell/services/bootstrap';
import authStore from 'stores/auth';

// Auth is now loaded via store, no global window variables
window.notifier = document.querySelector('u-notifier');

let subscription;

const render = async (state) => {
  const isSetupRequired = bootstrapService.checkIfSetupIsRequired(state);
  if (_.isNull(isSetupRequired) || state.update === -1) {
    return;
  }
  
  bootstrapService.unsubscribe(subscription);
  subscription = null;

  if (isSetupRequired) {
    await import('shell/setup');
  } else if (authStore.getIsAuthenticated() && authStore.getIsAdmin() && !_.isNull(state.update)) {
    await import('shell/update');
  } else {
    try {
      await Promise.allSettled([
        import('shell/header'),
        import('shell/main')
      ]);
      const { modulesLoaded } = await import('modules');
      await modulesLoaded;
      await import('shell/navigation');
    } catch (error) {
      alert(`Error during application initialization<br><br>${error}`);
      console.error('Error during application initialization:', error);
    }
  }
};

subscription = bootstrapService.subscribe([render]);
```

---

## 3. Component Lifecycle Management

### Current Problems

- No lifecycle hooks for modules
- Manual cleanup required everywhere
- Easy to leak memory (event listeners, subscriptions, timers)
- Inconsistent cleanup patterns
- Hard to know when to initialize/cleanup resources

### Solution: Lifecycle Hooks in Module Base Class

The `Module` base class (from section 1) already provides lifecycle management. Here's how to use it:

### Lifecycle Flow

```
Module Loaded
    ↓
init() - Called once, sets up DOM structure
    ↓
mount() - Called when navigating to module
    ├─ setupEventListeners()
    ├─ setupSubscriptions()
    └─ onMount() - Custom mount logic
    ↓
[Module Active - user interacts]
    ↓
unmount() - Called when navigating away
    ├─ cleanupEventListeners()
    ├─ cleanupSubscriptions()
    ├─ cleanupTimers()
    └─ onUnmount() - Custom cleanup logic
    ↓
[Module Hidden but still in DOM]
    ↓
destroy() - Called when module should be completely removed
    └─ onDestroy() - Final cleanup
```

### Example: Modal with Lifecycle

**`src/modules/dashboard/metrics.js`** (refactored):

```javascript
import { Module } from 'libs/module';
import metricsModalPartial from 'modules/dashboard/partials/modals/metrics.html';
import * as metricsService from 'modules/dashboard/services/metrics';

class MetricsModal extends Module {
  constructor() {
    super('metrics-modal');
    this.poller = null;
    this.toggledRows = [];
  }

  async getTemplate() {
    return metricsModalPartial;
  }

  cacheElements() {
    // Modal is in body, not in module container
    this.modal = document.querySelector('#metrics');
    this.modalBody = this.modal?.querySelector('.modal-body');
    this.elements.loading = this.modalBody?.querySelector('.loading');
    this.elements.container = this.modalBody?.querySelector('.container-fluid');
  }

  setupEventListeners() {
    this.addEventListener(this.modal, 'show.bs.modal', () => this.onShow());
    this.addEventListener(this.modal, 'hidden.bs.modal', () => this.onHidden());
    this.addEventListener(this.modal, 'click', (e) => this.handleClick(e));
  }

  setupSubscriptions() {
    // Subscription is set up in onShow, cleaned up in onHidden
  }

  onShow() {
    // Set up subscription when modal opens
    this.subscription = metricsService.subscribe([render]);
    
    // Start polling
    this.poller = this.setInterval(() => {
      metricsService.fetch();
    }, 60000);
  }

  onHidden() {
    // Clean up when modal closes
    this.cleanupSubscriptions();
    this.cleanupTimers();
    
    if (this.elements.container) {
      this.elements.container.innerHTML = '';
      this.elements.container.classList.add('d-none');
    }
    if (this.elements.loading) {
      this.elements.loading.classList.remove('d-none');
    }
    
    this.toggledRows = [];
  }

  handleClick(event) {
    if (event.target.closest('u-button')?.dataset.action === 'enable') {
      this.enable();
    } else if (event.target.closest('u-button')?.dataset.action === 'disable') {
      this.disable();
    } else if (event.target.closest('a')?.classList.contains('metrics-events')) {
      this.toggleCompression(event);
    }
  }

  enable() {
    metricsService.enable();
  }

  disable() {
    metricsService.disable();
  }

  toggleCompression(event) {
    event.preventDefault();
    const toggler = event.target.closest('a');
    const row = { 
      date: toggler.dataset.date, 
      time: toggler.dataset.time 
    };
    const index = _.findIndex(this.toggledRows, row);
    if (index === -1) {
      this.toggledRows.push(row);
    } else {
      this.toggledRows.splice(index, 1);
    }
    const metrics = metricsService.getMetrics();
    this.render({ metrics });
  }

  render(state) {
    if (!state.metrics) return;
    
    // Render logic...
  }

  onUnmount() {
    // Ensure modal is closed
    const modalInstance = bootstrap.Modal.getInstance(this.modal);
    if (modalInstance) {
      modalInstance.hide();
    }
  }
}

export default new MetricsModal();
```

### Lifecycle Best Practices

1. **Always clean up in `onUnmount()`**:
   - Close modals
   - Cancel pending requests
   - Clear form data if needed

2. **Use lifecycle hooks for initialization**:
   - `init()`: DOM structure, one-time setup
   - `onMount()`: Data fetching, subscriptions
   - `onUnmount()`: Cleanup subscriptions, timers
   - `onDestroy()`: Final cleanup, remove DOM

3. **Don't store state in closures**:
   - Use `this.property` instead of module-level `let` variables
   - Makes cleanup easier

4. **Use helper methods**:
   - `addEventListener()` - automatically tracked
   - `subscribe()` - automatically cleaned up
   - `setTimer()` / `setInterval()` - automatically cleared

---

## 4. Vanilla Templating Alternatives

### Current Problem: Lodash Templates

- No compile-time validation
- Easy to make typos in variable names
- No IDE autocomplete
- Runtime errors only
- Hard to debug

### Option 1: Tagged Template Literals (Recommended)

**Pros**: Native, no dependencies, type-safe with TypeScript, good performance

**Implementation**:

**`src/libs/template.js`**:

```javascript
/**
 * Tagged template literal for HTML templating
 * Provides safe HTML escaping and helper functions
 */
export function html(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    
    if (value === null || value === undefined) {
      return result + str;
    }
    
    if (Array.isArray(value)) {
      return result + value.join('') + str;
    }
    
    if (typeof value === 'object') {
      // Allow objects with toString() or render() method
      if (typeof value.toString === 'function') {
        return result + value.toString() + str;
      }
      if (typeof value.render === 'function') {
        return result + value.render() + str;
      }
      return result + JSON.stringify(value) + str;
    }
    
    // Escape HTML by default
    const escaped = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    return result + escaped + str;
  }, '');
}

/**
 * Unsafe HTML - use only when you're sure content is safe
 */
export function htmlUnsafe(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] ?? '';
    return result + String(value) + str;
  }, '');
}

/**
 * Helper for conditional rendering
 */
export function ifThen(condition, thenValue, elseValue = '') {
  return condition ? thenValue : elseValue;
}

/**
 * Helper for loops
 */
export function map(array, fn) {
  return array ? array.map(fn).join('') : '';
}
```

**Usage Example**:

```javascript
import { html, ifThen, map } from 'libs/template';

// Simple template
const bookmarkTemplate = (bookmark) => html`
  <tr class="bookmark" data-name="${bookmark.name}">
    <td>${bookmark.title}</td>
    <td>${bookmark.url}</td>
    <td>${ifThen(bookmark.isActive, '<span class="badge">Active</span>', '')}</td>
  </tr>
`;

// With loops
const bookmarksList = (bookmarks) => html`
  <tbody>
    ${map(bookmarks, bookmark => bookmarkTemplate(bookmark))}
  </tbody>
`;

// In module render method
render(state) {
  const html = bookmarksList(state.bookmarks);
  morphdom(this.elements.tbody, `<tbody>${html}</tbody>`, { childrenOnly: true });
}
```

### Option 2: nanohtml / bel (Lightweight)

**Pros**: Similar to React JSX, very small (~2KB), good performance

**Install**: `npm install nanohtml`

**Usage**:

```javascript
import nanohtml from 'nanohtml';
import raw from 'nanohtml/raw';

const bookmarkTemplate = (bookmark) => nanohtml`
  <tr class="bookmark" data-name="${bookmark.name}">
    <td>${bookmark.title}</td>
    <td>${bookmark.url}</td>
    ${bookmark.isActive ? nanohtml`<td><span class="badge">Active</span></td>` : nanohtml`<td></td>`}
  </tr>
`;

// Render
const element = bookmarkTemplate(bookmark);
morphdom(this.elements.tbody, element, { childrenOnly: true });
```

### Option 3: uhtml (Ultra-lightweight)

**Pros**: Extremely small (~3KB), fast, modern

**Install**: `npm install uhtml`

**Usage**:

```javascript
import { html, render } from 'uhtml';

const bookmarkTemplate = (bookmark) => html`
  <tr class="bookmark" data-name="${bookmark.name}">
    <td>${bookmark.title}</td>
    <td>${bookmark.url}</td>
  </tr>
`;

// Direct rendering (no morphdom needed)
render(this.elements.tbody, html`
  ${state.bookmarks.map(bookmark => bookmarkTemplate(bookmark))}
`);
```

### Option 4: Template Element (Native)

**Pros**: No dependencies, native browser API

**Usage**:

**HTML Template** (`partials/bookmark.html`):
```html
<template id="bookmark-template">
  <tr class="bookmark" data-name="">
    <td class="title"></td>
    <td class="url"></td>
  </tr>
</template>
```

**JavaScript**:
```javascript
const bookmarkTemplate = document.querySelector('#bookmark-template');

function renderBookmark(bookmark) {
  const clone = bookmarkTemplate.content.cloneNode(true);
  const row = clone.querySelector('tr');
  row.dataset.name = bookmark.name;
  row.querySelector('.title').textContent = bookmark.title;
  row.querySelector('.url').textContent = bookmark.url;
  return row;
}

// Usage
const fragment = document.createDocumentFragment();
state.bookmarks.forEach(bookmark => {
  fragment.appendChild(renderBookmark(bookmark));
});
this.elements.tbody.innerHTML = '';
this.elements.tbody.appendChild(fragment);
```

### Recommendation

**Use Tagged Template Literals (Option 1)** because:
- ✅ No dependencies
- ✅ Native JavaScript
- ✅ Works with TypeScript
- ✅ Good performance
- ✅ Easy to add helpers
- ✅ Familiar syntax
- ✅ Can be enhanced with compile-time tools later

### Migration Example

**Before (Lodash)**:
```javascript
const bookmarkTemplate = _.template(bookmarkPartial);
template.innerHTML += bookmarkTemplate({ bookmark, jobs, prettyBytes });
```

**After (Tagged Template Literals)**:
```javascript
import { html, map } from 'libs/template';

const bookmarkTemplate = (bookmark, jobs, prettyBytes) => html`
  <tr class="bookmark" data-name="${bookmark.name}">
    <td>${bookmark.title}</td>
    <td>${bookmark.url}</td>
    <td>${prettyBytes(bookmark.size)}</td>
  </tr>
`;

// In render method
const html = map(state.bookmarks, bookmark => 
  bookmarkTemplate(bookmark, state.jobs, prettyBytes)
);
morphdom(this.elements.tbody, `<tbody>${html}</tbody>`, { childrenOnly: true });
```

---

## Summary

### Benefits of These Improvements

1. **Standardized Module Pattern**:
   - Consistent code structure
   - Automatic cleanup
   - Easier to maintain
   - Better testability

2. **Removed Global State**:
   - Single source of truth
   - Easier testing
   - Better debugging
   - Type-safe with TypeScript

3. **Lifecycle Management**:
   - No memory leaks
   - Predictable behavior
   - Easy resource management

4. **Better Templating**:
   - Type-safe templates
   - Better IDE support
   - Easier debugging
   - No runtime template errors

### Migration Strategy

1. **Phase 1**: Create base `Module` class and `AuthStore`
2. **Phase 2**: Migrate one module at a time to new pattern
3. **Phase 3**: Replace lodash templates with tagged template literals
4. **Phase 4**: Add TypeScript (optional but recommended)

### Next Steps

Would you like me to:
1. Implement the `Module` base class?
2. Create the `AuthStore`?
3. Refactor a specific module as an example?
4. Set up the templating system?
