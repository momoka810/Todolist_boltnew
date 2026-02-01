import './style.css'
import { renderTodos, initAddTodoForm } from './todoUI.js'

document.addEventListener('DOMContentLoaded', () => {
  initAddTodoForm();
  renderTodos();
});
