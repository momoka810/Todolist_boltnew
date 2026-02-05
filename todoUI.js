/**
 * TodoUI
 * Todoリストの表示とユーザーインタラクションを管理するモジュール
 *
 * 【JavaScriptの強み】
 * ・DOM操作による即時反映：操作直後に画面が更新される
 * ・イベントリスナーの活用：Enterキー、確認ダイアログなど
 * ・リアルタイムなUXの実現：通知、アニメーションなど
 */

import {
  getSortedTodos,
  addTodo,
  deleteTodo,
  updateTodoStatus,
  getArchivedTodos,
  archiveTodo,
  unarchiveTodo,
  getStatusSummary,
  updateTodoDueDate,
  updateTodoText
} from './todoManager.js';

// ステータスの日本語表示名
const STATUS_LABELS = {
  todo: '未完了',
  doing: '処理中',
  done: '完了'
};

/**
 * 【追加機能4】期日の緊急度を判定
 * @param {string} dueDate - 期日（YYYY-MM-DD形式）
 * @returns {string} 緊急度レベル（'overdue' | 'urgent' | 'normal' | null）
 */
function getDueDateUrgency(dueDate) {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'urgent';
  return 'normal';
}

/**
 * 【追加機能4】期日を読みやすい形式でフォーマット
 * @param {string} dueDate - 期日（YYYY-MM-DD形式）
 * @returns {string} フォーマット済み期日
 */
