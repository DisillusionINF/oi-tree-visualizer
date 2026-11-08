// ==UserScript==
// @name         OI Tree Visualizer @ Luogu
// @namespace    https://github.com/DisillusionINF/oi-tree-visualizer
// @version      2.0.1
// @description  在洛谷页面右侧嵌入树形结构可视化工具，支持 DFS/BFS/LCA/直径/重心/重链剖分 动画演示
// @author       you
// @match        https://www.luogu.com.cn/*
// @match        https://www.luogu.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/DisillusionINF/oi-tree-visualizer/main/oi-tree-visualizer.user.js
// @downloadURL  https://raw.githubusercontent.com/DisillusionINF/oi-tree-visualizer/main/oi-tree-visualizer.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('oi-tree-visualizer-launcher')) return;

    const STYLE = `
        * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; outline: none; }
        .app-root { height: 100%; display: flex; flex-direction: column; background: #0d1117; color: #c9d1d9; font-family: sans-serif; overflow: hidden; position: relative; }
        .resizer { position: absolute; left: -4px; top: 0; bottom: 0; width: 8px; cursor: ew-resize; z-index: 2147483647; background: transparent; transition: background 0.2s; }
        .resizer:hover { background: rgba(88, 166, 255, 0.4); }
        header { padding: 8px 16px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        h1 { font-size: 15px; color: #58a6ff; margin-right: 10px; white-space: nowrap; }
        button { padding: 5px 12px; border: 1px solid #30363d; border-radius: 4px; background: #21262d; color: #c9d1d9; cursor: pointer; font-size: 12px; transition: background 0.2s; white-space: nowrap; font-family: inherit; }
        button:hover { background: #30363d; }
        button:disabled { opacity: 0.4; cursor: not-allowed; background: #21262d; }
        .tip { font-size: 12px; color: #8b949e; margin-left: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40vw; }
        .btn-toggle-aside { background: #21262d; border-color: #30363d; padding: 5px 10px; font-size: 14px; }
        .btn-toggle-aside:hover { background: #30363d; }
        .btn-close { margin-left: 4px; background: #da3633; border-color: #f85149; color: white; font-weight: bold; padding: 5px 10px; }
        .btn-close:hover { background: #f85149; }
        .input-group { display: flex; gap: 8px; align-items: stretch; width: 100%; max-width: 600px; }
        textarea { flex: 1; background: #0d1117; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; font-family: monospace; font-size: 12px; padding: 6px; resize: vertical; min-height: 60px; line-height: 1.4; user-select: text; }
        textarea:focus { border-color: #58a6ff; }
        .btn-generate { background: #238636; border-color: #2ea043; color: white; font-weight: bold; }
        .btn-generate:hover { background: #2ea043; }
        main { flex: 1; display: flex; position: relative; overflow: hidden; min-width: 0; }
        #canvas-area { flex: 1; position: relative; cursor: grab; min-width: 0; }
        #canvas-area:active { cursor: grabbing; }
        svg { width: 100%; height: 100%; display: block; }
        aside { width: 320px; min-width: 0; background: #161b22; border-left: 1px solid #30363d; padding: 15px; font-size: 13px; overflow-y: auto; overflow-x: hidden; z-index: 10; display: flex; flex-direction: column; flex-shrink: 0; transition: width 0.3s ease, padding 0.3s ease, opacity 0.3s ease, border-left 0.3s ease; }
        aside.collapsed { width: 0 !important; padding: 15px 0 !important; border-left: 1px solid transparent; opacity: 0; pointer-events: none; }
        .panel-section { margin-bottom: 15px; border-bottom: 1px solid #30363d; padding-bottom: 10px; }
        .panel-section:last-child { border-bottom: none; flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        h3 { font-size: 12px; color: #8b949e; margin-bottom: 8px; text-transform: uppercase; }
        .row { display: flex; justify-content: space-between; line-height: 1.8; }
        .val { color: #58a6ff; font-weight: bold; }
        .code-log-container { display: flex; flex-direction: column; flex: 1; gap: 10px; overflow: hidden; }
        #algo-log { background: #0d1117; border: 1px solid #30363d; border-radius: 4px; padding: 8px; font-family: monospace; font-size: 11px; color: #8b949e; height: 120px; overflow-y: auto; white-space: pre-wrap; flex-shrink: 0; user-select: text; }
        #pseudo-code-box { background: #0d1117; border: 1px solid #30363d; border-radius: 4px; flex: 1; overflow-y: auto; padding: 10px; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.5; color: #c9d1d9; }
        .code-line { display: block; padding: 0 4px; border-radius: 3px; transition: background 0.2s; white-space: pre; }
        .code-line.active { background: rgba(88, 166, 255, 0.2); border-left: 3px solid #58a6ff; color: #fff; }
        .code-comment { color: #8b949e; font-style: italic; }
        .code-keyword { color: #ff7b72; }
        .code-func { color: #d2a8ff; }
        .edge { stroke: #6f7fb5; stroke-width: 1.5; fill: none; transition: stroke 0.2s; pointer-events: none; }
        .edge.highlight { stroke: #f47067; stroke-width: 2.5; }
        .edge.heavy { stroke: #ff7b72; stroke-width: 3.5; }
        .edge-weight { fill: #c9d1d9; font-size: 11px; text-anchor: middle; dominant-baseline: central; pointer-events: none; paint-order: stroke; stroke: #0d1117; stroke-width: 3px; font-family: sans-serif; }
        .node circle { fill: #238636; stroke: #0d1117; stroke-width: 2px; cursor: grab; transition: all 0.1s; }
        .node text { fill: white; text-anchor: middle; dominant-baseline: central; font-weight: bold; pointer-events: none; font-size: 14px; }
        .node.selected circle { stroke: #ffd166; stroke-width: 3px; filter: drop-shadow(0 0 6px rgba(255, 209, 102, 0.6)); }
        .node.dragging circle { cursor: grabbing; stroke: #fff; stroke-width: 3px; }
        .node.visited circle { fill: #a371f7; stroke: #8957e5; }
        .node.target circle { fill: #f47067; stroke: #da3633; }
        .node.lca circle { fill: #79c0ff; stroke: #58a6ff; filter: drop-shadow(0 0 10px rgba(88, 166, 255, 0.8)); }
        .node.diameter circle { fill: #f85149; stroke: #ff7b72; filter: drop-shadow(0 0 8px rgba(248, 81, 73, 0.6)); }
        .node.hld-head circle { fill: #ffd166; stroke: #ffb84d; filter: drop-shadow(0 0 8px rgba(255, 209, 102, 0.7)); }
        .node.hld-heavy circle { fill: #f0883e; stroke: #db6d28; }
        #context-menu { position: absolute; display: none; background: #161b22; border: 1px solid #30363d; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); z-index: 100; min-width: 150px; padding: 4px 0; }
        .menu-item { padding: 8px 16px; font-size: 13px; cursor: pointer; color: #c9d1d9; display: flex; align-items: center; gap: 8px; }
        .menu-item:hover { background: #30363d; color: #fff; }
        .menu-sep { height: 1px; background: #30363d; margin: 4px 0; }
        .menu-item.danger { color: #f85149; }
        .menu-item.danger:hover { background: rgba(248, 81, 73, 0.1); }
        #bottom-tools { position: absolute; bottom: 20px; right: 20px; display: flex; gap: 8px; z-index: 20; align-items: center; flex-wrap: wrap; justify-content: flex-end; max-width: calc(100% - 40px); }
        #bottom-tools button { background: #21262d; border-color: #58a6ff; color: #58a6ff; font-weight: bold; }
        #bottom-tools button:hover:not(:disabled) { background: #58a6ff; color: #0d1117; }
        .interval-group { display: flex; align-items: center; gap: 6px; background: #161b22; border: 1px solid #30363d; border-radius: 4px; padding: 4px 8px; }
        .interval-group label { font-size: 12px; color: #8b949e; white-space: nowrap; }
        .interval-group input { width: 64px; background: #0d1117; border: 1px solid #30363d; border-radius: 3px; color: #c9d1d9; font-family: monospace; font-size: 12px; padding: 3px 6px; text-align: center; user-select: text; }
        .interval-group input:focus { border-color: #58a6ff; }
        .interval-group .unit { font-size: 11px; color: #8b949e; }
        .player-group { display: flex; gap: 4px; background: #161b22; padding: 4px; border-radius: 4px; border: 1px solid #30363d; }
        .player-group button { border: none; background: transparent; padding: 4px 8px; font-size: 14px; }
        .player-group button:hover:not(:disabled) { background: #30363d; color: #fff; }
    `;

    const HTML = `
        <div class="app-root">
            <div class="resizer" id="host-resizer" title="拖动调整宽度"></div>
            <header>
                <h1>OI Tree Visualizer</h1>
                <div class="input-group">
                    <textarea id="tree-input" placeholder="第一行: n (节点数)&#10;后续 n-1 行: u v (表示边)&#10;例如:&#10;5&#10;1 2&#10;1 3&#10;2 4&#10;2 5"></textarea>
                    <button class="btn-generate" data-action="generate">🌳 生成并布局</button>
                </div>
                <div style="display:flex; gap:10px;">
                    <button data-action="undo" id="undo-btn" disabled title="撤销 (Ctrl+Z)">↩️ 撤销</button>
                    <button data-action="redo" id="redo-btn" disabled title="重做 (Ctrl+Y)">↪️ 重做</button>
                    <button data-action="export-png" title="导出当前画面为图片">📷 导出图片</button>
                </div>
                <div style="display:flex; gap:10px;">
                    <button data-action="create-standalone">🌱 凭空建树</button>
                    <button data-action="add-child">➕ 添加子节点</button>
                    <button data-action="delete-selected">🗑️ 删除选中</button>
                    <button data-action="highlight-path" style="color: #d2a8ff; border-color: #d2a8ff;">✨ 路径高亮</button>
                </div>
                <span class="tip">💡 右键改父级/权重 | Ctrl多选 | Alt+L连线</span>
                <button class="btn-toggle-aside" data-action="toggle-aside" title="收起/展开右侧信息">📊</button>
                <button class="btn-close" data-action="close-panel" title="收起面板">✖</button>
            </header>
            <main>
                <div id="canvas-area">
                    <svg id="svg-main"><g id="viewport"></g></svg>
                    <div id="context-menu">
                        <div class="menu-item node-menu" data-action="menu-add-child">➕ 添加子节点</div>
                        <div class="menu-item node-menu" data-action="menu-rename">✏️ 更改编号</div>
                        <div class="menu-item node-menu" data-action="menu-change-parent">🔗 更改父节点</div>
                        <div class="menu-item node-menu" data-action="menu-edit-weight">⚖️ 编辑边权 (与父节点)</div>
                        <div class="menu-sep node-menu"></div>
                        <div class="menu-item danger node-menu" data-action="menu-delete">🗑️ 删除此子树</div>
                        <div class="menu-item blank-menu" data-action="menu-create-standalone">🌱 在此处凭空建树</div>
                    </div>
                    <div id="bottom-tools">
                        <div class="interval-group">
                            <label for="algo-interval">间隔</label>
                            <input type="number" id="algo-interval" value="1600" min="50" max="10000" step="100">
                            <span class="unit">ms</span>
                        </div>
                        <div class="player-group">
                            <button data-action="prev-step" id="btn-prev" disabled title="上一步">⏮️</button>
                            <button data-action="toggle-play" id="btn-play" disabled title="播放/暂停">▶️</button>
                            <button data-action="next-step" id="btn-next" disabled title="下一步">⏭️</button>
                        </div>
                        <button data-action="algo-dfs">DFS 遍历</button>
                        <button data-action="algo-bfs">BFS 遍历</button>
                        <button data-action="algo-lca">LCA 逐步</button>
                        <button data-action="algo-lca-bin">LCA 倍增</button>
                        <button data-action="algo-diameter">树的直径</button>
                        <button data-action="algo-centroid">树的重心</button>
                        <button data-action="algo-hld">重链剖分</button>
                        <button data-action="import-json" title="打开本地 JSON 文件">📂 导入 JSON</button>
                        <input type="file" id="json-file-input" accept=".json,application/json" style="display: none;">
                        <button data-action="export-json">导出 JSON</button>
                    </div>
                </div>
                <aside>
                    <div class="panel-section">
                        <h3>全局统计</h3>
                        <div class="row">总节点数: <span class="val" id="iCount">0</span></div>
                        <div class="row">选中数量: <span class="val" id="iSelCount">0</span></div>
                    </div>
                    <div class="panel-section">
                        <h3>主选中节点信息</h3>
                        <div class="row">ID: <span class="val" id="sId">-</span></div>
                        <div class="row">父节点: <span class="val" id="sParent">-</span></div>
                        <div class="row">深度: <span class="val" id="sDepth">-</span></div>
                        <div class="row">子节点数: <span class="val" id="sChildCount">-</span></div>
                    </div>
                    <div class="panel-section" style="flex:1; display:flex; flex-direction:column;">
                        <h3>执行日志 & 伪代码</h3>
                        <div class="code-log-container">
                            <div id="algo-log">等待执行...</div>
                            <div id="pseudo-code-box">
                                <div style="color:#8b949e; text-align:center; margin-top:20px;">点击算法按钮查看伪代码</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    `;

    const host = document.createElement('div');
    host.id = 'oi-tree-visualizer-host';
    host.style.cssText = ['position: fixed','right: 0','top: 0','height: 100vh','width: min(78vw, 1100px)','z-index: 2147483647','box-shadow: -8px 0 24px rgba(0,0,0,0.6)'].join(';');
    host.style.transition = 'transform .35s cubic-bezier(.4,0,.2,1)';
    host.style.transform = 'translateX(100%)';
    host.style.pointerEvents = 'none';
    host.dataset.open = 'false';
    document.body.appendChild(host);

    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>${HTML}`;

    const launcher = document.createElement('button');
    launcher.id = 'oi-tree-visualizer-launcher';
    launcher.textContent = '🌳';
    launcher.title = '打开 OI Tree Visualizer';
    launcher.style.cssText = ['position: fixed','right: 0','top: 50%','transform: translateY(-50%)','z-index: 2147483646','width: 40px','height: 52px','background: #238636','color: white','border: 1px solid #2ea043','border-right: none','border-radius: 8px 0 0 8px','cursor: pointer','font-size: 22px','display: flex','align-items: center','justify-content: center','box-shadow: -4px 0 12px rgba(0,0,0,0.5)','transition: background 0.2s, width 0.2s','padding: 0','font-family: inherit'].join(';');
    launcher.addEventListener('mouseenter', () => { launcher.style.background = '#2ea043'; launcher.style.width = '46px'; });
    launcher.addEventListener('mouseleave', () => { launcher.style.background = '#238636'; launcher.style.width = '40px'; });
    launcher.style.transition = 'transform .35s cubic-bezier(.4,0,.2,1), opacity .25s, background .2s, width .2s';
    launcher.style.willChange = 'transform, opacity';
    document.body.appendChild(launcher);

    const $ = id => root.getElementById(id);
    const svgEl = $('svg-main'); const vp = $('viewport'); const ctxMenu = $('context-menu'); const inputEl = $('tree-input');
    const algoLogEl = $('algo-log'); const intervalEl = $('algo-interval'); const pseudoBox = $('pseudo-code-box');
    const btnPrev = $('btn-prev'); const btnPlay = $('btn-play'); const btnNext = $('btn-next');
    const btnUndo = $('undo-btn'); const btnRedo = $('redo-btn'); const jsonInput = $('json-file-input');

    const resizerEl = $('host-resizer');
    let isResizingHost = false, startResizeX = 0, startResizeWidth = 0;
    resizerEl.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        isResizingHost = true; startResizeX = e.clientX; startResizeWidth = host.getBoundingClientRect().width;
        document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none';
        host.style.transition = 'none';
    });
    window.addEventListener('mousemove', e => {
        if (!isResizingHost) return;
        const dx = e.clientX - startResizeX;
        let newWidth = startResizeWidth - dx;
        newWidth = Math.max(400, Math.min(window.innerWidth - 10, newWidth));
        host.style.width = newWidth + 'px';
    });
    window.addEventListener('mouseup', () => {
        if (isResizingHost) {
            isResizingHost = false; document.body.style.cursor = ''; document.body.style.userSelect = '';
            host.style.transition = 'transform .35s cubic-bezier(.4,0,.2,1)';
            setTimeout(() => fitToScreen(), 50); 
        }
    });

    const CONFIG = { NODE_RADIUS: 22, LEVEL_HEIGHT: 100, SIBLING_SPACING: 100, ROOT_MARGIN_X: 60, ROOT_MARGIN_Y: 80, FIT_PADDING: 100, FIT_MARGIN: 0.8, MAX_HISTORY: 50, LCA_LOG: 20, DEFAULT_INTERVAL: 1600, MIN_INTERVAL: 50, MAX_INTERVAL: 10000, ZOOM_MIN: 0.2, ZOOM_MAX: 3, DRAG_THRESHOLD_SQ: 9 };
    let nodes = new Map(), nextId = 1, selectedIds = new Set(), primarySelectedId = null, k = 1, tx = 0, ty = 0;
    let undoStack = [], redoStack = [], frames = [], currentFrameIdx = -1, isPlaying = false, playTimer = null;
    let lastRightClickPos = null, highlightedEdges = new Set(), highlightedNodes = new Map(), highlightedHeavyEdges = new Set();
    let draggingTargetId = null, dragOffset = { x: 0, y: 0 }, dragPendingStart = null, isPanningCanvas = false, panStart = { x: 0, y: 0 };
    let renderScheduled = false, panelInitialized = false, asideCollapsed = false;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function getInterval() { let v = parseInt(intervalEl.value, 10); return isNaN(v) ? CONFIG.DEFAULT_INTERVAL : clamp(v, CONFIG.MIN_INTERVAL, CONFIG.MAX_INTERVAL); }
    function getRoots() { return [...nodes.values()].filter(n => n.parent === null || !nodes.has(n.parent)).map(n => n.id); }
    function getDepth(id) { let d = 0, curr = id, guard = 0; while (curr != null && nodes.has(curr) && guard++ < nodes.size + 1) { const p = nodes.get(curr).parent; if (p == null || !nodes.has(p)) break; curr = p; d++; } return d; }
    function findRoot(id) { let curr = id, guard = 0; while (curr != null && nodes.has(curr) && guard++ < nodes.size + 1) { const p = nodes.get(curr).parent; if (p == null || !nodes.has(p)) return curr; curr = p; } return curr; }
    function isDescendant(targetId, sourceId) { let curr = targetId, guard = 0; while (curr != null && guard++ < nodes.size + 1) { if (curr === sourceId) return true; if (!nodes.has(curr)) return false; curr = nodes.get(curr).parent; } return false; }
    function getPathBetween(fromId, toId) { if (fromId === toId) return [fromId]; const parentMap = new Map(), visited = new Set([fromId]), queue = [fromId]; while (queue.length) { const u = queue.shift(), n = nodes.get(u); if (!n) continue; const neighbors = [...n.children]; if (n.parent != null && nodes.has(n.parent)) neighbors.push(n.parent); for (const v of neighbors) { if (!visited.has(v) && nodes.has(v)) { visited.add(v); parentMap.set(v, u); queue.push(v); if (v === toId) { const path = []; let curr = toId; while (curr !== fromId) { path.push(curr); curr = parentMap.get(curr); if (curr == null) return null; } path.push(fromId); return path.reverse(); } } } } return null; }

    function snapshot() { return { nodes: [...nodes.entries()].map(([id, n]) => [id, { ...n, children: [...n.children] }]), nextId, selectedIds: [...selectedIds], primarySelectedId }; }
    function saveHistory() { undoStack.push(JSON.stringify(snapshot())); if (undoStack.length > CONFIG.MAX_HISTORY) undoStack.shift(); redoStack = []; updateHistoryButtons(); }
    function restoreState(state) { stopAnimation(); nodes.clear(); for (const [id, n] of state.nodes) nodes.set(id, n); nextId = state.nextId; selectedIds = new Set(state.selectedIds); primarySelectedId = state.primarySelectedId; render(); }
    function doUndo() { if (undoStack.length === 0) return; redoStack.push(JSON.stringify(snapshot())); restoreState(JSON.parse(undoStack.pop())); updateHistoryButtons(); }
    function doRedo() { if (redoStack.length === 0) return; undoStack.push(JSON.stringify(snapshot())); restoreState(JSON.parse(redoStack.pop())); updateHistoryButtons(); }
    function updateHistoryButtons() { btnUndo.disabled = undoStack.length === 0; btnRedo.disabled = redoStack.length === 0; }

    function allocId() { while (nodes.has(nextId)) nextId++; return nextId++; }
    function createNode(parentId) { const id = allocId(); nodes.set(id, { id, parent: parentId, children: [], x: 0, y: 0, weight: null }); if (parentId !== null && nodes.has(parentId)) nodes.get(parentId).children.push(id); return id; }
    function createStandaloneNode(clientX, clientY) { saveHistory(); const id = allocId(); const rect = svgEl.getBoundingClientRect(); let cx, cy; if (clientX === undefined) { cx = (rect.width / 2 - tx) / k; cy = (rect.height / 2 - ty) / k; } else { cx = (clientX - rect.left - tx) / k; cy = (clientY - rect.top - ty) / k; } nodes.set(id, { id, parent: null, children: [], x: cx, y: cy, weight: null }); selectedIds.clear(); selectedIds.add(id); primarySelectedId = id; render(); hideContextMenu(); }
    function changeParentByInput(childId, newParentId) { const child = nodes.get(childId); if (!child) return; if (isNaN(newParentId)) return alert("请输入有效数字"); if (newParentId === 0) { if (child.parent === null) return; saveHistory(); const oldParent = nodes.get(child.parent); if (oldParent) oldParent.children = oldParent.children.filter(id => id !== childId); child.parent = null; layoutTree(); render(); return; } if (childId === newParentId) return alert("不能将节点设为自己的父节点！"); if (!nodes.has(newParentId)) return alert(`编号为 ${newParentId} 的节点不存在！`); if (isDescendant(newParentId, childId)) return alert("不能将节点移动到它的子孙节点上（会导致死循环）！"); if (child.parent === newParentId) return alert("已经是该节点的子节点了。"); saveHistory(); if (child.parent !== null && nodes.has(child.parent)) { const oldParent = nodes.get(child.parent); oldParent.children = oldParent.children.filter(id => id !== childId); } const newParent = nodes.get(newParentId); if (!newParent.children.includes(childId)) newParent.children.push(childId); child.parent = newParentId; layoutTree(); render(); }
    function deleteSubtree(id, skipHistory = false) { if (!nodes.has(id)) return; if (!skipHistory) saveHistory(); const toDelete = new Set(), stack = [id]; while (stack.length) { const cur = stack.pop(); if (toDelete.has(cur)) continue; toDelete.add(cur); const n = nodes.get(cur); if (n) n.children.forEach(c => stack.push(c)); } toDelete.forEach(delId => { nodes.delete(delId); selectedIds.delete(delId); }); nodes.forEach(n => { n.children = n.children.filter(c => !toDelete.has(c)); }); if (primarySelectedId && toDelete.has(primarySelectedId)) primarySelectedId = null; render(); }
    function deleteSelectedNodes() { if (selectedIds.size === 0) return; const rootsToDelete = [...selectedIds].filter(id => { let curr = nodes.get(id)?.parent, guard = 0; while (curr != null && guard++ < nodes.size + 1) { if (selectedIds.has(curr)) return false; curr = nodes.get(curr)?.parent; } return true; }); if (rootsToDelete.length === 0) return; saveHistory(); rootsToDelete.forEach(id => deleteSubtree(id, true)); }
    function renameNode(oldId, newIdStr) { const newId = parseInt(newIdStr, 10); if (isNaN(newId)) return alert("请输入有效的数字编号"); if (newId <= 0) return alert("编号必须为正整数"); if (newId === oldId) return; if (nodes.has(newId)) return alert(`编号 ${newId} 已存在！`); saveHistory(); const node = nodes.get(oldId); nodes.delete(oldId); node.id = newId; nodes.set(newId, node); if (newId >= nextId) nextId = newId + 1; if (node.parent !== null && nodes.has(node.parent)) { const parent = nodes.get(node.parent); const idx = parent.children.indexOf(oldId); if (idx !== -1) parent.children[idx] = newId; } node.children.forEach(childId => { const child = nodes.get(childId); if (child) child.parent = newId; }); if (selectedIds.has(oldId)) { selectedIds.delete(oldId); selectedIds.add(newId); } if (primarySelectedId === oldId) primarySelectedId = newId; render(); }

    function layoutTree() { if (nodes.size === 0) return; let leafIndex = 0; function assignPos(id, depth) { const n = nodes.get(id); if (!n) return; n.y = depth * CONFIG.LEVEL_HEIGHT + CONFIG.ROOT_MARGIN_Y; if (n.children.length === 0) { n.x = leafIndex * CONFIG.SIBLING_SPACING + CONFIG.ROOT_MARGIN_X; leafIndex++; } else { n.children.forEach(cid => assignPos(cid, depth + 1)); const first = nodes.get(n.children[0]), last = nodes.get(n.children[n.children.length - 1]); if (first && last) n.x = (first.x + last.x) / 2; } } getRoots().forEach(root => assignPos(root, 0)); }

    function el(tag, attrs = {}) { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, v] of Object.entries(attrs)) e.setAttribute(key, v); return e; }
    function render() { renderScheduled = false; while (vp.firstChild) vp.removeChild(vp.firstChild); const gEdges = el('g'), gNodes = el('g'); vp.append(gEdges, gNodes); nodes.forEach(n => { if (n.parent !== null && nodes.has(n.parent)) { const p = nodes.get(n.parent), edgeKey = `${n.parent}-${n.id}`, isHighlight = highlightedEdges.has(edgeKey), isHeavy = highlightedHeavyEdges.has(edgeKey); let edgeCls = 'edge'; if (isHighlight) edgeCls += ' highlight'; if (isHeavy) edgeCls += ' heavy'; gEdges.append(el('line', { class: edgeCls, x1: p.x, y1: p.y, x2: n.x, y2: n.y })); if (n.weight !== null && n.weight !== undefined) { const wText = el('text', { class: 'edge-weight', x: (p.x + n.x) / 2, y: (p.y + n.y) / 2 }); wText.textContent = n.weight; gEdges.append(wText); } } }); nodes.forEach(n => { const isSelected = selectedIds.has(n.id), isDragging = draggingTargetId === n.id, algoStatus = highlightedNodes.get(n.id); let classes = 'node'; if (isDragging) classes += ' dragging'; if (algoStatus) classes += ' ' + algoStatus; if (isSelected) classes += ' selected'; const g = el('g', { class: classes, transform: `translate(${n.x},${n.y})`, 'data-id': n.id }); g.append(el('circle', { r: CONFIG.NODE_RADIUS })); const text = el('text'); text.textContent = n.id; g.append(text); gNodes.append(g); }); applyTransform(); updatePanel(); }
    function scheduleRender() { if (renderScheduled) return; renderScheduled = true; requestAnimationFrame(() => { if (renderScheduled) render(); }); }
    function applyTransform() { vp.setAttribute('transform', `translate(${tx},${ty}) scale(${k})`); }
    function fitToScreen() { if (nodes.size === 0) return; let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity; nodes.forEach(n => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); }); const w = maxX - minX + CONFIG.FIT_PADDING, h = maxY - minY + CONFIG.FIT_PADDING, rect = svgEl.getBoundingClientRect(); if (rect.width === 0 || rect.height === 0) return; k = Math.min(rect.width / w, rect.height / h, 1.5) * CONFIG.FIT_MARGIN; tx = (rect.width / 2) - ((minX + maxX) / 2) * k; ty = (rect.height / 2) - ((minY + maxY) / 2) * k; applyTransform(); }
    function updatePanel() { $('iCount').textContent = nodes.size; $('iSelCount').textContent = selectedIds.size; if (primarySelectedId && nodes.has(primarySelectedId)) { const n = nodes.get(primarySelectedId); $('sId').textContent = n.id; $('sParent').textContent = n.parent ?? "无 (根)"; $('sDepth').textContent = getDepth(n.id); $('sChildCount').textContent = n.children.length; } else { $('sId').textContent = "-"; $('sParent').textContent = "-"; $('sDepth').textContent = "-"; $('sChildCount').textContent = "-"; } }

    function highlightPath() { stopAnimation(); if (selectedIds.size !== 2) return alert("请先在画布上按住 Ctrl 选择两个节点，再点击此按钮。"); const [idA, idB] = [...selectedIds], path = getPathBetween(idA, idB); if (!path) { algoLogEl.textContent = `节点 ${idA} 和 ${idB} 不连通，无法连线。`; return; } highlightedNodes.clear(); highlightedEdges.clear(); highlightedHeavyEdges.clear(); let lca = path[0], minDepth = Infinity; path.forEach(id => { const d = getDepth(id); if (d < minDepth) { minDepth = d; lca = id; } }); path.forEach(id => highlightedNodes.set(id, id === lca ? 'lca' : 'visited')); for (let i = 0; i < path.length - 1; i++) { const u = path[i], v = path[i + 1], p = nodes.get(u).parent === v ? v : u, c = p === u ? v : u; highlightedEdges.add(`${p}-${c}`); } algoLogEl.textContent = `已高亮 ${idA} → ${idB} 的路径，LCA = ${lca}，长度 = ${path.length - 1} 条边。`; render(); }

    svgEl.addEventListener('mousedown', e => { hideContextMenu(); const target = e.target.closest('.node'); if (target) { e.stopPropagation(); e.preventDefault(); const id = parseInt(target.getAttribute('data-id'), 10); if (e.ctrlKey || e.metaKey) { if (selectedIds.has(id)) { selectedIds.delete(id); if (primarySelectedId === id) primarySelectedId = null; } else { selectedIds.add(id); primarySelectedId = id; } } else if (!selectedIds.has(id)) { selectedIds.clear(); selectedIds.add(id); primarySelectedId = id; } render(); draggingTargetId = id; const n = nodes.get(id); dragOffset.x = e.clientX - (n.x * k + tx); dragOffset.y = e.clientY - (n.y * k + ty); dragPendingStart = { x: e.clientX, y: e.clientY, saved: false }; } else { stopAnimation(); if (selectedIds.size > 0 || highlightedNodes.size > 0 || highlightedEdges.size > 0 || highlightedHeavyEdges.size > 0) { selectedIds.clear(); primarySelectedId = null; highlightedNodes.clear(); highlightedEdges.clear(); highlightedHeavyEdges.clear(); render(); } isPanningCanvas = true; panStart = { x: e.clientX - tx, y: e.clientY - ty }; svgEl.style.cursor = 'grabbing'; } });

    window.addEventListener('mousemove', e => { if (draggingTargetId !== null) { const n = nodes.get(draggingTargetId); if (!n) return; if (dragPendingStart && !dragPendingStart.saved) { const dx = e.clientX - dragPendingStart.x, dy = e.clientY - dragPendingStart.y; if (dx * dx + dy * dy < CONFIG.DRAG_THRESHOLD_SQ) return; saveHistory(); dragPendingStart.saved = true; } n.x = (e.clientX - tx - dragOffset.x) / k; n.y = (e.clientY - ty - dragOffset.y) / k; scheduleRender(); } else if (isPanningCanvas) { tx = e.clientX - panStart.x; ty = e.clientY - panStart.y; applyTransform(); } });
    window.addEventListener('mouseup', () => { if (draggingTargetId !== null) dragPendingStart = null; draggingTargetId = null; isPanningCanvas = false; svgEl.style.cursor = 'grab'; });

    window.addEventListener('keydown', e => { if (!e.composedPath().includes(host)) return; const realTarget = e.composedPath()[0]; if (realTarget && (realTarget.tagName === 'INPUT' || realTarget.tagName === 'TEXTAREA')) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); if (nodes.size === 0) return; selectedIds.clear(); nodes.forEach(n => selectedIds.add(n.id)); if (!primarySelectedId || !nodes.has(primarySelectedId)) { const roots = getRoots(); primarySelectedId = roots.length > 0 ? roots[0] : nodes.keys().next().value; } render(); return; } if (e.altKey && e.key.toLowerCase() === 'l') { e.preventDefault(); tryLinkSelected(); } });

    function tryLinkSelected() { if (selectedIds.size !== 2) { algoLogEl.textContent = "Alt+L 连线：请先 Ctrl 选中两个节点。"; return; } const ids = [...selectedIds], n1 = nodes.get(ids[0]), n2 = nodes.get(ids[1]); let parentId, childId; if (n1.y < n2.y - 10) { parentId = n1.id; childId = n2.id; } else if (n2.y < n1.y - 10) { parentId = n2.id; childId = n1.id; } else { algoLogEl.textContent = "Alt+L 连线失败：两节点垂直位置太接近。"; return; } if (isDescendant(parentId, childId)) { algoLogEl.textContent = "Alt+L 连线失败：会形成环。"; return; } if (nodes.get(childId).parent === parentId) { algoLogEl.textContent = "Alt+L 连线失败：已经是子节点。"; return; } saveHistory(); const childNode = nodes.get(childId); if (childNode.parent !== null && nodes.has(childNode.parent)) { const oldParent = nodes.get(childNode.parent); oldParent.children = oldParent.children.filter(id => id !== childId); } childNode.parent = parentId; nodes.get(parentId).children.push(childId); layoutTree(); render(); algoLogEl.textContent = `Alt+L 连线成功：${childId} → ${parentId}`; }

    window.addEventListener('click', e => { const path = e.composedPath(); const inMenu = path.some(el => el && el.id === 'context-menu'); if (!inMenu) hideContextMenu(); });

    svgEl.addEventListener('contextmenu', e => { e.preventDefault(); const target = e.target.closest('.node'); lastRightClickPos = { x: e.clientX, y: e.clientY }; const nodeMenus = root.querySelectorAll('.node-menu'), blankMenus = root.querySelectorAll('.blank-menu'); if (target) { const id = parseInt(target.getAttribute('data-id'), 10); if (!selectedIds.has(id)) { selectedIds.clear(); selectedIds.add(id); } primarySelectedId = id; render(); nodeMenus.forEach(el => el.style.display = 'flex'); blankMenus.forEach(el => el.style.display = 'none'); } else { nodeMenus.forEach(el => el.style.display = 'none'); blankMenus.forEach(el => el.style.display = 'flex'); } const canvasRect = $('canvas-area').getBoundingClientRect(); ctxMenu.style.display = 'block'; ctxMenu.style.left = '0px'; ctxMenu.style.top = '0px'; const menuRect = ctxMenu.getBoundingClientRect(); let left = e.clientX - canvasRect.left, top = e.clientY - canvasRect.top; if (left + menuRect.width > canvasRect.width) left -= menuRect.width; if (top + menuRect.height > canvasRect.height) top -= menuRect.height; ctxMenu.style.left = `${Math.max(0, left)}px`; ctxMenu.style.top = `${Math.max(0, top)}px`; });

    function hideContextMenu() { ctxMenu.style.display = 'none'; }
    function handleMenuClick(action) { if (action === 'createStandalone') { if (lastRightClickPos) createStandaloneNode(lastRightClickPos.x, lastRightClickPos.y); else createStandaloneNode(); return; } if (!primarySelectedId) return; if (action === 'addChild') addNodeToSelected(); else if (action === 'rename') { const nid = prompt(`请输入新的编号 (当前: ${primarySelectedId}):`, ""); if (nid !== null) renameNode(primarySelectedId, nid); } else if (action === 'changeParent') { const tid = prompt(`请输入新的父节点编号 (输入 0 或留空变为根):`, ""); if (tid !== null) changeParentByInput(primarySelectedId, tid.trim() === "" ? 0 : parseInt(tid, 10)); } else if (action === 'editWeight') { const n = nodes.get(primarySelectedId); if (n.parent === null) return alert("根节点没有与父节点的连线。"); const w = prompt(`设置该节点与父节点(${n.parent})之间的边权：`, n.weight || ""); if (w !== null) { const parsed = w.trim() === "" ? null : parseInt(w, 10); if (parsed !== null && isNaN(parsed)) return alert("请输入有效数字"); saveHistory(); n.weight = parsed; render(); } } else if (action === 'delete') deleteSubtree(primarySelectedId); hideContextMenu(); }
    function addNodeToSelected() { if (primarySelectedId && nodes.has(primarySelectedId)) { saveHistory(); const id = createNode(primarySelectedId), parent = nodes.get(primarySelectedId), newNode = nodes.get(id); newNode.y = parent.y + CONFIG.LEVEL_HEIGHT; newNode.x = parent.children.length === 1 ? parent.x : parent.x - ((parent.children.length - 1) * CONFIG.SIBLING_SPACING) / 2; render(); } else alert("请先选中一个父节点"); }

    const pseudoCodes = { dfs: ["void dfs(int u, int depth) {","    visited[u] = true;","    for (int v : children[u]) {","        dfs(v, depth + 1);","    }","}"], bfs: ["void bfs(int start) {","    queue<int> q;","    q.push(start);","    while (!q.empty()) {","        int u = q.front(); q.pop();","        visited[u] = true;","        for (int v : children[u]) {","            q.push(v);","        }","    }","}"], lca: ["// 逐步法求 LCA","int get_depth(int u) { ... }","while (depth[u] > depth[v]) u = parent[u];","while (depth[v] > depth[u]) v = parent[v];","while (u != v) {","    u = parent[u];","    v = parent[v];","}","return u;"], 'lca-bin': ["// 倍增法求 LCA","void build() { /* 预处理 up[u][j] */ }","if (depth[u] < depth[v]) swap(u, v);","int diff = depth[u] - depth[v];","for (int j = LOG - 1; j >= 0; j--)","    if ((diff >> j) & 1) u = up[u][j];","if (u == v) return u;","for (int j = LOG - 1; j >= 0; j--) {","    if (up[u][j] != up[v][j]) {","        u = up[u][j]; v = up[v][j];","    }","}","return up[u][0];"], diameter: ["// 两次 BFS 求树的直径","int A = bfs_farthest(1);","int B = bfs_farthest(A);","// 路径 A -> B 即为直径","return dist(A, B);"], centroid: ["// 树的重心（支持森林）","void dfs_size(int u) {","    sz[u] = 1;","    for (int v : children[u]) {","        dfs_size(v);","        sz[u] += sz[v];","    }","}","for (int r : roots) dfs_size(r);","for (int u : all_nodes) {","    int max_part = n - sz[u];","    for (int v : children[u])","        max_part = max(max_part, sz[v]);","    // 用 max_part 更新最小值和重心集合","}"], hld: ["// 重链剖分 (Heavy-Light Decomposition)","int sz[N], heavy[N], dep[N], top[N], dfn[N];","void dfs1(int u, int p, int d) {","    dep[u] = d; sz[u] = 1; int mx = 0;","    for (int v : children[u]) {","        dfs1(v, u, d + 1);","        sz[u] += sz[v];","        if (sz[v] > mx) { mx = sz[v]; heavy[u] = v; }","    }","}","void dfs2(int u, int t) {","    top[u] = t; dfn[u] = ++timer;","    if (heavy[u]) dfs2(heavy[u], t);","    for (int v : children[u])","        if (v != heavy[u]) dfs2(v, v);","}","int lca(int u, int v) {","    while (top[u] != top[v]) {","        if (dep[top[u]] < dep[top[v]]) swap(u, v);","        u = parent[top[u]];","    }","    return dep[u] < dep[v] ? u : v;","}"] };

    function stopAnimation() { if (isPlaying) { isPlaying = false; clearTimeout(playTimer); } frames = []; currentFrameIdx = -1; updatePlayerButtons(); }
    function updatePlayerButtons() { btnPrev.disabled = currentFrameIdx <= 0; btnNext.disabled = currentFrameIdx >= frames.length - 1; btnPlay.disabled = frames.length === 0; btnPlay.textContent = isPlaying ? '⏸️' : '▶️'; }
    function renderPseudoCode(codeLines, activeLine) { pseudoBox.innerHTML = ''; codeLines.forEach((line, idx) => { const div = document.createElement('div'); div.className = 'code-line' + (idx === activeLine ? ' active' : ''); let html = line.replace(/\b(void|int|return|for|while|if|else|continue|swap|max|min)\b/g, '<span class="code-keyword">$1</span>').replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>'); div.innerHTML = html; pseudoBox.appendChild(div); if (idx === activeLine) { setTimeout(() => div.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50); } }); }
    function setFrame(idx) { if (idx < 0 || idx >= frames.length) return; currentFrameIdx = idx; const frame = frames[idx]; highlightedNodes.clear(); highlightedEdges.clear(); highlightedHeavyEdges.clear(); for (const [id, status] of frame.nodes) highlightedNodes.set(id, status); for (const edge of frame.edges) highlightedEdges.add(edge); for (const edge of (frame.heavyEdges || [])) highlightedHeavyEdges.add(edge); if (frame.log) algoLogEl.textContent = frame.log; if (frame.codeName && pseudoCodes[frame.codeName]) { renderPseudoCode(pseudoCodes[frame.codeName], frame.line); } render(); updatePlayerButtons(); }
    function prevStep() { if (isPlaying) togglePlay(); if (currentFrameIdx > 0) setFrame(currentFrameIdx - 1); }
    function nextStep() { if (isPlaying) togglePlay(); if (currentFrameIdx < frames.length - 1) setFrame(currentFrameIdx + 1); }
    function togglePlay() { if (frames.length === 0) return; if (isPlaying) { isPlaying = false; clearTimeout(playTimer); updatePlayerButtons(); } else { isPlaying = true; updatePlayerButtons(); if (currentFrameIdx === frames.length - 1) setFrame(0); function playLoop() { if (!isPlaying) return; if (currentFrameIdx < frames.length - 1) { setFrame(currentFrameIdx + 1); playTimer = setTimeout(playLoop, getInterval()); } else { isPlaying = false; updatePlayerButtons(); } } playTimer = setTimeout(playLoop, getInterval()); } }

    function buildFrames(type, startId, ids) {
        frames = [];
        function addFrame(logText, codeName, line) { frames.push({ nodes: new Map(highlightedNodes), edges: new Set(highlightedEdges), heavyEdges: new Set(highlightedHeavyEdges), log: logText, codeName, line }); }
        if (type === 'dfs') { const rootId = findRoot(startId), order = []; addFrame(`从根 ${rootId} 开始 DFS`, 'dfs', 0); (function dfs(id) { highlightedNodes.set(id, 'visited'); order.push(id); addFrame(`访问节点 ${id}\n顺序: ${order.join(' -> ')}`, 'dfs', 1); const n = nodes.get(id); for (const cid of n.children) { if (!nodes.has(cid)) continue; highlightedEdges.add(`${id}-${cid}`); dfs(cid); } })(rootId); addFrame(`DFS 完成，共访问 ${order.length} 个节点。`, 'dfs', -1); }
        else if (type === 'bfs') { const rootId = findRoot(startId), queue = [rootId], order = []; addFrame(`从根 ${rootId} 开始 BFS，初始队列: [${rootId}]`, 'bfs', 2); while (queue.length > 0) { const curr = queue.shift(); highlightedNodes.set(curr, 'visited'); order.push(curr); addFrame(`节点 ${curr} 出队访问\n队列变为: [${queue.join(', ')}]`, 'bfs', 4); const n = nodes.get(curr), added = []; for (const cid of n.children) { if (!nodes.has(cid)) continue; highlightedEdges.add(`${curr}-${cid}`); queue.push(cid); added.push(cid); } if (added.length > 0) addFrame(`将 [${added.join(', ')}] 入队`, 'bfs', 7); } addFrame(`BFS 完成！`, 'bfs', -1); }
        else if (type === 'diameter') { const roots = getRoots(); if (roots.length === 0) { algoLogEl.textContent = "空树。"; return; } if (roots.length > 1) addFrame(`提示：森林（${roots.length} 个连通块），只对第一个连通块计算。`, 'diameter', -1); const start = roots[0]; addFrame(`从 ${start} 出发寻找最远点 A`, 'diameter', 1); function getFarthest(sId) { let maxDist = -1, farId = sId; const dist = new Map(), queue = [sId]; dist.set(sId, 0); while (queue.length) { const u = queue.shift(), du = dist.get(u); if (du > maxDist) { maxDist = du; farId = u; } const n = nodes.get(u); if (!n) continue; const neighbors = [...n.children]; if (n.parent != null && nodes.has(n.parent)) neighbors.push(n.parent); for (const v of neighbors) { if (!dist.has(v) && nodes.has(v)) { dist.set(v, du + 1); queue.push(v); } } } return { farId, maxDist }; } const r1 = getFarthest(start); addFrame(`找到最远点 A = ${r1.farId}（距离 ${r1.maxDist}）`, 'diameter', 1); highlightedNodes.clear(); highlightedEdges.clear(); highlightedHeavyEdges.clear(); addFrame(`从 A = ${r1.farId} 寻找最远点 B`, 'diameter', 2); const r2 = getFarthest(r1.farId); addFrame(`找到 B = ${r2.farId}（距离 ${r2.maxDist}），AB 即直径`, 'diameter', 3); highlightedNodes.clear(); highlightedEdges.clear(); highlightedHeavyEdges.clear(); const path = getPathBetween(r1.farId, r2.farId); if (path) { path.forEach(id => highlightedNodes.set(id, 'diameter')); for (let i = 0; i < path.length - 1; i++) { const u = path[i], v = path[i + 1], p = nodes.get(u).parent === v ? v : u, c = p === u ? v : u; highlightedEdges.add(`${p}-${c}`); } } addFrame(`直径路径: ${r1.farId} → ${r2.farId}，长度 = ${r2.maxDist} 条边`, 'diameter', 4); }
        else if (type === 'centroid') { const roots = getRoots(); if (roots.length === 0) { algoLogEl.textContent = "空树。"; return; } const nCount = nodes.size, sz = new Map(); addFrame(`共有 ${roots.length} 个根，开始自底向上求各子树大小`, 'centroid', 1); function dfs_size(u) { sz.set(u, 1); const n = nodes.get(u); if (!n) return; for (const v of n.children) { if (!nodes.has(v)) continue; dfs_size(v); sz.set(u, sz.get(u) + sz.get(v)); } } roots.forEach(r => dfs_size(r)); addFrame(`子树大小计算完毕。`, 'centroid', 8); const centroids = []; let minMax = Infinity; nodes.forEach((n, id) => { const mySz = sz.get(id) ?? 1; let maxPart = nCount - mySz; for (const v of n.children) maxPart = Math.max(maxPart, sz.get(v) ?? 0); if (maxPart < minMax) { minMax = maxPart; centroids = [id]; } else if (maxPart === minMax) centroids.push(id); }); addFrame(`枚举完毕，最小最大块 = ${minMax}`, 'centroid', 9); centroids.forEach(c => { highlightedNodes.clear(); highlightedNodes.set(c, 'lca'); addFrame(`节点 ${c} 的最大连通块 = ${minMax}，是重心${centroids.length > 1 ? `（共 ${centroids.length} 个）` : ''}。`, 'centroid', 10); }); }
        else if (type === 'lca') { const [id1, id2] = ids; if (findRoot(id1) !== findRoot(id2)) { algoLogEl.textContent = `节点 ${id1} 和 ${id2} 不连通，无法求 LCA。`; return; } highlightedNodes.set(id1, 'target'); highlightedNodes.set(id2, 'target'); addFrame(`目标: ${id1}, ${id2}`, 'lca', 0); let u = id1, v = id2; while (getDepth(u) > getDepth(v)) { u = nodes.get(u).parent; highlightedNodes.set(u, 'visited'); addFrame(`u 向上爬到 ${u}（对齐深度）`, 'lca', 2); } while (getDepth(v) > getDepth(u)) { v = nodes.get(v).parent; highlightedNodes.set(v, 'visited'); addFrame(`v 向上爬到 ${v}（对齐深度）`, 'lca', 3); } while (u !== v) { u = nodes.get(u).parent; v = nodes.get(v).parent; if (u == null || v == null) { addFrame(`上爬到根仍未相遇。`, 'lca', -1); return; } highlightedNodes.set(u, 'visited'); highlightedNodes.set(v, 'visited'); addFrame(`同时向上爬`, 'lca', 4); } highlightedNodes.set(u, 'lca'); addFrame(`相遇！LCA = ${u}`, 'lca', 8); }
        else if (type === 'lca-bin') { const [id1, id2] = ids; if (findRoot(id1) !== findRoot(id2)) { algoLogEl.textContent = `节点 ${id1} 和 ${id2} 不连通，无法求 LCA。`; return; } highlightedNodes.set(id1, 'target'); highlightedNodes.set(id2, 'target'); addFrame(`倍增法: 目标 ${id1}, ${id2}`, 'lca-bin', 0); const LOG = CONFIG.LCA_LOG, up = new Map(); nodes.forEach((n, id) => { up.set(id, []); up.get(id)[0] = n.parent; }); for (let j = 1; j < LOG; j++) { nodes.forEach((n, id) => { const prev = up.get(id)[j - 1]; up.get(id)[j] = prev != null && up.has(prev) ? up.get(prev)[j - 1] : null; }); } addFrame(`预处理倍增表 up[${nodes.size}][${LOG}] 完成`, 'lca-bin', 1); let u = id1, v = id2; if (getDepth(u) < getDepth(v)) [u, v] = [v, u]; const diff = getDepth(u) - getDepth(v); for (let j = LOG - 1; j >= 0; j--) { if ((diff >> j) & 1) { u = up.get(u)[j]; if (u == null) break; highlightedNodes.set(u, 'visited'); addFrame(`u 跳 2^${j} 步 → ${u}`, 'lca-bin', 5); } } addFrame(`深度对齐：u=${u}, v=${v}`, 'lca-bin', 6); if (u === v) { highlightedNodes.set(u, 'lca'); addFrame(`直接相遇！LCA = ${u}`, 'lca-bin', 6); return; } for (let j = LOG - 1; j >= 0; j--) { const uu = up.get(u)?.[j], vv = up.get(v)?.[j]; if (uu != null && vv != null && uu !== vv) { u = uu; v = vv; highlightedNodes.set(u, 'visited'); highlightedNodes.set(v, 'visited'); addFrame(`u → ${u}, v → ${v}`, 'lca-bin', 9); } } const lca = up.get(u)?.[0]; if (lca != null) highlightedNodes.set(lca, 'lca'); addFrame(`找到 LCA = ${lca}`, 'lca-bin', 12); }
        else if (type === 'hld') { const roots = getRoots(); if (roots.length === 0) { algoLogEl.textContent = "空树。"; return; } const sz = new Map(), heavy = new Map(), dep = new Map(), top = new Map(); addFrame(`阶段 1：dfs1 自底向上计算 sz / heavy / dep`, 'hld', 2); function dfs1(u, d) { dep.set(u, d); sz.set(u, 1); heavy.set(u, null); let mx = 0; const n = nodes.get(u); for (const v of n.children) { if (!nodes.has(v)) continue; dfs1(v, d + 1); sz.set(u, sz.get(u) + sz.get(v)); if (sz.get(v) > mx) { mx = sz.get(v); heavy.set(u, v); } } } roots.forEach(r => dfs1(r, 0)); addFrame(`阶段 1 完成：每个节点都确定了重儿子`, 'hld', 9); addFrame(`阶段 2：dfs2 标链头 + 重边加粗`, 'hld', 10); function dfs2(u, t) { top.set(u, t); highlightedNodes.set(u, u === t ? 'hld-head' : 'hld-heavy'); const n = nodes.get(u), h = heavy.get(u); if (h != null && nodes.has(h)) { highlightedHeavyEdges.add(`${u}-${h}`); addFrame(`节点 ${u} 的重儿子 ${h}，继承链头 ${t}`, 'hld', 12); dfs2(h, t); } for (const v of n.children) { if (!nodes.has(v) || v === h) continue; addFrame(`节点 ${u} 的轻儿子 ${v}，自成新链头`, 'hld', 14); dfs2(v, v); } } roots.forEach(r => dfs2(r, r)); addFrame(`阶段 2 完成：重链剖分结束`, 'hld', 15); const ids2 = [...selectedIds].slice(0, 2); if (ids2.length === 2 && findRoot(ids2[0]) === findRoot(ids2[1])) { let [u, v] = ids2; highlightedNodes.set(u, 'target'); highlightedNodes.set(v, 'target'); addFrame(`LCA 演示：节点 ${u} 和 ${v}`, 'hld', 16); let iter = 0; while (top.get(u) !== top.get(v) && iter++ < nodes.size + 5) { if (dep.get(top.get(u)) < dep.get(top.get(v))) [u, v] = [v, u]; const oldTop = top.get(u); u = nodes.get(oldTop).parent; if (u == null) break; addFrame(`top 不同，${oldTop} 深度更深 → u 跳到 ${u}`, 'hld', 19); highlightedNodes.set(u, 'visited'); } const lcaId = dep.get(u) < dep.get(v) ? u : v; highlightedNodes.set(lcaId, 'lca'); addFrame(`同一链内，LCA = ${lcaId}`, 'hld', 21); } else if (ids2.length === 2) { addFrame(`两节点不连通，跳过 LCA 演示`, 'hld', 21); } else { addFrame(`提示：Ctrl 选中 2 个节点可演示 HLD 求 LCA`, 'hld', 21); } }
    }

    function runAlgo(type) { stopAnimation(); highlightedEdges.clear(); highlightedNodes.clear(); highlightedHeavyEdges.clear(); if (type === 'json') { exportJson(); return; } if (nodes.size === 0) { algoLogEl.textContent = "错误：画布为空。"; return; } if (type !== 'diameter' && type !== 'centroid' && type !== 'hld' && selectedIds.size === 0) { algoLogEl.textContent = "错误：请至少选中一个节点作为操作起点。"; return; } if ((type === 'lca' || type === 'lca-bin') && selectedIds.size < 2) { algoLogEl.textContent = "错误：计算 LCA 需要至少选中 2 个节点。"; return; } const startId = primarySelectedId || [...selectedIds][0] || getRoots()[0], ids = [...selectedIds].slice(0, 2); buildFrames(type, startId, ids); if (frames.length > 0) { setFrame(0); togglePlay(); } }

    function exportJson() { const forestData = []; function collect(id, path) { if (path.has(id)) return null; path.add(id); const n = nodes.get(id); if (!n) return null; const obj = { id: n.id, weight: n.weight, children: [] }; n.children.forEach(cid => { const child = collect(cid, path); if (child) obj.children.push(child); }); return obj; } getRoots().forEach(r => { const obj = collect(r, new Set()); if (obj) forestData.push(obj); }); const jsonStr = JSON.stringify(forestData, null, 2); algoLogEl.textContent = jsonStr; navigator.clipboard.writeText(jsonStr).catch(() => {}); pseudoBox.innerHTML = '<div style="color:#8b949e;text-align:center;">✅ 已复制到剪贴板，并触发下载</div>'; const blob = new Blob([jsonStr], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `tree_data_${Date.now()}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }

    function importJsonFile(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function (ev) { try { const data = JSON.parse(ev.target.result); if (!Array.isArray(data)) throw new Error("根节点必须是数组 []"); const tempNodes = new Map(); let tempNextId = 1; function parseNode(obj, parentId, path) { if (obj == null || typeof obj !== 'object') return; const id = parseInt(obj.id, 10); if (isNaN(id) || id <= 0) throw new Error(`非法节点编号: ${obj.id}`); if (path.has(id)) throw new Error(`检测到环，节点 ${id}`); if (tempNodes.has(id)) throw new Error(`重复节点编号: ${id}`); path.add(id); tempNodes.set(id, { id, parent: parentId, children: [], x: 0, y: 0, weight: obj.weight !== undefined ? obj.weight : null }); if (parentId !== null && tempNodes.has(parentId)) tempNodes.get(parentId).children.push(id); if (id >= tempNextId) tempNextId = id + 1; if (Array.isArray(obj.children)) obj.children.forEach(child => parseNode(child, id, new Set(path))); } data.forEach(rootObj => parseNode(rootObj, null, new Set())); stopAnimation(); saveHistory(); nodes = tempNodes; nextId = tempNextId; selectedIds = new Set(); primarySelectedId = null; layoutTree(); render(); fitToScreen(); algoLogEl.textContent = `JSON 导入成功，共 ${nodes.size} 个节点。`; pseudoBox.innerHTML = '<div style="color:#8b949e;text-align:center;margin-top:20px;">点击算法按钮查看伪代码</div>'; } catch (err) { alert("JSON 导入失败：\n" + err.message); } finally { event.target.value = ''; } }; reader.readAsText(file); }

    function generateTreeFromInput() { const rawText = inputEl.value.trim(); if (!rawText) return; const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0); const n = parseInt(lines[0], 10); if (isNaN(n) || n <= 0) return alert("第一行必须是正整数 n"); if (lines.length < n) { alert(`错误：声明 ${n} 个节点需要 ${n - 1} 行边，实际只有 ${lines.length - 1} 行。`); return; } const edges = []; for (let i = 1; i < n; i++) { const parts = lines[i].split(/\s+/); if (parts.length < 2) return alert(`第 ${i + 1} 行格式错误：需要 "u v"`); const u = parseInt(parts[0], 10), v = parseInt(parts[1], 10); if (isNaN(u) || isNaN(v) || u < 1 || u > n || v < 1 || v > n) return alert(`第 ${i + 1} 行编号越界：${parts[0]} ${parts[1]}（应在 1~${n} 之间）`); edges.push([u, v]); } stopAnimation(); saveHistory(); nodes.clear(); selectedIds.clear(); primarySelectedId = null; nextId = 1; const adjList = new Map(); for (let i = 1; i <= n; i++) adjList.set(i, []); edges.forEach(([u, v]) => { if (!adjList.has(u)) adjList.set(u, []); if (!adjList.has(v)) adjList.set(v, []); adjList.get(u).push(v); adjList.get(v).push(u); }); const visited = new Set(); for (let i = 1; i <= n; i++) { if (visited.has(i)) continue; const rootId = i, queue = [rootId]; visited.add(rootId); nodes.set(rootId, { id: rootId, parent: null, children: [], x: 0, y: 0, weight: null }); if (rootId >= nextId) nextId = rootId + 1; while (queue.length > 0) { const curr = queue.shift(), neighbors = (adjList.get(curr) || []).slice().sort((a, b) => a - b); for (const neighbor of neighbors) { if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); nodes.set(neighbor, { id: neighbor, parent: curr, children: [], x: 0, y: 0, weight: null }); nodes.get(curr).children.push(neighbor); if (neighbor >= nextId) nextId = neighbor + 1; } } } } layoutTree(); render(); fitToScreen(); algoLogEl.textContent = `树生成完毕，共 ${nodes.size} 个节点。`; pseudoBox.innerHTML = '<div style="color:#8b949e;text-align:center;margin-top:20px;">点击算法按钮查看伪代码</div>'; }

    function exportToPng() { if (nodes.size === 0) return alert("画布为空！"); const clone = svgEl.cloneNode(true), bbox = vp.getBBox(), padding = 60, width = bbox.width + padding * 2, height = bbox.height + padding * 2; if (width <= 0 || height <= 0) return alert("画布为空！"); clone.setAttribute('width', width); clone.setAttribute('height', height); clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`); clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); const style = document.createElement('style'); style.textContent = `.edge { stroke: #6f7fb5; stroke-width: 1.5; fill: none; } .edge.highlight { stroke: #f47067; stroke-width: 2.5; } .edge.heavy { stroke: #ff7b72; stroke-width: 3.5; } .edge-weight { fill: #c9d1d9; font-family: sans-serif; font-size: 11px; text-anchor: middle; dominant-baseline: central; paint-order: stroke; stroke: #0d1117; stroke-width: 3px; } .node circle { fill: #238636; stroke: #0d1117; stroke-width: 2px; } .node text { fill: white; text-anchor: middle; dominant-baseline: central; font-weight: bold; font-family: sans-serif; font-size: 14px; } .node.visited circle { fill: #a371f7; stroke: #8957e5; } .node.target circle { fill: #f47067; stroke: #da3633; } .node.lca circle { fill: #79c0ff; stroke: #58a6ff; } .node.diameter circle { fill: #f85149; stroke: #ff7b72; } .node.hld-head circle { fill: #ffd166; stroke: #ffb84d; } .node.hld-heavy circle { fill: #f0883e; stroke: #db6d28; } .node.selected circle { stroke: #ffd166; stroke-width: 3px; }`; clone.insertBefore(style, clone.firstChild); const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); rect.setAttribute('width', '100%'); rect.setAttribute('height', '100%'); rect.setAttribute('fill', '#0d1117'); clone.insertBefore(rect, clone.firstChild); const svgString = new XMLSerializer().serializeToString(clone), blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), url = URL.createObjectURL(blob), img = new Image(); img.onload = function () { const canvas = document.createElement('canvas'), scale = 2; canvas.width = width * scale; canvas.height = height * scale; const ctx = canvas.getContext('2d'); ctx.scale(scale, scale); ctx.drawImage(img, 0, 0); const a = document.createElement('a'); a.download = `tree_export_${Date.now()}.png`; a.href = canvas.toDataURL('image/png'); a.click(); URL.revokeObjectURL(url); }; img.src = url; }

    root.addEventListener('click', e => { const actionEl = e.target.closest('[data-action]'); if (!actionEl) return; const action = actionEl.dataset.action; switch (action) { case 'generate': generateTreeFromInput(); break; case 'undo': doUndo(); break; case 'redo': doRedo(); break; case 'export-png': exportToPng(); break; case 'create-standalone': createStandaloneNode(); break; case 'add-child': addNodeToSelected(); break; case 'delete-selected': deleteSelectedNodes(); break; case 'highlight-path': highlightPath(); break; case 'import-json': jsonInput.click(); break; case 'export-json': runAlgo('json'); break; case 'prev-step': prevStep(); break; case 'next-step': nextStep(); break; case 'toggle-play': togglePlay(); break; case 'menu-add-child': handleMenuClick('addChild'); break; case 'menu-rename': handleMenuClick('rename'); break; case 'menu-change-parent': handleMenuClick('changeParent'); break; case 'menu-edit-weight': handleMenuClick('editWeight'); break; case 'menu-delete': handleMenuClick('delete'); break; case 'menu-create-standalone': handleMenuClick('createStandalone'); break; case 'algo-dfs': runAlgo('dfs'); break; case 'algo-bfs': runAlgo('bfs'); break; case 'algo-lca': runAlgo('lca'); break; case 'algo-lca-bin': runAlgo('lca-bin'); break; case 'algo-diameter': runAlgo('diameter'); break; case 'algo-centroid': runAlgo('centroid'); break; case 'algo-hld': runAlgo('hld'); break; case 'close-panel': togglePanel(false); break; case 'toggle-aside': toggleAside(); break; } });

    svgEl.addEventListener('wheel', e => { e.preventDefault(); const rect = svgEl.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top, zoom = e.deltaY < 0 ? 1.1 : 0.9, oldK = k; k = clamp(k * zoom, CONFIG.ZOOM_MIN, CONFIG.ZOOM_MAX); const ratio = k / oldK; tx = mx - (mx - tx) * ratio; ty = my - (my - ty) * ratio; applyTransform(); }, { passive: false });
    jsonInput.addEventListener('change', importJsonFile);

    function togglePanel(show) { const isOpen = host.dataset.open === 'true'; if (show === undefined) show = !isOpen; host.dataset.open = show ? 'true' : 'false'; host.style.transform = show ? 'translateX(0)' : 'translateX(100%)'; host.style.pointerEvents = show ? 'auto' : 'none'; launcher.style.transform = show ? 'translateY(-50%) translateX(110%)' : 'translateY(-50%) translateX(0)'; launcher.style.opacity = show ? '0' : '1'; launcher.style.pointerEvents = show ? 'none' : 'auto'; if (show) { launcher.style.width = '40px'; launcher.style.background = '#238636'; } if (show) { requestAnimationFrame(() => { if (!panelInitialized) { panelInitialized = true; if (nodes.size === 0) initDemo(); } fitToScreen(); }); } }
    function toggleAside() { const aside = root.querySelector('aside'); if (!aside) return; asideCollapsed = !asideCollapsed; if (asideCollapsed) { aside.classList.add('collapsed'); } else { aside.classList.remove('collapsed'); } setTimeout(() => fitToScreen(), 350); }
    launcher.addEventListener('click', () => togglePanel(true));

    function initDemo() { inputEl.value = "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7"; generateTreeFromInput(); undoStack = []; updateHistoryButtons(); }
    if (nodes.size === 0) initDemo();
    window.__OITV__ = { togglePanel, host, launcher };
})();
