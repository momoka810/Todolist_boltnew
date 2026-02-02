/**
 * TodoManager
 * localStorageを使用してTodoデータを管理するモジュール
 *
 * 【JavaScriptの強み】
 * ・即座の状態更新：データ変更後すぐにlocalStorageへ保存
 * ・保存処理の一元化：全ての変更がsaveTodos()を経由
 * ・クライアント完結：サーバー通信不要で高速レスポンス
 */

const STORAGE_KEY = 'todos';

/**
 * localStorageから全てのTodoを取得
 * @returns {Array} Todoの配列
 */
export function getTodos() {
  try {
    const todos = localStorage.getItem(STORAGE_KEY);
    return todos ? JSON.parse(todos) : [];
  } catch (error) {
    console.error('Todoの取得に失敗しました:', error);
    return [];
  }
}

/**
 * localStorageにTodoを保存
 * @param {Array} todos - 保存するTodoの配列
 */
function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Todoの保存に失敗しました:', error);
  }
}

/**
 * 新しいTodoを追加
 * @param {string} text - Todoの内容
 * @param {string} status - Todoのステータス（"todo" | "doing" | "done"）
 * @returns {Object} 追加されたTodo
 */
export function addTodo(text, status = 'todo') {
  const todos = getTodos();

  // 新しいIDを生成（既存の最大ID + 1）
  const newId = todos.length > 0
    ? Math.max(...todos.map(todo => todo.id)) + 1
    : 1;

  const newTodo = {
    id: newId,
    text: text.trim(),
    status: status,
    createdAt: new Date().toISOString() // 作成日時を記録（ソート用）
  };

  todos.push(newTodo);
  // 【重要】saveTodos()を通すことで保存処理が一元化されている
  saveTodos(todos);

  return newTodo;
}

/**
 * Todoを削除
 * @param {number} id - 削除するTodoのID
 * @returns {boolean} 削除が成功したかどうか
 */
export function deleteTodo(id) {
  const todos = getTodos();
  const filteredTodos = todos.filter(todo => todo.id !== id);

  if (filteredTodos.length === todos.length) {
    return false; // 削除対象が見つからなかった
  }

  saveTodos(filteredTodos);
  return true;
}

/**
 * Todoのステータスを更新
 * @param {number} id - 更新するTodoのID
 * @param {string} newStatus - 新しいステータス
 * @returns {Object|null} 更新されたTodo、見つからない場合はnull
 */
export function updateTodoStatus(id, newStatus) {
  const todos = getTodos();
  const todo = todos.find(todo => todo.id === id);

  if (!todo) {
    return null;
  }

  todo.status = newStatus;
  saveTodos(todos);

  return todo;
}

/**
 * 完了Todoを下に表示するようソートして取得
 * 【改善】完了したTodoが自動的に一覧の下に移動
 * @returns {Array} ソート済みのTodo配列
 */
export function getSortedTodos() {
  const todos = getTodos();

  // ステータスの優先順位（未完了→処理中→完了の順）
  const statusPriority = {
    'todo': 0,
    'doing': 1,
    'done': 2
  };

  return todos.sort((a, b) => {
    // まずステータスで並び替え
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    // 同じステータス内では作成日時順（古い順）
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });
}
