/**
 * TodoUI
 * Todoリストの表示とユーザーインタラクションを管理するモジュール
 */

import { getTodos, addTodo, deleteTodo, updateTodoStatus } from './todoManager.js';

// ステータスの日本語表示名
const STATUS_LABELS = {
  todo: '未完了',
  doing: '処理中',
  done: '完了'
};

/**
 * Todo一覧を描画
 */
export function renderTodos() {
  const todos = getTodos();
  const todoList = document.getElementById('todo-list');

  // リストをクリア
  todoList.innerHTML = '';

  // Todoが存在しない場合
  if (todos.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'Todoはまだありません';
    todoList.appendChild(emptyMessage);
    return;
  }

  // 各Todoを描画
  todos.forEach(todo => {
    const todoItem = createTodoElement(todo);
    todoList.appendChild(todoItem);
  });
}

/**
 * Todo要素を作成
 * @param {Object} todo - Todoオブジェクト
 * @returns {HTMLElement} Todo要素
 */
function createTodoElement(todo) {
  const todoItem = document.createElement('div');
  todoItem.className = `todo-item status-${todo.status}`;
  todoItem.dataset.id = todo.id;

  // Todoの内容
  const todoText = document.createElement('span');
  todoText.className = 'todo-text';
  todoText.textContent = todo.text;

  // ステータスセレクトボックス
  const statusSelect = document.createElement('select');
  statusSelect.className = 'status-select';
  statusSelect.innerHTML = `
    <option value="todo" ${todo.status === 'todo' ? 'selected' : ''}>未完了</option>
    <option value="doing" ${todo.status === 'doing' ? 'selected' : ''}>処理中</option>
    <option value="done" ${todo.status === 'done' ? 'selected' : ''}>完了</option>
  `;

  // ステータス変更イベント
  statusSelect.addEventListener('change', (e) => {
    const newStatus = e.target.value;
    updateTodoStatus(todo.id, newStatus);
    renderTodos(); // 再描画
  });

  // 削除ボタン
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '削除';
  deleteButton.addEventListener('click', () => {
    deleteTodo(todo.id);
    renderTodos(); // 再描画
  });

  // 要素を組み立て
  todoItem.appendChild(todoText);
  todoItem.appendChild(statusSelect);
  todoItem.appendChild(deleteButton);

  return todoItem;
}

/**
 * Todo追加フォームの初期化
 */
export function initAddTodoForm() {
  const form = document.getElementById('add-todo-form');
  const input = document.getElementById('todo-input');
  const statusSelect = document.getElementById('todo-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = input.value.trim();
    const status = statusSelect.value;

    // 入力値のバリデーション
    if (!text) {
      alert('Todoの内容を入力してください');
      return;
    }

    // Todoを追加
    addTodo(text, status);

    // フォームをリセット
    input.value = '';
    statusSelect.value = 'todo';

    // 一覧を再描画
    renderTodos();

    // 入力フォームにフォーカス
    input.focus();
  });
}