function formatDueDate(dueDate) {
  if (!dueDate) return '';

  const date = new Date(dueDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${month}/${day}`;
}

/**
 * Todo一覧を描画
 * 【改善】完了Todoを自動的に下に表示
 * 【追加機能1】サマリー表示を更新
 * 【追加機能2】アーカイブセクションも更新
 */
export function renderTodos() {
  const todos = getSortedTodos(); // ソート済みのTodoを取得
  const todoList = document.getElementById('todo-list');

  // 【追加機能1】サマリー表示を更新
  renderStatusSummary();

  // リストをクリア
  todoList.innerHTML = '';

  // Todoが存在しない場合の空状態UI
  if (todos.length === 0) {
    renderEmptyState(todoList);
  } else {
    // 各Todoを描画
    todos.forEach(todo => {
      const todoItem = createTodoElement(todo);
      todoList.appendChild(todoItem);
    });
  }

  // 【追加機能2】アーカイブリストも更新
  renderArchivedTodos();
}

/**
 * 【追加機能1】状態サマリーを描画
 * Todoの件数を直感的に表示
 */
function renderStatusSummary() {
  const summary = getStatusSummary();
  const summaryContainer = document.getElementById('status-summary');

  summaryContainer.innerHTML = `
    <div class="summary-item summary-todo">
      <span class="summary-label">未完了</span>
      <span class="summary-count">${summary.todo}</span>
    </div>
    <div class="summary-item summary-doing">
      <span class="summary-label">処理中</span>
      <span class="summary-count">${summary.doing}</span>
    </div>
    <div class="summary-item summary-done">
      <span class="summary-label">完了</span>
      <span class="summary-count">${summary.done}</span>
    </div>
    <div class="summary-item summary-total">
      <span class="summary-label">合計</span>
      <span class="summary-count">${summary.total}</span>
    </div>
  `;
}

/**
 * 【追加機能2】アーカイブされたTodoを描画
 */
function renderArchivedTodos() {
  const archivedTodos = getArchivedTodos();
  const archiveList = document.getElementById('archive-list');

  archiveList.innerHTML = '';

  if (archivedTodos.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'アーカイブされたTodoはありません';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.padding = '2rem';
    archiveList.appendChild(emptyMessage);
  } else {
    archivedTodos.forEach(todo => {
      const todoItem = createArchivedTodoElement(todo);
      archiveList.appendChild(todoItem);
    });
  }
}

/**
 * 空状態のUIを描画
 * 【改善】視覚的に分かりやすい空状態メッセージ
 * @param {HTMLElement} container - コンテナ要素
 */
function renderEmptyState(container) {
  const emptyContainer = document.createElement('div');
  emptyContainer.className = 'empty-state';

  const emptyIcon = document.createElement('div');
  emptyIcon.className = 'empty-icon';
  emptyIcon.textContent = '📝';

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'empty-message';
  emptyMessage.textContent = 'Todoはまだありません';

  const emptySubtext = document.createElement('p');
  emptySubtext.className = 'empty-subtext';
  emptySubtext.textContent = '上のフォームから新しいTodoを追加してみましょう';

  emptyContainer.appendChild(emptyIcon);
  emptyContainer.appendChild(emptyMessage);
  emptyContainer.appendChild(emptySubtext);

  container.appendChild(emptyContainer);
}

/**
 * Todo要素を作成
 * 【改善】ステータスバッジで視覚的に状態を表示
 * 【追加機能2】アーカイブボタンを追加
 * 【追加機能3】ステータス変更時のアニメーション
 * @param {Object} todo - Todoオブジェクト
 * @returns {HTMLElement} Todo要素
 */
function createTodoElement(todo) {
  const todoItem = document.createElement('div');
  todoItem.className = `todo-item status-${todo.status}`;
  todoItem.dataset.id = todo.id;

  // Todoの内容エリア
  const todoContent = document.createElement('div');
  todoContent.className = 'todo-content';

  // Todoのテキストと編集機能
  const todoTextContainer = document.createElement('div');
  todoTextContainer.className = 'todo-text-container';

  const todoText = document.createElement('span');
  todoText.className = 'todo-text';
  todoText.textContent = todo.text;
  todoText.style.cursor = 'pointer';
  todoText.title = 'クリックして編集';

  // テキスト編集用の入力欄（初期状態は非表示）
  const todoTextInput = document.createElement('input');
  todoTextInput.type = 'text';
  todoTextInput.className = 'todo-text-edit-input';
  todoTextInput.value = todo.text;
  todoTextInput.style.display = 'none';

  // テキストクリックで編集モードに切り替え
  todoText.addEventListener('click', () => {
    todoText.style.display = 'none';
    todoTextInput.style.display = 'inline-block';
    todoTextInput.focus();
    todoTextInput.select();
  });

  // テキスト変更時の処理
  const saveTextEdit = () => {
    const newText = todoTextInput.value.trim();
    if (newText && newText !== todo.text) {
      const result = updateTodoText(todo.id, newText);
      if (result) {
        renderTodos();
        showNotification('Todoを更新しました');
      } else {
        showNotification('Todoの更新に失敗しました');
      }
    } else {
      todoTextInput.style.display = 'none';
      todoText.style.display = 'inline';
    }
  };

  // Enterキーで保存
  todoTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTextEdit();
    } else if (e.key === 'Escape') {
      todoTextInput.value = todo.text;
      todoTextInput.style.display = 'none';
      todoText.style.display = 'inline';
    }
  });

  // フォーカスが外れたら保存
  todoTextInput.addEventListener('blur', () => {
    saveTextEdit();
  });

  todoTextContainer.appendChild(todoText);
  todoTextContainer.appendChild(todoTextInput);

  // ステータスバッジ（視覚的な状態表示）
  const statusBadge = document.createElement('span');
  statusBadge.className = `status-badge status-${todo.status}`;
  statusBadge.textContent = STATUS_LABELS[todo.status];

  todoContent.appendChild(todoTextContainer);

  // 【追加機能4】期日表示と編集
  const dueDateContainer = document.createElement('div');
  dueDateContainer.className = 'due-date-container';

  if (todo.dueDate) {
    const dueDateBadge = document.createElement('span');
    const urgency = getDueDateUrgency(todo.dueDate);
    dueDateBadge.className = `due-date-badge ${urgency ? `urgency-${urgency}` : ''}`;
    dueDateBadge.textContent = `📅 ${formatDueDate(todo.dueDate)}`;
    dueDateBadge.style.cursor = 'pointer';
    dueDateBadge.title = '期日を編集';

    // 期日編集入力欄（初期状態は非表示）
    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    dueDateInput.className = 'due-date-edit-input';
    dueDateInput.value = todo.dueDate;
    dueDateInput.style.display = 'none';

    // バッジクリックで編集モードに切り替え
    dueDateBadge.addEventListener('click', () => {
      dueDateBadge.style.display = 'none';
      dueDateInput.style.display = 'inline-block';
      dueDateInput.focus();
    });

    // 日付変更時の処理
    dueDateInput.addEventListener('change', () => {
      const newDueDate = dueDateInput.value || null;
      updateTodoDueDate(todo.id, newDueDate);
      renderTodos();
      showNotification('期日を更新しました');
    });

    // フォーカス外れたら表示モードに戻る
    dueDateInput.addEventListener('blur', () => {
      dueDateInput.style.display = 'none';
      dueDateBadge.style.display = 'inline-block';
    });

    dueDateContainer.appendChild(dueDateBadge);
    dueDateContainer.appendChild(dueDateInput);
  } else {
    // 期日が設定されていない場合は「期日を設定」ボタン
    const addDueDateButton = document.createElement('button');
    addDueDateButton.className = 'add-due-date-button';
    addDueDateButton.textContent = '📅 期日を設定';
    addDueDateButton.type = 'button';

    // 期日設定用の入力欄（初期状態は非表示）
    const dueDateInput = document.createElement('input');
    dueDateInput.type = 'date';
    dueDateInput.className = 'due-date-edit-input';
    dueDateInput.style.display = 'none';

    // ボタンクリックで入力欄を表示
    addDueDateButton.addEventListener('click', () => {
      addDueDateButton.style.display = 'none';
      dueDateInput.style.display = 'inline-block';
      dueDateInput.focus();
    });

    // 日付選択時の処理
    dueDateInput.addEventListener('change', () => {
      const newDueDate = dueDateInput.value || null;
      if (newDueDate) {
        updateTodoDueDate(todo.id, newDueDate);
        renderTodos();
        showNotification('期日を設定しました');
      }
    });

    // フォーカス外れたら元に戻る
    dueDateInput.addEventListener('blur', () => {
      if (!dueDateInput.value) {
        dueDateInput.style.display = 'none';
        addDueDateButton.style.display = 'inline-block';
      }
    });

    dueDateContainer.appendChild(addDueDateButton);
    dueDateContainer.appendChild(dueDateInput);
  }

  todoContent.appendChild(dueDateContainer);
  todoContent.appendChild(statusBadge);

  // コントロールエリア
  const todoControls = document.createElement('div');
  todoControls.className = 'todo-controls';

  // ステータスセレクトボックス
  const statusSelect = document.createElement('select');
  statusSelect.className = 'status-select';
  statusSelect.innerHTML = `
    <option value="todo" ${todo.status === 'todo' ? 'selected' : ''}>未完了</option>
    <option value="doing" ${todo.status === 'doing' ? 'selected' : ''}>処理中</option>
    <option value="done" ${todo.status === 'done' ? 'selected' : ''}>完了</option>
  `;

  // 【追加機能3】ステータス変更イベント：変更直後にアニメーション付きでUIを更新
  statusSelect.addEventListener('change', (e) => {
    const newStatus = e.target.value;
    updateTodoStatus(todo.id, newStatus);

    // アニメーション：変更されたアイテムを一時的にハイライト
    todoItem.classList.add('status-changing');
    setTimeout(() => {
      renderTodos(); // 即座に再描画
      showNotification(`ステータスを「${STATUS_LABELS[newStatus]}」に変更しました`);
    }, 300);
  });

  // 【追加機能2】アーカイブボタン
  const archiveButton = document.createElement('button');
  archiveButton.className = 'archive-button';
  archiveButton.textContent = 'アーカイブ';
  archiveButton.addEventListener('click', () => {
    // アーカイブアニメーション
    todoItem.classList.add('archiving');
    setTimeout(() => {
      archiveTodo(todo.id);
      renderTodos();
      showNotification('Todoをアーカイブしました');
    }, 300);
  });

  // 削除ボタン
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '削除';

  // 【改善】削除前に確認ダイアログを表示
  deleteButton.addEventListener('click', () => {
    if (confirm(`「${todo.text}」を削除しますか？`)) {
      // 削除アニメーション
      todoItem.classList.add('deleting');
      setTimeout(() => {
        deleteTodo(todo.id);
        renderTodos(); // 即座に再描画
        showNotification('Todoを削除しました');
      }, 300);
    }
  });

  todoControls.appendChild(statusSelect);
  todoControls.appendChild(archiveButton);
  todoControls.appendChild(deleteButton);

  // 要素を組み立て
  todoItem.appendChild(todoContent);
  todoItem.appendChild(todoControls);

  return todoItem;
}

/**
 * 【追加機能2】アーカイブされたTodo要素を作成
 * @param {Object} todo - Todoオブジェクト
 * @returns {HTMLElement} Todo要素
 */
function createArchivedTodoElement(todo) {
  const todoItem = document.createElement('div');
  todoItem.className = `todo-item archived-item status-${todo.status}`;
  todoItem.dataset.id = todo.id;

  // Todoの内容エリア
  const todoContent = document.createElement('div');
  todoContent.className = 'todo-content';

  // Todoのテキスト
  const todoText = document.createElement('span');
  todoText.className = 'todo-text';
  todoText.textContent = todo.text;

  // ステータスバッジ
  const statusBadge = document.createElement('span');
  statusBadge.className = `status-badge status-${todo.status}`;
  statusBadge.textContent = STATUS_LABELS[todo.status];

  todoContent.appendChild(todoText);

  // 【追加機能4】期日表示（アーカイブでは読み取り専用）
  if (todo.dueDate) {
    const dueDateBadge = document.createElement('span');
    const urgency = getDueDateUrgency(todo.dueDate);
    dueDateBadge.className = `due-date-badge ${urgency ? `urgency-${urgency}` : ''}`;
    dueDateBadge.textContent = `📅 ${formatDueDate(todo.dueDate)}`;
    todoContent.appendChild(dueDateBadge);
  }

  todoContent.appendChild(statusBadge);

  // コントロールエリア
  const todoControls = document.createElement('div');
  todoControls.className = 'todo-controls';

  // 復元ボタン
  const restoreButton = document.createElement('button');
  restoreButton.className = 'restore-button';
  restoreButton.textContent = '復元';
  restoreButton.addEventListener('click', () => {
    unarchiveTodo(todo.id);
    renderTodos();
    showNotification('Todoを復元しました');
  });

  // 削除ボタン
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '削除';
  deleteButton.addEventListener('click', () => {
    if (confirm(`「${todo.text}」を完全に削除しますか？`)) {
      deleteTodo(todo.id);
      renderTodos();
      showNotification('Todoを削除しました');
    }
  });

  todoControls.appendChild(restoreButton);
  todoControls.appendChild(deleteButton);

  todoItem.appendChild(todoContent);
  todoItem.appendChild(todoControls);

  return todoItem;
}

/**
 * 操作完了の通知を表示
 * 【改善】視覚的なフィードバックでUXを向上
 * @param {string} message - 表示するメッセージ
 */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;

  document.body.appendChild(notification);

  // 2秒後に非表示アニメーション開始、その後DOM から削除
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

/**
 * Todo追加フォームの初期化
 * 【改善】Enterキー対応、バリデーション、自動フォーカス
 * 【追加機能2】アーカイブトグルの初期化
 * 【追加機能4】期日入力対応
 */
export function initAddTodoForm() {
  const form = document.getElementById('add-todo-form');
  const input = document.getElementById('todo-input');
  const statusSelect = document.getElementById('todo-status');
  const dueDateInput = document.getElementById('todo-duedate');

  // フォーム送信処理（EnterキーとSubmitボタンで共通化）
  const handleSubmit = (e) => {
    e.preventDefault();

    const text = input.value.trim();
    const status = statusSelect.value;
    const dueDate = dueDateInput.value || null;

    // 入力値のバリデーション
    if (!text) {
      showNotification('Todoの内容を入力してください');
      input.focus();
      return;
    }

    // Todoを追加し、即座にlocalStorageへ保存
    addTodo(text, status, dueDate);

    // 成功通知
    showNotification(`「${text}」を追加しました`);

    // フォームをリセット
    input.value = '';
    statusSelect.value = 'todo';
    dueDateInput.value = '';

    // 一覧を即座に再描画
    renderTodos();

    // 【改善】入力欄に自動でフォーカスが戻る
    input.focus();
  };

  // フォーム送信イベント
  form.addEventListener('submit', handleSubmit);

  // 【改善】Enterキー単独で追加可能にする
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  });

  // 【追加機能2】アーカイブトグルの初期化
  const toggleArchiveButton = document.getElementById('toggle-archive');
  const archiveList = document.getElementById('archive-list');

  toggleArchiveButton.addEventListener('click', () => {
    if (archiveList.style.display === 'none') {
      archiveList.style.display = 'block';
      toggleArchiveButton.textContent = '非表示';
    } else {
      archiveList.style.display = 'none';
      toggleArchiveButton.textContent = '表示/非表示';
    }
  });
}
