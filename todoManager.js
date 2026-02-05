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
 * @param {string|null} dueDate - 期日（YYYY-MM-DD形式、任意）
 * @returns {Object} 追加されたTodo
 */
export function addTodo(text, status = 'todo', dueDate = null) {
  const todos = getTodos();

  // 新しいIDを生成（既存の最大ID + 1）
  const newId = todos.length > 0
    ? Math.max(...todos.map(todo => todo.id)) + 1
    : 1;

  const newTodo = {
    id: newId,
    text: text.trim(),
    status: status,
    createdAt: new Date().toISOString(), // 作成日時を記録（ソート用）
    archived: false, // 【追加機能2】アーカイブフラグを追加
    dueDate: dueDate // 【追加機能4】期日を追加
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
 * 【追加機能2】アーカイブされたTodoを除外
 * @returns {Array} ソート済みのTodo配列
 */
export function getSortedTodos() {
  const todos = getTodos();

  // アーカイブされていないTodoのみをフィルタ
  const activeTodos = todos.filter(todo => !todo.archived);

  // ステータスの優先順位（未完了→処理中→完了の順）
  const statusPriority = {
    'todo': 0,
    'doing': 1,
    'done': 2
  };

  return activeTodos.sort((a, b) => {
    // まずステータスで並び替え
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    // 同じステータス内では作成日時順（古い順）
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });
}

/**
 * 【追加機能2】アーカイブされたTodoを取得
 * @returns {Array} アーカイブ済みTodoの配列
 */
export function getArchivedTodos() {
  const todos = getTodos();
  return todos.filter(todo => todo.archived);
}

/**
 * 【追加機能2】Todoをアーカイブ（一時非表示）する
 * @param {number} id - アーカイブするTodoのID
 * @returns {Object|null} アーカイブされたTodo、見つからない場合はnull
 */
export function archiveTodo(id) {
  const todos = getTodos();
  const todo = todos.find(todo => todo.id === id);

  if (!todo) {
    return null;
  }

  todo.archived = true;
  saveTodos(todos);

  return todo;
}

/**
 * 【追加機能2】Todoをアーカイブから復元する
 * @param {number} id - 復元するTodoのID
 * @returns {Object|null} 復元されたTodo、見つからない場合はnull
 */
export function unarchiveTodo(id) {
  const todos = getTodos();
  const todo = todos.find(todo => todo.id === id);

  if (!todo) {
    return null;
  }

  todo.archived = false;
  saveTodos(todos);

  return todo;
}

/**
 * 【追加機能1】ステータス別のTodo件数を取得
 * @returns {Object} ステータス別の件数オブジェクト
 */
export function getStatusSummary() {
  const todos = getSortedTodos(); // アーカイブされていないTodoのみ

  return {
    todo: todos.filter(t => t.status === 'todo').length,
    doing: todos.filter(t => t.status === 'doing').length,
    done: todos.filter(t => t.status === 'done').length,
    total: todos.length
  };
}

/**
 * 【追加機能4】Todoの期日を更新
 * @param {number} id - 更新するTodoのID
 * @param {string|null} dueDate - 新しい期日（YYYY-MM-DD形式、nullで削除）
 * @returns {Object|null} 更新されたTodo、見つからない場合はnull
 */
export function updateTodoDueDate(id, dueDate) {
  const todos = getTodos();
  const todo = todos.find(todo => todo.id === id);

  if (!todo) {
    return null;
  }

  todo.dueDate = dueDate;
  saveTodos(todos);

  return todo;
}

/**
 * Todoのテキストを更新
 * @param {number} id - 更新するTodoのID
 * @param {string} newText - 新しいテキスト
 * @returns {Object|null} 更新されたTodo、見つからない場合はnull
 */
export function updateTodoText(id, newText) {
  const todos = getTodos();
  const todo = todos.find(todo => todo.id === id);

  if (!todo) {
    return null;
  }

  const trimmedText = newText.trim();
  if (!trimmedText) {
    return null;
  }

  todo.text = trimmedText;
  saveTodos(todos);

  return todo;
}
