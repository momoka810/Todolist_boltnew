/**
 * TodoUI
 * Todoリストの表示とユーザーインタラクションを管理するモジュール
 *
 * 【JavaScriptの強み】
 * ・DOM操作による即時反映：操作直後に画面が更新される
 * ・イベントリスナーの活用：Enterキー、確認ダイアログなど
 * ・リアルタイムなUXの実現：通知、アニメーションなど
 */

import { getSortedTodos, addTodo, deleteTodo, updateTodoStatus } from './todoManager.js';

// ステータスの日本語表示名
const STATUS_LABELS = {
  todo: '未完了',
  doing: '処理中',
  done: '完了'
};

/**
 * Todo一覧を描画
 * 【改善】完了Todoを自動的に下に表示
 */
export function renderTodos() {
  const todos = getSortedTodos(); // ソート済みのTodoを取得
  const todoList = document.getElementById('todo-list');

  // リストをクリア
  todoList.innerHTML = '';

  // Todoが存在しない場合の空状態UI
  if (todos.length === 0) {
    renderEmptyState(todoList);
    return;
  }

  // 各Todoを描画
  todos.forEach(todo => {
    const todoItem = createTodoElement(todo);
    todoList.appendChild(todoItem);
  });
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

  // Todoのテキスト
  const todoText = document.createElement('span');
  todoText.className = 'todo-text';
  todoText.textContent = todo.text;

  // ステータスバッジ（視覚的な状態表示）
  const statusBadge = document.createElement('span');
  statusBadge.className = `status-badge status-${todo.status}`;
  statusBadge.textContent = STATUS_LABELS[todo.status];

  todoContent.appendChild(todoText);
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

  // ステータス変更イベント：変更直後にUIを更新
  statusSelect.addEventListener('change', (e) => {
    const newStatus = e.target.value;
    updateTodoStatus(todo.id, newStatus);
    renderTodos(); // 即座に再描画
    showNotification(`ステータスを「${STATUS_LABELS[newStatus]}」に変更しました`);
  });

  // 削除ボタン
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '削除';

  // 【改善】削除前に確認ダイアログを表示
  deleteButton.addEventListener('click', () => {
    if (confirm(`「${todo.text}」を削除しますか？`)) {
      deleteTodo(todo.id);
      renderTodos(); // 即座に再描画
      showNotification('Todoを削除しました');
    }
  });

  todoControls.appendChild(statusSelect);
  todoControls.appendChild(deleteButton);

  // 要素を組み立て
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
 */
export function initAddTodoForm() {
  const form = document.getElementById('add-todo-form');
  const input = document.getElementById('todo-input');
  const statusSelect = document.getElementById('todo-status');

  // フォーム送信処理（EnterキーとSubmitボタンで共通化）
  const handleSubmit = (e) => {
    e.preventDefault();

    const text = input.value.trim();
    const status = statusSelect.value;

    // 入力値のバリデーション
    if (!text) {
      showNotification('Todoの内容を入力してください');
      input.focus();
      return;
    }

    // Todoを追加し、即座にlocalStorageへ保存
    addTodo(text, status);

    // 成功通知
    showNotification(`「${text}」を追加しました`);

    // フォームをリセット
    input.value = '';
    statusSelect.value = 'todo';

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
}
